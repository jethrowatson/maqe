/**
 * C11 Commerce & Subscription Engine
 * Implements Stripe-compatible subscription plans, credit packs,
 * and webhook event reconciliation (Section 12A, 12B).
 */

import { PlanTier, PlanSubscription } from '../domain/types';
import { DEFAULT_ORG_ID } from '../fixtures/cohort';

export interface CommercialPlan {
  id: PlanTier;
  name: string;
  price_gbp_monthly: number;
  monthly_credits: number;
  features: string[];
}

export const COMMERCIAL_PLANS: CommercialPlan[] = [
  {
    id: 'free',
    name: 'Free Claimed Listing',
    price_gbp_monthly: 0,
    monthly_credits: 0,
    features: [
      'Claimed company profile verification',
      'Inbound messaging receipt through MAQE',
      'Receive customer RFQs and invitations',
      'No directory search or lead outreach'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Enhanced Listing',
    price_gbp_monthly: 99,
    monthly_credits: 20,
    features: [
      'Everything in Free listing',
      'Full UK Engineering Directory & Filtered Search',
      'Initiate direct company outreach through MAQE',
      '20 monthly search unlock credits',
      'Create and distribute multi-supplier RFQs'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Intelligence',
    price_gbp_monthly: 299,
    monthly_credits: 50,
    features: [
      'Everything in Pro tier',
      'AI Directional Supplier & Customer Lead Matching',
      '50 monthly matching credits',
      'Explainable score breakdowns & evidence citations',
      'Opportunity CRM & Contact Event tracking',
      'Dedicated priority backfill scheduling'
    ]
  }
];

export interface CreditPackProduct {
  id: string;
  name: string;
  credits: number;
  price_gbp: number;
}

export const CREDIT_PACKS: CreditPackProduct[] = [
  { id: 'pack_10', name: 'Starter Lead Pack', credits: 10, price_gbp: 49 },
  { id: 'pack_25', name: 'Growth Intelligence Pack', credits: 25, price_gbp: 99 },
  { id: 'pack_50', name: 'Scale Enterprise Pack', credits: 50, price_gbp: 179 }
];

export class CommerceEngine {
  private subscriptions: Map<string, PlanSubscription>;

  constructor() {
    this.subscriptions = new Map();
    this.subscriptions.set(DEFAULT_ORG_ID, {
      subscription_id: 'sub_regent_premium',
      org_id: DEFAULT_ORG_ID,
      plan_tier: 'premium',
      monthly_credits: 50,
      status: 'active',
      current_period_start: '2026-10-01T00:00:00Z',
      current_period_end: '2026-11-01T00:00:00Z',
      cancel_at_period_end: false,
      created_at: '2026-10-01T00:00:00Z'
    });
  }

  public getSubscription(org_id: string): PlanSubscription | null {
    return this.subscriptions.get(org_id) || null;
  }

  public upgradePlan(org_id: string, new_plan: PlanTier): PlanSubscription {
    const plan = COMMERCIAL_PLANS.find(p => p.id === new_plan)!;
    const sub: PlanSubscription = {
      subscription_id: `sub_${org_id}_${new_plan}`,
      org_id,
      plan_tier: new_plan,
      monthly_credits: plan.monthly_credits,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      cancel_at_period_end: false,
      created_at: new Date().toISOString()
    };
    this.subscriptions.set(org_id, sub);
    return sub;
  }
}
