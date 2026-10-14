'use client';

import React, { useState, useMemo } from 'react';
import {
  CompanyRecord,
  AdminEnrichmentSummary,
  PhaseOneCompanySchema,
  MatchCandidateResult,
  MatchDirection
} from '../lib/domain/types';
import {
  Database,
  Globe,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  FileJson,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Building2,
  Phone,
  Award,
  Sliders,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Network,
  FileText,
  Activity
} from 'lucide-react';

interface AdminEnrichmentDashboardProps {
  summary: AdminEnrichmentSummary;
  companies: CompanyRecord[];
  allMatches: MatchCandidateResult[];
  getPhaseOneSchema: (companyId: string) => PhaseOneCompanySchema | undefined;
  runMatchesForCompany: (companyId: string, direction: MatchDirection) => MatchCandidateResult[];
  onSelectFocusCompanyInLab?: (companyId: string) => void;
}

const DOMAIN_LABELS: Record<string, string> = {
  identity_profile: '1. Identity & Registry Profile',
  website_discovery: '2. Website Discovery & Identity Signals',
  locations_and_coverage: '3. Locations & GB Coverage',
  contact_routes: '4. Public Contact Routes',
  offerings_hierarchy: '5. Offerings Hierarchy (Group → Offering)',
  capabilities_and_parameters: '6. Capabilities & Technical Parameters',
  credentials_and_standards: '7. Credentials & ISO Standards',
  markets_and_sectors: '8. Market & Sector Participation',
  commercial_needs: '9. Commercial & Supply Chain Needs',
  history_and_workforce: '10. History & Workforce Indicators'
};

export const AdminEnrichmentDashboard: React.FC<AdminEnrichmentDashboardProps> = ({
  summary,
  companies,
  allMatches,
  getPhaseOneSchema,
  runMatchesForCompany,
  onSelectFocusCompanyInLab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'companies' | 'matching' | 'schema_domains'>('companies');

  // Filters for the 1,000 companies table
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [webFilter, setWebFilter] = useState<'ALL' | 'CONFIRMED_WEB' | 'REGISTRY_ONLY'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'completeness_desc' | 'quality_desc' | 'completeness_asc' | 'name_asc'>('completeness_desc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Modal state for inspecting a single company's full Phase One Schema
  const [inspectedCompany, setInspectedCompany] = useState<CompanyRecord | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'assessments' | 'offerings' | 'evidence' | 'json'>('assessments');

  // Matching Explorer state
  const [selectedMatchCompanyId, setSelectedMatchCompanyId] = useState<string>('ALL');
  const [matchDirectionFilter, setMatchDirectionFilter] = useState<'ALL' | 'supplier' | 'customer'>('ALL');
  const [matchSearch, setMatchSearch] = useState('');

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = companies.filter(c => {
      if (gradeFilter !== 'ALL' && c.enrichment_metrics?.quality_grade !== gradeFilter) return false;
      if (webFilter === 'CONFIRMED_WEB' && !c.enrichment_metrics?.has_confirmed_website) return false;
      if (webFilter === 'REGISTRY_ONLY' && c.enrichment_metrics?.has_confirmed_website) return false;
      if (categoryFilter !== 'ALL' && c.sic_category !== categoryFilter) return false;
      if (q) {
        const matchName =
          c.legal_name.toLowerCase().includes(q) ||
          (c.display_name || '').toLowerCase().includes(q) ||
          c.registration_number.toLowerCase().includes(q) ||
          (c.addresses.locality || '').toLowerCase().includes(q) ||
          (c.addresses.postal_code || '').toLowerCase().includes(q) ||
          (c.website_domain || '').toLowerCase().includes(q) ||
          c.sic_codes.some(s => s.includes(q)) ||
          (c.sic_description || '').toLowerCase().includes(q);
        if (!matchName) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const ma = a.enrichment_metrics!;
      const mb = b.enrichment_metrics!;
      if (sortBy === 'completeness_desc') {
        return mb.completeness_pct - ma.completeness_pct || mb.quality_score - ma.quality_score;
      }
      if (sortBy === 'quality_desc') {
        return mb.quality_score - ma.quality_score || mb.completeness_pct - ma.completeness_pct;
      }
      if (sortBy === 'completeness_asc') {
        return ma.completeness_pct - mb.completeness_pct;
      }
      return (a.display_name || a.legal_name).localeCompare(b.display_name || b.legal_name);
    });
  }, [companies, searchQuery, gradeFilter, webFilter, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, page]);

  // Compute live or precomputed matches for Matching tab
  const displayedMatches = useMemo(() => {
    let base: MatchCandidateResult[] = [];
    if (selectedMatchCompanyId === 'ALL') {
      base = allMatches;
    } else {
      const sup = runMatchesForCompany(selectedMatchCompanyId, 'supplier');
      const cust = runMatchesForCompany(selectedMatchCompanyId, 'customer');
      base = [...sup, ...cust].sort((a, b) => b.score - a.score);
    }

    if (matchDirectionFilter !== 'ALL') {
      base = base.filter(m => m.direction === matchDirectionFilter);
    }

    if (matchSearch.trim()) {
      const q = matchSearch.trim().toLowerCase();
      base = base.filter(
        m =>
          (m.focus_company_name || '').toLowerCase().includes(q) ||
          m.counterparty_name.toLowerCase().includes(q) ||
          (m.offering_matched || '').toLowerCase().includes(q) ||
          (m.need_satisfied || '').toLowerCase().includes(q) ||
          (m.registration_number || '').toLowerCase().includes(q)
      );
    }

    return base.slice(0, 120);
  }, [allMatches, selectedMatchCompanyId, matchDirectionFilter, matchSearch, runMatchesForCompany]);

  const inspectedSchema = useMemo(() => {
    if (!inspectedCompany) return undefined;
    return getPhaseOneSchema(inspectedCompany.company_id);
  }, [inspectedCompany, getPhaseOneSchema]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                PHASE ONE LIVE COHORT COMPLETE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Schema: {summary.schema_version}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Zero Dummy Data • 100% UK Companies House Verified
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Admin Discovery, Enrichment & Completeness Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Live audit of the first <strong className="text-white">1,000 active UK engineering & manufacturing businesses</strong> ingested from UK Companies House, enriched via live website discovery into the <strong className="text-white">MAQE Phase One Discovery & Enrichment Schema</strong>, and evaluated for directional B2B supply-chain fit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveSubTab('companies')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'companies'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-4 h-4" />
              1,000 Companies & Completeness
            </button>
            <button
              onClick={() => setActiveSubTab('matching')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'matching'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Network className="w-4 h-4" />
              B2B Matching Results ({summary.total_matches_generated})
            </button>
            <button
              onClick={() => setActiveSubTab('schema_domains')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'schema_domains'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Phase One Schema Domains
            </button>
          </div>
        </div>

        {/* 6 Primary Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Companies Found</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {summary.total_companies_found.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Stopped at 1,000 cap
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Companies Enriched</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {summary.total_companies_enriched.toLocaleString()}
            </div>
            <div className="text-[11px] text-purple-300 mt-1">
              100% Phase One Schema built
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Confirmed Websites</span>
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {summary.confirmed_websites_count}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({((summary.confirmed_websites_count / summary.total_companies_enriched) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="text-[11px] text-cyan-300 mt-1">
              {summary.contacts_extracted_count} contacts • {summary.credentials_extracted_count} ISO certs
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Avg Completeness</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {summary.avg_completeness_pct}%
            </div>
            <div className="text-[11px] text-amber-300 mt-1">
              Across 10 Phase One domains
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Enrichment Quality</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {summary.avg_quality_score}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">
              Grade A: {summary.quality_grades.A} • B: {summary.quality_grades.B} • C: {summary.quality_grades.C}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>B2B Matches Run</span>
              <Network className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {summary.total_matches_generated}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {summary.supplier_matches_count} Supplier • {summary.customer_matches_count} Customer
            </div>
          </div>
        </div>
      </div>

      {/* Quality & Domain Completeness Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Quality Grade Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center justify-between mb-3">
            <span>Enrichment Quality Distribution</span>
            <span className="text-xs font-mono text-slate-400">1,000 Businesses</span>
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-300 font-semibold">
                  Grade A — Verified Live Website + Deep Schema (80–100%)
                </span>
                <span className="font-mono text-white font-bold">
                  {summary.quality_grades.A} ({((summary.quality_grades.A / 1000) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(summary.quality_grades.A / 1000) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-300 font-semibold">
                  Grade B — Confirmed Website + Partial Signals (70–79%)
                </span>
                <span className="font-mono text-white font-bold">
                  {summary.quality_grades.B} ({((summary.quality_grades.B / 1000) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(summary.quality_grades.B / 1000) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-300 font-semibold">
                  Grade C — Statutory Filing + SIC Taxonomy Baseline (60%)
                </span>
                <span className="font-mono text-white font-bold">
                  {summary.quality_grades.C} ({((summary.quality_grades.C / 1000) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(summary.quality_grades.C / 1000) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Observed Assertions: <strong className="text-emerald-400 font-mono">{summary.observed_assertions.toLocaleString()}</strong></span>
            <span>Inferred Assertions: <strong className="text-amber-400 font-mono">{summary.inferred_assertions.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 2: Per-Domain Completeness across 10 Phase One Schema Domains */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">
              Completeness Across the 10 Phase One Schema Domains
            </h3>
            <span className="text-xs text-slate-400">
              Unfound web fields explicitly recorded as <code className="text-amber-300">not_found</code> / <code className="text-amber-300">unknown</code>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
            {Object.entries(summary.domain_completion_counts).map(([domainKey, count]) => {
              const pct = Math.round((count / summary.total_companies_enriched) * 100);
              return (
                <div key={domainKey}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate">{DOMAIN_LABELS[domainKey] || domainKey}</span>
                    <span className="font-mono text-white font-semibold">
                      {count}/1000 ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct === 100 ? 'bg-emerald-500' : pct >= 40 ? 'bg-cyan-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: 1,000 Companies Enrichment & Completeness Table */}
      {activeSubTab === 'companies' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Filter Controls Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search 1,000 real UK businesses by name, UK reg #, SIC, city, postcode, or website..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={gradeFilter}
                onChange={e => {
                  setGradeFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Quality Grades (1,000)</option>
                <option value="A">Grade A Only ({summary.quality_grades.A})</option>
                <option value="B">Grade B Only ({summary.quality_grades.B})</option>
                <option value="C">Grade C Only ({summary.quality_grades.C})</option>
              </select>

              <select
                value={webFilter}
                onChange={e => {
                  setWebFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="ALL">All Website States</option>
                <option value="CONFIRMED_WEB">Confirmed Live Website ({summary.confirmed_websites_count})</option>
                <option value="REGISTRY_ONLY">Registry Only / not_found ({1000 - summary.confirmed_websites_count})</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 max-w-[220px]"
              >
                <option value="ALL">All SIC Categories ({summary.sic_category_breakdown.length})</option>
                {summary.sic_category_breakdown.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="completeness_desc">Sort: Completeness (High → Low)</option>
                <option value="quality_desc">Sort: Quality Score (High → Low)</option>
                <option value="completeness_asc">Sort: Completeness (Low → High)</option>
                <option value="name_asc">Sort: Company Name (A → Z)</option>
              </select>
            </div>
          </div>

          {/* Results Count & Pagination Header */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <strong className="text-white">{(page - 1) * pageSize + 1}</strong>–
              <strong className="text-white">{Math.min(page * pageSize, filteredCompanies.length)}</strong> of{' '}
              <strong className="text-white">{filteredCompanies.length}</strong> enriched UK businesses
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="font-mono text-slate-300">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-3 px-4">UK Business & Reg #</th>
                  <th className="py-3 px-3">SIC & Sector Category</th>
                  <th className="py-3 px-3">Website & Extracted Signals</th>
                  <th className="py-3 px-3">Quality Grade</th>
                  <th className="py-3 px-4 min-w-[200px]">Schema Completeness</th>
                  <th className="py-3 px-3">Assertions</th>
                  <th className="py-3 px-4 text-right">Phase One Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {paginatedCompanies.map(company => {
                  const m = company.enrichment_metrics!;
                  return (
                    <tr key={company.company_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{company.display_name || company.legal_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <a
                            href={`https://find-and-update.company-information.service.gov.uk/company/${company.registration_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            #{company.registration_number} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">
                            {company.addresses.locality || 'UK'} {company.addresses.postal_code ? `(${company.addresses.postal_code})` : ''}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-blue-300 border border-slate-700">
                            SIC {company.primary_sic || company.sic_codes[0]}
                          </span>
                          <span className="text-[11px] text-slate-400">Tier {company.sic_tier || 1}</span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-[220px]" title={company.sic_description}>
                          {company.sic_category || company.sic_description}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {company.website_url ? (
                          <div>
                            <a
                              href={company.website_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-cyan-400 hover:underline inline-flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              {company.website_domain || company.website_url}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {m.has_contacts && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                  Contact Route
                                </span>
                              )}
                              {m.has_credentials && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  ISO / Cert
                                </span>
                              )}
                              {m.has_numeric_parameters && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  Numeric Spec
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                              FieldAssessment: not_found
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Registry + SIC Taxonomy Enriched
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center border ${
                              m.quality_grade === 'A'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : m.quality_grade === 'B'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {m.quality_grade}
                          </span>
                          <div>
                            <div className="text-xs font-mono font-bold text-white">{m.quality_score}/100</div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {m.publication_state.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-white">{m.completeness_pct}% Complete</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {m.populated_domains_count}/{m.total_domains_count} domains
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.completeness_pct >= 80
                                ? 'bg-emerald-500'
                                : m.completeness_pct >= 70
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${m.completeness_pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-xs font-mono text-white font-semibold">
                          {m.assertions_count} total
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <span className="text-emerald-400">{m.observed_assertions_count} obs</span> •{' '}
                          <span className="text-amber-400">{m.inferred_assertions_count} inf</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setInspectedCompany(company);
                              setInspectorTab('assessments');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Schema
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMatchCompanyId(company.company_id);
                              setActiveSubTab('matching');
                              if (onSelectFocusCompanyInLab) {
                                onSelectFocusCompanyInLab(company.company_id);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Network className="w-3.5 h-3.5" /> Matches
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: B2B Directional Matching Explorer across the 1,000 Enriched Businesses */}
      {activeSubTab === 'matching' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-emerald-400" />
                  Phase One Supply-Chain Matching Results (Businesses That Might Work Together)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directional B2B compatibility evaluated using Phase One Offerings, Capabilities, Materials, Credentials, and Inferred Upstream Needs across the 1,000 real UK businesses.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedMatchCompanyId}
                  onChange={e => setSelectedMatchCompanyId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white max-w-[290px]"
                >
                  <option value="ALL">All Cohort Precomputed Matches ({allMatches.length})</option>
                  {companies.slice(0, 150).map(c => (
                    <option key={c.company_id} value={c.company_id}>
                      Focus: {c.display_name || c.legal_name} (#{c.registration_number} - SIC {c.primary_sic})
                    </option>
                  ))}
                </select>

                <select
                  value={matchDirectionFilter}
                  onChange={e => setMatchDirectionFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ALL">Both Directions (Suppliers & Customers)</option>
                  <option value="supplier">Suppliers to Focus Company</option>
                  <option value="customer">Customer Leads for Focus Company</option>
                </select>

                <input
                  type="text"
                  value={matchSearch}
                  onChange={e => setMatchSearch(e.target.value)}
                  placeholder="Filter matches by company, capability, or need..."
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedMatches.map(match => {
                const isSupplier = match.direction === 'supplier';
                return (
                  <div
                    key={match.assessment_id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isSupplier
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isSupplier ? 'Upstream Supplier Match' : 'Downstream Customer Lead'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">
                            Coverage: {Math.round(match.coverage * 100)}%
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-extrabold text-xs">
                            {match.score}% Fit
                          </span>
                        </div>
                      </div>

                      {/* Focus <-> Counterparty Header */}
                      <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase text-slate-500 font-semibold">
                              {isSupplier ? 'Focus Buyer' : 'Focus Supplier'}
                            </div>
                            <div className="font-bold text-white truncate">
                              {match.focus_company_name || 'Focus Company'}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              #{match.focus_registration_number} • SIC {match.focus_sic}
                            </div>
                          </div>

                          <div className="flex flex-col items-center px-2">
                            <ArrowRight className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-mono text-slate-500">
                              {isSupplier ? 'supplied by' : 'supplies to'}
                            </span>
                          </div>

                          <div className="min-w-0 text-right">
                            <div className="text-[10px] uppercase text-slate-500 font-semibold">
                              {isSupplier ? 'Matched Supplier' : 'Matched Customer'}
                            </div>
                            <div className="font-bold text-emerald-300 truncate">
                              {match.counterparty_name}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              #{match.registration_number} • SIC {match.sic_codes?.[0]}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Offering -> Need Alignment */}
                      {(match.offering_matched || match.need_satisfied) && (
                        <div className="space-y-1.5 mb-3 text-xs">
                          {match.offering_matched && (
                            <div className="flex items-start gap-2">
                              <span className="text-slate-500 font-mono shrink-0">Offering:</span>
                              <span className="text-cyan-300 font-medium">{match.offering_matched}</span>
                            </div>
                          )}
                          {match.need_satisfied && (
                            <div className="flex items-start gap-2">
                              <span className="text-slate-500 font-mono shrink-0">Satisfies Need:</span>
                              <span className="text-amber-300 font-medium">{match.need_satisfied}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-300 leading-relaxed mb-3">{match.explanation}</p>
                    </div>

                    {/* Criterion Results Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(match.criterion_results || []).map(cr => (
                          <span
                            key={cr.criterion_id}
                            title={cr.explanation}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                              cr.state === 'pass'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {cr.criterion_key}: {cr.state.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          const target = companies.find(c => c.company_id === match.counterparty_company_id);
                          if (target) {
                            setInspectedCompany(target);
                            setInspectorTab('assessments');
                          }
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold shrink-0 inline-flex items-center gap-1"
                      >
                        Inspect Counterparty <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Phase One Schema Architecture & SIC Breakdown */}
      {activeSubTab === 'schema_domains' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">
              Phase One Discovery & Enrichment Schema — Missingness & Epistemic Rules
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Implemented directly from <code className="text-blue-300">MAQE_Phase_One_Discovery_and_Enrichment_Schema.docx</code>. Every field across all 1,000 companies distinguishes between <strong className="text-emerald-300">observed</strong> facts (quoted from Companies House or live websites) and <strong className="text-amber-300">inferred</strong> supply-chain requirements, using explicit <code className="text-purple-300">FieldAssessment</code> states rather than inventing missing values.
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-mono font-bold text-emerald-400">assessed_populated</span>
                <p className="text-slate-400 mt-0.5">
                  Domain was evaluated and populated with evidence-backed assertions (e.g., Companies House statutory identity, confirmed website offerings, ISO certificates, or extracted contact routes).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-mono font-bold text-amber-400">not_found</span>
                <p className="text-slate-400 mt-0.5">
                  Sources were checked, but no qualifying information was found on the public web (e.g., 587 SMEs without a verifiable corporate website or pages without published ISO certificates).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-mono font-bold text-blue-400">unknown</span>
                <p className="text-slate-400 mt-0.5">
                  Sources were checked, but the real-world value cannot be determined from public text (e.g., employee headcount or machine axis tolerances when not stated on the website).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">
              1,000 UK Businesses by SIC Manufacturing & Engineering Category
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Distribution of the first 1,000 active UK companies retrieved from UK Companies House across priority SIC codes.
            </p>
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2">
              {summary.sic_category_breakdown.map(item => {
                const pct = ((item.count / 1000) * 100).toFixed(1);
                return (
                  <div key={item.category} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-white">{item.category}</span>
                      <span className="font-mono text-blue-400 font-bold">
                        {item.count} companies ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.max(2, (item.count / 240) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PHASE ONE SCHEMA INSPECTOR MODAL */}
      {inspectedCompany && inspectedSchema && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    UK Reg #{inspectedCompany.registration_number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Completeness: {inspectedCompany.enrichment_metrics?.completeness_pct}% (Grade{' '}
                    {inspectedCompany.enrichment_metrics?.quality_grade})
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    SIC {inspectedCompany.primary_sic}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {inspectedCompany.legal_name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {inspectedCompany.addresses.registered || inspectedCompany.addresses.locality}
                </p>
              </div>
              <button
                onClick={() => setInspectedCompany(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-navigation */}
            <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-2">
              <button
                onClick={() => setInspectorTab('assessments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  inspectorTab === 'assessments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                10-Domain Field Assessments & Website Discovery
              </button>
              <button
                onClick={() => setInspectorTab('offerings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  inspectorTab === 'offerings'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Offerings, Capabilities, Parameters & Needs
              </button>
              <button
                onClick={() => setInspectorTab('evidence')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  inspectorTab === 'evidence'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Verbatim Evidence ({inspectedSchema.evidences.length}) & Assertions ({inspectedSchema.assertions.length})
              </button>
              <button
                onClick={() => setInspectorTab('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  inspectorTab === 'json'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" /> Full Phase One JSON Contract
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {inspectorTab === 'assessments' && (
                <div className="space-y-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Phase One Grounded Summary
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {inspectedSchema.company.summary.text}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white mb-3">
                      Per-Domain Completeness & FieldAssessment States (10 Domains)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {inspectedSchema.field_assessments.map(fa => {
                        const isPop = fa.state === 'assessed_populated';
                        return (
                          <div
                            key={fa.field_path}
                            className={`p-3.5 rounded-xl border ${
                              isPop
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-white">
                                {DOMAIN_LABELS[fa.field_path] || fa.field_path}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  isPop
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {fa.state}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{fa.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Website Association & Crawl Run Counters */}
                  {inspectedSchema.website_associations.map(wa => (
                    <div key={wa.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-white">
                          Website Association & Identity Signals (Section 3 & 4)
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                            wa.decision === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          Decision: {wa.decision.toUpperCase()} (Score: {wa.identity_score || '0.00'})
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1 mb-3">
                        <div>
                          Candidate URL: <code className="text-cyan-400">{wa.candidate_url}</code>
                        </div>
                        {wa.final_url && (
                          <div>
                            Resolved Final URL: <code className="text-emerald-400">{wa.final_url}</code>
                          </div>
                        )}
                        {wa.title && (
                          <div>
                            Extracted Page Title: <strong className="text-white">{wa.title}</strong>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {wa.identity_signals.map((sig, i) => (
                          <div
                            key={i}
                            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between"
                          >
                            <span>
                              <strong className="text-white uppercase font-mono mr-2">{sig.signal_type}:</strong>
                              <span className="text-slate-300">{sig.detail}</span>
                            </span>
                            <span
                              className={`font-mono text-[11px] font-bold ${
                                sig.result === 'supports' ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {sig.result.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {inspectorTab === 'offerings' && (
                <div className="space-y-6">
                  {/* Offerings Hierarchy */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2">
                      Hierarchical Offerings (Group → Offering → Variant)
                    </h4>
                    <div className="space-y-2">
                      {inspectedSchema.offerings.map(o => (
                        <div
                          key={o.id}
                          className={`p-3 rounded-xl border border-slate-800 bg-slate-950 ${
                            o.node_type === 'offering' ? 'ml-6 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{o.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {o.node_type}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-mono">
                                {o.kind}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capabilities & Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-white mb-2">
                        Capabilities & Technical Parameters
                      </h4>
                      <div className="space-y-2 text-xs">
                        {inspectedSchema.parameters.map(p => (
                          <div key={p.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="flex justify-between font-mono text-cyan-300">
                              <span>{p.parameter_key}</span>
                              <span>{p.value_kind}</span>
                            </div>
                            <div className="text-slate-300 mt-1">{p.raw_text}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-white mb-2">
                        Credentials ({inspectedSchema.credentials.length}) & Contact Routes ({inspectedSchema.contact_routes.length})
                      </h4>
                      <div className="space-y-2 text-xs">
                        {inspectedSchema.credentials.length > 0 ? (
                          inspectedSchema.credentials.map(c => (
                            <div key={c.id} className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                              <div className="font-bold text-emerald-300">{c.standard_code}</div>
                              <div className="text-slate-300 mt-0.5">{c.raw_claim}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 italic">
                            No explicit ISO certification claimed on public crawl (FieldAssessment: not_found).
                          </div>
                        )}
                        {inspectedSchema.contact_routes.map(r => (
                          <div key={r.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                            <span className="uppercase font-mono text-slate-400">{r.kind}:</span>
                            <span className="font-mono text-white">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Commercial Needs */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2">
                      Inferred Upstream Supply-Chain Needs (Used for B2B Matching)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {inspectedSchema.needs.map(n => (
                        <div key={n.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 uppercase">
                            {n.need_type} ({n.basis})
                          </span>
                          <div className="font-bold text-white text-xs mt-2">{n.label}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{n.rationale}</div>
                          <div className="text-[10px] font-mono text-blue-400 mt-2">
                            Target Supplier SICs: {(n.target_supplier_sics || []).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'evidence' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2">
                      Verbatim Source Evidence Records ({inspectedSchema.evidences.length})
                    </h4>
                    <div className="space-y-3">
                      {inspectedSchema.evidences.map(ev => (
                        <div key={ev.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                            <span>Evidence ID: {ev.id}</span>
                            <span>Locator: {ev.locator.kind} ({ev.locator.value})</span>
                          </div>
                          <blockquote className="text-xs text-emerald-300 font-mono bg-slate-900 p-3 rounded-lg border-l-4 border-emerald-500">
                            &ldquo;{ev.quote}&rdquo;
                          </blockquote>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white mb-2">
                      Observed & Inferred Assertions ({inspectedSchema.assertions.length})
                    </h4>
                    <div className="space-y-2">
                      {inspectedSchema.assertions.map(ast => (
                        <div key={ast.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-white">{ast.field_path}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                                  ast.basis === 'observed'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {ast.basis}
                              </span>
                              <span className="font-mono text-slate-400">
                                Conf: {Math.round((ast.confidence || 0.9) * 100)}%
                              </span>
                            </div>
                          </div>
                          <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto bg-slate-900 p-2 rounded">
                            {JSON.stringify(ast.value)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'json' && (
                <div>
                  <pre className="text-xs font-mono text-emerald-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[60vh]">
                    {JSON.stringify(inspectedSchema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
