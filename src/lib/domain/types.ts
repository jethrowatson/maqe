/**
 * MAQE Engineering Intelligence Platform - Domain Types & Data Contracts
 * Updated for MAQE Phase One Discovery and Enrichment Schema (Draft 0.1 - 14 October 2026)
 * & Technical Build Addendum v1.1
 */

// =========================================================================
// Phase One Discovery & Enrichment Schema Contracts (Sections 2-15)
// =========================================================================

export type JurisdictionCode = 'GB' | 'US' | 'DE' | 'FR' | string;

export interface ConceptRef {
  concept_id: string;
  taxonomy_version: string;
  raw_label?: string;
}

export type FieldAssessmentState =
  | 'not_assessed'
  | 'not_found'
  | 'unknown'
  | 'not_applicable'
  | 'withheld'
  | 'conflicting'
  | 'assessed_populated';

export interface FieldAssessment {
  subject_ref: { type: string; id: string };
  field_path: string;
  state: FieldAssessmentState;
  reason?: string;
  evidence_ids?: string[];
}

export interface IdentitySignal {
  signal_type: 'registration_number' | 'name' | 'address' | 'official_link' | 'domain_history' | 'contradiction';
  result: 'supports' | 'contradicts' | 'neutral';
  detail: string;
  evidence_ids?: string[];
}

export interface PhaseOneWebsiteAssociation {
  id: string;
  company_id: string;
  candidate_url: string;
  final_url?: string;
  canonical_domain?: string;
  claimed_entity_name?: string;
  country_code?: string;
  language?: string;
  source_type: 'official_primary' | 'official_additional' | 'brand' | 'regional' | 'directory' | 'social' | 'registry' | 'other';
  is_primary: boolean;
  discovered_at: string;
  discovery_run_id: string;
  decision: 'candidate' | 'approved' | 'rejected' | 'needs_review';
  decision_at?: string;
  decision_origin?: 'automated' | 'operator';
  decision_policy_version: string;
  identity_signals: IdentitySignal[];
  identity_score?: string;
  authority_score?: string;
  relevance_score?: string;
  title?: string;
  snippet?: string;
}

export interface CrawlRunCounters {
  discovered: number;
  eligible: number;
  fetched: number;
  extracted: number;
  duplicate: number;
  excluded: number;
  blocked: number;
  failed: number;
  pending: number;
}

export interface CrawlRun {
  id: string;
  company_id: string;
  association_ids: string[];
  policy_version: string;
  state: 'queued' | 'running' | 'completed' | 'partial' | 'blocked' | 'failed';
  started_at: string;
  completed_at?: string;
  counters: CrawlRunCounters;
  discovery_exhausted: boolean;
  budget_exhausted: boolean;
}

export interface PhaseOneEvidence {
  id: string;
  document_id: string;
  locator: {
    kind: 'text_span' | 'pdf_page' | 'section';
    value: string;
  };
  quote: string;
  captured_at: string;
}

export interface PhaseOneAssertion {
  id: string;
  company_id: string;
  subject_ref: { type: string; id: string };
  field_path: string;
  value: any;
  basis: 'observed' | 'inferred' | 'normalised' | 'member_declared' | 'operator_corrected';
  evidence_ids: string[];
  supporting_assertion_ids: string[];
  status: 'active' | 'disputed' | 'superseded' | 'retracted';
  verification_state: 'unverified' | 'source_checked' | 'independently_verified' | 'contradicted';
  visibility: 'public_profile' | 'member_only' | 'internal_review' | 'restricted';
  confidence?: number;
  rationale?: string;
  model_run_id?: string;
}

export interface PhaseOneLocation {
  id: string;
  company_id: string;
  location_type: 'registered_office' | 'headquarters' | 'factory' | 'warehouse' | 'branch' | 'showroom' | 'service_base' | 'other';
  name?: string;
  address: {
    address_lines: string[];
    locality?: string;
    administrative_area?: string;
    postal_code?: string;
    country_code: string;
    source_address_text?: string;
  };
  operational?: boolean;
}

export interface PhaseOneCoverage {
  id: string;
  company_id: string;
  scope_ref: { type: string; id: string };
  activity: 'sales' | 'shipping' | 'installation' | 'onsite_service' | 'remote_service' | 'export';
  inclusion: 'included' | 'excluded';
  area: {
    kind: 'country' | 'region' | 'postcode' | 'radius' | 'worldwide' | 'named_area';
    country_codes?: string[];
    region_codes?: string[];
    postcode_patterns?: string[];
  };
  source_text?: string;
}

export interface PhaseOneContactRoute {
  id: string;
  company_id: string;
  kind: 'email' | 'phone' | 'web_form' | 'postal' | 'social';
  value: string;
  purpose: 'general' | 'sales' | 'purchasing' | 'technical' | 'support' | 'other';
  location_id?: string;
  visibility: 'public_profile' | 'member_only' | 'internal_review' | 'restricted';
  contact_use_state: 'unassessed' | 'allowed' | 'restricted' | 'prohibited';
}

export interface PhaseOneOffering {
  id: string;
  company_id?: string;
  kind: 'service' | 'physical_product' | 'digital_product' | 'product';
  name: string;
  node_type: 'group' | 'offering' | 'variant';
  parent_offering_id?: string;
  canonical_concept?: ConceptRef;
  concept_id?: string;
  visibility?: string;
  business_role?: ConceptRef;
  fulfilment?: 'in_house' | 'subcontracted' | 'distributed' | 'mixed' | 'unknown';
  availability?: 'active' | 'discontinued' | 'historical' | 'unknown';
  customisable?: boolean;
  made_to_order?: boolean;
  process_concepts?: string[];
  material_concepts?: string[];
  source_page_url?: string;
  source_excerpt?: string;
}

export interface PhaseOneCapability {
  id: string;
  company_id?: string;
  name: string;
  offering_ids?: string[];
  process_concept?: ConceptRef;
  location_id?: string;
  parameter_ids?: string[];
  material_concepts?: string[];
  materials: string[];
  fulfilment?: string;
  source_page_url?: string;
}

export interface PhaseOneParameter {
  id: string;
  company_id: string;
  scope_ref: { type: string; id: string };
  parameter_key: string;
  value_kind: 'quantity' | 'interval' | 'tolerance' | 'categorical' | 'boolean' | 'text';
  quantity?: { magnitude: string; unit: string; comparator: string };
  interval?: { lower?: string; upper?: string; unit: string };
  tolerance?: { lower_deviation: string; upper_deviation: string; unit: string };
  categories?: string[];
  boolean_value?: boolean;
  text_value?: string;
  raw_text: string;
  assertion_ids: string[];
}

export interface PhaseOneCredential {
  id: string;
  company_id: string;
  claim_type: 'certification' | 'accreditation' | 'approval' | 'membership' | 'licence' | 'conformance_claim' | 'test_report' | 'standard_reference';
  raw_claim: string;
  raw_label: string;
  standard_code?: string;
  scope_ref: { type: string; id: string };
  status: 'claimed' | 'current_verified' | 'expired' | 'suspended' | 'withdrawn' | 'pending' | 'unknown';
  verification_state: 'unverified' | 'source_checked' | 'independently_verified' | 'contradicted';
  assertion_ids?: string[];
  source_page_url?: string;
}

export interface PhaseOneMarketParticipation {
  id: string;
  company_id: string;
  scope_ref: { type: string; id: string };
  dimension: 'buyer_type' | 'sector' | 'application' | 'procurement_context';
  raw_label: string;
  label: string;
  concept_ref?: ConceptRef;
  participation: 'serves' | 'has_served' | 'targets' | 'excludes' | 'inferred_fit';
  evidence_ids?: string[];
}

export interface PhaseOneNeed {
  id: string;
  company_id: string;
  need_type: 'material' | 'component' | 'equipment' | 'service' | 'logistics' | 'facility' | 'other';
  label: string;
  basis: 'stated' | 'inferred';
  status: 'current' | 'historical' | 'unknown';
  priority?: 'required' | 'preferred';
  target_supplier_sics: string[];
  rationale: string;
  supporting_assertion_ids?: string[];
}

export interface PhaseOneQualityIssue {
  id: string;
  company_id: string;
  issue_type: string;
  severity: 'info' | 'warning' | 'blocking';
  affected_refs: { type: string; id: string }[];
  state: 'open' | 'resolved' | 'dismissed';
  detail?: string;
}

export interface PhaseOneCompanySchema {
  schema_version: string;
  taxonomy_version: string;
  company: {
    id: string;
    display_name: string;
    legal_name: string;
    trading_names: string[];
    intake_origin: 'registry' | 'operator' | 'member' | 'import';
    registrations: {
      registry_namespace: string;
      jurisdiction: string;
      registration_number: string;
      legal_name: string;
      registration_status: string;
      incorporation_date?: string;
      registry_url?: string;
    }[];
    legal_form?: ConceptRef;
    ownership_type?: string;
    operating_status?: string;
    industry_codes: {
      system: string;
      version: string;
      code: string;
      label: string;
      primary?: boolean;
    }[];
    business_roles: ConceptRef[];
    languages: string[];
    summary: {
      text: string;
      language: string;
      generated_at: string;
      model_run_id: string;
      supporting_assertion_ids: string[];
      visibility: string;
      source_excerpt?: { text: string; evidence_id: string };
    };
  };
  company_summary: {
    text: string;
  };
  website_associations: PhaseOneWebsiteAssociation[];
  source_bundle?: {
    id: string;
    company_id: string;
    association_revision_refs: string[];
    document_ids: string[];
    admission_policy_version: string;
    created_at: string;
  };
  crawl_runs?: CrawlRun[];
  source_documents: any[];
  evidences: PhaseOneEvidence[];
  assertions: PhaseOneAssertion[];
  locations: PhaseOneLocation[];
  coverages: PhaseOneCoverage[];
  contact_routes: PhaseOneContactRoute[];
  offerings: PhaseOneOffering[];
  capabilities: PhaseOneCapability[];
  parameters: PhaseOneParameter[];
  credentials: PhaseOneCredential[];
  market_participations: PhaseOneMarketParticipation[];
  markets: PhaseOneMarketParticipation[];
  defence_contexts: any[];
  needs: PhaseOneNeed[];
  history_events: any[];
  field_assessments: FieldAssessment[];
  quality_issues: PhaseOneQualityIssue[];
  profile_version: {
    id: string;
    company_id: string;
    schema_version: string;
    taxonomy_version: string;
    source_bundle_id: string;
    enrichment_run_id: string;
    state: 'draft' | 'needs_review' | 'published' | 'superseded' | 'rejected';
    published_at?: string;
    assertion_ids: string[];
    field_assessments: FieldAssessment[];
    created_at: string;
  };
}

export type CompletenessBand = 'band_80_plus' | 'band_50_to_79' | 'band_below_50' | 'unenriched';

export type DiscoveryStageStatus =
  | 'unprocessed'
  | 'queued'
  | 'running'
  | 'completed_with_candidates'
  | 'completed_no_website_found'
  | 'failed';

export type EnrichmentStageStatus =
  | 'unprocessed'
  | 'awaiting_approved_candidate'
  | 'queued'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed';

export type SourceChangeStatus = 'unchanged' | 'new_intake' | 'changed_pending_review' | 'reassessed';

export type MatchingProfileStageStatus =
  | 'unprocessed'
  | 'awaiting_enrichment'
  | 'queued'
  | 'running'
  | 'current'
  | 'stale_needs_reassessment'
  | 'insufficient_evidence'
  | 'failed';

export type MatchingStageStatus =
  | 'unprocessed'
  | 'awaiting_profile_analysis'
  | 'queued'
  | 'running'
  | 'completed_with_matches'
  | 'completed_no_matches'
  | 'stale'
  | 'failed';

export interface ReassessmentFlags {
  discovery_pending: boolean;
  enrichment_pending: boolean;
  matching_profile_pending: boolean;
  matching_pending: boolean;
  reasons: string[];
  flagged_at?: string;
  policy_flag?: 'name_change_reassessment' | 'out_of_sic_scope_review' | 'status_change_review' | 'website_updated_manual' | string;
}

export interface RegistryFieldChange {
  field: 'legal_name' | 'status' | 'sic_codes' | 'addresses' | 'trading_names';
  old_value: any;
  new_value: any;
}

export interface RegistryChangeRecord {
  change_id: string;
  company_id: string;
  registration_number: string;
  changed_fields: RegistryFieldChange[];
  affected_stages: ('discovery' | 'enrichment' | 'matching_profile' | 'matching')[];
  change_reason: string;
  policy_flag?: string;
  reassessment_resolved: boolean;
  observed_at: string;
  resolved_at?: string;
}

export interface CompanyPipelineState {
  discovery_status: DiscoveryStageStatus;
  enrichment_status: EnrichmentStageStatus;
  source_change_status: SourceChangeStatus;
  reassessment_flags: ReassessmentFlags;
  matching_profile_status: MatchingProfileStageStatus;
  matching_status: MatchingStageStatus;
  last_discovery_at?: string;
  last_enrichment_at?: string;
  last_profile_analysis_at?: string;
  last_matching_at?: string;
}

export interface CandidateEvidenceItem {
  page_url: string;
  page_type: 'home' | 'about' | 'contact' | 'products' | 'services' | 'terms' | 'quality' | 'footer' | 'other';
  signal_type: 'registration_number' | 'legal_name' | 'trading_name' | 'address_postcode' | 'phone_contact' | 'domain_slug' | 'sic_activity_corroboration' | 'contradiction' | 'contradictory_entity';
  matched_text: string;
  supports_association: boolean;
  weight_contribution: number;
}

export interface CandidateScoreBreakdown {
  reg_no_score: number;
  legal_name_on_page_score: number;
  address_postcode_score: number;
  phone_contact_score: number;
  domain_similarity_score: number;
  activity_corroboration_score: number;
  contradiction_penalty: number;
  dissimilar_domain_corroborated?: boolean;
  explanation: string;
}

export type CandidateApprovalState =
  | 'approved_auto_threshold'
  | 'approved_operator'
  | 'pending_below_threshold'
  | 'rejected';

export interface CandidateWebsite {
  candidate_id: string;
  company_id: string;
  registration_number: string;
  company_name: string;
  candidate_url: string;
  final_url?: string;
  canonical_domain: string;
  source_type: 'company_website' | 'brand_division_site' | 'directory_listing' | 'social_profile' | 'other';
  is_primary_candidate: boolean;
  confidence_score: number; // 0.00 to 1.00
  score_breakdown: CandidateScoreBreakdown;
  evidence_items: CandidateEvidenceItem[];
  pages_inspected: string[];
  approval_state: CandidateApprovalState;
  approval_threshold_used: number;
  approval_reason: string;
  approved_by?: string;
  approved_at?: string;
  enrichment_crawl_state: 'unprocessed' | 'queued' | 'crawling' | 'completed' | 'partial' | 'failed';
  discovery_run_id: string;
  discovered_at: string;
  last_assessed_at: string;
  reassessment_history?: Array<{ assessed_at: string; confidence_score: number; note: string }>;
}

export interface EnrichmentMetrics {
  completeness_pct: number;
  completeness_band?: CompletenessBand;
  is_website_enriched?: boolean;
  populated_domains_count: number;
  total_domains_count: number;
  crawl_status?: string;
  pages_fetched?: number;
  pages_crawled_count?: number;
  websites_crawled_count?: number;
  last_crawled_at?: string;
  last_enriched_at?: string;
  enrichment_source?: string;
  quality_score: number;
  quality_grade: 'A' | 'B' | 'C' | 'D';
  enrichment_tier?: 'verified_web_full' | 'verified_web_partial' | 'registry_and_sic_inferred';
  publication_state?: 'published' | 'needs_review' | 'draft';
  has_confirmed_website?: boolean;
  website_approval_mode?: 'auto_threshold' | 'operator_manual' | 'operator_approved' | 'none';
  evidence_backed_pct?: number;
  has_contacts?: boolean;
  has_credentials?: boolean;
  has_numeric_parameters?: boolean;
  assertions_count?: number;
  observed_assertions_count?: number;
  inferred_assertions_count?: number;
  evidence_count?: number;
  documents_count?: number;
  quality_issues_count?: number;
}

export interface AdminEnrichmentSummary {
  generated_at: string;
  schema_version: string;
  total_companies_found: number;
  total_companies_enriched: number;
  website_enriched_companies_count?: number;
  unenriched_companies_count?: number;
  awaiting_enrichment_eligible_count?: number;
  no_approved_candidate_count?: number;
  confirmed_websites_count: number;
  total_candidate_websites_count?: number;
  companies_with_candidates_count?: number;
  companies_with_multiple_candidates_count?: number;
  companies_no_website_found_count?: number;
  companies_discovery_unprocessed_count?: number;
  companies_pending_reassessment_count?: number;
  contacts_extracted_count: number;
  credentials_extracted_count: number;
  numeric_parameters_count: number;
  avg_completeness_pct: number;
  avg_enriched_only_completeness_pct?: number;
  avg_quality_score: number;
  completeness_bands?: {
    band_80_plus: number;
    band_50_to_79: number;
    band_below_50: number;
    unenriched: number;
  };
  total_assertions: number;
  observed_assertions: number;
  inferred_assertions: number;
  total_source_documents: number;
  total_matches_generated: number;
  supplier_matches_count: number;
  customer_matches_count: number;
  companies_matched_count?: number;
  matching_jobs_run_count?: number;
  quality_grades: Record<string, number>;
  enrichment_tiers: Record<string, number>;
  domain_completion_counts: Record<string, number>;
  sic_category_breakdown: { category: string; count: number }[];
}

// =========================================================================
// Core Platform Records
// =========================================================================

export interface CompanyAddress {
  registered?: string;
  trading?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country: string;
}

export interface CompanyProcessingHistoryItem {
  event_id: string;
  stage: 'intake' | 'maintenance' | 'discovery' | 'enrichment' | 'matching_profile' | 'matching';
  status:
    | 'completed'
    | 'partial'
    | 'flagged_reassessment'
    | 'stale_needs_reassessment'
    | 'insufficient_evidence'
    | 'awaiting_enrichment'
    | 'failed'
    | 'no_result';
  summary: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface CompanyRecord {
  company_id: string;
  jurisdiction: JurisdictionCode;
  registry_namespace: string;
  registration_number: string;
  display_name?: string;
  legal_name: string;
  trading_names: string[];
  previous_names?: string[];
  status: 'active' | 'dissolved' | 'liquidation' | 'receivership' | 'converted-closed';
  sic_codes: string[];
  primary_sic: string;
  sic_description: string;
  sic_category?: string;
  sic_tier?: number;
  business_roles?: string[];
  website_url?: string | null;
  website_domain?: string | null;
  incorporation_date?: string;
  addresses: CompanyAddress;
  source_updated_at?: string;
  ingested_at: string;
  updated_at?: string;
  pipeline_state?: CompanyPipelineState;
  change_history?: RegistryChangeRecord[];
  processing_history?: CompanyProcessingHistoryItem[];
  candidate_websites?: CandidateWebsite[];
  detailed_business_description?: string;
  enrichment_revision?: number;
  enrichment_metrics?: EnrichmentMetrics;
  phase_one_schema?: PhaseOneCompanySchema;
  profile?: ProfileVersion;
  assertions?: Assertion[];
}

export interface BackfillPartition {
  partition_id: string;
  cohort_version: string;
  sic_code: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  records_ingested: number;
  duplicates_skipped?: number;
  cursor_pos?: string;
  estimated_total: number;
  created_at: string;
  updated_at: string;
}

export interface SyncWatermark {
  source_id: string;
  routine_type?: 'initial_population' | 'ongoing_maintenance';
  watermark_type: string;
  watermark_value: string;
  records_processed: number;
  is_dormant?: boolean;
  schedule_cron?: string;
  schedule_timezone?: string;
  last_success_at: string;
  next_scheduled_at?: string;
}

export interface SICMasterEntry {
  sic_code: string;
  description: string;
  tier: number;
  default_intake: boolean;
  category: string;
  reason: string;
  guidance: string;
  status?: string;
  records_count?: number;
  last_scraped_at?: string;
}

export interface IngestEvent {
  id: string;
  timestamp: string;
  type: 'companies_house_query' | 'entity_ingested' | 'discovery_crawled' | 'assertion_extracted' | 'match_evaluated' | 'registry_change_detected';
  sic_code: string;
  company_name?: string;
  company_number?: string;
  message: string;
  details?: Record<string, any>;
  level: 'info' | 'success' | 'warn';
}

export type SourceType = 'official_website' | 'linkedin' | 'directory' | 'mention';
export type DecisionState = 'pending' | 'approved' | 'rejected';

export interface IdentitySignals {
  reg_no_match?: boolean;
  domain_match?: boolean;
  name_similarity: number;
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
  confidence: number;
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

export type AssertionBasis = 'observed' | 'inferred';

export interface EvidenceRef {
  document_id: string;
  span?: string;
  text_snippet?: string;
}

export interface Assertion {
  assertion_id: string;
  company_id: string;
  subject: string;
  field: string;
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
  coverage: number;
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

export type MatchDirection = 'customer' | 'supplier';

export interface ScoreComponents {
  compatibility: number;
  sector: number;
  geography: number;
  evidence: number;
}

export interface CriterionResult {
  criterion_id: string;
  criterion_key: string;
  importance: 'must' | 'prefer';
  state: 'pass' | 'fail' | 'unknown' | 'conflict' | 'not_applicable';
  profile_version_id: string;
  supporting_assertion_ids: string[];
  explanation: string;
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
  score: number;
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
  focus_company_name?: string;
  focus_registration_number?: string;
  focus_sic?: string;
  focus_locality?: string;
  counterparty_company_id: string;
  counterparty_name: string;
  counterparty_legal_name?: string;
  registration_number: string;
  addresses?: CompanyAddress;
  sic_codes?: string[];
  counterparty_website?: string | null;
  assessment_id: string;
  direction: MatchDirection;
  relation_family?: string;
  offering_matched?: string;
  need_satisfied?: string;
  score: number;
  score_band?: 'high_80_plus' | 'moderate_65_79' | 'exploratory_50_64' | 'below_50';
  score_components: ScoreComponents;
  coverage: number;
  explanation: string;
  criterion_results?: CriterionResult[];
  matched_profile_criteria?: string[];
  evidence_used?: string[];
  supporting_assertions: string[];
  weak_evidence_and_gaps?: string[];
  weak_evidence_or_gaps?: string[];
  profile_analysis_id?: string;
  is_unlocked: boolean;
  unlocked_access_id?: string;
  unlocked_at?: string;
  delivery_status?: 'undelivered' | 'delivered';
  is_delivered_in_batch?: boolean;
  delivered_batch_id?: string;
  delivered_batch_number?: number;
  delivered_at?: string;
  profile_version?: ProfileVersion;
}

export interface ObservedActivityEntry {
  activity_id: string;
  kind: 'product' | 'service' | 'process' | 'material';
  label: string;
  concept_id: string;
  basis: 'observed';
  source_page_url?: string;
  assertion_id: string;
  quote_snippet?: string;
}

export interface InferredSupplierCriterion {
  criterion_id: string;
  category?: string;
  need_category?: 'raw_material' | 'subcontract_process' | 'components_fasteners' | 'tooling_machinery' | 'testing_certification' | 'logistics_packaging';
  requirement_label: string;
  target_supplier_activities?: string[];
  target_supplier_sics: string[];
  target_keywords?: string[];
  required_materials_or_processes?: string[];
  importance?: 'must' | 'prefer';
  basis?: 'explicitly_stated' | 'inferred_from_activity' | 'observed' | 'inferred';
  confidence: number;
  inference_confidence?: number;
  supporting_observed_inputs: string[];
  supporting_enrichment_evidence?: any[];
  rationale: string;
}

export interface InferredCustomerCriterion {
  criterion_id: string;
  customer_archetype_label: string;
  archetype_label?: string;
  target_customer_activities?: string[];
  target_customer_sics: string[];
  target_keywords?: string[];
  relevant_materials_or_inputs_used?: string[];
  excluded_competitor_activities?: string[];
  importance?: 'must' | 'prefer';
  basis?: 'explicitly_stated_sector' | 'inferred_downstream_fit' | 'observed' | 'inferred';
  confidence: number;
  inference_confidence?: number;
  likely_use_case?: string;
  supporting_observed_inputs?: string[];
  supporting_enrichment_evidence?: any[];
  rationale: string;
}

export interface MatchingProfileInformationGap {
  field_or_domain: string;
  impact_on_matching: string;
  severity: 'info' | 'moderate' | 'high';
}

export interface MatchingProfileAnalysis {
  matching_profile_id?: string;
  profile_analysis_id?: string;
  company_id: string;
  registration_number: string;
  company_name: string;
  enrichment_version_id?: string;
  enrichment_revision?: number;
  enrichment_revision_used?: number;
  version_number?: number;
  status: 'current' | 'stale_needs_reassessment' | 'insufficient_evidence' | 'awaiting_enrichment' | 'failed';
  observed_summary?: string;
  observed_activities?: any[];
  observed_products: string[];
  observed_services: string[];
  observed_materials_processes?: any[];
  observed_capabilities_and_materials: string[];
  observed_sectors: string[];
  observed_certifications?: string[];
  observed_company_scale_and_role?: string;
  inferred_supplier_criteria: InferredSupplierCriterion[];
  inferred_supplier_requirements?: InferredSupplierCriterion[];
  inferred_customer_criteria: InferredCustomerCriterion[];
  inferred_customer_archetypes?: InferredCustomerCriterion[];
  profile_confidence: number;
  overall_inference_confidence?: number;
  information_gaps: string[];
  generated_at?: string;
  updated_at?: string;
  analyzed_at?: string;
  reassessment_reason?: string;
  previous_analysis_id?: string;
  is_current?: boolean;
}

export interface DeliveredMatchBatch {
  batch_id: string;
  company_id?: string;
  recipient_company_id?: string;
  company_name?: string;
  recipient_company_name?: string;
  registration_number?: string;
  direction: MatchDirection;
  batch_number: number;
  requested_batch_size: number;
  delivered_count: number;
  min_score_applied: number;
  min_score_threshold?: number;
  include_lower_scoring?: boolean;
  delivered_connection_ids: string[];
  delivered_counterparty_ids?: string[];
  delivered_connections?: MatchCandidateResult[];
  remaining_qualifying_count: number;
  shortfall_count?: number;
  shortfall_reason?: string;
  shortfall_explanation?: string;
  delivered_by?: string;
  created_at: string;
  delivered_at?: string;
}

export interface MatchBatchPreview {
  company_id?: string;
  recipient_company_id?: string;
  company_name?: string;
  recipient_company_name?: string;
  direction: MatchDirection;
  next_batch_number?: number;
  requested_batch_size: number;
  min_score_applied: number;
  min_score_threshold?: number;
  include_lower_scoring?: boolean;
  selected_connections: MatchCandidateResult[];
  next_batch_candidates?: MatchCandidateResult[];
  excluded_already_delivered_count: number;
  already_delivered_count?: number;
  excluded_below_min_score_count: number;
  withheld_below_threshold_count?: number;
  remaining_qualifying_undelivered_count: number;
  remaining_undelivered_count?: number;
  total_connections_available?: number;
  qualifying_above_threshold_count?: number;
  shortfall_count?: number;
  shortfall_reason?: string;
  shortfall_explanation?: string;
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
  amount: number;
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
  max_bids: number;
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

export type JobCategory =
  | 'initial_population'
  | 'ongoing_maintenance'
  | 'discovery'
  | 'enrichment'
  | 'matching_profile_analysis'
  | 'match_generation'
  | 'system';

export type JobType =
  | 'intake_partition'
  | 'initial_ingestion_batch'
  | 'initial_population_batch'
  | 'daily_maintenance_sync'
  | 'discovery_run'
  | 'discovery_batch_crawl'
  | 'enrichment_run'
  | 'enrichment_batch_crawl'
  | 'matching_profile_analysis_run'
  | 'matching_profile_batch'
  | 'match_batch'
  | 'match_generation_batch'
  | 'daily_sync';

export type JobState =
  | 'queued'
  | 'running'
  | 'paused'
  | 'paused_interrupted'
  | 'succeeded'
  | 'partial'
  | 'failed'
  | 'cancelled'
  | 'dormant';

export interface Job {
  job_id: string;
  job_category?: JobCategory;
  job_type: JobType;
  scope?: string;
  subject_id: string;
  schema_version: string;
  idempotency_key: string;
  requested_by: string;
  mode: 'fixture' | 'live';
  state: JobState;
  attempts: number;
  batch_size?: number;
  total_items?: number;
  processed_items?: number;
  succeeded_items?: number;
  failed_items?: number;
  skipped_items?: number;
  checkpoint_cursor?: string;
  cursor_pos?: string;
  schedule_info?: string;
  progress: number;
  output_refs?: Record<string, any>;
  error_message?: string;
  created_at: string;
  started_at?: string;
  paused_at?: string;
  updated_at: string;
  completed_at?: string;
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

