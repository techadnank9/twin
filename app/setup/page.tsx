'use client'
import { useEffect, useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

type Step = 'photo' | 'voice' | 'persona'
const STEPS: Step[] = ['photo', 'voice', 'persona']

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export default function SetupPage() {
  const router = useRouter()
  const { config, setConfig } = useStore()
  const [step, setStep] = useState<Step>('photo')
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [voices, setVoices] = useState<{ voice_id: string; name: string; category: string }[]>([])
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const [pickedVoiceId, setPickedVoiceId] = useState('')
  const [voicesLoading, setVoicesLoading] = useState(false)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [name, setName] = useState('')
  const [persona, setPersona] = useState('You are a helpful and friendly professional.')
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (config.previewUrl && !photoFile) {
      setPhotoPreview(config.previewUrl)
      setPhotoUrl(config.previewUrl.startsWith('blob:') ? '' : config.previewUrl)
    }
    if (config.name && !name) setName(config.name)
    if (config.personaPrompt && persona === 'You are a helpful and friendly professional.') {
      setPersona(config.personaPrompt)
    }
  }, [config.name, config.personaPrompt, config.previewUrl, name, persona, photoFile])

  // ── Step 1: Photo ──────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const toJpegBlob = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))), 'image/jpeg', 0.92)
      }
      img.onerror = reject
      img.src = url
    })

  const handlePhotoNext = async () => {
    if (!photoFile && !photoUrl) return
    setError('')
    setLoading(true)
    try {
      if (photoUrl) {
        const response = await fetch('/api/avatar/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: photoUrl }),
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error ?? 'Avatar creation failed — make sure the photo URL points directly to an image')
        }
        const { source_url } = await response.json()
        setConfig({ sourceUrl: source_url, previewUrl: photoUrl })
        setStep('voice')
        return
      }
      // For file upload: send to D-ID /images to get a hosted URL
      const jpeg = await toJpegBlob(photoFile!)
      const form = new FormData()
      form.append('image', jpeg, 'avatar.jpg')
      const response = await fetch('/api/avatar/create', { method: 'POST', body: form })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error ?? 'Avatar creation failed — check DID_API_KEY')
      }
      const { source_url } = await response.json()
      setConfig({ sourceUrl: source_url, previewUrl: photoPreview })
      setStep('voice')
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Voice ──────────────────────────────────────────────
  const startRecording = async () => {
    setError('')
    chunksRef.current = []
    try {
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
    } catch (error: unknown) {
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        setError('Microphone access denied — please allow microphone access in your browser and try again.')
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        setError('No microphone found — please connect a microphone and try again.')
      } else {
        setError(`Could not start recording: ${getErrorMessage(error)}`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const loadVoices = async () => {
    if (voicesLoading || voicesLoaded) return
    setError('')
    setVoicesLoading(true)
    try {
      const response = await fetch('/api/voice/list')
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error ?? 'Could not load ElevenLabs voices')
      }
      setVoices(Array.isArray(body.voices) ? body.voices : [])
      setVoicesLoaded(true)
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setVoicesLoading(false)
    }
  }

  const previewVoice = async (voiceId: string) => {
    if (previewing || !voiceId) return
    // Stop any currently playing preview
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPreviewing(true)
    try {
      const res = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId }),
      })
      if (!res.ok) throw new Error('Preview failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        setPreviewing(false)
      }
      // Play only ~2 seconds then stop
      setTimeout(() => {
        audio.pause()
        URL.revokeObjectURL(url)
        setPreviewing(false)
      }, 2000)
      await audio.play()
    } catch {
      setPreviewing(false)
    }
  }

  const handleSkipToVoicePicker = async () => {
    setShowVoicePicker(true)
    setAudioBlob(null)
    stopRecording()
    await loadVoices()
  }

  const handleVoiceNext = async () => {
    if (showVoicePicker) {
      if (!pickedVoiceId) return
      setError('')
      const selectedVoice = voices.find((voice) => voice.voice_id === pickedVoiceId)
      setConfig({
        voiceId: pickedVoiceId,
        name: name || selectedVoice?.name || 'My Twin',
      })
      setStep('persona')
      return
    }
    if (!audioBlob) return
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('audio', audioBlob, 'recording.webm')
      form.append('name', name || 'My Twin')
      const response = await fetch('/api/voice/clone', { method: 'POST', body: form })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? 'Voice clone failed — check ELEVENLABS_API_KEY')
      }
      const { voice_id } = await response.json()
      setConfig({ voiceId: voice_id, name: name || 'My Twin' })
      setStep('persona')
    } catch (error: unknown) {
      setError(getErrorMessage(error))
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

  const isConfigured = !!(config.sourceUrl && config.voiceId)

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Resume banner */}
        {isConfigured && (
          <div className="mb-6 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-white text-sm font-medium">
                {config.name || 'Your twin'} is already set up
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">Skip setup and go straight to your session</p>
            </div>
            <button
              onClick={() => router.push('/session')}
              className="shrink-0 bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Resume →
            </button>
          </div>
        )}

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
            <div className="flex items-center gap-3 text-zinc-500 text-sm">
              <div className="flex-1 h-px bg-zinc-700" /> or paste a public URL <div className="flex-1 h-px bg-zinc-700" />
            </div>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => { setPhotoUrl(e.target.value); setPhotoFile(null); setPhotoPreview(e.target.value) }}
              placeholder="https://example.com/your-photo.jpg"
              className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none placeholder:text-zinc-500 text-sm"
            />
            <button
              onClick={handlePhotoNext}
              disabled={(!photoFile && !photoUrl) || loading}
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
              disabled={showVoicePicker}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                recording
                  ? 'bg-red-600 text-white animate-pulse'
                  : showVoicePicker
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-700 text-white hover:bg-zinc-600'
              }`}
            >
              {recording ? `⏹ Stop Recording (${recordingSeconds}s)` : '⏺ Start Recording'}
            </button>
            {audioBlob && !recording && (
              <p className="text-zinc-400 text-sm text-center">Recording captured ({recordingSeconds}s) ✓</p>
            )}
            {!showVoicePicker && (
              <button
                type="button"
                onClick={handleSkipToVoicePicker}
                className="mx-auto block text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300 transition-colors"
              >
                Skip this and choose an ElevenLabs voice instead
              </button>
            )}
            {showVoicePicker && (
              <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">Choose an ElevenLabs voice</h3>
                    <p className="text-xs text-zinc-400">Use any available voice without recording your own.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVoicePicker(false)
                      setPickedVoiceId('')
                    }}
                    className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300 transition-colors"
                  >
                    Back to recording
                  </button>
                </div>
                {voicesLoading ? (
                  <p className="text-sm text-zinc-400">Loading voices…</p>
                ) : voices.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      value={pickedVoiceId}
                      onChange={(e) => setPickedVoiceId(e.target.value)}
                      className="flex-1 rounded-lg bg-zinc-800 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="">Select a voice</option>
                      {voices.map((voice) => (
                        <option key={voice.voice_id} value={voice.voice_id}>
                          {voice.name} {voice.category ? `(${voice.category})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => previewVoice(pickedVoiceId)}
                      disabled={!pickedVoiceId || previewing}
                      title="Preview voice"
                      className="rounded-lg bg-zinc-800 px-3 py-3 text-white disabled:opacity-40 hover:bg-zinc-700 transition-colors"
                    >
                      {previewing ? '⏸' : '▶'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No ElevenLabs voices are available for this account yet.</p>
                )}
              </div>
            )}
            <button
              onClick={handleVoiceNext}
              disabled={(showVoicePicker ? !pickedVoiceId : !audioBlob) || loading || voicesLoading}
              className="w-full bg-white text-black py-3 rounded-xl font-medium disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Cloning voice…' : showVoicePicker ? 'Use this voice →' : 'Next →'}
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
