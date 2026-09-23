import { ShieldCheck, AlertTriangle, Camera, Wifi, Clock, CheckCircle2, XCircle, Expand, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/common/KpiCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAtlasStore from '../store/useAtlasStore';

export default function PPEDetection() {
  const { ppe, isLoading } = useAtlasStore();

  const complianceRate = ppe ? Math.round(((ppe.helmet + ppe.vest + ppe.gloves) / 3) * 100) : 0;

  if (isLoading && !ppe) {
    return (
      <div className="flex flex-col w-full h-full">
        <TopBar title="AI Vision Stream" />
        <div className="flex-1 flex items-center justify-center bg-warm-100">
          <LoadingSpinner message="Linking to Neural Compliance Stream..." />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col">
      <TopBar title="AI Vision Stream" subtitle="Automated PPE Compliance Inspection | Neural Recognition Pipeline" />
      
      <div className="flex-1 p-10 lg:p-14 space-y-12 w-full max-w-full">
        {/* Compliance Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          <KpiCard icon={ShieldCheck} label="Overall Compliance" value={complianceRate} unit="%" status={complianceRate === 100 ? 'safe' : 'warning'} delay={0} />
          <KpiCard icon={Camera} label="Stream Feed" value="CAM-04" status="info" delay={1} />
          <KpiCard icon={AlertTriangle} label="Access Violations" value="0" status="safe" delay={2} />
          <KpiCard icon={ShieldCheck} label="Vision Logic" value="Optimal" status="safe" delay={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
          {/* Neural Vision Hub - col-span-8 - Constrained to Viewport */}
          <div className="lg:col-span-8 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card overflow-hidden bg-white shadow-xl flex flex-col h-[75vh]"
            >
              <div className="px-10 py-8 border-b-2 border-warm-200 flex items-center justify-between bg-warm-50/50 backdrop-blur-sm">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[18px] bg-copper-600/10 text-copper-600 flex items-center justify-center border-2 border-copper-600/20 shadow-sm">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="section-title">Live Neural Feed</h3>
                    <p className="text-[11px] font-black text-warm-400 uppercase tracking-widest mt-2 leading-none">Authorized Entry Checkpoint</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="p-3.5 hover:bg-warm-200 rounded-xl transition-all border-2 border-transparent hover:border-warm-200"><Settings className="w-5 h-5 text-warm-400" /></button>
                  <button className="p-3.5 hover:bg-warm-200 rounded-xl transition-all border-2 border-transparent hover:border-warm-200"><Expand className="w-5 h-5 text-warm-400" /></button>
                </div>
              </div>
              
              <div className="flex-1 bg-warm-900 relative flex items-center justify-center overflow-hidden group">
                {/* Visual HUD Overlays */}
                <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none group-hover:border-black/30 transition-all" />
                <div className="absolute top-12 left-12 flex items-center gap-4 text-white/60 text-[11px] font-black uppercase tracking-[0.35em] bg-black/50 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                   <div className="w-3 h-3 rounded-full bg-danger-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                   SEC_CAM_042 | {new Date().toLocaleDateString()}
                </div>

                {ppe ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Simulated Bounding Box Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-[65%] aspect-[3/4] border-2 border-dashed border-white/20 rounded-[48px] flex items-center justify-center shadow-[inset_0_0_100px_rgba(255,255,255,0.02)]">
                          <ShieldCheck className="w-32 h-32 text-white/5 opacity-40" />
                       </div>
                    </div>
                    
                    {/* Active Detections */}
                    <div className="absolute top-[25%] left-[45%]">
                       <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 border-2 rounded-[28px] bg-black/60 backdrop-blur-md shadow-2xl ${ppe.helmet ? 'border-safe-500' : 'border-danger-500 shadow-danger-500/30'}`}>
                          <div className="flex items-center gap-3 mb-3">
                             <div className={`w-3 h-3 rounded-full ${ppe.helmet ? 'bg-safe-500' : 'bg-danger-500 shadow-[0_0_8px_rgba(220,38,38,1)]'}`} />
                             <span className="text-[12px] font-black text-white uppercase tracking-widest leading-none">Helmet</span>
                          </div>
                          <p className={`text-[14px] font-black uppercase tracking-tight ${ppe.helmet ? 'text-safe-400' : 'text-danger-400'}`}>{ppe.helmet ? 'Detected' : 'MISSING'}</p>
                       </motion.div>
                    </div>
                  </div>
                ) : (
                  <LoadingSpinner message="Establishing encrypted link..." />
                )}
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8 bg-warm-50/30 border-t-2 border-warm-200">
                <StatusDetail icon={ShieldCheck} label="Primary Helmet" ok={ppe?.helmet} />
                <StatusDetail icon={ShieldCheck} label="Safety Vest" ok={ppe?.vest} />
                <StatusDetail icon={ShieldCheck} label="Protective Gloves" ok={ppe?.gloves} />
              </div>
            </motion.div>
          </div>

          {/* Compliance Log - col-span-4 - Scrollable */}
          <div className="lg:col-span-4 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="premium-card h-[75vh] flex flex-col bg-white shadow-xl"
            >
              <div className="px-10 py-8 border-b-2 border-warm-200 flex items-center justify-between">
                <h3 className="section-title">Violation Pipeline</h3>
                <Clock className="w-5 h-5 text-warm-400" />
              </div>
              <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                 {[1, 2, 3, 4, 5].map(i => (
                   <div key={i} className="p-6 rounded-[28px] bg-warm-100/50 border-2 border-warm-200 flex items-center gap-6 hover:bg-white hover:shadow-xl hover:border-warm-300 transition-all cursor-default">
                      <div className="w-12 h-12 rounded-[18px] bg-safe-500/10 text-safe-600 flex items-center justify-center border-2 border-safe-500/20 shadow-sm">
                         <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[16px] font-black text-warm-900 uppercase tracking-tight truncate">Compliance Check Pass</p>
                         <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest mt-2 flex items-center gap-2.5">
                            <Wifi className="w-3.5 h-3.5" /> ID #00{i + 14} | 10:2{i} PM
                         </p>
                      </div>
                   </div>
                 ))}
                 <div className="p-6 rounded-[28px] bg-danger-500/5 border-2 border-danger-500/20 flex items-center gap-6 shadow-inner">
                    <div className="w-12 h-12 rounded-[18px] bg-danger-500/10 text-danger-600 flex items-center justify-center border-2 border-danger-500/20 shadow-sm">
                       <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-[16px] font-black text-danger-700 uppercase tracking-tight">Security Protocol Violation</p>
                       <p className="text-[10px] font-black text-danger-500/60 uppercase tracking-widest mt-2 italic">Missing Hand Protection | 09:14 PM</p>
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t-2 border-warm-200 bg-warm-50/50">
                 <button className="w-full py-5 bg-white border-2 border-warm-200 rounded-[24px] text-[12px] font-black text-warm-900 uppercase tracking-[0.2em] hover:bg-warm-900 hover:text-white hover:border-warm-900 transition-all shadow-lg active:scale-[0.98]">
                    Execute Full Compliance Audit
                 </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDetail({ icon: Icon, label, ok }) {
  return (
    <div className={`p-6 rounded-[32px] border-2 transition-all ${
      ok ? 'bg-white border-warm-200' : 'bg-danger-500/5 border-danger-500/20 shadow-inner'
    }`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl ${ok ? 'bg-safe-500/10 text-safe-600' : 'text-danger-600 bg-danger-500/10'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[12px] font-black text-warm-900 uppercase tracking-widest leading-none">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${ok ? 'bg-safe-500' : 'bg-danger-500 shadow-[0_0_8px_rgba(220,38,38,0.8)]'}`} />
           <span className={`text-[11px] font-black uppercase tracking-widest ${ok ? 'text-safe-600' : 'text-danger-600'}`}>
             {ok ? 'In Compliance' : 'Deficiency'}
           </span>
        </div>
        {!ok && <AlertTriangle className="w-4 h-4 text-danger-500 animate-pulse" />}
      </div>
    </div>
  );
}

