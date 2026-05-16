import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().default('Untitled Workflow'),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  workflowId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const { name, nodes, edges, workflowId } = parsed.data
    console.log('Saving workflow:', name, nodes?.length, 'nodes')

    let workflow
    if (workflowId) {
      const existing = await prisma.workflow.findFirst({
        where: { id: workflowId, userId },
      })
      if (existing) {
        workflow = await prisma.workflow.update({
          where: { id: workflowId },
          data: { name, nodes, edges },
        })
      }
    }

    if (!workflow) {
      const existing = await prisma.workflow.findFirst({ where: { userId } })
      if (existing) {
        workflow = await prisma.workflow.update({
          where: { id: existing.id },
          data: { name, nodes, edges },
        })
      } else {
        workflow = await prisma.workflow.create({
          data: { userId, name, nodes, edges },
        })
      }
    }

    return NextResponse.json({ success: true, workflowId: workflow.id })
  } catch (err: any) {
    console.error('Save DB error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
