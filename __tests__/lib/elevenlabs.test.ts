import fetchMock from 'jest-fetch-mock'
import { cloneVoice, textToSpeech } from '@/lib/elevenlabs'

beforeEach(() => fetchMock.resetMocks())

describe('cloneVoice', () => {
  it('posts form-data and returns voice_id', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ voice_id: 'voice_abc123' }))
    const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })
    const result = await cloneVoice(audioBlob, 'Adnan')
    expect(result).toBe('voice_abc123')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/voices/add',
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('textToSpeech', () => {
  it('returns audio buffer for given text and voice', async () => {
    const fakeAudio = new Uint8Array([1, 2, 3]).buffer
    fetchMock.mockResponseOnce(Buffer.from(new Uint8Array([1,2,3])), { headers: { 'content-type': 'audio/mpeg' } })
    const result = await textToSpeech('Hello', 'voice_abc123')
    expect(result).toBeInstanceOf(ArrayBuffer)
  })
})
