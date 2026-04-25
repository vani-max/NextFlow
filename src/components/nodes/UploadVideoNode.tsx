'use client'

import React, { memo, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react'
import { X, Upload, Loader2 } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

const UploadVideoNode = ({ id, data }: NodeProps) => {
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

      updateNodeData(id, { videoUrl: uploaded.ssl_url || uploaded.url, fileName: file.name })
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

  const removeVideo = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, { videoUrl: null, fileName: null })
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
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[11px] font-medium text-[#888] uppercase tracking-wider">Upload Video</span>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a2e] rounded-lg transition-all text-[#555] hover:text-white">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        <input type="file" ref={fileInputRef} onChange={onFileChange} accept="video/mp4,video/quicktime,video/webm,video/x-m4v" className="hidden" />

        {isUploading ? (
          <div className="border border-[#2a2a2e] bg-[#131315] rounded-xl p-6 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-[#7c3aed] animate-spin" />
            <p className="text-[11px] text-[#7c3aed] font-medium">Uploading...</p>
          </div>
        ) : !data.videoUrl ? (
          <div
            onClick={triggerUpload}
            className="border border-[#2a2a2e] bg-[#131315] hover:bg-[#1a1a1c] hover:border-[#7c3aed] rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group/upload"
          >
            <Upload className="w-5 h-5 text-[#444] group-hover/upload:text-[#7c3aed] transition-colors" />
            <p className="text-[11px] text-[#444] text-center">
              Drop video or <span className="text-[#7c3aed] font-medium">click to upload</span>
            </p>
            <p className="text-[10px] text-[#333]">MP4, MOV, WEBM</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative group/preview rounded-xl overflow-hidden border border-[#2a2a2e] bg-black">
              <video src={data.videoUrl as string} controls className="w-full max-h-[150px]" />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/preview:opacity-100 transition-opacity z-10">
                <button onClick={triggerUpload} className="p-1.5 bg-black/60 hover:bg-black/80 rounded-md transition-colors">
                  <Upload className="w-3 h-3 text-white" />
                </button>
                <button onClick={removeVideo} className="p-1.5 bg-red-500/40 hover:bg-red-500/60 rounded-md transition-colors">
                  <X className="w-3 h-3 text-white" />
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
        style={{ background: '#f59e0b', width: 8, height: 8, border: 'none' }}
        className="!-right-[5px]"
      />
    </div>
  )
}

export default memo(UploadVideoNode)
