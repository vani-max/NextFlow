import { Node, Edge } from '@xyflow/react'

export const sampleWorkflow: { name: string, nodes: Node[], edges: Edge[] } = {
 name: 'NextFlow Sample Workflow',
  nodes: [
    // Branch A - Image Processing
    {
      id: 'upload-image-1',
      type: 'uploadImage',
      position: { x: 100, y: 100 },
      data: { label: 'Upload Image' }
    },
    {
      id: 'text-system-1',
      type: 'text',
      position: { x: 100, y: 320 },
      data: {
        label: 'System Prompt',
        text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.'
      }
    },
    {
      id: 'text-product-1',
      type: 'text',
      position: { x: 100, y: 520 },
      data: {
        label: 'Product Details',
        text: 'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.'
      }
    },
    {
      id: 'crop-image-1',
      type: 'cropImage',
      position: { x: 450, y: 100 },
      data: {
        label: 'Crop Image',
        xPercent: 10,
        yPercent: 10,
        widthPercent: 80,
        heightPercent: 80,
      }
    },
    {
      id: 'llm-1',
      type: 'llm',
      position: { x: 800, y: 200 },
      data: {
        label: 'LLM - Product Description',
        model: 'gemini-2.0-flash',
      }
    },

    // Branch B - Video Processing
    {
      id: 'upload-video-1',
      type: 'uploadVideo',
      position: { x: 100, y: 750 },
      data: { label: 'Upload Video' }
    },
    {
      id: 'extract-frame-1',
      type: 'extractFrame',
      position: { x: 450, y: 750 },
      data: {
        label: 'Extract Frame',
        timestamp: '50%',
      }
    },

    // Convergence - Final LLM
    {
      id: 'text-system-2',
      type: 'text',
      position: { x: 800, y: 650 },
      data: {
        label: 'Final System Prompt',
        text: 'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.'
      }
    },
    {
      id: 'llm-2',
      type: 'llm',
      position: { x: 1150, y: 500 },
      data: {
        label: 'LLM - Marketing Tweet',
        model: 'gemini-2.0-flash',
      }
    },
  ],
  edges: [
    // Branch A connections
    { id: 'e1', source: 'upload-image-1', target: 'crop-image-1', sourceHandle: 'output', targetHandle: 'image_url', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },
    { id: 'e2', source: 'text-system-1', target: 'llm-1', sourceHandle: 'output', targetHandle: 'system_prompt', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },
    { id: 'e3', source: 'text-product-1', target: 'llm-1', sourceHandle: 'output', targetHandle: 'user_message', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },
    { id: 'e4', source: 'crop-image-1', target: 'llm-1', sourceHandle: 'output', targetHandle: 'images', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },

    // Branch B connections
    { id: 'e5', source: 'upload-video-1', target: 'extract-frame-1', sourceHandle: 'output', targetHandle: 'video_url', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },

    // Convergence connections
    { id: 'e6', source: 'text-system-2', target: 'llm-2', sourceHandle: 'output', targetHandle: 'system_prompt', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },
    { id: 'e7', source: 'llm-1', target: 'llm-2', sourceHandle: 'output', targetHandle: 'user_message', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },
    { id: 'e8', source: 'crop-image-1', target: 'llm-2', sourceHandle: 'output', targetHandle: 'images', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },
    { id: 'e9', source: 'extract-frame-1', target: 'llm-2', sourceHandle: 'output', targetHandle: 'images', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1.5 }, type: 'smoothstep' },
  ]
}
