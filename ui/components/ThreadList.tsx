"use client"
import React, { useEffect, useState } from 'react'

type Thread = { id: string; title: string; createdAt: string }

export default function ThreadList({ selectedId, onSelect }: { selectedId: string | null, onSelect: (id: string) => void }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/threads')
        const data = await res.json()
        setThreads(data)
      } catch {}
    })()
  }, [])

  async function refresh() {
    try {
      const res = await fetch('/api/threads')
      const data = await res.json()
      setThreads(data)
    } catch {}
  }

  const filtered = threads.filter(t => t.title.toLowerCase().includes(q.toLowerCase()))

  async function doDelete(id: string) {
    await fetch(`/api/threads/${id}`, { method: 'DELETE' })
    setThreads(prev => prev.filter(t => t.id !== id))
    if (selectedId === id) onSelect('')
  }

  async function doRename(id: string, title: string) {
    if (!title.trim()) { setEditingId(null); return }
    await fetch(`/api/threads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
    setThreads(prev => prev.map(t => t.id === id ? { ...t, title } : t))
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search" className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent p-2" />
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map(t => (
          <div key={t.id} className={`w-full px-2 py-1 rounded ${selectedId===t.id? 'bg-gray-200 dark:bg-gray-800':''}`}>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate">
                {editingId === t.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e)=>setEditingTitle(e.target.value)}
                    onKeyDown={(e)=>{ if (e.key==='Enter') doRename(t.id, editingTitle); if (e.key==='Escape') setEditingId(null) }}
                    onBlur={()=>doRename(t.id, editingTitle)}
                    className="w-full rounded border border-gray-300 dark:border-gray-700 bg-transparent px-1"
                  />
                ) : (
                  <button onClick={()=>onSelect(t.id)} className="w-full text-left truncate">{t.title}</button>
                )}
                <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              {editingId !== t.id && (
                <>
                  <button title="Rename" onClick={()=>{ setEditingId(t.id); setEditingTitle(t.title) }} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800">Rename</button>
                  <button title="Delete" onClick={()=>doDelete(t.id)} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length===0 && <div className="text-sm text-gray-500">No threads yet. Start chatting.</div>}
      </div>
      <div className="flex gap-2">
        <button onClick={()=>onSelect('')} className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800">New chat</button>
        <button onClick={refresh} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800">Refresh</button>
      </div>
    </div>
  )
}


