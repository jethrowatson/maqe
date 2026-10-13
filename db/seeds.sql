-- =========================================================================
-- MAQE Synthetic Canonical Fixture Cohort Seeds
-- Version 1.1 Specification (9 October 2026)
-- Featuring Delta Metalworks Ltd benchmark cohort and counterparty landscape
-- =========================================================================

-- Clear existing fixture records to ensure idempotency
DELETE FROM maqe_member_match_access;
DELETE FROM maqe_ledger_entries;
DELETE FROM maqe_credit_wallets;
DELETE FROM maqe_match_assessments;
DELETE FROM maqe_match_edges;
DELETE FROM maqe_assertions;
DELETE FROM maqe_profile_versions;
DELETE FROM maqe_source_documents;
DELETE FROM maqe_source_associations;
DELETE FROM maqe_company_claims;
DELETE FROM maqe_users;
DELETE FROM maqe_organisations;
DELETE FROM maqe_companies;

-- 1. Organizations
INSERT INTO maqe_organisations (org_id, name, plan_tier, verified_company_id, created_at) VALUES
('org_delta', 'Delta Metalworks Ltd', 'premium', 'demo_delta', NOW()),
('org_apex', 'Apex Steel & Alloys Ltd', 'pro', 'demo_raw_metal', NOW()),
('org_enclosures', 'Apex Enclosures Ltd', 'free', 'demo_enclosures', NOW());

-- 2. Users
INSERT INTO maqe_users (user_id, email, name, role, org_id, created_at) VALUES
('usr_delta_ops', 'marcus.vance@deltametalworks.co.uk', 'Marcus Vance', 'member', 'org_delta', NOW()),
('usr_maqe_operator', 'operator@maqe.intelligence', 'Sarah Jenkins', 'operator', 'org_delta', NOW());

-- 3. Credit Wallets
INSERT INTO maqe_credit_wallets (wallet_id, org_id, allowance_balance, purchased_balance, billing_cycle_resets_at, updated_at) VALUES
('wallet_delta', 'org_delta', 50, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW()),
('wallet_apex', 'org_apex', 20, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW()),
('wallet_enclosures', 'org_enclosures', 0, 0, NULL, NOW());

-- 4. Initial Ledger Entries
INSERT INTO maqe_ledger_entries (entry_id, wallet_id, entry_type, amount, balance_after, reference_id, description, created_at) VALUES
('tx_seed_delta_01', 'wallet_delta', 'monthly_grant', 50, 50, 'sub_premium_demo', 'Initial Premium monthly credit allowance (50 credits)', NOW()),
('tx_seed_apex_01', 'wallet_apex', 'monthly_grant', 20, 20, 'sub_pro_demo', 'Initial Pro monthly credit allowance (20 credits)', NOW());

-- 5. Canonical Companies
INSERT INTO maqe_companies (company_id, jurisdiction, registry_namespace, registration_number, legal_name, trading_names, status, sic_codes, incorporation_date, addresses, source_updated_at, ingested_at) VALUES
('demo_delta', 'GB', 'companies_house', '09482711', 'Delta Metalworks Ltd', '["Delta Precision Fabrication"]', 'active', '["25110", "25500"]', '2015-03-12', '{"registered": "Unit 4, Vulcan Industrial Estate, Sheffield, S9 2TX", "country": "United Kingdom"}', NOW(), NOW()),
('demo_raw_metal', 'GB', 'companies_house', '08119234', 'Apex Steel & Alloys Ltd', '["Apex Metals"]', 'active', '["24100", "24320"]', '2012-06-20', '{"registered": "Foundry Park, Scunthorpe, DN16 1AL", "country": "United Kingdom"}', NOW(), NOW()),
('demo_equipment', 'GB', 'companies_house', '07223190', 'Precision Press & Tooling Ltd', '["Precision Machinery UK"]', 'active', '["28410"]', '2010-04-15', '{"registered": "Engineering Way, Birmingham, B24 8HX", "country": "United Kingdom"}', NOW(), NOW()),
('demo_logistics', 'GB', 'companies_house', '06441092', 'Titan Freight & Haulage Ltd', '["Titan Heavy Logistics"]', 'active', '["49410"]', '2008-01-30', '{"registered": "Logistics Hub North, Leeds, LS10 1AU", "country": "United Kingdom"}', NOW(), NOW()),
('demo_enclosures', 'GB', 'companies_house', '10293844', 'Apex Enclosures Ltd', '["Apex Racks"]', 'active', '["26110", "27120"]', '2016-08-05', '{"registered": "Centurion Park, Nottingham, NG7 2RF", "country": "United Kingdom"}', NOW(), NOW()),
('demo_components', 'GB', 'companies_house', '11029381', 'Vanguard Auto Components Ltd', '["Vanguard Stamping"]', 'active', '["29320"]', '2017-10-24', '{"registered": "Motorway Gateway, Coventry, CV3 4PW", "country": "United Kingdom"}', NOW(), NOW()),
('demo_assembly_weak', 'GB', 'companies_house', '12938475', 'Quantum Robotics Ltd', '["Quantum Automation"]', 'active', '["28990"]', '2020-11-18', '{"registered": "Innovation Campus, Cambridge, CB24 9ZR", "country": "United Kingdom"}', NOW(), NOW()),
('demo_competitor', 'GB', 'companies_house', '09988112', 'Vortex Sheet Metal Ltd', '["Vortex Fabrications"]', 'active', '["25110"]', '2016-02-14', '{"registered": "River Don Works, Rotherham, S60 1FE", "country": "United Kingdom"}', NOW(), NOW()),
('demo_unrelated', 'GB', 'companies_house', '05882311', 'BioHealth Pharmaceuticals Ltd', '[]', 'active', '["21200"]', '2006-07-21', '{"registered": "Science Way, Oxford, OX4 4GA", "country": "United Kingdom"}', NOW(), NOW());

-- 6. Source Associations & Documents
INSERT INTO maqe_source_associations (association_id, company_id, url, source_type, discovery_run_id, identity_signals, confidence, decision, reviewer, review_reason, created_at, updated_at) VALUES
('assoc_delta_01', 'demo_delta', 'https://deltametalworks.co.uk', 'official_website', 'disc_seed_01', '{"reg_no_match": true, "domain_match": true, "name_similarity": 0.98, "address_match": true}', 0.9900, 'approved', 'auto_rule_identity', 'Registration number 09482711 matched on footer', NOW(), NOW()),
('assoc_raw_metal_01', 'demo_raw_metal', 'https://apexsteel.co.uk', 'official_website', 'disc_seed_01', '{"reg_no_match": true, "domain_match": true, "name_similarity": 0.95}', 0.9800, 'approved', 'auto_rule_identity', 'Company registration matched', NOW(), NOW()),
('assoc_equipment_01', 'demo_equipment', 'https://precisionpress.co.uk', 'official_website', 'disc_seed_01', '{"reg_no_match": true, "domain_match": true}', 0.9700, 'approved', 'auto_rule_identity', 'Verified company domain', NOW(), NOW()),
('assoc_logistics_01', 'demo_logistics', 'https://titanfreight.co.uk', 'official_website', 'disc_seed_01', '{"reg_no_match": true, "domain_match": true}', 0.9600, 'approved', 'auto_rule_identity', 'Verified transport listing', NOW(), NOW()),
('assoc_enclosures_01', 'demo_enclosures', 'https://apex-enclosures.co.uk', 'official_website', 'disc_seed_01', '{"reg_no_match": true, "domain_match": true}', 0.9800, 'approved', 'auto_rule_identity', 'Verified OEM manufacturer', NOW(), NOW()),
('assoc_components_01', 'demo_components', 'https://vanguardautocomponents.co.uk', 'official_website', 'disc_seed_01', '{"reg_no_match": true, "domain_match": true}', 0.9600, 'approved', 'auto_rule_identity', 'Automotive Tier-1 supplier verified', NOW(), NOW()),
('assoc_assembly_01', 'demo_assembly_weak', 'https://quantumrobotics.co.uk', 'official_website', 'disc_seed_01', '{"reg_no_match": true, "domain_match": true}', 0.9200, 'approved', 'auto_rule_identity', 'Robotics vendor verified', NOW(), NOW());

INSERT INTO maqe_source_documents (document_id, association_id, canonical_url, fetched_at, content_hash, media_type, language, retrieval_status, body_ref, document_title, extracted_text) VALUES
('doc_delta_01', 'assoc_delta_01', 'https://deltametalworks.co.uk/services', NOW(), 'sha256_delta_body_01', 'text/html', 'en', 'success', 's3://maqe-documents/demo_delta/services.html', 'Delta Metalworks - Precision Sheet Metal Fabrication', 'Delta Metalworks is a leading UK precision sheet metal fabricator based in Sheffield. We operate high-speed 10kW fiber laser cutters capable of profiling up to 25mm mild steel, 20mm stainless steel 304/316, and 15mm aluminium 5083/6082. Our fabrication capabilities include multi-axis CNC press brake bending (up to 320 tonnes), automated robotic welding cells (MIG/TIG), and mechanical assembly. We serve electronics enclosure manufacturers, automotive assembly lines, and industrial machinery builders. We require consistent mill-certified cold-rolled steel coils, stainless sheet, and aluminium plate.'),
('doc_enclosures_01', 'assoc_enclosures_01', 'https://apex-enclosures.co.uk/about', NOW(), 'sha256_enc_body_01', 'text/html', 'en', 'success', 's3://maqe-documents/demo_enclosures/about.html', 'Apex Enclosures - Server Racks & Industrial Cabinets', 'Apex Enclosures designs and builds high-specification electrical cabinets, data center server racks, and weatherproof outdoor enclosures. Our assembly facilities require high volumes of precision-cut sheet metal panels, punched mounting plates, and powder-coated steel enclosures.');

-- 7. Assertions (Observed vs Inferred with Evidence Spans)
INSERT INTO maqe_assertions (assertion_id, company_id, subject, field, typed_value, basis, supporting_assertion_ids, evidence_refs, confidence, rationale, model_run_id, validity_status, created_at) VALUES
('ast_delta_01', 'demo_delta', 'offering', 'provides', '{"concept_id": "sheet_metal_supply", "label": "Precision Sheet Metal Supply", "materials": ["mild_steel", "stainless_steel_304", "aluminium_5083"], "max_thickness_mm": 25}', 'observed', NULL, '[{"document_id": "doc_delta_01", "span": "high-speed 10kW fiber laser cutters capable of profiling up to 25mm mild steel"}]', 0.9800, 'Direct statement on website services page', 'model_run_v1', 'valid', NOW()),
('ast_delta_02', 'demo_delta', 'offering', 'provides', '{"concept_id": "precision_fabrication", "label": "CNC Press Brake & Robotic Welding", "processes": ["laser_cutting", "press_brake_forming", "mig_tig_welding"]}', 'observed', NULL, '[{"document_id": "doc_delta_01", "span": "multi-axis CNC press brake bending (up to 320 tonnes), automated robotic welding cells"}]', 0.9500, 'Observed tooling descriptions', 'model_run_v1', 'valid', NOW()),
('ast_delta_03', 'demo_delta', 'requirement', 'likely_needs', '{"concept_id": "raw_metal", "label": "Steel & Aluminium Mill Plate / Coil", "forms": ["coil", "sheet", "plate"]}', 'inferred', '["ast_delta_01"]', '[{"document_id": "doc_delta_01", "span": "require consistent mill-certified cold-rolled steel coils, stainless sheet"}]', 0.9500, 'Raw material requirement logically inferred from sheet metal fabrication activity', 'model_run_v1', 'valid', NOW()),
('ast_delta_04', 'demo_delta', 'requirement', 'likely_needs', '{"concept_id": "metalworking_equipment", "label": "Metalworking Presses & CNC Tooling"}', 'inferred', '["ast_delta_02"]', '[]', 0.8800, 'Fabrication plant requires periodic machinery tooling, laser consumables, and press maintenance', 'model_run_v1', 'valid', NOW()),
('ast_delta_05', 'demo_delta', 'requirement', 'likely_needs', '{"concept_id": "logistics_freight", "label": "Heavy Industrial Flatbed Haulage"}', 'inferred', '["ast_delta_01"]', '[]', 0.8500, 'Delivery of heavy raw steel sheets and outbound customer components requires freight transport', 'model_run_v1', 'valid', NOW());

-- 8. Published Profile Versions
INSERT INTO maqe_profile_versions (profile_version_id, company_id, schema_version, source_bundle_version, taxonomy_version, published_at, provides, uses, serves, likely_needs, relationships, quality_indicators, is_current) VALUES
('pv_delta_v1', 'demo_delta', '1.0', 'sb_delta_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "sheet_metal_supply", "label": "Precision Sheet Metal Supply", "basis": "observed", "confidence": 0.98}, {"concept_id": "precision_fabrication", "label": "CNC Bending & Welding", "basis": "observed", "confidence": 0.95}]',
 '[]',
 '["parts_manufacturing", "assembly_manufacturing", "enclosure_manufacturing", "automotive_tier2"]',
 '[{"concept_id": "raw_metal", "label": "Steel Coil & Aluminium Sheet", "basis": "inferred", "confidence": 0.95}, {"concept_id": "metalworking_equipment", "label": "Presses & Tooling", "basis": "inferred", "confidence": 0.88}, {"concept_id": "logistics_freight", "label": "Heavy Transport", "basis": "inferred", "confidence": 0.85}]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.94, "freshness_days": 1}', 1),

('pv_raw_metal_v1', 'demo_raw_metal', '1.0', 'sb_raw_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "raw_metal", "label": "Primary Steel Coil & Non-Ferrous Alloys", "basis": "observed", "confidence": 0.98}]',
 '["iron_ore", "scrap_metal", "foundry_furnaces"]',
 '["metal_fabricators", "sheet_metal_manufacturers", "automotive_tier1"]',
 '["freight_logistics", "foundry_consumables"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.92}', 1),

('pv_equipment_v1', 'demo_equipment', '1.0', 'sb_eq_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "metalworking_equipment", "label": "CNC Hydraulic Press Brakes & Laser Consumables", "basis": "observed", "confidence": 0.96}]',
 '["hydraulics", "electronics", "steel_castings"]',
 '["sheet_metal_manufacturers", "aerospace_fabricators"]',
 '["precision_linear_guides"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.90}', 1),

('pv_logistics_v1', 'demo_logistics', '1.0', 'sb_log_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "logistics_freight", "label": "Heavy Flatbed Industrial Haulage", "basis": "observed", "confidence": 0.95}]',
 '["commercial_vehicles", "diesel_fuel"]',
 '["steel_mills", "metal_fabricators", "heavy_equipment"]',
 '["fleet_telematics", "commercial_tyres"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.88}', 1),

('pv_enclosures_v1', 'demo_enclosures', '1.0', 'sb_enc_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "electrical_enclosures", "label": "Server Racks & Control Cabinets", "basis": "observed", "confidence": 0.97}]',
 '["sheet_metal_supply", "powder_coatings", "terminal_blocks"]',
 '["data_centers", "industrial_automation", "utilities"]',
 '["sheet_metal_supply", "fasteners"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.93}', 1),

('pv_components_v1', 'demo_components', '1.0', 'sb_comp_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "automotive_brackets", "label": "Stamped Automotive Brackets & Assemblies", "basis": "observed", "confidence": 0.95}]',
 '["sheet_metal_supply", "fasteners"]',
 '["oem_automotive", "tier1_integrators"]',
 '["sheet_metal_supply", "tooling_steel"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.89}', 1),

('pv_assembly_v1', 'demo_assembly_weak', '1.0', 'sb_asm_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "robotic_arms", "label": "Collaborative Robotic Cells", "basis": "observed", "confidence": 0.92}]',
 '["servomotors", "aluminium_extrusions", "sheet_metal_supply"]',
 '["advanced_manufacturing", "pharmaceutical_packaging"]',
 '["sensors", "precision_gearboxes"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.75}', 1),

('pv_competitor_v1', 'demo_competitor', '1.0', 'sb_comp_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "sheet_metal_supply", "label": "Laser Cut & Formed Sheet Steel", "basis": "observed", "confidence": 0.96}]',
 '["raw_metal"]',
 '["general_engineering", "construction"]',
 '["raw_metal"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.88}', 1),

('pv_unrelated_v1', 'demo_unrelated', '1.0', 'sb_pharma_01', 'engineering_demo_v1', NOW(),
 '[{"concept_id": "pharmaceutical_formulation", "label": "Oral Solid Dosage & Injectables", "basis": "observed", "confidence": 0.99}]',
 '["active_pharmaceutical_ingredients", "sterilization_gases"]',
 '["hospitals", "pharmacies"]',
 '["cleanroom_consumables"]',
 '[]',
 '{"matchable": true, "review_status": "accepted", "coverage": 0.95}', 1);

-- 9. Match Edges & Scored Assessments
-- Focus: Delta Metalworks Ltd (demo_delta)

-- Edge 1: Delta <-> Apex Steel (Supplier Match)
INSERT INTO maqe_match_edges (edge_id, focus_company_id, counterparty_company_id, relation_family, supported_direction_views, current_state, updated_at) VALUES
('edge_delta_raw_metal', 'demo_delta', 'demo_raw_metal', 'material_supply', '["supplier"]', 'fresh', NOW());

INSERT INTO maqe_match_assessments (assessment_id, edge_id, direction, score, score_components, coverage, explanation, supporting_assertions, algorithm_version, evaluated_at) VALUES
('asmt_delta_raw_metal_sup', 'edge_delta_raw_metal', 'supplier', 94,
 '{"compatibility": 1.00, "sector": 0.95, "geography": 0.90, "evidence": 0.92}', 0.9400,
 'Apex Steel & Alloys provides mill-certified steel coil and aluminium plate, satisfying Delta Metalworks inferred raw material requirement with 98% capability alignment.',
 '["ast_delta_03"]', 'rules_v1', NOW());

-- Edge 2: Delta <-> Precision Press & Tooling (Supplier Match)
INSERT INTO maqe_match_edges (edge_id, focus_company_id, counterparty_company_id, relation_family, supported_direction_views, current_state, updated_at) VALUES
('edge_delta_equipment', 'demo_delta', 'demo_equipment', 'equipment_tooling', '["supplier"]', 'fresh', NOW());

INSERT INTO maqe_match_assessments (assessment_id, edge_id, direction, score, score_components, coverage, explanation, supporting_assertions, algorithm_version, evaluated_at) VALUES
('asmt_delta_equipment_sup', 'edge_delta_equipment', 'supplier', 88,
 '{"compatibility": 0.90, "sector": 0.90, "geography": 0.85, "evidence": 0.87}', 0.9000,
 'Precision Press & Tooling manufactures CNC press brake tooling and hydraulic machine components, aligning directly with Delta Metalworks machinery maintenance and tooling needs.',
 '["ast_delta_04"]', 'rules_v1', NOW());

-- Edge 3: Delta <-> Titan Freight (Supplier Match)
INSERT INTO maqe_match_edges (edge_id, focus_company_id, counterparty_company_id, relation_family, supported_direction_views, current_state, updated_at) VALUES
('edge_delta_logistics', 'demo_delta', 'demo_logistics', 'freight_transport', '["supplier"]', 'fresh', NOW());

INSERT INTO maqe_match_assessments (assessment_id, edge_id, direction, score, score_components, coverage, explanation, supporting_assertions, algorithm_version, evaluated_at) VALUES
('asmt_delta_logistics_sup', 'edge_delta_logistics', 'supplier', 84,
 '{"compatibility": 0.85, "sector": 0.85, "geography": 0.90, "evidence": 0.82}', 0.8800,
 'Titan Freight operates flatbed articulated fleet transport suitable for regional palletized metal delivery and mill coil logistics.',
 '["ast_delta_05"]', 'rules_v1', NOW());

-- Edge 4: Delta <-> Apex Enclosures (Customer Lead)
INSERT INTO maqe_match_edges (edge_id, focus_company_id, counterparty_company_id, relation_family, supported_direction_views, current_state, updated_at) VALUES
('edge_delta_enclosures', 'demo_delta', 'demo_enclosures', 'component_purchaser', '["customer"]', 'fresh', NOW());

INSERT INTO maqe_match_assessments (assessment_id, edge_id, direction, score, score_components, coverage, explanation, supporting_assertions, algorithm_version, evaluated_at) VALUES
('asmt_delta_enclosures_cust', 'edge_delta_enclosures', 'customer', 92,
 '{"compatibility": 1.00, "sector": 0.90, "geography": 0.85, "evidence": 0.90}', 0.9300,
 'Apex Enclosures actively fabricates electronic enclosures and server cabinets requiring custom laser-cut sheet steel, matching Delta Metalworks primary fabrication offerings.',
 '["ast_delta_01", "ast_delta_02"]', 'rules_v1', NOW());

-- Edge 5: Delta <-> Vanguard Auto Components (Customer Lead)
INSERT INTO maqe_match_edges (edge_id, focus_company_id, counterparty_company_id, relation_family, supported_direction_views, current_state, updated_at) VALUES
('edge_delta_components', 'demo_delta', 'demo_components', 'automotive_subcontract', '["customer"]', 'fresh', NOW());

INSERT INTO maqe_match_assessments (assessment_id, edge_id, direction, score, score_components, coverage, explanation, supporting_assertions, algorithm_version, evaluated_at) VALUES
('asmt_delta_components_cust', 'edge_delta_components', 'customer', 86,
 '{"compatibility": 0.90, "sector": 0.88, "geography": 0.80, "evidence": 0.85}', 0.8900,
 'Vanguard Auto Components produces stamped brackets and vehicle subassemblies using laser-cut blanks, presenting high-volume repeat contract potential.',
 '["ast_delta_01"]', 'rules_v1', NOW());

-- Edge 6: Delta <-> Quantum Robotics (Customer Lead - Moderate Evidence)
INSERT INTO maqe_match_edges (edge_id, focus_company_id, counterparty_company_id, relation_family, supported_direction_views, current_state, updated_at) VALUES
('edge_delta_assembly', 'demo_delta', 'demo_assembly_weak', 'robotics_integration', '["customer"]', 'fresh', NOW());

INSERT INTO maqe_match_assessments (assessment_id, edge_id, direction, score, score_components, coverage, explanation, supporting_assertions, algorithm_version, evaluated_at) VALUES
('asmt_delta_assembly_cust', 'edge_delta_assembly', 'customer', 58,
 '{"compatibility": 0.60, "sector": 0.60, "geography": 0.65, "evidence": 0.50}', 0.7500,
 'Quantum Robotics builds automation cells. Evidence shows partial sheet metal casing use alongside extruded aluminium; lower confidence prospective opportunity.',
 '["ast_delta_01"]', 'rules_v1', NOW());
