import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  workflowId: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  scope: z.enum(['full', 'partial', 'single']).default('full'),
  selectedNodeIds: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { nodes, edges, scope, selectedNodeIds, workflowId } = parsed.data

  // Get or create workflow
  let workflow = await prisma.workflow.findFirst({ where: { userId } })
  if (!workflow) {
    workflow = await prisma.workflow.create({
      data: { userId, name: 'Untitled Workflow', nodes, edges }
    })
  }

  // Create WorkflowRun record
  const workflowRun = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      userId,
      status: 'running',
      scope,
    }
  })

  return NextResponse.json({
    success: true,
    workflowRunId: workflowRun.id,
  })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { workflowRunId, status } = body

  if (!workflowRunId || !status) {
    return NextResponse.json({ error: 'Missing workflowRunId or status' }, { status: 400 })
  }

  const run = await prisma.workflowRun.findFirst({
    where: { id: workflowRunId, userId },
  })
  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  await prisma.workflowRun.update({
    where: { id: workflowRunId },
    data: { status },
  })

  return NextResponse.json({ success: true })
}
