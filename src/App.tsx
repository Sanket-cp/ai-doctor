import { useEffect, useMemo, useRef, useState } from 'react'
import { Send } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

function getDiagnosisResponse(queryRaw: string): string {
  const query = queryRaw.toLowerCase()

  const redFlags: string[] = []
  const causes: string[] = []
  const care: string[] = []

  const has = (kw: string | RegExp) =>
    typeof kw === 'string' ? query.includes(kw) : kw.test(query)

  if (has('fever') || has('জ্বর')) {
    causes.push('ভাইরাল/ব্যাকটেরিয়াল সংক্রমণ, ডিহাইড্রেশন, ইনফ্ল্যামেশন')
    care.push('প্রচুর পানি/ওআরএস, বিশ্রাম, প্যারাসিটামল (ডোজ অনুযায়ী)')
    redFlags.push('অবিরাম উচ্চ জ্বর > 102°F, ৩ দিনের বেশি স্থায়ী, ঘন ঘন বমি, খিঁচুনি')
  }

  if (has(/cough|কাশি/)) {
    causes.push('সাধারণ সর্দি, ফ্লু, অ্যালার্জি, অ্যাজমা, ব্রঙ্কাইটিস')
    care.push('মধু-গরম পানি, স্টিম ইনহেলেশন, ইরিট্যান্ট এড়িয়ে চলুন')
    redFlags.push('শ্বাসকষ্ট, রক্ত বমি/কাশি, বুকে তীব্র ব্যথা')
  }

  if (has(/sore\s*throat|গলা ব্যথা/)) {
    causes.push('ফ্যারিঞ্জাইটিস/টনসিলাইটিস, ভাইরাল সংক্রমণ')
    care.push('লবণ-গরম পানি দিয়ে গার্গল, গরম তরল খাবার')
  }

  if (has(/headache|মাথা ব্যথা/)) {
    causes.push('টেনশন/মাইগ্রেন, ডিহাইড্রেশন, চোখের সমস্যা, ঘুমের ঘাটতি')
    care.push('নিরিবিলি অন্ধকার ঘর, পানি পান, প্যারাসিটামল/আইবুপ্রোফেন (উপযুক্ত হলে)')
    redFlags.push('হঠাৎ তীব্র "থান্ডারক্ল্যাপ" ব্যথা, নিউরোলজিকাল উপসর্গ, মাথায় আঘাতের পর')
  }

  if (has(/stomach|পেট|abdomen|পেটে/)) {
    causes.push('অজীর্ণ, গ্যাস, ফুড পয়জনিং, গ্যাস্ট্রাইটিস')
    care.push('হালকা খাবার, ওআরএস, স্যালাইন/পানি, ঝাল-তেল এড়িয়ে চলুন')
    redFlags.push('রক্ত সহ পায়খানা/বমি, তীব্র ডান তলপেট ব্যথা, অবিরাম বমি, ডিহাইড্রেশনের লক্ষণ')
  }

  if (has(/diarrhea|পাতলা পায়খানা|ডায়রিয়া/)) {
    causes.push('ভাইরাল/ব্যাকটেরিয়াল গ্যাস্ট্রোএন্টেরাইটিস, খাদ্যজনিত অসহিষ্ণুতা')
    care.push('প্রচুর ওআরএস, ভাত/সেদ্ধ আলু/কলা, দুগ্ধজাত কমান')
    redFlags.push('রক্ত/কালো পায়খানা, তীব্র পানিশূন্যতা, উচ্চ জ্বর')
  }

  if (has(/chest\s*pain|বুকের ব্যথা/)) {
    causes.push('মাস্কুলোস্কেলেটাল, অ্যাসিড রিফ্লাক্স, কিন্তু হার্ট অ্যাটাক排 করা জরুরি')
    care.push('বিশ্রাম, ট্রিগার খাবার এড়িয়ে চলা, গভীর শ্বাস-প্রশ্বাস')
    redFlags.push('শ্বাসকষ্ট, বাম হাতে/চোয়ালে ব্যথা ছড়ানো, ঠান্ডা ঘাম, অবসাদ — তাৎক্ষণিক জরুরি')
  }

  if (has(/rash|চুলকানি|র‍্যাশ/)) {
    causes.push('অ্যালার্জি, ভাইরাল এক্সানথেম, স্ক্যাবিস, ডার্মাটাইটিস')
    care.push('মৃদু সাবান, কুল লোশন/অ্যান্টিহিস্টামিন (উপযুক্ত হলে), ট্রিগার এড়ানো')
    redFlags.push('শ্বাসকষ্ট/মুখ-জিহ্বা ফুলে যাওয়া, উচ্চ জ্বর, তীব্র ব্যথা/পুঁজ')
  }

  if (causes.length === 0 && care.length === 0) {
    care.push('আপনার লক্ষণগুলো বিস্তারিত লিখুন: সময়কাল, তীব্রতা, কী কী বাড়ায়/কমায়, প্রাসঙ্গিক রোগ/ওষুধ')
  }

  const lines: string[] = []
  lines.push('সম্ভাব্য কারণসমূহ:')
  if (causes.length) lines.push('• ' + causes.join('\n• '))
  lines.push('\nযত্নের পরামর্শ:')
  if (care.length) lines.push('• ' + care.join('\n• '))
  if (redFlags.length) {
    lines.push('\nজরুরি সতর্কতা (যে কোনো থাকলে দ্রুত চিকিৎসা নিন):')
    lines.push('• ' + redFlags.join('\n• '))
  }
  lines.push('\nডিসক্লেইমার: এটি সাধারণ তথ্য; এটি চিকিৎসকের পরামর্শের বিকল্প নয়। প্রয়োজনে নিকটস্থ চিকিৎসা সেবা নিন।')
  return lines.join('\n')
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: generateId(),
      role: 'assistant',
      text: 'হ্যালো! আমি আপনার হেলথ অ্যাসিস্ট্যান্ট। আপনার উপসর্গ/সমস্যা লিখুন (যেমন: "৩ দিন ধরে জ্বর ও কাশি").',
    },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [useLlm, setUseLlm] = useState(false)
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !isThinking, [input, isThinking])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
    const userMsg: ChatMessage = { id: generateId(), role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setIsThinking(true)

    try {
      let answer: string
      if (useLlm) {
        const { chatWithLlm } = await import('./lib/llm')
        answer = await chatWithLlm({
          provider,
          messages: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
        })
      } else {
        await new Promise(r => setTimeout(r, 300))
        answer = getDiagnosisResponse(text)
      }

      const botMsg: ChatMessage = { id: generateId(), role: 'assistant', text: answer }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      const botMsg: ChatMessage = { id: generateId(), role: 'assistant', text: 'দুঃখিত, সার্ভার সাড়া দিচ্ছে না। পরে আবার চেষ্টা করুন।' }
      setMessages(prev => [...prev, botMsg])
    } finally {
      setIsThinking(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickPrompts = [
    'জ্বর ও কাশি',
    'তীব্র মাথা ব্যথা',
    'পেটে ব্যথা ও বমি',
    'পাতলা পায়খানা',
    'বুকে ব্যথা',
    'চুলকানিযুক্ত র‍্যাশ',
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Health Aid Companion</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} />
              LLM
            </label>
            <select
              disabled={!useLlm}
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic')}
              className="border border-border rounded px-2 py-1 bg-background disabled:opacity-50"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Claude</option>
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs rounded-full bg-muted px-3 py-1 hover:bg-accent transition"
              >
                {q}
              </button>
            ))}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 min-h-[50vh] max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card p-3 space-y-3"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 whitespace-pre-wrap'
                    : 'mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap'
                }
              >
                {m.text}
              </div>
            ))}
            {isThinking && (
              <div className="mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-muted-foreground">
                ভাবছি...
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="আপনার সমস্যাটি লিখুন..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
          >
            পাঠান <Send size={16} />
          </button>
        </div>
      </footer>
    </div>
  )
}