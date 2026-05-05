import { getSession } from '@/lib/session';
import { connectRepository, getRecentFailures, healFailure, disconnect, clearCache } from './actions';

export default async function CommandCenter() {
  const session = await getSession();
  const failures = session.isLoggedIn ? await getRecentFailures() : [];
  const repoFullName = session.target_repo_url?.split('github.com/')[1] || "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      {!session.isLoggedIn ? (
        <div className="max-w-md mx-auto mt-24 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-6">Self-Healing CI/CD</h1>
          <form action={connectRepository} className="space-y-5">
            <input name="pat" type="password" required placeholder="GitHub PAT" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none" />
            <input name="url" type="url" required placeholder="Repo URL" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none" />
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold">Connect Repository</button>
          </form>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-16">
            <div>
              <h1 className="text-4xl font-extrabold text-white">AI Command Center</h1>
              <p className="text-emerald-400 font-mono text-sm mt-1">● Active: {repoFullName}</p>
            </div>
            <div className="flex gap-4">
              <form action={clearCache}>
                <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
                  Clear History
                </button>
              </form>
              <form action={disconnect}>
                <button className="px-4 py-2 border border-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-all">
                  Disconnect
                </button>
              </form>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {failures.length === 0 ? (
              <p className="text-slate-500">No recent failures found in your pipeline history.</p>
            ) : (
              failures.map((fail: any) => (
                <div key={fail.runId} className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">Run #{fail.runId}</span>
                    <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{fail.file}</span>
                  </div>
                  <h2 className="text-rose-400 font-bold text-xl mb-3">Failure Analyzed</h2>
                  <p className="text-slate-400 text-sm mb-8">{fail.error}</p>
                  <div className="bg-black/50 rounded-2xl p-5 mb-8 font-mono text-xs text-blue-300 border border-white/5 whitespace-pre-wrap">
                    <p className="text-slate-600 mb-3">{"// AI Suggested Remediation"}</p>
                    {fail.suggestedFix}
                  </div>
                  <form action={healFailure.bind(null, fail.runId, repoFullName)}>
                    <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold text-white transition-all shadow-lg shadow-blue-900/20">
                      ✨ Apply Fix & Open PR
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}