'use client'
import { useState, useCallback, useRef } from 'react'
import { useMic } from '@/hooks/useMic'
import { useStore } from '@/lib/store'

interface Props {
  speak: ((text: string) => Promise<void>) | null
  onTranscript: (text: string, role: 'user' | 'assistant') => void
}

export function ConversationEngine({ speak, onTranscript }: Props) {
  const { config, history, addMessage } = useStore()
  const isSpeakingRef = useRef(false)
  const [fallbackText, setFallbackText] = useState('')
  const [speechSupported] = useState(() =>
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  )

  const handleFinal = useCallback(async (text: string) => {
    if (isSpeakingRef.current || !text.trim() || !speak) return
    isSpeakingRef.current = true

    addMessage({ role: 'user', content: text })
    onTranscript(text, 'user')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, persona: config.personaPrompt }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }

      addMessage({ role: 'assistant', content: full })
      onTranscript(full, 'assistant')
      await speak(full)
    } finally {
      isSpeakingRef.current = false
    }
  }, [speak, history, config.personaPrompt, addMessage, onTranscript])

  const { listening, interim, start, stop } = useMic(handleFinal)

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fallbackText.trim()) return
    await handleFinal(fallbackText.trim())
    setFallbackText('')
  }

  return (
    <div className="flex items-center gap-3 flex-1">
      {speechSupported ? (
        <button
          onClick={listening ? stop : () => start()}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg transition-colors shrink-0 ${
            listening ? 'bg-red-500 animate-pulse' : 'bg-zinc-600 hover:bg-zinc-500'
          }`}
          title={listening ? 'Stop listening' : 'Start listening'}
        >
          {listening ? '🎤' : '🎙️'}
        </button>
      ) : null}

      {!speechSupported ? (
        <form onSubmit={handleFallbackSubmit} className="flex gap-2 flex-1">
          <input
            value={fallbackText}
            onChange={(e) => setFallbackText(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none"
          />
          <button type="submit" className="bg-zinc-600 text-white px-3 py-2 rounded-lg text-sm">
            Send
          </button>
        </form>
      ) : (
        <p className="text-zinc-500 text-sm truncate flex-1">
          {interim || (listening ? 'Listening…' : 'Click mic to speak')}
        </p>
      )}
    </div>
  )
}
