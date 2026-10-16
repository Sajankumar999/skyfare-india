import React, { useEffect, useState } from 'react';
import {
  Server,
  AlertOctagon,
  DownloadCloud,
  Key,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  Copy,
  Trash2,
  Plus,
  ArrowUpRight,
  Sliders,
  AlertTriangle,
  Hash,
  Database,
  Eye
} from 'lucide-react';
import { MospiBulletinModal } from './MospiBulletinModal';
import { apiUrl } from '../config/api';

export type AdminSubSection = 'scraper' | 'quarantine' | 'export' | 'api_keys';

interface AdminDashboardProps {
  initialSubSection?: AdminSubSection;
}

interface ScraperChannel {
  id: string;
  name: string;
  type: 'Direct Airline NDC' | 'Online Travel Agency (OTA)' | 'Global Distribution System (GDS)';
  status: 'RUNNING' | 'STOPPED' | 'RATE_LIMITED';
  quotesIngestedToday: number;
  latencyMs: number;
  errorRatePct: number;
  workerThreads: number;
  lastBatchTime: string;
}

interface QuarantinedQuote {
  id: string;
  corridor: string;
  carrier: string;
  flightNo: string;
  quotedFare: number;
  expectedRange: string;
  reason: string;
  severity: 'FAT_FINGER' | 'ZERO_FARE' | 'NEGATIVE_TAX' | 'TARIFF_ANOMALY';
  timestamp: string;
  confidenceScore: number;
}

interface ApiKeyItem {
  id: string;
  name: string;
  clientMinistry: string;
  keyPrefix: string;
  rateLimit: string;
  status: 'ACTIVE' | 'REVOKED';
  createdAt: string;
  lastUsed: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialSubSection = 'scraper' }) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubSection>(initialSubSection);
  const [isBulletinOpen, setIsBulletinOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [workerStatus, setWorkerStatus] = useState<{
    state: string;
    observations_count: number;
    last_run_status: string | null;
  } | null>(null);
  const [workerApiConnected, setWorkerApiConnected] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadWorkerStatus = async () => {
      try {
        const token = sessionStorage.getItem('skyfare_admin_token') || '';
        const response = await fetch(apiUrl('/api/v1/worker/status'), {
          signal: controller.signal,
          headers: {
            'X-Admin-Token': token,
          },
        });
        if (!response.ok) throw new Error(`Worker status responded with ${response.status}`);
        const payload: unknown = await response.json();
        if (
          typeof payload !== 'object' ||
          payload === null ||
          typeof (payload as { state?: unknown }).state !== 'string' ||
          !Number.isFinite(Number((payload as { observations_count?: unknown }).observations_count))
        ) {
          throw new Error('Invalid worker status response');
        }
        setWorkerStatus(payload as {
          state: string;
          observations_count: number;
          last_run_status: string | null;
        });
        setWorkerApiConnected(true);
      } catch (error) {
        if (!controller.signal.aborted) setWorkerApiConnected(false);
      }
    };
    void loadWorkerStatus();
    const interval = window.setInterval(loadWorkerStatus, 10000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  // 1. Scraper Fleet Controller State
  const [channels, setChannels] = useState<ScraperChannel[]>([
    {
      id: 'sc-1',
      name: 'IndiGo Direct NDC API',
      type: 'Direct Airline NDC',
      status: 'RUNNING',
      quotesIngestedToday: 14200,
      latencyMs: 98,
      errorRatePct: 0.12,
      workerThreads: 16,
      lastBatchTime: 'Just now (12s ago)',
    },
    {
      id: 'sc-2',
      name: 'Air India Enterprise Direct API',
      type: 'Direct Airline NDC',
      status: 'RUNNING',
      quotesIngestedToday: 8940,
      latencyMs: 124,
      errorRatePct: 0.28,
      workerThreads: 12,
      lastBatchTime: '1 min ago',
    },
    {
      id: 'sc-3',
      name: 'Cleartrip Ingestion Gateway',
      type: 'Online Travel Agency (OTA)',
      status: 'RUNNING',
      quotesIngestedToday: 6120,
      latencyMs: 185,
      errorRatePct: 0.45,
      workerThreads: 8,
      lastBatchTime: '2 mins ago',
    },
    {
      id: 'sc-4',
      name: 'EaseMyTrip Live Stream',
      type: 'Online Travel Agency (OTA)',
      status: 'RUNNING',
      quotesIngestedToday: 3450,
      latencyMs: 210,
      errorRatePct: 0.52,
      workerThreads: 6,
      lastBatchTime: '3 mins ago',
    },
    {
      id: 'sc-5',
      name: 'MakeMyTrip Rate Collector',
      type: 'Online Travel Agency (OTA)',
      status: 'STOPPED',
      quotesIngestedToday: 2551,
      latencyMs: 160,
      errorRatePct: 0.31,
      workerThreads: 6,
      lastBatchTime: '45 mins ago',
    },
  ]);

  const toggleChannelStatus = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const nextStatus = ch.status === 'RUNNING' ? 'STOPPED' : 'RUNNING';
          showToast(`${ch.name} state transitioned to ${nextStatus}.`);
          return { ...ch, status: nextStatus };
        }
        return ch;
      })
    );
  };

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const handleTriggerSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const token = sessionStorage.getItem('skyfare_admin_token') || '';
      const response = await fetch(apiUrl('/api/v1/worker/trigger-now'), {
        method: 'POST',
        headers: {
          'X-Admin-Token': token,
        },
      });
      if (!response.ok) throw new Error(`Worker trigger responded with ${response.status}`);
      const payload = await response.json() as { message?: string };
      showToast(payload.message || 'Ingestion run triggered.');
    } catch (error) {
      showToast('Backend unavailable; scheduled demo pull completed locally.');
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      showToast('Demo ingestion pull completed.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // 2. Data Quarantine Zone State
  const [quarantinedQuotes, setQuarantinedQuotes] = useState<QuarantinedQuote[]>([
    {
      id: 'QZ-8491',
      corridor: 'BOM-DEL',
      carrier: 'Air India',
      flightNo: 'AI-806',
      quotedFare: 99999,
      expectedRange: '₹6,000 - ₹18,000',
      reason: 'Fat-finger manual entry irregularity (Fare > 5x corridor ceiling).',
      severity: 'FAT_FINGER',
      timestamp: '22 Sept 2026 13:42 IST',
      confidenceScore: 99.8,
    },
    {
      id: 'QZ-8492',
      corridor: 'DEL-BLR',
      carrier: 'IndiGo',
      flightNo: '6E-2041',
      quotedFare: 0,
      expectedRange: '₹5,200 - ₹14,000',
      reason: 'Phantom zero fare published before inventory lock release.',
      severity: 'ZERO_FARE',
      timestamp: '22 Sept 2026 12:15 IST',
      confidenceScore: 100.0,
    },
    {
      id: 'QZ-8493',
      corridor: 'CCU-DEL',
      carrier: 'SpiceJet',
      flightNo: 'SG-223',
      quotedFare: 1100,
      expectedRange: '₹4,500 - ₹12,000',
      reason: 'Missing mandated Airport UDF + PSF levies in breakdown structure.',
      severity: 'TARIFF_ANOMALY',
      timestamp: '22 Sept 2026 11:30 IST',
      confidenceScore: 94.2,
    },
  ]);

  const handleApproveQuarantine = (id: string) => {
    setQuarantinedQuotes((prev) => prev.filter((q) => q.id !== id));
    showToast(`Quote ${id} approved and merged into official MoSPI index run.`);
  };

  const handlePurgeQuarantine = (id: string) => {
    setQuarantinedQuotes((prev) => prev.filter((q) => q.id !== id));
    showToast(`Quote ${id} permanently purged with SHA-256 audit log.`);
  };

  // 3. API Key Management State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key-1',
      name: 'Reserve Bank of India (MPC Division)',
      clientMinistry: 'RBI Monetary Policy Committee',
      keyPrefix: 'rbi_mpc_live_94f8••••••••',
      rateLimit: '10,000 req/day',
      status: 'ACTIVE',
      createdAt: '01 Aug 2026',
      lastUsed: '4 mins ago',
    },
    {
      id: 'key-2',
      name: 'NITI Aayog Macro Modeling Unit',
      clientMinistry: 'NITI Aayog',
      keyPrefix: 'niti_aayog_macro_32c1••••••••',
      rateLimit: '5,000 req/day',
      status: 'ACTIVE',
      createdAt: '15 Aug 2026',
      lastUsed: '28 mins ago',
    },
    {
      id: 'key-3',
      name: 'DGCA Tariff Enforcement Cell',
      clientMinistry: 'Directorate General of Civil Aviation',
      keyPrefix: 'dgca_rule135_81b9••••••••',
      rateLimit: '25,000 req/day',
      status: 'ACTIVE',
      createdAt: '10 July 2026',
      lastUsed: 'Just now',
    },
  ]);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyMinistry, setNewKeyMinistry] = useState('Ministry of Finance');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      clientMinistry: newKeyMinistry,
      keyPrefix: `mospi_api_${randomSuffix}••••••••`,
      rateLimit: '5,000 req/day',
      status: 'ACTIVE',
      createdAt: 'Today',
      lastUsed: 'Never',
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName('');
    setIsGeneratingKey(false);
    showToast(`Bearer Token created for ${newKey.name}. Rate limit: 5,000 req/day.`);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'REVOKED' } : k))
    );
    showToast('API key access token successfully revoked.');
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
              Admin Restricted Area
            </span>
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold">
              MoSPI Statistical Officer - Price Statistics Division
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Official MoSPI Administration Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ROLE: MoSPI Statistical Officer - Price Statistics Division</span>
          </div>
        </div>
      </div>

      {/* Admin Module Switcher Tabs */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto w-full">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            id="admin-tab-scraper"
            onClick={() => setActiveSubTab('scraper')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'scraper'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>1. Scraper Fleet Controller</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              5 Ingest Nodes
            </span>
          </button>

          <button
            id="admin-tab-quarantine"
            onClick={() => setActiveSubTab('quarantine')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'quarantine'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>2. Data Quarantine Zone</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
              {quarantinedQuotes.length} Pending
            </span>
          </button>

          <button
            id="admin-tab-export"
            onClick={() => setActiveSubTab('export')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'export'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>3. MoSPI Export Engine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              PDF / CSV
            </span>
          </button>

          <button
            id="admin-tab-api"
            onClick={() => setActiveSubTab('api_keys')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'api_keys'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>4. API Key Management</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {apiKeys.filter((k) => k.status === 'ACTIVE').length} Active
            </span>
          </button>
        </div>
      </div>

      {/* MODULE 1: SCRAPER FLEET CONTROLLER */}
      {activeSubTab === 'scraper' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 block">Fleet Worker Threads</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                48 Threads
              </div>
              <span className="text-xs text-emerald-600 font-semibold">100% capacity deployed</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 block">Ingestion Velocity</span>
              <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                1,420 q/min
              </div>
              <span className="text-xs text-slate-500">Real-time domestic quotes</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 block">Daily Ingest Volume</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                35,261
              </div>
              <span className="text-xs text-slate-500">Verified today</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 block">Ingest Network Latency</span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                135 ms
              </div>
              <span className="text-xs text-emerald-600 font-semibold">Optimal API throughput</span>
            </div>
          </div>

          {/* Action Trigger Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  Real-Time Channel Controllers
                </h3>
                <p className="text-xs text-slate-500">
                  Manage high-frequency scraper daemons, pause individual OTA feeds, or trigger synchronous audit batches
                </p>
              </div>

              <div className="flex items-center gap-2">
                {workerApiConnected && workerStatus && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    API: {workerStatus.state} · {workerStatus.observations_count.toLocaleString('en-IN')} quotes
                  </span>
                )}
                <button
                  id="btn-trigger-sync-all"
                  onClick={handleTriggerSyncAll}
                  disabled={isSyncingAll}
                  className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Executing Pull...' : 'Trigger Synchronous Ingestion Pull'}</span>
                </button>
              </div>
            </div>

            {/* Channels Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3 pr-4">Channel & Ingest Source</th>
                    <th className="pb-3 px-3">Connection Type</th>
                    <th className="pb-3 px-3 text-right">Quotes Today</th>
                    <th className="pb-3 px-3 text-right">Latency</th>
                    <th className="pb-3 px-3 text-right">Error Rate</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 pl-4 text-right">Daemon Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {channels.map((ch) => {
                    const isRunning = ch.status === 'RUNNING';
                    return (
                      <tr key={ch.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-slate-900 dark:text-white">{ch.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Threads: {ch.workerThreads} • Last batch: {ch.lastBatchTime}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                          {ch.type}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {ch.quotesIngestedToday.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          {ch.latencyMs} ms
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {ch.errorRatePct}%
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isRunning
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {ch.status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            id={`btn-toggle-channel-${ch.id}`}
                            onClick={() => toggleChannelStatus(ch.id)}
                            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                              isRunning
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {isRunning ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Halt Daemon</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Start Daemon</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: DATA QUARANTINE ZONE */}
      {activeSubTab === 'quarantine' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-extrabold text-sm">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Algorithmic Isolation Protocol (Quality Assurance Shield)</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Price quotes flagged with severe statistical irregularities, fat-finger airline entry errors, or missing statutory tax elements are isolated here before they can contaminate the National Airfare Index or CPI baselines.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Quarantined Quotes Pending Inspection ({quarantinedQuotes.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Review and choose whether to override and approve, or permanently purge with audit trail
                </p>
              </div>
            </div>

            {quarantinedQuotes.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Quarantine Zone Clear
                </h4>
                <p>No irregular quotes currently isolated. All ingested quotes pass standard deviation checks.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <th className="pb-3 pr-4">Quarantine ID</th>
                      <th className="pb-3 px-3">Corridor & Flight</th>
                      <th className="pb-3 px-3 text-right">Quoted Fare</th>
                      <th className="pb-3 px-3 text-right">Expected Normal</th>
                      <th className="pb-3 px-3">Irregularity Reason</th>
                      <th className="pb-3 px-3 text-center">Confidence</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {quarantinedQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                          {q.id}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{q.corridor}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{q.carrier} • {q.flightNo}</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                          ₹{q.quotedFare.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                          {q.expectedRange}
                        </td>
                        <td className="py-3.5 px-3 max-w-xs text-slate-600 dark:text-slate-300">
                          {q.reason}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {q.confidenceScore}%
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-approve-quote-${q.id}`}
                              onClick={() => handleApproveQuarantine(q.id)}
                              title="Approve to National Index Run"
                              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              id={`btn-purge-quote-${q.id}`}
                              onClick={() => handlePurgeQuarantine(q.id)}
                              title="Permanently Purge Quote"
                              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 font-bold transition-colors cursor-pointer"
                            >
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 3: OFFICIAL MOSPI EXPORT ENGINE */}
      {activeSubTab === 'export' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-indigo-600" />
                Official MoSPI Statistical Bulletin & Data Packaging Engine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate authenticated public bulletins, high-frequency CSV dumps, and DGCA Form 1-B regulatory archives
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Export 1: MoSPI Daily Statistical Bulletin PDF */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      PDF DOCUMENT
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    MoSPI Daily Statistical Bulletin
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Formatted official release with Laspeyres & Fisher Ideal index, transport CPI impact, and top moving corridors.
                  </p>
                </div>
                <button
                  id="btn-admin-view-pdf"
                  onClick={() => setIsBulletinOpen(true)}
                  className="min-h-[44px] w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect & Print Bulletin</span>
                </button>
              </div>

              {/* Export 2: Daily Quotes CSV Dataset */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Database className="w-6 h-6 text-emerald-600" />
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      CSV / JSON
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Raw Price Quotes Ingestion Dump
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Complete 35,261 daily quotes dataset with unbundled base fare, ATF surcharges, UDF/PSF fees, and SHA-256 Merkle root.
                  </p>
                </div>
                <button
                  id="btn-admin-export-csv"
                  onClick={() => showToast('Generated and downloaded skyfare-daily-quotes-20260914.csv (4.8 MB).')}
                  className="min-h-[44px] w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Download Raw CSV Dump</span>
                </button>
              </div>

              {/* Export 3: DGCA Form 1-B Archive */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <ShieldCheck className="w-6 h-6 text-purple-600" />
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      REGULATORY
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    DGCA Rule 135 Compliance Pack
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Statutory filing for Civil Aviation Ministry detailing corridor tariff bands, dynamic pricing variance, and surge irregularities.
                  </p>
                </div>
                <button
                  id="btn-admin-export-dgca"
                  onClick={() => showToast('Generated DGCA Form 1-B Compliance Archive package (ZIP).')}
                  className="min-h-[44px] w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Export DGCA Form 1-B</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: API KEY MANAGEMENT */}
      {activeSubTab === 'api_keys' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Bar with Add Key */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  Ministry & Regulator API Tokens
                </h3>
                <p className="text-xs text-slate-500">
                  Provision high-frequency machine-to-machine REST API access tokens for external institutions (RBI, NITI Aayog, DGCA)
                </p>
              </div>

              <button
                id="btn-open-create-key"
                onClick={() => setIsGeneratingKey(!isGeneratingKey)}
                className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue New API Token</span>
              </button>
            </div>

            {/* Create Key Form (Collapsible) */}
            {isGeneratingKey && (
              <form onSubmit={handleCreateApiKey} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-fadeIn">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Issue Machine-to-Machine Bearer Token
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Client Description / Service Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RBI MPC Nowcasting Engine"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Authorized Department
                    </label>
                    <select
                      value={newKeyMinistry}
                      onChange={(e) => setNewKeyMinistry(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="Reserve Bank of India">Reserve Bank of India (RBI)</option>
                      <option value="NITI Aayog">NITI Aayog (Macroeconomics)</option>
                      <option value="Directorate General of Civil Aviation">DGCA (Tariff Cell)</option>
                      <option value="Ministry of Finance">Ministry of Finance (DEA)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsGeneratingKey(false)}
                    className="min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                  >
                    Generate & Authorize Token
                  </button>
                </div>
              </form>
            )}

            {/* Keys Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3 pr-4">Client Service</th>
                    <th className="pb-3 px-3">Authorized Ministry</th>
                    <th className="pb-3 px-3">Bearer Token Prefix</th>
                    <th className="pb-3 px-3 text-right">Rate Limit</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 pl-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apiKeys.map((k) => {
                    const isActive = k.status === 'ACTIVE';
                    return (
                      <tr key={k.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                          {k.name}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Issued: {k.createdAt} • Last active: {k.lastUsed}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                          {k.clientMinistry}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {k.keyPrefix}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {k.rateLimit}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {k.status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          {isActive ? (
                            <button
                              id={`btn-revoke-key-${k.id}`}
                              onClick={() => handleRevokeKey(k.id)}
                              className="min-h-[36px] px-2.5 py-1 text-xs font-bold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Revoked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bulletin Modal */}
      <MospiBulletinModal
        isOpen={isBulletinOpen}
        onClose={() => setIsBulletinOpen(false)}
      />
    </div>
  );
};
