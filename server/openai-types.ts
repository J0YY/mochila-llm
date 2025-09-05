export type ChatMessage = { role: 'system'|'user'|'assistant'; content: string }
export type ChatCompletionChunk = {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: { role?: 'assistant', content?: string }
    finish_reason: string | null
  }>
}


