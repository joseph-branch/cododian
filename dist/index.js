import { config } from "dotenv";
import { Octokit } from "@octokit/rest";
import { Webhooks } from "@octokit/webhooks";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { analyzeDiffForReview, sliceFileByReviewChunks } from "./lib/utils.js";
config();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const webhooks = new Webhooks({ secret: process.env.GITHUB_WEBHOOK_SECRET });
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: "strict",
});
export const handler = async (req, res) => {
    try {
        const payload = JSON.stringify(req.body);
        const eventType = req.headers["x-github-event"];
        const action = req.body?.action;
        const pull_request = req.body?.pull_request;
        const source = req.headers["user-agent"]?.includes("GitHub-Hookshot")
            ? "webhook"
            : "action";
        console.log("source", source);
        if (source === "webhook") {
            const signature = req.headers["x-hub-signature-256"] ?? "";
            const isValid = await webhooks.verify(payload, signature);
            if (!isValid) {
                return res.status(401).send("Unauthorized");
            }
        }
        if (!pull_request) {
            return res
                .status(400)
                .json({ error: "Missing required fields: pull_request" });
        }
        if ((eventType === "pull_request" && action === "opened") ||
            (eventType === "pull_request_review_thread" && action === "resolved")) {
            const { data: files } = await octokit.rest.pulls.listFiles({
                owner: pull_request.base.repo.owner.login,
                repo: pull_request.base.repo.name,
                pull_number: pull_request.number,
            });
            const LLMReviewComments = [];
            for (const file of files) {
                if ((file.status !== "added" && file.status !== "modified") ||
                    !file.patch)
                    continue;
                const { data: content } = await octokit.rest.repos.getContent({
                    owner: pull_request.base.repo.owner.login,
                    repo: pull_request.base.repo.name,
                    path: file.filename,
                    ref: pull_request.head.sha,
                });
                if (Array.isArray(content) || content.type !== "file")
                    continue;
                const decodedContent = Buffer.from(content.content, "base64").toString("utf-8");
                const reviewChunks = analyzeDiffForReview(file.patch, file.filename);
                const slicedChunks = sliceFileByReviewChunks(decodedContent, reviewChunks);
                for (const chunk of slicedChunks) {
                    const { object } = await generateObject({
                        model: openai("gpt-4.1-mini"),
                        schema: z.object({
                            comment: z.string(),
                            needsImprovement: z.boolean(),
                        }),
                        system: `You are a helpful assistant that reviews code and looks for code smells, bugs, and other issues. Keep the comments concise and to the point.`,
                        prompt: `File: ${file.filename}\n\n${chunk.text}`,
                    });
                    if (object.needsImprovement) {
                        const line = chunk.endLine;
                        const reviewComment = await octokit.rest.pulls.createReviewComment({
                            owner: pull_request.base.repo.owner.login,
                            repo: pull_request.base.repo.name,
                            pull_number: pull_request.number,
                            body: object.comment,
                            path: file.filename,
                            commit_id: pull_request.head.sha,
                            side: "RIGHT",
                            line: line,
                        });
                        LLMReviewComments.push(reviewComment);
                    }
                }
            }
            return res.status(200).json({ LLMReviewComments });
        }
        return res.status(202).json({
            status: "skipped",
            reason: "Pull request state is not 'open' or action is not 'resolved'.",
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
