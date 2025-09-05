#!/usr/bin/env node
// Simple local CLI chat that talks to a local OpenAI-compatible endpoint (Ollama or vLLM)
// Usage examples:
//   node cli/chat.mjs --model llama3:8b
//   OPENAI_BASE_URL=http://127.0.0.1:8000/v1 node cli/chat.mjs --model TinyLlama/TinyLlama-1.1B-Chat-v1.0

import readline from 'node:readline'

const args = process.argv.slice(2)
function argVal(flag, def) {
  const idx = args.indexOf(flag)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def
}

const BASE_URL = process.env.OPENAI_BASE_URL || 'http://127.0.0.1:11434/v1'
const API_KEY = process.env.OPENAI_API_KEY || 'local-not-needed'
const MODEL = argVal('--model', process.env.MODEL_ID || process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'llama3:8b')
const SYSTEM = argVal('--system', process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT || '')
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 256)
const TEMPERATURE = Number(process.env.TEMPERATURE || 0.7)
const TOP_P = Number(process.env.TOP_P || 0.9)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const messages = []
if (SYSTEM) messages.push({ role: 'system', content: SYSTEM })

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve))
}

async function streamChat(userText) {
  messages.push({ role: 'user', content: userText })
  const payload = {
    model: MODEL,
    messages,
    temperature: TEMPERATURE,
    top_p: TOP_P,
    max_tokens: MAX_TOKENS,
    stream: true,
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(()=> '')
    throw new Error(`Upstream error ${res.status}: ${text}`)
  }

  const decoder = new TextDecoder()
  const reader = res.body.getReader()
  let assistant = ''
  process.stdout.write('\nassistant: ')
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const data = t.replace(/^data:\s*/, '')
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content || ''
        if (delta) {
          assistant += delta
          process.stdout.write(delta)
        }
      } catch {}
    }
  }
  process.stdout.write('\n')
  messages.push({ role: 'assistant', content: assistant })
}

async function main() {
  console.log(`Local Chat CLI\n- base: ${BASE_URL}\n- model: ${MODEL}\n- system: ${SYSTEM ? '(set)' : '(none)'}\nType 'new' to reset, 'exit' to quit.`)
  while (true) {
    const input = await ask('\nuser: ')
    if (!input.trim()) continue
    if (input.trim().toLowerCase() === 'exit') break
    if (input.trim().toLowerCase() === 'new') {
      messages.length = 0
      if (SYSTEM) messages.push({ role: 'system', content: SYSTEM })
      console.log('(new thread)')
      continue
    }
    try {
      await streamChat(input)
    } catch (e) {
      console.error(`\n[error] ${e?.message || e}`)
    }
  }
  rl.close()
}

main().catch(e => { console.error(e); process.exit(1) })


