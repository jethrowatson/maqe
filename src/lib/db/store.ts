/**
 * MAQE Unified Database & Engine Store
 * Bridges live remote MariaDB API (https://jethrowatson.co.uk/maqe/api/)
 * with client-side reactive state and deterministic Phase One engine execution.
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
  PhaseOneCompanySchema
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

const REMOTE_API_URL = 'https://jethrowatson.co.uk/maqe/api/index.php';
const MAQE_API_KEY = 'maqe_live_sec_994b26f';

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

  public async checkRemoteApi(): Promise<boolean> {
    try {
      const res = await fetch(`${REMOTE_API_URL}?action=health`, { signal: AbortSignal.timeout(3000) });
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
    return REAL_COHORT_SUMMARY;
  }

  public getPhaseOneSchema(company_id: string): PhaseOneCompanySchema | undefined {
    return hydratePhaseOneSchema(company_id);
  }

  // --- Companies & Profiles ---
  public getCompanies(): CompanyRecord[] {
    return FIXTURE_COMPANIES;
  }

  public getCompany(id: string): CompanyRecord | undefined {
    return FIXTURE_COMPANIES.find(c => c.company_id === id);
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
