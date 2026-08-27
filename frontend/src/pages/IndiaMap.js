import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiShield, FiSearch, FiMapPin, FiTrendingUp, FiClock } from 'react-icons/fi';
import api from '../utils/api';

const INDIA_STATES = {
  'Jammu & Kashmir': { x: 295, y: 52 },
  'Himachal Pradesh': { x: 275, y: 82 },
  'Punjab': { x: 250, y: 90 },
  'Uttarakhand': { x: 305, y: 90 },
  'Haryana': { x: 275, y: 118 },
  'Delhi': { x: 295, y: 128 },
  'Chandigarh': { x: 265, y: 100 },
  'Rajasthan': { x: 210, y: 180 },
  'Uttar Pradesh': { x: 330, y: 165 },
  'Bihar': { x: 395, y: 175 },
  'Jharkhand': { x: 410, y: 210 },
  'Chhattisgarh': { x: 380, y: 250 },
  'Madhya Pradesh': { x: 300, y: 230 },
  'Gujarat': { x: 155, y: 240 },
  'Maharashtra': { x: 230, y: 310 },
  'Goa': { x: 200, y: 360 },
  'Karnataka': { x: 235, y: 390 },
  'Telangana': { x: 310, y: 360 },
  'Andhra Pradesh': { x: 340, y: 395 },
  'Odisha': { x: 410, y: 285 },
  'West Bengal': { x: 435, y: 240 },
  'Sikkim': { x: 440, y: 200 },
  'Assam': { x: 490, y: 205 },
  'Arunachal Pradesh': { x: 520, y: 180 },
  'Nagaland': { x: 540, y: 205 },
  'Manipur': { x: 540, y: 230 },
  'Mizoram': { x: 525, y: 260 },
  'Tripura': { x: 500, y: 265 },
  'Meghalaya': { x: 495, y: 235 },
  'Kerala': { x: 255, y: 460 },
  'Tamil Nadu': { x: 310, y: 450 },
  'Puducherry': { x: 320, y: 425 },
};

const getRiskColor = (rate) => {
  if (rate >= 50) return { fill: '#A6321E', bg: 'bg-stamp-500', text: 'text-stamp-600', label: 'Critical' };
  if (rate >= 25) return { fill: '#B45309', bg: 'bg-seal-500', text: 'text-seal-700', label: 'High' };
  if (rate >= 10) return { fill: '#B08D57', bg: 'bg-seal-400', text: 'text-seal-700', label: 'Moderate' };
  return { fill: '#1F3A2E', bg: 'bg-primary-800', text: 'text-primary-800', label: 'Low' };
};

const getRadius = (total) => {
  const min = 5, max = 18;
  const norm = Math.min(total / 20, 1);
  return min + norm * (max - min);
};

const StateBubble = ({ state, data, onHover }) => {
  const pos = INDIA_STATES[state];
  if (!pos) return null;
  const risk = getRiskColor(data.violation_rate);
  const r = getRadius(data.total);

  return (
    <g
      onMouseEnter={() => onHover({ state, ...data })}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer"
    >
      <circle cx={pos.x} cy={pos.y} r={r + 3} fill={risk.fill} opacity={0.18} />
      <circle cx={pos.x} cy={pos.y} r={r} fill={risk.fill} opacity={0.85} stroke="#fff" strokeWidth={1.2} />
      {r >= 10 && (
        <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={9} fontWeight={700}>
          {data.total}
        </text>
      )}
    </g>
  );
};

const MapTooltip = ({ info }) => {
  if (!info) return null;
  const risk = getRiskColor(info.violation_rate);
  return (
    <div className="absolute top-4 right-4 bg-parchment-100 shadow-ledger border border-ink/10 border-t-2 border-t-seal-500 p-4 w-64 z-10 pointer-events-none">
      <div className="flex items-center space-x-2 mb-2">
        <FiMapPin className={`h-4 w-4 ${risk.text}`} />
        <span className="font-bold text-ink text-sm font-heading">{info.state}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-parchment-200 border border-ink/10 p-2">
          <p className="text-ink-500 uppercase text-[10px] tracking-wider">Total Scans</p>
          <p className="font-bold text-ink text-lg">{info.total}</p>
        </div>
        <div className="bg-parchment-200 border border-ink/10 p-2">
          <p className="text-ink-500 uppercase text-[10px] tracking-wider">Compliant</p>
          <p className="font-bold text-seal-600 text-lg">{info.compliant}</p>
        </div>
        <div className="bg-parchment-200 border border-ink/10 p-2">
          <p className="text-ink-500 uppercase text-[10px] tracking-wider">Non-Compliant</p>
          <p className="font-bold text-stamp-600 text-lg">{info.non_compliant}</p>
        </div>
        <div className="bg-parchment-200 border border-ink/10 p-2">
          <p className="text-ink-500 uppercase text-[10px] tracking-wider">Violation Rate</p>
          <p className={`font-bold text-lg ${risk.text}`}>{info.violation_rate}%</p>
        </div>
      </div>
      <div className="mt-2 flex items-center space-x-1.5">
        <span className={`w-2.5 h-2.5 rounded-full ${risk.bg}`} />
        <span className="text-xs font-medium text-ink-500">{risk.label} Risk</span>
      </div>
    </div>
  );
};

const AlertRow = ({ alert, index }) => {
  const risk = getRiskColor(alert.risk_score);
  return (
    <tr className="hover:bg-parchment-200 transition-colors ledger-rule-row">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <span className="flex-shrink-0 w-6 h-6 rounded border border-seal-500 text-seal-700 text-xs font-bold flex items-center justify-center ledger-stamp">
            {index + 1}
          </span>
          <div>
            <p className="font-medium text-ink text-sm font-heading">{alert.product_name}</p>
            <p className="text-xs text-ink-400 font-ledger">GTIN: {alert.gtin}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-ink-500">{alert.manufacturer}</td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-bold text-ink">{alert.total_scans}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-bold text-stamp-600">{alert.fail_count}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ledger-stamp rubber-stamp ${risk.text} border`}>
          {alert.risk_score}%
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-ink-400 ledger-stamp">
        {alert.last_seen ? new Date(alert.last_seen).toLocaleDateString('en-IN') : '—'}
      </td>
    </tr>
  );
};

const IndiaMap = () => {
  const [mapData, setMapData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [hoveredState, setHoveredState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapRes, alertRes] = await Promise.all([
          api.get('/dashboard/map'),
          api.get('/dashboard/alerts'),
        ]);
        setMapData(mapRes.data.states || []);
        setAlerts(alertRes.data.alerts || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stateDataMap = {};
  mapData.forEach((s) => { stateDataMap[s.state] = s; });

  const totalScans = mapData.reduce((sum, s) => sum + s.total, 0);
  const totalNonCompliant = mapData.reduce((sum, s) => sum + s.non_compliant, 0);
  const statesCovered = mapData.length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center bg-parchment-200 ledger-paper min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-seal-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-ink-500">Loading register...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center bg-parchment-200 ledger-paper min-h-screen">
        <FiAlertTriangle className="h-12 w-12 text-stamp-500 mx-auto mb-4" />
        <p className="text-stamp-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-parchment-200 ledger-paper min-h-screen">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-400 font-ledger mb-1">National Enforcement Register</p>
        <h1 className="text-3xl font-bold text-ink font-heading">National Scan Intelligence</h1>
        <p className="text-ink-500 mt-1">Geographic distribution of product scans and repeat-offender alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-parchment-100 border border-ink/10 shadow-ledger p-5 flex items-center space-x-4">
          <div className="border border-primary-800/40 p-3"><FiSearch className="h-6 w-6 text-primary-800" /></div>
          <div><p className="text-2xl font-bold text-ink font-heading">{totalScans}</p><p className="text-sm text-ink-500 uppercase text-[10px] tracking-wider">Total Scans</p></div>
        </div>
        <div className="bg-parchment-100 border border-ink/10 shadow-ledger p-5 flex items-center space-x-4">
          <div className="border border-stamp-500/50 p-3"><FiAlertTriangle className="h-6 w-6 text-stamp-500" /></div>
          <div><p className="text-2xl font-bold text-stamp-600 font-heading">{totalNonCompliant}</p><p className="text-sm text-ink-500 uppercase text-[10px] tracking-wider">Non-Compliant</p></div>
        </div>
        <div className="bg-parchment-100 border border-ink/10 shadow-ledger p-5 flex items-center space-x-4">
          <div className="border border-seal-500 p-3"><FiMapPin className="h-6 w-6 text-seal-600" /></div>
          <div><p className="text-2xl font-bold text-ink font-heading">{statesCovered}</p><p className="text-sm text-ink-500 uppercase text-[10px] tracking-wider">States Covered</p></div>
        </div>
      </div>

      <div className="bg-parchment-100 border border-ink/10 shadow-ledger p-6 relative">
        <h2 className="text-lg font-bold text-ink mb-4 flex items-center space-x-2">
          <FiMapPin className="h-5 w-5 text-primary-800" />
          <span className="font-heading">Scan Density by State</span>
          <span className="ml-auto h-0.5 w-14 bg-seal-500" />
        </h2>

        <MapTooltip info={hoveredState} />

        {mapData.length === 0 ? (
          <div className="text-center py-16 text-ink-300 border border-dashed border-seal-400/50 mx-4">
            <FiMapPin className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No state-level scan data yet. Upload scans with a state field to populate this map.</p>
          </div>
        ) : (
          <div className="flex justify-center overflow-x-auto">
            <svg viewBox="80 20 500 480" className="w-full max-w-2xl" style={{ minHeight: 360 }}>
              <rect x="80" y="20" width="500" height="480" fill="#FAF6EC" rx="2" stroke="#ddd1b5" strokeWidth="1" />
              {Object.entries(INDIA_STATES).map(([state]) => {
                const data = stateDataMap[state];
                if (!data) return null;
                return <StateBubble key={state} state={state} data={data} onHover={setHoveredState} />;
              })}
            </svg>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-ink-500">
          {[
            { color: 'bg-seal-400', label: 'Low (<10%)' },
            { color: 'bg-seal-500', label: 'Moderate (10-25%)' },
            { color: 'bg-seal-500', label: 'High (25-50%)' },
            { color: 'bg-stamp-500', label: 'Critical (50%+)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center space-x-1.5">
              <span className={`w-3 h-3 rounded-full ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-primary-800" />
            <span>Bubble size = scan count</span>
          </div>
        </div>
      </div>

      <div className="bg-parchment-100 border border-ink/10 shadow-ledger overflow-hidden">
        <div className="p-6 border-b border-ink/10 bg-primary-800">
          <h2 className="text-lg font-bold text-parchment-100 flex items-center space-x-2">
            <FiAlertTriangle className="h-5 w-5 text-seal-400" />
            <span className="font-heading">Repeat Offender Alerts</span>
          </h2>
          <p className="text-sm text-parchment-200/80 mt-1">Products with multiple scans and high failure rates — prioritized for enforcement.</p>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center text-ink-300">
            <FiShield className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No repeat offenders detected</p>
            <p className="text-sm mt-1">Products scanned multiple times will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-parchment-200 border-b border-ink/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-400 uppercase tracking-wider">Product / GTIN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-400 uppercase tracking-wider">Manufacturer</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-ink-400 uppercase tracking-wider">Scans</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-ink-400 uppercase tracking-wider">Fails</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-ink-400 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-400 uppercase tracking-wider">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {alerts.map((alert, i) => (
                  <AlertRow key={alert.gtin} alert={alert} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndiaMap;
