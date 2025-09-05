import { prisma } from './db'

export async function exportThreads() {
  const threads = await prisma.thread.findMany({ include: { messages: true } })
  return JSON.stringify({ threads }, null, 2)
}

export async function importThreads(json: string) {
  const data = JSON.parse(json) as { threads: any[] }
  for (const t of data.threads || []) {
    await prisma.thread.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        title: t.title,
        createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
        messages: { create: (t.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
          tokensIn: m.tokensIn ?? null,
          tokensOut: m.tokensOut ?? null,
          latencyMs: m.latencyMs ?? null,
        })) },
      },
      update: {
        title: t.title,
      },
    })
  }
}


