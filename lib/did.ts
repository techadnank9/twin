/// <reference lib="dom" />

const BASE = 'https://api.d-id.com'

function headers() {
  return {
    // D-ID uses Basic auth: base64(api_key + ':')
    Authorization: `Basic ${Buffer.from(process.env.DID_API_KEY! + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  }
}

export async function uploadImageUrl(imageUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/images`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ url: imageUrl, name: 'twin-avatar' }),
  })
  if (!res.ok) throw new Error(`D-ID uploadImage failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.url
}

export async function uploadImageFile(imageBlob: Blob): Promise<string> {
  const form = new FormData()
  form.append('image', imageBlob, 'avatar.jpg')
  const res = await fetch(`${BASE}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.DID_API_KEY! + ':').toString('base64')}`,
    },
    body: form,
  })
  if (!res.ok) throw new Error(`D-ID uploadImage failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.url
}

export async function createStream(sourceUrl: string) {
  const res = await fetch(`${BASE}/talks/streams`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ source_url: sourceUrl }),
  })
  if (!res.ok) throw new Error(`D-ID createStream failed: ${res.status}`)
  return res.json() as Promise<{ id: string; session_id: string; offer: RTCSessionDescriptionInit; ice_servers: RTCIceServer[] }>
}

export async function sendSdpAnswer(streamId: string, sessionId: string, answer: RTCSessionDescriptionInit) {
  const res = await fetch(`${BASE}/talks/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ answer, session_id: sessionId }),
  })
  if (!res.ok) throw new Error(`D-ID SDP failed: ${res.status}`)
}

export async function sendIce(streamId: string, sessionId: string, candidate: RTCIceCandidateInit) {
  const res = await fetch(`${BASE}/talks/streams/${streamId}/ice`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ candidate, session_id: sessionId }),
  })
  if (!res.ok) throw new Error(`D-ID ICE failed: ${res.status}`)
}

export async function sendTalk(streamId: string, sessionId: string, text: string, voiceId: string) {
  const res = await fetch(`${BASE}/talks/streams/${streamId}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      script: {
        type: 'text',
        input: text,
        provider: { type: 'elevenlabs', voice_id: voiceId },
      },
      session_id: sessionId,
      config: { stitch: true },
    }),
  })
  if (!res.ok) throw new Error(`D-ID sendTalk failed: ${res.status}`)
  return res.json()
}

export async function closeStream(streamId: string, sessionId: string) {
  const res = await fetch(`${BASE}/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!res.ok) throw new Error(`D-ID closeStream failed: ${res.status}`)
}
