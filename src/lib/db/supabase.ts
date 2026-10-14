/**
 * MAQE Shared Database Persistence Layer (Supabase PostgREST + Cloud API + Local State)
 * Implements Prompt 1 Shared Data Structure:
 * - Connects to Supabase tables (`maqe_companies`, `maqe_candidate_websites`,
 *   `maqe_enrichment_profiles`, `maqe_matching_profiles`, `maqe_directional_connections`,
 *   `maqe_match_batch_deliveries`, `maqe_jobs`, `maqe_registry_change_history`)
 *   when NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.
 * - Transparently reports whether live Supabase credentials are present or if
 *   operating via the Cloud MariaDB Gateway / deterministic local store.
 */

export interface DatabaseConnectionStatus {
  mode: 'supabase_postgres' | 'cloud_mariadb_gateway' | 'local_persistent_store';
  supabaseConfigured: boolean;
  supabaseUrl: string | null;
  cloudGatewayConnected: boolean;
  activePersistenceMode: 'supabase_postgres' | 'cloud_mariadb_gateway' | 'local_persistent_store';
  tablesDistinguished: string[];
  schemaVersion: string;
}

export type SupabaseConnectionInfo = DatabaseConnectionStatus;

const SUPABASE_URL =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || null : null;
const SUPABASE_ANON_KEY =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null : null;

export class SupabaseAdapter {
  private url: string | null;
  private anonKey: string | null;
  private cloudGatewayConnected: boolean = false;

  constructor() {
    this.url = SUPABASE_URL;
    this.anonKey = SUPABASE_ANON_KEY;
  }

  public isSupabaseConfigured(): boolean {
    return Boolean(this.url && this.anonKey);
  }

  public setCloudGatewayConnected(connected: boolean): void {
    this.cloudGatewayConnected = connected;
  }

  public getConnectionInfo(): SupabaseConnectionInfo {
    return this.getStatus();
  }

  public getStatus(): DatabaseConnectionStatus {
    const supabaseConfigured = this.isSupabaseConfigured();
    const mode = supabaseConfigured
      ? 'supabase_postgres'
      : this.cloudGatewayConnected
      ? 'cloud_mariadb_gateway'
      : 'local_persistent_store';
    return {
      mode,
      supabaseConfigured,
      supabaseUrl: this.url,
      cloudGatewayConnected: this.cloudGatewayConnected,
      activePersistenceMode: mode,
      tablesDistinguished: [
        'maqe_companies (Companies House Registry Records & Pipeline States)',
        'maqe_registry_change_history (Source Field Changes & Reassessment Flags)',
        'maqe_candidate_websites (1:N Candidate Websites, Confidence & Evidence)',
        'maqe_enrichment_profiles (Schema-Driven Website Extractions & Completeness)',
        'maqe_matching_profiles (Stored Matching Profile Analysis & Inferred Criteria)',
        'maqe_directional_connections (Scored Supplier & Customer Connections)',
        'maqe_match_batch_deliveries (Ranked Batch Delivery & Non-Repeat Ledger)',
        'maqe_jobs (Batched Pipeline Jobs, Cursors & Audit History)'
      ],
      schemaVersion: '1.0.0-phase1 (Supabase PostgreSQL & MariaDB Canonical)'
    };
  }

  public async upsertRecord(table: string, payload: Record<string, any>): Promise<boolean> {
    if (!this.isSupabaseConfigured()) {
      return false;
    }
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: this.anonKey!,
          Authorization: `Bearer ${this.anonKey!}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async selectRecords<T = any>(table: string, query: string = ''): Promise<T[] | null> {
    if (!this.isSupabaseConfigured()) {
      return null;
    }
    try {
      const qs = query ? `?${query}` : '';
      const res = await fetch(`${this.url}/rest/v1/${table}${qs}`, {
        method: 'GET',
        headers: {
          apikey: this.anonKey!,
          Authorization: `Bearer ${this.anonKey!}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) return null;
      return (await res.json()) as T[];
    } catch {
      return null;
    }
  }
}

export const supabaseAdapter = new SupabaseAdapter();
