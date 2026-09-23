import { AlertTriangle, AlertCircle, Info, Siren } from 'lucide-react';
import { motion } from 'framer-motion';

const icons = {
  danger: Siren,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  danger: 'border-l-danger-500 bg-danger-500/5',
  warning: 'border-l-warning-500 bg-warning-500/5',
  info: 'border-l-info-500 bg-info-500/5',
};

const iconColors = {
  danger: 'text-danger-500',
  warning: 'text-warning-500',
  info: 'text-info-500',
};

export default function AlertCard({ alert, index = 0 }) {
  const Icon = icons[alert.severity] || AlertCircle;
  const time = alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={`border-l-[6px] rounded-r-[24px] p-6 shadow-sm border-2 border-y-warm-100 border-r-warm-100 ${colors[alert.severity] || colors.info} group hover:shadow-md transition-all active:scale-[0.99]`}
    >
      <div className="flex items-start gap-5">
        <div className={`p-3 rounded-xl bg-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform ${iconColors[alert.severity]}`}>
          <Icon className="w-6 h-6" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] text-warm-900 font-black uppercase tracking-tight leading-tight mb-2 pr-4">{alert.message}</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black text-warm-500 uppercase tracking-widest">{alert.node?.replace('_', ' ') || 'UNLINKED'}</span>
            <span className="w-1 h-1 rounded-full bg-warm-300" />
            <span className="text-[11px] font-black text-warm-400 uppercase tracking-widest tabular-nums">{time}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

