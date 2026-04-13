/** @jest-environment jsdom */
// __tests__/lib/store.test.ts
import { act, renderHook } from '@testing-library/react'
import { useStore } from '@/lib/store'

// Reset store between tests
beforeEach(() => {
  useStore.setState({
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
  })
})

describe('useStore defaults', () => {
  it('has empty config by default', () => {
    const { result } = renderHook(() => useStore())
    expect(result.current.config.personaPrompt).toBe('')
    expect(result.current.config.voiceId).toBe('')
    expect(result.current.config.sourceUrl).toBe('')
    expect(result.current.config.name).toBe('My Twin')
  })

  it('has empty history by default', () => {
    const { result } = renderHook(() => useStore())
    expect(result.current.history).toHaveLength(0)
  })
})

describe('setConfig', () => {
  it('merges partial config without overwriting other fields', () => {
    const { result } = renderHook(() => useStore())
    act(() => result.current.setConfig({ voiceId: 'v_123' }))
    expect(result.current.config.voiceId).toBe('v_123')
    expect(result.current.config.personaPrompt).toBe('')
  })
})

describe('addMessage', () => {
  it('appends a message to history', () => {
    const { result } = renderHook(() => useStore())
    act(() => result.current.addMessage({ role: 'user', content: 'Hello' }))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].content).toBe('Hello')
  })
})

describe('clearHistory', () => {
  it('empties conversation history', () => {
    const { result } = renderHook(() => useStore())
    act(() => result.current.addMessage({ role: 'user', content: 'Hello' }))
    act(() => result.current.clearHistory())
    expect(result.current.history).toHaveLength(0)
  })
})
