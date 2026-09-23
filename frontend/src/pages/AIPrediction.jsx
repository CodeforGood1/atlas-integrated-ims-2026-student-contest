import { useEffect, useState } from 'react';
import { Activity, Cpu, Info } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import GaugeChart from '../components/charts/GaugeChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAtlasStore from '../store/useAtlasStore';

const API_BASE = '/api';

export default function AIPrediction() {
  const { nodes = [], isLoading } = useAtlasStore();
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const nodeId = selectedNodeId && nodes.some((node) => node.node_id === selectedNodeId) ? selectedNodeId : nodes[0]?.node_id;
  const node = nodes.find((entry) => entry.node_id === nodeId);
  const predictions = node?.ai;

  useEffect(() => {
    fetch(`${API_BASE}/ai/status`).then((response) => response.ok ? response.json() : null).then(setModelStatus).catch(() => setModelStatus(null));
  }, []);

  if (isLoading && nodes.length === 0) return <LoadingSpinner message="Loading packaged ML models..." />;

  return (
    <div className="w-full min-h-full flex flex-col">
      <TopBar title="AI Prediction Engine" subtitle="Packaged model inference only" />
      <div className="flex-1 p-10 lg:p-14 space-y-10">
        <div className="premium-card p-8 bg-white">
          <div className="flex items-center gap-4 mb-6"><Cpu className="w-6 h-6 text-copper-600" /><div><h3 className="section-title">Installed Models</h3><p className="text-[11px] text-warm-400 uppercase tracking-wider">Models are fixed with the application.</p></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] font-bold text-warm-700"><div className="inner-card p-4 flex justify-between"><span>Gas model</span><span>{modelStatus?.builtIn?.gas_model || 'unknown'}</span></div><div className="inner-card p-4 flex justify-between"><span>Fire model</span><span>{modelStatus?.builtIn?.fire_model || 'unknown'}</span></div></div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-3 premium-card p-6 bg-white space-y-3"><h3 className="section-title mb-4">Sensor Nodes</h3>{nodes.map((entry) => <button key={entry.node_id} onClick={() => setSelectedNodeId(entry.node_id)} className={`w-full text-left px-4 py-3 rounded-xl border-2 ${entry.node_id === nodeId ? 'border-copper-500 bg-copper-500/5' : 'border-warm-200'}`}>{entry.node_id}</button>)}</div>
          <div className="xl:col-span-9 premium-card p-10 bg-white">{predictions ? <><div className="flex items-center gap-3 mb-10"><Activity className="w-5 h-5 text-safe-600" /><h3 className="section-title">Packaged Model Output</h3></div><div className="grid grid-cols-2 md:grid-cols-5 gap-8"><GaugeChart size={130} value={predictions.overallRisk} label="Overall" thresholds={{ warning: 35, danger: 60 }} /><GaugeChart size={130} value={predictions.gasRisk} label="Gas" thresholds={{ warning: 40, danger: 65 }} /><GaugeChart size={130} value={predictions.collapseRisk} label="Stability" thresholds={{ warning: 30, danger: 55 }} /><GaugeChart size={130} value={predictions.airQualityRisk} label="Air Quality" thresholds={{ warning: 40, danger: 65 }} /><GaugeChart size={130} value={predictions.fireRisk} label="Thermal" thresholds={{ warning: 30, danger: 55 }} /></div><div className="mt-10 p-6 rounded-2xl bg-warm-50 border border-warm-200"><p className="text-[11px] font-black uppercase tracking-widest text-warm-400 mb-2">Explanation</p><p className="text-[14px] text-warm-700">{predictions.explanation}</p></div></> : <div className="py-20 text-center text-warm-400"><Info className="w-8 h-8 mx-auto mb-4" /><p className="text-[12px] font-black uppercase tracking-widest">No packaged model output available</p></div>}</div>
        </div>
      </div>
    </div>
  );
}
