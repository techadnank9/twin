const BASE = 'https://api.elevenlabs.io/v1'

function headers(json = false) {
  const h: Record<string, string> = { 'xi-api-key': process.env.ELEVENLABS_API_KEY! }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

export async function cloneVoice(audioBlob: Blob, name: string): Promise<string> {
  const form = new FormData()
  form.append('name', name)
  form.append('files', audioBlob, 'recording.wav')
  form.append('description', 'Twin voice clone')
  const res = await fetch(`${BASE}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    body: form,
  })
  if (!res.ok) throw new Error(`ElevenLabs cloneVoice failed: ${res.status}`)
  const data = await res.json()
  return data.voice_id
}

export async function textToSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`)
  return res.arrayBuffer()
}
