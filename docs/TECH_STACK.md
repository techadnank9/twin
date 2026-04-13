# Twinny — Tech Stack

## Frontend

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack React, API routes, streaming support |
| Language | TypeScript | Type safety across client + server |
| Styling | Tailwind CSS | Utility-first, fast dark UI |
| State | Zustand (persisted) | Lightweight, localStorage persistence for config |

## Backend (Next.js API Routes)

All backend logic runs as Next.js API routes — no separate server needed.

| Route | Purpose |
|---|---|
| `POST /api/avatar/create` | Upload photo to D-ID → returns `source_url` |
| `POST /api/voice/clone` | Audio blob → ElevenLabs Instant Clone → `voice_id` |
| `POST /api/stream/create` | Create D-ID WebRTC stream → SDP offer |
| `POST /api/stream/sdp` | Send SDP answer to D-ID |
| `POST /api/stream/ice` | Exchange ICE candidates |
| `POST /api/stream/talk` | Text + voice_id → D-ID animates avatar |
| `DELETE /api/stream/close` | Terminate stream session |
| `POST /api/chat` | Message + history → Claude → streaming text response |

## External APIs

| Service | Usage | SDK/Docs |
|---|---|---|
| **D-ID** | WebRTC avatar streaming, photo animation | REST API — `https://api.d-id.com` |
| **ElevenLabs** | Instant voice cloning, TTS | REST API — `https://api.elevenlabs.io/v1` |
| **Anthropic** | Claude Sonnet 4.6 for AI responses | `@anthropic-ai/sdk` |
| **Web Speech API** | Browser-native STT (no cost) | Browser built-in |

## Data Flow

```
User speaks
  → Web Speech API (STT)
  → POST /api/chat (Claude Sonnet 4.6)
  → POST /api/stream/talk (D-ID + ElevenLabs voice)
  → WebRTC stream
  → Avatar speaks in browser
```

## Storage

| Data | Where |
|---|---|
| API keys | `.env.local` (server) + `localStorage` (client settings page) |
| `voice_id` | `localStorage` via Zustand persist |
| `source_url` (avatar) | `localStorage` via Zustand persist |
| Persona prompt | `localStorage` via Zustand persist |
| Conversation history | In-memory (last 20 turns, cleared on session end) |

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
DID_API_KEY=...            # From D-ID dashboard
ELEVENLABS_API_KEY=sk_...  # From ElevenLabs dashboard
```

## Testing

| Type | Tool | Coverage |
|---|---|---|
| Unit (lib) | Jest + ts-jest + jest-fetch-mock | `lib/did.ts`, `lib/elevenlabs.ts`, `lib/claude.ts` |
| Unit (store) | Jest + @testing-library/react | `lib/store.ts` |
| Integration (API) | Jest (node env) | All `/api/*` routes |
| Component | Jest + @testing-library/react (jsdom) | UI components |

## Key Architecture Decisions

**Why D-ID Streams API (not D-ID Agents)?**
Using D-ID's Streams API for avatar rendering only, keeping full ownership of the Claude prompting, conversation history, and ElevenLabs TTS. D-ID Agents is simpler but limits control over LLM behavior.

**Why Web Speech API (not Deepgram)?**
Browser-native, zero cost, no extra API key. Fallback text input handles unsupported browsers (Firefox, Safari).

**Why screen-share (not virtual camera)?**
Zero extra software required. Works in every meeting app. Virtual camera (OBS) integration is a future enhancement.

**Why Zustand (not Redux or Context)?**
Config needs to persist across page navigations (localStorage). Zustand's `persist` middleware handles this in ~5 lines. No boilerplate.
