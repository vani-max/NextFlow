'use client'

import React, { useState, useEffect } from 'react'
import { executeWorkflow } from '@/lib/executeWorkflow'
import { useWorkflowStore } from '@/store/workflowStore'
import { useReactFlow } from '@xyflow/react'
import { Play, Download, Save, Upload, Sparkles } from 'lucide-react'
import { sampleWorkflow } from '@/lib/sampleWorkflow'

export default function TopToolbar() {
  const [workflowName, setWorkflowName] = useState('Untitled Workflow')
  const [isSaving, setIsSaving] = useState(false)
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const { nodes, edges, setNodes, setEdges, setEdgeAnimation } = useWorkflowStore()
  const { updateNodeData } = useReactFlow()
  const [isRunning, setIsRunning] = useState(false)

  const [saved, setSaved] = useState(false)

  const handleLoadSample = () => {
    setNodes(sampleWorkflow.nodes)
    setEdges(sampleWorkflow.edges)
    setWorkflowName('NextFlow Sample Workflow')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/workflow/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges,
          workflowId,
        })
      })
      const data = await res.json()
      if (data.success) {
        setWorkflowId(data.workflowId)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to save workflow:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    const data = {
      name: workflowName,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.nodes && data.edges) {
          setNodes(data.nodes)
          setEdges(data.edges)
          if (data.name) setWorkflowName(data.name)
        }
      } catch (e) {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const handleRunWorkflow = async () => {
    if (isRunning) return
    setIsRunning(true)
    try {
      await executeWorkflow({ nodes, edges, updateNodeData, setEdgeAnimation })
    } catch (err) {
      console.error('Workflow failed:', err)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="h-12 bg-[#111] border-b border-[#222] flex items-center justify-between px-4 z-10">
      <div className="flex items-center flex-1">
        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="bg-transparent text-white text-sm font-medium outline-none border-b border-transparent hover:border-[#333] focus:border-[#7c3aed] transition-colors px-1 w-full max-w-[300px]"
          placeholder="Workflow Name"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] px-3 py-1.5 rounded-full text-xs text-white transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleLoadSample}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] px-3 py-1.5 rounded-full text-xs text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Sample
        </button>

        <label className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] px-3 py-1.5 rounded-full text-xs text-white transition-colors cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          Import
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] px-3 py-1.5 rounded-full text-xs text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <button
          onClick={handleRunWorkflow}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors shadow-lg
            ${isRunning
              ? 'bg-purple-800 opacity-70 cursor-not-allowed text-white/50'
              : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-purple-500/20 cursor-pointer'
            }`}
        >
          {isRunning ? (
            <><span className="animate-spin text-[10px]">⟳</span> Running...</>
          ) : (
            <><Play className="w-3.5 h-3.5 fill-white" /> Run Workflow</>
          )}
        </button>
      </div>

      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          ✅ Workflow saved!
        </div>
      )}
    </div>
  )
}
