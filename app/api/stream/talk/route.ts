import { NextResponse } from 'next/server'
import { sendTalk } from '@/lib/did'

export async function POST(req: Request) {
  try {
    const { streamId, sessionId, text, voiceId } = await req.json()
    if (!streamId || !sessionId || !text || !voiceId) {
      return NextResponse.json(
        { error: 'streamId, sessionId, text, voiceId required' },
        { status: 400 }
      )
    }
    const result = await sendTalk(streamId, sessionId, text, voiceId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('stream/talk error:', err)
    return NextResponse.json({ error: 'Talk failed' }, { status: 500 })
  }
}
