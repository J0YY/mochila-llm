"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Chat from '@/components/Chat'
import ThreadList from '@/components/ThreadList'
import ParamsBar from '@/components/ParamsBar'

export default function HomePage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  return (
    <div className="flex h-screen">
      <aside className="w-80 border-r border-gray-200 dark:border-gray-800 p-3 overflow-y-auto">
        <ThreadList selectedId={selectedThreadId} onSelect={setSelectedThreadId} />
      </aside>
      <main className="flex-1 flex flex-col">
        <ParamsBar />
        <div className="flex-1 min-h-0">
          <Chat threadId={selectedThreadId} onThreadIdChange={setSelectedThreadId} />
        </div>
      </main>
    </div>
  )
}


