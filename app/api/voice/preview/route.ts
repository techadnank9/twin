import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { voiceId, text } = await req.json()
    if (!voiceId) return NextResponse.json({ error: 'voiceId required' }, { status: 400 })

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text || "Hi, I'm your AI twin. How can I help you today?",
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`)

    const audio = await res.arrayBuffer()
    return new Response(audio, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (err) {
    console.error('voice/preview error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
