import fetchMock from 'jest-fetch-mock'
import { uploadImage, createStream, sendSdpAnswer, sendIce, sendTalk, closeStream } from '@/lib/did'

beforeEach(() => fetchMock.resetMocks())

describe('uploadImage', () => {
  it('posts image URL and returns source_url', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ url: 'https://d-id.com/images/abc.jpg' }))
    const result = await uploadImage('https://example.com/photo.jpg')
    expect(result).toBe('https://d-id.com/images/abc.jpg')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.d-id.com/images',
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('createStream', () => {
  it('posts source_url and returns id and offer', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ id: 'str_123', offer: { sdp: 'v=0...' } }))
    const result = await createStream('https://d-id.com/images/abc.jpg')
    expect(result.id).toBe('str_123')
    expect(result.offer.sdp).toBe('v=0...')
  })
})

describe('sendTalk', () => {
  it('posts text and voice_id to stream talk endpoint', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ status: 'ok' }))
    await sendTalk('str_123', 'ses_456', 'Hello world', 'voice_abc')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.d-id.com/talks/streams/str_123')
    const body = JSON.parse(opts!.body as string)
    expect(body.script.input).toBe('Hello world')
    expect(body.script.provider.voice_id).toBe('voice_abc')
  })
})
