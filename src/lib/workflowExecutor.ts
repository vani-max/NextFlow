import { Node, Edge } from '@xyflow/react'

// Build adjacency list and in-degree map
export function buildDAG(nodes: Node[], edges: Edge[]) {
  const inDegree: Record<string, number> = {}
  const dependents: Record<string, string[]> = {}
  const dependencies: Record<string, string[]> = {}

  for (const node of nodes) {
    inDegree[node.id] = 0
    dependents[node.id] = []
    dependencies[node.id] = []
  }

  for (const edge of edges) {
    // Safety check — skip edges where source/target not in nodes
    if (!dependents[edge.source]) dependents[edge.source] = []
    if (!dependencies[edge.target]) dependencies[edge.target] = []
    if (!(edge.target in inDegree)) inDegree[edge.target] = 0

    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1
    dependents[edge.source].push(edge.target)
    dependencies[edge.target].push(edge.source)
  }

  return { inDegree, dependents, dependencies }
}
// Topological sort — returns groups of nodes that can run in parallel
export function getExecutionGroups(nodes: Node[], edges: Edge[]): string[][] {
  const { inDegree, dependents } = buildDAG(nodes, edges)
  const groups: string[][] = []
  const remaining = new Set(nodes.map(n => n.id))
  const localInDegree = { ...inDegree }

  while (remaining.size > 0) {
    // Find all nodes with no remaining dependencies
    const group = [...remaining].filter(id => localInDegree[id] === 0)
    if (group.length === 0) break // Cycle detected

    groups.push(group)

    // Remove this group and update in-degrees
    for (const id of group) {
      remaining.delete(id)
      for (const dependent of dependents[id]) {
        localInDegree[dependent]--
      }
    }
  }

  return groups
}

// Get the output value from a node based on its type
export function getNodeOutput(node: Node): string | null {
  switch (node.type) {
    case 'text': return node.data?.text || null
    case 'uploadImage': return node.data?.imageUrl || null
    case 'uploadVideo': return node.data?.videoUrl || null
    case 'llm': return node.data?.output || null
    case 'cropImage': return node.data?.outputImageUrl || null
    case 'extractFrame': return node.data?.outputImageUrl || null
    default: return null
  }
}

// Resolve input for a node handle from connected nodes
export function resolveInput(
  nodeId: string,
  handleId: string,
  nodes: Node[],
  edges: Edge[]
): string | string[] | null {
  const connectedEdges = edges.filter(
    e => e.target === nodeId && e.targetHandle === handleId
  )

  if (connectedEdges.length === 0) return null

  // For images handle — return array (multiple images supported)
  if (handleId === 'images') {
    return connectedEdges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      return sourceNode ? getNodeOutput(sourceNode) : null
    }).filter(Boolean) as string[]
  }

  // For single handles — return first connected value
  const sourceNode = nodes.find(n => n.id === connectedEdges[0].source)
  return sourceNode ? getNodeOutput(sourceNode) : null
}
