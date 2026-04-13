import { NextResponse } from 'next/server'
import { uploadImage } from '@/lib/did'

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }
    const source_url = await uploadImage(imageUrl)
    return NextResponse.json({ source_url })
  } catch (err) {
    console.error('avatar/create error:', err)
    return NextResponse.json({ error: 'Avatar creation failed' }, { status: 500 })
  }
}
