-- =========================================================================
-- MAQE Connected Intelligence Platform
-- Supabase (PostgreSQL 15+) Canonical Shared Data Foundation Migration
-- Implements Prompt 1 - Prompt 8 Data Architecture:
--   1. Companies House Registry Records (maqe_companies) & Change History
--   2. Candidate Websites Table (maqe_candidate_websites) - 1:N per company
--   3. Phase One Schema Enrichment & Source Evidence Tables
--   4. Matching Profile Analysis Table (maqe_matching_profiles)
--   5. Directional Scored Connections & Ranked Batch Delivery Tables
--   6. Durable Batched Pipeline Jobs & Audit Trail (maqe_jobs)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. COMPANIES HOUSE REGISTRY RECORDS & EXPLICIT PIPELINE STATE
-- Stable identifier: registration_number (Companies House company number)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_companies (
    company_id VARCHAR(64) PRIMARY KEY,
    jurisdiction VARCHAR(16) NOT NULL DEFAULT 'GB',
    registry_namespace VARCHAR(32) NOT NULL DEFAULT 'companies_house',
    registration_number VARCHAR(32) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NULL,
    trading_names JSONB NOT NULL DEFAULT '[]'::jsonb,
    previous_names JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, dissolved, liquidation, receivership, converted-closed
    sic_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    primary_sic VARCHAR(16) NULL,
    sic_description TEXT NULL,
    sic_category VARCHAR(128) NULL,
    sic_tier INT NOT NULL DEFAULT 1,
    incorporation_date DATE NULL,
    addresses JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Explicit Independent Pipeline Stage States (Prompt 1)
    discovery_status VARCHAR(40) NOT NULL DEFAULT 'unprocessed',
    -- unprocessed | queued | running | completed_with_candidates | completed_no_website_found | failed
    enrichment_status VARCHAR(40) NOT NULL DEFAULT 'unprocessed',
    -- unprocessed | awaiting_approved_candidate | queued | running | completed | partial | failed
    source_change_status VARCHAR(40) NOT NULL DEFAULT 'unchanged',
    -- unchanged | changed_pending_review | reassessed
    reassessment_flags JSONB NOT NULL DEFAULT '{"discovery_pending":false,"enrichment_pending":false,"matching_profile_pending":false,"matching_pending":false,"reasons":[]}'::jsonb,
    matching_profile_status VARCHAR(40) NOT NULL DEFAULT 'unprocessed',
    -- unprocessed | awaiting_enrichment | queued | running | current | stale_needs_reassessment | insufficient_evidence | failed
    matching_status VARCHAR(40) NOT NULL DEFAULT 'unprocessed',
    -- unprocessed | awaiting_profile_analysis | queued | running | completed_with_matches | completed_no_matches | stale | failed

    source_updated_at TIMESTAMPTZ NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_companies_house_reg UNIQUE (jurisdiction, registry_namespace, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_companies_reg_no ON maqe_companies(registration_number);
CREATE INDEX IF NOT EXISTS idx_companies_legal_name ON maqe_companies(legal_name);
CREATE INDEX IF NOT EXISTS idx_companies_status ON maqe_companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_discovery_status ON maqe_companies(discovery_status);
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON maqe_companies(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_companies_matching_profile_status ON maqe_companies(matching_profile_status);
CREATE INDEX IF NOT EXISTS idx_companies_matching_status ON maqe_companies(matching_status);

-- -------------------------------------------------------------------------
-- 2. REGISTRY CHANGE & REASSESSMENT HISTORY (Prompt 1 & Prompt 3)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_registry_change_history (
    change_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    registration_number VARCHAR(32) NOT NULL,
    changed_fields JSONB NOT NULL, -- Array of { field, old_value, new_value }
    affected_stages JSONB NOT NULL, -- Array of ['discovery', 'enrichment', 'matching_profile', 'matching']
    change_reason TEXT NOT NULL,
    policy_flag VARCHAR(64) NULL, -- e.g. name_change_reassessment, out_of_sic_scope_review, status_change_review
    reassessment_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_reg_change_company ON maqe_registry_change_history(company_id);

-- -------------------------------------------------------------------------
-- 3. INITIAL INGESTION PARTITIONS & ONGOING MAINTENANCE WATERMARKS (Prompt 2 & 3)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_backfill_partitions (
    partition_id VARCHAR(64) PRIMARY KEY,
    cohort_version VARCHAR(32) NOT NULL DEFAULT 'uk_eng_v1',
    sic_code VARCHAR(16) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, running, paused, completed, failed
    records_ingested INT NOT NULL DEFAULT 0,
    duplicates_skipped INT NOT NULL DEFAULT 0,
    cursor_pos VARCHAR(64) NULL,
    estimated_total INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maqe_sync_watermarks (
    source_id VARCHAR(64) PRIMARY KEY,
    routine_type VARCHAR(32) NOT NULL DEFAULT 'initial_population', -- initial_population | ongoing_maintenance
    watermark_type VARCHAR(32) NOT NULL,
    watermark_value VARCHAR(128) NOT NULL,
    records_processed INT NOT NULL DEFAULT 0,
    is_dormant BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_cron VARCHAR(64) NULL,
    schedule_timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/London',
    last_success_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_scheduled_at TIMESTAMPTZ NULL
);

-- -------------------------------------------------------------------------
-- 4. CANDIDATE WEBSITES TABLE (Prompt 1 & Prompt 4)
-- Separate table linked to maqe_companies; 1 company -> N candidate websites
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_candidate_websites (
    candidate_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    registration_number VARCHAR(32) NOT NULL,
    candidate_url VARCHAR(512) NOT NULL,
    final_url VARCHAR(512) NULL,
    canonical_domain VARCHAR(255) NOT NULL,
    source_type VARCHAR(32) NOT NULL DEFAULT 'company_website',
    -- company_website | brand_division_site | directory_listing | social_profile | other
    is_primary_candidate BOOLEAN NOT NULL DEFAULT FALSE,

    -- Confidence & Evidence (Prompt 4)
    confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { reg_no_match, legal_name_on_page, address_postcode_match, phone_match, domain_similarity, contradiction_penalty }
    evidence_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Array of { page_url, page_type, signal_type, matched_text, supports_association, weight }
    pages_inspected JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Enrichment Approval State (Distinct from Discovery Confidence & Enrichment Execution - Prompt 6)
    approval_state VARCHAR(32) NOT NULL DEFAULT 'pending_below_threshold',
    -- approved_auto_threshold | approved_operator | pending_below_threshold | rejected
    approval_threshold_used DECIMAL(5,4) NOT NULL DEFAULT 0.7000,
    approval_reason TEXT NULL,
    approved_by VARCHAR(64) NULL,
    approved_at TIMESTAMPTZ NULL,

    -- Per-Candidate Enrichment Crawl State
    enrichment_crawl_state VARCHAR(32) NOT NULL DEFAULT 'unprocessed',
    -- unprocessed | queued | crawling | completed | partial | failed

    discovery_run_id VARCHAR(64) NOT NULL,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_company_candidate_url UNIQUE (company_id, candidate_url)
);

CREATE INDEX IF NOT EXISTS idx_cand_web_company ON maqe_candidate_websites(company_id);
CREATE INDEX IF NOT EXISTS idx_cand_web_approval ON maqe_candidate_websites(approval_state);
CREATE INDEX IF NOT EXISTS idx_cand_web_confidence ON maqe_candidate_websites(confidence_score DESC);

-- -------------------------------------------------------------------------
-- 5. ENRICHMENT EXTRACTIONS & PHASE ONE SCHEMA TABLES (Prompt 1 & Prompt 6)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_enrichment_profiles (
    enrichment_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    registration_number VARCHAR(32) NOT NULL,
    schema_version VARCHAR(32) NOT NULL DEFAULT '1.0.0-phase1',
    revision_number INT NOT NULL DEFAULT 1,
    approved_candidate_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    crawl_status VARCHAR(32) NOT NULL DEFAULT 'completed', -- completed | partial | failed
    pages_crawled JSONB NOT NULL DEFAULT '[]'::jsonb,
    inaccessible_pages JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Extracted Core Business Descriptions (Grounded in Website Self-Description)
    company_summary TEXT NULL, -- 60-120 word substantial summary
    detailed_business_description TEXT NULL, -- Longer description of who the business is and what it does
    products JSONB NOT NULL DEFAULT '[]'::jsonb, -- Extracted physical/digital products with source_page_url
    services JSONB NOT NULL DEFAULT '[]'::jsonb, -- Extracted services with source_page_url
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    technical_parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
    credentials JSONB NOT NULL DEFAULT '[]'::jsonb,
    locations_and_coverage JSONB NOT NULL DEFAULT '[]'::jsonb,
    contact_routes JSONB NOT NULL DEFAULT '[]'::jsonb,
    market_sectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_evidences JSONB NOT NULL DEFAULT '[]'::jsonb,
    field_assessments JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Schema Completeness Metrics (Measures Schema Coverage Only - Prompt 6)
    completeness_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    completeness_band VARCHAR(32) NOT NULL DEFAULT 'unenriched',
    -- band_80_plus | band_50_to_79 | band_below_50 | unenriched
    populated_domains_count INT NOT NULL DEFAULT 0,
    applicable_domains_count INT NOT NULL DEFAULT 10,
    domain_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,

    enriched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    enrichment_job_id VARCHAR(64) NULL,
    previous_enrichment_id VARCHAR(64) NULL,
    change_summary TEXT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_enrich_company ON maqe_enrichment_profiles(company_id, is_current);
CREATE INDEX IF NOT EXISTS idx_enrich_band ON maqe_enrichment_profiles(completeness_band);

-- -------------------------------------------------------------------------
-- 6. MATCHING PROFILE ANALYSIS TABLE (Prompt 7)
-- Separates Profile Interpretation from Database Matching
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_matching_profiles (
    profile_analysis_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    registration_number VARCHAR(32) NOT NULL,
    enrichment_version_id VARCHAR(64) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'current',
    -- current | stale_needs_reassessment | insufficient_evidence | failed

    -- Explicit Observed Statements (from Enrichment)
    observed_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    observed_products JSONB NOT NULL DEFAULT '[]'::jsonb,
    observed_services JSONB NOT NULL DEFAULT '[]'::jsonb,
    observed_materials_processes JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Inferred Commercial Criteria (kept strictly separate from observed statements)
    inferred_supplier_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    inferred_customer_archetypes JSONB NOT NULL DEFAULT '[]'::jsonb,
    matching_query_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,

    overall_inference_confidence DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    information_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analysis_job_id VARCHAR(64) NULL,
    previous_analysis_id VARCHAR(64) NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_mp_company ON maqe_matching_profiles(company_id, is_current);
CREATE INDEX IF NOT EXISTS idx_mp_status ON maqe_matching_profiles(status);

-- -------------------------------------------------------------------------
-- 7. DIRECTIONAL SCORED CONNECTIONS & RANKED BATCH DELIVERY (Prompt 8)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_directional_connections (
    connection_id VARCHAR(64) PRIMARY KEY,
    focus_company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    counterparty_company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    direction VARCHAR(16) NOT NULL, -- supplier | customer
    focus_profile_analysis_id VARCHAR(64) NOT NULL,
    counterparty_enrichment_id VARCHAR(64) NULL,

    suitability_score INT NOT NULL, -- 0 to 100
    score_band VARCHAR(32) NOT NULL, -- high_80_plus | moderate_65_79 | exploratory_50_64 | below_50
    score_components JSONB NOT NULL DEFAULT '{}'::jsonb,
    matched_offering TEXT NOT NULL,
    satisfied_requirement TEXT NOT NULL,
    supporting_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    weak_evidence_and_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,

    current_state VARCHAR(32) NOT NULL DEFAULT 'fresh', -- fresh | stale | reassessing
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    match_job_id VARCHAR(64) NULL,

    CONSTRAINT uk_directional_connection UNIQUE (focus_company_id, counterparty_company_id, direction),
    CONSTRAINT chk_no_self_match CHECK (focus_company_id <> counterparty_company_id)
);

CREATE INDEX IF NOT EXISTS idx_conn_focus_dir_score ON maqe_directional_connections(focus_company_id, direction, suitability_score DESC);

CREATE TABLE IF NOT EXISTS maqe_match_batch_deliveries (
    batch_id VARCHAR(64) PRIMARY KEY,
    recipient_company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    direction VARCHAR(16) NOT NULL, -- supplier | customer
    batch_number INT NOT NULL DEFAULT 1,
    requested_batch_size INT NOT NULL,
    delivered_count INT NOT NULL,
    min_score_threshold INT NOT NULL DEFAULT 70,
    include_lower_scoring BOOLEAN NOT NULL DEFAULT FALSE,
    shortfall_count INT NOT NULL DEFAULT 0,
    shortfall_explanation TEXT NULL,
    connection_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maqe_delivered_connections (
    delivery_record_id VARCHAR(64) PRIMARY KEY,
    recipient_company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    counterparty_company_id VARCHAR(64) NOT NULL REFERENCES maqe_companies(company_id) ON DELETE CASCADE,
    direction VARCHAR(16) NOT NULL, -- supplier | customer
    connection_id VARCHAR(64) NOT NULL REFERENCES maqe_directional_connections(connection_id) ON DELETE CASCADE,
    batch_id VARCHAR(64) NOT NULL REFERENCES maqe_match_batch_deliveries(batch_id) ON DELETE CASCADE,
    score_at_delivery INT NOT NULL,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_recipient_delivered_connection UNIQUE (recipient_company_id, counterparty_company_id, direction)
);

-- -------------------------------------------------------------------------
-- 8. SHARED DURABLE JOBS & AUDIT HISTORY (Prompt 1 - Prompt 8)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maqe_jobs (
    job_id VARCHAR(64) PRIMARY KEY,
    job_category VARCHAR(40) NOT NULL,
    -- initial_population | ongoing_maintenance | discovery | enrichment | matching_profile_analysis | match_generation
    job_type VARCHAR(64) NOT NULL,
    scope VARCHAR(64) NOT NULL DEFAULT 'all_companies',
    subject_id VARCHAR(64) NOT NULL,
    schema_version VARCHAR(16) NOT NULL DEFAULT '1.0.0-phase1',
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    requested_by VARCHAR(64) NOT NULL DEFAULT 'operator',
    mode VARCHAR(16) NOT NULL DEFAULT 'live',
    state VARCHAR(32) NOT NULL DEFAULT 'queued',
    -- queued | running | paused_interrupted | succeeded | partial | failed | cancelled
    attempts INT NOT NULL DEFAULT 1,
    batch_size INT NOT NULL DEFAULT 1000,
    total_items INT NOT NULL DEFAULT 0,
    processed_items INT NOT NULL DEFAULT 0,
    cursor_pos VARCHAR(128) NULL,
    progress INT NOT NULL DEFAULT 0,
    output_refs JSONB NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_category_state ON maqe_jobs(job_category, state);
