"use client"
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export default function MessageBubble({ role, content }: { role: 'user'|'assistant'|'system', content: string }) {
  const align = role === 'user' ? 'text-right' : 'text-left'
  const style = role === 'user' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 shadow-sm'
  return (
    <div className={align}>
      <div className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 ${style}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}


