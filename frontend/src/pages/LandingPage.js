import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiUpload, FiCheckCircle, FiXCircle, FiFileText, FiShield, FiBarChart2,
  FiEye, FiZap, FiArrowRight, FiPlay, FiChevronRight, FiGlobe,
  FiGrid, FiCrosshair, FiAlertTriangle, FiBook, FiGithub, FiMail, FiClock
} from 'react-icons/fi';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Team', href: '#footer' },
];

const STATS = [
  { icon: FiBook, value: '8', label: 'Legal Metrology Rules Checked' },
  { icon: FiZap, value: 'OCR + Rule Engine', label: 'Dual-Layer Verification' },
  { icon: FiFileText, value: 'PDF', label: 'Evidence Reports' },
  { icon: FiGlobe, value: 'Bilingual', label: 'Label Detection' },
];

const STEPS = [
  {
    num: '01',
    icon: FiUpload,
    title: 'Capture',
    desc: 'Officer photographs the product label in the field using any mobile or desktop camera.',
    color: 'bg-blue-500',
  },
  {
    num: '02',
    icon: FiSearch,
    title: 'Extract & Verify',
    desc: 'OCR extracts text, then the rule engine checks it against versioned Legal Metrology rules with citations.',
    color: 'bg-primary-600',
  },
  {
    num: '03',
    icon: FiFileText,
    title: 'Report',
    desc: 'Instant verdict with legal citations, downloadable PDF evidence report, and e-commerce listing cross-check.',
    color: 'bg-green-600',
  },
];

const FEATURES = [
  {
    icon: FiSearch,
    title: 'OCR Label Scanning',
    desc: 'Extracts text from product packaging photos with high-accuracy optical character recognition.',
  },
  {
    icon: FiBook,
    title: 'Rule-Based Verification',
    desc: 'Checks against versioned Legal Metrology Rules with legal citations for every verdict.',
  },
  {
    icon: FiCrosshair,
    title: 'E-Commerce Mismatch Detection',
    desc: 'Cross-checks physical labels against online listings for MRP and origin discrepancies.',
  },
  {
    icon: FiShield,
    title: 'GTIN Risk Scoring',
    desc: 'Flags repeat-offender products by tracking compliance history across barcode scans.',
  },
  {
    icon: FiBarChart2,
    title: 'Officer Dashboard',
    desc: 'Analytics, filters, enforcement trends, and violation breakdowns for supervisory oversight.',
  },
  {
    icon: FiFileText,
    title: 'PDF Evidence Reports',
    desc: 'Court and enforcement-ready compliance reports with ruled citations and extracted evidence.',
  },
];

const MockupCheckRow = ({ status, rule, citation }) => {
  const colors = {
    pass: 'bg-seal-500',
    fail: 'bg-stamp-500',
    review: 'bg-ink-300',
  };
  const labels = { pass: 'Pass', fail: 'Fail', review: 'Review' };
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2.5 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink truncate">{rule}</p>
          <p className="text-[10px] text-ink-400 font-ledger">{citation}</p>
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ml-2 border ${
        status === 'pass' ? 'border-seal-500 text-seal-600 bg-seal-100' :
        status === 'fail' ? 'border-stamp-500 text-stamp-600 bg-stamp-50' :
        'border-ink-300 text-ink-400 bg-parchment-200'
      }`}>
        {labels[status]}
      </span>
    </div>
  );
};

const HeroMockup = () => (
  <div className="relative w-full max-w-lg mx-auto lg:mx-0">
    <div className="absolute -inset-1 bg-seal-300/30 rounded blur-lg" />
    <div className="relative bg-parchment-100 backdrop-blur border border-seal-300 rounded shadow-ledger overflow-hidden">
      <div className="px-4 py-3 border-b border-ink/10 bg-parchment-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-seal-500" />
          <span className="font-ledger text-[11px] font-bold text-ink tracking-[0.2em]">Scan Result</span>
        </div>
        <span className="font-ledger text-[10px] text-ink-400">ID #4821</span>
      </div>

      <div className="p-4">
        {/* Fake product image with bbox overlays */}
        <div className="relative bg-parchment-200 border border-ink/10 rounded overflow-hidden mb-4 flex items-center justify-center" style={{
          height: '11rem',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(27,27,22,0.04) 8px, rgba(27,27,22,0.04) 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(27,27,22,0.04) 8px, rgba(27,27,22,0.04) 9px)',
        }}>
          {/* Bounding boxes */}
          <div className="absolute top-3 left-6 w-24 h-8 border-2 border-seal-500 bg-seal-500/15 rounded">
            <span className="absolute -top-3.5 left-0 text-[8px] font-bold bg-seal-500 text-parchment-50 px-1.5 py-0.5 rounded-sm">MRP</span>
          </div>
          <div className="absolute top-14 left-4 w-32 h-7 border-2 border-seal-500 bg-seal-500/15 rounded">
            <span className="absolute -top-3.5 left-0 text-[8px] font-bold bg-seal-500 text-parchment-50 px-1.5 py-0.5 rounded-sm">Net Qty</span>
          </div>
          <div className="absolute bottom-6 left-4 right-4 h-10 border-2 border-stamp-500 bg-stamp-500/15 rounded">
            <span className="absolute -top-3.5 left-0 text-[8px] font-bold bg-stamp-500 text-parchment-50 px-1.5 py-0.5 rounded-sm">Manufacturer</span>
          </div>
          <FiSearch className="h-8 w-8 text-ink-300" />
        </div>

        {/* Fake product info */}
        <div className="mb-3">
          <p className="font-heading text-sm font-bold text-ink">Premium Basmati Rice</p>
          <p className="text-[11px] text-ink-400">Agro Foods Pvt. Ltd. &bull; GTIN: 8901234567890</p>
        </div>

        {/* Verdict badge */}
        <div className="flex items-center space-x-2 mb-3 px-3 py-2 bg-stamp-50 border border-stamp-500 rounded">
          <FiXCircle className="h-4 w-4 text-stamp-500" />
          <span className="font-ledger text-xs font-bold text-stamp-600 tracking-wide">Non-Compliant</span>
          <span className="text-[10px] text-stamp-400 ml-auto">2 critical failures</span>
        </div>

        {/* Rule checks */}
        <div className="space-y-0 divide-y divide-ink/5">
          <MockupCheckRow status="pass" rule="MRP Declaration" citation="Rule 6(1)(e)" />
          <MockupCheckRow status="fail" rule="Manufacturer Address" citation="Rule 5(1)(a)" />
          <MockupCheckRow status="pass" rule="Net Quantity" citation="Rule 7(1)(a)" />
          <MockupCheckRow status="review" rule="Consumer Care Details" citation="Rule 6(1)(f)" />
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchor = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="font-body min-h-screen bg-parchment-200 text-ink ledger-paper">
      {/* --- Navbar --- */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-parchment-100/95 backdrop-blur-md shadow-ledger border-b border-ink/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="h-10 w-10 rounded-full border-2 border-seal-500 bg-parchment-100 shadow-ledger flex items-center justify-center">
              <FiSearch className="h-5 w-5 text-seal-600" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-xl font-bold text-ink tracking-tight">CompliScan</span>
              <span className="font-ledger text-[9px] tracking-[0.25em] text-seal-600">Inspection Register</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchor(e, link.href)}
                className="text-sm font-medium text-ink-500 hover:text-ink transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-ink-500 border border-ink/30 rounded hover:bg-parchment-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-parchment-50 bg-primary-800 hover:bg-primary-900 rounded transition-colors shadow-stamp"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero --- */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-parchment-100 border border-seal-500 rounded mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-seal-500" />
                <span className="text-xs font-semibold text-ink-500 tracking-wide">Smart India Hackathon 2026 &middot; Ministry of Consumer Affairs</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.1] tracking-tight">
                Legal Metrology Compliance,{' '}
                <span className="text-seal-600">
                  Scanned in Seconds
                </span>
              </h1>

              <p className="rubber-stamp text-stamp-500 text-sm my-5">Verified Against Rules, 2011</p>

              <p className="text-base sm:text-lg text-ink-500 leading-relaxed max-w-xl">
                Upload a product label photo. CompliScan uses OCR and rule-based verification to instantly check MRP, net quantity, manufacturer details, and 8 more mandatory declarations — with legal citations for every check.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/upload"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-800 hover:bg-primary-900 text-parchment-50 font-semibold rounded transition-colors shadow-stamp"
                >
                  <span>Try Live Demo</span>
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <button
                  className="inline-flex items-center space-x-2 px-6 py-3 text-primary-800 hover:bg-primary-100 font-semibold rounded border border-primary-800 hover:border-primary-800 transition-all"
                  onClick={() => {}}
                >
                  <FiPlay className="h-4 w-4" />
                  <span>Watch Walkthrough</span>
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* --- Stats Strip --- */}
      <section className="relative py-12 border-y border-ink/10 bg-parchment-100/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`flex items-center space-x-3 px-4 lg:px-6 lg:border-l lg:border-ink/10 lg:first:border-l-0 ${i % 2 === 1 ? 'border-l border-ink/10' : ''}`}>
                  <div className="flex-shrink-0 h-10 w-10 rounded-sm border border-seal-500 bg-parchment-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-seal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold font-heading text-ink">{stat.value}</p>
                    <p className="text-xs text-ink-500 leading-tight">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- How It Works --- */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="rubber-stamp text-stamp-500 text-xs mb-4">Process</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink tracking-tight">How It Works</h2>
            <p className="mt-3 text-ink-500 max-w-lg mx-auto">From field capture to enforcement-ready report in under 30 seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative bg-parchment-100 border border-ink/10 rounded p-6 shadow-ledger group">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-5 w-5 border-t-2 border-dashed border-ink/20" />
                  )}
                  <div className="flex items-start justify-between mb-5">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded border-2 border-primary-800 bg-parchment-50">
                      <Icon className="h-5 w-5 text-primary-800" />
                    </div>
                    <span className="font-ledger text-xs text-stamp-500 border border-stamp-500/60 rounded px-2 py-0.5">Entry {step.num}</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Feature Grid --- */}
      <section id="features" className="py-24 sm:py-32 border-y border-ink/10 bg-parchment-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="rubber-stamp text-seal-600 text-xs mb-4">Capabilities</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink tracking-tight">Built for Enforcement</h2>
            <p className="mt-3 text-ink-500 max-w-lg mx-auto">Every feature designed for the workflow of a legal metrology officer in the field.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-parchment-100 rounded border border-seal-300 p-6 shadow-ledger hover:border-primary-800 hover:shadow-stamp transition-all group">
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded border-2 border-primary-800 bg-parchment-50 text-primary-800 mb-4 group-hover:bg-primary-800 group-hover:text-parchment-50 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-ink mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Trust / Credibility Bar --- */}
      <section className="py-14 bg-primary-800 border-t-2 border-seal-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-10 text-center">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-full bg-primary-900 border-2 border-seal-500 flex items-center justify-center flex-shrink-0">
                <FiShield className="h-7 w-7 text-seal-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-parchment-100">Built for enforcement officers under</p>
                <p className="text-sm text-parchment-100/70">Ministry of Consumer Affairs, Food & Public Distribution</p>
                <p className="text-xs text-parchment-100/50 mt-0.5">Legal Metrology (Packaged Commodities) Rules, 2011</p>
              </div>
            </div>
            <span className="rubber-stamp text-seal-400 text-sm">Official</span>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer id="footer" className="bg-primary-900 text-parchment-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2.5 mb-4">
                <div className="h-10 w-10 rounded-full border-2 border-seal-500 bg-primary-800 flex items-center justify-center">
                  <FiSearch className="h-5 w-5 text-seal-400" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-heading text-xl font-bold tracking-tight text-parchment-100">CompliScan</span>
                  <span className="font-ledger text-[9px] tracking-[0.25em] text-seal-400">Inspection Register</span>
                </div>
              </div>
              <p className="text-sm text-parchment-100/60 leading-relaxed max-w-sm">
                AI-powered compliance scanning for Legal Metrology enforcement. Built for Smart India Hackathon 2026.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-parchment-100 mb-4 uppercase tracking-wider">Links</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="https://github.com/Abhinav5656U/CompliScan" target="_blank" rel="noopener noreferrer" className="text-sm text-parchment-100/60 hover:text-parchment-100 transition-colors flex items-center space-x-1.5">
                    <FiGithub className="h-3.5 w-3.5" />
                    <span>GitHub</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-parchment-100/60 hover:text-parchment-100 transition-colors flex items-center space-x-1.5">
                    <FiBook className="h-3.5 w-3.5" />
                    <span>Documentation</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:team@compliscan.in" className="text-sm text-parchment-100/60 hover:text-parchment-100 transition-colors flex items-center space-x-1.5">
                    <FiMail className="h-3.5 w-3.5" />
                    <span>Contact</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-parchment-100 mb-4 uppercase tracking-wider">Team</h4>
              <p className="text-sm text-parchment-100/60 leading-relaxed">
                CompliScan was built by a 6-member interdisciplinary team for Smart India Hackathon 2026, Problem Statement PS26034.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-seal-500/30 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <p className="text-xs text-parchment-100/40">&copy; {new Date().getFullYear()} CompliScan. All rights reserved.</p>
            <p className="font-ledger text-xs tracking-widest text-seal-400">REGD. OFFICE — SIH 2026 &middot; FORM PS26034</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;