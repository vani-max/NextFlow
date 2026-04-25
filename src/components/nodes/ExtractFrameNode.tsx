'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, useReactFlow, useHandleConnections, NodeProps, Node } from '@xyflow/react'
import { X, Play, Loader2 } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

interface ExtractFrameNodeData extends Record<string, unknown> {
  videoUrl?: string
  outputImageUrl?: string
  status?: string
  timestamp?: string
}

const ExtractFrameNode = ({ id, data }: NodeProps<Node<ExtractFrameNodeData>>) => {
  const { setNodes, getNodes, getEdges } = useReactFlow()
  const { updateNodeData } = useWorkflowStore()
  const [isRunning, setIsRunning] = useState(false)

  const onValueChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { timestamp: evt.target.value })
  }

  const onDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
  }

  const handleRun = async () => {
    const nodes = getNodes()
    const edges = getEdges()

    const getConnectedValue = (targetHandle: string) => {
      const edge = edges.find(e => e.target === id && e.targetHandle === targetHandle)
      if (!edge) return null
      const sourceNode = nodes.find(n => n.id === edge.source)
      return sourceNode?.data?.videoUrl || sourceNode?.data?.output || sourceNode?.data?.outputImageUrl || sourceNode?.data?.text || null
    }

    const videoUrl = (getConnectedValue('video_url') as string) || (data.videoUrl as string)
    const timestamp = (getConnectedValue('timestamp') as string) || (data.timestamp as string) || '0'

    if (!videoUrl) {
      alert('Video is required — connect a Video node')
      return
    }

    setIsRunning(true)
    updateNodeData(id, { status: 'running', outputImageUrl: null })

    try {
      const res = await fetch('/api/execute/extract-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl, timestamp,
          nodeId: id, workflowId: 'default'
        })
      })

      const responseData = await res.json()
      console.log('Extract API response:', responseData)

      const triggerHandle = responseData.triggerHandle
      if (!triggerHandle) {
        throw new Error('No trigger handle returned: ' + JSON.stringify(responseData))
      }

      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/execute/status/${triggerHandle}`)
          if (!statusRes.ok) {
            console.error('Status check failed:', statusRes.status)
            return
          }
          const data = await statusRes.json()
          const { status, output, error } = data

          if (status === 'completed') {
            clearInterval(poll)
            setIsRunning(false)
            updateNodeData(id, { status: 'success', outputImageUrl: output })
          } else if (status === 'failed') {
            clearInterval(poll)
            setIsRunning(false)
            updateNodeData(id, { status: 'error', output: error || 'Task failed' })
          }
        } catch (e) {
          console.error('Poll error:', e)
        }
      }, 2000)
    } catch (err) {
      setIsRunning(false)
      updateNodeData(id, { status: 'error', output: 'Failed to start task' })
    }
  }

  const videoConnected = useHandleConnections({ type: 'target', id: 'video_url' }).length > 0
  const timestampConnected = useHandleConnections({ type: 'target', id: 'timestamp' }).length > 0

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'error' ? 'node-error' :
    data.status === 'success' ? 'node-success' : ''

  return (
    <div className={`group min-w-[280px] bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl shadow-xl transition-all ${statusClass}`}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#2a2a2e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[11px] font-medium text-[#888] uppercase tracking-wider">Extract Frame</span>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2e] rounded-lg transition-all text-[#555] hover:text-white">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-4">
        <div className="flex items-center gap-3 relative py-0.5">
          <Handle type="target" position={Position.Left} id="video_url" style={{ background: '#f59e0b', width: 8, height: 8, border: 'none' }} className="!-left-[17px]" />
          <span className={`text-[11px] ${(videoConnected as boolean) ? 'text-[#888]' : 'text-[#555]'} font-medium`}>video</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 relative py-0.5">
            <div className="flex items-center gap-3">
              <Handle type="target" position={Position.Left} id="timestamp" style={{ background: '#3b82f6', width: 8, height: 8, border: 'none' }} className="!-left-[17px]" />
              <span className={`text-[11px] ${(timestampConnected as boolean) ? 'text-[#888]' : 'text-[#555]'}`}>timestamp</span>
            </div>
            <input
              type="text"
              disabled={timestampConnected}
              value={(data.timestamp as string) || ''}
              onChange={onValueChange}
              placeholder="0s"
              className={`w-20 bg-[#131315] border ${(timestampConnected as boolean) ? 'border-[#222] text-[#333]' : 'border-[#2a2a2e] text-zinc-300 focus:border-[#7c3aed]'} rounded px-1.5 py-1 text-[11px] focus:outline-none transition-all text-right`}
            />
          </div>
          <p className="text-[9px] text-[#444] italic pl-5">Enter seconds (5) or percentage (50%)</p>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`w-full py-2 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all
            ${isRunning
              ? 'bg-amber-800 cursor-not-allowed opacity-70'
              : 'bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer shadow-lg shadow-amber-500/10'
            }`}
        >
          {isRunning ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Running...</>
          ) : (
            <><Play size={12} className="fill-white" /> Run Frame</>
          )}
        </button>

        {(data.outputImageUrl as string) && (
          <div className="pt-3 border-t border-[#2a2a2e]">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Extracted Frame</p>
            <div className="rounded-xl overflow-hidden border border-[#2a2a2e] bg-[#131315]">
              <img
                src={data.outputImageUrl as string}
                alt="frame"
                className="w-full max-h-[150px] object-cover"
              />
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#10b981', width: 8, height: 8, border: 'none' }}
        className="!-right-[5px]"
      />
    </div>
  )
}

export default memo(ExtractFrameNode)
