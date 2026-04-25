import { task } from '@trigger.dev/sdk/v3'

export const extractFrameTask = task({
  id: 'extract-frame-task',
  retry: { maxAttempts: 1 },
  run: async (payload: {
    videoUrl: string
    timestamp: string
    nodeId: string
    workflowRunId: string
  }) => {
    const { videoUrl, timestamp, nodeId, workflowRunId } = payload

    const videoRes = await fetch(videoUrl)
    const buffer = await videoRes.arrayBuffer()
    const authKey = process.env.TRANSLOADIT_KEY!

    // Parse timestamp - support seconds or percentage
    const offset = timestamp?.includes('%')
      ? parseFloat(timestamp) / 100
      : parseFloat(timestamp || '0')

    const formData = new FormData()
    formData.append('params', JSON.stringify({
      auth: { key: authKey },
      steps: {
        ':original': { robot: '/upload/handle' },
        frame: {
          use: ':original',
          robot: '/video/thumbs',
          count: 1,
          offsets: [offset],
          format: 'jpg',
          width: 1280,
          height: 720,
        }
      }
    }))
    formData.append('file_1', new Blob([buffer]), 'video.mp4')

    const response = await fetch('https://api2.transloadit.com/assemblies', {
      method: 'POST', body: formData,
    })

    let assembly = await response.json()
    let attempts = 0

    while (assembly.ok !== 'ASSEMBLY_COMPLETED' && attempts < 30) {
      await new Promise(r => setTimeout(r, 1500))
      const poll = await fetch(`https://api2.transloadit.com/assemblies/${assembly.assembly_id}`)
      assembly = await poll.json()
      attempts++
      if (assembly.error) throw new Error(assembly.error)
    }

    console.log('Assembly uploads:', JSON.stringify(assembly.uploads))
    console.log('Assembly results:', JSON.stringify(assembly.results))

    const result = assembly.results?.frame?.[0] || 
      assembly.uploads?.[0] || 
      Object.values(assembly.results || {})?.[0]?.[0]
      
    console.log('Final result:', result?.ssl_url)

    if (!result) throw new Error('Frame extraction failed')

    return { output: result.ssl_url || result.url, nodeId, workflowRunId }
  }
})
