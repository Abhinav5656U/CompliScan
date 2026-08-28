import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiHash } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    badge_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.badge_number) {
        delete payload.badge_number;
      }
      await register(payload);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-200 ledger-paper text-ink px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-parchment-100 border border-ink/10 border-t-2 border-t-seal-500 shadow-ledger">
          <div className="px-8 pt-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 border-2 border-seal-500 rounded-full bg-parchment-100 mb-3">
              <svg className="h-8 w-8 text-seal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-ink">CompliScan</h1>
            <p className="font-ledger text-[10px] tracking-[0.3em] uppercase text-ink-500 mt-1.5">Legal Metrology · Inspection</p>
          </div>

          <div className="mt-7 border-t-2 border-seal-500 bg-primary-800 px-8 py-3.5">
            <div className="flex items-center justify-between">
              <p className="font-ledger text-[11px] tracking-[0.25em] uppercase text-seal-200">Form S-2 · Badge Registration</p>
              <span className="rubber-stamp text-[10px] tracking-widest text-seal-200">Inspector Badge</span>
            </div>
          </div>

          <div className="px-8 py-7">
            <h2 className="font-heading text-2xl font-bold text-ink">Register</h2>
            <p className="text-sm text-ink-500 mt-1 mb-6">Create your account.</p>

            {error && (
              <div className="mb-6 flex items-center space-x-2 bg-stamp-50 text-stamp-700 p-3 rounded-sm border border-stamp-500/40">
                <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2.5 bg-parchment-50 border border-ink/20 rounded focus:ring-2 focus:ring-primary-800/20 focus:border-primary-800 focus:outline-none text-sm text-ink placeholder:text-ink-300"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2.5 bg-parchment-50 border border-ink/20 rounded focus:ring-2 focus:ring-primary-800/20 focus:border-primary-800 focus:outline-none text-sm text-ink placeholder:text-ink-300"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2.5 bg-parchment-50 border border-ink/20 rounded focus:ring-2 focus:ring-primary-800/20 focus:border-primary-800 focus:outline-none text-sm text-ink placeholder:text-ink-300"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-ink-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2.5 bg-parchment-50 border border-ink/20 rounded focus:ring-2 focus:ring-primary-800/20 focus:border-primary-800 focus:outline-none text-sm text-ink placeholder:text-ink-300"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full bg-parchment-50 border border-ink/20 rounded py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary-800/20 focus:border-primary-800 focus:outline-none text-ink disabled:bg-parchment-100 disabled:text-ink-300"
                    disabled
                  >
                    <option value="viewer">Viewer</option>
                  </select>
                  <p className="text-xs text-ink-400 mt-1">New accounts are assigned Viewer role</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">Badge #</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiHash className="h-4 w-4 text-ink-400" />
                    </div>
                    <input
                      type="text"
                      name="badge_number"
                      value={formData.badge_number}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-parchment-50 border border-ink/20 rounded focus:ring-2 focus:ring-primary-800/20 focus:border-primary-800 focus:outline-none text-sm text-ink placeholder:text-ink-300"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 bg-primary-800 hover:bg-primary-900 text-parchment-50 font-semibold rounded shadow-stamp transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-parchment-50"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-ink/10 text-center">
              <p className="text-sm text-ink-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary-800 hover:text-seal-600 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;