'use server';

import { updateSession } from '@/lib/session';
import { getRepositoryInfo, createFixPullRequest } from '@/lib/github';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function connectRepository(formData: FormData) {
  const pat = formData.get('pat') as string;
  const url = formData.get('url') as string;
  
  const urlRegex = /(?:github\.com\/)([^\/]+\/[^\/]+?)(?:\.git)?$/;
  const match = url.trim().match(urlRegex);
  if (!match) return;
  
  const repoFullName = match[1];
  const [owner, repo] = repoFullName.split('/');
  const repoInfo = await getRepositoryInfo(pat, owner, repo);

  if (repoInfo.success) {
    await kv.set(repoFullName, pat);
    await updateSession({ github_pat: pat, target_repo_url: url.trim(), isLoggedIn: true });
    revalidatePath('/');
  }
}

export async function healFailure(runId: string, repoFullName: string) {
  let prUrl: string | null = null;

  try {
    const analysis = await kv.get<any>(`analysis:${runId}`);
    const pat = await kv.get<string>(repoFullName);

    if (!analysis || !pat) throw new Error("Missing data");

    const [owner, repo] = repoFullName.split('/');
    const result = await createFixPullRequest(pat, owner, repo, runId, analysis);
    
    if (result.success && result.url) {
      prUrl = result.url;
    }
  } catch (error) {
    console.error('Healing failed:', error);
  }

  if (prUrl) {
    redirect(prUrl);
  }
}

export async function disconnect() {
  await updateSession({ isLoggedIn: false });
  revalidatePath('/');
}

export async function getRecentFailures() {
  try {
    const keys = await kv.keys('analysis:*');
    if (keys.length === 0) return [];
    const pipeline = kv.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();
    return keys.map((key, i) => ({ 
      runId: key.split(':')[1], 
      ...(results[i] as any) 
    })).reverse();
  } catch (e) {
    return [];
  }
}