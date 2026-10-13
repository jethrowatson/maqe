'use client';

import React, { useState } from 'react';
import { SourceAssociation, SourceDocument, DecisionState } from '../lib/domain/types';
import {
  Compass,
  CheckCircle,
  XCircle,
  FileText,
  Hash,
  ExternalLink,
  ShieldCheck,
  Search
} from 'lucide-react';

interface OperatorDiscoveryViewProps {
  associations: SourceAssociation[];
  documents: SourceDocument[];
  onUpdateDecision: (id: string, decision: DecisionState, reason: string) => void;
}

export function OperatorDiscoveryView({
  associations,
  documents,
  onUpdateDecision
}: OperatorDiscoveryViewProps) {
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(documents[0] || null);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-amber-600" />
          <h1 className="text-xl font-bold text-slate-900">C02 Discovery & Candidate Source Review</h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Review automated identity matches, resolve ambiguous candidates, and inspect retrieved source documents (Section 5 & 5A).
        </p>
      </div>

      {/* Grid: Associations Review + Document Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Source Associations List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Discovered Candidates ({associations.length})
          </h2>

          <div className="space-y-3">
            {associations.map(assoc => {
              const isApproved = assoc.decision === 'approved';
              const isRejected = assoc.decision === 'rejected';

              return (
                <div
                  key={assoc.association_id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-700">{assoc.company_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' :
                          isRejected ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {assoc.decision}
                        </span>
                      </div>
                      <a
                        href={assoc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:underline mt-1 flex items-center"
                      >
                        {assoc.url}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">{Math.round(assoc.confidence * 100)}%</div>
                      <div className="text-[10px] text-slate-400 uppercase">Confidence</div>
                    </div>
                  </div>

                  {/* Identity Signals Chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    {assoc.identity_signals.reg_no_match && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        ✓ Reg No Match
                      </span>
                    )}
                    {assoc.identity_signals.domain_match && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        ✓ Domain Match
                      </span>
                    )}
                    {assoc.identity_signals.name_similarity && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                        Name Sim: {Math.round(assoc.identity_signals.name_similarity * 100)}%
                      </span>
                    )}
                    {assoc.identity_signals.address_match && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        ✓ Address Verified
                      </span>
                    )}
                  </div>

                  {/* Operator Approval / Rejection Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Reviewer: {assoc.reviewer || 'Unassigned'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUpdateDecision(assoc.association_id, 'approved', 'Operator verified entity identity')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                          isApproved ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                        }`}
                      >
                        Approve Source
                      </button>
                      <button
                        onClick={() => onUpdateDecision(assoc.association_id, 'rejected', 'Wrong corporate identity')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                          isRejected ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Retrieved Document Viewer */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Retrieved Source Document
              </h2>
            </div>
            {selectedDoc && (
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                {selectedDoc.document_id}
              </span>
            )}
          </div>

          {selectedDoc ? (
            <div className="mt-4 space-y-3 flex-1 flex flex-col">
              <div className="text-xs">
                <span className="text-slate-500 block">Title:</span>
                <span className="font-bold text-slate-900">{selectedDoc.document_title}</span>
              </div>

              <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 break-all">
                <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase mb-1">
                  <Hash className="w-3 h-3 mr-1" /> Immutable Content Hash (SHA-256)
                </div>
                {selectedDoc.content_hash}
              </div>

              <div className="flex-1 min-h-[250px] bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-y-auto leading-relaxed">
                {selectedDoc.extracted_text}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              No document selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
