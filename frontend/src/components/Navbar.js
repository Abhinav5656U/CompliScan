import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiUser, FiLogOut, FiMenu, FiX, FiGrid, FiSearch, FiClock,
  FiMapPin, FiMessageCircle, FiShoppingCart, FiShield
} from 'react-icons/fi';
import { BiScan } from 'react-icons/bi';

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
    { to: '/upload', label: 'Inspect Product', icon: FiSearch, show: isAuthenticated },
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid, show: isAuthenticated && ['admin', 'officer'].includes(user?.role) },
    { to: '/map', label: 'Map', icon: FiMapPin, show: isAuthenticated && ['admin', 'officer'].includes(user?.role) },
    { to: '/history', label: 'History', icon: FiClock, show: isAuthenticated },
    { to: '/ecommerce-crawler', label: 'E-Commerce Scanner', icon: FiShoppingCart, show: isAuthenticated },
    { to: '/chatbot', label: 'Assistant', icon: FiMessageCircle, show: isAuthenticated },
  ];

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role) => {
    if (role === 'admin') return 'bg-navy text-seal border border-seal/50 shadow-sm';
    if (role === 'officer') return 'bg-navy text-success border border-success/50 shadow-sm';
    return 'bg-navy text-line border border-line/50 shadow-sm';
  };

  return (
    <header className="no-print sticky top-0 z-[9999]">

      {/* Main Official Nav */}
      <nav className="bg-navy border-b border-[#24355A] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#C5D0E0] hover:text-white p-1.5 rounded-sm hover:bg-[#1D2E52] mr-1"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
              </button>
              <div className="flex items-center space-x-2.5 focus:outline-none">
                <div className="h-8 w-8 bg-[#1D2E52] border border-[#374B73] rounded-sm flex items-center justify-center text-[#3B82F6] shadow-xs">
                  <BiScan className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-base font-bold font-heading tracking-wide leading-tight flex items-center space-x-1.5">
                    <span>MeteroLens</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#8EA0BE] uppercase tracking-wider leading-none mt-0.5">
                    Legal Metrology Inspection System
                  </span>
                </div>
              </div>
            </div>



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
              
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors px-3 py-1.5 rounded"
                >
                  <FiShield className="h-3 w-3" />
                  <span>Login / Sign-in</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Universal Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] flex">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/60 transition-opacity" 
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            
            {/* Sidebar */}
            <div className="relative flex w-full max-w-[280px] flex-1 flex-col bg-[#0B1323] shadow-2xl h-full overflow-y-auto transform transition-transform duration-300 ease-in-out border-r border-[#1E2E4E]">
              <div className="absolute right-0 top-0 pt-4 pr-4">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-sm bg-[#1D2E52] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <FiX className="h-5 w-5 text-white" aria-hidden="true" />
                </button>
              </div>
              
              <div className="px-5 pt-6 pb-4 border-b border-[#1E2E4E]">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-[#1D2E52] border border-[#374B73] rounded-sm flex items-center justify-center text-[#3B82F6] shadow-xs">
                    <BiScan className="h-5 w-5" />
                  </div>
                  <span className="text-white text-lg font-bold font-heading tracking-wide">MeteroLens</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <nav className="flex-1 px-4 space-y-2">
                  {isAuthenticated ? (
                    navLinks.filter(l => l.show).map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-3.5 text-sm font-medium rounded-sm transition-colors ${
                            isActive(link.to)
                              ? 'bg-[#1D2E52] text-white border-l-4 border-seal'
                              : 'text-[#C5D0E0] hover:bg-[#1D2E52] hover:text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-seal" />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="space-y-4 pt-2">
                      <Link
                        to="/report"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-3 text-sm font-medium text-white bg-[#1D2E52] rounded-sm text-center border border-[#374B73]"
                      >
                        Citizen Violation Report
                      </Link>
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-3 text-sm font-semibold text-center text-navy bg-paper rounded-sm shadow-xs"
                      >
                        Official Sign In
                      </Link>
                    </div>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
