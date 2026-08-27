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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    manufacturer: '',
    start_date: '',
    end_date: '',
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      toast.error('Failed to load dashboard stats');
    }
  }, []);

  const fetchScans = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (filters.status) params.append('status', filters.status);
      if (filters.manufacturer) params.append('manufacturer', filters.manufacturer);
      if (filters.start_date) params.append('date_from', filters.start_date);
      if (filters.end_date) params.append('date_to', filters.end_date);

      const response = await api.get(`/dashboard/scans?${params.toString()}`);
      const data = response.data;
      setScans(data.scans || data.items || data.results || []);
      setTotalPages(data.pagination?.total_pages || data.total_pages || data.pages || Math.ceil((data.total || 0) / 10) || 1);
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
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': case 'non-compliant': return 'bg-red-100 text-red-800';
      case 'partial': case 'partially_compliant': case 'partially-compliant': return 'bg-amber-100 text-amber-800';
      case 'manual_review': case 'review_required': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const complianceTrendData = stats?.compliance_trend || stats?.trend || [
    { month: 'Jan', compliant: 65, non_compliant: 20, partial: 15 },
    { month: 'Feb', compliant: 70, non_compliant: 15, partial: 15 },
    { month: 'Mar', compliant: 60, non_compliant: 25, partial: 15 },
    { month: 'Apr', compliant: 75, non_compliant: 15, partial: 10 },
    { month: 'May', compliant: 80, non_compliant: 10, partial: 10 },
    { month: 'Jun', compliant: 85, non_compliant: 8, partial: 7 },
  ];

  const violationsData = stats?.violations_by_type || stats?.violations || [
    { type: 'Missing Labels', count: 24 },
    { type: 'Wrong Dosage', count: 18 },
    { type: 'Expiry Issues', count: 12 },
    { type: 'Missing Warnings', count: 9 },
    { type: 'Formatting', count: 6 },
  ];

  const statCards = [
    {
      label: 'Total Scans',
      value: stats?.total_scans ?? stats?.total ?? 0,
      icon: FiFileText,
      color: 'bg-primary-50 text-primary-600',
      iconBg: 'bg-primary-100',
    },
    {
      label: 'Compliant',
      value: stats?.compliant ?? stats?.compliant_count ?? 0,
      icon: FiCheckCircle,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      label: 'Non-Compliant',
      value: stats?.non_compliant ?? stats?.non_compliant_count ?? 0,
      icon: FiXCircle,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      label: 'Partially Compliant',
      value: stats?.partial ?? stats?.partially_compliant ?? stats?.partial_count ?? 0,
      icon: FiAlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Manual Review',
      value: stats?.manual_review ?? 0,
      icon: FiEye,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-800"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Compliance scan overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.iconBg} rounded-xl p-3`}>
                  <Icon className={`h-6 w-6 ${card.color.split(' ')[1]}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complianceTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="compliant" stroke="#22c55e" strokeWidth={2} name="Compliant" />
              <Line type="monotone" dataKey="non_compliant" stroke="#ef4444" strokeWidth={2} name="Non-Compliant" />
              <Line type="monotone" dataKey="partial" stroke="#f59e0b" strokeWidth={2} name="Partial" />
              <Line type="monotone" dataKey="manual_review" stroke="#a855f7" strokeWidth={2} name="Review" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Violations by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={violationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e40af" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="compliant">Compliant</option>
                <option value="non_compliant">Non-Compliant</option>
                <option value="partial">Partially Compliant</option>
                <option value="manual_review">Manual Review</option>
              </select>
              <input
                type="text"
                placeholder="Manufacturer"
                value={filters.manufacturer}
                onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-36"
              />
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {scans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Manufacturer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(scan.created_at || scan.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {scan.product_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {scan.manufacturer || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(scan.overall_status || scan.status)}`}>
                        {(scan.overall_status || scan.status || 'unknown').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/scan/${scan.id}`}
                        className="inline-flex items-center space-x-1 text-sm text-primary-800 hover:text-primary-600 font-medium"
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
          <div className="p-12 text-center">
            <FiFileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No scans found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
