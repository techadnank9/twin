'use client'
import { useRef, useState, useCallback } from 'react'

// Web Speech API types are not universally available in TypeScript's DOM lib;
// declare them locally so we can reference them without ambient globals.
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: { readonly transcript: string; readonly confidence: number }
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  start(): void
  stop(): void
}

export function useMic(onFinalTranscript: (text: string) => void) {
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')

  const start = useCallback(() => {
    const SpeechRecognitionCtor: (new () => ISpeechRecognition) | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      console.warn('Web Speech API not supported')
      return false
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          onFinalTranscript(result[0].transcript.trim())
          setInterim('')
        } else {
          interimText += result[0].transcript
        }
      }
      setInterim(interimText)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    return true
  }, [onFinalTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }, [])

  return { listening, interim, start, stop }
}
