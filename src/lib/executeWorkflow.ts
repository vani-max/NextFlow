import { Node, Edge } from '@xyflow/react'
import { getExecutionGroups } from './workflowExecutor'

interface ExecuteOptions {
  nodes: Node[]
  edges: Edge[]
  updateNodeData: (id: string, data: any) => void
  setEdgeAnimation: (targetNodeId: string, animated: boolean) => void
  selectedNodeIds?: string[]
}

export async function executeWorkflow({
  nodes, edges, updateNodeData, setEdgeAnimation, selectedNodeIds
}: ExecuteOptions) {

  // Filter nodes if partial execution
  const targetNodes = selectedNodeIds
    ? nodes.filter(n => selectedNodeIds.includes(n.id))
    : nodes

  // Get execution groups (parallel batches)
  const groups = getExecutionGroups(targetNodes, edges)
  console.log('Execution groups:', groups)

  // Create workflow run
  const runRes = await fetch('/api/workflow/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodes, edges,
      scope: selectedNodeIds ? 'partial' : 'full',
      selectedNodeIds,
      workflowId: 'default',
    })
  })
  const { workflowRunId } = await runRes.json()

  // Initialize nodeDataMap with existing node data
  const nodeDataMap: Record<string, any> = {}
  for (const node of nodes) {
    nodeDataMap[node.id] = { ...node.data }
  }

  // Execute groups sequentially, nodes within group in parallel
  for (const group of groups) {
    console.log('Executing group:', group)

    // Mark all nodes in group as running and animate incoming edges
    for (const nodeId of group) {
      updateNodeData(nodeId, { status: 'running' })
      setEdgeAnimation(nodeId, true)
    }

    // Execute all nodes in group simultaneously
    await Promise.all(group.map(async (nodeId) => {
      await executeNode({
        nodeId, nodes, edges, updateNodeData, workflowRunId, nodeDataMap
      })
      // After node completes, stop animating incoming edges
      setEdgeAnimation(nodeId, false)
    }))
  }
}

async function executeNode({
  nodeId, nodes, edges, updateNodeData, workflowRunId, nodeDataMap
}: {
  nodeId: string
  nodes: Node[]
  edges: Edge[]
  updateNodeData: (id: string, data: any) => void
  workflowRunId: string
  nodeDataMap: Record<string, any>
}) {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return

  // Helper to get output from a connected node using nodeDataMap
  const getConnectedOutput = (targetHandle: string): string | null => {
    const edge = edges.find(e => e.target === nodeId && e.targetHandle === targetHandle)
    if (!edge) return null
    const sourceData = nodeDataMap[edge.source]
    if (!sourceData) return null
    return sourceData.text || sourceData.imageUrl || sourceData.videoUrl ||
           sourceData.output || sourceData.outputImageUrl || null
  }

  const getConnectedImages = (): string[] => {
    return edges
      .filter(e => e.target === nodeId && e.targetHandle === 'images')
      .map(e => {
        const sourceData = nodeDataMap[e.source]
        return sourceData?.imageUrl || sourceData?.outputImageUrl || null
      })
      .filter(Boolean) as string[]
  }

  // Text and Upload nodes don't need execution
  if (['text', 'uploadImage', 'uploadVideo'].includes(node.type!)) {
    updateNodeData(nodeId, { status: 'success' })
    return
  }

  try {
    switch (node.type) {
      case 'llm': {
        const systemPrompt = getConnectedOutput('system_prompt') || ''
        const userMessage = getConnectedOutput('user_message') || ''
        const imageUrls = getConnectedImages()

        if (!userMessage) {
          updateNodeData(nodeId, { status: 'error', output: 'No user message connected' })
          return
        }

        const res = await fetch('/api/execute/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: node.data?.model || 'llama-3.3-70b-versatile',
            systemPrompt, userMessage,
            imageUrls,
            nodeId, workflowId: 'default'
          })
        })
        const resData = await res.json()
        const triggerHandle = resData.triggerHandle
        const output = await pollForResult(triggerHandle)
        
        // Update both the map and the UI
        nodeDataMap[nodeId] = { ...nodeDataMap[nodeId], output }
        updateNodeData(nodeId, { status: 'success', output })
        break
      }

      case 'cropImage': {
        const imageUrl = getConnectedOutput('image_url') || ''
        if (!imageUrl) {
          updateNodeData(nodeId, { status: 'error' })
          return
        }
        const xPercent = Number(getConnectedOutput('x_percent')) || node.data?.xPercent || 0
        const yPercent = Number(getConnectedOutput('y_percent')) || node.data?.yPercent || 0
        const widthPercent = Number(getConnectedOutput('width_percent')) || node.data?.widthPercent || 50
        const heightPercent = Number(getConnectedOutput('height_percent')) || node.data?.heightPercent || 50

        const res = await fetch('/api/execute/crop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, xPercent, yPercent, widthPercent, heightPercent, nodeId, workflowId: 'default' })
        })
        const resText = await res.text()
        const resData = JSON.parse(resText)
        const triggerHandle = resData.triggerHandle
        const output = await pollForResult(triggerHandle)
        
        nodeDataMap[nodeId] = { ...nodeDataMap[nodeId], outputImageUrl: output }
        updateNodeData(nodeId, { status: 'success', outputImageUrl: output })
        break
      }

      case 'extractFrame': {
        const videoUrl = getConnectedOutput('video_url') || ''
        if (!videoUrl) {
          updateNodeData(nodeId, { status: 'error' })
          return
        }
        const timestamp = getConnectedOutput('timestamp') || node.data?.timestamp || '0'

        const res = await fetch('/api/execute/extract-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl, timestamp, nodeId, workflowId: 'default' })
        })
        const resText = await res.text()
        const resData = JSON.parse(resText)
        const triggerHandle = resData.triggerHandle
        const output = await pollForResult(triggerHandle)
        
        nodeDataMap[nodeId] = { ...nodeDataMap[nodeId], outputImageUrl: output }
        updateNodeData(nodeId, { status: 'success', outputImageUrl: output })
        break
      }
    }
  } catch (err: any) {
    console.error('Node execution failed:', nodeId, err)
    updateNodeData(nodeId, { status: 'error', output: err.message })
  }
}

async function pollForResult(triggerHandle: string, maxAttempts = 120): Promise<string> {
  if (!triggerHandle) throw new Error('No trigger handle provided')
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000)) // 3 seconds between polls
    
    try {
      const res = await fetch(`/api/execute/status/${triggerHandle}`)
      const text = await res.text()
      if (!text || text.trim() === '') continue
      
      const data = JSON.parse(text)
      const { status, output } = data
      
      if (status === 'completed') return output
      if (status === 'failed') throw new Error('Task failed')
    } catch (e: any) {
      if (e.message === 'Task failed') throw e
      continue
    }
  }
  throw new Error('Timeout waiting for task')
}
