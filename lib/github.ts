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
      author: { name: string; email: string };
      committer: { name: string; email: string };
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
    owner?: { login: string };
  };
  sender?: {
    login: string;
    type: string;
  };
}

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

export function initializeOctokit(pat: string) {
  return new Octokit({ auth: pat });
}

export async function getWorkflowLogs(
  pat: string,
  owner: string,
  repo: string,
  runId: number
): Promise<string> {
  const octokit = initializeOctokit(pat);
  try {
    const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner, repo, run_id: runId,
    });
    const failedJob = jobs.jobs.find(job => job.conclusion === 'failure');
    if (!failedJob) return 'No failed job found in this run.';
    const { data: logs } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
      owner, repo, job_id: failedJob.id,
    });
    return logs as string;
  } catch (error) {
    console.error('GitHub Log Retrieval Error:', error);
    return 'Error: Could not retrieve logs from GitHub.';
  }
}

export function scrubLogs(logs: string, charLimit: number = 2500): string {
  if (logs.length <= charLimit) return logs;
  return `... [Log Truncated] ...\n${logs.slice(-charLimit)}`;
}

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

export function isFailedWorkflowRun(payload: GitHubWebhookPayload): boolean {
  return (
    payload.action === 'completed' &&
    payload.workflow_run?.conclusion === 'failure'
  );
}

export async function getRepositoryInfo(pat: string, owner: string, repo: string) {
  const octokit = initializeOctokit(pat);
  try {
    const response = await octokit.rest.repos.get({ owner, repo });
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

/**
 * Resolves the actual workflow file path from the repo,
 * ignoring whatever (possibly wrong) filename Gemini returned.
 * Matches by the workflow file that triggered the failing run if possible,
 * otherwise falls back to the first .yml file found.
 */
async function resolveWorkflowFilePath(
  octokit: Octokit,
  owner: string,
  repo: string,
  hintPath: string
): Promise<string> {
  try {
    const { data: entries } = await octokit.rest.repos.getContent({
      owner, repo, path: '.github/workflows',
    });
    const files = (entries as any[]).filter(
      f => f.type === 'file' && (f.name.endsWith('.yml') || f.name.endsWith('.yaml'))
    );
    if (files.length === 0) throw new Error('No workflow files found in .github/workflows');

    // Try to match the hint filename against real files (handles main.yml → ci.yml mismatches)
    const hintName = hintPath.split('/').pop()?.toLowerCase() || '';
    const matched = files.find(f => f.name.toLowerCase() === hintName);
    
    // Return matched file if found, otherwise first file in directory
    return matched ? matched.path : files[0].path;
  } catch {
    // If directory listing fails entirely, return the hint as last resort
    return hintPath;
  }
}

export async function createFixPullRequest(
  pat: string,
  owner: string,
  repo: string,
  runId: string,
  analysis: { file: string; suggestedFix: string; error: string }
) {
  const octokit = new Octokit({ auth: pat });
  const branchName = `gemini-fix-${runId}`;

  // 1. Get SHA of main branch
  const { data: mainRef } = await octokit.rest.git.getRef({
    owner, repo, ref: 'heads/main',
  });
  const mainSha = mainRef.object.sha;

  // 2. Create branch, or force-reset it if it already exists
  try {
    await octokit.rest.git.createRef({
      owner, repo,
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    });
  } catch (e: any) {
    if (e.status === 422) {
      await octokit.rest.git.updateRef({
        owner, repo,
        ref: `heads/${branchName}`,
        sha: mainSha,
        force: true,
      });
    } else {
      throw e;
    }
  }

  // 3. Always resolve the real workflow file path from the repo
  //    Never trust Gemini's filename blindly
  const filePath = await resolveWorkflowFilePath(octokit, owner, repo, analysis.file);
  console.log(`[GitHub] Resolved file path: ${filePath} (Gemini suggested: ${analysis.file})`);

  // 4. Get current file SHA (required by GitHub API to update a file)
  const { data: fileData } = await octokit.rest.repos.getContent({
    owner, repo, path: filePath,
  });
  const fileSha = (fileData as any).sha;

  // 5. Commit the AI fix to the new branch
  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo,
    path: filePath,
    message: `🔧 AI Fix for Run #${runId}: ${analysis.error}`,
    content: Buffer.from(analysis.suggestedFix).toString('base64'),
    branch: branchName,
    sha: fileSha,
  });

  // 6. Open the Pull Request
  const { data: pr } = await octokit.rest.pulls.create({
    owner, repo,
    title: `🔧 Self-Healing: Fix failure in ${filePath}`,
    head: branchName,
    base: 'main',
    body: `### 🤖 AI-Generated Fix\n\n**Error Identified:** ${analysis.error}\n**File Modified:** \`${filePath}\`\n\nThis PR was automatically generated by the Self-Healing CI/CD pipeline after analyzing the logs for run #${runId}.`,
  });

  return { success: true, url: pr.html_url };
}