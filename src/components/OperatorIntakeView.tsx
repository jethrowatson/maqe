'use client';

import React, { useState } from 'react';
import { BackfillPartition, SyncWatermark } from '../lib/domain/types';
import {
  Database,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge
} from 'lucide-react';

interface OperatorIntakeViewProps {
  partitions: BackfillPartition[];
  watermarks: SyncWatermark[];
  onPause: () => void;
  onResume: () => void;
  onStepPartition: (id: string) => void;
  status: {
    is_paused: boolean;
    total_partitions: number;
    completed_partitions: number;
    running_partitions: number;
    progress_pct: number;
    records_ingested: number;
    capacity_target: number;
    mode: string;
    daily_sync_status: string;
  };
}

export function OperatorIntakeView({
  partitions,
  watermarks,
  onPause,
  onResume,
  onStepPartition,
  status
}: OperatorIntakeViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-amber-600" />
              <h1 className="text-xl font-bold text-slate-900">C01 Registry Intake & Backfill Coordinator</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              UK Companies House Public Data API adapter and 600,000 capacity backfill partition manager (Section 4 & 4A).
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            {status.is_paused ? (
              <button
                onClick={onResume}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" /> Resume Intake
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-4 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center shadow-2xs"
              >
                <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause Queue
              </button>
            )}
          </div>
        </div>

        {/* Telemetry KPI Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Capacity Progress</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {status.records_ingested.toLocaleString()}
              <span className="text-xs font-normal text-slate-400"> / {status.capacity_target.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(15, (status.records_ingested / status.capacity_target) * 100))}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Rate Limit Governor</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              118 <span className="text-xs font-normal text-slate-500">req / min</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">Cap: 600 req / 5 min (Safe)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Partitions Active</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {status.completed_partitions} / {status.total_partitions}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">Split by SIC & Date Bounds</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Daily Sync Watermark</span>
            <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">
              {watermarks[0]?.watermark_value || '2026-10-13'}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">Daily Mode: HEALTHY</span>
          </div>
        </div>
      </div>

      {/* Partition Manifest Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
          Backfill Partition Manifests (Durable Checkpoints)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Partition ID</th>
                <th className="py-2.5 px-3">SIC Code</th>
                <th className="py-2.5 px-3">Date Window</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partitions.map(p => (
                <tr key={p.partition_id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{p.partition_id}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{p.sic_code}</td>
                  <td className="py-2.5 px-3 text-slate-500">{p.start_date} → {p.end_date}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {p.records_ingested} / {p.estimated_total}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {p.status !== 'completed' && (
                      <button
                        onClick={() => onStepPartition(p.partition_id)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded border border-slate-200"
                      >
                        Step (+500)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
