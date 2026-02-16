import { type ContractType } from './contract-blueprints'

export interface DefaultSectionDefinition {
  title: string
  body: string
  order: number
  isRequired: boolean
}

export const GOLF_OUTING_DEFAULT_SECTIONS: DefaultSectionDefinition[] = [
  {
    title: 'Parties & Event Overview',
    body: `GOLF OUTING EVENT AGREEMENT

This Golf Outing Event Agreement ("Agreement") is entered into between:

Venue: {{golf_course_name}}, located at {{venue_address}} ("Course")
Client: {{client_name}}, located at {{client_address}} ("Client")

Collectively referred to as the "Parties."

Event Name: {{event_name}}
Event Date: {{event_date}}
Event Location: {{course_name}}

Client agrees to host a golf outing or tournament event ("Event") at the Course on the Event Date subject to the terms of this Agreement. Client shall designate a primary contact and an on-site contact for the Event.

Primary Contact: {{primary_contact_name}} / {{primary_contact_phone}} / {{primary_contact_email}}
Day-of Contact: {{day_of_contact_name}} / {{day_of_contact_phone}}

If the Event is conducted for charitable purposes, Client represents that it has all necessary authority and registrations required by law.`,
    order: 0,
    isRequired: true,
  },
  {
    title: 'Event Format & Schedule',
    body: `Event format shall be: {{event_format}}.

Schedule:

Check-In Time: {{check_in_time}}
Start Format: {{start_format}}
Start Time: {{start_time}}
Practice Range Access: {{practice_range_window}}
Estimated Groups: {{estimated_groups}}
Expected Pace of Play: {{expected_pace_of_play}}
Pairings Deadline: {{pairings_deadline}}
Final Roster Deadline: {{final_roster_deadline}}

The Course reserves the right to adjust tee assignments, start procedures, or timing as necessary for safety, pace of play, or operational reasons.`,
    order: 1,
    isRequired: true,
  },
  {
    title: 'Course Access & Facility Use',
    body: `Client shall have access to the following facilities:

Golf course for play
Practice facilities (if included)
Clubhouse and designated event areas
Staging areas for registration or sponsors (if approved)

Unless expressly stated otherwise, the Course remains open to public play outside the reserved tee block. Client shall comply with all Course rules regarding facility usage, signage, and equipment placement.

Parking shall be in designated areas only.`,
    order: 2,
    isRequired: true,
  },
  {
    title: 'Pricing Structure & Inclusions',
    body: `The Event pricing shall be as follows:

Pricing Model: {{pricing_model}}

Package Inclusions may include:

Greens fees
Golf carts
Practice balls
Scorecards or scoring services
Tournament setup items
Contest markers
Food and beverage (if applicable)
Awards or prizes (if provided by Course)

Food and beverage pricing and minimums are described separately if applicable.

Taxes, service charges, and gratuities shall be applied as required by law or policy.

Final billing adjustments shall be made based on actual participation or guaranteed counts as described below.`,
    order: 3,
    isRequired: true,
  },
  {
    title: 'Deposit & Payment Terms',
    body: `A deposit of {{deposit_amount}} is required to reserve the Event date.

Deposit Terms:

Deposit Due Date: {{deposit_due_date}}
Deposit is {{deposit_refund_policy}} as described herein.
Deposit shall be applied toward the total Event balance.

Payment Schedule:

Additional Payment Due: {{additional_payment_due_date}}
Final Payment Due: {{final_payment_due_date}}

Late payments may result in cancellation or additional fees. The Course reserves the right to suspend services for nonpayment.

Client shall be responsible for any payment processing fees or chargeback costs resulting from disputed payments.`,
    order: 4,
    isRequired: true,
  },
  {
    title: 'Guaranteed Count & Final Billing',
    body: `Client shall provide a final guaranteed participant count by {{guaranteed_count_due_date}}.

Billing shall be based on the greater of:

The guaranteed count, or
The actual number of participants.

Minimum revenue requirements may apply as stated in pricing.`,
    order: 5,
    isRequired: true,
  },
  {
    title: 'Food & Beverage Operations',
    body: `If food and beverage services are included:

Menu selections must be finalized by {{menu_finalization_date}}.
The Course will accommodate reasonable dietary requests when possible.
Outside food or beverage is prohibited unless approved in writing.
Leftover food handling shall comply with health regulations and Course policy.

Meal timing shall occur as scheduled by mutual agreement.`,
    order: 6,
    isRequired: true,
  },
  {
    title: 'Alcohol Service',
    body: `If alcoholic beverages are provided:

The Course retains sole control over alcohol service.
Valid identification is required for service.
The Course reserves the right to refuse service to any individual.
Outside alcohol is prohibited.
Alcohol service may end prior to Event conclusion at the Course's discretion.

Client agrees to promote responsible consumption and may be required to arrange transportation options if alcohol is served.`,
    order: 7,
    isRequired: true,
  },
  {
    title: 'Golf Cart Policy',
    body: `Golf carts are provided subject to Course rules:

Maximum occupancy: {{max_cart_occupancy}}
Private carts permitted only with prior approval.
Drivers must meet age and licensing requirements.
Cart restrictions may be imposed based on course conditions.
Client is responsible for damage caused by participants.`,
    order: 8,
    isRequired: true,
  },
  {
    title: 'Pace of Play & Tournament Operations',
    body: `Participants must maintain pace of play consistent with Course standards.

The Course may enforce:

Pickup rules
Maximum score limits
Marshal instructions
Adjustments to tournament procedures

Failure to comply may result in removal from the course without refund.`,
    order: 9,
    isRequired: true,
  },
  {
    title: 'Code of Conduct',
    body: `All participants must comply with Course policies and applicable laws.

Prohibited conduct includes:

Harassment or discrimination
Disorderly or unsafe behavior
Illegal substances
Damage to property

The Course reserves the right to remove individuals for violations.`,
    order: 10,
    isRequired: true,
  },
  {
    title: 'Weather Policy',
    body: `The Course retains sole authority to determine whether conditions are safe and playable.

Weather determinations may include:

Delays
Suspension of play
Course closure

Partial play may qualify for credits at the Course's discretion.

No guarantees are made regarding weather conditions.`,
    order: 11,
    isRequired: true,
  },
  {
    title: 'Cancellation (Client)',
    body: `Client cancellations must be submitted in writing.

Cancellation fees may apply based on timing, including forfeiture of deposits and other damages representing lost business opportunities.`,
    order: 12,
    isRequired: true,
  },
  {
    title: 'Course Cancellation Rights',
    body: `The Course may cancel or terminate the Agreement due to:

Nonpayment
Safety concerns
Property damage
Breach of Agreement
Conditions beyond reasonable control

Refunds or credits shall be determined based on circumstances.`,
    order: 13,
    isRequired: true,
  },
  {
    title: 'Force Majeure',
    body: `Neither Party shall be liable for failure to perform due to events beyond reasonable control, including but not limited to:

Severe weather
Natural disasters
Government actions
Utility interruptions
Property damage
Emergencies

The Parties shall attempt to reschedule when feasible.`,
    order: 14,
    isRequired: true,
  },
  {
    title: 'Damage & Indemnification',
    body: `Client assumes responsibility for participants and guests.

Client agrees to:

Pay for damages caused by attendees
Indemnify and hold harmless the Course from claims arising from the Event
Acknowledge the inherent risks associated with golf activities

The Course's liability shall be limited to amounts paid under this Agreement to the maximum extent permitted by law.

The Course is not responsible for lost or stolen property.`,
    order: 15,
    isRequired: true,
  },
  {
    title: 'Insurance Requirements',
    body: `Client may be required to provide event liability insurance naming the Course as an additional insured.

Proof of insurance must be provided upon request.`,
    order: 16,
    isRequired: true,
  },
  {
    title: 'Rescheduling Policy',
    body: `Rescheduling requests must be made in writing and are subject to availability.

Additional fees or pricing adjustments may apply.

Credits may expire if not used within an agreed period.`,
    order: 17,
    isRequired: true,
  },
  {
    title: 'Governing Law & Dispute Resolution',
    body: `This Agreement shall be governed by the laws of the state in which the Course is located.

The Parties agree to attempt good-faith resolution of disputes prior to legal action.

Venue for any legal proceedings shall be in the jurisdiction where the Course is located unless otherwise required by law.`,
    order: 18,
    isRequired: true,
  },
  {
    title: 'Entire Agreement & Contract Mechanics',
    body: `This Agreement represents the entire understanding between the Parties and supersedes prior communications.

Modifications must be in writing and signed by both Parties.

If any provision is found unenforceable, the remaining provisions shall remain in effect.

Notices may be delivered by electronic communication where permitted by law.

Electronic signatures shall be deemed valid.`,
    order: 19,
    isRequired: true,
  },
  {
    title: 'Signatures',
    body: `Client:

Name: __________________________
Title: __________________________
Organization: ____________________
Signature: _______________________
Date: ___________________________

Course Representative:

Name: __________________________
Title: __________________________
Signature: _______________________
Date: ___________________________`,
    order: 20,
    isRequired: true,
  },
]

export const GOLF_LEAGUE_DEFAULT_SECTIONS: DefaultSectionDefinition[] = [
  {
    title: 'League Information',
    body: `GOLF LEAGUE AGREEMENT

This Golf League Agreement ("Agreement") is entered into between:

Venue: {{golf_course_name}}, located at {{venue_address}} ("Course")
League / Organizer: {{league_name}}, located at {{league_address}} ("League")

Collectively referred to as the "Parties."

League Name: {{league_name}}
Season Dates: {{season_start_date}} to {{season_end_date}}
Primary Contact: {{primary_contact_name}} / {{primary_contact_phone}} / {{primary_contact_email}}

League agrees to organize and operate a golf league at the Course during the Season Dates. League shall designate one primary coordinator responsible for communications, scheduling, and payment coordination.`,
    order: 0,
    isRequired: true,
  },
  {
    title: 'Schedule & Tee Times',
    body: `League play will occur on: {{league_day_of_week}}.

Tee time block: {{league_start_time}} to {{league_end_time}}.
Start format: {{start_format}}.
Number of weeks: {{number_of_weeks}}.

The Course reserves the right to adjust tee time assignments as needed for maintenance, events, weather, or operational requirements. The Course will make reasonable efforts to provide notice of changes.`,
    order: 1,
    isRequired: true,
  },
  {
    title: 'Pricing & Fees',
    body: `League fees shall be as follows:

Greens fee per player: \${{greens_fee_per_player}}
Cart fee: \${{cart_fee}} {{cart_fee_type}}
Range balls: {{range_balls_included}}
Other fees (if applicable): {{other_fees}}

Taxes and applicable charges may apply.`,
    order: 2,
    isRequired: true,
  },
  {
    title: 'Payment Terms',
    body: `Payment responsibility: {{payment_responsibility}}.

Payment schedule: {{payment_schedule}}.
Payments are due by: {{payment_due_date}}.

Late payments may result in loss of tee time privileges, suspension of participation, or additional fees. The Course reserves the right to suspend services for nonpayment.`,
    order: 3,
    isRequired: true,
  },
  {
    title: 'Player Minimums',
    body: `League agrees to a minimum of {{minimum_players_per_week}} players per week, or a minimum weekly revenue commitment of \${{minimum_weekly_revenue}}, as applicable.

If League attendance falls below the minimum, League may be responsible for the shortfall as stated in pricing.`,
    order: 4,
    isRequired: true,
  },
  {
    title: 'Coordinator Responsibilities',
    body: `League shall provide:

Weekly headcount submission by: {{headcount_deadline}}
Pairings or starting assignments by: {{pairings_deadline}}
Score reporting (if applicable) by: {{score_reporting_deadline}}

League is responsible for communicating rules and expectations to participants.`,
    order: 5,
    isRequired: true,
  },
  {
    title: 'Rainout Policy',
    body: `The Course retains sole authority to determine whether conditions are safe and playable.

Weather determinations may include delays, suspension, or closure.

Credits or make-up play may be offered at the Course's discretion subject to scheduling availability.`,
    order: 6,
    isRequired: true,
  },
  {
    title: 'No-Show Policy',
    body: `No-shows and late cancellations disrupt course operations.

Players or League may be charged for reserved spots not used, subject to notice requirements and the Course's policies.`,
    order: 7,
    isRequired: true,
  },
  {
    title: 'Cart Policy',
    body: `All cart use is subject to Course rules.

Drivers must meet age and licensing requirements.

Cart restrictions may be imposed based on course conditions or weather.

League is responsible for damage caused by participants.`,
    order: 8,
    isRequired: true,
  },
  {
    title: 'Alcohol Policy',
    body: `Outside alcohol is prohibited.

The Course reserves sole authority over alcohol service and may refuse service to any individual.

Participants must comply with applicable laws and Course policies.`,
    order: 9,
    isRequired: true,
  },
  {
    title: 'Conduct',
    body: `Participants must comply with Course rules and behave respectfully.

Prohibited conduct includes harassment, discrimination, disorderly behavior, illegal substances, and property damage.

The Course reserves the right to remove individuals for violations without refund.`,
    order: 10,
    isRequired: true,
  },
  {
    title: 'Competition Rules',
    body: `Competition format and rules are: {{competition_format}}.

Handicap policy: {{handicap_policy}}.
Dispute resolution for scoring issues shall be handled by League unless otherwise agreed.

The Course is not responsible for adjudicating league rule disputes unless expressly agreed in writing.`,
    order: 11,
    isRequired: true,
  },
  {
    title: 'Damage & Liability',
    body: `League assumes responsibility for participants and guests.

League agrees to pay for damages caused by participants.

Participants acknowledge the inherent risks of golf and related activities.

The Course's liability shall be limited to amounts paid under this Agreement to the maximum extent permitted by law.

The Course is not responsible for lost or stolen property.`,
    order: 12,
    isRequired: true,
  },
  {
    title: 'Insurance',
    body: `League may be required to carry liability insurance and provide proof upon request.`,
    order: 13,
    isRequired: true,
  },
  {
    title: 'Rescheduling',
    body: `Make-up play and rescheduling are subject to Course availability and policies.

Credits may expire if not used within an agreed period.`,
    order: 14,
    isRequired: true,
  },
  {
    title: 'Force Majeure',
    body: `Neither Party shall be liable for failure to perform due to events beyond reasonable control, including severe weather, natural disasters, government actions, utility interruptions, or emergencies.`,
    order: 15,
    isRequired: true,
  },
  {
    title: 'Governing Law',
    body: `This Agreement shall be governed by the laws of the state in which the Course is located.`,
    order: 16,
    isRequired: true,
  },
  {
    title: 'Entire Agreement',
    body: `This Agreement represents the entire understanding between the Parties and supersedes prior communications.

Modifications must be in writing and signed by both Parties.

If any provision is unenforceable, the remaining provisions remain in effect.

Notices may be delivered electronically where permitted by law.

Electronic signatures shall be deemed valid.`,
    order: 17,
    isRequired: true,
  },
  {
    title: 'Signatures',
    body: `League / Organizer:

Name: __________________________
Title: __________________________
Organization: ____________________
Signature: _______________________
Date: ___________________________

Course Representative:

Name: __________________________
Title: __________________________
Signature: _______________________
Date: ___________________________`,
    order: 18,
    isRequired: true,
  },
]

export const WEDDING_DEFAULT_SECTIONS: DefaultSectionDefinition[] = [
  {
    title: 'Parties & Event Overview',
    body: `WEDDING EVENT AGREEMENT

This Wedding Event Agreement ("Agreement") is entered into between:

Venue: {{venue_legal_name}}, located at {{venue_address}} ("Venue")
Client: {{client_name}}, located at {{client_address}} ("Client")

Collectively referred to as the "Parties."

Event Type: Wedding
Event Date: {{event_date}}
Event Location: {{venue_name}}
Estimated Guest Count: {{estimated_guest_count}}

Client agrees to host a wedding event ("Event") at the Venue on the Event Date subject to the terms of this Agreement. Client shall designate a primary contact and a day-of on-site contact.

Primary Contact: {{primary_contact_name}} / {{primary_contact_phone}} / {{primary_contact_email}}
Day-of Contact: {{day_of_contact_name}} / {{day_of_contact_phone}}`,
    order: 0,
    isRequired: true,
  },
  {
    title: 'Event Details & Schedule',
    body: `Schedule:

Access / Vendor Arrival Time: {{vendor_arrival_time}}

Ceremony Time: {{ceremony_time}}

Reception Start Time: {{reception_start_time}}

Reception End Time: {{reception_end_time}}

Breakdown / Cleanup Completion Time: {{cleanup_completion_time}}

Venue spaces reserved for the Event: {{reserved_spaces}}.

Client is responsible for providing an Event timeline to the Venue by {{timeline_due_date}}. The Venue may require reasonable adjustments to ensure safety, staffing, and compliance with policies.`,
    order: 1,
    isRequired: true,
  },
  {
    title: 'Venue Rental & Scope of Services',
    body: `The Venue agrees to provide the reserved space(s) and the following services/inclusions, if applicable:

Tables and chairs: {{tables_chairs_included}}

Linens: {{linens_included}}

Setup/teardown: {{setup_teardown_responsibility}}

Staffing included: {{staffing_included}}

Parking: {{parking_details}}

Bridal suite / getting-ready rooms: {{bridal_suite_details}}

Any additional services must be documented in writing and may require additional fees.`,
    order: 2,
    isRequired: true,
  },
  {
    title: 'Site Rules, Access & Capacity',
    body: `Client and guests must comply with Venue rules and posted policies.

Maximum capacity: {{maximum_capacity}}

Access areas are limited to reserved spaces and approved common areas.

Smoking/vaping policy: {{smoking_policy}}

Weapons policy (if applicable): {{weapons_policy}}

Venue may deny access to unauthorized areas and may remove individuals for violations.`,
    order: 3,
    isRequired: true,
  },
  {
    title: 'Pricing Structure & Payment Terms',
    body: `Total pricing for the Event shall be as follows:

Venue rental fee: \${{venue_rental_fee}}

Food & beverage minimum (if applicable): \${{food_beverage_minimum}}

Per-guest pricing (if applicable): \${{per_guest_price}}

Service charge/gratuity (if applicable): {{service_charge_percent}}%

Taxes: {{taxes_applicable}}

Additional fees (AV, security, overtime, etc.): {{additional_fees}}

Payment schedule:

Deposit due: \${{deposit_amount}} by {{deposit_due_date}}

Additional payments: {{additional_payments}}

Final balance due by: {{final_balance_due_date}}

Accepted payment methods: {{payment_methods}}. Late payments may incur fees and may be grounds for cancellation.`,
    order: 4,
    isRequired: true,
  },
  {
    title: 'Deposit & Refund Policy',
    body: `Deposit terms:

Deposit is {{deposit_refund_policy}} as described herein.

Deposit shall be applied toward the final balance (if applicable).

Refunds, if any, are subject to written cancellation and the policies in this Agreement.`,
    order: 5,
    isRequired: true,
  },
  {
    title: 'Guest Count & Guarantees',
    body: `Client shall provide a final guaranteed guest count by {{guaranteed_count_due_date}}. Billing shall be based on the greater of:

Guaranteed guest count, or

Actual attendance.

Reductions after the guarantee deadline may not reduce charges. Increases may be accommodated based on capacity and staffing.`,
    order: 6,
    isRequired: true,
  },
  {
    title: 'Food & Beverage Terms',
    body: `If Venue provides catering:

Menu selections due by: {{menu_due_date}}

Dietary accommodations: {{dietary_process}}

Outside catering/food: {{outside_catering_policy}}

Cake policy and any cutting fees: {{cake_policy}}

Leftovers policy: {{leftovers_policy}}`,
    order: 7,
    isRequired: true,
  },
  {
    title: 'Bar Service & Alcohol Liability',
    body: `If alcohol is served:

All alcohol service must be provided and controlled by Venue or licensed bartenders approved by Venue.

No outside alcohol is permitted unless expressly approved in writing.

Valid identification is required.

Venue may refuse service to any person and may end alcohol service at its discretion.

Client agrees to promote responsible consumption and to comply with all applicable alcohol laws.`,
    order: 8,
    isRequired: true,
  },
  {
    title: 'Outside Vendors',
    body: `Client may use outside vendors subject to Venue approval.

Vendor arrival time: {{vendor_arrival_time}}

Vendor insurance requirements (if applicable): {{vendor_insurance_requirements}}

Vendors must comply with Venue rules and are responsible for cleanup and damage caused.`,
    order: 9,
    isRequired: true,
  },
  {
    title: 'Decorations, Setup & Property Use',
    body: `Decorations must be approved and comply with Venue policies.

Prohibited items may include: confetti, glitter, open flames, sparklers, fog machines, and adhesives that damage surfaces.

Client is responsible for:

Setup within allowed times

Removal of décor

Cleanup requirements

Any damage caused by décor or vendors`,
    order: 10,
    isRequired: true,
  },
  {
    title: 'Photography, Videography & Marketing',
    body: `Client and vendors may take photos/videos during the Event.

Venue marketing use:

Venue may use non-identifying photos for marketing: {{venue_marketing_photos}}

If restricted, Client must notify Venue in writing by {{marketing_restriction_date}}.`,
    order: 11,
    isRequired: true,
  },
  {
    title: 'Noise, Curfew & Overtime',
    body: `Music end time: {{music_end_time}}

Curfew / hard end time: {{hard_end_time}}

Overtime fees: \${{overtime_fee_per_hour}}/hour (or portion thereof)

Client is responsible for ensuring music and entertainment comply with Venue rules and local ordinances.`,
    order: 12,
    isRequired: true,
  },
  {
    title: 'Guest Conduct, Safety & Security',
    body: `Guests must behave in a safe and respectful manner.

Venue may remove disruptive individuals. Security may be required for large events and may be billed to Client if not included.

Illegal substances are prohibited.`,
    order: 13,
    isRequired: true,
  },
  {
    title: 'Damage, Indemnification & Limitation of Liability',
    body: `Client assumes responsibility for guests and vendors.

Client agrees to:

Pay for damage caused by guests/vendors

Indemnify and hold harmless the Venue from claims arising from the Event to the extent permitted by law

Acknowledge that Venue is not responsible for lost/stolen items

Venue's liability shall be limited to amounts paid under this Agreement to the maximum extent permitted by law.`,
    order: 14,
    isRequired: true,
  },
  {
    title: 'Insurance Requirements',
    body: `Client may be required to obtain event liability insurance and provide proof upon request.

If required, insurance must name Venue as an additional insured and be provided by {{insurance_due_date}}.`,
    order: 15,
    isRequired: true,
  },
  {
    title: 'Weather / Rain Plan',
    body: `If any portion of the Event is outdoors:

Indoor backup plan: {{indoor_backup_plan}}

Decision deadline for moving indoors: {{weather_decision_deadline}}

Tent responsibilities (if applicable): {{tent_responsibility}}

Venue makes no guarantee regarding weather conditions.`,
    order: 16,
    isRequired: true,
  },
  {
    title: 'Force Majeure',
    body: `Neither Party shall be liable for failure to perform due to events beyond reasonable control including severe weather, natural disasters, government actions, utility interruptions, or emergencies.

Parties will attempt to reschedule when feasible. Credits/refunds will be determined based on circumstances and applicable law.`,
    order: 17,
    isRequired: true,
  },
  {
    title: 'Cancellation (Client)',
    body: `Client cancellations must be submitted in writing.

Cancellation fees and refunds, if any, may apply based on timing and Venue commitments, including forfeiture of deposit and charges representing lost business opportunities.`,
    order: 18,
    isRequired: true,
  },
  {
    title: 'Venue Cancellation Rights',
    body: `Venue may cancel or terminate this Agreement due to:

Nonpayment

Safety concerns

Property damage

Breach of Agreement

Conditions beyond reasonable control

Refunds or credits will be determined based on circumstances.`,
    order: 19,
    isRequired: true,
  },
  {
    title: 'Rescheduling Policy',
    body: `Rescheduling requests must be made in writing and are subject to availability.

Fees may apply. Credits may expire if not used within an agreed period.`,
    order: 20,
    isRequired: true,
  },
  {
    title: 'Compliance With Laws',
    body: `Client and vendors must comply with applicable laws and regulations including fire code capacity, health rules, and accessibility requirements.`,
    order: 21,
    isRequired: true,
  },
  {
    title: 'Governing Law & Dispute Resolution',
    body: `This Agreement shall be governed by the laws of the state in which the Venue is located.

The Parties agree to attempt good-faith resolution prior to legal action.

Venue for legal proceedings shall be in the jurisdiction where the Venue is located unless otherwise required by law.`,
    order: 22,
    isRequired: true,
  },
  {
    title: 'Entire Agreement & Amendments',
    body: `This Agreement represents the entire understanding between the Parties and supersedes prior communications.

Modifications must be in writing and signed by both Parties.

If any provision is unenforceable, the remaining provisions remain in effect.

Notices may be delivered electronically where permitted by law.

Electronic signatures shall be deemed valid.`,
    order: 23,
    isRequired: true,
  },
  {
    title: 'Signatures',
    body: `Client:

Name: __________________________
Title (if applicable): __________________________
Signature: _______________________
Date: ___________________________

Venue Representative:

Name: __________________________
Title: __________________________
Signature: _______________________
Date: ___________________________`,
    order: 24,
    isRequired: true,
  },
]

export const SPECIAL_EVENT_DEFAULT_SECTIONS: DefaultSectionDefinition[] = [
  {
    title: 'Parties & Event Overview',
    body: `BANQUETS / SPECIAL EVENTS AGREEMENT

This Banquets / Special Events Agreement ("Agreement") is entered into between:

Venue: {{venue_legal_name}}, located at {{venue_address}} ("Venue")
Client: {{client_name}}, located at {{client_address}} ("Client")

Collectively referred to as the "Parties."

Event Name: {{event_name}}
Event Type: {{event_type}}
Event Date: {{event_date}}
Event Location: {{venue_name}}
Estimated Guest Count: {{estimated_guest_count}}

Client agrees to host a banquet or special event ("Event") at the Venue on the Event Date subject to the terms of this Agreement. Client shall designate a primary contact and an on-site contact responsible for coordination.

Primary Contact: {{primary_contact_name}} / {{primary_contact_phone}} / {{primary_contact_email}}
Day-of Contact: {{day_of_contact_name}} / {{day_of_contact_phone}}`,
    order: 0,
    isRequired: true,
  },
  {
    title: 'Event Details & Schedule',
    body: `Event Schedule:

Access / Setup Time: {{setup_time}}

Event Start Time: {{event_start_time}}

Event End Time: {{event_end_time}}

Breakdown Completion Time: {{breakdown_completion_time}}

Reserved spaces include: {{reserved_spaces}}.

Client shall provide an Event timeline by {{timeline_due_date}}. Venue may adjust timing as necessary for operations or safety.`,
    order: 1,
    isRequired: true,
  },
  {
    title: 'Venue Rental & Scope of Services',
    body: `Venue agrees to provide the reserved space(s) and the following services, if applicable:

Tables and chairs: {{tables_chairs_included}}

Linens: {{linens_included}}

Staffing: {{staffing_included}}

Setup and teardown: {{setup_teardown_responsibility}}

AV equipment: {{av_equipment_included}}

Parking access: {{parking_details}}

Additional services may incur additional charges.`,
    order: 2,
    isRequired: true,
  },
  {
    title: 'Site Rules, Access & Capacity',
    body: `Client and guests must comply with Venue policies.

Maximum capacity: {{maximum_capacity}}

Smoking/vaping policy: {{smoking_policy}}

Weapons policy (if applicable): {{weapons_policy}}

Restricted areas: {{restricted_areas}}

Venue reserves the right to remove individuals violating rules.`,
    order: 3,
    isRequired: true,
  },
  {
    title: 'Pricing Structure & Payment Terms',
    body: `Event pricing includes:

Venue rental fee: \${{venue_rental_fee}}

Food & beverage minimum: \${{food_beverage_minimum}} (if applicable)

Per-person pricing: \${{per_person_price}}

Service charges/gratuity: {{service_charge_percent}}%

Taxes: {{taxes_applicable}}

Additional fees: {{additional_fees}}

Payment schedule:

Deposit due: \${{deposit_amount}} by {{deposit_due_date}}

Additional payments: {{additional_payments}}

Final balance due by: {{final_balance_due_date}}

Late payments may result in cancellation or additional fees.`,
    order: 4,
    isRequired: true,
  },
  {
    title: 'Deposit & Refund Policy',
    body: `Deposit terms:

Deposit is {{deposit_refund_policy}} as described herein.

Deposit applied toward final balance (if applicable).

Refunds are subject to cancellation policy below.`,
    order: 5,
    isRequired: true,
  },
  {
    title: 'Guest Count & Guarantees',
    body: `Client must provide a final guaranteed guest count by {{guaranteed_count_due_date}}.

Billing shall be based on the greater of:

Guaranteed count

Actual attendance

Reductions after deadline may not reduce charges.`,
    order: 6,
    isRequired: true,
  },
  {
    title: 'Food & Beverage Terms',
    body: `If catering is provided:

Menu selections due by: {{menu_due_date}}

Dietary accommodations: {{dietary_process}}

Outside food policy: {{outside_food_policy}}

Cake or dessert policy: {{cake_dessert_policy}}

Leftover food handling: {{leftovers_policy}}`,
    order: 7,
    isRequired: true,
  },
  {
    title: 'Bar Service & Alcohol Liability',
    body: `If alcohol is served:

Venue retains sole authority over alcohol service.

Outside alcohol is prohibited unless approved in writing.

Valid identification is required for service.

Venue may refuse service to any individual.

Alcohol service may end prior to Event conclusion at Venue discretion.

Client agrees to promote responsible consumption and may be required to arrange transportation options if alcohol is served.`,
    order: 8,
    isRequired: true,
  },
  {
    title: 'Outside Vendors',
    body: `All vendors must comply with Venue rules.

Client is responsible for vendor conduct and damages.

Vendor arrival times must be coordinated in advance.

Insurance certificates may be required.`,
    order: 9,
    isRequired: true,
  },
  {
    title: 'Decorations, Setup & Property Use',
    body: `Decorations must be approved in advance.

Prohibited items may include:

Confetti

Glitter

Open flames

Nails, staples, or adhesives damaging surfaces

Client is responsible for cleanup and damages.`,
    order: 10,
    isRequired: true,
  },
  {
    title: 'Audio / Visual & Entertainment',
    body: `Entertainment must comply with Venue noise limits and local ordinances.

Electrical usage must be approved.

Venue is not responsible for equipment failure unless provided by Venue.`,
    order: 11,
    isRequired: true,
  },
  {
    title: 'Photography & Marketing',
    body: `Venue may photograph Event spaces for marketing purposes unless Client requests otherwise in writing.`,
    order: 12,
    isRequired: true,
  },
  {
    title: 'Noise, Curfew & Overtime',
    body: `Music and entertainment must end by {{music_end_time}}.

Overtime fees may apply if Event exceeds contracted time.

Venue reserves the right to enforce curfews and ordinances.`,
    order: 13,
    isRequired: true,
  },
  {
    title: 'Guest Conduct, Safety & Security',
    body: `Guests must behave responsibly and comply with laws.

Venue may remove disruptive individuals without refund.

Security personnel may be required depending on Event size or type.`,
    order: 14,
    isRequired: true,
  },
  {
    title: 'Damage, Indemnification & Limitation of Liability',
    body: `Client assumes responsibility for guests and vendors.

Client agrees to:

Pay for damages caused by attendees

Indemnify and hold harmless the Venue from claims arising from the Event

Participants acknowledge inherent risks associated with activities.

Venue liability shall be limited to amounts paid under this Agreement to the maximum extent permitted by law.

Venue is not responsible for lost or stolen property.`,
    order: 15,
    isRequired: true,
  },
  {
    title: 'Insurance Requirements',
    body: `Client may be required to provide event liability insurance naming Venue as an additional insured.

Proof of insurance must be provided upon request.`,
    order: 16,
    isRequired: true,
  },
  {
    title: 'Weather / Outdoor Contingency',
    body: `Outdoor events are subject to weather conditions.

Venue retains authority to modify or relocate activities for safety.`,
    order: 17,
    isRequired: true,
  },
  {
    title: 'Force Majeure',
    body: `Neither Party shall be liable for failure to perform due to events beyond reasonable control including:

Severe weather

Natural disasters

Government actions

Utility interruptions

Emergencies

Parties will attempt to reschedule when feasible.`,
    order: 18,
    isRequired: true,
  },
  {
    title: 'Cancellation (Client)',
    body: `Client cancellations must be submitted in writing.

Cancellation fees may apply based on timing including forfeiture of deposits and lost business opportunities.`,
    order: 19,
    isRequired: true,
  },
  {
    title: 'Venue Cancellation Rights',
    body: `Venue may cancel or terminate due to:

Nonpayment

Safety concerns

Property damage

Breach of Agreement

Conditions beyond reasonable control

Refunds or credits determined based on circumstances.`,
    order: 20,
    isRequired: true,
  },
  {
    title: 'Rescheduling Policy',
    body: `Rescheduling requests must be made in writing and are subject to availability.

Additional fees or pricing adjustments may apply.

Credits may expire if not used within agreed period.`,
    order: 21,
    isRequired: true,
  },
  {
    title: 'Compliance With Laws',
    body: `Client must comply with all applicable laws including:

Fire codes

Capacity limits

Health regulations

Alcohol laws

Noise ordinances`,
    order: 22,
    isRequired: true,
  },
  {
    title: 'Governing Law & Dispute Resolution',
    body: `This Agreement shall be governed by the laws of the state in which the Venue is located.

Parties agree to attempt good-faith resolution prior to legal action.

Venue for legal proceedings shall be in the Venue's jurisdiction unless otherwise required by law.`,
    order: 23,
    isRequired: true,
  },
  {
    title: 'Entire Agreement & Amendments',
    body: `This Agreement represents the entire understanding between the Parties and supersedes prior communications.

Modifications must be in writing and signed by both Parties.

If any provision is unenforceable, remaining provisions remain in effect.

Electronic signatures shall be deemed valid.`,
    order: 24,
    isRequired: true,
  },
  {
    title: 'Signatures',
    body: `Client:

Name: __________________________
Title: __________________________
Organization: ____________________
Signature: _______________________
Date: ___________________________

Venue Representative:

Name: __________________________
Title: __________________________
Signature: _______________________
Date: ___________________________`,
    order: 25,
    isRequired: true,
  },
]

export const OTHER_DEFAULT_SECTIONS: DefaultSectionDefinition[] = [
  {
    title: 'Parties & Overview',
    body: `AGREEMENT

This Agreement ("Agreement") is entered into between:

Party A: {{venue_legal_name}}, located at {{venue_address}} ("Venue" / "Provider")
Party B: {{client_name}}, located at {{client_address}} ("Client")

Collectively referred to as the "Parties."

Agreement Name: {{event_name}}
Type: {{contract_subtype}}
Effective Date: {{event_date}}
Location: {{venue_name}}

Client agrees to engage the Venue/Provider for the services described herein subject to the terms of this Agreement. Client shall designate a primary contact responsible for coordination.

Primary Contact: {{primary_contact_name}} / {{primary_contact_phone}} / {{primary_contact_email}}`,
    order: 0,
    isRequired: true,
  },
  {
    title: 'Scope of Services',
    body: `The Venue/Provider agrees to provide the following services:

{{contract_description}}

Specific inclusions:

{{service_inclusions}}

Any additional services beyond the scope described above must be documented in writing and may require additional fees.

Both Parties acknowledge that the scope of services may be adjusted by mutual written agreement.`,
    order: 1,
    isRequired: true,
  },
  {
    title: 'Schedule & Term',
    body: `This Agreement is effective as of {{event_date}}.

Schedule:

Start Date/Time: {{start_time}}

End Date/Time: {{end_time}}

Setup/Access Time: {{setup_time}}

Breakdown/Completion Time: {{breakdown_time}}

Client shall provide a detailed timeline or schedule by {{timeline_due_date}} if applicable. The Venue/Provider may require reasonable adjustments to ensure safety and operational requirements.`,
    order: 2,
    isRequired: true,
  },
  {
    title: 'Pricing & Payment',
    body: `Pricing for the services described herein:

Total Fee: \${{total_fee}}

Per-unit pricing (if applicable): \${{per_unit_price}}

Service charges/gratuity (if applicable): {{service_charge_percent}}%

Taxes: {{taxes_applicable}}

Additional fees: {{additional_fees}}

Payment schedule:

Deposit due: \${{deposit_amount}} by {{deposit_due_date}}

Additional payments: {{additional_payments}}

Final balance due by: {{final_balance_due_date}}

Accepted payment methods: {{payment_methods}}. Late payments may incur fees and may be grounds for cancellation or suspension of services.`,
    order: 3,
    isRequired: true,
  },
  {
    title: 'Responsibilities',
    body: `Venue/Provider Responsibilities:

Provide the services described in the Scope of Services section.

Maintain appropriate staffing and resources.

Communicate any changes or issues promptly.

Client Responsibilities:

Provide accurate information and timely approvals.

Make payments according to the agreed schedule.

Comply with all applicable rules, policies, and regulations.

Ensure guests, vendors, or attendees comply with Venue/Provider policies.`,
    order: 4,
    isRequired: true,
  },
  {
    title: 'Cancellation',
    body: `Client Cancellation:

Client cancellations must be submitted in writing.

Cancellation fees and refunds, if any, may apply based on timing and commitments made, including forfeiture of deposit and charges representing lost business opportunities.

Venue/Provider Cancellation Rights:

Venue/Provider may cancel or terminate this Agreement due to:

Nonpayment

Safety concerns

Property damage

Breach of Agreement

Conditions beyond reasonable control

Refunds or credits will be determined based on circumstances.`,
    order: 5,
    isRequired: true,
  },
  {
    title: 'Liability & Indemnification',
    body: `Client assumes responsibility for guests, vendors, and attendees.

Client agrees to:

Pay for damages caused by Client's guests, vendors, or attendees

Indemnify and hold harmless the Venue/Provider from claims arising from the services or events covered by this Agreement to the extent permitted by law

Acknowledge that Venue/Provider is not responsible for lost or stolen items

Venue/Provider liability shall be limited to amounts paid under this Agreement to the maximum extent permitted by law.`,
    order: 6,
    isRequired: true,
  },
  {
    title: 'Insurance',
    body: `Client may be required to obtain liability insurance and provide proof upon request.

If required, insurance must name the Venue/Provider as an additional insured and be provided by {{insurance_due_date}}.`,
    order: 7,
    isRequired: true,
  },
  {
    title: 'Force Majeure',
    body: `Neither Party shall be liable for failure to perform due to events beyond reasonable control including severe weather, natural disasters, government actions, utility interruptions, or emergencies.

Parties will attempt to reschedule when feasible. Credits or refunds will be determined based on circumstances and applicable law.`,
    order: 8,
    isRequired: true,
  },
  {
    title: 'Governing Law & Dispute Resolution',
    body: `This Agreement shall be governed by the laws of the state in which the Venue/Provider is located.

The Parties agree to attempt good-faith resolution prior to legal action.

Venue for legal proceedings shall be in the jurisdiction where the Venue/Provider is located unless otherwise required by law.`,
    order: 9,
    isRequired: true,
  },
  {
    title: 'Entire Agreement & Amendments',
    body: `This Agreement represents the entire understanding between the Parties and supersedes prior communications.

Modifications must be in writing and signed by both Parties.

If any provision is unenforceable, the remaining provisions remain in effect.

Notices may be delivered electronically where permitted by law.

Electronic signatures shall be deemed valid.`,
    order: 10,
    isRequired: true,
  },
  {
    title: 'Signatures',
    body: `Client:

Name: __________________________
Title: __________________________
Organization: ____________________
Signature: _______________________
Date: ___________________________

Venue / Provider Representative:

Name: __________________________
Title: __________________________
Signature: _______________________
Date: ___________________________`,
    order: 11,
    isRequired: true,
  },
]

export const DEFAULT_SECTIONS_BY_TYPE: Partial<
  Record<ContractType, DefaultSectionDefinition[]>
> = {
  GOLF_OUTING: GOLF_OUTING_DEFAULT_SECTIONS,
  GOLF_LEAGUE: GOLF_LEAGUE_DEFAULT_SECTIONS,
  WEDDING: WEDDING_DEFAULT_SECTIONS,
  SPECIAL_EVENT: SPECIAL_EVENT_DEFAULT_SECTIONS,
  OTHER: OTHER_DEFAULT_SECTIONS,
}

export function getDefaultSections(
  contractType: ContractType
): DefaultSectionDefinition[] | null {
  return DEFAULT_SECTIONS_BY_TYPE[contractType] ?? null
}
