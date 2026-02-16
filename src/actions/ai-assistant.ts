'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId } from '@/lib/auth-utils'
import {
  suggestLanguageSchema,
  saveSuggestionSchema,
  type SuggestLanguageInput,
  type SaveSuggestionInput,
} from '@/lib/validations/ai-assistant'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Token cost estimation (in cents per 1M tokens)
const TOKEN_COSTS = {
  'gpt-4o-mini': { input: 15, output: 60 }, // $0.15 / $0.60 per 1M tokens
  'gpt-4o': { input: 250, output: 1000 }, // $2.50 / $10.00 per 1M tokens
  'gpt-4-turbo': { input: 1000, output: 3000 }, // $10.00 / $30.00 per 1M tokens
} as const

/**
 * Check if organization has exceeded their AI usage limits
 */
async function checkRateLimits(orgId: string, userId: string) {
  // Get organization settings
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      aiEnabled: true,
      aiDailyLimit: true,
      aiMonthlyLimit: true,
    },
  })

  if (!org || !org.aiEnabled) {
    return {
      allowed: false,
      error: 'AI assistant is not enabled for your organization',
    }
  }

  // Get today's usage count
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dailyUsage = await prisma.aIUsage.count({
    where: {
      organizationId: orgId,
      createdAt: { gte: today },
    },
  })

  if (dailyUsage >= org.aiDailyLimit) {
    return {
      allowed: false,
      error: `Daily AI usage limit reached (${org.aiDailyLimit} requests)`,
      dailyUsage,
      dailyLimit: org.aiDailyLimit,
    }
  }

  // Get this month's usage count
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const monthlyUsage = await prisma.aIUsage.count({
    where: {
      organizationId: orgId,
      createdAt: { gte: firstDayOfMonth },
    },
  })

  if (monthlyUsage >= org.aiMonthlyLimit) {
    return {
      allowed: false,
      error: `Monthly AI usage limit reached (${org.aiMonthlyLimit} requests)`,
      monthlyUsage,
      monthlyLimit: org.aiMonthlyLimit,
    }
  }

  return {
    allowed: true,
    dailyUsage,
    dailyLimit: org.aiDailyLimit,
    monthlyUsage,
    monthlyLimit: org.aiMonthlyLimit,
  }
}

/**
 * Estimate cost in cents based on token usage
 */
function estimateCost(
  model: keyof typeof TOKEN_COSTS,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = TOKEN_COSTS[model]
  const inputCost = (inputTokens / 1_000_000) * costs.input
  const outputCost = (outputTokens / 1_000_000) * costs.output
  return Math.ceil(inputCost + outputCost) // Round up to nearest cent
}

/**
 * Build a safe prompt for contract language suggestions
 * Prevents prompt injection by treating user input as data, not instructions
 */
function buildPrompt(input: SuggestLanguageInput) {
  const systemPrompt = `You are a legal contract drafting assistant. Your role is to suggest clear, enforceable contract language.

IMPORTANT RULES:
- This is NOT legal advice - you provide sample language only
- Write plain, understandable commercial contract language
- Be general - avoid citing specific statutes or case law unless directly relevant
- Format output as valid JSON with the specified structure
- Do not hallucinate legal requirements

Output format (strict JSON):
{
  "suggestionText": "The suggested contract clause",
  "rationale": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
  "alternativeShorter": "Optional shorter version",
  "alternativeStricter": "Optional stricter version"
}

Keep suggestions focused and practical for ${input.jurisdiction || 'general commercial'} contracts.`

  // Build user message with structured data (prevents injection)
  const userParts = [
    `Please suggest contract language for a clause titled: "${input.sectionTitle}"`,
  ]

  if (input.existingContent) {
    userParts.push(`\nCurrent content:\n${input.existingContent}`)
  }

  if (input.clauseType) {
    userParts.push(`\nClause type: ${input.clauseType}`)
  }

  userParts.push(`\nTone: ${input.tone}`)
  userParts.push(`\nRisk posture: ${input.riskPosture}`)

  if (input.jurisdiction) {
    userParts.push(`\nJurisdiction: ${input.jurisdiction}`)
  }

  if (input.keyFacts) {
    userParts.push(`\nKey facts to incorporate:\n${input.keyFacts}`)
  }

  if (input.useFullContractContext && input.fullContractContent) {
    // Truncate to prevent excessive token usage
    const truncated = input.fullContractContent.slice(0, 2000)
    userParts.push(`\nContract context:\n${truncated}`)
  }

  return {
    systemPrompt,
    userPrompt: userParts.join('\n'),
  }
}

/**
 * Suggest contract language using OpenAI
 */
export async function suggestContractLanguage(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = suggestLanguageSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // Check rate limits
    const rateLimit = await checkRateLimits(orgId, session.user.id)
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: rateLimit.error,
        limitInfo: {
          dailyUsage: rateLimit.dailyUsage,
          dailyLimit: rateLimit.dailyLimit,
          monthlyUsage: rateLimit.monthlyUsage,
          monthlyLimit: rateLimit.monthlyLimit,
        },
      }
    }

    // Get org's preferred model
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { aiModel: true },
    })

    const model = (org?.aiModel || 'gpt-4o-mini') as keyof typeof TOKEN_COSTS

    // Build safe prompts
    const { systemPrompt, userPrompt } = buildPrompt(validatedData)

    let response
    let usage
    let suggestionData

    try {
      // Call OpenAI API with JSON mode for structured output
      response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      })

      usage = response.usage

      // Parse JSON response
      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from AI')
      }

      suggestionData = JSON.parse(content)

      // Validate response structure
      if (!suggestionData.suggestionText || !suggestionData.rationale) {
        throw new Error('Invalid response format from AI')
      }
    } catch (apiError) {
      // Log failed attempt
      await prisma.aIUsage.create({
        data: {
          organizationId: orgId,
          userId: session.user.id,
          contractSectionId: validatedData.contractSectionId,
          promptType: 'suggest_language',
          model: model,
          tone: validatedData.tone,
          jurisdiction: validatedData.jurisdiction,
          riskPosture: validatedData.riskPosture,
          clauseType: validatedData.clauseType,
          success: false,
          errorMessage: apiError instanceof Error ? apiError.message : 'Unknown error',
        },
      })

      throw apiError
    }

    // Calculate cost
    const estimatedCostCents = estimateCost(
      model,
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0
    )

    // Log successful usage
    await prisma.aIUsage.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        contractSectionId: validatedData.contractSectionId,
        promptType: 'suggest_language',
        model: model,
        promptTokens: usage?.prompt_tokens || 0,
        responseTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        estimatedCost: estimatedCostCents,
        tone: validatedData.tone,
        jurisdiction: validatedData.jurisdiction,
        riskPosture: validatedData.riskPosture,
        clauseType: validatedData.clauseType,
        success: true,
      },
    })

    return {
      success: true,
      suggestion: {
        text: suggestionData.suggestionText,
        rationale: Array.isArray(suggestionData.rationale)
          ? suggestionData.rationale
          : [suggestionData.rationale],
        alternatives: {
          shorter: suggestionData.alternativeShorter || null,
          stricter: suggestionData.alternativeStricter || null,
        },
      },
      usage: {
        model,
        promptTokens: usage?.prompt_tokens || 0,
        responseTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        estimatedCostCents,
      },
      limits: {
        dailyUsage: (rateLimit.dailyUsage ?? 0) + 1,
        dailyLimit: rateLimit.dailyLimit,
        monthlyUsage: (rateLimit.monthlyUsage ?? 0) + 1,
        monthlyLimit: rateLimit.monthlyLimit,
      },
    }
  } catch (error) {
    console.error('Error generating AI suggestion:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to generate suggestion' }
  }
}

/**
 * Save an AI suggestion for future reference
 */
export async function saveSuggestion(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = saveSuggestionSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    const suggestion = await prisma.aISuggestion.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        contractSectionId: validatedData.contractSectionId,
        sectionTitle: validatedData.sectionTitle,
        originalContent: validatedData.originalContent,
        suggestedText: validatedData.suggestedText,
        rationale: validatedData.rationale,
        alternativeShorter: validatedData.alternativeShorter,
        alternativeStricter: validatedData.alternativeStricter,
        tone: validatedData.tone,
        jurisdiction: validatedData.jurisdiction,
        riskPosture: validatedData.riskPosture,
        clauseType: validatedData.clauseType,
        model: validatedData.model,
      },
    })

    return {
      success: true,
      suggestionId: suggestion.id,
      message: 'Suggestion saved successfully',
    }
  } catch (error) {
    console.error('Error saving suggestion:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to save suggestion' }
  }
}

/**
 * Get AI usage statistics for the organization
 */
export async function getAIUsageStats(period: 'day' | 'month' | 'all' = 'month') {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const orgId = await getSessionOrgId(session)

    let startDate: Date | undefined
    if (period === 'day') {
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'month') {
      const today = new Date()
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }

    const where: any = {
      organizationId: orgId,
      success: true,
    }

    if (startDate) {
      where.createdAt = { gte: startDate }
    }

    const stats = await prisma.aIUsage.aggregate({
      where,
      _count: { id: true },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
    })

    // Get org limits
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        aiDailyLimit: true,
        aiMonthlyLimit: true,
        aiEnabled: true,
        aiModel: true,
      },
    })

    return {
      success: true,
      stats: {
        requestCount: stats._count.id,
        totalTokens: stats._sum.totalTokens || 0,
        totalCostCents: stats._sum.estimatedCost || 0,
        totalCostDollars: ((stats._sum.estimatedCost || 0) / 100).toFixed(2),
      },
      limits: {
        dailyLimit: org?.aiDailyLimit || 0,
        monthlyLimit: org?.aiMonthlyLimit || 0,
        enabled: org?.aiEnabled || false,
        model: org?.aiModel || 'gpt-4o-mini',
      },
    }
  } catch (error) {
    console.error('Error fetching AI usage stats:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch usage stats' }
  }
}
