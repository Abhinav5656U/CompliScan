import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiList, FiArrowLeft } from 'react-icons/fi';
import ScanResult from './ScanResult'; // We will render the existing ScanResult inside this component

const BatchScanResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scanIds, setScanIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Parse ids from query params e.g., ?ids=1,2,3
    const queryParams = new URLSearchParams(location.search);
    const idsParam = queryParams.get('ids');
    if (idsParam) {
      const parsedIds = idsParam.split(',').map(id => id.trim()).filter(id => id);
      setScanIds(parsedIds);
    }
  }, [location.search]);

  if (scanIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No batch scan IDs provided in URL.</p>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < scanIds.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Batch Header Slider Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/upload')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                aria-label="Back to Upload"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2 text-primary-800">
                <FiList className="h-5 w-5" />
                <h2 className="font-bold text-gray-900 hidden sm:block">
                  Batch Scan Results
                </h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                  currentIndex === 0 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="px-4 font-semibold text-sm text-gray-700 font-mono">
                Product {currentIndex + 1} of {scanIds.length}
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex === scanIds.length - 1}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                  currentIndex === scanIds.length - 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render the ScanResult component for the currently selected scan ID */}
      <div className="mt-2">
        <ScanResult key={scanIds[currentIndex]} scanIdProp={scanIds[currentIndex]} />
      </div>
    </div>
  );
};

export default BatchScanResult;
