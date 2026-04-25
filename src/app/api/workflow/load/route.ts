import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workflow = await prisma.workflow.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  })

  if (!workflow) {
    return NextResponse.json({ workflow: null })
  }

  return NextResponse.json({ workflow })
}
