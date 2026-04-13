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
    const video = videoRef.current
    if (!video || !video.srcObject) return  // guard against cleared srcObject
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    video.volume = 1
    try {
      await video.play()
      video.muted = false
      setPlaybackBlocked(false)
    } catch (error: unknown) {
      // AbortError = interrupted by another play() call or element removed — not a real block
      if (error instanceof Error && error.name === 'AbortError') return
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

      // 2. Set up WebRTC peer connection — force TURN relay to bypass NAT
      const pc = new RTCPeerConnection({
        iceServers: ice_servers,
        iceTransportPolicy: 'relay',
      })
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
        if (pc.connectionState === 'connected') {
          setConnected(true)
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Avatar connection lost — please refresh the page')
          setConnected(false)
        }
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
      // connected is set via onconnectionstatechange, with an 8s fallback
      setTimeout(() => {
        if (!stateRef.current) return
        setConnected((prev) => {
          if (!prev) console.warn('WebRTC did not reach connected state — forcing ready')
          return true
        })
      }, 8000)
    } catch (err) {
      console.warn('Avatar connection warning', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [playRemoteMedia, sourceUrl])

  const playTTS = useCallback(async (text: string): Promise<void> => {
    const res = await fetch('/api/voice/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceId, text }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    return new Promise((resolve) => {
      const audio = new Audio(url)
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
      audio.play().catch(() => resolve())
    })
  }, [voiceId])

  const speak = useCallback(async (text: string) => {
    // Always play ElevenLabs TTS directly — reliable audio regardless of WebRTC
    const ttsPromise = playTTS(text)

    // Also fire D-ID stream/talk for lip-sync animation (best-effort, don't throw)
    if (stateRef.current) {
      const { streamId, sessionId } = stateRef.current
      fetch('/api/stream/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, sessionId, text, voiceId }),
      }).catch(() => {/* animation failed, audio still plays */})
    }

    await ttsPromise
  }, [voiceId, playTTS])

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

  const resumePlayback = useCallback(async () => {
    if (!videoRef.current) return
    videoRef.current.muted = false
    try {
      await videoRef.current.play()
      setPlaybackBlocked(false)
    } catch {
      // Still blocked — video will play muted
    }
  }, [])

  return { videoRef, connected, error, playbackBlocked, connect, speak, disconnect, resumePlayback }
}
