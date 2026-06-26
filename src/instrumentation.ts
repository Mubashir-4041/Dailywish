/**
 * Next.js instrumentation — runs once when the server boots, in EACH runtime
 * (nodejs and edge). The actual crash-guard touches `process.on`, a Node-only
 * API, so it lives in a separate module that is dynamically imported only when
 * we're in the Node.js runtime. A plain `if (typeof process.on …)` guard is not
 * enough: the Edge bundler statically rejects any reference to `process.on`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}
