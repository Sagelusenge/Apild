const storageKey = 'apild_public_visitor_id';

export function publicVisitorId() {
  try {
    const current = window.localStorage.getItem(storageKey);
    if (current && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(current)) return current;
    const next = crypto.randomUUID();
    window.localStorage.setItem(storageKey, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}
