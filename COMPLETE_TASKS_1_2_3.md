# Complete Guide: Tasks 1-3 (Connect Repo → Configure Webhook → Test)

## 📋 What You Need First

Before starting, gather these items:

1. **GitHub Personal Access Token (PAT)** - Create at https://github.com/settings/tokens
2. **Your Repository URL** - Example: `https://github.com/YOUR_USERNAME/YOUR_REPO`
3. **Your GitHub Webhook Secret** - From .env.local: `b6f719594ba9e303835137196864a8efcd7ad126a7afe0b49cbbf6c06a5c5c19`

---

# TASK 1: Connected Your Repo ✅

## Step 1.1: Create GitHub Personal Access Token

1. **Open:** https://github.com/settings/tokens
2. **Click:** "Generate new token (classic)"
3. **Fill in:**
   - Token name: "Self-Healing CI/CD"
   - Expiration: (your preference, 30 days or custom)
4. **Select Scopes:** (Check EXACTLY these 2)
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. **Click:** "Generate token"
6. **COPY THE TOKEN** (You won't see it again!)

**Your PAT looks like:** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 1.2: Connect Repository via UI

**Open your browser:**

1. **Go to:** http://localhost:3000

2. **You see the home page with:**
   - "Self-Healing CI/CD" title
   - Two cards: Phase 1 (Active) and Phase 2 (Coming Soon)
   - "Get Started" button

3. **Click "Get Started"** button or navigate to:
   - http://localhost:3000/connection

4. **You see the Connection Page:**
   ```
   ┌─────────────────────────────────┐
   │  GitHub Personal Access Token   │
   │  [Input field]                  │
   │                                 │
   │  Repository URL                 │
   │  [Input field]                  │
   │                                 │
   │  [Connect Repository] button    │
   └─────────────────────────────────┘
   ```

5. **Enter your details:**
   - **PAT Field:** Paste your GitHub token (the `ghp_xxx...` value)
   - **Repository URL:** `https://github.com/YOUR_USERNAME/YOUR_REPO`
     - Example: `https://github.com/octocat/Hello-World`

6. **Click "Connect Repository"** button

### Expected Success Result:

After clicking, you should see:
- ✅ Green success message: "Connected to owner/repo"
- ✅ Status badge shows: "Ready for Webhooks"
- ✅ Blue card displays your webhook URL: `http://localhost:3000/api/webhook`
- ✅ Instructions for next steps

### Browser DevTools Verification:

1. **Press:** F12 (open DevTools)
2. **Go to:** Application → Cookies → http://localhost:3000
3. **You should see:** `self-healing-cicd-session` cookie (encrypted)

**✅ TASK 1 COMPLETE!**

---

# TASK 2: Configured GitHub Webhook ✅

## Step 2.1: Navigate to GitHub Webhook Settings

1. **Open:** Your GitHub repository
   - Example: https://github.com/YOUR_USERNAME/YOUR_REPO

2. **Go to:** Settings → Webhooks

3. **Click:** "Add webhook"

---

## Step 2.2: Fill in Webhook Configuration

**You'll see a form with these fields:**

### Fill Each Field:

**1. Payload URL:**
```
http://localhost:3000/api/webhook
```
(Use this exact URL - it's your local dev server)

**2. Content type:**
```
Select: application/json
```

**3. Secret:**
```
b6f719594ba9e303835137196864a8efcd7ad126a7afe0b49cbbf6c06a5c5c19
```
(Copy from your .env.local file)

**4. Which events would you like to trigger this webhook?**
- ⚪ Just the push event (UNCHECK if selected)
- ⚪ Let me select individual events (SELECT THIS)

**5. Select Individual Events:**
- When you select "Let me select individual events", check:
  - ✅ **Workflow runs** (This is the main one!)
- Uncheck everything else (Push, Pull requests, etc.)

**6. Active:**
- ✅ **Check this box** (to enable the webhook)

---

## Step 2.3: Add Webhook

1. **Click:** "Add webhook" button at the bottom

2. **Wait for confirmation:**
   - You should see the webhook appear in the list with a **green checkmark**
   - This means GitHub successfully delivered the initial test

### Verify Webhook Created:

1. **Click on the webhook row** to expand details
2. **Go to "Recent Deliveries" tab**
3. **You should see:**
   - Green checkmark indicating successful delivery
   - Status code: 200

**✅ TASK 2 COMPLETE!**

---

# TASK 3: Ran Test Successfully ✅

## Step 3.1: Open PowerShell (NEW Terminal)

**Important:** Keep your dev server running in the first terminal!

1. **Open a NEW PowerShell window** (separate from where dev server is running)
2. **You can be in any directory** (the commands work from anywhere)

---

## Step 3.2: Run Complete Webhook Test

**Copy and paste this ENTIRE block into PowerShell:**

```powershell
# ============================================
# WEBHOOK TEST - Failed Workflow Simulation
# ============================================

$SECRET = "b6f719594ba9e303835137196864a8efcd7ad126a7afe0b49cbbf6c06a5c5c19"
$WEBHOOK_URL = "http://localhost:3000/api/webhook"

# Create realistic test payload
$PAYLOAD = @{
    action = "completed"
    workflow_run = @{
        id = 1234567890
        name = "CI Pipeline"
        run_number = 42
        head_branch = "main"
        head_sha = "abc123def456abc123def456abc123def456abc1"
        conclusion = "failure"
        status = "completed"
        html_url = "https://github.com/octocat/Hello-World/actions/runs/1234567890"
    }
    repository = @{
        name = "Hello-World"
        full_name = "octocat/Hello-World"
        owner = @{ login = "octocat" }
    }
} | ConvertTo-Json -Depth 10

# Create HMAC-SHA256 signature
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($SECRET))
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($PAYLOAD))
$SIGNATURE = "sha256=" + ($hash | ForEach-Object { '{0:x2}' -f $_ }) -join ""

# Create headers
$headers = @{
    "x-hub-signature-256" = $SIGNATURE
    "x-github-event" = "workflow_run"
    "Content-Type" = "application/json"
}

# Display test info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 WEBHOOK TEST - Failed Workflow Simulation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sending to: $WEBHOOK_URL" -ForegroundColor Gray
Write-Host "Event Type: workflow_run (completed)" -ForegroundColor Gray
Write-Host "Status: FAILURE" -ForegroundColor Red
Write-Host ""

# Send the webhook
try {
    $response = Invoke-WebRequest -Uri $WEBHOOK_URL `
        -Method POST `
        -Headers $headers `
        -Body $PAYLOAD `
        -UseBasicParsing

    Write-Host "✅ REQUEST SUCCESSFUL" -ForegroundColor Green
    Write-Host ""
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json) -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✓ Now check your dev server terminal!" -ForegroundColor Yellow
    Write-Host "  You should see: [Webhook] ✗ FAILED WORKFLOW RUN DETECTED" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
} catch {
    Write-Host "❌ REQUEST FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## Step 3.3: Verify Test Results

### In PowerShell, you should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 WEBHOOK TEST - Failed Workflow Simulation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sending to: http://localhost:3000/api/webhook
Event Type: workflow_run (completed)
Status: FAILURE

✅ REQUEST SUCCESSFUL

Status Code: 200

Response Body:
{
  "message": "Failed workflow run logged for remediation",
  "workflow": {
    "owner": "octocat",
    "repo": "Hello-World",
    "runId": 1234567890,
    "runNumber": 42,
    "name": "CI Pipeline"
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Now check your dev server terminal!
  You should see: [Webhook] ✗ FAILED WORKFLOW RUN DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### In Your Dev Server Terminal (npm run dev), you should see:

```
[Webhook] ✓ Received event: workflow_run
[Webhook] ✗ FAILED WORKFLOW RUN DETECTED
  Owner: octocat
  Repository: Hello-World
  Run ID: 1234567890
  Run Number: 42
  Workflow: CI Pipeline
  Branch: main
  Commit: abc123d
  URL: https://github.com/octocat/Hello-World/actions/runs/1234567890
```

---

## Step 3.4: Test Invalid Signature (Security Check)

**Run this test to verify signature verification works:**

```powershell
# Test with WRONG signature (should fail with 401)

$WRONG_SECRET = "wrong_secret_value_12345678901234567890"
$WEBHOOK_URL = "http://localhost:3000/api/webhook"

$PAYLOAD = @{
    action = "completed"
    workflow_run = @{ conclusion = "failure" }
} | ConvertTo-Json

# Create signature with wrong secret
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($WRONG_SECRET))
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($PAYLOAD))
$BAD_SIGNATURE = "sha256=" + ($hash | ForEach-Object { '{0:x2}' -f $_ }) -join ""

$headers = @{
    "x-hub-signature-256" = $BAD_SIGNATURE
    "x-github-event" = "workflow_run"
    "Content-Type" = "application/json"
}

Write-Host "Testing with INVALID signature..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $WEBHOOK_URL `
        -Method POST `
        -Headers $headers `
        -Body $PAYLOAD `
        -UseBasicParsing
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Host "✅ SECURITY TEST PASSED!" -ForegroundColor Green
        Write-Host "   Invalid signature correctly rejected with 401" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected status: $statusCode" -ForegroundColor Red
    }
}
```

**Expected:** Status 401 (Unauthorized)

---

## ✅ Phase 1 Verification Checklist

Once all 3 tasks are complete, verify:

```
TASK 1 - Connected Repo:
☑ Opened http://localhost:3000
☑ Clicked "Get Started"
☑ Entered GitHub PAT
☑ Entered repository URL
☑ Clicked "Connect Repository"
☑ Saw green success message
☑ Session cookie created

TASK 2 - Configured Webhook:
☑ GitHub repository settings opened
☑ Webhook added with:
  ☑ Payload URL: http://localhost:3000/api/webhook
  ☑ Content type: application/json
  ☑ Secret: from .env.local
  ☑ Events: Workflow runs
  ☑ Active: checked
☑ Green checkmark showing delivery successful

TASK 3 - Test Successful:
☑ Ran PowerShell test script
☑ Received status 200 OK
☑ Response showed workflow metadata
☑ Dev server logged "[Webhook] ✗ FAILED WORKFLOW RUN DETECTED"
☑ All metadata logged (owner, repo, run_id, etc.)
☑ Invalid signature test returned 401 (security verified)
```

---

## 🎉 Phase 1 Complete!

Once all checks pass, you're ready for **Phase 2:**

**Phase 2 will add:**
- 🤖 Gemini API integration
- 📊 AI log analysis
- 🔧 Auto-fix generation
- 📝 GitHub PR creation
- 🔔 Notifications

---

## 🆘 Troubleshooting

### "Connection failed" on repository connection:
- ✓ Check PAT is correct and has `repo` + `workflow` scopes
- ✓ Check repository URL format: `https://github.com/owner/repo`
- ✓ Check repo is public or you have access

### Webhook status is not 200:
- ✓ Verify localhost:3000 is accessible
- ✓ Check dev server is still running (check terminal)
- ✓ Verify webhook secret matches exactly

### Dev server doesn't log webhook:
- ✓ Check webhook event type is "Workflow runs" (not "Push")
- ✓ Check payload has `action: "completed"` and `conclusion: "failure"`
- ✓ Check dev server terminal for any errors

---

**Ready to proceed? Let me know once you've completed all 3 tasks!** 🚀
