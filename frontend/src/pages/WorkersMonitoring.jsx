import { useNavigate } from 'react-router-dom';
import { Users, Heart, AlertTriangle, Droplets, MapPin, Search, Filter, MoreVertical, Download, ClipboardList, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAtlasStore from '../store/useAtlasStore';

function getWorkerStatus(w) {
  if (w.sos_button === 1) return 'danger';
  if (w.heart_rate > 110 || w.spo2 < 93) return 'danger';
  if (w.heart_rate > 100 || w.spo2 < 95) return 'warning';
  return 'safe';
}

export default function WorkersMonitoring() {
  const navigate = useNavigate();
  const { workers = [], isLoading } = useAtlasStore();

  const totalWorkers = workers.length;
  const unhealthy = workers.filter((w) => getWorkerStatus(w) !== 'safe').length;
  const avgHR = workers.length ? Math.round(workers.reduce((s, w) => s + w.heart_rate, 0) / workers.length) : '—';
  const avgSpO2 = workers.length ? (workers.reduce((s, w) => s + w.spo2, 0) / workers.length).toFixed(1) : '—';
  const sosCount = workers.filter((w) => w.sos_button === 1).length;

  if (isLoading && workers.length === 0) {
    return (
      <div className="flex flex-col w-full h-full">
        <TopBar title="Personnel Hub" />
        <div className="flex-1 flex items-center justify-center bg-warm-100">
          <LoadingSpinner message="Retrieving Biometric Roster..." />
        </div>
      </div>
    );
  }

    const downloadWorkersRegistry = () => {
    if (workers.length === 0) return;

    const headers = ['Worker ID', 'Heart Rate (BPM)', 'SpO2 (%)', 'Temperature (°C)', 'Nearest Node', 'SOS Status'];
    const csvContent = [
      headers.join(','),
      ...workers.map(w => [
        w.worker_id,
        w.heart_rate,
        w.spo2,
        w.temperature,
        w.proximity?.nearest_node || 'N/A',
        w.sos_button === 1 ? 'ACTIVE' : 'INACTIVE'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `atlas_personnel_registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      <TopBar title="Personnel Hub" subtitle="Biometric Health Stream & Smart Deployment Logistics" />
      
      <div className="flex-1 p-10 lg:p-14 space-y-12 w-full max-w-full">
        {/* Analytics Top Bar - Rebuilt with proper spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 w-full">
          <KpiCard icon={Users} label="Current Deployment" value={totalWorkers} status="info" delay={0} />
          <KpiCard icon={AlertTriangle} label="Abnormal Vitals" value={unhealthy} status={unhealthy > 0 ? 'danger' : 'safe'} delay={1} />
          <KpiCard icon={Heart} label="Heart Rate Avg" value={avgHR} unit="BPM" status="info" delay={2} />
          <KpiCard icon={Droplets} label="Oxygen Saturation" value={avgSpO2} unit="%" status="safe" delay={3} />
          <KpiCard icon={AlertTriangle} label="Active SOS Signals" value={sosCount} status={sosCount > 0 ? 'danger' : 'safe'} delay={4} />
        </div>

        {/* Full-Width Personnel Registry */}
        <div className="premium-card overflow-hidden flex flex-col min-h-[700px] shadow-xl">
          {/* Enhanced Table Toolbar */}
          <div className="px-10 py-8 border-b-2 border-warm-200 flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-warm-50/50 backdrop-blur-sm">
            <div className="flex items-center gap-8">
               <div className="w-14 h-14 rounded-[22px] bg-warm-900 text-white flex items-center justify-center shadow-lg border-2 border-warm-800">
                 <ClipboardList className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="section-title">Live Biometric Registry</h3>
                  <p className="text-[11px] text-warm-500 font-black mt-2.5 uppercase tracking-widest leading-none">
                    Authorized Personnel Tracking | System Health 100%
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative group min-w-[350px]">
                <Search className="w-5 h-5 text-warm-400 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-copper-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ID SEARCH (OPERATOR / SECTOR)..." 
                  className="pl-16 pr-8 py-4 bg-white border-2 border-warm-200 rounded-[22px] text-[13px] font-black uppercase tracking-widest focus:outline-none focus:ring-8 focus:ring-copper-500/5 focus:border-copper-500/40 w-full shadow-sm placeholder:text-warm-300 transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="p-4 bg-white border-2 border-warm-200 rounded-[18px] hover:bg-warm-100 hover:border-warm-300 transition-all shadow-sm">
                  <Filter className="w-5 h-5 text-warm-600" />
                </button>
                <button 
                  onClick={downloadWorkersRegistry}
                  className="p-4 bg-white border-2 border-warm-200 rounded-[18px] hover:bg-warm-100 hover:border-warm-300 transition-all shadow-sm"
                >
                  <Download className="w-5 h-5 text-warm-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Table Container - Rebuilt for viewport scaling & sticky headers */}
          <div className="flex-1 overflow-x-auto custom-scrollbar max-h-[70vh]">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-warm-100/95 backdrop-blur-xl border-b-2 border-warm-200">
                  <th className="px-10 py-6 table-header">Personnel Index</th>
                  <th className="px-10 py-6 table-header">Telemetry Status</th>
                  <th className="px-10 py-6 table-header">Operational Sector</th>
                  <th className="px-10 py-6 table-header">Biometric Diagnostics</th>
                  <th className="px-10 py-6 table-header">Body Temp</th>
                  <th className="px-10 py-6 table-header">Response Signal</th>
                  <th className="px-10 py-6 table-header text-right pr-14">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-warm-100 bg-white">
                {workers.map((w, i) => {
                  const status = getWorkerStatus(w);
                  return (
                    <motion.tr
                      key={w.worker_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => navigate(`/worker/${w.worker_id}`)}
                      className="hover:bg-warm-100/60 cursor-pointer group transition-all"
                    >
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-[22px] bg-warm-200 border-2 border-warm-300 group-hover:bg-warm-900 group-hover:text-white group-hover:border-warm-900 transition-all flex items-center justify-center text-[13px] font-black shadow-sm">
                            {w.worker_id.replace('worker_', 'W')}
                          </div>
                          <div>
                            <p className="text-[18px] font-black text-warm-900 group-hover:text-copper-700 transition-colors uppercase tracking-tight truncate max-w-[180px]">Operator {w.worker_id.replace('worker_', '#')}</p>
                            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mt-2 flex items-center gap-2.5">
                               <Timer className="w-3.5 h-3.5" /> Shift 01 Active
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <StatusBadge status={status} label={status.toUpperCase()} />
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-warm-200/60 group-hover:bg-copper-500/10 transition-colors border border-transparent group-hover:border-copper-500/20">
                            <MapPin className="w-5 h-5 text-warm-400 group-hover:text-copper-600" />
                          </div>
                          <span className="text-[15px] font-black text-warm-700 uppercase tracking-tight">
                            {w.proximity?.nearest_node?.replace('_', ' ') || 'Syncing...'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-12">
                          <div className="flex flex-col">
                             <div className="flex items-baseline gap-2">
                               <span className={`text-[24px] font-black tabular-nums tracking-tighter ${w.heart_rate > 105 ? 'text-danger-600' : 'text-warm-900'}`}>{w.heart_rate}</span>
                               <span className="text-[11px] font-black text-warm-400 uppercase tracking-widest">bpm</span>
                             </div>
                          </div>
                          <div className="w-0.5 h-10 bg-warm-200" />
                          <div className="flex flex-col">
                             <div className="flex items-baseline gap-2">
                               <span className={`text-[24px] font-black tabular-nums tracking-tighter ${w.spo2 < 94 ? 'text-danger-600' : 'text-warm-900'}`}>{w.spo2}%</span>
                               <span className="text-[11px] font-black text-warm-400 uppercase tracking-widest">spo2</span>
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <span className="text-[20px] font-black text-warm-900 tabular-nums tracking-tighter">{w.temperature}°C</span>
                      </td>
                      <td className="px-10 py-7">
                         {w.sos_button === 1 ? (
                           <span className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-danger-600 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-xl shadow-danger-500/40 animate-pulse">
                             <AlertTriangle className="w-4 h-4" /> SOS EMERGENCY
                           </span>
                         ) : (
                           <div className="flex gap-2 h-4 items-end">
                             {[1, 2, 3, 4, 5].map(b => (
                               <div key={b} className={`w-1.5 rounded-full transition-all duration-500 ${b <= 4 ? 'bg-safe-500' : 'bg-warm-300'}`} style={{ height: `${b * 20}%` }} />
                             ))}
                           </div>
                         )}
                      </td>
                      <td className="px-10 py-7 text-right pr-14">
                        <button className="p-3.5 rounded-[18px] hover:bg-warm-900 hover:text-white text-warm-400 transition-all border-2 border-transparent hover:border-warm-900 shadow-sm">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer / Summary */}
          <div className="px-10 py-8 border-t-2 border-warm-200 bg-warm-50/50 flex items-center justify-between">
             <p className="text-[12px] font-black text-warm-400 uppercase tracking-widest italic">
               Note: Health data is encrypted and synced with centralized biometric server.
             </p>
             <div className="flex items-center gap-8">
                <span className="text-[13px] font-black text-warm-900 uppercase tracking-widest">Page 01 of 01</span>
                <div className="flex gap-3">
                   <button className="px-6 py-3 bg-white border-2 border-warm-200 rounded-xl text-[11px] font-black text-warm-300 cursor-not-allowed uppercase tracking-widest">Prev</button>
                   <button className="px-6 py-3 bg-white border-2 border-warm-200 rounded-xl text-[11px] font-black text-warm-300 cursor-not-allowed uppercase tracking-widest">Next</button>
                </div>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
