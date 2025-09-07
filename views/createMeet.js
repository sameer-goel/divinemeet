import { createMeet } from '../db/repo.js';
import * as logic from '../logic/logic.js';

export async function render({ navigate }) {
  const root = document.createElement('div');
  root.className = 'col';

  const card = document.createElement('div');
  card.className = 'card col';
  card.innerHTML = `
    <h2 class="section-title">Create Meet</h2>
    <label class="col">
      <span class="muted">Title</span>
      <input id="title" type="text" placeholder="Weekly Book Club" />
    </label>
    <div class="row" style="justify-content:space-between">
      <button id="createBtn" class="primary">Create</button>
      <span id="status" class="muted"></span>
    </div>
  `;
  root.appendChild(card);

  const titleEl = card.querySelector('#title');
  const statusEl = card.querySelector('#status');
  const btn = card.querySelector('#createBtn');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    statusEl.textContent = 'Generating seed...';
    try {
      const seed = await logic.makeSeed();
      statusEl.textContent = 'Saving draft...';
      const meet = await createMeet({ title: titleEl.value.trim(), seed, logicState: { seed } });
      statusEl.textContent = 'Done';
      navigate(`#/activities/${meet.meetId}`);
    } catch (e) {
      statusEl.textContent = '';
      alert('AI logic not available yet: ' + e.message);
    } finally {
      btn.disabled = false;
    }
  });

  return root;
}

