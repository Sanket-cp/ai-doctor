import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
const PORT = process.env.PORT || 8787

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Load optional knowledge JSON
const knowledgePath = process.env.KNOWLEDGE_JSON_PATH || path.join(process.cwd(), 'data', 'knowledge.json')
let knowledge = null
try {
  const raw = await readFile(knowledgePath, 'utf8')
  knowledge = JSON.parse(raw)
  // eslint-disable-next-line no-console
  console.log(`[api] Loaded knowledge from ${knowledgePath}`)
} catch (err) {
  // eslint-disable-next-line no-console
  console.log(`[api] No knowledge file at ${knowledgePath}. Proceeding without it.`)
}

function buildSystemPrompt() {
  const base = `You are a careful, factual medical assistant. Provide balanced, safe guidance.
- Be concise and structured with bullet points.
- Include red-flag symptoms and when to seek urgent care.
- Add a brief disclaimer that this is not medical advice.
- If unsure, ask for missing details (duration, severity, triggers, relevant history).`
  if (!knowledge) return base
  // Shallow include of knowledge keys. If large, you may implement retrieval later.
  const knowledgeSnippet = typeof knowledge === 'string' ? knowledge : JSON.stringify(knowledge).slice(0, 8000)
  return `${base}

Relevant knowledge JSON (use only if helpful; do not leak raw JSON):
${knowledgeSnippet}`
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.text ?? m.content ?? '') })).filter(m => m.content)
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], provider = 'openai', model, temperature = 0.3 } = req.body || {}
    const normalized = normalizeMessages(messages)
    const recent = normalized.slice(-12)

    const system = buildSystemPrompt()
    const userCount = recent.filter(m => m.role === 'user').length
    if (userCount === 0) {
      return res.status(400).json({ error: 'No user message provided' })
    }

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await anthropic.messages.create({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature,
        system,
        messages: recent.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      })
      const text = response.content?.[0]?.type === 'text' ? response.content[0].text : (response.content?.[0]?.text || '')
      return res.json({ reply: text })
    }

    // Default: OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      temperature,
      messages: [
        { role: 'system', content: system },
        ...recent.map(m => ({ role: m.role, content: m.content }))
      ],
    })
    const text = completion.choices?.[0]?.message?.content || ''
    return res.json({ reply: text })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[api] /api/chat error', error)
    res.status(500).json({ error: 'LLM request failed' })
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}`)
})