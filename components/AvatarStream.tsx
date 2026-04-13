'use client'
import { useEffect } from 'react'
import { useStream } from '@/hooks/useStream'

interface Props {
  sourceUrl: string
  voiceId: string
  name: string
  onReady: (speak: (text: string) => Promise<void>) => void
  onDisconnect?: () => void
}

export function AvatarStream({ sourceUrl, voiceId, name, onReady, onDisconnect }: Props) {
  const { videoRef, connected, error, connect, speak, disconnect } = useStream(sourceUrl, voiceId)

  useEffect(() => {
    connect()
    return () => {
      disconnect()
      onDisconnect?.()
    }
  }, [])

  useEffect(() => {
    if (connected) onReady(speak)
  }, [connected])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        Connection error: {error}
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center h-full">
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm rounded-xl z-10">
          Connecting avatar…
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-xl max-h-[60vh] aspect-[3/4] object-cover"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-1 rounded-full whitespace-nowrap">
        {name} • AI Twin
      </div>
    </div>
  )
}
