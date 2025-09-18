// === Local Storage Keys ===
const STORAGE_KEY = 'wellness.entries.v1';
const PIN_KEY = 'wellness.pin.v1';
const REM_KEY = 'wellness.reminders.v1';

// === State ===
const state = { entries: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') };

// === Elements ===
const emojiButtons = document.querySelectorAll('.emoji-btn');
const intensity = document.getElementById('intensity');
const intensityLabel = document.getElementById('intensityLabel');
const editor = document.getElementById('editor');
const tagInput = document.getElementById('tagInput');
const tagsEl = document.getElementById('tags');
const entryCount = document.getElementById('entryCount');
const saveEntry = document.getElementById('saveEntry');
const entryChart = document.getElementById('moodChart');
const quoteCard = document.getElementById('quoteCard');
const prevQuote = document.getElementById('prevQuote');
const nextQuote = document.getElementById('nextQuote');
const exportPdf = document.getElementById('exportPdf');
const exportModal = document.getElementById('exportModal');
const exportPreview = document.getElementById('exportPreview');
const doPrint = document.getElementById('doPrint');
const privacyToggle = document.getElementById('privacyToggle');
const pinModal = document.getElementById('pinModal');
const pinSave = document.getElementById('pinSave');
const pinClose = document.getElementById('pinClose');
const pinInput = document.getElementById('pinInput');
const recordAudioBtn = document.getElementById('recordAudio');
const reminderTime = document.getElementById('reminderTime');
const setReminder = document.getElementById('setReminder');
const reminderList = document.getElementById('reminderList');

// === Init ===
entryCount.innerText = state.entries.length;
intensityLabel.innerText = intensity.value;
intensity.addEventListener('input', () => intensityLabel.innerText = intensity.value);

// === Emoji Selection ===
let selectedEmoji = '😊';
emojiButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    emojiButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedEmoji = btn.dataset.emoji;
  });
});
document.querySelector('.emoji-btn[data-emoji="😊"]').classList.add('active');

// === Toolbar ===
document.querySelectorAll('.toolbar button[data-cmd]').forEach(btn => {
  btn.addEventListener('click', () => document.execCommand(btn.dataset.cmd));
});
document.getElementById('insertTag').addEventListener('click', () => {
  document.execCommand('insertText', false, ' #');
  tagInput.focus();
});

// === Tags ===
let tags = [];
function renderTags() {
  tagsEl.innerHTML = '';
  tags.forEach(t => {
    const el = document.createElement('div');
    el.className = 'tag';
    el.innerText = t;
    tagsEl.appendChild(el);
  });
}
tagInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && tagInput.value.trim()) {
    tags.push(tagInput.value.trim());
    tagInput.value = '';
    renderTags();
  }
});

// === Autosave Draft ===
setInterval(() => {
  const draft = { emoji: selectedEmoji, intensity: intensity.value, html: editor.innerHTML, tags };
  localStorage.setItem('wellness.draft.v1', JSON.stringify(draft));
}, 3000);

// === Load Draft ===
const draft = JSON.parse(localStorage.getItem('wellness.draft.v1') || 'null');
if (draft) {
  selectedEmoji = draft.emoji || selectedEmoji;
  intensity.value = draft.intensity || intensity.value;
  intensityLabel.innerText = intensity.value;
  editor.innerHTML = draft.html || '';
  tags = draft.tags || [];
  renderTags();
  emojiButtons.forEach(b => b.classList.toggle('active', b.dataset.emoji === selectedEmoji));
}

// === Tone Mismatch Feature ===
const sentimentKeywords = {
  '😊': ['happy','great','good','fun','excited','love','proud','joy','optimistic'],
  '😔': ['sad','tired','overwhelmed','bad','disappointed','down','anxious','gloomy'],
  '😓': ['stressed','worried','anxious','nervous','exhausted','overwhelmed'],
  '😃': ['happy','fun','excited','awesome','great','joy','laugh'],
  '😌': ['calm','relaxed','peaceful','meditation','chill','content']
};
function checkToneMismatch(emoji, text) {
  const words = text.toLowerCase().split(/\W+/);
  const keywords = sentimentKeywords[emoji] || [];
  const matchFound = words.some(word => keywords.includes(word));
  if (!matchFound && text.trim() !== '') {
    alert(`⚠️ The tone of your text may not match the selected emoji "${emoji}". Consider reviewing your entry.`);
  }
}

// === Save Entry ===
saveEntry.addEventListener('click', () => {
  const text = editor.innerText || editor.innerHTML;
  checkToneMismatch(selectedEmoji, text);

  const entry = {
    id: Date.now(),
    ts: new Date().toISOString(),
    emoji: selectedEmoji,
    intensity: Number(intensity.value),
    text,
    tags: [...tags]
  };
  state.entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
  entryCount.innerText = state.entries.length;
  drawChart();
  alert('Entry saved locally');
});

// === Clear Draft ===
document.getElementById('clearDraft').addEventListener('click', () => {
  editor.innerHTML = ''; tags = []; renderTags();
  localStorage.removeItem('wellness.draft.v1');
  alert('Draft cleared');
});

// === Mood Chart ===
function drawChart() {
  const ctx = entryChart.getContext('2d');
  const w = entryChart.width, h = entryChart.height;
  ctx.clearRect(0, 0, w, h);
  const values = state.entries.slice(-14).map(e => e.intensity);
  if (!values.length) { ctx.fillStyle='#cbd5e1'; ctx.fillText('No data yet',20,80); return; }
  const max=10, pad=20;
  ctx.beginPath(); ctx.moveTo(pad, h-pad-(values[0]/max)*(h-pad*2));
  for(let i=1;i<values.length;i++){
    const x=pad+(i*(w-pad*2)/(values.length-1));
    const y=h-pad-(values[i]/max)*(h-pad*2);
    ctx.lineTo(x,y);
  }
  ctx.strokeStyle='#6c5ce7'; ctx.lineWidth=2; ctx.stroke();
  values.forEach((v,i)=>{
    const x=pad+(i*(w-pad*2)/(values.length-1));
    const y=h-pad-(v/max)*(h-pad*2);
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle='#6c5ce7'; ctx.fill();
  });
}
drawChart();

// === Quotes Carousel ===
const quotes = [
  'Be kind to yourself — small steps count.',
  'This too shall pass. Breathe.',
  'You are not alone in how you feel.',
  'Progress, not perfection.',
  'Self-care is giving the world the best of you, not what\'s left of you.'
];
let qi=0;
function showQuote(){ quoteCard.innerText = '"'+quotes[qi]+'"'; }
prevQuote.addEventListener('click', ()=>{ qi=(qi-1+quotes.length)%quotes.length; showQuote(); });
nextQuote.addEventListener('click', ()=>{ qi=(qi+1)%quotes.length; showQuote(); });
showQuote();

// === Reminders ===
let reminders = JSON.parse(localStorage.getItem(REM_KEY)||'[]');
function renderReminders(){ reminderList.innerHTML=reminders.map(r=>'• '+r).join('<br>'); }
setReminder.addEventListener('click',()=>{
  if(!reminderTime.value) return alert('Pick a time');
  reminders.push(reminderTime.value);
  localStorage.setItem(REM_KEY, JSON.stringify(reminders));
  renderReminders();
  alert('Reminder set (page must be open)');
});
renderReminders();

// === Export PDF ===
exportPdf.addEventListener('click', ()=>{
  exportPreview.innerHTML = state.entries.slice(-7).map(e=>{
    return `<div style="padding:8px;border-bottom:1px solid #eee;margin-bottom:6px">
      <strong>${e.emoji} — ${new Date(e.ts).toLocaleString()}</strong>
      <div>${e.text}</div>
      <div class="small">Tags: ${e.tags.join(', ')}</div>
    </div>`;
  }).join('') || '<div class="small">No recent entries to export</div>';
  exportModal.classList.remove('hidden');
});
doPrint.addEventListener('click',()=>window.print());
document.getElementById('closeExport').addEventListener('click',()=>exportModal.classList.add('hidden'));

// === Privacy / PIN ===
function updatePrivacyLabel(){
  const pin = localStorage.getItem(PIN_KEY);
  privacyToggle.innerText = 'Privacy: '+(pin?'Locked (PIN set)':'Private');
}
privacyToggle.addEventListener('click', ()=>pinModal.classList.remove('hidden'));
pinClose.addEventListener('click', ()=>pinModal.classList.add('hidden'));
pinSave.addEventListener('click', ()=>{
  const pin = pinInput.value.trim();
  if(pin.length<4){ return alert('Choose a PIN with at least 4 digits.'); }
  localStorage.setItem(PIN_KEY,pin);
  pinModal.classList.add('hidden');
  updatePrivacyLabel();
  alert('PIN set successfully. Your journal is now locked.');
});
function checkPin(){
  const pin = localStorage.getItem(PIN_KEY);
  if(!pin) return true;
  const entered = prompt('Enter your PIN to access the journal:');
  return entered===pin;
}
updatePrivacyLabel();
window.addEventListener('load',()=>{
  if(!checkPin()){
    alert('Incorrect PIN. Journal locked.');
    document.body.innerHTML='<h2 style="text-align:center;margin-top:40px">🔒 Journal Locked</h2>';
  }
});

// === Mock Audio Recording ===
recordAudioBtn.addEventListener('click', ()=>{ alert('Audio recording feature coming soon!'); });
