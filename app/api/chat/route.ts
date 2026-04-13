import { NextResponse } from 'next/server'
import { streamChat } from '@/lib/claude'
import type { Message } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { message, history, persona } = await req.json()
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChat(
            history as Message[],
            message,
            persona || '',
            (chunk) => controller.enqueue(encoder.encode(chunk))
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('chat error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
