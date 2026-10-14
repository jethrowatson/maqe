/**
 * MAQE Unified Database & Engine Store
 * Bridges Supabase PostgreSQL (`SupabaseAdapter`), remote MariaDB API (`https://jethrowatson.co.uk/maqe/api/`),
 * and deterministic in-memory stores across all 6 pipeline stages (Prompts 1–9).
 */

import {
  CompanyRecord,
  ProfileVersion,
  MatchCandidateResult,
  MatchDirection,
  CreditWallet,
  LedgerEntry,
  Opportunity,
  Conversation,
  Message,
  RFQ,
  OpportunityState,
  PlanTier,
  AdminEnrichmentSummary,
  PhaseOneCompanySchema,
  CandidateWebsite,
  MatchingProfileAnalysis,
  DeliveredMatchBatch,
  MatchBatchPreview,
  CompletenessBand
} from '../domain/types';
import {
  FIXTURE_COMPANIES,
  DEFAULT_FOCUS_COMPANY_ID,
  DEFAULT_ORG_ID,
  REAL_COHORT_SUMMARY,
  hydratePhaseOneSchema
} from '../fixtures/cohort';
import { MatchingEngine } from '../engines/matching';
import { CreditLedgerEngine } from '../engines/credits';
import { IntakeEngine } from '../engines/intake';
import { DiscoveryEngine } from '../engines/discovery';
import { EnrichmentEngine } from '../engines/enrichment';
import { ClassificationEngine } from '../engines/classification';
import { NetworkingEngine } from '../engines/networking';
import { JobEngine } from '../engines/jobs';
import { CommerceEngine } from '../engines/commerce';
import { NotificationEngine } from '../engines/notifications';
import { supabaseAdapter, SupabaseConnectionInfo } from './supabase';

const REMOTE_API_URL = 'https://jethrowatson.co.uk/maqe/api/index.php';
const MAQE_API_KEY = 'maqe_live_sec_994b26f';

export interface CompanyDatasetFilterOptions {
  search?: string;
  sic_code?: string;
  sic_category?: string;
  extracted_offering_query?: string;
  postcode_or_locality?: string;
  candidate_website_filter?:
    | 'all'
    | 'has_candidates'
    | 'multiple_candidates'
    | 'dissimilar_corroborated'
    | 'no_website_found'
    | 'unprocessed';
  confidence_filter?: 'all' | 'gte_85' | 'gte_70' | 'below_70';
  company_status?: 'all' | 'active' | 'dissolved' | 'liquidation';
  discovery_status?:
    | 'all'
    | 'unprocessed'
    | 'completed_with_candidates'
    | 'completed_no_website_found'
    | 'failed';
  enrichment_status?:
    | 'all'
    | 'completed'
    | 'partial'
    | 'unprocessed'
    | 'awaiting_approved_candidate'
    | 'failed';
  completeness_band?: 'all' | CompletenessBand;
  reassessment_filter?:
    | 'all'
    | 'any_pending'
    | 'name_change'
    | 'discovery_pending'
    | 'enrichment_pending'
    | 'matching_profile_pending'
    | 'matching_pending';
}

export class MAQEStore {
  private static instance: MAQEStore;

  public intakeEngine: IntakeEngine;
  public discoveryEngine: DiscoveryEngine;
  public enrichmentEngine: EnrichmentEngine;
  public classificationEngine: ClassificationEngine;
  public matchingEngine: MatchingEngine;
  public creditEngine: CreditLedgerEngine;
  public networkingEngine: NetworkingEngine;
  public jobEngine: JobEngine;
  public commerceEngine: CommerceEngine;
  public notificationEngine: NotificationEngine;

  public activeOrgId: string = DEFAULT_ORG_ID;
  public activeCompanyId: string = DEFAULT_FOCUS_COMPANY_ID;
  public userRole: 'member' | 'operator' = 'member';
  public cloudApiConnected: boolean = true;

  private constructor() {
    this.intakeEngine = new IntakeEngine();
    this.discoveryEngine = new DiscoveryEngine();
    this.enrichmentEngine = new EnrichmentEngine();
    this.classificationEngine = new ClassificationEngine();
    this.matchingEngine = new MatchingEngine();
    this.creditEngine = new CreditLedgerEngine();
    this.networkingEngine = new NetworkingEngine();
    this.jobEngine = new JobEngine();
    this.commerceEngine = new CommerceEngine();
    this.notificationEngine = new NotificationEngine();

    if (typeof window !== 'undefined') {
      this.checkRemoteApi();
    }
  }

  public static getInstance(): MAQEStore {
    if (!MAQEStore.instance) {
      MAQEStore.instance = new MAQEStore();
    }
    return MAQEStore.instance;
  }

  public getDatabaseConnectionInfo(): SupabaseConnectionInfo {
    return supabaseAdapter.getConnectionInfo();
  }

  public async checkRemoteApi(): Promise<boolean> {
    try {
      const res = await fetch(`${REMOTE_API_URL}?action=health`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        this.cloudApiConnected = true;
        return true;
      }
    } catch {
      this.cloudApiConnected = false;
    }
    return false;
  }

  // --- Admin Summary & Phase One Schema Access ---
  public getEnrichmentSummary(): AdminEnrichmentSummary {
    this.enrichmentEngine.recomputeCohortEnrichmentSummary();
    return REAL_COHORT_SUMMARY;
  }

  public getPhaseOneSchema(company_id: string): PhaseOneCompanySchema | undefined {
    return hydratePhaseOneSchema(company_id);
  }

  // --- Companies, Dataset Filtering (Prompt 5) & Profiles ---
  public getCompanies(): CompanyRecord[] {
    return FIXTURE_COMPANIES;
  }

  public getCompany(id: string): CompanyRecord | undefined {
    return FIXTURE_COMPANIES.find(c => c.company_id === id);
  }

  public getCompanyByRegistrationNumber(regNo: string): CompanyRecord | undefined {
    return FIXTURE_COMPANIES.find(c => c.registration_number === regNo.trim());
  }

  /**
   * Queries and filters the Company Dataset across all 12 operator criteria required by Prompt 5.
   * Performs filtering over the full stored dataset prior to UI pagination.
   */
  public queryCompanyDataset(filters: CompanyDatasetFilterOptions): CompanyRecord[] {
    return FIXTURE_COMPANIES.filter(c => {
      // 1. Search by name, previous name, reg number, or website domain
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesName =
          c.legal_name.toLowerCase().includes(q) ||
          (c.display_name || '').toLowerCase().includes(q) ||
          (c.previous_names || []).some(pn => pn.toLowerCase().includes(q));
        const matchesReg = c.registration_number.toLowerCase().includes(q);
        const matchesWeb =
          (c.website_domain || '').toLowerCase().includes(q) ||
          (c.website_url || '').toLowerCase().includes(q);
        if (!matchesName && !matchesReg && !matchesWeb) return false;
      }

      // 2. Filter by SIC code
      if (filters.sic_code && filters.sic_code !== 'all') {
        if (!c.sic_codes.includes(filters.sic_code) && c.primary_sic !== filters.sic_code) {
          return false;
        }
      }

      // 3. Filter by SIC category
      if (filters.sic_category && filters.sic_category !== 'all') {
        if ((c.sic_category || '').toLowerCase() !== filters.sic_category.toLowerCase()) {
          return false;
        }
      }

      // 4. Filter by extracted website industry/offering text (distinct from registry SIC label)
      if (filters.extracted_offering_query && filters.extracted_offering_query.trim()) {
        const oq = filters.extracted_offering_query.toLowerCase().trim();
        if (!c.enrichment_metrics?.is_website_enriched) return false;
        const schema = hydratePhaseOneSchema(c.company_id);
        const textBlob = [
          c.detailed_business_description || '',
          ...(schema?.offerings.map(o => o.name) || []),
          ...(schema?.capabilities.map(cap => cap.name) || []),
          ...(schema?.markets.map(m => m.label) || [])
        ]
          .join(' ')
          .toLowerCase();
        if (!textBlob.includes(oq)) return false;
      }

      // 5. Filter by postcode or locality
      if (filters.postcode_or_locality && filters.postcode_or_locality.trim()) {
        const pq = filters.postcode_or_locality.toLowerCase().trim();
        const addrMatch =
          (c.addresses.postal_code || '').toLowerCase().includes(pq) ||
          (c.addresses.locality || '').toLowerCase().includes(pq) ||
          (c.addresses.registered || '').toLowerCase().includes(pq);
        if (!addrMatch) return false;
      }

      // 6. Filter by Candidate Website presence / multi-candidate / dissimilar domain
      const cands = c.candidate_websites || [];
      if (filters.candidate_website_filter && filters.candidate_website_filter !== 'all') {
        if (filters.candidate_website_filter === 'has_candidates' && cands.length === 0) {
          return false;
        }
        if (filters.candidate_website_filter === 'multiple_candidates' && cands.length < 2) {
          return false;
        }
        if (
          filters.candidate_website_filter === 'dissimilar_corroborated' &&
          !cands.some(cw => cw.score_breakdown.dissimilar_domain_corroborated)
        ) {
          return false;
        }
        if (
          filters.candidate_website_filter === 'no_website_found' &&
          c.pipeline_state?.discovery_status !== 'completed_no_website_found'
        ) {
          return false;
        }
        if (
          filters.candidate_website_filter === 'unprocessed' &&
          c.pipeline_state?.discovery_status !== 'unprocessed'
        ) {
          return false;
        }
      }

      // 7. Filter by Candidate Website confidence score
      if (filters.confidence_filter && filters.confidence_filter !== 'all') {
        const maxConf = cands.length > 0 ? Math.max(...cands.map(cw => cw.confidence_score)) : -1;
        if (filters.confidence_filter === 'gte_85' && maxConf < 0.85) return false;
        if (filters.confidence_filter === 'gte_70' && maxConf < 0.70) return false;
        if (filters.confidence_filter === 'below_70' && (maxConf < 0 || maxConf >= 0.70)) return false;
      }

      // 8. Filter by Company Status
      if (filters.company_status && filters.company_status !== 'all') {
        if (c.status !== filters.company_status) return false;
      }

      // 9. Filter by Discovery Status
      if (filters.discovery_status && filters.discovery_status !== 'all') {
        if (c.pipeline_state?.discovery_status !== filters.discovery_status) return false;
      }

      // 10. Filter by Enrichment Status
      if (filters.enrichment_status && filters.enrichment_status !== 'all') {
        if (c.pipeline_state?.enrichment_status !== filters.enrichment_status) return false;
      }

      // 11. Filter by Completeness Band
      if (filters.completeness_band && filters.completeness_band !== 'all') {
        if (c.enrichment_metrics?.completeness_band !== filters.completeness_band) return false;
      }

      // 12. Filter by Reassessment Flag
      if (filters.reassessment_filter && filters.reassessment_filter !== 'all') {
        const flags = c.pipeline_state?.reassessment_flags;
        if (!flags) return false;
        if (
          filters.reassessment_filter === 'any_pending' &&
          c.pipeline_state?.source_change_status !== 'changed_pending_review' &&
          !flags.discovery_pending &&
          !flags.enrichment_pending &&
          !flags.matching_profile_pending &&
          !flags.matching_pending
        ) {
          return false;
        }
        if (
          filters.reassessment_filter === 'name_change' &&
          flags.policy_flag !== 'name_change_reassessment'
        ) {
          return false;
        }
        if (filters.reassessment_filter === 'discovery_pending' && !flags.discovery_pending) {
          return false;
        }
        if (filters.reassessment_filter === 'enrichment_pending' && !flags.enrichment_pending) {
          return false;
        }
        if (
          filters.reassessment_filter === 'matching_profile_pending' &&
          !flags.matching_profile_pending
        ) {
          return false;
        }
        if (filters.reassessment_filter === 'matching_pending' && !flags.matching_pending) {
          return false;
        }
      }

      return true;
    });
  }

  public getCandidateWebsites(company_id?: string): CandidateWebsite[] {
    return this.discoveryEngine.getCandidateWebsites(company_id);
  }

  public getMatchingProfileAnalysis(company_id: string): MatchingProfileAnalysis | undefined {
    return this.matchingEngine.getMatchingProfileAnalysis(company_id);
  }

  public previewMatchBatch(params: {
    company_id: string;
    direction: MatchDirection;
    batch_size: number;
    min_score: number;
  }): MatchBatchPreview {
    return this.matchingEngine.previewMatchBatch(params);
  }

  public deliverMatchBatch(params: {
    company_id: string;
    direction: MatchDirection;
    batch_size: number;
    min_score: number;
    delivered_by?: string;
  }): DeliveredMatchBatch {
    return this.matchingEngine.deliverMatchBatch(params);
  }

  public getDeliveredBatches(company_id?: string, direction?: MatchDirection): DeliveredMatchBatch[] {
    return this.matchingEngine.getDeliveredBatches(company_id, direction);
  }

  public getProfile(id: string): ProfileVersion | null {
    return this.classificationEngine.getCurrentProfile(id);
  }

  // --- Matching ---
  public getMatches(focus_id: string, direction: MatchDirection): MatchCandidateResult[] {
    const unlockedIds = new Set<string>();
    for (const c of FIXTURE_COMPANIES) {
      if (this.creditEngine.isUnlocked(this.activeOrgId, focus_id, c.company_id)) {
        unlockedIds.add(c.company_id);
      }
    }

    return this.matchingEngine.runMatch({
      focus_company_id: focus_id,
      direction,
      unlocked_company_ids: unlockedIds
    });
  }

  public getAllCohortMatches(direction?: MatchDirection): MatchCandidateResult[] {
    return this.matchingEngine.getAllCohortMatches(direction);
  }

  // --- Unlock Flow with Non-Double Charge Protection ---
  public async unlockCandidate(
    focus_id: string,
    counterparty_id: string,
    direction: MatchDirection
  ): Promise<{ success: boolean; message: string; balance: number }> {
    if (typeof window !== 'undefined' && this.cloudApiConnected) {
      try {
        const res = await fetch(`${REMOTE_API_URL}?action=unlock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MAQE-Key': MAQE_API_KEY
          },
          body: JSON.stringify({
            org_id: this.activeOrgId,
            focus_company_id: focus_id,
            counterparty_company_id: counterparty_id,
            direction
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.creditEngine.unlockMatch(this.activeOrgId, focus_id, counterparty_id, direction);
          return {
            success: true,
            message: data.already_unlocked
              ? 'Candidate is already permanently unlocked for your organisation.'
              : 'Successfully unlocked intelligence and contact channels.',
            balance: data.balance_remaining
          };
        }
      } catch {
        // Fallback to local deterministic engine
      }
    }

    const res = this.creditEngine.unlockMatch(this.activeOrgId, focus_id, counterparty_id, direction);
    if (!res.success) {
      return {
        success: false,
        message: res.error || 'Failed to unlock candidate',
        balance: res.balance_remaining
      };
    }

    if (!res.already_unlocked) {
      const counterparty = this.getCompany(counterparty_id);
      const newOpp: Opportunity = {
        opportunity_id: `opp_${Date.now()}_${counterparty_id}`,
        org_id: this.activeOrgId,
        focus_company_id: focus_id,
        counterparty_company_id: counterparty_id,
        counterparty_name: counterparty?.legal_name || counterparty_id,
        registration_number: counterparty?.registration_number,
        addresses: counterparty?.addresses,
        direction,
        state: 'prospective',
        notes: 'Unlocked via MAQE Phase One Matching Engine',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      (this.networkingEngine as any).opportunities.set(newOpp.opportunity_id, newOpp);
    }

    return {
      success: true,
      message: res.already_unlocked
        ? 'Candidate is already permanently unlocked for your organisation.'
        : 'Successfully unlocked intelligence and contact channels.',
      balance: res.balance_remaining
    };
  }

  // --- Credits & Wallet ---
  public getCreditBalance(): number {
    return this.creditEngine.getTotalCredits(this.activeOrgId);
  }

  public getWallet(): CreditWallet {
    return this.creditEngine.getWallet(this.activeOrgId);
  }

  public getLedger(): LedgerEntry[] {
    return this.creditEngine.getLedger(this.activeOrgId);
  }

  // --- CRM & Networking ---
  public getOpportunities(): Opportunity[] {
    return this.networkingEngine.getOpportunities(this.activeOrgId);
  }

  public updateOpportunityState(id: string, state: OpportunityState, notes?: string): Opportunity | null {
    return this.networkingEngine.updateOpportunityState(id, state, notes);
  }

  public getConversations(): Conversation[] {
    return this.networkingEngine.getConversations(this.activeOrgId);
  }

  public sendMessage(conversation_id: string, text: string): Message {
    const activeCo = this.getCompany(this.activeCompanyId);
    return this.networkingEngine.sendMessage(
      conversation_id,
      this.activeOrgId,
      'usr_regent_ops',
      `Operations Director (${activeCo?.display_name || 'Regent Engineering Co (Walsall) Ltd'})`,
      text
    );
  }

  public getRFQs(): RFQ[] {
    return this.networkingEngine.getRFQs(this.activeOrgId);
  }

  public dispatchRFQ(title: string, desc: string, date: string, suppliers: { id: string; name: string }[]): RFQ {
    return this.networkingEngine.dispatchRFQ(this.activeOrgId, title, desc, date, suppliers);
  }

  // --- Commerce ---
  public upgradePlan(tier: PlanTier) {
    const sub = this.commerceEngine.upgradePlan(this.activeOrgId, tier);
    if (tier === 'pro') {
      this.creditEngine.grantCredits(this.activeOrgId, 20, 'monthly_grant', sub.subscription_id, 'Pro Plan Monthly Allowance (20 credits)');
    } else if (tier === 'premium') {
      this.creditEngine.grantCredits(this.activeOrgId, 50, 'monthly_grant', sub.subscription_id, 'Premium Plan Monthly Allowance (50 credits)');
    }
  }

  public purchasePack(credits: number, pack_id: string, price: number) {
    this.creditEngine.grantCredits(this.activeOrgId, credits, 'pack_purchase', pack_id, `Purchased Credit Pack (+${credits} credits, £${price})`);
  }
}

export const store = MAQEStore.getInstance();
