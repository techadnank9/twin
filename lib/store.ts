// lib/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message } from '@/lib/claude'

interface Config {
  voiceId: string
  sourceUrl: string
  personaPrompt: string
  name: string
  didApiKey: string
  elevenLabsApiKey: string
  anthropicApiKey: string
}

interface Store {
  config: Config
  history: Message[]
  setConfig: (partial: Partial<Config>) => void
  addMessage: (msg: Message) => void
  clearHistory: () => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      config: {
        voiceId: '',
        sourceUrl: '',
        personaPrompt: '',
        name: 'My Twin',
        didApiKey: '',
        elevenLabsApiKey: '',
        anthropicApiKey: '',
      },
      history: [],
      setConfig: (partial) =>
        set((s) => ({ config: { ...s.config, ...partial } })),
      addMessage: (msg) =>
        set((s) => ({ history: [...s.history, msg] })),
      clearHistory: () => set({ history: [] }),
    }),
    { name: 'twin-store' }
  )
)
