import { Octokit } from 'octokit';
import crypto from 'crypto';

export interface GitHubWebhookPayload {
  action?: string;
  workflow_run?: {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    path: string;
    run_number: number;
    event: string;
    status: string;
    conclusion: string | null;
    workflow_id: number;
    check_suite_id: number;
    check_suite_node_id: string;
    url: string;
    html_url: string;
    pull_requests: any[];
    created_at: string;
    updated_at: string;
    actor: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    run_attempt: number;
    referenced_workflows: any[];
    head_commit: {
      id: string;
      tree_id: string;
      message: string;
      timestamp: string;
      author: {
        name: string;
        email: string;
      };
      committer: {
        name: string;
        email: string;
      };
    };
    repository: {
      id: number;
      node_id: string;
      name: string;
      full_name: string;
      private: boolean;
      owner: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
      };
      html_url: string;
      description: string | null;
      fork: boolean;
      url: string;
      forks_url: string;
      keys_url: string;
      collaborators_url: string;
      teams_url: string;
      hooks_url: string;
      issue_events_url: string;
      events_url: string;
      assignees_url: string;
      branches_url: string;
      tags_url: string;
      blobs_url: string;
      git_tags_url: string;
      git_refs_url: string;
      trees_url: string;
      statuses_url: string;
      languages_url: string;
      stargazers_url: string;
      contributors_url: string;
      subscribers_url: string;
      subscription_url: string;
      commits_url: string;
      git_commits_url: string;
      comments_url: string;
      issue_comment_url: string;
      contents_url: string;
      compare_url: string;
      merges_url: string;
      archive_url: string;
      downloads_url: string;
      issues_url: string;
      pulls_url: string;
      milestones_url: string;
      notifications_url: string;
      labels_url: string;
      releases_url: string;
      deployments_url: string;
      created_at: string;
      updated_at: string;
      pushed_at: string;
      git_url: string;
      ssh_url: string;
      clone_url: string;
      svn_url: string;
      homepage: string | null;
      size: number;
      stargazers_count: number;
      watchers_count: number;
      language: string;
      has_issues: boolean;
      has_projects: boolean;
      has_downloads: boolean;
      has_wiki: boolean;
      has_pages: boolean;
      forks_count: number;
      mirror_url: string | null;
      open_issues_count: number;
      forks: number;
      open_issues: number;
      watchers: number;
      default_branch: string;
    };
    head_repository: {
      id: number;
      node_id: string;
      name: string;
      full_name: string;
      private: boolean;
      owner: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
      };
      html_url: string;
      description: string | null;
      fork: boolean;
      url: string;
      forks_url: string;
      keys_url: string;
      collaborators_url: string;
      teams_url: string;
      hooks_url: string;
      issue_events_url: string;
      events_url: string;
      assignees_url: string;
      branches_url: string;
      tags_url: string;
      blobs_url: string;
      git_tags_url: string;
      git_refs_url: string;
      trees_url: string;
      statuses_url: string;
      languages_url: string;
      stargazers_url: string;
      contributors_url: string;
      subscribers_url: string;
      subscription_url: string;
      commits_url: string;
      git_commits_url: string;
      comments_url: string;
      issue_comment_url: string;
      contents_url: string;
      compare_url: string;
      merges_url: string;
      archive_url: string;
      downloads_url: string;
      issues_url: string;
      pulls_url: string;
      milestones_url: string;
      notifications_url: string;
      labels_url: string;
      releases_url: string;
      deployments_url: string;
      created_at: string;
      updated_at: string;
      pushed_at: string;
      git_url: string;
      ssh_url: string;
      clone_url: string;
      svn_url: string;
      homepage: string | null;
      size: number;
      stargazers_count: number;
      watchers_count: number;
      language: string;
      has_issues: boolean;
      has_projects: boolean;
      has_downloads: boolean;
      has_wiki: boolean;
      has_pages: boolean;
      forks_count: number;
      mirror_url: string | null;
      open_issues_count: number;
      forks: number;
      open_issues: number;
      watchers: number;
      default_branch: string;
    };
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner?: {
      login: string;
    };
  };
  sender?: {
    login: string;
    type: string;
  };
}

/**
 * Verify GitHub webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.error('GITHUB_WEBHOOK_SECRET is not set');
    return false;
  }

  const signaturePrefix = 'sha256=';
  if (!signature.startsWith(signaturePrefix)) {
    console.error('Invalid signature format');
    return false;
  }

  const signatureHex = signature.substring(signaturePrefix.length);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHex),
    Buffer.from(computedSignature)
  );
}

/**
 * Initialize Octokit client with PAT
 */
export function initializeOctokit(pat: string) {
  return new Octokit({
    auth: pat,
  });
}

/**
 * NEW: Fetch raw workflow logs for a specific run
 */
export async function getWorkflowLogs(
  pat: string, 
  owner: string, 
  repo: string, 
  runId: number
): Promise<string> {
  const octokit = initializeOctokit(pat);

  try {
    // 1. Get the jobs for the run to identify the failure
    const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });

    const failedJob = jobs.jobs.find(job => job.conclusion === 'failure');
    if (!failedJob) return 'No failed job found in this run.';

    // 2. Download the raw logs for that specific failed job
    const { data: logs } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
      owner,
      repo,
      job_id: failedJob.id,
    });

    return logs as string;
  } catch (error) {
    console.error('GitHub Log Retrieval Error:', error);
    return 'Error: Could not retrieve logs from GitHub.';
  }
}

/**
 * NEW: Scrub logs to fit within AI context limits
 */
export function scrubLogs(logs: string, charLimit: number = 2500): string {
  if (logs.length <= charLimit) return logs;
  // We take the end of the logs because that's where the error stack trace usually is
  return `... [Log Truncated] ...\n${logs.slice(-charLimit)}`;
}

/**
 * Extract repo information from webhook payload
 */
export function extractRepoInfo(payload: GitHubWebhookPayload) {
  const repo = payload.repository || payload.workflow_run?.repository;
  const owner = repo?.owner?.login || 'unknown';
  const repoName = repo?.name || 'unknown';

  return {
    owner,
    repo: repoName,
    fullName: repo?.full_name || `${owner}/${repoName}`,
  };
}

/**
 * Check if the webhook is a failed workflow run
 */
export function isFailedWorkflowRun(payload: GitHubWebhookPayload): boolean {
  return (
    payload.action === 'completed' &&
    payload.workflow_run?.conclusion === 'failure'
  );
}

/**
 * Get repository information from GitHub API
 */
export async function getRepositoryInfo(pat: string, owner: string, repo: string) {
  const octokit = initializeOctokit(pat);
  
  try {
    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      success: true,
      data: {
        name: response.data.name,
        fullName: response.data.full_name,
        url: response.data.html_url,
        isPrivate: response.data.private,
        description: response.data.description,
      },
    };
  } catch (error) {
    console.error('Failed to fetch repository info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


// Add these to your existing lib/github.ts

/**
 * Creates a Pull Request with the AI's suggested fix
 */
export async function createFixPullRequest(
  pat: string,
  owner: string,
  repo: string,
  runId: string,
  analysis: { file: string; suggestedFix: string; error: string }
) {
  const octokit = new Octokit({ auth: pat });
  const branchName = `gemini-fix-${runId}`;

  try {
    // 1. Get the SHA of the main branch
    const { data: mainRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });

    // 2. Create a new branch from main
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainRef.object.sha,
    });

    // 3. Get the SHA of the file we want to fix (required for update)
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: analysis.file,
    });

    const fileSha = (fileData as any).sha;

    // 4. Update the file content on the new branch
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: analysis.file,
      message: `🔧 AI Fix for Run #${runId}: ${analysis.error}`,
      content: Buffer.from(analysis.suggestedFix).toString('base64'),
      branch: branchName,
      sha: fileSha,
    });

    // 5. Create the Pull Request
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: `🔧 Self-Healing: Resolve failure in ${analysis.file}`,
      head: branchName,
      base: 'main',
      body: `### 🤖 AI-Generated Fix\n\n**Error Identified:** ${analysis.error}\n**File:** ${analysis.file}\n\nThis PR was automatically generated by the Self-Healing CI/CD tool after analyzing the logs for run #${runId}.`,
    });

    return { success: true, url: pr.html_url };
  } catch (error) {
    console.error('GitHub Remediation Error:', error);
    throw error;
  }
}