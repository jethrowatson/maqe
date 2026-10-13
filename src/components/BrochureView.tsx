'use client';

import React, { useState } from 'react';
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
  Network
} from 'lucide-react';
import { COMMERCIAL_PLANS } from '../lib/engines/commerce';

interface BrochureViewProps {
  onGoToLogin: (role?: 'member' | 'operator') => void;
  cloudConnected: boolean;
}

export function BrochureView({ onGoToLogin, cloudConnected }: BrochureViewProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [selectedCompanyTab, setSelectedCompanyTab] = useState<'delta' | 'apex' | 'enclosures'>('delta');

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-black tracking-widest text-white text-lg shadow-sm">
                M
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">MAQE</span>
                  <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">v1.1</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Engineering Intelligence Platform</p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
              <a href="#innovation" className="hover:text-blue-600 transition-colors">Platform Innovation</a>
              <a href="#super-database" className="hover:text-blue-600 transition-colors">Super-Database</a>
              <a href="#ai-matching" className="hover:text-blue-600 transition-colors">Directional Matching</a>
              <a href="#rfq" className="hover:text-blue-600 transition-colors">Procurement & RFQs</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Membership & Credits</a>
            </nav>

            {/* Auth CTAs */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-600">
                <span className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className="text-[11px] font-mono">{cloudConnected ? 'Cloud MariaDB Live' : 'Database Standby'}</span>
              </div>

              <button
                onClick={() => onGoToLogin('operator')}
                className="hidden lg:inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Operator Console
              </button>

              <button
                onClick={() => onGoToLogin('member')}
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm"
              >
                Sign In / Access
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white text-slate-900 pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-slate-200">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Generation Manufacturing & Supply Chain Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
              The Engineering Intelligence Platform.
            </h1>

            <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed">
              Company intelligence, supplier discovery, and AI lead matching. We build an engineering super-database directly from statutory company registries and verified public sources — <strong className="text-slate-900 font-semibold">with zero manual profile input required</strong>.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onGoToLogin('member')}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:shadow-lg flex items-center"
              >
                Enter Member Platform
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button
                onClick={() => onGoToLogin('operator')}
                className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm rounded-xl transition-colors shadow-2xs flex items-center"
              >
                <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                Launch Operator Console
              </button>
            </div>

            {/* Key Platform Stats */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-200">
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
                <div className="text-2xl sm:text-3xl font-black text-slate-900">600,000</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">UK Engineering Records</div>
              </div>
              <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
                <div className="text-2xl sm:text-3xl font-black text-blue-700">Dual-Direction</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Customer & Supplier Matching</div>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
                <div className="text-2xl sm:text-3xl font-black text-slate-900">100% Citation</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">SHA-256 Ground Proof</div>
              </div>
              <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
                <div className="text-2xl sm:text-3xl font-black text-emerald-700">Zero Double-Charge</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Permanent Ledger Invariant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 2 & 3: The MAQE Innovation & Flow */}
      <section id="innovation" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Platform Flow</h2>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              An engineering super-database powering two-way intelligence.
            </h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Unlike traditional B2B directories that rely on companies manually filling out forms, MAQE creates structured profiles autonomously through statutory intake, discovery, and AI enrichment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900">Company Records Intake</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Basic company records are ingested from the statutory registration authority (UK Companies House Public Data API).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900">Discovery + AI Enrichment</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Public sources build a detailed picture of what each company does, who it works with, and who it may sell to.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900">Lead + Supplier Intelligence</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The engine matches suppliers and potential clients using structured capability-to-need mappings and transparent rules.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900">Member Connections</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Users connect through MAQE to build credibility, dispatch blind RFQs, and manage outbound lead flows.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-center text-xs font-semibold text-blue-900">
            &ldquo;Company input is not required to build the intelligence or generate matches. Claims and member updates augment the profile.&rdquo;
          </div>
        </div>
      </section>

      {/* Slide 6: Structured Company Intelligence */}
      <section id="super-database" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Canonical Architecture</h2>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              Structured company intelligence across 5 dimensions.
            </h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Each profile describes the company’s exact role in the engineering supply chain. Evidence and AI inferences remain strictly distinct so members can judge the basis of every recommendation.
            </p>
          </div>

          {/* 5 Dimensions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-black text-blue-600 uppercase tracking-wider">PROVIDES</div>
              <div className="text-sm font-bold text-slate-900 mt-2">Output Capabilities</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Products, fabrication processes, laser cutting, stamping, machine tolerances, and verified services.
              </p>
              <div className="mt-3 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                Observed Facts
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-black text-blue-600 uppercase tracking-wider">USES</div>
              <div className="text-sm font-bold text-slate-900 mt-2">Operational Inputs</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Raw materials, mill sheet steel, components, CNC machinery, cutting tooling, and consumables.
              </p>
              <div className="mt-3 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                Observed Facts
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-black text-blue-600 uppercase tracking-wider">SERVES</div>
              <div className="text-sm font-bold text-slate-900 mt-2">Target Markets</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Downstream customer types: electronics enclosures, automotive tier-1, robotics, assembly lines.
              </p>
              <div className="mt-3 text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                Market Alignment
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-black text-amber-600 uppercase tracking-wider">LIKELY NEEDS</div>
              <div className="text-sm font-bold text-slate-900 mt-2">Inferred Dependencies</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Future commercial requirements inferred logically from manufacturing activity (e.g. flatbed haulage).
              </p>
              <div className="mt-3 text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                AI Inference
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-black text-purple-600 uppercase tracking-wider">RELATIONSHIPS</div>
              <div className="text-sm font-bold text-slate-900 mt-2">Commercial Graph</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Known or inferred supplier and client connections across the UK engineering ecosystem.
              </p>
              <div className="mt-3 text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                Verified Ties
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 8: Delta Metalworks Benchmark Showcase */}
      <section id="ai-matching" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Dual-Direction Matching Engine</h2>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              Illustrated by Delta Metalworks Ltd.
            </h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Delta produces precision sheet metal for components and assembly manufacturers. The engine matches both sides of its commercial balance sheet simultaneously.
            </p>
          </div>

          {/* Interactive Benchmark Diagram */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
            <div className="flex justify-center mb-8">
              <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 flex space-x-2">
                <button
                  onClick={() => setActiveTab('customer')}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'customer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Customer Lead Matches (Downstream Demand)
                </button>
                <button
                  onClick={() => setActiveTab('supplier')}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'supplier'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Supplier Recommendations (Upstream Supply)
                </button>
              </div>
            </div>

            {/* Benchmark Details */}
            {activeTab === 'customer' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">Rank #1 • 92% Score</span>
                    <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">High Match</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-3">Apex Enclosures Ltd</h4>
                  <p className="text-xs text-slate-400 mt-1">Nottingham • SIC 26110</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Designs server racks & weatherproof cabinets. High-volume laser cut panel and folded chassis use satisfies Delta&apos;s primary output.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">Rank #2 • 86% Score</span>
                    <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Repeat OEM</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-3">Vanguard Auto Components</h4>
                  <p className="text-xs text-slate-400 mt-1">Coventry • SIC 29320</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Produces vehicle brackets and stamped assemblies using flat laser blanks. Strong repeat commercial supply-chain fit.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">Rank #3 • 58% Score</span>
                    <span className="text-[10px] font-bold uppercase bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">Moderate Evidence</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-3">Quantum Robotics Ltd</h4>
                  <p className="text-xs text-slate-400 mt-1">Cambridge • SIC 28990</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Builds automation robotic cells. Moderate structural casing use alongside extruded aluminium; lower-confidence prospective prospect.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">Rank #1 • 94% Score</span>
                    <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Raw Metal</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-3">Apex Steel & Alloys Ltd</h4>
                  <p className="text-xs text-slate-400 mt-1">Scunthorpe • SIC 24100</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Primary mill supplier for certified cold-rolled mild steel coil and aluminium plate, fulfilling Delta&apos;s inferred raw material need.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">Rank #2 • 88% Score</span>
                    <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Machinery Tooling</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-3">Precision Press & Tooling</h4>
                  <p className="text-xs text-slate-400 mt-1">Birmingham • SIC 28410</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Manufactures CNC press brake tooling, dies, and fiber laser optics, satisfying Delta&apos;s tooling and maintenance requirement.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">Rank #3 • 84% Score</span>
                    <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Haulage</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-3">Titan Freight & Haulage</h4>
                  <p className="text-xs text-slate-400 mt-1">Leeds • SIC 49410</p>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    Flatbed articulated heavy transport for palletized sheet metal and regional metal coil dispatch.
                  </p>
                </div>
              </div>
            )}

            {/* Competitor Exclusion Callout */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="text-slate-300">
                <strong className="text-amber-400">Strict Competitor Exclusion:</strong> Vortex Sheet Metal Ltd (SIC 25110) also fabricates sheet steel. Because it offers the same capability rather than consuming it, the matching engine classifies it as a competitor and excludes it from customer leads.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 11: RFQs and Blind Bidder Procurement */}
      <section id="rfq" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Procurement & Networking</h2>
              <h3 className="text-3xl font-black text-slate-900 mt-2">
                Multi-supplier RFQs with isolated blind threads.
              </h3>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                Dispatch requests for quotation across verified suppliers in seconds. Each supplier receives their own isolated message thread — bidders can never see competitors, quotes, or counterparty interactions.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Reusable Technical Templates</h5>
                    <p className="text-xs text-slate-500">Save standard specifications for laser cutting, CNC machining, stamping, and finishing.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">End-to-End Blind Bidding</h5>
                    <p className="text-xs text-slate-500">Suppliers submit private pricing directly to your dashboard without public price disclosure.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Permanent Non-Double-Charge Invariant</h5>
                    <p className="text-xs text-slate-500">Once an organisation unlocks a supplier, that connection is permanently available across all workflows.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual RFQ Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Active RFQ Dispatch</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  Open Bidding
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-3">Laser Cutting & CNC Bending for Server Enclosures</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mild Steel S275JR (3mm thickness), batch size 250 units, tolerance ±0.1mm.
              </p>

              <div className="mt-4 space-y-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Apex Steel & Alloys Ltd</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">Blind Thread Isolated</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Precision Press & Tooling</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">Blind Thread Isolated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 9 & 10: Membership Tiers & Pricing */}
      <section id="pricing" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Membership Plans</h2>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              Transparent access tailored to engineering growth.
            </h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Every tier unlocks deeper search and recommendation permissions. Matching credits control staged delivery volumes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMMERCIAL_PLANS.map(plan => {
              const isPopular = plan.id === 'premium';
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-8 flex flex-col justify-between transition-all ${
                    isPopular
                      ? 'border-blue-500 bg-white ring-2 ring-blue-500 shadow-lg'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                      {isPopular && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-black text-slate-900">£{plan.price_gbp_monthly}</span>
                      <span className="text-xs text-slate-500 ml-1">/ month</span>
                    </div>

                    <div className="text-xs font-semibold text-blue-600 mt-1">
                      {plan.monthly_credits} monthly intelligence credits
                    </div>

                    <ul className="mt-6 space-y-3 text-xs text-slate-600">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200/80">
                    <button
                      onClick={() => onGoToLogin('member')}
                      className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors ${
                        isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      Sign In & Activate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-base">
                M
              </div>
              <span className="text-base font-bold text-white">MAQE Engineering Intelligence Platform</span>
            </div>

            <div className="text-xs text-slate-500">
              © 2026 MAQE Platform. All rights reserved. Statutory data from UK Companies House.
            </div>

            <div className="flex items-center space-x-4 text-xs font-semibold">
              <button onClick={() => onGoToLogin('operator')} className="hover:text-white transition-colors">
                Operator Login
              </button>
              <span>•</span>
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
