export type LlmProvider = 'openai' | 'anthropic'

export interface LlmRequestBody {
  messages: { role: 'user' | 'assistant'; text: string }[]
  provider?: LlmProvider
  model?: string
  temperature?: number
}

export async function chatWithLlm(body: LlmRequestBody): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  const data = await res.json()
  return data.reply as string
}