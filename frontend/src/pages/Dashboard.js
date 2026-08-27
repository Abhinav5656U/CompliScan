import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import {
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiFileText, FiEye,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const EmptyChart = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-[300px] text-center">
    <div className="flex items-center justify-center h-16 w-16 rounded border-2 border-dashed border-seal-400/50 mb-3">
      <FiFileText className="h-8 w-8 text-ink-300" />
    </div>
    <p className="text-ink-300 text-sm">{message}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    manufacturer: '',
    date_from: '',
    date_to: '',
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.stats);
    } catch (err) {
      toast.error('Failed to load dashboard stats');
    }
  }, []);

  const fetchScans = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (filters.status) params.append('status', filters.status);
      if (filters.manufacturer) params.append('manufacturer', filters.manufacturer);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await api.get(`/dashboard/scans?${params.toString()}`);
      const data = response.data;
      setScans(data.scans || data.items || data.results || []);
      setTotalPages(data.pagination?.total_pages ?? 1);
    } catch (err) {
      toast.error('Failed to load scans');
    }
  }, [page, filters]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchScans()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchStats, fetchScans]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'compliant': return 'border-seal-500 text-seal-600';
      case 'non_compliant': case 'non-compliant': return 'border-stamp-500 text-stamp-600';
      case 'partial': case 'partially_compliant': case 'partially-compliant': return 'border-seal-500/60 text-seal-700';
      default: return 'border-ink-300 text-ink-400';
    }
  };

  const trendData = (stats?.scans_per_day || []).map(d => ({
    date: d.date,
    count: d.count,
  }));

  const violationsData = (stats?.top_violations || []).map(v => ({
    rule: v.rule,
    count: v.count,
  }));

  const hasNoScans = !stats || stats.total_scans === 0;

  const statCards = [
    {
      label: 'Total Scans',
      value: stats?.total_scans ?? 0,
      icon: FiFileText,
      color: 'text-primary-800',
      iconBg: 'border-primary-800/40',
    },
    {
      label: 'Compliant',
      value: stats?.compliant ?? 0,
      icon: FiCheckCircle,
      color: 'text-seal-600',
      iconBg: 'border-seal-500',
    },
    {
      label: 'Non-Compliant',
      value: stats?.non_compliant ?? 0,
      icon: FiXCircle,
      color: 'text-stamp-600',
      iconBg: 'border-stamp-500',
    },
    {
      label: 'Partially Compliant',
      value: stats?.partially_compliant ?? 0,
      icon: FiAlertTriangle,
      color: 'text-seal-700',
      iconBg: 'border-seal-500/60',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-200 ledger-paper">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-800"></div>
          <p className="text-ink-500 text-sm font-ledger">Loading register...</p>
        </div>
      </div>
    );
  }

  if (hasNoScans) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-parchment-200 ledger-paper min-h-screen">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="rubber-stamp text-seal-500 text-xs">Entry Ledger</span>
          </div>
          <h1 className="text-3xl font-heading text-ink">Inspection Register</h1>
          <p className="text-ink-500 mt-1">Compliance scan overview and analytics</p>
        </div>
        <div className="bg-parchment-100 rounded shadow-ledger border border-ink/10 p-16 text-center">
          <div className="flex items-center justify-center h-20 w-20 rounded border-2 border-dashed border-seal-400/50 mx-auto mb-4">
            <FiFileText className="h-10 w-10 text-ink-300" />
          </div>
          <h2 className="text-xl font-heading text-ink mb-2">No scans yet</h2>
          <p className="text-ink-300 mb-6 max-w-md mx-auto">
            Upload your first product label to see compliance analytics and scan trends here.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center px-5 py-2.5 bg-primary-800 hover:bg-primary-900 text-parchment-100 rounded text-sm font-medium transition-colors"
          >
            Start a scan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-parchment-200 ledger-paper min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="rubber-stamp text-seal-500 text-xs">Entry Ledger</span>
        </div>
        <h1 className="text-3xl font-heading text-ink">Inspection Register</h1>
        <p className="text-ink-500 mt-1">Compliance scan overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-parchment-100 border border-ink/10 shadow-ledger p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-medium text-ink-500">{card.label}</p>
                  <p className={`text-3xl font-heading mt-1 ${card.color}`}>{card.value}</p>
                </div>
                <div className={`border ${card.iconBg} p-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-parchment-100 border border-ink/10 shadow-ledger p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-heading text-ink">Scans Over Time</h3>
            <span className="h-0.5 w-10 bg-seal-500 inline-block"></span>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27, 27, 22, 0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7A766B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#7A766B' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FAF6EC', border: '1px solid rgba(27,27,22,0.12)', borderRadius: 0, color: '#1B1B16' }} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#1F3A2E" strokeWidth={2} name="Scans" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No scan data available yet" />
          )}
        </div>

        <div className="bg-parchment-100 border border-ink/10 shadow-ledger p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-heading text-ink">Top Violations</h3>
            <span className="h-0.5 w-10 bg-seal-500 inline-block"></span>
          </div>
          {violationsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={violationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27, 27, 22, 0.1)" />
                <XAxis dataKey="rule" tick={{ fontSize: 11, fill: '#7A766B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#7A766B' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FAF6EC', border: '1px solid rgba(27,27,22,0.12)', borderRadius: 0, color: '#1B1B16' }} />
                <Bar dataKey="count" fill="#A6321E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No violations recorded yet" />
          )}
        </div>
      </div>

      <div className="bg-parchment-100 border border-ink/10 shadow-ledger overflow-hidden">
        <div className="p-6 border-b border-seal-500/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-heading text-ink">Recent Scans</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="text-sm border border-ink/15 rounded bg-parchment-50 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-ink"
              >
                <option value="">All Status</option>
                <option value="compliant">Compliant</option>
                <option value="non_compliant">Non-Compliant</option>
                <option value="partial">Partially Compliant</option>
              </select>
              <input
                type="text"
                placeholder="Manufacturer"
                value={filters.manufacturer}
                onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                className="text-sm border border-ink/15 rounded bg-parchment-50 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-36 text-ink"
              />
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="text-sm border border-ink/15 rounded bg-parchment-50 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-ink"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="text-sm border border-ink/15 rounded bg-parchment-50 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-ink"
              />
            </div>
          </div>
        </div>

        {scans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-parchment-100 border-b border-ink/10">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-ink-500 uppercase font-ledger">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-ink-500 uppercase font-ledger">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-ink-500 uppercase font-ledger">Manufacturer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-ink-500 uppercase font-ledger">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-ink-500 uppercase font-ledger">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {scans.map((scan) => (
                  <tr key={scan.id} className="ledger-rule-row hover:bg-parchment-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-ink-600 font-ledger">
                      {new Date(scan.created_at || scan.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-ink">
                      {scan.product_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-600 font-ledger">
                      {scan.manufacturer || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rubber-stamp text-[11px] ${getStatusBadge(scan.overall_status || scan.status)}`}>
                        {(scan.overall_status || scan.status || 'unknown').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/scan/${scan.id}`}
                        className="inline-flex items-center space-x-1 text-sm text-primary-800 hover:text-primary-600 font-medium font-ledger"
                      >
                        <FiEye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-parchment-100">
            <div className="flex items-center justify-center h-14 w-14 rounded border-2 border-dashed border-seal-400/50 mx-auto mb-3">
              <FiFileText className="h-7 w-7 text-ink-300" />
            </div>
            <p className="text-ink-300 font-ledger">No scans found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-ink/10 bg-parchment-100">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-ledger"
            >
              <FiChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            <span className="text-sm text-ink-600 font-ledger">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-ledger"
            >
              <span>Next</span>
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
