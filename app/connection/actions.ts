'use server';

import { updateSession, getSession } from '@/lib/session';
import { getRepositoryInfo } from '@/lib/github';
import { kv } from '@vercel/kv';

export async function connectRepository(
  pat: string,
  repoUrl: string
): Promise<{ success: boolean; error?: string; repoName?: string }> {
  try {
    // 1. Validate inputs
    if (!pat || pat.trim().length === 0) {
      return { success: false, error: 'Personal Access Token is required' };
    }

    if (!repoUrl || repoUrl.trim().length === 0) {
      return { success: false, error: 'Repository URL is required' };
    }

    // 2. Parse repository URL
    let owner: string;
    let repo: string;

    const urlRegex =
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/;
    const match = repoUrl.trim().match(urlRegex);

    if (!match) {
      return {
        success: false,
        error:
          'Invalid repository URL. Expected format: https://github.com/owner/repo',
      };
    }

    [, owner, repo] = match;

    // 3. Verify the repository exists and the PAT is valid
    const repoInfo = await getRepositoryInfo(pat, owner, repo);

    if (!repoInfo.success || !repoInfo.data) {
      return {
        success: false,
        error: `Failed to access repository: ${repoInfo.error}`,
      };
    }

    const repoFullName = repoInfo.data.fullName;

    // 4. Save to Vercel KV (The "Bridge" for the Webhook)
    // This allows the background webhook to access the token later
    await kv.set(repoFullName, pat);

    // 5. Save to session (For the frontend UI state)
    await updateSession({
      github_pat: pat,
      target_repo_url: repoUrl.trim(),
      isLoggedIn: true,
    });

    return {
      success: true,
      repoName: repoFullName,
    };
  } catch (error) {
    console.error('Error connecting repository:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

export async function getConnectionStatus() {
  try {
    const session = await getSession();
    return {
      isConnected: !!session.github_pat && !!session.target_repo_url,
      repoUrl: session.target_repo_url || null,
      pat: session.github_pat ? '***' : null,
    };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return {
      isConnected: false,
      repoUrl: null,
      pat: null,
    };
  }
}

export async function disconnectRepository() {
  try {
    const session = await getSession();
    
    // Optional: Clean up KV storage on disconnect 
    // (Note: This would prevent webhooks from working until re-connected)
    /*
    if (session.target_repo_url) {
       const urlRegex = /(?:github\.com\/)([^\/]+\/[^\/]+?)(?:\.git)?$/;
       const match = session.target_repo_url.match(urlRegex);
       if (match) await kv.del(match[1]);
    }
    */

    await updateSession({
      github_pat: undefined,
      target_repo_url: undefined,
      isLoggedIn: false,
    });
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
