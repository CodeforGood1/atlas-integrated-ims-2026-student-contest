import { motion } from 'framer-motion';

export default function KpiCard({ icon: Icon, label, value, unit, status, delay = 0 }) {
  const statusColors = {
    safe: 'bg-safe-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-info-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      className="premium-card h-[180px] p-7 flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-warm-50 border border-warm-200 flex items-center justify-center text-warm-500 group-hover:text-warm-900 transition-colors">
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || 'bg-warm-300'} ${status === 'danger' ? 'animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`} />
      </div>

      {/* Middle Section - Metric */}
      <div className="flex items-baseline gap-2">
        <span className="text-[38px] font-bold text-warm-900 tracking-tight leading-none tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-[14px] font-semibold text-warm-400 uppercase tracking-wider mb-0.5">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom Section - Label */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold text-warm-500 uppercase tracking-[0.1em] leading-none">
          {label}
        </p>
        <div className="w-8 h-1 bg-warm-100 rounded-full group-hover:bg-warm-900 transition-all duration-500" />
      </div>
    </motion.div>
  );
}


