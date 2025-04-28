# 🧠 Cododian — AI-Powered GitHub PR Reviewer

**Cododian** is a serverless function that automatically reviews pull requests using OpenAI models. It listens for GitHub webhook events, analyzes the diff and changed files, and posts intelligent review comments inline — only where GitHub allows.

---

## 🚀 Features

- 🧬 **OpenAI-powered LLM reviews** using `gpt-4.1-mini`
- 🧾 **Diff-aware chunk slicing** to avoid invalid GitHub API calls
- 🗂 **Inline comments on changed lines** only (validated via `parse-diff`)
- 🧪 **Multi-chunk review** with fallback to PR-level comments if needed
- 🔐 **Webhook signature verification** using `X-Hub-Signature-256`
- ⚙️ **Containerized deployment** with Docker support
- 🏃 **Express.js server** with health check endpoints
- 🔄 **GitHub Actions integration** for automated PR reviews

---

## 📦 Technologies Used

- [Express.js](https://expressjs.com/)
- [OpenAI SDK](https://github.com/vercel/ai)
- [Octokit REST](https://github.com/octokit/rest.js)
- [GitHub Webhooks](https://github.com/octokit/webhooks.js)
- [parse-diff](https://github.com/eiriklv/parse-diff)
- [Zod](https://zod.dev/) for schema-safe AI output validation
- [Docker](https://www.docker.com/) for containerization
- [TypeScript](https://www.typescriptlang.org/) for type safety

---

## 🛠 Setup & Deployment

### Environment Variables

```env
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_TOKEN=personal_access_token
OPENAI_API_KEY=OpenAI_api_key
PORT=8080  # Optional, defaults to 8080
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or manually with Docker
docker build -t cododian .
docker run -p 8080:8080 --env-file .env cododian
```

### Local Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build and run
pnpm build
pnpm start
```

---

## 📥 API Endpoints

- `GET /` - Health check endpoint
- `GET /healthz` - Kubernetes-style health check
- `POST /` - Main webhook handler for PR reviews

**Triggered by:**

- `pull_request` events (opened)
- `pull_request_review_thread` events (resolved)

---

## 🔐 Security

- Webhook signature verification using `X-Hub-Signature-256`
- Environment variable validation
- Source validation (webhook vs. action)
- Strict TypeScript configuration
