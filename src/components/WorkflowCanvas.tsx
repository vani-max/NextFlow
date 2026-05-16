'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  PanOnScrollMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '@/store/workflowStore'
import { sampleWorkflow } from '@/lib/sampleWorkflow'
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
    activeWorkflowId,
    setActiveWorkflowId,
  } = useWorkflowStore()

  const [isLoading, setIsLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadWorkflow = async () => {
      setIsLoading(true)

      if (loadEmpty) {
        reset()
        setActiveWorkflowId(null)
        setIsLoading(false)
        return
      }

      if (!workflowId || workflowId === 'new') {
        // Clear canvas for new workflow
        setNodes([])
        setEdges([])
        setActiveWorkflowId(null)
        setIsLoading(false)
        return
      }

      if (workflowId === 'sample') {
        setNodes(sampleWorkflow.nodes)
        setEdges(sampleWorkflow.edges)
        setActiveWorkflowId(null) // sample has no DB id
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/workflow/load?id=${workflowId}`)
        const { workflow } = await res.json()
        if (workflow) {
          setNodes((workflow.nodes as Node[]) || [])
          setEdges(workflow.edges || [])
          setActiveWorkflowId(workflow.id)
          console.log('Loaded workflow:', workflow.id, workflow.nodes?.length, 'nodes')
        } else {
          reset()
        }
      } catch (err) {
        console.error('Failed to load workflow:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflow()
  }, [workflowId])

  // Auto-save whenever nodes or edges change (debounced 2s)
  useEffect(() => {
    if (!activeWorkflowId) return // don't auto-save new unsaved workflows
    if (nodes.length === 0) return // don't save empty canvas

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/workflow/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Untitled Workflow',
            nodes,
            edges,
            workflowId: activeWorkflowId,
          })
        })
        console.log('Auto-saved workflow')
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [nodes, edges, activeWorkflowId])

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
        <MiniMap
          style={{
            background: '#0d0d0d',
            border: '1px solid #2a2a2a',
            borderRadius: '10px',
            bottom: 80,
            right: 16,
          }}
          maskColor="rgba(0,0,0,0.7)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'text': return '#3b82f6'
              case 'uploadImage': return '#10b981'
              case 'uploadVideo': return '#f59e0b'
              case 'llm': return '#7c3aed'
              case 'cropImage': return '#10b981'
              case 'extractFrame': return '#f59e0b'
              default: return '#333'
            }
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  )
}
