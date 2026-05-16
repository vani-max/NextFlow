'use client'

import { useRouter } from 'next/navigation'
import { Plus, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/workflow/list')
      .then(r => r.json())
      .then(d => {
        setWorkflows(d.workflows || [])
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load workflows', err)
        setIsLoading(false)
      })
  }, [])

  const userWorkflows = workflows.filter((w: any) =>
    !w.name?.toLowerCase().includes('sample') &&
    !w.name?.toLowerCase().includes('nextflow sample')
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 max-w-7xl mx-auto">
      <div 
        className="w-full rounded-3xl overflow-hidden mb-12 relative group"
        style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #0a0a0a 50%, #0d1a0d 100%)', height: '320px' }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col items-center justify-center h-full gap-5 relative z-10">
          <h1 className="text-white text-5xl font-light tracking-tight selection:bg-purple-500/30">
            Build AI workflows visually
          </h1>
          <p className="text-zinc-500 text-lg max-w-lg text-center leading-relaxed selection:bg-purple-500/30">
            Connect powerful AI nodes, automate processing, and generate media — all in one unified canvas.
          </p>
          <button
            onClick={() => router.push('/dashboard/workflow/new')}
            className="mt-4 flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-full text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Plus size={18} strokeWidth={3} />
            Create new workflow
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-medium flex items-center gap-2">
            Your Workflows
            <span className="bg-zinc-900 text-zinc-500 text-xs px-2 py-0.5 rounded-full">
              {userWorkflows.length}
            </span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          <button
            onClick={() => router.push('/dashboard/workflow/new')}
            className="aspect-video bg-[#111] border-2 border-dashed border-[#222] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-zinc-700 hover:bg-[#151515] transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] group-hover:bg-[#222] flex items-center justify-center transition-colors border border-white/5">
              <Plus size={24} className="text-zinc-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-zinc-500 text-sm font-medium group-hover:text-zinc-300 transition-colors">Start fresh canvas</span>
          </button>

          <button
            onClick={() => router.push('/dashboard/workflow/sample')}
            className="aspect-video bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden relative hover:border-[#7c3aed] transition-all group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">Sample Workflow</p>
              <p className="text-[#666] text-xs">9 nodes • parallel execution</p>
            </div>
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              Sample
            </div>
          </button>

          {userWorkflows.map((workflow: any) => (
            <button
              key={workflow.id}
              onClick={() => router.push(`/dashboard/workflow/${workflow.id}`)}
              className="aspect-video bg-[#111] border border-[#222] rounded-2xl overflow-hidden relative hover:border-zinc-700 transition-all group text-left"
            >
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="grid grid-cols-4 gap-1.5 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-10 h-8 bg-white rounded-md" />
                  ))}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <p className="text-white text-[15px] font-semibold mb-0.5 truncate group-hover:text-purple-300 transition-colors">
                    {workflow.name || 'Untitled Workflow'}
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                  <Clock size={12} />
                  <span>{new Date(workflow.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {userWorkflows.length === 0 && !isLoading && (
            <div className="mt-20 flex flex-col items-center justify-center text-zinc-600">
                <p>No workflows yet. Create your first one to get started.</p>
            </div>
        )}
      </div>
    </div>
  )
}
