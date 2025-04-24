import { Octokit } from "@octokit/rest";
import { Webhooks } from "@octokit/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { analyzeDiffForReview, sliceFileByReviewChunks } from "@/lib/utils";

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  compatibility: "strict",
});

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN! });

export async function POST(request: NextRequest) {
  const payload = await request.text();

  const signature = request.headers.get("x-hub-signature-256") ?? "";

  const isValid = await webhooks.verify(payload, signature);

  if (!isValid) {
    return NextResponse.json({ isValid: false }, { status: 401 });
  }

  const { pull_request } = JSON.parse(payload);

  if (!pull_request) {
    return NextResponse.json(
      {
        error: "Missing required fields: pull_request",
      },
      { status: 400 }
    );
  }

  const { data: files } = await octokit.rest.pulls.listFiles({
    owner: pull_request.base.repo.owner.login,
    repo: pull_request.base.repo.name,
    pull_number: pull_request.number,
  });

  for await (const file of files) {
    if (
      (file.status !== "added" && file.status !== "modified") ||
      !file.patch
    ) {
      continue;
    }

    try {
      const { data: content } = await octokit.rest.repos.getContent({
        owner: pull_request.base.repo.owner.login,
        repo: pull_request.base.repo.name,
        path: file.filename,
        ref: pull_request.head.sha,
      });

      if (Array.isArray(content) || content.type !== "file") {
        continue;
      }

      const decodedContent = Buffer.from(content.content, "base64").toString(
        "utf-8"
      );

      const reviewChunks = analyzeDiffForReview(file.patch, file.filename);

      const slicedChunks = sliceFileByReviewChunks(
        decodedContent,
        reviewChunks
      );

      for (const chunk of slicedChunks) {
        const { object } = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: z.object({
            comment: z.string(),
            should_ignore: z.boolean(),
          }),
          system: `You are a helpful assistant that reviews code and provides feedback on the code. Keep the comments concise and to the point. If the code is not worth reviewing, set should_ignore to true.`,
          prompt: chunk.text,
        });

        if (!object.should_ignore) {
          const line = chunk.endLine;
          await octokit.rest.pulls.createReviewComment({
            owner: pull_request.base.repo.owner.login,
            repo: pull_request.base.repo.name,
            pull_number: pull_request.number,
            body: object.comment,
            path: file.filename,
            commit_id: pull_request.head.sha,
            side: "RIGHT",
            line: line,
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  return NextResponse.json({ success: true });
}
