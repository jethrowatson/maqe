-- =========================================================================
-- MAQE Engineering Intelligence Platform
-- Canonical Relational Database Schema (MariaDB / MySQL 8+ / PostgreSQL compatible)
-- Version 1.1 Specification (9 October 2026)
-- =========================================================================

-- C01 Registry Intake & Company Records
CREATE TABLE IF NOT EXISTS maqe_companies (
    company_id VARCHAR(64) PRIMARY KEY,
    jurisdiction VARCHAR(16) NOT NULL DEFAULT 'GB',
    registry_namespace VARCHAR(32) NOT NULL DEFAULT 'companies_house',
    registration_number VARCHAR(32) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trading_names LONGTEXT NULL, -- JSON array
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    sic_codes LONGTEXT NULL, -- JSON array
    incorporation_date DATE NULL,
    addresses LONGTEXT NULL, -- JSON structure
    source_updated_at DATETIME NULL,
    ingested_at DATETIME NOT NULL,
    UNIQUE KEY uk_reg_identity (jurisdiction, registry_namespace, registration_number),
    INDEX idx_company_status (status),
    INDEX idx_company_name (legal_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_backfill_partitions (
    partition_id VARCHAR(64) PRIMARY KEY,
    cohort_version VARCHAR(32) NOT NULL DEFAULT 'uk_eng_v1',
    sic_code VARCHAR(16) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    records_ingested INT NOT NULL DEFAULT 0,
    cursor_pos VARCHAR(64) NULL,
    estimated_total INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_partition_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_sync_watermarks (
    source_id VARCHAR(64) PRIMARY KEY,
    watermark_type VARCHAR(32) NOT NULL,
    watermark_value VARCHAR(128) NOT NULL,
    records_processed INT NOT NULL DEFAULT 0,
    last_success_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C02 Discovery and Document Retrieval
CREATE TABLE IF NOT EXISTS maqe_source_associations (
    association_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    url VARCHAR(512) NOT NULL,
    source_type VARCHAR(32) NOT NULL, -- official_website, linkedin, directory, mention
    discovery_run_id VARCHAR(64) NOT NULL,
    identity_signals LONGTEXT NOT NULL, -- JSON object
    confidence DECIMAL(5,4) NOT NULL,
    decision VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reviewer VARCHAR(64) NULL,
    review_reason TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_assoc_company (company_id),
    INDEX idx_assoc_decision (decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_source_documents (
    document_id VARCHAR(64) PRIMARY KEY,
    association_id VARCHAR(64) NOT NULL,
    canonical_url VARCHAR(512) NOT NULL,
    fetched_at DATETIME NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    media_type VARCHAR(64) NOT NULL DEFAULT 'text/html',
    language VARCHAR(16) NOT NULL DEFAULT 'en',
    retrieval_status VARCHAR(32) NOT NULL DEFAULT 'success',
    body_ref VARCHAR(255) NOT NULL,
    document_title VARCHAR(255) NULL,
    extracted_text LONGTEXT NULL,
    INDEX idx_doc_assoc (association_id),
    INDEX idx_doc_hash (content_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C03 AI Enrichment
CREATE TABLE IF NOT EXISTS maqe_assertions (
    assertion_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    subject VARCHAR(128) NOT NULL,
    field VARCHAR(64) NOT NULL,
    typed_value LONGTEXT NOT NULL, -- JSON structure
    basis VARCHAR(16) NOT NULL, -- observed, inferred
    supporting_assertion_ids LONGTEXT NULL, -- JSON array
    evidence_refs LONGTEXT NOT NULL, -- JSON array of {document_id, span_id, text_snippet}
    confidence DECIMAL(5,4) NOT NULL,
    rationale TEXT NULL,
    model_run_id VARCHAR(64) NOT NULL,
    validity_status VARCHAR(32) NOT NULL DEFAULT 'valid',
    created_at DATETIME NOT NULL,
    INDEX idx_assert_company (company_id),
    INDEX idx_assert_field (field)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C04 Classification and Profile Publication
CREATE TABLE IF NOT EXISTS maqe_profile_versions (
    profile_version_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    schema_version VARCHAR(16) NOT NULL DEFAULT '1.0',
    source_bundle_version VARCHAR(32) NOT NULL,
    taxonomy_version VARCHAR(32) NOT NULL DEFAULT 'engineering_demo_v1',
    published_at DATETIME NOT NULL,
    provides LONGTEXT NOT NULL, -- JSON array of concepts
    uses LONGTEXT NOT NULL, -- JSON array of concepts
    serves LONGTEXT NOT NULL, -- JSON array of concepts
    likely_needs LONGTEXT NOT NULL, -- JSON array of inferred concepts
    relationships LONGTEXT NOT NULL, -- JSON array of relationships
    quality_indicators LONGTEXT NOT NULL, -- JSON {matchable, review_status, coverage}
    is_current BOOLEAN NOT NULL DEFAULT 0,
    INDEX idx_pv_company (company_id),
    INDEX idx_pv_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C05 Search and Directional Matching
CREATE TABLE IF NOT EXISTS maqe_match_edges (
    edge_id VARCHAR(64) PRIMARY KEY,
    focus_company_id VARCHAR(64) NOT NULL,
    counterparty_company_id VARCHAR(64) NOT NULL,
    relation_family VARCHAR(64) NOT NULL,
    supported_direction_views LONGTEXT NOT NULL, -- JSON array ['supplier', 'customer']
    current_state VARCHAR(32) NOT NULL DEFAULT 'fresh', -- fresh, stale, recalculating, ineligible
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_match_edge_pair (focus_company_id, counterparty_company_id),
    INDEX idx_me_state (current_state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_match_assessments (
    assessment_id VARCHAR(64) PRIMARY KEY,
    edge_id VARCHAR(64) NOT NULL,
    direction VARCHAR(16) NOT NULL, -- supplier, customer
    score INT NOT NULL,
    score_components LONGTEXT NOT NULL, -- JSON {compatibility, sector, geography, evidence}
    coverage DECIMAL(5,4) NOT NULL,
    explanation TEXT NOT NULL,
    supporting_assertions LONGTEXT NOT NULL, -- JSON array
    algorithm_version VARCHAR(32) NOT NULL DEFAULT 'rules_v1',
    evaluated_at DATETIME NOT NULL,
    INDEX idx_ma_edge (edge_id),
    INDEX idx_ma_score (direction, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C06 Membership & Access
CREATE TABLE IF NOT EXISTS maqe_organisations (
    org_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(32) NOT NULL DEFAULT 'free', -- free, pro, premium
    verified_company_id VARCHAR(64) NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_users (
    user_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'member', -- member, operator, admin
    org_id VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_company_claims (
    claim_id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    claimed_by_user_id VARCHAR(64) NOT NULL,
    verification_method VARCHAR(32) NOT NULL, -- email_domain, official_letter, operator_review
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    verification_token VARCHAR(128) NOT NULL,
    token_expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    INDEX idx_claim_company (company_id),
    INDEX idx_claim_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C07 Allocation & Credits Ledger
CREATE TABLE IF NOT EXISTS maqe_credit_wallets (
    wallet_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL UNIQUE,
    allowance_balance INT NOT NULL DEFAULT 0,
    purchased_balance INT NOT NULL DEFAULT 0,
    billing_cycle_resets_at DATETIME NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_ledger_entries (
    entry_id VARCHAR(64) PRIMARY KEY,
    wallet_id VARCHAR(64) NOT NULL,
    entry_type VARCHAR(32) NOT NULL, -- monthly_grant, pack_purchase, match_unlock_debit, debit_reversal
    amount INT NOT NULL,
    balance_after INT NOT NULL,
    reference_id VARCHAR(64) NULL,
    description VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_ledger_wallet (wallet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_member_match_access (
    access_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL,
    focus_company_id VARCHAR(64) NOT NULL,
    counterparty_company_id VARCHAR(64) NOT NULL,
    unlocked_at DATETIME NOT NULL,
    source_transaction_id VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_member_unlock_pair (org_id, focus_company_id, counterparty_company_id),
    INDEX idx_access_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C08 Networking & CRM
CREATE TABLE IF NOT EXISTS maqe_lead_sets (
    lead_set_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_opportunities (
    opportunity_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL,
    focus_company_id VARCHAR(64) NOT NULL,
    counterparty_company_id VARCHAR(64) NOT NULL,
    direction VARCHAR(16) NOT NULL, -- customer, supplier
    state VARCHAR(32) NOT NULL DEFAULT 'prospective', -- prospective, contacted, reviewing, negotiating, won_client, won_supplier, lost
    lead_set_id VARCHAR(64) NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_opp_org (org_id),
    INDEX idx_opp_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_contact_events (
    event_id VARCHAR(64) PRIMARY KEY,
    opportunity_id VARCHAR(64) NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    channel VARCHAR(32) NOT NULL, -- maqe_message, email, phone, rfq
    summary VARCHAR(255) NOT NULL,
    details TEXT NULL,
    occurred_at DATETIME NOT NULL,
    INDEX idx_ce_opp (opportunity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_conversations (
    conversation_id VARCHAR(64) PRIMARY KEY,
    participant_org_ids LONGTEXT NOT NULL, -- JSON array
    subject VARCHAR(255) NOT NULL,
    resource_type VARCHAR(32) NULL, -- opportunity, rfq, general
    resource_id VARCHAR(64) NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_messages (
    message_id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL,
    sender_org_id VARCHAR(64) NOT NULL,
    sender_user_id VARCHAR(64) NOT NULL,
    body TEXT NOT NULL,
    sent_at DATETIME NOT NULL,
    INDEX idx_msg_conv (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_rfq_templates (
    template_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    requirement_description TEXT NOT NULL,
    specifications LONGTEXT NULL, -- JSON
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_rfqs (
    rfq_id VARCHAR(64) PRIMARY KEY,
    issuer_org_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    requirement_description TEXT NOT NULL,
    specifications LONGTEXT NULL, -- JSON
    requested_response_date DATE NOT NULL,
    state VARCHAR(32) NOT NULL DEFAULT 'open', -- draft, open, closed, awarded
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_rfq_recipients (
    recipient_id VARCHAR(64) PRIMARY KEY,
    rfq_id VARCHAR(64) NOT NULL,
    supplier_company_id VARCHAR(64) NOT NULL,
    supplier_org_id VARCHAR(64) NULL,
    individual_thread_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'sent', -- sent, viewed, submitted_bid, declined
    bid_amount DECIMAL(12,2) NULL,
    bid_details TEXT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_rfq_recip (rfq_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_referral_invitations (
    invitation_id VARCHAR(64) PRIMARY KEY,
    referring_org_id VARCHAR(64) NOT NULL,
    target_company_id VARCHAR(64) NULL,
    recipient_email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(128) NOT NULL UNIQUE,
    relationship_type VARCHAR(32) NOT NULL DEFAULT 'supplier', -- supplier, customer, peer
    status VARCHAR(32) NOT NULL DEFAULT 'sent', -- sent, accepted, expired
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C09 Projects (Later module)
CREATE TABLE IF NOT EXISTS maqe_projects (
    project_id VARCHAR(64) PRIMARY KEY,
    owner_org_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_concepts LONGTEXT NOT NULL, -- JSON array
    budget_currency VARCHAR(8) NOT NULL DEFAULT 'GBP',
    budget_max DECIMAL(12,2) NULL,
    location_constraint VARCHAR(128) NULL,
    state VARCHAR(32) NOT NULL DEFAULT 'published', -- draft, published, reviewing, awarded, closed, cancelled
    max_bids INT NOT NULL DEFAULT 10,
    awarded_bid_id VARCHAR(64) NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_project_bids (
    bid_id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    bidder_org_id VARCHAR(64) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    proposal TEXT NOT NULL,
    state VARCHAR(32) NOT NULL DEFAULT 'submitted', -- submitted, shortlisted, awarded, rejected, withdrawn
    submitted_at DATETIME NOT NULL,
    UNIQUE KEY uk_project_bidder (project_id, bidder_org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C10 Shared Platform Jobs & Audit
CREATE TABLE IF NOT EXISTS maqe_jobs (
    job_id VARCHAR(64) PRIMARY KEY,
    job_type VARCHAR(64) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    schema_version VARCHAR(16) NOT NULL DEFAULT '1.0',
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    requested_by VARCHAR(64) NOT NULL DEFAULT 'system',
    mode VARCHAR(16) NOT NULL DEFAULT 'fixture', -- fixture, live
    state VARCHAR(32) NOT NULL DEFAULT 'queued', -- queued, running, succeeded, partial, failed, cancelled
    attempts INT NOT NULL DEFAULT 0,
    progress INT NOT NULL DEFAULT 0,
    output_refs LONGTEXT NULL, -- JSON
    error_message TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_job_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_audit_events (
    event_id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    aggregate_version VARCHAR(32) NULL,
    actor_id VARCHAR(64) NOT NULL,
    correlation_id VARCHAR(64) NULL,
    payload LONGTEXT NOT NULL, -- JSON
    occurred_at DATETIME NOT NULL,
    INDEX idx_ae_type (event_type),
    INDEX idx_ae_agg (aggregate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C11 Commerce Subscriptions & Events
CREATE TABLE IF NOT EXISTS maqe_plan_subscriptions (
    subscription_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL,
    plan_tier VARCHAR(32) NOT NULL, -- free, pro, premium
    monthly_credits INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, past_due, canceled
    current_period_start DATETIME NOT NULL,
    current_period_end DATETIME NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    INDEX idx_sub_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C12 Multi-channel Notifications
CREATE TABLE IF NOT EXISTS maqe_notifications (
    notification_id VARCHAR(64) PRIMARY KEY,
    recipient_user_id VARCHAR(64) NULL,
    recipient_org_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    resource_ref VARCHAR(255) NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'normal',
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_notif_org (recipient_org_id),
    INDEX idx_notif_read (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maqe_notification_deliveries (
    delivery_id VARCHAR(64) PRIMARY KEY,
    notification_id VARCHAR(64) NOT NULL,
    channel VARCHAR(32) NOT NULL, -- in_app, email, sms, whatsapp
    provider_id VARCHAR(32) NOT NULL DEFAULT 'internal',
    destination VARCHAR(255) NOT NULL,
    state VARCHAR(32) NOT NULL DEFAULT 'delivered', -- queued, submitted, delivered, failed, suppressed
    attempt_count INT NOT NULL DEFAULT 1,
    provider_callback_id VARCHAR(128) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_nd_notif (notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
