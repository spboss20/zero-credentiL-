import React, { useEffect, useState } from 'react';
import {
  Terminal,
  Key,
  Webhook,
  Activity,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { ApiAuditLog, ApiKeyItem, WebhookConfig } from '../types/index.ts';

export const DeveloperPortal: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<{ key: ApiKeyItem; fullSecret: string } | null>(null);

  // Key creation state
  const [keyName, setKeyName] = useState('');
  const [keyEnv, setKeyEnv] = useState<'development' | 'production'>('development');
  const [creatingKey, setCreatingKey] = useState(false);

  // Webhook creation state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'logs' | 'docs'>('keys');

  const loadDeveloperData = async () => {
    try {
      const [kRes, wRes, lRes] = await Promise.all([
        api.getApiKeys(),
        api.getWebhooks(),
        api.getAuditLogs(),
      ]);
      setKeys(kRes.keys);
      setWebhooks(wRes.webhooks);
      setLogs(lRes.logs);
    } catch (err) {
      console.error('Developer data load error:', err);
    }
  };

  useEffect(() => {
    loadDeveloperData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    setCreatingKey(true);
    try {
      const res = await api.createApiKey(keyName, keyEnv);
      setNewKeyResult({ key: res.key, fullSecret: (res.key as any).key });
      setKeyName('');
      loadDeveloperData();
    } catch (err: any) {
      alert(`Key creation error: ${err.message}`);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Services using it will be denied access immediately.')) return;
    try {
      await api.revokeApiKey(id);
      loadDeveloperData();
    } catch (err: any) {
      alert(`Revocation error: ${err.message}`);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;
    setCreatingWebhook(true);
    try {
      await api.createWebhook(webhookUrl, ['credential.presented', 'verification.completed']);
      setWebhookUrl('');
      loadDeveloperData();
    } catch (err: any) {
      alert(`Webhook registration error: ${err.message}`);
    } finally {
      setCreatingWebhook(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Developer Console & API Management
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Secure machine-to-machine credentials, real-time webhooks, and live cryptographic verification logs.
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-8 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">ACTIVE API KEYS</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{keys.length}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">WEBHOOKS</span>
            <span className="text-xl font-bold text-indigo-600 font-mono tabular-nums">{webhooks.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('keys')}
          className={`pb-3 px-1 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'keys'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          API Keys ({keys.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'webhooks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Webhook className="w-3.5 h-3.5" />
          Webhooks ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'docs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Code Samples
        </button>
      </div>

      {/* Tab 1: API Keys */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          
          {/* Create new key card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900">Create New Service API Key</h2>
            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production Verification Microservice"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <select
                value={keyEnv}
                onChange={(e) => setKeyEnv(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="development">Development (zp_test_...)</option>
                <option value="production">Production (zp_live_...)</option>
              </select>
              <button
                type="submit"
                disabled={creatingKey}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
              >
                {creatingKey ? 'Creating...' : 'Create API Key'}
              </button>
            </form>
          </div>

          {/* New key revealed alert */}
          {newKeyResult && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Save Your Secret Key Now</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                For security reasons, this secret is hashed with SHA-256 and will never be shown again.
              </p>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 font-mono text-xs">
                <span className="text-slate-900 select-all break-all">{newKeyResult.fullSecret}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newKeyResult.fullSecret);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="ml-3 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Copied' : 'Copy Key'}
                </button>
              </div>
              <button
                onClick={() => setNewKeyResult(null)}
                className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline"
              >
                I have stored this secret key safely
              </button>
            </div>
          )}

          {/* Existing Keys Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Active Service Keys
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {keys.map((k) => (
                <div key={k.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{k.name}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {k.environment}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-500">{k.prefix}</div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="text-[11px]">Created {new Date(k.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900">Register Webhook Endpoint</h2>
            <form onSubmit={handleCreateWebhook} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/v1/zeropass-webhooks"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={creatingWebhook}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
              >
                {creatingWebhook ? 'Registering...' : 'Add Webhook'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {webhooks.map((w) => (
                <div key={w.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-900">{w.url}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Events: {w.events.join(', ')}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px]">Secret: {w.secret.slice(0, 12)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Verification Engine Requests ({logs.length})
            </span>
            <button
              onClick={loadDeveloperData}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-mono">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${
                    log.statusCode < 300 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {log.statusCode}
                  </span>
                  <span className="text-slate-500 font-semibold">{log.method}</span>
                  <span className="text-slate-900">{log.endpoint}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                  <span>{log.durationMs}ms</span>
                  <span>{log.ip}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Code Samples */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              cURL: Issue a W3C Verifiable Credential (Issuer Desk)
            </h3>
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`curl -X POST https://your-zeropass-domain/api/credentials \\
  -H "Authorization: Bearer zp_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "schemaType": "StudentStatusCredential",
    "holderDid": "did:zeropass:holder-sp-8842",
    "claims": {
      "fullName": "Saksham Patwa",
      "studentId": "APU-2024-8849",
      "gpa": 3.92,
      "enrollmentStatus": "Active"
    },
    "expirationDays": 365
  }'`}
            </pre>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              TypeScript: Server-Side Cryptographic Verification Policy
            </h3>
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`import { verifyCredentialJwt, evaluatePredicate } from './crypto';

// 1. Audit ES256 Issuer Signature mathematically
const { isValid, payload } = await verifyCredentialJwt(presentationJwt);

// 2. Validate Zero-Knowledge Predicates without raw data
const ageResult = evaluatePredicate(payload.vc.credentialSubject.dateOfBirth, {
  attribute: "dateOfBirth",
  operator: ">=",
  value: 18
});

console.log("Eligible:", isValid && ageResult.satisfied);`}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
