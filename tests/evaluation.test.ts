/**
 * MAQE Deterministic Evaluation & Acceptance Test Suite
 * Verifies Section 17, 18, and 18A gates from Technical Build Addendum v1.1
 */

import { MatchingEngine } from '../src/lib/engines/matching';
import { CreditLedgerEngine } from '../src/lib/engines/credits';
import { IntakeEngine } from '../src/lib/engines/intake';
import { DiscoveryEngine } from '../src/lib/engines/discovery';
import { EnrichmentEngine } from '../src/lib/engines/enrichment';
import { ClassificationEngine } from '../src/lib/engines/classification';
import { NetworkingEngine } from '../src/lib/engines/networking';
import {
  FIXTURE_COMPANIES,
  FIXTURE_PROFILES,
  FIXTURE_ASSERTIONS,
  FIXTURE_WALLETS,
  FIXTURE_ORGANISATIONS
} from '../src/lib/fixtures/cohort';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('\n======================================================');
console.log('🧪 MAQE AUTOMATED ACCEPTANCE TEST SUITE (v1.1)');
console.log('======================================================\n');

// -------------------------------------------------------------------------
// GATE 1: C05 Delta Metalworks Matching Benchmark (Customer Direction)
// -------------------------------------------------------------------------
console.log('--- TEST GROUP 1: C05 Directional Matching (Customer Leads) ---');
const matchingEngine = new MatchingEngine();

const customerLeads = matchingEngine.runMatch({
  focus_company_id: 'demo_delta',
  direction: 'customer'
});

assert(customerLeads.length >= 3, `Expected at least 3 customer leads, got ${customerLeads.length}`);
assert(customerLeads[0].counterparty_company_id === 'demo_enclosures', `Rank #1 must be demo_enclosures, got ${customerLeads[0].counterparty_company_id}`);
assert(customerLeads[0].score >= 90, `demo_enclosures score must be >= 90%, got ${customerLeads[0].score}%`);
assert(customerLeads[1].counterparty_company_id === 'demo_components', `Rank #2 must be demo_components, got ${customerLeads[1].counterparty_company_id}`);
assert(customerLeads[2].counterparty_company_id === 'demo_assembly_weak', `Rank #3 must be demo_assembly_weak, got ${customerLeads[2].counterparty_company_id}`);

// Verify competitor exclusion
const hasCompetitor = customerLeads.some(c => c.counterparty_company_id === 'demo_competitor');
assert(!hasCompetitor, 'Direct competitor (demo_competitor - Vortex Sheet Metal) must be strictly excluded from customer leads');

// Verify negative control exclusion
const hasPharma = customerLeads.some(c => c.counterparty_company_id === 'demo_unrelated');
assert(!hasPharma, 'Unrelated negative control (demo_unrelated - BioHealth Pharma) must be strictly excluded');

// -------------------------------------------------------------------------
// GATE 2: C05 Delta Metalworks Matching Benchmark (Supplier Direction)
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: C05 Directional Matching (Supplier Matches) ---');
const supplierMatches = matchingEngine.runMatch({
  focus_company_id: 'demo_delta',
  direction: 'supplier'
});

assert(supplierMatches.length >= 3, `Expected at least 3 supplier matches, got ${supplierMatches.length}`);
assert(supplierMatches[0].counterparty_company_id === 'demo_raw_metal', `Supplier Rank #1 must be demo_raw_metal, got ${supplierMatches[0].counterparty_company_id}`);
assert(supplierMatches[0].score >= 92, `demo_raw_metal score must be >= 92%, got ${supplierMatches[0].score}%`);
assert(supplierMatches[1].counterparty_company_id === 'demo_equipment', `Supplier Rank #2 must be demo_equipment, got ${supplierMatches[1].counterparty_company_id}`);
assert(supplierMatches[2].counterparty_company_id === 'demo_logistics', `Supplier Rank #3 must be demo_logistics, got ${supplierMatches[2].counterparty_company_id}`);

// -------------------------------------------------------------------------
// GATE 3: C07 Credit Ledger & Non-Double-Charging Invariant
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: C07 Credit Ledger & Non-Double-Charge Invariant ---');
const creditEngine = new CreditLedgerEngine(FIXTURE_WALLETS);

const initialCredits = creditEngine.getTotalCredits('org_delta');
assert(initialCredits === 50, `Initial credits for org_delta must be 50, got ${initialCredits}`);

// First unlock of demo_enclosures
const unlock1 = creditEngine.unlockMatch('org_delta', 'demo_delta', 'demo_enclosures', 'customer');
assert(unlock1.success === true, 'First unlock must succeed');
assert(unlock1.already_unlocked === false, 'First unlock should not be previously unlocked');
assert(unlock1.balance_remaining === 49, `Balance after first debit must be 49, got ${unlock1.balance_remaining}`);

// Second unlock of the SAME company (Invariant: never double charge!)
const unlock2 = creditEngine.unlockMatch('org_delta', 'demo_delta', 'demo_enclosures', 'customer');
assert(unlock2.success === true, 'Second unlock must succeed');
assert(unlock2.already_unlocked === true, 'Second unlock must detect already_unlocked');
assert(unlock2.balance_remaining === 49, `Balance must remain 49 without secondary charge, got ${unlock2.balance_remaining}`);

// Reverse direction unlock for the SAME pair (never double charge across views!)
const unlock3 = creditEngine.unlockMatch('org_delta', 'demo_delta', 'demo_enclosures', 'supplier');
assert(unlock3.already_unlocked === true, 'Reverse direction must recognize existing access without double-charging');
assert(unlock3.balance_remaining === 49, 'Balance must still remain 49');

// Multi-tenant check: org_apex should NOT have access to org_delta unlocked candidate
assert(!creditEngine.isUnlocked('org_apex', 'demo_delta', 'demo_enclosures'), 'Tenant isolation: org_apex must not inherit org_delta unlocked access');

// -------------------------------------------------------------------------
// GATE 4: C01 Registry Intake & Partition Coordinator
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: C01 Registry Intake & Checkpoints ---');
const intakeEngine = new IntakeEngine();
const status = intakeEngine.getStatus();
assert(status.total_partitions > 0, 'Intake engine must initialize partition manifests');
assert(status.capacity_target === 600000, `Capacity target must be 600,000, got ${status.capacity_target}`);
assert(status.daily_sync_status === 'HEALTHY', 'Daily sync watermark state must be HEALTHY');

// Step a partition
const p1 = intakeEngine.getPartitions().find(p => p.status === 'pending')!;
const stepped = intakeEngine.stepPartition(p1.partition_id);
assert(stepped !== null && stepped.records_ingested > 0, 'Stepping partition must advance ingested record counter');

// -------------------------------------------------------------------------
// GATE 5: C08 Blind RFQ Bidder Isolation
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: C08 RFQ Procurement & Isolated Bidder Threads ---');
const networkingEngine = new NetworkingEngine();
const rfq = networkingEngine.dispatchRFQ(
  'org_delta',
  'Test RFQ',
  'Test spec description',
  '2026-11-01',
  [
    { id: 'demo_raw_metal', name: 'Apex Steel' },
    { id: 'demo_equipment', name: 'Precision Press' }
  ]
);

assert(rfq.recipients?.length === 2, 'RFQ must have 2 recipients');
const thread1 = rfq.recipients![0].individual_thread_id;
const thread2 = rfq.recipients![1].individual_thread_id;
assert(thread1 !== thread2, 'Each supplier must receive an isolated individual thread (blind bidding)');

console.log('\n======================================================');
console.log('🎉 ALL ACCEPTANCE GATES PASSED SUCCESSFULLY!');
console.log('======================================================\n');
