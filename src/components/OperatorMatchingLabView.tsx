'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MatchDirection } from '../lib/domain/types';
import { store } from '../lib/db/store';
import { DEFAULT_FOCUS_COMPANY_ID } from '../lib/fixtures/cohort';
import {
  Sliders,
  RotateCcw,
  Network,
  Sparkles,
  Play,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

interface OperatorMatchingLabViewProps {
  initialFocusCompanyId?: string;
}

export function OperatorMatchingLabView({
  initialFocusCompanyId
}: OperatorMatchingLabViewProps = {}) {
  const [focusCompanyId, setFocusCompanyId] = useState<string>(
    initialFocusCompanyId || DEFAULT_FOCUS_COMPANY_ID
  );
  const [direction, setDirection] = useState<MatchDirection>('supplier');
  const [activeDetailTab, setActiveDetailTab] = useState<
    'matching_profile' | 'batch_delivery' | 'all_connections'
  >('matching_profile');
  const [refreshTick, setRefreshTick] = useState(0);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Searchable & Filterable Company Table State (Replaces 150-company dropdown per Prompt 8)
  const [companySearch, setCompanySearch] = useState('');
  const [profileStatusFilter, setProfileStatusFilter] = useState<
    'all' | 'current' | 'stale_needs_reassessment' | 'insufficient_evidence' | 'awaiting_enrichment'
  >('all');
  const [matchStatusFilter, setMatchStatusFilter] = useState<
    'all' | 'completed_with_matches' | 'completed_no_matches' | 'awaiting_profile_analysis'
  >('all');

  // Ranked Batch Delivery Controls (Prompt 8)
  const [batchSize, setBatchSize] = useState<number>(3);
  const [minScore, setMinScore] = useState<number>(80);

  // Secondary Algorithm Weight Calibration Drawer
  const [showCalibrationDrawer, setShowCalibrationDrawer] = useState<boolean>(false);
  const [compatWeight, setCompatWeight] = useState(0.50);
  const [sectorWeight, setSectorWeight] = useState(0.20);
  const [geoWeight, setGeoWeight] = useState(0.15);
  const [evidenceWeight, setEvidenceWeight] = useState(0.15);
  const [excludeCompetitors, setExcludeCompetitors] = useState(true);

  useEffect(() => {
    if (initialFocusCompanyId) {
      setFocusCompanyId(initialFocusCompanyId);
    }
  }, [initialFocusCompanyId]);

  const pipelineSummary = useMemo(
    () => store.matchingEngine.getMatchingPipelineSummary(),
    [refreshTick]
  );

  const filteredCompanies = useMemo(() => {
    const all = store.getCompanies();
    return all.filter(c => {
      const mpStatus = c.pipeline_state?.matching_profile_status || 'awaiting_enrichment';
      const mStatus = c.pipeline_state?.matching_status || 'awaiting_profile_analysis';

      if (profileStatusFilter !== 'all' && mpStatus !== profileStatusFilter) return false;
      if (matchStatusFilter !== 'all' && mStatus !== matchStatusFilter) return false;

      if (companySearch.trim()) {
        const q = companySearch.toLowerCase().trim();
        const match =
          c.legal_name.toLowerCase().includes(q) ||
          (c.display_name || '').toLowerCase().includes(q) ||
          c.registration_number.toLowerCase().includes(q) ||
          c.primary_sic.includes(q) ||
          (c.sic_description || '').toLowerCase().includes(q) ||
          (c.addresses.locality || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [companySearch, profileStatusFilter, matchStatusFilter, refreshTick]);

  const focusCompany = useMemo(
    () => store.getCompany(focusCompanyId) || store.getCompanies()[0],
    [focusCompanyId, refreshTick]
  );

  const focusMatchingProfile = useMemo(
    () => store.getMatchingProfileAnalysis(focusCompany.company_id),
    [focusCompany, refreshTick]
  );

  const directionalConnections = useMemo(
    () =>
      store.matchingEngine.runMatch({
        focus_company_id: focusCompany.company_id,
        direction,
        criteria: {
          weights: {
            compatibility: compatWeight,
            sector: sectorWeight,
            geography: geoWeight,
            evidence: evidenceWeight
          },
          hard_filters: {
            min_confidence: 0.4,
            exclude_competitors: excludeCompetitors,
            require_verified_identity: true
          }
        }
      }),
    [
      focusCompany,
      direction,
      compatWeight,
      sectorWeight,
      geoWeight,
      evidenceWeight,
      excludeCompetitors,
      refreshTick
    ]
  );

  const batchPreview = useMemo(
    () =>
      store.previewMatchBatch({
        company_id: focusCompany.company_id,
        direction,
        batch_size: batchSize,
        min_score: minScore
      }),
    [focusCompany, direction, batchSize, minScore, refreshTick]
  );

  const deliveredBatchesForCompany = useMemo(
    () => store.getDeliveredBatches(focusCompany.company_id),
    [focusCompany, refreshTick]
  );

  const handleRunProfileBatch = () => {
    const res = store.matchingEngine.runMatchingProfileBatch({
      scope: 'unprocessed_or_stale',
      batch_size: 50
    });
    store.jobEngine.createJob({
      job_type: 'matching_profile_batch',
      job_category: 'matching_profile_analysis',
      subject_id: res.run_id,
      idempotency_key: `mp_${res.run_id}`,
      requested_by: 'operator',
      state: 'succeeded',
      total_items: res.profiles_evaluated,
      processed_items: res.profiles_evaluated,
      succeeded_items: res.profiles_current,
      skipped_items: res.profiles_insufficient_evidence,
      progress: 100,
      output_refs: res
    });
    setRefreshTick(t => t + 1);
    setActionBanner(
      `[Prompt 7 Matching Profile Analysis Batch Completed] Evaluated ${res.profiles_evaluated} companies: ${res.profiles_current} current matchable profiles, ${res.profiles_insufficient_evidence} marked insufficient_evidence.`
    );
  };

  const handleRunMatchGenerationBatch = () => {
    const res = store.matchingEngine.runMatchGenerationBatch({
      scope: 'current_profiles',
      batch_size: 50
    });
    store.jobEngine.createJob({
      job_type: 'match_generation_batch',
      job_category: 'match_generation',
      subject_id: res.run_id,
      idempotency_key: `mgen_${res.run_id}`,
      requested_by: 'operator',
      state: 'succeeded',
      total_items: res.companies_evaluated,
      processed_items: res.companies_evaluated,
      succeeded_items: res.companies_with_matches,
      skipped_items: res.companies_zero_matches,
      progress: 100,
      output_refs: res
    });
    setRefreshTick(t => t + 1);
    setActionBanner(
      `[Prompt 8 Match Generation Batch Completed] Evaluated ${res.companies_evaluated} companies: ${res.companies_with_matches} companies with matches (${res.supplier_connections_generated} supplier & ${res.customer_connections_generated} customer connections), ${res.companies_zero_matches} with 0 matches.`
    );
  };

  const handleDeliverRankedBatch = () => {
    const batch = store.deliverMatchBatch({
      company_id: focusCompany.company_id,
      direction,
      batch_size: batchSize,
      min_score: minScore,
      delivered_by: 'operator_console'
    });
    setRefreshTick(t => t + 1);
    setActionBanner(
      `[Prompt 8 Ranked Batch #${batch.batch_number} Delivered] Delivered ${batch.delivered_count} ${batch.direction} connection(s) (min score >= ${batch.min_score_applied}%) for ${focusCompany.legal_name}. ${batch.remaining_qualifying_count} qualifying undelivered connection(s) remain for future batches.` +
        (batch.shortfall_reason ? ` Shortfall note: ${batch.shortfall_reason}` : '')
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Pipeline Banner & Stage Controls (Prompts 7 & 8) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STAGE 7: MATCHING PROFILE ANALYSIS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                STAGE 8: DIRECTIONAL MATCHING & RANKED BATCH DELIVERY
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              C05 Matching Profile Analysis, Directional Scoring & Ranked Batch Delivery Console
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Generates a structured <strong className="text-white">Matching Profile Analysis</strong> per company (separating observed website offerings from inferred supplier requirements &amp; customer archetypes) before scoring directional{' '}
              <strong className="text-white">0–100 connections</strong> and delivering non-repeating ranked batches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunProfileBatch}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Run Matching Profile Batch
            </button>
            <button
              onClick={handleRunMatchGenerationBatch}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Run Match Generation Batch
            </button>
            <button
              onClick={() => setShowCalibrationDrawer(v => !v)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showCalibrationDrawer ? 'Hide Calibration' : 'Weight Calibration'}
            </button>
          </div>
        </div>

        {/* 6 Distinct Pipeline KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Current Profiles</div>
            <div className="text-2xl font-extrabold font-mono text-indigo-300 mt-1">
              {pipelineSummary.matching_profiles_current}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pipelineSummary.matching_profiles_stale} stale •{' '}
              {pipelineSummary.matching_profiles_unprocessed} unprocessed
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Insufficient Evidence</div>
            <div className="text-2xl font-extrabold font-mono text-amber-300 mt-1">
              {pipelineSummary.matching_profiles_insufficient_evidence}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Sparse enrichment (&lt;45%)
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Companies Matched</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
              {pipelineSummary.companies_with_matches}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pipelineSummary.companies_completed_zero_matches} evaluated with 0 matches
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Supplier Connections</div>
            <div className="text-2xl font-extrabold font-mono text-blue-300 mt-1">
              {pipelineSummary.supplier_connections_count}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Upstream supply-chain fit
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Customer Connections</div>
            <div className="text-2xl font-extrabold font-mono text-purple-300 mt-1">
              {pipelineSummary.customer_connections_count}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Downstream buyer archetypes
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase text-slate-400">Delivered Batches</div>
            <div className="text-2xl font-extrabold font-mono text-white mt-1">
              {pipelineSummary.total_batches_delivered}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {pipelineSummary.total_connections_delivered} connections delivered
            </div>
          </div>
        </div>

        {actionBanner && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
            <span>{actionBanner}</span>
            <button onClick={() => setActionBanner(null)} className="text-emerald-300 font-bold ml-4">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Secondary Calibration Drawer */}
      {showCalibrationDrawer && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-700">
              Algorithm Scoring Weights & Hard Filters Calibration
            </h3>
            <button
              onClick={() => {
                setCompatWeight(0.50);
                setSectorWeight(0.20);
                setGeoWeight(0.15);
                setEvidenceWeight(0.15);
                setExcludeCompetitors(true);
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Baseline Weights
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Compatibility</span>
                <span className="font-mono">{Math.round(compatWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={compatWeight}
                onChange={e => setCompatWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Sector Fit</span>
                <span className="font-mono">{Math.round(sectorWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.6}
                step={0.05}
                value={sectorWeight}
                onChange={e => setSectorWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>UK Geography</span>
                <span className="font-mono">{Math.round(geoWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={geoWeight}
                onChange={e => setGeoWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Evidence Quality</span>
                <span className="font-mono">{Math.round(evidenceWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={evidenceWeight}
                onChange={e => setEvidenceWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeCompetitors}
                  onChange={e => setExcludeCompetitors(e.target.checked)}
                />
                Exclude Direct Competitors
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Split: Searchable Company Matching Table (4 Cols) + Profile & Ranked Batch Delivery Console (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Searchable & Filterable Company Matching Table */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Company Matching Directory ({filteredCompanies.length})
            </h2>
          </div>

          <input
            type="text"
            value={companySearch}
            onChange={e => setCompanySearch(e.target.value)}
            placeholder="Search all 1,000 companies by name, reg #, SIC..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={profileStatusFilter}
              onChange={e => setProfileStatusFilter(e.target.value as any)}
              className="px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="all">All Profile States</option>
              <option value="current">Current Profile ({pipelineSummary.matching_profiles_current})</option>
              <option value="stale_needs_reassessment">
                Stale Profile ({pipelineSummary.matching_profiles_stale})
              </option>
              <option value="insufficient_evidence">
                Insufficient Evidence ({pipelineSummary.matching_profiles_insufficient_evidence})
              </option>
              <option value="awaiting_enrichment">Awaiting Enrichment</option>
            </select>

            <select
              value={matchStatusFilter}
              onChange={e => setMatchStatusFilter(e.target.value as any)}
              className="px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="all">All Match States</option>
              <option value="completed_with_matches">
                Has Matches ({pipelineSummary.companies_with_matches})
              </option>
              <option value="completed_no_matches">
                Zero Matches ({pipelineSummary.companies_completed_zero_matches})
              </option>
              <option value="awaiting_profile_analysis">Awaiting Profile</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredCompanies.slice(0, 100).map(c => {
              const isSelected = c.company_id === focusCompany.company_id;
              const mpStatus = c.pipeline_state?.matching_profile_status || 'awaiting_enrichment';
              const mStatus = c.pipeline_state?.matching_status || 'awaiting_profile_analysis';

              return (
                <div
                  key={c.company_id}
                  onClick={() => setFocusCompanyId(c.company_id)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 truncate">{c.legal_name}</span>
                    <span className="font-mono text-[10px] font-bold text-blue-700 shrink-0">
                      #{c.registration_number}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    SIC {c.primary_sic} • {c.sic_description}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        mpStatus === 'current'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : mpStatus === 'stale_needs_reassessment'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : mpStatus === 'insufficient_evidence'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Profile: {mpStatus}
                    </span>
                    <span className="text-slate-500 font-mono">{mStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Focus Company Matching Profile Analysis & Ranked Batch Delivery Console */}
        <div className="lg:col-span-8 space-y-5">
          {/* Selected Company Header & Sub-Navigation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    UK Reg #{focusCompany.registration_number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                    SIC {focusCompany.primary_sic}: {focusCompany.sic_description}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    Profile Status: {focusMatchingProfile?.status} (
                    {Math.round((focusMatchingProfile?.profile_confidence || 0) * 100)}% conf)
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                  {focusCompany.legal_name}
                </h2>
              </div>

              <button
                onClick={() => {
                  const mp = store.matchingEngine.generateMatchingProfileAnalysis(
                    focusCompany.company_id
                  );
                  setRefreshTick(t => t + 1);
                  setActionBanner(
                    `Regenerated Matching Profile Analysis for ${focusCompany.legal_name}: status = ${mp?.status} (${mp?.inferred_supplier_criteria.length} supplier criteria, ${mp?.inferred_customer_criteria.length} customer criteria).`
                  );
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate Matching Profile
              </button>
            </div>

            {/* Sub-Tabs for Stage 7 Profile Analysis vs Stage 8 Ranked Batch Delivery vs Full Connection List */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveDetailTab('matching_profile')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeDetailTab === 'matching_profile'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  1. Stored Matching Profile Analysis (Prompt 7)
                </button>
                <button
                  onClick={() => setActiveDetailTab('batch_delivery')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeDetailTab === 'batch_delivery'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  2. Ranked Batch Delivery Engine (Prompt 8)
                </button>
                <button
                  onClick={() => setActiveDetailTab('all_connections')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeDetailTab === 'all_connections'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  3. All Directional Connections ({directionalConnections.length})
                </button>
              </div>

              {/* Direction Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setDirection('supplier')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    direction === 'supplier'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Suppliers
                </button>
                <button
                  onClick={() => setDirection('customer')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    direction === 'customer'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Customers
                </button>
              </div>
            </div>
          </div>

          {/* DETAIL TAB 1: STORED MATCHING PROFILE ANALYSIS (Prompt 7) */}
          {activeDetailTab === 'matching_profile' && focusMatchingProfile && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-slate-600">
                    Observed Business Summary (Enrichment Revision v
                    {focusMatchingProfile.enrichment_revision_used})
                  </span>
                  <span className="font-mono text-indigo-700 font-bold">
                    {focusMatchingProfile.matching_profile_id}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed">
                  {focusMatchingProfile.observed_summary}
                </p>
              </div>

              {/* Observed Website Facts vs Information Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="font-bold uppercase text-emerald-900">
                    Observed Activities, Products &amp; Capabilities
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Products:</span>{' '}
                    {focusMatchingProfile.observed_products.join(', ') || 'None'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Services:</span>{' '}
                    {focusMatchingProfile.observed_services.join(', ') || 'None'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Capabilities &amp; Materials:</span>{' '}
                    {focusMatchingProfile.observed_capabilities_and_materials.join('; ') || 'None'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Observed Sectors:</span>{' '}
                    {focusMatchingProfile.observed_sectors.join(', ') || 'General UK Manufacturing'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="font-bold uppercase text-amber-900">
                    Information Gaps &amp; Confidence Notes
                  </div>
                  {focusMatchingProfile.information_gaps.length === 0 ? (
                    <div className="text-emerald-800">
                      All primary enrichment domains populated.
                    </div>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {focusMatchingProfile.information_gaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Inferred Supplier Criteria & Inferred Customer Criteria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-blue-800">
                    Inferred Supplier Requirements ({focusMatchingProfile.inferred_supplier_criteria.length})
                  </h4>
                  {focusMatchingProfile.inferred_supplier_criteria.map(sc => (
                    <div
                      key={sc.criterion_id}
                      className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{sc.requirement_label}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                          {Math.round(sc.confidence * 100)}% conf
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{sc.rationale}</p>
                      <div className="text-[10px] font-mono text-slate-500">
                        Target Supplier SICs: {sc.target_supplier_sics.join(', ')} • Supporting Inputs:{' '}
                        {sc.supporting_observed_inputs.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-purple-800">
                    Inferred Customer Archetypes ({focusMatchingProfile.inferred_customer_criteria.length})
                  </h4>
                  {focusMatchingProfile.inferred_customer_criteria.map(cc => (
                    <div
                      key={cc.criterion_id}
                      className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {cc.customer_archetype_label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold text-[10px]">
                          {Math.round(cc.confidence * 100)}% conf
                        </span>
                      </div>
                      <p className="text-slate-800 text-[11px] font-medium">
                        Likely Use Case: {cc.likely_use_case}
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

          {/* DETAIL TAB 2: RANKED BATCH DELIVERY ENGINE (Prompt 8) */}
          {activeDetailTab === 'batch_delivery' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ranked Match Batch Delivery Configuration ({direction.toUpperCase()} Direction)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Orders qualifying undelivered connections from highest suitability score to lowest, excludes connections already delivered in earlier batches, and explains any shortfall.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Batch Size
                    </label>
                    <select
                      value={batchSize}
                      onChange={e => setBatchSize(Number(e.target.value))}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value={2}>2 Connections</option>
                      <option value={3}>3 Connections</option>
                      <option value={5}>5 Connections</option>
                      <option value={10}>10 Connections</option>
                      <option value={15}>15 Connections</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Min Score (0–100)
                    </label>
                    <select
                      value={minScore}
                      onChange={e => setMinScore(Number(e.target.value))}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value={60}>&ge; 60 / 100</option>
                      <option value={75}>&ge; 75 / 100</option>
                      <option value={80}>&ge; 80 / 100</option>
                      <option value={85}>&ge; 85 / 100</option>
                      <option value={90}>&ge; 90 / 100</option>
                      <option value={95}>&ge; 95 / 100 (Test Shortfall)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleDeliverRankedBatch}
                    disabled={batchPreview.selected_connections.length === 0}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    Deliver Next Ranked Batch ({batchPreview.selected_connections.length})
                  </button>
                </div>
              </div>

              {/* Batch Preview Telemetry Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">
                    Selected For This Batch
                  </div>
                  <div className="text-xl font-extrabold font-mono text-emerald-900 mt-0.5">
                    {batchPreview.selected_connections.length} / {batchPreview.requested_batch_size}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Excluded (Already Delivered)
                  </div>
                  <div className="text-xl font-extrabold font-mono text-slate-800 mt-0.5">
                    {batchPreview.excluded_already_delivered_count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] font-bold uppercase text-amber-700">
                    Excluded (&lt; {batchPreview.min_score_applied}% Min Score)
                  </div>
                  <div className="text-xl font-extrabold font-mono text-amber-900 mt-0.5">
                    {batchPreview.excluded_below_min_score_count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[10px] font-bold uppercase text-blue-700">
                    Remaining After Batch
                  </div>
                  <div className="text-xl font-extrabold font-mono text-blue-900 mt-0.5">
                    {batchPreview.remaining_qualifying_undelivered_count}
                  </div>
                </div>
              </div>

              {batchPreview.shortfall_reason && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-medium">
                  <strong>Shortfall Explanation:</strong> {batchPreview.shortfall_reason}
                </div>
              )}

              {/* Previewed Ranked Connections List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase text-slate-500">
                  Next Ranked Batch Preview (Ordered Highest Suitability Score → Lowest)
                </h4>
                {batchPreview.selected_connections.map((conn, idx) => (
                  <div
                    key={conn.edge_id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px]">
                          Rank #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">
                          {conn.counterparty_name} (#{conn.registration_number})
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-extrabold text-xs">
                        Score: {conn.score} / 100
                      </span>
                    </div>
                    <p className="text-slate-700">{conn.explanation}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                      <span>
                        Matched Profile Criterion:{' '}
                        <strong className="text-slate-800">
                          {(conn.matched_profile_criteria || [])[0]}
                        </strong>
                      </span>
                      {conn.weak_evidence_or_gaps && conn.weak_evidence_or_gaps.length > 0 && (
                        <span className="text-amber-700 font-semibold">
                          • Caveat: {conn.weak_evidence_or_gaps[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivered Batch History for This Company */}
              {deliveredBatchesForCompany.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase text-slate-700">
                    Delivered Match Batches for {focusCompany.legal_name} (
                    {deliveredBatchesForCompany.length})
                  </h4>
                  {deliveredBatchesForCompany.map(b => (
                    <div
                      key={b.batch_id}
                      className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-emerald-900">
                          Batch #{b.batch_number} ({b.direction.toUpperCase()})
                        </span>{' '}
                        • Delivered <strong>{b.delivered_count}</strong> of {b.requested_batch_size}{' '}
                        requested (Min Score &ge; {b.min_score_applied}%)
                        {b.shortfall_reason && (
                          <div className="text-[11px] text-amber-800 mt-0.5">
                            {b.shortfall_reason}
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{b.created_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DETAIL TAB 3: ALL DIRECTIONAL CONNECTIONS */}
          {activeDetailTab === 'all_connections' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                All Ranked {direction === 'supplier' ? 'Supplier' : 'Customer'} Connections for{' '}
                {focusCompany.legal_name} ({directionalConnections.length})
              </h3>
              <div className="space-y-3">
                {directionalConnections.map((m, idx) => (
                  <div
                    key={m.edge_id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500">#{idx + 1}</span>
                        <span className="font-bold text-slate-900">
                          {m.counterparty_name} (#{m.registration_number})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.delivery_status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.delivery_status || 'undelivered'}
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-blue-700">
                        {m.score} / 100
                      </span>
                    </div>
                    <p className="text-slate-700">{m.explanation}</p>
                    <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] font-mono text-slate-600">
                      <div>Compat: {Math.round(m.score_components.compatibility * 100)}%</div>
                      <div>Sector: {Math.round(m.score_components.sector * 100)}%</div>
                      <div>Geography: {Math.round(m.score_components.geography * 100)}%</div>
                      <div>Evidence: {Math.round(m.score_components.evidence * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
