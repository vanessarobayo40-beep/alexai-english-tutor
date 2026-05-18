'use strict';

// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
const S = {
  name: '',
  topic: 'general',
  history: [],
  vocab: [],
  streak: 0,
  xp: 0,
  wordsLearned: 0,
  lastAIText: '',
  lastUserText: '',
  voiceOn: true,
  listening: false,
  lastActivity: null,
  pendingVocab: null,
  syncPending: false,
  targetLevel: 'A1',   // manually selected practice level
  ttsSpeed: 'slow',    // slow | normal | fast
};

// ════════════════════════════════════════
//  DOM
// ════════════════════════════════════════
const $ = id => document.getElementById(id);

const DOM = {
  onboarding:   $('onboarding'),
  app:          $('app'),
  nameInput:    $('user-name'),
  startBtn:     $('start-btn'),
  obStatus:     $('ob-status'),
  messages:     $('messages'),
  msgInput:     $('msg-input'),
  sendBtn:      $('send-btn'),
  micBtn:       $('mic-btn'),
  sidebar:      $('sidebar'),
  overlay:      $('overlay'),
  menuBtn:      $('menu-btn'),
  streakVal:    $('streak-val'),
  wordsVal:     $('words-val'),
  xpVal:        $('xp-val'),
  levelTag:     $('level-tag'),
  vocabCount:   $('vocab-count'),
  vocabList:    $('vocab-list'),
  leaderboard:  $('leaderboard'),
  btnTranslate: $('btn-translate'),
  btnAnalyze:   $('btn-analyze'),
  btnSpeakToggle: $('btn-speak-toggle'),
};

// ════════════════════════════════════════
//  LEVELS
// ════════════════════════════════════════
const LEVELS = [
  { label:'A1', min:0,    max:300  },
  { label:'A2', min:300,  max:800  },
  { label:'B1', min:800,  max:1600 },
  { label:'B2', min:1600, max:2800 },
  { label:'C1', min:2800, max:9999 },
];
const getLevel = xp => LEVELS.find(l => xp >= l.min && xp < l.max) || LEVELS[0];

// ════════════════════════════════════════
//  LOCAL STORAGE (cache fallback)
// ════════════════════════════════════════
function saveLocal() {
  localStorage.setItem('alexai', JSON.stringify({
    name: S.name, topic: S.topic, vocab: S.vocab,
    streak: S.streak, xp: S.xp, wordsLearned: S.wordsLearned,
    voiceOn: S.voiceOn, lastActivity: S.lastActivity,
    targetLevel: S.targetLevel, ttsSpeed: S.ttsSpeed,
  }));
}
function loadLocal() {
  try { Object.assign(S, JSON.parse(localStorage.getItem('alexai') || '{}')); } catch(_) {}
}

// ════════════════════════════════════════
//  SERVER SYNC
// ════════════════════════════════════════
let syncTimer = null;

async function syncToServer() {
  if (!S.name) return;
  try {
    await fetch('/api/user/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: S.name, xp: S.xp, streak: S.streak,
        wordsLearned: S.wordsLearned, vocab: S.vocab,
        lastActivity: S.lastActivity, voiceOn: S.voiceOn,
      }),
    });
    S.syncPending = false;
  } catch(_) { /* offline — localStorage still has it */ }
}

function scheduleSave() {
  saveLocal();
  S.syncPending = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncToServer, 1500); // debounce 1.5s
}

async function loginUser(name) {
  try {
    const res  = await fetch('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!json.success) return null;
    const u = json.user;
    S.name          = u.name;
    S.xp            = u.xp;
    S.streak        = u.streak;
    S.wordsLearned  = u.wordsLearned;
    S.vocab         = u.vocab;
    S.lastActivity  = u.lastActivity;
    S.voiceOn       = u.voiceOn;
    saveLocal();
    return json.isNew;
  } catch(_) {
    // Server unreachable — use localStorage cache
    return null;
  }
}

async function loadLeaderboard() {
  try {
    const res  = await fetch('/api/leaderboard');
    const json = await res.json();
    if (!json.success || !json.users.length) {
      DOM.leaderboard.innerHTML = '<div class="lb-empty">Solo tú por ahora 👑</div>';
      return;
    }
    const medals = ['🥇','🥈','🥉'];
    DOM.leaderboard.innerHTML = json.users.map((u, i) => `
      <div class="lb-row ${u.name === S.name ? 'lb-me' : ''}">
        <span class="lb-pos">${medals[i] || `${i+1}`}</span>
        <span class="lb-name">${escHtml(u.name)}</span>
        <div class="lb-stats">
          <span class="lb-xp">${u.xp} XP</span>
          ${u.streak > 0 ? `<span class="lb-streak">🔥${u.streak}</span>` : ''}
        </div>
      </div>
    `).join('');
  } catch(_) {
    DOM.leaderboard.innerHTML = '<div class="lb-empty">Sin conexión</div>';
  }
}

// ════════════════════════════════════════
//  STREAK
// ════════════════════════════════════════
function checkStreak() {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (S.lastActivity === today) return;
  S.streak      = (S.lastActivity === yesterday) ? S.streak + 1 : 1;
  S.lastActivity = today;
}

// ════════════════════════════════════════
//  XP
// ════════════════════════════════════════
function addXP(n) {
  S.xp += n;
  updateStatsUI();
  scheduleSave();
}

function updateStatsUI() {
  DOM.streakVal.textContent = S.streak;
  DOM.wordsVal.textContent  = S.wordsLearned;
  DOM.xpVal.textContent     = S.xp;
  DOM.levelTag.textContent  = S.targetLevel || getLevel(S.xp).label;
  DOM.vocabCount.textContent = S.vocab.length;
  // Update menu header
  const hdName = $('hdm-uname'); if (hdName) hdName.textContent = S.name || '—';
  const hdAvt  = $('hdm-avatar'); if (hdAvt) hdAvt.textContent = (S.name||'?').charAt(0).toUpperCase();
  const hdLvl  = $('hdm-lvl'); if (hdLvl) hdLvl.textContent = S.targetLevel || getLevel(S.xp).label;
  const hdXp   = $('hdm-xp2'); if (hdXp) hdXp.textContent = S.xp;
  const hdStr  = $('hdm-str'); if (hdStr) hdStr.textContent = S.streak;
  const hdWc   = $('hdm-wc'); if (hdWc) hdWc.textContent = S.vocab.length;
}

// ════════════════════════════════════════
//  SPEECH — TTS
// ════════════════════════════════════════
const synth = window.speechSynthesis;
let voices  = [];
synth?.addEventListener?.('voiceschanged', () => { voices = synth.getVoices(); });

const TTS_RATES = { slow: 0.78, normal: 0.95, fast: 1.15 };

function speak(text) {
  if (!S.voiceOn || !synth) return;
  synth.cancel();
  const vList = synth.getVoices();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang  = 'en-US';
  utt.rate  = TTS_RATES[S.ttsSpeed] ?? 0.78;
  utt.pitch = 1.1;
  const v = vList.find(v => /google us english/i.test(v.name))
         || vList.find(v => /google uk english female/i.test(v.name))
         || vList.find(v => /samantha|karen|moira|victoria|zira/i.test(v.name))
         || vList.find(v => v.lang === 'en-US')
         || vList.find(v => v.lang.startsWith('en'));
  if (v) utt.voice = v;
  synth.speak(utt);
}

// ════════════════════════════════════════
//  SPEECH — RECOGNITION
// ════════════════════════════════════════
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition      = null;
let voiceAccum       = '';
let voiceRetries     = 0;
const VOICE_MAX      = 12;
let voiceRestartTimer = null;

if (SR) {
  recognition = new SR();
  recognition.lang            = 'en-US';
  recognition.continuous      = false;
  recognition.interimResults  = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const seg = e.results[i][0].transcript;
      if (e.results[i].isFinal) voiceAccum += (voiceAccum ? ' ' : '') + seg.trim();
      else interim += seg;
    }
    DOM.msgInput.value = interim ? voiceAccum + (voiceAccum ? ' ' : '') + interim : voiceAccum;
    autoResize();
    DOM.sendBtn.disabled = !DOM.msgInput.value.trim();
  };

  recognition.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      toast('🎤 Permite el micrófono: toca el ícono 🔒 en la barra del navegador', 'error');
      stopListening();
    } else if (e.error === 'no-speech') {
      // silence — normal, will auto-restart
    } else {
      toast(`Micrófono: ${e.error}`, 'error');
      stopListening();
    }
  };

  recognition.onend = () => {
    if (!S.listening) return;
    if (voiceRetries >= VOICE_MAX) { toast('Pulsa enviar ✅', ''); stopListening(); return; }
    clearTimeout(voiceRestartTimer);
    voiceRestartTimer = setTimeout(() => {
      if (!S.listening) return;
      voiceRetries++;
      try { recognition.start(); } catch(_) { stopListening(); }
    }, 200);
  };
} else {
  DOM.micBtn.style.display = 'none';
}

function startListening() {
  if (!recognition || S.listening) return;
  voiceAccum = ''; voiceRetries = 0;
  clearTimeout(voiceRestartTimer);
  DOM.msgInput.value = '';
  DOM.msgInput.placeholder = '🎤 Escuchando — habla libremente...';
  S.listening = true;
  DOM.micBtn.classList.add('listening');
  DOM.sendBtn.disabled = true;
  try { recognition.start(); } catch(_) { S.listening = false; DOM.micBtn.classList.remove('listening'); }
}

function stopListening() {
  if (!recognition) return;
  S.listening = false;
  clearTimeout(voiceRestartTimer);
  DOM.micBtn.classList.remove('listening');
  DOM.msgInput.placeholder = 'Write in English... (Escribe en inglés)';
  try { recognition.abort(); } catch(_) {}
  if (DOM.msgInput.value.trim()) { DOM.sendBtn.disabled = false; toast('✅ Voz lista — pulsa enviar ↗', 'success'); }
}

// ════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════
let toastTimer;
function toast(msg, type = '') {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 4000);
}

// ════════════════════════════════════════
//  PANELS
// ════════════════════════════════════════
function closeAllPanels() {
  ['correction','vocab','analysis','translate'].forEach(p =>
    $(`panel-${p}`)?.classList.add('hidden'));
}

function showPanel(name, html) {
  closeAllPanels();
  $(`${name}-body`).innerHTML = html;
  const panel = $(`panel-${name}`);
  panel.classList.remove('hidden');
  scrollToBottom();
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

document.querySelectorAll('.panel-x').forEach(btn => {
  btn.addEventListener('click', () => $(`panel-${btn.dataset.panel}`)?.classList.add('hidden'));
});

// ════════════════════════════════════════
//  VOCAB SIDEBAR
// ════════════════════════════════════════
function renderVocabSidebar() {
  DOM.vocabCount.textContent = S.vocab.length;
  if (!S.vocab.length) {
    DOM.vocabList.innerHTML = `
      <div class="vocab-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p>Guarda palabras<br>para estudiarlas</p>
      </div>`;
    return;
  }
  DOM.vocabList.innerHTML = S.vocab.slice(-20).reverse().map(v => `
    <div class="vocab-item">
      <div class="vi-word">${escHtml(v.word)}</div>
      <div class="vi-es">${escHtml(v.spanish)}</div>
    </div>`).join('');
}

function saveWord(wordData) {
  if (S.vocab.find(w => w.word === wordData.word)) { toast('Ya guardaste esta palabra', ''); return; }
  S.vocab.push(wordData);
  S.wordsLearned++;
  addXP(5);
  renderVocabSidebar();
  loadLeaderboard();
  toast(`📚 "${wordData.word}" guardada!`, 'success');
}

// ════════════════════════════════════════
//  SCROLL / TIME
// ════════════════════════════════════════
function scrollToBottom() {
  setTimeout(() => { DOM.messages.scrollTop = DOM.messages.scrollHeight; }, 50);
}
function timeStr() {
  return new Date().toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' });
}

// ════════════════════════════════════════
//  CHAT BUBBLES
// ════════════════════════════════════════
function addUserBubble(text) {
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="msg-avatar">${S.name.charAt(0).toUpperCase()}</div>
    <div class="msg-bubble">
      <div class="bubble">${escHtml(text)}</div>
      <div class="msg-time">${timeStr()}</div>
    </div>`;
  DOM.messages.appendChild(div);
  scrollToBottom();
}

function addAlexBubble(data) {
  const emotion  = data.emotion || 'happy';
  const emoMap   = { happy:'😊', thinking:'🤔', encouraging:'💪', excited:'🎉', proud:'⭐' };
  const hasCorr  = data.correction?.has_error;
  const hasVocab = data.vocabulary?.word;

  const div = document.createElement('div');
  div.className = `msg alex e-${emotion}`;
  div.dataset.correctionData = hasCorr  ? JSON.stringify(data.correction) : '';
  div.dataset.vocabData      = hasVocab ? JSON.stringify(data.vocabulary)  : '';
  div.dataset.msgText        = data.message;

  div.innerHTML = `
    <div class="msg-avatar">${emoMap[emotion] || '😊'}</div>
    <div class="msg-bubble">
      <div class="bubble">${escHtml(data.message)}</div>
      <div class="bubble-actions">
        ${hasCorr  ? `<button class="ba-btn correction" data-type="correction">✏️ Corrección</button>` : ''}
        ${hasVocab ? `<button class="ba-btn vocab" data-type="vocab">📖 ${escHtml(data.vocabulary.word)}</button>` : ''}
        <button class="ba-btn speak" data-type="speak">🔊 Escuchar</button>
      </div>
      <div class="msg-time">${timeStr()}</div>
    </div>`;

  div.querySelectorAll('.ba-btn').forEach(btn =>
    btn.addEventListener('click', () => handleBubbleAction(btn.dataset.type, div)));

  DOM.messages.appendChild(div);
  scrollToBottom();
  if (S.voiceOn) speak(data.message);
  if (hasCorr) setTimeout(() => handleBubbleAction('correction', div), 600);
}

function handleBubbleAction(type, msgDiv) {
  if (type === 'speak') { speak(msgDiv.dataset.msgText); return; }

  if (type === 'correction') {
    const d = JSON.parse(msgDiv.dataset.correctionData || '{}');
    if (!d.has_error) { toast('Sin errores ✅', 'success'); return; }
    showPanel('correction', `
      <div class="corr-row">
        <div class="corr-line bad"><span class="cl-mark">❌</span><span class="cl-text">"${escHtml(d.original)}"</span></div>
        <div class="corr-line good"><span class="cl-mark">✅</span><span class="cl-text">"${escHtml(d.corrected)}"</span></div>
        <div class="corr-tip">💡 ${escHtml(d.tip)}</div>
      </div>`);
    return;
  }

  if (type === 'vocab') {
    const d = JSON.parse(msgDiv.dataset.vocabData || '{}');
    if (!d.word) return;
    S.pendingVocab = d;
    const isSaved = S.vocab.find(w => w.word === d.word);
    showPanel('vocab', `
      <div class="vc-card">
        <div class="vc-word">${escHtml(d.word)}</div>
        <div class="vc-tag">🇪🇸 ${escHtml(d.spanish)}</div>
        <div class="vc-def">${escHtml(d.definition)}</div>
        <div class="vc-ex">"${escHtml(d.example)}"</div>
        <button class="vc-save ${isSaved ? 'saved' : ''}" id="save-word-btn">
          ${isSaved ? '✅ Guardada' : '＋ Guardar en mi vocabulario'}
        </button>
      </div>`);
    $('save-word-btn')?.addEventListener('click', () => {
      saveWord(S.pendingVocab);
      const btn = $('save-word-btn');
      if (btn) { btn.textContent = '✅ Guardada'; btn.classList.add('saved'); }
    });
  }
}

function showTyping() {
  removeTyping();
  const div = document.createElement('div');
  div.className = 'msg alex typing-msg'; div.id = 'typing';
  div.innerHTML = `
    <div class="msg-avatar">⏳</div>
    <div class="msg-bubble">
      <div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
    </div>`;
  DOM.messages.appendChild(div);
  scrollToBottom();
}
function removeTyping() { $('typing')?.remove(); }

// ════════════════════════════════════════
//  SEND MESSAGE
// ════════════════════════════════════════
async function sendMessage(text) {
  if (!text.trim()) return;
  closeAllPanels();
  S.lastUserText = text;
  S.history.push({ role: 'user', content: text });
  if (S.history.length > 16) S.history = S.history.slice(-16);

  addUserBubble(text);
  DOM.msgInput.value = ''; autoResize();
  DOM.sendBtn.disabled = true;
  showTyping(); addXP(5);

  try {
    const res  = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: S.history, topic: S.topic }),
    });
    const json = await res.json();
    removeTyping();
    if (!json.success) throw new Error(json.error || 'Error del servidor');

    S.history.push({ role: 'assistant', content: json.data.message });
    S.lastAIText = json.data.message;
    addAlexBubble(json.data);
    if (json.data.correction?.has_error) addXP(8);

  } catch(err) {
    removeTyping();
    toast(`Error: ${err.message}`, 'error');
    addAlexBubble({ message:"Sorry, connection problem. Try again?",
      correction:{has_error:false,original:'',corrected:'',tip:''},
      vocabulary:{word:'',definition:'',spanish:'',example:''},
      emotion:'thinking' });
  }
}

// ════════════════════════════════════════
//  TRANSLATE / ANALYZE
// ════════════════════════════════════════
async function translateLast() {
  if (!S.lastAIText) { toast('No hay nada que traducir todavía', ''); return; }
  showPanel('translate', '<div class="tr-orig">Traduciendo...</div>');
  try {
    const res  = await fetch('/api/translate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text:S.lastAIText, direction:'to_spanish'}) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    showPanel('translate', `
      <div class="tr-orig">🇺🇸 "${escHtml(S.lastAIText)}"</div>
      <div class="tr-hr"></div>
      <div class="tr-result">🇪🇸 ${escHtml(json.translation)}</div>`);
  } catch(err) { showPanel('translate', `<div class="tr-orig">Error: ${err.message}</div>`); }
}

async function analyzeLast() {
  if (!S.lastUserText) { toast('Envía un mensaje primero', ''); return; }
  showPanel('analysis', '<div class="an-header"><div>Analizando...</div></div>');
  try {
    const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sentence:S.lastUserText}) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    const d     = json.data;
    const score = d.grammar_score ?? 100;
    const cls   = score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
    const corrsHtml = (d.corrections||[]).map(c => `
      <div class="an-item">
        <div class="an-bad">❌ "${escHtml(c.original)}"</div>
        <div class="an-good">✅ "${escHtml(c.corrected)}"</div>
        <div class="an-why">💡 ${escHtml(c.explanation)}</div>
      </div>`).join('') || '<p style="color:var(--green);padding:4px 0">¡Sin errores! 🎉</p>';
    showPanel('analysis', `
      <div class="an-header">
        <div class="an-score-ring ${cls}">${score}</div>
        <div class="an-label">
          <strong>"${escHtml(S.lastUserText)}"</strong><br>
          ${d.rewritten && d.rewritten !== S.lastUserText ? `<span style="color:var(--t3);font-size:.78rem">✏️ "${escHtml(d.rewritten)}"</span>` : ''}
        </div>
      </div>
      <div class="an-corrs">${corrsHtml}</div>
      ${d.positive ? `<div class="an-positive">🌟 ${escHtml(d.positive)}</div>` : ''}`);
    if (score > 80) addXP(10);
  } catch(err) { showPanel('analysis', `<div>Error: ${err.message}</div>`); }
}

// ════════════════════════════════════════
//  TOPIC
// ════════════════════════════════════════
async function changeTopic(topic) {
  S.topic = topic;
  S.history = [];
  closeAllPanels();
  document.querySelectorAll('.topic-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.topic === topic));
  DOM.messages.innerHTML = '';
  showTyping();
  try {
    const res  = await fetch('/api/start', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ topic }) });
    const json = await res.json();
    removeTyping();
    if (json.success) {
      S.history.push({ role:'assistant', content:json.data.message });
      S.lastAIText = json.data.message;
      addAlexBubble(json.data);
    }
  } catch(_) { removeTyping(); toast('Error al cambiar de tema', 'error'); }
}

// ════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════
function openSidebar()  { DOM.sidebar.classList.add('open');    DOM.overlay.classList.add('active'); }
function closeSidebar() { DOM.sidebar.classList.remove('open'); DOM.overlay.classList.remove('active'); }

function setMobileTab(tab) {
  document.querySelectorAll('.mnav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'topics' || tab === 'vocab') openSidebar(); else closeSidebar();
}

// ════════════════════════════════════════
//  TEXTAREA AUTO-RESIZE
// ════════════════════════════════════════
function autoResize() {
  const t = DOM.msgInput;
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
}

// ════════════════════════════════════════
//  UTIL
// ════════════════════════════════════════
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════
//  INIT APP
// ════════════════════════════════════════
async function initApp() {
  DOM.onboarding.classList.remove('active');
  DOM.app.classList.add('active');
  checkStreak();
  scheduleSave();
  renderVocabSidebar();
  updateStatsUI();
  if (DOM.btnSpeakToggle && !S.voiceOn) {
    DOM.btnSpeakToggle.classList.add('active');
  }
  await changeTopic('general');
  loadLeaderboard();
  // Refresh leaderboard every 30s
  setInterval(loadLeaderboard, 30000);
}

// ════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // ── Onboarding ──────────────────────────────────────────
  const checkName = async () => {
    const val = DOM.nameInput.value.trim();
    DOM.startBtn.disabled = val.length < 2;

    if (val.length >= 2) {
      // Peek: does this user exist on the server?
      try {
        const res  = await fetch('/api/leaderboard');
        const json = await res.json();
        const found = json.users?.find(u => u.name.toLowerCase() === val.toLowerCase());
        if (found) {
          DOM.obStatus.textContent = `👋 ¡Bienvenido de vuelta! ${found.xp} XP acumulados`;
          DOM.obStatus.className = 'ob-status ob-status-back';
        } else {
          DOM.obStatus.textContent = '✨ Perfil nuevo — empezarás desde cero';
          DOM.obStatus.className = 'ob-status ob-status-new';
        }
      } catch(_) { DOM.obStatus.className = 'ob-status hidden'; }
    } else {
      DOM.obStatus.className = 'ob-status hidden';
    }
  };

  let nameCheckTimer;
  DOM.nameInput.addEventListener('input', () => {
    clearTimeout(nameCheckTimer);
    nameCheckTimer = setTimeout(checkName, 500);
  });
  DOM.nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !DOM.startBtn.disabled) DOM.startBtn.click();
  });

  DOM.startBtn.addEventListener('click', async () => {
    const name = DOM.nameInput.value.trim();
    DOM.startBtn.disabled = true;
    DOM.startBtn.textContent = 'Cargando...';

    // Try server login first
    const isNew = await loginUser(name);
    if (isNew === null) {
      // Server unreachable — use local
      S.name = name;
      loadLocal();
      S.name = name; // ensure name is set even if local had different
    }
    initApp();
  });

  // ── Overlay / Sidebar close ─────────────────────────────
  DOM.overlay.addEventListener('click', closeSidebar);
  $('sidebar-close')?.addEventListener('click', closeSidebar);

  // ── Input ───────────────────────────────────────────────
  DOM.sendBtn.addEventListener('click', () => { const t = DOM.msgInput.value.trim(); if (t) sendMessage(t); });
  DOM.msgInput.addEventListener('input', () => { autoResize(); DOM.sendBtn.disabled = !DOM.msgInput.value.trim(); });
  DOM.msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const t = DOM.msgInput.value.trim(); if (t) sendMessage(t);
    }
  });

  // ── Mic ─────────────────────────────────────────────────
  DOM.micBtn.addEventListener('click', () => S.listening ? stopListening() : startListening());

  // ── Toolbar ─────────────────────────────────────────────
  DOM.btnTranslate.addEventListener('click', translateLast);
  DOM.btnAnalyze.addEventListener('click', analyzeLast);
  DOM.btnSpeakToggle.addEventListener('click', () => {
    S.voiceOn = !S.voiceOn;
    DOM.btnSpeakToggle.classList.toggle('active', !S.voiceOn);
    if (!S.voiceOn) synth?.cancel?.();
    toast(S.voiceOn ? '🔊 Voz activada' : '🔇 Voz desactivada', S.voiceOn ? 'success' : '');
    scheduleSave();
  });

  // ── Topics ──────────────────────────────────────────────
  document.querySelectorAll('.topic-btn').forEach(btn =>
    btn.addEventListener('click', () => { closeSidebar(); changeTopic(btn.dataset.topic); }));

  // ── Mobile nav ──────────────────────────────────────────
  document.querySelectorAll('.mnav-btn').forEach(btn =>
    btn.addEventListener('click', () => setMobileTab(btn.dataset.tab)));

  // ── Hamburger dropdown ──────────────────────────────────
  const hdMenu    = $('hd-menu');
  const hdTrigger = $('menu-btn');   // tres líneas del header
  const levelPill = $('level-tag');
  const levelDd   = $('level-dd');

  function closeHdMenu()  { hdMenu?.classList.add('hidden'); }
  function closeLevelDd() { levelDd?.classList.add('hidden'); }

  hdTrigger?.addEventListener('click', e => {
    e.stopPropagation();
    closeLevelDd();
    hdMenu?.classList.toggle('hidden');
    // Sync voice button label
    const vb = $('hdm-voice-btn');
    if (vb) vb.textContent = S.voiceOn ? '🔊 Voz: activada' : '🔇 Voz: desactivada';
    // Sync speed buttons
    document.querySelectorAll('.hdm-speed').forEach(b =>
      b.classList.toggle('active', b.dataset.hdm === S.ttsSpeed));
  });

  document.querySelectorAll('.hdm-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.hdm;

      if (action === 'topics') {
        closeHdMenu();
        openSidebar();
        // scroll to topics section inside sidebar
        setTimeout(() => $('topics-section')?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
        return;
      }
      if (action === 'vocab') {
        closeHdMenu();
        openSidebar();
        setTimeout(() => $('vocab-section')?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
        return;
      }
      if (action === 'family') {
        closeHdMenu();
        openSidebar();
        setTimeout(() => $('leaderboard-section')?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
        return;
      }
      if (action === 'voice') {
        S.voiceOn = !S.voiceOn;
        btn.textContent = S.voiceOn ? '🔊 Voz: activada' : '🔇 Voz: desactivada';
        if (!S.voiceOn) synth?.cancel?.();
        DOM.btnSpeakToggle.classList.toggle('active', !S.voiceOn);
        toast(S.voiceOn ? '🔊 Voz activada' : '🔇 Voz desactivada', S.voiceOn ? 'success' : '');
        scheduleSave();
        return;
      }
      // Speed buttons: slow | normal | fast
      if (action === 'slow' || action === 'normal' || action === 'fast') {
        S.ttsSpeed = action;
        document.querySelectorAll('.hdm-speed').forEach(b =>
          b.classList.toggle('active', b.dataset.hdm === action));
        const labels = { slow:'🐢 Velocidad: lenta', normal:'⚡ Velocidad: normal', fast:'🚀 Velocidad: rápida' };
        toast(labels[action], 'success');
        saveLocal();
        return;
      }
    });
  });

  // ── Level dropdown ──────────────────────────────────────
  levelPill?.addEventListener('click', e => {
    e.stopPropagation();
    closeHdMenu();
    levelDd?.classList.toggle('hidden');
    // Mark current level
    document.querySelectorAll('.ldd-opt').forEach(b =>
      b.classList.toggle('active', b.dataset.lvl === S.targetLevel));
  });

  document.querySelectorAll('.ldd-opt').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      S.targetLevel = btn.dataset.lvl;
      document.querySelectorAll('.ldd-opt').forEach(b =>
        b.classList.toggle('active', b.dataset.lvl === S.targetLevel));
      closeLevelDd();
      updateStatsUI();
      saveLocal();
      toast(`Nivel ajustado a ${S.targetLevel}`, 'success');
    });
  });

  // ── Close dropdowns on outside click ───────────────────
  document.addEventListener('click', () => { closeHdMenu(); closeLevelDd(); });

  // ── Back-button prevention ──────────────────────────────
  history.pushState(null, '', location.href);
  window.addEventListener('popstate', () => {
    history.pushState(null, '', location.href);
  });

  // ── Boot ────────────────────────────────────────────────
  loadLocal();
  if (S.name) {
    // Returning user — re-login to sync from server
    loginUser(S.name).then(() => initApp());
  }
  // else: show onboarding
});
