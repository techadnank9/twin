import { NextResponse } from 'next/server'

// ElevenLabs premade voices — no API call needed, IDs are stable
const PREMADE_VOICES = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
  { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' },
  { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', category: 'premade' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade' },
  { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', category: 'premade' },
  { voice_id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', category: 'premade' },
  { voice_id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', category: 'premade' },
  { voice_id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', category: 'premade' },
  { voice_id: 'CYw3kZ78EXXs3XfPJ7IG', name: 'Dave', category: 'premade' },
  { voice_id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', category: 'premade' },
  { voice_id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', category: 'premade' },
  { voice_id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', category: 'premade' },
  { voice_id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', category: 'premade' },
  { voice_id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', category: 'premade' },
  { voice_id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', category: 'premade' },
  { voice_id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', category: 'premade' },
]

export async function GET() {
  // Try fetching account voices first (requires voices_read permission)
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    })
    if (res.ok) {
      const { voices } = await res.json()
      return NextResponse.json({
        voices: voices.map((v: { voice_id: string; name: string; category: string }) => ({
          voice_id: v.voice_id,
          name: v.name,
          category: v.category,
        })),
      })
    }
  } catch {
    // fall through to premade list
  }

  return NextResponse.json({ voices: PREMADE_VOICES })
}
