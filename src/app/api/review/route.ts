import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
/* eslint-disable @typescript-eslint/no-unused-vars */

export function GET(request: Request) {
  return new Response("Hello from Vercel!");
}
