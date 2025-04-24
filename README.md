# 🧠 Cododian — AI-Powered GitHub PR Reviewer

**Cododian** is a serverless function built with Next.js that automatically reviews pull requests using OpenAI models. It listens for GitHub webhook events, analyzes the diff and changed files, and posts intelligent review comments inline — only where GitHub allows.

---

## 🚀 Features

- 🧬 **OpenAI-powered LLM reviews** using `gpt-4o-mini`
- 🧾 **Diff-aware chunk slicing** to avoid invalid GitHub API calls
- 🗂 **Inline comments on changed lines** only (validated via `parse-diff`)
- 🧪 **Multi-chunk review** with fallback to PR-level comments if needed
- 🔐 **Webhook signature verification** using `X-Hub-Signature-256`
- ⚙️ Built on **Next.js App Router** (serverless-compatible on Vercel)

---

## 📦 Technologies Used

- [Next.js App Router](https://nextjs.org/docs/app)
- [OpenAI SDK](https://github.com/vercel/ai)
- [Octokit REST](https://github.com/octokit/rest.js)
- [GitHub Webhooks](https://github.com/octokit/webhooks.js)
- [parse-diff](https://github.com/eiriklv/parse-diff)
- [Zod](https://zod.dev/) for schema-safe AI output validation

---

## 📥 API Route

**Endpoint:**

- POST /api/review

**Triggered by:**

- `pull_request` events (opened, synchronize)
- `pull_request_review_comment` events (resolved)

---

## 🔐 Webhook Security

This function verifies GitHub webhooks using `x-hub-signature-256`.

Set your secret in `.env`:

```env
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_TOKEN=personal_access_token
OPENAI_API_KEY=OpenAI_api_key
```
