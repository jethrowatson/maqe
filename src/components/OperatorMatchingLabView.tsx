'use client';

import React, { useState } from 'react';
import { MatchDirection } from '../lib/domain/types';
import { MatchingEngine } from '../lib/engines/matching';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export function OperatorMatchingLabView() {
  const [direction, setDirection] = useState<MatchDirection>('customer');
  const [compatWeight, setCompatWeight] = useState(0.50);
  const [sectorWeight, setSectorWeight] = useState(0.20);
  const [geoWeight, setGeoWeight] = useState(0.15);
  const [evidenceWeight, setEvidenceWeight] = useState(0.15);
  const [excludeCompetitors, setExcludeCompetitors] = useState(true);

  const engine = new MatchingEngine();
  const results = engine.runMatch({
    focus_company_id: 'demo_delta',
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
  });

  const handleReset = () => {
    setCompatWeight(0.50);
    setSectorWeight(0.20);
    setGeoWeight(0.15);
    setEvidenceWeight(0.15);
    setExcludeCompetitors(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900">C05 Matching Algorithm Laboratory</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Calibrate scoring weights, test hard constraint filters, and verify deterministic rankings (Section 8).
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg flex items-center"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset Baseline
        </button>
      </div>

      {/* Laboratory Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Weight Sliders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Feature Weight Sliders
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Capability Compatibility</span>
                <span className="font-mono font-bold text-blue-600">{Math.round(compatWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={compatWeight}
                onChange={(e) => setCompatWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Sector / Application Fit</span>
                <span className="font-mono font-bold text-blue-600">{Math.round(sectorWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={sectorWeight}
                onChange={(e) => setSectorWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Geographic Proximity</span>
                <span className="font-mono font-bold text-blue-600">{Math.round(geoWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.05"
                value={geoWeight}
                onChange={(e) => setGeoWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Evidence Quality / Freshness</span>
                <span className="font-mono font-bold text-blue-600">{Math.round(evidenceWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.05"
                value={evidenceWeight}
                onChange={(e) => setEvidenceWeight(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Hard Constraints</h3>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeCompetitors}
                onChange={(e) => setExcludeCompetitors(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium">Exclude Competitors (Customer mode)</span>
            </label>
          </div>
        </div>

        {/* Right: Live Recalculated Ranking Table */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Live Calibrated Match Results
              </h2>
              <p className="text-xs text-slate-500">Benchmark: Delta Metalworks Ltd</p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setDirection('customer')}
                className={`px-3 py-1 rounded-md ${direction === 'customer' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                Customer
              </button>
              <button
                onClick={() => setDirection('supplier')}
                className={`px-3 py-1 rounded-md ${direction === 'supplier' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                Supplier
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Counterparty</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Decomposition (Compat/Sec/Geo/Evid)</th>
                  <th className="py-2.5 px-3">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, idx) => (
                  <tr key={r.counterparty_company_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">#{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{r.counterparty_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.counterparty_company_id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-black text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {r.score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {Math.round(r.score_components.compatibility * 100)} / {Math.round(r.score_components.sector * 100)} / {Math.round(r.score_components.geography * 100)} / {Math.round(r.score_components.evidence * 100)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                      {r.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
