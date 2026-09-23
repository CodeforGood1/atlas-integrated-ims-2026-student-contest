import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Activity,
  Database,
  FileText,
  Radio,
  ShieldCheck,
  Wind,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/common/KpiCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import useAtlasStore from '../store/useAtlasStore';

const API_BASE = '/api';
const INPUT_CLASS = 'w-full bg-white border-2 border-warm-200 rounded-[18px] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-warm-700 placeholder:text-warm-300 focus:outline-none focus:ring-4 focus:ring-copper-500/10 focus:border-copper-500/40 transition-all';

const TRUST_STATE_MAP = {
  TRUSTED: 'safe',
  OBSERVED: 'info',
  SUSPICIOUS: 'warning',
  QUARANTINED: 'danger',
  BANNED: 'danger',
};

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return '—';
  return parsed.toLocaleString();
}

function trustPercent(value) {
  if (typeof value !== 'number') return '—';
  return `${Math.round(value * 100)}%`;
}

function scorePercent(value) {
  if (typeof value !== 'number') return '—';
  return `${Math.round(value * 100)}%`;
}

function reachabilityStatus(value) {
  if (value === 'REACHABLE') return 'safe';
  if (value === 'UNREACHABLE') return 'danger';
  if (value === 'DEGRADED') return 'warning';
  return 'offline';
}

function severityStatus(value) {
  if (value === 'danger') return 'danger';
  if (value === 'warning') return 'warning';
  if (value === 'info') return 'info';
  return 'info';
}

function routeScoreStatus(value) {
  if (typeof value !== 'number') return 'info';
  if (value >= 0.8) return 'safe';
  if (value >= 0.6) return 'warning';
  return 'danger';
}

function totalEdges(graph) {
  if (!graph || typeof graph !== 'object') return 0;
  return Object.values(graph).reduce((sum, targets) => sum + (targets?.length || 0), 0);
}

export default function AegisOverview() {
  const {
    aegisOverview,
    fetchAegisOverview,
    aegisOverviewLoading,
    aegisOverviewError,
  } = useAtlasStore();
  const [probeForm, setProbeForm] = useState({ nodeId: '', address: '', protocol: 'TCP', port: '', path: '' });
  const [pingForm, setPingForm] = useState({
    nodeId: '',
  });
  const [observeForm, setObserveForm] = useState({
    key: '',
    latencyMs: '',
    packetLossRatio: '',
    reconnects: '',
  });
  const [probeLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [observeLoading, setObserveLoading] = useState(false);
  const [probeResult] = useState(null);
  const [probeError] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [pingError, setPingError] = useState(null);
  const [observeResult, setObserveResult] = useState(null);
  const [observeError, setObserveError] = useState(null);

  useEffect(() => {
    fetchAegisOverview();
    const interval = setInterval(fetchAegisOverview, 5000);
    return () => clearInterval(interval);
  }, [fetchAegisOverview]);

  const submitProbe = (event) => {
    event.preventDefault();
  };

  const submitPing = async (event) => {
    event.preventDefault();
    setPingLoading(true);
    setPingError(null);
    setPingResult(null);
    try {
      const res = await fetch(`${API_BASE}/aegis/network/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: pingForm.nodeId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPingResult(data);
    } catch (err) {
      setPingError(err.message ?? String(err));
    } finally {
      setPingLoading(false);
    }
  };

  const submitObservation = async (event) => {
    event.preventDefault();
    setObserveLoading(true);
    setObserveError(null);
    setObserveResult(null);
    const payload = {
      key: observeForm.key,
      latencyMs: Number(observeForm.latencyMs),
      packetLossRatio: Number(observeForm.packetLossRatio),
      reconnects: Number(observeForm.reconnects),
    };
    try {
      const res = await fetch(`${API_BASE}/aegis/network/observe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setObserveResult(data);
    } catch (err) {
      setObserveError(err.message ?? String(err));
    } finally {
      setObserveLoading(false);
    }
  };

  if (aegisOverviewLoading && !aegisOverview) {
    return (
      <div className="flex flex-col w-full h-full bg-[#F8FAFC]">
        <TopBar title="AEGIS Control Plane" subtitle="Synchronizing gateway intelligence" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="Streaming gateway telemetry..." />
        </div>
      </div>
    );
  }

  const summary = aegisOverview?.summary ?? {};
  const gateway = aegisOverview?.gateway ?? {};
  const devices = summary.devices ?? [];
  const gatewayHealth = gateway.health ?? {};
  const attacks = gateway.attacks ?? [];
  const baselines = gateway.baselines ?? {};
  const channels = gateway.channels ?? [];
  const logs = gateway.logs ?? [];
  const networkMap = gateway.network?.map ?? { nodes: [], links: [], routes: [] };
  const nodes = networkMap.nodes ?? [];
  const links = networkMap.links ?? [];
  const routes = networkMap.routes ?? [];
  const networkIntelligence = gateway.network?.intelligence ?? {};
  const networkFindings = networkIntelligence.findings ?? [];
  const routeScores = networkIntelligence.routeScores ?? [];
  const networkActions = gateway.network?.actions ?? [];
  const anomalyIds = summary.analytics?.anomalies ?? [];
  const causality = summary.analytics?.causality ?? {};

  const attackCount = attacks.reduce((sum, item) => sum + (item?.count || 0), 0);
  const baselineKeys = Object.keys(baselines).length;
  const baselineSamples = Object.values(baselines).reduce(
    (sum, stats) => sum + (stats?.latency?.count ?? 0),
    0,
  );
  const causalityEdges = totalEdges(causality);

  return (
    <div className="w-full min-h-full flex flex-col bg-[#F8FAFC]">
      <TopBar title="AEGIS Control Plane" subtitle="Device registry, trust posture, and gateway topology" />

      {aegisOverviewError && (
        <div className="mx-8 lg:mx-12 mt-4 p-4 bg-danger-500/10 border-2 border-danger-500/20 rounded-2xl flex items-center gap-4 text-danger-600">
          <AlertTriangle className="w-6 h-6" />
          <div className="flex-1">
            <p className="text-[13px] font-black uppercase tracking-widest">AEGIS Sync Warning</p>
            <p className="text-[11px] font-bold opacity-80 uppercase tracking-wider">{aegisOverviewError}</p>
          </div>
          <button
            onClick={() => fetchAegisOverview()}
            className="px-6 py-2 bg-danger-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            Retry Sync
          </button>
        </div>
      )}

      <div className="flex-1 p-8 lg:p-12 space-y-10 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <KpiCard icon={Database} label="Registered Devices" value={devices.length} status="info" delay={0} />
          <KpiCard icon={AlertTriangle} label="Attack Signals" value={attackCount} status={attackCount > 0 ? 'danger' : 'safe'} delay={1} />
          <KpiCard icon={Radio} label="Network Nodes" value={nodes.length} status="info" delay={2} />
          <KpiCard icon={Activity} label="Network Routes" value={routes.length} status="info" delay={3} />
          <KpiCard icon={Wind} label="Active Channels" value={channels.length} status="info" delay={4} />
          <KpiCard icon={ShieldCheck} label="Baseline Samples" value={baselineSamples} status={baselineSamples > 0 ? 'safe' : 'warning'} delay={5} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card lg:col-span-7 overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-warm-100 flex items-center justify-between">
              <div>
                <h3 className="section-title">Device Registry</h3>
                <p className="text-[11px] font-medium text-warm-400 mt-1 uppercase tracking-wider">Trust, policy, and state audit</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-safe-500/5 rounded-lg border border-safe-500/10 text-[10px] font-semibold text-safe-600">
                <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
              </div>
            </div>
            <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-50/50 border-b border-warm-100">
                    <th className="px-8 py-4 table-header">Device</th>
                    <th className="px-8 py-4 table-header">Type</th>
                    <th className="px-8 py-4 table-header">Trust</th>
                    <th className="px-8 py-4 table-header">State</th>
                    <th className="px-8 py-4 table-header">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {devices.length === 0 && (
                    <tr>
                      <td className="px-8 py-10 text-warm-400 italic" colSpan={5}>
                        Awaiting device ingress on the gateway.
                      </td>
                    </tr>
                  )}
                  {devices.map((device) => (
                    <tr key={device.deviceId} className="hover:bg-warm-50/50 transition-all">
                      <td className="px-8 py-4">
                        <span className="text-[14px] font-bold text-warm-900 uppercase tracking-tight">
                          {device.deviceId}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-[12px] font-semibold text-warm-500 uppercase tracking-wider">
                        {device.deviceType}
                      </td>
                      <td className="px-8 py-4 text-[13px] font-bold text-warm-900 tabular-nums">
                        {trustPercent(device.trust)}
                      </td>
                      <td className="px-8 py-4">
                        <StatusBadge
                          status={TRUST_STATE_MAP[device.state] ?? 'info'}
                          label={device.state?.replace('_', ' ') ?? 'UNKNOWN'}
                        />
                      </td>
                      <td className="px-8 py-4 text-[12px] font-semibold text-warm-400">
                        {formatDate(device.lastSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card lg:col-span-5 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-info-500/10 flex items-center justify-center text-info-600">
                  <Radio className="w-5.5 h-5.5" />
                </div>
                <h3 className="section-title">Gateway Topology</h3>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-warm-400">
                {gatewayHealth.mode ?? 'HYBRID'} / {gatewayHealth.runMode ?? 'SDK_EMBEDDED'}
              </div>
            </div>

            <div className="inner-card p-5 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-warm-500">
                <span>Nodes</span>
                <span className="text-warm-900 font-bold tabular-nums">{nodes.length}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-warm-500">
                <span>Links</span>
                <span className="text-warm-900 font-bold tabular-nums">{links.length}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-warm-500">
                <span>Routes</span>
                <span className="text-warm-900 font-bold tabular-nums">{routes.length}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {nodes.slice(0, 8).map((node) => (
                <div key={node.id} className="inner-card px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-warm-900 uppercase tracking-tight">{node.id}</p>
                    <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider">{node.kind} {node.segmentId ? `• ${node.segmentId}` : ''}</p>
                  </div>
                    <StatusBadge status={reachabilityStatus(node.reachability)} label={node.reachability} />
                </div>
              ))}
              {nodes.length === 0 && (
                <div className="text-warm-400 italic text-center py-10">No topology data yet.</div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-danger-500/10 flex items-center justify-center text-danger-600">
                <AlertTriangle className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Attack Intelligence</h3>
            </div>
            <div className="space-y-3 flex-1">
              {attacks.length === 0 && (
                <div className="text-warm-400 italic">No attack fingerprints learned yet.</div>
              )}
              {attacks.map((attack) => (
                <div key={attack.type} className="inner-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-warm-900 uppercase tracking-wide">{attack.type}</p>
                    <span className="text-[11px] font-bold text-danger-600 tabular-nums">{attack.count}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider mt-2">
                    Last Seen: {formatDate(attack.lastSeen)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-info-500/10 flex items-center justify-center text-info-600">
                <Activity className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Baseline Learning</h3>
            </div>
            <div className="space-y-3 flex-1">
              {baselineKeys === 0 && (
                <div className="text-warm-400 italic">Baseline models will appear after telemetry flow.</div>
              )}
              {Object.entries(baselines).slice(0, 6).map(([key, stats]) => (
                <div key={key} className="inner-card px-4 py-3">
                  <p className="text-[11px] font-bold text-warm-900 uppercase tracking-wide">{key}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-semibold text-warm-400 uppercase tracking-wider">
                    <span>Latency {Math.round(stats.latency?.mean ?? 0)}ms</span>
                    <span>Loss {Math.round((stats.packetLoss?.mean ?? 0) * 100)}%</span>
                    <span>Reconnect {Math.round(stats.reconnects?.mean ?? 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center text-warm-500">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Gateway Logs</h3>
            </div>
            <div className="space-y-3 flex-1">
              {logs.length === 0 && (
                <div className="text-warm-400 italic">No gateway logs captured yet.</div>
              )}
              {logs.slice(-6).reverse().map((log) => (
                <div key={log.id} className="inner-card px-4 py-3">
                  <p className="text-[11px] font-bold text-warm-900 uppercase tracking-wide">{log.type}</p>
                  <p className="text-[11px] text-warm-500 mt-1">{log.message}</p>
                  <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider mt-2">
                    {formatDate(log.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-info-500/10 flex items-center justify-center text-info-600">
                <Activity className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Adaptive Network Intelligence</h3>
            </div>
            <div className="space-y-3 flex-1">
              {networkFindings.length === 0 && (
                <div className="text-warm-400 italic">No network findings reported yet.</div>
              )}
              {networkFindings.slice(0, 6).map((finding) => (
                <div key={finding.id} className="inner-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-warm-900 uppercase tracking-wide">{finding.kind}</p>
                    <StatusBadge status={severityStatus(finding.severity)} label={finding.severity?.toUpperCase() ?? 'INFO'} />
                  </div>
                  <p className="text-[11px] text-warm-500 mt-2">{finding.message}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-safe-500/10 flex items-center justify-center text-safe-600">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Action Plans</h3>
            </div>
            <div className="space-y-3 flex-1">
              {networkActions.length === 0 && (
                <div className="text-warm-400 italic">No adaptive actions suggested yet.</div>
              )}
              {networkActions.slice(0, 6).map((action) => (
                <div key={action.id} className="inner-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-warm-900 uppercase tracking-wide">{action.kind}</p>
                    <StatusBadge status={severityStatus(action.severity)} label={action.severity?.toUpperCase() ?? 'INFO'} />
                  </div>
                  <p className="text-[11px] text-warm-500 mt-2">{action.message}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-copper-500/10 flex items-center justify-center text-copper-600">
                <Radio className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Route Scoring</h3>
            </div>
            <div className="space-y-3 flex-1">
              {routeScores.length === 0 && (
                <div className="text-warm-400 italic">No scored routes yet.</div>
              )}
              {routeScores.slice(0, 6).map((route) => (
                <div key={`${route.destination}-${route.nextHop}-${route.protocol}`} className="inner-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-warm-900 uppercase tracking-wide">{route.destination}</p>
                    <StatusBadge status={routeScoreStatus(route.score)} label={scorePercent(route.score)} />
                  </div>
                  <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider mt-2">
                    {route.nextHop} • {route.protocol} • metric {route.metric}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-safe-500/10 flex items-center justify-center text-safe-600">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="section-title">Quick Ping</h3>
                <p className="text-[11px] font-medium text-warm-400 mt-1 uppercase tracking-wider">POST /aegis/network/ping</p>
              </div>
            </div>
            <form onSubmit={submitPing} className="space-y-4">
              <input
                className={INPUT_CLASS}
                placeholder="Node ID (registered test or real device)"
                value={pingForm.nodeId}
                onChange={(event) => setPingForm({ nodeId: event.target.value })}
                required
              />
              <button
                type="submit"
                className="px-5 py-2 bg-safe-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider"
                disabled={pingLoading}
              >
                {pingLoading ? 'Pinging...' : 'Ping by Node ID'}
              </button>
              {pingError && (
                <p className="text-[11px] font-semibold text-danger-600">{pingError}</p>
              )}
              {pingResult && (
                <div className="inner-card px-4 py-3 text-[11px] text-warm-600">
                  <p>Reachable: {pingResult.reachable ? 'YES' : 'NO'}</p>
                  <p>Latency: {pingResult.latencyMs ?? '—'} ms</p>
                  {pingResult.error && <p>Error: {pingResult.error}</p>}
                </div>
              )}
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-info-500/10 flex items-center justify-center text-info-600">
                <Radio className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="section-title">Disabled Probe</h3>
                <p className="text-[11px] font-medium text-warm-400 mt-1 uppercase tracking-wider">Disabled in this deployment</p>
              </div>
            </div>
            <form onSubmit={submitProbe} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={INPUT_CLASS}
                  placeholder="Node ID"
                  value={probeForm.nodeId}
                  onChange={(event) => setProbeForm({ ...probeForm, nodeId: event.target.value })}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Address (IP or host)"
                  value={probeForm.address}
                  onChange={(event) => setProbeForm({ ...probeForm, address: event.target.value })}
                  required
                />
                <select
                  className={INPUT_CLASS}
                  value={probeForm.protocol}
                  onChange={(event) => setProbeForm({ ...probeForm, protocol: event.target.value })}
                >
                  <option value="TCP">TCP</option>
                  <option value="HTTP">HTTP</option>
                  <option value="APP_HEARTBEAT">APP_HEARTBEAT</option>
                </select>
                <input
                  className={INPUT_CLASS}
                  placeholder="Port (optional)"
                  value={probeForm.port}
                  onChange={(event) => setProbeForm({ ...probeForm, port: event.target.value })}
                />
                <input
                  className={`${INPUT_CLASS} md:col-span-2`}
                  placeholder="Path (optional)"
                  value={probeForm.path}
                  onChange={(event) => setProbeForm({ ...probeForm, path: event.target.value })}
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-info-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider"
                disabled={probeLoading}
              >
                {probeLoading ? 'Probing...' : 'Run Probe'}
              </button>
              {probeError && (
                <p className="text-[11px] font-semibold text-danger-600">{probeError}</p>
              )}
              {probeResult && (
                <div className="inner-card px-4 py-3 text-[11px] text-warm-600">
                  <p>Reachable: {probeResult.reachable ? 'YES' : 'NO'}</p>
                  <p>Latency: {probeResult.latencyMs ?? '—'} ms</p>
                  {probeResult.error && <p>Error: {probeResult.error}</p>}
                </div>
              )}
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-copper-500/10 flex items-center justify-center text-copper-600">
                <Activity className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="section-title">Network Observation</h3>
                <p className="text-[11px] font-medium text-warm-400 mt-1 uppercase tracking-wider">POST /aegis/network/observe</p>
              </div>
            </div>
            <form onSubmit={submitObservation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className={`${INPUT_CLASS} md:col-span-2`}
                  placeholder="Key (segment:transport)"
                  value={observeForm.key}
                  onChange={(event) => setObserveForm({ ...observeForm, key: event.target.value })}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Latency ms"
                  value={observeForm.latencyMs}
                  onChange={(event) => setObserveForm({ ...observeForm, latencyMs: event.target.value })}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Packet loss ratio"
                  value={observeForm.packetLossRatio}
                  onChange={(event) => setObserveForm({ ...observeForm, packetLossRatio: event.target.value })}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Reconnects"
                  value={observeForm.reconnects}
                  onChange={(event) => setObserveForm({ ...observeForm, reconnects: event.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-copper-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider"
                disabled={observeLoading}
              >
                {observeLoading ? 'Submitting...' : 'Submit Observation'}
              </button>
              {observeError && (
                <p className="text-[11px] font-semibold text-danger-600">{observeError}</p>
              )}
              {observeResult && (
                <div className="inner-card px-4 py-3 text-[11px] text-warm-600">
                  <p>Samples: {observeResult.samples ?? '—'}</p>
                  <p>Latency deviation: {observeResult.latencyDeviation ? 'YES' : 'NO'}</p>
                  <p>Packet loss deviation: {observeResult.packetLossDeviation ? 'YES' : 'NO'}</p>
                  <p>Reconnect deviation: {observeResult.reconnectDeviation ? 'YES' : 'NO'}</p>
                </div>
              )}
            </form>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card lg:col-span-7 p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-copper-500/10 flex items-center justify-center text-copper-600">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Fleet Analytics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="inner-card p-4">
                <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Anomalies</p>
                <p className="text-[22px] font-bold text-warm-900 mt-2 tabular-nums">{anomalyIds.length}</p>
              </div>
              <div className="inner-card p-4">
                <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Causality Edges</p>
                <p className="text-[22px] font-bold text-warm-900 mt-2 tabular-nums">{causalityEdges}</p>
              </div>
              <div className="inner-card p-4">
                <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Cloud Sync</p>
                <p className="text-[12px] font-bold text-warm-900 mt-2">
                  {summary.cloud?.enabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-[10px] text-warm-400 uppercase tracking-wider mt-1">
                  Endpoint {summary.cloud?.endpointConfigured ? 'Ready' : 'Unset'}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wider">Anomaly Targets</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {anomalyIds.length === 0 && (
                  <span className="text-[11px] text-warm-400 italic">No fleet anomalies detected.</span>
                )}
                {anomalyIds.map((deviceId) => (
                  <span
                    key={deviceId}
                    className="px-3 py-1 rounded-xl bg-warning-500/10 border border-warning-500/20 text-warning-600 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {deviceId}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card lg:col-span-5 p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-safe-500/10 flex items-center justify-center text-safe-600">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <h3 className="section-title">Enrollment Quickstart</h3>
            </div>
            <div className="inner-card p-4">
              <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wider mb-3">
                POST /ingest
              </p>
              <pre className="text-[11px] text-warm-700 bg-white rounded-xl p-4 border border-warm-200 overflow-x-auto">
{`{
  "device_id": "node_14",
  "device_type": "node",
  "event_kind": "SENSOR_EVENT",
  "payload": {
    "temperature": 35.2,
    "mq135": 420,
    "mq7": 110
  },
  "metadata": {
    "segmentId": "lan-east",
    "address": "10.0.1.24"
  }
}`}
              </pre>
              <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider mt-3">
                Auto-registers devices and updates trust, policies, and topology.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
