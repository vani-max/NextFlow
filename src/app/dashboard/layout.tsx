'use client'

import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWorkflowPage = pathname.includes('/dashboard/workflow')

  if (isWorkflowPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
