import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiShield, FiSearch, FiMapPin } from 'react-icons/fi';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const createDotIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const redDot = createDotIcon('#dc2626');
const greenDot = createDotIcon('#16a34a');
const yellowDot = createDotIcon('#ca8a04');

const getMarkerIcon = (status) => {
  if (status === 'non_compliant') return redDot;
  if (status === 'partially_compliant') return yellowDot;
  return greenDot;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const getRiskColor = (rate) => {
  if (rate >= 50) return { fill: '#dc2626', hover: '#b91c1c', bg: 'bg-red-500', text: 'text-red-700', label: 'Critical' };
  if (rate >= 25) return { fill: '#ea580c', hover: '#c2410c', bg: 'bg-orange-500', text: 'text-orange-700', label: 'High' };
  if (rate >= 10) return { fill: '#ca8a04', hover: '#a16207', bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Moderate' };
  return { fill: '#16a34a', hover: '#15803d', bg: 'bg-green-500', text: 'text-green-700', label: 'Low' };
};

const AlertRow = ({ alert, index }) => {
  const risk = getRiskColor(alert.risk_score);
  return (
    <tr className="hover:bg-gray-50/50 transition-colors duration-150">
      <td className="px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-700 font-bold text-sm">#{index + 1}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{alert.product_name}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{alert.gtin}</p>
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
  const [mapPoints, setMapPoints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapRes, alertRes] = await Promise.all([
          api.get('/dashboard/map'),
          api.get('/dashboard/alerts')
        ]);
        setMapPoints(mapRes.data.points || []);
        setAlerts(alertRes.data.alerts || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalScans = mapPoints.length;
  const totalNonCompliant = mapPoints.filter(p => p.status === 'non_compliant').length;
  const uniqueStates = new Set(mapPoints.map(p => p.state).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiMapPin className="mr-3 text-primary-600 h-8 w-8" />
            National Compliance Map
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Real-time precise location mapping of packaging compliance across India.
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <FiSearch className="mr-2" />
            Filter Region
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex">
            <FiAlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-96 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-500">Loading precision map data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
              <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-gray-100 flex space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-600 mr-2 shadow-sm"></div>
                  <span className="text-xs font-bold text-gray-700">Non-Compliant</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2 shadow-sm"></div>
                  <span className="text-xs font-bold text-gray-700">Partial</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-600 mr-2 shadow-sm"></div>
                  <span className="text-xs font-bold text-gray-700">Compliant</span>
                </div>
              </div>

              <div style={{ height: '600px', width: '100%', zIndex: 1 }}>
                <MapContainer 
                  center={[20.5937, 78.9629]} 
                  zoom={5} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  className="dark-map-tiles"
                >
                  <MapResizer />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="map-tiles"
                  />
                  <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={40}
                  >
                    {mapPoints.map((point) => (
                      <Marker 
                        key={point.id} 
                        position={[point.latitude, point.longitude]}
                        icon={getMarkerIcon(point.status)}
                      >
                        <Popup>
                          <div className="p-1">
                            <h3 className="font-bold text-sm mb-1">Scan #{point.id}</h3>
                            <p className="text-xs text-gray-600 mb-2">Status: <span className="font-bold">{point.status}</span></p>
                            <a href={`/scan/${point.id}`} className="text-xs text-indigo-600 hover:underline">View Report</a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                </MapContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Total Scans Plotted', value: totalScans, icon: <FiMapPin className="h-6 w-6 text-primary-600" />, bg: 'bg-primary-50' },
                { title: 'Non-Compliant Points', value: totalNonCompliant, icon: <FiAlertTriangle className="h-6 w-6 text-red-600" />, bg: 'bg-red-50' },
                { title: 'States Covered', value: uniqueStates, icon: <FiShield className="h-6 w-6 text-green-600" />, bg: 'bg-green-50' }
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
                  <div className={`${item.bg} rounded-xl p-3`}>{item.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{item.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <FiAlertTriangle className="mr-2 h-5 w-5" />
                  High Priority Alerts
                </h2>
                <p className="text-red-100 text-sm mt-1">Repeat offenders requiring immediate action</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Manufacturer</th>
                      <th className="px-4 py-3 text-center">Scans</th>
                      <th className="px-4 py-3 text-center">Fails</th>
                      <th className="px-4 py-3 text-center">Risk</th>
                      <th className="px-4 py-3">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alerts.length > 0 ? (
                      alerts.map((alert, i) => (
                        <AlertRow key={alert.gtin} alert={alert} index={i} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <FiShield className="h-8 w-8 mx-auto text-green-400 mb-2" />
                          <p>No high-priority alerts found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaMap;
