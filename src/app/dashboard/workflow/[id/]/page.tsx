import WorkflowCanvas from '@/components/WorkflowCanvas'
import LeftSidebar from '@/components/sidebar/LeftSidebar'
import RightSidebar from '@/components/sidebar/RightSidebar'
import TopToolbar from '@/components/TopToolbar'
import { ReactFlowProvider } from '@xyflow/react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-black overflow-hidden">
        <TopToolbar />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <WorkflowCanvas workflowId={id} />
          <RightSidebar />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
