import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiDownload, FiArrowLeft,
  FiFileText, FiPrinter, FiSearch, FiShield
} from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ScanResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await api.get(`/scan/${id}`);
        setScan(response.data.scan);
        
        // Fetch GTIN risk if GTIN exists
        if (response.data.scan.gtin) {
          const riskResp = await api.get(`/scan/gtin/${response.data.scan.gtin}/risk`);
          setRiskData(riskResp.data);
        }
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
          icon: FiCheckCircle, label: 'PASS'
        };
      case 'non_compliant':
      case 'non-compliant':
        return {
          bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
          icon: FiXCircle, label: 'LIKELY VIOLATION'
        };
      case 'review_required':
      case 'partially_compliant':
        return {
          bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800',
          icon: FiAlertTriangle, label: 'HUMAN REVIEW REQUIRED'
        };
      default:
        return {
          bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800',
          icon: FiAlertTriangle, label: status || 'Unknown'
        };
    }
  };

  const getCheckStatusIcon = (status) => {
    if (status === 'pass' || status === true) return <FiCheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'fail' || status === 'likely_violation' || status === false) return <FiXCircle className="h-5 w-5 text-red-500" />;
    return <FiSearch className="h-5 w-5 text-amber-500" />;
  };

  const getCheckStatusText = (status) => {
    if (status === 'pass' || status === true) return 'Pass';
    if (status === 'fail' || status === false) return 'Fail';
    if (status === 'human_review_required') return 'Review';
    if (status === 'likely_violation') return 'Violation';
    return 'Warning';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-800"></div>
    </div>
  );

  if (!scan) return null;

  const statusConfig = getStatusConfig(scan.overall_status || scan.status);
  const StatusIcon = statusConfig.icon;
  const checks = scan.compliance_result?.checks || [];
  const ruleVersion = scan.compliance_result?.rule_version_applied || "Base Rules";
  const mismatch = scan.mismatch_result;
  const imageUrl = scan.image_url || (scan.image_path ? `http://localhost:5000/uploads/${scan.image_path.split(/[\\/]/).pop()}` : null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between mb-8 no-print">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 mb-2 hover:text-gray-900">
            <FiArrowLeft className="mr-1" /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Inspection Report</h1>
          <p className="text-sm text-gray-500">ID: {scan.id} • Rule Engine: {ruleVersion}</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={downloadReport} disabled={downloading} className="px-4 py-2 bg-primary-800 text-white rounded-lg">
            <FiDownload className="inline mr-2" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className={`rounded-2xl border p-6 ${statusConfig.bg} ${statusConfig.border}`}>
            <div className="flex flex-col items-center text-center">
              <StatusIcon className={`h-12 w-12 ${statusConfig.text} mb-3`} />
              <h2 className={`text-2xl font-bold ${statusConfig.text}`}>{statusConfig.label}</h2>
              <p className={`text-sm mt-1 ${statusConfig.text} opacity-80`}>Confidence-Tiered Verdict</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <img src={imageUrl} alt="Scan" className="w-full h-48 object-contain bg-gray-50 rounded-lg mb-4" />
            <h3 className="font-bold text-gray-900">{scan.product_name || 'Unknown Product'}</h3>
            <p className="text-sm text-gray-500">{scan.manufacturer || 'Unknown Manufacturer'}</p>
            {scan.gtin && <p className="text-sm text-gray-500 mt-2 font-mono">GTIN: {scan.gtin}</p>}
          </div>

          {riskData && (
            <div className="bg-white rounded-2xl border p-6">
              <div className="flex items-center mb-2">
                <FiShield className="text-primary-600 mr-2 h-5 w-5" />
                <h3 className="font-bold">GTIN Risk History</h3>
              </div>
              <p className="text-3xl font-black mb-1">{riskData.risk_score}<span className="text-sm text-gray-400 font-normal">/100</span></p>
              <p className="text-sm text-gray-600">Risk Tier: <span className="font-bold">{riskData.risk_tier}</span> ({riskData.total_scans} prior scans)</p>
            </div>
          )}

          {mismatch && mismatch.status !== 'skipped' && (
            <div className={`rounded-2xl border p-6 ${mismatch.status === 'mismatch_found' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <h3 className="font-bold mb-2">Physical vs Listing Mismatch</h3>
              {mismatch.status === 'match' ? (
                <p className="text-sm text-green-700">Online listing matches physical label.</p>
              ) : (
                <ul className="list-disc pl-4 text-sm text-red-700">
                  {mismatch.mismatches.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Deterministic Rule Engine Checks</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">{ruleVersion}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Legal Rule & Citation</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Verdict</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Extracted Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {checks.map((check, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{check.rule_name}</p>
                        <p className="text-xs text-primary-600 mt-1 font-mono">{check.citation}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getCheckStatusIcon(check.status)}
                          <span className="text-sm font-bold">{getCheckStatusText(check.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {check.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResult;
