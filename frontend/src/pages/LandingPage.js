import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiUpload, FiFileText, FiShield,
  FiArrowRight, FiCheck, FiX, FiAlertTriangle,
  FiExternalLink, FiBook, FiGithub, FiMail
} from 'react-icons/fi';

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
    title: 'Dual-Layer Optical Label Extraction',
    citation: 'Section 15, Legal Metrology Act 2009',
    description: 'Bilingual OCR parses Hindi and English packaging text, isolates mandatory declaration zones, and extracts numerical dimensions with bounding coordinates.',
  },
  {
    id: 'CAP-02',
    title: 'Versioned Statutory Rule Engine',
    citation: 'Rules 5–11, Packaged Commodities Rules 2011',
    description: 'Evaluates extracted label declarations against versioned legal rules, automatically mapping discrepancies to specific rule sub-clauses and schedules.',
  },
  {
    id: 'CAP-03',
    title: 'Admissible Evidence PDF Dossiers',
    citation: 'Section 65B, Indian Evidence Act',
    description: 'Generates cryptographically timestamped inspection dossiers containing high-resolution packaging crops, bounding boxes, and statutory citations for prosecution.',
  },
  {
    id: 'CAP-04',
    title: 'E-Commerce Marketplace Cross-Audit',
    citation: 'Rule 6(1)(1B), E-Commerce Disclosures',
    description: 'Automated crawler queries online listings (Amazon, Flipkart, Blinkit) by barcode/GTIN to flag discrepancies between physical packaging and e-shelf MRP.',
  },
  {
    id: 'CAP-05',
    title: 'GTIN Repeat-Offender Registry',
    citation: 'Enforcement Risk Profiling',
    description: 'Aggregates historical inspection records by barcode to generate an objective risk score, identifying systematic non-compliance across distributor batches.',
  },
  {
    id: 'CAP-06',
    title: 'Statutory Notice Draft Generator',
    citation: 'Form 1 / Section 39 Compound Notices',
    description: 'Auto-populates formal show-cause notices for field officers with manufacturer details, contravened rules, and statutory compounding penalty calculations.',
  },
];

const STEPS = [
  {
    stage: 'Stage 01',
    title: 'Physical Ingestion',
    subtitle: 'Field officer captures packaging',
    desc: 'Using standard mobile or desktop camera hardware, officer captures the principal display panel and subsidiary panels in natural lighting.',
  },
  {
    stage: 'Stage 02',
    title: 'Automated Verification',
    subtitle: 'OCR + statutory validation',
    desc: 'System parses text bounding coordinates, validates metric declarations against Legal Metrology tolerances, and checks GTIN authenticity.',
  },
  {
    stage: 'Stage 03',
    title: 'Regulatory Action',
    subtitle: 'Notice & evidence generation',
    desc: 'Instant official verdict is produced. Officer downloads court-ready PDF evidence report or dispatches statutory Form 1 notice to manufacturer.',
  },
];

const LandingPage = () => {
  return (
    <div className="font-body min-h-screen bg-paper text-ink selection:bg-seal selection:text-white">
      {/* ─── Top Statutory Authority Banner ─── */}
      <div className="bg-[#0B1323] text-[#D8D3C7] border-b border-[#1E2E4E] text-[11px] font-mono tracking-wider py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-seal inline-block" />
            <span className="font-semibold text-white">MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION</span>
            <span className="text-[#687790] hidden sm:inline">&middot;</span>
            <span className="text-[#A2B1C6] hidden sm:inline">LEGAL METROLOGY DIVISION</span>
          </div>
          <div className="text-[10px] font-mono text-seal tracking-widest uppercase">
            Statutory Digital Enforcement Platform
          </div>
        </div>
      </div>

      {/* ─── Hero Section (Asymmetric, Ledger Inspired) ─── */}
      <section className="border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* Left Column: Authoritative Framing & Real Data Row */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-white border border-line rounded-xs text-[11px] font-mono text-navy uppercase tracking-wider mb-6">
                  <span className="w-2 h-2 bg-navy inline-block" />
                  <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-[1.15] tracking-tight">
                  Digital Verification & Legal Metrology Enforcement for Packaged Commodities.
                </h1>

                <p className="mt-5 text-base sm:text-lg text-[#333333] leading-relaxed max-w-2xl font-normal">
                  Field officers and citizens scan packaging labels. MeteroLens extracts declarations via optical character recognition, executes rule-based legal audits against mandatory Indian statutes, and generates court-admissible evidence reports with statutory citations.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <Link
                    to="/upload"
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-seal hover:bg-seal-hover text-white text-sm font-semibold rounded-xs transition-colors shadow-xs"
                  >
                    <span>Launch Inspector Scan</span>
                    <FiArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/report"
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white hover:bg-[#EFECE3] text-navy text-sm font-semibold border border-line rounded-xs transition-colors"
                  >
                    <FiAlertTriangle className="h-4 w-4 text-seal" />
                    <span>Submit Citizen Violation Report</span>
                  </Link>

                  <Link
                    to="/how-it-works"
                    className="inline-flex items-center justify-center space-x-1.5 px-4 py-3 text-xs font-semibold text-[#555] hover:text-navy transition-colors"
                  >
                    <span>Statutory Methodology</span>
                    <FiExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Real Data Row (Not Floating Stat Cards, but an Official Ledger Register) */}
              <div className="mt-12 pt-8 border-t border-line">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#666] mb-3">
                  National Enforcement Verification Parameters
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-line bg-white divide-x divide-y sm:divide-y-0 divide-line">
                  <div className="p-3.5">
                    <p className="font-mono text-2xl font-bold text-navy">8 / 8</p>
                    <p className="text-xs text-[#555] mt-1 leading-snug">Mandatory Declarations Audited</p>
                  </div>
                  <div className="p-3.5">
                    <p className="font-mono text-2xl font-bold text-navy">Dual</p>
                    <p className="text-xs text-[#555] mt-1 leading-snug">OCR + Statutory Rule Engine</p>
                  </div>
                  <div className="p-3.5">
                    <p className="font-mono text-2xl font-bold text-navy">Sec 39</p>
                    <p className="text-xs text-[#555] mt-1 leading-snug">Form 1 Notice Ready Export</p>
                  </div>
                  <div className="p-3.5">
                    <p className="font-mono text-2xl font-bold text-navy">&lt; 3.2s</p>
                    <p className="text-xs text-[#555] mt-1 leading-snug">Average Field Audit Latency</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actual Inspection Evidence Sheet & Stamped Verdict */}
            <div className="lg:col-span-5">
              <div className="bg-white border-2 border-line shadow-ledger rounded-xs overflow-hidden">
                {/* Docket Header */}
                <div className="bg-[#14213D] text-white px-4 py-3 border-b border-[#25375A] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-[#8EA0BE] block">
                      Inspection Docket
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      RECORD #2026-IN-4821
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#8EA0BE] block">GTIN BARCODE</span>
                    <span className="text-xs font-mono text-seal font-semibold">8901030887412</span>
                  </div>
                </div>

                {/* Packaging Scan Visual with Hairline Calipers */}
                <div className="p-4 border-b border-line bg-[#FAF9F5]">
                  <div className="relative border border-line bg-white p-3">
                    <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-success inline-block" />
                        <span className="text-xs font-bold font-heading text-ink">Packaged Commodity: Fortified Wheat Flour</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#777]">BATCH: B-409/26</span>
                    </div>

                    {/* Caliper Bounding Box Region */}
                    <div className="relative bg-[#ECE8DC] border border-[#CFC9BA] h-40 flex flex-col justify-between p-2 font-mono text-[10px] overflow-hidden">
                      {/* Bounding Box 1: MRP */}
                      <div className="absolute top-3 left-4 border border-success bg-success-50/80 px-2 py-1 text-success-700 font-semibold shadow-xs">
                        <span>[x:42, y:18] MRP ₹ 245.00 (INCL. TAXES)</span>
                      </div>

                      {/* Bounding Box 2: Net Qty */}
                      <div className="absolute top-12 right-4 border border-navy bg-navy-50/80 px-2 py-1 text-navy-800 font-semibold shadow-xs">
                        <span>[x:180, y:72] Net Qty: 5 kg</span>
                      </div>

                      {/* Bounding Box 3: Mfg Address (Defective) */}
                      <div className="absolute bottom-3 left-4 right-4 border-2 border-dashed border-danger bg-danger-50/90 p-1.5 text-danger font-semibold">
                        <div className="flex items-center justify-between">
                          <span>[VIOLATION] Mfg: M/s Royal Milling, Plot 14</span>
                          <span className="text-[9px] bg-danger text-white px-1 py-0.2 uppercase">Pin Missing</span>
                        </div>
                      </div>
                    </div>

                    {/* Single Deliberate Motion: Official Stamped Verdict */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-line">
                      <div>
                        <span className="text-[10px] font-mono text-[#666] block">INSPECTION DETERMINATION</span>
                        <span className="text-xs font-semibold text-ink">Rule 5(1)(a) Breach Detected</span>
                      </div>
                      <div className="stamp-verdict border-2 border-danger px-3 py-1 bg-danger-50 text-danger text-xs font-mono font-bold uppercase tracking-wider shadow-stamp">
                        NON-COMPLIANT
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Check Register (Ledger Format) */}
                <div className="p-0">
                  <div className="bg-[#EFECE3] px-4 py-2 border-b border-line flex items-center justify-between text-[11px] font-mono font-semibold text-navy">
                    <span>STATUTORY CLAUSE</span>
                    <span>AUDIT STATUS</span>
                  </div>

                  <div className="divide-y divide-line text-xs font-mono">
                    <div className="px-4 py-2.5 flex items-center justify-between bg-white">
                      <div>
                        <span className="font-semibold text-ink block font-sans">Rule 6(1)(e) — Maximum Retail Price</span>
                        <span className="text-[11px] text-[#666]">₹ 245.00 declared with ₹ 49.00/kg unit sale price</span>
                      </div>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-success-50 text-success border border-success/30 font-bold text-[10px]">
                        <FiCheck className="h-3 w-3" />
                        <span>PASS</span>
                      </span>
                    </div>

                    <div className="px-4 py-2.5 flex items-center justify-between bg-[#FCEDE8]">
                      <div>
                        <span className="font-semibold text-danger block font-sans">Rule 5(1)(a) — Complete Manufacturer Address</span>
                        <span className="text-[11px] text-danger/80">Missing postal PIN code and registered state jurisdiction</span>
                      </div>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-danger text-white font-bold text-[10px]">
                        <FiX className="h-3 w-3" />
                        <span>FAIL</span>
                      </span>
                    </div>

                    <div className="px-4 py-2.5 flex items-center justify-between bg-white">
                      <div>
                        <span className="font-semibold text-ink block font-sans">Rule 7(1) — Standard Net Quantity</span>
                        <span className="text-[11px] text-[#666]">5 kg permissible under Schedule II standard packs</span>
                      </div>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-success-50 text-success border border-success/30 font-bold text-[10px]">
                        <FiCheck className="h-3 w-3" />
                        <span>PASS</span>
                      </span>
                    </div>

                    <div className="px-4 py-2.5 flex items-center justify-between bg-[#FDF9F0]">
                      <div>
                        <span className="font-semibold text-seal block font-sans">Rule 6(1)(f) — Consumer Grievance Contact</span>
                        <span className="text-[11px] text-[#705106]">Contact person name missing; helpline phone present</span>
                      </div>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FAF1DD] text-seal border border-seal/30 font-bold text-[10px]">
                        <FiAlertTriangle className="h-3 w-3" />
                        <span>REVIEW</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dossier Action Footer */}
                <div className="bg-[#FAF9F5] px-4 py-3 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-[#666] font-mono text-[11px]">Dossier Hash: 9f8a2...c41</span>
                  <Link
                    to="/upload"
                    className="font-semibold text-navy hover:text-seal flex items-center space-x-1"
                  >
                    <span>Test Full OCR Verification</span>
                    <FiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Mandatory Statutory Declarations Register (Ledger View) ─── */}
      <section className="py-16 border-b border-line bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-line">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-seal font-semibold">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy mt-1">
                Mandatory Packaging Declarations Register
              </h2>
            </div>
            <p className="text-xs font-mono text-[#666] mt-2 md:mt-0 max-w-md">
              Every packaged commodity distributed in Indian commerce must satisfy each statutory declaration. Failure constitutes an offence under Section 39.
            </p>
          </div>

          <div className="overflow-x-auto border border-line">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EFECE3] text-navy font-mono text-[11px] border-b border-line">
                  <th className="py-3 px-4 font-bold w-36">STATUTORY RULE</th>
                  <th className="py-3 px-4 font-bold w-64">MANDATORY DECLARATION</th>
                  <th className="py-3 px-4 font-bold">STATUTORY SPECIFICATION & TOLERANCE</th>
                  <th className="py-3 px-4 font-bold w-32 text-right">AUDIT STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-sans">
                {MANDATORY_RULES.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-navy bg-paper/50">
                      {item.rule}
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-[#444]">
                      {item.requirement}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#EDF5F1] text-success border border-success/30 rounded-none">
                        ENFORCED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── Enforcement Capabilities (Official Register Grid) ─── */}
      <section id="features" className="py-16 border-b border-line bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-seal font-semibold">
              Statutory Capabilities & Inspection Tooling
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy mt-1">
              Engineered for Field Officers and Regulatory Authorities
            </h2>
            <p className="text-sm text-[#555] mt-2">
              Every capability is calibrated to produce unambiguous legal findings backed by photographic evidence and statutory citations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-line bg-white divide-y md:divide-y-0 md:divide-x divide-line">
            {CAPABILITIES.map((cap, i) => (
              <div
                key={cap.id}
                className={`p-6 flex flex-col justify-between ${
                  i >= 3 ? 'lg:border-t lg:border-line' : ''
                } hover:bg-[#FAF9F5] transition-colors`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-seal">{cap.id}</span>
                    <span className="text-[10px] font-mono text-[#777] bg-paper px-1.5 py-0.5 border border-line">
                      VERIFIED
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-navy mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-xs font-mono text-[#666] mb-3 pb-2 border-b border-line">
                    {cap.citation}
                  </p>
                  <p className="text-xs text-[#444] leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Procedural Enforcement Workflow (GOV.UK Step Sequence) ─── */}
      <section className="py-16 border-b border-line bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-mono uppercase tracking-wider text-seal font-semibold">
              Standard Operating Procedure
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy mt-1">
              Field Enforcement Workflow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-line divide-y md:divide-y-0 md:divide-x divide-line">
            {STEPS.map((s, idx) => (
              <div key={idx} className="p-6 bg-paper/30">
                <span className="text-[11px] font-mono font-bold text-navy px-2 py-0.5 bg-[#EFECE3] border border-line inline-block mb-4">
                  {s.stage}
                </span>
                <h3 className="font-heading text-xl font-bold text-navy mb-1">{s.title}</h3>
                <p className="text-xs font-mono text-seal font-medium mb-3">{s.subtitle}</p>
                <p className="text-xs text-[#555] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Statutory Mandate & Legal Authority Notice ─── */}
      <section className="py-14 border-b border-line bg-[#EFECE3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border border-line bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start gap-6">
            <div className="h-12 w-12 rounded-none bg-navy flex items-center justify-center flex-shrink-0 text-seal">
              <FiShield className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-navy">
                Statutory Authority & Evidentiary Standard
              </h3>
              <p className="text-xs text-[#444] leading-relaxed">
                MeteroLens operates in conformity with the Legal Metrology Act, 2009 (Act No. 1 of 2010) and the Legal Metrology (Packaged Commodities) Rules, 2011. Evidence reports generated by this platform incorporate automated timestamping, SHA-256 packaging digest hashes, and section-wise rule citations suitable for preliminary inquiry and notice drafting under Section 18 and Section 39.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-[11px] font-mono text-navy font-semibold">
                <span>&bull; Smart India Hackathon 2026</span>
                <span>&bull; Ministry of Consumer Affairs Problem PS26034</span>
                <span>&bull; Open Source Enforcement Tooling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Official Digital Service Footer ─── */}
      <footer id="footer" className="bg-[#0B1323] text-[#C5D0E0] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#1E2E4E]">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 bg-[#1D2E52] border border-[#374B73] flex items-center justify-center text-seal font-bold text-xs">
                  ML
                </div>
                <span className="font-heading text-lg font-bold text-white tracking-wide">MeteroLens</span>
              </div>
              <p className="text-xs text-[#8EA0BE] leading-relaxed max-w-md">
                An authoritative digital compliance and enforcement platform for Indian Legal Metrology regulations. Developed for Smart India Hackathon 2026 under Problem Statement PS26034.
              </p>
              <p className="text-[11px] font-mono text-[#687790]">
                Repository: github.com/Abhinav5656U/MeteroLens
              </p>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-white font-bold mb-3">
                Operational Portals
              </p>
              <ul className="space-y-2 font-mono text-[11px]">
                <li>
                  <Link to="/upload" className="text-[#8EA0BE] hover:text-white transition-colors">
                    &rarr; Field Packaging Scan
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="text-[#8EA0BE] hover:text-white transition-colors">
                    &rarr; Citizen Violation Reporting
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-[#8EA0BE] hover:text-white transition-colors">
                    &rarr; Statutory Rule Specifications
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-[#8EA0BE] hover:text-white transition-colors">
                    &rarr; Officer Credential Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-white font-bold mb-3">
                Legal & References
              </p>
              <ul className="space-y-2 font-mono text-[11px]">
                <li>
                  <a
                    href="https://consumeraffairs.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8EA0BE] hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Ministry of Consumer Affairs</span>
                    <FiExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Abhinav5656U/MeteroLens#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8EA0BE] hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>System Documentation</span>
                    <FiBook className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:team@meterolens.in"
                    className="text-[#8EA0BE] hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Technical Support Desk</span>
                    <FiMail className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#687790] gap-2">
            <p>MeteroLens &middot; Legal Metrology Digital Enforcement Framework</p>
            <p>Smart India Hackathon 2026 &middot; PS26034 &middot; Government of India</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
