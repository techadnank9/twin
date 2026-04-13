# Twinny — Product Requirements Document

## Overview

**Twinny** (project folder: `twin`) is a web app that lets you create an AI digital twin of yourself for live video meetings. Upload your portrait photo, record your voice, and your twin shows up to meetings in your place — animated, speaking in your cloned voice, powered by Claude AI.

---

## Problem

Being present in every video meeting is exhausting and time-consuming. Recurring standups, Q&A sessions, and check-ins often don't require your full attention, but your absence is noticed. There's no good way to delegate your presence while maintaining authenticity.

---

## Solution

A browser-based digital twin that:
1. Looks like you (animated from your photo via D-ID)
2. Sounds like you (ElevenLabs voice clone)
3. Responds intelligently as you (Claude Sonnet 4.6 with your persona)
4. Works in any meeting app via screen sharing (Zoom, Google Meet, Teams)

---

## Target User

Individual professionals who attend recurring video meetings and want to delegate routine participation to an AI twin that represents them accurately.

---

## User Flow

### One-Time Setup
1. Go to `/setup`
2. **Step 1 — Photo:** Upload a portrait photo → D-ID creates your animated avatar
3. **Step 2 — Voice:** Record 30–60 seconds of your voice → ElevenLabs clones it
4. **Step 3 — Persona:** Write a system prompt describing how your twin should behave

### Live Session
1. Go to `/session` (or click "Start Session" from landing)
2. Screen-share the `/session` window in your meeting app
3. Speak into your mic → your twin listens, responds via Claude, speaks back in your voice
4. Click "End Session" when done

---

## Core Features

| Feature | Description |
|---|---|
| Photo avatar | Upload portrait → D-ID animates a talking head |
| Voice cloning | Record 30–60s → ElevenLabs instant voice clone |
| AI responses | Claude Sonnet 4.6 responds in character as you |
| Real-time lip-sync | D-ID Streams WebRTC API for low-latency avatar animation |
| Speech-to-text | Web Speech API (browser-native, no extra cost) |
| Screen-share ready | `/session` is a full-screen dark window optimized for sharing |
| Fallback text input | Typed input if browser doesn't support Web Speech API |

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, how it works, CTA |
| `/setup` | 3-step onboarding: photo → voice → persona |
| `/session` | Live meeting view — avatar + mic controls |
| `/settings` | API keys, persona editor, re-record/re-upload |

---

## Error Handling

| Failure | Behavior |
|---|---|
| D-ID stream drops | Auto-reconnect (3 attempts, exponential backoff) |
| ElevenLabs quota exceeded | Fallback to D-ID built-in TTS |
| Web Speech API unsupported | Show typed text input |
| API key missing | Redirect to `/settings` with error banner |
| Claude API error | Show error in transcript, keep session alive |

---

## Out of Scope (v1)

- Mobile app
- Virtual camera injection (OBS integration)
- Multi-language support
- Persistent conversation memory across sessions
- Custom avatar from video footage (D-ID V3 Instant)
- Real-time emotion/expression control
