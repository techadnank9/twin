import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

export type Message = { role: 'user' | 'assistant'; content: string }

export function SYSTEM_PROMPT(persona: string): string {
  return `You are an AI digital twin. ${persona}

Respond conversationally and concisely — you are speaking aloud in a live video meeting. Keep responses under 3 sentences unless a longer answer is clearly required. Never mention that you are an AI unless directly asked.`
}

export function buildMessages(history: Message[], _persona?: string): Message[] {
  return history.slice(-20)
}

export async function streamChat(
  history: Message[],
  userMessage: string,
  persona: string,
  onChunk: (text: string) => void
): Promise<string> {
  const messages = buildMessages([...history, { role: 'user', content: userMessage }])
  let full = ''
  const stream = getClient().messages.stream({
    model: 'claude-sonnet-4-6',
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
