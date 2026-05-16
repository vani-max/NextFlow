'use client'
import { useEffect, useState } from 'react'
import { ChevronRight, ChevronLeft, History } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

interface WorkflowRun {
  id: string
  status: string
  scope: string
  duration: number | null
  createdAt: string
  nodeRuns: {
    nodeId: string
    nodeType: string
    status: string
    duration: number | null
    outputData: any
    errorMessage: string | null
  }[]
}

interface RightSidebarProps {
  workflowId?: string
}

export default function RightSidebar({ workflowId }: RightSidebarProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const { activeWorkflowId } = useWorkflowStore()
  const effectiveId = workflowId || activeWorkflowId

  const fetchRuns = async () => {
    try {
      const url = effectiveId
        ? `/api/workflow/history?workflowId=${effectiveId}`
        : '/api/workflow/history'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRuns(data.runs || [])
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  // Re-fetch when activeWorkflowId changes
  useEffect(() => {
    fetchRuns()
    const interval = setInterval(fetchRuns, 3000)
    return () => clearInterval(interval)
  }, [effectiveId])

  const statusColor = (status: string) => {
    if (status === 'success' || status === 'completed') return 'text-emerald-400'
    if (status === 'failed' || status === 'error') return 'text-red-400'
    if (status === 'running') return 'text-yellow-400'
    return 'text-gray-400'
  }

  const statusBadge = (status: string) => {
    if (status === 'success' || status === 'completed') return '✅'
    if (status === 'failed' || status === 'error') return '❌'
    if (status === 'running') return '⏳'
    return '○'
  }

  return (
    <div className="relative flex flex-shrink-0 h-full">
      {/* Toggle button — always visible, positioned on the left edge */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-50 w-6 h-6 bg-[#222] border border-[#333] rounded-full flex items-center justify-center hover:bg-[#333] transition-colors"
      >
        {collapsed
          ? <ChevronLeft size={12} className="text-white" />
          : <ChevronRight size={12} className="text-white" />
        }
      </button>

      {/* Sidebar content */}
      <div className={`flex flex-col bg-[#111111] border-l border-[#222] transition-all duration-300 overflow-hidden h-full ${collapsed ? 'w-0' : 'w-[280px]'}`}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-[#222] min-w-[280px]">
          <History size={16} className="text-[#666]" />
          <span className="text-white font-medium text-sm">Workflow History</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-w-[280px]">
          {runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-3xl mb-2 text-[#333]">🕐</span>
              <p className="text-[#666] text-sm">No runs yet. Run a workflow to see history.</p>
            </div>
          ) : (
            runs.map((run, index) => (
              <div key={run.id} className="bg-[#1a1a1a] border border-[#222] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  className="w-full p-3 text-left hover:bg-[#222] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">
                      Run #{runs.length - index}
                    </span>
                    <span className={`text-xs font-medium ${statusColor(run.status)}`}>
                      {statusBadge(run.status)} {run.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#666]">
                      {new Date(run.createdAt).toLocaleTimeString()}
                    </span>
                    <span className="text-[11px] text-[#666] capitalize">{run.scope}</span>
                  </div>
                </button>

                {expandedRun === run.id && (
                  <div className="border-t border-[#222] p-3 space-y-2">
                    {run.nodeRuns && run.nodeRuns.length > 0 ? (
                      run.nodeRuns.map((nodeRun: any) => (
                        <div key={nodeRun.id} className="text-[11px] bg-[#111] rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[#888] font-medium">
                              {nodeRun.nodeType} ({nodeRun.nodeId.slice(0, 8)})
                            </span>
                            <span className={
                              nodeRun.status === 'success' ? 'text-emerald-400' :
                              nodeRun.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                            }>
                              {nodeRun.status === 'success' ? '✅' : nodeRun.status === 'failed' ? '❌' : '⏳'}
                              {nodeRun.duration ? ` ${(nodeRun.duration/1000).toFixed(1)}s` : ''}
                            </span>
                          </div>
                          {nodeRun.outputData && (
                            <p className="text-[#555] truncate">
                              → {JSON.stringify(nodeRun.outputData).slice(0, 80)}
                            </p>
                          )}
                          {nodeRun.errorMessage && (
                            <p className="text-red-400 truncate">⚠ {nodeRun.errorMessage}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[#555] text-[11px]">No node details available</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
