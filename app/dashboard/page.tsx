import { getRecentFailures, healFailure } from '@/app/connection/actions';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/connection');

  const failures = await getRecentFailures();
  const repoFullName = session.target_repo_url?.replace("https://github.com/", "") || "";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          AI Insights Dashboard
        </h1>
        <p className="text-slate-400 mt-2">Remediate CI/CD failures across your connected repositories.</p>
      </header>

      {failures.length === 0 ? (
        <div className="text-center p-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500">No failures detected yet. Your pipeline is healthy!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {failures.map((fail: any) => (
            <div key={fail.runId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                  Run #{fail.runId}
                </span>
                <span className="text-xs text-slate-500 font-mono">{fail.file}</span>
              </div>
              
              <h3 className="text-lg font-semibold mb-2 text-rose-400">Error Detected</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                {fail.error}
              </p>

              <div className="bg-black/40 rounded-lg p-4 mb-6 font-mono text-xs text-blue-300 overflow-x-auto">
                <p className="text-slate-500 mb-2">// Suggested Fix</p>
                {fail.suggestedFix}
              </div>

              <form action={async () => {
                'use server';
                const result = await healFailure(fail.runId, repoFullName);
                if (result.success) redirect(result.url!);
              }}>
                <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                  ✨ Heal Now
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}