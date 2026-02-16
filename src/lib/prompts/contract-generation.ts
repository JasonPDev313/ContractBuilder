import { GenerateContractInput } from '@/lib/validations/ai-contract-generation'
import { ContractType, getBlueprint } from '@/lib/contract-blueprints'

/**
 * Build system prompt for contract generation
 */
export function buildSystemPrompt(contractType: ContractType): string {
  const blueprint = getBlueprint(contractType)

  return `You are a commercial contract drafting assistant specializing in venue and event contracts.

CRITICAL RULES:
- You MUST output ONLY valid JSON matching the exact schema provided
- Do NOT include markdown code fences (\`\`\`json)
- Do NOT include explanatory text outside the JSON
- This is NOT legal advice - you provide sample contract language only
- Use clear, enforceable commercial contract language
- ALWAYS use the actual values provided in the prompt. NEVER use bracketed placeholders like [DEPOSIT AMOUNT] or [EVENT DATE] when the actual value has been given
- Only use placeholders for values that were NOT provided at all
- Do NOT cite specific statutes or case law unless directly relevant
- Keep section bodies focused and concise (150-400 words per section)
- Include all essential clauses for the contract type

OUTPUT SCHEMA (strict JSON only):
{
  "contractTitle": "string (e.g., ${blueprint.displayName} Agreement)",
  "intro": "optional preamble paragraph identifying parties and purpose",
  "sections": [
    {
      "title": "Section Title",
      "body": "Section content in plain text"
    }
  ],
  "exhibits": [
    {
      "title": "Exhibit title",
      "body": "Exhibit content"
    }
  ]
}

REQUIRED SECTIONS (include these in order):
${blueprint.sections.map((section, index) => `${index + 1}. ${section}`).join('\n')}

CONTRACT-SPECIFIC GUIDANCE:
${blueprint.specificInstructions}

Use standard commercial contract language appropriate for the specified tone and risk posture.`
}

/**
 * Build user prompt from input parameters
 */
export function buildUserPrompt(input: GenerateContractInput): string {
  const parts: string[] = []

  // Contract type and jurisdiction
  parts.push(`Please draft a complete ${input.contractType} contract.`)
  parts.push(`Jurisdiction: ${input.jurisdiction}`)
  parts.push(`Tone: ${input.tone}`)
  parts.push(`Risk posture: ${input.riskPosture}`)

  // Parties
  if (input.venueName || input.clientName) {
    parts.push(`\nParties:`)
    if (input.venueName) parts.push(`- Venue: ${input.venueName}`)
    if (input.clientName) parts.push(`- Client: ${input.clientName}`)
  }

  // Event details
  if (input.eventDate || input.location) {
    parts.push(`\nEvent Details:`)
    if (input.eventDate) parts.push(`- Date: ${input.eventDate}`)
    if (input.location) parts.push(`- Location: ${input.location}`)
  }

  // Key terms
  parts.push(`\nKey Terms to Include:`)

  if (input.pricing) {
    parts.push(`- Pricing: ${input.pricing}`)
  } else {
    parts.push(`- Pricing: Use placeholder [PRICING]`)
  }

  if (input.depositAmount) {
    parts.push(`- Deposit: ${input.depositAmount}`)
  } else {
    parts.push(`- Deposit: Use reasonable deposit terms with placeholders`)
  }

  if (input.depositDueDate) {
    parts.push(`- Deposit Due: ${input.depositDueDate}`)
  }

  if (input.paymentSchedule) {
    parts.push(`- Payment Schedule: ${input.paymentSchedule}`)
  } else {
    parts.push(`- Payment Schedule: Use standard payment terms`)
  }

  if (input.cancellationPolicy) {
    parts.push(`- Cancellation: ${input.cancellationPolicy}`)
  } else {
    parts.push(`- Cancellation: Include standard cancellation/refund provisions`)
  }

  if (input.weatherPolicy) {
    parts.push(`- Weather: ${input.weatherPolicy}`)
  } else {
    parts.push(`- Weather: Include weather contingency provisions if applicable`)
  }

  if (input.alcoholPolicy) {
    parts.push(`- Alcohol: ${input.alcoholPolicy}`)
  } else {
    parts.push(`- Alcohol: Include standard alcohol service/conduct provisions`)
  }

  if (input.liabilityTerms) {
    parts.push(`- Liability: ${input.liabilityTerms}`)
  } else {
    parts.push(`- Liability: Include standard waiver and indemnification`)
  }

  if (input.forceMajeure) {
    parts.push(`- Force Majeure: ${input.forceMajeure}`)
  }

  if (input.damagesLimits) {
    parts.push(`- Damages/Limits: ${input.damagesLimits}`)
  }

  // Additional terms
  if (input.additionalTerms) {
    parts.push(`\nAdditional Terms:\n${input.additionalTerms}`)
  }

  // Pass all extracted data so the AI has every field value
  if (input.allExtractedData && Object.keys(input.allExtractedData).length > 0) {
    const alreadyIncluded = new Set([
      'contractType', 'jurisdiction', 'tone', 'riskPosture',
      'venueName', 'clientName', 'eventDate', 'location',
      'pricing', 'depositAmount', 'depositDueDate', 'paymentSchedule',
      'alcoholPolicy', 'cancellationPolicy', 'weatherPolicy',
      'liabilityTerms', 'forceMajeure', 'damagesLimits', 'additionalTerms',
    ])

    const extra = Object.entries(input.allExtractedData)
      .filter(([key, value]) => !alreadyIncluded.has(key) && value != null && value !== '')
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
        return `- ${label}: ${String(value)}`
      })

    if (extra.length > 0) {
      parts.push(`\nAdditional Event Details:`)
      parts.push(...extra)
    }
  }

  parts.push(
    `\nGenerate a complete contract with all necessary sections. Use the specific values provided above — do NOT use placeholders like [AMOUNT] or [DATE] when the actual value has been given.`
  )

  return parts.join('\n')
}
