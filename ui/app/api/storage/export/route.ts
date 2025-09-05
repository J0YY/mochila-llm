import { exportThreads } from '@/lib/storage'

export async function GET() {
  const json = await exportThreads()
  return new Response(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="threads.json"'
    }
  })
}


