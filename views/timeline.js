import { getMeet, listActivitiesByMeet, listPicksByMeet, listReflectionsByMeet } from '../db/repo.js';
import { fmtDate, fmtTime, fmtDuration } from '../util/format.js';

export async function render({ params, navigate }) {
  const { meetId } = params;
  if (!meetId) return msg('Missing meetId');
  const [meet, activities, picks, reflections] = await Promise.all([
    getMeet(meetId),
    listActivitiesByMeet(meetId),
    listPicksByMeet(meetId),
    listReflectionsByMeet(meetId),
  ]);
  if (!meet) return msg('Meet not found');
  const actById = new Map(activities.map(a => [a.id, a]));
  const reflByPick = groupBy(reflections, r => r.pickId);

  const root = document.createElement('div');
  root.className = 'col';
  const head = document.createElement('div');
  head.className = 'row toolbar';
  head.innerHTML = `
    <div class="col">
      <h2 class="section-title">Timeline</h2>
      <small class="muted">${meet.title}</small>
    </div>
    <div class="row">
      <button class="secondary" id="gotoLive">Back to Live</button>
    </div>
  `;
  head.querySelector('#gotoLive').addEventListener('click', () => navigate(`#/live/${meetId}`));
  root.appendChild(head);

  const list = document.createElement('div');
  list.className = 'col';
  for (const p of picks) {
    const box = document.createElement('div');
    box.className = 'card col';
    const act = actById.get(p.activityId);
    const items = reflByPick.get(p.id) || [];
    box.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div>
          <div><b>Round ${p.round}</b> · ${act?.title ?? 'Activity'}</div>
          <small class="muted">${fmtDate(p.pickedAt)} ${fmtTime(p.pickedAt)} · Duration ${fmtDuration(p.durationMs)}</small>
        </div>
        <div class="pill">${items.length} notes</div>
      </div>
      ${items.length ? `<div class="col">${items.map(i => `<div class="item">${escapeHtml(i.text||'')}</div>`).join('')}</div>` : ''}
    `;
    list.appendChild(box);
  }
  root.appendChild(list);
  return root;
}

function msg(t){ const d=document.createElement('div'); d.className='card muted'; d.textContent=t; return d; }
function groupBy(arr, fn) { const m=new Map(); for(const x of arr){ const k=fn(x); if(!m.has(k)) m.set(k,[]); m.get(k).push(x); } return m; }
function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

