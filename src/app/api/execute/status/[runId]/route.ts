import { NextRequest, NextResponse } from 'next/server'
import { runs } from '@trigger.dev/sdk/v3'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params
    console.log('Checking status for runId:', runId)

    if (!runId || runId === 'undefined') {
      return NextResponse.json({ status: 'failed', error: 'Invalid run ID' })
    }

    const triggerRun = await runs.retrieve(runId)
    console.log('Trigger run status:', triggerRun.status)

    if (triggerRun.status === 'COMPLETED') {
      const output = (triggerRun.output as any)?.output
      const nodeId = (triggerRun.output as any)?.nodeId
      const workflowRunId = (triggerRun.output as any)?.workflowRunId

      if (workflowRunId && nodeId) {
        await prisma.nodeRun.updateMany({
          where: { workflowRunId, nodeId },
          data: {
            status: 'success',
            outputData: { output },
            duration: triggerRun.durationMs,
          }
        }).catch(e => console.log('DB update error:', e.message))

        const workflowRun = await prisma.workflowRun.findUnique({
          where: { id: workflowRunId }
        })
        if (workflowRun?.scope === 'single') {
          await prisma.workflowRun.update({
            where: { id: workflowRunId },
            data: { status: 'success', duration: triggerRun.durationMs }
          }).catch(e => console.log('DB update error:', e.message))
        }
      }

      return NextResponse.json({ status: 'completed', output })
    }

    if (triggerRun.status === 'FAILED' ||
        triggerRun.status === 'CRASHED' ||
        triggerRun.status === 'SYSTEM_FAILURE') {
      return NextResponse.json({ status: 'failed', error: 'Task failed' })
    }

    if (triggerRun.status === 'CANCELED') {
      return NextResponse.json({ status: 'failed', error: 'Task canceled' })
    }

    // Still running
    return NextResponse.json({ status: 'running' })

  } catch (err: any) {
    console.error('Status check error:', err.message)
    // Return running instead of error so polling continues
    return NextResponse.json({ status: 'running' })
  }
}
