'use client'

import React, { memo, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react'
import { X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

const UploadImageNode = ({ id, data }: NodeProps) => {
  const { setNodes } = useReactFlow()
  const { updateNodeData } = useWorkflowStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFileChange = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('params', JSON.stringify({
        auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY },
        steps: {
          ':original': { robot: '/upload/handle' },
        }
      }))
      formData.append('file_1', file, file.name)

      const response = await fetch('https://api2.transloadit.com/assemblies', {
        method: 'POST',
        body: formData,
      })

      console.log('Status:', response.status)
      const text = await response.text()
      console.log('Raw response:', text.slice(0, 300))

      let assembly
      try {
        assembly = JSON.parse(text)
      } catch (e) {
        throw new Error(`Invalid response: ${text.slice(0, 100)}`)
      }

      while (assembly.ok !== 'ASSEMBLY_COMPLETED') {
        await new Promise(r => setTimeout(r, 1500))
        const poll = await fetch(`https://api2.transloadit.com/assemblies/${assembly.assembly_id}`)
        const pollText = await poll.text()
        try {
          assembly = JSON.parse(pollText)
        } catch (e) {
          throw new Error(`Invalid poll response: ${pollText.slice(0, 100)}`)
        }
        if (assembly.error) throw new Error(assembly.error)
      }

      const uploaded = assembly.uploads?.[0] || Object.values(assembly.results || {})?.[0]?.[0]
      if (!uploaded) throw new Error('Upload failed')

      updateNodeData(id, { imageUrl: uploaded.ssl_url || uploaded.url, fileName: file.name })
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const onDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, { imageUrl: null, fileName: null })
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
          <div className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span className="text-[11px] font-medium text-[#888] uppercase tracking-wider">Upload Image</span>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2e] rounded-lg transition-all text-[#555] hover:text-white">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
        
        {isUploading ? (
          <div className="border border-[#2a2a2e] bg-[#131315] rounded-xl p-6 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-[#7c3aed] animate-spin" />
            <p className="text-[11px] text-[#7c3aed] font-medium">Uploading...</p>
          </div>
        ) : !data.imageUrl ? (
          <div 
            onClick={triggerUpload}
            className="border border-[#2a2a2e] bg-[#131315] hover:bg-[#1a1a1c] hover:border-[#7c3aed] rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group/upload"
          >
            <Upload className="w-5 h-5 text-[#444] group-hover/upload:text-[#7c3aed] transition-colors" />
            <p className="text-[11px] text-[#444] text-center">
              Drop image or <span className="text-[#7c3aed] font-medium">click to upload</span>
            </p>
            <p className="text-[10px] text-[#333]">JPG, PNG, WEBP, GIF</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative group/preview rounded-xl overflow-hidden border border-[#2a2a2e] bg-[#131315]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.imageUrl as string} alt="Preview" className="w-full max-h-[150px] object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center gap-4 transition-opacity">
                <button onClick={triggerUpload} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <ImageIcon className="w-4 h-4 text-white" />
                </button>
                <button onClick={removeImage} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors">
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#555] truncate text-center font-medium">{data.fileName as string}</p>
          </div>
        )}

        {error && (
          <p className="text-[10px] text-red-500/80 mt-2 text-center font-medium">{error}</p>
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

export default memo(UploadImageNode)
