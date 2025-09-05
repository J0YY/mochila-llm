import { importThreads } from '@/lib/storage'

export async function POST(req: Request) {
  const json = await req.text()
  await importThreads(json)
  return Response.json({ ok: true })
}


