import { 
  BarChart3, 
  Wind, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Database,
  History
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie, 
  ScatterChart, 
  Scatter,
  ZAxis
} from 'recharts';
import TopBar from '../components/layout/TopBar';
import AnalyticsCard from '../components/common/AnalyticsCard';
import useAtlasStore from '../store/useAtlasStore';

export default function Analytics() {
  const { nodes, workers, ppe, alertLog, nodeHistory } = useAtlasStore();

  // 1. Data Transformation: Combined Atmospheric Trends
  // We'll take the first node's history as a representative for general trends
  const mainNodeId = nodes[0]?.node_id;
  const atmosphericData = nodeHistory[mainNodeId] || [];

  // 2. Data Transformation: Biometric Health (Scatter)
  const biometricData = workers.map(w => ({
    hr: w.heart_rate,
    spo2: w.spo2,
    id: w.worker_id.replace('worker_', 'W'),
    status: w.sos_button === 1 ? 'danger' : (w.heart_rate > 100 || w.spo2 < 95) ? 'warning' : 'safe'
  }));

  // 3. Data Transformation: Sector Incidents (Bar)
  const sectorIncidents = nodes.map(n => ({
    name: n.node_id.replace('_', ' ').toUpperCase(),
    incidents: alertLog.filter(a => a.node === n.node_id).length,
    critical: alertLog.filter(a => a.node === n.node_id && a.severity === 'danger').length
  }));

  // 4. Data Transformation: PPE Compliance (Pie)
  const ppeStats = [
    { name: 'Compliant', value: ppe?.gate_status === 1 ? 1 : 0, color: '#10B981' },
    { name: 'Non-Compliant', value: ppe?.gate_status === 0 ? 1 : 0, color: '#EF4444' }
  ];

  return (
    <div className="w-full min-h-full flex flex-col bg-[#F8FAFC]">
      <TopBar title="Deep Analytics" subtitle="Multi-Modal Operational Intelligence | Long-Term Safety Forecasting" />
      
      <div className="flex-1 p-10 lg:p-14 space-y-12 w-full max-w-full">
        {/* Top Metric Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <div className="bg-white p-6 rounded-[28px] border-2 border-warm-200 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-info-500/10 text-info-600 flex items-center justify-center">
                 <Database className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest">Total Datapoints</p>
                 <p className="text-[20px] font-black text-warm-900 tracking-tighter">{(atmosphericData.length * nodes.length).toLocaleString()}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[28px] border-2 border-warm-200 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-copper-500/10 text-copper-600 flex items-center justify-center">
                 <History className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest">Temporal Window</p>
                 <p className="text-[20px] font-black text-warm-900 tracking-tighter">~3.3 Minutes</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[28px] border-2 border-warm-200 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-danger-500/10 text-danger-600 flex items-center justify-center">
                 <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest">System Anomaly Rate</p>
                 <p className="text-[20px] font-black text-warm-900 tracking-tighter">{((alertLog.length / (nodes.length || 1)).toFixed(1))} per Node</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[28px] border-2 border-warm-200 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-safe-500/10 text-safe-600 flex items-center justify-center">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest">Neural Confidence</p>
                 <p className="text-[20px] font-black text-warm-900 tracking-tighter">98.4%</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Atmospheric Trend Analysis - col-span-8 */}
          <div className="xl:col-span-8">
            <AnalyticsCard 
              title="Atmospheric Chronology" 
              subtitle="Fusion trend for environmental stability"
              icon={Wind}
            >
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={atmosphericData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMq135" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                      interval="preserveStartEnd"
                      minTickGap={50}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' }} />
                    <Area type="monotone" dataKey="mq135" name="MQ135 Air" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorMq135)" />
                    <Area type="monotone" dataKey="temperature" name="Temp °C" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                    <Area type="monotone" dataKey="mq7" name="MQ7 Gas" stroke="#9C7B5C" strokeWidth={3} fillOpacity={0.1} fill="#9C7B5C" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>

          {/* PPE Compliance - col-span-4 */}
          <div className="xl:col-span-4">
            <AnalyticsCard 
              title="PPE Protocol Compliance" 
              subtitle="Real-time vision audit status"
              icon={ShieldCheck}
            >
              <div className="h-[400px] w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie
                      data={ppeStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {ppeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                   <p className="text-[32px] font-black text-warm-900 tracking-tighter">
                     {ppe?.gate_status === 1 ? '100%' : '0%'}
                   </p>
                   <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest">Current Protocol Adherence</p>
                </div>
              </div>
            </AnalyticsCard>
          </div>

          {/* Biometric Variance - col-span-6 */}
          <div className="xl:col-span-6">
            <AnalyticsCard 
              title="Biometric Health Distribution" 
              subtitle="Worker vital clustering analysis"
              icon={Activity}
            >
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      type="number" 
                      dataKey="hr" 
                      name="Heart Rate" 
                      unit="bpm" 
                      domain={[50, 150]} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="spo2" 
                      name="SpO2" 
                      unit="%" 
                      domain={[85, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                    />
                    <ZAxis type="category" dataKey="id" name="Operator" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Personnel" data={biometricData}>
                      {biometricData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.status === 'danger' ? '#EF4444' : entry.status === 'warning' ? '#F59E0B' : '#10B981'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>

          {/* Sector Incident Distribution - col-span-6 */}
          <div className="xl:col-span-6">
            <AnalyticsCard 
              title="Sector Incident Velocity" 
              subtitle="Anomaly frequency by operational node"
              icon={BarChart3}
            >
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorIncidents} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#F1F5F9', radius: 12 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' }} />
                    <Bar dataKey="incidents" name="Total Alerts" fill="#9C7B5C" radius={[10, 10, 0, 0]} barSize={40} />
                    <Bar dataKey="critical" name="Critical Events" fill="#EF4444" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>

        </div>
      </div>
    </div>
  );
}
