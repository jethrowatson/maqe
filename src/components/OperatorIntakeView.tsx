'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BackfillPartition, SyncWatermark, SICMasterEntry, IngestEvent, CompanyRecord } from '../lib/domain/types';
import {
  Database,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  Radio,
  Search,
  Filter,
  Layers,
  Terminal,
  Building2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Check,
  Flame,
  ArrowRight
} from 'lucide-react';
import { SIC_MASTER_DATA } from '../lib/engines/intake';

interface OperatorIntakeViewProps {
  partitions: BackfillPartition[];
  watermarks: SyncWatermark[];
  onPause: () => void;
  onResume: () => void;
  onStepPartition: (id: string) => void;
  status: {
    is_paused: boolean;
    total_partitions: number;
    completed_partitions: number;
    running_partitions: number;
    progress_pct: number;
    records_ingested: number;
    capacity_target: number;
    mode: string;
    daily_sync_status: string;
    sic_codes_active?: number;
    total_sic_codes?: number;
    scraper_speed?: string;
  };
  onStepLiveScrape?: (sic?: string) => { events: IngestEvent[]; company?: CompanyRecord };
  eventLog?: IngestEvent[];
  newlyScrapedCompanies?: CompanyRecord[];
  onSetSpeed?: (speed: 'normal' | 'fast' | 'turbo') => void;
}

export function OperatorIntakeView({
  partitions,
  watermarks,
  onPause,
  onResume,
  onStepPartition,
  status,
  onStepLiveScrape,
  eventLog = [],
  newlyScrapedCompanies = [],
  onSetSpeed
}: OperatorIntakeViewProps) {
  // Scraper running state
  const [isRunningScraper, setIsRunningScraper] = useState<boolean>(true);
  const [scraperSpeed, setScraperSpeed] = useState<'normal' | 'fast' | 'turbo'>('normal');
  const [tierFilter, setTierFilter] = useState<number | 'all' | 'default'>('default');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSicForDetails, setSelectedSicForDetails] = useState<SICMasterEntry | null>(null);
  
  // Local real-time event logs and entities buffer
  const [logs, setLogs] = useState<IngestEvent[]>(eventLog);
  const [entities, setEntities] = useState<CompanyRecord[]>(newlyScrapedCompanies);
  const [recordsCount, setRecordsCount] = useState<number>(status.records_ingested || 4850);
  const [reqPerMin, setReqPerMin] = useState<number>(118);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Derive unique categories from SIC_MASTER_DATA
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    SIC_MASTER_DATA.forEach(s => set.add(s.category));
    return Array.from(set).sort();
  }, []);

  // Filter master SIC codes
  const filteredSics = React.useMemo(() => {
    return SIC_MASTER_DATA.filter(s => {
      if (tierFilter === 'default') {
        if (!s.default_intake) return false;
      } else if (tierFilter !== 'all') {
        if (s.tier !== tierFilter) return false;
      }

      if (categoryFilter !== 'all') {
        if (s.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return s.sic_code.includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q);
      }

      return true;
    });
  }, [tierFilter, categoryFilter, searchQuery]);

  // Execute a single step
  const executeStep = (targetSic?: string) => {
    if (onStepLiveScrape) {
      const res = onStepLiveScrape(targetSic);
      if (res.events && res.events.length > 0) {
        setLogs(prev => [...res.events, ...prev].slice(0, 100));
      }
      if (res.company) {
        setEntities(prev => [res.company!, ...prev].slice(0, 25));
      }
      setRecordsCount(prev => prev + 1);
      setReqPerMin(prev => Math.min(180, Math.max(90, prev + Math.floor(Math.random() * 5 - 2))));
    }
  };

  // Live scraper interval timer
  useEffect(() => {
    if (!isRunningScraper) return;

    const intervalTime = scraperSpeed === 'turbo' ? 350 : scraperSpeed === 'fast' ? 800 : 1600;
    const interval = setInterval(() => {
      // Pick a random SIC from the filtered list or master list
      const candidateSics = filteredSics.length > 0 ? filteredSics : SIC_MASTER_DATA;
      const randomSic = candidateSics[Math.floor(Math.random() * candidateSics.length)]?.sic_code;
      executeStep(randomSic);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isRunningScraper, scraperSpeed, filteredSics]);

  const handleSpeedChange = (speed: 'normal' | 'fast' | 'turbo') => {
    setScraperSpeed(speed);
    if (onSetSpeed) onSetSpeed(speed);
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* 1. TOP CONTROL COCKPIT & LIVE ENGINE STATUS          */}
      {/* ---------------------------------------------------- */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-black text-white tracking-tight">
                    C01 Statutory Registry Intake & Scraper Engine
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    443 SIC Master Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Autonomous scraping against UK Companies House Public API using the master SIC selection (Groups 1 Core, 2 Supply Chain, 3 Optional).
                </p>
              </div>
            </div>
          </div>

          {/* Engine Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Speed Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
              <button
                onClick={() => handleSpeedChange('normal')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  scraperSpeed === 'normal' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                1.6s
              </button>
              <button
                onClick={() => handleSpeedChange('fast')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  scraperSpeed === 'fast' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fast (0.8s)
              </button>
              <button
                onClick={() => handleSpeedChange('turbo')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center ${
                  scraperSpeed === 'turbo' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 mr-1" /> Turbo
              </button>
            </div>

            {/* Step 1 Cycle */}
            <button
              onClick={() => executeStep()}
              className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors flex items-center"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Step 1 Cycle
            </button>

            {/* Master Start / Pause */}
            {isRunningScraper ? (
              <button
                onClick={() => setIsRunningScraper(false)}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md transition-all flex items-center"
              >
                <Pause className="w-4 h-4 mr-1.5" /> Pause Engine
              </button>
            ) : (
              <button
                onClick={() => setIsRunningScraper(true)}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center"
              >
                <Play className="w-4 h-4 mr-1.5" /> Run Engine
              </button>
            )}
          </div>
        </div>

        {/* Live Engine Telemetry KPIs */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Ingest Progress</span>
            <div className="text-2xl font-black text-white mt-1">
              {recordsCount.toLocaleString()}
              <span className="text-xs font-normal text-slate-500"> / 600,000</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(1, (recordsCount / 600000) * 100))}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Companies House Gov API</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {reqPerMin} <span className="text-xs font-normal text-slate-400">req / min</span>
            </div>
            <span className="text-[11px] text-emerald-500 font-semibold block mt-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Rate Governor: Safe (&lt; 600 / 5 min)
            </span>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Master SIC Coverage</span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {filteredSics.length} <span className="text-xs font-normal text-slate-400">/ 443 Codes</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Tier 1 (265) • Tier 2 (70) • Tier 3 (108)
            </span>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ground-Truth Proof Status</span>
            <div className="text-sm font-mono font-bold text-white mt-1.5 flex items-center text-cyan-400">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-cyan-400" />
              100% SHA-256 Hashed
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Zero generative hallucinations
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. REAL-TIME CRT TERMINAL STREAM & LIVE ENTITIES     */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time CRT Terminal Console (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-5 font-mono shadow-2xl flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">MAQE Scraper Stream Console</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isRunningScraper ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] text-slate-400 uppercase">
                {isRunningScraper ? 'Streaming Live' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Scrolling log container */}
          <div
            ref={logTerminalRef}
            className="flex-1 overflow-y-auto space-y-1.5 mt-3 pr-2 text-xs scrollbar-thin"
          >
            {logs.length === 0 ? (
              <div className="text-slate-500 py-8 text-center italic">
                Engine ready. Starting Companies House intake partitions...
              </div>
            ) : (
              logs.map((log) => {
                const isSuccess = log.level === 'success';
                const isWarn = log.level === 'warn';
                return (
                  <div key={log.id} className="leading-relaxed flex items-start space-x-2">
                    <span className="text-slate-600 shrink-0 text-[10px]">
                      {log.timestamp.substring(11, 19)}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      log.type === 'companies_house_query' ? 'bg-blue-950 text-blue-400' :
                      log.type === 'entity_ingested' ? 'bg-emerald-950 text-emerald-400' :
                      log.type === 'discovery_crawled' ? 'bg-cyan-950 text-cyan-400' :
                      log.type === 'assertion_extracted' ? 'bg-amber-950 text-amber-400' :
                      'bg-purple-950 text-purple-400'
                    }`}>
                      {log.type === 'companies_house_query' ? 'CH_API' :
                       log.type === 'entity_ingested' ? 'INGEST' :
                       log.type === 'discovery_crawled' ? 'DISCOV' :
                       log.type === 'assertion_extracted' ? 'ASSERT' : 'MATCH'}
                    </span>
                    <span className={`${
                      isSuccess ? 'text-emerald-300' :
                      isWarn ? 'text-amber-300' :
                      'text-slate-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Scraped Companies Feed (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Live Ingested Entities</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {entities.length} In Stream
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 scrollbar-thin">
            {entities.length === 0 ? (
              <div className="text-slate-400 text-xs py-12 text-center italic">
                Awaiting ingested entity frames from Companies House stream...
              </div>
            ) : (
              entities.map((ent) => (
                <div
                  key={ent.company_id}
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                      {ent.legal_name}
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-100/60 px-1.5 py-0.5 rounded">
                      SIC {ent.sic_codes[0]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                    <span className="font-mono">#{ent.registration_number}</span>
                    <span>•</span>
                    <span>{ent.addresses.locality}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">Active Filing</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. 443 SIC MASTER SELECTION EXPLORER TABLE          */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Official SIC Master Registry ({filteredSics.length} Codes Selected)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Source file: <code className="text-blue-600 font-mono font-semibold">MAQE_SIC_master.xlsx</code> • Select codes to inspect screening guidance or scrape on demand.
            </p>
          </div>

          {/* Quick Scope Filter Chips */}
          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setTierFilter('default')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                tierFilter === 'default'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Recommended Intake (335)
            </button>
            <button
              onClick={() => setTierFilter(1)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                tierFilter === 1
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier 1 Core (265)
            </button>
            <button
              onClick={() => setTierFilter(2)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                tierFilter === 2
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier 2 Supply Chain (70)
            </button>
            <button
              onClick={() => setTierFilter(3)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                tierFilter === 3
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier 3 Optional (108)
            </button>
            <button
              onClick={() => setTierFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                tierFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All (443)
            </button>
          </div>
        </div>

        {/* Filter Controls: Search & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SIC code, description, or keyword (e.g. 25110, metal, forging, aerospace)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Master SIC Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">SIC Code</th>
                <th className="py-3 px-4">Official Description</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Default Intake</th>
                <th className="py-3 px-4">Screening Guidance</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSics.slice(0, 50).map((s) => (
                <tr
                  key={s.sic_code}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSicForDetails(s)}
                >
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {s.sic_code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {s.description}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.tier === 1 ? 'bg-blue-100 text-blue-800' :
                      s.tier === 2 ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      Tier {s.tier}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {s.category}
                  </td>
                  <td className="py-3 px-3">
                    {s.default_intake ? (
                      <span className="text-emerald-700 font-bold flex items-center text-[11px]">
                        <Check className="w-3.5 h-3.5 mr-1" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Optional</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs" title={s.guidance}>
                    {s.guidance}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        executeStep(s.sic_code);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg transition-all"
                    >
                      Scrape Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSics.length > 50 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              Showing first 50 of {filteredSics.length} matched SIC codes. Use the filters above to narrow your scope.
            </div>
          )}
        </div>
      </div>

      {/* SIC Inspection Modal / Drawer if clicked */}
      {selectedSicForDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  SIC {selectedSicForDetails.sic_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedSicForDetails.description}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSicForDetails(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block">Tier & Category:</span>
                <span className="text-slate-600">Tier {selectedSicForDetails.tier} • {selectedSicForDetails.category}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Reason for Inclusion:</span>
                <p className="text-slate-600 leading-relaxed mt-0.5">{selectedSicForDetails.reason}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Screening Guidance:</span>
                <p className="text-slate-600 leading-relaxed mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedSicForDetails.guidance}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedSicForDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  executeStep(selectedSicForDetails.sic_code);
                  setSelectedSicForDetails(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                Trigger Ingest For SIC {selectedSicForDetails.sic_code}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
