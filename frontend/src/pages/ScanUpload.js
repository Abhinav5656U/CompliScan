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
  const [cameraError, setCameraError] = useState(false);

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
          setCameraError(true);
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
    <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-raised rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="font-bold text-ink flex items-center space-x-2">
            <FiCamera className="h-5 w-5 text-primary-600 dark:text-primary-300" />
            <span>Scan Barcode / QR Code</span>
          </h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink p-1" aria-label="Close scanner">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div id="barcode-reader" className="w-full rounded-xl overflow-hidden" />
          {cameraError ? (
            <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 text-center">
              <FiCamera className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Camera unavailable &#8212; upload an image instead</p>
              <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1">You can still submit a product label photo from your gallery or device.</p>
              <button
                onClick={onClose}
                className="mt-3 inline-flex items-center space-x-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <FiUpload className="h-4 w-4" />
                <span>Upload Image</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-ink-muted text-center mt-3">Point your camera at a barcode or QR code on the product label.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ScanUpload = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [listingUrl, setListingUrl] = useState('');
  const [gtin, setGtin] = useState('');
  const [state, setState] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    if (newFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleBarcodeScan = (decodedText) => {
    setGtin(decodedText);
    setShowScanner(false);
    toast.success(`Barcode detected: ${decodedText}`);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one label image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => {
        formData.append('images', f);
      });
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

  const fieldLabel = "block text-sm font-medium text-ink-muted mb-2";
  const fieldInput = "w-full rounded-lg bg-surface border border-line text-ink p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-ink">Product Scan</h1>
        <p className="text-ink-muted mt-1">Upload a product label image for AI compliance verification.</p>
      </div>

      <div className="bg-surface-raised rounded-2xl shadow-sm border border-line p-8">
        <h2 className="font-heading text-xl font-bold text-ink mb-2">Upload Label Image</h2>
        <p className="text-ink-muted mb-6">Capture the product label clearly, including MRP, manufacturer details, and quantity.</p>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => cameraInputRef.current?.click()}
              className="border-2 border-dashed border-line rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-surface-sunken transition-colors"
            >
              <FiCamera className="h-8 w-8 text-ink-faint mx-auto mb-2" />
              <p className="text-md font-medium text-ink">Take Photo</p>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="border-2 border-dashed border-line rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-surface-sunken transition-colors"
            >
              <FiUpload className="h-8 w-8 text-ink-faint mx-auto mb-2" />
              <p className="text-md font-medium text-ink">Upload Files</p>
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
          </div>

          {previews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-ink-muted mb-3">Selected Images ({previews.length})</h3>
              <div className="flex space-x-4 overflow-x-auto pb-4 snap-x">
                {previews.map((preview, index) => (
                  <div key={index} className="relative flex-none snap-start">
                    <img src={preview} alt={`Preview ${index}`} className="w-32 h-32 object-cover rounded-xl border border-line" />
                    <button
                      onClick={() => removeFile(index)}
                      aria-label="Remove image"
                      className="absolute top-1 right-1 bg-surface-raised hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full p-1.5 shadow-md text-red-500"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={fieldLabel}>E-Commerce Listing URL (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLink className="text-ink-faint" />
              </div>
              <input
                type="url"
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="https://amazon.in/dp/..."
                className={`pl-10 ${fieldInput}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>GTIN / Barcode</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={gtin}
                  onChange={(e) => setGtin(e.target.value)}
                  placeholder="e.g. 8901234567890"
                  className={`flex-1 ${fieldInput}`}
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-3 bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-500/25 transition-colors flex items-center space-x-1.5 flex-shrink-0"
                  title="Scan barcode with camera"
                >
                  <FiCamera className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">Scan</span>
                </button>
              </div>
            </div>

            <div>
              <label className={fieldLabel}>
                <FiMapPin className="inline h-3.5 w-3.5 mr-1" />
                State / UT (Optional)
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={`${fieldInput} bg-surface`}
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
            disabled={uploading || files.length === 0}
            className="w-full flex justify-center items-center py-4 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? 'Analyzing and Verifying...' : 'Submit for AI Verification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanUpload;