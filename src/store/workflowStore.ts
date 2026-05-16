import { create } from 'zustand'
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, OnNodesChange, OnEdgesChange, OnConnect, Connection } from '@xyflow/react'

interface WorkflowStore {
  nodes: Node[]
  edges: Edge[]
  past: { nodes: Node[], edges: Edge[] }[]
  future: { nodes: Node[], edges: Edge[] }[]
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (node: Node) => void
  undo: () => void
  redo: () => void
  setEdgeAnimation: (targetNodeId: string, animated: boolean) => void
  activeWorkflowId: string | null
  setActiveWorkflowId: (id: string | null) => void
  reset: () => void
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  activeWorkflowId: null,

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
    const { nodes, edges, past } = get()
    set({
      past: [...past, { nodes: [...nodes], edges: [...edges] }],
      future: [],
      edges: addEdge({
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      }, edges),
    })
  },

  addNode: (node: Node) => {
    const { nodes, edges, past } = get()
    set({
      past: [...past, { nodes: [...nodes], edges: [...edges] }],
      future: [],
      nodes: [...nodes, node],
    })
  },

  undo: () => {
    const { past, nodes, edges, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      future: [{ nodes: [...nodes], edges: [...edges] }, ...future],
      nodes: previous.nodes,
      edges: previous.edges,
    })
  },

  redo: () => {
    const { past, nodes, edges, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      past: [...past, { nodes: [...nodes], edges: [...edges] }],
      future: future.slice(1),
      nodes: next.nodes,
      edges: next.edges,
    })
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

  setActiveWorkflowId: (id: string | null) => set({ activeWorkflowId: id }),

  reset: () => {
    set({
      nodes: [],
      edges: [],
      past: [],
      future: [],
    })
  },
}))
