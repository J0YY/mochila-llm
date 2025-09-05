import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const thread = await prisma.thread.findUnique({ where: { id: params.id }, include: { messages: true } })
  if (!thread) return new Response('Not found', { status: 404 })
  return Response.json(thread)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.thread.delete({ where: { id: params.id } }).catch(() => null)
  return Response.json({ ok: true })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({})) as { title?: string }
  if (!body.title) return new Response('Bad Request', { status: 400 })
  const t = await prisma.thread.update({ where: { id: params.id }, data: { title: body.title } }).catch(() => null)
  if (!t) return new Response('Not found', { status: 404 })
  return Response.json(t)
}


