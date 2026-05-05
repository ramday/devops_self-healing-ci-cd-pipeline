import { NextRequest, NextResponse } from 'next/server';
import { kv } from "@vercel/kv";
import { 
  verifyWebhookSignature, 
  isFailedWorkflowRun, 
  extractRepoInfo, 
  getWorkflowLogs,
  scrubLogs,
  type GitHubWebhookPayload 
} from '@/lib/github';
import { analyzeError } from '@/lib/gemini';

/**
 * POST /api/webhook
 * 
 * Handles incoming GitHub webhook events.
 * Integrates Vercel KV for token lookup and Gemini API for log analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // 1. Signature Verification
    if (!signature) {
      console.warn('[Webhook] Missing x-hub-signature-256 header');
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] GITHUB_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const isSignatureValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isSignatureValid) {
      console.warn('[Webhook] Invalid signature - rejecting request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse Payload
    let payload: GitHubWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as GitHubWebhookPayload;
    } catch (error) {
      console.error('[Webhook] Failed to parse JSON payload:', error);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = request.headers.get('x-github-event');
    if (eventType !== 'workflow_run') {
      return NextResponse.json({ message: `Ignoring event type: ${eventType}` }, { status: 200 });
    }

    // 3. Process Failed Workflow Runs
    if (isFailedWorkflowRun(payload)) {
      const repoInfo = extractRepoInfo(payload);
      const workflowRun = payload.workflow_run!;
      
      console.log(`[Webhook] ✗ FAILURE DETECTED: ${repoInfo.fullName} (Run #${workflowRun.id})`);

      try {
        // A. Token Lookup: Get the user's PAT from KV
        const userToken = await kv.get<string>(repoInfo.fullName);
        
        if (!userToken) {
          console.error(`[Webhook] No token found for ${repoInfo.fullName}. User must connect the repo first.`);
          return NextResponse.json({ error: 'Repository not connected' }, { status: 404 });
        }

        // B. Fetch Logs: Retrieve raw console output from GitHub
        const rawLogs = await getWorkflowLogs(
          userToken, 
          repoInfo.owner, 
          repoInfo.repo, 
          workflowRun.id
        );

        // C. Scrub Logs: Ensure we stay within Gemini's context window
        const cleanLogs = scrubLogs(rawLogs);

        // D. Analyze: Send to Gemini for Root Cause Analysis
        console.log('[Webhook] Sending logs to Gemini for analysis...');
        const analysis = await analyzeError(cleanLogs);

        // E. Store Results: Save to KV so the Phase 3 UI can display it
        await kv.set(`analysis:${workflowRun.id}`, analysis);
        console.log(`[Webhook] ✓ Analysis complete and stored for Run ${workflowRun.id}`);

        return NextResponse.json({
          message: 'Failure analyzed successfully',
          runId: workflowRun.id,
          analysis
        }, { status: 200 });

      } catch (innerError) {
        console.error('[Webhook] Analysis pipeline failed:', innerError);
        return NextResponse.json({ error: 'Failed to analyze workflow' }, { status: 500 });
      }

    } else {
      const action = payload.action || 'unknown';
      const conclusion = payload.workflow_run?.conclusion || 'pending';
      return NextResponse.json({ 
        message: 'Workflow run event received but not a failure', 
        action, 
        conclusion 
      }, { status: 200 });
    }
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'GitHub Webhook Listener - Self-Healing CI/CD',
    status: 'ready',
  }, { status: 200 });
}