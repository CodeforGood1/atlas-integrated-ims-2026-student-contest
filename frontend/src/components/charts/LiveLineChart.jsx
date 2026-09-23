import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const defaultColors = {
  temperature: '#C15450',
  o2_level: '#6B8BA4',
  humidity: '#5B8C5A',
  vibration: '#C49A3C',
  pressure: '#9C7B5C',
  mq2: '#D46B67',
  mq6: '#C49A3C',
  mq7: '#82A3BA',
  mq135: '#B8936F',
  heart_rate: '#C15450',
  spo2: '#6B8BA4',
};

export default function LiveLineChart({ data, dataKey, label, unit, color, height = 240, hideLabel = false }) {
  const lineColor = color || defaultColors[dataKey] || '#9C7B5C';

  return (
    <div className="w-full h-full">
      {!hideLabel && (
        <div className="flex items-center justify-between mb-4 px-2">
          <h4 className="text-[11px] font-black text-warm-500 uppercase tracking-widest">{label}</h4>
          {data.length > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-xl font-black text-warm-900 tracking-tighter leading-none">
                {data[data.length - 1][dataKey]}
                <span className="text-[10px] font-bold text-warm-400 ml-1 uppercase tracking-widest">{unit}</span>
              </span>
            </div>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#EFEDE9" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#9C958C', fontWeight: 600 }}
            axisLine={{ stroke: '#EFEDE9' }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9C958C', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #E5E1D9',
              borderRadius: '12px',
              fontSize: '12px',
              padding: '10px 14px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#6B6560', fontSize: '10px', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}
            itemStyle={{ fontWeight: 800, color: lineColor }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
            animationDuration={400}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
