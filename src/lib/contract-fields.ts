import { type ContractType } from './contract-blueprints'

/**
 * Field tiers for contract validation:
 * A = Hard required — blocks execution (generate, send, export)
 * B = Recommended — shows warning but allows execution
 * C = Optional — no gate
 */
export type FieldTier = 'A' | 'B' | 'C'

export type FieldInputType = 'text' | 'textarea' | 'date' | 'number' | 'select'

export interface EssentialField {
  key: string
  label: string
  description?: string
  tier: FieldTier
  inputType?: FieldInputType
  section?: string
  selectOptions?: string[]
}

const GOLF_OUTING_FIELDS: EssentialField[] = [
  // Tier A — Hard Required (block execution)
  { key: 'clientName', label: 'Client Legal Name', description: 'Organization or individual legal name', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'clientAddress', label: 'Client Address', description: 'Client mailing address', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'venueName', label: 'Venue Name', description: 'Golf course or facility name', tier: 'A', inputType: 'text', section: 'Venue' },
  { key: 'eventDate', label: 'Event Date', description: 'Date of the golf outing', tier: 'A', inputType: 'date', section: 'Event Details' },
  { key: 'pricingModel', label: 'Pricing Structure', description: 'Per player, per foursome, or package', tier: 'A', inputType: 'select', section: 'Pricing & Payment', selectOptions: ['Per Player', 'Per Foursome', 'Flat Package', 'Custom'] },
  { key: 'depositAmount', label: 'Deposit Terms', description: 'Deposit amount or explicit confirmation of none', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },

  // Tier B — Recommended (warning only)
  { key: 'venueAddress', label: 'Venue Address', description: 'Course street address', tier: 'B', inputType: 'text', section: 'Venue' },
  { key: 'eventName', label: 'Event Name', description: 'Tournament or outing name', tier: 'B', inputType: 'text', section: 'Event Details' },
  { key: 'primaryContactName', label: 'Primary Contact', description: 'Name of primary contact', tier: 'B', inputType: 'text', section: 'Contacts' },
  { key: 'primaryContactPhone', label: 'Contact Phone', description: 'Primary contact phone number', tier: 'B', inputType: 'text', section: 'Contacts' },
  { key: 'primaryContactEmail', label: 'Contact Email', description: 'Primary contact email', tier: 'B', inputType: 'text', section: 'Contacts' },
  { key: 'dayOfContactName', label: 'Day-of Contact', description: 'On-site contact name', tier: 'B', inputType: 'text', section: 'Contacts' },
  { key: 'estimatedGroups', label: 'Estimated Groups', description: 'Number of foursomes', tier: 'B', inputType: 'number', section: 'Event Details' },
  { key: 'startTime', label: 'Start Time', description: 'Tee-off time', tier: 'B', inputType: 'text', section: 'Event Details' },
  { key: 'eventFormat', label: 'Event Format', description: 'Scramble, Best Ball, Stroke, etc.', tier: 'B', inputType: 'select', section: 'Event Details', selectOptions: ['Scramble', 'Best Ball', 'Stroke Play', 'Match Play', 'Alternate Shot', 'Captain\'s Choice', 'Other'] },
  { key: 'startFormat', label: 'Start Format', description: 'Shotgun or tee times', tier: 'B', inputType: 'select', section: 'Event Details', selectOptions: ['Shotgun Start', 'Tee Times', 'Modified Shotgun'] },
  { key: 'menuFinalizationDate', label: 'Menu Deadline', description: 'When menu selections are due', tier: 'B', inputType: 'date', section: 'Food & Beverage' },

  // Tier C — Optional
  { key: 'dayOfContactPhone', label: 'Day-of Phone', description: 'On-site contact phone', tier: 'C', inputType: 'text', section: 'Contacts' },
  { key: 'checkInTime', label: 'Check-In Time', description: 'Registration/check-in time', tier: 'C', inputType: 'text', section: 'Event Details' },
  { key: 'practiceRangeWindow', label: 'Practice Range', description: 'Practice facility access window', tier: 'C', inputType: 'text', section: 'Event Details' },
  { key: 'expectedPaceOfPlay', label: 'Pace of Play', description: 'Expected round duration', tier: 'C', inputType: 'text', section: 'Event Details' },
  { key: 'pairingsDeadline', label: 'Pairings Deadline', description: 'When pairings must be submitted', tier: 'C', inputType: 'date', section: 'Event Details' },
  { key: 'finalRosterDeadline', label: 'Roster Deadline', description: 'Final roster submission date', tier: 'C', inputType: 'date', section: 'Event Details' },
  { key: 'depositDueDate', label: 'Deposit Due Date', description: 'When deposit is due', tier: 'C', inputType: 'date', section: 'Pricing & Payment' },
  { key: 'depositRefundPolicy', label: 'Deposit Refund', description: 'Refundable or non-refundable', tier: 'C', inputType: 'select', section: 'Pricing & Payment', selectOptions: ['Refundable', 'Non-refundable', 'Partially Refundable'] },
  { key: 'additionalPaymentDueDate', label: 'Additional Payment Due', description: 'Interim payment date', tier: 'C', inputType: 'date', section: 'Pricing & Payment' },
  { key: 'finalPaymentDueDate', label: 'Final Payment Due', description: 'When final balance is due', tier: 'C', inputType: 'date', section: 'Pricing & Payment' },
  { key: 'guaranteedCountDueDate', label: 'Guaranteed Count Due', description: 'Deadline for final headcount', tier: 'C', inputType: 'date', section: 'Event Details' },
  { key: 'maxCartOccupancy', label: 'Cart Occupancy', description: 'Max passengers per cart', tier: 'C', inputType: 'number', section: 'Cart & Course' },
  { key: 'weatherPolicy', label: 'Weather Policy', description: 'Rainout and rescheduling terms', tier: 'C', inputType: 'textarea', section: 'Policies' },
  { key: 'cancellationPolicy', label: 'Cancellation Policy', description: 'Cancellation and refund terms', tier: 'C', inputType: 'textarea', section: 'Policies' },
]

const GOLF_LEAGUE_FIELDS: EssentialField[] = [
  { key: 'clientName', label: 'Client Legal Name', description: 'League organizer legal name', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'clientAddress', label: 'Client Address', description: 'Organizer mailing address', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'venueName', label: 'Venue Name', description: 'Golf course or facility name', tier: 'A', inputType: 'text', section: 'Venue' },
  { key: 'eventDate', label: 'League Start Date', description: 'First week of league play', tier: 'A', inputType: 'date', section: 'Schedule' },
  { key: 'pricing', label: 'Pricing Structure', description: 'Per-week or season pricing', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'depositAmount', label: 'Deposit Terms', description: 'Deposit amount or confirmation of none', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'leagueSchedule', label: 'League Schedule', description: 'Season length and weekly play times', tier: 'B', inputType: 'textarea', section: 'Schedule' },
  { key: 'playerMinimums', label: 'Player Minimums', description: 'Guaranteed minimum players per week', tier: 'B', inputType: 'number', section: 'Schedule' },
  { key: 'weeklyTeeTime', label: 'Weekly Tee Time', description: 'Day and time of weekly play', tier: 'B', inputType: 'text', section: 'Schedule' },
  { key: 'paymentTerms', label: 'Payment Terms', description: 'Payment schedule and billing', tier: 'B', inputType: 'textarea', section: 'Pricing & Payment' },
  { key: 'rainoutPolicy', label: 'Rainout Policy', description: 'Makeup policy for rained-out weeks', tier: 'C', inputType: 'textarea', section: 'Policies' },
  { key: 'noShowPolicy', label: 'No-Show Policy', description: 'Cancellation notice requirements', tier: 'C', inputType: 'textarea', section: 'Policies' },
  { key: 'coordinatorResponsibilities', label: 'Coordinator Duties', description: 'League organizer responsibilities', tier: 'C', inputType: 'textarea', section: 'Policies' },
  { key: 'cancellationPolicy', label: 'Cancellation Policy', description: 'League cancellation terms', tier: 'C', inputType: 'textarea', section: 'Policies' },
]

const WEDDING_FIELDS: EssentialField[] = [
  { key: 'clientName', label: 'Client Legal Name', description: 'Couple or booking party legal name', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'clientAddress', label: 'Client Address', description: 'Client mailing address', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'venueName', label: 'Venue Name', description: 'Wedding venue name', tier: 'A', inputType: 'text', section: 'Venue' },
  { key: 'eventDate', label: 'Wedding Date', description: 'Date of the wedding', tier: 'A', inputType: 'date', section: 'Event Details' },
  { key: 'pricing', label: 'Pricing', description: 'Venue rental and service fees', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'depositAmount', label: 'Deposit Terms', description: 'Deposit amount or confirmation of none', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'guestCount', label: 'Guest Count', description: 'Expected number of guests', tier: 'B', inputType: 'number', section: 'Event Details' },
  { key: 'ceremonyTime', label: 'Ceremony Time', description: 'Ceremony start time', tier: 'B', inputType: 'text', section: 'Event Details' },
  { key: 'receptionTime', label: 'Reception Time', description: 'Reception start and end times', tier: 'B', inputType: 'text', section: 'Event Details' },
  { key: 'paymentSchedule', label: 'Payment Schedule', description: 'Payment milestones', tier: 'B', inputType: 'textarea', section: 'Pricing & Payment' },
  { key: 'foodBeverage', label: 'Food & Beverage', description: 'Catering and bar services', tier: 'C', inputType: 'textarea', section: 'Food & Beverage' },
  { key: 'cancellationPolicy', label: 'Cancellation Policy', description: 'Cancellation and refund terms', tier: 'C', inputType: 'textarea', section: 'Policies' },
]

const SPECIAL_EVENT_FIELDS: EssentialField[] = [
  { key: 'clientName', label: 'Client Legal Name', description: 'Booking party legal name', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'clientAddress', label: 'Client Address', description: 'Client mailing address', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'venueName', label: 'Venue Name', description: 'Event venue or facility name', tier: 'A', inputType: 'text', section: 'Venue' },
  { key: 'eventDate', label: 'Event Date', description: 'Date of the event', tier: 'A', inputType: 'date', section: 'Event Details' },
  { key: 'pricing', label: 'Pricing', description: 'Venue rental and service fees', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'depositAmount', label: 'Deposit Terms', description: 'Deposit amount or confirmation of none', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'eventType', label: 'Event Type', description: 'Type of event (banquet, party, meeting, etc.)', tier: 'B', inputType: 'select', section: 'Event Details', selectOptions: ['Banquet', 'Corporate Meeting', 'Birthday Party', 'Retirement Party', 'Holiday Party', 'Fundraiser', 'Other'] },
  { key: 'guestCount', label: 'Guest Count', description: 'Expected number of attendees', tier: 'B', inputType: 'number', section: 'Event Details' },
  { key: 'roomRental', label: 'Room/Space Rental', description: 'Which room(s) and capacity', tier: 'B', inputType: 'text', section: 'Venue' },
  { key: 'foodBeverageMinimum', label: 'F&B Minimum', description: 'Food and beverage minimum spend', tier: 'B', inputType: 'text', section: 'Food & Beverage' },
  { key: 'paymentSchedule', label: 'Payment Schedule', description: 'Payment milestones', tier: 'C', inputType: 'textarea', section: 'Pricing & Payment' },
  { key: 'cancellationPolicy', label: 'Cancellation Policy', description: 'Cancellation and refund terms', tier: 'C', inputType: 'textarea', section: 'Policies' },
]

const OTHER_FIELDS: EssentialField[] = [
  { key: 'clientName', label: 'Client Legal Name', description: 'Client or counterparty legal name', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'clientAddress', label: 'Client Address', description: 'Client mailing address', tier: 'A', inputType: 'text', section: 'Client Info' },
  { key: 'venueName', label: 'Venue/Location', description: 'Location, venue, or provider name', tier: 'A', inputType: 'text', section: 'Venue' },
  { key: 'eventDate', label: 'Event/Effective Date', description: 'Date of the event or agreement effective date', tier: 'A', inputType: 'date', section: 'Details' },
  { key: 'pricing', label: 'Pricing', description: 'Total cost or pricing structure', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'depositAmount', label: 'Deposit Terms', description: 'Deposit amount or confirmation of none', tier: 'A', inputType: 'text', section: 'Pricing & Payment' },
  { key: 'contractSubtype', label: 'Contract Type/Purpose', description: 'What kind of contract (event, vendor, rental, etc.)', tier: 'B', inputType: 'text', section: 'Details' },
  { key: 'contractDescription', label: 'Description of Services', description: 'What is being provided or agreed to', tier: 'B', inputType: 'textarea', section: 'Details' },
  { key: 'guestCount', label: 'Expected Attendance', description: 'Number of attendees or participants', tier: 'B', inputType: 'number', section: 'Details' },
  { key: 'paymentTerms', label: 'Payment Terms', description: 'Payment schedule and method', tier: 'C', inputType: 'textarea', section: 'Pricing & Payment' },
  { key: 'cancellationPolicy', label: 'Cancellation Policy', description: 'Cancellation terms', tier: 'C', inputType: 'textarea', section: 'Policies' },
  { key: 'additionalTerms', label: 'Special Requirements', description: 'Any unique terms or requirements', tier: 'C', inputType: 'textarea', section: 'Policies' },
]

/**
 * Get all fields for a specific contract type
 */
export function getEssentialFields(contractType?: ContractType): EssentialField[] {
  if (!contractType) {
    return OTHER_FIELDS
  }

  switch (contractType) {
    case 'GOLF_OUTING':
      return GOLF_OUTING_FIELDS
    case 'GOLF_LEAGUE':
      return GOLF_LEAGUE_FIELDS
    case 'WEDDING':
      return WEDDING_FIELDS
    case 'SPECIAL_EVENT':
      return SPECIAL_EVENT_FIELDS
    case 'OTHER':
      return OTHER_FIELDS
    default:
      return OTHER_FIELDS
  }
}

/**
 * Get fields filtered by tier
 */
export function getFieldsByTier(
  contractType: ContractType | undefined,
  tier: FieldTier
): EssentialField[] {
  return getEssentialFields(contractType).filter((f) => f.tier === tier)
}

/**
 * Check field completeness across all tiers
 */
export function checkFieldCompleteness(
  contractType: ContractType,
  extractedData: Record<string, unknown>
): {
  isComplete: boolean
  completedCount: number
  totalCount: number
  missingFields: EssentialField[]
} {
  const essentialFields = getEssentialFields(contractType)
  const completedFields = essentialFields.filter((field) => {
    const value = extractedData[field.key]
    return value !== undefined && value !== null && value !== ''
  })

  const missingFields = essentialFields.filter((field) => {
    const value = extractedData[field.key]
    return value === undefined || value === null || value === ''
  })

  return {
    isComplete: completedFields.length === essentialFields.length,
    completedCount: completedFields.length,
    totalCount: essentialFields.length,
    missingFields,
  }
}

/**
 * Validate contract data for execution (generate, send, export).
 * Returns missing required (Tier A) fields and warning (Tier B) fields.
 */
export function validateContractForExecution(
  contractType: ContractType | undefined,
  extractedData: Record<string, unknown>
): {
  canExecute: boolean
  missingRequired: EssentialField[]
  warnings: EssentialField[]
} {
  const fields = getEssentialFields(contractType)

  const isMissing = (field: EssentialField) => {
    const value = extractedData[field.key]
    return value === undefined || value === null || value === ''
  }

  const missingRequired = fields.filter((f) => f.tier === 'A' && isMissing(f))
  const warnings = fields.filter((f) => f.tier === 'B' && isMissing(f))

  return {
    canExecute: missingRequired.length === 0,
    missingRequired,
    warnings,
  }
}

/**
 * Get all missing fields grouped by tier.
 */
export function getMissingFields(
  contractType: ContractType | undefined,
  extractedData: Record<string, unknown>
): {
  required: EssentialField[]
  recommended: EssentialField[]
  optional: EssentialField[]
  all: EssentialField[]
} {
  const fields = getEssentialFields(contractType)

  const isMissing = (field: EssentialField) => {
    const value = extractedData[field.key]
    return value === undefined || value === null || value === ''
  }

  const required = fields.filter((f) => f.tier === 'A' && isMissing(f))
  const recommended = fields.filter((f) => f.tier === 'B' && isMissing(f))
  const optional = fields.filter((f) => f.tier === 'C' && isMissing(f))

  return {
    required,
    recommended,
    optional,
    all: [...required, ...recommended, ...optional],
  }
}
