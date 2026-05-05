'use server';

import { updateSession, getSession } from '@/lib/session';
import { getRepositoryInfo, createFixPullRequest } from '@/lib/github';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

/**
 * Handles initial GitHub connection
 */
export async function connectRepository(pat: string, repoUrl: string) {
  const urlRegex = /(?:github\.com\/)([^\/]+\/[^\/]+?)(?:\.git)?$/;
  const match = repoUrl.trim().match(urlRegex);
  
  if (!match) return { success: false, error: 'Invalid GitHub URL format.' };
  
  const repoFullName = match[1];
  const [owner, repo] = repoFullName.split('/');
  
  const repoInfo = await getRepositoryInfo(pat, owner, repo);

  if (!repoInfo.success) {
    return { success: false, error: repoInfo.error };
  }

  // Save token to KV for the webhook to use later
  await kv.set(repoFullName, pat);
  
  // Update the user session
  await updateSession({
    github_pat: pat,
    target_repo_url: repoUrl.trim(),
    isLoggedIn: true,
  });

  revalidatePath('/'); // Refresh the root page
  return { success: true, repoName: repoFullName };
}

export async function disconnect() {
  await updateSession({ isLoggedIn: false });
  revalidatePath('/');
}

/**
 * Fetches analysis results stored by the webhook
 */
export async function getRecentFailures() {
  try {
    const keys = await kv.keys('analysis:*');
    if (keys.length === 0) return [];

    const results = await Promise.all(keys.map(key => kv.get(key)));
    
    return keys.map((key, index) => ({
      runId: key.replace('analysis:', ''),
      ...(results[index] as object),
    })).reverse();
  } catch (error) {
    console.error('KV Fetch Error:', error);
    return [];
  }
}

/**
 * Triggers the automated Pull Request
 */
export async function healFailure(runId: string, repoFullName: string) {
  try {
    const analysis = await kv.get<any>(`analysis:${runId}`);
    const pat = await kv.get<string>(repoFullName);

    if (!analysis || !pat) throw new Error("Missing analysis or token data");

    const [owner, repo] = repoFullName.split('/');
    const result = await createFixPullRequest(pat, owner, repo, runId, analysis);

    return { success: true, url: result.url };
  } catch (error) {
    return { success: false, error: "Failed to create PR." };
  }
}