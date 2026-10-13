'use client';

import React from 'react';
import { Job, AuditEvent } from '../lib/domain/types';
import {
  Activity,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Shield
} from 'lucide-react';

interface OperatorJobsViewProps {
  jobs: Job[];
  auditEvents: AuditEvent[];
  onRetryJob: (id: string) => void;
}

export function OperatorJobsView({
  jobs,
  auditEvents,
  onRetryJob
}: OperatorJobsViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-amber-600" />
          <h1 className="text-xl font-bold text-slate-900">C10 Shared Platform Jobs & Durable Audit Log</h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Inspect durable background tasks, crash recovery leases, idempotency deduplication, and immutable audit trails (Section 10).
        </p>
      </div>

      {/* Grid: Jobs Queue + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Durable Pipeline Jobs ({jobs.length})
          </h2>

          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.job_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{job.job_type}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        job.state === 'succeeded' ? 'bg-emerald-100 text-emerald-800' :
                        job.state === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {job.state}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Subject: {job.subject_id} • Idempotency: {job.idempotency_key}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">
                      Attempts: {job.attempts}
                    </span>
                    {job.state !== 'succeeded' && (
                      <button
                        onClick={() => onRetryJob(job.job_id)}
                        className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <RotateCw className="w-3 h-3 mr-1" /> Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Immutable Audit Trail ({auditEvents.length})
          </h2>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {auditEvents.map(evt => (
              <div key={evt.event_id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 font-mono text-[11px] text-blue-700">{evt.event_type}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(evt.occurred_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Target: {evt.aggregate_id} • Actor: {evt.actor_id}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
