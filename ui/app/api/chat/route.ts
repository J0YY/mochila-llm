import { NextRequest } from 'next/server'
import os from 'os'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const ChatSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().min(1).max(8192).optional(),
  model: z.string().optional(),
  system: z.string().optional(),
  threadId: z.string().nullable().optional(),
  backend: z.enum(['vllm','ollama']).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = ChatSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }
  const { messages, temperature, top_p, max_tokens, model, system, threadId, backend: reqBackend } = parsed.data

  // Merge system message to front
  const outgoingMessages = system
    ? [{ role: 'system', content: system }, ...messages.filter(m => m.role !== 'system')]
    : messages

  // Determine backend
  // Auto-detect backend from model if not provided
  let backend = reqBackend || (process.env.BACKEND as 'vllm'|'ollama') || 'vllm'
  if (!reqBackend && model) {
    if (model.includes(':')) backend = 'ollama'
    if (model.includes('/')) backend = 'vllm'
  }
  const baseUrl = backend === 'ollama' 
    ? 'http://127.0.0.1:11434/v1' 
    : (process.env.OPENAI_BASE_URL || 'http://127.0.0.1:8000/v1')
  const apiKey = process.env.OPENAI_API_KEY || 'local-not-needed'

  const url = `${baseUrl}/chat/completions`
  const payload: any = {
    model: model || process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'local-model',
    messages: outgoingMessages,
    temperature: temperature ?? Number(process.env.TEMPERATURE || 0.7),
    top_p: top_p ?? Number(process.env.TOP_P || 0.9),
    max_tokens: max_tokens ?? Number(process.env.MAX_TOKENS || 512),
    stream: true,
  }

  // Backend-specific tuning (Ollama via OpenAI shim)
  if (backend !== 'vllm') {
    const threads = Number(process.env.THREADS || os.cpus().length || 4)
    const ctx = Number(process.env.CONTEXT_LENGTH || 4096)
    const maxOut = payload.max_tokens
    payload.extra_body = {
      options: {
        num_ctx: ctx,
        num_predict: maxOut,
        num_thread: threads,
      },
    }
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      let currentThreadId = threadId
      try {
        if (!currentThreadId) {
          // Create thread with first user line as title
          const firstUser = messages.find(m => m.role === 'user')?.content || 'New Chat'
          const thread = await prisma.thread.create({ data: { title: firstUser.slice(0, 80) } })
          currentThreadId = thread.id
        }
        // Inform client of thread id
        if (currentThreadId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ threadId: currentThreadId })}\n\n`))
        }
        // Save user message
        const lastUser = messages[messages.length - 1]
        if (lastUser?.role === 'user' && currentThreadId) {
          await prisma.message.create({ data: { threadId: currentThreadId, role: 'user', content: lastUser.content } })
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => '')
          throw new Error(`Upstream error ${res.status}: ${text}`)
        }

        // Pass-through SSE stream while aggregating assistant content
        let assistantText = ''
        const reader = res.body.getReader()
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          // naive passthrough; UI parses `data:` lines
          controller.enqueue(encoder.encode(chunk))

          // accumulate tokens from SSE lines
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.replace(/^data:\s*/, '')
            if (data === '[DONE]') continue
            try {
              const json = JSON.parse(data)
              const delta = json.choices?.[0]?.delta?.content || ''
              if (delta) assistantText += delta
            } catch { /* ignore */ }
          }
        }

        if (currentThreadId) {
          await prisma.message.create({ data: { threadId: currentThreadId, role: 'assistant', content: assistantText } })
        }

        controller.close()
      } catch (err: any) {
        const msg = err?.message || String(err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
    },
  })
}


