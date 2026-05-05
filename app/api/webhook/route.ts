import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  isFailedWorkflowRun,
  extractRepoInfo,
  type GitHubWebhookPayload,
} from '@/lib/github';

/**
 * POST /api/webhook
 * 
 * Handles incoming GitHub webhook events.
 * Verifies signature, filters for failed workflow runs, and logs relevant data.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify webhook signature
    if (!signature) {
      console.warn('[Webhook] Missing x-hub-signature-256 header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] GITHUB_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const isSignatureValid = verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret
    );

    if (!isSignatureValid) {
      console.warn('[Webhook] Invalid signature - rejecting request');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the payload
    let payload: GitHubWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as GitHubWebhookPayload;
    } catch (error) {
      console.error('[Webhook] Failed to parse JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Get the event type from headers
    const eventType = request.headers.get('x-github-event');
    console.log(`[Webhook] Received event: ${eventType}`);

    // Filter for workflow_run events only
    if (eventType !== 'workflow_run') {
      console.log(`[Webhook] Ignoring event type: ${eventType}`);
      return NextResponse.json(
        { message: 'Event ignored - not a workflow_run event' },
        { status: 200 }
      );
    }

    // Check if this is a failed workflow run completion
    if (isFailedWorkflowRun(payload)) {
      const repoInfo = extractRepoInfo(payload);
      const workflowRun = payload.workflow_run!;

      console.log('[Webhook] ✗ FAILED WORKFLOW RUN DETECTED');
      console.log(`  Owner: ${repoInfo.owner}`);
      console.log(`  Repository: ${repoInfo.repo}`);
      console.log(`  Run ID: ${workflowRun.id}`);
      console.log(`  Run Number: ${workflowRun.run_number}`);
      console.log(`  Workflow: ${workflowRun.name}`);
      console.log(`  Branch: ${workflowRun.head_branch}`);
      console.log(`  Commit: ${workflowRun.head_sha.substring(0, 7)}`);
      console.log(`  URL: ${workflowRun.html_url}`);

      // TODO: Phase 2 - Trigger self-healing logic here
      // - Analyze logs
      // - Determine root cause
      // - Execute remediation

      return NextResponse.json(
        {
          message: 'Failed workflow run logged for remediation',
          workflow: {
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            runId: workflowRun.id,
            runNumber: workflowRun.run_number,
            name: workflowRun.name,
          },
        },
        { status: 200 }
      );
    } else {
      // Log other workflow_run events for debugging
      const action = payload.action || 'unknown';
      const conclusion = payload.workflow_run?.conclusion || 'pending';
      console.log(
        `[Webhook] Workflow run event - action: ${action}, conclusion: ${conclusion}`
      );

      return NextResponse.json(
        {
          message: 'Workflow run event received but not a failure',
          action,
          conclusion,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook
 * 
 * Health check endpoint for webhook verification
 */
export async function GET() {
  return NextResponse.json(
    {
      message: 'GitHub Webhook Listener - Self-Healing CI/CD',
      status: 'ready',
    },
    { status: 200 }
  );
}
