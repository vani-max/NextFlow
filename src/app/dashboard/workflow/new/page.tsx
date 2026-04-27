import WorkflowCanvas from '@/components/WorkflowCanvas'
import LeftSidebar from '@/components/sidebar/LeftSidebar'
import RightSidebar from '@/components/sidebar/RightSidebar'
import TopToolbar from '@/components/TopToolbar'
import { ReactFlowProvider } from '@xyflow/react'

export default function NewWorkflowPage() {
  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-black overflow-hidden">
        <TopToolbar />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <WorkflowCanvas loadEmpty={true} />
          <RightSidebar />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
