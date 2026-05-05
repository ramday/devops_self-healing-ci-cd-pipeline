'use server';

import { updateSession } from '@/lib/session';
import { getRepositoryInfo, createFixPullRequest } from '@/lib/github';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Handles the repository connection form
 */
export async function connectRepositoryAction(formData: FormData) {
  const pat = formData.get('pat') as string;
  const url = formData.get('url') as string;
  
  if (!pat || !url) return { success: false, error: 'All fields are required.' };

  const urlRegex = /(?:github\.com\/)([^\/]+\/[^\/]+?)(?:\.git)?$/;
  const match = url.trim().match(urlRegex);
  
  if (!match) return { success: false, error: 'Invalid GitHub URL format.' };
  
  const repoFullName = match[1];
  const [owner, repo] = repoFullName.split('/');
  
  const repoInfo = await getRepositoryInfo(pat, owner, repo);

  if (!repoInfo.success) {
    return { success: false, error: repoInfo.error };
  }

  // Store token in KV for the background webhook to access
  await kv.set(repoFullName, pat);
  
  // Persist session
  await updateSession({
    github_pat: pat,
    target_repo_url: url.trim(),
    isLoggedIn: true,
  });

  revalidatePath('/');
  return { success: true };
}

/**
 * Handles the "Heal Now" button and PR creation
 */
export async function healFailureAction(runId: string, repoFullName: string) {
  let prUrl: string | null = null;

  try {
    const analysis = await kv.get<any>(`analysis:${runId}`);
    const pat = await kv.get<string>(repoFullName);

    if (!analysis || !pat) throw new Error("Missing data for healing");

    const [owner, repo] = repoFullName.split('/');
    const result = await createFixPullRequest(pat, owner, repo, runId, analysis);

    if (result.success && result.url) {
      prUrl = result.url;
    }
  } catch (error) {
    console.error('Healing action failed:', error);
  }

  // Redirects must be called outside of try/catch blocks in Next.js Server Actions
  if (prUrl) {
    redirect(prUrl);
  }
}

/**
 * Fetches failure data stored by the AI analysis webhook
 */
export async function getRecentFailures() {
  try {
    const keys = await kv.keys('analysis:*');
    if (keys.length === 0) return [];

    // Batch fetch data using a pipeline for performance
    const pipeline = kv.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();
    
    return keys.map((key, index) => ({
      runId: key.replace('analysis:', ''),
      ...(results[index] as any),
    })).reverse();
  } catch (error) {
    console.error('KV Fetch Error:', error);
    return [];
  }
}

/**
 * Logs the user out and clears UI state
 */
export async function disconnectAction() {
  await updateSession({ isLoggedIn: false });
  revalidatePath('/');
}