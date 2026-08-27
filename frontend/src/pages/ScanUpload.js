import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiX, FiLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';

const ScanUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [listingUrl, setListingUrl] = useState('');
  const [gtin, setGtin] = useState('');
  const [uploading, setUploading] = useState(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Product Scan</h1>
        <p className="text-gray-600 mt-1">Upload a product label image for AI compliance verification.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold mb-2">Upload Label Image</h2>
        <p className="text-gray-600 mb-6">Capture the product label clearly, including MRP, manufacturer details, and quantity.</p>

        <div className="space-y-6">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors"
            >
              <FiUpload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Click to capture or upload</p>
              <p className="text-sm text-gray-500 mt-1">PNG, JPG, TIFF, BMP, or WebP</p>
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
                <img src={preview} alt="Label preview" className="w-full max-h-96 object-contain rounded-xl border border-gray-200" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  aria-label="Remove image"
                  className="absolute top-3 right-3 bg-white hover:bg-red-50 rounded-full p-2 shadow-md text-red-500"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
          )}

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
            disabled={uploading || !file}
            className="w-full flex justify-center items-center py-4 bg-primary-800 hover:bg-primary-900 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? 'Analyzing and Verifying...' : 'Submit for AI Verification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanUpload;
