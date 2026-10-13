/**
 * MAQE Engineering Intelligence Platform - Domain Types & Data Contracts
 * Specifications based on MAQE Technical Build Addendum v1.1
 */

// =========================================================================
// C01 Registry Intake
// =========================================================================

export type JurisdictionCode = 'GB' | 'US' | 'DE' | 'FR' | string;

export interface CompanyAddress {
  registered?: string;
  trading?: string;
  locality?: string;
  postal_code?: string;
  country: string;
}

export interface CompanyRecord {
  company_id: string;
  jurisdiction: JurisdictionCode;
  registry_namespace: string; // e.g. 'companies_house'
  registration_number: string;
  legal_name: string;
  trading_names: string[];
  status: 'active' | 'dissolved' | 'liquidation' | 'receivership' | 'converted-closed';
  sic_codes: string[];
  incorporation_date?: string; // YYYY-MM-DD
  addresses: CompanyAddress;
  source_updated_at?: string;
  ingested_at: string;
  profile?: ProfileVersion;
  assertions?: Assertion[];
}

export interface BackfillPartition {
  partition_id: string;
  cohort_version: string;
  sic_code: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  records_ingested: number;
  cursor_pos?: string;
  estimated_total: number;
  created_at: string;
  updated_at: string;
}

export interface SyncWatermark {
  source_id: string;
  watermark_type: string;
  watermark_value: string;
  records_processed: number;
  last_success_at: string;
}

// =========================================================================
// C02 Discovery & Document Retrieval
// =========================================================================

export type SourceType = 'official_website' | 'linkedin' | 'directory' | 'mention';
export type DecisionState = 'pending' | 'approved' | 'rejected';

export interface IdentitySignals {
  reg_no_match?: boolean;
  domain_match?: boolean;
  name_similarity: number; // 0.0 to 1.0
  address_match?: boolean;
  phone_match?: boolean;
}

export interface SourceAssociation {
  association_id: string;
  company_id: string;
  url: string;
  source_type: SourceType;
  discovery_run_id: string;
  identity_signals: IdentitySignals;
  confidence: number; // 0.0 to 1.0
  decision: DecisionState;
  reviewer?: string;
  review_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SourceDocument {
  document_id: string;
  association_id: string;
  canonical_url: string;
  fetched_at: string;
  content_hash: string;
  media_type: string;
  language: string;
  retrieval_status: 'success' | 'http_error' | 'blocked' | 'timeout';
  body_ref: string;
  document_title?: string;
  extracted_text?: string;
}

// =========================================================================
// C03 AI Enrichment
// =========================================================================

export type AssertionBasis = 'observed' | 'inferred';

export interface EvidenceRef {
  document_id: string;
  span?: string;
  text_snippet?: string;
}

export interface Assertion {
  assertion_id: string;
  company_id: string;
  subject: string; // e.g. 'offering', 'requirement', 'facility'
  field: string; // e.g. 'provides', 'uses', 'serves', 'likely_needs'
  typed_value: Record<string, any>;
  basis: AssertionBasis;
  supporting_assertion_ids?: string[];
  evidence_refs: EvidenceRef[];
  confidence: number;
  rationale?: string;
  model_run_id: string;
  validity_status: 'valid' | 'retracted' | 'superseded';
  created_at: string;
}

// =========================================================================
// C04 Classification & Published Profile
// =========================================================================

export interface ConceptItem {
  concept_id: string;
  label: string;
  basis?: AssertionBasis;
  confidence?: number;
  assertion_id?: string;
  evidence_refs?: EvidenceRef[];
}

export interface ProfileQualityIndicators {
  matchable: boolean;
  review_status: 'accepted' | 'under_review' | 'insufficient_evidence';
  coverage: number; // 0.0 to 1.0
  freshness_days?: number;
}

export interface ProfileVersion {
  profile_version_id: string;
  company_id: string;
  schema_version: string;
  source_bundle_version: string;
  taxonomy_version: string;
  published_at: string;
  provides: ConceptItem[];
  uses: (ConceptItem | string)[];
  serves: string[];
  likely_needs: (ConceptItem | string)[];
  relationships: any[];
  quality_indicators: ProfileQualityIndicators;
  is_current?: boolean;
}

// =========================================================================
// C05 Directional Matching & Ranking
// =========================================================================

export type MatchDirection = 'customer' | 'supplier';

export interface ScoreComponents {
  compatibility: number; // 0.0 to 1.0
  sector: number;        // 0.0 to 1.0
  geography: number;     // 0.0 to 1.0
  evidence: number;      // 0.0 to 1.0
}

export interface MatchEdge {
  edge_id: string;
  focus_company_id: string;
  counterparty_company_id: string;
  relation_family: string;
  supported_direction_views: MatchDirection[];
  current_state: 'fresh' | 'stale' | 'recalculating' | 'ineligible';
  updated_at: string;
}

export interface MatchAssessment {
  assessment_id: string;
  edge_id: string;
  direction: MatchDirection;
  score: number; // 0 to 100
  score_components: ScoreComponents;
  coverage: number;
  explanation: string;
  supporting_assertions: string[];
  algorithm_version: string;
  evaluated_at: string;
}

export interface MatchCandidateResult {
  edge_id: string;
  focus_company_id: string;
  counterparty_company_id: string;
  counterparty_name: string;
  registration_number: string;
  addresses?: CompanyAddress;
  sic_codes?: string[];
  assessment_id: string;
  direction: MatchDirection;
  score: number;
  score_components: ScoreComponents;
  coverage: number;
  explanation: string;
  supporting_assertions: string[];
  is_unlocked: boolean;
  unlocked_access_id?: string;
  unlocked_at?: string;
  profile_version?: ProfileVersion;
}

export interface MatchingCriteria {
  direction: MatchDirection;
  focus_company_id: string;
  weights: {
    compatibility: number;
    sector: number;
    geography: number;
    evidence: number;
  };
  hard_filters: {
    min_confidence: number;
    require_verified_identity: boolean;
    exclude_competitors: boolean;
    required_certifications?: string[];
    allowed_jurisdictions?: string[];
  };
}

// =========================================================================
// C06 Membership & Access
// =========================================================================

export type PlanTier = 'free' | 'pro' | 'premium';
export type UserRole = 'member' | 'operator' | 'admin';

export interface Organisation {
  org_id: string;
  name: string;
  plan_tier: PlanTier;
  verified_company_id?: string;
  created_at: string;
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  org_id: string;
  created_at: string;
}

export interface CompanyClaim {
  claim_id: string;
  company_id: string;
  org_id: string;
  claimed_by_user_id: string;
  verification_method: 'email_domain' | 'official_letter' | 'operator_review';
  status: 'pending' | 'verified' | 'rejected';
  verification_token: string;
  token_expires_at: string;
  created_at: string;
  verified_at?: string;
}

// =========================================================================
// C07 Allocation & Credits
// =========================================================================

export interface CreditWallet {
  wallet_id: string;
  org_id: string;
  allowance_balance: number;
  purchased_balance: number;
  billing_cycle_resets_at?: string;
  updated_at: string;
}

export type LedgerEntryType = 'monthly_grant' | 'pack_purchase' | 'match_unlock_debit' | 'debit_reversal';

export interface LedgerEntry {
  entry_id: string;
  wallet_id: string;
  entry_type: LedgerEntryType;
  amount: number; // positive or negative
  balance_after: number;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface MemberMatchAccess {
  access_id: string;
  org_id: string;
  focus_company_id: string;
  counterparty_company_id: string;
  unlocked_at: string;
  source_transaction_id: string;
}

// =========================================================================
// C08 Networking & CRM Opportunities
// =========================================================================

export type OpportunityState = 'prospective' | 'contacted' | 'reviewing' | 'negotiating' | 'won_client' | 'won_supplier' | 'lost';

export interface Opportunity {
  opportunity_id: string;
  org_id: string;
  focus_company_id: string;
  counterparty_company_id: string;
  counterparty_name?: string;
  registration_number?: string;
  addresses?: CompanyAddress;
  direction: MatchDirection;
  state: OpportunityState;
  lead_set_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactEvent {
  event_id: string;
  opportunity_id: string;
  org_id: string;
  channel: 'maqe_message' | 'email' | 'phone' | 'rfq';
  summary: string;
  details?: string;
  occurred_at: string;
}

export interface Conversation {
  conversation_id: string;
  participant_org_ids: string[];
  subject: string;
  resource_type?: 'opportunity' | 'rfq' | 'general';
  resource_id?: string;
  created_at: string;
  messages?: Message[];
}

export interface Message {
  message_id: string;
  conversation_id: string;
  sender_org_id: string;
  sender_user_id: string;
  sender_name?: string;
  body: string;
  sent_at: string;
}

export interface RFQTemplate {
  template_id: string;
  org_id: string;
  title: string;
  requirement_description: string;
  specifications?: Record<string, any>;
  created_at: string;
}

export interface RFQ {
  rfq_id: string;
  issuer_org_id: string;
  title: string;
  requirement_description: string;
  specifications?: Record<string, any>;
  requested_response_date: string;
  state: 'draft' | 'open' | 'closed' | 'awarded';
  created_at: string;
  recipients?: RFQRecipient[];
}

export interface RFQRecipient {
  recipient_id: string;
  rfq_id: string;
  supplier_company_id: string;
  supplier_company_name?: string;
  supplier_org_id?: string;
  individual_thread_id: string;
  status: 'sent' | 'viewed' | 'submitted_bid' | 'declined';
  bid_amount?: number;
  bid_details?: string;
  created_at: string;
}

export interface ReferralInvitation {
  invitation_id: string;
  referring_org_id: string;
  target_company_id?: string;
  recipient_email: string;
  invitation_token: string;
  relationship_type: 'supplier' | 'customer' | 'peer';
  status: 'sent' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

// =========================================================================
// C09 Project Opportunities (Later Module)
// =========================================================================

export interface Project {
  project_id: string;
  owner_org_id: string;
  title: string;
  description: string;
  category_concepts: string[];
  budget_currency: string;
  budget_max?: number;
  location_constraint?: string;
  state: 'draft' | 'published' | 'reviewing' | 'awarded' | 'closed' | 'cancelled';
  max_bids: number; // Cap of 10 suppliers
  awarded_bid_id?: string;
  created_at: string;
  bids?: ProjectBid[];
}

export interface ProjectBid {
  bid_id: string;
  project_id: string;
  bidder_org_id: string;
  bidder_name?: string;
  amount: number;
  proposal: string;
  state: 'submitted' | 'shortlisted' | 'awarded' | 'rejected' | 'withdrawn';
  submitted_at: string;
}

// =========================================================================
// C10 Shared Platform Jobs & Audit
// =========================================================================

export type JobType = 'intake_partition' | 'discovery_run' | 'enrichment_run' | 'match_batch' | 'daily_sync';
export type JobState = 'queued' | 'running' | 'succeeded' | 'partial' | 'failed' | 'cancelled';

export interface Job {
  job_id: string;
  job_type: JobType;
  subject_id: string;
  schema_version: string;
  idempotency_key: string;
  requested_by: string;
  mode: 'fixture' | 'live';
  state: JobState;
  attempts: number;
  progress: number; // 0 - 100
  output_refs?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  event_id: string;
  event_type: string;
  aggregate_id: string;
  aggregate_version?: string;
  actor_id: string;
  correlation_id?: string;
  payload: Record<string, any>;
  occurred_at: string;
}

// =========================================================================
// C11 Commerce & Subscriptions
// =========================================================================

export interface PlanSubscription {
  subscription_id: string;
  org_id: string;
  plan_tier: PlanTier;
  monthly_credits: number;
  status: 'active' | 'past_due' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

// =========================================================================
// C12 Multi-channel Notifications
// =========================================================================

export interface NotificationItem {
  notification_id: string;
  recipient_user_id?: string;
  recipient_org_id: string;
  event_type: string;
  title: string;
  body: string;
  resource_ref?: string;
  priority: 'low' | 'normal' | 'high';
  read_at?: string;
  created_at: string;
}
