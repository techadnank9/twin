import { NextResponse } from 'next/server'
import { sendSdpAnswer } from '@/lib/did'

export async function POST(req: Request) {
  try {
    const { streamId, sessionId, answer } = await req.json()
    await sendSdpAnswer(streamId, sessionId, answer)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('stream/sdp error:', err)
    return NextResponse.json({ error: 'SDP failed' }, { status: 500 })
  }
}
