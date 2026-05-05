'use server';

import { updateSession, getSession } from '@/lib/session';
import { getRepositoryInfo } from '@/lib/github';

export async function connectRepository(
  pat: string,
  repoUrl: string
): Promise<{ success: boolean; error?: string; repoName?: string }> {
  try {
    // Validate inputs
    if (!pat || pat.trim().length === 0) {
      return { success: false, error: 'Personal Access Token is required' };
    }

    if (!repoUrl || repoUrl.trim().length === 0) {
      return { success: false, error: 'Repository URL is required' };
    }

    // Parse repository URL
    // Support formats: https://github.com/owner/repo, github.com/owner/repo, owner/repo
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

    // Verify the repository exists and the PAT is valid
    const repoInfo = await getRepositoryInfo(pat, owner, repo);

    if (!repoInfo.success) {
      return {
        success: false,
        error: `Failed to access repository: ${repoInfo.error}`,
      };
    }

    // Save to session
    await updateSession({
      github_pat: pat,
      target_repo_url: repoUrl.trim(),
      isLoggedIn: true,
    });

    return {
      success: true,
      repoName: repoInfo.data?.fullName,
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
