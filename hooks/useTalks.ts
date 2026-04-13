'use client'
import { useRef, useState, useCallback } from 'react'

export function useTalks(sourceUrl: string, voiceId: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Play ElevenLabs TTS audio immediately, then show D-ID video when ready
  const speak = useCallback(async (text: string) => {
    setError(null)

    // 1. Play TTS audio immediately (no waiting for video)
    const ttsPromise = (async () => {
      try {
        const res = await fetch('/api/voice/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId, text }),
        })
        if (!res.ok) return
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        await new Promise<void>((resolve) => {
          const audio = new Audio(url)
          audio.onended = () => { URL.revokeObjectURL(url); resolve() }
          audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
          audio.play().catch(() => resolve())
        })
      } catch {
        // TTS failed silently
      }
    })()

    // 2. Generate D-ID talking video in parallel
    const videoPromise = (async () => {
      try {
        const createRes = await fetch('/api/talks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl, text, voiceId }),
        })
        if (!createRes.ok) return
        const { id } = await createRes.json()

        // Poll for completion (max 60s)
        let resultUrl: string | null = null
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2000))
          const statusRes = await fetch(`/api/talks/status?id=${id}`)
          if (!statusRes.ok) break
          const { status, result_url } = await statusRes.json()
          if (status === 'done' && result_url) { resultUrl = result_url; break }
          if (status === 'error') break
        }

        if (!resultUrl || !videoRef.current) return

        // Play the generated video (muted — audio already played via TTS)
        setPlaying(true)
        videoRef.current.src = resultUrl
        videoRef.current.muted = true
        videoRef.current.onended = () => {
          setPlaying(false)
          if (videoRef.current) videoRef.current.src = ''
        }
        await videoRef.current.play().catch(() => setPlaying(false))
      } catch {
        // Video failed silently — audio already played
      }
    })()

    // Wait for audio to finish (video plays async in background)
    await ttsPromise
    videoPromise.catch(() => {})
  }, [sourceUrl, voiceId])

  return { videoRef, playing, error, speak }
}
