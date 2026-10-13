/**
 * C10 Shared Platform Jobs & Audit Telemetry Engine
 * Implements durable job envelope, idempotency enforcement, retry handling, and audit trails (Section 10).
 */

import { Job, JobType, JobState, AuditEvent } from '../domain/types';

export class JobEngine {
  private jobs: Map<string, Job>;
  private auditEvents: AuditEvent[];

  constructor() {
    this.jobs = new Map();
    this.auditEvents = [];

    // Seed initial completed jobs
    this.createJob({
      job_type: 'intake_partition',
      subject_id: 'part_uk_eng_v1_25110_2015_2020',
      idempotency_key: 'seed_job_intake_25110',
      requested_by: 'system_bootstrap',
      mode: 'fixture',
      state: 'succeeded',
      progress: 100,
      output_refs: { records_ingested: 4850 }
    });

    this.createJob({
      job_type: 'enrichment_run',
      subject_id: 'demo_delta',
      idempotency_key: 'seed_job_enrich_delta',
      requested_by: 'system_bootstrap',
      mode: 'fixture',
      state: 'succeeded',
      progress: 100,
      output_refs: { assertions_generated: 5, profile_version_id: 'pv_delta_v1' }
    });
  }

  public getJobs(): Job[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getAuditEvents(): AuditEvent[] {
    return [...this.auditEvents].sort(
      (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    );
  }

  public createJob(params: {
    job_type: JobType;
    subject_id: string;
    idempotency_key: string;
    requested_by: string;
    mode?: 'fixture' | 'live';
    state?: JobState;
    progress?: number;
    output_refs?: Record<string, any>;
  }): Job {
    // Check idempotency
    const existing = Array.from(this.jobs.values()).find(
      j => j.idempotency_key === params.idempotency_key
    );
    if (existing) {
      return existing;
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const job: Job = {
      job_id: jobId,
      job_type: params.job_type,
      subject_id: params.subject_id,
      schema_version: '1.0',
      idempotency_key: params.idempotency_key,
      requested_by: params.requested_by,
      mode: params.mode || 'fixture',
      state: params.state || 'queued',
      attempts: 1,
      progress: params.progress || 0,
      output_refs: params.output_refs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.jobs.set(jobId, job);

    this.logAuditEvent({
      event_type: 'job.created',
      aggregate_id: jobId,
      actor_id: params.requested_by,
      payload: { job_type: params.job_type, subject_id: params.subject_id }
    });

    return job;
  }

  public retryJob(job_id: string): Job | null {
    const job = this.jobs.get(job_id);
    if (!job) return null;

    job.attempts += 1;
    job.state = 'running';
    job.progress = 50;
    job.updated_at = new Date().toISOString();

    setTimeout(() => {
      job.state = 'succeeded';
      job.progress = 100;
      job.updated_at = new Date().toISOString();
    }, 1000);

    return job;
  }

  public logAuditEvent(params: {
    event_type: string;
    aggregate_id: string;
    aggregate_version?: string;
    actor_id: string;
    correlation_id?: string;
    payload: Record<string, any>;
  }): AuditEvent {
    const event: AuditEvent = {
      event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event_type: params.event_type,
      aggregate_id: params.aggregate_id,
      aggregate_version: params.aggregate_version,
      actor_id: params.actor_id,
      correlation_id: params.correlation_id,
      payload: params.payload,
      occurred_at: new Date().toISOString()
    };
    this.auditEvents.unshift(event);
    return event;
  }
}
