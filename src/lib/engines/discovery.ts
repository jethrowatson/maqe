/**
 * C02 Discovery & Document Retrieval Engine
 * Scores online source associations, enforces identity decisions,
 * and maintains retrieved document content hashes (Section 5 & 5A).
 */

import {
  SourceAssociation,
  SourceDocument,
  IdentitySignals,
  DecisionState
} from '../domain/types';
import { FIXTURE_ASSOCIATIONS, FIXTURE_DOCUMENTS } from '../fixtures/cohort';

export class DiscoveryEngine {
  private associations: Map<string, SourceAssociation>;
  private documents: Map<string, SourceDocument>;

  constructor(
    customAssocs?: SourceAssociation[],
    customDocs?: SourceDocument[]
  ) {
    this.associations = new Map();
    const assocs = customAssocs || FIXTURE_ASSOCIATIONS;
    for (const a of assocs) {
      this.associations.set(a.association_id, { ...a });
    }

    this.documents = new Map();
    const docs = customDocs || FIXTURE_DOCUMENTS;
    for (const d of docs) {
      this.documents.set(d.document_id, { ...d });
    }
  }

  public getAssociations(company_id?: string): SourceAssociation[] {
    const list = Array.from(this.associations.values());
    if (company_id) {
      return list.filter(a => a.company_id === company_id);
    }
    return list;
  }

  public getDocuments(association_id?: string): SourceDocument[] {
    const list = Array.from(this.documents.values());
    if (association_id) {
      return list.filter(d => d.association_id === association_id);
    }
    return list;
  }

  public scoreCandidate(
    company_name: string,
    target_url: string,
    signals: Partial<IdentitySignals>
  ): { confidence: number; decision: DecisionState; rationale: string } {
    let score = 0;
    const notes: string[] = [];

    if (signals.reg_no_match) {
      score += 0.50;
      notes.push('Companies House registration number verified in footer');
    }
    if (signals.domain_match) {
      score += 0.30;
      notes.push('Domain slug strongly correlates with legal name');
    }
    if (signals.name_similarity && signals.name_similarity > 0.8) {
      score += signals.name_similarity * 0.15;
      notes.push(`High name similarity score (${Math.round(signals.name_similarity * 100)}%)`);
    }
    if (signals.address_match) {
      score += 0.10;
      notes.push('Registered office address verified on contact page');
    }

    const confidence = Math.min(1.0, Number(score.toFixed(2)));
    const decision: DecisionState = confidence >= 0.85 ? 'approved' : confidence >= 0.5 ? 'pending' : 'rejected';

    return {
      confidence,
      decision,
      rationale: notes.join('; ')
    };
  }

  public updateDecision(
    association_id: string,
    decision: DecisionState,
    reviewer: string,
    reason: string
  ): SourceAssociation | null {
    const assoc = this.associations.get(association_id);
    if (!assoc) return null;

    assoc.decision = decision;
    assoc.reviewer = reviewer;
    assoc.review_reason = reason;
    assoc.updated_at = new Date().toISOString();
    return { ...assoc };
  }
}
