import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const rows = await prisma.setting.findMany()
  const obj = rows.reduce<Record<string,string>>((acc, s) => (acc[s.key] = s.value, acc), {})
  return Response.json(obj)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const entries = Object.entries(body as Record<string, string>)
  await Promise.all(entries.map(([key, value]) => prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })))
  return Response.json({ ok: true })
}


