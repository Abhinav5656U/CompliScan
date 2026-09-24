import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFileText, FiShield,
  FiArrowRight, FiCheck, FiAlertTriangle,
  FiExternalLink, FiBook, FiGithub, FiMail,
  FiCpu, FiDatabase, FiFile, FiSun, FiMoon
} from 'react-icons/fi';
import { BiScan } from 'react-icons/bi';

const MANDATORY_RULES = [
  { rule: 'Rule 5', name: 'Manufacturer / Packer Address', requirement: 'Complete postal address with state and PIN code', status: 'Mandatory' },
  { rule: 'Rule 6(1)(a)', name: 'Generic / Common Name', requirement: 'Clear nomenclature of commodity contained within', status: 'Mandatory' },
  { rule: 'Rule 6(1)(d)', name: 'Month & Year of Manufacture', requirement: 'Month and year of manufacture, packing, or import', status: 'Mandatory' },
  { rule: 'Rule 6(1)(e)', name: 'Maximum Retail Price (MRP)', requirement: 'Inclusive of all taxes in standard Indian currency format', status: 'Mandatory' },
  { rule: 'Rule 6(1)(f)', name: 'Consumer Care Helpline', requirement: 'Name, address, telephone number, and email of redressal officer', status: 'Mandatory' },
  { rule: 'Rule 6(11)', name: 'Unit Sale Price', requirement: 'Mandatory price per gram/ml for goods over specified weights', status: 'Mandatory' },
  { rule: 'Rule 7', name: 'Standard Net Quantity', requirement: 'Standard SI metric units (g, kg, ml, l) adhering to Schedule II', status: 'Mandatory' },
  { rule: 'Rule 6(10)', name: 'Country of Origin', requirement: 'Clear declaration for imported goods without misleading claims', status: 'Mandatory' },
];

const CAPABILITIES = [
  {
    id: 'CAP-01',
    icon: <BiScan className="h-6 w-6" />,
    title: 'Dual-Layer Optical Label Extraction',
    citation: 'Section 15, Legal Metrology Act 2009',
    description: 'Bilingual OCR parses Hindi and English packaging text, isolates mandatory declaration zones, and extracts numerical dimensions with bounding coordinates.',
  },
  {
    id: 'CAP-02',
    icon: <FiCpu className="h-6 w-6" />,
    title: 'Versioned Statutory Rule Engine',
    citation: 'Rules 5–11, Packaged Commodities Rules 2011',
    description: 'Evaluates extracted label declarations against versioned legal rules, automatically mapping discrepancies to specific rule sub-clauses and schedules.',
  },
  {
    id: 'CAP-03',
    icon: <FiFileText className="h-6 w-6" />,
    title: 'Admissible Evidence PDF Dossiers',
    citation: 'Section 65B, Indian Evidence Act',
    description: 'Generates cryptographically timestamped inspection dossiers containing high-resolution packaging crops, bounding boxes, and statutory citations for prosecution.',
  },
  {
    id: 'CAP-04',
    icon: <FiSearch className="h-6 w-6" />,
    title: 'E-Commerce Marketplace Cross-Audit',
    citation: 'Rule 6(1)(1B), E-Commerce Disclosures',
    description: 'Automated crawler queries online listings (Amazon, Flipkart, Blinkit) by barcode/GTIN to flag discrepancies between physical packaging and e-shelf MRP.',
  },
  {
    id: 'CAP-05',
    icon: <FiDatabase className="h-6 w-6" />,
    title: 'GTIN Repeat-Offender Registry',
    citation: 'Enforcement Risk Profiling',
    description: 'Aggregates historical inspection records by barcode to generate an objective risk score, identifying systematic non-compliance across distributor batches.',
  },
  {
    id: 'CAP-06',
    icon: <FiFile className="h-6 w-6" />,
    title: 'Statutory Notice Draft Generator',
    citation: 'Form 1 / Section 39 Compound Notices',
    description: 'Auto-populates formal show-cause notices for field officers with manufacturer details, contravened rules, and statutory compounding penalty calculations.',
  },
];

const STEPS = [
  {
    stage: '01',
    title: 'Physical Ingestion',
    subtitle: 'Field officer captures packaging',
    desc: 'Using standard mobile or desktop camera hardware, officer captures the principal display panel and subsidiary panels in natural lighting.',
  },
  {
    stage: '02',
    title: 'Automated Verification',
    subtitle: 'OCR + statutory validation',
    desc: 'System parses text bounding coordinates, validates metric declarations against Legal Metrology tolerances, and checks GTIN authenticity.',
  },
  {
    stage: '03',
    title: 'Regulatory Action',
    subtitle: 'Notice & evidence generation',
    desc: 'Instant official verdict is produced. Officer downloads court-ready PDF evidence report or dispatches statutory Form 1 notice to manufacturer.',
  },
];

const LandingPage = () => {
  const [navPinned, setNavPinned] = useState(false);
  const [lightMode, setLightMode] = useState(false);

  React.useEffect(() => {
    const updateNavbar = () => setNavPinned(window.scrollY > 8);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });
    return () => window.removeEventListener('scroll', updateNavbar);
  }, []);

  return (
    <div data-theme={lightMode ? 'light' : 'dark'} className="landing-page font-body min-h-screen bg-[#050B14] text-gray-300 selection:bg-blue-500/30 selection:text-white relative">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* ─── Sticky Glass Navigation ─── */}
      <nav className={`${navPinned ? 'fixed top-0 left-0 right-0 nav-pin-in bg-[#0b1120]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_35px_rgba(2,6,23,0.35)]' : 'absolute top-0 left-0 right-0 bg-transparent'} z-50 w-full transition-all duration-300`}>
        <div className="max-w-7xl mx-auto min-h-20 flex flex-wrap gap-4 justify-between items-center px-4 sm:px-8 py-4">
        
        {/* Top-Left Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <FiSearch className="h-5 w-5" />
          </div>
          <span className="font-heading text-lg font-bold text-white tracking-wide">MeteroLens</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <a href="#features" className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Capabilities</a>
          <a href="#declarations" className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Declarations</a>
          <Link to="/how-it-works" className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">How it Works</Link>
        </div>

        {/* Top-Right Sign In */}
        <div className="flex-shrink-0 z-20">
          <button
            type="button"
            onClick={() => setLightMode((current) => !current)}
            className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {lightMode ? <FiMoon className="h-4 w-4" /> : <FiSun className="h-4 w-4" />}
          </button>
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-blue-600/80 hover:bg-blue-500 transition-colors px-3 py-1.5 rounded-lg border border-blue-500/30"
          >
            <FiShield className="h-3.5 w-3.5" />
            <span>Login / Sign-in</span>
          </Link>
        </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative z-10 pt-28 pb-24 lg:pt-32 lg:pb-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column */}
            <div className="flex flex-col items-start space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[11px] font-mono text-blue-300 uppercase tracking-wider backdrop-blur-sm">
                <FiShield className="h-3 w-3" />
                <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Digital Verification & Legal Metrology <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">Enforcement</span>
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed max-w-xl font-normal">
                Field officers and citizens scan packaging labels. MeteroLens extracts declarations via optical character recognition, executes rule-based legal audits against mandatory Indian statutes, and generates court-admissible evidence reports with statutory citations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                <Link
                  to="/upload"
                  className="group relative inline-flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                >
                  <span>Launch Inspector Scan</span>
                  <FiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/report"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/10 rounded-lg backdrop-blur-sm transition-all duration-300"
                >
                  <FiAlertTriangle className="h-4 w-4 text-blue-400" />
                  <span>Submit Citizen Violation Report</span>
                </Link>
              </div>

            </div>

            {/* Right Column: Glassmorphism Docket */}
            <div className="relative w-full">
              {/* Decorative background glow behind the card */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-950/30 rounded-2xl blur-xl transform scale-95" />
              
              <div className="inspection-docket relative bg-[#0B1324]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-white/5 border-b border-white/10 px-5 py-4 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-gray-400 block mb-1">INSPECTION DOCKET</span>
                    <span className="text-sm font-mono font-bold text-white">RECORD #2026-IN-4821</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono tracking-widest text-gray-400 block mb-1">GTIN BARCODE</span>
                    <span className="text-sm font-mono font-bold text-blue-400">8901030887412</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      <span className="text-sm font-bold text-white tracking-wide">Packaged Commodity: Fortified Wheat Flour</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-1 rounded">BATCH: B-409/26</span>
                  </div>

                  <div className="inspection-docket-canvas relative h-48 bg-[#111A2C] border border-white/5 rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-4">
                    <div className="absolute top-4 left-4 border border-blue-500/50 bg-blue-500/10 backdrop-blur-sm px-3 py-1.5 text-blue-300 text-xs font-mono rounded">
                      [x:42, y:18] MRP ₹ 245.00
                    </div>
                    <div className="absolute top-16 right-4 border border-blue-500/50 bg-blue-500/10 backdrop-blur-sm px-3 py-1.5 text-blue-400 text-xs font-mono rounded">
                      [x:180, y:72] Net Qty: 5 kg
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 border border-red-500 bg-red-500/10 backdrop-blur-sm p-2 text-red-400 text-xs font-mono rounded flex justify-between items-center">
                      <span>[VIOLATION] Mfg: M/s Royal Milling, Plot 14</span>
                      <span className="bg-red-500 text-white px-1.5 py-0.5 text-[9px] uppercase rounded-sm">Pin Missing</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 block mb-1">INSPECTION DETERMINATION</span>
                      <span className="text-sm font-semibold text-white">Rule 5(1)(a) Breach Detected</span>
                    </div>
                    <div className="px-4 py-1.5 border border-red-500 bg-red-500/10 text-red-500 text-xs font-mono font-bold tracking-widest rounded shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      NON-COMPLIANT
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border-t border-white/10 px-5 py-4 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-mono">Dossier Hash: 9f8a2...c41</span>
                  <Link to="/upload" className="font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-colors">
                    <span>Test Full OCR Verification</span>
                    <FiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          <div className="verification-band mt-16 pt-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-4">
            National Enforcement Verification Parameters
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '8 / 8', label: 'Mandatory Declarations' },
              { value: 'Dual', label: 'OCR + Rule Engine' },
              { value: 'Sec 39', label: 'Form 1 Notice Ready' },
              { value: '< 3.2s', label: 'Field Audit Latency' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm flex flex-col items-center text-center justify-center">
                <p className="font-mono text-xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* ─── Enforcement Capabilities ─── */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-semibold mb-3">
              Statutory Capabilities & Inspection Tooling
            </h2>
            <h3 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
              Engineered for Regulatory Authorities
            </h3>
            <p className="text-gray-400 text-lg">
              Every capability is calibrated to produce unambiguous legal findings backed by photographic evidence and statutory citations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap) => (
              <div key={cap.id} className="group p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)]">
                <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                  {cap.icon}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-blue-300">{cap.id}</span>
                  <span className="text-[9px] font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">VERIFIED</span>
                </div>
                <h4 className="font-body text-xl font-medium text-white mb-2">{cap.title}</h4>
                <p className="text-xs font-mono text-gray-500 mb-4">{cap.citation}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mandatory Statutory Declarations Register ─── */}
      <section id="declarations" className="py-24 relative z-10 bg-[#03070E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-semibold mb-2">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
                Mandatory Declarations Register
              </h2>
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              Every packaged commodity distributed in Indian commerce must satisfy each statutory declaration. Failure constitutes an offence under Section 39.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-white/5 text-gray-300 font-mono text-xs">
                    <th className="py-4 px-6 font-semibold w-40">STATUTORY RULE</th>
                    <th className="py-4 px-6 font-semibold w-72">MANDATORY DECLARATION</th>
                    <th className="py-4 px-6 font-semibold">STATUTORY SPECIFICATION</th>
                    <th className="py-4 px-6 font-semibold text-right">AUDIT STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {MANDATORY_RULES.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors text-gray-400 group">
                      <td className="py-4 px-6 font-mono text-blue-300 font-medium bg-white/5 group-hover:bg-transparent transition-colors">
                        {item.rule}
                      </td>
                      <td className="py-4 px-6 text-white font-medium">
                        {item.name}
                      </td>
                      <td className="py-4 px-6">
                        {item.requirement}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full">
                          <FiCheck className="h-3 w-3" />
                          ENFORCED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Procedural Enforcement Workflow ─── */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-semibold mb-3">
              Standard Operating Procedure
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              Field Enforcement Workflow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 z-0" />
            
            {STEPS.map((s, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center p-8 bg-[#0B1324] border border-white/10 rounded-2xl shadow-xl hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl font-mono font-bold text-blue-400 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  {s.stage}
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs font-mono text-blue-300 mb-4 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{s.subtitle}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Official Digital Service Footer ─── */}
      <footer id="footer" className="relative z-10 bg-[#02050A] text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400">
                  <FiSearch className="h-5 w-5" />
                </div>
                <span className="font-heading text-2xl font-bold text-white tracking-wide">MeteroLens</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                An authoritative digital compliance and enforcement platform for Indian Legal Metrology regulations. Developed for Smart India Hackathon 2026.
              </p>
              <a href="https://github.com/Abhinav5656U/MeteroLens" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <FiGithub className="h-4 w-4" />
                Abhinav5656U/MeteroLens
              </a>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-white font-bold mb-6">
                Operational Portals
              </p>
              <ul className="space-y-4 font-mono text-xs">
                <li><Link to="/upload" className="hover:text-blue-400 transition-colors flex items-center gap-2"><FiArrowRight className="h-3 w-3"/> Inspect Product</Link></li>
                <li><Link to="/report" className="hover:text-blue-400 transition-colors flex items-center gap-2"><FiArrowRight className="h-3 w-3"/> Citizen Reporting</Link></li>
                <li><Link to="/how-it-works" className="hover:text-blue-400 transition-colors flex items-center gap-2"><FiArrowRight className="h-3 w-3"/> Statutory Rules</Link></li>
                <li><Link to="/login" className="hover:text-blue-400 transition-colors flex items-center gap-2"><FiArrowRight className="h-3 w-3"/> Officer Login</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-white font-bold mb-6">
                Legal & References
              </p>
              <ul className="space-y-4 font-mono text-xs">
                <li><a href="https://consumeraffairs.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2"><FiExternalLink className="h-3 w-3"/> Ministry of Consumer Affairs</a></li>
                <li><a href="https://github.com/Abhinav5656U/MeteroLens#readme" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2"><FiBook className="h-3 w-3"/> System Documentation</a></li>
                <li><a href="mailto:team@meterolens.in" className="hover:text-blue-400 transition-colors flex items-center gap-2"><FiMail className="h-3 w-3"/> Technical Support Desk</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-600 gap-4 text-center sm:text-left">
            <p>MeteroLens &middot; Legal Metrology Digital Enforcement Framework</p>
            <p>Smart India Hackathon 2026 &middot; PS26034 &middot; Gov of India</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
