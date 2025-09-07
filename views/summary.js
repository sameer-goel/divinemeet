import { getMeet, listActivitiesByMeet, listPicksByMeet, listReflectionsByMeet, getLatestSummary, saveSummary } from '../db/repo.js';
import * as logic from '../logic/logic.js';

function formatSummaryTable(summary) {
  return `DIVINE DECODED SUMMARY

Divine Code: ${summary.code}
Generated: ${new Date(summary.generatedAt).toLocaleString()}

METRICS
-------
Total Activities: ${summary.metrics.totalActivities}
Total Time: ${summary.metrics.totalTimeMin} minutes
Top Tags: ${summary.metrics.topTags.join(', ') || 'None'}

ACTIVITY FREQUENCY
------------------
${Object.entries(summary.metrics.activityFrequency).map(([id, count]) => `${id}: ${count}x`).join('\n') || 'No activities'}

PATTERNS DETECTED
-----------------
${summary.patterns.map(p => `• ${p.pattern}: ${JSON.stringify(p.evidence)}`).join('\n') || 'No patterns found'}

COSMIC NARRATIVE
----------------
${summary.narrative}`;
}

export async function render({ params, navigate }) {
  const { meetId } = params;
  if (!meetId) return msg('Missing meetId');
  const [meet, activities, picks, reflections, latest] = await Promise.all([
    getMeet(meetId),
    listActivitiesByMeet(meetId),
    listPicksByMeet(meetId),
    listReflectionsByMeet(meetId),
    getLatestSummary(meetId),
  ]);
  if (!meet) return msg('Meet not found');

  const root = document.createElement('div');
  root.className = 'col';
  const head = document.createElement('div');
  head.className = 'row toolbar';
  head.innerHTML = `
    <div class="col">
      <h2 class="section-title">Summary</h2>
      <small class="muted">${meet.title}</small>
    </div>
    <div class="row">
      <button class="secondary" id="gotoLive">Back to Live</button>
    </div>
  `;
  head.querySelector('#gotoLive').addEventListener('click', () => navigate(`#/live/${meetId}`));
  root.appendChild(head);

  const card = document.createElement('div');
  card.className = 'card col';
  card.innerHTML = `
    <div class="row" style="justify-content:space-between;align-items:center">
      <div></div>
      <div class="row">
        <button class="primary" id="gen">Generate</button>
      </div>
    </div>
    <textarea id="content" rows="12" placeholder="Summary will appear here..."></textarea>
    <div class="row" style="justify-content:space-between">
      <small class="muted">${latest ? 'Last generated: ' + new Date(latest.generatedAt).toLocaleString() : 'No saved summary yet'}</small>
      <button class="secondary" id="save">Save</button>
    </div>
  `;
  root.appendChild(card);

  const content = card.querySelector('#content');
  if (latest?.content) content.value = latest.content;

  card.querySelector('#gen').addEventListener('click', async () => {
    try {
      const meetObj = { meet, activities, picks, reflections };
      const summary = await logic.makeSummary(meetObj);
      content.value = formatSummaryTable(summary);
    } catch (e) {
      alert('Make summary failed: ' + e.message);
    }
  });
  card.querySelector('#save').addEventListener('click', async () => {
    const saved = await saveSummary({ meetId, content: content.value, meta: { version: 1 } });
    alert('Saved');
  });

  return root;
}

function msg(t){ const d=document.createElement('div'); d.className='card muted'; d.textContent=t; return d; }

