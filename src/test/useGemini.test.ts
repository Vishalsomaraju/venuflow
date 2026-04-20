import { describe, expect, it } from 'vitest'
import { sanitizeGeminiError } from '@/hooks/useGemini'

describe('sanitizeGeminiError', () => {
  it('redacts API keys embedded in error messages', () => {
    const error = new Error(
      'Request failed: https://example.com?key=super-secret-key&alt=json'
    )

    expect(sanitizeGeminiError(error)).toContain('key=REDACTED')
    expect(sanitizeGeminiError(error)).not.toContain('super-secret-key')
  })

  it('returns a fallback message for unknown errors', () => {
    expect(sanitizeGeminiError(null)).toBe('Gemini request failed')
  })
})
