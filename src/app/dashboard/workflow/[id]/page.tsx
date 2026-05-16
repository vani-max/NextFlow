'use client'

import { use } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import WorkflowCanvas from '@/components/WorkflowCanvas'
import LeftSidebar from '@/components/sidebar/LeftSidebar'
import RightSidebar from '@/components/sidebar/RightSidebar'
import TopToolbar from '@/components/TopToolbar'

export default function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a]">
        <LeftSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopToolbar workflowId={id} />
          <WorkflowCanvas workflowId={id} />
        </div>
        <RightSidebar workflowId={id} />
      </div>
    </ReactFlowProvider>
  )
}
