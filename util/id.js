export function uid(prefix = 'id') {
  if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_` + Math.random().toString(36).slice(2);
}

