import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    console.log('File name:', file.name, 'Size:', file.size, 'Type:', file.type)

    const buffer = Buffer.from(await file.arrayBuffer())
    const authKey = process.env.TRANSLOADIT_KEY!

    const tFormData = new FormData()
    tFormData.append('params', JSON.stringify({
      auth: { key: authKey },
      steps: {
        ':original': { robot: '/upload/handle' },
      }
    }))

    // Attach file with explicit name and type
    tFormData.append(
      'file_1',
      new Blob([buffer], { type: file.type || 'image/jpeg' }),
      file.name || 'upload.jpg'
    )

    const response = await fetch('https://api2.transloadit.com/assemblies', {
      method: 'POST',
      body: tFormData,
    })

    let current = await response.json()
    console.log('Initial status:', current.ok, 'error:', current.error)

    if (current.error) {
      return NextResponse.json({ error: current.error }, { status: 500 })
    }

    let attempts = 0
    while (current.ok !== 'ASSEMBLY_COMPLETED' && attempts < 30) {
      await new Promise(r => setTimeout(r, 1500))
      const poll = await fetch(
        `https://api2.transloadit.com/assemblies/${current.assembly_id}`
      )
      current = await poll.json()
      attempts++
      if (current.error) {
        return NextResponse.json({ error: current.error }, { status: 500 })
      }
    }

    console.log('Final assembly:', JSON.stringify(current).slice(0, 500))

    // Check uploads array directly
    const uploadedFiles = current.uploads || []
    console.log('Uploads array:', JSON.stringify(uploadedFiles).slice(0, 300))

    const uploaded = uploadedFiles[0] || 
(Object.values(current.results || {}) as any[])?.[0]?.[0]
    if (!uploaded) {
      return NextResponse.json({ error: 'No file in results' }, { status: 500 })
    }

    const url = uploaded.ssl_url || uploaded.url
    console.log('Final URL:', url)

    return NextResponse.json({ url })

  } catch (err: any) {
    console.error('Upload error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
