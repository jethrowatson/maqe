'use client';

import React, { useState } from 'react';
import {
  MatchCandidateResult,
  MatchDirection,
  CompanyRecord
} from '../lib/domain/types';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Unlock,
  CheckCircle2,
  MapPin,
  FileText,
  MessageSquare,
  Globe
} from 'lucide-react';

interface MemberMatchingViewProps {
  candidates: MatchCandidateResult[];
  direction: MatchDirection;
  setDirection: (dir: MatchDirection) => void;
  onUnlock: (candidate: MatchCandidateResult) => Promise<void>;
  onContact: (candidate: MatchCandidateResult) => void;
  onSendRFQ: (candidate: MatchCandidateResult) => void;
  creditBalance: number;
  focusCompany?: CompanyRecord;
  allCompanies?: CompanyRecord[];
  onChangeFocusCompany?: (companyId: string) => void;
}

export function MemberMatchingView({
  candidates,
  direction,
  setDirection,
  onUnlock,
  onContact,
  onSendRFQ,
  creditBalance,
  focusCompany,
  allCompanies,
  onChangeFocusCompany
}: MemberMatchingViewProps) {
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidateResult | null>(null);

  const handleUnlockClick = async (cand: MatchCandidateResult) => {
    setUnlockingId(cand.counterparty_company_id);
    try {
      await onUnlock(cand);
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Direction Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">AI Directional Matching Engine (Phase One Cohort)</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Matching verified Phase One capabilities, parameters, and ISO credentials to inferred commercial supply-chain needs across 1,000 real UK businesses.
            </p>
          </div>

          {/* Direction Toggle Pills */}
          <div className="mt-4 sm:mt-0 flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setDirection('customer')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                direction === 'customer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Leads
              <span className="ml-1.5 opacity-80 font-normal">Who needs our offerings?</span>
            </button>
            <button
              onClick={() => setDirection('supplier')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                direction === 'supplier'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supplier Matches
              <span className="ml-1.5 opacity-80 font-normal">Who meets our requirements?</span>
            </button>
          </div>
        </div>

        {/* Focus Company Context Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Focus Member Business:</span>
            {allCompanies && onChangeFocusCompany ? (
              <select
                value={focusCompany?.company_id || ''}
                onChange={e => onChangeFocusCompany(e.target.value)}
                className="text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs"
              >
                {allCompanies.slice(0, 100).map(c => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.display_name || c.legal_name} (UK Reg #{c.registration_number} • SIC {c.primary_sic})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {focusCompany?.legal_name || 'REGENT ENGINEERING CO (WALSALL) LIMITED'} (#{focusCompany?.registration_number || '00551421'})
              </span>
            )}
            <span>
              • SIC {focusCompany?.primary_sic || '25500'}: {focusCompany?.sic_description || 'Forging, pressing, stamping and roll-forming of metal'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium">
              Phase One Schema v1.0.0 • {candidates.length} Verified Matches
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="grid grid-cols-1 gap-4">
        {candidates.map((cand, idx) => {
          const isUnlocked = cand.is_unlocked;
          const score = cand.score;
          const scoreColor =
            score >= 90
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : score >= 80
              ? 'text-blue-700 bg-blue-50 border-blue-200'
              : 'text-amber-700 bg-amber-50 border-amber-200';

          return (
            <div
              key={cand.counterparty_company_id}
              className={`bg-white rounded-xl border transition-all ${
                isUnlocked
                  ? 'border-blue-300 shadow-xs ring-1 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {cand.counterparty_name}
                        </h3>
                        <span className="text-xs font-mono text-slate-500">
                          (UK Reg #{cand.registration_number})
                        </span>
                        {isUnlocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Unlock className="w-3 h-3 mr-1" /> Unlocked & Saved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3 h-3 mr-1" /> Contact Protected
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                          {isUnlocked
                            ? cand.addresses?.registered || cand.addresses?.locality || 'United Kingdom'
                            : `${cand.addresses?.locality || 'United Kingdom'} (${cand.addresses?.postal_code?.split(' ')[0] || 'GB'})`}
                        </span>
                        <span>•</span>
                        <span className="font-mono">SIC: {cand.sic_codes?.join(', ') || 'Classified'}</span>
                        {isUnlocked && cand.counterparty_website && (
                          <>
                            <span>•</span>
                            <a
                              href={cand.counterparty_website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono"
                            >
                              <Globe className="w-3 h-3" /> {cand.counterparty_website}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Gauge */}
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1.5 rounded-lg border text-right ${scoreColor}`}>
                      <div className="text-lg font-black leading-none">{score}%</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5">Fit Score</div>
                    </div>
                  </div>
                </div>

                {/* Offering -> Need Match Highlight */}
                {(cand.offering_matched || cand.need_satisfied) && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
                    {cand.offering_matched && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Matched Capability / Offering
                        </span>
                        <span className="font-semibold text-slate-900">{cand.offering_matched}</span>
                      </div>
                    )}
                    {cand.need_satisfied && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Satisfies Supply-Chain Requirement
                        </span>
                        <span className="font-semibold text-blue-800">{cand.need_satisfied}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Score Components Bar */}
                <div className="mt-3 grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium">Capability Fit</span>
                    <span className="font-bold text-slate-800">{Math.round(cand.score_components.compatibility * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium">Sector Alignment</span>
                    <span className="font-bold text-slate-800">{Math.round(cand.score_components.sector * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium">Geographic Reach</span>
                    <span className="font-bold text-slate-800">{Math.round(cand.score_components.geography * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium">Evidence Quality</span>
                    <span className="font-bold text-slate-800">{Math.round(cand.score_components.evidence * 100)}%</span>
                  </div>
                </div>

                {/* Rationale & Explanation */}
                <div className="mt-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100/80">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="space-y-1.5">
                      <p className="text-xs text-blue-900 leading-relaxed">
                        <span className="font-semibold">Phase One Matching Basis: </span>
                        {cand.explanation}
                      </p>
                      {cand.criterion_results && cand.criterion_results.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cand.criterion_results.map(cr => (
                            <span
                              key={cr.criterion_id}
                              title={cr.explanation}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                cr.state === 'pass'
                                  ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              {cr.criterion_key}: {cr.state.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unlocked Detail Section / Action Toolbar */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isUnlocked ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onContact(cand)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Send In-App Enquiry
                      </button>
                      <button
                        onClick={() => onSendRFQ(cand)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Create RFQ
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUnlockClick(cand)}
                        disabled={unlockingId === cand.counterparty_company_id}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-blue-700 rounded-lg transition-all shadow-xs disabled:opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                        {unlockingId === cand.counterparty_company_id
                          ? 'Unlocking...'
                          : 'Unlock Deep Intelligence & Contacts (1 Credit)'}
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Balance: {creditBalance} credits remaining
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedCandidate(cand)}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center"
                  >
                    Inspect Phase One Proof
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof Inspection Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedCandidate.counterparty_name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  UK Reg #{selectedCandidate.registration_number} • SIC: {selectedCandidate.sic_codes?.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Provides (Phase One Offerings)</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCandidate.profile_version?.provides.map((p, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-800 border border-slate-200">
                      {p.label || p.concept_id}
                      <span className="ml-1.5 text-[10px] text-emerald-600 font-bold uppercase">{p.basis || 'observed'}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Materials & Inferred Supply-Chain Needs</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCandidate.profile_version?.uses.map((u, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-blue-50 text-blue-800 border border-blue-200">
                      {typeof u === 'string' ? u : u.label || u.concept_id}
                    </span>
                  ))}
                  {selectedCandidate.profile_version?.likely_needs.map((n, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-amber-50 text-amber-800 border border-amber-200">
                      {typeof n === 'string' ? n : n.label || n.concept_id}
                      <span className="ml-1.5 text-[10px] text-amber-600 font-bold uppercase">Inferred Need</span>
                    </span>
                  ))}
                </div>
              </div>

              {selectedCandidate.criterion_results && selectedCandidate.criterion_results.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phase One Criterion Evaluations (Section 15)</h4>
                  <div className="mt-2 space-y-2">
                    {selectedCandidate.criterion_results.map(cr => (
                      <div key={cr.criterion_id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex justify-between font-mono font-bold text-slate-800">
                          <span>{cr.criterion_key} ({cr.importance})</span>
                          <span className={cr.state === 'pass' ? 'text-emerald-600' : 'text-amber-600'}>
                            {cr.state.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{cr.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Sectors & Markets Served</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCandidate.profile_version?.serves.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
