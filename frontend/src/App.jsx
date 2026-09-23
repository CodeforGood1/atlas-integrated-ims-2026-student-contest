import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import RealTimeMonitoring from './pages/RealTimeMonitoring';
import NodeDetail from './pages/NodeDetail';
import AIPrediction from './pages/AIPrediction';
import WorkersMonitoring from './pages/WorkersMonitoring';
import WorkerDetail from './pages/WorkerDetail';
import PPEDetection from './pages/PPEDetection';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AegisOverview from './pages/AegisOverview';
import useAtlasStore from './store/useAtlasStore';

export default function App() {
  const startPolling = useAtlasStore((s) => s.startPolling);

  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, [startPolling]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/monitoring" element={<RealTimeMonitoring />} />
          <Route path="/node/:nodeId" element={<NodeDetail />} />
          <Route path="/ai-prediction" element={<AIPrediction />} />
          <Route path="/workers" element={<WorkersMonitoring />} />
          <Route path="/worker/:workerId" element={<WorkerDetail />} />
          <Route path="/ppe" element={<PPEDetection />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/aegis" element={<AegisOverview />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
