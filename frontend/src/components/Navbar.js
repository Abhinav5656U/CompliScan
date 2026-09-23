import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiUser, FiLogOut, FiMenu, FiX, FiGrid, FiSearch, FiClock,
  FiMapPin, FiMessageCircle, FiShoppingCart, FiShield
} from 'react-icons/fi';

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
    { to: '/upload', label: 'Field Scan', icon: FiSearch, show: isAuthenticated },
    { to: '/dashboard', label: 'Enforcement Dashboard', icon: FiGrid, show: isAuthenticated && ['admin', 'officer'].includes(user?.role) },
    { to: '/map', label: 'Jurisdiction Map', icon: FiMapPin, show: isAuthenticated && ['admin', 'officer'].includes(user?.role) },
    { to: '/history', label: 'Audit Register', icon: FiClock, show: isAuthenticated },
    { to: '/ecommerce-crawler', label: 'E-Commerce Crawler', icon: FiShoppingCart, show: isAuthenticated },
    { to: '/chatbot', label: 'Statutory Assistant', icon: FiMessageCircle, show: isAuthenticated },
  ];

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role) => {
    if (role === 'admin') return 'bg-[#FAF1DD] text-[#705106] border border-[#DDB354]';
    if (role === 'officer') return 'bg-[#EDF5F1] text-[#2E6B4F] border border-[#B3D6C5]';
    return 'bg-[#F7F5F0] text-[#1C1C1C] border border-[#D8D3C7]';
  };

  return (
    <header className="no-print sticky top-0 z-50">
      {/* Official Department Header Strip */}
      <div className="bg-[#0B1323] text-[#D8D3C7] border-b border-[#1E2E4E] text-[11px] font-mono tracking-wider py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-none bg-seal" />
            <span className="font-semibold text-white/90">GOVERNMENT OF INDIA</span>
            <span className="text-[#8B98AD]">&middot;</span>
            <span className="text-[#B5BFD0] hidden sm:inline">MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION</span>
            <span className="text-[#8B98AD] hidden md:inline">&middot;</span>
            <span className="text-[#9EABBF] hidden md:inline">LEGAL METROLOGY DIVISION</span>
          </div>
          <div className="text-[10px] text-[#A6790A] font-mono hidden sm:flex items-center space-x-2">
            <span className="px-1.5 py-0.2 border border-[#A6790A]/40 bg-[#A6790A]/10">STATUTORY ENFORCEMENT</span>
          </div>
        </div>
      </div>

      {/* Main Official Nav */}
      <nav className="bg-navy border-b border-[#24355A] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2.5 focus:outline-none focus:ring-1 focus:ring-seal">
                <div className="h-8 w-8 bg-[#1D2E52] border border-[#374B73] rounded-sm flex items-center justify-center text-seal shadow-xs">
                  <FiShield className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-base font-bold font-heading tracking-wide leading-tight flex items-center space-x-1.5">
                    <span>MeteroLens</span>
                    <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 bg-[#1D2E52] text-[#D8D3C7] border border-[#374B73] rounded-xs">
                      v2.4
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-[#8EA0BE] uppercase tracking-wider leading-none mt-0.5">
                    Legal Metrology Inspection System
                  </span>
                </div>
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-0.5">
                {navLinks.filter(l => l.show).map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium tracking-wide rounded-sm transition-colors ${
                        active
                          ? 'bg-[#1D2E52] text-white border-b-2 border-seal font-semibold'
                          : 'text-[#C5D0E0] hover:bg-[#1D2E52]/60 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? 'text-seal' : 'text-[#8EA0BE]'}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/report"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-[#E0E6F0] hover:text-white border border-[#374B73] rounded-sm hover:bg-[#1D2E52] transition-colors"
                >
                  <span>Citizen Violation Report</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-navy bg-[#F7F5F0] hover:bg-white rounded-sm transition-colors border border-line shadow-xs"
                >
                  <span>Official Sign In</span>
                </Link>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-[#C5D0E0] hover:text-white px-2.5 py-1 rounded-sm hover:bg-[#1D2E52] border border-transparent hover:border-[#374B73] transition-colors"
                  >
                    <div className="h-6 w-6 rounded-xs bg-[#1D2E52] border border-[#374B73] flex items-center justify-center text-seal">
                      <FiUser className="h-3.5 w-3.5" />
                    </div>
                    <div className="hidden sm:block text-left leading-tight">
                      <p className="text-xs font-semibold text-white truncate max-w-[130px]">{user?.full_name || user?.username}</p>
                      <span className={`text-[9px] font-mono uppercase px-1 py-0.5 rounded-none inline-block ${getRoleBadge(user?.role)}`}>
                        {user?.role}
                      </span>
                    </div>
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-[#FAF9F5] rounded-sm shadow-ledger py-2 z-20 border border-line">
                        <div className="px-4 py-2.5 border-b border-line bg-white/50">
                          <p className="text-xs font-bold font-heading text-ink">{user?.full_name || user?.username}</p>
                          <p className="text-[11px] font-mono text-[#555] truncate mt-0.5">{user?.email}</p>
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 mt-1.5 inline-block ${getRoleBadge(user?.role)}`}>
                            Officer Role: {user?.role}
                          </span>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/upload"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-xs text-ink hover:bg-[#EFECE3] transition-colors"
                          >
                            <FiSearch className="h-3.5 w-3.5 text-[#666]" />
                            <span>New Inspection Scan</span>
                          </Link>
                          <Link
                            to="/history"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-xs text-ink hover:bg-[#EFECE3] transition-colors"
                          >
                            <FiClock className="h-3.5 w-3.5 text-[#666]" />
                            <span>Inspection Ledger</span>
                          </Link>
                        </div>
                        <div className="border-t border-line pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-danger hover:bg-danger-50 transition-colors"
                          >
                            <FiLogOut className="h-3.5 w-3.5" />
                            <span>Sign out of session</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[#C5D0E0] hover:text-white p-1.5 rounded-sm hover:bg-[#1D2E52]"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#24355A] bg-[#0F1A30] px-3 py-3 space-y-1">
            {isAuthenticated ? (
              navLinks.filter(l => l.show).map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-sm ${
                      isActive(link.to)
                        ? 'bg-[#1D2E52] text-white border-l-2 border-seal'
                        : 'text-[#C5D0E0] hover:bg-[#1D2E52] hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-seal" />
                    <span>{link.label}</span>
                  </Link>
                );
              })
            ) : (
              <div className="space-y-2 pt-1 pb-2">
                <Link
                  to="/report"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-medium text-white bg-[#1D2E52] rounded-sm"
                >
                  Citizen Violation Report
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-semibold text-center text-navy bg-paper rounded-sm"
                >
                  Official Sign In
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
