'use client'

import React, { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, NodeProps, Node } from '@xyflow/react'
import { X, Play } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

interface LLMNodeData extends Record<string, unknown> {
  model?: string
  systemPrompt?: string
  userMessage?: string
  imageUrls?: string[]
  text?: string
  status?: string
  output?: string
}

const LLMNode = ({ id, data }: NodeProps<Node<LLMNodeData>>) => {
  const { setNodes, getNodes, getEdges } = useReactFlow()
  const { updateNodeData } = useWorkflowStore()
  const [isRunning, setIsRunning] = useState(false)
  
  const isRunningRef = useRef(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const onModelChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, model: evt.target.value } }
        }
        return node
      })
    )
  }

  const onDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
  }

  const handleRun = async () => {
    // Prevent multiple simultaneous runs
    if (isRunningRef.current) return
    isRunningRef.current = true

    // Clear any existing poll interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    const nodes = getNodes()
    const edges = getEdges()

    // Find values from connected nodes by traversing edges
    const getConnectedValue = (targetHandle: string) => {
      const edge = edges.find(
        e => e.target === id && e.targetHandle === targetHandle
      )
      if (!edge) return null
      const sourceNode = nodes.find(n => n.id === edge.source)
      if (!sourceNode) return null
      // Check common data fields across different node types
      return (sourceNode.data as any)?.text || (sourceNode.data as any)?.imageUrl || (sourceNode.data as any)?.videoUrl || null
    }

    const getConnectedImages = () => {
      const imageEdges = edges.filter(
        e => e.target === id && e.targetHandle === 'images'
      )
      return imageEdges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        return ((sourceNode?.data as any)?.imageUrl as string) || null
      }).filter(Boolean) as string[]
    }

    const systemPrompt = (getConnectedValue('system_prompt') as string) || ''
    const userMessage = (getConnectedValue('user_message') as string) || ''
    const imageUrls = getConnectedImages()

    if (!userMessage) {
      alert('User message is required — connect a Text node to user_message')
      isRunningRef.current = false
      return
    }

    setIsRunning(true)
    updateNodeData(id, { status: 'running', output: null })

    try {
      // Trigger the task
      const res = await fetch('/api/execute/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: data.model || 'llama-3.3-70b-versatile',
          systemPrompt,
          userMessage,
          imageUrls,
          nodeId: id,
          workflowId: 'default', 
        })
      })

      const { triggerHandle } = await res.json()

      // Poll for completion
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/execute/status/${triggerHandle}`)
          const { status, output, error } = await statusRes.json()

          if (status === 'completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
            isRunningRef.current = false
            setIsRunning(false)
            updateNodeData(id, { status: 'success', output })
          } else if (status === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
            isRunningRef.current = false
            setIsRunning(false)
            updateNodeData(id, { status: 'error', output: error || 'Task failed' })
          }
        } catch (e) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
          isRunningRef.current = false
          setIsRunning(false)
        }
      }, 2000)

    } catch (err) {
      isRunningRef.current = false
      setIsRunning(false)
      updateNodeData(id, { status: 'error', output: 'Failed to start task' })
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'error' ? 'node-error' :
    data.status === 'success' ? 'node-success' : ''

  return (
    <div className={`group min-w-[280px] bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl shadow-xl transition-all ${statusClass}`}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#2a2a2e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
          <span className="text-[11px] font-medium text-[#888] uppercase tracking-wider">Run LLM</span>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2e] rounded-lg transition-all text-[#555] hover:text-white">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest block mb-1.5">Model</label>
          <select 
            value={(data.model as string) || 'llama-3.3-70b-versatile'} 
            onChange={onModelChange}
            className="w-full bg-[#131315] border border-[#2a2a2e] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#7c3aed] transition-colors appearance-none cursor-pointer"
          >
            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
            <option value="llama-3.2-11b-vision-preview">llama-3.2-11b-vision (with images)</option>
            <option value="gemma2-9b-it">gemma2-9b-it</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 relative py-0.5">
            <Handle type="target" position={Position.Left} id="system_prompt" style={{ background: '#3b82f6', width: 8, height: 8, border: 'none' }} className="!-left-[17px]" />
            <span className="text-[11px] text-[#888]">system_prompt <span className="text-[#444] ml-1">(optional)</span></span>
          </div>

          <div className="flex items-center gap-3 relative py-0.5">
            <Handle type="target" position={Position.Left} id="user_message" style={{ background: '#3b82f6', width: 8, height: 8, border: 'none' }} className="!-left-[17px]" />
            <span className="text-[11px] text-[#888] font-medium">user_message</span>
          </div>

          <div className="flex items-center gap-3 relative py-0.5">
            <Handle type="target" position={Position.Left} id="images" style={{ background: '#10b981', width: 8, height: 8, border: 'none' }} className="!-left-[17px]" />
            <span className="text-[11px] text-[#888]">images <span className="text-[#444] ml-1">(multiple)</span></span>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`w-full py-2 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all
            ${isRunning
              ? 'bg-purple-800 cursor-not-allowed opacity-70'
              : 'bg-[#7c3aed] hover:bg-[#6d28d9] cursor-pointer shadow-lg shadow-purple-500/10'
            }`}
        >
          {isRunning ? (
            <><span className="animate-spin text-xs">⟳</span> Running...</>
          ) : (
            <><Play size={12} className="fill-white" /> Run LLM</>
          )}
        </button>

        {(data.output as string) && (
          <div className="pt-3 border-t border-[#2a2a2e] space-y-2">
            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest block">Output</label>
            <div className="bg-[#131315] border border-[#2a2a2e] rounded-lg p-2.5 max-h-[150px] overflow-y-auto">
              <p className="text-[12px] text-zinc-400 whitespace-pre-wrap leading-relaxed">{(data.output as string)}</p>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#7c3aed', width: 8, height: 8, border: 'none' }}
        className="!-right-[5px]"
      />
    </div>
  )
}

export default memo(LLMNode)
