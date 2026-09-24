import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowRight, Image as ImageIcon, Link, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

const EcommerceCrawler = () => {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !file) {
      toast.error("Please provide both an E-commerce URL and a physical product image.");
      return;
    }

    setLoading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('url', url);
    formData.append('image', file);

    try {
      // Allow longer timeout for this API as it runs Gemini multiple times + scraping
      const response = await axios.post('http://127.0.0.1:5000/api/ecommerce/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 
      });
      setResult(response.data);
      if (response.data.diff_report?.overall_status === 'COMPLIANT') {
         toast.success("Analysis complete: Product is COMPLIANT");
      } else {
         toast.warning("Analysis complete: Violations detected!");
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || "Failed to analyze the listing.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'MATCH') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'VIOLATION' || status === 'MISSING_IN_DIGITAL') return <ShieldAlert className="w-5 h-5 text-red-500" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            E-Commerce AI Scanner
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Compare a physical product label against its Amazon/Flipkart listing for Rule 6/18 Compliance.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Digital Listing URL</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                    placeholder="https://amazon.in/dp/..."
                    required
                  />
                </div>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Physical Product Image</label>
                <div className="mt-1 flex justify-center px-6 pt-3 pb-4 border-2 border-gray-300 border-dashed rounded-md relative group hover:border-indigo-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => setFile(e.target.files[0])}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {file ? file.name : "PNG, JPG up to 10MB"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing via Gemini...
                  </>
                ) : (
                  <>
                    Run Compliance Check <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {result && result.diff_report && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn">
            <div className={`px-6 py-4 border-b ${result.diff_report.overall_status === 'COMPLIANT' ? 'bg-green-50' : 'bg-red-50'}`}>
              <h2 className={`text-xl font-bold flex items-center ${result.diff_report.overall_status === 'COMPLIANT' ? 'text-green-800' : 'text-red-800'}`}>
                {result.diff_report.overall_status === 'COMPLIANT' ? (
                  <><CheckCircle className="mr-2 h-6 w-6" /> COMPLIANT LISTING</>
                ) : (
                  <><ShieldAlert className="mr-2 h-6 w-6" /> NON-COMPLIANT LISTING</>
                )}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Physical Label (Ground Truth)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digital Listing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.diff_report.fields.map((field, index) => (
                    <tr key={index} className={field.status === 'MATCH' ? 'bg-white' : 'bg-red-50/50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {field.field_name.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {field.physical_value || <span className="text-gray-400 italic">Not found</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {field.digital_value || <span className="text-gray-400 italic">Not found</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(field.status)}
                          <span className={`ml-2 font-medium ${field.status === 'MATCH' ? 'text-green-700' : 'text-red-700'}`}>
                            {field.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {field.reason && field.status !== 'MATCH' && (
                          <p className="mt-1 text-xs text-red-600 max-w-xs">{field.reason}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcommerceCrawler;
