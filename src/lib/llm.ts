export type LlmProvider = 'openai' | 'anthropic'

export interface LlmRequestBody {
  messages: { role: 'user' | 'assistant'; text: string }[]
  provider?: LlmProvider
  model?: string
  temperature?: number
}

export async function chatWithLlm(body: LlmRequestBody): Promise<string> {
  const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
  const url = base ? `${base.replace(/\/$/, '')}/api/chat` : '/api/chat'
  const res = await fetch(url, {
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