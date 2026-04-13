# Twin — AI Digital Twin for Live Meetings

Show up to every meeting with your AI twin. Upload your photo, clone your voice, and let Claude respond as you — avatar powered by D-ID, voice by ElevenLabs.

## Quick Start

**1. Clone and install**
```bash
git clone https://github.com/techadnakh9/twin.git
cd twin
npm install
```

**2. Add your API keys**
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
DID_API_KEY=...
ELEVENLABS_API_KEY=sk_...
```

**3. Run**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

1. **`/setup`** — Upload your portrait photo, record your voice (30–60s), write your persona prompt
2. **`/session`** — Your AI twin appears. Speak into your mic → Claude responds → avatar speaks in your cloned voice
3. **Screen-share** the `/session` window in Zoom, Google Meet, or Teams

---

## Get Your API Keys

| Service | Where to get it |
|---|---|
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com) |
| D-ID | [studio.d-id.com](https://studio.d-id.com) → API keys |
| ElevenLabs | [elevenlabs.io](https://elevenlabs.io) → Profile → API key |

> **Note:** ElevenLabs voice cloning requires a paid plan (Starter+). D-ID also requires credits for avatar creation.

---

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **D-ID Streams API** — real-time WebRTC avatar
- **ElevenLabs** — instant voice cloning + TTS
- **Claude Sonnet 4.6** — AI responses
- **Web Speech API** — browser-native speech recognition (Chrome/Edge only)

Full details in [`docs/TECH_STACK.md`](docs/TECH_STACK.md) · Product spec in [`docs/PRD.md`](docs/PRD.md)
