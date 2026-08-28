import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiX, FiLink, FiCamera, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh',
  'Puducherry', 'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Lakshadweep',
];

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let html5QrCode = null;
    let mounted = true;

    const startScanning = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        html5QrCode = new Html5Qrcode('barcode-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
          (decodedText) => {
            if (mounted) {
              onScan(decodedText);
              html5QrCode.stop().catch(() => {});
            }
          },
          () => {}
        );
      } catch (err) {
        if (mounted) {
          toast.error('Camera access denied or not available');
          onClose();
        }
      }
    };

    startScanning();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-ink/70 z-50 flex items-center justify-center p-4">
      <div className="bg-parchment-100 border border-ink/10 shadow-ledger max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-ink/10 bg-parchment-50">
          <h3 className="font-heading text-ink flex items-center space-x-2">
            <FiCamera className="h-5 w-5 text-seal-500" />
            <span>Scan Barcode / QR Code</span>
          </h3>
          <button onClick={onClose} className="text-ink-400 hover:text-stamp-500 p-1" aria-label="Close scanner">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div id="barcode-reader" className="w-full rounded overflow-hidden" />
          <p className="text-xs text-ink-500 text-center mt-3">Point your camera at a barcode or QR code on the product label.</p>
        </div>
      </div>
    </div>
  );
};

const ScanUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [listingUrl, setListingUrl] = useState('');
  const [gtin, setGtin] = useState('');
  const [state, setState] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFile(selectedFile);
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleBarcodeScan = (decodedText) => {
    setGtin(decodedText);
    setShowScanner(false);
    toast.success(`Barcode detected: ${decodedText}`);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a label image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (listingUrl) formData.append('listing_url', listingUrl);
      if (gtin) formData.append('gtin', gtin);
      if (state) formData.append('state', state);

      const response = await api.post('/scan/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Scan completed successfully!');
      const scanId = response.data.scan?.id || response.data.scan_id;
      if (scanId) {
        navigate(`/scan/${scanId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-parchment-200 ledger-paper min-h-screen">
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-heading text-ink">Product Scan</h1>
        <p className="text-ink-500 mt-1">Upload a product label image for AI compliance verification.</p>
      </div>

      <div className="bg-parchment-100 border border-ink/10 shadow-ledger border-t-2 border-t-seal-500 p-8 rounded">
        <h2 className="text-xl font-heading text-ink mb-2">Upload Label Image</h2>
        <p className="text-ink-500 mb-6">Capture the product label clearly, including MRP, manufacturer details, and quantity.</p>

        <div className="space-y-6">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink/25 rounded bg-parchment-50 p-12 text-center cursor-pointer hover:border-primary-800 hover:bg-parchment-100 transition-colors"
            >
              <FiUpload className="h-10 w-10 text-seal-500 mx-auto mb-4" />
              <p className="text-lg font-heading text-ink">Click to capture or upload</p>
              <p className="text-sm text-ink-500 mt-1">PNG, JPG, TIFF, BMP, or WebP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img src={preview} alt="Label preview" className="w-full max-h-96 object-contain rounded border border-ink/10" />
                <div className="absolute -top-px -left-px w-8 h-8 border-t-2 border-l-2 border-seal-500 pointer-events-none" aria-hidden="true" />
                <div className="absolute -bottom-px -right-px w-8 h-8 border-b-2 border-r-2 border-seal-500 pointer-events-none" aria-hidden="true" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  aria-label="Remove image"
                  className="absolute top-3 right-3 bg-parchment-50 hover:bg-stamp-50 rounded-full p-2 shadow-ledger text-stamp-500"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-500 mb-2">E-Commerce Listing URL (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLink className="text-ink-400" />
              </div>
              <input
                type="url"
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="https://amazon.in/dp/..."
                className="pl-10 w-full bg-parchment-50 border-ink/20 text-ink p-3 rounded focus:border-primary-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-500 mb-2">GTIN / Barcode</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={gtin}
                  onChange={(e) => setGtin(e.target.value)}
                  placeholder="e.g. 8901234567890"
                  className="flex-1 bg-parchment-50 border-ink/20 text-ink p-3 rounded focus:border-primary-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-3 border border-primary-800 text-primary-800 hover:bg-primary-100 rounded transition-colors flex items-center space-x-1.5 flex-shrink-0"
                  title="Scan barcode with camera"
                >
                  <FiCamera className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">Scan</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-500 mb-2">
                <FiMapPin className="inline h-3.5 w-3.5 mr-1 text-ink-400" />
                State / UT (Optional)
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-parchment-50 border-ink/20 text-ink p-3 rounded focus:border-primary-800 focus:outline-none"
              >
                <option value="">Select state...</option>
                {INDIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full flex justify-center items-center py-4 bg-primary-800 hover:bg-primary-900 text-parchment-50 font-bold rounded shadow-stamp transition-colors disabled:opacity-50"
          >
            {uploading ? 'Analyzing and Verifying...' : 'Submit for AI Verification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanUpload;
