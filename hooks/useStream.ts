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
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playbackBlocked, setPlaybackBlocked] = useState(false)

  const playRemoteMedia = useCallback(async () => {
    if (!videoRef.current) return

    videoRef.current.autoplay = true
    videoRef.current.playsInline = true
    videoRef.current.muted = false
    videoRef.current.volume = 1

    try {
      await videoRef.current.play()
      setPlaybackBlocked(false)
    } catch (error) {
      console.warn('Remote media playback was blocked', error)
      setPlaybackBlocked(true)
    }
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    setPlaybackBlocked(false)
    try {
      // 1. Create D-ID stream → get SDP offer
      const createRes = await fetch('/api/stream/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl }),
      })
      if (!createRes.ok) {
        const errorBody = await createRes.json().catch(() => null)
        console.warn('Stream creation failed', {
          status: createRes.status,
          sourceUrl,
          errorBody,
        })
        throw new Error(errorBody?.error ?? 'Failed to create stream')
      }
      const { id: streamId, session_id: sessionId, offer, ice_servers } = await createRes.json()

      // 2. Set up WebRTC peer connection
      const pc = new RTCPeerConnection({ iceServers: ice_servers })
      const remoteStream = new MediaStream()
      remoteStreamRef.current = remoteStream

      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream
      }

      pc.ontrack = (event) => {
        console.info('Received remote track', {
          kind: event.track.kind,
          streams: event.streams.map((stream) => ({
            id: stream.id,
            tracks: stream.getTracks().map((track) => track.kind),
          })),
        })

        const hasTrackAlready = remoteStream.getTracks().some((track) => track.id === event.track.id)
        if (!hasTrackAlready) {
          remoteStream.addTrack(event.track)
        }

        if (videoRef.current) {
          if (videoRef.current.srcObject !== remoteStream) {
            videoRef.current.srcObject = remoteStream
          }
          queueMicrotask(() => {
            void playRemoteMedia()
          })
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

      pc.onconnectionstatechange = () => {
        console.info('Peer connection state changed', pc.connectionState)
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
      console.warn('Avatar connection warning', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [playRemoteMedia, sourceUrl])

  const speak = useCallback(async (text: string) => {
    if (!stateRef.current) return
    const { streamId, sessionId } = stateRef.current
    const response = await fetch('/api/stream/talk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamId, sessionId, text, voiceId }),
    })
    const body = await response.json().catch(() => null)

    console.info('Talk response', {
      status: response.status,
      body,
    })

    if (!response.ok) {
      throw new Error(body?.error ?? 'Talk failed')
    }
  }, [voiceId])

  const disconnect = useCallback(async () => {
    if (!stateRef.current) return
    const { streamId, sessionId, pc } = stateRef.current
    pc.close()
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    await fetch('/api/stream/close', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamId, sessionId }),
    })
    stateRef.current = null
    remoteStreamRef.current = null
    setConnected(false)
    setPlaybackBlocked(false)
  }, [])

  return { videoRef, connected, error, playbackBlocked, connect, speak, disconnect, resumePlayback: playRemoteMedia }
}
