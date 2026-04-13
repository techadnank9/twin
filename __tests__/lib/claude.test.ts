import { buildMessages, resolveAnthropicApiKey, SYSTEM_PROMPT } from '@/lib/claude'

describe('buildMessages', () => {
  it('returns messages unchanged when under 20', () => {
    const history = [{ role: 'user' as const, content: 'Hi' }]
    expect(buildMessages(history)).toHaveLength(1)
  })

  it('trims history to last 20 messages', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `msg ${i}`,
    }))
    const msgs = buildMessages(history)
    expect(msgs).toHaveLength(20)
    expect(msgs[0].content).toBe('msg 5')
  })
})

describe('resolveAnthropicApiKey', () => {
  it('prefers the request api key when provided', () => {
    expect(resolveAnthropicApiKey('sk-ant-test')).toBe('sk-ant-test')
  })
})

describe('SYSTEM_PROMPT', () => {
  it('injects persona into template', () => {
    const prompt = SYSTEM_PROMPT('You are a helpful assistant named Adnan.')
    expect(prompt).toContain('Adnan')
    expect(prompt).toContain('digital twin')
  })
})
