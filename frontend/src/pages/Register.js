import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiHash, FiSearch } from 'react-icons/fi';
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

  const inputClass = "block w-full pl-9 pr-3 py-2.5 bg-surface border border-line rounded-lg text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
  const labelClass = "block text-sm font-medium text-ink-muted mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-surface-sunken px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl p-3 inline-block shadow-lg mb-4">
            <FiSearch className="h-10 w-10 text-primary-800" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">MeteroLens</h1>
          <p className="text-primary-200 mt-2">Create your account</p>
        </div>

        <div className="bg-surface-raised rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 flex items-center space-x-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-500/20">
              <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-4 w-4 text-ink-faint" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-4 w-4 text-ink-faint" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 text-ink-faint" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 text-ink-faint" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full border border-line rounded-lg py-2.5 px-3 text-sm text-ink-muted bg-surface-sunken focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled
                >
                  <option value="viewer">Viewer</option>
                </select>
                <p className="text-xs text-ink-faint mt-1">New accounts are assigned Viewer role</p>
              </div>

              <div>
                <label className={labelClass}>Badge #</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHash className="h-4 w-4 text-ink-faint" />
                  </div>
                  <input
                    type="text"
                    name="badge_number"
                    value={formData.badge_number}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 bg-primary-700 hover:bg-primary-800 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;