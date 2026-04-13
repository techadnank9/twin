import { NextResponse } from 'next/server'
import { sendTalk } from '@/lib/did'

export function getMissingTalkFields(payload: {
  streamId?: string
  sessionId?: string
  text?: string
  voiceId?: string
}) {
  return (['streamId', 'sessionId', 'text', 'voiceId'] as const).filter((field) => !payload[field])
}

export async function POST(req: Request) {
  try {
    const { streamId, sessionId, text, voiceId } = await req.json()
    const missingFields = getMissingTalkFields({ streamId, sessionId, text, voiceId })
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
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
