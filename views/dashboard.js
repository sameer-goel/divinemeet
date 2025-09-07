import { listMeets, listActivitiesByMeet, listPicksByMeet } from '../db/repo.js';

export async function render({ navigate }) {
  const root = document.createElement('div');
  root.className = 'col';

  const head = document.createElement('div');
  head.className = 'row toolbar';
  head.innerHTML = `
    <div class="col">
      <h2 class="section-title">Dashboard</h2>
      <small class="muted">All meets</small>
    </div>
    <div class="row">
      <a class="secondary navlink" href="#/create">+ Create</a>
    </div>
  `;
  root.appendChild(head);

  const meets = await listMeets();
  const list = document.createElement('div');
  list.className = 'col';
  for (const m of meets) {
    const [acts, picks] = await Promise.all([
      listActivitiesByMeet(m.meetId),
      listPicksByMeet(m.meetId),
    ]);
    const card = document.createElement('a');
    card.href = `#/live/${m.meetId}`;
    card.className = 'card';
    card.style.textDecoration = 'none';
    card.innerHTML = `
      <div class="row" style="justify-content:space-between; align-items:center">
        <div class="col">
          <div><b>${m.title}</b> <span class="muted">· ${m.status}</span></div>
          <small class="muted">${acts.length} activities · ${picks.length} picks</small>
        </div>
        <div class="pill">${new Date(m.createdAt).toLocaleDateString()}</div>
      </div>
    `;
    list.appendChild(card);
  }
  if (!meets.length) {
    const empty = document.createElement('div');
    empty.className = 'card muted';
    empty.textContent = 'No meets yet. Create one to get started.';
    list.appendChild(empty);
  }
  root.appendChild(list);

  // Aggregates (simple CSS bars)
  const agg = document.createElement('div');
  agg.className = 'card col';
  agg.innerHTML = `<div class="section-title">Activity Frequencies</div>`;
  // compute across all meets
  const freq = new Map();
  for (const m of meets) {
    const acts = await listActivitiesByMeet(m.meetId);
    for (const a of acts) {
      freq.set(a.title, (freq.get(a.title) || 0) + 1);
    }
  }
  let max = 0; for (const v of freq.values()) max = Math.max(max, v);
  for (const [title, count] of [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10)) {
    const row = document.createElement('div');
    row.className = 'col';
    row.innerHTML = `
      <div class="row" style="justify-content:space-between"><span>${escapeHtml(title)}</span><span class="muted">${count}</span></div>
      <div class="bar"><span style="width:${(count/max*100)||0}%"></span></div>
    `;
    agg.appendChild(row);
  }
  root.appendChild(agg);

  return root;
}

function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

