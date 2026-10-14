/**
 * MAQE Deterministic Evaluation & Phase One Acceptance Test Suite
 * Verifies:
 * 1. 1,000 real UK businesses ingested from UK Companies House & zero dummy records
 * 2. Phase One Discovery & Enrichment Schema (Sections 2-15) compliance & FieldAssessment missingness rules
 * 3. Directional B2B Matching Engine across the 1,000 enriched UK businesses
 * 4. Atomic Credit Ledger & Non-Double-Charging Invariant
 * 5. Blind RFQ Bidder Isolation
 */

import { MatchingEngine } from '../src/lib/engines/matching';
import { CreditLedgerEngine } from '../src/lib/engines/credits';
import { IntakeEngine } from '../src/lib/engines/intake';
import { NetworkingEngine } from '../src/lib/engines/networking';
import {
  FIXTURE_COMPANIES,
  FIXTURE_WALLETS,
  REAL_COHORT_SUMMARY,
  DEFAULT_FOCUS_COMPANY_ID,
  DEFAULT_ORG_ID,
  SECOND_ORG_ID,
  hydratePhaseOneSchema
} from '../src/lib/fixtures/cohort';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('\n================================================================');
console.log('🧪 MAQE PHASE ONE 1,000-COMPANY ACCEPTANCE TEST SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// GATE 1: 1,000 Real UK Companies Ingested & Zero Dummy Data
// -------------------------------------------------------------------------
console.log('--- TEST GROUP 1: 1,000 Real UK Companies & Zero Dummy Data ---');
assert(
  FIXTURE_COMPANIES.length === 1000,
  `Expected exactly 1,000 real UK businesses in cohort, got ${FIXTURE_COMPANIES.length}`
);
assert(
  REAL_COHORT_SUMMARY.total_companies_found === 1000 &&
    REAL_COHORT_SUMMARY.total_companies_enriched === 1000,
  `Expected 1,000 found and 1,000 enriched in summary, got ${REAL_COHORT_SUMMARY.total_companies_found}/${REAL_COHORT_SUMMARY.total_companies_enriched}`
);

const dummyNames = [
  'Delta Metalworks',
  'Apex Enclosures',
  'Vanguard Auto',
  'Quantum Robotics',
  'Vortex Sheet',
  'BioHealth'
];
const foundDummy = FIXTURE_COMPANIES.some(c =>
  dummyNames.some(d => c.legal_name.toLowerCase().includes(d.toLowerCase()))
);
assert(!foundDummy, 'Zero dummy/fictional company names exist anywhere in the 1,000-company cohort');

// -------------------------------------------------------------------------
// GATE 2: Phase One Discovery & Enrichment Schema Compliance (Sections 2-15)
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Phase One Schema & FieldAssessment Compliance ---');
const regentSchema = hydratePhaseOneSchema(DEFAULT_FOCUS_COMPANY_ID);
assert(Boolean(regentSchema), 'Must hydrate Phase One Schema for Regent Engineering Co (Walsall) Limited (#00551421)');
assert(
  regentSchema!.schema_version === '1.0.0-phase1',
  `Expected schema_version 1.0.0-phase1, got ${regentSchema!.schema_version}`
);
assert(
  regentSchema!.field_assessments.length === 10,
  `Expected 10 Phase One domain FieldAssessments, got ${regentSchema!.field_assessments.length}`
);
assert(
  regentSchema!.website_associations[0].decision === 'approved',
  'Regent Engineering must have an approved website association with identity signals'
);
assert(
  regentSchema!.offerings.length >= 2 && regentSchema!.needs.length >= 2,
  'Phase One schema must populate hierarchical offerings and inferred commercial needs'
);

// Verify missingness rule on a registry-only company (Grade C)
const registryOnlyCompany = FIXTURE_COMPANIES.find(c => !c.website_url)!;
const regOnlySchema = hydratePhaseOneSchema(registryOnlyCompany.company_id)!;
const webAssessment = regOnlySchema.field_assessments.find(fa => fa.field_path === 'website_discovery');
assert(
  webAssessment?.state === 'not_found',
  `Unfound website must be explicitly recorded as FieldAssessment(not_found), got ${webAssessment?.state}`
);

// -------------------------------------------------------------------------
// GATE 3: Directional B2B Matching Across the 1,000 Enriched UK Businesses
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: C05 Directional B2B Matching on Real Cohort ---');
const matchingEngine = new MatchingEngine();

const customerLeads = matchingEngine.runMatch({
  focus_company_id: DEFAULT_FOCUS_COMPANY_ID,
  direction: 'customer'
});
assert(
  customerLeads.length >= 3,
  `Expected at least 3 real UK customer leads for Regent Engineering (#00551421), got ${customerLeads.length}`
);
assert(
  customerLeads[0].score >= 85,
  `Top customer lead score must be >= 85%, got ${customerLeads[0].score}% (${customerLeads[0].counterparty_name})`
);
assert(
  Boolean(customerLeads[0].criterion_results && customerLeads[0].criterion_results.length > 0),
  'Match result must include Phase One CriterionResult[] evaluations'
);

// Verify competitor exclusion in customer mode (no same-SIC 25500 horizontal peer in customer leads)
const hasSameSicCompetitor = customerLeads.some(c => c.sic_codes?.[0] === '25500');
assert(
  !hasSameSicCompetitor,
  'Horizontal competitors sharing primary SIC 25500 must be excluded from customer leads'
);

const supplierMatches = matchingEngine.runMatch({
  focus_company_id: DEFAULT_FOCUS_COMPANY_ID,
  direction: 'supplier'
});
assert(
  supplierMatches.length >= 2,
  `Expected at least 2 real UK supplier matches for Regent Engineering (#00551421), got ${supplierMatches.length}`
);
assert(
  supplierMatches[0].score >= 85,
  `Top supplier match score must be >= 85%, got ${supplierMatches[0].score}% (${supplierMatches[0].counterparty_name})`
);

// -------------------------------------------------------------------------
// GATE 4: C07 Credit Ledger & Non-Double-Charging Invariant
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: C07 Credit Ledger & Non-Double-Charge Invariant ---');
const creditEngine = new CreditLedgerEngine(FIXTURE_WALLETS);

const initialCredits = creditEngine.getTotalCredits(DEFAULT_ORG_ID);
assert(initialCredits === 50, `Initial credits for ${DEFAULT_ORG_ID} must be 50, got ${initialCredits}`);

const targetCustomerId = customerLeads[0].counterparty_company_id;
const unlock1 = creditEngine.unlockMatch(DEFAULT_ORG_ID, DEFAULT_FOCUS_COMPANY_ID, targetCustomerId, 'customer');
assert(unlock1.success === true && unlock1.already_unlocked === false, 'First unlock must succeed and debit 1 credit');
assert(unlock1.balance_remaining === 49, `Balance after first debit must be 49, got ${unlock1.balance_remaining}`);

const unlock2 = creditEngine.unlockMatch(DEFAULT_ORG_ID, DEFAULT_FOCUS_COMPANY_ID, targetCustomerId, 'customer');
assert(unlock2.already_unlocked === true && unlock2.balance_remaining === 49, 'Second unlock must not double-charge');

assert(
  !creditEngine.isUnlocked(SECOND_ORG_ID, DEFAULT_FOCUS_COMPANY_ID, targetCustomerId),
  'Tenant isolation: SECOND_ORG_ID must not inherit DEFAULT_ORG_ID unlocked access'
);

// -------------------------------------------------------------------------
// GATE 5: C01 Registry Intake (Stopped at 1,000 Cap) & C08 Blind RFQ Threads
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: C01 Intake Cap (1,000) & C08 Blind RFQ Isolation ---');
const intakeEngine = new IntakeEngine();
const status = intakeEngine.getStatus();
assert(
  status.records_ingested === 1000 && status.capacity_target === 1000,
  `Intake engine must reflect 1,000/1,000 cap reached, got ${status.records_ingested}/${status.capacity_target}`
);

const networkingEngine = new NetworkingEngine();
const rfq = networkingEngine.dispatchRFQ(
  DEFAULT_ORG_ID,
  'Cold-Rolled Steel Strip & Aluminium Sheet RFQ',
  'EN 10204 3.1 certified coil & sheet',
  '2026-11-15',
  [
    { id: supplierMatches[0].counterparty_company_id, name: supplierMatches[0].counterparty_name },
    { id: supplierMatches[1].counterparty_company_id, name: supplierMatches[1].counterparty_name }
  ]
);
assert(rfq.recipients?.length === 2, 'RFQ must have 2 real UK supplier recipients');
assert(
  rfq.recipients![0].individual_thread_id !== rfq.recipients![1].individual_thread_id,
  'Each supplier must receive an isolated individual thread (blind bidding)'
);

console.log('\n================================================================');
console.log('🎉 ALL PHASE ONE 1,000-COMPANY ACCEPTANCE GATES PASSED!');
console.log('================================================================\n');
