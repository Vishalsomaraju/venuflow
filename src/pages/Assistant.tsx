/**
 * src/pages/Assistant.tsx
 * VenueFlow AI assistant page — pure rendering layer.
 * All business logic lives in src/hooks/useAssistant.ts.
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAssistant, type ChatMessage } from '@/hooks/useAssistant'
import { SUGGESTED_QUESTIONS, ASSISTANT_NAME, ASSISTANT_MODEL, ASSISTANT_PLACEHOLDER_ACTIVE, ASSISTANT_PLACEHOLDER_INACTIVE } from '@/constants'
import { cn } from '@/lib/utils'
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

// ─── Typing indicator ─────────────────────────────────────────────

/** Animated bouncing dot indicator shown while the assistant is streaming */
function TypingDots(): React.JSX.Element {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-accent/60"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────

/**
 * Renders a single chat message bubble with an avatar, content, and an
 * optional copy button for assistant messages.
 */
function MessageBubble({
  message,
  onCopy,
}: {
  message: ChatMessage
  onCopy: (text: string) => void
}): React.JSX.Element {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  function handleCopy(): void {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group flex gap-3 w-full',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1',
          isUser
            ? 'bg-accent text-white'
            : 'bg-surface-light border border-surface-border text-accent'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bot className="h-4 w-4" aria-hidden="true" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-surface border border-surface-border text-text-primary rounded-tl-sm'
        )}
      >
        {message.streaming && message.content === '' ? (
          <TypingDots />
        ) : (
          <>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.streaming && (
              <span className="inline-block h-4 w-0.5 bg-accent/70 ml-0.5 animate-pulse" />
            )}
          </>
        )}

        {/* Copy button — only for completed assistant messages */}
        {!isUser && !message.streaming && message.content && (
          <button
            onClick={handleCopy}
            aria-label="Copy message"
            className={cn(
              'absolute -bottom-7 right-0 flex items-center gap-1',
              'text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:text-text-secondary'
            )}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────

/**
 * Shown in the message area when no messages have been sent yet.
 * Displays a status badge indicating whether live data is connected.
 */
function EmptyState({
  contextLine,
  isConfigured,
}: {
  contextLine: string
  isConfigured: boolean
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
      <div className="relative">
        <div className="h-20 w-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Bot className="h-10 w-10 text-accent" aria-hidden="true" />
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-primary-bg flex items-center justify-center">
          <Zap className="h-2.5 w-2.5 text-white" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-bold text-text-primary">{ASSISTANT_NAME}</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Ask me anything about the current crowd, wait times, or how to navigate the venue.
        </p>
      </div>

      {isConfigured ? (
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-emerald-400 font-medium">
            Live data connected · {contextLine}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 max-w-sm">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
          <p className="text-xs text-amber-400 text-left">
            Set <code className="font-mono">VITE_GEMINI_API_KEY</code> in{' '}
            <code className="font-mono">.env.local</code> to enable the assistant.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────

/**
 * Assistant page — composes the full-screen chat UI.
 * All business logic is delegated to the useAssistant hook.
 */
export function Assistant(): React.JSX.Element {
  const {
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
  } = useAssistant()

  const hasMessages = messages.length > 0

  const [localInput, setLocalInput] = useState(input)

  // Debounce the local input to the store
  useEffect(() => {
    const timer = setTimeout(() => {
      setInput(localInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [localInput, setInput])

  // Sync down when cleared externally (e.g. after submit)
  useEffect(() => {
    if (input === '') setLocalInput('')
  }, [input])

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, bottomRef])

  const handleLocalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Use localInput immediately on enter
      void submit(localInput)
    } else {
      handleKeyDown(e)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Bot className="h-5 w-5 text-accent" aria-hidden="true" />
            {isConfigured && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-primary-bg" aria-hidden="true" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{ASSISTANT_NAME}</h1>
            <p className="text-xs text-text-secondary">
              Powered by {ASSISTANT_MODEL} ·{' '}
              <span className={isConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {isConfigured ? 'Live context active' : 'API key required'}
              </span>
            </p>
          </div>
        </div>

        {hasMessages && (
          <button
            onClick={clearChat}
            aria-label="Start a new chat"
            className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            New chat
          </button>
        )}
      </div>

      {/* ── Message area ─────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-surface-border bg-surface/50 p-4 space-y-6 mb-4"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {!hasMessages ? (
          <EmptyState contextLine={contextLine} isConfigured={isConfigured} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onCopy={handleCopy} />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips ──────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-3 shrink-0 no-scrollbar">
        {(hasMessages ? SUGGESTED_QUESTIONS.slice(0, 4) : SUGGESTED_QUESTIONS).map((q) => (
          <button
            key={q}
            onClick={() => void submit(q)}
            disabled={isStreaming || !isConfigured}
            className={cn(
              'whitespace-nowrap rounded-full border border-surface-border bg-surface',
              hasMessages
                ? 'px-3 py-1.5 text-xs text-text-muted hover:border-accent/30 hover:text-text-secondary'
                : 'px-4 py-2 text-xs font-medium text-text-secondary hover:border-accent/40 hover:text-text-primary hover:bg-surface-light',
              'transition-all duration-150 shrink-0 flex items-center gap-1.5',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {!hasMessages && <Sparkles className="h-3 w-3 text-accent/70" aria-hidden="true" />}
            {q}
          </button>
        ))}
      </div>

      {/* ── Input bar ────────────────────────────────────────── */}
      <div className="relative flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <label htmlFor="assistant-message-input" className="sr-only">
            Ask the VenueFlow assistant a question
          </label>
          <input
            id="assistant-message-input"
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleLocalKeyDown}
            placeholder={isConfigured ? ASSISTANT_PLACEHOLDER_ACTIVE : ASSISTANT_PLACEHOLDER_INACTIVE}
            disabled={!isConfigured || isStreaming}
            aria-label="Message input"
            className={cn(
              'w-full rounded-2xl border border-surface-border bg-surface',
              'pl-5 pr-14 py-4 text-sm text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />

          {isStreaming && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-accent/50"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => void submit(localInput)}
          disabled={!isConfigured || isStreaming || !localInput.trim()}
          aria-label="Send message"
          className={cn(
            'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0',
            'bg-accent text-white shadow-lg shadow-accent/20',
            'hover:bg-accent/90 active:scale-95 transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
          )}
        >
          {isStreaming ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </motion.div>
          ) : (
            <Send className="h-5 w-5 ml-0.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* ── Context footer ─────────────────────────────────── */}
      {isConfigured && (
        <p className="text-center text-[10px] text-text-muted mt-2 shrink-0">
          AI has live venue data · {contextLine}
        </p>
      )}
    </div>
  )
}
