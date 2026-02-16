/**
 * Contract Type Blueprints
 * Defines the canonical section structure for each contract type
 */

export type ContractType = 'GOLF_OUTING' | 'GOLF_LEAGUE' | 'WEDDING' | 'SPECIAL_EVENT' | 'OTHER'

export interface ContractBlueprint {
  type: ContractType
  displayName: string
  description: string
  sections: string[]
  specificInstructions: string
}

export const CONTRACT_BLUEPRINTS: Record<ContractType, ContractBlueprint> = {
  WEDDING: {
    type: 'WEDDING',
    displayName: 'Wedding',
    description: 'Complete wedding venue agreement with ceremony and reception terms',
    sections: [
      'Parties & Event Overview',
      'Event Details & Schedule',
      'Venue Rental & Scope of Services',
      'Site Rules, Access & Capacity',
      'Pricing Structure & Payment Terms',
      'Deposit & Refund Policy',
      'Guest Count & Guarantees',
      'Food & Beverage Terms',
      'Bar Service & Alcohol Liability',
      'Outside Vendors',
      'Decorations, Setup & Property Use',
      'Photography, Videography & Marketing',
      'Noise, Curfew & Overtime',
      'Guest Conduct, Safety & Security',
      'Damage, Indemnification & Limitation of Liability',
      'Insurance Requirements',
      'Weather / Rain Plan',
      'Force Majeure',
      'Cancellation (Client)',
      'Venue Cancellation Rights',
      'Rescheduling Policy',
      'Compliance With Laws',
      'Governing Law & Dispute Resolution',
      'Entire Agreement & Amendments',
      'Signatures',
    ],
    specificInstructions: `This is a WEDDING venue agreement. Include:
- Ceremony and reception timing/locations
- Bridal suite access if applicable
- Decorating restrictions (no tape on walls, no glitter, no adhesives, etc.)
- Music/noise cutoff times and overtime fees
- Vendor coordination and insurance requirements
- Guest count guarantees and minimums/maximums
- Alcohol service restrictions (licensed bartender required, no outside alcohol)
- Photography rights (venue may use non-identifying photos for marketing)
- Cleanup and breakdown expectations
- Damage and indemnification terms
- Weather/rain plan for outdoor portions
Use elegant but clear language appropriate for a formal event.`,
  },

  GOLF_OUTING: {
    type: 'GOLF_OUTING',
    displayName: 'Golf Outing',
    description: 'One-time golf tournament or corporate outing agreement',
    sections: [
      'Event Details',
      'Course Access',
      'Pricing & Payment',
      'Deposit',
      'Cancellation',
      'Force Majeure',
      'Weather Policy',
      'Food & Beverage',
      'Alcohol Policy',
      'Cart Policy',
      'Pace of Play',
      'Conduct',
      'Damage & Liability',
      'Insurance',
      'Rescheduling',
      'Governing Law',
      'Entire Agreement',
      'Signatures',
    ],
    specificInstructions: `This is a GOLF OUTING agreement (one-time event). Include:
- Shotgun start vs. tee time format
- Cart rental and cart path rules
- Pace of play expectations (4-hour round, marshal enforcement)
- Food/beverage package details (boxed lunch, on-course refreshments, post-round meal)
- Rainout/weather rescheduling policy (must reschedule within 90 days, no refunds)
- Alcohol service rules (beer/wine only, no hard liquor, responsible service)
- Course damage liability (divot repair, greens protection)
- Player conduct and dress code
Use professional but friendly tone suitable for corporate outings.`,
  },

  GOLF_LEAGUE: {
    type: 'GOLF_LEAGUE',
    displayName: 'Golf League',
    description: 'Recurring golf league with weekly play and season-long commitment',
    sections: [
      'League Information',
      'Schedule & Tee Times',
      'Pricing & Fees',
      'Payment Terms',
      'Player Minimums',
      'Coordinator Responsibilities',
      'Rainout Policy',
      'No-Show Policy',
      'Cart Policy',
      'Alcohol Policy',
      'Conduct',
      'Competition Rules',
      'Damage & Liability',
      'Insurance',
      'Rescheduling',
      'Force Majeure',
      'Governing Law',
      'Entire Agreement',
      'Signatures',
    ],
    specificInstructions: `This is a GOLF LEAGUE agreement (recurring weekly play). Include:
- Season length and weekly schedule (e.g., "12-week league, every Tuesday 5:30pm shotgun")
- Player minimum guarantee (e.g., "Organizer guarantees 36 players minimum per week")
- Payment structure (weekly vs. season upfront vs. per-round billing)
- Rainout makeup policy (rained-out weeks rescheduled within season)
- No-show/cancellation policy (must cancel 48 hours advance or charged)
- League coordinator responsibilities (collect payments, manage roster, communicate with course)
- Competition format and scoring (if applicable)
- Cart and alcohol policies
- End-of-season payout or banquet terms (if applicable)
Use clear, structured language suitable for recurring business relationship.`,
  },

  SPECIAL_EVENT: {
    type: 'SPECIAL_EVENT',
    displayName: 'Banquet/Special Event',
    description: 'General banquet, party, corporate event, or private function at venue',
    sections: [
      'Parties & Event Overview',
      'Event Details & Schedule',
      'Venue Rental & Scope of Services',
      'Site Rules, Access & Capacity',
      'Pricing Structure & Payment Terms',
      'Deposit & Refund Policy',
      'Guest Count & Guarantees',
      'Food & Beverage Terms',
      'Bar Service & Alcohol Liability',
      'Outside Vendors',
      'Decorations, Setup & Property Use',
      'Audio / Visual & Entertainment',
      'Photography & Marketing',
      'Noise, Curfew & Overtime',
      'Guest Conduct, Safety & Security',
      'Damage, Indemnification & Limitation of Liability',
      'Insurance Requirements',
      'Weather / Outdoor Contingency',
      'Force Majeure',
      'Cancellation (Client)',
      'Venue Cancellation Rights',
      'Rescheduling Policy',
      'Compliance With Laws',
      'Governing Law & Dispute Resolution',
      'Entire Agreement & Amendments',
      'Signatures',
    ],
    specificInstructions: `This is a BANQUET / SPECIAL EVENT agreement covering birthday parties, corporate events, bridal showers, celebrations of life, fundraisers, holiday parties, private dinners, and any non-wedding event. Include:
- Event type and name
- Room rental details (which room, capacity, included equipment)
- Food & beverage minimums and pricing structure
- Guest count guarantees (final count due X days before, billed for guaranteed minimum)
- Setup and cleanup times with breakdown deadlines
- AV equipment and entertainment noise limits
- Decorating guidelines (no confetti, glitter, adhesives, open flames)
- Outside vendor coordination and insurance requirements
- Alcohol service policies (venue-controlled, no outside alcohol)
- Damage and indemnification terms
- Weather contingency for outdoor portions
Use professional but flexible language suitable for various event types.`,
  },

  OTHER: {
    type: 'OTHER',
    displayName: 'Custom Contract',
    description: 'Fully customizable contract for any type of agreement',
    sections: [
      'Parties & Overview',
      'Scope of Services',
      'Schedule & Term',
      'Pricing & Payment',
      'Responsibilities',
      'Cancellation',
      'Liability & Indemnification',
      'Insurance',
      'Force Majeure',
      'Governing Law & Dispute Resolution',
      'Entire Agreement & Amendments',
      'Signatures',
    ],
    specificInstructions: `This is a CUSTOM contract. The user described what they need during the conversation.
IMPORTANT: Adapt the section structure to match the specific contract type described. For example:
- Event contracts → add Event Details, Food & Beverage, Decorations, Noise/Curfew, Guest Conduct sections
- Vendor agreements → add Scope of Work, Deliverables, Intellectual Property, Confidentiality sections
- Facility rentals → add Facility Access, Site Rules, Maintenance, Utilities sections
- Sponsorship agreements → add Sponsorship Benefits, Marketing Rights, Exclusivity sections
Use the base sections as a minimum framework, then ADD sections appropriate to the described use case.
Use clear, professional language. Include standard legal protections.`,
  },
}

/**
 * Get blueprint by contract type
 */
export function getBlueprint(type: ContractType): ContractBlueprint {
  return CONTRACT_BLUEPRINTS[type]
}

/**
 * Get all contract types for dropdown
 */
export function getContractTypes(): Array<{
  value: ContractType
  label: string
  description: string
}> {
  return Object.values(CONTRACT_BLUEPRINTS).map((blueprint) => ({
    value: blueprint.type,
    label: blueprint.displayName,
    description: blueprint.description,
  }))
}
