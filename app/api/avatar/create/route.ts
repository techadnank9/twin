import { NextResponse } from 'next/server'
import { uploadImageFile, uploadImageUrl } from '@/lib/did'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const { imageUrl } = await req.json()
      if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
      const source_url = await uploadImageUrl(imageUrl)
      return NextResponse.json({ source_url })
    }

    const form = await req.formData()
    const image = form.get('image') as Blob | null
    if (!image) return NextResponse.json({ error: 'image file is required' }, { status: 400 })
    const source_url = await uploadImageFile(image)
    return NextResponse.json({ source_url })
  } catch (err) {
    console.error('avatar/create error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
