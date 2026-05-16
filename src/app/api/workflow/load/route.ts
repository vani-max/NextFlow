import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sampleWorkflow } from '@/lib/sampleWorkflow'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id === 'sample') {
    return NextResponse.json({ workflow: sampleWorkflow })
  }

  try {
    const workflow = id
      ? await prisma.workflow.findFirst({ where: { id, userId } })
      : await prisma.workflow.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' }
        })

    return NextResponse.json({ workflow: workflow || null })
  } catch (error) {
    console.error('Error loading workflow:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
