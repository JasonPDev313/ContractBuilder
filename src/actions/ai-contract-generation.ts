'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId } from '@/lib/auth-utils'
import {
  generateContractSchema,
  aiContractResponseSchema,
  type AIContractResponse,
} from '@/lib/validations/ai-contract-generation'
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '@/lib/prompts/contract-generation'
import {
  normalizeAndOrderSections,
  mergeExhibits,
} from '@/lib/contract-section-ordering'
import { getApplicableVenuePolicies, buildVenuePoliciesSectionBody } from '@/lib/venue-policies'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Rate limits
const DAILY_LIMIT_PER_USER = 10
const DAILY_LIMIT_PER_ORG = 100

// Token costs for gpt-4o-mini (in cents per 1M tokens)
const TOKEN_COSTS = {
  input: 15, // $0.15 per 1M tokens
  output: 60, // $0.60 per 1M tokens
}

/**
 * Check rate limits for contract generation
 */
async function checkGenerationRateLimits(orgId: string, userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // User limit
  const userUsageToday = await prisma.aIUsage.count({
    where: {
      userId,
      promptType: 'generate_full_contract',
      createdAt: { gte: today },
    },
  })

  if (userUsageToday >= DAILY_LIMIT_PER_USER) {
    return {
      allowed: false,
      error: `Daily limit reached (${DAILY_LIMIT_PER_USER} contracts per day per user)`,
    }
  }

  // Org limit
  const orgUsageToday = await prisma.aIUsage.count({
    where: {
      organizationId: orgId,
      promptType: 'generate_full_contract',
      createdAt: { gte: today },
    },
  })

  if (orgUsageToday >= DAILY_LIMIT_PER_ORG) {
    return {
      allowed: false,
      error: `Organization daily limit reached (${DAILY_LIMIT_PER_ORG} contracts per day)`,
    }
  }

  return { allowed: true }
}

/**
 * Call OpenAI API with retry for malformed JSON
 */
async function callOpenAIWithRetry(
  systemPrompt: string,
  userPrompt: string
): Promise<{ data: AIContractResponse; usage: any }> {
  const model = 'gpt-4o-mini'
  let attempt = 0
  const maxAttempts = 2

  while (attempt < maxAttempts) {
    attempt++

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    try {
      const parsed = JSON.parse(content)
      const validated = aiContractResponseSchema.parse(parsed)

      return {
        data: validated,
        usage: response.usage,
      }
    } catch (parseError) {
      if (attempt < maxAttempts) {
        // Retry with repair prompt
        const repairPrompt = `The previous response was not valid JSON matching the schema. Please reformat your response to match the exact JSON schema provided in the system message. Ensure all fields are present and valid.`

        const repairResponse = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content },
            { role: 'user', content: repairPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 4000,
        })

        const repairedContent = repairResponse.choices[0]?.message?.content
        if (!repairedContent) {
          throw new Error('No response from repair attempt')
        }

        const repairedParsed = JSON.parse(repairedContent)
        const repairedValidated = aiContractResponseSchema.parse(repairedParsed)

        return {
          data: repairedValidated,
          usage: {
            prompt_tokens:
              (response.usage?.prompt_tokens || 0) +
              (repairResponse.usage?.prompt_tokens || 0),
            completion_tokens:
              (response.usage?.completion_tokens || 0) +
              (repairResponse.usage?.completion_tokens || 0),
            total_tokens:
              (response.usage?.total_tokens || 0) +
              (repairResponse.usage?.total_tokens || 0),
          },
        }
      }

      throw parseError
    }
  }

  throw new Error('Failed to generate valid contract after retries')
}

/**
 * Estimate cost in cents based on token usage
 */
function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * TOKEN_COSTS.input
  const outputCost = (outputTokens / 1_000_000) * TOKEN_COSTS.output
  return Math.ceil(inputCost + outputCost)
}

/**
 * Generate a full contract from user prompt
 */
export async function generateContractFromPrompt(data: unknown) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Validate input
    const validatedInput = generateContractSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // 3. Check rate limits
    const rateLimit = await checkGenerationRateLimits(orgId, session.user.id)
    if (!rateLimit.allowed) {
      return { success: false, error: rateLimit.error }
    }

    // 4. Get org AI settings
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { aiEnabled: true },
    })

    if (!org?.aiEnabled) {
      return {
        success: false,
        error: 'AI features not enabled for organization',
      }
    }

    // 5. Build prompts
    const systemPrompt = buildSystemPrompt(validatedInput.contractTypeEnum)
    const userPrompt = buildUserPrompt(validatedInput)

    // 6. Call OpenAI
    let aiResponse: AIContractResponse
    let usage: any

    try {
      const result = await callOpenAIWithRetry(systemPrompt, userPrompt)
      aiResponse = result.data
      usage = result.usage
    } catch (apiError) {
      // Log failed attempt
      await prisma.aIUsage.create({
        data: {
          organizationId: orgId,
          userId: session.user.id,
          promptType: 'generate_full_contract',
          model: 'gpt-4o-mini',
          tone: validatedInput.tone,
          jurisdiction: validatedInput.jurisdiction,
          riskPosture: validatedInput.riskPosture,
          clauseType: validatedInput.contractType,
          success: false,
          errorMessage:
            apiError instanceof Error ? apiError.message : 'Unknown error',
        },
      })

      throw apiError
    }

    // 7. Normalize and order sections using blueprint
    const allSections = mergeExhibits(aiResponse.sections, aiResponse.exhibits)
    const orderedSections = normalizeAndOrderSections(
      allSections,
      validatedInput.contractTypeEnum
    )

    // 8. Create contract + sections in transaction
    const contract = await prisma.$transaction(async (tx) => {
      // Create contract
      const newContract = await tx.contract.create({
        data: {
          title: aiResponse.contractTitle,
          description: aiResponse.intro || undefined,
          status: 'DRAFT',
          contractType: validatedInput.contractTypeEnum,
          organizationId: orgId,
          createdById: session.user.id,
          content: null, // Section-based contract
        },
      })

      // Create sections
      await tx.contractSection.createMany({
        data: orderedSections.map((section) => ({
          contractId: newContract.id,
          title: section.title,
          body: section.body,
          order: section.order,
          isEdited: false,
        })),
      })

      // Inject Venue Policies section from org defaults
      const existingVP = orderedSections.find((s) =>
        s.title.toLowerCase().includes('venue policies')
      )

      if (!existingVP) {
        const orgDefaults = await tx.orgContractDefaults.findUnique({
          where: { organizationId: orgId },
        })

        const policies = getApplicableVenuePolicies(
          orgDefaults,
          validatedInput.contractTypeEnum
        )

        if (policies.length > 0) {
          const venuePoliciesBody = buildVenuePoliciesSectionBody(policies)

          const governingLaw = orderedSections.find((s) =>
            s.title.toLowerCase().includes('governing law')
          )
          const insertOrder = governingLaw
            ? governingLaw.order
            : orderedSections.length

          // Shift existing sections
          await tx.contractSection.updateMany({
            where: { contractId: newContract.id, order: { gte: insertOrder } },
            data: { order: { increment: 1 } },
          })

          await tx.contractSection.create({
            data: {
              contractId: newContract.id,
              title: 'Venue Policies',
              body: venuePoliciesBody,
              order: insertOrder,
              isEdited: false,
            },
          })
        }
      }

      // Log event
      await tx.contractEvent.create({
        data: {
          contractId: newContract.id,
          eventType: 'CREATED',
          userId: session.user.id,
          eventData: {
            method: 'ai_generation',
            contractType: validatedInput.contractType,
            jurisdiction: validatedInput.jurisdiction,
          },
        },
      })

      return newContract
    })

    // 9. Log successful usage
    const estimatedCost = estimateCost(
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0
    )

    await prisma.aIUsage.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        promptType: 'generate_full_contract',
        model: 'gpt-4o-mini',
        promptTokens: usage?.prompt_tokens || 0,
        responseTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        estimatedCost,
        tone: validatedInput.tone,
        jurisdiction: validatedInput.jurisdiction,
        riskPosture: validatedInput.riskPosture,
        clauseType: validatedInput.contractType,
        success: true,
      },
    })

    return {
      success: true,
      contractId: contract.id,
      sectionCount: orderedSections.length,
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        estimatedCostCents: estimatedCost,
      },
    }
  } catch (error) {
    console.error('Error generating contract:', error)

    if (error instanceof Error) {
      return { success: false, error: error.message }
    }

    return { success: false, error: 'Failed to generate contract' }
  }
}
