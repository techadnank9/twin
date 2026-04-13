'use client'
import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

type Step = 'photo' | 'voice' | 'persona'
const STEPS: Step[] = ['photo', 'voice', 'persona']

export default function SetupPage() {
  const router = useRouter()
  const { setConfig } = useStore()
  const [step, setStep] = useState<Step>('photo')
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [name, setName] = useState('')
  const [persona, setPersona] = useState('You are a helpful and friendly professional.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Step 1: Photo ──────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handlePhotoNext = async () => {
    if (!photoFile) return
    setError('')
    setLoading(true)
    try {
      // Upload to a temp public URL via base64 data URL
      // NOTE: D-ID requires a publicly accessible URL.
      // For local dev, host photo publicly (e.g. imgbb) and paste URL directly.
      // For now we read it as a data URL as a best-effort approach.
      const reader = new FileReader()
      const dataUrl: string = await new Promise((res) => {
        reader.onload = (e) => res(e.target?.result as string)
        reader.readAsDataURL(photoFile)
      })
      const response = await fetch('/api/avatar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: dataUrl }),
      })
      if (!response.ok) throw new Error('Avatar creation failed — check DID_API_KEY')
      const { source_url } = await response.json()
      setConfig({ sourceUrl: source_url })
      setStep('voice')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Voice ──────────────────────────────────────────────
  const startRecording = async () => {
    setError('')
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    mr.ondataavailable = (e) => chunksRef.current.push(e.data)
    mr.onstop = () => {
      setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
      stream.getTracks().forEach((t) => t.stop())
    }
    mediaRef.current = mr
    mr.start()
    setRecording(true)
    setRecordingSeconds(0)
    timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    // Auto-stop at 60s
    setTimeout(() => stopRecording(), 60000)
  }

  const stopRecording = () => {
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const handleVoiceNext = async () => {
    if (!audioBlob) return
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('audio', audioBlob, 'recording.webm')
      form.append('name', name || 'My Twin')
      const response = await fetch('/api/voice/clone', { method: 'POST', body: form })
      if (!response.ok) throw new Error('Voice clone failed — check ELEVENLABS_API_KEY')
      const { voice_id } = await response.json()
      setConfig({ voiceId: voice_id, name: name || 'My Twin' })
      setStep('persona')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Persona ────────────────────────────────────────────
  const handleFinish = () => {
    setConfig({ personaPrompt: persona, name: name || 'My Twin' })
    router.push('/session')
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="flex gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= stepIndex ? 'bg-white' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* ── Photo step ── */}
        {step === 'photo' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-2xl font-semibold mb-1">Upload your photo</h2>
              <p className="text-zinc-400 text-sm">A clear portrait works best — face visible, plain background.</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="text-zinc-300 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:text-sm cursor-pointer"
            />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-zinc-700" />
            )}
            <button
              onClick={handlePhotoNext}
              disabled={!photoFile || loading}
              className="w-full bg-white text-black py-3 rounded-xl font-medium disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Creating avatar…' : 'Next →'}
            </button>
          </div>
        )}

        {/* ── Voice step ── */}
        {step === 'voice' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-2xl font-semibold mb-1">Record your voice</h2>
              <p className="text-zinc-400 text-sm">Speak naturally for 30–60 seconds. Read anything aloud — an article, a paragraph.</p>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (e.g. Adnan)"
              className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none placeholder:text-zinc-500"
            />
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                recording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-zinc-700 text-white hover:bg-zinc-600'
              }`}
            >
              {recording ? `⏹ Stop Recording (${recordingSeconds}s)` : '⏺ Start Recording'}
            </button>
            {audioBlob && !recording && (
              <p className="text-zinc-400 text-sm text-center">Recording captured ({recordingSeconds}s) ✓</p>
            )}
            <button
              onClick={handleVoiceNext}
              disabled={!audioBlob || loading}
              className="w-full bg-white text-black py-3 rounded-xl font-medium disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Cloning voice…' : 'Next →'}
            </button>
          </div>
        )}

        {/* ── Persona step ── */}
        {step === 'persona' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-2xl font-semibold mb-1">Define your persona</h2>
              <p className="text-zinc-400 text-sm">How should your AI twin speak and respond?</p>
            </div>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              rows={5}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg outline-none text-sm resize-none placeholder:text-zinc-500"
            />
            <button
              onClick={handleFinish}
              className="w-full bg-white text-black py-3 rounded-xl font-medium"
            >
              Launch My Twin →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
