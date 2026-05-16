import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { tasks } from '@trigger.dev/sdk/v3'
import { extractFrameTask } from '@/trigger/extract-frame-task'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const maxDuration = 60

const schema = z.object({
  videoUrl: z.string().url(),
  timestamp: z.string().default('0'),
  nodeId: z.string(),
  workflowId: z.string(),
  workflowRunId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { videoUrl, timestamp, nodeId, workflowRunId } = parsed.data

  let workflowRun
  if (workflowRunId) {
    workflowRun = await prisma.workflowRun.findUnique({ where: { id: workflowRunId } })
  }

  if (!workflowRun) {
    let workflow = await prisma.workflow.findFirst({ where: { userId } })
    if (!workflow) {
      workflow = await prisma.workflow.create({
        data: { userId, name: 'Untitled Workflow', nodes: [], edges: [] }
      })
    }
    workflowRun = await prisma.workflowRun.create({
      data: { workflowId: workflow.id, userId, status: 'running', scope: 'single' }
    })
  }

const handle = await tasks.trigger<typeof extractFrameTask>('extract-frame-task', {
  videoUrl, timestamp, nodeId, workflowRunId: workflowRun.id,
})

console.log('Trigger handle:', handle.id)
  return NextResponse.json({
    success: true,
    triggerHandle: handle.id,
    runId: workflowRun.id,
  })
}
