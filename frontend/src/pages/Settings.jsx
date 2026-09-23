import { useState } from 'react';
import { 
  ShieldAlert, 
  BellRing, 
  Cpu, 
  Save, 
  RotateCcw,
  Zap,
  Wifi,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import SettingGroup from '../components/common/SettingGroup';
import useAtlasStore, { INITIAL_THRESHOLDS } from '../store/useAtlasStore';

export default function Settings() {
  const { 
    thresholds, 
    updateThresholds, 
    cloudSyncEnabled, 
    cloudStatusLoading, 
    cloudStatusError,
    setCloudSyncEnabled 
  } = useAtlasStore();
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [showSaved, setShowSaved] = useState(false);

  const handleUpdate = (category, type, value) => {
    setLocalThresholds(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: parseFloat(value)
      }
    }));
  };

  const saveSettings = () => {
    updateThresholds(localThresholds);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <div className="w-full min-h-full flex flex-col bg-[#F8FAFC]">
      <TopBar title="System Configuration" subtitle="Universal Safety Parameters & Neural Protocol Calibration" />
      
      <div className="flex-1 p-10 lg:p-14 space-y-12 w-full max-w-[1400px] mx-auto pb-32">
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          {/* Group 1: Atmospheric Thresholds */}
          <SettingGroup 
            title="Atmospheric Threshold Matrix" 
            description="Fine-tune gaseous & thermal alert triggers"
            icon={ShieldAlert}
          >
            <div className="space-y-10">
              <ThresholdControl
                label="MQ135 Air Quality"
                unit="raw"
                warning={localThresholds.mq135.warning}
                danger={localThresholds.mq135.danger}
                onWarningChange={(v) => handleUpdate('mq135', 'warning', v)}
                onDangerChange={(v) => handleUpdate('mq135', 'danger', v)}
                step={10}
                min={0}
                max={4095}
              />
              <ThresholdControl 
                label="Thermal Stability" 
                unit="°C" 
                warning={localThresholds.temperature.warning} 
                danger={localThresholds.temperature.danger}
                onWarningChange={(v) => handleUpdate('temperature', 'warning', v)}
                onDangerChange={(v) => handleUpdate('temperature', 'danger', v)}
                step={0.5}
                min={20}
                max={50}
              />
              <ThresholdControl 
                label="Gas Concentration (MQ7)" 
                unit="PPM" 
                warning={localThresholds.mq7.warning} 
                danger={localThresholds.mq7.danger}
                onWarningChange={(v) => handleUpdate('mq7', 'warning', v)}
                onDangerChange={(v) => handleUpdate('mq7', 'danger', v)}
                step={10}
                min={0}
                max={1024}
              />
            </div>
          </SettingGroup>

          {/* Group 2: Biometric Thresholds */}
          <SettingGroup 
            title="Biometric Safety Hub" 
            description="Calibrate personnel health monitoring limits"
            icon={Zap}
          >
            <div className="space-y-10">
              <ThresholdControl 
                label="Maximum Heart Rate" 
                unit="BPM" 
                warning={localThresholds.heart_rate_high.warning} 
                danger={localThresholds.heart_rate_high.danger}
                onWarningChange={(v) => handleUpdate('heart_rate_high', 'warning', v)}
                onDangerChange={(v) => handleUpdate('heart_rate_high', 'danger', v)}
                step={1}
                min={80}
                max={180}
              />
              <ThresholdControl 
                label="Minimum SpO2 Saturation" 
                unit="%" 
                warning={localThresholds.spo2.warning} 
                danger={localThresholds.spo2.danger}
                onWarningChange={(v) => handleUpdate('spo2', 'warning', v)}
                onDangerChange={(v) => handleUpdate('spo2', 'danger', v)}
                step={1}
                min={85}
                max={100}
              />
              <ThresholdControl 
                label="Minimum Heart Rate" 
                unit="BPM" 
                warning={localThresholds.heart_rate_low.warning} 
                danger={localThresholds.heart_rate_low.danger}
                onWarningChange={(v) => handleUpdate('heart_rate_low', 'warning', v)}
                onDangerChange={(v) => handleUpdate('heart_rate_low', 'danger', v)}
                step={1}
                min={40}
                max={80}
              />
            </div>
          </SettingGroup>

          {/* Group 3: Alert Protocol */}
          <SettingGroup 
            title="Neural Alert Dispatch" 
            description="Manage platform response signals"
            icon={BellRing}
          >
            <div className="space-y-6">
               <ToggleControl label="Dashboard Audio Sirens" description="Play audible warnings during danger events" active={true} />
               <ToggleControl label="Auto-Gate PPE Link" description="Lock secondary gates on PPE non-compliance" active={true} />
               <ToggleControl label="External SMS Relay" description="Dispatch critical alerts to emergency contacts" active={false} />
               <ToggleControl 
                 label="Cloud Sync Bridge" 
                 description={cloudSyncEnabled ? 'Cloud updates enabled for outbound telemetry and inbound orders' : 'Cloud sync paused for outbound telemetry and inbound orders'}
                 active={cloudSyncEnabled ?? false}
                 disabled={cloudStatusLoading || cloudSyncEnabled === null}
                 onToggle={(next) => setCloudSyncEnabled(next)}
               />
               {cloudStatusError && (
                 <p className="text-[11px] font-semibold text-danger-600 uppercase tracking-wider">
                   Cloud status: {cloudStatusError}
                 </p>
               )}
            </div>
          </SettingGroup>

          {/* Group 4: Hardware Diagnostics */}
          <SettingGroup 
            title="Hardware Integrity Hub" 
            description="Diagnostic status of node grid"
            icon={Cpu}
          >
             <div className="grid grid-cols-2 gap-6">
                <StatusItem label="Active Nodes" value="02" ok={true} icon={Wifi} />
                <StatusItem label="Watch Wearables" value="03" ok={true} icon={Zap} />
                <StatusItem label="Vision Pipeline" value="24 FPS" ok={true} icon={Cpu} />
                <StatusItem label="Database Lag" value="4ms" ok={true} icon={Database} />
             </div>
             <div className="mt-8 p-6 rounded-[24px] bg-warm-900 text-white flex items-center justify-between border-2 border-warm-800">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50">Firmware Signature</p>
                   <p className="text-[14px] font-black tracking-tight">ATLAS-OS V1.0.4 - STABLE</p>
                </div>
                <RotateCcw className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
             </div>
          </SettingGroup>

        </div>

        {/* Save Bar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-6 bg-white rounded-[32px] border-2 border-warm-900 shadow-2xl z-50">
           <AnimatePresence>
             {showSaved && (
               <motion.p 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0 }}
                 className="text-[11px] font-black text-safe-600 uppercase tracking-widest mr-4"
               >
                 Protocol Updated Successfully
               </motion.p>
             )}
           </AnimatePresence>
           <button 
             onClick={() => setLocalThresholds(INITIAL_THRESHOLDS)}
             className="px-8 py-3 bg-warm-100 text-warm-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-warm-200 transition-all"
           >
              Reset to Factory
           </button>
           <button 
             onClick={saveSettings}
             className="flex items-center gap-4 px-10 py-3 bg-warm-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
           >
              <Save className="w-4 h-4" /> Save Configuration
           </button>
        </div>

      </div>
    </div>
  );
}

function ThresholdControl({ label, unit, warning, danger, onWarningChange, onDangerChange, step, min, max }) {
  return (
    <div className="space-y-6">
       <p className="text-[13px] font-black text-warm-900 uppercase tracking-tight flex items-center justify-between">
         {label}
         <span className="text-[10px] font-black text-warm-400 opacity-60">VAL: {unit}</span>
       </p>
       <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-warning-600">
                <span>Warning</span>
                <span>{warning}{unit}</span>
             </div>
             <input 
               type="range" 
               min={min} 
               max={max} 
               step={step} 
               value={warning} 
               onChange={(e) => onWarningChange(e.target.value)}
               className="w-full accent-warning-500 h-1.5 bg-warm-100 rounded-lg appearance-none cursor-pointer" 
             />
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-danger-600">
                <span>Danger</span>
                <span>{danger}{unit}</span>
             </div>
             <input 
               type="range" 
               min={min} 
               max={max} 
               step={step} 
               value={danger} 
               onChange={(e) => onDangerChange(e.target.value)}
               className="w-full accent-danger-500 h-1.5 bg-warm-100 rounded-lg appearance-none cursor-pointer" 
             />
          </div>
       </div>
    </div>
  );
}

function ToggleControl({ label, description, active, onToggle, disabled = false }) {
  const [localOn, setLocalOn] = useState(active);
  const isControlled = typeof onToggle === 'function';
  const isOn = isControlled ? Boolean(active) : localOn;
  const handleToggle = () => {
    if (disabled) return;
    const next = !isOn;
    if (isControlled) {
      onToggle(next);
    } else {
      setLocalOn(next);
    }
  };
  return (
    <div className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all group ${disabled ? 'border-warm-100 bg-warm-50/60 opacity-70' : 'border-warm-50 hover:border-warm-200 hover:bg-white'}`}>
       <div className="flex-1">
          <p className="text-[14px] font-black text-warm-900 mb-1">{label}</p>
          <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">{description}</p>
       </div>
       <button 
         onClick={handleToggle}
         disabled={disabled}
         className={`w-14 h-8 rounded-full transition-all relative ${isOn ? 'bg-warm-900' : 'bg-warm-200'} ${disabled ? 'cursor-not-allowed' : ''}`}
       >
          <motion.div 
            animate={{ x: isOn ? 28 : 4 }}
            className="w-5.5 h-5.5 bg-white rounded-full shadow-sm mt-1.25"
          />
       </button>
    </div>
  );
}

function StatusItem({ label, value, ok, icon: Icon }) {
  return (
    <div className="p-6 rounded-2xl border-2 border-warm-100 bg-white flex flex-col items-center text-center">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${ok ? 'bg-safe-500/10 text-safe-600' : 'bg-danger-500/10 text-danger-600'}`}>
          <Icon className="w-5 h-5" />
       </div>
       <p className="text-[10px] font-black text-warm-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-[16px] font-black text-warm-900 tabular-nums">{value}</p>
    </div>
  );
}
