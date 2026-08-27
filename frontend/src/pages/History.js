import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEye, FiTrash2, FiClock, FiFileText, FiChevronLeft, FiChevronRight, FiX
} from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const History = () => {
  const [scans, setScans] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, scan: null });
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/history?page=${page}`);
      const data = response.data;
      setScans(data.scans || data.items || data.results || []);
      setTotalPages(data.pagination?.total_pages ?? 1);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async () => {
    if (!deleteModal.scan) return;
    setDeleting(true);
    try {
      await api.delete(`/history/${deleteModal.scan.id}`);
      toast.success('Scan deleted');
      setDeleteModal({ open: false, scan: null });
      fetchHistory();
    } catch (err) {
      toast.error('Failed to delete scan');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'compliant': return 'border-2 border-seal-500 text-seal-600';
      case 'non_compliant': case 'non-compliant': return 'border-2 border-stamp-500 text-stamp-600';
      case 'partial': case 'partially_compliant': case 'partially-compliant': return 'border-2 border-seal-500/60 text-seal-600';
      default: return 'border-2 border-ink/30 text-ink-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-200 ledger-paper flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-seal-600"></div>
          <p className="text-ink-500 text-sm">Loading register...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-200 ledger-paper text-ink">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 border-b border-ink/10 pb-4">
          <h1 className="text-3xl font-heading font-semibold text-ink tracking-tight">Scan History</h1>
          <p className="text-ink-500 mt-1 text-sm">Your previously uploaded scans</p>
        </div>

        <div className="bg-parchment-100 border border-ink/10 shadow-ledger overflow-hidden">
          {scans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-parchment-200 border-b border-ink/10">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-ink-400 uppercase tracking-[0.15em]">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-ink-400 uppercase tracking-[0.15em]">Product</th>
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-ink-400 uppercase tracking-[0.15em]">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-ink-400 uppercase tracking-[0.15em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="bg-parchment-100 border border-ink/10 shadow-ledger ledger-rule-row hover:bg-parchment-200 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-ink-600">
                          <FiClock className="h-4 w-4 text-ink-400" />
                          <span className="font-body">{new Date(scan.created_at || scan.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium font-heading text-ink">
                        {scan.product_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`ledger-stamp rubber-stamp opacity-90 text-xs ${getStatusBadge(scan.overall_status || scan.status)}`}>
                          {(scan.overall_status || scan.status || 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/scan/${scan.id}`}
                            className="inline-flex items-center space-x-1 text-sm font-heading font-medium text-primary-800 hover:text-seal-600 transition-colors"
                          >
                            <FiEye className="h-4 w-4" />
                            <span>View</span>
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ open: true, scan })}
                            aria-label={`Delete scan ${scan.product_name || scan.id}`}
                            className="inline-flex items-center space-x-1 text-sm font-heading font-medium text-stamp-600 hover:text-stamp-700 transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 m-4 text-center border-2 border-dashed border-seal-400">
              <FiFileText className="h-12 w-12 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-300 mb-4">No scan history yet</p>
              <Link
                to="/upload"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-800 hover:bg-primary-900 text-parchment-50 rounded shadow-stamp text-sm font-medium transition-colors"
              >
                <span>Start a scan</span>
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-ink/10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-ink-500 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              <span className="text-sm text-ink-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-ink-500 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

      {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-parchment-100 border border-ink/10 shadow-ledger w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold text-ink">Delete Scan</h3>
                <button
                  onClick={() => setDeleteModal({ open: false, scan: null })}
                  aria-label="Close delete confirmation"
                  className="text-ink-400 hover:text-ink-600 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-ink-600 mb-6">
                Are you sure you want to delete this scan? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setDeleteModal({ open: false, scan: null })}
                  className="px-4 py-2 text-sm font-medium text-ink bg-parchment-200 hover:bg-parchment-300 rounded shadow-ledger transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-parchment-50 bg-stamp-600 hover:bg-stamp-700 rounded shadow-stamp transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
