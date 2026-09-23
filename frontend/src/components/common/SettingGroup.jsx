export default function SettingGroup({ title, description, icon: Icon, children }) {
  return (
    <div className="premium-card p-10 bg-white shadow-xl">
      <div className="flex items-center gap-6 mb-10 pb-8 border-b-2 border-warm-100">
        <div className="w-14 h-14 rounded-[22px] bg-warm-900 text-white flex items-center justify-center shadow-lg border-2 border-warm-800">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="section-title text-[18px] mb-2">{title}</h3>
          <p className="text-[11px] font-black text-warm-400 uppercase tracking-widest leading-none italic">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-10">
        {children}
      </div>
    </div>
  );
}
