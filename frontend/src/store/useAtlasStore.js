import { create } from 'zustand';

const API_BASE = '/api';
const DATA_MODE_KEY = 'atlas_test_mode';

export const INITIAL_THRESHOLDS = {
  temperature: { warning: 35, danger: 38 },
  mq2: { warning: 600, danger: 800 },
  mq6: { warning: 600, danger: 800 },
  mq7: { warning: 600, danger: 800 },
  mq135: { warning: 600, danger: 800 },
  vibration: { warning: 7, danger: 9 },
  heart_rate_high: { warning: 100, danger: 115 },
  heart_rate_low: { warning: 65, danger: 55 },
  spo2: { warning: 95, danger: 92 },
};

function emptyRuntimeState() {
  return {
    nodes: [],
    workers: [],
    ppe: null,
    alerts: [],
    alertLog: [],
    nodeHistory: {},
    workerHistory: {},
    aegisDevices: {},
    aegisSummary: null,
  };
}

function buildDataSource({ testMode, data }) {
  if (testMode) {
    return { mode: 'lab', status: 'demo', label: 'Lab Simulation', detail: 'Synthetic local data' };
  }
  const hasActiveSensorData = Boolean(data?.live_status?.has_active_sensor_data);
  if (hasActiveSensorData) {
    return { mode: 'live', status: 'live', label: 'Live API Active', detail: 'Telemetry is active' };
  }
  return { mode: 'live', status: 'idle', label: 'Live Mode: No Active Feed', detail: 'No fresh hardware telemetry' };
}

function isDemoRecord(record) {
  const source = String(record?.source || record?.data_source || '').toLowerCase();
  return Boolean(record?.synthetic || record?.is_synthetic || source.includes('seed') || source.includes('demo') || source.includes('synthetic') || source.includes('lab'));
}

function generateAlerts(nodes, workers, thresholds) {
  const alerts = [];
  const now = new Date().toISOString();

  nodes.forEach((node) => {
    if (node.temperature >= thresholds.temperature.danger)
      alerts.push({ id: `${node.node_id}-temp`, severity: 'danger', type: 'temperature', node: node.node_id, message: `Temperature critical: ${node.temperature} C`, timestamp: now });
    else if (node.temperature >= thresholds.temperature.warning)
      alerts.push({ id: `${node.node_id}-temp`, severity: 'warning', type: 'temperature', node: node.node_id, message: `Temperature high: ${node.temperature} C`, timestamp: now });

    ['mq2', 'mq6', 'mq7', 'mq135'].forEach((gas) => {
      if (node[gas] >= thresholds[gas].danger)
        alerts.push({ id: `${node.node_id}-${gas}`, severity: 'danger', type: 'gas', node: node.node_id, message: `${gas.toUpperCase()} gas dangerous: ${node[gas]}`, timestamp: now });
      else if (node[gas] >= thresholds[gas].warning)
        alerts.push({ id: `${node.node_id}-${gas}`, severity: 'warning', type: 'gas', node: node.node_id, message: `${gas.toUpperCase()} gas elevated: ${node[gas]}`, timestamp: now });
    });

    if (node.vibration >= thresholds.vibration.danger)
      alerts.push({ id: `${node.node_id}-vib`, severity: 'danger', type: 'vibration', node: node.node_id, message: `Extreme vibration: ${node.vibration}`, timestamp: now });
    else if (node.vibration >= thresholds.vibration.warning)
      alerts.push({ id: `${node.node_id}-vib`, severity: 'warning', type: 'vibration', node: node.node_id, message: `High vibration: ${node.vibration}`, timestamp: now });
  });

  workers.forEach((w) => {
    if (w.sos_button === 1)
      alerts.push({ id: `${w.worker_id}-sos`, severity: 'danger', type: 'sos', node: w.proximity?.nearest_node, message: `SOS from ${w.worker_id} near ${w.proximity?.nearest_node}`, timestamp: now });

    if (w.heart_rate >= thresholds.heart_rate_high.danger)
      alerts.push({ id: `${w.worker_id}-hr`, severity: 'danger', type: 'health', node: w.proximity?.nearest_node, message: `${w.worker_id} heart rate critical: ${w.heart_rate} bpm`, timestamp: now });
    else if (w.heart_rate >= thresholds.heart_rate_high.warning)
      alerts.push({ id: `${w.worker_id}-hr`, severity: 'warning', type: 'health', node: w.proximity?.nearest_node, message: `${w.worker_id} heart rate high: ${w.heart_rate} bpm`, timestamp: now });

    if (w.spo2 <= thresholds.spo2.danger)
      alerts.push({ id: `${w.worker_id}-spo2`, severity: 'danger', type: 'health', node: w.proximity?.nearest_node, message: `${w.worker_id} SpO2 critical: ${w.spo2}%`, timestamp: now });
    else if (w.spo2 <= thresholds.spo2.warning)
      alerts.push({ id: `${w.worker_id}-spo2`, severity: 'warning', type: 'health', node: w.proximity?.nearest_node, message: `${w.worker_id} SpO2 low: ${w.spo2}%`, timestamp: now });
  });

  return alerts;
}

function getNodeStatus(node, thresholds) {
  if (!node) return 'offline';
  if (
    node.temperature >= thresholds.temperature.danger ||
    node.mq2 >= thresholds.mq2.danger ||
    node.mq6 >= thresholds.mq6.danger ||
    node.mq7 >= thresholds.mq7.danger ||
    node.mq135 >= thresholds.mq135.danger ||
    node.vibration >= thresholds.vibration.danger
  ) return 'danger';
  if (
    node.temperature >= thresholds.temperature.warning ||
    node.mq2 >= thresholds.mq2.warning ||
    node.mq6 >= thresholds.mq6.warning ||
    node.mq7 >= thresholds.mq7.warning ||
    node.mq135 >= thresholds.mq135.warning ||
    node.vibration >= thresholds.vibration.warning
  ) return 'warning';
  return 'safe';
}

const MAX_HISTORY = 100; // 100 data points = ~3.3 minutes at 2s intervals

function randomFloat(min, max, digits = 1) {
  return Number((min + Math.random() * (max - min)).toFixed(digits));
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function createSyntheticNode(index) {
  const mq4 = randomInt(100, 900);
  const mq5 = randomInt(100, 900);
  return {
    node_id: `node-${index}`,
    temperature: randomFloat(20, 40, 1),
    mq2: mq4,
    mq6: mq5,
    mq7: randomInt(100, 900),
    mq135: randomInt(100, 900),
    mq4,
    mq5,
    vibration: randomFloat(0, 12, 2),
    humidity: randomFloat(20, 80, 1),
    sound: randomInt(0, 4095),
  };
}

function createSyntheticWorker(index) {
  return {
    worker_id: `worker-${index}`,
    heart_rate: randomInt(55, 130),
    spo2: randomInt(88, 100),
    sos_button: Math.random() < 0.02 ? 1 : 0,
    proximity: { nearest_node: `node-${randomInt(1, 3)}` },
    temperature: randomFloat(36, 39, 1),
    humidity: randomFloat(20, 80, 1),
  };
}

function createSyntheticPpe() {
  const helmet = Math.random() > 0.05;
  const vest = Math.random() > 0.08;
  const gloves = Math.random() > 0.12;
  const missingItems = [];
  if (!helmet) missingItems.push('HELMET');
  if (!vest) missingItems.push('VEST');
  if (!gloves) missingItems.push('GLOVES');

  return {
    helmet,
    vest,
    gloves,
    gate_status: missingItems.length === 0 ? 1 : 0,
    missing_items: missingItems,
    timestamp: new Date().toISOString(),
  };
}

function createTestRegistrationMeta(index) {
  return {
    address: '127.0.0.1',
    protocol: 'HTTP',
    port: 6001,
    path: '/',
    segmentId: `test-segment-${index}`,
    interfaceId: `test-if-${index}`,
  };
}

function createNetworkObservation(index, round) {
  return {
    key: `node-${index}`,
    latencyMs: randomInt(18, 48) + round,
    packetLossRatio: Number((Math.random() * 0.02).toFixed(3)),
    reconnects: randomInt(0, 1),
    source: 'lab_seed',
  };
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

async function postOptionalJson(url, payload) {
  try {
    return await postJson(url, payload);
  } catch (err) {
    return { status: 'unavailable', message: err.message };
  }
}

const useAtlasStore = create((set, get) => ({
  // Data
  nodes: [],
  workers: [],
  ppe: null,
  alerts: [],
  alertLog: [],
  nodeHistory: {},
  workerHistory: {},
  aegisDevices: {},
  aegisSummary: null,
  aegisOverview: null,
  aegisOverviewLoading: false,
  aegisOverviewError: null,
  thresholds: INITIAL_THRESHOLDS,
  testMode: (typeof localStorage !== 'undefined' && localStorage.getItem(DATA_MODE_KEY) === '1') || false,
  dataSource: (typeof localStorage !== 'undefined' && localStorage.getItem(DATA_MODE_KEY) === '1')
    ? { mode: 'lab', status: 'demo', label: 'Lab Simulation', detail: 'Synthetic local data' }
    : { mode: 'live', status: 'idle', label: 'Live Mode: No Active Feed', detail: 'No fresh hardware telemetry' },
  stale: { node_count: 0, nodes: [], worker_count: 0, workers: [], ppe: null },
  systemStatus: null,
  isSeeding: false,
  seedError: null,
  seedStatus: null,
  isLoading: true,
  lastUpdate: null,
  lastFetchMs: null,
  startTime: Date.now(),
  uptimeMs: 0,
  error: null,
  cloudSyncEnabled: null,
  cloudStatusLoading: false,
  cloudStatusError: null,

  // Computed
  getNodeStatus: (node) => getNodeStatus(node, get().thresholds),

  // Actions
  updateThresholds: (newThresholds) => {
    set((state) => ({
      thresholds: { ...state.thresholds, ...newThresholds }
    }));
  },

  fetchData: async () => {
    const requestStarted = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      // Lab mode: synthesize data locally and avoid calling backend
      if (get().testMode) {
        const thresholds = get().thresholds;
        // generate synthetic nodes/workers
        const synthNodes = Array.from({ length: 3 }, (_, i) => createSyntheticNode(i + 1));
        const synthWorkers = Array.from({ length: 4 }, (_, i) => createSyntheticWorker(i + 1));
        const synthPpe = createSyntheticPpe();
        const alerts = generateAlerts(synthNodes, synthWorkers, thresholds);

        // Build history quickly
        const nodeHistory = {};
        synthNodes.forEach((node) => {
          nodeHistory[node.node_id] = [{
            time: new Date().toLocaleTimeString(),
            temperature: node.temperature,
            humidity: node.humidity,
            vibration: node.vibration,
            sound: node.sound,
            mq2: node.mq2,
            mq6: node.mq6,
            mq7: node.mq7,
            mq135: node.mq135,
            mq4: node.mq4 ?? node.mq2,
            mq5: node.mq5 ?? node.mq6,
          }];
        });

        const workerHistory = {};
        synthWorkers.forEach((w) => {
          workerHistory[w.worker_id] = [{
            time: new Date().toLocaleTimeString(),
            heart_rate: w.heart_rate,
            spo2: w.spo2,
            temperature: w.temperature,
            humidity: w.humidity,
          }];
        });

        set({
          nodes: synthNodes,
          workers: synthWorkers,
          ppe: synthPpe,
          alerts,
          alertLog: alerts.slice(0, 50),
          nodeHistory,
          workerHistory,
          aegisDevices: {},
          aegisSummary: null,
          stale: { node_count: 0, nodes: [], worker_count: 0, workers: [], ppe: null },
          systemStatus: {
            aegis: { status: 'lab' },
            ai: null,
            live_status: { has_active_sensor_data: true, stale_record_count: 0 },
          },
          dataSource: buildDataSource({ testMode: true, data: null }),
          isLoading: false,
          lastUpdate: new Date().toISOString(),
          lastFetchMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - requestStarted),
          uptimeMs: Date.now() - get().startTime,
          error: null,
        });
        return;
      }

      const res = await fetch(`${API_BASE}/data`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const nodes = (data.nodes || []).filter((record) => !isDemoRecord(record));
      const workers = (data.workers || []).filter((record) => !isDemoRecord(record));
      const ppe = data.ppe && !isDemoRecord(data.ppe) ? data.ppe : null;
      const aegisList = data.aegis?.devices || [];
      const aegisDevices = aegisList.reduce((acc, device) => {
        if (device?.deviceId) acc[device.deviceId] = device;
        return acc;
      }, {});
      const aegisSummary = data.aegis?.summary || null;
      const thresholds = get().thresholds;
      const alerts = generateAlerts(nodes, workers, thresholds);
      const liveStatus = {
        ...(data.live_status || {}),
        has_active_sensor_data: Boolean(nodes.length || workers.length || ppe),
      };

      // Build history
      const prevHistory = get().nodeHistory;
      const nodeHistory = { ...prevHistory };
      nodes.forEach((node) => {
        const prev = nodeHistory[node.node_id] || [];
        const entry = {
          time: new Date().toLocaleTimeString(),
          temperature: node.temperature,
          humidity: node.humidity,
          vibration: node.vibration,
          sound: node.sound,
          mq2: node.mq2,
          mq6: node.mq6,
          mq7: node.mq7,
          mq135: node.mq135,
          mq4: node.mq4 ?? node.mq2,
          mq5: node.mq5 ?? node.mq6,
        };
        nodeHistory[node.node_id] = [...prev, entry].slice(-MAX_HISTORY);
      });

      const prevWorkerHistory = get().workerHistory;
      const workerHistory = { ...prevWorkerHistory };
      workers.forEach((w) => {
        const prev = workerHistory[w.worker_id] || [];
        const entry = {
          time: new Date().toLocaleTimeString(),
          heart_rate: w.heart_rate,
          spo2: w.spo2,
          temperature: w.temperature,
          humidity: w.humidity,
        };
        workerHistory[w.worker_id] = [...prev, entry].slice(-MAX_HISTORY);
      });

      // Append new alerts to log (keep last 50)
      const prevLog = get().alertLog;
      const newLogEntries = alerts.filter(
        (a) => !prevLog.find((l) => l.id === a.id && l.message === a.message)
      );
      const alertLog = [...newLogEntries, ...prevLog].slice(0, 50);

      const nextState = {
        nodes,
        workers,
        ppe,
        alerts,
        alertLog,
        nodeHistory,
        workerHistory,
        aegisDevices,
        aegisSummary,
        stale: data.stale || { node_count: 0, nodes: [], worker_count: 0, workers: [], ppe: null },
        systemStatus: {
          aegis: data.aegis || null,
          ai: data.ai || null,
          live_status: liveStatus,
          staleness: data.staleness || null,
        },
        dataSource: buildDataSource({ testMode: false, data: { ...data, live_status: liveStatus } }),
        isLoading: false,
        lastUpdate: new Date().toISOString(),
        lastFetchMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - requestStarted),
        uptimeMs: Date.now() - get().startTime,
        error: null,
      };
      if (typeof data?.cloud?.enabled === 'boolean') {
        nextState.cloudSyncEnabled = data.cloud.enabled;
      }
      set(nextState);
    } catch (err) {
      set({
        error: err.message,
        isLoading: false,
        lastFetchMs: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - requestStarted),
        uptimeMs: Date.now() - get().startTime,
        dataSource: get().testMode
          ? { mode: 'lab', status: 'demo', label: 'Lab Simulation', detail: 'Synthetic local data' }
          : { mode: 'live', status: 'error', label: 'Live Mode: Backend Error', detail: err.message },
      });
    }
  },

  fetchCloudStatus: async () => {
    set({ cloudStatusLoading: true });
    try {
      const res = await fetch(`${API_BASE}/cloud/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ cloudSyncEnabled: Boolean(data.enabled), cloudStatusLoading: false, cloudStatusError: null });
    } catch (err) {
      set({ cloudStatusError: err.message, cloudStatusLoading: false });
    }
  },

  fetchAegisOverview: async () => {
    const hasData = Boolean(get().aegisOverview);
    set({ aegisOverviewLoading: !hasData });
    try {
      const res = await fetch(`${API_BASE}/aegis/overview`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ aegisOverview: data, aegisOverviewLoading: false, aegisOverviewError: null });
    } catch (err) {
      set({ aegisOverviewError: err.message, aegisOverviewLoading: false });
    }
  },

  setCloudSyncEnabled: async (enabled) => {
    set({ cloudStatusLoading: true });
    try {
      const res = await fetch(`${API_BASE}/cloud/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ cloudSyncEnabled: Boolean(data.enabled), cloudStatusLoading: false, cloudStatusError: null });
    } catch (err) {
      set({ cloudStatusError: err.message, cloudStatusLoading: false });
    }
  },

  setTestMode: async (enabled) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DATA_MODE_KEY, enabled ? '1' : '0');
      }
    } catch {
      // ignore storage errors
    }
    const nextTestMode = Boolean(enabled);
    set({
      ...emptyRuntimeState(),
      testMode: nextTestMode,
      stale: { node_count: 0, nodes: [], worker_count: 0, workers: [], ppe: null },
      systemStatus: null,
      dataSource: nextTestMode
        ? { mode: 'lab', status: 'demo', label: 'Lab Simulation', detail: 'Synthetic local data' }
        : { mode: 'live', status: 'idle', label: 'Live Mode: No Active Feed', detail: 'Clearing lab telemetry' },
      isLoading: true,
      error: null,
      seedError: null,
      seedStatus: nextTestMode ? null : 'Clearing lab telemetry...',
    });
    if (!nextTestMode) {
      await postOptionalJson(`${API_BASE}/lab/clear`, {});
    }
    await get().fetchData();
    if (!nextTestMode) {
      set({ seedStatus: 'Live mode selected; local lab telemetry cleared' });
    }
  },

  seedBackendData: async ({ nodeCount = 3, workerCount = 4, rounds = 1 } = {}) => {
    const baselineRounds = Math.max(rounds, 10);
    set({ isSeeding: true, seedError: null, seedStatus: 'Registering test devices...' });
    try {
      const nodeIds = Array.from({ length: nodeCount }, (_, index) => `node-${index + 1}`);
      const workerIds = Array.from({ length: workerCount }, (_, index) => `worker-${index + 1}`);

      for (const [index, nodeId] of nodeIds.entries()) {
        await postJson(`${API_BASE}/register`, {
          device_id: nodeId,
          device_type: 'node',
          capabilities: ['telemetry', 'network-observation', 'ping-test'],
          meta: createTestRegistrationMeta(index + 1),
        });
      }

      for (const [index, workerId] of workerIds.entries()) {
        await postJson(`${API_BASE}/register`, {
          device_id: workerId,
          device_type: 'watch',
          capabilities: ['health', 'sos'],
          meta: {
            address: '127.0.0.1',
            protocol: 'HTTP',
            port: 6001,
            path: '/',
            segmentId: `worker-segment-${index + 1}`,
          },
        });
      }

      await postJson(`${API_BASE}/register`, {
        device_id: 'ppe_camera_1',
        device_type: 'camera',
        capabilities: ['ppe'],
        meta: {
          address: '127.0.0.1',
          protocol: 'HTTP',
          port: 6001,
          path: '/',
          stream: 'entrance_cam',
        },
      });

      set({ isSeeding: true, seedStatus: `Posting baseline observations (${baselineRounds} rounds)...` });

      for (let roundIndex = 0; roundIndex < baselineRounds; roundIndex += 1) {
        for (const nodeId of nodeIds) {
          const nodeIndex = Number(nodeId.split('-')[1]);
          const nodePayload = createSyntheticNode(nodeIndex);
          await postJson(`${API_BASE}/sensor_data/${nodeId}`, {
            ...nodePayload,
            source: 'lab_seed',
            meta: createTestRegistrationMeta(nodeIndex),
          });
          await postOptionalJson(`${API_BASE}/aegis/network/observe`, createNetworkObservation(nodeIndex, roundIndex));
        }

        for (const workerId of workerIds) {
          const workerIndex = Number(workerId.split('-')[1]);
          const workerPayload = createSyntheticWorker(workerIndex);
          await postJson(`${API_BASE}/watch_data/${workerId}`, {
            ...workerPayload,
            source: 'lab_seed',
            meta: {
              address: '127.0.0.1',
              protocol: 'HTTP',
              port: 6001,
              path: '/',
              segmentId: `worker-segment-${workerIndex}`,
            },
          });
        }

        await postJson(`${API_BASE}/ppe_detection`, {
          ...createSyntheticPpe(),
          source: 'lab_seed',
          camera_id: 'ppe_camera_1',
          stream: 'entrance_cam',
          meta: {
            address: '127.0.0.1',
            protocol: 'HTTP',
            port: 6001,
            path: '/',
            stream: 'entrance_cam',
          },
        });

        await postJson(`${API_BASE}/ingest`, {
          device_id: 'seed-controller',
          device_type: 'controller',
          event_kind: 'SEED_SUMMARY',
          payload: {
            nodes: nodeIds,
            workers: workerIds,
            round: roundIndex + 1,
          },
        });

      }

      set({ isSeeding: false, seedStatus: 'Lab devices registered and baseline learned' });
      await get().fetchData();
    } catch (err) {
      set({ isSeeding: false, seedError: err.message, seedStatus: 'Seed failed' });
    }
  },

  startPolling: () => {
    get().fetchData();
    get().fetchCloudStatus();
    const interval = setInterval(() => get().fetchData(), 2000);
    return () => clearInterval(interval);
  },
}));

export default useAtlasStore;

