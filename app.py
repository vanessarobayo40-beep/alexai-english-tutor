from flask import Flask, render_template, request, jsonify, send_from_directory, Response
from openai import OpenAI
import os, json, re, sqlite3
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv()

app = Flask(__name__)

# ── AI Client (Groq) ──────────────────────────────────────────────────
client = OpenAI(
    api_key=os.getenv("GROK_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

# ── Database ──────────────────────────────────────────────────────────
# On Railway set DB_PATH=/data/users.db  |  locally defaults to users.db
DB_PATH = os.environ.get("DB_PATH", "users.db")

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT    UNIQUE NOT NULL COLLATE NOCASE,
                xp           INTEGER DEFAULT 0,
                streak       INTEGER DEFAULT 0,
                words_learned INTEGER DEFAULT 0,
                vocab        TEXT    DEFAULT '[]',
                last_activity TEXT   DEFAULT '',
                voice_on     INTEGER DEFAULT 1,
                created_at   TEXT    DEFAULT (datetime('now'))
            )
        """)
        conn.commit()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

init_db()

# ── AI Prompts ────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Thiago, a fun, energetic English tutor for Spanish-speaking beginners (A1-A2 level).
Your personality: enthusiastic, funny, like a cool friend who happens to teach English perfectly.
You use Harvard methods: Krashen's i+1 Input, Active Production, Spaced Repetition, Low Affective Filter.

PERSONALITY RULES (non-negotiable):
- Sound like a real person, NOT a textbook. Use contractions: "you're", "let's", "that's", "I'll"
- React with GENUINE emotion to what they say — surprised, happy, curious, excited
- Use expressive language: "Oh wow!", "Nice!", "Ooh, good try!", "Yes! Exactly!", "Hmm, interesting!"
- Celebrate every attempt, not just perfect answers
- Make it feel like a real conversation between friends, not a lesson

TEACHING RULES:
1. i+1 Input: slightly above their level, never below, never way above
2. Active Production: ALWAYS end with a question that makes them write/say English
3. Low Affective Filter: make them feel SAFE to make mistakes
4. Contextual Vocab: teach words inside sentences, never as lists
5. Corrections: explain grammar rules briefly in Spanish, gently

CRITICAL: Respond ONLY with valid JSON. No markdown. No extra text.

{
  "message": "Your response — conversational, expressive, 2-3 sentences. End with a question.",
  "correction": {
    "has_error": false,
    "original": "",
    "corrected": "",
    "tip": ""
  },
  "vocabulary": {
    "word": "one key word from your message",
    "definition": "simple English definition",
    "spanish": "traducción al español",
    "example": "one short example sentence"
  },
  "emotion": "happy"
}

Emotion options: happy, thinking, encouraging, excited, proud.
If no grammar error: has_error=false, leave original/corrected/tip as "".
Always include vocabulary for ONE interesting word from YOUR message."""

TOPIC_STARTERS = {
    "general":    {"message": "Hello! I'm Thiago, your English tutor! I'm really happy to meet you! What's your name, and where are you from?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "tutor", "definition": "a teacher who works with one student", "spanish": "tutor / profesor particular", "example": "My English tutor is very helpful."}, "emotion": "excited"},
    "shopping":   {"message": "Let's practice shopping English! Very useful for real life. Imagine we are at a supermarket right now. What do you usually buy?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "supermarket", "definition": "a large store that sells food and household items", "spanish": "supermercado", "example": "I go to the supermarket every Saturday."}, "emotion": "happy"},
    "restaurant": {"message": "Welcome! Let's practice at a restaurant. I'll be your waiter today! Are you ready to order? What kind of food do you like?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "order", "definition": "to ask for food or drinks in a restaurant", "spanish": "ordenar / pedir", "example": "I'd like to order a salad, please."}, "emotion": "happy"},
    "travel":     {"message": "Let's travel with English! We're at the airport right now. You have a trip today! Where would you like to go?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "flight", "definition": "a trip on an airplane", "spanish": "vuelo", "example": "My flight leaves at 9am."}, "emotion": "excited"},
    "work":       {"message": "Let's practice work English — very useful for your career! Tell me, what do you do for work? Or what job do you want to have?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "career", "definition": "your professional work life and job history", "spanish": "carrera profesional", "example": "She has a great career in technology."}, "emotion": "thinking"},
    "social":     {"message": "Let's practice social English — making friends! Imagine we just met at a party. How do you usually say hello to new people?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "introduce", "definition": "to tell someone your name when you meet them", "spanish": "presentar / presentarse", "example": "Let me introduce myself — my name is Thiago!"}, "emotion": "happy"},
    "health":     {"message": "Let's practice health English — very important to know! You are at the doctor's office today. How do you feel? What is the problem?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "symptom", "definition": "a sign or feeling that shows you might be sick", "spanish": "síntoma", "example": "My main symptom is a headache."}, "emotion": "thinking"},
    "home":       {"message": "Let's talk about home life! Daily routines are perfect for beginners. What time do you usually wake up in the morning?", "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""}, "vocabulary": {"word": "routine", "definition": "things you do regularly, usually in the same order", "spanish": "rutina", "example": "My morning routine starts at 7am."}, "emotion": "happy"}
}

def clean_json(text):
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r'\{.*\}', text, re.DOTALL)
        if m:
            return json.loads(m.group())
        return None

# ── Pages ─────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

# Service worker must be served from root scope to control the whole app
@app.route('/sw.js')
def service_worker():
    resp = send_from_directory(app.static_folder, 'sw.js')
    resp.headers['Service-Worker-Allowed'] = '/'
    resp.headers['Cache-Control'] = 'no-cache'
    return resp

@app.route('/manifest.json')
def manifest_alias():
    return send_from_directory(app.static_folder, 'manifest.json')

# ── User endpoints ────────────────────────────────────────────────────
@app.route('/api/user/login', methods=['POST'])
def user_login():
    name = (request.json.get('name') or '').strip()
    if not name or len(name) < 2:
        return jsonify({'success': False, 'error': 'Nombre inválido'}), 400

    with get_db() as db:
        row = db.execute('SELECT * FROM users WHERE name = ?', (name,)).fetchone()
        if row:
            is_new = False
        else:
            db.execute('INSERT INTO users (name) VALUES (?)', (name,))
            db.commit()
            row = db.execute('SELECT * FROM users WHERE name = ?', (name,)).fetchone()
            is_new = True

        return jsonify({
            'success': True,
            'isNew': is_new,
            'user': {
                'name':          row['name'],
                'xp':            row['xp'],
                'streak':        row['streak'],
                'wordsLearned':  row['words_learned'],
                'vocab':         json.loads(row['vocab'] or '[]'),
                'lastActivity':  row['last_activity'] or '',
                'voiceOn':       bool(row['voice_on']),
            }
        })

@app.route('/api/user/save', methods=['POST'])
def user_save():
    d = request.json or {}
    name = (d.get('name') or '').strip()
    if not name:
        return jsonify({'success': False}), 400

    with get_db() as db:
        db.execute("""
            UPDATE users
            SET xp=?, streak=?, words_learned=?, vocab=?, last_activity=?, voice_on=?
            WHERE name=?
        """, (
            int(d.get('xp', 0)),
            int(d.get('streak', 0)),
            int(d.get('wordsLearned', 0)),
            json.dumps(d.get('vocab', [])),
            d.get('lastActivity', ''),
            1 if d.get('voiceOn', True) else 0,
            name
        ))
        db.commit()
    return jsonify({'success': True})

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    with get_db() as db:
        rows = db.execute(
            'SELECT name, xp, streak, words_learned FROM users ORDER BY xp DESC LIMIT 20'
        ).fetchall()
    return jsonify({
        'success': True,
        'users': [
            {'name': r['name'], 'xp': r['xp'], 'streak': r['streak'], 'words': r['words_learned']}
            for r in rows
        ]
    })

# ── Chat endpoints ─────────────────────────────────────────────────────
@app.route('/api/start', methods=['POST'])
def start():
    topic = request.json.get('topic', 'general')
    return jsonify({"success": True, "data": TOPIC_STARTERS.get(topic, TOPIC_STARTERS['general'])})

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data    = request.json
        messages = data.get('messages', [])
        topic    = data.get('topic', 'general')

        topic_labels = {
            'shopping': 'Shopping and buying things.',
            'restaurant': 'Ordering food at a restaurant.',
            'travel': 'Travel and airports.',
            'work': 'Work and professional situations.',
            'social': 'Social situations and meeting new people.',
            'health': 'Health and medical situations.',
            'home': 'Home life and daily routines.'
        }
        system = SYSTEM_PROMPT
        ctx = topic_labels.get(topic, '')
        if ctx:
            system += f"\n\nCURRENT TOPIC: {ctx}"

        full_messages = [{"role": "system", "content": system}] + messages[-14:]
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=full_messages,
            temperature=0.85, max_tokens=700
        )
        parsed = clean_json(response.choices[0].message.content)
        if not parsed:
            parsed = {"message": response.choices[0].message.content,
                      "correction": {"has_error": False, "original": "", "corrected": "", "tip": ""},
                      "vocabulary": {"word": "", "definition": "", "spanish": "", "example": ""},
                      "emotion": "happy"}
        return jsonify({"success": True, "data": parsed})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/translate', methods=['POST'])
def translate():
    try:
        data = request.json
        text = data.get('text', '')
        lang = 'Spanish' if data.get('direction', 'to_spanish') == 'to_spanish' else 'English'
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": f"Translate to {lang}. Only the translation, nothing else: {text}"}],
            temperature=0, max_tokens=400
        )
        return jsonify({"success": True, "translation": response.choices[0].message.content.strip()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        sentence = request.json.get('sentence', '')
        prompt = f"""Analyze this English sentence from a Spanish-speaking A1-A2 beginner. Respond ONLY with valid JSON:

Sentence: "{sentence}"

{{
  "grammar_score": 85,
  "corrections": [
    {{"original": "incorrect part", "corrected": "correct version", "explanation": "Explanation in Spanish"}}
  ],
  "positive": "What they did well (in Spanish, be encouraging)",
  "rewritten": "The fully corrected sentence in English"
}}

If no errors: corrections=[], grammar_score=100."""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0, max_tokens=600
        )
        parsed = clean_json(response.choices[0].message.content)
        return jsonify({"success": True, "data": parsed or {}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"\n🚀 ThiagoEnglish - English Tutor → http://localhost:{port}\n")
    app.run(debug=False, host='0.0.0.0', port=port)
