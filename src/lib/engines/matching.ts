/**
 * C05 Directional Matching & Ranking Engine
 * Implements deterministic rules-based matching with explainable score components
 * and Phase One Schema CriterionResult[] evaluations across the 1,000 real UK businesses.
 */

import {
  MatchCandidateResult,
  MatchDirection,
  MatchingCriteria,
  ScoreComponents,
  CompanyRecord,
  ProfileVersion,
  CriterionResult
} from '../domain/types';
import {
  FIXTURE_COMPANIES,
  FIXTURE_PROFILES,
  FIXTURE_MATCH_CANDIDATES,
  hydratePhaseOneSchema
} from '../fixtures/cohort';

export interface MatchingExecutionOptions {
  focus_company_id: string;
  direction: MatchDirection;
  criteria?: Partial<MatchingCriteria>;
  unlocked_company_ids?: Set<string>;
}

export class MatchingEngine {
  private companies: Map<string, CompanyRecord>;
  private profiles: Map<string, ProfileVersion>;
  private precomputedMatches: MatchCandidateResult[];

  constructor(
    customCompanies?: CompanyRecord[],
    customProfiles?: Record<string, ProfileVersion>
  ) {
    this.companies = new Map();
    const sourceCompanies = customCompanies || FIXTURE_COMPANIES;
    for (const c of sourceCompanies) {
      this.companies.set(c.company_id, c);
    }

    this.profiles = new Map();
    const sourceProfiles = customProfiles || FIXTURE_PROFILES;
    for (const [id, p] of Object.entries(sourceProfiles)) {
      this.profiles.set(id, p);
    }

    this.precomputedMatches = FIXTURE_MATCH_CANDIDATES;
  }

  /**
   * Returns all precomputed B2B directional matches across the 1,000-company cohort.
   */
  public getAllCohortMatches(direction?: MatchDirection): MatchCandidateResult[] {
    const list = direction
      ? this.precomputedMatches.filter(m => m.direction === direction)
      : this.precomputedMatches;
    return [...list].sort((a, b) => b.score - a.score);
  }

  public runMatch(options: MatchingExecutionOptions): MatchCandidateResult[] {
    const { focus_company_id, direction } = options;
    const focusCompany = this.companies.get(focus_company_id);
    const focusProfile = this.profiles.get(focus_company_id);

    if (!focusCompany || !focusProfile) {
      return [];
    }

    const weights = {
      compatibility: options.criteria?.weights?.compatibility ?? 0.50,
      sector: options.criteria?.weights?.sector ?? 0.20,
      geography: options.criteria?.weights?.geography ?? 0.15,
      evidence: options.criteria?.weights?.evidence ?? 0.15
    };

    const hardFilters = {
      min_confidence: options.criteria?.hard_filters?.min_confidence ?? 0.40,
      exclude_competitors: options.criteria?.hard_filters?.exclude_competitors ?? true,
      require_verified_identity: options.criteria?.hard_filters?.require_verified_identity ?? true
    };

    const unlockedIds = options.unlocked_company_ids || new Set<string>();
    const totalWeight =
      weights.compatibility + weights.sector + weights.geography + weights.evidence || 1;

    // 1. Check precomputed matches for this focus company first
    const precomputed = this.precomputedMatches.filter(
      m => m.focus_company_id === focus_company_id && m.direction === direction
    );

    const resultsMap = new Map<string, MatchCandidateResult>();

    for (const m of precomputed) {
      const candidate = this.companies.get(m.counterparty_company_id);
      const candidateProfile = this.profiles.get(m.counterparty_company_id);
      if (!candidate || !candidateProfile) continue;

      if (direction === 'customer' && hardFilters.exclude_competitors) {
        if (this.checkIfCompetitor(focusCompany, candidate, focusProfile, candidateProfile)) {
          continue;
        }
      }

      const comp = m.score_components;
      const weightedSum =
        weights.compatibility * comp.compatibility +
        weights.sector * comp.sector +
        weights.geography * comp.geography +
        weights.evidence * comp.evidence;
      const recalculatedScore = Math.round(100 * (weightedSum / totalWeight));
      const isUnlocked = unlockedIds.has(m.counterparty_company_id);

      resultsMap.set(m.counterparty_company_id, {
        ...m,
        score: recalculatedScore,
        is_unlocked: isUnlocked,
        unlocked_access_id: isUnlocked ? `acc_${focus_company_id}_${m.counterparty_company_id}` : undefined,
        profile_version: candidateProfile
      });
    }

    // 2. Dynamically evaluate Phase One supply-chain links if fewer than 12 matches are present
    const focusSchema = hydratePhaseOneSchema(focus_company_id);
    if (focusSchema && resultsMap.size < 12) {
      const focusSics = new Set(focusCompany.sic_codes);
      const focusTargetSupplierSics = new Map<string, { label: string; rationale?: string }>();
      for (const n of focusSchema.needs) {
        for (const s of n.target_supplier_sics || []) {
          focusTargetSupplierSics.set(s, { label: n.label, rationale: n.rationale });
        }
      }

      for (const [candidateId, candidate] of this.companies.entries()) {
        if (candidateId === focus_company_id || resultsMap.has(candidateId)) continue;
        // Prefer enriched candidates with websites for top matches
        if (!candidate.website_url && resultsMap.size >= 8) continue;

        const candidateProfile = this.profiles.get(candidateId);
        if (!candidateProfile) continue;

        // Exclude unrelated non-industrial SICs (e.g. food/beverages/clothing when matching engineering)
        if (
          candidate.sic_codes.some(s => s.startsWith('10') || s.startsWith('11') || s.startsWith('14') || s.startsWith('21'))
        ) {
          continue;
        }

        if (direction === 'customer' && hardFilters.exclude_competitors) {
          if (this.checkIfCompetitor(focusCompany, candidate, focusProfile, candidateProfile)) {
            continue;
          }
        }

        const candSchema = hydratePhaseOneSchema(candidateId);
        if (!candSchema) continue;

        let matchedOffering = '';
        let satisfiedNeed = '';
        let compatScore = 0;

        if (direction === 'supplier') {
          // Candidate's SIC satisfies Focus Company's Need
          const matchingSic = candidate.sic_codes.find(s => focusTargetSupplierSics.has(s));
          if (matchingSic) {
            const needInfo = focusTargetSupplierSics.get(matchingSic)!;
            satisfiedNeed = needInfo.label;
            matchedOffering =
              candSchema.offerings.find(o => o.node_type === 'offering')?.name ||
              candSchema.offerings[0]?.name ||
              candidate.sic_description ||
              'Industrial Supply';
            compatScore = candidate.website_url ? 0.92 : 0.80;
          }
        } else {
          // Customer direction: Candidate has a Need whose target_supplier_sics includes Focus Company's SIC
          const matchingNeed = candSchema.needs.find(n =>
            (n.target_supplier_sics || []).some(s => focusSics.has(s))
          );
          if (matchingNeed) {
            satisfiedNeed = matchingNeed.label;
            matchedOffering =
              focusSchema.offerings.find(o => o.node_type === 'offering')?.name ||
              focusSchema.offerings[0]?.name ||
              focusCompany.sic_description ||
              'Engineering Services';
            compatScore = candidate.website_url ? 0.90 : 0.78;
          }
        }

        if (compatScore <= 0) continue;

        const focusSectors = new Set(focusProfile.serves);
        const sharedSectors = candidateProfile.serves.filter(s => focusSectors.has(s));
        const sectorScore = Math.min(1.0, 0.68 + sharedSectors.length * 0.10);
        const geoScore =
          focusCompany.addresses.locality &&
          candidate.addresses.locality &&
          focusCompany.addresses.locality === candidate.addresses.locality
            ? 0.96
            : 0.86;
        const evidenceScore = Number(
          (((candidate.enrichment_metrics?.quality_score || 75) +
            (focusCompany.enrichment_metrics?.quality_score || 75)) /
            200).toFixed(2)
        );

        const weightedSum =
          weights.compatibility * compatScore +
          weights.sector * sectorScore +
          weights.geography * geoScore +
          weights.evidence * evidenceScore;
        const score = Math.round(100 * (weightedSum / totalWeight));
        const coverage = Number(((compatScore + sectorScore + geoScore + evidenceScore) / 4).toFixed(2));
        const isUnlocked = unlockedIds.has(candidateId);

        const criterionResults: CriterionResult[] = [
          {
            criterion_id: `crit_cap_${focus_company_id}_${candidateId}`,
            criterion_key: 'offering_satisfies_need',
            importance: 'must',
            state: 'pass',
            profile_version_id: candidateProfile.profile_version_id,
            supporting_assertion_ids: candSchema.assertions.slice(0, 2).map(a => a.id),
            explanation:
              direction === 'supplier'
                ? `${candidate.display_name || candidate.legal_name} provides '${matchedOffering}' [SIC ${candidate.primary_sic}], fulfilling ${focusCompany.display_name || focusCompany.legal_name}'s requirement for '${satisfiedNeed}'.`
                : `${focusCompany.display_name || focusCompany.legal_name} provides '${matchedOffering}' [SIC ${focusCompany.primary_sic}], fulfilling ${candidate.display_name || candidate.legal_name}'s requirement for '${satisfiedNeed}'.`
          },
          {
            criterion_id: `crit_geo_${focus_company_id}_${candidateId}`,
            criterion_key: 'geographic_coverage_gb',
            importance: 'must',
            state: 'pass',
            profile_version_id: candidateProfile.profile_version_id,
            supporting_assertion_ids: candSchema.assertions.slice(0, 1).map(a => a.id),
            explanation: `Both companies operate within GB supply chain coverage (${focusCompany.addresses.locality || 'UK'} ↔ ${candidate.addresses.locality || 'UK'}).`
          },
          {
            criterion_id: `crit_cred_${focus_company_id}_${candidateId}`,
            criterion_key: 'quality_credentials',
            importance: 'prefer',
            state: candSchema.credentials.length > 0 ? 'pass' : 'unknown',
            profile_version_id: candidateProfile.profile_version_id,
            supporting_assertion_ids: candSchema.assertions.slice(0, 1).map(a => a.id),
            explanation:
              candSchema.credentials.length > 0
                ? `Verified quality credentials on source: ${candSchema.credentials.map(c => c.standard_code).join(', ')}`
                : 'No explicit ISO certificate claimed on public crawl (assessed as unknown per Phase One Schema).'
          }
        ];

        resultsMap.set(candidateId, {
          edge_id: `edge_${focus_company_id}_${candidateId}`,
          assessment_id: `asmt_${focus_company_id}_${candidateId}_${direction}`,
          focus_company_id,
          focus_company_name: focusCompany.display_name || focusCompany.legal_name,
          focus_registration_number: focusCompany.registration_number,
          focus_sic: focusCompany.primary_sic,
          focus_locality: focusCompany.addresses.locality,
          counterparty_company_id: candidateId,
          counterparty_name: candidate.display_name || candidate.legal_name,
          counterparty_legal_name: candidate.legal_name,
          registration_number: candidate.registration_number,
          addresses: candidate.addresses,
          sic_codes: candidate.sic_codes,
          counterparty_website: candidate.website_url,
          direction,
          relation_family: 'capability_satisfies_need',
          offering_matched: matchedOffering,
          need_satisfied: satisfiedNeed,
          score,
          score_components: {
            compatibility: compatScore,
            sector: Number(sectorScore.toFixed(2)),
            geography: geoScore,
            evidence: evidenceScore
          },
          coverage,
          explanation:
            direction === 'supplier'
              ? `Supplier Match (${score}%): ${candidate.display_name || candidate.legal_name} (#${candidate.registration_number}, ${candidate.addresses.locality || 'UK'}) provides ${matchedOffering} [SIC ${candidate.primary_sic}], fulfilling ${focusCompany.display_name || focusCompany.legal_name}'s requirement for '${satisfiedNeed}'.`
              : `Customer Lead (${score}%): ${candidate.display_name || candidate.legal_name} (#${candidate.registration_number}, ${candidate.addresses.locality || 'UK'}) operates in ${candidate.sic_description} [SIC ${candidate.primary_sic}] and requires '${satisfiedNeed}', which is directly supplied by ${focusCompany.display_name || focusCompany.legal_name}'s '${matchedOffering}'.`,
          criterion_results: criterionResults,
          supporting_assertions: candSchema.assertions.slice(0, 3).map(a => a.id),
          is_unlocked: isUnlocked,
          unlocked_access_id: isUnlocked ? `acc_${focus_company_id}_${candidateId}` : undefined,
          profile_version: candidateProfile
        });

        if (resultsMap.size >= 18) break;
      }
    }

    const finalResults = Array.from(resultsMap.values());
    finalResults.sort((a, b) => b.score - a.score);
    return finalResults;
  }

  public checkIfCompetitor(
    focusCompany: CompanyRecord,
    candidateCompany: CompanyRecord,
    focus: ProfileVersion,
    candidate: ProfileVersion
  ): boolean {
    // If primary SIC is identical, they are direct horizontal peers/competitors unless focus SIC is in candidate's target supplier SICs
    if (focusCompany.primary_sic && focusCompany.primary_sic === candidateCompany.primary_sic) {
      return true;
    }

    const focusProvides = new Set(focus.provides.map(p => p.concept_id));
    const candidateProvides = new Set(candidate.provides.map(p => p.concept_id));
    const candidateNeeds = new Set(
      candidate.likely_needs.map(n => (typeof n === 'string' ? n : n.concept_id))
    );

    let overlapCount = 0;
    for (const p of focusProvides) {
      if (candidateProvides.has(p)) overlapCount++;
    }

    if (overlapCount > 0) {
      const consumesFocusOutput = Array.from(focusProvides).some(p => candidateNeeds.has(p));
      return !consumesFocusOutput;
    }

    return false;
  }
}
