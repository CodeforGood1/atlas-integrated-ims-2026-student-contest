import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Users,
  Wifi,
  Layers,
  AlertTriangle
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import LiveLineChart from '../components/charts/LiveLineChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAtlasStore from '../store/useAtlasStore';

export default function NodeDetail() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { nodes = [], nodeHistory = {}, aegisDevices = {}, getNodeStatus, isLoading } = useAtlasStore();

  const node = nodes.find((n) => n.node_id === nodeId);
  const history = nodeHistory[nodeId] || [];
  const aegisDevice = aegisDevices[nodeId];

  if (isLoading && !node) {
    return (
      <div className="flex flex-col w-full h-full">
        <TopBar title="Sector Diagnostics" />
        <div className="flex-1 flex items-center justify-center bg-warm-100">
          <LoadingSpinner message="Interrogating Distributed Gateway..." />
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-warm-200 flex items-center justify-center mb-6 border border-warm-300 shadow-inner">
           <AlertTriangle className="w-10 h-10 text-warm-400" />
        </div>
        <h2 className="text-[18px] font-black text-warm-900 uppercase tracking-widest">Sector Hub Not Found</h2>
        <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-warm-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-warm-900/20 hover:scale-105 transition-transform">
          Return to Command Center
        </button>
      </div>
    );
  }

  const status = getNodeStatus(node);

  return (
    <div className="w-full min-h-full flex flex-col">
      <TopBar 
        title={`Sector Hub: ${nodeId?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}`} 
        subtitle="Full-Spectrum Telemetry Pipeline | Real-Time Diagnostic Feed" 
      />

      <div className="flex-1 p-6 lg:p-10 space-y-8 w-full max-w-full">
        {/* Navigation & Operational Status Bar */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 text-[11px] font-black text-warm-400 hover:text-copper-600 transition-all uppercase tracking-widest group"
          >
            <div className="w-9 h-9 rounded-xl border border-warm-300 flex items-center justify-center group-hover:border-copper-500/40 group-hover:bg-copper-500/5 transition-all">
               <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </div>
            Event History
          </button>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-warm-300/60 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'safe' ? 'bg-safe-500' : status === 'warning' ? 'bg-warning-500' : 'bg-danger-500'
                } animate-pulse`} />
                <span className="text-[11px] font-black text-warm-900 uppercase tracking-widest">Health: {status.toUpperCase()}</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2.5 bg-warm-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-warm-900/20">
                <Wifi className="w-3.5 h-3.5 text-safe-500" /> Live Connection
             </div>
          </div>
        </div>

        {/* Diagnostic Grid - 12 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full min-h-0">
          
          {/* Historical Analytics - col-span-8 - Fluid Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            <ChartCard title="Thermal Gradient" data={history} dataKey="temperature" unit="°C" color="#C15450" />
            <ChartCard title="Structural Seismic" data={history} dataKey="vibration" unit="Hz" color="#C49A3C" />
            <ChartCard title="MQ7 Carbon Monoxide" data={history} dataKey="mq7" unit="raw" color="#B8936F" />
            <ChartCard title="MQ4 Methane" data={history} dataKey="mq4" unit="raw" color="#9C7B5C" />
            <ChartCard title="MQ5 LPG/Natural Gas" data={history} dataKey="mq5" unit="raw" color="#C49A3C" />
            <ChartCard title="MQ135 Air Quality" data={history} dataKey="mq135" unit="raw" color="#6B8BA4" />
            <ChartCard title="Sound Level" data={history} dataKey="sound" unit="raw" color="#9C7B5C" />
            <ChartCard title="Relative Humidity" data={history} dataKey="humidity" unit="%" color="#5B8C5A" />
          </div>

          {/* Diagnostic Sidebar - col-span-4 */}
          <div className="lg:col-span-4 space-y-8 min-w-0 flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="premium-card p-10 bg-white shadow-lg flex-1"
            >
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-warm-300/40">
                 <div className="w-12 h-12 rounded-2xl bg-copper-600/10 text-copper-600 flex items-center justify-center border border-copper-600/20 shadow-sm">
                    <Layers className="w-6 h-6" />
                 </div>
                 <h3 className="text-[13px] font-black text-warm-900 uppercase tracking-[0.2em]">Node Integrity Index</h3>
              </div>
              <div className="space-y-8">
                <MetricLine label="Network Gateway" value="Active | Encrypted" ok={true} />
                <MetricLine label="Gas Channels" value="MQ4/MQ5/MQ7/MQ135" ok={true} />
                <MetricLine label="PLC UART" value={node.meta?.hardware?.plc_uart ? `${node.meta.hardware.plc_uart.rx}/${node.meta.hardware.plc_uart.tx}` : 'GPIO20/GPIO21'} ok={true} />
                <MetricLine label="Trust Score" value={formatPercent(aegisDevice?.trust)} ok={(aegisDevice?.trust ?? 0) >= 0.75} />
                <MetricLine label="Trust State" value={aegisDevice?.state ?? 'UNKNOWN'} ok={aegisDevice?.state === 'VALIDATED'} />
                <MetricLine label="Neural Sync Rate" value="2000ms" ok={true} />
                <MetricLine label="Internal Voltage" value="3.3V | Nominal" ok={true} />
                <MetricLine label="Firmware Stack" value="v4.2.1-SEC" ok={true} />
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, data, dataKey, unit, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card p-8 h-[340px] flex flex-col bg-white shadow-md relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-1 h-full opacity-20 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-[10px] font-black text-warm-400 uppercase tracking-[0.2em]">{title}</h4>
          <p className="text-[9px] text-warm-300 font-bold uppercase tracking-widest mt-1">Live Analytics</p>
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <span className="text-[24px] font-black text-warm-900 tracking-tighter tabular-nums">
              {data[data.length - 1][dataKey]}
              <span className="text-[11px] font-black text-warm-400 uppercase ml-1.5">{unit}</span>
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <LiveLineChart data={data} dataKey={dataKey} height={200} color={color} hideLabel />
      </div>
    </motion.div>
  );
}

function MetricLine({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between group py-1">
      <span className="text-[12px] font-bold text-warm-500 uppercase tracking-[0.1em] group-hover:text-warm-800 transition-colors">{label}</span>
      <div className="flex items-center gap-3">
         <span className="text-[13px] font-black text-warm-900 uppercase">{value}</span>
         <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-safe-500' : 'bg-danger-500'} shadow-sm`} />
      </div>
    </div>
  );
}

function formatPercent(value) {
  if (typeof value !== 'number') return '—';
  return `${Math.round(value * 100)}%`;
}
