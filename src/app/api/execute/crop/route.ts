import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { tasks } from '@trigger.dev/sdk/v3'
import { cropImageTask } from '@/trigger/crop-image-task'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const maxDuration = 60

const schema = z.object({
  imageUrl: z.string().url(),
  xPercent: z.number().min(0).max(100).default(0),
  yPercent: z.number().min(0).max(100).default(0),
  widthPercent: z.number().min(1).max(100).default(100),
  heightPercent: z.number().min(1).max(100).default(100),
  nodeId: z.string(),
  workflowId: z.string(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { imageUrl, xPercent, yPercent, widthPercent, heightPercent, nodeId } = parsed.data

  let workflow = await prisma.workflow.findFirst({ where: { userId } })
  if (!workflow) {
    workflow = await prisma.workflow.create({
      data: { userId, name: 'Untitled Workflow', nodes: [], edges: [] }
    })
  }

  const workflowRun = await prisma.workflowRun.create({
    data: { workflowId: workflow.id, userId, status: 'running', scope: 'single' }
  })

const handle = await tasks.trigger<typeof cropImageTask>('crop-image-task', {
  imageUrl, xPercent, yPercent, widthPercent, heightPercent,
  nodeId, workflowRunId: workflowRun.id,
})

console.log('Trigger handle:', handle.id)
  return NextResponse.json({
    success: true,
    triggerHandle: handle.id,
    runId: workflowRun.id,
  })
}
