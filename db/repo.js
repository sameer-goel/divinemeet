import { db } from './dexie.js';

// IDs
const newMeetId = () => (crypto?.randomUUID?.() || ('m_' + Math.random().toString(36).slice(2)));

// Meets
export async function createMeet({ title, seed, logicState }) {
  const meetId = newMeetId();
  const now = new Date().toISOString();
  await db.meets.add({ meetId, title: title || 'Untitled', status: 'draft', createdAt: now, seed, logicState });
  return getMeet(meetId);
}

export function updateMeet(meetId, patch) {
  return db.meets.update(meetId, patch);
}

export function getMeet(meetId) {
  return db.meets.get(meetId);
}

export function listMeets() {
  return db.meets.orderBy('createdAt').reverse().toArray();
}

// Activities
export async function addActivity(meetId, { title, tags }) {
  const id = await db.activities.add({ meetId, title, tags: tags || [] });
  return db.activities.get(id);
}

export function updateActivity(id, patch) {
  return db.activities.update(id, patch);
}

export function deleteActivity(id) {
  return db.activities.delete(id);
}

export function listActivitiesByMeet(meetId) {
  return db.activities.where('meetId').equals(meetId).toArray();
}

// Picks
export async function addPick({ meetId, activityId, round, pickedAt, data }) {
  const id = await db.picks.add({ meetId, activityId, round, pickedAt, data });
  return db.picks.get(id);
}

export function updatePick(id, patch) {
  return db.picks.update(id, patch);
}

export function listPicksByMeet(meetId) {
  return db.picks.where('meetId').equals(meetId).sortBy('pickedAt');
}

// Reflections
export async function addReflection({ meetId, pickId, text, tags }) {
  const createdAt = new Date().toISOString();
  const id = await db.reflections.add({ meetId, pickId, text, tags: tags || [], createdAt });
  return db.reflections.get(id);
}

export function listReflectionsByMeet(meetId) {
  return db.reflections.where('meetId').equals(meetId).sortBy('createdAt');
}

// Summaries
export async function saveSummary({ meetId, content, meta }) {
  const generatedAt = new Date().toISOString();
  const id = await db.summaries.add({ meetId, content, meta, generatedAt });
  return db.summaries.get(id);
}

export function getLatestSummary(meetId) {
  return db.summaries.where('meetId').equals(meetId).last();
}

// Live status helpers
export async function beginLive(meetId) {
  await db.meets.update(meetId, { status: 'live', liveAt: new Date().toISOString() });
}

export async function endLive(meetId) {
  await db.meets.update(meetId, { status: 'done', endedAt: new Date().toISOString() });
}

// Export/Import
export async function exportAll() {
  const [meets, activities, picks, reflections, summaries] = await Promise.all([
    db.meets.toArray(),
    db.activities.toArray(),
    db.picks.toArray(),
    db.reflections.toArray(),
    db.summaries.toArray(),
  ]);
  return { version: 1, exportedAt: new Date().toISOString(), meets, activities, picks, reflections, summaries };
}

export async function importAll(json, { replace = false } = {}) {
  if (!json || typeof json !== 'object') throw new Error('Invalid JSON');
  const { meets = [], activities = [], picks = [], reflections = [], summaries = [] } = json;
  let imported = 0, replaced = 0;
  await db.transaction('rw', db.meets, db.activities, db.picks, db.reflections, db.summaries, async () => {
    if (replace) {
      await Promise.all([db.meets.clear(), db.activities.clear(), db.picks.clear(), db.reflections.clear(), db.summaries.clear()]);
    }
    for (const m of meets) { await db.meets.put(m); imported++; }
    for (const a of activities) { await db.activities.put(a); imported++; }
    for (const p of picks) { await db.picks.put(p); imported++; }
    for (const r of reflections) { await db.reflections.put(r); imported++; }
    for (const s of summaries) { await db.summaries.put(s); imported++; }
  });
  return { imported, replaced };
}

