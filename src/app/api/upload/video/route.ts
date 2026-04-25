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

    const buffer = Buffer.from(await file.arrayBuffer())
    const authKey = process.env.TRANSLOADIT_KEY!

    console.log('Uploading to Transloadit (Video), key:', authKey?.slice(0, 8))

    const tFormData = new FormData()
    tFormData.append('params', JSON.stringify({
      auth: { key: authKey },
      steps: {
        ':original': { robot: '/upload/handle' },
      }
    }))
    tFormData.append('file', new Blob([buffer], { type: file.type }), file.name)

    const response = await fetch('https://api2.transloadit.com/assemblies', {
      method: 'POST',
      body: tFormData,
    })

    const assembly = await response.json()
    console.log('Assembly response (Video):', JSON.stringify(assembly).slice(0, 200))

    if (assembly.error) {
      return NextResponse.json({ error: assembly.error }, { status: 500 })
    }

    // Poll for completion
    let current = assembly
    let attempts = 0

    while (current.ok !== 'ASSEMBLY_COMPLETED' && attempts < 30) {
      await new Promise(r => setTimeout(r, 1500))
      const poll = await fetch(
        `https://api2.transloadit.com/assemblies/${current.assembly_id}`
      )
      current = await poll.json()
      attempts++
      console.log('Poll status (Video):', current.ok, 'attempt:', attempts)
      if (current.error) {
        return NextResponse.json({ error: current.error }, { status: 500 })
      }
    }

    const uploaded = current.results?.[':original']?.[0]
    console.log('Uploaded video file:', uploaded?.ssl_url)

    if (!uploaded) {
      return NextResponse.json({ error: 'No file in results' }, { status: 500 })
    }

    return NextResponse.json({ url: uploaded.ssl_url || uploaded.url })

  } catch (err: any) {
    console.error('Upload error (Video):', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
