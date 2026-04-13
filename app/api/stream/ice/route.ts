import { NextResponse } from 'next/server'
import { sendIce } from '@/lib/did'

export async function POST(req: Request) {
  try {
    const { streamId, sessionId, candidate } = await req.json()
    await sendIce(streamId, sessionId, candidate)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('stream/ice error:', err)
    return NextResponse.json({ error: 'ICE failed' }, { status: 500 })
  }
}
