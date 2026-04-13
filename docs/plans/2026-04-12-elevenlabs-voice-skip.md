# ElevenLabs Voice Skip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a low-visibility skip option under the voice recorder that lets the user choose an existing ElevenLabs voice instead of cloning their own voice.

**Architecture:** Keep the current setup flow and store contract intact by reusing the existing `voiceId` config field. Extend the `/setup` voice step with a lazy-loaded chooser that only fetches voices after the user clicks the skip link, then persist the selected voice so the persona and session steps continue unchanged.

**Tech Stack:** Next.js App Router, React client components, TypeScript, existing ElevenLabs API route, Zustand persist store

---

### Task 1: Document the approved UX in the code path

**Files:**
- Modify: `app/setup/page.tsx`

**Step 1: Add local state for the skip flow**

Track whether the user opened the voice picker, the selected voice ID, and whether the voices request has already been attempted.

**Step 2: Add a lazy loader for ElevenLabs voices**

Call `/api/voice/list` only when the user clicks the skip link, and cache the results in component state.

**Step 3: Keep the cloned-voice path intact**

Do not change the existing audio recording and cloning behavior except to coexist cleanly with the picker state.

### Task 2: Add the skip-link UI and picker

**Files:**
- Modify: `app/setup/page.tsx`

**Step 1: Add the small text link under the recorder**

Use a subtle secondary treatment so the primary CTA remains voice recording.

**Step 2: Reveal the voice picker below the link**

Render loading, error, empty, and selected states so the user can clearly choose an ElevenLabs voice.

**Step 3: Reuse the existing Next button area**

When a picked voice is selected, let the user continue without requiring audio.

### Task 3: Preserve downstream behavior

**Files:**
- Modify: `app/setup/page.tsx`
- Verify: `lib/store.ts`

**Step 1: Persist the chosen voice**

Write the selected ElevenLabs `voiceId` and display name through `setConfig`.

**Step 2: Avoid unnecessary downstream changes**

Leave session and TTS behavior untouched because they already consume `config.voiceId`.

### Task 4: Verify manually

**Files:**
- Verify: `app/setup/page.tsx`
- Verify: `app/api/voice/list/route.ts`

**Step 1: Run lint**

Run: `npm run lint app/setup/page.tsx`
Expected: no ESLint errors

**Step 2: Manual smoke check**

Run the app and confirm the recorder still works, the skip link reveals voices, and selecting a voice allows advancing to persona without recording.

**Note:** Per user instruction, do not add or modify automated tests for this change.
