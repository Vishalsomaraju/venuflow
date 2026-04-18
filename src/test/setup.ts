// src/test/setup.ts
import '@testing-library/jest-dom'

// ── Silence framer-motion warnings in JSDOM ──────────────────────
// framer-motion checks for browser APIs that don't exist in jsdom.
// Suppress the harmless console errors so test output stays clean.
const originalError = console.error.bind(console)
beforeAll(() => {
  console.error = (msg: unknown, ...args: unknown[]) => {
    if (
      typeof msg === 'string' &&
      (msg.includes('framer-motion') ||
        msg.includes('ResizeObserver') ||
        msg.includes('matchMedia') ||
        msg.includes('Warning: An update to'))
    ) {
      return
    }
    originalError(msg, ...args)
  }
})
afterAll(() => {
  console.error = originalError
})

// ── Mock window.matchMedia (jsdom doesn't have it) ───────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// ── Mock scrollIntoView (jsdom doesn't have it) ──────────────────
window.HTMLElement.prototype.scrollIntoView = function() {}

// ── Mock IntersectionObserver ────────────────────────────────────
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})
