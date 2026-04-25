import { NextRequest, NextResponse } from 'next/server'
import { runs } from '@trigger.dev/sdk/v3'
import { prisma } from '@/lib/prisma'

interface TaskOutput {
  output: string
  nodeId: string
  workflowRunId: string
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params
  const triggerRun = await runs.retrieve(runId)

  if (triggerRun.status === 'COMPLETED') {
    const taskOutput = triggerRun.output as unknown as TaskOutput
    const output = taskOutput.output
    const nodeId = taskOutput.nodeId
    const workflowRunId = taskOutput.workflowRunId

    // Update NodeRun in DB
    await prisma.nodeRun.updateMany({
      where: { workflowRunId, nodeId },
      data: {
        status: 'success',
        outputData: { output },
        duration: triggerRun.durationMs,
      }
    })

    // Update WorkflowRun in DB
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: 'success', duration: triggerRun.durationMs }
    })

    return NextResponse.json({ status: 'completed', output })
  }

  if (triggerRun.status === 'FAILED') {
    return NextResponse.json({ status: 'failed', error: 'Task failed' })
  }

  return NextResponse.json({ status: 'running' })
}
