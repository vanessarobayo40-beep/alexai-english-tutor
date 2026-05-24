'use strict';

// ════════════════════════════════════════
//  PWA — Service Worker + Install
// ════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

let _deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstall = e;
  // Show install option in hamburger menu
  const btn = document.getElementById('hdm-install-btn');
  if (btn) btn.classList.remove('hidden');
  // Show banner if user hasn't dismissed it
  if (!localStorage.getItem('alexai-install-dismissed')) {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  _deferredInstall = null;
  localStorage.setItem('alexai-install-dismissed', '1');
  document.getElementById('install-banner')?.classList.add('hidden');
  document.getElementById('hdm-install-btn')?.classList.add('hidden');
});

const _isIOS    = /iphone|ipad|ipod/i.test(navigator.userAgent);
const _isStandalone = window.matchMedia('(display-mode: standalone)').matches
                  || window.navigator.standalone === true;


// ════════════════════════════════════════
//  WAKE LOCK — pantalla no se duerme
// ════════════════════════════════════════
let _wakeLock = null;
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    _wakeLock = await navigator.wakeLock.request('screen');
    _wakeLock.addEventListener('release', () => { _wakeLock = null; });
  } catch(_) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (_wakeLock === null) requestWakeLock();
    // Re-save progress when returning to app (covers Render sleep gaps)
    saveLocal();
    if (S.name && S.syncPending) syncToServer();
  }
});

// ════════════════════════════════════════
//  THE OFFICE — TEMPORADA 1 COMPLETA
// ════════════════════════════════════════
const THE_OFFICE_S1 = [
  { ep:1, title:'Pilot', date:'24 Mar 2005',
    synopsis:'Michael intenta demostrar que Dunder Mifflin es el mejor lugar para trabajar cuando la empresa envía a alguien a evaluar si recortar personal.',
    youtubeId:'L_-9kqbijig', clipLabel:'Mejores momentos del Pilot',
    scenes:[
      { title:'Michael presenta la empresa', dialogue:[
        { t:4,  speaker:'Michael', emoji:'👔', text:"Okay, I'm going to show you something.", es:'Voy a mostrarte algo.' },
        { t:8,  speaker:'Michael', emoji:'👔', text:"This is Dunder Mifflin — the greatest paper company in the world.", es:'Esta es Dunder Mifflin — la mejor empresa de papel del mundo.' },
        { t:14, speaker:'Jim',     emoji:'😏', text:"It's pretty good.", es:'Es bastante buena.' },
        { t:17, speaker:'Pam',     emoji:'🎨', text:"I like it here.", es:'Me gusta aquí.' },
      ]},
      { title:'Ryan el nuevo temporal', dialogue:[
        { t:0,  speaker:'Ryan',    emoji:'🧑', text:"Hi, I'm Ryan Howard. I'm the new temp.", es:'Hola, soy Ryan Howard. Soy el nuevo temporal.' },
        { t:5,  speaker:'Michael', emoji:'👔', text:"Oh! The new temp! Great! I'm Michael Scott.", es:'¡El nuevo temporal! ¡Genial! Soy Michael Scott.' },
        { t:10, speaker:'Michael', emoji:'👔', text:"I am the regional manager.", es:'Soy el gerente regional.' },
        { t:14, speaker:'Ryan',    emoji:'🧑', text:"Nice to meet you.", es:'Mucho gusto.' },
      ]},
      { title:'Jim y Pam — primera conversación', dialogue:[
        { t:0,  speaker:'Jim', emoji:'😏', text:"How are you?", es:'¿Cómo estás?' },
        { t:3,  speaker:'Pam', emoji:'🎨', text:"Good. Busy.", es:'Bien. Ocupada.' },
        { t:5,  speaker:'Jim', emoji:'😏', text:"Is Roy coming to the party?", es:'¿Va a venir Roy a la fiesta?' },
        { t:9,  speaker:'Pam', emoji:'🎨', text:"Yeah, he said he might stop by.", es:'Sí, dijo que podría pasar.' },
        { t:13, speaker:'Jim', emoji:'😏', text:"Cool.", es:'Genial.' },
      ]},
      { title:'Dwight — Asistente del Gerente', dialogue:[
        { t:0,  speaker:'Dwight',  emoji:'🌱', text:"As assistant regional manager, I have certain responsibilities.", es:'Como asistente del gerente regional, tengo ciertas responsabilidades.' },
        { t:7,  speaker:'Michael', emoji:'👔', text:"Assistant TO the regional manager.", es:'Asistente DEL gerente regional.' },
        { t:11, speaker:'Dwight',  emoji:'🌱', text:"That is what I said.", es:'Eso fue lo que dije.' },
        { t:14, speaker:'Jim',     emoji:'😏', text:"(to camera) It's not.", es:'(a la cámara) No es lo mismo.' },
      ]},
    ]},

  { ep:2, title:'Diversity Day', date:'29 Mar 2005',
    synopsis:'El comportamiento ofensivo de Michael imitando a Chris Rock obliga a la empresa a organizar un seminario de diversidad.',
    youtubeId:'ePbipufCPYw', clipLabel:'Diversity Day — escena principal',
    scenes:[
      { title:"Michael introduce el Día de Diversidad", dialogue:[
        { t:0,  speaker:'Michael', emoji:'👔', text:"Today we're going to do a little exercise.", es:'Hoy vamos a hacer un pequeño ejercicio.' },
        { t:5,  speaker:'Michael', emoji:'👔', text:"I want everyone to take a card. Don't look at it.", es:'Quiero que todos tomen una tarjeta. No la miren.' },
        { t:10, speaker:'Michael', emoji:'👔', text:"Tape it to your forehead.", es:'Pégala en su frente.' },
        { t:14, speaker:'Jim',     emoji:'😏', text:"(to camera) This is going to be a disaster.", es:'(a la cámara) Esto va a ser un desastre.' },
      ]},
      { title:'"That\'s what she said"', dialogue:[
        { t:0,  speaker:'Michael', emoji:'👔', text:"That's what she said!", es:'¡Eso es lo que ella dijo!' },
        { t:4,  speaker:'Jim',     emoji:'😏', text:"That doesn't even make sense.", es:'Eso ni siquiera tiene sentido.' },
        { t:7,  speaker:'Michael', emoji:'👔', text:"It makes total sense. Think about it.", es:'Tiene todo el sentido. Piénsalo.' },
        { t:11, speaker:'Dwight',  emoji:'🌱', text:"Michael, that's inappropriate.", es:'Michael, eso es inapropiado.' },
        { t:14, speaker:'Michael', emoji:'👔', text:"I know. That's why it's funny.", es:'Lo sé. Por eso es gracioso.' },
      ]},
      { title:'La tarjeta en la frente', dialogue:[
        { t:0,  speaker:'Kelly',   emoji:'💅', text:"Can you not look at my card?", es:'¿Puedes no mirar mi tarjeta?' },
        { t:4,  speaker:'Kevin',   emoji:'🍕', text:"I'm not looking.", es:'No estoy mirando.' },
        { t:7,  speaker:'Kelly',   emoji:'💅', text:"You are so looking right now.", es:'Sí estás mirando ahora mismo.' },
        { t:10, speaker:'Michael', emoji:'👔', text:"Okay, okay! Let's stay focused, people.", es:'¡Okay, okay! Mantengámonos enfocados, gente.' },
      ]},
    ]},

  { ep:3, title:'Health Care', date:'5 Abr 2005',
    synopsis:'Dwight se convierte en jefe interino mientras Michael evita tomar decisiones difíciles sobre el plan de salud de los empleados.',
    youtubeId:'d8M0LIUastI', clipLabel:'Best Bits Season 1 Part 1',
    scenes:[
      { title:'Dwight como jefe interino', dialogue:[
        { t:2,  speaker:'Michael', emoji:'👔', text:"Dwight, I'm putting you in charge of picking a new health care plan.", es:'Dwight, te pongo a cargo de elegir un nuevo plan de salud.' },
        { t:8,  speaker:'Dwight',  emoji:'🌱', text:"I will not let you down.", es:'No te decepcionaré.' },
        { t:11, speaker:'Michael', emoji:'👔', text:"I know you won't. Because I trust you.", es:'Lo sé. Porque confío en ti.' },
        { t:15, speaker:'Dwight',  emoji:'🌱', text:"With my life?", es:'¿Con tu vida?' },
        { t:17, speaker:'Michael', emoji:'👔', text:"With my employees' lives. Same thing.", es:'Con la vida de mis empleados. Lo mismo.' },
      ]},
      { title:'Las quejas de salud', dialogue:[
        { t:0,  speaker:'Kevin',   emoji:'🍕', text:"I have a lot of things wrong with me.", es:'Tengo muchas cosas que están mal conmigo.' },
        { t:5,  speaker:'Dwight',  emoji:'🌱', text:"Like what? Be specific.", es:'¿Como qué? Sé específico.' },
        { t:8,  speaker:'Kevin',   emoji:'🍕', text:"Okay. My feet hurt.", es:'Okay. Me duelen los pies.' },
        { t:11, speaker:'Dwight',  emoji:'🌱', text:"That's not a disease. That's just being fat.", es:'Eso no es una enfermedad. Es solo estar gordo.' },
      ]},
      { title:'Jim inventa enfermedades', dialogue:[
        { t:0,  speaker:'Jim',     emoji:'😏', text:"I need to put Ebola on the form.", es:'Necesito poner Ébola en el formulario.' },
        { t:4,  speaker:'Dwight',  emoji:'🌱', text:"Ebola? Is that serious?", es:'¿Ébola? ¿Es eso serio?' },
        { t:7,  speaker:'Jim',     emoji:'😏', text:"Very. Also spontaneous dental hydroplosion.", es:'Mucho. También hidroexplosión dental espontánea.' },
        { t:12, speaker:'Dwight',  emoji:'🌱', text:"I've never heard of that.", es:'Nunca había oído hablar de eso.' },
        { t:15, speaker:'Jim',     emoji:'😏', text:"It's when your teeth... explode.", es:'Es cuando tus dientes... explotan.' },
      ]},
    ]},

  { ep:4, title:'The Alliance', date:'12 Abr 2005',
    synopsis:'Dwight le propone una alianza secreta a Jim para protegerse de posibles despidos, sin saber que Jim está jugando una broma.',
    youtubeId:'rQDu84d5GLc', clipLabel:'Season 1 Best Moments',
    scenes:[
      { title:'Dwight propone la alianza', dialogue:[
        { t:0,  speaker:'Dwight',  emoji:'🌱', text:"I need to talk to you. Privately.", es:'Necesito hablar contigo. En privado.' },
        { t:4,  speaker:'Jim',     emoji:'😏', text:"Okay... what's up?", es:'Okay... ¿qué pasa?' },
        { t:7,  speaker:'Dwight',  emoji:'🌱', text:"I need you to be in my alliance.", es:'Necesito que estés en mi alianza.' },
        { t:11, speaker:'Jim',     emoji:'😏', text:"You want me to be in an alliance with you?", es:'¿Quieres que esté en una alianza contigo?' },
        { t:15, speaker:'Dwight',  emoji:'🌱', text:"Yes. Against the others.", es:'Sí. Contra los demás.' },
        { t:18, speaker:'Jim',     emoji:'😏', text:"Okay. I'm in.", es:'Okay. Estoy dentro.' },
        { t:21, speaker:'Jim',     emoji:'😏', text:"(to camera) I am so not in.", es:'(a la cámara) No estoy para nada dentro.' },
      ]},
      { title:'El cumpleaños de Meredith', dialogue:[
        { t:0,  speaker:'Michael', emoji:'👔', text:"Today is Meredith's birthday!", es:'¡Hoy es el cumpleaños de Meredith!' },
        { t:4,  speaker:'Michael', emoji:'👔', text:"And we are going to celebrate!", es:'¡Y vamos a celebrar!' },
        { t:7,  speaker:'Kevin',   emoji:'🍕', text:"Is there going to be cake?", es:'¿Va a haber pastel?' },
        { t:10, speaker:'Michael', emoji:'👔', text:"There is going to be cake.", es:'Va a haber pastel.' },
        { t:13, speaker:'Kevin',   emoji:'🍕', text:"What kind?", es:'¿De qué tipo?' },
        { t:15, speaker:'Michael', emoji:'👔', text:"The... best kind.", es:'El... mejor tipo.' },
      ]},
      { title:'Jim convence a Dwight de disfrazarse', dialogue:[
        { t:0,  speaker:'Jim',     emoji:'😏', text:"For the alliance, you'll need a disguise.", es:'Para la alianza, vas a necesitar un disfraz.' },
        { t:5,  speaker:'Dwight',  emoji:'🌱', text:"Of course. What do you suggest?", es:'Por supuesto. ¿Qué sugieres?' },
        { t:8,  speaker:'Jim',     emoji:'😏', text:"A mustache. And different hair.", es:'Un bigote. Y cabello diferente.' },
        { t:12, speaker:'Dwight',  emoji:'🌱', text:"I can do that.", es:'Puedo hacer eso.' },
      ]},
    ]},

  { ep:5, title:'Basketball', date:'19 Abr 2005',
    synopsis:'Michael reta al equipo del almacén a un partido de basketball. Si la oficina gana, viernes libre; si pierde, trabajan el sábado.',
    youtubeId:'rQDu84d5GLc', clipLabel:'Season 1 Best Moments',
    scenes:[
      { title:'Michael hace el reto', dialogue:[
        { t:0,  speaker:'Michael', emoji:'👔', text:"We are going to play basketball against the warehouse guys.", es:'Vamos a jugar basketball contra los chicos del almacén.' },
        { t:6,  speaker:'Jim',     emoji:'😏', text:"Why?", es:'¿Por qué?' },
        { t:8,  speaker:'Michael', emoji:'👔', text:"Because they think they're better than us.", es:'Porque creen que son mejores que nosotros.' },
        { t:12, speaker:'Jim',     emoji:'😏', text:"They are better than us.", es:'Son mejores que nosotros.' },
        { t:15, speaker:'Michael', emoji:'👔', text:"No, they're not. Trust me.", es:'No, no lo son. Confía en mí.' },
      ]},
      { title:'Jim en la cancha', dialogue:[
        { t:0,  speaker:'Darryl',  emoji:'🏀', text:"You play?", es:'¿Juegas?' },
        { t:2,  speaker:'Jim',     emoji:'😏', text:"A little. In high school.", es:'Un poco. En la secundaria.' },
        { t:5,  speaker:'Darryl',  emoji:'🏀', text:"You're pretty good.", es:'Eres bastante bueno.' },
        { t:8,  speaker:'Jim',     emoji:'😏', text:"Thanks. I try.", es:'Gracias. Lo intento.' },
      ]},
      { title:'Michael no sabe jugar', dialogue:[
        { t:0,  speaker:'Michael', emoji:'👔', text:"I am going to school you guys so hard.", es:'Les voy a dar una paliza tan grande.' },
        { t:5,  speaker:'Dwight',  emoji:'🌱', text:"Michael, you should stretch first.", es:'Michael, deberías estirarte primero.' },
        { t:8,  speaker:'Michael', emoji:'👔', text:"I'm fine. I played in college.", es:'Estoy bien. Jugué en la universidad.' },
        { t:12, speaker:'Jim',     emoji:'😏', text:"(to camera) He did not play in college.", es:'(a la cámara) No jugó en la universidad.' },
      ]},
    ]},

  { ep:6, title:'Hot Girl', date:'26 Abr 2005',
    synopsis:'Una vendedora de carteras visita la oficina y todos los hombres compiten por su atención, incluyendo Michael y Jim.',
    youtubeId:'nxD1LAOabAw', clipLabel:'Best Talking Heads Season 1',
    scenes:[
      { title:'Katy llega a la oficina', dialogue:[
        { t:0,  speaker:'Katy',    emoji:'👜', text:"Hi! I'm Katy. I'm here to sell purses.", es:'¡Hola! Soy Katy. Estoy aquí para vender carteras.' },
        { t:5,  speaker:'Michael', emoji:'👔', text:"Oh! I love purses! Come in, come in!", es:'¡Me encantan las carteras! ¡Pasa, pasa!' },
        { t:9,  speaker:'Michael', emoji:'👔', text:"Let me show you around.", es:'Déjame mostrarte el lugar.' },
        { t:12, speaker:'Jim',     emoji:'😏', text:"(to camera) Michael has never bought a purse in his life.", es:'(a la cámara) Michael nunca ha comprado una cartera en su vida.' },
      ]},
      { title:'Jim habla con Katy', dialogue:[
        { t:0,  speaker:'Jim',     emoji:'😏', text:"Hey. So how's the selling going?", es:'Oye. ¿Cómo va la venta?' },
        { t:4,  speaker:'Katy',    emoji:'👜', text:"Pretty good! Everyone's been really nice.", es:'¡Bastante bien! Todos han sido muy amables.' },
        { t:8,  speaker:'Jim',     emoji:'😏', text:"That's... surprising.", es:'Eso es... sorprendente.' },
        { t:11, speaker:'Katy',    emoji:'👜', text:"Are you looking for anything?", es:'¿Estás buscando algo?' },
        { t:14, speaker:'Jim',     emoji:'😏', text:"Maybe.", es:'Quizás.' },
      ]},
      { title:'Pam nota que Jim está coqueteando', dialogue:[
        { t:0,  speaker:'Pam',     emoji:'🎨', text:"Jim, do you need help with something?", es:'Jim, ¿necesitas ayuda con algo?' },
        { t:4,  speaker:'Jim',     emoji:'😏', text:"Nope. Just looking.", es:'No. Solo mirando.' },
        { t:7,  speaker:'Pam',     emoji:'🎨', text:"The purses?", es:'¿Las carteras?' },
        { t:10, speaker:'Jim',     emoji:'😏', text:"Sure. The purses.", es:'Sí. Las carteras.' },
        { t:13, speaker:'Pam',     emoji:'🎨', text:"(to camera) Right.", es:'(a la cámara) Claro.' },
      ]},
    ]},
];

// Frases icónicas para práctica rápida
const OFFICE_SCENES = [
  { id:1,
    title:'Bears. Beets. Battlestar Galactica.',
    char:'Jim imita a Dwight', ep:'T3·E1', emoji:'😏',
    youtubeId:'WaaANll8h18',
    lvl:'A2', tag:'humor',
    quote:'Bears. Beets. Battlestar Galactica.',
    es:'Osos. Remolachas. Battlestar Galactica.',
    tip:'"Beet" = remolacha. Jim se disfraza de Dwight para molestarlo.',
    dialogue:[
      { t:5,  speaker:'Jim',    emoji:'😏', text:'Bears. Beets. Battlestar Galactica.',            es:'Osos. Remolachas. Battlestar Galactica.' },
      { t:12, speaker:'Dwight', emoji:'🌱', text:'Identity theft is not a joke, Jim!',              es:'¡El robo de identidad no es un chiste, Jim!' },
      { t:16, speaker:'Dwight', emoji:'🌱', text:'Millions of families suffer every year!',         es:'¡Millones de familias sufren cada año!' },
      { t:22, speaker:'Jim',    emoji:'😏', text:'Michael!',                                        es:'¡Michael!' },
      { t:24, speaker:'Dwight', emoji:'🌱', text:'Michael!',                                        es:'¡Michael!' },
    ]},
  { id:2,
    title:'Question: What Kind of Bear is Best?',
    char:'Jim vs Dwight', ep:'T3·E1', emoji:'😏',
    youtubeId:'l38D5TTCQIA',
    lvl:'A2', tag:'humor',
    quote:"Question: what kind of bear is best?",
    es:'Pregunta: ¿cuál es el mejor tipo de oso?',
    tip:'"False." como respuesta directa a algo obvio — muy americano.',
    dialogue:[
      { t:2,  speaker:'Jim',    emoji:'😏', text:'Question: what kind of bear is best?',            es:'Pregunta: ¿cuál es el mejor tipo de oso?' },
      { t:6,  speaker:'Dwight', emoji:'🌱', text:"That's a ridiculous question.",                   es:'Esa es una pregunta ridícula.' },
      { t:9,  speaker:'Jim',    emoji:'😏', text:'False. Black bear.',                               es:'Falso. Oso negro.' },
      { t:13, speaker:'Dwight', emoji:'🌱', text:"Well, that's debatable. There are basically two schools of thought.", es:'Bueno, eso es debatible. Básicamente hay dos escuelas de pensamiento.' },
    ]},
  { id:3,
    title:"Would I Rather Be Feared or Loved?",
    char:'Michael Scott', ep:'T2·E6', emoji:'👔',
    youtubeId:'IBJJrZ5LAVQ',
    lvl:'B1', tag:'reflexión',
    quote:"Would I rather be feared or loved? Easy. Both.",
    es:'¿Preferiría ser temido o amado? Fácil. Ambos.',
    tip:'"Rather" = preferir entre opciones. Estructura muy útil en inglés.',
    dialogue:[
      { t:4,  speaker:'Michael', emoji:'👔', text:'Would I rather be feared or loved?',             es:'¿Preferiría ser temido o amado?' },
      { t:9,  speaker:'Michael', emoji:'👔', text:'Easy. Both.',                                     es:'Fácil. Ambos.' },
      { t:12, speaker:'Michael', emoji:'👔', text:'I want people to be afraid of how much they love me.', es:'Quiero que la gente tenga miedo de cuánto me ama.' },
    ]},
  { id:4,
    title:"Kevin's Simple Words",
    char:'Kevin Malone', ep:'T7·E4', emoji:'🍕',
    youtubeId:'WN-K0mhy3Ao',
    lvl:'A1', tag:'vocabulario',
    quote:'Why waste time say lot word when few word do trick?',
    es:'¿Para qué desperdiciar palabras cuando pocas palabras sirven?',
    tip:'Kevin habla con frases muy cortas. Perfecto para nivel A1.',
    dialogue:[
      { t:3,  speaker:'Kevin', emoji:'🍕', text:'Why waste time say lot word when few word do trick?', es:'¿Para qué desperdiciar palabras cuando pocas palabras sirven?' },
      { t:10, speaker:'Kevin', emoji:'🍕', text:'Me want food.',                                     es:'Yo querer comida.' },
      { t:14, speaker:'Kevin', emoji:'🍕', text:'See? Easy.',                                        es:'¿Ves? Fácil.' },
    ]},
  { id:5,
    title:"That's What She Said",
    char:'Michael Scott', ep:'T2·E2', emoji:'👔',
    youtubeId:'jaXoWVZN2lc',
    lvl:'A1', tag:'humor',
    quote:"That's what she said.",
    es:'Eso es lo que ella dijo.',
    tip:'El chiste más icónico de Michael. Frase de doble sentido americano.',
    dialogue:[
      { t:0,  speaker:'Michael', emoji:'👔', text:"That's what she said.",                          es:'Eso es lo que ella dijo.' },
    ]},
  { id:6,
    title:"The Best Boss in the World",
    char:'Michael Scott', ep:'T1·E1', emoji:'👔',
    youtubeId:'IBJJrZ5LAVQ',
    lvl:'A2', tag:'humor',
    quote:"I am the best boss in the world.",
    es:'Soy el mejor jefe del mundo.',
    tip:'"The best" = el mejor. Superlativo. Michael siempre exagera.',
    dialogue:[
      { t:0,  speaker:'Michael', emoji:'👔', text:'I am the best boss in the world.',               es:'Soy el mejor jefe del mundo.' },
      { t:5,  speaker:'Michael', emoji:'👔', text:"I'm like a dad. A fun dad.",                     es:'Soy como un papá. Un papá divertido.' },
      { t:10, speaker:'Michael', emoji:'👔', text:'Not like a real dad. I mean, I love my employees.', es:'No como un papá real. Quiero decir, amo a mis empleados.' },
    ]},
];

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
  targetLevel: 'A1',
  ttsSpeed: 'slow',
  visitedTopics: [],   // tracks which topics have been practiced
  joinedDate: null,    // ISO date string, set on first login
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
    visitedTopics: S.visitedTopics, joinedDate: S.joinedDate,
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
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 9000);
    await fetch('/api/user/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: S.name, xp: S.xp, streak: S.streak,
        wordsLearned: S.wordsLearned, vocab: S.vocab,
        lastActivity: S.lastActivity, voiceOn: S.voiceOn,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    S.syncPending = false;
  } catch(_) { /* offline — localStorage siempre tiene los datos */ }
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
  DOM.streakVal.textContent  = S.streak;
  DOM.wordsVal.textContent   = S.wordsLearned;
  DOM.xpVal.textContent      = S.xp;
  DOM.levelTag.textContent   = S.targetLevel || getLevel(S.xp).label;
  DOM.vocabCount.textContent = S.vocab.length;

  // Hamburger menu header
  const hdName = $('hdm-uname'); if (hdName) hdName.textContent = S.name || '—';
  const hdAvt  = $('hdm-avatar'); if (hdAvt) hdAvt.textContent = (S.name||'?').charAt(0).toUpperCase();
  const hdLvl  = $('hdm-lvl'); if (hdLvl) hdLvl.textContent = S.targetLevel || getLevel(S.xp).label;
  const hdXp   = $('hdm-xp2'); if (hdXp) hdXp.textContent = S.xp;
  const hdStr  = $('hdm-str'); if (hdStr) hdStr.textContent = S.streak;
  const hdWc   = $('hdm-wc'); if (hdWc) hdWc.textContent = S.vocab.length;

  // Plan progress card
  const visited  = (S.visitedTopics || []).length;
  const pct      = Math.max(4, Math.min(100, Math.round((visited / 8) * 80 + (S.xp / 3000) * 20)));
  const lvlLabel = S.targetLevel || getLevel(S.xp).label;
  // Week estimate: 1 week per ~150 XP, capped at 24
  const week = Math.min(24, Math.max(1, Math.ceil(S.xp / 150) || 1));

  const planBar    = $('plan-bar-fill');   if (planBar)    planBar.style.width = pct + '%';
  const planWeek   = $('plan-week-txt');   if (planWeek)   planWeek.textContent = `Semana ${week}`;
  const planLvl    = $('plan-lvl-txt');    if (planLvl)    planLvl.textContent  = lvlLabel;
  const planTopics = $('plan-topics-txt'); if (planTopics) planTopics.textContent = visited;
}

// ════════════════════════════════════════
//  SPEECH — TTS
// ════════════════════════════════════════
const synth = window.speechSynthesis;
const TTS_RATES = { slow: 0.78, normal: 0.95, fast: 1.15 };

// Cache voices as soon as they load (critical for Android)
let _cachedVoices = [];
function _refreshVoices() { _cachedVoices = synth?.getVoices() || []; }
if (synth) {
  synth.addEventListener('voiceschanged', _refreshVoices);
  _refreshVoices(); // works immediately on desktop
}

function _pickVoice(list) {
  // Prefer high-quality cloud/Google voices; avoid robotic local TTS
  return list.find(v => /google us english/i.test(v.name))
      || list.find(v => /google uk english/i.test(v.name))
      || list.find(v => /google/i.test(v.name) && /^en/i.test(v.lang))
      || list.find(v => /samantha|karen|moira|victoria|zira/i.test(v.name))
      || list.find(v => !v.localService && v.lang === 'en-US')
      || list.find(v => !v.localService && /^en/i.test(v.lang))
      || list.find(v => v.lang === 'en-US')
      || list.find(v => /^en/i.test(v.lang));
}

function _doSpeak(text, vList) {
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = 'en-US';
  utt.rate   = TTS_RATES[S.ttsSpeed] ?? 0.78;
  utt.pitch  = 1.1;
  const v = _pickVoice(vList);
  if (v) utt.voice = v;
  synth.speak(utt);
}

function speak(text) {
  if (!S.voiceOn || !synth) return;
  synth.cancel();
  const vList = synth.getVoices();
  if (vList.length) {
    _doSpeak(text, vList);
  } else if (_cachedVoices.length) {
    _doSpeak(text, _cachedVoices);
  } else {
    // Android: voices not ready yet — wait for the event
    const onReady = () => {
      synth.removeEventListener('voiceschanged', onReady);
      _doSpeak(text, synth.getVoices());
    };
    synth.addEventListener('voiceschanged', onReady);
  }
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

  const ctrl   = new AbortController();
  const wakeId = setTimeout(() => toast('⏳ Despertando servidor… ~20 seg', ''), 5000);
  const timeId = setTimeout(() => ctrl.abort(), 35000);
  try {
    const res  = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: S.history, topic: S.topic }),
      signal: ctrl.signal,
    });
    clearTimeout(wakeId); clearTimeout(timeId);
    const json = await res.json();
    removeTyping();
    if (!json.success) throw new Error(json.error || 'Error del servidor');

    S.history.push({ role: 'assistant', content: json.data.message });
    S.lastAIText = json.data.message;
    addAlexBubble(json.data);
    if (json.data.correction?.has_error) addXP(8);

  } catch(err) {
    clearTimeout(wakeId); clearTimeout(timeId);
    removeTyping();
    const msg = err.name === 'AbortError'
      ? 'El servidor tardó demasiado. Intenta de nuevo.'
      : `Sin conexión. Intenta de nuevo.`;
    toast(msg, 'error');
    addAlexBubble({ message: msg,
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
  // Track visited topics for plan progress
  if (!S.visitedTopics) S.visitedTopics = [];
  if (!S.visitedTopics.includes(topic)) {
    S.visitedTopics.push(topic);
    saveLocal();
  }
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
function openSidebar() {
  DOM.sidebar.classList.add('open');
  // No overlay: desktop sidebar is part of flex layout (overlay would cover it),
  // mobile sidebar is full-width (nothing behind it needs dimming)
}
function closeSidebar() {
  DOM.sidebar.classList.remove('open');
  DOM.overlay.classList.remove('active');
  showSidebarSections('all');
}

function showSidebarSections(mode) {
  const plan      = document.querySelector('.plan-card');
  const topics    = $('topics-section');
  const vocab     = $('vocab-section');
  const lb        = $('leaderboard-section');
  const series    = $('series-section');
  const show = el => el && (el.style.display = '');
  const hide = el => el && (el.style.display = 'none');
  if (mode === 'topics') {
    show(plan); show(topics); hide(vocab); hide(lb); hide(series);
  } else if (mode === 'vocab') {
    hide(plan); hide(topics); show(vocab); hide(lb); hide(series);
  } else if (mode === 'series') {
    hide(plan); hide(topics); hide(vocab); hide(lb); show(series);
    renderSeriesSection();
  } else {
    show(plan); show(topics); show(vocab); show(lb); hide(series);
  }
}

function setMobileTab(tab) {
  document.querySelectorAll('.mnav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'topics') {
    showSidebarSections('topics');
    openSidebar();
  } else if (tab === 'vocab') {
    showSidebarSections('vocab');
    openSidebar();
  } else if (tab === 'series') {
    showSidebarSections('series');
    openSidebar();
  } else {
    closeSidebar();
  }
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
//  SHARE + INSTALL
// ════════════════════════════════════════
async function shareApp() {
  const url   = location.origin + '/';
  const text  = `¡Aprende inglés conmigo en ThiagoEnglish! 🎓\nTutor de inglés con IA — método Harvard, gratis.\n${url}`;
  const title = 'ThiagoEnglish — Tutor de inglés';

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      toast('¡Gracias por compartir! 💜', 'success');
    } catch (_) { /* user cancelled */ }
  } else {
    // Desktop: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      toast('🔗 Enlace copiado al portapapeles', 'success');
    } catch (_) {
      prompt('Copia este enlace para compartir:', url);
    }
  }
}

function triggerInstall() {
  if (_deferredInstall) {
    _deferredInstall.prompt();
    _deferredInstall.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        toast('🎉 ¡ThiagoEnglish instalado!', 'success');
      }
      _deferredInstall = null;
    });
  } else if (_isIOS && !_isStandalone) {
    document.getElementById('ios-tip')?.classList.remove('hidden');
  } else {
    toast('Abre la app desde Chrome o Safari para instalarla', '');
  }
}

// ════════════════════════════════════════
//  UTIL
// ════════════════════════════════════════
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════
//  SERIES — render sidebar
// ════════════════════════════════════════
function renderSeriesSection() {
  // Episode list
  const epList = $('episode-list');
  if (epList) {
    epList.innerHTML = THE_OFFICE_S1.map(ep => `
      <div class="ep-card" data-ep="${ep.ep}">
        <div class="epc-num">E${String(ep.ep).padStart(2,'0')}</div>
        <div class="epc-body">
          <div class="epc-title">${escHtml(ep.title)}</div>
          <div class="epc-date">${escHtml(ep.date)}</div>
          <div class="epc-synopsis">${escHtml(ep.synopsis)}</div>
        </div>
        <button class="epc-play" data-ep="${ep.ep}">▶</button>
      </div>`).join('');
    epList.querySelectorAll('.epc-play, .ep-card').forEach(el => {
      el.addEventListener('click', e => {
        const ep = THE_OFFICE_S1.find(x => x.ep === Number(el.dataset.ep || el.closest('.ep-card').dataset.ep));
        if (ep && !e.target.classList.contains('epc-play') && e.target !== el) return;
        if (ep) openEpisodePlayer(ep, 0);
      });
    });
  }
  // Quick scenes
  renderOfficeScenes();
}

function renderOfficeScenes() {
  const container = $('office-scenes-list');
  if (!container) return;
  const lvlColors = { A1:'#DCFCE7|#15803D', A2:'#FEF3C7|#B45309', B1:'#EDE9FE|#6D28D9', B2:'#DBEAFE|#1D4ED8' };
  container.innerHTML = OFFICE_SCENES.map(sc => {
    const [bg, fg] = (lvlColors[sc.lvl] || '#F3F4F6|#374151').split('|');
    return `
    <div class="office-card">
      <div class="oc-head">
        <span class="oc-char">${sc.emoji} ${escHtml(sc.char)}</span>
        <span class="oc-badge" style="background:${bg};color:${fg}">${sc.lvl}</span>
      </div>
      <div class="oc-ep">${escHtml(sc.ep)}</div>
      <div class="oc-quote">"${escHtml(sc.quote)}"</div>
      <div class="oc-es">${escHtml(sc.es)}</div>
      <div class="oc-tip">💡 ${escHtml(sc.tip)}</div>
      <button class="oc-watch" data-id="${sc.id}">▶ Ver escena y practicar</button>
    </div>`;
  }).join('');
  container.querySelectorAll('.oc-watch').forEach(btn => {
    btn.addEventListener('click', () => {
      const scene = OFFICE_SCENES.find(s => s.id === Number(btn.dataset.id));
      if (scene) openScenePlayer(scene);
    });
  });
}

// ════════════════════════════════════════
//  SCENE PLAYER — YouTube + subtítulos
// ════════════════════════════════════════
let _ytPlayer        = null;
let _ytReady         = false;
let _ytSyncTimer     = null;
let _currentScene    = null;
let _currentEp       = null;
let _currentSceneIdx = 0;
let _pendingYTId     = null;
let _lastSubIdx      = -1;
let _wordCache       = {};
let _tooltipTimer    = null;

// Called by YouTube IFrame API when ready
window.onYouTubeIframeAPIReady = function() {
  _ytReady = true;
  if (_pendingYTId) { _createYTPlayer(_pendingYTId); _pendingYTId = null; }
};

function _createYTPlayer(videoId) {
  if (_ytPlayer) {
    _ytPlayer.loadVideoById(videoId);
    _startSync(); // restart sync for the new video
    return;
  }
  _ytPlayer = new YT.Player('yt-iframe', {
    videoId,
    width: '100%', height: '100%',
    playerVars: { autoplay:1, playsinline:1, modestbranding:1, rel:0 },
    events: {
      onReady: () => _startSync(),           // start as soon as player is ready
      onStateChange: e => {
        if (e.data === YT.PlayerState.PLAYING) _startSync();
        // Don't stop sync on pause — keeps subtitle position visible
      }
    }
  });
}

function _startSync() {
  if (_ytSyncTimer) return; // already running
  _ytSyncTimer = setInterval(_syncSubs, 400);
}
function _stopSync() {
  clearInterval(_ytSyncTimer); _ytSyncTimer = null;
}

function _syncSubs() {
  if (!_ytPlayer?.getCurrentTime || !_currentScene?.dialogue) return;
  try {
    const t = _ytPlayer.getCurrentTime();
    if (typeof t !== 'number') return;
    let activeIdx = 0;
    _currentScene.dialogue.forEach((l, i) => { if (t >= l.t) activeIdx = i; });
    if (_lastSubIdx !== activeIdx) {
      _lastSubIdx = activeIdx;
      _renderSubtitles(activeIdx);
    }
  } catch(_) {}
}

// Build the 3-line karaoke view: prev (dim) / current (bright) / next (dim)
// + prev/next arrows for manual control when autoplay is blocked
function _renderSubtitles(idx) {
  const subs = $('sp-subs');
  if (!subs || !_currentScene?.dialogue) return;
  const dlg = _currentScene.dialogue;
  const n   = dlg.length;
  _lastSubIdx = idx;

  subs.innerHTML = `
    ${dlg[idx - 1] ? _subLineHTML(dlg[idx - 1], 'is-prev') : '<div class="sp-sub-line is-prev"></div>'}
    ${dlg[idx]     ? _subLineHTML(dlg[idx],     'is-cur', true) : ''}
    ${dlg[idx + 1] ? _subLineHTML(dlg[idx + 1], 'is-next') : '<div class="sp-sub-line is-next"></div>'}
    <div class="sp-sub-nav">
      <button class="sp-nav-line" id="sp-line-prev" ${idx === 0 ? 'disabled' : ''}>‹</button>
      <span class="sp-line-pos">${idx + 1} / ${n}</span>
      <button class="sp-nav-line" id="sp-line-next" ${idx >= n - 1 ? 'disabled' : ''}>›</button>
    </div>
    <div class="sp-sub-hint">Toca una palabra · toca ‹ › para avanzar</div>`;

  // Click words → translate
  subs.querySelectorAll('.is-cur .sw').forEach(span =>
    span.addEventListener('click', e => { e.stopPropagation(); _showWordTooltip(span.dataset.w, span); })
  );
  // Manual line navigation
  $('sp-line-prev')?.addEventListener('click', () => {
    if (idx > 0) { _lastSubIdx = -1; _renderSubtitles(idx - 1); _seekToLine(idx - 1); }
  });
  $('sp-line-next')?.addEventListener('click', () => {
    if (idx < n - 1) { _lastSubIdx = -1; _renderSubtitles(idx + 1); _seekToLine(idx + 1); }
  });
}

function _seekToLine(idx) {
  const t = _currentScene?.dialogue?.[idx]?.t;
  if (typeof t === 'number' && _ytPlayer?.seekTo) _ytPlayer.seekTo(t, true);
}

function _subLineHTML(line, cls, clickable = false) {
  const parts  = line.text.match(/[\w']+|[^\w']+/g) || [];
  const enHTML = parts.map(p =>
    clickable && /\w/.test(p)
      ? `<span class="sw" data-w="${escHtml(p)}">${escHtml(p)}</span>`
      : escHtml(p)
  ).join('');
  return `<div class="sp-sub-line ${cls}">
    <div class="sp-sub-speaker">${line.emoji} ${escHtml(line.speaker)}</div>
    <div class="sp-sub-en">${enHTML}</div>
    <div class="sp-sub-es">${escHtml(line.es)}</div>
  </div>`;
}

// Tooltip: show Spanish translation of a tapped word
async function _showWordTooltip(word, el) {
  const clean = word.replace(/[^a-zA-Z']/g, '').toLowerCase();
  if (!clean || clean.length < 2) return;
  const tip = $('word-tooltip');
  if (!tip) return;

  const r = el.getBoundingClientRect();
  const tipLeft = Math.max(8, Math.min(r.left + r.width / 2 - 75, window.innerWidth - 170));
  const tipTop  = r.top > 80 ? r.top - 54 : r.bottom + 8;
  tip.style.left = tipLeft + 'px';
  tip.style.top  = tipTop  + 'px';
  $('wt-word').textContent  = clean;
  $('wt-trans').textContent = '...';
  tip.classList.remove('hidden');
  clearTimeout(_tooltipTimer);
  _tooltipTimer = setTimeout(() => tip.classList.add('hidden'), 5000);

  if (_wordCache[clean]) { $('wt-trans').textContent = _wordCache[clean]; return; }
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch('/api/translate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, direction: 'to_spanish' }),
      signal: ctrl.signal,
    });
    const d = await res.json();
    if (d.success) { _wordCache[clean] = d.translation; $('wt-trans').textContent = d.translation; }
  } catch(_) { $('wt-trans').textContent = '?'; }
}

// Open a full episode (with scene selector)
function openEpisodePlayer(ep, sceneIdx) {
  _currentEp       = ep;
  _currentScene    = null;
  _currentSceneIdx = sceneIdx || 0;
  closeSidebar();
  $('sp-scene-title').textContent = `E${String(ep.ep).padStart(2,'0')} · ${ep.title}`;
  $('sp-scene-ep').textContent    = ep.date;
  _renderSceneTabs(ep);
  _loadEpisodeScene(ep, _currentSceneIdx);
  $('scene-player').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Episode navigation arrows
  const prevEp = THE_OFFICE_S1.find(x => x.ep === ep.ep - 1);
  const nextEp = THE_OFFICE_S1.find(x => x.ep === ep.ep + 1);
  const prevBtn = $('sp-prev-ep'); const nextBtn = $('sp-next-ep');
  if (prevBtn) { prevBtn.style.opacity = prevEp ? '1' : '.25'; prevBtn.disabled = !prevEp; }
  if (nextBtn) { nextBtn.style.opacity = nextEp ? '1' : '.25'; nextBtn.disabled = !nextEp; }
  _startSync(); // start polling even before video loads
  if (_ytReady) _createYTPlayer(ep.youtubeId);
  else _pendingYTId = ep.youtubeId;
}

function _renderSceneTabs(ep) {
  const bar = $('sp-scenes-bar');
  if (!bar) return;
  bar.innerHTML = ep.scenes.map((sc, i) => `
    <button class="sp-scene-tab${i === _currentSceneIdx ? ' active' : ''}" data-idx="${i}">
      ${i+1}. ${escHtml(sc.title)}
    </button>`).join('');
  bar.querySelectorAll('.sp-scene-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _currentSceneIdx = Number(btn.dataset.idx);
      bar.querySelectorAll('.sp-scene-tab').forEach((b,i) => b.classList.toggle('active', i === _currentSceneIdx));
      _loadEpisodeScene(_currentEp, _currentSceneIdx);
    });
  });
}

function _loadEpisodeScene(ep, idx) {
  const scene = ep.scenes[idx];
  if (!scene) return;
  _lastSubIdx   = -1;
  _currentScene = { ...scene, youtubeId: ep.youtubeId };
  _renderSubtitles(0);
}

// Open a single quick-practice scene
function openScenePlayer(scene) {
  _currentScene = scene;
  _currentEp    = null;
  _lastSubIdx   = -1;
  closeSidebar();
  $('sp-scene-title').textContent = scene.title;
  $('sp-scene-ep').textContent    = scene.ep || '';
  const bar = $('sp-scenes-bar'); if (bar) bar.innerHTML = '';
  const prevBtn = $('sp-prev-ep'); const nextBtn = $('sp-next-ep');
  if (prevBtn) { prevBtn.style.opacity = '.25'; prevBtn.disabled = true; }
  if (nextBtn) { nextBtn.style.opacity = '.25'; nextBtn.disabled = true; }
  _renderSubtitles(0);
  $('scene-player').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  _startSync(); // start polling even before video loads
  if (_ytReady) _createYTPlayer(scene.youtubeId);
  else _pendingYTId = scene.youtubeId;
}

function closeScenePlayer() {
  _stopSync();
  _ytPlayer?.pauseVideo?.();
  clearTimeout(_tooltipTimer);
  $('word-tooltip')?.classList.add('hidden');
  $('scene-player').classList.add('hidden');
  document.body.style.overflow = '';
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
  renderSeriesSection();
  updateStatsUI();
  if (DOM.btnSpeakToggle && !S.voiceOn) {
    DOM.btnSpeakToggle.classList.add('active');
  }
  // Wake Lock: prevent screen from sleeping during lessons
  requestWakeLock();
  // Keep-alive: ping server every 4 min to avoid sleep on free hosting
  setInterval(() => { if (S.name) fetch('/api/leaderboard').catch(() => {}); }, 240000);
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
    btn.addEventListener('click', () => {
      // Close sidebar and switch to Chat tab so user sees the conversation
      document.querySelectorAll('.mnav-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === 'chat'));
      closeSidebar();
      changeTopic(btn.dataset.topic);
    }));

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
        showSidebarSections('topics');
        openSidebar();
        return;
      }
      if (action === 'series') {
        closeHdMenu();
        showSidebarSections('series');
        openSidebar();
        return;
      }
      if (action === 'vocab') {
        closeHdMenu();
        showSidebarSections('vocab');
        openSidebar();
        return;
      }
      if (action === 'family') {
        closeHdMenu();
        showSidebarSections('all');
        openSidebar();
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
      if (action === 'share') {
        closeHdMenu();
        shareApp();
        return;
      }
      if (action === 'install') {
        closeHdMenu();
        triggerInstall();
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

  // ── Scene player close + episode nav ────────────────────
  $('sp-close')?.addEventListener('click', closeScenePlayer);
  $('sp-prev-ep')?.addEventListener('click', () => {
    if (_currentEp) {
      const prev = THE_OFFICE_S1.find(x => x.ep === _currentEp.ep - 1);
      if (prev) openEpisodePlayer(prev, 0);
    }
  });
  $('sp-next-ep')?.addEventListener('click', () => {
    if (_currentEp) {
      const next = THE_OFFICE_S1.find(x => x.ep === _currentEp.ep + 1);
      if (next) openEpisodePlayer(next, 0);
    }
  });

  // ── Install banner buttons ─────────────────────────────
  $('install-yes')?.addEventListener('click', () => {
    $('install-banner')?.classList.add('hidden');
    triggerInstall();
  });
  $('install-no')?.addEventListener('click', () => {
    $('install-banner')?.classList.add('hidden');
    localStorage.setItem('alexai-install-dismissed', '1');
  });
  $('ios-tip-close')?.addEventListener('click', () => {
    $('ios-tip')?.classList.add('hidden');
  });

  // ── iOS install tip (Safari ignora beforeinstallprompt) ─
  if (_isIOS && !_isStandalone && !localStorage.getItem('alexai-ios-tip-shown')) {
    setTimeout(() => {
      $('ios-tip')?.classList.remove('hidden');
      localStorage.setItem('alexai-ios-tip-shown', '1');
    }, 8000);
  }

  // ── Boot ────────────────────────────────────────────────
  loadLocal();
  if (S.name) {
    // Returning user — re-login to sync from server
    loginUser(S.name).then(() => initApp());
  }
  // else: show onboarding
});
