import { getSession } from '@/lib/session';
import { connectRepository, getRecentFailures, healFailure, disconnect, clearCache } from './actions';

export default async function CommandCenter() {
  const session = await getSession();
  const failures = session.isLoggedIn ? await getRecentFailures() : [];
  const repoFullName = session.target_repo_url?.split('github.com/')[1]?.replace('.git', '') || '';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 font-sans">
      
      {!session.isLoggedIn ? (
        /* ── LOGIN VIEW ── */
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Logo mark */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Self-Healing CI/CD</h1>
              <p className="text-slate-400 mt-2 text-sm">Connect your repository to enable AI-powered remediation</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur">
              <form action={connectRepository} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    GitHub Personal Access Token
                  </label>
                  <input
                    name="pat"
                    type="password"
                    required
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Requires <code className="text-blue-400">repo</code> and <code className="text-blue-400">workflow</code> scopes</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    Repository URL
                  </label>
                  <input
                    name="url"
                    type="url"
                    required
                    placeholder="https://github.com/owner/repo"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold text-white transition-all shadow-lg shadow-blue-500/20 mt-2"
                >
                  Connect Repository →
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-slate-600 mt-6">
              Your token is stored securely and never logged
            </p>
          </div>
        </div>

      ) : (
        /* ── DASHBOARD VIEW ── */
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Top Nav */}
          <header className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-none">Self-Healing CI/CD</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs text-emerald-400 font-mono">{repoFullName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                {failures.length} {failures.length === 1 ? 'failure' : 'failures'} detected
              </span>
              <form action={clearCache}>
                <button className="text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3 py-1.5 rounded-lg transition-all">
                  Clear History
                </button>
              </form>
              <form action={disconnect}>
                <button className="text-xs text-rose-400/70 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-all">
                  Disconnect
                </button>
              </form>
            </div>
          </header>

          {/* Page Title Row */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">AI Command Center</h2>
            <p className="text-slate-500 text-sm mt-1">
              Failures are automatically detected, analyzed by Gemini, and ready for one-click remediation.
            </p>
          </div>

          {/* Empty State */}
          {failures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">All systems operational</p>
              <p className="text-slate-600 text-sm mt-1">No CI/CD failures detected in your pipeline history</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {failures.map((fail: any) => (
                <FailureCard key={fail.runId} fail={fail} repoFullName={repoFullName} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FailureCard({ fail, repoFullName }: { fail: any; repoFullName: string }) {
  const fileName = fail.file?.split('/').pop() || fail.file || 'Unknown file';
  const filePath = fail.file || 'Unknown';

  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-200 shadow-xl">
      
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span className="text-xs font-mono text-slate-400">Run #{fail.runId}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-mono text-slate-500 truncate max-w-[180px]" title={filePath}>
            {fileName}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Error Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-400/80">Root Cause</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{fail.error || 'No error description available'}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-5"></div>

        {/* AI Fix Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400/80">AI Suggested Fix</span>
          </div>
          <div className="bg-[#0d1117] border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {fail.suggestedFix || 'No fix suggestion available'}
          </div>
        </div>

        {/* File path full */}
        <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-slate-800/40 rounded-lg border border-slate-800/60">
          <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-xs font-mono text-slate-500 truncate">{filePath}</span>
        </div>

        {/* CTA Button */}
        <form action={healFailure.bind(null, fail.runId, repoFullName)}>
          <button className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold text-sm text-white transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Apply Fix & Open PR
          </button>
        </form>
      </div>
    </div>
  );
}s