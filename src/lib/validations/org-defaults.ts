import { z } from 'zod'

const contractTypeArray = z
  .array(z.enum(['GOLF_OUTING', 'GOLF_LEAGUE', 'WEDDING', 'SPECIAL_EVENT', 'OTHER']))
  .optional()
  .nullable()

export const upsertOrgDefaultsSchema = z.object({
  // Venue info
  venueName: z.string().max(200).optional().nullable(),
  venueAddress: z.string().max(500).optional().nullable(),

  // Signer info
  signerName: z.string().max(200).optional().nullable(),
  signerTitle: z.string().max(200).optional().nullable(),
  signerEmail: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val))
    .pipe(z.string().email().nullable().optional().or(z.literal(null))),
  signerPhone: z.string().max(50).optional().nullable(),

  // Payment defaults
  defaultDepositPercent: z.number().int().min(0).max(100).optional().nullable(),
  defaultPaymentTerms: z.string().max(1000).optional().nullable(),
  defaultCancellationPolicy: z.string().max(5000).optional().nullable(),

  // Policy defaults
  defaultWeatherPolicy: z.string().max(5000).optional().nullable(),
  weatherPolicyAppliesTo: contractTypeArray,
  defaultAlcoholPolicy: z.string().max(5000).optional().nullable(),
  alcoholPolicyAppliesTo: contractTypeArray,
  defaultLiabilityTerms: z.string().max(5000).optional().nullable(),
  liabilityTermsAppliesTo: contractTypeArray,

  // Custom policies (unlimited)
  customPolicies: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        content: z.string().min(1).max(5000),
        appliesTo: contractTypeArray,
      })
    )
    .optional()
    .nullable(),

  // Legal
  jurisdiction: z.string().max(200).optional().nullable(),
  governingLaw: z.string().max(200).optional().nullable(),
})

export type UpsertOrgDefaultsInput = z.infer<typeof upsertOrgDefaultsSchema>
