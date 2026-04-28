import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { tasks } from '@trigger.dev/sdk/v3'
import { llmTask } from '@/trigger/llm-task'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60

const schema = z.object({
  model: z.string(),
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1),
  imageUrls: z.array(z.string()).optional(),
  nodeId: z.string(),
  workflowId: z.string(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { model, systemPrompt, userMessage, imageUrls, nodeId, workflowId } = parsed.data
  
  // Check if there's already a running task for this node
  const existingRun = await prisma.nodeRun.findFirst({
    where: {
      nodeId,
      status: 'running',
      createdAt: {
        gte: new Date(Date.now() - 30000) // within last 30 seconds
      }
    }
  })

  if (existingRun) {
    return NextResponse.json(
      { error: 'Task already running for this node' },
      { status: 429 }
    )
  }

  // Create WorkflowRun recor
  // Get or create a default workflow for this user
let workflow = await prisma.workflow.findFirst({
  where: { userId }
})

if (!workflow) {
  workflow = await prisma.workflow.create({
    data: {
      userId,
      name: 'Untitled Workflow',
      nodes: [],
      edges: [],
    }
  })
}

// Create WorkflowRun record
const workflowRun = await prisma.workflowRun.create({
  data: {
    workflowId: workflow.id,
    userId,
    status: 'running',
    scope: 'single',
  }
})

  // Create NodeRun record
  const nodeRun = await prisma.nodeRun.create({
    data: {
      workflowRunId: workflowRun.id,
      nodeId,
      nodeType: 'llm',
      status: 'running',
      inputData: { model, systemPrompt, userMessage, imageUrls },
    }
  })

  // Trigger the task
  const handle = await tasks.trigger<typeof llmTask>('llm-task', {
    model,
    systemPrompt,
    userMessage: userMessage || '',
    imageUrls,
    nodeId,
    workflowRunId: workflowRun.id,
  })

  return NextResponse.json({
    success: true,
    runId: workflowRun.id,
    nodeRunId: nodeRun.id,
    triggerHandle: handle.id,
  })
}
