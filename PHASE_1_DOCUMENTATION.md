# Self-Healing CI/CD - Phase 1 Complete Documentation

**Created:** Phase 1: Foundation & Webhook Integration  
**Framework:** Next.js 14+ (App Router) with TypeScript  
**Styling:** Tailwind CSS  
**Sessions:** iron-session (Encrypted HttpOnly Cookies)  

---

## 📂 Complete Directory Structure

```
self-healing-cicd/
│
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts                  # POST handler for GitHub webhooks
│   │
│   ├── connection/
│   │   ├── page.tsx                      # Connection UI (Client Component)
│   │   └── actions.ts                    # Server Actions
│   │
│   ├── components/                       # Reserved for future components
│   │
│   ├── layout.tsx                        # Root layout with metadata
│   ├── page.tsx                          # Home/landing page
│   └── globals.css                       # Global Tailwind styles
│
├── lib/
│   ├── session.ts                        # iron-session configuration
│   └── github.ts                         # GitHub utilities & types
│
├── public/                               # Static assets
│
├── .eslintrc.json                        # ESLint config
├── .env.local.example                    # Environment template
├── .gitignore
├── next.config.js                        # Next.js config
├── postcss.config.js                     # Tailwind processor
├── tailwind.config.ts                    # Tailwind configuration
├── tsconfig.json                         # TypeScript config
├── package.json                          # Dependencies
└── README.md                             # Setup guide
```

---

## 📦 Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.1.0",
    "iron-session": "^8.1.5",
    "octokit": "^3.1.0",
    "@octokit/webhooks": "^12.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.1",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0"
  }
}
```

---

## 🔑 Key Files Code

### 1. `lib/session.ts` - Session Management

Implements iron-session for encrypted, HttpOnly session cookies.

**Features:**
- Encrypted cookie storage
- 24-hour session timeout
- TypeScript-typed session data
- SameSite=Lax for CSRF protection

**Usage:**
```typescript
// Get current session
const session = await getSession();
console.log(session.github_pat);

// Update session
await updateSession({
  github_pat: 'ghp_...',
  target_repo_url: 'https://github.com/owner/repo'
});

// Clear session
await clearSession();
```

### 2. `lib/github.ts` - GitHub Integration

Complete GitHub integration utilities with TypeScript types.

**Key Functions:**

```typescript
// Verify webhook signature (security)
verifyWebhookSignature(payload: string, signature: string, secret: string): boolean

// Check for failed workflow
isFailedWorkflowRun(payload: GitHubWebhookPayload): boolean

// Extract repo info from payload
extractRepoInfo(payload: GitHubWebhookPayload): { owner, repo, fullName }

// Initialize GitHub API client
initializeOctokit(pat: string): Octokit

// Fetch repo metadata
getRepositoryInfo(pat: string, owner: string, repo: string): Promise<{...}>
```

**TypeScript Types:**
- `GitHubWebhookPayload` - Complete workflow_run event structure
- All nested objects fully typed

### 3. `app/api/webhook/route.ts` - Webhook Handler

POST endpoint with security and event filtering.

**Security:**
✅ HMAC-SHA256 signature verification  
✅ Timing-safe comparison (prevents timing attacks)  
✅ Rejects unsigned requests (401)  

**Event Filtering:**
- Only processes `workflow_run` events
- Detects `action === "completed" && conclusion === "failure"`
- Logs run metadata (owner, repo, run_id, etc.)

**Response Codes:**
- `200`: Successfully processed
- `401`: Invalid or missing signature
- `400`: Invalid JSON
- `500`: Server error

**Logging Output:**
```
[Webhook] ✓ Received event: workflow_run
[Webhook] ✗ FAILED WORKFLOW RUN DETECTED
  Owner: username
  Repository: repo-name
  Run ID: 123456789
  Run Number: 42
  Workflow: CI
  Branch: main
  Commit: abc123d
  URL: https://github.com/...
```

### 4. `app/connection/page.tsx` - Connection UI

React Client Component with Tailwind styling.

**Features:**
- Dark theme with gradient background
- PAT and repo URL inputs
- Real-time validation
- Visual connection status
- Webhook URL display
- Disconnect functionality

**States:**
- **Disconnected:** Form for connecting
- **Connected:** Status display + disconnect button
- **Error/Success:** User feedback messages

**Styling:**
- Responsive design (mobile-first)
- Slate color palette
- Blue accent for actions
- Red accent for destructive actions
- Smooth transitions

### 5. `app/connection/actions.ts` - Server Actions

Secure backend logic for session management.

**Functions:**

```typescript
// Connect repository (validates PAT and repo)
connectRepository(pat: string, repoUrl: string): Promise<{
  success: boolean;
  error?: string;
  repoName?: string;
}>

// Get connection status
getConnectionStatus(): Promise<{
  isConnected: boolean;
  repoUrl: string | null;
  pat: '***' | null;
}>

// Disconnect (clear session)
disconnectRepository(): Promise<{
  success: boolean;
  error?: string;
}>
```

**Validation:**
- Checks for empty inputs
- Validates URL format with regex
- Verifies PAT works with GitHub API
- Returns user-friendly error messages

---

## 🔐 Environment Configuration

Create `.env.local` from `.env.local.example`:

```env
# SESSION_PASSWORD - Used to encrypt session cookies
# Minimum 32 characters, generate with:
#   openssl rand -hex 32 (macOS/Linux)
#   or [Convert]::ToHexString(...) (PowerShell)
SESSION_PASSWORD=your_32_char_minimum_password_here

# GITHUB_WEBHOOK_SECRET - Secret for webhook signature verification
# Generate new in GitHub repo settings > Webhooks
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# GEMINI_API_KEY - For Phase 2 (AI-powered remediation)
# Leave empty for now
GEMINI_API_KEY=

# Environment
NODE_ENV=development
```

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies
```bash
cd self-healing-cicd
npm install
```

### Step 2: Generate SESSION_PASSWORD
```bash
# macOS/Linux
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 3: Create GitHub PAT
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy token (you won't see it again)

### Step 4: Generate WEBHOOK_SECRET
```bash
openssl rand -hex 32
```

### Step 5: Configure .env.local
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

### Step 6: Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## 📊 User Flow

```
User navigates to /connection
        ↓
Sees "Connect Repository" form
        ↓
Enters GitHub PAT & Repository URL
        ↓
Clicks "Connect Repository"
        ↓
Server validates (connectRepository action)
  - Checks PAT validity
  - Verifies repo exists
  - Validates URL format
        ↓
Session updated with credentials
        ↓
UI shows "Ready for Webhooks"
        ↓
User configures GitHub webhook:
  - Settings > Webhooks > Add webhook
  - URL: https://your-domain.com/api/webhook
  - Secret: GITHUB_WEBHOOK_SECRET value
  - Events: Workflow runs
        ↓
GitHub sends events to /api/webhook
        ↓
Signature verified (HMAC-SHA256)
        ↓
Failure detected:
  - Console logs metadata
  - Phase 2: Trigger remediation
```

---

## 🔌 Webhook Integration Steps

### 1. Connect Repository (UI)
- Navigate to Connection page
- Enter your GitHub PAT and repository URL
- Click "Connect"

### 2. Configure GitHub Webhook
- Go to your GitHub repository
- **Settings → Webhooks → Add webhook**
- Set these values:
  - **Payload URL:** `https://your-domain.com/api/webhook`
  - **Content type:** `application/json`
  - **Secret:** Your `GITHUB_WEBHOOK_SECRET` value
  - **Which events?** Select "Workflow runs"
  - **Active:** ✅ Check this

### 3. Test Webhook (Linux/macOS)
```bash
# 1. Generate test signature
PAYLOAD='{"action":"completed","workflow_run":{"conclusion":"failure","id":123,"run_number":1}}'
SECRET="your_webhook_secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# 2. Send test request
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$SIGNATURE" \
  -H "x-github-event: workflow_run" \
  -d "$PAYLOAD"

# 3. Check logs for "FAILED WORKFLOW RUN DETECTED"
```

---

## 🧪 Testing Checklist

- [ ] Install dependencies without errors
- [ ] Development server starts: `npm run dev`
- [ ] Home page loads at http://localhost:3000
- [ ] Connection page loads at http://localhost:3000/connection
- [ ] Can enter PAT and repo URL
- [ ] Form validates empty inputs
- [ ] Session is created after successful connection
- [ ] Browser shows connected status
- [ ] Disconnect button clears session
- [ ] Webhook signature verification works
- [ ] Failed workflow events are logged
- [ ] Non-failure events are ignored

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| Session Encryption | iron-session with `SESSION_PASSWORD` |
| Cookie Security | HttpOnly, Secure (prod), SameSite=Lax |
| Webhook Verification | HMAC-SHA256 with `GITHUB_WEBHOOK_SECRET` |
| Timing Attack Prevention | crypto.timingSafeEqual() |
| PAT Protection | Never logged, stored in encrypted session |
| URL Validation | Regex pattern matching + GitHub API verification |
| TypeScript | Full type safety across codebase |

---

## 📋 Phase 1 Deliverables

✅ **Session Management**
- iron-session configuration
- Encrypted HttpOnly cookies
- 24-hour session timeout

✅ **GitHub Integration**
- Octokit API client initialization
- PAT + repo URL storage
- Repository validation

✅ **Webhook Listener**
- POST /api/webhook endpoint
- HMAC-SHA256 signature verification
- Failure detection and logging
- Event filtering

✅ **Frontend UI**
- Connection page with forms
- Session-based credential storage
- Visual status indicators
- Responsive design

✅ **Security**
- Signature verification with timing-safe comparison
- Session encryption
- Input validation
- Error handling

✅ **Code Organization**
- Modular lib/ structure
- TypeScript typing
- Server actions pattern
- Next.js 14 App Router

---

## 🔄 Phase 2 Preview

The webhook handler includes a TODO placeholder:

```typescript
// TODO: Phase 2 - Trigger self-healing logic here
// - Analyze logs
// - Determine root cause
// - Execute remediation
```

Phase 2 will:
1. Fetch workflow logs from GitHub API
2. Send logs to Gemini API for analysis
3. Generate fix recommendations
4. Create GitHub pull requests with fixes
5. Add notifications (email/Slack)

---

## 📞 Support Resources

- [Next.js Docs](https://nextjs.org/docs)
- [iron-session Docs](https://github.com/vitalets/iron-session)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Octokit.js](https://octokit.github.io/rest.js/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Created:** May 2026  
**Status:** Phase 1 Complete ✅  
**Next:** Phase 2 - AI Analysis & Remediation
