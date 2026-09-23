export default function StatusBadge({ status, label }) {
  const styles = {
    safe: 'bg-safe-500/10 text-safe-600 border-safe-500/20',
    warning: 'bg-warning-500/10 text-warning-600 border-warning-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]',
    danger: 'bg-danger-500/10 text-danger-600 border-danger-500/20 shadow-[0_0_15px_rgba(220,38,38,0.1)] animate-pulse',
    offline: 'bg-warm-100 text-warm-400 border-warm-200',
    info: 'bg-info-500/10 text-info-600 border-info-500/20',
  };

  const dotColors = {
    safe: 'bg-safe-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    warning: 'bg-warning-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
    danger: 'bg-danger-500 shadow-[0_0_12px_rgba(220,38,38,0.8)]',
    offline: 'bg-warm-300',
    info: 'bg-info-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
  };

  return (
    <span className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border-2 ${styles[status] || styles.info} transition-all`}>
      <span className={`w-2 h-2 rounded-full ${dotColors[status] || dotColors.info}`} />
      {label || status}
    </span>
  );
}

