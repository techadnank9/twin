'use client'
import { useEffect } from 'react'
import { useTalks } from '@/hooks/useTalks'

interface Props {
  sourceUrl: string
  previewUrl: string
  voiceId: string
  name: string
  onReady: (speak: (text: string) => Promise<void>) => void
  onDisconnect?: () => void
}

export function AvatarStream({ sourceUrl, previewUrl, voiceId, name, onReady }: Props) {
  const { videoRef, playing, error, speak } = useTalks(sourceUrl, voiceId)

  // Ready immediately — no WebRTC handshake needed
  useEffect(() => {
    onReady(speak)
  }, [onReady, speak])

  return (
    <div className="relative flex items-center justify-center h-full">
      {/* Static photo — shown when video isn't playing */}
      <img
        src={previewUrl || sourceUrl}
        alt={`${name} avatar`}
        className={`rounded-xl max-h-[60vh] aspect-[3/4] object-cover transition-opacity duration-300 ${playing ? 'opacity-0 absolute' : 'opacity-100'}`}
      />

      {/* D-ID generated video — plays when ready */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`rounded-xl max-h-[60vh] aspect-[3/4] object-cover transition-opacity duration-300 ${playing ? 'opacity-100' : 'opacity-0 absolute'}`}
      />

      {error && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-red-900/80 text-red-300 text-xs px-3 py-1 rounded-full">
          {error}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-1 rounded-full whitespace-nowrap">
        {name} • AI Twin {playing ? '🎬' : ''}
      </div>
    </div>
  )
}
