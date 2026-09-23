import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-warm-100">
      {/* Sidebar - Bold Presence (300px) */}
      <Sidebar />
      
      {/* Main Command Hub Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
        </main>
        
        {/* Stationary Premium Footer */}
        <footer className="px-12 py-6 border-t border-warm-200 bg-white flex justify-between items-center text-[10px] font-bold text-warm-400 uppercase tracking-widest shrink-0">
          <span>© 2026 ATLAS MINING SAFETY PLATFORM</span>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-safe-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span>TIER 1 OPERATIONAL CLEARANCE</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
