/**
 * C03 AI Enrichment Engine
 * Converts approved source documents into structured assertions,
 * maintaining clear boundaries between observed and inferred facts (Section 6).
 */

import { Assertion, EvidenceRef } from '../domain/types';
import { FIXTURE_ASSERTIONS } from '../fixtures/cohort';

export class EnrichmentEngine {
  private assertions: Map<string, Assertion>;

  constructor(customAssertions?: Assertion[]) {
    this.assertions = new Map();
    const list = customAssertions || FIXTURE_ASSERTIONS;
    for (const a of list) {
      this.assertions.set(a.assertion_id, { ...a });
    }
  }

  public getAssertions(company_id?: string): Assertion[] {
    const list = Array.from(this.assertions.values());
    if (company_id) {
      return list.filter(a => a.company_id === company_id);
    }
    return list;
  }

  public createAssertion(params: {
    company_id: string;
    subject: string;
    field: string;
    typed_value: Record<string, any>;
    basis: 'observed' | 'inferred';
    supporting_assertion_ids?: string[];
    evidence_refs: EvidenceRef[];
    confidence: number;
    rationale?: string;
  }): Assertion {
    const id = `ast_${params.company_id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const assertion: Assertion = {
      assertion_id: id,
      company_id: params.company_id,
      subject: params.subject,
      field: params.field,
      typed_value: params.typed_value,
      basis: params.basis,
      supporting_assertion_ids: params.supporting_assertion_ids,
      evidence_refs: params.evidence_refs,
      confidence: params.confidence,
      rationale: params.rationale,
      model_run_id: 'model_run_v1',
      validity_status: 'valid',
      created_at: new Date().toISOString()
    };
    this.assertions.set(id, assertion);
    return assertion;
  }
}
