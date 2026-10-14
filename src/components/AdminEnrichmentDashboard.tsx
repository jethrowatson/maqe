'use client';

import React, { useState, useMemo } from 'react';
import {
  CompanyRecord,
  AdminEnrichmentSummary,
  PhaseOneCompanySchema,
  MatchCandidateResult,
  MatchDirection,
  CompletenessBand
} from '../lib/domain/types';
import { store, CompanyDatasetFilterOptions } from '../lib/db/store';
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
  Award,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Network,
  FileText,
  Activity,
  RefreshCw,
  AlertTriangle,
  Clock,
  Check
} from 'lucide-react';

interface AdminEnrichmentDashboardProps {
  summary: AdminEnrichmentSummary;
  companies: CompanyRecord[];
  allMatches: MatchCandidateResult[];
  getPhaseOneSchema: (companyId: string) => PhaseOneCompanySchema | undefined;
  runMatchesForCompany: (companyId: string, direction: MatchDirection) => MatchCandidateResult[];
  onSelectFocusCompanyInLab?: (companyId: string) => void;
  onNavigateOperatorTab?: (tab: string) => void;
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
  onSelectFocusCompanyInLab,
  onNavigateOperatorTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'companies' | 'matching' | 'schema_domains'>('companies');
  const [refreshTick, setRefreshTick] = useState(0);

  // Prompt 5: Full Company Dataset Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sicCodeFilter, setSicCodeFilter] = useState<string>('all');
  const [sicCategoryFilter, setSicCategoryFilter] = useState<string>('all');
  const [extractedOfferingQuery, setExtractedOfferingQuery] = useState('');
  const [postcodeOrLocality, setPostcodeOrLocality] = useState('');
  const [candidateWebFilter, setCandidateWebFilter] =
    useState<NonNullable<CompanyDatasetFilterOptions['candidate_website_filter']>>('all');
  const [confidenceFilter, setConfidenceFilter] =
    useState<NonNullable<CompanyDatasetFilterOptions['confidence_filter']>>('all');
  const [companyStatusFilter, setCompanyStatusFilter] =
    useState<NonNullable<CompanyDatasetFilterOptions['company_status']>>('all');
  const [discoveryStatusFilter, setDiscoveryStatusFilter] =
    useState<NonNullable<CompanyDatasetFilterOptions['discovery_status']>>('all');
  const [enrichmentStatusFilter, setEnrichmentStatusFilter] =
    useState<NonNullable<CompanyDatasetFilterOptions['enrichment_status']>>('all');
  const [completenessBandFilter, setCompletenessBandFilter] =
    useState<'all' | CompletenessBand>('all');
  const [reassessmentFilter, setReassessmentFilter] =
    useState<NonNullable<CompanyDatasetFilterOptions['reassessment_filter']>>('all');

  const [sortBy, setSortBy] = useState<
    'completeness_desc' | 'confidence_desc' | 'completeness_asc' | 'name_asc'
  >('completeness_desc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Prompt 5: Comprehensive 7-Tab Company Detail Dossier Modal
  const [inspectedCompanyId, setInspectedCompanyId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<
    | 'overview'
    | 'candidate_websites'
    | 'enrichment'
    | 'matching_profile'
    | 'matches'
    | 'history'
    | 'json'
  >('overview');
  const [dossierActionBanner, setDossierActionBanner] = useState<string | null>(null);

  const dbInfo = store.getDatabaseConnectionInfo();
  const discoverySummary = store.discoveryEngine.getDiscoverySummary();
  const enrichmentStats = store.enrichmentEngine.getEnrichmentControlStats();
  const matchingSummary = store.matchingEngine.getMatchingPipelineSummary();
  const totalJobsCount = store.jobEngine.getJobs().length;

  const uniqueSics = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of companies) {
      if (c.primary_sic && !map.has(c.primary_sic)) {
        map.set(c.primary_sic, c.sic_description || c.primary_sic);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [companies, refreshTick]);

  const filteredCompanies = useMemo(() => {
    const list = store.queryCompanyDataset({
      search: searchQuery,
      sic_code: sicCodeFilter,
      sic_category: sicCategoryFilter,
      extracted_offering_query: extractedOfferingQuery,
      postcode_or_locality: postcodeOrLocality,
      candidate_website_filter: candidateWebFilter,
      confidence_filter: confidenceFilter,
      company_status: companyStatusFilter,
      discovery_status: discoveryStatusFilter,
      enrichment_status: enrichmentStatusFilter,
      completeness_band: completenessBandFilter,
      reassessment_filter: reassessmentFilter
    });

    return [...list].sort((a, b) => {
      const ma = a.enrichment_metrics!;
      const mb = b.enrichment_metrics!;
      if (sortBy === 'completeness_desc') {
        return mb.completeness_pct - ma.completeness_pct || mb.quality_score - ma.quality_score;
      }
      if (sortBy === 'confidence_desc') {
        const ca = Math.max(0, ...(a.candidate_websites || []).map(w => w.confidence_score));
        const cb = Math.max(0, ...(b.candidate_websites || []).map(w => w.confidence_score));
        return cb - ca || mb.completeness_pct - ma.completeness_pct;
      }
      if (sortBy === 'completeness_asc') {
        return ma.completeness_pct - mb.completeness_pct;
      }
      return (a.display_name || a.legal_name).localeCompare(b.display_name || b.legal_name);
    });
  }, [
    companies,
    refreshTick,
    searchQuery,
    sicCodeFilter,
    sicCategoryFilter,
    extractedOfferingQuery,
    postcodeOrLocality,
    candidateWebFilter,
    confidenceFilter,
    companyStatusFilter,
    discoveryStatusFilter,
    enrichmentStatusFilter,
    completenessBandFilter,
    reassessmentFilter,
    sortBy
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, page]);

  const inspectedCompany = useMemo(() => {
    if (!inspectedCompanyId) return null;
    return store.getCompany(inspectedCompanyId) || null;
  }, [inspectedCompanyId, refreshTick]);

  const inspectedSchema = useMemo(() => {
    if (!inspectedCompany) return undefined;
    return getPhaseOneSchema(inspectedCompany.company_id);
  }, [inspectedCompany, getPhaseOneSchema, refreshTick]);

  const inspectedMatchingProfile = useMemo(() => {
    if (!inspectedCompany) return undefined;
    return store.getMatchingProfileAnalysis(inspectedCompany.company_id);
  }, [inspectedCompany, refreshTick]);

  const inspectedSupplierMatches = useMemo(() => {
    if (!inspectedCompany) return [];
    return runMatchesForCompany(inspectedCompany.company_id, 'supplier');
  }, [inspectedCompany, runMatchesForCompany, refreshTick]);

  const inspectedCustomerMatches = useMemo(() => {
    if (!inspectedCompany) return [];
    return runMatchesForCompany(inspectedCompany.company_id, 'customer');
  }, [inspectedCompany, runMatchesForCompany, refreshTick]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSicCodeFilter('all');
    setSicCategoryFilter('all');
    setExtractedOfferingQuery('');
    setPostcodeOrLocality('');
    setCandidateWebFilter('all');
    setConfidenceFilter('all');
    setCompanyStatusFilter('all');
    setDiscoveryStatusFilter('all');
    setEnrichmentStatusFilter('all');
    setCompletenessBandFilter('all');
    setReassessmentFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Honest Pipeline KPI Banner (Prompt 1 & Prompt 5) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SHARED DATA FOUNDATION ACTIVE ({dbInfo.mode.toUpperCase()})
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Schema: {summary.schema_version}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Approval Threshold: {Math.round(enrichmentStats.approval_threshold * 100)}% Confidence
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Company Dataset & Pipeline Intelligence Console
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Canonical operator view separating <strong className="text-white">Companies ({companies.length.toLocaleString()})</strong>,{' '}
              <strong className="text-white">Candidate Websites ({discoverySummary.total_candidate_websites_stored.toLocaleString()})</strong>,{' '}
              <strong className="text-white">Website-Enriched Profiles ({enrichmentStats.website_enriched_companies_count.toLocaleString()})</strong>,{' '}
              <strong className="text-white">Matching Profiles ({matchingSummary.matching_profiles_current.toLocaleString()})</strong>,{' '}
              <strong className="text-white">Directional Connections ({matchingSummary.total_connections_stored.toLocaleString()})</strong>, and{' '}
              <strong className="text-white">Jobs ({totalJobsCount})</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubTab('companies')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeSubTab === 'companies'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-4 h-4" />
              Company Dataset ({filteredCompanies.length}/{companies.length})
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
              Completeness & Schema Breakdown
            </button>
          </div>
        </div>

        {/* 6 Honest, Explicitly Defined Executive KPI Cards (Prompt 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mt-6">
          {/* Card 1: Companies Ingested */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>1. Registry Companies</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {companies.length.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1.5">companies</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              <span className="text-amber-300 font-semibold">
                {enrichmentStats.pending_reassessment_count} flagged
              </span>{' '}
              for registry change review • 42 SIC duplicates skipped
            </div>
          </div>

          {/* Card 2: Candidate Websites (1:N) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>2. Candidate Websites</span>
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {discoverySummary.total_candidate_websites_stored.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1.5">websites</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Across <strong className="text-white">{discoverySummary.companies_with_candidates}</strong> companies (
              <span className="text-cyan-300">{discoverySummary.companies_with_multiple_candidates} multi-site</span>) •{' '}
              <strong className="text-slate-300">{discoverySummary.companies_completed_no_website_found}</strong> no website found
            </div>
          </div>

          {/* Card 3: Auto-Approved via Threshold */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>3. Approved Websites</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {discoverySummary.approved_candidates_count.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1.5">approved</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Auto-approved via <strong className="text-white">&ge;{Math.round(enrichmentStats.approval_threshold * 100)}% threshold</strong> across{' '}
              <strong className="text-white">
                {enrichmentStats.website_enriched_companies_count + enrichmentStats.eligible_awaiting_enrichment_count}
              </strong>{' '}
              companies ({discoverySummary.below_threshold_candidates_count} held &lt;{Math.round(enrichmentStats.approval_threshold * 100)}%)
            </div>
          </div>

          {/* Card 4: Website-Enriched vs Unenriched Companies */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>4. Website-Enriched</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {enrichmentStats.website_enriched_companies_count.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1.5">companies</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              <strong className="text-amber-300">{enrichmentStats.eligible_awaiting_enrichment_count}</strong> eligible awaiting crawl •{' '}
              <strong className="text-slate-300">{enrichmentStats.unenriched_companies_count}</strong> total unenriched (registry-only)
            </div>
          </div>

          {/* Card 5: Completeness Bands */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>5. Completeness Bands</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-300 font-mono">
              {enrichmentStats.avg_enriched_completeness_pct}%
              <span className="text-xs font-normal text-slate-400 ml-1.5">avg enriched</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              &ge;80%: <strong className="text-emerald-400">{enrichmentStats.completeness_bands.band_80_plus}</strong> • 50–79%:{' '}
              <strong className="text-blue-300">{enrichmentStats.completeness_bands.band_50_to_79}</strong> • &lt;50%:{' '}
              <strong className="text-amber-300">{enrichmentStats.completeness_bands.band_below_50}</strong>
            </div>
          </div>

          {/* Card 6: Matching Profiles, Connections & Jobs */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>6. Matching & Jobs</span>
              <Network className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono">
              {matchingSummary.companies_with_matches}
              <span className="text-xs font-normal text-slate-400 ml-1.5">matched cos</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              <strong className="text-white">{matchingSummary.total_connections_stored}</strong> connections (
              {matchingSummary.supplier_connections_count} sup / {matchingSummary.customer_connections_count} cust) •{' '}
              <strong className="text-emerald-300">{totalJobsCount} jobs</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: EXTENDED COMPANY DATASET (Prompt 5) */}
      {activeSubTab === 'companies' && (
        <div className="space-y-4">
          {/* Comprehensive Multi-Dimension Dataset Filter Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Company Dataset Search & Multi-Stage Pipeline Filters
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                  Showing {filteredCompanies.length} of {companies.length} companies
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setReassessmentFilter('any_pending');
                    setPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                >
                  Flagged for Reassessment ({enrichmentStats.pending_reassessment_count})
                </button>
                <button
                  onClick={() => {
                    setCandidateWebFilter('multiple_candidates');
                    setPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100"
                >
                  Multi-Website Companies ({discoverySummary.companies_with_multiple_candidates})
                </button>
                <button
                  onClick={resetAllFilters}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Reset All Filters
                </button>
              </div>
            </div>

            {/* Row 1: Text Searches (Name/Reg, Extracted Website Offering, Postcode/Locality, Registry SIC) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Company Name / Reg # / Previous Name
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="e.g. Regent Engineering, 00551421..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-700 uppercase mb-1">
                  Enriched Website Offering / Product
                </label>
                <input
                  type="text"
                  value={extractedOfferingQuery}
                  onChange={e => {
                    setExtractedOfferingQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. presswork, CNC, sheet metal, laser..."
                  className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  UK Postcode or Locality
                </label>
                <input
                  type="text"
                  value={postcodeOrLocality}
                  onChange={e => {
                    setPostcodeOrLocality(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. WS10, B1, Birmingham, Sheffield..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Registry SIC Code (Companies House)
                </label>
                <select
                  value={sicCodeFilter}
                  onChange={e => {
                    setSicCodeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="all">All Priority SIC Codes ({uniqueSics.length})</option>
                  {uniqueSics.map(([code, desc]) => (
                    <option key={code} value={code}>
                      SIC {code} — {desc.slice(0, 42)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Pipeline Status, Candidate Websites, Confidence, Completeness Band & Reassessment Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Registry Sector
                </label>
                <select
                  value={sicCategoryFilter}
                  onChange={e => {
                    setSicCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="all">All SIC Sectors</option>
                  {summary.sic_category_breakdown.map(b => (
                    <option key={b.category} value={b.category}>
                      {b.category} ({b.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Candidate Websites
                </label>
                <select
                  value={candidateWebFilter}
                  onChange={e => {
                    setCandidateWebFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="all">All Website States</option>
                  <option value="has_candidates">Has Candidate Websites ({discoverySummary.companies_with_candidates})</option>
                  <option value="multiple_candidates">Multiple Websites ({discoverySummary.companies_with_multiple_candidates})</option>
                  <option value="dissimilar_corroborated">Dissimilar Domain Corroborated</option>
                  <option value="no_website_found">No Website Found ({discoverySummary.companies_completed_no_website_found})</option>
                  <option value="unprocessed">Discovery Unprocessed ({discoverySummary.companies_unprocessed})</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Website Confidence
                </label>
                <select
                  value={confidenceFilter}
                  onChange={e => {
                    setConfidenceFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="all">Any Confidence</option>
                  <option value="gte_85">&ge; 85% High Confidence</option>
                  <option value="gte_70">&ge; 70% Approved Threshold</option>
                  <option value="below_70">&lt; 70% Held Below Threshold</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Discovery Status
                </label>
                <select
                  value={discoveryStatusFilter}
                  onChange={e => {
                    setDiscoveryStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="all">All Discovery States</option>
                  <option value="completed_with_candidates">Completed (With Candidates)</option>
                  <option value="completed_no_website_found">Completed (No Website Found)</option>
                  <option value="unprocessed">Unprocessed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Enrichment Status
                </label>
                <select
                  value={enrichmentStatusFilter}
                  onChange={e => {
                    setEnrichmentStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="all">All Enrichment States</option>
                  <option value="completed">Completed</option>
                  <option value="partial">Partial (Sparse Site)</option>
                  <option value="unprocessed">Eligible Unprocessed ({enrichmentStats.eligible_awaiting_enrichment_count})</option>
                  <option value="awaiting_approved_candidate">Blocked (No Approved Website)</option>
                  <option value="failed">Failed Crawl</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Completeness Band
                </label>
                <select
                  value={completenessBandFilter}
                  onChange={e => {
                    setCompletenessBandFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="all">All Completeness Bands</option>
                  <option value="band_80_plus">&ge; 80% Complete ({enrichmentStats.completeness_bands.band_80_plus})</option>
                  <option value="band_50_to_79">50–79% Complete ({enrichmentStats.completeness_bands.band_50_to_79})</option>
                  <option value="band_below_50">&lt; 50% Complete ({enrichmentStats.completeness_bands.band_below_50})</option>
                  <option value="unenriched">Unenriched ({enrichmentStats.completeness_bands.unenriched})</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
                  Reassessment / Status
                </label>
                <select
                  value={reassessmentFilter}
                  onChange={e => {
                    setReassessmentFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-amber-50/50 border border-amber-300 rounded-lg"
                >
                  <option value="all">All Reassessment States</option>
                  <option value="any_pending">Any Pending Reassessment</option>
                  <option value="name_change">Name Change Reassessment</option>
                  <option value="discovery_pending">Discovery Reassessment Pending</option>
                  <option value="enrichment_pending">Enrichment Reassessment Pending</option>
                  <option value="matching_profile_pending">Matching Profile Pending</option>
                  <option value="matching_pending">Matching Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dataset Table distinguishing Registry vs Enriched Labels & Independent Pipeline States */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Company & UK Reg #</th>
                    <th className="py-3.5 px-3">Registry SIC vs Enriched Offerings</th>
                    <th className="py-3.5 px-3">Candidate Websites & Confidence</th>
                    <th className="py-3.5 px-3">Enrichment & Completeness Band</th>
                    <th className="py-3.5 px-3">Matching Profile & Connections</th>
                    <th className="py-3.5 px-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {paginatedCompanies.map(c => {
                    const m = c.enrichment_metrics!;
                    const ps = c.pipeline_state;
                    const cands = c.candidate_websites || [];
                    const maxConf = cands.length > 0 ? Math.max(...cands.map(w => w.confidence_score)) : 0;
                    const approvedCands = cands.filter(
                      w =>
                        w.approval_state === 'approved_auto_threshold' ||
                        w.approval_state === 'approved_operator'
                    );
                    const hasReassessment =
                      ps?.source_change_status === 'changed_pending_review' ||
                      ps?.reassessment_flags.discovery_pending ||
                      ps?.reassessment_flags.enrichment_pending ||
                      ps?.reassessment_flags.matching_profile_pending;
                    const schema = m.is_website_enriched ? getPhaseOneSchema(c.company_id) : undefined;
                    const extractedOfferings =
                      schema?.offerings.filter(o => o.node_type !== 'group').map(o => o.name) || [];

                    return (
                      <tr key={c.company_id} className="hover:bg-slate-50/90 transition-colors">
                        {/* Column 1: Company & Reg # */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{c.legal_name}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          {c.previous_names && c.previous_names.length > 0 && (
                            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                              Formerly: {c.previous_names[0]}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                            <span className="text-blue-700 font-semibold">#{c.registration_number}</span>
                            <span>•</span>
                            <span>
                              {c.addresses.locality || 'UK'} {c.addresses.postal_code || ''}
                            </span>
                          </div>
                          {hasReassessment && (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Reassessment Pending ({ps?.reassessment_flags.policy_flag || 'registry_change'})
                            </div>
                          )}
                        </td>

                        {/* Column 2: Registry SIC vs Enriched Website Offerings (Prompt 5 requirement) */}
                        <td className="py-3.5 px-3 align-top max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
                              REGISTRY SIC {c.primary_sic}
                            </span>
                            <span className="text-[11px] font-medium text-slate-800 truncate">
                              {c.sic_category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {c.sic_description}
                          </div>

                          <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                            {m.is_website_enriched ? (
                              <div>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200 mr-1.5">
                                  WEBSITE EXTRACTED
                                </span>
                                <span className="text-[11px] text-slate-800 font-medium">
                                  {extractedOfferings.slice(0, 2).join(', ') || 'Products & Services Extracted'}
                                </span>
                              </div>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-slate-100 text-slate-500">
                                Unenriched — Registry Classification Only
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Column 3: Candidate Websites & Confidence */}
                        <td className="py-3.5 px-3 align-top">
                          {ps?.discovery_status === 'completed_with_candidates' && cands.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                                  {cands.length} Candidate{cands.length > 1 ? 's' : ''} ({approvedCands.length} Approved)
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    maxConf >= 0.70
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  Max {Math.round(maxConf * 100)}%
                                </span>
                              </div>
                              <div className="text-[11px] text-blue-600 font-mono truncate max-w-[200px]">
                                {cands[0].canonical_domain}
                                {cands.length > 1 ? ` +${cands.length - 1} more` : ''}
                              </div>
                              {cands.some(cw => cw.score_breakdown.dissimilar_domain_corroborated) && (
                                <div className="text-[10px] text-indigo-700 font-semibold">
                                  ✓ Dissimilar domain corroborated on page
                                </div>
                              )}
                            </div>
                          ) : ps?.discovery_status === 'completed_no_website_found' ? (
                            <div>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Completed: No Website Found
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">0 candidate websites</div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Discovery Unprocessed
                            </span>
                          )}
                        </td>

                        {/* Column 4: Enrichment & Completeness Band */}
                        <td className="py-3.5 px-3 align-top">
                          {m.is_website_enriched ? (
                            <div className="w-36">
                              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                <span
                                  className={
                                    m.completeness_band === 'band_80_plus'
                                      ? 'text-emerald-700'
                                      : m.completeness_band === 'band_50_to_79'
                                      ? 'text-blue-700'
                                      : 'text-amber-700'
                                  }
                                >
                                  {m.completeness_pct}% ({ps?.enrichment_status})
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  v{c.enrichment_revision || 1}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    m.completeness_band === 'band_80_plus'
                                      ? 'bg-emerald-500'
                                      : m.completeness_band === 'band_50_to_79'
                                      ? 'bg-blue-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${m.completeness_pct}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                Band:{' '}
                                {m.completeness_band === 'band_80_plus'
                                  ? '>= 80%'
                                  : m.completeness_band === 'band_50_to_79'
                                  ? '50–79%'
                                  : '< 50%'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Unenriched
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {ps?.enrichment_status === 'unprocessed'
                                  ? 'Eligible — awaiting crawl'
                                  : 'Awaiting approved website'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Column 5: Matching Profile & Connections */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="space-y-1">
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ps?.matching_profile_status === 'current'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : ps?.matching_profile_status === 'stale_needs_reassessment'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                    : ps?.matching_profile_status === 'insufficient_evidence'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                Profile: {ps?.matching_profile_status || 'awaiting_enrichment'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Match Status:{' '}
                              <strong className="text-slate-700">
                                {ps?.matching_status || 'awaiting_profile_analysis'}
                              </strong>
                            </div>
                          </div>
                        </td>

                        {/* Column 6: Inspect Full Dossier */}
                        <td className="py-3.5 px-4 align-top text-right">
                          <button
                            onClick={() => {
                              setInspectedCompanyId(c.company_id);
                              setInspectorTab('overview');
                              setDossierActionBanner(null);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing{' '}
                <span className="font-bold text-slate-900">
                  {filteredCompanies.length === 0 ? 0 : (page - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-900">
                  {Math.min(page * pageSize, filteredCompanies.length)}
                </span>{' '}
                of <span className="font-bold text-slate-900">{filteredCompanies.length}</span> matching companies
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-semibold">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: COMPLETENESS BANDS & SCHEMA DOMAINS */}
      {activeSubTab === 'schema_domains' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Website Enrichment Completeness Bands (Prompt 6)
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Completeness is calculated strictly across the{' '}
              <strong className="text-slate-800">{enrichmentStats.website_enriched_companies_count}</strong>{' '}
              companies with crawled website enrichment. The{' '}
              <strong className="text-slate-800">{enrichmentStats.unenriched_companies_count}</strong>{' '}
              registry-only companies are reported separately as Unenriched.
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">Band 1: &ge; 80% Schema Completeness</div>
                  <div className="text-[11px] text-emerald-700">
                    Multi-page website crawl populated 8–10 schema domains with verified offerings & capabilities
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono text-emerald-800">
                  {enrichmentStats.completeness_bands.band_80_plus}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900">Band 2: 50% – 79% Schema Completeness</div>
                  <div className="text-[11px] text-blue-700">
                    Website crawl populated 5–7 schema domains; some technical parameters or ISO certs not published
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono text-blue-800">
                  {enrichmentStats.completeness_bands.band_50_to_79}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900">Band 3: &lt; 50% Schema Completeness</div>
                  <div className="text-[11px] text-amber-700">
                    Sparse brochure websites where fewer than 5 schema domains could be populated
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono text-amber-800">
                  {enrichmentStats.completeness_bands.band_below_50}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Separate Count: Unenriched Companies</div>
                  <div className="text-[11px] text-slate-600">
                    {enrichmentStats.eligible_awaiting_enrichment_count} eligible awaiting crawl +{' '}
                    {enrichmentStats.blocked_no_approved_candidate_count} with no approved website
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono text-slate-800">
                  {enrichmentStats.completeness_bands.unenriched}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              10 Phase One Schema Domains Coverage
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Every domain records an explicit <code className="text-purple-700 font-mono">FieldAssessment</code> state when not found on crawled pages.
            </p>
            <div className="space-y-3">
              {Object.entries(summary.domain_completion_counts).map(([domainKey, count]) => {
                const label = DOMAIN_LABELS[domainKey] || domainKey;
                const pct = Math.round((count / summary.total_companies_found) * 100);
                return (
                  <div key={domainKey}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800">{label}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {count.toLocaleString()} / {summary.total_companies_found} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PROMPT 5: COMPREHENSIVE 7-TAB COMPANY DETAIL DOSSIER MODAL */}
      {inspectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    UK Reg #{inspectedCompany.registration_number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {inspectedCompany.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300">
                    SIC {inspectedCompany.primary_sic} ({inspectedCompany.sic_category})
                  </span>
                  {inspectedCompany.enrichment_metrics?.is_website_enriched ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Website-Enriched ({inspectedCompany.enrichment_metrics.completeness_pct}% • v{inspectedCompany.enrichment_revision || 1})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-700 text-slate-300">
                      Unenriched (Registry Only)
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mt-1.5">{inspectedCompany.legal_name}</h2>
                {inspectedCompany.previous_names && inspectedCompany.previous_names.length > 0 && (
                  <p className="text-xs text-amber-300 mt-0.5">
                    Previous Legal Name(s): {inspectedCompany.previous_names.join(', ')}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  Registered Address: {inspectedCompany.addresses.registered}
                </p>
              </div>
              <button
                onClick={() => setInspectedCompanyId(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dossierActionBanner && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-semibold text-emerald-900 flex items-center justify-between">
                <span>{dossierActionBanner}</span>
                <button onClick={() => setDossierActionBanner(null)} className="text-emerald-700 font-bold">
                  ✕
                </button>
              </div>
            )}

            {/* 7-Tab Navigation Bar */}
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'overview', label: '1. Registry & Pipeline State' },
                {
                  id: 'candidate_websites',
                  label: `2. Candidate Websites (${(inspectedCompany.candidate_websites || []).length})`
                },
                { id: 'enrichment', label: '3. Website Enrichment & Schema' },
                { id: 'matching_profile', label: '4. Matching Profile Analysis' },
                {
                  id: 'matches',
                  label: `5. Generated Matches (${inspectedSupplierMatches.length + inspectedCustomerMatches.length})`
                },
                {
                  id: 'history',
                  label: `6. Change & Audit History (${(inspectedCompany.change_history || []).length + (inspectedCompany.processing_history || []).length})`
                },
                { id: 'json', label: '7. Raw JSON' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setInspectorTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    inspectorTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50">
              {/* TAB 1: OVERVIEW & PIPELINE STATES */}
              {inspectorTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Discovery Stage</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {inspectedCompany.pipeline_state?.discovery_status}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {(inspectedCompany.candidate_websites || []).length} candidate website(s) stored
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Enrichment Stage</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {inspectedCompany.pipeline_state?.enrichment_status}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Band: {inspectedCompany.enrichment_metrics?.completeness_band} (
                        {inspectedCompany.enrichment_metrics?.completeness_pct}%)
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Matching Profile Analysis
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {inspectedCompany.pipeline_state?.matching_profile_status}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Confidence: {Math.round((inspectedMatchingProfile?.profile_confidence || 0) * 100)}%
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Directional Matching
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {inspectedCompany.pipeline_state?.matching_status}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {inspectedSupplierMatches.length} Suppliers • {inspectedCustomerMatches.length} Customers
                      </div>
                    </div>
                  </div>

                  {/* Operator Actions Bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Operator Stage Actions for {inspectedCompany.display_name || inspectedCompany.legal_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Run or refresh downstream stages without losing historical records.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const res = store.enrichmentEngine.enrichCompany(inspectedCompany.company_id, {
                            trigger_reason: 'Manual operator re-enrichment from Company Dossier'
                          });
                          setRefreshTick(t => t + 1);
                          setDossierActionBanner(
                            res.success
                              ? `Re-enrichment completed (v${res.revision?.revision_number}, ${res.revision?.completeness_pct}% completeness). Downstream Matching Profile marked for reassessment.`
                              : res.error_message || 'Enrichment blocked'
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Run / Re-Run Website Enrichment
                      </button>
                      <button
                        onClick={() => {
                          const mp = store.matchingEngine.generateMatchingProfileAnalysis(
                            inspectedCompany.company_id
                          );
                          setRefreshTick(t => t + 1);
                          setDossierActionBanner(
                            `Matching Profile Analysis refreshed: status = ${mp?.status} (${mp?.inferred_supplier_criteria.length} supplier criteria, ${mp?.inferred_customer_criteria.length} customer criteria).`
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Refresh Matching Profile Analysis
                      </button>
                      {onSelectFocusCompanyInLab && (
                        <button
                          onClick={() => {
                            onSelectFocusCompanyInLab(inspectedCompany.company_id);
                            setInspectedCompanyId(null);
                            if (onNavigateOperatorTab) onNavigateOperatorTab('matching_lab');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Open in Matching Console
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Statutory Companies House Record vs Enriched Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                          COMPANIES HOUSE SOURCE
                        </span>
                        Statutory Registry Filing
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-500">Legal Name:</span>{' '}
                          <strong className="text-slate-900">{inspectedCompany.legal_name}</strong>
                        </div>
                        {inspectedCompany.previous_names && inspectedCompany.previous_names.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-500">Previous Names:</span>{' '}
                            <span className="text-amber-800 font-semibold">
                              {inspectedCompany.previous_names.join(', ')}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-500">Company Number:</span>{' '}
                          <span className="font-mono font-bold">#{inspectedCompany.registration_number}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Incorporated:</span>{' '}
                          {inspectedCompany.incorporation_date}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">SIC Codes:</span>{' '}
                          {inspectedCompany.sic_codes.join(', ')} ({inspectedCompany.sic_description})
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Registered Office:</span>{' '}
                          {inspectedCompany.addresses.registered}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px]">
                          ENRICHED PROFILE
                        </span>
                        Website-Derived Business Description
                      </div>
                      {inspectedCompany.enrichment_metrics?.is_website_enriched ? (
                        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                          <p className="font-medium text-slate-900">
                            {inspectedSchema?.company_summary.text}
                          </p>
                          <p className="text-slate-600">
                            {inspectedCompany.detailed_business_description}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
                          This company has not yet undergone website enrichment. Only statutory Companies House data is currently stored.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CANDIDATE WEBSITES & PAGE-LEVEL EVIDENCE (Prompt 4) */}
              {inspectorTab === 'candidate_websites' && (
                <div className="space-y-4">
                  {(inspectedCompany.candidate_websites || []).length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-600">
                      Discovery status is{' '}
                      <strong className="text-slate-900">
                        {inspectedCompany.pipeline_state?.discovery_status}
                      </strong>
                      . Zero candidate websites were found for this company.
                    </div>
                  ) : (
                    (inspectedCompany.candidate_websites || []).map(cw => (
                      <div
                        key={cw.candidate_id}
                        className="bg-white p-5 rounded-xl border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-sm text-blue-700">
                                {cw.candidate_url}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {cw.source_type.replace(/_/g, ' ')}
                              </span>
                              {cw.is_primary_candidate && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  PRIMARY CANDIDATE
                                </span>
                              )}
                              {cw.score_breakdown.dissimilar_domain_corroborated && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  DISSIMILAR DOMAIN CORROBORATED BY PAGE CONTENT
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mt-1">{cw.approval_reason}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold ${
                                cw.confidence_score >= 0.70
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {Math.round(cw.confidence_score * 100)}% Confidence
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                              {cw.approval_state}
                            </span>
                            <button
                              onClick={() => {
                                store.discoveryEngine.updateDecision(
                                  cw.candidate_id,
                                  'approved',
                                  'operator_manual',
                                  'Operator manually approved candidate website in Company Dossier'
                                );
                                setRefreshTick(t => t + 1);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                store.discoveryEngine.updateDecision(
                                  cw.candidate_id,
                                  'rejected',
                                  'operator_manual',
                                  'Operator rejected candidate website in Company Dossier'
                                );
                                setRefreshTick(t => t + 1);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                        {/* Page-Level Evidence Items */}
                        <div>
                          <div className="text-[11px] font-bold uppercase text-slate-500 mb-2">
                            Page-Level Corroboration Evidence ({cw.pages_inspected.length} pages inspected:{' '}
                            {cw.pages_inspected.join(', ')})
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {cw.evidence_items.map((ev, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                              >
                                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-1">
                                  <span className="font-bold uppercase text-blue-700">
                                    {ev.page_type} ({ev.signal_type})
                                  </span>
                                  <span className="text-emerald-700 font-bold">
                                    +{Math.round(ev.weight_contribution * 100)}%
                                  </span>
                                </div>
                                <div className="text-slate-700 text-[11px] leading-snug">
                                  &ldquo;{ev.matched_text}&rdquo;
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                                  {ev.page_url}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ENRICHMENT & EXTRACTED SCHEMA (Prompt 6) */}
              {inspectorTab === 'enrichment' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        Multi-Page Website Schema Extraction (Revision v{inspectedCompany.enrichment_revision || 0})
                      </h3>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        Completeness: {inspectedCompany.enrichment_metrics?.completeness_pct}% (
                        {inspectedCompany.enrichment_metrics?.completeness_band})
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {inspectedCompany.detailed_business_description ||
                        inspectedSchema?.company_summary.text ||
                        'No website enrichment extracted yet.'}
                    </p>
                  </div>

                  {inspectedSchema && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2.5">
                          Extracted Products & Services (With Source Page Citations)
                        </h4>
                        <div className="space-y-2">
                          {inspectedSchema.offerings
                            .filter(o => o.node_type !== 'group')
                            .map(off => (
                              <div
                                key={off.id}
                                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900">{off.name}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-blue-50 text-blue-700">
                                    {off.kind}
                                  </span>
                                </div>
                                {off.source_page_url && (
                                  <div className="text-[10px] font-mono text-blue-600 mt-1">
                                    Source: {off.source_page_url}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2.5">
                          Capabilities, Materials & Quality Credentials
                        </h4>
                        <div className="space-y-2 text-xs">
                          {inspectedSchema.capabilities.map(cap => (
                            <div
                              key={cap.id}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                            >
                              <div className="font-bold text-slate-900">{cap.name}</div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                Materials: {cap.materials.join(', ').replace(/_/g, ' ')}
                              </div>
                              {cap.source_page_url && (
                                <div className="text-[10px] font-mono text-blue-600 mt-1">
                                  Source: {cap.source_page_url}
                                </div>
                              )}
                            </div>
                          ))}
                          {inspectedSchema.credentials.map(cred => (
                            <div
                              key={cred.id}
                              className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200"
                            >
                              <div className="font-bold text-emerald-900">{cred.raw_label}</div>
                              <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                                Status: {cred.status} • Source: {cred.source_page_url || 'Website'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MATCHING PROFILE ANALYSIS (Prompt 7) */}
              {inspectorTab === 'matching_profile' && inspectedMatchingProfile && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Stored Matching Profile Analysis ({inspectedMatchingProfile.matching_profile_id})
                        </h3>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          Status: {inspectedMatchingProfile.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {inspectedMatchingProfile.observed_summary}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-lg font-extrabold text-indigo-700">
                        {Math.round(inspectedMatchingProfile.profile_confidence * 100)}%
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">Profile Confidence</div>
                    </div>
                  </div>

                  {/* Observed vs Inferred Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="text-xs font-bold uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-block">
                        Observed From Enriched Website & Registry
                      </div>
                      <div className="text-xs space-y-2">
                        <div>
                          <span className="font-bold text-slate-700">Observed Products:</span>{' '}
                          {inspectedMatchingProfile.observed_products.join(', ') || 'None'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Observed Services:</span>{' '}
                          {inspectedMatchingProfile.observed_services.join(', ') || 'None'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Capabilities & Materials:</span>{' '}
                          {inspectedMatchingProfile.observed_capabilities_and_materials.join('; ') || 'None'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Observed Buyer Sectors:</span>{' '}
                          {inspectedMatchingProfile.observed_sectors.join(', ') || 'General Industrial'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="text-xs font-bold uppercase text-amber-800 bg-amber-50 px-2.5 py-1 rounded inline-block">
                        Information Gaps & Confidence Caveats
                      </div>
                      {inspectedMatchingProfile.information_gaps.length === 0 ? (
                        <div className="text-xs text-emerald-700">
                          No critical information gaps detected.
                        </div>
                      ) : (
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                          {inspectedMatchingProfile.information_gaps.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-blue-800">
                        Inferred Upstream Supplier Criteria (What This Company Likely Needs to Buy)
                      </h4>
                      {inspectedMatchingProfile.inferred_supplier_criteria.map(sc => (
                        <div
                          key={sc.criterion_id}
                          className="p-3 rounded-lg bg-blue-50/40 border border-blue-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{sc.requirement_label}</span>
                            <span className="font-mono text-[10px] font-bold text-blue-700">
                              {Math.round(sc.confidence * 100)}% conf
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{sc.rationale}</p>
                          <div className="text-[10px] font-mono text-slate-500">
                            Target Supplier SICs: {sc.target_supplier_sics.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-purple-800">
                        Inferred Downstream Customer Archetypes (Who Likely Buys From This Company)
                      </h4>
                      {inspectedMatchingProfile.inferred_customer_criteria.map(cc => (
                        <div
                          key={cc.criterion_id}
                          className="p-3 rounded-lg bg-purple-50/40 border border-purple-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {cc.customer_archetype_label}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-purple-700">
                              {Math.round(cc.confidence * 100)}% conf
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] font-medium">
                            Use Case: {cc.likely_use_case}
                          </p>
                          <p className="text-slate-600 text-[11px]">{cc.rationale}</p>
                          <div className="text-[10px] font-mono text-slate-500">
                            Target Customer SICs: {cc.target_customer_sics.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: GENERATED DIRECTIONAL MATCHES (Prompt 8) */}
              {inspectorTab === 'matches' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-blue-800">
                      Supplier Connections ({inspectedSupplierMatches.length})
                    </h4>
                    {inspectedSupplierMatches.slice(0, 8).map(m => (
                      <div
                        key={m.edge_id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {m.counterparty_name} (#{m.registration_number})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                              Score: {m.score}/100
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.delivery_status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {m.delivery_status || 'undelivered'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600">{m.explanation}</p>
                        {m.weak_evidence_or_gaps && m.weak_evidence_or_gaps.length > 0 && (
                          <div className="text-[10px] text-amber-700">
                            Note: {m.weak_evidence_or_gaps[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-emerald-800">
                      Customer Connections ({inspectedCustomerMatches.length})
                    </h4>
                    {inspectedCustomerMatches.slice(0, 8).map(m => (
                      <div
                        key={m.edge_id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {m.counterparty_name} (#{m.registration_number})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              Score: {m.score}/100
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.delivery_status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {m.delivery_status || 'undelivered'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600">{m.explanation}</p>
                        {m.weak_evidence_or_gaps && m.weak_evidence_or_gaps.length > 0 && (
                          <div className="text-[10px] text-amber-700">
                            Note: {m.weak_evidence_or_gaps[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CHANGE & PROCESSING HISTORY (Prompt 3 & Prompt 5) */}
              {inspectorTab === 'history' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase text-amber-800 mb-3">
                      Companies House Registry Change History ({(inspectedCompany.change_history || []).length})
                    </h4>
                    {(inspectedCompany.change_history || []).length === 0 ? (
                      <div className="text-xs text-slate-500">
                        No statutory registry changes observed since initial ingestion.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {(inspectedCompany.change_history || []).map(ch => (
                          <div
                            key={ch.change_id}
                            className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900">{ch.change_reason}</span>
                              <span className="font-mono text-[10px] text-amber-700">
                                {ch.observed_at}
                              </span>
                            </div>
                            {ch.changed_fields.map((cf, i) => (
                              <div key={i} className="font-mono text-[11px] text-slate-700">
                                Field <strong>{cf.field}</strong>: &ldquo;{JSON.stringify(cf.old_value)}&rdquo; → &ldquo;
                                {JSON.stringify(cf.new_value)}&rdquo;
                              </div>
                            ))}
                            <div className="text-[10px] text-slate-600">
                              Affected Downstream Stages: {ch.affected_stages.join(', ')} • Policy Flag:{' '}
                              {ch.policy_flag || 'none'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase text-slate-600 mb-3">
                      Pipeline Processing Timeline
                    </h4>
                    <div className="space-y-2">
                      {(inspectedCompany.processing_history || []).map(ph => (
                        <div
                          key={ph.event_id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 mr-2">
                              {ph.stage}
                            </span>
                            <span className="text-slate-800">{ph.summary}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{ph.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: RAW JSON */}
              {inspectorTab === 'json' && (
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(
                    {
                      company: inspectedCompany,
                      matching_profile: inspectedMatchingProfile,
                      phase_one_schema: inspectedSchema
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
