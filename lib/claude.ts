import Anthropic from '@anthropic-ai/sdk'

export function resolveAnthropicApiKey(apiKey?: string): string {
  const resolved = apiKey || process.env.ANTHROPIC_API_KEY
  if (!resolved) {
    throw new Error('Anthropic API key is missing. Add it in Settings or .env.local and retry.')
  }
  return resolved
}

function getClient(apiKey?: string): Anthropic {
  return new Anthropic({ apiKey: resolveAnthropicApiKey(apiKey) })
}

export type Message = { role: 'user' | 'assistant'; content: string }

export function SYSTEM_PROMPT(persona: string): string {
  return `You are an AI digital twin. ${persona}

Respond conversationally and concisely — you are speaking aloud in a live video meeting. Keep responses under 3 sentences unless a longer answer is clearly required. Never mention that you are an AI unless directly asked.`
}

export function buildMessages(history: Message[]): Message[] {
  return history.slice(-20)
}

export async function streamChat(
  history: Message[],
  userMessage: string,
  persona: string,
  onChunk: (text: string) => void,
  apiKey?: string
): Promise<string> {
  const messages = buildMessages([...history, { role: 'user', content: userMessage }])
  let full = ''
  const stream = getClient(apiKey).messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: SYSTEM_PROMPT(persona),
    messages,
  })
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      full += chunk.delta.text
      onChunk(chunk.delta.text)
    }
  }
  return full
}
