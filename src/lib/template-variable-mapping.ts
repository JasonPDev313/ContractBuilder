/**
 * Maps AI extractedData keys (camelCase) to template variable names (snake_case).
 * Some extractedData keys map to multiple template variables (e.g., venueName → golf_course_name, course_name).
 */
const DATA_TO_VARIABLE_MAP: Record<string, string[]> = {
  venueName: ['golf_course_name', 'course_name'],
  clientName: ['client_name'],
  clientAddress: ['client_address'],
  venueAddress: ['venue_address'],
  eventName: ['event_name'],
  eventDate: ['event_date'],
  eventFormat: ['event_format'],
  startFormat: ['start_format'],
  checkInTime: ['check_in_time'],
  startTime: ['start_time'],
  practiceRangeWindow: ['practice_range_window'],
  estimatedGroups: ['estimated_groups'],
  expectedPaceOfPlay: ['expected_pace_of_play'],
  pairingsDeadline: ['pairings_deadline'],
  finalRosterDeadline: ['final_roster_deadline'],
  primaryContactName: ['primary_contact_name'],
  primaryContactPhone: ['primary_contact_phone'],
  primaryContactEmail: ['primary_contact_email'],
  dayOfContactName: ['day_of_contact_name'],
  dayOfContactPhone: ['day_of_contact_phone'],
  pricingModel: ['pricing_model'],
  depositAmount: ['deposit_amount'],
  depositDueDate: ['deposit_due_date'],
  depositRefundPolicy: ['deposit_refund_policy'],
  additionalPaymentDueDate: ['additional_payment_due_date'],
  finalPaymentDueDate: ['final_payment_due_date'],
  guaranteedCountDueDate: ['guaranteed_count_due_date'],
  menuFinalizationDate: ['menu_finalization_date'],
  maxCartOccupancy: ['max_cart_occupancy'],
  signerName: ['signer_name', 'authorized_signer'],
  signerTitle: ['signer_title'],
  signerEmail: ['signer_email'],
  signerPhone: ['signer_phone'],
  governingLaw: ['governing_law'],
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Build a lookup from template variable name → value using extractedData.
 */
function buildVariableLookup(
  extractedData: Record<string, unknown>
): Record<string, string> {
  const lookup: Record<string, string> = {}

  for (const [dataKey, value] of Object.entries(extractedData)) {
    if (value === undefined || value === null || value === '') continue
    const stringValue = String(value)

    // Check explicit mapping
    const mappedVars = DATA_TO_VARIABLE_MAP[dataKey]
    if (mappedVars) {
      for (const varName of mappedVars) {
        lookup[varName] = stringValue
      }
    }

    // Also try camelCase → snake_case fallback
    const snakeKey = camelToSnake(dataKey)
    if (!lookup[snakeKey]) {
      lookup[snakeKey] = stringValue
    }
  }

  return lookup
}

/**
 * Replace {{variable_name}} placeholders in text with values from extractedData.
 * Returns the text with filled variables replaced and unfilled ones left as-is.
 */
export function replaceTemplateVariables(
  text: string,
  extractedData: Record<string, unknown>
): string {
  const lookup = buildVariableLookup(extractedData)

  return text.replace(/\{\{([^}]+)\}\}/g, (_match, varName: string) => {
    const trimmed = varName.trim()
    const value = lookup[trimmed]
    return value !== undefined ? value : `{{${trimmed}}}`
  })
}

/**
 * Count how many {{variables}} in the text have values vs total.
 */
export function getFilledVariableCount(
  text: string,
  extractedData: Record<string, unknown>
): { filled: number; total: number } {
  const lookup = buildVariableLookup(extractedData)
  const matches = text.match(/\{\{([^}]+)\}\}/g) || []

  // Deduplicate variable names
  const uniqueVars = new Set(
    matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim())
  )

  let filled = 0
  for (const varName of uniqueVars) {
    if (lookup[varName] !== undefined) {
      filled++
    }
  }

  return { filled, total: uniqueVars.size }
}

/**
 * Render text with variables replaced, returning segments for React rendering.
 * Filled variables return as plain text, unfilled as highlighted spans.
 */
export function getVariableSegments(
  text: string,
  extractedData: Record<string, unknown>
): Array<{ type: 'text' | 'filled' | 'unfilled'; content: string }> {
  const lookup = buildVariableLookup(extractedData)
  const segments: Array<{
    type: 'text' | 'filled' | 'unfilled'
    content: string
  }> = []
  const regex = /\{\{([^}]+)\}\}/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Text before the variable
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    const varName = match[1].trim()
    const value = lookup[varName]

    if (value !== undefined) {
      segments.push({ type: 'filled', content: value })
    } else {
      segments.push({ type: 'unfilled', content: `{{${varName}}}` })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last variable
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}
