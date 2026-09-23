import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  BrainCircuit,
  Users,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Settings,
  Mountain,
  Clock,
  Activity,
} from 'lucide-react';
import useAtlasStore from '../../store/useAtlasStore';

const navGroups = [
  {
    label: 'Main Operations',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Overview' },
      { to: '/monitoring', icon: Radio, label: 'Live Monitoring' },
      { to: '/ai-prediction', icon: BrainCircuit, label: 'AI Prediction' },
    ]
  },
  {
    label: 'Personnel & Security',
    items: [
      { to: '/workers', icon: Users, label: 'Workers Roster' },
      { to: '/ppe', icon: ShieldCheck, label: 'PPE Compliance' },
      { to: '/alerts', icon: AlertTriangle, label: 'Alert History' },
    ]
  },
  {
    label: 'AEGIS Control',
    items: [
      { to: '/aegis', icon: Activity, label: 'Trust & Topology' },
    ]
  },
  {
    label: 'Administration',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Deep Analytics' },
      { to: '/settings', icon: Settings, label: 'System Config' },
    ]
  }
];

export default function Sidebar() {
  const { lastUpdate } = useAtlasStore();

  return (
    <aside className="w-[300px] h-full shrink-0 bg-[#F1F5F9] border-r border-warm-200 flex flex-col z-[100] relative">
      {/* Refined Branding Section */}
      <div className="h-[120px] px-10 shrink-0 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-warm-900 flex items-center justify-center shadow-lg">
          <Mountain className="w-6.5 h-6.5 text-copper-400" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-warm-900 tracking-tight leading-none uppercase">ATLAS</h1>
          <p className="text-[9px] text-warm-400 font-bold tracking-[0.2em] uppercase mt-1.5">Mining Safety</p>
        </div>
      </div>

      {/* Navigation Area */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 px-6 space-y-8">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="px-4 text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-4">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                      isActive ? 'sidebar-active' : 'sidebar-item'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-warm-400 group-hover:text-warm-900'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 truncate tracking-tight">{item.label}</span>
                      {isActive && <div className="w-1.5 h-1.5 bg-copper-400 rounded-full" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Bottom Section */}
      <div className="shrink-0 p-8 border-t border-warm-200 bg-white/50">
        <div className="inner-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-safe-500 pulse-safe" />
              <span className="text-[11px] font-bold text-warm-600 uppercase tracking-wider">Sector Live</span>
            </div>
            <Activity className="w-4 h-4 text-warm-400" />
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-warm-400">
            <Clock className="w-4 h-4" />
            <span className="truncate tracking-wider">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Syncing...'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

