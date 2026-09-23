import { useNavigate } from 'react-router-dom';
import useAtlasStore from '../../store/useAtlasStore';

const NODE_POSITIONS = {
  node_1: { x: 180, y: 200, label: 'Node 1 - Shaft A' },
  node_2: { x: 520, y: 280, label: 'Node 2 - Tunnel B' },
  node_3: { x: 350, y: 235, label: 'Node 3' },
};

const statusColors = {
  safe: '#5B8C5A',
  warning: '#C49A3C',
  danger: '#C15450',
  offline: '#A39E96',
};

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function jitterForId(id) {
  const hash = hashString(id || 'unknown');
  const jitterX = ((hash % 1000) / 1000 - 0.5) * 60;
  const jitterY = (((Math.floor(hash / 1000)) % 1000) / 1000 - 0.5) * 40;
  return { jitterX, jitterY };
}

export default function MineMap() {
  const navigate = useNavigate();
  const { nodes, workers, getNodeStatus } = useAtlasStore();

  const workerPositions = workers.map((w) => {
    const nearest = w.proximity?.nearest_node || 'node_1';
    const nodePos = NODE_POSITIONS[nearest] || { x: 350, y: 240 };
    const { jitterX, jitterY } = jitterForId(w.worker_id);
    return { ...w, x: nodePos.x + jitterX + 40, y: nodePos.y + jitterY };
  });

  return (
    <div className="bg-white rounded-xl border border-warm-300/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-warm-200 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-warm-700">Underground Mine Layout</h3>
        <div className="flex items-center gap-4">
          <Legend color="#5B8C5A" label="Safe" />
          <Legend color="#C49A3C" label="Warning" />
          <Legend color="#C15450" label="Danger" />
          <Legend color="#6B8BA4" label="Worker" />
        </div>
      </div>

      <svg viewBox="0 0 700 420" className="w-full h-auto bg-warm-100" style={{ minHeight: '320px' }}>
        <defs>
          <filter id="tunnel-shadow" x="-4%" y="-4%" width="108%" height="108%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00000010" />
          </filter>
        </defs>

        <rect x="80" y="50" width="60" height="340" rx="8" fill="#D4CEC6" stroke="#B8B0A6" strokeWidth="1" filter="url(#tunnel-shadow)" />
        <text x="110" y="40" textAnchor="middle" fill="#6B6560" fontFamily="Inter" fontSize="10" fontWeight="600">MAIN SHAFT</text>

        <rect x="140" y="170" width="200" height="50" rx="6" fill="#D4CEC6" stroke="#B8B0A6" strokeWidth="1" filter="url(#tunnel-shadow)" />
        <text x="240" y="164" textAnchor="middle" fill="#6B6560" fontFamily="Inter" fontSize="9" fontWeight="500">TUNNEL A</text>

        <rect x="140" y="260" width="460" height="50" rx="6" fill="#D4CEC6" stroke="#B8B0A6" strokeWidth="1" filter="url(#tunnel-shadow)" />
        <text x="370" y="254" textAnchor="middle" fill="#6B6560" fontFamily="Inter" fontSize="9" fontWeight="500">TUNNEL B</text>

        <rect x="340" y="170" width="50" height="140" rx="6" fill="#D4CEC6" stroke="#B8B0A6" strokeWidth="1" filter="url(#tunnel-shadow)" />
        <rect x="500" y="240" width="100" height="90" rx="8" fill="#D4CEC6" stroke="#B8B0A6" strokeWidth="1" filter="url(#tunnel-shadow)" />
        <text x="550" y="234" textAnchor="middle" fill="#6B6560" fontFamily="Inter" fontSize="9" fontWeight="500">CHAMBER C</text>

        <rect x="600" y="100" width="40" height="160" rx="6" fill="#E8E4DF" stroke="#D4CEC6" strokeWidth="1" strokeDasharray="4 2" />
        <text x="620" y="92" textAnchor="middle" fill="#A39E96" fontFamily="Inter" fontSize="8" fontWeight="500">VENT</text>

        <line x1="40" y1="30" x2="660" y2="30" stroke="#B8B0A6" strokeWidth="1.5" strokeDasharray="6 3" />
        <text x="350" y="22" textAnchor="middle" fill="#A39E96" fontFamily="Inter" fontSize="9" fontWeight="500">SURFACE LEVEL</text>

        {workerPositions.map((w) => (
          <g key={w.worker_id}>
            <circle cx={w.x} cy={w.y} r="6" fill="#6B8BA4" opacity="0.25" />
            <circle cx={w.x} cy={w.y} r="4" fill="#6B8BA4" stroke="#fff" strokeWidth="1.5" />
            <text x={w.x} y={w.y - 8} textAnchor="middle" fill="#567387" fontFamily="Inter" fontSize="8" fontWeight="600">
              {w.worker_id.replace('worker_', 'W')}
            </text>
            {w.sos_button === 1 && (
              <>
                <circle cx={w.x} cy={w.y} r="10" fill="none" stroke="#C15450" strokeWidth="1.5" opacity="0.6">
                  <animate attributeName="r" from="6" to="16" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite" />
                </circle>
                <text x={w.x + 12} y={w.y + 3} fill="#C15450" fontFamily="Inter" fontSize="8" fontWeight="700">SOS</text>
              </>
            )}
          </g>
        ))}

        {Object.entries(NODE_POSITIONS).map(([id, pos]) => {
          const node = nodes.find((n) => n.node_id === id);
          const status = getNodeStatus(node);
          const color = statusColors[status];

          return (
            <g key={id} className="cursor-pointer" onClick={() => navigate(`/node/${id}`)}>
              <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3">
                <animate attributeName="r" from="14" to="24" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={pos.x} cy={pos.y} r="12" fill={color} stroke="#fff" strokeWidth="2.5" />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#fff" fontFamily="Inter" fontSize="10" fontWeight="700">
                {id.replace('node_', 'N')}
              </text>
              <rect x={pos.x - 50} y={pos.y + 18} width="100" height="20" rx="4" fill="white" stroke={color} strokeWidth="0.8" opacity="0.95" />
              <text x={pos.x} y={pos.y + 31} textAnchor="middle" fill="#4A4541" fontFamily="Inter" fontSize="8" fontWeight="600">
                {pos.label}
              </text>
              {node && (
                <g>
                  <rect x={pos.x + 14} y={pos.y - 22} width="46" height="16" rx="4" fill="white" stroke="#E8E4DF" strokeWidth="0.6" />
                  <text x={pos.x + 37} y={pos.y - 11} textAnchor="middle" fill="#4A4541" fontFamily="Inter" fontSize="8" fontWeight="600">
                    {node.temperature}C
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <text x="30" y="200" fill="#A39E96" fontFamily="Inter" fontSize="8" fontWeight="500" textAnchor="middle" transform="rotate(-90, 30, 200)">DEPTH: ~200m</text>
      </svg>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-warm-500 font-medium">{label}</span>
    </div>
  );
}
