import { NextResponse } from 'next/server'
import { createStream } from '@/lib/did'

export async function POST(req: Request) {
  try {
    const { sourceUrl } = await req.json()
    if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl required' }, { status: 400 })
    const data = await createStream(sourceUrl)
    return NextResponse.json(data)
  } catch (err) {
    console.error('stream/create error:', err)
    return NextResponse.json({ error: 'Stream create failed' }, { status: 500 })
  }
}
