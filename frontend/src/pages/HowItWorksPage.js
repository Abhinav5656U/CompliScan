import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import PacketScene from '../components/landing/PacketScene';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How it Works', href: '/how-it-works', isRoute: true },
  { label: 'Team', href: '/#footer' },
];

export default function HowItWorksPage() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchor = (e, href) => {
    // If it's a cross-page hash link, navigate to it
    if (href.startsWith('/#')) {
      e.preventDefault();
      navigate('/');
      setTimeout(() => {
        const id = href.replace('/#', '#');
        const el = document.querySelector(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background styling to match landing page hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-gray-950 opacity-80" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      {/* ─── Navbar ─── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="bg-primary-800 rounded-lg p-1.5">
              <FiSearch className="h-5 w-5 text-white" />
            </div>
            <span className={`font-heading text-xl font-bold tracking-tight ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              MeteroLens
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchor(e, link.href)}
                  className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className={`hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold border rounded-lg transition-colors ${
                scrolled 
                  ? 'text-gray-700 border-gray-300 hover:bg-gray-50' 
                  : 'text-white border-white/20 hover:bg-white/10'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-800 hover:bg-primary-900 rounded-lg transition-colors shadow-sm"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* The 3D Scroll Story Canvas */}
      <main className="w-full h-screen relative z-10">
        <PacketScene />
      </main>
    </div>
  );
}
