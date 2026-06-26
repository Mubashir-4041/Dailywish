import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom lacks these globals that Node libraries (postgres, jose) rely on.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

// jsdom polyfills for browser APIs used by framer-motion, next-themes & recharts.
class MockIntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}
global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

class MockResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
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
  });
}

// Provide deterministic env for modules that read process.env at import time.
process.env.JWT_SECRET ||= 'test-jwt-secret-0123456789abcdef0123456789';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-0123456789abcdef0123';
process.env.NEXT_PUBLIC_APP_URL ||= 'http://localhost:3000';
