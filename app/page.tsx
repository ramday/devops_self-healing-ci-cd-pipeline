import { getSession } from '@/lib/session';
import { connectRepository, getRecentFailures, healFailure, disconnect } from './actions';
import { redirect } from 'next/navigation';

export default async function CommandCenter() {
  const session = await getSession();
  const failures = session.isLoggedIn ? await getRecentFailures() : [];
  const repoFullName = session.target_repo_url?.split('github.com/')[1] || "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      {!session.isLoggedIn ? (
        <div className="max-w-md mx-auto mt-24 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Self-Healing CI/CD</h1>
            <p className="text-slate-400">Connect your repository to begin</p>
          </div>
          
          <form action={connectRepository} className="space-y-5">
            <input name="pat" type="password" required placeholder="GitHub PAT" 
                   className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none" />
            <input name="url" type="url" required placeholder="https://github.com/owner/repo" 
                   className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none" />
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all text-white">
              Connect Repository
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-16">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">AI Command Center</h1>
              <p className="text-emerald-400 font-mono text-sm mt-1">Active: {repoFullName}</p>
            </div>
            <form action={disconnect}>
              <button className="px-4 py-2 border border-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-all">
                Disconnect
              </button>
            </form>
          </header>

          {failures.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-slate-900 rounded-3xl bg-slate-900/30">
              <p className="text-slate-500 text-lg">No CI/CD failures detected yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {failures.map((fail: any) => (
                <div key={fail.runId} className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">Run #{fail.runId}</span>
                    <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{fail.file}</span>
                  </div>
                  
                  <h2 className="text-rose-400 font-bold text-xl mb-3">Failure Analyzed</h2>
                  <p className="text-slate-400 text-sm mb-8">{fail.error}</p>

                  <div className="bg-black/50 rounded-2xl p-5 mb-8 font-mono text-xs text-blue-300 border border-white/5">
                    <p className="text-slate-600 mb-3">AI Suggested Remediation</p>
                    {fail.suggestedFix}
                  </div>

                  <form action={healFailure.bind(null, fail.runId, repoFullName)}>
                    <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 rounded-2xl font-bold transition-all text-white">
                      Apply Fix & Open PR
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}