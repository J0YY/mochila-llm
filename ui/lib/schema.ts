import { z } from 'zod'

export const MessageSchema = z.object({
  role: z.enum(['system','user','assistant']),
  content: z.string(),
})

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  max_tokens: z.number().optional(),
  model: z.string().optional(),
  system: z.string().optional(),
  threadId: z.string().nullable().optional(),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>


