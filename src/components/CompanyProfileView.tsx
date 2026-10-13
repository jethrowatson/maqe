'use client';

import React, { useState } from 'react';
import { CompanyRecord, ProfileVersion, Assertion } from '../lib/domain/types';
import {
  Building2,
  ShieldCheck,
  FileText,
  MapPin,
  Calendar,
  CheckCircle,
  ExternalLink,
  Layers,
  Key,
  BadgeCheck
} from 'lucide-react';

interface CompanyProfileViewProps {
  company: CompanyRecord;
  profile: ProfileVersion | null;
  assertions: Assertion[];
  onClaimCompany: (companyId: string) => void;
}

export function CompanyProfileView({
  company,
  profile,
  assertions,
  onClaimCompany
}: CompanyProfileViewProps) {
  const [claimToken, setClaimToken] = useState<string | null>(null);

  const handleGenerateClaim = () => {
    const token = `claim_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setClaimToken(token);
    onClaimCompany(company.company_id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="sm:flex sm:items-start sm:justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xl shadow-2xs">
              {company.legal_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">{company.legal_name}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Verified Registry
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                  Reg No: {company.registration_number}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {company.addresses.registered || 'United Kingdom'}
                </span>
                <span>•</span>
                <span>Jurisdiction: {company.jurisdiction} (Companies House)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            {!claimToken ? (
              <button
                onClick={handleGenerateClaim}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
              >
                <Key className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Claim / Verify Listing
              </button>
            ) : (
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-mono font-bold">
                Token: {claimToken}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Structured Engineering Capabilities (Provides / Uses / Likely Needs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PROVIDES */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Provides (Manufacturing Output)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Observed capabilities, production processes, and verified products.</p>

          <div className="mt-4 space-y-3">
            {profile?.provides.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{item.label || item.concept_id}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {item.basis || 'observed'}
                  </span>
                </div>
                {item.confidence && (
                  <div className="text-[10px] text-slate-500 mt-1">
                    Confidence: {Math.round(item.confidence * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* LIKELY NEEDS & USES */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Input Requirements & Likely Needs</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Inferred raw material, machinery, tooling, and freight dependencies.</p>

          <div className="mt-4 space-y-3">
            {profile?.likely_needs.map((item, idx) => {
              const label = typeof item === 'string' ? item : item.label || item.concept_id;
              const basis = typeof item === 'string' ? 'inferred' : item.basis || 'inferred';
              return (
                <div key={idx} className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{label}</span>
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {basis}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assertions & Evidence Spans */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Versioned Assertions & Ground-Truth Citations</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Immutable assertions extracted from public documents with transparent span references.
        </p>

        <div className="mt-4 space-y-3">
          {assertions.map(ast => (
            <div key={ast.assertion_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {ast.assertion_id}
                  </span>
                  <span className="ml-2 text-xs font-bold text-slate-800">
                    {ast.field}: {ast.typed_value.label || ast.typed_value.concept_id}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  ast.basis === 'observed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {ast.basis}
                </span>
              </div>

              {ast.rationale && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed italic">
                  Rationale: &ldquo;{ast.rationale}&rdquo;
                </p>
              )}

              {ast.evidence_refs?.length > 0 && (
                <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Evidence Citation Span:</span>
                  <blockquote className="text-slate-800 font-mono text-[11px] border-l-2 border-blue-500 pl-2">
                    {ast.evidence_refs[0].span || 'Verified document ref'}
                  </blockquote>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
