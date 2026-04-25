import { create } from 'zustand'
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, OnNodesChange, OnEdgesChange, OnConnect, Connection } from '@xyflow/react'

interface WorkflowStore {
  nodes: Node[]
  edges: Edge[]
  history: { nodes: Node[], edges: Edge[] }[]
  historyIndex: number
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (node: Node) => void
  undo: () => void
  redo: () => void
  pushHistory: () => void
  setEdgeAnimation: (targetNodeId: string, animated: boolean) => void
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  history: [],
  historyIndex: -1,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } }
        }
        return node
      }),
    })
  },
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection: Connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDasharray: 'none',
      },
    }
    set({ edges: addEdge(newEdge, get().edges) })
  },
  addNode: (node) => {
    get().pushHistory()
    set({ nodes: [...get().nodes, node] })
  },
  setEdgeAnimation: (targetNodeId: string, animated: boolean) => {
    set({
      edges: get().edges.map(edge =>
        edge.target === targetNodeId
          ? {
              ...edge,
              animated,
              style: {
                stroke: animated ? '#7c3aed' : '#3b82f6',
                strokeWidth: animated ? 2.5 : 2,
                strokeDasharray: animated ? '8 4' : 'none',
                filter: animated ? 'drop-shadow(0 0 6px rgba(124,58,237,0.8))' : 'none',
              }
            }
          : edge
      )
    })
  },
  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) })
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const prev = history[historyIndex - 1]
    set({ nodes: prev.nodes, edges: prev.edges, historyIndex: historyIndex - 1 })
  },
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const next = history[historyIndex + 1]
    set({ nodes: next.nodes, edges: next.edges, historyIndex: historyIndex + 1 })
  },
}))
