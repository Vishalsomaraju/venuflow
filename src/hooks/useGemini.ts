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
  type GenerativeModel,
  type ChatSession,
} from '@google/generative-ai'

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
] as const
const API_KEY_PATTERN = /key=[^&\s]+/gi

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
  const activeModelRef = useRef<(typeof MODEL_CANDIDATES)[number]>(
    MODEL_CANDIDATES[0]
  )
  const apiKey = import.meta.env['VITE_GEMINI_API_KEY'] as string | undefined

  const createModel = useCallback(
    (
      genAI: GoogleGenerativeAI,
      modelName: (typeof MODEL_CANDIDATES)[number],
      prompt: string
    ): GenerativeModel =>
      genAI.getGenerativeModel({
        model: modelName,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        systemInstruction: prompt,
      }),
    []
  )

  const resetChat = useCallback(
    (
      newSystemPrompt: string,
      modelName: (typeof MODEL_CANDIDATES)[number] = activeModelRef.current
    ) => {
      if (!apiKey || apiKey === '...') return

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = createModel(genAI, modelName, newSystemPrompt)

      activeModelRef.current = modelName
      chatRef.current = model.startChat({ history: [] })
    },
    [apiKey, createModel]
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
        const fallbackModel = getFallbackModel(activeModelRef.current)
        if (fallbackModel && isModelNotFoundError(err)) {
          try {
            resetChat(systemPrompt, fallbackModel)

            if (!chatRef.current) {
              callbacks.onError('Failed to initialize Gemini session.')
              return
            }

            const retryResult = await chatRef.current.sendMessageStream(message)

            for await (const chunk of retryResult.stream) {
              const text = chunk.text()
              if (text) callbacks.onToken(text)
            }

            callbacks.onDone()
            return
          } catch (retryErr) {
            const retryMsg = sanitizeGeminiError(retryErr)
            console.error('[Gemini] Retry failed:', retryMsg)
            callbacks.onError(retryMsg)
            return
          }
        }

        const msg = sanitizeGeminiError(err)
        console.error('[Gemini] Request failed:', msg)
        callbacks.onError(msg)
      }
    },
    [apiKey, systemPrompt, resetChat]
  )

  const isConfigured =
    !!apiKey && apiKey !== '...' && apiKey.length > 10

  return { sendMessage, resetChat, isConfigured }
}

export function sanitizeGeminiError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'Gemini request failed'
  return message.replace(API_KEY_PATTERN, 'key=REDACTED')
}

function isModelNotFoundError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return message.includes('not found') || message.includes('not supported for generatecontent')
}

function getFallbackModel(
  currentModel: (typeof MODEL_CANDIDATES)[number]
): (typeof MODEL_CANDIDATES)[number] | null {
  const currentIndex = MODEL_CANDIDATES.indexOf(currentModel)
  return MODEL_CANDIDATES[currentIndex + 1] ?? null
}
