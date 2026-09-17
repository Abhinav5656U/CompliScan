import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ChatbotFloat from './components/ChatbotFloat';

// Lazy loaded components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const HowItWorks = lazy(() => import('./pages/HowItWorksPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ScanUpload = lazy(() => import('./pages/ScanUpload'));
const ScanResult = lazy(() => import('./pages/ScanResult'));
const BatchScanResult = lazy(() => import('./pages/BatchScanResult'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const IndiaMap = lazy(() => import('./pages/IndiaMap'));
const CitizenReport = lazy(() => import('./pages/CitizenReport'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const EcommerceCrawler = lazy(() => import('./pages/EcommerceCrawler'));
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/report" element={
                <>
                  <Navbar />
                  <main><CitizenReport /></main>
                </>
              } />

              {/* Protected app routes */}
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main><ScanUpload /></main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scan/:id"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main><ScanResult /></main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scan-batch"
                element={
                  <ProtectedRoute>
                    <main><BatchScanResult /></main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main><Dashboard /></main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main><IndiaMap /></main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main><History /></main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatbot"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main><Chatbot /></main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ecommerce-crawler"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main><EcommerceCrawler /></main>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <ChatbotFloat />
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
