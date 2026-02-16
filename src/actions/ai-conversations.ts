'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId } from '@/lib/auth-utils'
import {
  sendMessageSchema,
  generateFromConversationSchema,
  convertToTemplateSchema,
} from '@/lib/validations/ai-conversation'
import { z } from 'zod'

// Define AI response schema inline to avoid import issues
const aiResponseSchema = z.object({
  message: z.string().min(1),
  extractedData: z.record(z.string(), z.unknown()).optional(),
  isComplete: z.boolean(),
  nextQuestion: z.string().optional(),
})

type AIResponseData = z.infer<typeof aiResponseSchema>
import {
  buildConversationSystemPrompt,
  buildInitialGreeting,
} from '@/lib/prompts/conversation-intake'
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '@/lib/prompts/contract-generation'
import {
  normalizeAndOrderSections,
  mergeExhibits,
} from '@/lib/contract-section-ordering'
import { type ContractType, getBlueprint } from '@/lib/contract-blueprints'
import {
  resolveContractContext,
  summarizeOrgDefaults,
} from '@/lib/resolve-contract-context'
import type { GenerateContractInput } from '@/lib/validations/ai-contract-generation'
import { aiContractResponseSchema } from '@/lib/validations/ai-contract-generation'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Rate limits
const DAILY_LIMIT_PER_USER = 10
const DAILY_LIMIT_PER_ORG = 100
const MAX_MESSAGES_PER_CONVERSATION = 50

/**
 * Check rate limits for AI conversations
 */
async function checkConversationRateLimits(orgId: string, userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Count conversations that generated contracts today
  const userUsageToday = await prisma.aiConversation.count({
    where: {
      userId,
      status: 'CONTRACT_GENERATED',
      completedAt: { gte: today },
    },
  })

  if (userUsageToday >= DAILY_LIMIT_PER_USER) {
    return {
      allowed: false,
      error: `Daily limit reached (${DAILY_LIMIT_PER_USER} contracts per day per user)`,
    }
  }

  const orgUsageToday = await prisma.aiConversation.count({
    where: {
      organizationId: orgId,
      status: 'CONTRACT_GENERATED',
      completedAt: { gte: today },
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
 * Create a new conversation
 */
export async function createConversation(contractType?: ContractType) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const orgId = await getSessionOrgId(session)

    // Check org AI settings and fetch org defaults
    const [org, orgDefaults] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { aiEnabled: true },
      }),
      prisma.orgContractDefaults.findUnique({
        where: { organizationId: orgId },
      }),
    ])

    if (!org?.aiEnabled) {
      return {
        success: false,
        error: 'AI features not enabled for organization',
      }
    }

    // Create conversation with contract type
    const conversation = await prisma.aiConversation.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        contractType: contractType || null,
        status: 'IN_PROGRESS',
        messageCount: 1,
      },
    })

    // Compute seeded data from org defaults
    const orgDefaultsSummary = summarizeOrgDefaults(orgDefaults)
    const seededData = resolveContractContext(
      orgDefaults,
      contractType ? { contractType } : {}
    )

    // Add initial greeting message based on contract type
    let initialMessage: string
    if (!contractType) {
      initialMessage = buildInitialGreeting()
    } else if (contractType === 'OTHER') {
      initialMessage = orgDefaultsSummary
        ? `I'd love to help you create a custom contract! I've pre-loaded your organization's default settings.\n\nWhat type of contract or agreement do you need? For example:\n- Event contract (birthday party, corporate event, fundraiser)\n- Vendor agreement\n- Facility rental\n- Sponsorship agreement\n- Or something else entirely!`
        : `I'd love to help you create a custom contract!\n\nWhat type of contract or agreement do you need? For example:\n- Event contract (birthday party, corporate event, fundraiser)\n- Vendor agreement\n- Facility rental\n- Sponsorship agreement\n- Or something else entirely!`
    } else {
      initialMessage = orgDefaultsSummary
        ? `Great! Let's create a ${getBlueprint(contractType).displayName} contract. I've pre-loaded your organization's default settings, so we can skip some of the basics.\n\nWhat's the client's name for this contract?`
        : `Great! Let's create a ${getBlueprint(contractType).displayName} contract. I'll guide you through gathering all the necessary information.\n\nTo start, what's the name of the venue or location where this event will take place?`
    }

    await prisma.aiConversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: initialMessage,
        extractedData:
          Object.keys(seededData).length > 0
            ? (seededData as Record<string, string | number | boolean | null>)
            : undefined,
      },
    })

    return {
      success: true,
      conversationId: conversation.id,
      initialMessage,
      extractedData: seededData,
    }
  } catch (error) {
    console.error('Error creating conversation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create conversation',
    }
  }
}

/**
 * Send a user message and get AI response
 */
export async function sendMessage(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedInput = sendMessageSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // Verify conversation ownership
    const conversation = await prisma.aiConversation.findUnique({
      where: { id: validatedInput.conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 messages for context
        },
      },
    })

    if (!conversation || conversation.organizationId !== orgId) {
      return { success: false, error: 'Conversation not found or unauthorized' }
    }

    // Check message limit
    if (conversation.messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
      return {
        success: false,
        error: 'Maximum messages reached for this conversation',
      }
    }

    // Save user message
    await prisma.aiConversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: validatedInput.userMessage,
      },
    })

    // Get cumulative extracted data BEFORE calling AI so it has context
    const allExtractedData = await getExtractedData(conversation.id)

    // Fetch org defaults for prompt context
    const orgDefaults = await prisma.orgContractDefaults.findUnique({
      where: { organizationId: orgId },
    })
    const orgDefaultsSummary = summarizeOrgDefaults(orgDefaults)

    // Build conversation history (reverse to chronological order)
    const conversationHistory = [...conversation.messages].reverse()

    // Call OpenAI to get AI response
    const systemPrompt = buildConversationSystemPrompt(
      conversation.contractType || undefined,
      orgDefaultsSummary
    )

    // Add extracted data context to the prompt
    const dataContext =
      Object.keys(allExtractedData).length > 0
        ? `\n\nDATA COLLECTED SO FAR:\n${JSON.stringify(allExtractedData, null, 2)}\n\nIMPORTANT: Use this data when responding. Don't ask for information that's already been collected.`
        : ''

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt + dataContext },
      ...conversationHistory.map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: validatedInput.userMessage },
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    // Parse and validate AI response
    let aiResponse: AIResponseData
    try {
      const parsed = JSON.parse(content)

      // Manual validation to avoid Turbopack bundling issues with Zod in server actions
      if (
        typeof parsed !== 'object' ||
        !parsed ||
        typeof parsed.message !== 'string' ||
        !parsed.message ||
        typeof parsed.isComplete !== 'boolean'
      ) {
        throw new Error('Invalid response structure')
      }

      aiResponse = {
        message: parsed.message,
        extractedData: parsed.extractedData || {},
        isComplete: parsed.isComplete,
        nextQuestion: parsed.nextQuestion,
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      console.error('Parse error:', parseError)
      throw new Error('AI returned invalid response format')
    }

    // Merge newly extracted data with existing data
    const mergedData = {
      ...allExtractedData,
      ...(aiResponse.extractedData || {}),
    }

    // Detect contract type from extracted data
    let updatedContractType = conversation.contractType
    if (mergedData.contractType && !updatedContractType) {
      const typeMapping: Record<string, ContractType> = {
        wedding: 'WEDDING',
        'golf outing': 'GOLF_OUTING',
        'golf league': 'GOLF_LEAGUE',
        'special event': 'SPECIAL_EVENT',
      }
      const normalizedType = String(mergedData.contractType).toLowerCase()
      updatedContractType = typeMapping[normalizedType] || null
    }

    // Save assistant message with extracted data
    await prisma.aiConversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponse.message,
        extractedData: (aiResponse.extractedData || {}) as any,
        model: 'gpt-4o-mini',
        promptTokens: response.usage?.prompt_tokens || 0,
        responseTokens: response.usage?.completion_tokens || 0,
      },
    })

    // Update conversation
    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 }, // User + assistant
        lastMessageAt: new Date(),
        contractType: updatedContractType,
      },
    })

    return {
      success: true,
      assistantMessage: aiResponse.message,
      extractedData: mergedData,
      isReadyToGenerate: aiResponse.isComplete,
    }
  } catch (error) {
    console.error('Error sending message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }
  }
}

/**
 * Get cumulative extracted data from all messages in a conversation
 */
async function getExtractedData(conversationId: string): Promise<Record<string, unknown>> {
  const messages = await prisma.aiConversationMessage.findMany({
    where: {
      conversationId,
      role: 'ASSISTANT',
      extractedData: { not: null as any },
    },
    orderBy: { createdAt: 'asc' },
    select: { extractedData: true },
  })

  // Merge all extracted data (later messages override earlier ones)
  return messages.reduce((acc, msg) => {
    if (msg.extractedData && typeof msg.extractedData === 'object') {
      return { ...acc, ...msg.extractedData }
    }
    return acc
  }, {})
}

/**
 * Get conversation with messages
 */
export async function getConversation(conversationId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const orgId = await getSessionOrgId(session)

    const conversation = await prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        generatedContract: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!conversation || conversation.organizationId !== orgId) {
      return { success: false, error: 'Conversation not found or unauthorized' }
    }

    // Get cumulative extracted data
    const extractedData = await getExtractedData(conversationId)

    return {
      success: true,
      conversation,
      extractedData,
    }
  } catch (error) {
    console.error('Error getting conversation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation',
    }
  }
}

/**
 * Generate contract from conversation
 */
export async function generateContractFromConversation(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedInput = generateFromConversationSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // Check rate limits
    const rateLimit = await checkConversationRateLimits(orgId, session.user.id)
    if (!rateLimit.allowed) {
      return { success: false, error: rateLimit.error }
    }

    // Get conversation
    const conversation = await prisma.aiConversation.findUnique({
      where: { id: validatedInput.conversationId },
    })

    if (!conversation || conversation.organizationId !== orgId) {
      return { success: false, error: 'Conversation not found or unauthorized' }
    }

    if (!conversation.contractType) {
      return { success: false, error: 'Contract type not determined yet' }
    }

    // Get extracted data
    const extractedData = await getExtractedData(validatedInput.conversationId)

    // Map extracted data to GenerateContractInput format
    const contractInput: GenerateContractInput = {
      contractTypeEnum: conversation.contractType as any,
      contractType: conversation.contractType.replace('_', ' '),
      jurisdiction: String(extractedData.jurisdiction || 'United States'),
      tone: String(extractedData.tone || 'neutral') as any,
      riskPosture: String(extractedData.riskPosture || 'balanced') as any,
      venueName: extractedData.venueName ? String(extractedData.venueName) : undefined,
      clientName: extractedData.clientName ? String(extractedData.clientName) : undefined,
      eventDate: extractedData.eventDate ? String(extractedData.eventDate) : undefined,
      location: extractedData.location ? String(extractedData.location) : undefined,
      pricing: extractedData.pricing ? String(extractedData.pricing) : undefined,
      depositAmount: extractedData.depositAmount ? String(extractedData.depositAmount) : undefined,
      depositDueDate: extractedData.depositDueDate ? String(extractedData.depositDueDate) : undefined,
      paymentSchedule: extractedData.paymentSchedule ? String(extractedData.paymentSchedule) : undefined,
      alcoholPolicy: extractedData.alcoholPolicy ? String(extractedData.alcoholPolicy) : undefined,
      cancellationPolicy: extractedData.cancellationPolicy ? String(extractedData.cancellationPolicy) : undefined,
      weatherPolicy: extractedData.weatherPolicy ? String(extractedData.weatherPolicy) : undefined,
      liabilityTerms: extractedData.liabilityTerms ? String(extractedData.liabilityTerms) : undefined,
      additionalTerms: extractedData.additionalTerms ? String(extractedData.additionalTerms) : undefined,
      allExtractedData: extractedData,
    }

    // Build prompts using existing functions
    const systemPrompt = buildSystemPrompt(conversation.contractType)
    const userPrompt = buildUserPrompt(contractInput)

    // Call OpenAI for contract generation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    const parsed = JSON.parse(content)
    const aiResponse = aiContractResponseSchema.parse(parsed)

    // Normalize and order sections
    const allSections = mergeExhibits(aiResponse.sections, aiResponse.exhibits)
    const orderedSections = normalizeAndOrderSections(
      allSections,
      conversation.contractType
    )

    // Create contract in transaction
    const contract = await prisma.$transaction(async (tx) => {
      const newContract = await tx.contract.create({
        data: {
          title: aiResponse.contractTitle,
          description: aiResponse.intro || undefined,
          status: 'DRAFT',
          contractType: conversation.contractType!,
          organizationId: orgId,
          createdById: session.user.id,
          content: null,
        },
      })

      await tx.contractSection.createMany({
        data: orderedSections.map((section) => ({
          contractId: newContract.id,
          title: section.title,
          body: section.body,
          order: section.order,
          isEdited: false,
        })),
      })

      await tx.contractEvent.create({
        data: {
          contractId: newContract.id,
          eventType: 'CREATED',
          userId: session.user.id,
          eventData: {
            method: 'ai_conversation',
            conversationId: conversation.id,
          },
        },
      })

      return newContract
    })

    // Update conversation
    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        status: 'CONTRACT_GENERATED',
        generatedContractId: contract.id,
        completedAt: new Date(),
      },
    })

    // Log AI usage
    await prisma.aIUsage.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        promptType: 'conversation_generation',
        model: 'gpt-4o-mini',
        promptTokens: response.usage?.prompt_tokens || 0,
        responseTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        estimatedCost: Math.ceil(
          ((response.usage?.prompt_tokens || 0) / 1_000_000) * 15 +
            ((response.usage?.completion_tokens || 0) / 1_000_000) * 60
        ),
        tone: contractInput.tone,
        jurisdiction: contractInput.jurisdiction,
        riskPosture: contractInput.riskPosture,
        clauseType: contractInput.contractType,
        success: true,
      },
    })

    return {
      success: true,
      contractId: contract.id,
      sectionCount: orderedSections.length,
    }
  } catch (error) {
    console.error('Error generating contract from conversation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate contract',
    }
  }
}

/**
 * Convert contract to template
 */
export async function convertContractToTemplate(data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedInput = convertToTemplateSchema.parse(data)
    const orgId = await getSessionOrgId(session)

    // Get contract with sections
    const contract = await prisma.contract.findUnique({
      where: { id: validatedInput.contractId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!contract || contract.organizationId !== orgId) {
      return { success: false, error: 'Contract not found or unauthorized' }
    }

    if (!contract.sections.length) {
      return { success: false, error: 'Contract has no sections to convert' }
    }

    // Extract variables helper function
    const extractVariables = (text: string): string[] => {
      const regex = /\{\{([^}]+)\}\}/g
      const matches = text.matchAll(regex)
      return Array.from(new Set(Array.from(matches, m => m[1].trim())))
    }

    // Create template
    const template = await prisma.contractTemplate.create({
      data: {
        name: validatedInput.templateName,
        description: validatedInput.templateDescription || undefined,
        category: validatedInput.templateCategory || (contract.contractType || undefined),
        organizationId: orgId,
        createdById: session.user.id,
      },
    })

    // Create template sections
    for (const section of contract.sections) {
      const variables = extractVariables(section.body)

      await prisma.templateSection.create({
        data: {
          templateId: template.id,
          title: section.title,
          body: section.body,
          order: section.order,
          variables,
          isRequired: true,
        },
      })
    }

    // Log event
    await prisma.contractEvent.create({
      data: {
        contractId: contract.id,
        eventType: 'CREATED',
        userId: session.user.id,
        eventData: {
          action: 'converted_to_template',
          templateId: template.id,
        },
      },
    })

    return {
      success: true,
      templateId: template.id,
    }
  } catch (error) {
    console.error('Error converting contract to template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to template',
    }
  }
}

/**
 * Abandon conversation
 */
export async function abandonConversation(conversationId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const orgId = await getSessionOrgId(session)

    const conversation = await prisma.aiConversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation || conversation.organizationId !== orgId) {
      return { success: false, error: 'Conversation not found or unauthorized' }
    }

    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: {
        status: 'ABANDONED',
        completedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error abandoning conversation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to abandon conversation',
    }
  }
}

/**
 * Get extracted data for a contract by looking up its AI conversation.
 * Returns the merged extractedData from all conversation messages.
 */
export async function getContractExtractedData(contractId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized', extractedData: {} }
    }

    const orgId = await getSessionOrgId(session)

    const conversation = await prisma.aiConversation.findUnique({
      where: { generatedContractId: contractId },
    })

    if (!conversation || conversation.organizationId !== orgId) {
      return { success: true, extractedData: {} }
    }

    const extractedData = await getExtractedData(conversation.id)
    return { success: true, extractedData }
  } catch (error) {
    console.error('Error getting contract extracted data:', error)
    return { success: true, extractedData: {} }
  }
}
