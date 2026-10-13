'use client';

import React, { useState } from 'react';
import { Opportunity, OpportunityState, ContactEvent } from '../lib/domain/types';
import {
  Kanban,
  CheckCircle,
  Clock,
  Send,
  Building2,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  PlusCircle,
  FileCheck
} from 'lucide-react';

interface OpportunityCRMViewProps {
  opportunities: Opportunity[];
  onUpdateState: (id: string, state: OpportunityState, notes?: string) => void;
  onLogContact: (oppId: string, channel: 'maqe_message' | 'email' | 'phone' | 'rfq', summary: string) => void;
  onOpenConversation: (opp: Opportunity) => void;
}

const STAGES: { id: OpportunityState; label: string; color: string }[] = [
  { id: 'prospective', label: 'Prospective', color: 'border-slate-300 bg-slate-50' },
  { id: 'contacted', label: 'Contacted', color: 'border-blue-300 bg-blue-50/50' },
  { id: 'reviewing', label: 'Reviewing', color: 'border-purple-300 bg-purple-50/50' },
  { id: 'negotiating', label: 'Negotiating', color: 'border-amber-300 bg-amber-50/50' },
  { id: 'won_client', label: 'Won Client / Supplier', color: 'border-emerald-300 bg-emerald-50/50' },
  { id: 'lost', label: 'Archived / Lost', color: 'border-slate-200 bg-slate-100' }
];

export function OpportunityCRMView({
  opportunities,
  onUpdateState,
  onLogContact,
  onOpenConversation
}: OpportunityCRMViewProps) {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [contactModalOpp, setContactModalOpp] = useState<Opportunity | null>(null);
  const [contactSummary, setContactSummary] = useState('');
  const [contactChannel, setContactChannel] = useState<'maqe_message' | 'email' | 'phone' | 'rfq'>('maqe_message');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactModalOpp || !contactSummary.trim()) return;
    onLogContact(contactModalOpp.opportunity_id, contactChannel, contactSummary);
    setContactModalOpp(null);
    setContactSummary('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Kanban className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Opportunity CRM & Outreach Tracker</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Track commercial relationships and outbound outreach across unlocked engineering matches.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          Active Opportunities: <span className="font-bold text-slate-900">{opportunities.length}</span>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[500px]">
        {STAGES.map(stage => {
          const stageOpps = opportunities.filter(o => o.state === stage.id);
          return (
            <div
              key={stage.id}
              className={`rounded-xl border p-3 flex flex-col ${stage.color}`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 font-bold">
                  {stageOpps.length}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {stageOpps.map(opp => (
                  <div
                    key={opp.opportunity_id}
                    className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
                    onClick={() => setSelectedOpp(opp)}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        opp.direction === 'customer' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {opp.direction}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(opp.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">
                      {opp.counterparty_name || opp.counterparty_company_id}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {opp.notes || 'No notes added'}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactModalOpp(opp);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        + Log Action
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenConversation(opp);
                        }}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        Messages
                      </button>
                    </div>
                  </div>
                ))}

                {stageOpps.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-lg">
                    No leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Opportunity Detail & State Progression Drawer */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedOpp.counterparty_name}</h3>
                <span className="text-xs text-slate-500">Direction: {selectedOpp.direction}</span>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pipeline Stage</label>
                <select
                  value={selectedOpp.state}
                  onChange={(e) => {
                    const newState = e.target.value as OpportunityState;
                    onUpdateState(selectedOpp.opportunity_id, newState);
                    setSelectedOpp({ ...selectedOpp, state: newState });
                  }}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Commercial Notes</label>
                <textarea
                  defaultValue={selectedOpp.notes || ''}
                  onBlur={(e) => onUpdateState(selectedOpp.opportunity_id, selectedOpp.state, e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  placeholder="Record commercial progress, quotes, specifications..."
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900">
                <span className="font-bold">Permanent Connection:</span> Unlocked leads stay in your organisation portfolio permanently. Repeat recommendations or contact actions never consume credits.
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Contact Modal */}
      {contactModalOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Log Commercial Interaction</h3>
            <p className="text-xs text-slate-500 mt-1">Entity: {contactModalOpp.counterparty_name}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Channel</label>
                <select
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="maqe_message">MAQE In-App Message</option>
                  <option value="email">Direct Email</option>
                  <option value="phone">Telephone Call</option>
                  <option value="rfq">RFQ Submission</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Summary of Discussion</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sent sample laser cut batch, discussed tolerance"
                  value={contactSummary}
                  onChange={(e) => setContactSummary(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setContactModalOpp(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Record Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
