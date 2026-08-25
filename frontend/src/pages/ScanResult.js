import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiDownload, FiArrowLeft,
  FiFileText, FiPrinter
} from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ScanResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await api.get(`/scan/${id}`);
        setScan(response.data);
      } catch (err) {
        toast.error('Failed to load scan results');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [id, navigate]);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/scan/${id}/report`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compliscan-report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'compliant':
        return {
          bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800',
          badge: 'bg-green-100 text-green-800', icon: FiCheckCircle,
          label: 'Compliant'
        };
      case 'non_compliant':
      case 'non-compliant':
        return {
          bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
          badge: 'bg-red-100 text-red-800', icon: FiXCircle,
          label: 'Non-Compliant'
        };
      case 'partial':
      case 'partially_compliant':
      case 'partially-compliant':
        return {
          bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-800', icon: FiAlertTriangle,
          label: 'Partially Compliant'
        };
      default:
        return {
          bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800', icon: FiAlertTriangle,
          label: status || 'Unknown'
        };
    }
  };

  const getCheckStatusIcon = (status) => {
    if (status === 'pass' || status === true) {
      return <FiCheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === 'fail' || status === false) {
      return <FiXCircle className="h-5 w-5 text-red-500" />;
    }
    return <FiAlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'info': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-800"></div>
          <p className="text-gray-500 text-sm">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (!scan) return null;

  const statusConfig = getStatusConfig(scan.overall_status || scan.status);
  const StatusIcon = statusConfig.icon;
  const checks = scan.checks || scan.compliance_checks || [];
  const imageUrl = scan.image_url || (scan.image_data ? `http://localhost:5000${scan.image_data}` : null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 no-print">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Scan Results</h1>
          <p className="text-gray-500 text-sm mt-1">
            Scanned on {new Date(scan.created_at || scan.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiPrinter className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button
            onClick={downloadReport}
            disabled={downloading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-800 hover:bg-primary-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FiDownload className="h-4 w-4" />
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Scanned label"
                className="w-full h-64 object-contain bg-gray-50"
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                <FiFileText className="h-16 w-16 text-gray-300" />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Product Name</h3>
              <p className="text-gray-900 font-medium mt-1">{scan.product_name || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-2xl border p-6 ${statusConfig.bg} ${statusConfig.border}`}>
            <div className="flex items-center space-x-3">
              <StatusIcon className={`h-8 w-8 ${statusConfig.text}`} />
              <div>
                <h2 className={`text-xl font-bold ${statusConfig.text}`}>
                  {statusConfig.label}
                </h2>
                <p className={`text-sm mt-0.5 ${statusConfig.text} opacity-80`}>
                  Overall compliance status
                </p>
              </div>
            </div>
          </div>

          {scan.ocr_text && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FiFileText className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Extracted Text (OCR)</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{scan.ocr_text}</pre>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Checks</h3>
              <p className="text-sm text-gray-500 mt-1">
                {checks.length} rules evaluated
              </p>
            </div>
            {checks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rule</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {checks.map((check, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {check.rule_name || check.name || check.rule || `Rule ${index + 1}`}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getCheckStatusIcon(check.passed ?? check.status)}
                            <span className={`text-sm font-medium ${
                              (check.passed === true || check.status === 'pass')
                                ? 'text-green-700'
                                : (check.passed === false || check.status === 'fail')
                                  ? 'text-red-700'
                                  : 'text-amber-700'
                            }`}>
                              {(check.passed === true || check.status === 'pass') ? 'Pass' :
                               (check.passed === false || check.status === 'fail') ? 'Fail' : 'Warning'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          {check.message || check.description || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {check.severity ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(check.severity)}`}>
                              {check.severity}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No compliance checks found in results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResult;
