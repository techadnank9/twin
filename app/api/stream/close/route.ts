import { NextResponse } from 'next/server'
import { closeStream } from '@/lib/did'

export async function DELETE(req: Request) {
  try {
    const { streamId, sessionId } = await req.json()
    await closeStream(streamId, sessionId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('stream/close error:', err)
    return NextResponse.json({ error: 'Close failed' }, { status: 500 })
  }
}
