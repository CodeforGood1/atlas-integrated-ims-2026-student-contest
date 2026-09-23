import { motion } from 'framer-motion';

export default function AnalyticsCard({ title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`premium-card p-8 flex flex-col min-h-[400px] bg-white shadow-xl ${className}`}
    >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-warm-100">
        <div className="flex items-center gap-5">
          {Icon && (
            <div className="w-12 h-12 rounded-[18px] bg-warm-900/5 text-warm-900 flex items-center justify-center border-2 border-warm-900/10 shadow-sm">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="section-title text-[15px]">{title}</h3>
            {subtitle && (
              <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest mt-1.5 italic">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0">
        {children}
      </div>
    </motion.div>
  );
}
