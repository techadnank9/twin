import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">Twin</h1>
      <p className="text-zinc-400 text-xl mb-2">Your AI Digital Twin for Live Meetings</p>
      <p className="text-zinc-500 text-base mb-10 max-w-md">
        Upload your photo, clone your voice, and let your AI twin handle meetings —
        powered by D-ID, ElevenLabs, and Claude.
      </p>

      <div className="flex gap-4 mb-16 flex-wrap justify-center">
        <Link
          href="/setup"
          className="bg-white text-black px-8 py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
        >
          Create My Twin
        </Link>
        <Link
          href="/session"
          className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
        >
          Start Session
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-lg text-left">
        {[
          { step: '1', title: 'Upload your photo', desc: 'A portrait — D-ID animates it into a talking avatar.' },
          { step: '2', title: 'Clone your voice', desc: 'Record 60 seconds — ElevenLabs creates your voice clone.' },
          { step: '3', title: 'Screen-share & go', desc: 'Open /session and share the window in Zoom, Meet, or Teams.' },
        ].map(({ step, title, desc }) => (
          <div key={step}>
            <div className="text-zinc-500 text-xs mb-2 uppercase tracking-widest">Step {step}</div>
            <h3 className="text-white font-medium mb-1">{title}</h3>
            <p className="text-zinc-400 text-sm">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link href="/settings" className="text-zinc-600 text-sm hover:text-zinc-400 transition-colors">
          Settings
        </Link>
      </div>
    </main>
  )
}
