import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiDownload, FiArrowLeft,
  FiShield, FiEye, FiEyeOff, FiFileText, FiExternalLink, FiPackage
} from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ZONE_LABELS = {
  mrp_zone: 'MRP',
  manufacturer_zone: 'Manufacturer',
  consumer_care_zone: 'Consumer Care',
  net_qty_zone: 'Net Quantity',
  bottom_panel: 'Bottom Panel',
  unknown: 'Text Region',
};

const ZONE_BASE_COLORS = {
  mrp_zone: '#B08D57',
  manufacturer_zone: '#B08D57',
  consumer_care_zone: '#B08D57',
  net_qty_zone: '#B08D57',
  bottom_panel: '#1F3A2E',
  unknown: '#6f6f62',
};

function getZoneStatus(zone, checks) {
  const zoneLower = zone?.toLowerCase() || '';
  for (const check of checks) {
    const name = (check.rule_name || '').toLowerCase();
    const citation = (check.citation || '').toLowerCase();
    if (
      (zoneLower === 'mrp_zone' && (name.includes('mrp') || name.includes('price'))) ||
      (zoneLower === 'net_qty_zone' && (name.includes('quantity') || name.includes('weight') || name.includes('net'))) ||
      (zoneLower === 'manufacturer_zone' && (name.includes('manufacturer') || name.includes('address'))) ||
      (zoneLower === 'consumer_care_zone' && (name.includes('care') || name.includes('helpline') || name.includes('contact')))
    ) {
      if (check.status === 'pass') return 'pass';
      if (check.status === 'fail') return 'fail';
      return 'review';
    }
  }
  return null;
}

function zoneColor(zone, checks) {
  const base = ZONE_BASE_COLORS[zone] || ZONE_BASE_COLORS.unknown;
  const status = getZoneStatus(zone, checks);
  const alpha = 0.30;
  if (status === 'fail') return { bg: `rgba(166,50,30,${alpha})`, border: '#A6321E' };
  if (status === 'pass') return { bg: `rgba(176,141,87,${alpha})`, border: '#B08D57' };
  return { bg: hexToRgba(base, alpha), border: base };
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const BboxOverlay = ({ extractedData, imgNaturalWidth, imgNaturalHeight, displayWidth, displayHeight, checks }) => {
  if (!extractedData || extractedData.length === 0) return null;
  const scaleX = displayWidth / imgNaturalWidth;
  const scaleY = displayHeight / imgNaturalHeight;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: displayWidth, height: displayHeight }}>
      {extractedData.map((item, i) => {
        if (!item.bbox || item.bbox.length < 4) return null;
        const pts = item.bbox;
        const xs = pts.map(p => p[0]);
        const ys = pts.map(p => p[1]);
        const x = Math.min(...xs) * scaleX;
        const y = Math.min(...ys) * scaleY;
        const w = (Math.max(...xs) - Math.min(...xs)) * scaleX;
        const h = (Math.max(...ys) - Math.min(...ys)) * scaleY;
        const zone = item.zone || 'unknown';
        const colors = zoneColor(zone, checks);
        const status = getZoneStatus(zone, checks);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: w,
              height: h,
              backgroundColor: colors.bg,
              border: `2px solid ${colors.border}`,
              borderRadius: 3,
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: -14,
                left: 0,
                fontSize: 9,
                fontWeight: 700,
                color: '#fff',
                backgroundColor: colors.border,
                padding: '1px 5px',
                borderRadius: 3,
                lineHeight: '14px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}
            >
              {ZONE_LABELS[zone] || zone}
              {status === 'pass' && ' \u2713'}
              {status === 'fail' && ' \u2717'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const StatusChip = ({ status }) => {
  let cls, label, Icon;
  switch (status) {
    case 'pass':
      cls = 'text-seal-700 border-seal-600';
      label = 'PASS'; Icon = FiCheckCircle;
      break;
    case 'fail':
      cls = 'text-stamp-600 border-stamp-600';
      label = 'FAIL'; Icon = FiXCircle;
      break;
    case 'human_review_required':
    case 'likely_violation':
      cls = status === 'likely_violation' ? 'text-stamp-600 border-stamp-600' : 'text-seal-700 border-seal-600/60';
      label = status === 'likely_violation' ? 'VIOLATION' : 'REVIEW';
      Icon = FiAlertTriangle;
      break;
    default:
      cls = 'text-ink-400 border-ink/30';
      label = 'N/A'; Icon = FiAlertTriangle;
  }
  return (
    <span className={`rubber-stamp inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </span>
  );
};

const RiskBadge = ({ riskData }) => {
  if (!riskData) return null;
  const score = riskData.risk_score ?? 0;
  const tier = riskData.risk_tier || 'LOW';
  let color, borderCls;
  if (score > 60) { color = 'text-stamp-600'; borderCls = 'border-stamp-600/40'; }
  else if (score > 30) { color = 'text-seal-700'; borderCls = 'border-seal-600/60'; }
  else { color = 'text-seal-600'; borderCls = 'border-seal-600/40'; }

  return (
    <div className={`flex items-center justify-between p-4 border ${borderCls} bg-parchment-100 shadow-ledger`}>
      <div className="flex items-center space-x-3">
        <FiShield className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">RISK: {tier}</p>
          <p className="text-sm text-ink-500 mt-0.5">{riskData.total_scans} prior scan{riskData.total_scans !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-2xl font-black ${color}`}>{score}<span className="text-sm font-normal text-ink-400">/100</span></p>
        <p className={`text-xs font-bold ${color}`}>{tier}</p>
      </div>
    </div>
  );
};

const MismatchCard = ({ mismatch }) => {
  if (!mismatch || mismatch.status === 'skipped' || mismatch.status === 'error') return null;

  const isMatch = mismatch.status === 'match';
  const physical = {
    MRP: mismatch.listing_data?.mrp || '\u2014',
    Country: mismatch.listing_data?.country_of_origin || '\u2014',
  };

  return (
    <div className={`border shadow-ledger bg-parchment-100 overflow-hidden ${isMatch ? 'border-seal-600/50' : 'border-stamp-600/50'}`}>
      <div className={`px-5 py-3 flex items-center justify-between border-b ${isMatch ? 'border-seal-600/40 bg-seal-100/40' : 'border-stamp-600/40 bg-stamp-50/40'}`}>
        <div className="flex items-center space-x-2">
          <FiExternalLink className={`h-4 w-4 ${isMatch ? 'text-seal-600' : 'text-stamp-600'}`} />
          <h4 className={`text-sm font-bold ${isMatch ? 'text-seal-700' : 'text-stamp-600'}`}>E-Commerce Listing Cross-Check</h4>
        </div>
        <StatusChip status={isMatch ? 'pass' : 'fail'} />
      </div>
      <div className="bg-parchment-100 p-5">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="font-semibold text-ink-500 text-xs uppercase tracking-wider">Field</div>
          <div className="font-semibold text-ink-500 text-xs uppercase tracking-wider">Physical Label</div>
          <div className="font-semibold text-ink-500 text-xs uppercase tracking-wider">Online Listing</div>

          <div className="text-ink font-medium">MRP</div>
          <div className={`text-ink font-medium ${isMatch || !(mismatch.mismatches || []).includes('MRP') ? '' : 'text-stamp-600'}`}>{mismatch.listing_data?.mrp || '\u2014'}</div>
          <div className={`text-ink font-medium ${isMatch || !(mismatch.mismatches || []).includes('MRP') ? '' : 'text-stamp-600 underline decoration-stamp-600/40'}`}>{mismatch.listing_data?.mrp || '\u2014'}</div>

          <div className="text-ink font-medium">Country</div>
          <div className="text-ink font-medium">{mismatch.listing_data?.country_of_origin || '\u2014'}</div>
          <div className="text-ink font-medium">{mismatch.listing_data?.country_of_origin || '\u2014'}</div>
        </div>

        {!isMatch && mismatch.mismatches && mismatch.mismatches.length > 0 && (
          <div className="mt-4 border border-stamp-600/40 bg-stamp-50/30">
            <p className="text-xs font-bold text-stamp-600 mb-1.5 px-3 pt-2.5">Discrepancies Found</p>
            <ul className="space-y-1 px-3 pb-3">
              {mismatch.mismatches.map((m, i) => (
                <li key={i} className="text-sm text-stamp-600 flex items-start space-x-1.5">
                  <FiXCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ScanResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showBboxes, setShowBboxes] = useState(false);
  const [imgDims, setImgDims] = useState({ natW: 0, natH: 0, dispW: 0, dispH: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await api.get(`/scan/${id}`);
        setScan(response.data.scan);
        if (response.data.scan.gtin) {
          const riskResp = await api.get(`/scan/gtin/${response.data.scan.gtin}/risk`);
          setRiskData(riskResp.data);
        }
      } catch (err) {
        toast.error('Failed to load scan results');
        navigate('/upload');
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [id, navigate]);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (img) {
      setImgDims({ natW: img.naturalWidth, natH: img.naturalHeight, dispW: img.clientWidth, dispH: img.clientHeight });
    }
  }, []);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/scan/${id}/report`, { responseType: 'blob' });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-200 ledger-paper">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-800" />
          <p className="text-ink-500 text-sm font-medium">Loading inspection report...</p>
        </div>
      </div>
    );
  }

  if (!scan) return null;

  const checks = scan.compliance_result?.checks || [];
  const ruleVersion = scan.compliance_result?.rule_version_applied || 'Base Rules';
  const mismatch = scan.mismatch_result;
  const overallStatus = scan.overall_status || scan.status || 'unknown';
  const imageUrl = scan.image_url || (scan.image_path ? `${API_BASE_URL}/uploads/${scan.image_path.split(/[\\/]/).pop()}` : null);
  const extractedData = scan.extracted_data || scan.ocr_extracted_data || null;
  const hasBboxData = extractedData && extractedData.length > 0 && extractedData.some(d => d.bbox);

  const passedCount = checks.filter(c => c.status === 'pass').length;
  const failedCount = checks.filter(c => c.status === 'fail').length;
  const reviewCount = checks.filter(c => c.status === 'human_review_required' || c.status === 'likely_violation').length;

  const verdictConfig = {
    compliant: {
      icon: FiCheckCircle, iconColor: 'text-seal-600',
      label: 'Compliant',
      stampLabel: '\u2713 COMPLIANT',
      stampCls: 'text-seal-700 border-seal-600',
      subtitle: 'All checks passed',
    },
    non_compliant: {
      icon: FiXCircle, iconColor: 'text-stamp-600',
      label: 'Non-Compliant',
      stampLabel: '\u2715 NON-COMPLIANT',
      stampCls: 'text-stamp-600 border-stamp-600',
      subtitle: 'Critical violations detected',
    },
    review_required: {
      icon: FiAlertTriangle, iconColor: 'text-seal-600',
      label: 'Human Review Required',
      stampLabel: '\u25CB REVIEW REQUIRED',
      stampCls: 'text-seal-700 border-seal-600/60',
      subtitle: 'Needs officer verification',
    },
  };
  const verdict = verdictConfig[overallStatus] || verdictConfig.compliant;
  const VerdictIcon = verdict.icon;

  return (
    <div className="min-h-screen bg-parchment-200 ledger-paper">
      {/* Official Header Band */}
      <div className="bg-primary-800 border-b-2 border-seal-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="p-2 hover:bg-primary-700/60 transition-colors text-parchment-100/80 hover:text-parchment-100"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <FiShield className="h-5 w-5 text-seal-500" />
                  <h1 className="text-lg sm:text-xl font-heading font-bold text-parchment-100 tracking-tight">CompliScan &middot; Inspection Register</h1>
                </div>
                <p className="ledger-stamp text-[11px] sm:text-xs text-seal-400 mt-0.5 tracking-wider">LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ledger-stamp text-xs text-parchment-100/80">SCAN REF: {scan.id ? String(scan.id).padStart(6, '0') : '\u2014'}</p>
              <p className="ledger-stamp text-xs text-seal-400 mt-0.5">Rule Version: {ruleVersion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rubber-Stamp Verdict Banner */}
      <div className="border-b border-ink/10 bg-parchment-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <VerdictIcon className={`h-7 w-7 ${verdict.iconColor}`} />
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink tracking-tight">Verdict: <span className="font-body font-semibold">{verdict.label}</span></h2>
                  <p className="text-sm text-ink-500 mt-0.5">{verdict.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`rubber-stamp text-2xl sm:text-3xl font-bold rotate-[-4deg] ${verdict.stampCls}`}>
                {verdict.stampLabel}
              </span>
              <button
                onClick={downloadReport}
                disabled={downloading}
                className="hidden sm:inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-800 hover:bg-primary-900 text-parchment-50 text-sm font-semibold rounded shadow-stamp transition-colors disabled:opacity-50"
              >
                <FiDownload className="h-4 w-4" />
                <span>{downloading ? 'Generating...' : 'Download PDF Report'}</span>
              </button>
            </div>
          </div>

          {/* Check Summary Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 border border-ink/20 bg-parchment-100 text-xs font-semibold text-ink-600 shadow-ledger">
              <FiFileText className="h-3.5 w-3.5 text-ink-300" />
              <span>Scan #{scan.id}</span>
            </span>
            {passedCount > 0 && (
              <span className="rubber-stamp px-3 py-1 text-xs font-bold text-seal-700 border-seal-600">
                {passedCount} passed
              </span>
            )}
            {failedCount > 0 && (
              <span className="rubber-stamp px-3 py-1 text-xs font-bold text-stamp-600 border-stamp-600">
                {failedCount} failed
              </span>
            )}
            {reviewCount > 0 && (
              <span className="rubber-stamp px-3 py-1 text-xs font-bold text-seal-700 border-seal-600/60">
                {reviewCount} review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile download button */}
        <button
          onClick={downloadReport}
          disabled={downloading}
          className="sm:hidden w-full flex items-center justify-center space-x-2 px-5 py-3 bg-primary-800 hover:bg-primary-900 text-parchment-50 text-sm font-semibold rounded shadow-stamp transition-colors disabled:opacity-50 mb-6"
        >
          <FiDownload className="h-4 w-4" />
          <span>{downloading ? 'Generating...' : 'Download PDF Report'}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column — 2/5 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image Card */}
            <div className="bg-parchment-100 border border-ink/10 shadow-ledger overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiPackage className="h-4 w-4 text-ink-400" />
                  <h3 className="text-sm font-bold text-ink">Product Label</h3>
                </div>
                {hasBboxData && (
                  <button
                    onClick={() => setShowBboxes(!showBboxes)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-ink-500 hover:text-primary-800 transition-colors px-2 py-1 hover:bg-parchment-200"
                  >
                    {showBboxes ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                    <span>{showBboxes ? 'Hide regions' : 'Show regions'}</span>
                  </button>
                )}
              </div>
              <div className="p-4">
                <div className="relative bg-parchment-200 ledger-paper border border-ink/10 overflow-hidden">
                  {showBboxes && hasBboxData && imageUrl && (
                    <BboxOverlay
                      extractedData={extractedData}
                      imgNaturalWidth={imgDims.natW}
                      imgNaturalHeight={imgDims.natH}
                      displayWidth={imgDims.dispW}
                      displayHeight={imgDims.dispH}
                      checks={checks}
                    />
                  )}
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Scanned product label"
                    onLoad={handleImageLoad}
                    className="w-full h-64 sm:h-80 object-contain"
                  />
                </div>
                {hasBboxData && showBboxes && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(ZONE_BASE_COLORS).filter(([k]) => k !== 'unknown').map(([zone, color]) => (
                      <span key={zone} className="inline-flex items-center space-x-1.5 text-xs text-ink-500">
                        <span className="w-2.5 h-2.5 border border-ink/20" style={{ backgroundColor: color }} />
                        <span>{ZONE_LABELS[zone]}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info Card */}
            <div className="bg-parchment-100 border border-ink/10 shadow-ledger p-5 space-y-3">
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Product</p>
                <p className="text-base font-bold text-ink mt-0.5">{scan.product_name || 'Unknown Product'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Manufacturer</p>
                <p className="ledger-stamp text-sm text-ink mt-0.5">{scan.manufacturer || 'Not detected'}</p>
              </div>
              {scan.gtin && (
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">GTIN</p>
                  <p className="ledger-stamp text-sm text-ink mt-0.5">{scan.gtin}</p>
                </div>
              )}
              {scan.extracted_fields && Object.keys(scan.extracted_fields).length > 0 && (
                <div className="pt-2 border-t border-ink/10">
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Extracted Fields</p>
                  <div className="space-y-1.5">
                    {Object.entries(scan.extracted_fields).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-ink-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-ink font-medium">{value || '\u2014'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* GTIN Risk Badge */}
            <RiskBadge riskData={riskData} />
          </div>

          {/* Right Column — 3/5 width */}
          <div className="lg:col-span-3 space-y-6">
            {/* Rule Engine Checks Table */}
            <div className="bg-parchment-100 border border-ink/10 shadow-ledger overflow-hidden">
              <div className="px-6 py-4 border-b border-ink/10 bg-parchment-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-heading font-bold text-ink">Deterministic Rule Engine Checks</h3>
                    <p className="text-xs text-ink-500 mt-0.5">{checks.length} rules evaluated &bull; {ruleVersion}</p>
                  </div>
                  <span className="ledger-stamp text-xs bg-parchment-100 border border-ink/20 text-ink-500 px-2.5 py-1">{ruleVersion}</span>
                </div>
              </div>

              {checks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink/10 bg-parchment-200/40">
                        <th className="text-left px-6 py-3 text-xs font-bold text-ink-500 uppercase tracking-wider">Legal Rule &amp; Citation</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-ink-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-ink-500 uppercase tracking-wider">Extracted Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                      {checks.map((check, index) => (
                        <tr key={index} className="ledger-rule-row hover:bg-parchment-200/60 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-ink">{check.rule_name}</p>
                            <p className="ledger-stamp text-xs text-ink-400 mt-1">{check.citation}</p>
                          </td>
                          <td className="px-6 py-4">
                            <StatusChip status={check.status} />
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-ink-600 leading-relaxed">{check.message}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FiFileText className="h-10 w-10 text-ink-300 mx-auto mb-3" />
                  <p className="text-ink-500 text-sm">No rule checks available for this scan.</p>
                </div>
              )}
            </div>

            {/* Mismatch Card */}
            <MismatchCard mismatch={mismatch} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResult;
