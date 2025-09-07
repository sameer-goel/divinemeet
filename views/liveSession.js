import { getMeet, listActivitiesByMeet, listPicksByMeet, addPick, updatePick, beginLive, endLive, addReflection } from '../db/repo.js';
import * as logic from '../logic/logic.js';
import { fmtDuration } from '../util/format.js';

export async function render({ params, navigate }) {
  const { meetId } = params;
  if (!meetId) return msg('Missing meetId');
  const meet = await getMeet(meetId);
  if (!meet) return msg('Meet not found');
  const activities = await listActivitiesByMeet(meetId);
  const picks = await listPicksByMeet(meetId);

  const root = document.createElement('div');
  root.className = 'col';

  const head = document.createElement('div');
  head.className = 'row toolbar';
  head.innerHTML = `
    <div class="col">
      <h2 class="section-title">Live Session</h2>
      <small class="muted">${meet.title} · ${meet.status} · ${activities.length} activities</small>
    </div>
    <div class="row">
      <button class="secondary" id="gotoTimeline">Timeline</button>
      <button class="secondary" id="gotoSummary">Summary</button>
    </div>
  `;
  head.querySelector('#gotoTimeline').addEventListener('click', () => navigate(`#/timeline/${meetId}`));
  head.querySelector('#gotoSummary').addEventListener('click', () => navigate(`#/summary/${meetId}`));
  root.appendChild(head);

  const live = document.createElement('div');
  live.className = 'card col';
  live.innerHTML = `
    <div class="row" style="justify-content:space-between">
      <div></div>
      <div class="row">
        <button class="secondary" id="beginBtn">Begin</button>
        <button class="secondary" id="endBtn">End</button>
      </div>
    </div>
    <div class="row" style="gap:6px;align-items:flex-end">
      <button class="primary" id="pickBtn">Pick Next</button>
      <span class="muted">Round <b id="round">${(picks[picks.length-1]?.round ?? 0) + 1}</b></span>
    </div>
    <div class="muted" style="font-size:0.9em;margin-top:4px">👆 Click "Pick Next" to let the universe choose an activity</div>
    <div id="timeline" class="col">
      <div class="muted">Activity Timeline</div>
      <div id="timelineStack" class="col" style="gap:8px"></div>
    </div>
    <div id="current" class="col">
      <div class="muted">Current pick</div>
      <div id="currentBox" class="item"><span class="muted">No pick yet</span></div>
    </div>
  `;
  root.appendChild(live);

  const currentBox = live.querySelector('#currentBox');
  const roundEl = live.querySelector('#round');
  const timelineStack = live.querySelector('#timelineStack');

  // Load existing picks into timeline
  picks.forEach(pick => addToTimeline(pick));

  live.querySelector('#beginBtn').addEventListener('click', async () => {
    await beginLive(meetId);
    alert('Session started');
  });
  live.querySelector('#endBtn').addEventListener('click', async () => {
    await endLive(meetId);
    alert('Session ended');
  });

  live.querySelector('#pickBtn').addEventListener('click', async () => {
    try {
      const history = await listPicksByMeet(meetId);
      const context = { seed: meet.seed, activities, history, meet };
      const result = await logic.pickNext(context);
      // Expecting: { activityId, round, data? }
      const round = Number(result?.round ?? (history[history.length-1]?.round ?? 0) + 1);
      const activityId = result?.activityId ?? activities[0]?.id;
      if (!activityId) throw new Error('No activities to pick');
      const pickedAt = new Date().toISOString();
      const pick = await addPick({ meetId, activityId, round, pickedAt, data: result?.data });
      roundEl.textContent = String(round + 1);
      addToTimeline(pick);
      renderCurrent(pick);
    } catch (e) {
      alert('Pick failed: ' + e.message);
    }
  });

  function addToTimeline(pick) {
    const act = activities.find(a => a.id === pick.activityId);
    const timelineItem = document.createElement('div');
    timelineItem.className = 'item';
    timelineItem.style.padding = '8px';
    timelineItem.innerHTML = `
      <div class="row" style="justify-content:space-between;align-items:center">
        <div class="col">
          <div><b>${act?.title ?? 'Activity'}</b> <span class="muted">· Round ${pick.round}</span></div>
          <small class="muted">Picked: ${new Date(pick.pickedAt).toLocaleTimeString()}</small>
        </div>
        <div class="muted" style="font-size:0.8em">${pick.id}</div>
      </div>
    `;
    timelineStack.appendChild(timelineItem);
  }

  function renderCurrent(pick) {
    currentBox.innerHTML = '';
    const act = activities.find(a => a.id === pick.activityId);
    const row = document.createElement('div');
    row.className = 'row';
    row.style.gap = '8px';
    row.innerHTML = `
      <div class="col" style="flex:1">
        <div><b>${act?.title ?? 'Activity'}</b> <span class="muted">· Round ${pick.round}</span></div>
        <small class="muted">Started: <span id="startedAt">${pick.startedAt?new Date(pick.startedAt).toLocaleTimeString(): '-'}</span> · Ended: <span id="endedAt">${pick.endedAt?new Date(pick.endedAt).toLocaleTimeString():'-'}</span> · Duration: <span id="dur">${fmtDuration(pick.durationMs)}</span></small>
      </div>
      <div class="row">
        <button class="secondary" id="startBtn">Start</button>
        <button class="secondary" id="endBtn">End</button>
        <input type="number" id="mins" min="0" placeholder="mins" style="width:90px" />
        <button class="secondary" id="editDurBtn">Set</button>
      </div>
    `;
    currentBox.appendChild(row);
    const startedAtSpan = row.querySelector('#startedAt');
    const endedAtSpan = row.querySelector('#endedAt');
    const durSpan = row.querySelector('#dur');

    row.querySelector('#startBtn').addEventListener('click', async () => {
      try {
        const updated = await logic.startPick(pick);
        const startedAt = updated?.startedAt || new Date().toISOString();
        await updatePick(pick.id, { startedAt });
        startedAtSpan.textContent = new Date(startedAt).toLocaleTimeString();
      } catch(e) { alert('Start failed: ' + e.message); }
    });
    row.querySelector('#endBtn').addEventListener('click', async () => {
      try {
        const updated = await logic.endPick(pick);
        const endedAt = updated?.endedAt || new Date().toISOString();
        const durationMs = updated?.durationMs ?? (pick.startedAt ? (new Date(endedAt)-new Date(pick.startedAt)) : undefined);
        await updatePick(pick.id, { endedAt, durationMs });
        endedAtSpan.textContent = new Date(endedAt).toLocaleTimeString();
        durSpan.textContent = fmtDuration(durationMs);
      } catch(e) { alert('End failed: ' + e.message); }
    });
    row.querySelector('#editDurBtn').addEventListener('click', async () => {
      const mins = Number(row.querySelector('#mins').value);
      if (!(mins >= 0)) return;
      try {
        const updated = await logic.editDuration(pick, mins * 60 * 1000);
        const durationMs = updated?.durationMs ?? (mins * 60 * 1000);
        await updatePick(pick.id, { durationMs });
        durSpan.textContent = fmtDuration(durationMs);
      } catch(e) { alert('Edit failed: ' + e.message); }
    });

    const refl = document.createElement('div');
    refl.className = 'row';
    refl.style.marginTop = '8px';
    refl.innerHTML = `
      <input id="note" type="text" placeholder="Add a reflection note" />
      <button class="secondary" id="addNoteBtn">Add</button>
    `;
    currentBox.appendChild(refl);
    refl.querySelector('#addNoteBtn').addEventListener('click', async () => {
      const text = refl.querySelector('#note').value.trim();
      if (!text) return;
      await addReflection({ meetId, pickId: pick.id, text });
      refl.querySelector('#note').value = '';
      alert('Reflection added');
    });
  }

  return root;
}

function msg(t){ const d=document.createElement('div'); d.className='card muted'; d.textContent=t; return d; }

