/**
 * Node.js-only crash guard. Imported by `instrumentation.ts` exclusively when
 * `NEXT_RUNTIME === 'nodejs'`, so `process.on` never reaches the Edge bundle.
 *
 * Purpose: keep the process alive across transient infrastructure blips. The
 * Supabase pooler can occasionally drop/stall a connection; postgres.js then
 * settles the in-flight query's promise (which our callers catch) but may ALSO
 * emit a late, second rejection during connection teardown that has no awaiter.
 * On Node ≥15 an unhandled rejection terminates the process by default — which
 * would take down the whole dev/prod server over a recoverable DB hiccup. We
 * swallow ONLY such operational DB errors; anything else keeps Node's default
 * crash behaviour so real bugs aren't masked.
 */

export {}; // ensure this file is treated as an ES module

const isOperationalDbError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: string; message?: string };
  // postgres.js / node-postgres connection & timeout errors.
  if (e.name === 'PostgresError') return true;
  const code = e.code ?? '';
  // 57014 = statement_timeout; 08* = connection exceptions; CONNECT_* are
  // postgres.js's own connection error codes.
  if (code === '57014' || code.startsWith('08') || code.startsWith('CONNECT')) {
    return true;
  }
  const msg = e.message ?? '';
  return (
    msg.includes('statement timeout') ||
    msg.includes('Connection terminated') ||
    msg.includes('CONNECT_TIMEOUT') ||
    msg.includes('write CONNECTION') ||
    msg.includes('connection closed')
  );
};

process.on('unhandledRejection', (reason) => {
  if (isOperationalDbError(reason)) {
    // eslint-disable-next-line no-console
    console.warn(
      '[instrumentation] swallowed transient DB rejection:',
      reason instanceof Error ? reason.message : reason,
    );
    return;
  }
  throw reason;
});

process.on('uncaughtException', (err) => {
  if (isOperationalDbError(err)) {
    // eslint-disable-next-line no-console
    console.warn(
      '[instrumentation] swallowed transient DB exception:',
      err.message,
    );
    return;
  }
  throw err;
});
