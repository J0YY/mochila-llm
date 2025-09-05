import { prisma } from '@/lib/db'

export async function GET() {
  const threads = await prisma.thread.findMany({ orderBy: { createdAt: 'desc' } })
  return Response.json(threads)
}

export async function POST() {
  const t = await prisma.thread.create({ data: { title: 'New Chat' } })
  return Response.json(t)
}


