import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, History, Info } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import AlertCard from '../components/common/AlertCard';
import useAtlasStore from '../store/useAtlasStore';

export default function Alerts() {
  const { alerts, alertLog } = useAtlasStore();

    const downloadLog = () => {
    if (alertLog.length === 0) return;

    const headers = ['Timestamp', 'Severity', 'Type', 'Source', 'Message'];
    const csvContent = [
      headers.join(','),
      ...alertLog.map(entry => [
        new Date(entry.timestamp).toLocaleString(),
        entry.severity.toUpperCase(),
        entry.type.toUpperCase(),
        entry.node || 'N/A',
        `"${entry.message.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `atlas_incident_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      <TopBar title="Alerts & Incidents" subtitle="Command Response Pipeline | Real-Time Critical Event Stream" />
      
      <div className="flex-1 p-10 lg:p-14 space-y-12 w-full max-w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
          {/* Active alerts */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-card flex flex-col bg-white shadow-xl min-h-[600px]"
          >
            <div className="px-10 py-8 border-b-2 border-warm-200 flex items-center justify-between bg-warm-50/50">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-[18px] bg-danger-500/10 text-danger-600 flex items-center justify-center border-2 border-danger-500/20 shadow-sm">
                   <AlertTriangle className="w-6 h-6" />
                 </div>
                 <h3 className="section-title">Active Response Required</h3>
              </div>
              <span className="text-[11px] font-black text-danger-600 bg-danger-500/10 px-5 py-2 rounded-full uppercase tracking-widest border-2 border-danger-500/20 shadow-sm animate-pulse">
                {alerts.length} CRITICAL
              </span>
            </div>
            <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-10 italic py-24">
                  <div className="w-20 h-20 rounded-full bg-safe-500/5 flex items-center justify-center mb-8 border-2 border-safe-500/10 shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-safe-500" />
                  </div>
                  <p className="text-[14px] font-black text-warm-400 uppercase tracking-[0.25em] leading-relaxed">
                    All Sectors Operational <br /> No Active Threats Detected
                  </p>
                </div>
              ) : (
                alerts.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)
              )}
            </div>
          </motion.div>

          {/* Alert history */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-card flex flex-col bg-white shadow-xl min-h-[600px]"
          >
            <div className="px-10 py-8 border-b-2 border-warm-200 flex items-center justify-between bg-warm-50/50">
               <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-[18px] bg-warm-900/5 text-warm-900 flex items-center justify-center border-2 border-warm-900/10 shadow-sm">
                   <History className="w-6 h-6" />
                 </div>
                 <h3 className="section-title">Incident History</h3>
               </div>
               <span className="text-[12px] font-black text-warm-400 uppercase tracking-widest leading-none">
                 Total Logs: {alertLog.length}
               </span>
            </div>
            <div className="p-8 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {alertLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-10 italic py-24">
                   <p className="text-[14px] font-black text-warm-400 uppercase tracking-[0.2em] leading-relaxed">
                     No Incident History Recorded <br /> In This Session
                   </p>
                </div>
              ) : (
                alertLog.map((entry, i) => (
                  <div key={`${entry.id}-${i}`} className="flex items-center gap-6 px-8 py-6 rounded-[28px] bg-warm-100/40 border-2 border-warm-200 hover:bg-white hover:shadow-xl hover:border-warm-300 transition-all group">
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm ${
                      entry.severity === 'danger' ? 'bg-danger-500 pulse-danger' : 'bg-warning-500 pulse-warning'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[16px] font-black text-warm-800 group-hover:text-copper-700 transition-colors uppercase tracking-tight block leading-none mb-2">
                        {entry.message}
                      </span>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-warm-400 uppercase tracking-widest">
                           {entry.node?.replace('_', ' ') || 'UNLINKED'}
                         </span>
                         <div className="w-1 h-1 rounded-full bg-warm-300" />
                         <span className="text-[10px] font-black text-copper-600/60 uppercase tracking-widest">
                           {entry.type} Diagnostic
                         </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-warm-500 bg-warm-200/50 px-5 py-2.5 rounded-2xl uppercase tracking-widest shadow-inner border-2 border-warm-300/40 tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-10 border-t-2 border-warm-200 bg-warm-50/30">
               <button 
                onClick={downloadLog}
                className="w-full py-5 bg-white border-2 border-warm-200 rounded-[24px] text-[12px] font-black text-warm-900 uppercase tracking-[0.2em] hover:bg-warm-900 hover:text-white hover:border-warm-900 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-4"
               >
                  <Info className="w-5 h-5" /> Download Full Mission Incident Log
               </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

