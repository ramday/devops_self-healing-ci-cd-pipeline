import { SessionOptions, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  github_pat?: string;
  target_repo_url?: string;
  isLoggedIn?: boolean;
}

const SESSION_CONFIG: SessionOptions = {
  cookieName: 'self-healing-cicd-session',
  password: process.env.SESSION_PASSWORD || '',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

export async function getSession() {
  if (!SESSION_CONFIG.password) {
    throw new Error(
      'Server misconfigured: SESSION_PASSWORD is not set. Add it to your deployment environment variables (e.g., Vercel Project Settings → Environment Variables) and redeploy.'
    );
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    SESSION_CONFIG
  );

  return session;
}

export async function updateSession(data: Partial<SessionData>) {
  const session = await getSession();
  
  if (data.github_pat) {
    session.github_pat = data.github_pat;
  }
  if (data.target_repo_url) {
    session.target_repo_url = data.target_repo_url;
  }
  if (data.isLoggedIn !== undefined) {
    session.isLoggedIn = data.isLoggedIn;
  }

  await session.save();
  return session;
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}
