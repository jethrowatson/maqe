'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Search,
  MessageSquare,
  FileText,
  ChevronRight,
  TrendingUp,
  Cpu,
  Coins,
  MapPin,
  ExternalLink,
  Zap,
  Globe2,
  Network,
  ShieldAlert,
  Sliders,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Factory,
  Wrench,
  Truck,
  Boxes,
  Radio,
  BarChart3
} from 'lucide-react';
import { COMMERCIAL_PLANS } from '../lib/engines/commerce';
import { FIXTURE_COMPANIES, FIXTURE_PROFILES } from '../lib/fixtures/cohort';

interface BrochureViewProps {
  onGoToLogin: (role?: 'member' | 'operator') => void;
  cloudConnected: boolean;
}

export function BrochureView({ onGoToLogin, cloudConnected }: BrochureViewProps) {
  // Navigation & Interactive states
  const [matchingDirection, setMatchingDirection] = useState<'customer' | 'supplier'>('customer');
  const [activePipelineStep, setActivePipelineStep] = useState<number>(1);
  const [activeDimension, setActiveDimension] = useState<'provides' | 'uses' | 'serves' | 'likely_needs' | 'relationships'>('provides');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockedCandidate, setUnlockedCandidate] = useState<string | null>(null);
  const [simulatedCredits, setSimulatedCredits] = useState<number>(20);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Filter cohort companies based on search
  const filteredSearchCompanies = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return FIXTURE_COMPANIES.filter(c => 
      c.legal_name.toLowerCase().includes(q) ||
      c.sic_codes.some(s => s.toLowerCase().includes(q)) ||
      c.addresses.locality?.toLowerCase().includes(q) ||
      c.addresses.registered?.toLowerCase().includes(q) ||
      c.company_id.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [searchQuery]);

  const handleSimulateUnlock = (candidateId: string) => {
    if (unlockedCandidate === candidateId) return;
    if (simulatedCredits > 0) {
      setSimulatedCredits(prev => prev - 1);
      setUnlockedCandidate(candidateId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* ---------------------------------------------------- */}
      {/* 1. TOP NAVIGATION                                    */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-cyan-300 text-xl">
                  M
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight text-white">MAQE</span>
                  <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    v1.1 Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Engineering Intelligence Platform
                </p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-slate-300">
              <a href="#pipeline" className="hover:text-blue-400 transition-colors">Platform Pipeline</a>
              <a href="#dimensions" className="hover:text-blue-400 transition-colors">5D Super-Database</a>
              <a href="#matching-terminal" className="hover:text-blue-400 transition-colors">AI Match Engine</a>
              <a href="#blind-rfq" className="hover:text-blue-400 transition-colors">Blind RFQ</a>
              <a href="#membership" className="hover:text-blue-400 transition-colors">Plans & Credits</a>
              <a href="#faq" className="hover:text-blue-400 transition-colors">Architecture & FAQ</a>
            </nav>

            {/* Auth Actions & Cloud Indicator */}
            <div className="flex items-center space-x-3.5">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs">
                <span className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="text-[11px] font-mono text-slate-300">
                  {cloudConnected ? 'Cloud MariaDB Live' : 'Database Ready'}
                </span>
              </div>

              <button
                onClick={() => onGoToLogin('operator')}
                className="hidden md:inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Operator Console
              </button>

              <button
                onClick={() => onGoToLogin('member')}
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all shadow-md shadow-blue-600/30"
              >
                Sign In / Access
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. HERO SECTION WITH LIVE INTERACTIVE TERMINAL       */}
      {/* ---------------------------------------------------- */}
      <section className="relative overflow-hidden py-8 sm:py-10 lg:py-14 border-b border-slate-800/80 radial-mesh">
        {/* Subtle decorative background grids */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-semibold mb-3 sm:mb-4">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Statutory Ingest • Zero Manual Input • Dual-Direction AI Matching</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-white text-balance">
                The UK Engineering Intelligence Platform.
              </h1>

              {/* Sub-headline */}
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl text-pretty">
                Turn statutory filings and verified web discovery into a structured engineering super-database. Match capability to industrial demand in both directions — <strong className="text-white font-semibold">without asking companies to manually fill out profiles</strong>.
              </p>

              {/* Interactive Search Bar directly in Hero */}
              <div className="mt-5 p-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl max-w-xl">
                <div className="flex items-center px-3 py-1.5 sm:py-2 bg-slate-950/60 rounded-xl border border-slate-800 focus-within:border-blue-500 transition-colors">
                  <Search className="w-4 h-4 text-blue-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 600,000 UK engineering companies, SIC codes, or processes..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-white px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Instant Search Suggestions / Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 px-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-500">Try quick lookups:</span>
                  {['Delta Metalworks', 'Apex Steel', 'Laser Cutting', 'Automotive Blanks', 'Server Cabinets'].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => setSearchQuery(sample)}
                      className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-blue-900/50 hover:text-blue-300 border border-slate-700/60 text-slate-300 transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                {/* Dropdown Live Results if query entered */}
                {filteredSearchCompanies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                      Matched Statutory Entities ({filteredSearchCompanies.length})
                    </div>
                    {filteredSearchCompanies.map((c) => (
                      <div
                        key={c.company_id}
                        onClick={() => onGoToLogin('member')}
                        className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{c.legal_name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-blue-400">#{c.registration_number}</span>
                            <span>•</span>
                            <span>{c.addresses.locality || c.addresses.postal_code || 'UK'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">SIC: {c.sic_codes[0]}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-400 flex items-center">
                          View Profile <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onGoToLogin('member')}
                  className="px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center"
                >
                  Enter Member Platform
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
                <button
                  onClick={() => onGoToLogin('operator')}
                  className="px-5 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-400" />
                  Launch Operator Console
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-y-1.5 gap-x-5 text-[11px] sm:text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Companies House Direct API</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deterministic Zero-Hallucination Scoring</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permanent Non-Double-Charge Ledger</span>
                </div>
              </div>
            </div>

            {/* Right Hero: Floating Live Terminal Preview (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 shadow-2xl glow-card relative">
                {/* Header of terminal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    <span className="text-[11px] font-mono text-slate-400 ml-1.5">MAQE Live Radar v1.1</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-blue-950/60 border border-blue-500/40 rounded text-[10px] font-mono text-blue-300">
                    <Radio className="w-3 h-3 animate-pulse text-blue-400" />
                    <span>Real-Time Engine</span>
                  </div>
                </div>

                {/* Target Company Focus */}
                <div className="mt-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Evaluated Member Node:</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5">Delta Metalworks Ltd</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">Sheffield • SIC 25110</div>
                      <div className="text-[11px] font-bold text-emerald-400">98% Verified Profile</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50 font-medium">
                      Laser Cutting (10kW)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50 font-medium">
                      CNC Bending
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      ISO 9001:2015
                    </span>
                  </div>
                </div>

                {/* Direction Switcher */}
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setMatchingDirection('customer')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center text-xs ${
                      matchingDirection === 'customer'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Customer Leads
                  </button>
                  <button
                    onClick={() => setMatchingDirection('supplier')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center text-xs ${
                      matchingDirection === 'supplier'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Supplier Matches
                  </button>
                </div>

                {/* Live Edge Results */}
                <div className="mt-2.5 space-y-2">
                  {matchingDirection === 'customer' ? (
                    <>
                      {/* Lead 1 */}
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Apex Enclosures Ltd</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              95% Match
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            High sheet metal chassis consumption for server racks
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                          #1
                        </div>
                      </div>

                      {/* Lead 2 */}
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Vanguard Auto Components</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              89% Match
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Automotive chassis brackets (repeat OEM contract)
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                          #2
                        </div>
                      </div>

                      {/* Strict Exclusion Notice */}
                      <div className="p-2 bg-red-950/30 rounded-xl border border-red-800/50 flex items-center space-x-2 text-[11px] text-red-300">
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                          <strong className="text-red-200">Competitor Excluded:</strong> Vortex Sheet Metal (SIC 25110) filtered out.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Supplier 1 */}
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Apex Steel & Alloys Ltd</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              96% Match
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Raw mild steel coil & plate stockholder (Scunthorpe)
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                          #1
                        </div>
                      </div>

                      {/* Supplier 2 */}
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Precision Press & Tooling</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              88% Match
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Press brake dies & laser consumables (Birmingham)
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                          #2
                        </div>
                      </div>

                      {/* Haulage match */}
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Titan Freight Logistics</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              84% Match
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Articulated flatbed transport for palletized metal
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                          #3
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer of terminal card */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center">
                    <Coins className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                    Simulated Wallet: <strong>{simulatedCredits} Credits</strong>
                  </span>
                  <button
                    onClick={() => onGoToLogin('member')}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center"
                  >
                    Open Live Terminal <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. KEY METRICS STAT BAR                              */}
      {/* ---------------------------------------------------- */}
      <section className="bg-slate-900 border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center sm:text-left">
            <div className="border-l-2 border-blue-500 pl-4">
              <div className="text-3xl font-black text-white">600,000+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">UK Engineering Entities Ingested</div>
            </div>
            <div className="border-l-2 border-indigo-500 pl-4">
              <div className="text-3xl font-black text-white">5 Dimensions</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Structured Capability Schema</div>
            </div>
            <div className="border-l-2 border-cyan-500 pl-4">
              <div className="text-3xl font-black text-white">Dual-Direction</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Customer & Supplier Matching</div>
            </div>
            <div className="border-l-2 border-emerald-500 pl-4">
              <div className="text-3xl font-black text-white">Permanent</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Non-Double-Charge Ledger Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. PLATFORM PIPELINE (C01 -> C05)                   */}
      {/* ---------------------------------------------------- */}
      <section id="pipeline" className="py-24 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Automated Data Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              From Statutory Filings to Explainable Matches.
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed text-pretty">
              MAQE continuously harmonizes statutory records, verified web discovery, and deterministic rule algorithms. Zero manual user form filling is required to generate commercial intelligence.
            </p>
          </div>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                step: 1,
                id: 'c01',
                title: '01. Statutory Ingestion',
                subtitle: 'Companies House API',
                desc: 'Automated ingestion of official records, SIC classifications, directors, and registered addresses.'
              },
              {
                step: 2,
                id: 'c02',
                title: '02. Discovery & Hashes',
                subtitle: 'Cryptographic Ground-Truth',
                desc: 'Multi-source web discovery with SHA-256 evidence hashing for strict auditability.'
              },
              {
                step: 3,
                id: 'c03',
                title: '03. AI Structured Enrichment',
                subtitle: 'Fact vs. Inference Separation',
                desc: 'Separates observed capabilities from inferred operational demand to prevent hallucinations.'
              },
              {
                step: 4,
                id: 'c05',
                title: '04. Directional Matching',
                subtitle: 'Deterministic rules_v1',
                desc: 'Mathematical scoring, explainable weight breakdowns, and automatic competitor exclusion.'
              }
            ].map((s) => (
              <div
                key={s.step}
                onClick={() => setActivePipelineStep(s.step)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  activePipelineStep === s.step
                    ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    activePipelineStep === s.step ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    Phase {s.step}
                  </span>
                  {activePipelineStep === s.step && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white">{s.title}</h3>
                <div className="text-[11px] font-semibold text-blue-400 mt-0.5">{s.subtitle}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Detailed Pipeline Stage Showcase */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl">
            {activePipelineStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Engine C01 • Statutory Intake</div>
                  <h3 className="text-2xl font-bold text-white mt-1">Direct UK Companies House Synchronizer</h3>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    MAQE connects directly to the Companies House Public Data API with partitioned backfill sweeps and daily delta syncs. Company names, numbers, incorporation dates, SIC codes (e.g. 25110, 24100, 28410), and registered offices are stored with point-in-time versioning.
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Backfill capacity target: 600,000 UK engineering records</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Daily watermark tracking with automated retry queues</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Table: <code className="text-blue-300 font-mono">maqe_companies</code> & <code className="text-blue-300 font-mono">maqe_company_identifiers</code></span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  <div className="text-slate-500 mb-2">// Sample Ingest Record (JSON)</div>
                  <pre className="text-emerald-400">{`{
  "registration_number": "08492019",
  "legal_name": "Delta Metalworks Ltd",
  "jurisdiction": "GB-ENG",
  "incorporation_date": "2013-04-18",
  "company_status": "active",
  "sic_codes": [
    { "code": "25110", "description": "Manufacture of metal structures" }
  ],
  "registered_office": {
    "city": "Sheffield",
    "postal_code": "S9 2LQ"
  }
}`}</pre>
                </div>
              </div>
            )}

            {activePipelineStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Engine C02 • Discovery & Hash Audit</div>
                  <h3 className="text-2xl font-bold text-white mt-1">Multi-Source Verification & Cryptographic Proof</h3>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Candidate sources (websites, brochures, trade directories, ISO registries) are discovered, scored for identity match confidence, and fingerprinted with SHA-256 hashes. If a counterparty modifies their public capabilities, MAQE detects the diff automatically.
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Identity match threshold: Minimum 0.70 confidence</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Ground-truth SHA-256 payload integrity check</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Table: <code className="text-blue-300 font-mono">maqe_sources</code> & <code className="text-blue-300 font-mono">maqe_evidence_records</code></span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  <div className="text-slate-500 mb-2">// SHA-256 Ground-Truth Audit Log</div>
                  <pre className="text-cyan-400">{`{
  "source_id": "src_delta_web",
  "url": "https://deltametalworks.co.uk/services",
  "http_status": 200,
  "content_hash": "sha256_e4b1a79f048d2813...",
  "identity_confidence": 0.94,
  "detected_equipment": [
    "Bystronic 10kW Fiber Laser",
    "Amada HFE 3i 1003 Press Brake"
  ],
  "last_crawled_at": "2026-10-13T08:15:00Z"
}`}</pre>
                </div>
              </div>
            )}

            {activePipelineStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Engine C03 • AI Structured Enrichment</div>
                  <h3 className="text-2xl font-bold text-white mt-1">Observed Facts vs. Inferred Commercial Needs</h3>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    MAQE strictly separates verified capabilities from probabilistic commercial demand. Observed facts carry concrete evidence citations; inferred needs are generated by deterministic manufacturing rules and marked explicitly to avoid false assertions.
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>5-Dimension Taxonomy: Provides, Uses, Serves, Likely Needs, Relationships</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Zero hallucination: Inferences cannot be cited as observed facts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Table: <code className="text-blue-300 font-mono">maqe_assertions</code> & <code className="text-blue-300 font-mono">maqe_profile_versions</code></span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  <div className="text-slate-500 mb-2">// Inferred Need Assertion Breakdown</div>
                  <pre className="text-amber-400">{`{
  "assertion_id": "ast_haulage_infer",
  "subject_entity": "demo_delta",
  "assertion_type": "inferred_need",
  "predicate": "requires_freight_logistics",
  "confidence": 0.85,
  "rationale": "High-volume sheet fabrication generates palletized steel outputs requiring articulated flatbed haulage.",
  "status": "active",
  "verified_by_operator": true
}`}</pre>
                </div>
              </div>
            )}

            {activePipelineStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Engine C05 • Directional Matching</div>
                  <h3 className="text-2xl font-bold text-white mt-1">Mathematical Scoring & Competitor Exclusion</h3>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Evaluates candidate counterparty pairs through the deterministic <code className="text-blue-400 font-mono">rules_v1</code> baseline. Direct competitors with overlapping outputs are strictly blocked from customer recommendations, protecting client commercial advantages.
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Decomposed components: Capability Fit (50%), Geo (20%), Cert (15%), Recency (15%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Competitor exclusion invariant: Prevents intra-trade leakage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Table: <code className="text-blue-300 font-mono">maqe_match_edges</code> & <code className="text-blue-300 font-mono">maqe_match_assessments</code></span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  <div className="text-slate-500 mb-2">// Explainable Match Score Object</div>
                  <pre className="text-blue-400">{`{
  "focus": "Delta Metalworks Ltd",
  "counterparty": "Apex Enclosures Ltd",
  "direction": "customer",
  "final_score": 0.95,
  "score_components": {
    "capability_fit": 0.98,
    "location_haulage": 0.92,
    "certification_match": 0.95,
    "recency_confidence": 0.95
  },
  "competitor_collision": false,
  "verdict": "RECOMMENDED"
}`}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. 5-DIMENSION SUPER-DATABASE VISUALIZER            */}
      {/* ---------------------------------------------------- */}
      <section id="dimensions" className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Data Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Structured Across 5 Engineering Dimensions.
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed text-pretty">
              Every company is mapped according to its exact physical inputs, production machinery, downstream sectors, and inferred industrial supply chain relationships.
            </p>
          </div>

          {/* Interactive Dimension Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { id: 'provides', label: '1. PROVIDES', subtitle: 'Verified Capabilities', icon: Factory, color: 'text-blue-400' },
              { id: 'uses', label: '2. USES', subtitle: 'Operational Inputs', icon: Boxes, color: 'text-cyan-400' },
              { id: 'serves', label: '3. SERVES', subtitle: 'Target Markets', icon: Building2, color: 'text-emerald-400' },
              { id: 'likely_needs', label: '4. LIKELY NEEDS', subtitle: 'AI Inferred Demand', icon: Zap, color: 'text-amber-400' },
              { id: 'relationships', label: '5. RELATIONSHIPS', subtitle: 'Supply Chain Graph', icon: Network, color: 'text-purple-400' }
            ].map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDimension(d.id as any)}
                  className={`px-5 py-3 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                    activeDimension === d.id
                      ? 'bg-slate-800 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${d.color}`} />
                  <div>
                    <div className="text-xs font-bold text-white">{d.label}</div>
                    <div className="text-[10px] text-slate-400">{d.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Dimension Data Card */}
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-8 shadow-xl">
            {activeDimension === 'provides' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Observed Fact
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Fiber Laser Cutting</h4>
                  <p className="text-xs text-slate-400 mt-1">10kW Bystronic bed (3000 x 1500mm)</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Mild steel up to 25mm, stainless steel up to 20mm, aluminium plate up to 15mm with oxygen and nitrogen assist.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Observed Fact
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">CNC Press Brake Forming</h4>
                  <p className="text-xs text-slate-400 mt-1">100T 7-Axis Amada HFE 3i</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Precision multi-bend sheet metal folding, box and pan forming, robotic bend assist with ±0.2° angular accuracy.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Observed Fact
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">MIG / TIG Fabrication</h4>
                  <p className="text-xs text-slate-400 mt-1">ASME IX & ISO 9606-1 Coded</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Structural chassis welding, insert stud welding, spot welding, and weld seam dressing for finished enclosures.
                  </p>
                </div>
              </div>
            )}

            {activeDimension === 'uses' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    Raw Material Input
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Mild Steel & Plate</h4>
                  <p className="text-xs text-slate-400 mt-1">S275JR, S355JR, CR4 Coils</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Continuous requirement for mill-certified 1.5mm to 6.0mm flat sheet blanks and full coils.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    Equipment Tooling
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Press Brake Tooling</h4>
                  <p className="text-xs text-slate-400 mt-1">Hardened V-Dies & Punches</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Regular replacement and sharpening of sectional top punches, multi-V dies, and laser cutting nozzles.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    Industrial Consumables
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Cutting Gases & Abrasives</h4>
                  <p className="text-xs text-slate-400 mt-1">High-Pressure Nitrogen & Argon</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Bulk tank nitrogen storage, laser assist cutting gas, grinding discs, and finishing deburring belts.
                  </p>
                </div>
              </div>
            )}

            {activeDimension === 'serves' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Downstream Sector
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Electronics Enclosures</h4>
                  <p className="text-xs text-slate-400 mt-1">19" Rack Systems & Cabinets</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Weatherproof IP66 telecommunications cases, power distribution units, and data center server infrastructure.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Downstream Sector
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Automotive Tier-1</h4>
                  <p className="text-xs text-slate-400 mt-1">Chassis Brackets & Sub-assemblies</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Commercial vehicle mounting hardware, suspension brackets, battery containment trays, and structural gussets.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Downstream Sector
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Robotics & Machinery</h4>
                  <p className="text-xs text-slate-400 mt-1">Machine Guards & Casing</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Conveyor line covers, safety guarding frames, acoustic enclosures, and automated robotic handling cells.
                  </p>
                </div>
              </div>
            )}

            {activeDimension === 'likely_needs' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    AI Inferred Dependency
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Flatbed Haulage Transport</h4>
                  <p className="text-xs text-slate-400 mt-1">Articulated 24-Tonne Fleet</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Inferred need: Sheet metal fabricators handling 3000mm sheets produce high-cube palletized loads requiring open flatbed trucks.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    AI Inferred Dependency
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Subcontract Powder Coating</h4>
                  <p className="text-xs text-slate-400 mt-1">Qualicoat Class 1 / 2 Finishing</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Inferred need: Enclosure components require electrostatic architectural powder coating and salt spray resistance testing.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    AI Inferred Dependency
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Deburring & Edge Rounding</h4>
                  <p className="text-xs text-slate-400 mt-1">R2 Oxide Removal Belts</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Inferred need: Laser-cut parts slated for automotive assembly require strict edge rounding before robotic weld stations.
                  </p>
                </div>
              </div>
            )}

            {activeDimension === 'relationships' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                    Verified Upstream Supplier
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Apex Steel & Alloys Ltd</h4>
                  <p className="text-xs text-slate-400 mt-1">Scunthorpe • 45 miles</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Verified recurring purchase order history for certified cold rolled plate and hot rolled coil stock.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                    Verified Downstream Client
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Apex Enclosures Ltd</h4>
                  <p className="text-xs text-slate-400 mt-1">Nottingham • 38 miles</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Longstanding fabrication contract for 19" rack chassis, vented door louvers, and server cabinets.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                    Verified Logistics Partner
                  </span>
                  <h4 className="text-base font-bold text-white mt-3">Titan Freight Logistics</h4>
                  <p className="text-xs text-slate-400 mt-1">Leeds • 32 miles</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Dedicated flatbed regional haulage contract covering Yorkshire and East Midlands distribution.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 6. INTERACTIVE MATCHING TERMINAL SHOWCASE (BENCHMARK) */}
      {/* ---------------------------------------------------- */}
      <section id="matching-terminal" className="py-24 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Live Benchmark Case Study
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Dual-Direction AI Matching in Action.
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed text-pretty">
              Inspect how Delta Metalworks Ltd matches customer leads downstream while discovering upstream suppliers — including score decomposition, evidence citations, and permanent credit unlock.
            </p>
          </div>

          {/* Interactive Benchmark Terminal Box */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl">
            {/* Terminal Header & Mode Toggles */}
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                  Δ
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delta Metalworks Ltd — Intelligence Terminal</h3>
                  <div className="text-xs text-slate-400 flex items-center space-x-2">
                    <span>Ranker: <strong className="text-blue-400 font-mono">rules_v1</strong></span>
                    <span>•</span>
                    <span>Wallet Balance: <strong className="text-amber-400 font-mono">{simulatedCredits} Credits</strong></span>
                  </div>
                </div>
              </div>

              {/* Toggle Customer vs Supplier */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setMatchingDirection('customer')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    matchingDirection === 'customer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Customer Leads (Downstream)
                </button>
                <button
                  onClick={() => setMatchingDirection('supplier')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    matchingDirection === 'supplier'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Supplier Matches (Upstream)
                </button>
              </div>
            </div>

            {/* Candidates Display */}
            <div className="mt-8 space-y-4">
              {matchingDirection === 'customer' ? (
                <>
                  {/* Candidate 1: Apex Enclosures */}
                  <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-bold text-white">Apex Enclosures Ltd</span>
                          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                            Rank #1 • 95% Match
                          </span>
                          <span className="text-xs text-slate-400">Nottingham • SIC 26110</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                          Specialist in server rack enclosures and weatherproof electronic housings. Consumes high-volume 3mm mild steel sheet blanks and CNC multi-bend panels matching Delta's core laser and press brake output.
                        </p>
                        {/* Score decomposition bar */}
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                          <span>Capability Fit: <strong className="text-emerald-400">98%</strong></span>
                          <span>•</span>
                          <span>Haulage Distance: <strong className="text-blue-400">38 miles (92%)</strong></span>
                          <span>•</span>
                          <span>ISO 9001 Alignment: <strong className="text-emerald-400">100%</strong></span>
                          <span>•</span>
                          <span>Evidence: <code className="text-slate-400 font-mono">sha256_e4b1...</code></span>
                        </div>
                      </div>

                      {/* Unlock Action Button */}
                      <div className="shrink-0 flex items-center space-x-3">
                        {unlockedCandidate === 'demo_enclosures' ? (
                          <div className="px-4 py-2 bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Permanently Unlocked
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSimulateUnlock('demo_enclosures')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            Unlock Contact (1 Credit)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Candidate 2: Vanguard Auto */}
                  <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-bold text-white">Vanguard Auto Components Ltd</span>
                          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                            Rank #2 • 89% Match
                          </span>
                          <span className="text-xs text-slate-400">Coventry • SIC 29320</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                          Tier-1 commercial automotive supplier. Subcontracts stamped structural brackets, chassis gussets, and battery housing panels. High repeat order potential.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                          <span>Capability Fit: <strong className="text-emerald-400">92%</strong></span>
                          <span>•</span>
                          <span>Haulage Distance: <strong className="text-blue-400">75 miles (84%)</strong></span>
                          <span>•</span>
                          <span>IATF 16949 / ISO 9001: <strong className="text-emerald-400">Verified</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-3">
                        {unlockedCandidate === 'demo_components' ? (
                          <div className="px-4 py-2 bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Permanently Unlocked
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSimulateUnlock('demo_components')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            Unlock Contact (1 Credit)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Competitor Exclusion Callout Card */}
                  <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl flex items-start space-x-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300">
                      <strong className="text-amber-300">Mathematical Competitor Exclusion Guarantee:</strong> Vortex Sheet Metal Works (SIC 25110) also fabricates precision sheet steel. Because both companies sell the same output capability, the matching engine classifies it as an adversarial competitor and strictly filters it from Delta's customer leads.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Supplier 1: Apex Steel & Alloys */}
                  <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-bold text-white">Apex Steel & Alloys Ltd</span>
                          <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                            Rank #1 • 96% Match
                          </span>
                          <span className="text-xs text-slate-400">Scunthorpe • SIC 24100</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                          Stockholder and direct mill processor of cold-rolled mild steel coil (CR4), laser-quality pickled & oiled plate (S275JR), and aluminium sheets. Directly satisfies Delta's raw material intake.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                          <span>Material Fit: <strong className="text-emerald-400">99%</strong></span>
                          <span>•</span>
                          <span>Delivery Radius: <strong className="text-blue-400">45 miles (95%)</strong></span>
                          <span>•</span>
                          <span>Mill Test Certs (EN 10204 3.1): <strong className="text-emerald-400">Guaranteed</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-3">
                        {unlockedCandidate === 'demo_raw_metal' ? (
                          <div className="px-4 py-2 bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Permanently Unlocked
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSimulateUnlock('demo_raw_metal')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            Unlock Supplier (1 Credit)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Supplier 2: Precision Press & Tooling */}
                  <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-bold text-white">Precision Press & Tooling Ltd</span>
                          <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                            Rank #2 • 88% Match
                          </span>
                          <span className="text-xs text-slate-400">Birmingham • SIC 28410</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                          Specialist manufacturer of CNC press brake tooling, precision-ground multi-V dies, and fiber laser optical lenses. Fulfills machine maintenance and tooling inputs.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                          <span>Tooling Compatibility: <strong className="text-emerald-400">94%</strong></span>
                          <span>•</span>
                          <span>Express Delivery: <strong className="text-blue-400">Next-Day UK</strong></span>
                          <span>•</span>
                          <span>Hardness 56-60 HRC: <strong className="text-emerald-400">Verified</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-3">
                        {unlockedCandidate === 'demo_equipment' ? (
                          <div className="px-4 py-2 bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Permanently Unlocked
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSimulateUnlock('demo_equipment')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            Unlock Supplier (1 Credit)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Invariant Note */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <span className="flex items-center text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                <strong>Permanent Non-Double-Charge Invariant:</strong> Once unlocked, your organisation retains perpetual access across all RFQs, CRM threads, and search exports without paying again.
              </span>
              <button
                onClick={() => onGoToLogin('member')}
                className="text-blue-400 hover:text-blue-300 font-bold whitespace-nowrap"
              >
                Sign In to Full Database →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 7. BLIND RFQ PROCUREMENT SHOWCASE                    */}
      {/* ---------------------------------------------------- */}
      <section id="blind-rfq" className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                Procurement & Networking
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Multi-Supplier RFQs with Isolated Blind Threads.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed text-pretty">
                Dispatch structured requests for quotation to verified suppliers simultaneously. Each counterparty receives a private, isolated thread — completely blind to competing bidders, quotes, and delivery timelines.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Reusable Engineering Templates</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Save parametric specification standards for laser tolerances (±0.1mm), sheet grades, bend deductions, and batch sizes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Zero Competitor Collusion</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Suppliers cannot view competitor identities or pricing bids. Buyers maintain complete commercial discretion.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Pre-Unlocked Supplier Integration</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Any candidate previously unlocked in the matching engine is immediately available to message with 0 extra credits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Graphic: Blind RFQ Thread Architecture */}
            <div className="lg:col-span-6 bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-white">Buyer RFQ Dispatch Console</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                  RFQ-2026-0849
                </span>
              </div>

              {/* Requirement Summary */}
              <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <div className="font-bold text-white">Batch: 250 Server Enclosure Blanks</div>
                <div className="text-slate-400 text-[11px] mt-0.5">Material: 3.0mm Mild Steel S275JR • Tolerance: ±0.1mm • Delivery: Sheffield</div>
              </div>

              {/* Blind Thread Split Demonstration */}
              <div className="mt-4 space-y-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Isolated Supplier Channels (Blind Isolation)
                </div>

                {/* Thread A */}
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-emerald-400">Thread A • Apex Steel & Alloys Ltd</div>
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">Private Thread #1</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    &ldquo;Quote submitted: £2,850.00 ex VAT. Certified S275JR mill blanks ready in 4 working days.&rdquo;
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">Encrypted isolated channel • Bidders can never see Thread B</div>
                </div>

                {/* Thread B */}
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-blue-400">Thread B • Precision Press & Tooling</div>
                    <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded">Private Thread #2</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    &ldquo;Quote submitted: £3,120.00 ex VAT including deburring and edge conditioning. 3 days turnaround.&rdquo;
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">Encrypted isolated channel • Bidders can never see Thread A</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 8. COMMERCIAL MEMBERSHIP & PRICING PLANS            */}
      {/* ---------------------------------------------------- */}
      <section id="membership" className="py-24 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Commercial Tiers
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Transparent Membership for Engineering Growth.
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed text-pretty">
              Every plan unlocks verified manufacturing intelligence. Credits control unlock volume and carry over with zero double-charge for previously unlocked relationships.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="mt-8 inline-flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
                  billingPeriod === 'annual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Annual Billing
                <span className="ml-2 text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COMMERCIAL_PLANS.map((plan) => {
              const isPopular = plan.id === 'premium';
              const price = billingPeriod === 'annual' 
                ? Math.round(plan.price_gbp_monthly * 0.8) 
                : plan.price_gbp_monthly;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl border p-8 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-2xl shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                      Most Popular Tier
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-white">{plan.name}</h4>
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {plan.monthly_credits} Credits / mo
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline">
                      <span className="text-4xl font-black text-white">£{price}</span>
                      <span className="text-xs text-slate-400 ml-1.5">/ month</span>
                    </div>
                    {billingPeriod === 'annual' && plan.price_gbp_monthly > 0 && (
                      <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                        Billed annually (Save £{(plan.price_gbp_monthly - price) * 12}/year)
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                        Included Privileges:
                      </div>
                      <ul className="space-y-3 text-xs text-slate-300">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="w-4 h-4 text-blue-400 mr-2.5 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800">
                    <button
                      onClick={() => onGoToLogin('member')}
                      className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {plan.id === 'free' ? 'Get Started Free' : 'Sign In & Activate Tier'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Credit Top-Up Packs Note */}
          <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white">Need higher match volume? On-demand Credit Packs.</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Top up your wallet anytime without changing subscription tiers: Pack 10 (£45), Pack 50 (£190), Pack 200 (£600).
              </div>
            </div>
            <button
              onClick={() => onGoToLogin('member')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
            >
              View Credit Wallet
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 9. FAQ & ARCHITECTURE ACCORDION                     */}
      {/* ---------------------------------------------------- */}
      <section id="faq" className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Technical Clarity
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions.
            </h2>
            <p className="text-sm text-slate-400 mt-3">
              Understanding the MAQE data architecture, ground-truth citations, and matching rules.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Why does MAQE require zero manual input from engineering companies?",
                a: "Traditional directories fail because engineering firms lack the time or incentive to keep commercial profiles updated. MAQE solves this by programmatically ingesting statutory filings directly from the UK Companies House Public Data API, then continuously discovering and verifying public capabilities with SHA-256 evidence hashing."
              },
              {
                q: "How does the matching engine prevent AI hallucinations?",
                a: "MAQE uses a deterministic ruleset (rules_v1) rather than a generative black box. Match scores are mathematically decomposed into capability fit, geography, and ISO certifications. Observed facts must have cryptographic evidence references, and inferred commercial needs are labeled distinctly so users always know the exact justification."
              },
              {
                q: "What is the Permanent Non-Double-Charge Invariant?",
                a: "Section 8A of the Technical Addendum guarantees that once an organisation unlocks a supplier or customer match via credits, that relationship is permanently accessible across all member users in that organization. You can message, invite to blind RFQs, and export their contact details forever without recurring charges."
              },
              {
                q: "How does competitor exclusion protect my company?",
                a: "If two companies both manufacture the same output capability (for example, two precision sheet metal fabricators in the same region), the engine automatically classifies them as competitors rather than commercial matches. Neither will receive the other as a prospective customer lead."
              },
              {
                q: "How does blind RFQ procurement work?",
                a: "When you dispatch an RFQ to multiple suppliers, MAQE automatically spawns an isolated thread for each recipient. Suppliers submit private bids directly to your buyer console and have zero visibility into who else was invited or what competing prices were offered."
              }
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-400 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-850 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 10. FOOTER                                           */}
      {/* ---------------------------------------------------- */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base">
                  M
                </div>
                <span className="text-base font-bold text-white">MAQE Platform</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                UK Engineering Intelligence, Autonomous Supplier Discovery, and Directional Lead Matching.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Statutory Data Adapter: Companies House API
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#pipeline" className="hover:text-white transition-colors">Pipeline Flow</a></li>
                <li><a href="#dimensions" className="hover:text-white transition-colors">5-Dimension Schema</a></li>
                <li><a href="#matching-terminal" className="hover:text-white transition-colors">Matching Showcase</a></li>
                <li><a href="#blind-rfq" className="hover:text-white transition-colors">Blind RFQ System</a></li>
                <li><a href="#membership" className="hover:text-white transition-colors">Membership & Credits</a></li>
              </ul>
            </div>

            {/* Col 3: Authentication & Personas */}
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Portals & Access</div>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => onGoToLogin('member')} className="hover:text-white transition-colors text-left">
                    Member Portal (Delta Metalworks Ltd)
                  </button>
                </li>
                <li>
                  <button onClick={() => onGoToLogin('operator')} className="hover:text-white transition-colors text-left">
                    Operator Console (Platform Admin)
                  </button>
                </li>
                <li>
                  <a href="https://jethrowatson.co.uk/maqe/api/index.php?action=health" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center">
                    Cloud Database Health Check <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/jethrowatson/maqe" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center">
                    GitHub Code Repository <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform Security */}
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Security & Compliance</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Protected by session tokens and password gating. API transactions authenticated via cryptographic keys and MariaDB row-level locks.
              </p>
              <div className="mt-3 inline-flex items-center space-x-2 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>All 31 Canonical Tables Live</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              © 2026 MAQE Platform. All rights reserved. Version 1.1 Production Release.
            </div>
            <div className="flex items-center space-x-6">
              <button onClick={() => onGoToLogin('operator')} className="hover:text-white transition-colors">
                Operator Console
              </button>
              <button onClick={() => onGoToLogin('member')} className="hover:text-white transition-colors">
                Member Sign In
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
