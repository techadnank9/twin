import { NextResponse } from 'next/server'

const BASE = 'https://api.d-id.com'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const res = await fetch(`${BASE}/talks/${id}`, {
      headers: { Authorization: `Basic ${process.env.DID_API_KEY!}` },
    })
    if (!res.ok) throw new Error(`D-ID talks/status failed: ${res.status}`)
    const { status, result_url } = await res.json()
    return NextResponse.json({ status, result_url })
  } catch (err) {
    console.error('talks/status error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
