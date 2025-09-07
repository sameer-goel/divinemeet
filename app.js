// App bootstrap and router
import { db } from './db/dexie.js';
import * as repo from './db/repo.js';
import { fmtDate, fmtTime, fmtDuration } from './util/format.js';

const routes = {
  '#/dashboard': () => import('./views/dashboard.js'),
  '#/create': () => import('./views/createMeet.js'),
  '#/activities': () => import('./views/editActivities.js'),
  '#/live': () => import('./views/liveSession.js'),
  '#/timeline': () => import('./views/timeline.js'),
  '#/summary': () => import('./views/summary.js'),
};

const appEl = document.getElementById('app');

function setView(el) {
  appEl.innerHTML = '';
  if (el) appEl.appendChild(el);
}

async function route() {
  const hash = location.hash || '#/dashboard';
  const [base, id] = hash.split('/').slice(0, 3);
  const key = id ? `${base}/${hash.split('/')[2] ? '' : ''}` : base + (base.endsWith('/') ? '' : '');
  // Determine base route (e.g. #/activities/:meetId)
  let baseKey = hash.split('/').slice(0,2).join('/');
  if (!routes[baseKey]) baseKey = '#/dashboard';
  try {
    const mod = await routes[baseKey]();
    const view = await mod.render({
      hash,
      params: parseParams(hash),
      navigate,
      repo,
      fmt: { fmtDate, fmtTime, fmtDuration },
    });
    setView(view);
  } catch (err) {
    console.error(err);
    const pre = document.createElement('pre');
    pre.className = 'card error mono';
    pre.textContent = 'Error loading view\n' + err.message;
    setView(pre);
  }
}

function parseParams(hash) {
  // Patterns: #/activities/:meetId, #/live/:meetId, #/timeline/:meetId, #/summary/:meetId
  const parts = hash.split('/');
  const section = parts[1] || 'dashboard';
  const meetId = parts[2] || null;
  const extra = parts[3] || null;
  return { section, meetId, extra };
}

function navigate(path) {
  if (location.hash !== path) location.hash = path;
  else route();
}

// Export/Import buttons
document.getElementById('exportBtn').addEventListener('click', async () => {
  const data = await repo.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dvine-meet-export-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
  a.click();
});
document.getElementById('importInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    const { imported, replaced } = await repo.importAll(json);
    alert(`Imported ${imported} records. Replaced ${replaced}.`);
    route();
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  } finally {
    e.target.value = '';
  }
});

// Initial route
window.addEventListener('hashchange', route);
route();

// Service worker registration (offline support)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

