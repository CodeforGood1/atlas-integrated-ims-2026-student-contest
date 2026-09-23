import { motion } from 'framer-motion';

export default function GaugeChart({ value, label, unit, thresholds, size = 150 }) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (thresholds) {
      if (value >= thresholds.danger) return '#EF4444';
      if (value >= thresholds.warning) return '#F59E0B';
      return '#10B981';
    }
    return '#64748B';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center justify-center group py-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
          />
        </svg>
        
        {/* Value text center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline gap-0.5">
             <span className="text-[28px] font-bold text-warm-900 tracking-tighter tabular-nums leading-none">
               {value}
             </span>
             {unit && (
               <span className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider leading-none mb-1">
                 {unit}
               </span>
             )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-[11px] font-semibold text-warm-500 uppercase tracking-[0.1em] leading-none mb-1.5">
          {label}
        </p>
        <div className="w-4 h-0.5 bg-warm-200 mx-auto rounded-full group-hover:w-8 group-hover:bg-warm-900 transition-all duration-500" />
      </div>
    </div>
  );
}


