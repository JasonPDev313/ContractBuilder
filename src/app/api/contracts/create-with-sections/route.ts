import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionOrgId } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, expiresAt, sections } = body

    if (!title || !sections || sections.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one section are required' },
        { status: 400 }
      )
    }

    const orgId = await getSessionOrgId(session)

    // Create contract with sections in a transaction
    const contract = await prisma.contract.create({
      data: {
        title,
        description: description || null,
        content: null, // Section-based contract, content is null
        status: 'DRAFT',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        organizationId: orgId,
        createdById: session.user.id,
        sections: {
          create: sections.map((section: any, index: number) => ({
            title: section.title,
            body: section.body,
            order: section.order ?? index,
            isEdited: false,
          })),
        },
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error creating contract with sections:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}
