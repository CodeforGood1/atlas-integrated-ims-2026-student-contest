import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Droplets, Thermometer, Activity, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import StatusBadge from '../components/common/StatusBadge';
import LiveLineChart from '../components/charts/LiveLineChart';
import useAtlasStore from '../store/useAtlasStore';

function getWorkerStatus(w) {
  if (!w) return 'offline';
  if (w.sos_button === 1) return 'danger';
  if (w.heart_rate > 110 || w.spo2 < 93) return 'danger';
  if (w.heart_rate > 100 || w.spo2 < 95) return 'warning';
  return 'safe';
}

export default function WorkerDetail() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { workers, workerHistory, ppe, aegisDevices = {} } = useAtlasStore();

  const worker = workers.find((w) => w.worker_id === workerId);
  const history = workerHistory[workerId] || [];
  const status = getWorkerStatus(worker);
  const aegisDevice = aegisDevices[workerId];

  if (!worker) {
    return (
      <div>
        <TopBar title="Worker Detail" />
        <div className="p-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13px] text-copper-500 hover:text-copper-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="bg-white rounded-xl border border-warm-300/60 p-12 text-center">
            <p className="text-warm-500 text-[14px]">Waiting for data from <strong>{workerId}</strong>...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title={`Worker ${workerId.replace('worker_', '#')}`} subtitle="Health vitals and location tracking" />
      <div className="p-5">
        <button onClick={() => navigate('/workers')} className="flex items-center gap-2 text-[13px] text-copper-500 hover:text-copper-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Workers
        </button>

        {/* Profile summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-warm-300/60 p-5 mb-5"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-copper-500/10 flex items-center justify-center">
              <span className="text-[18px] font-bold text-copper-600">{workerId.replace('worker_', 'W')}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-warm-800">Worker {workerId.replace('worker_', '#')}</h2>
              <p className="text-[12px] text-warm-500 mt-0.5">Mining Operator • Shift A</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={status} label={status === 'safe' ? 'Healthy' : status === 'warning' ? 'Caution' : 'Critical'} />
              {worker.sos_button === 1 && <StatusBadge status="danger" label="🆘 SOS Active" />}
              {aegisDevice?.state && <StatusBadge status={aegisDevice.state === 'VALIDATED' ? 'safe' : 'warning'} label={`Trust ${aegisDevice.state}`} />}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mt-5">
            <StatItem icon={Heart} label="Heart Rate" value={worker.heart_rate} unit="bpm" danger={worker.heart_rate > 100} />
            <StatItem icon={Droplets} label="SpO₂" value={worker.spo2} unit="%" danger={worker.spo2 < 95} />
            <StatItem icon={Thermometer} label="Body Temp" value={worker.temperature} unit="°C" />
            <StatItem icon={Droplets} label="Humidity" value={worker.humidity} unit="%" />
            <StatItem icon={MapPin} label="Nearest Node" value={worker.proximity?.nearest_node?.replace('_', ' ').toUpperCase()} />
            <StatItem icon={Activity} label="Activity" value={Math.sqrt(
              (worker.activity?.ax || 0) ** 2 + (worker.activity?.ay || 0) ** 2 + (worker.activity?.az || 0) ** 2
            ).toFixed(1)} unit="g" />
            <StatItem icon={Clock} label="Last Update" value={new Date(worker.timestamp).toLocaleTimeString()} />
            <StatItem icon={Clock} label="Trust" value={formatPercent(aegisDevice?.trust)} />
          </div>
        </motion.div>

        {/* Charts + sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Charts */}
          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LiveLineChart data={history} dataKey="heart_rate" label="Heart Rate" unit="bpm" color="#C15450" />
              <LiveLineChart data={history} dataKey="spo2" label="Blood Oxygen (SpO₂)" unit="%" color="#6B8BA4" />
              <LiveLineChart data={history} dataKey="temperature" label="Body Temperature" unit="°C" color="#C49A3C" />
              <LiveLineChart data={history} dataKey="humidity" label="Skin Humidity" unit="%" color="#5B8C5A" />
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Location */}
            <div className="bg-white rounded-xl border border-warm-300/60 p-4">
              <h3 className="text-[13px] font-semibold text-warm-700 mb-3">Location</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-warm-500">Nearest Node</span>
                  <span className="text-[12px] font-semibold text-warm-800">{worker.proximity?.nearest_node?.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* PPE Status */}
            <div className="bg-white rounded-xl border border-warm-300/60 p-4">
              <h3 className="text-[13px] font-semibold text-warm-700 mb-3">PPE Compliance</h3>
              <div className="space-y-2">
                <PPEItem label="Helmet" detected={ppe?.helmet} />
                <PPEItem label="Safety Vest" detected={ppe?.vest} />
                <PPEItem label="Gloves" detected={ppe?.gloves} />
              </div>
            </div>

            {/* Work info */}
            <div className="bg-white rounded-xl border border-warm-300/60 p-4">
              <h3 className="text-[13px] font-semibold text-warm-700 mb-3">Work Summary</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-warm-500">Shift</span>
                  <span className="text-[12px] font-medium text-warm-700">Morning (6:00 – 14:00)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-warm-500">Hours Today</span>
                  <span className="text-[12px] font-medium text-warm-700">6.5 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-warm-500">Monthly Hours</span>
                  <span className="text-[12px] font-medium text-warm-700">156 hrs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, unit, danger }) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 text-warm-500 mx-auto mb-1" strokeWidth={1.8} />
      <p className={`text-[16px] font-bold ${danger ? 'text-danger-500' : 'text-warm-800'}`}>
        {value}
        {unit && <span className="text-[10px] text-warm-500 ml-0.5">{unit}</span>}
      </p>
      <p className="text-[10px] text-warm-500 mt-0.5">{label}</p>
    </div>
  );
}

function PPEItem({ label, detected }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-warm-600">{label}</span>
      <StatusBadge status={detected ? 'safe' : 'danger'} label={detected ? 'OK' : 'Missing'} />
    </div>
  );
}

function formatPercent(value) {
  if (typeof value !== 'number') return '—';
  return `${Math.round(value * 100)}%`;
}
