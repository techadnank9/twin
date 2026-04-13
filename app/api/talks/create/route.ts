import { NextResponse } from 'next/server'

const BASE = 'https://api.d-id.com'

function didHeaders() {
  return {
    Authorization: `Basic ${process.env.DID_API_KEY!}`,
    'Content-Type': 'application/json',
    ...(process.env.ELEVENLABS_API_KEY
      ? { 'x-api-key-external': JSON.stringify({ elevenlabs: process.env.ELEVENLABS_API_KEY }) }
      : {}),
  }
}

export async function POST(req: Request) {
  try {
    const { sourceUrl, text, voiceId } = await req.json()
    if (!sourceUrl || !text || !voiceId) {
      return NextResponse.json({ error: 'sourceUrl, text, voiceId required' }, { status: 400 })
    }

    const res = await fetch(`${BASE}/talks`, {
      method: 'POST',
      headers: didHeaders(),
      body: JSON.stringify({
        source_url: sourceUrl,
        script: {
          type: 'text',
          input: text,
          provider: { type: 'elevenlabs', voice_id: voiceId },
        },
        config: { fluent: true, pad_audio: 0 },
      }),
    })

    if (!res.ok) throw new Error(`D-ID talks/create failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('talks/create error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
