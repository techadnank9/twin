import { NextResponse } from 'next/server'
import { cloneVoice } from '@/lib/elevenlabs'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const audio = form.get('audio') as Blob | null
    const name = (form.get('name') as string) || 'My Twin'
    if (!audio) {
      return NextResponse.json({ error: 'audio is required' }, { status: 400 })
    }
    const voice_id = await cloneVoice(audio, name)
    return NextResponse.json({ voice_id })
  } catch (err) {
    console.error('voice/clone error:', err)
    return NextResponse.json({ error: 'Voice clone failed' }, { status: 500 })
  }
}
