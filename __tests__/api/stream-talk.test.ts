import { getMissingTalkFields } from '@/app/api/stream/talk/route'

describe('stream/talk route', () => {
  it('identifies exactly which talk fields are missing', () => {
    expect(
      getMissingTalkFields({
        streamId: 'stream-123',
        sessionId: 'session-456',
        voiceId: 'voice-789',
      })
    ).toEqual(['text'])
  })
})
