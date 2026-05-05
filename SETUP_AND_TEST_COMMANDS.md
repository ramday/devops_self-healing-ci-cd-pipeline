# Phase 1 Setup & Test Guide - Complete Commands

## 📋 Step-by-Step Instructions with All Commands

### STEP 1: Install Dependencies
**Location:** PowerShell in `d:\DevOps_3\self-healing-cicd`

```powershell
# Navigate to project
cd d:\DevOps_3\self-healing-cicd

# Install all dependencies
npm install

# Verify installation (should show all packages listed)
npm list
```

**Expected Output:**
```
added XXX packages, and audited XXX packages in X.XXs
```

---

### STEP 2: Generate & Configure Environment Variables

#### Option A: PowerShell (Windows)

```powershell
# Generate SESSION_PASSWORD (32+ random hex characters)
$session_pwd = [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host "SESSION_PASSWORD=$session_pwd"

# Generate GITHUB_WEBHOOK_SECRET (32+ random hex characters)
$webhook_secret = [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host "GITHUB_WEBHOOK_SECRET=$webhook_secret"
```

#### Option B: Git Bash / WSL

```bash
# Generate SESSION_PASSWORD
openssl rand -hex 32

# Generate GITHUB_WEBHOOK_SECRET
openssl rand -hex 32
```

#### Create .env.local file

```powershell
# Copy the example
Copy-Item .env.local.example -Destination .env.local

# Open in VS Code or your editor
code .env.local
```

**Edit `.env.local` and fill in your values:**

```env
SESSION_PASSWORD=<paste_your_32_char_hex_here>
GITHUB_WEBHOOK_SECRET=<paste_your_32_char_hex_here>
GEMINI_API_KEY=
NODE_ENV=development
```

**To get GitHub PAT:**
1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: ✅ `repo` and ✅ `workflow`
4. Click "Generate token"
5. Copy immediately (you won't see it again)

**Note:** Don't add PAT to .env.local - you'll connect via the UI instead!

#### Deploy note (Vercel)

If you're deploying to Vercel, you must also add `SESSION_PASSWORD` and `GITHUB_WEBHOOK_SECRET` in:

Vercel Project → **Settings → Environment Variables** (at least for **Production**), then redeploy.

---

### STEP 3: Start Development Server

```powershell
# In PowerShell at d:\DevOps_3\self-healing-cicd

npm run dev
```

**Expected Output:**
```
> self-healing-cicd@0.1.0 dev
> next dev

  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000

 ✓ Ready in 2.5s
```

**⚠️ Keep this running in the terminal - do NOT close it**

---

### STEP 4: Connect Repository (Via UI)

**In your browser:**

1. **Open:** `http://localhost:3000`
   - You should see the home page with Phase 1 & Phase 2 cards

2. **Click:** "Get Started" button (or navigate to `http://localhost:3000/connection`)
   - You should see the connection form

3. **Fill in the form:**
   - **GitHub Personal Access Token:** Paste your PAT (from step 2)
   - **Repository URL:** `https://github.com/YOUR_USERNAME/YOUR_REPO`
     - Example: `https://github.com/octocat/Hello-World`

4. **Click:** "Connect Repository" button

5. **Expected Result:**
   - ✅ Success message: "Connected to owner/repo"
   - 🟢 Status badge shows: "Ready for Webhooks"
   - Display shows your webhook URL: `http://localhost:3000/api/webhook` (or your domain)

**Verify Session Created:**
- Open DevTools (F12)
- Go to **Application → Cookies → http://localhost:3000**
- You should see: `self-healing-cicd-session` cookie (encrypted)

---

### STEP 5: Configure GitHub Webhook

**In your GitHub repository:**

1. **Go to:** Settings → Webhooks → Add webhook

2. **Fill in the form:**
   - **Payload URL:** `http://localhost:3000/api/webhook` (or your deployed URL)
   - **Content type:** `application/json`
   - **Secret:** Paste your `GITHUB_WEBHOOK_SECRET` (from step 2)
   - **Events:** Select "Workflow runs" (uncheck "Push", "Pull requests", etc.)
   - **Active:** ✅ Check the box

3. **Click:** "Add webhook"

**Verify Webhook Created:**
- Should see green checkmark next to the webhook
- Click on webhook row to see delivery history

---

## 🧪 TESTING Phase 1

### Test 1: Webhook Signature Verification

**In PowerShell:**

```powershell
# Set your webhook secret (copy from .env.local)
$SECRET = "your_webhook_secret_here"

# Create test payload
$PAYLOAD = @{
    action = "completed"
    workflow_run = @{
        id = 123456789
        name = "CI"
        run_number = 42
        head_branch = "main"
        head_sha = "abc123def456"
        conclusion = "failure"
        html_url = "https://github.com/octocat/Hello-World/actions/runs/123456789"
    }
    repository = @{
        name = "Hello-World"
        full_name = "octocat/Hello-World"
        owner = @{
            login = "octocat"
        }
    }
} | ConvertTo-Json -Depth 10

# Create HMAC signature
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($SECRET))
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($PAYLOAD))
$SIGNATURE = "sha256=" + ($hash | ForEach-Object { "{0:x2}" -f $_ }) -join ""

# Send test request
$headers = @{
    "x-hub-signature-256" = $SIGNATURE
    "x-github-event" = "workflow_run"
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/webhook" `
    -Method POST `
    -Headers $headers `
    -Body $PAYLOAD `
    -UseBasicParsing

Write-Host "Response Status: $($response.StatusCode)"
Write-Host "Response Body:" $response.Content
```

**Expected Output:**
```
Response Status: 200
Response Body: {"message":"Failed workflow run logged for remediation",...}
```

**Check Server Console:** Look for:
```
[Webhook] ✗ FAILED WORKFLOW RUN DETECTED
  Owner: octocat
  Repository: Hello-World
  Run ID: 123456789
  ...
```

---

### Test 2: Invalid Signature (Should Fail)

```powershell
# Use WRONG secret
$WRONG_SECRET = "wrong_secret_here"

# Create signature with wrong secret
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($WRONG_SECRET))
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($PAYLOAD))
$BAD_SIGNATURE = "sha256=" + ($hash | ForEach-Object { "{0:x2}" -f $_ }) -join ""

# Send request with bad signature
$headers = @{
    "x-hub-signature-256" = $BAD_SIGNATURE
    "x-github-event" = "workflow_run"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/webhook" `
        -Method POST `
        -Headers $headers `
        -Body $PAYLOAD `
        -UseBasicParsing
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" # Should be 401
    Write-Host "Error: Invalid signature rejected ✓"
}
```

**Expected:** Status Code: 401 (Unauthorized)

---

### Test 3: Missing Signature (Should Fail)

```powershell
# Send WITHOUT signature header
$headers = @{
    "x-github-event" = "workflow_run"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/webhook" `
        -Method POST `
        -Headers $headers `
        -Body $PAYLOAD `
        -UseBasicParsing
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" # Should be 401
    Write-Host "Error: Missing signature rejected ✓"
}
```

**Expected:** Status Code: 401 (Unauthorized)

---

### Test 4: Real GitHub Webhook (Optional)

**Trigger a failed workflow:**

1. Go to your connected repository on GitHub
2. Create or modify `.github/workflows/test.yml`:

```yaml
name: Test Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: exit 1  # Force failure
```

3. Push to GitHub (or make any commit)
4. Watch your GitHub Actions for the workflow failure
5. Check server console for webhook event

---

## ✅ Verification Checklist

```
Installation:
☐ npm install completed without errors
☐ npm list shows all packages

Environment:
☐ .env.local file created
☐ SESSION_PASSWORD is 32+ characters
☐ GITHUB_WEBHOOK_SECRET is 32+ characters
☐ NODE_ENV is "development"

Dev Server:
☐ npm run dev started successfully
☐ Server listening on http://localhost:3000
☐ Next.js shows "Ready" status

Connection:
☐ Home page loads at http://localhost:3000
☐ Can navigate to /connection
☐ Successfully entered PAT & repo URL
☐ "Connected" message displayed
☐ Session cookie created in browser

Webhook Security:
☐ Valid signature accepted (200 OK)
☐ Invalid signature rejected (401)
☐ Missing signature rejected (401)
☐ Failed workflow logged to console

Logging:
☐ Console shows "[Webhook]" prefixed logs
☐ Failed run shows full metadata
☐ Owner, repo, and run_id are displayed
```

---

## 🚀 Ready for Phase 2?

Once all tests pass, Phase 2 will add:

1. **Gemini API Integration** - Analyze failed workflow logs
2. **Root Cause Analysis** - Determine what went wrong
3. **Auto-Fix Generation** - Create pull requests with fixes
4. **Notifications** - Email/Slack alerts

---

## 🆘 Troubleshooting

### "npm: command not found"
```powershell
# Install Node.js from https://nodejs.org/
# Or check if Node is installed:
node --version
npm --version
```

### Port 3000 already in use
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use a different port:
npm run dev -- -p 3001
```

### "SESSION_PASSWORD is required"
```
Make sure .env.local exists and has SESSION_PASSWORD filled in
Check for typos in the variable name
Restart npm run dev after changing .env.local
```

### Webhook signature verification failing
```
1. Copy SECRET exactly from GitHub webhook settings
2. Ensure .env.local has GITHUB_WEBHOOK_SECRET=<same_value>
3. Restart dev server (npm run dev)
4. Test again
```

### Session cookie not created
```
1. Check browser console for errors (F12)
2. Verify SESSION_PASSWORD is 32+ characters
3. Try clearing cookies and reconnecting
4. Check server logs for error messages
```

---

## 📊 Expected Logs Output

### Successful Connection Flow
```
[Connection Page] Form submitted
[Server Action] connectRepository() called
[GitHub API] Fetching repository info...
[GitHub API] ✓ Repository validated
[Session] Updated with github_pat and target_repo_url
[UI] Shows "Connected to owner/repo"
[UI] Shows "Ready for Webhooks"
```

### Webhook Reception
```
[Webhook] Received event: workflow_run
[Webhook] Signature verified ✓
[Webhook] ✗ FAILED WORKFLOW RUN DETECTED
  Owner: octocat
  Repository: Hello-World
  Run ID: 123456789
  Run Number: 42
  Workflow: CI
  Branch: main
  Commit: abc123d
  URL: https://github.com/...
```

---

## 🎯 Next Steps After Testing

1. ✅ All tests pass
2. ✅ Webhook verified
3. ✅ Console logging works
4. 🚀 **Ready for Phase 2!**

Phase 2 will implement:
- Gemini API log analysis
- Root cause determination
- Auto-generated fixes
- Pull request creation
- Notifications

---

**Commands Summary (Copy & Run):**

```powershell
# 1. Install
cd d:\DevOps_3\self-healing-cicd
npm install

# 2. Generate secrets
$session_pwd = [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$webhook_secret = [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host "SESSION_PASSWORD=$session_pwd"
Write-Host "GITHUB_WEBHOOK_SECRET=$webhook_secret"

# 3. Configure .env.local
copy .env.local.example .env.local
code .env.local  # Edit and fill in the secrets above

# 4. Start dev server
npm run dev

# 5. Open browser
start http://localhost:3000

# 6. Connect repository via UI at /connection

# 7. Configure GitHub webhook in repo settings
```

**All set!** 🎉
