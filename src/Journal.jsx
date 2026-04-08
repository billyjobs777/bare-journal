import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { loadAllEntries, saveEntry, deleteAllEntries } from './db'

const LOFTY_QUESTIONS = [
  "Why does wealth come to me so naturally?",
  "Why am I so good at spotting opportunity?",
  "Why does money flow to me from expected and unexpected sources?",
  "Why do I always have more than enough?",
  "Why is building wealth so enjoyable for me?",
  "Why do people gladly pay for the value I create?",
  "Why am I so confident with financial decisions?",
  "Why does abundance feel so normal to me?",
  "Why do the right opportunities find me at the right time?",
  "Why is it so easy for me to save and invest wisely?",
  "Why do I attract people who help me grow financially?",
  "Why does my income keep increasing?",
  "Why am I so good at turning ideas into income?",
  "Why do I deserve financial freedom?",
  "Why does my relationship with money keep getting healthier?",
  "Why am I so disciplined with wealth-building habits?",
  "Why does my net worth grow while I sleep?",
  "Why do I make money decisions from abundance, not fear?",
  "Why is generosity so natural when wealth flows to me?",
  "Why do I trust myself completely with large sums of money?",
  "Why do my skills become more valuable every year?",
  "Why is financial education so fascinating to me?",
  "Why do I see possibility where others see limitation?",
  "Why does every setback move me closer to a breakthrough?",
  "Why am I becoming the person who earns at the next level?",
  "Why do I release old money stories so easily?",
  "Why is wealth just a natural byproduct of who I'm becoming?",
  "Why do I take action on financial goals without hesitation?",
  "Why does compound growth work so powerfully in my favor?",
  "Why am I already wealthier than I was yesterday?",
];

const WEEKLY_PROMPTS = [
  "Income Ceiling Audit: What number do you believe is 'the most someone like you' can earn? Who told you that?",
  "What did you learn about money, investing, or financial systems this week? One takeaway.",
  "'I don't deserve more money because...' — Write honestly, then write the counter-evidence.",
  "Write 3 sentences from you 5 years from now, looking back at this week.",
  "Top 3 ways you created value this week. Which has the most growth potential?",
  "If money were a person, how would you describe your relationship right now?",
  "What financial skill would change everything? What's your plan to learn it?",
  "What % of this week's spending went toward things that genuinely matter?",
  "Are you spending time with people who expand or shrink your financial vision?",
  "What are you most afraid of with money? Is that fear protecting or trapping you?",
  "One financial thing you used to dream about but now take for granted.",
  "If you HAD to 10x your income in 3 years, what changes starting Monday?",
  "Describe the person who naturally earns at the level you're building toward.",
];

const FIELD_META = {
  visualize: { label: "Visualize", color: "#f0c040", icon: "☀" },
  gratitude: { label: "Money Gratitude", color: "#7a4cc9", icon: "✦" },
  lofty_a: { label: "Lofty Answer", color: "#a8c94c", icon: "→" },
  value: { label: "Value Created", color: "#c97a4c", icon: "◆" },
  weekly: { label: "Weekly Deep Dive", color: "#c94c6e", icon: "★" },
};

const dateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const dayIndex = (d = new Date()) => {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const epoch = new Date(2024, 0, 1);
  return Math.floor((local - epoch) / 86400000);
};
const dayIndexForDate = (ds) => dayIndex(new Date(ds + 'T12:00:00'));
const weekIndex = () => Math.floor(dayIndex() / 7);
const fmtDate = (ds) => new Date(ds + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });

const SCORE_LABELS = ["", "Anxious", "Stressed", "Uneasy", "Uncertain", "Neutral", "Okay", "Hopeful", "Confident", "Abundant", "Unstoppable"];
const SCORE_COLORS = ["", "#c94c4c", "#c96a4c", "#c9884c", "#c9a44c", "#a8a868", "#7ab86e", "#5cb87a", "#4cb89a", "#4caac9", "#f0c040"];

export default function Journal({ onLogout }) {
  const [entries, setEntries] = useState({});
  const [view, setView] = useState("journal");
  const [tod, setTod] = useState("morning");
  const [drafts, setDrafts] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ms, setMs] = useState(0);
  const [msNote, setMsNote] = useState("");
  const [msSaved, setMsSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const today = dateKey();
  const isMonday = new Date().getDay() === 1;
  const todayLofty = LOFTY_QUESTIONS[dayIndex() % LOFTY_QUESTIONS.length];
  const thisWeekly = WEEKLY_PROMPTS[weekIndex() % WEEKLY_PROMPTS.length];

  useEffect(() => {
    setTod(new Date().getHours() < 15 ? "morning" : "evening");
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadAllEntries();
    setEntries(data);
    const t = dateKey();
    const todTod = new Date().getHours() < 15 ? "morning" : "evening";
    const sk = todTod === "morning" ? "ms_am" : "ms_pm";
    const nk = todTod === "morning" ? "msn_am" : "msn_pm";
    if (data[t]?.[sk]) setMs(data[t][sk]);
    if (data[t]?.[nk]) setMsNote(data[t][nk]);
    setLoading(false);
  };

  useEffect(() => {
    if (view === "journal") {
      const sk = tod === "morning" ? "ms_am" : "ms_pm";
      const nk = tod === "morning" ? "msn_am" : "msn_pm";
      setMs(entries[today]?.[sk] || 0);
      setMsNote(entries[today]?.[nk] || "");
    }
  }, [tod, entries, today, view]);

  const saveField = async (field, value) => {
    const newData = { ...entries[today], [field]: value };
    const updated = { ...entries, [today]: newData };
    setEntries(updated);
    setSaved(s => ({ ...s, [field]: true }));
    setSaving(true);
    await saveEntry(today, newData);
    setSaving(false);
    setTimeout(() => setSaved(s => ({ ...s, [field]: false })), 1500);
  };

  const saveMindset = async () => {
    const sk = tod === "morning" ? "ms_am" : "ms_pm";
    const nk = tod === "morning" ? "msn_am" : "msn_pm";
    const newData = { ...entries[today], [sk]: ms, [nk]: msNote };
    const updated = { ...entries, [today]: newData };
    setEntries(updated);
    setMsSaved(true);
    setSaving(true);
    await saveEntry(today, newData);
    setSaving(false);
    setTimeout(() => setMsSaved(false), 1500);
  };

  const calcStreak = () => {
    let current = 0, d = new Date();
    const has = (k) => entries[k]?.ms_am || entries[k]?.ms_pm;
    if (has(dateKey(d))) current = 1;
    d.setDate(d.getDate() - 1);
    while (has(dateKey(d))) { current++; d.setDate(d.getDate() - 1); }
    if (current === 0) { d = new Date(); d.setDate(d.getDate() - 1); while (has(dateKey(d))) { current++; d.setDate(d.getDate() - 1); } }
    let longest = 0, s = 0;
    for (const k of Object.keys(entries).sort()) { if (has(k)) { s++; if (s > longest) longest = s; } else s = 0; }
    return { current, longest: Math.max(longest, current) };
  };

  const getScoreHistory = () => {
    const out = [];
    for (const k of Object.keys(entries).sort()) {
      const e = entries[k]; const score = e?.ms_pm || e?.ms_am;
      if (score) out.push({ date: k, score, am: e?.ms_am || 0, pm: e?.ms_pm || 0, label: new Date(k + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }), amNote: e?.msn_am || "", pmNote: e?.msn_pm || "" });
    }
    return out;
  };

  const getCalendarDays = () => {
    const now = new Date();
    const todayDow = now.getDay();
    // Start from the Sunday 4 weeks before this week's Sunday (35-cell grid)
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayDow - 28);
    const days = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const isFuture = d > now;
      const k = dateKey(d);
      const e = !isFuture ? entries[k] : null;
      const hasData = !!(e && Object.keys(e).some(f => !['ms_am','ms_pm','msn_am','msn_pm'].includes(f) ? e[f]?.trim?.() : e[f]));
      days.push({ date: k, score: e?.ms_pm || e?.ms_am || 0, num: d.getDate(), hasData, isFuture, isToday: k === today });
    }
    return days;
  };

  const entryDates = Object.keys(entries).filter(k => {
    const e = entries[k]; return Object.values(e).some(v => v && (typeof v === 'number' || v?.trim?.()));
  }).sort().reverse();

  const streak = calcStreak();
  const history = getScoreHistory();
  const avgScore = history.length ? (history.reduce((a, h) => a + h.score, 0) / history.length).toFixed(1) : "—";
  const r7 = history.length >= 7 ? (history.slice(-7).reduce((a, h) => a + h.score, 0) / 7) : null;
  const o7 = history.length >= 14 ? (history.slice(-14, -7).reduce((a, h) => a + h.score, 0) / 7) : null;
  const trend = r7 != null && o7 != null ? (r7 - o7).toFixed(1) : null;

  const scoreKey = tod === "morning" ? "ms_am" : "ms_pm";
  const noteKey = tod === "morning" ? "msn_am" : "msn_pm";
  const existingScore = entries[today]?.[scoreKey];
  const todayShift = entries[today]?.ms_am && entries[today]?.ms_pm ? entries[today].ms_pm - entries[today].ms_am : null;

  const prompts = tod === "morning" ? [
    { id: "visualize", label: "Visualize", q: "Close your eyes for 60 seconds. See one specific scene from the life you're building. Describe it.", color: "#f0c040" },
    { id: "gratitude", label: "Money Gratitude", q: "3 financial things you're grateful for right now, no matter how small.", color: "#7a4cc9" },
    { id: "lofty_q", label: "Today's Lofty Question", q: todayLofty, color: "#a8c94c", hint: "Sit with this question. Let your brain search for answers all day.", isQuestion: true },
  ] : [
    { id: "lofty_a", label: "Lofty Answer", q: `Your brain has been working on this all day:\n\n"${todayLofty}"\n\nWhat answers did it find?`, color: "#a8c94c" },
    { id: "value", label: "Value Created", q: "How did you create value for others today?", color: "#c97a4c" },
    ...(isMonday ? [{ id: "weekly", label: "Weekly Deep Dive", q: thisWeekly, color: "#c94c6e", weekly: true }] : []),
  ];

  const DayEntry = ({ dk }) => {
    const e = entries[dk]; if (!e) return null;
    const loftyQ = LOFTY_QUESTIONS[dayIndexForDate(dk) % LOFTY_QUESTIONS.length];
    const journalFields = Object.keys(e).filter(f => !['ms_am','ms_pm','msn_am','msn_pm'].includes(f) && e[f]?.trim?.());
    const isToday = dk === today;
    return (
      <div style={{ marginBottom: 16, background: 'rgba(240,240,240,.05)', border: `1px solid ${isToday ? 'rgba(240,192,64,.2)' : 'rgba(240,192,64,.06)'}`, borderRadius: 12, padding: '14px 16px', animation: 'fadeUp .3s both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '1rem', color: '#f0c040', fontWeight: 700 }}>{fmtDate(dk)}</span>
          {isToday && <span style={{ fontSize: '1rem', background: 'rgba(240,192,64,.12)', color: '#f0c040', padding: '2px 8px', borderRadius: 10 }}>TODAY</span>}
          {(e.ms_am || e.ms_pm) && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {e.ms_am > 0 && <div style={{ width: 22, height: 22, borderRadius: 4, background: SCORE_COLORS[e.ms_am], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#000000' }}>{e.ms_am}</div>}
              {e.ms_am > 0 && e.ms_pm > 0 && <span style={{ fontSize: '1rem', color: e.ms_pm >= e.ms_am ? '#4cc97a' : '#c96a4c' }}>→</span>}
              {e.ms_pm > 0 && <div style={{ width: 22, height: 22, borderRadius: 4, background: SCORE_COLORS[e.ms_pm], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#000000' }}>{e.ms_pm}</div>}
            </div>
          )}
        </div>
        <div style={{ fontSize: '.9rem', color: '#a8c94c', opacity: .75, fontStyle: 'italic', marginBottom: 8, borderLeft: '2px solid rgba(168,201,76,.3)', paddingLeft: 10 }}>{loftyQ}</div>
        {journalFields.map(f => {
          const meta = FIELD_META[f] || { label: f, color: '#f0c040', icon: '·' };
          return (<div key={f} style={{ marginBottom: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}><span style={{ fontSize: '1rem', color: meta.color, opacity: .6 }}>{meta.icon}</span><span style={{ fontSize: '1rem', letterSpacing: '.1em', textTransform: 'uppercase', color: meta.color, opacity: .6 }}>{meta.label}</span></div><p style={{ fontSize: '1rem', color: '#f0f0f0', opacity: .95, lineHeight: 1.5, margin: 0, paddingLeft: 16 }}>{e[f]}</p></div>);
        })}
        {(e.msn_am || e.msn_pm) && (<div style={{ marginTop: 6, borderTop: '1px solid rgba(240,192,64,.06)', paddingTop: 6 }}>{e.msn_am && <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.75)', lineHeight: 1.3, margin: '0 0 2px' }}>☀ {e.msn_am}</p>}{e.msn_pm && <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.75)', lineHeight: 1.3, margin: 0 }}>☽ {e.msn_pm}</p>}</div>)}
      </div>
    );
  };

  const Sparkline = ({ data, width = 300, height = 80 }) => {
    if (data.length < 2) return null;
    const pad = 8, w = width - pad * 2, h = height - pad * 2;
    const pts = data.map((d, i) => ({ x: pad + (i / (data.length - 1)) * w, y: pad + h - ((d.score - 1) / 9) * h }));
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = path + ` L${pts.at(-1).x},${height} L${pts[0].x},${height} Z`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f0c040" stopOpacity=".2" /><stop offset="100%" stopColor="#f0c040" stopOpacity="0" /></linearGradient></defs>
        <path d={area} fill="url(#sg)" /><path d={path} fill="none" stroke="#f0c040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={SCORE_COLORS[data[i].score]} stroke="#000000" strokeWidth="1.5" />)}
      </svg>
    );
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#f0c040' }}>Loading your journal...</div>;

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '20px 20px 0', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', color: '#f0c040', letterSpacing: '.15em', fontWeight: 400, margin: 0, textTransform: 'uppercase' }}>Wealth Journal</h1>
            <p style={{ fontSize: '1rem', color: '#f5e070', opacity: .7, margin: '2px 0', letterSpacing: '.1em' }}>Day {Math.max(1, Object.keys(entries).length)} of 90</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ textAlign: 'right', marginRight: 6 }}>
              <div style={{ fontSize: '1.4rem', color: '#f0c040', fontWeight: 700, lineHeight: 1 }}>{streak.current}</div>
              <div style={{ fontSize: '1rem', color: '#f5e070', opacity: .7, letterSpacing: '.08em', textTransform: 'uppercase' }}>streak</div>
            </div>
            <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(240,192,64,.3)', color: 'rgba(240,192,64,.6)', padding: '4px 10px', borderRadius: 6, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 14, background: 'rgba(240,192,64,.04)', borderRadius: 10, padding: 3 }}>
          {[{ id: 'journal', label: '✎ Today' }, { id: 'entries', label: '☰ Entries' }, { id: 'trends', label: '◫ Trends' }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              flex: 1, padding: '7px 0', border: 'none', borderRadius: 8, fontSize: '1rem', letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
              background: view === t.id ? 'rgba(240,192,64,.12)' : 'transparent', color: view === t.id ? '#f0c040' : 'rgba(240,240,240,.55)',
              fontFamily: 'inherit', fontWeight: view === t.id ? 700 : 400, transition: 'all .3s',
            }}>{t.label}</button>
          ))}
        </div>

        {view === 'journal' && (
          <div style={{ display: 'flex', marginTop: 8, background: 'rgba(240,192,64,.03)', borderRadius: 8, padding: 2 }}>
            {['morning', 'evening'].map(t => (
              <button key={t} onClick={() => setTod(t)} style={{
                flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, fontSize: '1rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                background: tod === t ? 'rgba(240,192,64,.1)' : 'transparent', color: tod === t ? '#f0c040' : 'rgba(240,240,240,.45)',
                fontFamily: 'inherit', transition: 'all .3s',
              }}>{t === 'morning' ? '☀ Morning' : '☽ Evening'}</button>
            ))}
          </div>
        )}

        {saving && <div style={{ textAlign: 'center', padding: '4px 0', fontSize: '1rem', color: 'rgba(240,192,64,.3)' }}>saving...</div>}
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '14px 20px 40px' }}>
        {view === 'journal' && (
          <>
            {prompts.map((p, i) => {
              const existing = entries[today]?.[p.id] || '';
              const draft = drafts[p.id] ?? existing;
              return (
                <div key={p.id} style={{ marginBottom: 14, background: p.isQuestion ? 'linear-gradient(135deg, rgba(168,201,76,.05), rgba(168,201,76,.01))' : 'rgba(240,240,240,.05)', border: `1px solid ${p.isQuestion ? 'rgba(168,201,76,.15)' : 'rgba(240,192,64,.08)'}`, borderRadius: 12, padding: '16px 16px 12px', animation: `fadeUp .4s ${i * .08}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, opacity: existing ? 1 : .3 }} />
                    <span style={{ fontSize: '1rem', letterSpacing: '.12em', textTransform: 'uppercase', color: p.color, opacity: .8 }}>{p.label}</span>
                    {p.weekly && <span style={{ fontSize: '1rem', background: 'rgba(201,76,110,.12)', color: '#c94c6e', padding: '2px 7px', borderRadius: 10, marginLeft: 'auto' }}>WEEKLY</span>}
                    {saved[p.id] && <span style={{ fontSize: '1rem', color: '#4cc97a', marginLeft: 'auto' }}>✓</span>}
                  </div>
                  {p.isQuestion ? (
                    <p style={{ fontSize: '1rem', color: '#a8c94c', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic', fontWeight: 700 }}>{p.q}</p>
                  ) : (
                    <p style={{ fontSize: '1rem', color: '#f0f0f0', opacity: .9, lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{p.q}</p>
                  )}
                  {p.hint && <p style={{ fontSize: '1rem', color: p.color, opacity: .65, marginBottom: 6 }}>{p.hint}</p>}
                  {!p.isQuestion && (
                    <>
                      <textarea value={draft} onChange={e => setDrafts(d => ({ ...d, [p.id]: e.target.value }))} placeholder="Write here..." rows={p.id === 'gratitude' || p.id === 'weekly' ? 3 : 2}
                        style={{ width: '100%', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(240,192,64,.06)', borderRadius: 8, padding: '10px 12px', color: '#f0f0f0', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(240,192,64,.2)'} onBlur={e => e.target.style.borderColor = 'rgba(240,192,64,.06)'} />
                      {draft && draft !== existing && <button onClick={() => saveField(p.id, draft)} style={{ marginTop: 6, background: 'rgba(240,192,64,.1)', border: '1px solid rgba(240,192,64,.2)', color: '#f0c040', padding: '5px 14px', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>}
                    </>
                  )}
                </div>
              );
            })}

            <div style={{ marginBottom: 14, background: 'linear-gradient(135deg, rgba(240,192,64,.06), rgba(240,192,64,.02))', border: '1px solid rgba(240,192,64,.15)', borderRadius: 12, padding: '18px 16px', animation: `fadeUp .4s ${prompts.length * .08}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: '1rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#f0c040' }}>{tod === 'morning' ? '☀' : '☽'} Mindset Check-In</span>
                {msSaved && <span style={{ fontSize: '1rem', color: '#4cc97a', marginLeft: 'auto' }}>✓</span>}
              </div>
              <p style={{ fontSize: '1rem', color: '#f0f0f0', opacity: .85, fontStyle: 'italic', marginBottom: 14 }}>
                {tod === 'morning' ? 'How do you feel about money this morning?' : 'How do you feel about money right now, end of day?'}
              </p>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6, justifyContent: 'center' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setMs(n)} style={{
                    width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '.9rem', fontWeight: 700,
                    background: ms === n ? SCORE_COLORS[n] : 'rgba(240,240,240,.07)', color: ms === n ? '#000000' : 'rgba(240,240,240,.55)',
                    transform: ms === n ? 'scale(1.15)' : 'scale(1)', transition: 'all .2s',
                  }}>{n}</button>
                ))}
              </div>
              {ms > 0 && <p style={{ textAlign: 'center', fontSize: '.9rem', color: SCORE_COLORS[ms], marginBottom: 10, fontStyle: 'italic' }}>{SCORE_LABELS[ms]}</p>}
              <textarea value={msNote} onChange={e => setMsNote(e.target.value)} placeholder="Why this score? One sentence..." rows={1}
                style={{ width: '100%', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(240,192,64,.06)', borderRadius: 8, padding: '8px 12px', color: '#f0f0f0', fontSize: '1rem', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, outline: 'none' }} />
              {ms > 0 && (ms !== existingScore || msNote !== (entries[today]?.[noteKey] || "")) && (
                <button onClick={saveMindset} style={{ marginTop: 6, background: 'rgba(240,192,64,.12)', border: '1px solid rgba(240,192,64,.25)', color: '#f0c040', padding: '5px 14px', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              )}
              {tod === 'evening' && todayShift !== null && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: '1rem', color: todayShift >= 0 ? '#4cc97a' : '#c96a4c', opacity: .7 }}>
                  Today's shift: {entries[today]?.ms_am} → {entries[today]?.ms_pm} ({todayShift >= 0 ? '+' : ''}{todayShift})
                </div>
              )}
            </div>
          </>
        )}

        {view === 'entries' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <h3 style={{ fontSize: '1rem', color: '#f0c040', letterSpacing: '.1em', textTransform: 'uppercase', opacity: .85 }}>{entryDates.length} {entryDates.length === 1 ? 'day' : 'days'} logged</h3>
                <span style={{ fontSize: '.85rem', color: 'rgba(240,192,64,.55)' }}>
                  {(() => { const cal = getCalendarDays().filter(d => !d.isFuture); const months = [...new Set(cal.map(d => new Date(d.date + 'T12:00:00').toLocaleDateString('en', { month: 'short' })))]; return months.join(' – '); })()}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                {['Su','M','T','W','Th','F','Sa'].map(l => (
                  <div key={l} style={{ textAlign: 'center', fontSize: '.78rem', color: 'rgba(240,192,64,.5)', paddingBottom: 4, fontWeight: 600 }}>{l}</div>
                ))}
                {getCalendarDays().map((d, i) => (
                  <div key={i} onClick={() => !d.isFuture && d.hasData && setSelectedDate(selectedDate === d.date ? null : d.date)} style={{
                    aspectRatio: '1', borderRadius: 5, cursor: !d.isFuture && d.hasData ? 'pointer' : 'default',
                    background: d.isFuture ? 'transparent' : selectedDate === d.date ? 'rgba(240,192,64,.55)' : d.score ? `rgba(${d.score >= 7 ? '76,200,122' : d.score >= 4 ? '240,192,64' : '201,76,76'},${.15 + (d.score / 10) * .4})` : d.hasData ? 'rgba(240,192,64,.12)' : 'rgba(240,240,240,.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.85rem',
                    color: d.isFuture ? 'transparent' : selectedDate === d.date ? '#000' : (d.hasData || d.score) ? '#f0f0f0' : 'rgba(240,240,240,.3)',
                    fontWeight: d.isToday ? 700 : 400,
                    border: d.isToday ? '2px solid rgba(240,192,64,.7)' : '1px solid transparent',
                  }}>{d.isFuture ? '' : d.num}</div>
                ))}
              </div>
              <p style={{ fontSize: '.82rem', color: 'rgba(240,240,240,.4)', textAlign: 'center', marginBottom: 12 }}>Tap a day to view that entry</p>
            </div>
            {selectedDate ? <DayEntry dk={selectedDate} /> : entryDates.length > 0 ? entryDates.map(dk => <DayEntry key={dk} dk={dk} />) : <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.55)', textAlign: 'center', padding: 30 }}>No entries yet.</p>}
          </>
        )}

        {view === 'trends' && (
          <>
            <div style={{ marginTop: 8, marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem', color: '#f0c040', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12, opacity: .85 }}>Money Mindset Over Time</h3>
              {history.length >= 2 ? (
                <div style={{ background: 'rgba(240,240,240,.05)', borderRadius: 12, padding: '16px 12px 8px', border: '1px solid rgba(240,192,64,.06)' }}>
                  <Sparkline data={history} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 0', fontSize: '1rem', color: 'rgba(240,240,240,.45)' }}><span>{history[0].label}</span><span>{history.at(-1).label}</span></div>
                </div>
              ) : <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.55)', textAlign: 'center', padding: 20 }}>{history.length === 0 ? 'Log your first mindset score to start tracking' : 'One more day to see your trend line'}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[{ n: avgScore, l: 'Avg Score' }, { n: trend ? (Number(trend) >= 0 ? `+${trend}` : trend) : '—', l: '7d Trend', c: trend ? (Number(trend) >= 0 ? '#4cc97a' : '#c94c4c') : null }, { n: streak.current, l: 'Streak' }, { n: streak.longest, l: 'Best' }].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', background: 'rgba(240,192,64,.04)', borderRadius: 10, padding: '10px 4px' }}>
                  <div style={{ fontSize: '1.4rem', color: s.c || '#f0c040', fontWeight: 700 }}>{s.n}</div>
                  <div style={{ fontSize: '1rem', color: '#f5e070', opacity: .7, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {(() => {
              const shifts = Object.keys(entries).sort().filter(k => entries[k]?.ms_am && entries[k]?.ms_pm).map(k => ({ shift: entries[k].ms_pm - entries[k].ms_am, label: new Date(k + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) }));
              if (!shifts.length) return null;
              const avg = (shifts.reduce((a, s) => a + s.shift, 0) / shifts.length).toFixed(1);
              return (<div style={{ marginBottom: 20, background: 'rgba(240,240,240,.05)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(240,192,64,.06)' }}><h3 style={{ fontSize: '1rem', color: '#f0c040', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8, opacity: .85 }}>Daily Shift (AM → PM)</h3><div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 40 }}>{shifts.slice(-20).map((s, i) => (<div key={i} title={`${s.label}: ${s.shift >= 0 ? '+' : ''}${s.shift}`} style={{ flex: 1, borderRadius: 2, height: `${Math.max(4, Math.abs(s.shift) * 8)}px`, background: s.shift >= 0 ? 'rgba(76,200,122,.5)' : 'rgba(201,76,76,.5)' }} />))}</div><p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.65)', marginTop: 6, textAlign: 'center' }}>Avg shift: <span style={{ color: Number(avg) >= 0 ? '#4cc97a' : '#c96a4c' }}>{Number(avg) >= 0 ? '+' : ''}{avg}</span></p></div>);
            })()}
            <div>
              <h3 style={{ fontSize: '1rem', color: '#f0c040', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 10, opacity: .85 }}>Mindset Log</h3>
              {history.slice().reverse().slice(0, 10).map(h => (
                <div key={h.date} onClick={() => { setSelectedDate(h.date); setView('entries'); }} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, padding: '8px 10px', background: 'rgba(240,240,240,.04)', borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                    {h.am > 0 && <div style={{ width: 22, height: 22, borderRadius: 4, background: SCORE_COLORS[h.am], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#000000' }}>{h.am}</div>}
                    {h.am > 0 && h.pm > 0 && <span style={{ fontSize: '1rem', color: h.pm >= h.am ? '#4cc97a' : '#c96a4c' }}>→</span>}
                    {h.pm > 0 && <div style={{ width: 22, height: 22, borderRadius: 4, background: SCORE_COLORS[h.pm], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#000000' }}>{h.pm}</div>}
                  </div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: '1rem', color: 'rgba(240,240,240,.65)', marginBottom: 2 }}>{h.label}</div>{h.amNote && <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.75)', lineHeight: 1.3, margin: '0 0 2px' }}>☀ {h.amNote}</p>}{h.pmNote && <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.75)', lineHeight: 1.3, margin: 0 }}>☽ {h.pmNote}</p>}</div>
                  <span style={{ fontSize: '1rem', color: 'rgba(240,192,64,.25)', marginTop: 2 }}>→</span>
                </div>
              ))}
              {!history.length && <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.45)', textAlign: 'center', padding: 16 }}>No entries yet</p>}
            </div>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button onClick={async () => { if (confirm('Clear all data? Cannot be undone.')) { await deleteAllEntries(); setEntries({}); setMs(0); setMsNote(""); } }}
                style={{ background: 'none', border: '1px solid rgba(201,76,76,.15)', color: 'rgba(201,76,76,.3)', padding: '5px 14px', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>Reset All Data</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
