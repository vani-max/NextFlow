'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  Node,
  PanOnScrollMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '@/store/workflowStore'
import { Loader2 } from 'lucide-react'

// Import custom nodes
import TextNode from './nodes/TextNode'
import UploadImageNode from './nodes/UploadImageNode'
import UploadVideoNode from './nodes/UploadVideoNode'
import LLMNode from './nodes/LLMNode'
import CropImageNode from './nodes/CropImageNode'
import ExtractFrameNode from './nodes/ExtractFrameNode'

const nodeTypes = {
  text: TextNode,
  uploadImage: UploadImageNode,
  uploadVideo: UploadVideoNode,
  llm: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: {
    stroke: '#3b82f6',
    strokeWidth: 2,
    strokeDasharray: 'none',
  },
}

interface WorkflowCanvasProps {
  workflowId?: string
  loadEmpty?: boolean
}

export default function WorkflowCanvas({ workflowId, loadEmpty }: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setNodes,
    setEdges,
    undo,
    redo,
    reset,
  } = useWorkflowStore()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWorkflow = async () => {
      setIsLoading(true)
      
      if (loadEmpty) {
        reset()
        setIsLoading(false)
        return
      }

      try {
        const url = workflowId 
          ? `/api/workflow/load?id=${workflowId}` 
          : '/api/workflow/load'
        
        const res = await fetch(url)
        const { workflow } = await res.json()
        
        if (workflow && workflow.nodes?.length > 0) {
          setNodes(workflow.nodes)
          setEdges(workflow.edges)
        } else if (workflowId !== 'sample') {
          // If loading a specific ID failed or is empty, clear
          reset()
        }
      } catch (error) {
        console.error('Error loading workflow:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadWorkflow()
  }, [workflowId, loadEmpty, setNodes, setEdges, reset])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const bounds = event.currentTarget.getBoundingClientRect()
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: type, status: 'idle' },
      }

      addNode(newNode)
    },
    [addNode]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#0d0d0d]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 h-full relative outline-none bg-[#0d0d0d]" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={true}
        snapGrid={[24, 24]}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={['Delete', 'Backspace']}
        colorMode="dark"
        panOnScroll={true}
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnScroll={false}
        zoomOnPinch={true}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1f1f1f" />
        <Controls className="bg-[#111] border-[#222] fill-white" />
      </ReactFlow>
    </div>
  )
}
