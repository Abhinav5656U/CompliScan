import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut, FiMenu, FiX, FiGrid, FiSearch, FiClock, FiMapPin } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const navLinks = [
    { to: '/upload', label: 'Scan', icon: FiSearch, show: isAuthenticated },
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid, show: isAuthenticated && ['admin', 'officer'].includes(user?.role) },
    { to: '/map', label: 'Map', icon: FiMapPin, show: isAuthenticated && ['admin', 'officer'].includes(user?.role) },
    { to: '/history', label: 'History', icon: FiClock, show: isAuthenticated },
  ];

  const isActive = (path) => location.pathname === path;

  const getRoleBadgeColor = (role) => {
    if (role === 'admin') return 'bg-seal-100 text-seal-500';
    if (role === 'officer') return 'bg-primary-100 text-primary-800';
    return 'bg-ink-100 text-ink';
  };

  return (
    <nav className="bg-primary-800 border-b-2 border-seal-500 shadow-ledger no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="border-2 border-seal-500 rounded-md p-1">
                <FiSearch className="h-5 w-5 text-seal-500" />
              </div>
              <span className="text-white text-xl font-heading font-bold tracking-tight">CompliScan</span>
            </Link>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.filter(l => l.show).map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center space-x-1.5 px-4 py-2 border-b-2 rounded-t-lg text-sm font-medium transition-colors duration-200 ${
                      isActive(link.to)
                        ? 'bg-primary-900 text-white border-seal-400'
                        : 'text-primary-200 border-transparent hover:bg-primary-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center">
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-primary-200 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-primary-700"
                >
                  <div className="bg-primary-600 rounded-full p-1.5">
                    <FiUser className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white leading-none mb-0.5">{user?.full_name || user?.username}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-parchment-100 rounded-xl shadow-ledger py-2 z-20 border border-seal-200 border-t-2 border-t-seal-500">
                      <div className="px-4 py-3 border-b border-parchment-200">
                        <p className="text-sm font-semibold text-ink">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{user?.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getRoleBadgeColor(user?.role)}`}>
                          {user?.role}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-stamp-600 hover:bg-stamp-50 transition-colors duration-200"
                      >
                        <FiLogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-2 text-primary-200 hover:text-white p-2"
            >
              {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-primary-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.filter(l => l.show).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium ${
                    isActive(link.to)
                      ? 'bg-primary-900 text-white border-l-2 border-seal-400'
                      : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
