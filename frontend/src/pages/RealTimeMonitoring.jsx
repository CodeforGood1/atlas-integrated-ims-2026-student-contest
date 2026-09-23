import { useEffect, useState } from 'react';
import { Users, AlertTriangle, Wind, Thermometer, Radio, Clock, ShieldCheck, MapPin, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/common/KpiCard';
import AlertCard from '../components/common/AlertCard';
import MineMap from '../components/map/MineMap';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAtlasStore from '../store/useAtlasStore';

export default function RealTimeMonitoring() {
  const { nodes = [], workers = [], alerts = [], alertLog = [], startTime, getNodeStatus, isLoading } = useAtlasStore();
  const [uptimeMin, setUptimeMin] = useState(0);

  const activeNodes = nodes.length;
  const totalWorkers = workers.length;
  const hazardousNodes = nodes.filter((n) => getNodeStatus(n) === 'danger').length;
  const avgMq135 = nodes.length ? Math.round(nodes.reduce((s, n) => s + Number(n.mq135 || 0), 0) / nodes.length) : '—';
  const avgTemp = nodes.length ? (nodes.reduce((s, n) => s + n.temperature, 0) / nodes.length).toFixed(1) : '—';
  const activeAlerts = alerts.filter((a) => a.severity === 'danger').length;
  
  useEffect(() => {
    const updateUptime = () => {
      const uptimeMs = Date.now() - startTime;
      setUptimeMin(Math.max(0, Math.floor(uptimeMs / 60000)));
    };
    updateUptime();
    const interval = setInterval(updateUptime, 10000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex flex-col w-full h-full">
        <TopBar title="Live Monitoring" />
        <div className="flex-1 flex items-center justify-center bg-warm-100">
          <LoadingSpinner message="Interrogating Sensor Hubs..." />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col">
      <TopBar title="Live Monitoring" subtitle="Distributed Sensor Fusion | Real-Time Spatial Awareness" />
      
      <div className="flex-1 p-10 lg:p-14 space-y-12 w-full max-w-full">
        {/* KPI Row - Fluid Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
          <KpiCard icon={Radio} label="Sensor Nodes" value={activeNodes} status="info" delay={0} />
          <KpiCard icon={Users} label="Total Workers" value={totalWorkers} status="info" delay={1} />
          <KpiCard icon={AlertTriangle} label="Hazard Sct" value={hazardousNodes} status={hazardousNodes > 0 ? 'danger' : 'safe'} delay={2} />
          <KpiCard icon={Wind} label="Avg MQ135" value={avgMq135} unit="raw" status={Number(avgMq135) >= 800 ? 'danger' : Number(avgMq135) >= 600 ? 'warning' : 'safe'} delay={3} />
          <KpiCard icon={AlertTriangle} label="Crit Alerts" value={activeAlerts} status={activeAlerts > 0 ? 'danger' : 'safe'} delay={4} />
          <KpiCard icon={Thermometer} label="Avg Temp" value={avgTemp} unit="°C" status={parseFloat(avgTemp) > 35 ? 'warning' : 'neutral'} delay={5} />
        </div>

        {/* Spatial Grid - Rebuilt with 12-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full min-h-0">
          {/* Spatial Hub - col-span-8 - Height constrained */}
          <div className="lg:col-span-8 min-w-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              className="premium-card overflow-hidden h-[75vh] flex flex-col shadow-xl"
            >
              <div className="px-10 py-8 border-b-2 border-warm-200 flex items-center justify-between bg-warm-50/50 backdrop-blur-sm">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[18px] bg-copper-600/10 text-copper-600 flex items-center justify-center border-2 border-copper-600/20 shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="section-title">Live Tunnel Visualization</h3>
                </div>
                <div className="flex items-center gap-8">
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-copper-500 shadow-md" />
                     <span className="text-[11px] font-black text-warm-400 uppercase tracking-widest leading-none">Active Node</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-safe-500 shadow-md pulse-safe" />
                     <span className="text-[11px] font-black text-warm-400 uppercase tracking-widest leading-none">Worker Tracker</span>
                   </div>
                </div>
              </div>
              <div className="flex-1 relative bg-warm-200/10 group">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                   <Database className="w-80 h-80 text-warm-900" />
                </div>
                <MineMap />
              </div>
            </motion.div>
          </div>

          {/* Incident Stream - col-span-4 - Scrollable */}
          <div className="lg:col-span-4 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="premium-card h-[75vh] flex flex-col bg-white/80 backdrop-blur-sm shadow-xl"
            >
              <div className="px-10 py-8 border-b-2 border-warm-200 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="section-title">Incident Response</h3>
                  <span className="text-[11px] text-danger-600 bg-danger-500/10 px-4 py-2 rounded-full font-black uppercase tracking-widest border-2 border-danger-500/20 shadow-sm">
                    {alerts.length} Critical
                  </span>
                </div>
              </div>
              <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-10 italic">
                    <div className="w-20 h-20 rounded-full bg-safe-500/5 flex items-center justify-center mb-8 border-2 border-safe-500/10 shadow-inner">
                      <ShieldCheck className="w-10 h-10 text-safe-500" />
                    </div>
                    <p className="text-[13px] font-black text-warm-400 uppercase tracking-[0.25em] leading-relaxed">
                      All Sectors Operational <br /> No Incident Reports
                    </p>
                  </div>
                ) : (
                  alerts.map((alert, i) => (
                    <AlertCard key={alert.id} alert={alert} index={i} />
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* System Event Audit Trail - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card overflow-hidden w-full shadow-xl"
        >
          <div className="px-10 py-8 border-b-2 border-warm-200 flex items-center justify-between bg-warm-50/50">
             <div className="flex items-center gap-5">
               <div className="w-12 h-12 rounded-[18px] bg-warm-900/5 text-warm-900 flex items-center justify-center border-2 border-warm-900/10 shadow-sm">
                 <Clock className="w-6 h-6" />
               </div>
               <h3 className="section-title">System Event Pipeline</h3>
             </div>
             <span className="text-[12px] font-black text-warm-400 uppercase tracking-widest border-l-2 border-warm-200 pl-10">Events Logged: {alertLog.length}</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar max-h-[50vh]">
            <table className="w-full text-left">
              <tbody className="divide-y-2 divide-warm-100">
                {alertLog.length === 0 ? (
                  <tr>
                    <td className="px-12 py-24 text-center text-[14px] font-bold text-warm-400 uppercase tracking-[0.25em] italic">
                      Zero Audit Events Logged In Current Lifecycle
                    </td>
                  </tr>
                ) : (
                  alertLog.map((entry, i) => (
                    <tr key={`${entry.id}-${i}`} className="hover:bg-warm-100/60 transition-all group">
                      <td className="px-12 py-8">
                        <div className="flex items-center gap-16">
                          <div className={`w-4 h-4 rounded-full flex-shrink-0 shadow-md ${
                            entry.severity === 'danger' ? 'bg-danger-500 pulse-danger' : 'bg-warning-500 pulse-warning'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[18px] font-black text-warm-800 group-hover:text-copper-700 transition-colors uppercase tracking-tight truncate block leading-none">
                              {entry.message}
                            </span>
                            <div className="flex items-center gap-8 mt-3.5">
                               <span className="text-[11px] font-black text-warm-400 uppercase tracking-widest border-r-2 border-warm-200 pr-8 italic">
                                 {entry.node?.replace('_', ' ') || 'UNLINKED'}
                               </span>
                               <span className="text-[11px] font-black text-copper-600/60 uppercase tracking-widest">
                                 {entry.type} Diagnostic
                               </span>
                            </div>
                          </div>
                          <span className="text-[12px] font-black text-warm-500 bg-warm-200/50 px-6 py-3 rounded-2xl uppercase tracking-widest shadow-inner border-2 border-warm-300/40 tabular-nums">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
