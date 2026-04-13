'use client'
import { useStore } from '@/lib/store'
import Link from 'next/link'

export default function SettingsPage() {
  const { config, setConfig } = useStore()

  const fields = [
    { label: 'Anthropic API Key', key: 'anthropicApiKey', placeholder: 'sk-ant-...' },
    { label: 'D-ID API Key', key: 'didApiKey', placeholder: 'your-did-key' },
    { label: 'ElevenLabs API Key', key: 'elevenLabsApiKey', placeholder: 'sk_...' },
  ] as const

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">Settings</h1>
          <Link href="/" className="text-zinc-500 text-sm hover:text-zinc-300">← Home</Link>
        </div>

        {/* API Keys */}
        <section className="space-y-4">
          <h2 className="text-zinc-400 text-xs uppercase tracking-wider">API Keys</h2>
          {fields.map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-zinc-300 text-sm block mb-1">{label}</label>
              <input
                type="password"
                value={config[key]}
                onChange={(e) => setConfig({ [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none text-sm font-mono placeholder:text-zinc-600"
              />
            </div>
          ))}
          <p className="text-zinc-600 text-xs">Keys are stored in your browser only, never sent to any server except the respective API.</p>
        </section>

        {/* Persona */}
        <section className="space-y-3">
          <h2 className="text-zinc-400 text-xs uppercase tracking-wider">Persona</h2>
          <div>
            <label className="text-zinc-300 text-sm block mb-1">Name</label>
            <input
              value={config.name}
              onChange={(e) => setConfig({ name: e.target.value })}
              className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-zinc-300 text-sm block mb-1">System Prompt</label>
            <textarea
              value={config.personaPrompt}
              onChange={(e) => setConfig({ personaPrompt: e.target.value })}
              rows={5}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg outline-none text-sm resize-none"
            />
          </div>
        </section>

        {/* Avatar & Voice info */}
        <section className="space-y-3">
          <h2 className="text-zinc-400 text-xs uppercase tracking-wider">Avatar & Voice</h2>
          <div className="bg-zinc-900 rounded-lg p-4 space-y-2 text-sm">
            <div>
              <span className="text-zinc-500">Voice ID: </span>
              <span className="text-white font-mono">{config.voiceId || 'not set'}</span>
            </div>
            <div>
              <span className="text-zinc-500">Avatar URL: </span>
              <span className="text-white font-mono text-xs break-all">{config.sourceUrl || 'not set'}</span>
            </div>
          </div>
          <Link href="/setup" className="inline-block text-sm text-zinc-400 underline hover:text-white">
            Re-run setup →
          </Link>
        </section>
      </div>
    </main>
  )
}
