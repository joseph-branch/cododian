import { Octokit } from "@octokit/rest";
import { NextRequest } from "next/server";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function POST(request: NextRequest) {
  const { owner, repo, pr } = await request.json();

  const { data: reviews } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: parseInt(pr),
  });

  return new Response(JSON.stringify(reviews));
}
