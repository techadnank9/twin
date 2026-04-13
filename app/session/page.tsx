'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AvatarStream } from '@/components/AvatarStream'
import { ConversationEngine } from '@/components/ConversationEngine'
import { useStore } from '@/lib/store'

export default function SessionPage() {
  const router = useRouter()
  const { config, clearHistory } = useStore()
  const [speakFn, setSpeakFn] = useState<((text: string) => Promise<void>) | null>(null)
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([])

  const handleReady = useCallback((speak: (text: string) => Promise<void>) => {
    setSpeakFn(() => speak)
  }, [])

  const handleTranscript = useCallback((text: string, role: 'user' | 'assistant') => {
    setTranscript((prev) => [...prev.slice(-4), { role, text }])
  }, [])

  const handleEnd = () => {
    clearHistory()
    router.push('/')
  }

  if (!config.sourceUrl || !config.voiceId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Setup not complete.</p>
          <button
            onClick={() => router.push('/setup')}
            className="bg-white text-black px-6 py-2 rounded-lg font-medium"
          >
            Go to Setup
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Avatar area */}
      <div className="flex-1 relative">
        <AvatarStream
          sourceUrl={config.sourceUrl}
          previewUrl={config.previewUrl || config.sourceUrl}
          voiceId={config.voiceId}
          name={config.name}
          onReady={handleReady}
        />

        {/* Transcript overlay */}
        {transcript.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 space-y-1 pointer-events-none">
            {transcript.slice(-2).map((t, i) => (
              <p
                key={i}
                className={`text-sm px-3 py-1 rounded-lg max-w-lg ${
                  t.role === 'user'
                    ? 'bg-zinc-800/80 text-zinc-300 ml-auto text-right'
                    : 'bg-zinc-900/90 text-white'
                }`}
              >
                {t.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-3 flex items-center gap-4">
        <ConversationEngine
          speak={speakFn}
          onTranscript={handleTranscript}
        />
        <button
          onClick={handleEnd}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg ml-auto shrink-0 transition-colors"
        >
          End Session
        </button>
      </div>
    </main>
  )
}
