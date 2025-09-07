import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4/+esm';

export const db = new Dexie('cosmic');
db.version(1).stores({
  meets:      'meetId, title, status, createdAt',
  activities: '++id, meetId, title',
  picks:      '++id, meetId, round, pickedAt',
  reflections:'++id, meetId, pickId, createdAt',
  summaries:  '++id, meetId, generatedAt'
});

// Helpful: ensure db open happens early
db.open().catch((e) => {
  console.error('Failed to open IndexedDB', e);
});

