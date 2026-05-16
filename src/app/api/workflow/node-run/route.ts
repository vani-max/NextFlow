import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  workflowRunId: z.string(),
  nodeId: z.string(),
  nodeType: z.string(),
  status: z.string(),
  duration: z.number().optional(),
  outputData: z.any().optional(),
  errorMessage: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const nodeRun = await prisma.nodeRun.create({
    data: {
      workflowRunId: parsed.data.workflowRunId,
      nodeId: parsed.data.nodeId,
      nodeType: parsed.data.nodeType,
      status: parsed.data.status,
      duration: parsed.data.duration,
      outputData: parsed.data.outputData,
      errorMessage: parsed.data.errorMessage,
    }
  })

  return NextResponse.json({ success: true, nodeRun })
}
