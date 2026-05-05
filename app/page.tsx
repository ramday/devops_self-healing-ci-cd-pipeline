import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Self-Healing CI/CD
          </h1>
          <p className="text-xl text-slate-400">
            Automated issue detection and remediation for GitHub workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Phase 1 Card */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 hover:border-blue-500 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🔐</div>
              <div>
                <h2 className="text-lg font-bold text-white mb-2">
                  Phase 1: Foundation
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  Secure session management and GitHub webhook listener
                </p>
                <ul className="text-xs text-slate-300 space-y-1 mb-4">
                  <li>✓ iron-session encrypted cookies</li>
                  <li>✓ GitHub PAT & repo storage</li>
                  <li>✓ Webhook signature verification</li>
                  <li>✓ Failure detection & logging</li>
                </ul>
                <Link
                  href="/connection"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>

          {/* Phase 2 Card */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 opacity-60">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🤖</div>
              <div>
                <h2 className="text-lg font-bold text-white mb-2">
                  Phase 2: AI Analysis
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  Log analysis and remediation planning
                </p>
                <ul className="text-xs text-slate-300 space-y-1 mb-4">
                  <li>⊘ Gemini API integration</li>
                  <li>⊘ Log analysis & root cause</li>
                  <li>⊘ Fix recommendation</li>
                  <li>⊘ Coming soon...</li>
                </ul>
                <button
                  disabled
                  className="inline-block px-4 py-2 bg-slate-600 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Architecture</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <span className="text-slate-300">
                <strong>Connection Page:</strong> Store GitHub PAT & repo URL
                securely in encrypted session
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <span className="text-slate-300">
                <strong>GitHub Webhook:</strong> Listen for workflow_run events
                at /api/webhook
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <span className="text-slate-300">
                <strong>Signature Verification:</strong> HMAC-SHA256 validation
                of webhook requests
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                4
              </div>
              <span className="text-slate-300">
                <strong>Failure Detection:</strong> Filter for failed workflow
                runs and log details
              </span>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p className="mb-4">Built with:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1 bg-slate-700 rounded-full">Next.js 14</span>
            <span className="px-3 py-1 bg-slate-700 rounded-full">TypeScript</span>
            <span className="px-3 py-1 bg-slate-700 rounded-full">
              iron-session
            </span>
            <span className="px-3 py-1 bg-slate-700 rounded-full">Tailwind CSS</span>
            <span className="px-3 py-1 bg-slate-700 rounded-full">Octokit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
