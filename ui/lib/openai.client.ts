export async function streamChat({ body, onMessage, onThreadId }: {
  body: any,
  onMessage: (delta: string) => void,
  onThreadId?: (id: string | null) => void,
}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.body) throw new Error('No response body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.replace(/^data:\s*/, '')
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content || ''
        if (delta) onMessage(delta)
        if (json.threadId && onThreadId) onThreadId(json.threadId)
      } catch {
        // ignore non-JSON
      }
    }
  }
}


