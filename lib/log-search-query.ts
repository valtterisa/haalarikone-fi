import { emptyToNull, type LogSearchBody } from '@/lib/log-search-schema';

export type SearchLogPayload = LogSearchBody;

let pending: SearchLogPayload | null = null;
let unloadAttached = false;

function canLog(payload: SearchLogPayload): boolean {
  return (
    payload.query.trim().length >= 3 ||
    Boolean(payload.color || payload.area || payload.field || payload.school)
  );
}

function toPayload(payload: SearchLogPayload): SearchLogPayload | null {
  const next: SearchLogPayload = {
    query: payload.query.trim().slice(0, 200),
    locale: payload.locale,
    resultCount: payload.resultCount,
    source: payload.source,
    color: emptyToNull(payload.color),
    area: emptyToNull(payload.area),
    field: emptyToNull(payload.field),
    school: emptyToNull(payload.school),
  };
  return canLog(next) ? next : null;
}

function send(payload: SearchLogPayload, keepalive: boolean) {
  const body = JSON.stringify(payload);

  if (keepalive && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    if (navigator.sendBeacon('/api/log-search', new Blob([body], { type: 'application/json' }))) {
      return;
    }
  }

  void fetch('/api/log-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive,
  });
}

function attachUnloadListeners() {
  if (unloadAttached || typeof window === 'undefined') return;
  unloadAttached = true;

  const onLeave = () => flushSearchLog(true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onLeave();
  });
  window.addEventListener('pagehide', onLeave);
}

export function stageSearchLog(payload: SearchLogPayload) {
  attachUnloadListeners();
  pending = toPayload(payload);
}

export function clearSearchLog() {
  pending = null;
}

export function flushSearchLog(keepalive = false) {
  if (!pending) return;
  const payload = pending;
  pending = null;
  send(payload, keepalive);
}

export function logSearchNow(payload: SearchLogPayload) {
  pending = null;
  const next = toPayload(payload);
  if (!next) return;
  attachUnloadListeners();
  send(next, false);
}
