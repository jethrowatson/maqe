/**
 * C05 Matching Profile Analysis, Directional Match Generation & Ranked Batch Delivery Engine
 * Implements:
 * - Prompt 7: Matching Profile Analysis before match generation (separating observed website
 *   activities/products/services from inferred upstream supplier requirements & downstream customer
 *   archetypes, including sheet-metal fabricator verification, confidence & information gaps, and
 *   automatic reassessment when enrichment changes).
 * - Prompt 8: Directional Supplier & Customer match generation using stored MatchingProfileAnalysis,
 *   0-100 suitability scoring with explicit weak-evidence/gap notes, and Ranked Batch Delivery
 *   with configurable batch_size, min_score, non-repetition of previously delivered connections,
 *   and shortfall explanations.
 */

import {
  MatchCandidateResult,
  MatchDirection,
  MatchingCriteria,
  CompanyRecord,
  ProfileVersion,
  CriterionResult,
  MatchingProfileAnalysis,
  InferredSupplierCriterion,
  InferredCustomerCriterion,
  DeliveredMatchBatch,
  MatchBatchPreview
} from '../domain/types';
import {
  FIXTURE_COMPANIES,
  FIXTURE_PROFILES,
  FIXTURE_MATCH_CANDIDATES,
  REAL_COHORT_SUMMARY,
  hydratePhaseOneSchema
} from '../fixtures/cohort';

export interface MatchingExecutionOptions {
  focus_company_id: string;
  direction: MatchDirection;
  criteria?: Partial<MatchingCriteria>;
  unlocked_company_ids?: Set<string>;
}

export interface MatchingProfileBatchResult {
  run_id: string;
  scope: 'unprocessed_or_stale' | 'all_enriched';
  batch_size: number;
  profiles_evaluated: number;
  profiles_current: number;
  profiles_insufficient_evidence: number;
  started_at: string;
  completed_at: string;
}

export interface MatchGenerationBatchResult {
  run_id: string;
  scope: 'current_profiles' | 'pending_reassessment';
  batch_size: number;
  companies_evaluated: number;
  companies_with_matches: number;
  companies_zero_matches: number;
  supplier_connections_generated: number;
  customer_connections_generated: number;
  started_at: string;
  completed_at: string;
}

export class MatchingEngine {
  private companies: Map<string, CompanyRecord>;
  private profiles: Map<string, ProfileVersion>;
  private precomputedMatches: MatchCandidateResult[];
  private matchingProfiles: Map<string, MatchingProfileAnalysis>;
  private deliveredBatches: DeliveredMatchBatch[];
  private deliveredConnectionKeys: Map<string, { batch_id: string; delivered_at: string }>;
  private profileBatchHistory: MatchingProfileBatchResult[];
  private matchGenBatchHistory: MatchGenerationBatchResult[];

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

    this.matchingProfiles = new Map();
    this.deliveredBatches = [];
    this.deliveredConnectionKeys = new Map();
    this.profileBatchHistory = [];
    this.matchGenBatchHistory = [];

    // Seed initial stored MatchingProfileAnalysis records for all enriched companies (Prompt 7)
    this.seedInitialMatchingProfiles();

    // Enrich precomputed matches with Prompt 8 fields (matched_profile_criteria, evidence_used, weak_evidence_or_gaps, delivery_status)
    this.precomputedMatches = FIXTURE_MATCH_CANDIDATES.map(m => this.augmentMatchCandidate(m));
  }

  private seedInitialMatchingProfiles(): void {
    for (const company of FIXTURE_COMPANIES.slice(0, 1000)) {
      const mpStatus = company.pipeline_state?.matching_profile_status || 'awaiting_enrichment';
      if (
        mpStatus === 'current' ||
        mpStatus === 'stale_needs_reassessment' ||
        mpStatus === 'insufficient_evidence'
      ) {
        const analysis = this.buildMatchingProfileForCompany(
          company,
          mpStatus === 'stale_needs_reassessment'
            ? 'stale_needs_reassessment'
            : mpStatus === 'insufficient_evidence'
            ? 'insufficient_evidence'
            : 'current'
        );
        this.matchingProfiles.set(company.company_id, analysis);
      }
    }
  }

  /**
   * Builds a structured MatchingProfileAnalysis record (Prompt 7) for a company,
   * strictly separating observed website facts from inferred supplier requirements
   * and inferred customer archetypes.
   * Explicitly supports sheet-metal fabrication / presswork companies (e.g. Regent Engineering #00551421, SIC 25500/25620/25990).
   */
  private buildMatchingProfileForCompany(
    company: CompanyRecord,
    targetStatus?: MatchingProfileAnalysis['status']
  ): MatchingProfileAnalysis {
    const schema = hydratePhaseOneSchema(company.company_id);
    const completeness = company.enrichment_metrics?.completeness_pct || 0;
    const isEnriched = Boolean(company.enrichment_metrics?.is_website_enriched);
    const now = company.updated_at || new Date().toISOString();

    if (!isEnriched) {
      return {
        matching_profile_id: `mp_${company.registration_number}`,
        company_id: company.company_id,
        registration_number: company.registration_number,
        company_name: company.legal_name,
        enrichment_revision_used: company.enrichment_revision || 0,
        status: 'awaiting_enrichment',
        observed_summary: 'Company has not yet undergone website enrichment.',
        observed_activities: [company.sic_description],
        observed_products: [],
        observed_services: [],
        observed_capabilities_and_materials: [],
        observed_sectors: [],
        inferred_supplier_criteria: [],
        inferred_customer_criteria: [],
        profile_confidence: 0,
        information_gaps: [
          'No approved and crawled company website enrichment available.',
          'Specific product range, plant list, and customer sectors cannot be verified from statutory registry alone.'
        ],
        reassessment_reason: 'Awaiting website enrichment completion.',
        generated_at: now,
        updated_at: now
      };
    }

    const isInsufficient =
      targetStatus === 'insufficient_evidence' || completeness < 45;

    const observedProducts = (schema?.offerings || [])
      .filter(o => o.node_type !== 'group' && o.kind === 'product')
      .map(o => o.name);
    const observedServices = (schema?.offerings || [])
      .filter(o => o.node_type !== 'group' && o.kind !== 'product')
      .map(o => o.name);
    const allOfferings = (schema?.offerings || [])
      .filter(o => o.node_type !== 'group')
      .map(o => o.name);

    const observedCapabilitiesAndMaterials = (schema?.capabilities || []).map(
      cap => `${cap.name} (${cap.materials.map(m => m.replace(/_/g, ' ')).join(', ')})`
    );
    const observedSectors = (schema?.markets || []).map(m => m.label);

    const isSheetMetalOrPresswork =
      company.primary_sic === '25500' ||
      company.primary_sic === '25990' ||
      company.sic_description.toLowerCase().includes('forging, pressing, stamping') ||
      company.sic_description.toLowerCase().includes('sheet metal') ||
      allOfferings.some(
        o =>
          o.toLowerCase().includes('presswork') ||
          o.toLowerCase().includes('sheet metal') ||
          o.toLowerCase().includes('stamping')
      );

    const supplierCriteria: InferredSupplierCriterion[] = [];
    const customerCriteria: InferredCustomerCriterion[] = [];

    if (!isInsufficient) {
      if (isSheetMetalOrPresswork) {
        // Explicit Prompt 7 Verification Case: Sheet-Metal / Presswork Fabricator
        supplierCriteria.push(
          {
            criterion_id: `sc_${company.registration_number}_metal_stock`,
            category: 'raw_material',
            requirement_label: 'Mill-Certified Sheet Metal, Slit Steel Coil, Stainless & Aluminium Stockists',
            rationale:
              'Observed sheet-metal presswork, stamping, and fabrication operations require regular upstream deliveries of slit cold-rolled steel strip, galvanised sheet, stainless steel, and aluminium blanks with EN 10204 3.1 mill certification.',
            supporting_observed_inputs: [
              ...allOfferings.slice(0, 2),
              ...observedCapabilitiesAndMaterials.slice(0, 2)
            ],
            target_supplier_sics: ['24100', '24320', '24420', '46720'],
            target_keywords: ['steel coil', 'sheet metal stockist', 'aluminium sheet', 'cold rolled strip'],
            confidence: 0.94
          },
          {
            criterion_id: `sc_${company.registration_number}_tooling_finish`,
            category: 'subcontract_process',
            requirement_label: 'Progression Press Toolmakers & Subcontract Surface Finishing / Powder Coating',
            rationale:
              'High-tonnage metal forming and sheet-metal enclosure fabrication rely on external press tool & die manufacturing (SIC 25730) and corrosion-resistant zinc plating, anodising, and powder coating partners (SIC 25610).',
            supporting_observed_inputs: [
              `SIC ${company.primary_sic}: ${company.sic_description}`,
              ...allOfferings.slice(0, 2)
            ],
            target_supplier_sics: ['25610', '25730', '25620'],
            target_keywords: ['press tooling', 'powder coating', 'electroplating', 'surface treatment'],
            confidence: 0.91
          },
          {
            criterion_id: `sc_${company.registration_number}_fasteners_consumables`,
            category: 'consumable_or_equipment',
            requirement_label: 'PEM Self-Clinching Fasteners, Welding Consumables & Press Maintenance Tooling',
            rationale:
              'Fabricated sheet-metal sub-assemblies and welded brackets require threaded inserts, stud fasteners, MIG/TIG shielding consumables, and press calibration services.',
            supporting_observed_inputs: observedCapabilitiesAndMaterials.slice(0, 2),
            target_supplier_sics: ['25940', '28410', '33120'],
            target_keywords: ['fasteners', 'welding consumables', 'machine tool servicing'],
            confidence: 0.87
          }
        );

        customerCriteria.push(
          {
            criterion_id: `cc_${company.registration_number}_machinery_oems`,
            customer_archetype_label: 'Industrial Machinery, Material Handling & Special-Purpose Equipment OEMs',
            likely_use_case:
              'Purchases custom formed sheet-metal guards, chassis frames, laser-cut mounting brackets, and welded structural housings for assembly into complete machinery.',
            rationale:
              'Machinery OEMs (SIC 28110–28990) typically outsource high-tonnage presswork, turret punching, and precision sheet-metal fabrication to accredited tier-1/tier-2 subcontract fabricators.',
            supporting_observed_inputs: [
              ...allOfferings.slice(0, 2),
              ...(observedSectors.length > 0 ? observedSectors : ['Industrial Machinery & Plant'])
            ],
            target_customer_sics: ['28110', '28220', '28290', '28990'],
            target_keywords: ['machinery manufacturer', 'equipment OEM', 'enclosures', 'sub-assemblies'],
            confidence: 0.93
          },
          {
            criterion_id: `cc_${company.registration_number}_automotive_rail_elec`,
            customer_archetype_label: 'Automotive Tier-1 Integrators, Rail Rolling Stock & Electrical Switchgear Builders',
            likely_use_case:
              'Procures repeatable batch-stamped brackets, busbar housings, electrical control cabinets, and structural pressings.',
            rationale:
              'Transport and electrical equipment manufacturers require volume presswork and ISO-certified metal assemblies with batch traceability.',
            supporting_observed_inputs: [
              ...allOfferings.slice(0, 2),
              ...observedCapabilitiesAndMaterials.slice(0, 2)
            ],
            target_customer_sics: ['27120', '29100', '29320', '30200'],
            target_keywords: ['switchgear', 'automotive assemblies', 'control panels', 'rolling stock'],
            confidence: 0.89
          }
        );
      } else {
        // General industrial engineering & manufacturing companies
        for (const [idx, need] of (schema?.needs || []).entries()) {
          const catMap: Record<string, InferredSupplierCriterion['category']> = {
            material: 'raw_material',
            component: 'component_or_subassembly',
            service: 'subcontract_process',
            equipment: 'consumable_or_equipment',
            logistics: 'logistics_or_testing'
          };
          supplierCriteria.push({
            criterion_id: `sc_${company.registration_number}_${idx + 1}`,
            category: catMap[need.need_type] || 'component_or_subassembly',
            requirement_label: need.label,
            rationale: need.rationale,
            supporting_observed_inputs: [
              ...allOfferings.slice(0, 2),
              ...observedCapabilitiesAndMaterials.slice(0, 1)
            ],
            target_supplier_sics: need.target_supplier_sics || ['25620', '25610'],
            target_keywords: need.label.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 4),
            confidence: 0.88
          });
        }

        // Build downstream customer criteria based on company's offerings & markets
        customerCriteria.push(
          {
            criterion_id: `cc_${company.registration_number}_primary_oem`,
            customer_archetype_label: `Downstream ${observedSectors[0] || 'Industrial Engineering & OEM'} Manufacturers`,
            likely_use_case: `Procures ${allOfferings.join(', ') || company.sic_description} as production inputs or subcontract engineering services.`,
            rationale: `Derived from observed website offerings (${allOfferings.slice(0, 2).join(', ')}) and target buyer sectors (${observedSectors.join(', ') || 'UK Manufacturing'}).`,
            supporting_observed_inputs: [
              ...allOfferings.slice(0, 2),
              ...observedSectors.slice(0, 2)
            ],
            target_customer_sics: ['28110', '28290', '28990', '25110', '25620', '27120', '30300'].filter(
              s => s !== company.primary_sic
            ),
            target_keywords: allOfferings.flatMap(o => o.toLowerCase().split(/\s+/)).filter(w => w.length > 4).slice(0, 5),
            confidence: 0.89
          },
          {
            criterion_id: `cc_${company.registration_number}_secondary_integrator`,
            customer_archetype_label: `UK Sub-Assembly Integrators & Plant Maintenance Engineering Teams`,
            likely_use_case: `Requires specialist ${observedCapabilitiesAndMaterials[0] || company.sic_description} capacity for scheduled production and overhaul programmes.`,
            rationale: `Observed plant capabilities (${observedCapabilitiesAndMaterials.join('; ') || company.sic_description}) support repeat B2B subcontract supply across ${company.addresses.locality || 'UK'} and national engineering corridors.`,
            supporting_observed_inputs: observedCapabilitiesAndMaterials.slice(0, 2),
            target_customer_sics: ['25990', '28410', '33120', '26511'],
            target_keywords: ['subcontract', 'precision', 'assemblies', 'overhaul'],
            confidence: 0.84
          }
        );
      }
    }

    const gaps: string[] = [];
    if (isInsufficient) {
      gaps.push(
        `Enrichment completeness (${completeness}%) is below the 45% threshold required to construct reliable supplier/customer matching criteria.`,
        'Website lacks detailed product specifications, machine capacity parameters, or sector case studies.'
      );
    } else {
      if ((schema?.credentials || []).length === 0) {
        gaps.push('No explicit ISO quality certification PDF or certificate number published on website (assessed as unknown).');
      }
      if ((schema?.parameters || []).length < 2) {
        gaps.push('Maximum work-envelope dimensions or batch-size tolerances not explicitly stated on public pages.');
      }
    }

    const finalStatus: MatchingProfileAnalysis['status'] =
      targetStatus ||
      (isInsufficient
        ? 'insufficient_evidence'
        : company.pipeline_state?.reassessment_flags.matching_profile_pending
        ? 'stale_needs_reassessment'
        : 'current');

    return {
      matching_profile_id: `mp_${company.registration_number}_v${company.enrichment_revision || 1}`,
      company_id: company.company_id,
      registration_number: company.registration_number,
      company_name: company.legal_name,
      enrichment_revision_used: company.enrichment_revision || 1,
      status: finalStatus,
      observed_summary:
        schema?.company_summary.text ||
        company.detailed_business_description ||
        `${company.legal_name} operates in ${company.sic_description} [SIC ${company.primary_sic}].`,
      observed_activities: [
        `SIC ${company.primary_sic}: ${company.sic_description}`,
        ...(company.business_roles || [])
      ],
      observed_products:
        observedProducts.length > 0 ? observedProducts : allOfferings.slice(0, 2),
      observed_services:
        observedServices.length > 0 ? observedServices : allOfferings.slice(1),
      observed_capabilities_and_materials: observedCapabilitiesAndMaterials,
      observed_sectors: observedSectors,
      inferred_supplier_criteria: supplierCriteria,
      inferred_customer_criteria: customerCriteria,
      profile_confidence: isInsufficient ? 0.35 : Number(Math.min(0.96, 0.72 + completeness * 0.0022).toFixed(2)),
      information_gaps: gaps,
      reassessment_reason:
        finalStatus === 'stale_needs_reassessment'
          ? company.pipeline_state?.reassessment_flags.reasons[0] ||
            'Upstream enrichment or registry data changed since this Matching Profile Analysis was generated.'
          : undefined,
      generated_at: now,
      updated_at: now
    };
  }

  private augmentMatchCandidate(m: MatchCandidateResult): MatchCandidateResult {
    const focusMp = this.matchingProfiles.get(m.focus_company_id);
    const candCo = this.companies.get(m.counterparty_company_id);
    const candCompleteness = candCo?.enrichment_metrics?.completeness_pct || 75;
    const isCandEnriched = Boolean(candCo?.enrichment_metrics?.is_website_enriched);

    const matchedCriteria: string[] = [];
    if (m.direction === 'supplier' && focusMp?.inferred_supplier_criteria.length) {
      matchedCriteria.push(
        focusMp.inferred_supplier_criteria[0].requirement_label
      );
    } else if (m.direction === 'customer' && focusMp?.inferred_customer_criteria.length) {
      matchedCriteria.push(
        focusMp.inferred_customer_criteria[0].customer_archetype_label
      );
    } else {
      matchedCriteria.push(m.need_satisfied || 'Industrial Supply Chain Fit');
    }

    const evidenceUsed: string[] = [
      `Counterparty Offering: ${m.offering_matched}`,
      `Need Satisfied: ${m.need_satisfied}`,
      `Registry SIC Alignment: ${m.focus_sic || '25500'} ↔ ${(m.sic_codes || [])[0] || '25620'}`
    ];
    if (m.counterparty_website) {
      evidenceUsed.push(`Verified Website: ${m.counterparty_website}`);
    }

    const weakEvidenceOrGaps: string[] = [];
    if (!isCandEnriched) {
      weakEvidenceOrGaps.push(
        'Counterparty has not yet undergone website enrichment; match relies on statutory SIC classification and regional profile.'
      );
    } else if (candCompleteness < 80) {
      weakEvidenceOrGaps.push(
        `Counterparty website enrichment is partial (${candCompleteness}% completeness); specific machine envelope tolerances were not published online.`
      );
    }
    if (m.score_components.geography < 0.90) {
      weakEvidenceOrGaps.push(
        `Inter-regional UK logistics required (${m.focus_locality || 'UK'} ↔ ${ m.addresses?.locality || 'UK'}).`
      );
    }

    const key = `${m.focus_company_id}:${m.direction}:${m.counterparty_company_id}`;
    const deliveredInfo = this.deliveredConnectionKeys.get(key);

    return {
      ...m,
      matched_profile_criteria: matchedCriteria,
      evidence_used: evidenceUsed,
      weak_evidence_or_gaps: weakEvidenceOrGaps,
      delivery_status: deliveredInfo ? 'delivered' : 'undelivered',
      delivered_batch_id: deliveredInfo?.batch_id,
      delivered_at: deliveredInfo?.delivered_at
    };
  }

  // --- Prompt 7 Public Methods: Matching Profile Analysis ---

  public getMatchingProfileAnalysis(company_id: string): MatchingProfileAnalysis | undefined {
    const existing = this.matchingProfiles.get(company_id);
    if (existing) return existing;
    const company = this.companies.get(company_id) || FIXTURE_COMPANIES.find(c => c.company_id === company_id);
    if (!company) return undefined;
    const built = this.buildMatchingProfileForCompany(company);
    this.matchingProfiles.set(company_id, built);
    return built;
  }

  public getAllMatchingProfiles(): MatchingProfileAnalysis[] {
    return Array.from(this.matchingProfiles.values());
  }

  public getProfileBatchHistory(): MatchingProfileBatchResult[] {
    return [...this.profileBatchHistory];
  }

  public getMatchGenerationBatchHistory(): MatchGenerationBatchResult[] {
    return [...this.matchGenBatchHistory];
  }

  /**
   * Generates or refreshes the stored MatchingProfileAnalysis for a single company (Prompt 7).
   */
  public generateMatchingProfileAnalysis(company_id: string): MatchingProfileAnalysis | null {
    const company = FIXTURE_COMPANIES.find(c => c.company_id === company_id);
    if (!company) return null;

    this.companies.set(company.company_id, company);
    const now = new Date().toISOString();
    const isEnriched = Boolean(company.enrichment_metrics?.is_website_enriched);
    const completeness = company.enrichment_metrics?.completeness_pct || 0;

    const status: MatchingProfileAnalysis['status'] = !isEnriched
      ? 'awaiting_enrichment'
      : completeness < 45
      ? 'insufficient_evidence'
      : 'current';

    const analysis = this.buildMatchingProfileForCompany(company, status);
    analysis.generated_at = now;
    analysis.updated_at = now;
    analysis.reassessment_reason = undefined;
    this.matchingProfiles.set(company_id, analysis);

    if (company.pipeline_state) {
      company.pipeline_state.matching_profile_status = status;
      company.pipeline_state.last_profile_analysis_at = now;
      company.pipeline_state.reassessment_flags.matching_profile_pending = false;
      if (status === 'current') {
        company.pipeline_state.reassessment_flags.matching_pending = true;
      }
    }

    company.processing_history = [
      {
        event_id: `ph_${company.registration_number}_mp_${Date.now()}`,
        stage: 'matching_profile',
        status: status === 'current' ? 'completed' : status,
        summary:
          status === 'current'
            ? `Generated Matching Profile Analysis (${analysis.inferred_supplier_criteria.length} supplier criteria, ${analysis.inferred_customer_criteria.length} customer criteria; confidence ${Math.round(analysis.profile_confidence * 100)}%).`
            : `Matching Profile Analysis marked '${status}' (${analysis.information_gaps[0] || 'insufficient evidence'}).`,
        timestamp: now
      },
      ...(company.processing_history || [])
    ];

    return analysis;
  }

  /**
   * Runs a batched Matching Profile Analysis job across companies needing profile generation or reassessment (Prompt 7).
   */
  public runMatchingProfileBatch(options?: {
    scope?: 'unprocessed_or_stale' | 'all_enriched';
    batch_size?: number;
  }): MatchingProfileBatchResult {
    const startedAt = new Date().toISOString();
    const scope = options?.scope || 'unprocessed_or_stale';
    const batchSize = options?.batch_size || 100;

    let targets = FIXTURE_COMPANIES.filter(c => Boolean(c.enrichment_metrics?.is_website_enriched));
    if (scope === 'unprocessed_or_stale') {
      const pending = targets.filter(
        c =>
          c.pipeline_state?.matching_profile_status === 'unprocessed' ||
          c.pipeline_state?.matching_profile_status === 'stale_needs_reassessment' ||
          c.pipeline_state?.reassessment_flags.matching_profile_pending
      );
      if (pending.length > 0) {
        targets = pending;
      }
    }

    const slice = targets.slice(0, batchSize);
    let currentCount = 0;
    let insufficientCount = 0;

    for (const co of slice) {
      const mp = this.generateMatchingProfileAnalysis(co.company_id);
      if (mp?.status === 'current') {
        currentCount++;
      } else {
        insufficientCount++;
      }
    }

    const completedAt = new Date().toISOString();
    const result: MatchingProfileBatchResult = {
      run_id: `mp_batch_${Date.now()}`,
      scope,
      batch_size: batchSize,
      profiles_evaluated: slice.length,
      profiles_current: currentCount,
      profiles_insufficient_evidence: insufficientCount,
      started_at: startedAt,
      completed_at: completedAt
    };

    this.profileBatchHistory.unshift(result);
    return result;
  }

  // --- Prompt 8 Public Methods: Match Generation, Summary & Ranked Batch Delivery ---

  public getMatchingPipelineSummary() {
    let currentProfiles = 0;
    let staleProfiles = 0;
    let insufficientProfiles = 0;
    let awaitingEnrichmentProfiles = 0;
    let unprocessedProfiles = 0;
    let companiesWithMatches = 0;
    let companiesZeroMatches = 0;
    let companiesAwaitingMatching = 0;

    for (const c of FIXTURE_COMPANIES) {
      const mpStatus = c.pipeline_state?.matching_profile_status || 'awaiting_enrichment';
      if (mpStatus === 'current') currentProfiles++;
      else if (mpStatus === 'stale_needs_reassessment') staleProfiles++;
      else if (mpStatus === 'insufficient_evidence') insufficientProfiles++;
      else if (mpStatus === 'unprocessed') unprocessedProfiles++;
      else awaitingEnrichmentProfiles++;

      const mStatus = c.pipeline_state?.matching_status || 'awaiting_profile_analysis';
      if (mStatus === 'completed_with_matches') companiesWithMatches++;
      else if (mStatus === 'completed_no_matches') companiesZeroMatches++;
      else companiesAwaitingMatching++;
    }

    const supplierConnections = this.precomputedMatches.filter(m => m.direction === 'supplier').length;
    const customerConnections = this.precomputedMatches.filter(m => m.direction === 'customer').length;
    const totalDeliveredConnections = this.deliveredConnectionKeys.size;

    return {
      total_companies: FIXTURE_COMPANIES.length,
      matching_profiles_current: currentProfiles,
      matching_profiles_stale: staleProfiles,
      matching_profiles_insufficient_evidence: insufficientProfiles,
      matching_profiles_unprocessed: unprocessedProfiles,
      matching_profiles_awaiting_enrichment: awaitingEnrichmentProfiles,
      companies_with_matches: companiesWithMatches,
      companies_completed_zero_matches: companiesZeroMatches,
      companies_awaiting_matching: companiesAwaitingMatching,
      total_connections_stored: this.precomputedMatches.length,
      supplier_connections_count: supplierConnections,
      customer_connections_count: customerConnections,
      total_batches_delivered: this.deliveredBatches.length,
      total_connections_delivered: totalDeliveredConnections
    };
  }

  /**
   * Runs a batched Directional Match Generation job across companies with current Matching Profiles (Prompt 8).
   */
  public runMatchGenerationBatch(options?: {
    scope?: 'current_profiles' | 'pending_reassessment';
    batch_size?: number;
  }): MatchGenerationBatchResult {
    const startedAt = new Date().toISOString();
    const scope = options?.scope || 'current_profiles';
    const batchSize = options?.batch_size || 50;

    let targets = FIXTURE_COMPANIES.filter(
      c => c.pipeline_state?.matching_profile_status === 'current'
    );
    if (scope === 'pending_reassessment') {
      const pending = FIXTURE_COMPANIES.filter(
        c => Boolean(c.pipeline_state?.reassessment_flags.matching_pending)
      );
      if (pending.length > 0) targets = pending;
    }

    const slice = targets.slice(0, batchSize);
    let withMatches = 0;
    let zeroMatches = 0;
    let supGenerated = 0;
    let custGenerated = 0;

    for (const co of slice) {
      if (co.pipeline_state?.matching_profile_status === 'stale_needs_reassessment') {
        this.generateMatchingProfileAnalysis(co.company_id);
      }

      const supMatches = this.runMatch({ focus_company_id: co.company_id, direction: 'supplier' });
      const custMatches = this.runMatch({ focus_company_id: co.company_id, direction: 'customer' });

      supGenerated += supMatches.length;
      custGenerated += custMatches.length;

      if (supMatches.length + custMatches.length > 0) {
        withMatches++;
        if (co.pipeline_state) {
          co.pipeline_state.matching_status = 'completed_with_matches';
          co.pipeline_state.last_matching_at = startedAt;
          co.pipeline_state.reassessment_flags.matching_pending = false;
        }
      } else {
        zeroMatches++;
        if (co.pipeline_state) {
          co.pipeline_state.matching_status = 'completed_no_matches';
          co.pipeline_state.last_matching_at = startedAt;
          co.pipeline_state.reassessment_flags.matching_pending = false;
        }
      }
    }

    const completedAt = new Date().toISOString();
    REAL_COHORT_SUMMARY.matching_jobs_run_count =
      (REAL_COHORT_SUMMARY.matching_jobs_run_count || 2) + 1;
    REAL_COHORT_SUMMARY.companies_matched_count = FIXTURE_COMPANIES.filter(
      c => c.pipeline_state?.matching_status === 'completed_with_matches'
    ).length;

    const result: MatchGenerationBatchResult = {
      run_id: `mgen_batch_${Date.now()}`,
      scope,
      batch_size: batchSize,
      companies_evaluated: slice.length,
      companies_with_matches: withMatches,
      companies_zero_matches: zeroMatches,
      supplier_connections_generated: supGenerated,
      customer_connections_generated: custGenerated,
      started_at: startedAt,
      completed_at: completedAt
    };

    this.matchGenBatchHistory.unshift(result);
    return result;
  }

  /**
   * Previews a Ranked Match Batch for a company and direction (Prompt 8):
   * - Filters by min_score
   * - Excludes any connection already delivered in a previous batch for (company_id, direction)
   * - Orders from highest suitability score to lowest
   * - Explains any shortfall when fewer than batch_size connections qualify
   */
  public previewMatchBatch(params: {
    company_id: string;
    direction: MatchDirection;
    batch_size: number;
    min_score: number;
  }): MatchBatchPreview {
    const allDirectional = this.runMatch({
      focus_company_id: params.company_id,
      direction: params.direction
    });

    let excludedAlreadyDelivered = 0;
    let excludedBelowMinScore = 0;
    const qualifyingUndelivered: MatchCandidateResult[] = [];

    for (const conn of allDirectional) {
      const key = `${params.company_id}:${params.direction}:${conn.counterparty_company_id}`;
      const isDelivered = this.deliveredConnectionKeys.has(key);
      if (isDelivered) {
        excludedAlreadyDelivered++;
        continue;
      }
      if (conn.score < params.min_score) {
        excludedBelowMinScore++;
        continue;
      }
      qualifyingUndelivered.push(conn);
    }

    // Sort highest score first
    qualifyingUndelivered.sort((a, b) => b.score - a.score);

    const selected = qualifyingUndelivered.slice(0, params.batch_size);
    const remainingAfter = Math.max(0, qualifyingUndelivered.length - selected.length);

    let shortfallReason: string | undefined;
    if (selected.length < params.batch_size) {
      shortfallReason =
        `Requested batch of ${params.batch_size} ${params.direction} connections with minimum score >= ${params.min_score}%, ` +
        `but only ${selected.length} qualifying undelivered connection(s) exist ` +
        `(${excludedAlreadyDelivered} already delivered in prior batches; ${excludedBelowMinScore} scored below ${params.min_score}%).`;
    }

    return {
      company_id: params.company_id,
      direction: params.direction,
      requested_batch_size: params.batch_size,
      min_score_applied: params.min_score,
      selected_connections: selected,
      excluded_already_delivered_count: excludedAlreadyDelivered,
      excluded_below_min_score_count: excludedBelowMinScore,
      remaining_qualifying_undelivered_count: remainingAfter,
      shortfall_reason: shortfallReason
    };
  }

  /**
   * Commits and delivers a Ranked Match Batch for a company and direction (Prompt 8).
   * Records each delivered connection so subsequent batches never repeat previously delivered connections.
   */
  public deliverMatchBatch(params: {
    company_id: string;
    direction: MatchDirection;
    batch_size: number;
    min_score: number;
    delivered_by?: string;
  }): DeliveredMatchBatch {
    const preview = this.previewMatchBatch(params);
    const company =
      this.companies.get(params.company_id) ||
      FIXTURE_COMPANIES.find(c => c.company_id === params.company_id);

    const priorBatchesForDirection = this.deliveredBatches.filter(
      b => b.company_id === params.company_id && b.direction === params.direction
    );
    const batchNumber = priorBatchesForDirection.length + 1;
    const now = new Date().toISOString();
    const batchId = `batch_${company?.registration_number || params.company_id}_${params.direction}_b${batchNumber}_${Date.now().toString(36)}`;

    for (const conn of preview.selected_connections) {
      const key = `${params.company_id}:${params.direction}:${conn.counterparty_company_id}`;
      this.deliveredConnectionKeys.set(key, {
        batch_id: batchId,
        delivered_at: now
      });
      conn.delivery_status = 'delivered';
      conn.delivered_batch_id = batchId;
      conn.delivered_at = now;
    }

    // Update precomputedMatches delivery markers
    this.precomputedMatches = this.precomputedMatches.map(m => {
      const key = `${m.focus_company_id}:${m.direction}:${m.counterparty_company_id}`;
      const info = this.deliveredConnectionKeys.get(key);
      if (info) {
        return {
          ...m,
          delivery_status: 'delivered',
          delivered_batch_id: info.batch_id,
          delivered_at: info.delivered_at
        };
      }
      return m;
    });

    const deliveredBatch: DeliveredMatchBatch = {
      batch_id: batchId,
      company_id: params.company_id,
      company_name: company?.legal_name || params.company_id,
      registration_number: company?.registration_number || '',
      direction: params.direction,
      batch_number: batchNumber,
      requested_batch_size: params.batch_size,
      delivered_count: preview.selected_connections.length,
      min_score_applied: params.min_score,
      delivered_connection_ids: preview.selected_connections.map(c => c.edge_id),
      delivered_counterparty_ids: preview.selected_connections.map(c => c.counterparty_company_id),
      remaining_qualifying_count: preview.remaining_qualifying_undelivered_count,
      shortfall_reason: preview.shortfall_reason,
      delivered_by: params.delivered_by || 'operator',
      created_at: now
    };

    this.deliveredBatches.unshift(deliveredBatch);
    return deliveredBatch;
  }

  public getDeliveredBatches(company_id?: string, direction?: MatchDirection): DeliveredMatchBatch[] {
    let list = [...this.deliveredBatches];
    if (company_id) {
      list = list.filter(b => b.company_id === company_id);
    }
    if (direction) {
      list = list.filter(b => b.direction === direction);
    }
    return list;
  }

  public getAllCohortMatches(direction?: MatchDirection): MatchCandidateResult[] {
    const list = direction
      ? this.precomputedMatches.filter(m => m.direction === direction)
      : this.precomputedMatches;
    return [...list].sort((a, b) => b.score - a.score);
  }

  public runMatch(options: MatchingExecutionOptions): MatchCandidateResult[] {
    const { focus_company_id, direction } = options;
    const focusCompany =
      this.companies.get(focus_company_id) ||
      FIXTURE_COMPANIES.find(c => c.company_id === focus_company_id);
    const focusProfile = this.profiles.get(focus_company_id);

    if (!focusCompany || !focusProfile) {
      return [];
    }

    const focusMatchingProfile = this.getMatchingProfileAnalysis(focus_company_id);

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
      const key = `${focus_company_id}:${direction}:${m.counterparty_company_id}`;
      const deliveredInfo = this.deliveredConnectionKeys.get(key);

      resultsMap.set(
        m.counterparty_company_id,
        this.augmentMatchCandidate({
          ...m,
          score: recalculatedScore,
          is_unlocked: isUnlocked,
          unlocked_access_id: isUnlocked
            ? `acc_${focus_company_id}_${m.counterparty_company_id}`
            : undefined,
          profile_version: candidateProfile,
          delivery_status: deliveredInfo ? 'delivered' : 'undelivered',
          delivered_batch_id: deliveredInfo?.batch_id,
          delivered_at: deliveredInfo?.delivered_at
        })
      );
    }

    // 2. Dynamically evaluate Phase One supply-chain links using stored MatchingProfileAnalysis if fewer than 12 matches are present
    const focusSchema = hydratePhaseOneSchema(focus_company_id);
    if (focusSchema && resultsMap.size < 12) {
      const focusSics = new Set(focusCompany.sic_codes);
      const focusTargetSupplierSics = new Map<string, { label: string; rationale?: string }>();

      // Pull supplier criteria from stored MatchingProfileAnalysis first
      if (focusMatchingProfile && focusMatchingProfile.inferred_supplier_criteria.length > 0) {
        for (const sc of focusMatchingProfile.inferred_supplier_criteria) {
          for (const s of sc.target_supplier_sics) {
            focusTargetSupplierSics.set(s, {
              label: sc.requirement_label,
              rationale: sc.rationale
            });
          }
        }
      }
      for (const n of focusSchema.needs) {
        for (const s of n.target_supplier_sics || []) {
          if (!focusTargetSupplierSics.has(s)) {
            focusTargetSupplierSics.set(s, { label: n.label, rationale: n.rationale });
          }
        }
      }

      for (const [candidateId, candidate] of this.companies.entries()) {
        if (candidateId === focus_company_id || resultsMap.has(candidateId)) continue;
        if (!candidate.website_url && resultsMap.size >= 8) continue;

        const candidateProfile = this.profiles.get(candidateId);
        if (!candidateProfile) continue;

        if (
          candidate.sic_codes.some(
            s => s.startsWith('10') || s.startsWith('11') || s.startsWith('14') || s.startsWith('21')
          )
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

        const rawMatch: MatchCandidateResult = {
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
        };

        resultsMap.set(candidateId, this.augmentMatchCandidate(rawMatch));

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
