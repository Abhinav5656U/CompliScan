import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, ChevronRight, RefreshCw, Layers, Scan as ScanIcon, Info } from 'lucide-react';
import api from '../utils/api';

const Authenticity = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/authenticity/history');
      setHistory(response.data.scans || []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setScanning(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await api.post('/authenticity/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setResult(response.data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze authenticity. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const getScoreColor = (score) => {
    if (score <= 20) return 'text-green-600 bg-green-50 border-green-200';
    if (score <= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score <= 75) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Product Authenticity</h1>
          <p className="mt-2 text-gray-500">Multi-layer risk assessment pipeline for detecting counterfeit packaging.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <ScanIcon className="w-5 h-5 mr-2 text-indigo-500" />
              Scan Package
            </h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                previewUrl ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  setSelectedFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setPreviewUrl(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            >
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="mx-auto max-h-48 rounded object-contain" />
                  <button 
                    onClick={() => { setPreviewUrl(null); setSelectedFile(null); setResult(null); }}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Drag & drop package image</p>
                    <p className="text-xs text-gray-500 mt-1">or click to browse files</p>
                  </div>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              
              {!previewUrl && (
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Select Image
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start text-sm">
                <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || scanning}
              className={`w-full mt-6 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white 
                ${!selectedFile || scanning 
                  ? 'bg-indigo-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
                } transition-colors flex justify-center items-center`}
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Running Auth Pipeline...
                </>
              ) : (
                <>
                  Assess Risk
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </div>
          
          {/* History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Recent Assessments</h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No assessments yet.</p>
              ) : (
                history.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100" onClick={() => setResult(item)}>
                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                      {item.image_url && <img src={item.image_url} alt="scan" className="w-full h-full object-cover" />}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name || 'Unknown Product'}</p>
                      <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-2 py-1 text-xs font-bold rounded ${item.risk_score > 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.risk_score}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Risk Score Widget */}
              <div className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row items-center justify-between ${getScoreColor(result.risk_score).split(' ')[2]}`}>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Authenticity Risk Assessment</h2>
                  <p className="text-gray-500">Product: {result.product_name || 'Not detected in OCR'}</p>
                </div>
                <div className="mt-4 md:mt-0 md:ml-6 flex items-center justify-center">
                  <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center ${getScoreColor(result.risk_score)}`}>
                    <span className="text-3xl font-black">{result.risk_score}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider mt-1">{result.risk_level}</span>
                  </div>
                </div>
              </div>

              {/* Multi-Layer Pipeline View */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Layers className="w-5 h-5 mr-2 text-indigo-500" />
                    Layered Evidence Engine
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {/* Layer 1 */}
                  <div className="p-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className={`mt-0.5 rounded-full p-1 ${result.layer_results?.layer_1_quality?.status === 'pass' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {result.layer_results?.layer_1_quality?.status === 'pass' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900">Layer 1: Image Quality</p>
                        <p className="text-sm text-gray-600 mt-1">{result.layer_results?.layer_1_quality?.details || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Layer 2 */}
                  <div className="p-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className={`mt-0.5 rounded-full p-1 ${result.layer_results?.layer_2_ocr?.status === 'pass' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {result.layer_results?.layer_2_ocr?.status === 'pass' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900">Layer 2: Label Compliance (OCR)</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{
                          typeof result.layer_results?.layer_2_ocr?.details === 'object' 
                          ? `Extracted ${Object.keys(result.layer_results.layer_2_ocr.details).length} fields including Batch, MFG.` 
                          : result.layer_results?.layer_2_ocr?.details || 'N/A'
                        }</p>
                      </div>
                    </div>
                  </div>

                  {/* Layer 3 */}
                  <div className="p-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className={`mt-0.5 rounded-full p-1 ${result.layer_results?.layer_3_barcode?.status === 'pass' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {result.layer_results?.layer_3_barcode?.status === 'pass' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900">Layer 3: Barcode & QR Intelligence</p>
                        <p className="text-sm text-gray-600 mt-1">{result.layer_results?.layer_3_barcode?.details || 'N/A'}</p>
                        {result.layer_results?.layer_3_barcode?.data && (
                          <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded text-gray-700 break-all">
                            {result.layer_results.layer_3_barcode.data.map((d, i) => (
                              <div key={i}>[{d.type}] {d.data}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Layer 4 */}
                  <div className="p-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className={`mt-0.5 rounded-full p-1 ${result.layer_results?.layer_4_semantic?.status === 'pass' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {result.layer_results?.layer_4_semantic?.status === 'pass' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900">Layer 7: Cross-Modal Consistency</p>
                        <p className="text-sm text-gray-600 mt-1">{result.layer_results?.layer_4_semantic?.details || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-8 text-center">
              <Layers className="w-16 h-16 text-indigo-100 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Ready for Authenticity Scan</h3>
              <p className="mt-2 text-gray-500 max-w-md">
                Upload a clear image of a product package containing the batch number and barcode/QR code. Our multi-layer pipeline will assess authenticity risk.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authenticity;
