'use client';

import React, { useState, useMemo } from 'react';
import { Job, JobCategory, AuditEvent } from '../lib/domain/types';
import { store } from '../lib/db/store';
import {
  Activity,
  RotateCw,
  CheckCircle2,
  Pause,
  Play,
  Clock
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | JobCategory>('all');
  const [refreshTick, setRefreshTick] = useState(0);

  const displayedJobs = useMemo(() => {
    const all = store.jobEngine.getJobs();
    if (categoryFilter === 'all') return all;
    return all.filter(j => j.job_category === categoryFilter);
  }, [jobs, categoryFilter, refreshTick]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold">
              C10 Batched Pipeline Jobs, Checkpoints & Durable Audit Trail
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Tracks batched job execution across Initial Population, Ongoing Daily Maintenance, Website Discovery, Website Enrichment, Matching Profile Analysis, and Directional Match Generation.
          </p>
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as any)}
          className="px-3 py-2 text-xs font-bold bg-slate-800 border border-slate-700 text-white rounded-xl"
        >
          <option value="all">All Pipeline Categories ({store.jobEngine.getJobs().length})</option>
          <option value="initial_population">1. Initial Population</option>
          <option value="ongoing_maintenance">2. Ongoing Daily Maintenance</option>
          <option value="discovery">3. Website Discovery</option>
          <option value="enrichment">4. Website Enrichment</option>
          <option value="matching_profile_analysis">5. Matching Profile Analysis</option>
          <option value="match_generation">6. Directional Match Generation</option>
        </select>
      </div>

      {/* Grid: Jobs Queue + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Jobs List (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Batched Pipeline Jobs ({displayedJobs.length})
          </h2>

          <div className="space-y-3">
            {displayedJobs.map(job => (
              <div
                key={job.job_id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{job.job_type}</span>
                      {job.job_category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {job.job_category.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.state === 'succeeded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.state === 'dormant'
                            ? 'bg-slate-200 text-slate-800'
                            : job.state === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : job.state === 'paused'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {job.state}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Job ID: {job.job_id} • Scope: {job.scope || 'default'} • Batch Size:{' '}
                      {job.batch_size || 100}
                    </div>
                    {job.schedule_info && (
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Schedule: <strong>{job.schedule_info}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {job.state === 'running' && (
                      <button
                        onClick={() => {
                          store.jobEngine.pauseJob(job.job_id);
                          setRefreshTick(t => t + 1);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    )}
                    {job.state === 'paused' && (
                      <button
                        onClick={() => {
                          store.jobEngine.resumeJob(job.job_id);
                          setRefreshTick(t => t + 1);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Resume
                      </button>
                    )}
                    {job.state !== 'succeeded' && job.state !== 'dormant' && (
                      <button
                        onClick={() => {
                          onRetryJob(job.job_id);
                          setRefreshTick(t => t + 1);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" /> Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Item Counters & Checkpoint Cursor */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    Processed: <strong>{job.processed_items ?? 0}</strong> / {job.total_items ?? 0}
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-emerald-700">
                    Succeeded: <strong>{job.succeeded_items ?? 0}</strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-amber-700">
                    Skipped/Dedup: <strong>{job.skipped_items ?? 0}</strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-rose-700">
                    Failed: <strong>{job.failed_items ?? 0}</strong>
                  </div>
                </div>

                {job.checkpoint_cursor && (
                  <div className="text-[10px] font-mono text-slate-500">
                    Checkpoint Cursor: <strong className="text-slate-700">{job.checkpoint_cursor}</strong>
                  </div>
                )}

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      job.state === 'succeeded' || job.state === 'dormant'
                        ? 'bg-emerald-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Immutable Audit Trail ({auditEvents.length})
          </h2>

          <div className="space-y-2 max-h-[620px] overflow-y-auto">
            {auditEvents.map(evt => (
              <div
                key={evt.event_id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-[11px] text-blue-700">
                    {evt.event_type}
                  </span>
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
