"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const MODEL_OPTIONS = [
  // Common Ollama/local names and a vLLM-friendly HF id for comparison
  'llama3.2:1b-instruct',
  'llama3.2:3b-instruct',
  'llama3:8b',
  'mistral:7b-instruct',
  'qwen2.5:7b-instruct',
  'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
  'openai/gpt-oss-20b',
]

export default function ParamsBar() {
  const [model, setModel] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_MODEL || '')
  const [temp, setTemp] = useState<number>(Number(process.env.TEMPERATURE || 0.7))
  const [topP, setTopP] = useState<number>(Number(process.env.TOP_P || 0.9))
  const [maxTok, setMaxTok] = useState<number>(Number(process.env.MAX_TOKENS || 256))
  const [backend, setBackend] = useState<'vllm'|'ollama'>((typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('app_settings')||'{}').backend) : undefined) || (process.env.BACKEND as any) || 'ollama')

  useEffect(() => {
    const saved = localStorage.getItem('app_settings')
    if (saved) {
      try {
        const s = JSON.parse(saved)
        if (s.model) setModel(s.model)
        if (typeof s.temperature === 'number') setTemp(s.temperature)
        if (typeof s.top_p === 'number') setTopP(s.top_p)
        if (typeof s.max_tokens === 'number') setMaxTok(s.max_tokens)
        if (s.backend) setBackend(s.backend)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const s = { model, temperature: temp, top_p: topP, max_tokens: maxTok, backend }
    localStorage.setItem('app_settings', JSON.stringify(s))
  }, [model, temp, topP, maxTok, backend])

  // Heuristic: switch backend when model looks like HF id (vLLM) vs tag (Ollama)
  useEffect(() => {
    if (!model) return
    if (model.includes('/')) setBackend('vllm')
    else if (model.includes(':')) setBackend('ollama')
  }, [model])

  async function doExport() {
    const res = await fetch('/api/storage/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'threads.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await fetch('/api/storage/import', { method:'POST', body: text })
    alert('Import complete')
  }

  return (
    <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="font-semibold">{process.env.NEXT_PUBLIC_APP_NAME || "Joy's Local LLMs"}</div>
      <label className="flex items-center gap-1 text-sm">Model
        <select className="rounded border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1" value={model} onChange={(e)=>setModel(e.target.value)}>
          {[model, ...MODEL_OPTIONS.filter(m => m!==model)].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-sm">Backend
        <select className="rounded border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1" value={backend} onChange={(e)=>setBackend(e.target.value as any)}>
          <option value="ollama">ollama</option>
          <option value="vllm">vllm</option>
        </select>
      </label>
      <label className="flex items-center gap-1 text-sm">Temp
        <input type="number" step="0.1" min="0" max="2" className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1" value={temp} onChange={(e)=>setTemp(Number(e.target.value))} />
      </label>
      <label className="flex items-center gap-1 text-sm">top_p
        <input type="number" step="0.05" min="0" max="1" className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1" value={topP} onChange={(e)=>setTopP(Number(e.target.value))} />
      </label>
      <label className="flex items-center gap-1 text-sm">max_tokens
        <input type="number" step="1" min="1" max="8192" className="w-24 rounded border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1" value={maxTok} onChange={(e)=>setMaxTok(Number(e.target.value))} />
      </label>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/info" className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">Info</Link>
        <button onClick={doExport} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">Export</button>
        <label className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm cursor-pointer">
          Import
          <input type="file" accept="application/json" onChange={doImport} className="hidden" />
        </label>
      </div>
    </div>
  )
}


