import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiX, FiCamera, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';

const CitizenReport = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [gtin, setGtin] = useState('');
  const [location, setLocation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
          toast.warning("Could not automatically determine location. Location coordinates assist inspection teams.");
        }
      );
    }
  }, []);

  const handleFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const newFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    
    if (newFiles.length + files.length > 5) {
      toast.error('Maximum 5 images allowed per statutory report');
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please attach at least one image of the product packaging');
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    if (gtin) formData.append('gtin', gtin);
    
    if (location) {
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
    }

    setUploading(true);
    try {
      const response = await api.post('/scan/public-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(true);
      toast.success(response.data.message || 'Report registered in the inspection queue.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report. Please recheck images and try again.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="report-page max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-success-50 text-success border border-success/30 rounded-xs mb-6">
          <FiCheckCircle className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy mb-3">
          Statutory Violation Report Lodged
        </h1>
        <p className="text-[#555] text-sm leading-relaxed max-w-lg mx-auto mb-8 font-sans">
          Your packaging report has been cataloged in the enforcement queue. Verified discrepancies are forwarded to the jurisdictional Legal Metrology controller for physical verification under Section 15.
        </p>
        <button
          onClick={() => { setSuccess(false); setFiles([]); setPreviews([]); setGtin(''); }}
          className="bg-navy hover:bg-navy-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xs transition-colors border border-[#374B73]"
        >
          Submit Another Packaging Report
        </button>
      </div>
    );
  }

  return (
    <div className="report-page max-w-2xl mx-auto px-4 py-10 font-body text-slate-700">
      <div className="mb-8 border-b border-line pb-4">
        <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-seal font-semibold mb-1">
          <span>Form PR-01</span>
          <span>&middot;</span>
          <span>Public Grievance Registry</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy">
          Report a Packaged Commodity Violation
        </h1>
        <p className="text-xs text-[#555] mt-1">
          Upload clear photographs of the product packaging (MRP, net quantity, manufacturer address, or consumer helpline) to initiate automated compliance auditing.
        </p>
      </div>

      <div className="bg-white border border-line shadow-ledger rounded-xs p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-navy mb-2">
              Packaging Evidence Photographs <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-xs overflow-hidden border border-line group bg-paper">
                  <img src={preview} alt={`Packaging ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-danger text-white p-1 rounded-xs opacity-90 hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
              
              {previews.length < 5 && (
                <div className="aspect-square rounded-xs border-2 border-dashed border-line flex flex-col items-center justify-center bg-paper hover:bg-[#EFECE3] transition-colors p-2 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <button 
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="text-navy hover:text-seal flex items-center space-x-1 text-xs font-semibold py-1"
                    >
                      <FiCamera size={14} />
                      <span>Camera</span>
                    </button>
                    <span className="text-[10px] text-[#888] font-mono">or</span>
                    <button 
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="text-navy hover:text-seal flex items-center space-x-1 text-xs font-semibold py-1"
                    >
                      <FiUpload size={14} />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              className="hidden"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="text-[11px] font-mono text-[#666]">
              Ensure the principal display panel and declaration text are legible. Maximum 5 photographs.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-navy mb-1.5">
              Barcode / GTIN (Optional)
            </label>
            <input
              type="text"
              value={gtin}
              onChange={(e) => setGtin(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xs border border-line bg-paper/50 focus:bg-white focus:border-seal outline-none transition-colors"
              placeholder="e.g. 8901234567890"
            />
            <p className="text-[11px] text-[#666] mt-1">
              If visible, enter the numeric barcode below the symbol to verify historical manufacturer compliance.
            </p>
          </div>

          <div className="bg-paper border border-line rounded-xs p-3 flex items-start space-x-3">
            <FiMapPin className="text-seal mt-0.5 flex-shrink-0" size={16} />
            <div>
              <h4 className="font-mono text-xs font-bold text-navy uppercase">Geographic Location</h4>
              <p className="text-[#555] text-xs mt-0.5">
                {location 
                  ? `Lat: ${location.latitude.toFixed(4)}, Long: ${location.longitude.toFixed(4)} will be appended to report coordinates.` 
                  : "Allowing location coordinates facilitates field inspection by the nearest district officer."}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className={`w-full py-3 rounded-xs text-white font-semibold text-sm flex justify-center items-center space-x-2 transition-colors ${
              uploading || files.length === 0
                ? 'bg-[#A09C94] cursor-not-allowed'
                : 'bg-seal hover:bg-seal-hover shadow-xs'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="font-mono">Processing Statutory Evidence...</span>
              </>
            ) : (
              <>
                <FiUpload className="h-4 w-4" />
                <span>Submit Violation to Enforcement Queue</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CitizenReport;
