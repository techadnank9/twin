'use client'
import { useRef, useState, useCallback } from 'react'

interface StreamState {
  streamId: string
  sessionId: string
  pc: RTCPeerConnection
}

export function useStream(sourceUrl: string, voiceId: string) {
  const stateRef = useRef<StreamState | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setError(null)
    try {
      // 1. Create D-ID stream → get SDP offer
      const createRes = await fetch('/api/stream/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl }),
      })
      if (!createRes.ok) throw new Error('Failed to create stream')
      const { id: streamId, session_id: sessionId, offer, ice_servers } = await createRes.json()

      // 2. Set up WebRTC peer connection
      const pc = new RTCPeerConnection({ iceServers: ice_servers })

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
        }
      }

      pc.onicecandidate = async ({ candidate }) => {
        if (!candidate) return
        await fetch('/api/stream/ice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId, sessionId, candidate: candidate.toJSON() }),
        })
      }

      // 3. Set remote description (D-ID's SDP offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // 4. Create and send SDP answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await fetch('/api/stream/sdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, sessionId, answer }),
      })

      stateRef.current = { streamId, sessionId, pc }
      setConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [sourceUrl])

  const speak = useCallback(async (text: string) => {
    if (!stateRef.current) return
    const { streamId, sessionId } = stateRef.current
    await fetch('/api/stream/talk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamId, sessionId, text, voiceId }),
    })
  }, [voiceId])

  const disconnect = useCallback(async () => {
    if (!stateRef.current) return
    const { streamId, sessionId, pc } = stateRef.current
    pc.close()
    await fetch('/api/stream/close', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamId, sessionId }),
    })
    stateRef.current = null
    setConnected(false)
  }, [])

  return { videoRef, connected, error, connect, speak, disconnect }
}
