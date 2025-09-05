"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { streamChat } from '@/lib/openai.client'

type Message = { role: 'system' | 'user' | 'assistant'; content: string }

export default function Chat({ threadId, onThreadIdChange }: { threadId: string | null, onThreadIdChange: (id: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [system, setSystem] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT || '')
  const [temperature, setTemperature] = useState<number>(Number(process.env.TEMPERATURE || 0.7))
  const [top_p, setTopP] = useState<number>(Number(process.env.TOP_P || 0.9))
  const [maxTokens, setMaxTokensState] = useState<number>(Number(process.env.MAX_TOKENS || 256))

  // Load thread messages when switching threads
  useEffect(() => {
    if (isLoading) return
    (async () => {
      if (!threadId) { setMessages([]); return }
      try {
        const res = await fetch(`/api/threads/${threadId}`)
        if (res.ok) {
          const t = await res.json()
          const ms: Message[] = t.messages.map((m: any) => ({ role: m.role, content: m.content }))
          setMessages(ms)
        }
      } catch { /* ignore */ }
    })()
  }, [threadId, isLoading])

  const onSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    // Append assistant placeholder synchronously to avoid race where stream updates the user bubble
    const assistantPlaceholder: Message = { role: 'assistant', content: '' }
    const initialMessages = [...newMessages, assistantPlaceholder]
    const assistantIndex = initialMessages.length - 1
    setMessages(initialMessages)
    setInput('')
    setIsLoading(true)
    let assistant = ''
    try {
      // Pull live settings from localStorage if available (do not mutate state during send)
      let reqTemp = temperature
      let reqTopP = top_p
      let reqMaxTok = maxTokens
      let reqBackend: 'ollama'|'vllm' = 'ollama'
      let reqModel = (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('app_settings')||'{}').model || process.env.NEXT_PUBLIC_DEFAULT_MODEL) : process.env.NEXT_PUBLIC_DEFAULT_MODEL)
      try {
        const s = JSON.parse(localStorage.getItem('app_settings') || '{}')
        reqBackend = (s.backend || 'ollama')
        if (typeof s.temperature === 'number') reqTemp = s.temperature
        if (typeof s.top_p === 'number') reqTopP = s.top_p
        if (typeof s.max_tokens === 'number') reqMaxTok = s.max_tokens
        if (s.model) reqModel = s.model
        ;(window as any)._app_backend = reqBackend
      } catch {}
      await streamChat({
        body: {
          messages: newMessages,
          temperature: reqTemp, top_p: reqTopP, max_tokens: reqMaxTok,
          model: reqModel,
          system,
          threadId,
          backend: reqBackend,
        },
        onMessage: (delta) => {
          assistant += delta
          setMessages(prev => prev.map((m, i) => i === assistantIndex ? { ...m, content: assistant } : m))
        },
        onThreadId: (id) => id && onThreadIdChange(id),
      })
    } catch (err) {
      setMessages(prev => prev.map((m, i) => i === assistantIndex ? { ...m, content: (m.content || '') + '\n\n[Error streaming response]' } : m))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, temperature, top_p, maxTokens, system, threadId, onThreadIdChange])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-[80%] rounded-lg px-3 py-2 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <form className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2" onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
        <textarea
          className="flex-1 resize-none rounded border border-gray-300 dark:border-gray-700 bg-transparent p-2"
          rows={2}
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
        />
        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Send</button>
      </form>
    </div>
  )
}


