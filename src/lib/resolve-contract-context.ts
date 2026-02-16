import type { OrgContractDefaults } from '@prisma/client'

/**
 * Maps org default fields to extractedData keys and merges.
 * extractedData always wins on conflicts (spread order).
 */
export function resolveContractContext(
  orgDefaults: OrgContractDefaults | null,
  extractedData: Record<string, unknown>
): Record<string, unknown> {
  if (!orgDefaults) return extractedData

  const defaults: Record<string, unknown> = {}

  // Direct mappings (org field name === extractedData key)
  if (orgDefaults.venueName) defaults.venueName = orgDefaults.venueName
  if (orgDefaults.venueAddress) defaults.venueAddress = orgDefaults.venueAddress
  if (orgDefaults.jurisdiction) defaults.jurisdiction = orgDefaults.jurisdiction
  if (orgDefaults.governingLaw) defaults.governingLaw = orgDefaults.governingLaw

  // Signer info
  if (orgDefaults.signerName) defaults.signerName = orgDefaults.signerName
  if (orgDefaults.signerTitle) defaults.signerTitle = orgDefaults.signerTitle
  if (orgDefaults.signerEmail) defaults.signerEmail = orgDefaults.signerEmail
  if (orgDefaults.signerPhone) defaults.signerPhone = orgDefaults.signerPhone

  // Policy defaults → extractedData keys (strip "default" prefix)
  if (orgDefaults.defaultCancellationPolicy)
    defaults.cancellationPolicy = orgDefaults.defaultCancellationPolicy
  if (orgDefaults.defaultWeatherPolicy)
    defaults.weatherPolicy = orgDefaults.defaultWeatherPolicy
  if (orgDefaults.defaultAlcoholPolicy)
    defaults.alcoholPolicy = orgDefaults.defaultAlcoholPolicy
  if (orgDefaults.defaultLiabilityTerms)
    defaults.liabilityTerms = orgDefaults.defaultLiabilityTerms

  // Payment defaults
  if (orgDefaults.defaultDepositPercent != null)
    defaults.defaultDepositPercent = orgDefaults.defaultDepositPercent
  if (orgDefaults.defaultPaymentTerms)
    defaults.paymentTerms = orgDefaults.defaultPaymentTerms

  // Custom policies
  const customPolicies = orgDefaults.customPolicies as
    | Array<{ name: string; content: string }>
    | null
  if (customPolicies && customPolicies.length > 0) {
    defaults.customPolicies = customPolicies
  }

  // Merge: org defaults as base, extractedData wins on conflict
  return { ...defaults, ...extractedData }
}

/**
 * Build a human-readable summary of org defaults for the AI prompt.
 * Returns null if no defaults are set.
 */
export function summarizeOrgDefaults(
  orgDefaults: OrgContractDefaults | null
): string | null {
  if (!orgDefaults) return null

  const lines: string[] = []

  if (orgDefaults.venueName) lines.push(`Venue Name: ${orgDefaults.venueName}`)
  if (orgDefaults.venueAddress) lines.push(`Venue Address: ${orgDefaults.venueAddress}`)
  if (orgDefaults.signerName) lines.push(`Authorized Signer: ${orgDefaults.signerName}`)
  if (orgDefaults.signerTitle) lines.push(`Signer Title: ${orgDefaults.signerTitle}`)
  if (orgDefaults.signerEmail) lines.push(`Signer Email: ${orgDefaults.signerEmail}`)
  if (orgDefaults.signerPhone) lines.push(`Signer Phone: ${orgDefaults.signerPhone}`)
  if (orgDefaults.defaultDepositPercent != null)
    lines.push(`Default Deposit: ${orgDefaults.defaultDepositPercent}%`)
  if (orgDefaults.defaultPaymentTerms)
    lines.push(`Payment Terms: ${orgDefaults.defaultPaymentTerms}`)
  if (orgDefaults.defaultCancellationPolicy)
    lines.push(`Cancellation Policy: ${orgDefaults.defaultCancellationPolicy}`)
  if (orgDefaults.defaultWeatherPolicy)
    lines.push(`Weather Policy: ${orgDefaults.defaultWeatherPolicy}`)
  if (orgDefaults.defaultAlcoholPolicy)
    lines.push(`Alcohol Policy: ${orgDefaults.defaultAlcoholPolicy}`)
  if (orgDefaults.defaultLiabilityTerms)
    lines.push(`Liability Terms: ${orgDefaults.defaultLiabilityTerms}`)
  if (orgDefaults.jurisdiction) lines.push(`Jurisdiction: ${orgDefaults.jurisdiction}`)
  if (orgDefaults.governingLaw) lines.push(`Governing Law: ${orgDefaults.governingLaw}`)

  // Custom policies
  const customPolicies = orgDefaults.customPolicies as
    | Array<{ name: string; content: string }>
    | null
  if (customPolicies && customPolicies.length > 0) {
    for (const policy of customPolicies) {
      lines.push(`${policy.name}: ${policy.content}`)
    }
  }

  return lines.length > 0 ? lines.join('\n') : null
}
