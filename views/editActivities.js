import { getMeet, listActivitiesByMeet, addActivity, updateActivity, deleteActivity } from '../db/repo.js';

export async function render({ params, navigate }) {
  const { meetId } = params;
  if (!meetId) return missing('Missing meetId');
  const meet = await getMeet(meetId);
  if (!meet) return missing('Meet not found');

  const root = document.createElement('div');
  root.className = 'col';

  const head = document.createElement('div');
  head.className = 'row toolbar';
  head.innerHTML = `
    <div class="col">
      <h2 class="section-title">Edit Activities</h2>
      <small class="muted">${meet.title} · ${meet.status}</small>
    </div>
    <div class="row">
      <button class="secondary" id="gotoLive">Begin Session</button>
    </div>
  `;
  root.appendChild(head);
  head.querySelector('#gotoLive').addEventListener('click', () => navigate(`#/live/${meetId}`));

  const listWrap = document.createElement('div');
  listWrap.className = 'card col';
  root.appendChild(listWrap);

  const addRow = document.createElement('div');
  addRow.className = 'row';
  addRow.innerHTML = `
    <input type="text" id="titleInput" placeholder="Add an activity..." />
    <input type="text" id="tagsInput" placeholder="tags (comma separated)"/>
    <button class="primary" id="addBtn">Add</button>
  `;
  listWrap.appendChild(addRow);

  const list = document.createElement('div');
  list.className = 'list';
  listWrap.appendChild(list);

  async function refresh() {
    const items = await listActivitiesByMeet(meetId);
    list.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'No activities yet.';
      list.appendChild(empty);
      return;
    }
    for (const a of items) {
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <div class="col" style="flex:1">
          <input type="text" value="${escapeHtml(a.title)}" data-id="${a.id}" class="title"/>
          <small class="muted">Tags: <input type="text" value="${(a.tags||[]).join(', ')}" data-id="${a.id}" class="tags"/></small>
        </div>
        <div class="row">
          <button class="secondary save" data-id="${a.id}">Save</button>
          <button class="danger del" data-id="${a.id}">Delete</button>
        </div>
      `;
      list.appendChild(row);
    }
    list.querySelectorAll('.save').forEach(btn => btn.addEventListener('click', async (e) => {
      const id = Number(e.currentTarget.dataset.id);
      const title = list.querySelector(`input.title[data-id="${id}"]`).value.trim();
      const tags = list.querySelector(`input.tags[data-id="${id}"]`).value.split(',').map(s=>s.trim()).filter(Boolean);
      await updateActivity(id, { title, tags });
    }));
    list.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', async (e) => {
      const id = Number(e.currentTarget.dataset.id);
      if (confirm('Delete this activity?')) {
        await deleteActivity(id);
        refresh();
      }
    }));
  }

  listWrap.querySelector('#addBtn').addEventListener('click', async () => {
    const title = addRow.querySelector('#titleInput').value.trim();
    const tags = addRow.querySelector('#tagsInput').value.split(',').map(s=>s.trim()).filter(Boolean);
    if (!title) return;
    await addActivity(meetId, { title, tags });
    addRow.querySelector('#titleInput').value='';
    addRow.querySelector('#tagsInput').value='';
    refresh();
  });

  refresh();
  return root;
}

function missing(msg){
  const d=document.createElement('div');
  d.className='card error';
  d.textContent=msg;return d;
}

function escapeHtml(s){
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

