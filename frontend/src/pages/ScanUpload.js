import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiImage, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';

const ScanUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/scan/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Scan completed successfully!');
      const scanId = response.data.id || response.data.scan_id;
      if (scanId) {
        navigate(`/scan/${scanId}`);
      } else {
        navigate('/');
        toast.info('Scan saved. Check your history for results.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Scan Product Label</h1>
        <p className="text-gray-600 mt-1">Upload an image of a product label to check regulatory compliance</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${dragOver ? 'bg-primary-100' : 'bg-gray-100'}`}>
                <FiUpload className={`h-10 w-10 ${dragOver ? 'text-primary-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {dragOver ? 'Drop your image here' : 'Drag & drop your image here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
              <p className="text-xs text-gray-400">Supports PNG, JPG, JPEG, WEBP (max 20MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-96 object-contain rounded-xl border border-gray-200"
              />
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <FiImage className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex justify-center items-center py-3 px-4 bg-primary-800 hover:bg-primary-900 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing label...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FiUpload className="h-5 w-5" />
                  <span>Run Compliance Scan</span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanUpload;
