import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiImage, FiX, FiCheckCircle, FiChevronRight, FiLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';

const STEPS = [
  { id: 'front', label: 'Front Panel', desc: 'Capture the front of the product' },
  { id: 'back', label: 'Back Panel', desc: 'Capture the back of the product' },
  { id: 'mrp', label: 'MRP & Label Zone', desc: 'Include a credit card for scale calibration' },
  { id: 'url', label: 'Listing URL', desc: 'Optional: E-Commerce URL to cross-check' }
];

const ScanUpload = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState({ front: null, back: null, mrp: null });
  const [previews, setPreviews] = useState({ front: null, back: null, mrp: null });
  const [listingUrl, setListingUrl] = useState('');
  const [gtin, setGtin] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cvLoaded, setCvLoaded] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (document.getElementById('opencv-script')) {
      if (window.cv) setCvLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = 'opencv-script';
    script.src = "https://docs.opencv.org/4.8.0/opencv.js";
    script.async = true;
    script.onload = () => setCvLoaded(true);
    document.body.appendChild(script);
    return () => { 
      // Do not remove script to prevent re-initialization issues on re-mount
    };
  }, []);

  const assessImageQuality = (imgSrc, callback) => {
    if (!window.cv || !cvLoaded) {
      callback({ isBlurry: false });
      return;
    }
    
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        const cv = window.cv;
        let mat = cv.imread(canvas);
        let gray = new cv.Mat();
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);
        let lap = new cv.Mat();
        cv.Laplacian(gray, lap, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
        let mean = new cv.Mat();
        let stdDev = new cv.Mat();
        cv.meanStdDev(lap, mean, stdDev);
        let variance = stdDev.data64F[0] * stdDev.data64F[0];
        
        mat.delete(); gray.delete(); lap.delete(); mean.delete(); stdDev.delete();
        
        callback({ isBlurry: variance < 50, variance }); // 50 is heuristic threshold
      } catch (e) {
        console.error("OpenCV processing failed", e);
        callback({ isBlurry: false });
      }
    };
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      assessImageQuality(dataUrl, (quality) => {
        if (quality.isBlurry) {
          toast.error("Image appears blurry. Please retake for accurate OCR.");
        } else {
          const stepId = STEPS[currentStep].id;
          setFiles(prev => ({ ...prev, [stepId]: selectedFile }));
          setPreviews(prev => ({ ...prev, [stepId]: dataUrl }));
          if (currentStep < 2) {
             setCurrentStep(currentStep + 1);
          }
        }
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleUpload = async () => {
    // For MVP, backend only processes one image for OCR (we send MRP zone)
    if (!files.mrp) {
      toast.error('MRP/Label image is required');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', files.mrp); // Send the label zone for OCR
      if (listingUrl) formData.append('listing_url', listingUrl);
      if (gtin) formData.append('gtin', gtin);

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Guided Capture</h1>
        <p className="text-gray-600 mt-1">Follow the steps to ensure evidence-grade inspection data.</p>
      </div>

      <div className="flex mb-8 space-x-2 overflow-x-auto">
        {STEPS.map((step, idx) => (
          <div key={step.id} className={`flex-1 min-w-[120px] p-3 border-t-4 transition-colors ${idx <= currentStep ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-xs font-bold uppercase ${idx <= currentStep ? 'text-primary-700' : 'text-gray-400'}`}>Step {idx + 1}</p>
            <p className={`text-sm font-semibold ${idx <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold mb-2">{STEPS[currentStep].label}</h2>
        <p className="text-gray-600 mb-6">{STEPS[currentStep].desc}</p>

        {currentStep < 3 ? (
          <div>
            {!previews[STEPS[currentStep].id] ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors"
              >
                <FiUpload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">Click to capture or upload</p>
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
                  <img src={previews[STEPS[currentStep].id]} alt="Preview" className="w-full max-h-96 object-contain rounded-xl border border-gray-200" />
                  <button
                    onClick={() => {
                      const stepId = STEPS[currentStep].id;
                      setFiles(prev => ({ ...prev, [stepId]: null }));
                      setPreviews(prev => ({ ...prev, [stepId]: null }));
                    }}
                    className="absolute top-3 right-3 bg-white hover:bg-red-50 rounded-full p-2 shadow-md text-red-500"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="flex justify-end">
                  <button onClick={nextStep} className="flex items-center px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                    Next Step <FiChevronRight className="ml-2" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-Commerce Listing URL (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLink className="text-gray-400" />
                </div>
                <input
                  type="url"
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  placeholder="https://amazon.in/dp/..."
                  className="pl-10 w-full rounded-lg border-gray-300 border p-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GTIN / Barcode (Optional)</label>
              <input
                type="text"
                value={gtin}
                onChange={(e) => setGtin(e.target.value)}
                placeholder="e.g. 8901234567890"
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex justify-center items-center py-4 bg-primary-800 hover:bg-primary-900 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {uploading ? 'Analyzing and Verifying...' : 'Submit for AI Verification'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanUpload;
