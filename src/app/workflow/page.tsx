import WorkflowCanvas from '@/components/WorkflowCanvas'
import LeftSidebar from '@/components/sidebar/LeftSidebar'
import RightSidebar from '@/components/sidebar/RightSidebar'
import TopToolbar from '@/components/TopToolbar'

export default function WorkflowPage() {
  return (
    <div className="flex h-screen w-screen bg-[#0d0d0d] overflow-hidden">
      <LeftSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopToolbar />
        <WorkflowCanvas />
      </div>
      <RightSidebar />
    </div>
  )
}
