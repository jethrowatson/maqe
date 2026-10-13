/**
 * MAQE Synthetic Canonical Fixture Cohort
 * Featuring Delta Metalworks Ltd benchmark cohort and counterparty landscape
 * Matches Section 8, 9, 17, 18 of the Technical Build Addendum v1.1
 */

import {
  CompanyRecord,
  SourceAssociation,
  SourceDocument,
  Assertion,
  ProfileVersion,
  MatchEdge,
  MatchAssessment,
  MatchCandidateResult,
  Organisation,
  CreditWallet,
  LedgerEntry,
  Opportunity,
  RFQTemplate
} from '../domain/types';

export const FIXTURE_ORGANISATIONS: Organisation[] = [
  {
    org_id: 'org_delta',
    name: 'Delta Metalworks Ltd',
    plan_tier: 'premium',
    verified_company_id: 'demo_delta',
    created_at: '2026-01-15T09:00:00Z'
  },
  {
    org_id: 'org_apex',
    name: 'Apex Steel & Alloys Ltd',
    plan_tier: 'pro',
    verified_company_id: 'demo_raw_metal',
    created_at: '2026-02-10T11:30:00Z'
  },
  {
    org_id: 'org_enclosures',
    name: 'Apex Enclosures Ltd',
    plan_tier: 'free',
    verified_company_id: 'demo_enclosures',
    created_at: '2026-03-01T14:15:00Z'
  }
];

export const FIXTURE_WALLETS: CreditWallet[] = [
  {
    wallet_id: 'wallet_delta',
    org_id: 'org_delta',
    allowance_balance: 50,
    purchased_balance: 0,
    billing_cycle_resets_at: '2026-11-15T09:00:00Z',
    updated_at: '2026-10-13T10:00:00Z'
  },
  {
    wallet_id: 'wallet_apex',
    org_id: 'org_apex',
    allowance_balance: 20,
    purchased_balance: 0,
    billing_cycle_resets_at: '2026-11-10T11:30:00Z',
    updated_at: '2026-10-13T10:00:00Z'
  }
];

export const FIXTURE_LEDGER_ENTRIES: LedgerEntry[] = [
  {
    entry_id: 'tx_seed_delta_01',
    wallet_id: 'wallet_delta',
    entry_type: 'monthly_grant',
    amount: 50,
    balance_after: 50,
    reference_id: 'sub_premium_demo',
    description: 'Initial Premium monthly credit allowance (50 credits)',
    created_at: '2026-10-01T00:00:00Z'
  }
];

export const FIXTURE_COMPANIES: CompanyRecord[] = [
  {
    company_id: 'demo_delta',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '09482711',
    legal_name: 'Delta Metalworks Ltd',
    trading_names: ['Delta Precision Fabrication', 'Delta Metal'],
    status: 'active',
    sic_codes: ['25110', '25500'],
    incorporation_date: '2015-03-12',
    addresses: {
      registered: 'Unit 4, Vulcan Industrial Estate, Sheffield, S9 2TX',
      country: 'United Kingdom',
      locality: 'Sheffield',
      postal_code: 'S9 2TX'
    },
    source_updated_at: '2026-09-20T14:30:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_raw_metal',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '08119234',
    legal_name: 'Apex Steel & Alloys Ltd',
    trading_names: ['Apex Metals UK'],
    status: 'active',
    sic_codes: ['24100', '24320'],
    incorporation_date: '2012-06-20',
    addresses: {
      registered: 'Foundry Park, Scunthorpe, DN16 1AL',
      country: 'United Kingdom',
      locality: 'Scunthorpe',
      postal_code: 'DN16 1AL'
    },
    source_updated_at: '2026-09-18T10:00:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_equipment',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '07223190',
    legal_name: 'Precision Press & Tooling Ltd',
    trading_names: ['Precision Machinery UK'],
    status: 'active',
    sic_codes: ['28410'],
    incorporation_date: '2010-04-15',
    addresses: {
      registered: 'Engineering Way, Birmingham, B24 8HX',
      country: 'United Kingdom',
      locality: 'Birmingham',
      postal_code: 'B24 8HX'
    },
    source_updated_at: '2026-08-11T12:00:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_logistics',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '06441092',
    legal_name: 'Titan Freight & Haulage Ltd',
    trading_names: ['Titan Logistics'],
    status: 'active',
    sic_codes: ['49410'],
    incorporation_date: '2008-01-30',
    addresses: {
      registered: 'Logistics Hub North, Leeds, LS10 1AU',
      country: 'United Kingdom',
      locality: 'Leeds',
      postal_code: 'LS10 1AU'
    },
    source_updated_at: '2026-07-04T09:15:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_enclosures',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '10293844',
    legal_name: 'Apex Enclosures Ltd',
    trading_names: ['Apex Racks & Cabinets'],
    status: 'active',
    sic_codes: ['26110', '27120'],
    incorporation_date: '2016-08-05',
    addresses: {
      registered: 'Centurion Park, Nottingham, NG7 2RF',
      country: 'United Kingdom',
      locality: 'Nottingham',
      postal_code: 'NG7 2RF'
    },
    source_updated_at: '2026-09-25T11:45:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_components',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '11029381',
    legal_name: 'Vanguard Auto Components Ltd',
    trading_names: ['Vanguard Stamping Solutions'],
    status: 'active',
    sic_codes: ['29320'],
    incorporation_date: '2017-10-24',
    addresses: {
      registered: 'Motorway Gateway, Coventry, CV3 4PW',
      country: 'United Kingdom',
      locality: 'Coventry',
      postal_code: 'CV3 4PW'
    },
    source_updated_at: '2026-09-12T15:20:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_assembly_weak',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '12938475',
    legal_name: 'Quantum Robotics Ltd',
    trading_names: ['Quantum Automation Labs'],
    status: 'active',
    sic_codes: ['28990'],
    incorporation_date: '2020-11-18',
    addresses: {
      registered: 'Innovation Campus, Cambridge, CB24 9ZR',
      country: 'United Kingdom',
      locality: 'Cambridge',
      postal_code: 'CB24 9ZR'
    },
    source_updated_at: '2026-06-10T16:00:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_competitor',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '09988112',
    legal_name: 'Vortex Sheet Metal Ltd',
    trading_names: ['Vortex Fabrications Rotherham'],
    status: 'active',
    sic_codes: ['25110'],
    incorporation_date: '2016-02-14',
    addresses: {
      registered: 'River Don Works, Rotherham, S60 1FE',
      country: 'United Kingdom',
      locality: 'Rotherham',
      postal_code: 'S60 1FE'
    },
    source_updated_at: '2026-08-30T10:10:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  },
  {
    company_id: 'demo_unrelated',
    jurisdiction: 'GB',
    registry_namespace: 'companies_house',
    registration_number: '05882311',
    legal_name: 'BioHealth Pharmaceuticals Ltd',
    trading_names: [],
    status: 'active',
    sic_codes: ['21200'],
    incorporation_date: '2006-07-21',
    addresses: {
      registered: 'Science Way, Oxford, OX4 4GA',
      country: 'United Kingdom',
      locality: 'Oxford',
      postal_code: 'OX4 4GA'
    },
    source_updated_at: '2026-05-19T13:40:00Z',
    ingested_at: '2026-10-01T08:00:00Z'
  }
];

export const FIXTURE_ASSOCIATIONS: SourceAssociation[] = [
  {
    association_id: 'assoc_delta_01',
    company_id: 'demo_delta',
    url: 'https://deltametalworks.co.uk',
    source_type: 'official_website',
    discovery_run_id: 'disc_seed_01',
    identity_signals: {
      reg_no_match: true,
      domain_match: true,
      name_similarity: 0.98,
      address_match: true
    },
    confidence: 0.99,
    decision: 'approved',
    reviewer: 'auto_rule_identity',
    review_reason: 'Registration number 09482711 matched on footer',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z'
  },
  {
    association_id: 'assoc_raw_metal_01',
    company_id: 'demo_raw_metal',
    url: 'https://apexsteel.co.uk',
    source_type: 'official_website',
    discovery_run_id: 'disc_seed_01',
    identity_signals: {
      reg_no_match: true,
      domain_match: true,
      name_similarity: 0.95
    },
    confidence: 0.98,
    decision: 'approved',
    reviewer: 'auto_rule_identity',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z'
  },
  {
    association_id: 'assoc_enclosures_01',
    company_id: 'demo_enclosures',
    url: 'https://apex-enclosures.co.uk',
    source_type: 'official_website',
    discovery_run_id: 'disc_seed_01',
    identity_signals: {
      reg_no_match: true,
      domain_match: true,
      name_similarity: 0.98
    },
    confidence: 0.98,
    decision: 'approved',
    reviewer: 'auto_rule_identity',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z'
  }
];

export const FIXTURE_DOCUMENTS: SourceDocument[] = [
  {
    document_id: 'doc_delta_01',
    association_id: 'assoc_delta_01',
    canonical_url: 'https://deltametalworks.co.uk/services',
    fetched_at: '2026-10-01T09:05:00Z',
    content_hash: 'sha256_delta_body_01',
    media_type: 'text/html',
    language: 'en',
    retrieval_status: 'success',
    body_ref: 's3://maqe-documents/demo_delta/services.html',
    document_title: 'Delta Metalworks - Precision Sheet Metal Fabrication',
    extracted_text: 'Delta Metalworks is a leading UK precision sheet metal fabricator based in Sheffield. We operate high-speed 10kW fiber laser cutters capable of profiling up to 25mm mild steel, 20mm stainless steel 304/316, and 15mm aluminium 5083/6082. Our fabrication capabilities include multi-axis CNC press brake bending (up to 320 tonnes), automated robotic welding cells (MIG/TIG), and mechanical assembly. We serve electronics enclosure manufacturers, automotive assembly lines, and industrial machinery builders. We require consistent mill-certified cold-rolled steel coils, stainless sheet, and aluminium plate.'
  },
  {
    document_id: 'doc_enclosures_01',
    association_id: 'assoc_enclosures_01',
    canonical_url: 'https://apex-enclosures.co.uk/about',
    fetched_at: '2026-10-01T09:10:00Z',
    content_hash: 'sha256_enc_body_01',
    media_type: 'text/html',
    language: 'en',
    retrieval_status: 'success',
    body_ref: 's3://maqe-documents/demo_enclosures/about.html',
    document_title: 'Apex Enclosures - Server Racks & Industrial Cabinets',
    extracted_text: 'Apex Enclosures designs and builds high-specification electrical cabinets, data center server racks, and weatherproof outdoor enclosures. Our assembly facilities require high volumes of precision-cut sheet metal panels, punched mounting plates, and powder-coated steel enclosures.'
  }
];

export const FIXTURE_ASSERTIONS: Assertion[] = [
  {
    assertion_id: 'ast_delta_01',
    company_id: 'demo_delta',
    subject: 'offering',
    field: 'provides',
    typed_value: {
      concept_id: 'sheet_metal_supply',
      label: 'Precision Sheet Metal Supply',
      materials: ['mild_steel', 'stainless_steel_304', 'aluminium_5083'],
      max_thickness_mm: 25
    },
    basis: 'observed',
    evidence_refs: [
      {
        document_id: 'doc_delta_01',
        span: 'high-speed 10kW fiber laser cutters capable of profiling up to 25mm mild steel'
      }
    ],
    confidence: 0.98,
    rationale: 'Direct statement on website services page',
    model_run_id: 'model_run_v1',
    validity_status: 'valid',
    created_at: '2026-10-01T09:15:00Z'
  },
  {
    assertion_id: 'ast_delta_02',
    company_id: 'demo_delta',
    subject: 'offering',
    field: 'provides',
    typed_value: {
      concept_id: 'precision_fabrication',
      label: 'CNC Press Brake & Robotic Welding',
      processes: ['laser_cutting', 'press_brake_forming', 'mig_tig_welding']
    },
    basis: 'observed',
    evidence_refs: [
      {
        document_id: 'doc_delta_01',
        span: 'multi-axis CNC press brake bending (up to 320 tonnes), automated robotic welding cells'
      }
    ],
    confidence: 0.95,
    rationale: 'Observed tooling descriptions',
    model_run_id: 'model_run_v1',
    validity_status: 'valid',
    created_at: '2026-10-01T09:15:00Z'
  },
  {
    assertion_id: 'ast_delta_03',
    company_id: 'demo_delta',
    subject: 'requirement',
    field: 'likely_needs',
    typed_value: {
      concept_id: 'raw_metal',
      label: 'Steel & Aluminium Mill Plate / Coil',
      forms: ['coil', 'sheet', 'plate']
    },
    basis: 'inferred',
    supporting_assertion_ids: ['ast_delta_01'],
    evidence_refs: [
      {
        document_id: 'doc_delta_01',
        span: 'require consistent mill-certified cold-rolled steel coils, stainless sheet'
      }
    ],
    confidence: 0.95,
    rationale: 'Raw material requirement logically inferred from sheet metal fabrication activity',
    model_run_id: 'model_run_v1',
    validity_status: 'valid',
    created_at: '2026-10-01T09:15:00Z'
  },
  {
    assertion_id: 'ast_delta_04',
    company_id: 'demo_delta',
    subject: 'requirement',
    field: 'likely_needs',
    typed_value: {
      concept_id: 'metalworking_equipment',
      label: 'Metalworking Presses & CNC Tooling'
    },
    basis: 'inferred',
    supporting_assertion_ids: ['ast_delta_02'],
    evidence_refs: [],
    confidence: 0.88,
    rationale: 'Fabrication plant requires periodic machinery tooling, laser consumables, and press maintenance',
    model_run_id: 'model_run_v1',
    validity_status: 'valid',
    created_at: '2026-10-01T09:15:00Z'
  },
  {
    assertion_id: 'ast_delta_05',
    company_id: 'demo_delta',
    subject: 'requirement',
    field: 'likely_needs',
    typed_value: {
      concept_id: 'logistics_freight',
      label: 'Heavy Industrial Flatbed Haulage'
    },
    basis: 'inferred',
    supporting_assertion_ids: ['ast_delta_01'],
    evidence_refs: [],
    confidence: 0.85,
    rationale: 'Delivery of heavy raw steel sheets and outbound customer components requires freight transport',
    model_run_id: 'model_run_v1',
    validity_status: 'valid',
    created_at: '2026-10-01T09:15:00Z'
  }
];

export const FIXTURE_PROFILES: Record<string, ProfileVersion> = {
  demo_delta: {
    profile_version_id: 'pv_delta_v1',
    company_id: 'demo_delta',
    schema_version: '1.0',
    source_bundle_version: 'sb_delta_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'sheet_metal_supply',
        label: 'Precision Sheet Metal Supply',
        basis: 'observed',
        confidence: 0.98,
        assertion_id: 'ast_delta_01'
      },
      {
        concept_id: 'precision_fabrication',
        label: 'CNC Bending & Welding',
        basis: 'observed',
        confidence: 0.95,
        assertion_id: 'ast_delta_02'
      }
    ],
    uses: [],
    serves: ['parts_manufacturing', 'assembly_manufacturing', 'enclosure_manufacturing', 'automotive_tier2'],
    likely_needs: [
      {
        concept_id: 'raw_metal',
        label: 'Steel Coil & Aluminium Sheet',
        basis: 'inferred',
        confidence: 0.95,
        assertion_id: 'ast_delta_03'
      },
      {
        concept_id: 'metalworking_equipment',
        label: 'Presses & Tooling',
        basis: 'inferred',
        confidence: 0.88,
        assertion_id: 'ast_delta_04'
      },
      {
        concept_id: 'logistics_freight',
        label: 'Heavy Transport',
        basis: 'inferred',
        confidence: 0.85,
        assertion_id: 'ast_delta_05'
      }
    ],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.94,
      freshness_days: 1
    },
    is_current: true
  },
  demo_raw_metal: {
    profile_version_id: 'pv_raw_metal_v1',
    company_id: 'demo_raw_metal',
    schema_version: '1.0',
    source_bundle_version: 'sb_raw_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'raw_metal',
        label: 'Primary Steel Coil & Non-Ferrous Alloys',
        basis: 'observed',
        confidence: 0.98
      }
    ],
    uses: ['iron_ore', 'scrap_metal', 'foundry_furnaces'],
    serves: ['metal_fabricators', 'sheet_metal_manufacturers', 'automotive_tier1'],
    likely_needs: ['freight_logistics', 'foundry_consumables'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.92
    },
    is_current: true
  },
  demo_equipment: {
    profile_version_id: 'pv_equipment_v1',
    company_id: 'demo_equipment',
    schema_version: '1.0',
    source_bundle_version: 'sb_eq_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'metalworking_equipment',
        label: 'CNC Hydraulic Press Brakes & Laser Consumables',
        basis: 'observed',
        confidence: 0.96
      }
    ],
    uses: ['hydraulics', 'electronics', 'steel_castings'],
    serves: ['sheet_metal_manufacturers', 'aerospace_fabricators'],
    likely_needs: ['precision_linear_guides'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.90
    },
    is_current: true
  },
  demo_logistics: {
    profile_version_id: 'pv_logistics_v1',
    company_id: 'demo_logistics',
    schema_version: '1.0',
    source_bundle_version: 'sb_log_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'logistics_freight',
        label: 'Heavy Flatbed Industrial Haulage',
        basis: 'observed',
        confidence: 0.95
      }
    ],
    uses: ['commercial_vehicles', 'diesel_fuel'],
    serves: ['steel_mills', 'metal_fabricators', 'heavy_equipment'],
    likely_needs: ['fleet_telematics', 'commercial_tyres'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.88
    },
    is_current: true
  },
  demo_enclosures: {
    profile_version_id: 'pv_enclosures_v1',
    company_id: 'demo_enclosures',
    schema_version: '1.0',
    source_bundle_version: 'sb_enc_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'electrical_enclosures',
        label: 'Server Racks & Control Cabinets',
        basis: 'observed',
        confidence: 0.97
      }
    ],
    uses: ['sheet_metal_supply', 'powder_coatings', 'terminal_blocks'],
    serves: ['data_centers', 'industrial_automation', 'utilities'],
    likely_needs: ['sheet_metal_supply', 'fasteners'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.93
    },
    is_current: true
  },
  demo_components: {
    profile_version_id: 'pv_components_v1',
    company_id: 'demo_components',
    schema_version: '1.0',
    source_bundle_version: 'sb_comp_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'automotive_brackets',
        label: 'Stamped Automotive Brackets & Assemblies',
        basis: 'observed',
        confidence: 0.95
      }
    ],
    uses: ['sheet_metal_supply', 'fasteners'],
    serves: ['oem_automotive', 'tier1_integrators'],
    likely_needs: ['sheet_metal_supply', 'tooling_steel'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.89
    },
    is_current: true
  },
  demo_assembly_weak: {
    profile_version_id: 'pv_assembly_v1',
    company_id: 'demo_assembly_weak',
    schema_version: '1.0',
    source_bundle_version: 'sb_asm_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'robotic_arms',
        label: 'Collaborative Robotic Cells',
        basis: 'observed',
        confidence: 0.92
      }
    ],
    uses: ['servomotors', 'aluminium_extrusions', 'sheet_metal_supply'],
    serves: ['advanced_manufacturing', 'pharmaceutical_packaging'],
    likely_needs: ['sensors', 'precision_gearboxes'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.75
    },
    is_current: true
  },
  demo_competitor: {
    profile_version_id: 'pv_competitor_v1',
    company_id: 'demo_competitor',
    schema_version: '1.0',
    source_bundle_version: 'sb_comp_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'sheet_metal_supply',
        label: 'Laser Cut & Formed Sheet Steel',
        basis: 'observed',
        confidence: 0.96
      }
    ],
    uses: ['raw_metal'],
    serves: ['general_engineering', 'construction'],
    likely_needs: ['raw_metal'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.88
    },
    is_current: true
  },
  demo_unrelated: {
    profile_version_id: 'pv_unrelated_v1',
    company_id: 'demo_unrelated',
    schema_version: '1.0',
    source_bundle_version: 'sb_pharma_01',
    taxonomy_version: 'engineering_demo_v1',
    published_at: '2026-10-01T10:00:00Z',
    provides: [
      {
        concept_id: 'pharmaceutical_formulation',
        label: 'Oral Solid Dosage & Injectables',
        basis: 'observed',
        confidence: 0.99
      }
    ],
    uses: ['active_pharmaceutical_ingredients', 'sterilization_gases'],
    serves: ['hospitals', 'pharmacies'],
    likely_needs: ['cleanroom_consumables'],
    relationships: [],
    quality_indicators: {
      matchable: true,
      review_status: 'accepted',
      coverage: 0.95
    },
    is_current: true
  }
};

export const FIXTURE_MATCH_CANDIDATES: MatchCandidateResult[] = [
  // Customer Leads for Delta Metalworks
  {
    edge_id: 'edge_delta_enclosures',
    focus_company_id: 'demo_delta',
    counterparty_company_id: 'demo_enclosures',
    counterparty_name: 'Apex Enclosures Ltd',
    registration_number: '10293844',
    addresses: {
      registered: 'Centurion Park, Nottingham, NG7 2RF',
      country: 'United Kingdom',
      locality: 'Nottingham'
    },
    sic_codes: ['26110', '27120'],
    assessment_id: 'asmt_delta_enclosures_cust',
    direction: 'customer',
    score: 92,
    score_components: {
      compatibility: 1.0,
      sector: 0.90,
      geography: 0.85,
      evidence: 0.90
    },
    coverage: 0.93,
    explanation: 'Apex Enclosures actively fabricates electronic enclosures and server cabinets requiring custom laser-cut sheet steel, matching Delta Metalworks primary fabrication offerings.',
    supporting_assertions: ['ast_delta_01', 'ast_delta_02'],
    is_unlocked: false,
    profile_version: FIXTURE_PROFILES['demo_enclosures']
  },
  {
    edge_id: 'edge_delta_components',
    focus_company_id: 'demo_delta',
    counterparty_company_id: 'demo_components',
    counterparty_name: 'Vanguard Auto Components Ltd',
    registration_number: '11029381',
    addresses: {
      registered: 'Motorway Gateway, Coventry, CV3 4PW',
      country: 'United Kingdom',
      locality: 'Coventry'
    },
    sic_codes: ['29320'],
    assessment_id: 'asmt_delta_components_cust',
    direction: 'customer',
    score: 86,
    score_components: {
      compatibility: 0.90,
      sector: 0.88,
      geography: 0.80,
      evidence: 0.85
    },
    coverage: 0.89,
    explanation: 'Vanguard Auto Components produces stamped brackets and vehicle subassemblies using laser-cut blanks, presenting high-volume repeat contract potential.',
    supporting_assertions: ['ast_delta_01'],
    is_unlocked: false,
    profile_version: FIXTURE_PROFILES['demo_components']
  },
  {
    edge_id: 'edge_delta_assembly',
    focus_company_id: 'demo_delta',
    counterparty_company_id: 'demo_assembly_weak',
    counterparty_name: 'Quantum Robotics Ltd',
    registration_number: '12938475',
    addresses: {
      registered: 'Innovation Campus, Cambridge, CB24 9ZR',
      country: 'United Kingdom',
      locality: 'Cambridge'
    },
    sic_codes: ['28990'],
    assessment_id: 'asmt_delta_assembly_cust',
    direction: 'customer',
    score: 58,
    score_components: {
      compatibility: 0.60,
      sector: 0.60,
      geography: 0.65,
      evidence: 0.50
    },
    coverage: 0.75,
    explanation: 'Quantum Robotics builds automation cells. Evidence shows partial sheet metal casing use alongside extruded aluminium; lower confidence prospective opportunity.',
    supporting_assertions: ['ast_delta_01'],
    is_unlocked: false,
    profile_version: FIXTURE_PROFILES['demo_assembly_weak']
  },

  // Supplier Matches for Delta Metalworks
  {
    edge_id: 'edge_delta_raw_metal',
    focus_company_id: 'demo_delta',
    counterparty_company_id: 'demo_raw_metal',
    counterparty_name: 'Apex Steel & Alloys Ltd',
    registration_number: '08119234',
    addresses: {
      registered: 'Foundry Park, Scunthorpe, DN16 1AL',
      country: 'United Kingdom',
      locality: 'Scunthorpe'
    },
    sic_codes: ['24100', '24320'],
    assessment_id: 'asmt_delta_raw_metal_sup',
    direction: 'supplier',
    score: 94,
    score_components: {
      compatibility: 1.0,
      sector: 0.95,
      geography: 0.90,
      evidence: 0.92
    },
    coverage: 0.94,
    explanation: 'Apex Steel & Alloys provides mill-certified steel coil and aluminium plate, satisfying Delta Metalworks inferred raw material requirement with 98% capability alignment.',
    supporting_assertions: ['ast_delta_03'],
    is_unlocked: false,
    profile_version: FIXTURE_PROFILES['demo_raw_metal']
  },
  {
    edge_id: 'edge_delta_equipment',
    focus_company_id: 'demo_delta',
    counterparty_company_id: 'demo_equipment',
    counterparty_name: 'Precision Press & Tooling Ltd',
    registration_number: '07223190',
    addresses: {
      registered: 'Engineering Way, Birmingham, B24 8HX',
      country: 'United Kingdom',
      locality: 'Birmingham'
    },
    sic_codes: ['28410'],
    assessment_id: 'asmt_delta_equipment_sup',
    direction: 'supplier',
    score: 88,
    score_components: {
      compatibility: 0.90,
      sector: 0.90,
      geography: 0.85,
      evidence: 0.87
    },
    coverage: 0.90,
    explanation: 'Precision Press & Tooling manufactures CNC press brake tooling and hydraulic machine components, aligning directly with Delta Metalworks machinery maintenance and tooling needs.',
    supporting_assertions: ['ast_delta_04'],
    is_unlocked: false,
    profile_version: FIXTURE_PROFILES['demo_equipment']
  },
  {
    edge_id: 'edge_delta_logistics',
    focus_company_id: 'demo_delta',
    counterparty_company_id: 'demo_logistics',
    counterparty_name: 'Titan Freight & Haulage Ltd',
    registration_number: '06441092',
    addresses: {
      registered: 'Logistics Hub North, Leeds, LS10 1AU',
      country: 'United Kingdom',
      locality: 'Leeds'
    },
    sic_codes: ['49410'],
    assessment_id: 'asmt_delta_logistics_sup',
    direction: 'supplier',
    score: 84,
    score_components: {
      compatibility: 0.85,
      sector: 0.85,
      geography: 0.90,
      evidence: 0.82
    },
    coverage: 0.88,
    explanation: 'Titan Freight operates flatbed articulated fleet transport suitable for regional palletized metal delivery and mill coil logistics.',
    supporting_assertions: ['ast_delta_05'],
    is_unlocked: false,
    profile_version: FIXTURE_PROFILES['demo_logistics']
  }
];

export const FIXTURE_OPPORTUNITIES: Opportunity[] = [
  {
    opportunity_id: 'opp_delta_enclosures',
    org_id: 'org_delta',
    focus_company_id: 'demo_delta',
    counterparty_company_id: 'demo_enclosures',
    counterparty_name: 'Apex Enclosures Ltd',
    registration_number: '10293844',
    addresses: {
      registered: 'Centurion Park, Nottingham, NG7 2RF',
      country: 'United Kingdom'
    },
    direction: 'customer',
    state: 'reviewing',
    notes: 'High-volume server rack sheet metal requirement. Followed up on RFQ specifications.',
    created_at: '2026-10-05T11:00:00Z',
    updated_at: '2026-10-12T14:30:00Z'
  }
];

export const FIXTURE_RFQ_TEMPLATES: RFQTemplate[] = [
  {
    template_id: 'tmpl_sheet_metal',
    org_id: 'org_delta',
    title: 'Standard Precision Sheet Metal RFQ',
    requirement_description: 'Request for Quotation for CNC laser cutting, deburring, and CNC press forming according to supplied STEP/DXF files.',
    specifications: {
      material: 'Mild Steel S275JR / Stainless 304',
      batch_sizes: [100, 250, 500],
      finish: 'Deburred, untreated'
    },
    created_at: '2026-10-02T10:00:00Z'
  }
];
