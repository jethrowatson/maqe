'use client';

import React, { useState } from 'react';
import { RFQ, RFQTemplate, CompanyRecord } from '../lib/domain/types';
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  Users,
  Calendar,
  Layers,
  ChevronRight,
  Shield
} from 'lucide-react';

interface RFQManagerViewProps {
  rfqs: RFQ[];
  templates: RFQTemplate[];
  availableSuppliers: CompanyRecord[];
  onDispatchRFQ: (
    title: string,
    desc: string,
    responseDate: string,
    selectedSuppliers: { id: string; name: string }[]
  ) => void;
}

export function RFQManagerView({
  rfqs,
  templates,
  availableSuppliers,
  onDispatchRFQ
}: RFQManagerViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responseDate, setResponseDate] = useState('2026-11-01');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  const handleApplyTemplate = (tmpl: RFQTemplate) => {
    setTitle(tmpl.title);
    setDescription(tmpl.requirement_description);
  };

  const toggleSupplier = (id: string) => {
    if (selectedSupplierIds.includes(id)) {
      setSelectedSupplierIds(selectedSupplierIds.filter(s => s !== id));
    } else {
      setSelectedSupplierIds([...selectedSupplierIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedSupplierIds.length === 0) return;

    const suppliers = availableSuppliers
      .filter(s => selectedSupplierIds.includes(s.company_id))
      .map(s => ({ id: s.company_id, name: s.legal_name }));

    onDispatchRFQ(title, description, responseDate, suppliers);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setSelectedSupplierIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Request for Quotation (RFQ) Procurement</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Dispatch specifications to verified suppliers with automated blind individual bidder threads.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New RFQ
        </button>
      </div>

      {/* RFQ List */}
      <div className="grid grid-cols-1 gap-4">
        {rfqs.map(rfq => (
          <div key={rfq.rfq_id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">{rfq.title}</h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                    {rfq.state}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{rfq.requirement_description}</p>
                <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Response Deadline: {rfq.requested_response_date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {rfq.recipients?.length || 0} Suppliers Invited
                  </span>
                </div>
              </div>
            </div>

            {/* Recipient Thread Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                <Shield className="w-3.5 h-3.5 text-blue-600 mr-1" />
                Blind Recipient Threads (Bidders cannot see competitors):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {rfq.recipients?.map(rec => (
                  <div key={rec.recipient_id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{rec.supplier_company_name || rec.supplier_company_id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Thread: {rec.individual_thread_id.substring(0, 16)}...</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {rfqs.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active RFQs</p>
            <p className="text-xs text-slate-500 mt-1">Create an RFQ to request competitive bids from verified engineering suppliers.</p>
          </div>
        )}
      </div>

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Create & Dispatch Engineering RFQ</h3>
            <p className="text-xs text-slate-500 mt-1">Instantiate an RFQ template or compose custom specifications.</p>

            {/* Quick Template Picker */}
            {templates.length > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Apply Standard Template:</span>
                <div className="flex flex-wrap gap-2">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.template_id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded text-xs bg-white border border-slate-300 hover:border-blue-500 font-medium text-slate-800"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">RFQ Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Laser Profiling & Bending for Server Rack Enclosures"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Requirement & Specifications</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail tolerances, materials (mild steel, stainless, aluminium), expected batch quantities, and compliance certifications..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Response Deadline</label>
                <input
                  type="date"
                  required
                  value={responseDate}
                  onChange={(e) => setResponseDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Verified Suppliers ({selectedSupplierIds.length} chosen)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {availableSuppliers.filter(s => s.company_id !== 'demo_delta').map(s => {
                    const isChecked = selectedSupplierIds.includes(s.company_id);
                    return (
                      <div
                        key={s.company_id}
                        onClick={() => toggleSupplier(s.company_id)}
                        className={`p-2 rounded-md flex items-center justify-between cursor-pointer text-xs ${
                          isChecked ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-white hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="font-semibold">{s.legal_name}</div>
                        <span className="text-[10px] text-slate-500 font-mono">SIC: {s.sic_codes.join(', ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedSupplierIds.length === 0}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Dispatch RFQ ({selectedSupplierIds.length} Blind Threads)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
