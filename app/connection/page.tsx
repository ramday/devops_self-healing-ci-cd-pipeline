'use client';

import { useState, useEffect } from 'react';
import {
  connectRepository,
  getConnectionStatus,
  disconnectRepository,
} from './actions';

export default function ConnectionPage() {
  const [pat, setPat] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectedRepo, setConnectedRepo] = useState<string | null>(null);

  // Check initial connection status
  useEffect(() => {
    const checkStatus = async () => {
      const status = await getConnectionStatus();
      setIsConnected(status.isConnected);
      if (status.isConnected && status.repoUrl) {
        setConnectedRepo(status.repoUrl);
      }
    };

    checkStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await connectRepository(pat, repoUrl);

      if (result.success) {
        setSuccess(`Connected to ${result.repoName}`);
        setIsConnected(true);
        setConnectedRepo(result.repoName || repoUrl);
        setPat('');
        setRepoUrl('');
      } else {
        setError(result.error || 'Failed to connect');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await disconnectRepository();

      if (result.success) {
        setIsConnected(false);
        setConnectedRepo(null);
        setSuccess('Disconnected successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to disconnect');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Self-Healing CI/CD
          </h1>
          <p className="text-slate-400">Connect your GitHub repository</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          {!isConnected ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label
                  htmlFor="pat"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  GitHub Personal Access Token
                </label>
                <input
                  id="pat"
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Token needs: repo, workflow scopes
                </p>
              </div>

              <div>
                <label
                  htmlFor="repo"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Repository URL
                </label>
                <input
                  id="repo"
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !pat || !repoUrl}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect Repository'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-300">
                    Connected
                  </span>
                </div>
                <p className="text-green-200 font-mono text-sm">
                  {connectedRepo}
                </p>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-200">
                  <strong>Status:</strong> Ready for Webhooks
                </p>
                <p className="text-xs text-blue-300 mt-2">
                  Configure your webhook in GitHub repository settings to point
                  to:
                </p>
                <p className="text-xs text-blue-100 font-mono mt-1 break-all">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/api/webhook`
                    : 'Your webhook endpoint'}
                </p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300 mb-2">
                  Next Steps:
                </h3>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Add webhook URL to GitHub repository</li>
                  <li>Select workflow_run events</li>
                  <li>Use your GITHUB_WEBHOOK_SECRET</li>
                  <li>Self-healing will trigger on failed runs</li>
                </ul>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-600 text-red-300 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Phase 1: Foundation & Webhook Integration</p>
        </div>
      </div>
    </div>
  );
}
