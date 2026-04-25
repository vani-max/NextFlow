'use client'

import React, { memo } from 'react'
import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react'
import { X } from 'lucide-react'

const TextNode = ({ id, data }: NodeProps) => {
  const { setNodes, updateNodeData } = useReactFlow()

  const onChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { text: evt.target.value })
  }

  const onDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
  }

  const statusClass =
    data.status === 'running' ? 'node-running' :
    data.status === 'error' ? 'node-error' :
    data.status === 'success' ? 'node-success' : ''

  return (
    <div className={`group min-w-[280px] bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl shadow-xl transition-all ${statusClass}`}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#2a2a2e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
          <span className="text-[11px] font-medium text-[#888] uppercase tracking-wider">Text</span>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2e] rounded-lg transition-all text-[#555] hover:text-white">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        <textarea
          value={(data.text as string) || ''}
          onChange={onChange}
          placeholder="Enter text..."
          className="w-full min-h-[100px] bg-[#131315] border border-[#2a2a2e] rounded-lg p-2.5 text-[13px] text-zinc-300 focus:outline-none focus:border-[#7c3aed] transition-colors resize-y placeholder-[#444]"
          rows={4}
        />
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

export default memo(TextNode)
