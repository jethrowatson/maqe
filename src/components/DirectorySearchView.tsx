'use client';

import React, { useState } from 'react';
import { CompanyRecord, ProfileVersion } from '../lib/domain/types';
import {
  Search,
  Filter,
  Building,
  MapPin,
  CheckCircle,
  Shield,
  Layers,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface DirectorySearchViewProps {
  companies: CompanyRecord[];
  getProfile: (id: string) => ProfileVersion | null;
  onSelectCompany: (company: CompanyRecord) => void;
}

export function DirectorySearchView({
  companies,
  getProfile,
  onSelectCompany
}: DirectorySearchViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSic, setSelectedSic] = useState<string>('all');

  const filtered = companies.filter(c => {
    const matchesSearch =
      c.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registration_number.includes(searchTerm) ||
      c.trading_names.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSic =
      selectedSic === 'all' ||
      c.sic_codes.some(s => s.startsWith(selectedSic));

    return matchesSearch && matchesSic;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">UK Engineering Super-Database</h1>
            <p className="text-sm text-slate-600 mt-1">
              Classified directory of precision manufacturers, raw material producers, and industrial engineering vendors.
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-md border border-blue-200">
            Pro Filtered Access
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company name, registration number, or trading name..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedSic}
              onChange={(e) => setSelectedSic(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Engineering SIC Sectors</option>
              <option value="25">Fabricated Metal Products (SIC 25)</option>
              <option value="24">Basic Metals & Alloys (SIC 24)</option>
              <option value="28">Machinery & Equipment (SIC 28)</option>
              <option value="29">Automotive & Motor Parts (SIC 29)</option>
              <option value="26">Computer & Electronic (SIC 26)</option>
              <option value="49">Transport & Freight (SIC 49)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Company List */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(comp => {
          const profile = getProfile(comp.company_id);
          return (
            <div
              key={comp.company_id}
              onClick={() => onSelectCompany(comp)}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="sm:flex sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{comp.legal_name}</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Reg: {comp.registration_number}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {comp.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {comp.addresses.registered || comp.addresses.country}
                    </span>
                    <span>•</span>
                    <span className="font-mono">SIC: {comp.sic_codes.join(', ')}</span>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                  <span className="text-xs font-semibold text-blue-600 flex items-center">
                    View Dossier
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </span>
                </div>
              </div>

              {/* Profiles Concepts */}
              {profile && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {profile.provides.slice(0, 3).map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                      Provides: {p.label || p.concept_id}
                    </span>
                  ))}
                  {profile.uses.slice(0, 2).map((u, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Uses: {typeof u === 'string' ? u : u.label || u.concept_id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
