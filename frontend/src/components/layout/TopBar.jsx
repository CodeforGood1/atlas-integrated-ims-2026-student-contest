import { useNavigate } from 'react-router-dom';
import { Bell, Search, RefreshCw, Command, User, ShieldCheck } from 'lucide-react';
import useAtlasStore from '../../store/useAtlasStore';

export default function TopBar({ title, subtitle }) {
  const navigate = useNavigate();
  const { alerts, fetchData, testMode, setTestMode, seedBackendData, isSeeding, seedStatus, seedError, dataSource } = useAtlasStore();
  const dangerCount = alerts.filter((a) => a.severity === 'danger').length;
  const sourceStatus = dataSource?.status || (testMode ? 'demo' : 'idle');
  const sourceTone = testMode
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : sourceStatus === 'live'
      ? 'bg-safe-50 text-safe-700 border-safe-200'
      : sourceStatus === 'partial'
        ? 'bg-info-500/10 text-info-700 border-info-500/20'
        : sourceStatus === 'error'
          ? 'bg-danger-500/10 text-danger-600 border-danger-500/20'
          : 'bg-warm-50 text-warm-600 border-warm-200';
  const sourceDot = testMode
    ? 'bg-amber-500 animate-pulse'
    : sourceStatus === 'live'
      ? 'bg-safe-500 pulse-safe'
      : sourceStatus === 'partial'
        ? 'bg-info-500'
        : sourceStatus === 'error'
          ? 'bg-danger-500'
          : 'bg-warm-300';

  const handleRefresh = async () => {
    await fetchData();
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.toLowerCase().trim().replace(/\s+|_/g, '');
      
      // Node Navigation (e.g., "node 1", "n1", "node_1", "node1")
      if (query.startsWith('node') || query.startsWith('n')) {
        const num = query.replace('node', '').replace('n', '');
        if (!isNaN(num) && num !== '') {
          navigate(`/node/node_${num}`);
        }
      } 
      // Worker Navigation (e.g., "worker 1", "w1", "worker_1", "worker1")
      else if (query.startsWith('worker') || query.startsWith('w')) {
        const num = query.replace('worker', '').replace('w', '');
        if (!isNaN(num) && num !== '') {
          navigate(`/worker/worker_${num}`);
        }
      }
      // Page Navigation
      const page = e.target.value.toLowerCase().trim();
      if (page === 'alerts' || page === 'history') navigate('/alerts');
      else if (page === 'monitoring' || page === 'map') navigate('/monitoring');
      else if (page === 'ppe' || page === 'security') navigate('/ppe');
      else if (page === 'dashboard' || page === 'home') navigate('/');

      e.target.value = '';
    }
  };

  return (
    <header className="h-[100px] shrink-0 bg-white border-b border-warm-200 flex items-center justify-between px-12 sticky top-0 z-[90] w-full">
      <div className="flex flex-col min-w-0">
        <h2 className="text-[24px] font-bold text-warm-900 tracking-tight leading-none uppercase">{title}</h2>
        {subtitle && <p className="text-[11px] text-warm-400 font-bold mt-2.5 uppercase tracking-widest leading-none">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-10 shrink-0">
        {/* Search Hub */}
        <div className="relative hidden xl:flex items-center group w-[360px]">
          <Search className="w-5 h-5 text-warm-400 absolute left-5 group-focus-within:text-warm-900 transition-colors" />
          <input
            type="text"
            onKeyDown={handleSearch}
            placeholder="Search Telemetry..."
            className="pl-14 pr-16 h-[48px] text-[12px] bg-warm-50 border border-warm-200 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-copper-500/5 focus:border-copper-500/40 transition-all placeholder:text-warm-400 font-semibold uppercase tracking-wider"
          />
          <div className="absolute right-5 px-2 py-1 rounded-lg border border-warm-200 text-[9px] font-bold text-warm-400 bg-white flex items-center gap-1.5 shadow-sm">
            <Command className="w-3 h-3" />
            K
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest ${sourceTone}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${sourceDot}`} />
            {dataSource?.label || (testMode ? 'Lab Simulation' : 'Live Mode: No Active Feed')}
          </div>
          <div className="flex items-center rounded-xl border border-warm-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setTestMode(false)}
              title="Use backend hardware feed and clear lab telemetry"
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${!testMode ? 'bg-safe-600 text-white' : 'text-warm-500 hover:bg-warm-50'}`}
            >
              Live
            </button>
            <button
              onClick={() => setTestMode(true)}
              title="Use synthetic local lab data"
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${testMode ? 'bg-amber-500 text-white' : 'text-warm-500 hover:bg-warm-50'}`}
            >
              Lab
            </button>
          </div>
          {testMode && (
            <button
              onClick={() => seedBackendData({ rounds: 10 })}
              disabled={isSeeding}
              title="Register lab devices and send baseline learning data"
              className={`px-3 py-2 rounded-xl border font-bold transition-all ${isSeeding ? 'bg-warm-100 text-warm-400 border-warm-200 cursor-not-allowed' : 'bg-white text-copper-700 border-copper-200 hover:bg-copper-50 hover:border-copper-300'}`}
            >
              {isSeeding ? 'Seeding...' : 'Seed Lab Fleet'}
            </button>
          )}
          <button 
            onClick={() => navigate('/alerts')}
            className="relative p-3.5 rounded-xl bg-white border border-warm-200 hover:border-warm-300 hover:bg-warm-50 transition-all group shadow-sm active:scale-95"
          >
            <Bell className="w-6 h-6 text-warm-600 group-hover:text-warm-900" />
            {dangerCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {dangerCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={handleRefresh}
            className="p-3.5 rounded-xl bg-white border border-warm-200 hover:border-warm-300 hover:bg-warm-50 transition-all group shadow-sm active:scale-95 active:rotate-180 duration-500"
          >
            <RefreshCw className="w-6 h-6 text-warm-600 group-hover:text-warm-900" />
          </button>
        </div>

        {(seedStatus || seedError) && (
          <div className="hidden xl:flex flex-col items-end pl-2">
            {seedStatus && <p className={`text-[10px] font-bold uppercase tracking-widest ${seedError ? 'text-danger-600' : 'text-safe-600'}`}>{seedStatus}</p>}
            {seedError && <p className="text-[10px] font-semibold text-danger-500 max-w-[240px] truncate">{seedError}</p>}
          </div>
        )}

        {/* Profile area */}
        <div className="flex items-center gap-5 pl-8 border-l border-warm-200">
          <div className="text-right hidden md:block">
            <p className="text-[14px] font-bold text-warm-900 leading-none uppercase tracking-tight">Supervisor</p>
            <p className="text-[9px] font-bold text-safe-500 uppercase tracking-widest mt-2 flex items-center justify-end gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-warm-900 flex items-center justify-center shadow-lg border border-warm-800 group cursor-pointer hover:scale-105 transition-all">
            <User className="w-6 h-6 text-copper-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
