import { NextResponse } from 'next/server'
import { uploadImageFile } from '@/lib/did'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const { imageUrl } = await req.json()
      if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })

      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: `Could not download image from URL: ${imageResponse.status}` },
          { status: 400 }
        )
      }

      const responseType = imageResponse.headers.get('content-type') ?? ''
      if (!responseType.startsWith('image/')) {
        return NextResponse.json(
          { error: 'The pasted URL does not point to a direct image file. Try a URL ending in .jpg, .png, or .webp.' },
          { status: 400 }
        )
      }

      const imageBlob = await imageResponse.blob()
      const source_url = await uploadImageFile(imageBlob)
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
