// Google Service: Gemini AI (@google/generative-ai)
// Purpose: Powers the AI Assistant that answers user queries based on real-time venue context.
// Docs: https://ai.google.dev/docs
// src/hooks/useGemini.ts
// Thin wrapper around @google/generative-ai for streaming chat.

import { useRef, useCallback } from 'react'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type ChatSession,
} from '@google/generative-ai'

const MODEL_NAME = 'gemini-1.5-flash'

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

interface UseGeminiOptions {
  systemPrompt: string
}

interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export function useGemini({ systemPrompt }: UseGeminiOptions) {
  const chatRef = useRef<ChatSession | null>(null)
  const apiKey = import.meta.env['VITE_GEMINI_API_KEY'] as string | undefined

  // Reset chat (new context snapshot)
  const resetChat = useCallback(
    (newSystemPrompt: string) => {
      if (!apiKey || apiKey === '...') return

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        systemInstruction: newSystemPrompt,
      })

      chatRef.current = model.startChat({ history: [] })
    },
    [apiKey]
  )

  // Send message and stream back tokens
  const sendMessage = useCallback(
    async (message: string, callbacks: StreamCallbacks) => {
      const key = apiKey
      if (!key || key === '...') {
        callbacks.onError(
          'VITE_GEMINI_API_KEY is not set in .env.local. Add your Gemini API key to enable the assistant.'
        )
        return
      }

      // Lazy-init or re-init chat with latest system prompt
      if (!chatRef.current) {
        resetChat(systemPrompt)
      }

      if (!chatRef.current) {
        callbacks.onError('Failed to initialize Gemini session.')
        return
      }

      try {
        const result = await chatRef.current.sendMessageStream(message)

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) callbacks.onToken(text)
        }

        callbacks.onDone()
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Gemini request failed'
        callbacks.onError(msg)
      }
    },
    [apiKey, systemPrompt, resetChat]
  )

  const isConfigured =
    !!apiKey && apiKey !== '...' && apiKey.length > 10

  return { sendMessage, resetChat, isConfigured }
}
