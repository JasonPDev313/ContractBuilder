/**
 * Venue Policies Resolution & Content Builder
 *
 * Resolves which org-level policies apply to a given contract type,
 * then builds a formatted "Venue Policies" section body.
 */

import type { OrgContractDefaults } from '@prisma/client'

export interface VenuePolicy {
  title: string
  content: string
}

/**
 * Get all venue policies that apply to a given contract type.
 * Returns policies in stable order: Weather → Alcohol → Liability → Custom policies.
 */
export function getApplicableVenuePolicies(
  orgDefaults: OrgContractDefaults | null,
  contractType: string
): VenuePolicy[] {
  if (!orgDefaults) return []

  const policies: VenuePolicy[] = []

  // Weather Policy
  if (
    orgDefaults.defaultWeatherPolicy &&
    orgDefaults.defaultWeatherPolicy.trim() &&
    policyAppliesToType(orgDefaults.weatherPolicyAppliesTo, contractType)
  ) {
    policies.push({
      title: 'Weather Policy',
      content: orgDefaults.defaultWeatherPolicy.trim(),
    })
  }

  // Alcohol Policy
  if (
    orgDefaults.defaultAlcoholPolicy &&
    orgDefaults.defaultAlcoholPolicy.trim() &&
    policyAppliesToType(orgDefaults.alcoholPolicyAppliesTo, contractType)
  ) {
    policies.push({
      title: 'Alcohol Policy',
      content: orgDefaults.defaultAlcoholPolicy.trim(),
    })
  }

  // Liability Terms
  if (
    orgDefaults.defaultLiabilityTerms &&
    orgDefaults.defaultLiabilityTerms.trim() &&
    policyAppliesToType(orgDefaults.liabilityTermsAppliesTo, contractType)
  ) {
    policies.push({
      title: 'Liability Terms',
      content: orgDefaults.defaultLiabilityTerms.trim(),
    })
  }

  // Custom Policies
  const customPolicies = orgDefaults.customPolicies as
    | Array<{ name: string; content: string; appliesTo?: string[] | null }>
    | null

  if (customPolicies && Array.isArray(customPolicies)) {
    for (const cp of customPolicies) {
      if (
        cp.name?.trim() &&
        cp.content?.trim() &&
        policyAppliesToType(cp.appliesTo ?? null, contractType)
      ) {
        policies.push({
          title: cp.name.trim(),
          content: cp.content.trim(),
        })
      }
    }
  }

  return policies
}

/**
 * Build the formatted body text for a "Venue Policies" section.
 * Each policy: title on its own line, blank line, content, blank line before next.
 */
export function buildVenuePoliciesSectionBody(policies: VenuePolicy[]): string {
  return policies
    .map((p) => `${p.title}\n\n${p.content}`)
    .join('\n\n')
}

/**
 * Check if a policy's appliesTo array includes the given contract type.
 * Returns false if appliesTo is null/empty (policy must be explicitly assigned).
 */
function policyAppliesToType(
  appliesTo: unknown,
  contractType: string
): boolean {
  if (!appliesTo || !Array.isArray(appliesTo) || appliesTo.length === 0) {
    return false
  }
  return appliesTo.includes(contractType)
}
