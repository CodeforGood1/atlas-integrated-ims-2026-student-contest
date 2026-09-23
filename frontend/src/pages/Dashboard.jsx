import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  Wind, 
  Activity, 
  Radio, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GaugeChart from '../components/charts/GaugeChart';
import useAtlasStore from '../store/useAtlasStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    nodes = [],
    workers = [],
    ppe,
    alerts = [],
    alertLog = [],
    getNodeStatus,
    isLoading,
    error,
    dataSource,
    systemStatus,
    lastFetchMs,
    uptimeMs,
    testMode,
  } = useAtlasStore();

  const activeNodes = nodes.length;
  const totalWorkers = workers.length;
  const dangerAlerts = alerts.filter((a) => a.severity === 'danger').length;
  const avgMq135 = nodes.length ? Math.round(nodes.reduce((s, n) => s + Number(n.mq135 || 0), 0) / nodes.length) : '—';
  const avgHR = workers.length ? Math.round(workers.reduce((s, w) => s + w.heart_rate, 0) / workers.length) : '—';
  const aiStatus = systemStatus?.ai?.builtIn;
  const aiLoaded = aiStatus && (aiStatus.gas_model === 'loaded' || aiStatus.fire_model === 'loaded');
  const aiEngineLabel = aiStatus
    ? `${aiStatus.gas_model || 'unknown'} / ${aiStatus.fire_model || 'unknown'}`
    : 'Unavailable';
  const aegisState = systemStatus?.aegis?.status || 'unavailable';
  const uptime = formatUptime(uptimeMs);

  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex flex-col w-full h-full bg-[#F8FAFC]">
        <TopBar title="Operational Center" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="Interrogating sensor hubs..." />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col bg-[#F8FAFC]">
      <TopBar title="Operational Center" subtitle="Real-time industrial monitoring & environmental safety" />
      
      {error && (
        <div className="mx-8 lg:mx-12 mt-4 p-4 bg-danger-500/10 border-2 border-danger-500/20 rounded-2xl flex items-center gap-4 text-danger-600">
          <AlertTriangle className="w-6 h-6" />
          <div className="flex-1">
            <p className="text-[13px] font-black uppercase tracking-widest">Network Interruption</p>
            <p className="text-[11px] font-bold opacity-80 uppercase tracking-wider">{error}</p>
          </div>
          <button onClick={() => useAtlasStore.getState().fetchData()} className="px-6 py-2 bg-danger-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Retry Connection</button>
        </div>
      )}
      
      <div className="flex-1 p-8 lg:p-12 space-y-10 w-full max-w-[1600px] mx-auto">
        
        {/* ROW 1: KPI GRID - 5 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <KpiCard icon={Users} label="On-Site Deployment" value={totalWorkers} unit="Active" status="info" delay={0} />
          <KpiCard icon={AlertTriangle} label="Active Hazards" value={dangerAlerts} status={dangerAlerts > 0 ? 'danger' : 'safe'} delay={1} />
          <KpiCard icon={Wind} label="MQ135 Air" value={avgMq135} unit="raw" status={Number(avgMq135) >= 800 ? 'danger' : Number(avgMq135) >= 600 ? 'warning' : 'safe'} delay={2} />
          <KpiCard icon={Activity} label="Health Index" value={avgHR} unit="bpm" status="info" delay={3} />
          <KpiCard icon={Radio} label="Sensor Nodes" value={activeNodes} unit="Node" status="info" delay={4} />
        </div>

        {/* ROW 2: MAIN ANALYTICS - 70/30 SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT 70%: Environmental Fusion Panel */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card h-full flex flex-col"
            >
              <div className="px-8 py-6 border-b border-warm-100 flex items-center justify-between">
                <div>
                  <h3 className="section-title">Environmental Fusion</h3>
                  <p className="text-[11px] font-medium text-warm-400 mt-1 uppercase tracking-wider">Multimodal sensor aggregation pipeline</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-safe-500/5 rounded-lg border border-safe-500/10 text-[10px] font-semibold text-safe-600">
                  <Database className="w-3.5 h-3.5" /> AI ENGINE: {aiEngineLabel.toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
                <div className="grid grid-cols-5 gap-4 justify-items-center">
                  {nodes[0] ? (
                    <>
                      <GaugeChart size={150} value={Math.round((Number(nodes[0].mq135 || 0) / 4095) * 100)} label="MQ135 Air" unit="%" thresholds={{ warning: 40, danger: 70 }} />
                      <GaugeChart size={150} value={nodes[0].temperature} label="Temp" unit="°C" thresholds={{ warning: 35, danger: 40 }} />
                      <GaugeChart size={150} value={Math.round((nodes[0].mq7 / 4095) * 100)} label="MQ7 CO" unit="%" thresholds={{ warning: 40, danger: 70 }} />
                      <GaugeChart size={150} value={Math.round((nodes[0].vibration / 10) * 100)} label="Seismic" unit="%" thresholds={{ warning: 50, danger: 80 }} />
                      <GaugeChart size={150} value={nodes[0].humidity} label="Humidity" unit="%" thresholds={{ warning: 70, danger: 85 }} />
                    </>
                  ) : (
                    <div className="col-span-full py-12 text-warm-400 font-medium italic text-center">
                      Synchronizing telemetry hub...
                    </div>
                  )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-warm-100 flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${dangerAlerts > 0 ? 'bg-danger-500' : 'bg-safe-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]'}`} />
                         <span className="text-[10px] font-semibold text-warm-500 uppercase tracking-wider">{dangerAlerts > 0 ? 'Critical Alerts Active' : 'No Critical Alerts'}</span>
                      </div>
                   </div>
                   <p className="text-[11px] font-semibold text-warm-400">Backend Fetch: <span className="text-warm-900 font-bold">{formatMs(lastFetchMs)}</span></p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT 30%: PPE Protocol + On-site Roster */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="premium-card p-6 flex flex-col flex-1"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-copper-500/10 flex items-center justify-center text-copper-600">
                  <ShieldCheck className="w-5.5 h-5.5" />
                </div>
                <h3 className="section-title">PPE Protocol</h3>
              </div>

              {ppe ? (
                <div className="inner-card flex-1 flex flex-col gap-6">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    ppe.gate_status === 1 ? 'bg-white border-warm-200' : 'bg-danger-50/50 border-danger-100'
                  }`}>
                    <div>
                      <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider leading-none mb-2">Gate Status</p>
                      <p className={`text-[15px] font-bold uppercase tracking-tight ${ppe.gate_status === 1 ? 'text-safe-600' : 'text-danger-600'}`}>
                        {ppe.gate_status === 1 ? 'Authorized Access' : 'Access Restricted'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${ppe.gate_status === 1 ? 'bg-safe-500' : 'bg-danger-500 pulse-danger'}`} />
                  </div>
                  
                  <div className="space-y-4">
                    <PPEItem label="Primary Helmet" ok={ppe.helmet} />
                    <PPEItem label="High-Vis Vest" ok={ppe.vest} />
                    <PPEItem label="Hand Protection" ok={ppe.gloves} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-warm-400 italic">Interrogating vision stream...</div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="premium-card p-6 flex flex-col flex-1"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-info-500/10 flex items-center justify-center text-info-600">
                    <Users className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="section-title">On-Site Roster</h3>
                </div>
                <button onClick={() => navigate('/workers')} className="text-[11px] font-bold text-warm-400 hover:text-warm-900 transition-colors uppercase tracking-wider">
                  View All
                </button>
              </div>

              <div className="inner-card flex-1 max-h-[220px] overflow-y-auto custom-scrollbar p-2">
                <div className="space-y-2">
                  {workers.map((w) => (
                    <div
                      key={w.worker_id}
                      onClick={() => navigate(`/worker/${w.worker_id}`)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-sm cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-warm-100 flex items-center justify-center text-[10px] font-bold text-warm-500 group-hover:bg-warm-900 group-hover:text-white transition-all">
                           W{w.worker_id.split('_')[1]}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-warm-900 leading-none">Operator {w.worker_id.split('_')[1]}</p>
                          <p className="text-[10px] font-semibold text-warm-400 mt-1 uppercase">{w.heart_rate} BPM | {w.spo2}% SpO2</p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${w.sos_button === 1 ? 'bg-danger-500 pulse-danger' : 'bg-safe-500'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ROW 3: DISTRIBUTED NODE ANALYTICS - FULL WIDTH TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-warm-100 flex items-center justify-between">
            <h3 className="section-title">Operational Node Diagnostics</h3>
            <button 
              onClick={() => navigate('/monitoring')}
              className="text-[11px] font-bold text-copper-600 hover:text-copper-700 uppercase tracking-widest flex items-center gap-2 group"
            >
              SPATIAL VISUALIZATION <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-50/50 border-b border-warm-100">
                  <th className="px-8 py-4 table-header w-[150px]">Node ID</th>
                  <th className="px-8 py-4 table-header w-[150px]">Sector</th>
                  <th className="px-8 py-4 table-header w-[180px]">Status</th>
                  <th className="px-8 py-4 table-header w-[150px]">Temperature</th>
                  <th className="px-8 py-4 table-header w-[150px]">MQ135 Air</th>
                  <th className="px-8 py-4 table-header w-[160px]">MQ4 / MQ5</th>
                  <th className="px-8 py-4 table-header">Health Score</th>
                  <th className="px-8 py-4 table-header text-right w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {nodes.map((node, i) => {
                  const status = getNodeStatus(node);
                  return (
                    <tr
                      key={node.node_id}
                      onClick={() => navigate(`/node/${node.node_id}`)}
                      className={`group hover:bg-warm-50/50 cursor-pointer transition-all h-[72px] ${i % 2 === 1 ? 'bg-warm-50/30' : ''}`}
                    >
                      <td className="px-8 py-4">
                        <span className="text-[14px] font-bold text-warm-900 uppercase tracking-tight">
                           {node.node_id.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-[12px] font-semibold text-warm-400 uppercase tracking-wider">
                           Sector 0{node.node_id.split('_')[1] || '1'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <StatusBadge status={status} label={status.toUpperCase()} />
                      </td>
                      <td className="px-8 py-4">
                         <div className="flex items-baseline gap-1">
                            <span className="text-[16px] font-bold text-warm-900 tabular-nums">{node.temperature}</span>
                            <span className="text-[10px] font-semibold text-warm-400 uppercase tracking-widest">°C</span>
                         </div>
                      </td>
                      <td className="px-8 py-4">
                         <div className="flex items-baseline gap-1">
                            <span className="text-[16px] font-bold text-warm-900 tabular-nums">{node.mq135 ?? '—'}</span>
                            <span className="text-[10px] font-semibold text-warm-400 uppercase tracking-widest">raw</span>
                         </div>
                      </td>
                      <td className="px-8 py-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-[12px] font-bold text-warm-900 tabular-nums">CH4 {node.mq4 ?? node.mq2}</span>
                            <span className="text-[10px] font-semibold text-warm-400 uppercase tracking-widest">LPG {node.mq5 ?? node.mq6}</span>
                         </div>
                      </td>
                      <td className="px-8 py-4">
                         <div className="w-[120px] h-2 bg-warm-100 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.max(5, 100 - Math.min(100, Number(node.ai?.overallRisk ?? 0)))}%` }}
                               className={`h-full ${status === 'safe' ? 'bg-safe-500' : status === 'warning' ? 'bg-warning-500' : 'bg-danger-500'}`}
                            />
                         </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <div className="p-2.5 rounded-lg bg-warm-100 group-hover:bg-warm-900 group-hover:text-white transition-all inline-flex">
                            <ExternalLink className="w-4 h-4" />
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ROW 4: LOWER OPERATIONAL INTELLIGENCE SECTION - 3 COLUMNS */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
           
           <div className="min-w-0">
             <motion.div
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="premium-card flex flex-col h-[400px]"
             >
               <div className="px-8 py-5 border-b border-warm-100 flex items-center justify-between">
                  <h3 className="section-title text-[15px]">Critical Timeline</h3>
                  <div className="w-2 h-2 rounded-full bg-danger-500 pulse-danger" />
               </div>
               <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                  {alertLog.slice(0, 5).map((alert, i) => (
                    <div key={i} className="flex gap-4 group">
                       <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${alert.severity === 'danger' ? 'bg-danger-500' : 'bg-warning-500'}`} />
                          <div className="w-px flex-1 bg-warm-100 my-1" />
                       </div>
                        <div className="pb-4">
                          <p className="text-[13px] font-bold text-warm-900 leading-tight group-hover:text-copper-600 transition-colors">{alert.message}</p>
                          <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider mt-1">{new Date(alert.timestamp).toLocaleTimeString()} | {alert.node?.replace('_', ' ') || 'UNLINKED'}</p>
                       </div>
                    </div>
                  ))}
                  {alertLog.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 italic py-12">
                       <ShieldCheck className="w-10 h-10 text-warm-200 mb-2" />
                       <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-widest">Zero Mission Violations</p>
                    </div>
                  )}
               </div>
             </motion.div>
           </div>

           <div className="min-w-0">
             <motion.div
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="premium-card flex flex-col h-[400px]"
             >
                <div className="px-8 py-5 border-b border-warm-100 flex items-center justify-between">
                  <h3 className="section-title text-[15px]">Health Variance</h3>
                  <Activity className="w-4.5 h-4.5 text-info-500" />
               </div>
               <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
                  <div className="w-full flex items-end gap-2 h-32 mb-6">
                     {[45, 60, 55, 70, 85, 40, 65, 80, 50, 90].map((h, i) => (
                       <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.5 + (i * 0.05), duration: 1 }}
                          className={`flex-1 rounded-t-lg ${h > 75 ? 'bg-copper-400' : 'bg-warm-100'} hover:bg-warm-900 transition-all cursor-help`}
                       />
                     ))}
                  </div>
                  <div className="w-full text-center">
                     <p className="text-[12px] font-bold text-warm-900 tracking-tight">Biometric Convergence</p>
                     <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-widest mt-1">Neural forecasting pattern</p>
                  </div>
               </div>
             </motion.div>
           </div>

           <div className="min-w-0">
             <motion.div
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
               className="premium-card flex flex-col h-[400px]"
             >
                <div className="px-8 py-5 border-b border-warm-100 flex items-center justify-between">
                  <h3 className="section-title text-[15px]">System Diagnostics</h3>
                  <div className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-widest ${
                    dataSource?.status === 'live' || testMode
                      ? 'bg-safe-500/10 border-safe-500/20 text-safe-600'
                      : 'bg-warm-100 border-warm-200 text-warm-500'
                  }`}>{dataSource?.status || 'idle'}</div>
               </div>
               <div className="flex-1 p-8 space-y-6">
                  <DiagnosticItem label="Data Feed" value={dataSource?.label || 'Unknown'} ok={dataSource?.status !== 'error'} />
                  <DiagnosticItem label="AEGIS" value={aegisState.toUpperCase()} ok={['online', 'lab'].includes(aegisState)} />
                  <DiagnosticItem label="ML Engine" value={aiEngineLabel} ok={Boolean(aiLoaded)} />
                  <DiagnosticItem label="Backend Fetch" value={formatMs(lastFetchMs)} ok={!error} />
                  
                  <div className="mt-auto pt-6 border-t border-warm-100">
                     <div className="p-4 rounded-2xl bg-warm-50 border border-warm-100 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-bold text-warm-400 uppercase tracking-[0.15em] mb-1.5 leading-none italic">Dashboard Uptime</p>
                           <p className="text-[16px] font-black text-warm-900 tabular-nums tracking-tighter">{uptime}</p>
                        </div>
                        <Activity className="w-6 h-6 text-warm-200" />
                     </div>
                  </div>
               </div>
             </motion.div>
           </div>
        </div>
      </div>
    </div>
  );
}

function PPEItem({ label, ok }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1 group border-b border-warm-50 last:border-0">
      <span className="text-[12px] font-medium text-warm-500 group-hover:text-warm-900 transition-colors">{label}</span>
      <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
        ok ? 'bg-safe-500/5 text-safe-600 border-safe-500/20' : 'bg-danger-500/5 text-danger-600 border-danger-500/20'
      }`}>
        {ok ? 'Detected' : 'Missing'}
      </div>
    </div>
  );
}

function DiagnosticItem({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between group">
       <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-safe-500' : 'bg-danger-500'}`} />
          <span className="text-[12px] font-medium text-warm-500 group-hover:text-warm-900 transition-colors">{label}</span>
       </div>
       <span className="text-[13px] font-bold text-warm-900 tabular-nums">{value}</span>
    </div>
  );
}

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : '—';
}

function formatUptime(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}H:${String(minutes).padStart(2, '0')}M:${String(seconds).padStart(2, '0')}S`;
}
