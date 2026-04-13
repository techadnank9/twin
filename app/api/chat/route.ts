import { NextResponse } from 'next/server'
import { streamChat } from '@/lib/claude'
import type { Message } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { message, history, persona, apiKey } = await req.json()
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    let full = ''
    await streamChat(
      history as Message[],
      message,
      persona || '',
      (chunk) => {
        full += chunk
      },
      apiKey
    )

    return new Response(full, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('chat error:', err)
    const message = err instanceof Error ? err.message : 'Chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
