'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, useReactFlow, useHandleConnections, NodeProps } from '@xyflow/react'
import { X, Play, Loader2 } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

const CropImageNode = ({ id, data }: NodeProps) => {
  const { setNodes, getNodes, getEdges } = useReactFlow()
  const { updateNodeData } = useWorkflowStore()
  const [isRunning, setIsRunning] = useState(false)

  const onValueChange = (field: string, value: string) => {
    updateNodeData(id, { [field]: parseInt(value) || 0 })
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
      return sourceNode?.data?.imageUrl || sourceNode?.data?.output || sourceNode?.data?.outputImageUrl || sourceNode?.data?.text || null
    }

    const imageUrl = (getConnectedValue('image_url') as string) || (data.imageUrl as string)
    const xPercent = (getConnectedValue('x_percent') as number) ?? (data.x_percent as number ?? 0)
    const yPercent = (getConnectedValue('y_percent') as number) ?? (data.y_percent as number ?? 0)
    const widthPercent = (getConnectedValue('width_percent') as number) ?? (data.width_percent as number ?? 100)
    const heightPercent = (getConnectedValue('height_percent') as number) ?? (data.height_percent as number ?? 100)

    if (!imageUrl) {
      alert('Connect an image node to the image input')
      return
    }

    setIsRunning(true)
    updateNodeData(id, { status: 'running', outputImageUrl: null })

    try {
      const res = await fetch('/api/execute/crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl, xPercent, yPercent, widthPercent, heightPercent,
          nodeId: id, workflowId: 'default'
        })
      })

      const responseData = await res.json()
      console.log('Crop API response:', responseData)

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

  const xConnected = useHandleConnections({ type: 'target', id: 'x_percent' }).length > 0
  const yConnected = useHandleConnections({ type: 'target', id: 'y_percent' }).length > 0
  const widthConnected = useHandleConnections({ type: 'target', id: 'width_percent' }).length > 0
  const heightConnected = useHandleConnections({ type: 'target', id: 'height_percent' }).length > 0
  const imageConnected = useHandleConnections({ type: 'target', id: 'image_url' }).length > 0

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'error' ? 'node-error' :
    data.status === 'success' ? 'node-success' : ''

  const fields = [
    { id: 'x_percent', label: 'x_percent', default: 0, connected: xConnected },
    { id: 'y_percent', label: 'y_percent', default: 0, connected: yConnected },
    { id: 'width_percent', label: 'width_percent', default: 50, connected: widthConnected },
    { id: 'height_percent', label: 'height_percent', default: 50, connected: heightConnected },
  ]

  return (
    <div className={`group min-w-[280px] bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl shadow-xl transition-all ${statusClass}`}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#2a2a2e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span className="text-[11px] font-medium text-[#888] uppercase tracking-wider">Crop Image</span>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2e] rounded-lg transition-all text-[#555] hover:text-white">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-4">
        <div className="flex items-center gap-3 relative py-0.5">
          <Handle type="target" position={Position.Left} id="image_url" style={{ background: '#10b981', width: 8, height: 8, border: 'none' }} className="!-left-[17px]" />
          <span className={`text-[11px] ${imageConnected ? 'text-[#888]' : 'text-[#555]'} font-medium`}>image</span>
        </div>

        <div className="space-y-2">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between gap-3 relative py-0.5">
              <div className="flex items-center gap-3">
                <Handle type="target" position={Position.Left} id={field.id} style={{ background: '#3b82f6', width: 8, height: 8, border: 'none' }} className="!-left-[17px]" />
                <span className={`text-[11px] ${field.connected ? 'text-[#888]' : 'text-[#555]'}`}>{field.label}</span>
              </div>
              <input
                type="number"
                disabled={field.connected}
                min={0}
                max={100}
                value={(data[field.id] as number) !== undefined ? (data[field.id] as number) : field.default}
                onChange={(e) => onValueChange(field.id, e.target.value)}
                className={`w-14 bg-[#131315] border ${field.connected ? 'border-[#222] text-[#333]' : 'border-[#2a2a2e] text-zinc-300 focus:border-[#7c3aed]'} rounded px-1.5 py-1 text-[11px] focus:outline-none transition-all text-right`}
              />
            </div>
          ))}
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
            <><Loader2 className="w-3 h-3 animate-spin" /> Running...</>
          ) : (
            <><Play size={12} className="fill-white" /> Run Crop</>
          )}
        </button>

        {data.outputImageUrl && (
          <div className="pt-3 border-t border-[#2a2a2e]">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Output</p>
            <div className="rounded-xl overflow-hidden border border-[#2a2a2e] bg-[#131315]">
              <img
                src={data.outputImageUrl as string}
                alt="cropped"
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

export default memo(CropImageNode)
