/**
 * src/hooks/useAssistant.ts
 * Custom hook that encapsulates all AI chat business logic for the VenueFlow
 * assistant page. Manages message history, streaming state, and the Gemini
 * API integration — keeping Assistant.tsx as a pure rendering layer.
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import { useVenueStore } from '@/store/venueStore'
import { useGemini } from '@/hooks/useGemini'
import { buildVenueSystemPrompt, buildQuickContextLine } from '@/lib/geminiContext'
import { sanitizeInput } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────

/** A single chat message in the assistant conversation */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** True while the assistant is still streaming this message */
  streaming?: boolean
  timestamp: Date
}

/** Return shape of useAssistant */
export interface UseAssistantResult {
  messages: ChatMessage[]
  input: string
  setInput: (val: string) => void
  isStreaming: boolean
  isConfigured: boolean
  contextLine: string
  inputRef: React.RefObject<HTMLInputElement | null>
  bottomRef: React.RefObject<HTMLDivElement | null>
  submit: (text: string) => Promise<void>
  clearChat: () => void
  handleCopy: (text: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

// ─── Hook ──────────────────────────────────────────────────────────

/**
 * Encapsulates all business logic for the VenueFlow AI assistant chat.
 *
 * Responsibilities:
 * - Builds a live venue context snapshot from the Zustand store
 * - Manages the Gemini API session and streaming callbacks
 * - Maintains local message history (user + assistant turns)
 * - Handles copy-to-clipboard, chat clearing, and keyboard shortcuts
 *
 * @returns State and handlers consumed by the Assistant component.
 */
export function useAssistant(): UseAssistantResult {
  const zones = useVenueStore((s) => s.zones)
  const facilities = useVenueStore((s) => s.facilities)
  const alerts = useVenueStore((s) => s.alerts)
  const totalAttendees = zones.reduce((sum, z) => sum + z.currentCount, 0)
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0)

  /** Memoised context snapshot — updates whenever Firestore data changes */
  const snapshot = useMemo(
    () => ({ zones, facilities, alerts, totalAttendees, totalCapacity }),
    [zones, facilities, alerts, totalAttendees, totalCapacity]
  )
  const systemPrompt = useMemo(() => buildVenueSystemPrompt(snapshot), [snapshot])
  const contextLine = useMemo(() => buildQuickContextLine(snapshot), [snapshot])

  const { sendMessage, isConfigured } = useGemini({ systemPrompt })

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  /** Timestamp of the last successful submit — enforces 2 s rate limit */
  const lastSubmitRef = useRef<number>(0)

  /**
   * Submits a user message and streams the assistant response.
   * Appends both a user message and a streaming placeholder to state,
   * then updates the placeholder token-by-token as the response arrives.
   *
   * @param text - The raw text to send (will be trimmed).
   */
  const submit = useCallback(
    async (text: string): Promise<void> => {
      // ── Rate limit: 2 seconds between submissions ──
      const now = Date.now()
      if (now - lastSubmitRef.current < 2000) return

      // ── Input sanitization ──
      const trimmed = sanitizeInput(text)
      if (!trimmed || isStreaming) return

      lastSubmitRef.current = now
      setInput('')

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])

      const assistantId = crypto.randomUUID()
      const placeholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, placeholder])
      setIsStreaming(true)

      await sendMessage(trimmed, {
        onToken: (token: string): void => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m
            )
          )
        },
        onDone: (): void => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m
            )
          )
          setIsStreaming(false)
          inputRef.current?.focus()
        },
        onError: (error: string): void => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `⚠️ ${error}`, streaming: false }
                : m
            )
          )
          setIsStreaming(false)
        },
      })
    },
    [isStreaming, sendMessage]
  )

  /**
   * Handles the Enter key shortcut to submit the current input.
   * Shift+Enter is ignored to allow multi-line composition if desired.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void submit(input)
      }
    },
    [input, submit]
  )

  /**
   * Clears all messages and resets streaming state, then re-focuses the input.
   */
  const clearChat = useCallback((): void => {
    setMessages([])
    setIsStreaming(false)
    inputRef.current?.focus()
  }, [])

  /**
   * Copies the provided text string to the system clipboard.
   *
   * @param text - The content to copy.
   */
  const handleCopy = useCallback((text: string): void => {
    void navigator.clipboard.writeText(text)
  }, [])

  return {
    messages,
    input,
    setInput,
    isStreaming,
    isConfigured,
    contextLine,
    inputRef,
    bottomRef,
    submit,
    clearChat,
    handleCopy,
    handleKeyDown,
  }
}
