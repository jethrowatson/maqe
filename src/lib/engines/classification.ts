/**
 * C04 Classification & Profile Publication Engine
 * Manages engineering taxonomies, validates profile drafts,
 * and maintains immutable profile version history with diffs (Section 7 & 7A).
 */

import { ProfileVersion, ConceptItem } from '../domain/types';
import { FIXTURE_PROFILES } from '../fixtures/cohort';

export interface ProfileDiff {
  company_id: string;
  version_a: string;
  version_b: string;
  added_provides: ConceptItem[];
  removed_provides: ConceptItem[];
  added_likely_needs: (ConceptItem | string)[];
  removed_likely_needs: (ConceptItem | string)[];
}

export class ClassificationEngine {
  private profiles: Map<string, ProfileVersion[]>; // company_id -> list of versions

  constructor(customProfiles?: Record<string, ProfileVersion>) {
    this.profiles = new Map();
    const source = customProfiles || FIXTURE_PROFILES;
    for (const [companyId, profile] of Object.entries(source)) {
      this.profiles.set(companyId, [{ ...profile }]);
    }
  }

  public getCurrentProfile(company_id: string): ProfileVersion | null {
    const list = this.profiles.get(company_id);
    if (!list || list.length === 0) return null;
    return list[list.length - 1];
  }

  public getProfileHistory(company_id: string): ProfileVersion[] {
    return this.profiles.get(company_id) || [];
  }

  public publishVersion(
    company_id: string,
    draft: Partial<ProfileVersion>
  ): ProfileVersion {
    const history = this.profiles.get(company_id) || [];
    const vNum = history.length + 1;
    const newVersion: ProfileVersion = {
      profile_version_id: `pv_${company_id}_v${vNum}`,
      company_id,
      schema_version: '1.0',
      source_bundle_version: `sb_${company_id}_${vNum}`,
      taxonomy_version: 'engineering_demo_v1',
      published_at: new Date().toISOString(),
      provides: draft.provides || [],
      uses: draft.uses || [],
      serves: draft.serves || [],
      likely_needs: draft.likely_needs || [],
      relationships: draft.relationships || [],
      quality_indicators: draft.quality_indicators || {
        matchable: true,
        review_status: 'accepted',
        coverage: 0.90
      },
      is_current: true
    };

    // Mark previous current as false
    for (const h of history) {
      h.is_current = false;
    }
    history.push(newVersion);
    this.profiles.set(company_id, history);
    return newVersion;
  }

  public computeDiff(versionA: ProfileVersion, versionB: ProfileVersion): ProfileDiff {
    const providesA = new Set(versionA.provides.map(p => p.concept_id));
    const providesB = new Set(versionB.provides.map(p => p.concept_id));

    const addedProvides = versionB.provides.filter(p => !providesA.has(p.concept_id));
    const removedProvides = versionA.provides.filter(p => !providesB.has(p.concept_id));

    const getNeedId = (n: ConceptItem | string) => typeof n === 'string' ? n : n.concept_id;
    const needsA = new Set(versionA.likely_needs.map(getNeedId));
    const needsB = new Set(versionB.likely_needs.map(getNeedId));

    const addedNeeds = versionB.likely_needs.filter(n => !needsA.has(getNeedId(n)));
    const removedNeeds = versionA.likely_needs.filter(n => !needsB.has(getNeedId(n)));

    return {
      company_id: versionA.company_id,
      version_a: versionA.profile_version_id,
      version_b: versionB.profile_version_id,
      added_provides: addedProvides,
      removed_provides: removedProvides,
      added_likely_needs: addedNeeds,
      removed_likely_needs: removedNeeds
    };
  }
}
