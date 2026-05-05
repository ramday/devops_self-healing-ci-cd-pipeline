# Self-Healing CI/CD - Phase 1

Automated issue detection and remediation for GitHub workflows. This is **Phase 1: Foundation & Webhook Integration**.

## 🎯 Phase 1 Objectives

✅ Secure session management without a database  
✅ GitHub webhook listener with signature verification  
✅ Failure detection and logging  
✅ Foundation for Phase 2 (AI-powered remediation)

## 📋 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Sessions:** iron-session (encrypted HttpOnly cookies)
- **GitHub:** Octokit API
- **Security:** HMAC-SHA256 webhook verification

## 🏗️ Project Structure

```
self-healing-cicd/
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts          # GitHub webhook POST handler
│   ├── connection/
│   │   ├── page.tsx              # Connection UI page
│   │   └── actions.ts            # Server actions
│   ├── components/               # Reusable components (future)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── lib/
│   ├── session.ts                # iron-session configuration
│   ├── github.ts                 # GitHub utilities & types
├── public/                       # Static assets
├── .env.local.example            # Environment template
├── .gitignore
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── next.config.js
├── package.json
└── README.md
```

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
cd self-healing-cicd
npm install
```

### 2. Configure Environment

```bash
# Copy the example and fill in your values
cp .env.local.example .env.local
```

Create a strong SESSION_PASSWORD:

```bash
# macOS/Linux
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate new token with scopes: `repo`, `workflow`
3. Copy the token to `.env.local` (you won't be able to see it again)

### 4. GitHub Webhook Secret

1. Generate: `openssl rand -hex 32`
2. Store in `.env.local` as `GITHUB_WEBHOOK_SECRET`

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📖 Core Components

### `/lib/session.ts`

Manages iron-session configuration for encrypted session cookies.

**Key Functions:**
- `getSession()` - Retrieve current session
- `updateSession(data)` - Update session data (PAT, repo URL)
- `clearSession()` - Destroy session

**Stored Data:**
- `github_pat` - GitHub Personal Access Token
- `target_repo_url` - Repository URL
- `isLoggedIn` - Connection status

### `/lib/github.ts`

GitHub API utilities and webhook verification.

**Key Functions:**
- `verifyWebhookSignature()` - Validate GitHub webhook requests
- `isFailedWorkflowRun()` - Check if workflow failed
- `extractRepoInfo()` - Parse repo details from payload
- `getRepositoryInfo()` - Fetch repo metadata from GitHub API
- `initializeOctokit()` - Create GitHub API client

**Types:**
- `GitHubWebhookPayload` - Complete workflow_run event type

### `/app/api/webhook/route.ts`

POST endpoint that handles incoming GitHub webhook events.

**Security:**
- ✅ HMAC-SHA256 signature verification
- ✅ Timing-safe comparison to prevent timing attacks
- ✅ Rejects requests without valid signature (401)

**Behavior:**
- Filters for `workflow_run` events only
- Detects `action === "completed" && conclusion === "failure"`
- Logs owner, repo, run_id, and other metadata
- Returns 200 OK for all valid webhook requests
- Logs debugging info for non-failure events

**Phase 2 Placeholder:**
```typescript
// TODO: Phase 2 - Trigger self-healing logic here
// - Analyze logs
// - Determine root cause
// - Execute remediation
```

### `/app/connection/page.tsx`

Frontend UI for connecting a GitHub repository.

**Features:**
- 🔐 Secure input fields for PAT and repo URL
- ✅ Repository validation via GitHub API
- 📝 Session-based storage (no database)
- 🔗 Webhook URL display
- 📊 Connection status badge
- 🔄 Connect/Disconnect functionality

**Error Handling:**
- Invalid PAT validation
- Invalid repo URL format
- GitHub API errors with user-friendly messages

## 🔌 GitHub Webhook Setup

Once connected through the UI:

1. Go to your GitHub repository
2. **Settings > Webhooks > Add webhook**
3. **Payload URL:** `https://your-domain.com/api/webhook`
4. **Content type:** `application/json`
5. **Secret:** Use your `GITHUB_WEBHOOK_SECRET` value
6. **Events:** Select `Workflow runs`
7. **Active:** ✅ Checked

## 📊 Webhook Payload Example

When a workflow fails, the webhook receives:

```json
{
  "action": "completed",
  "workflow_run": {
    "id": 123456789,
    "name": "CI",
    "status": "completed",
    "conclusion": "failure",
    "head_branch": "main",
    "head_sha": "abc123def456",
    "html_url": "https://github.com/owner/repo/actions/runs/123456789"
  },
  "repository": {
    "name": "repo",
    "full_name": "owner/repo"
  }
}
```

## 📝 Console Logging

When a failed workflow is detected, you'll see:

```
[Webhook] ✗ FAILED WORKFLOW RUN DETECTED
  Owner: owner
  Repository: repo
  Run ID: 123456789
  Run Number: 42
  Workflow: CI
  Branch: main
  Commit: abc123d
  URL: https://github.com/owner/repo/actions/runs/123456789
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

Ensure environment variables are set in Vercel dashboard.

### Manual Deployment

1. Build: `npm run build`
2. Start: `npm start`
3. Proxy `/api/webhook` if behind a load balancer
4. Ensure `SESSION_PASSWORD` is at least 32 characters

## 🔐 Security Checklist

- ✅ `SESSION_PASSWORD` is 32+ characters
- ✅ `GITHUB_WEBHOOK_SECRET` is strong and unique
- ✅ Session cookies are HttpOnly and Secure
- ✅ Webhook signatures are HMAC-SHA256 verified
- ✅ Timing-safe comparison prevents timing attacks
- ✅ PAT is never logged or exposed
- ✅ `.env.local` is in `.gitignore`

## 🧪 Testing

### Test Webhook Signature Verification

```bash
# Generate test payload
PAYLOAD='{"action":"completed","workflow_run":{"conclusion":"failure"}}'
SECRET="your_webhook_secret_here"

# Create signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Test request
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$SIGNATURE" \
  -H "x-github-event: workflow_run" \
  -d "$PAYLOAD"
```

### Test Connection Page

1. Navigate to http://localhost:3000/connection
2. Enter a valid GitHub PAT and repo URL
3. Click "Connect Repository"
4. Verify session is created (check browser cookies)
5. View webhook URL configuration instructions

## 📚 Next Steps (Phase 2)

- Integrate Gemini API for log analysis
- Implement automatic remediation
- Add email/Slack notifications
- Build admin dashboard
- Add deployment history

## 🤝 Contributing

Feedback and contributions welcome! This is an active development project.

## 📄 License

MIT
