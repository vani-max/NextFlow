import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const workflowId = searchParams.get('workflowId')

  let workflow = null
  if (workflowId) {
    workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId }
    })
  } else {
    workflow = await prisma.workflow.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })
  }

  if (!workflow) return NextResponse.json({ runs: [] })

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: workflow.id, userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { nodeRuns: { orderBy: { createdAt: 'asc' } } }
  })

  return NextResponse.json({ runs })
}
