import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/upload');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-surface-sunken px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl p-3 inline-block shadow-lg mb-4">
            <FiSearch className="h-10 w-10 text-primary-800" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">MeteroLens</h1>
          <p className="text-primary-200 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-surface-raised rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 flex items-center space-x-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-500/20">
              <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-ink-faint" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  autoCapitalize="none"
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-line rounded-lg text-ink focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-ink-faint" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-line rounded-lg text-ink focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 bg-primary-700 hover:bg-primary-800 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-muted">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;