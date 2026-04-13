'use client'
import { useEffect, useRef, useState } from 'react'
import { useStream } from '@/hooks/useStream'

interface Props {
  sourceUrl: string
  previewUrl: string
  voiceId: string
  name: string
  onReady: (speak: (text: string) => Promise<void>) => void
  onDisconnect?: () => void
}

export function AvatarStream({ sourceUrl, previewUrl, voiceId, name, onReady, onDisconnect }: Props) {
  const { videoRef, connected, error, playbackBlocked, connect, speak, disconnect, resumePlayback } = useStream(sourceUrl, voiceId)
  const [videoReady, setVideoReady] = useState(false)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    connect()
    return () => {
      disconnect()
      onDisconnect?.()
    }
  }, [connect, disconnect, onDisconnect])

  useEffect(() => {
    if (connected) onReady(speak)
  }, [connected, onReady, speak])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        Connection error: {error}
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center h-full">
      {!videoReady && (
        <img
          src={previewUrl}
          alt={`${name} avatar preview`}
          className="rounded-xl max-h-[60vh] aspect-[3/4] object-cover"
        />
      )}
      {!connected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-sm rounded-xl z-10 gap-2">
          <div className="animate-pulse">Connecting avatar…</div>
          <div className="text-zinc-400 text-xs">This may take up to 10 seconds</div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedData={() => setVideoReady(true)}
        onPlaying={() => setVideoReady(true)}
        className={`rounded-xl max-h-[60vh] aspect-[3/4] object-cover ${videoReady ? 'opacity-100' : 'opacity-0'} transition-opacity`}
      />
      {playbackBlocked && (
        <button
          type="button"
          onClick={() => void resumePlayback()}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl z-20 gap-3 cursor-pointer"
        >
          <span className="text-5xl">🔊</span>
          <span className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm">
            Tap to enable audio
          </span>
        </button>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-1 rounded-full whitespace-nowrap">
        {name} • AI Twin
      </div>
    </div>
  )
}
