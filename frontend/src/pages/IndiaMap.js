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
  if (rate >= 50) return { fill: '#dc2626', bg: 'bg-red-500', text: 'text-red-700', label: 'Critical' };
  if (rate >= 25) return { fill: '#ea580c', bg: 'bg-orange-500', text: 'text-orange-700', label: 'High' };
  if (rate >= 10) return { fill: '#ca8a04', bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Moderate' };
  return { fill: '#16a34a', bg: 'bg-green-500', text: 'text-green-700', label: 'Low' };
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
    <div className="absolute top-4 right-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64 z-10 pointer-events-none">
      <div className="flex items-center space-x-2 mb-2">
        <FiMapPin className={`h-4 w-4 ${risk.text}`} />
        <span className="font-bold text-gray-900 text-sm">{info.state}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500">Total Scans</p>
          <p className="font-bold text-gray-900 text-lg">{info.total}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500">Compliant</p>
          <p className="font-bold text-green-600 text-lg">{info.compliant}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500">Non-Compliant</p>
          <p className="font-bold text-red-600 text-lg">{info.non_compliant}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500">Violation Rate</p>
          <p className={`font-bold text-lg ${risk.text}`}>{info.violation_rate}%</p>
        </div>
      </div>
      <div className="mt-2 flex items-center space-x-1.5">
        <span className={`w-2.5 h-2.5 rounded-full ${risk.bg}`} />
        <span className="text-xs font-medium text-gray-600">{risk.label} Risk</span>
      </div>
    </div>
  );
};

const AlertRow = ({ alert, index }) => {
  const risk = getRiskColor(alert.risk_score);
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <p className="font-medium text-gray-900 text-sm">{alert.product_name}</p>
            <p className="text-xs text-gray-500 font-mono">GTIN: {alert.gtin}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{alert.manufacturer}</td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-bold text-gray-900">{alert.total_scans}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-bold text-red-600">{alert.fail_count}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${risk.bg}`}>
          {alert.risk_score}%
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-800 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading map data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiAlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-heading">National Scan Intelligence</h1>
        <p className="text-gray-600 mt-1">Geographic distribution of product scans and repeat-offender alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center space-x-4">
          <div className="bg-primary-100 rounded-xl p-3"><FiSearch className="h-6 w-6 text-primary-800" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{totalScans}</p><p className="text-sm text-gray-500">Total Scans</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center space-x-4">
          <div className="bg-red-100 rounded-xl p-3"><FiAlertTriangle className="h-6 w-6 text-red-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{totalNonCompliant}</p><p className="text-sm text-gray-500">Non-Compliant</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center space-x-4">
          <div className="bg-green-100 rounded-xl p-3"><FiMapPin className="h-6 w-6 text-green-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{statesCovered}</p><p className="text-sm text-gray-500">States Covered</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 relative">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <FiMapPin className="h-5 w-5 text-primary-800" />
          <span>Scan Density by State</span>
        </h2>

        <MapTooltip info={hoveredState} />

        {mapData.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiMapPin className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No state-level scan data yet. Upload scans with a state field to populate this map.</p>
          </div>
        ) : (
          <div className="flex justify-center overflow-x-auto">
            <svg viewBox="80 20 500 480" className="w-full max-w-2xl" style={{ minHeight: 360 }}>
              <rect x="80" y="20" width="500" height="480" fill="#f8fafc" rx="12" />
              {Object.entries(INDIA_STATES).map(([state]) => {
                const data = stateDataMap[state];
                if (!data) return null;
                return <StateBubble key={state} state={state} data={data} onHover={setHoveredState} />;
              })}
            </svg>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-600">
          {[
            { color: 'bg-green-500', label: 'Low (<10%)' },
            { color: 'bg-yellow-500', label: 'Moderate (10-25%)' },
            { color: 'bg-orange-500', label: 'High (25-50%)' },
            { color: 'bg-red-500', label: 'Critical (50%+)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center space-x-1.5">
              <span className={`w-3 h-3 rounded-full ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-300" />
            <span>Bubble size = scan count</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <FiAlertTriangle className="h-5 w-5 text-red-500" />
            <span>Repeat Offender Alerts</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Products with multiple scans and high failure rates — prioritized for enforcement.</p>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FiShield className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No repeat offenders detected</p>
            <p className="text-sm mt-1">Products scanned multiple times will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product / GTIN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Manufacturer</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Scans</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Fails</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
