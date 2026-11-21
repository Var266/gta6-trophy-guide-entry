// GTA VI trophy guide and tracker: a checklist of the 55 official trophies with
// cited guides, a platinum roadmap, kind and missable filters, a spoiler setting
// that hides unearned story trophies, and progress saved in localStorage with
// export and import. Runs fully offline; the only file it loads is data/trophies.json.
const KEY = 'gta6-trophy-checklist';
const SPOILER_KEY = 'gta6-trophy-spoiler';
const rows = document.getElementById('rows');
const gradeSelect = document.getElementById('grade');
const kindSelect = document.getElementById('kind');
const missableOnly = document.getElementById('missable-only');
const spoilerToggle = document.getElementById('spoiler');
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
spoilerToggle.checked = spoilerOn;
const doc = await loadTrophies();

async function loadTrophies() {
  return await (await fetch('data/trophies.json')).json();
}

function saveProgress() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function saveSpoilerSetting() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

// A story trophy still unearned is hidden while the spoiler setting is on:
// its name, description and guide stay masked until the player earns it.
function isSpoilerHidden(trophy) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

function trophyMatchesFilters(trophy) {
  if (gradeSelect.value !== 'all' && trophy.grade !== gradeSelect.value) return false;
  if (kindSelect.value !== 'all' && trophy.kind !== kindSelect.value) return false;
  if (missableOnly.checked && !trophy.missable) return false;
  return true;
}

function renderChecklist() {
  rows.replaceChildren();
  for (const t of doc.trophies) {
    if (!trophyMatchesFilters(t)) continue;
    const tr = document.createElement('tr');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveProgress();
      renderChecklist();
      renderRoadmap();
    });
    const hidden = isSpoilerHidden(t);
    const nameCell = hidden ? 'Hidden story trophy' : `${t.name}${t.missable ? '  [MISSABLE]' : ''}\n${hidden ? '' : t.description}`;
    const guideCell = hidden ? 'Earn this trophy to reveal its guide.' : t.guide;
    const cells = [box, nameCell, t.grade, guideCell];
    for (const c of cells) {
      const td = document.createElement('td');
      if (typeof c === 'string') td.textContent = c;
      else td.append(c);
      tr.append(td);
    }
    rows.append(tr);
  }
  document.getElementById('progress').textContent = `${earned.size} of ${doc.trophies.length} earned`;
}

// The roadmap to the platinum, built from the trophies' own stages: story first,
// then side content, then collectibles and counts, then 100% completion and the
// platinum itself. Each stage lists what it holds and how much is done.
function renderRoadmap() {
  const stages = [
    { stage: 1, title: 'Stage 1 — Story playthrough', text: 'Chapters 1–4, the named story missions (Gone Fishing, Breakfast Run, The Cartel Heist, Child’s Play, Headliners, VCIA Takedown, Operation Savage Glory) and the final mission. Mind the missables: the finale and the choice trophy.' },
    { stage: 2, title: 'Stage 2 — Side content', text: 'Character strands (Andy, Kenton, Billy, Randy, Tyrone), 8 Strangers & Freaks strands, partner activities, hunting, fishing, arcade and bowling. Try all 9 activity types.' },
    { stage: 3, title: 'Stage 3 — Collectibles and counts', text: '250 stunts, 42 Shooting Range golds, 14 drone races, 20 race wins, 18 meditation spots, 3 card sets, 100 WAiNK spots, 100 vehicles, 52 areas, 8 garages, 5 bank vaults, 50 challenges.' },
    { stage: 4, title: 'Stage 4 — Cleanup and platinum', text: '100% completion, then the platinum. Sweep whatever the checklist still shows as unearned.' },
  ];
  const list = document.getElementById('roadmap-stages');
  list.replaceChildren();
  for (const s of stages) {
    const inStage = doc.trophies.filter((t) => t.stage === s.stage);
    const done = inStage.filter((t) => earned.has(t.name)).length;
    const li = document.createElement('li');
    const head = document.createElement('strong');
    head.textContent = `${s.title} — ${done}/${inStage.length} earned`;
    const body = document.createElement('div');
    body.textContent = s.text;
    const missables = inStage.filter((t) => t.missable).map((t) => t.name);
    if (missables.length) {
      const flag = document.createElement('div');
      flag.className = 'missable-flag';
      flag.textContent = `Missable here: ${missables.join(', ')}`;
      li.append(head, body, flag);
    } else {
      li.append(head, body);
    }
    list.append(li);
  }
}

function exportProgress() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
}

async function importProgress(file) {
  if (!file) return;
  earned = new Set(JSON.parse(await file.text()));
  saveProgress();
  renderChecklist();
  renderRoadmap();
}

document.getElementById('export').addEventListener('click', exportProgress);
document.getElementById('import').addEventListener('change', (e) => importProgress(e.target.files[0]));
gradeSelect.addEventListener('change', renderChecklist);
kindSelect.addEventListener('change', renderChecklist);
missableOnly.addEventListener('change', renderChecklist);
spoilerToggle.addEventListener('change', () => {
  spoilerOn = spoilerToggle.checked;
  saveSpoilerSetting();
  renderChecklist();
});
renderChecklist();
renderRoadmap();
