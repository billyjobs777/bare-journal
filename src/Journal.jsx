import { useState, useEffect } from 'react'
import { loadAllEntries, saveEntry, deleteAllEntries, loadIntention } from './db'
import IntentionSetup from './IntentionSetup'
import ProfileMenu from './ProfileMenu'

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

export default function Journal({ onLogout, onBack, config, user, displayName, onNameUpdate }) {
  const [entries, setEntries] = useState({});
  const [view, setView] = useState("journal");
  const [tod, setTod] = useState("morning");
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intention, setIntention] = useState(null); // null=loading, false=not set, object=set
  const [ms, setMs] = useState(0);
  const [msNote, setMsNote] = useState("");
  const [msSaved, setMsSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const today = dateKey();
  const isMonday = new Date().getDay() === 1;
  const loftyPool = intention?.generated_prompts?.loftyQuestions?.length >= 90
    ? intention.generated_prompts.loftyQuestions
    : config.loftyQuestions;
  const weeklyPool = intention?.generated_prompts?.weeklyPrompts?.length >= 13
    ? intention.generated_prompts.weeklyPrompts
    : config.weeklyPrompts;
  const todayLofty = loftyPool[dayIndex() % loftyPool.length];
  const thisWeekly = weeklyPool[weekIndex() % weeklyPool.length];

  useEffect(() => {
    setTod(new Date().getHours() < 15 ? "morning" : "evening");
    loadData();
  }, []);

  const loadData = async () => {
    const [data, intentionData] = await Promise.all([
      loadAllEntries(config.id),
      loadIntention(config.id),
    ]);
    setEntries(data);
    setIntention(intentionData || false);
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
      setActivePromptIndex(0);
    }
  }, [tod, entries, today, view]);

  const saveField = async (field, value) => {
    const newData = { ...entries[today], [field]: value };
    setEntries(e => ({ ...e, [today]: newData }));
    setSaved(s => ({ ...s, [field]: true }));
    setSaving(true);
    await saveEntry(today, newData, config.id);
    setSaving(false);
    setTimeout(() => setSaved(s => ({ ...s, [field]: false })), 1500);
  };

  const saveMindset = async () => {
    const sk = tod === "morning" ? "ms_am" : "ms_pm";
    const nk = tod === "morning" ? "msn_am" : "msn_pm";
    const newData = { ...entries[today], [sk]: ms, [nk]: msNote };
    setEntries(e => ({ ...e, [today]: newData }));
    setMsSaved(true);
    setSaving(true);
    await saveEntry(today, newData, config.id);
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
      const e = entries[k];
      const score = e?.ms_pm || e?.ms_am;
      if (score) out.push({
        date: k, score,
        am: e?.ms_am || 0, pm: e?.ms_pm || 0,
        label: new Date(k + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        amNote: e?.msn_am || "", pmNote: e?.msn_pm || "",
      });
    }
    return out;
  };

  const getCalendarDays = () => {
    const now = new Date();
    const todayDow = now.getDay();
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
    const e = entries[k];
    return Object.values(e).some(v => v && (typeof v === 'number' || v?.trim?.()));
  }).sort().reverse();

  const streak = calcStreak();
  const history = getScoreHistory();
  const avgScore = history.length ? (history.reduce((a, h) => a + h.score, 0) / history.length).toFixed(1) : "—";
  const r7 = history.length >= 7 ? (history.slice(-7).reduce((a, h) => a + h.score, 0) / 7) : null;
  const o7 = history.length >= 14 ? (history.slice(-14, -7).reduce((a, h) => a + h.score, 0) / 7) : null;
  const trend = r7 != null && o7 != null ? (r7 - o7).toFixed(1) : null;

  const scoreKey = tod === "morning" ? "ms_am" : "ms_pm";
  const noteKey  = tod === "morning" ? "msn_am" : "msn_pm";
  const existingScore = entries[today]?.[scoreKey];
  const todayShift = entries[today]?.ms_am && entries[today]?.ms_pm
    ? entries[today].ms_pm - entries[today].ms_am : null;

  const prompts = tod === "morning"
    ? config.getMorningPrompts(todayLofty)
    : config.getEveningPrompts(todayLofty, thisWeekly, isMonday);

  const DayEntry = ({ dk }) => {
    const e = entries[dk]; if (!e) return null;
    const loftyQ = loftyPool[dayIndexForDate(dk) % loftyPool.length];
    const journalFields = Object.keys(e).filter(f => !['ms_am','ms_pm','msn_am','msn_pm'].includes(f) && e[f]?.trim?.());
    const isToday = dk === today;
    return (
      <div style={{ marginBottom: 16, background: 'rgba(236,232,224,.04)', border: `1px solid ${isToday ? `rgba(${config.colorRgb},.25)` : `rgba(${config.colorRgb},.08)`}`, borderRadius: 12, padding: '16px 18px', animation: 'fadeUp .3s both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '1rem', color: config.color, fontWeight: 700 }}>{fmtDate(dk)}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {isToday && <span style={{ fontSize: '.85rem', background: `rgba(${config.colorRgb},.12)`, color: config.color, padding: '2px 8px', borderRadius: 10 }}>TODAY</span>}
            {(e.ms_am || e.ms_pm) && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {e.ms_am > 0 && <div style={{ width: 24, height: 24, borderRadius: 5, background: config.scoreColors[e.ms_am], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', fontWeight: 700, color: '#000' }}>{e.ms_am}</div>}
                {e.ms_am > 0 && e.ms_pm > 0 && <span style={{ fontSize: '.9rem', color: e.ms_pm >= e.ms_am ? '#4cc97a' : '#c96a4c' }}>→</span>}
                {e.ms_pm > 0 && <div style={{ width: 24, height: 24, borderRadius: 5, background: config.scoreColors[e.ms_pm], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', fontWeight: 700, color: '#000' }}>{e.ms_pm}</div>}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem', color: config.color, opacity: .65, fontStyle: 'italic', marginBottom: 10, borderLeft: `2px solid rgba(${config.colorRgb},.25)`, paddingLeft: 10 }}>{loftyQ}</div>
        {journalFields.map(f => {
          const meta = config.fieldMeta[f] || { label: f, color: config.color, icon: '·' };
          return (
            <div key={f} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: '1rem', color: meta.color, opacity: .7 }}>{meta.icon}</span>
                <span style={{ fontSize: '.85rem', letterSpacing: '.08em', textTransform: 'uppercase', color: meta.color, opacity: .7 }}>{meta.label}</span>
              </div>
              <p style={{ fontSize: '1rem', color: '#ece8e0', lineHeight: 1.6, margin: 0, paddingLeft: 14 }}>{e[f]}</p>
            </div>
          );
        })}
        {(e.msn_am || e.msn_pm) && (
          <div style={{ marginTop: 8, borderTop: `1px solid rgba(${config.colorRgb},.08)`, paddingTop: 8 }}>
            {e.msn_am && <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.65)', lineHeight: 1.4, margin: '0 0 3px' }}>☀ {e.msn_am}</p>}
            {e.msn_pm && <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.65)', lineHeight: 1.4, margin: 0 }}>☽ {e.msn_pm}</p>}
          </div>
        )}
      </div>
    );
  };

  const Sparkline = ({ data }) => {
    if (data.length < 2) return null;
    const width = 300, height = 80, pad = 8;
    const w = width - pad * 2, h = height - pad * 2;
    const pts = data.map((d, i) => ({ x: pad + (i / (data.length - 1)) * w, y: pad + h - ((d.score - 1) / 9) * h }));
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = path + ` L${pts.at(-1).x},${height} L${pts[0].x},${height} Z`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={config.color} stopOpacity=".2" />
            <stop offset="100%" stopColor={config.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sg)" />
        <path d={path} fill="none" stroke={config.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={config.scoreColors[data[i].score]} stroke="#000" strokeWidth="1.5" />)}
      </svg>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: config.color, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', fontStyle: 'italic' }}>
      Opening...
    </div>
  );

  if (intention === false) return (
    <IntentionSetup
      config={config}
      onBack={onBack}
      onComplete={(data) => setIntention(data)}
    />
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(236,232,224,.35)', fontSize: '1rem', cursor: 'pointer', padding: '0 0 6px', fontFamily: "'Cormorant Garamond', Georgia, serif", display: 'flex', alignItems: 'center', gap: 4 }}>
              ‹ All journals
            </button>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem', color: config.color, letterSpacing: '.02em', fontWeight: 600, margin: 0 }}>{config.name}</h1>
            <p style={{ fontSize: '.9rem', color: 'rgba(236,232,224,.35)', margin: '3px 0 0' }}>Day {Math.max(1, Object.keys(entries).length)} of 90</p>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {streak.current > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <span style={{
                    fontSize: '.95rem', color: config.color,
                    filter: `drop-shadow(0 0 ${Math.min(14, 4 + streak.current * 0.7)}px rgba(${config.colorRgb},${Math.min(1, 0.5 + streak.current * 0.04)}))`,
                  }}>✦</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.6rem', color: config.color, fontWeight: 700, lineHeight: 1 }}>{streak.current}</span>
                </div>
                <div style={{ fontSize: '.75rem', color: 'rgba(236,232,224,.35)', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'right' }}>streak</div>
              </div>
            )}
            <ProfileMenu user={user} displayName={displayName} onNameUpdate={onNameUpdate} onLogout={onLogout} accentColor={config.color} accentRgb={config.colorRgb} />
          </div>
        </div>

        {/* Nav — icon row + inline morning/evening toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          {/* View icons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'journal', icon: '✎', title: 'Today' },
              { id: 'entries', icon: '☰', title: 'Entries' },
              { id: 'trends', icon: '◫', title: 'Trends' },
            ].map(t => (
              <button key={t.id} onClick={() => setView(t.id)} title={t.title} style={{
                width: 40, height: 40, border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: '1.15rem', fontFamily: 'inherit',
                background: view === t.id ? `rgba(${config.colorRgb},.15)` : 'transparent',
                color: view === t.id ? config.color : 'rgba(236,232,224,.3)',
                position: 'relative', transition: 'all .2s',
                boxShadow: view === t.id ? `0 0 0 1px rgba(${config.colorRgb},.25)` : 'none',
              }}>{t.icon}</button>
            ))}
          </div>

          {/* Morning / Evening micro-toggle (only in Today) */}
          {view === 'journal' && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,.04)', borderRadius: 20, padding: 2 }}>
              {[['morning', '☀'], ['evening', '☽']].map(([t, icon]) => (
                <button key={t} onClick={() => setTod(t)} title={t} style={{
                  padding: '5px 14px', border: 'none', borderRadius: 18, cursor: 'pointer',
                  fontSize: '1rem', fontFamily: 'inherit',
                  background: tod === t ? `rgba(${config.colorRgb},.16)` : 'transparent',
                  color: tod === t ? config.color : 'rgba(236,232,224,.35)',
                  transition: 'all .2s',
                }}>{icon}</button>
              ))}
            </div>
          )}
        </div>

        {saving && <div style={{ textAlign: 'right', padding: '6px 0 0', fontSize: '.85rem', color: `rgba(${config.colorRgb},.4)`, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>saving…</div>}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 20px 60px' }}>

        {/* Today view */}
        {view === 'journal' && (
          <>
            {/* Prompt card navigator */}
            <div style={{ marginBottom: 20 }}>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => setActivePromptIndex(i)} style={{
                    width: i === activePromptIndex ? 22 : 6,
                    height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                    background: i === activePromptIndex ? config.color : `rgba(${config.colorRgb},.25)`,
                    transition: 'all .35s ease', padding: 0,
                  }} />
                ))}
              </div>

              {/* Active card */}
              {prompts.map((p, idx) => {
                if (idx !== activePromptIndex) return null;
                const existing = entries[today]?.[p.id] || '';
                const draft = drafts[p.id] ?? existing;
                return (
                  <div key={p.id} style={{
                    background: `radial-gradient(ellipse at 50% 0%, rgba(${config.colorRgb},.08) 0%, rgba(13,13,18,0) 65%)`,
                    border: `1px solid rgba(${config.colorRgb},.2)`,
                    borderRadius: 20,
                    padding: '32px 24px 24px',
                    minHeight: 280,
                    animation: 'fadeUp .5s ease both',
                  }}>
                    {/* Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                      <span style={{ fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase', color: p.color, opacity: .75 }}>{p.label}</span>
                      {p.weekly && <span style={{ fontSize: '.75rem', background: 'rgba(201,76,110,.15)', color: '#c94c6e', padding: '2px 8px', borderRadius: 10 }}>WEEKLY</span>}
                      {saved[p.id] && <span style={{ fontSize: '.85rem', color: '#4cc97a', marginLeft: 'auto' }}>✓ saved</span>}
                    </div>

                    {/* Prompt question */}
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: p.isQuestion ? '1.55rem' : '1.4rem',
                      fontWeight: p.isQuestion ? 600 : 400,
                      fontStyle: p.isQuestion ? 'italic' : 'normal',
                      color: p.isQuestion ? p.color : '#ece8e0',
                      lineHeight: 1.45,
                      margin: '0 0 16px',
                      whiteSpace: 'pre-line',
                    }}>{p.q}</p>

                    {p.hint && <p style={{ fontSize: '.9rem', color: p.color, opacity: .55, marginBottom: 16, fontStyle: 'italic' }}>{p.hint}</p>}

                    {!p.isQuestion && (
                      <>
                        <textarea
                          value={draft}
                          onChange={e => setDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                          placeholder="Write here..."
                          rows={p.rows || 3}
                          style={{ width: '100%', background: 'rgba(13,13,18,.7)', border: `1px solid rgba(${config.colorRgb},.15)`, borderRadius: 12, padding: '14px 16px', color: '#ece8e0', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7, outline: 'none', transition: 'border-color .2s ease' }}
                          onFocus={e => e.target.style.borderColor = `rgba(${config.colorRgb},.45)`}
                          onBlur={e => e.target.style.borderColor = `rgba(${config.colorRgb},.15)`}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          {draft && draft !== existing && (
                            <button onClick={() => { saveField(p.id, draft); setActivePromptIndex(i => Math.min(prompts.length - 1, i + 1)); }} style={{ background: `rgba(${config.colorRgb},.12)`, border: `1px solid rgba(${config.colorRgb},.3)`, color: config.color, padding: '8px 22px', borderRadius: 10, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>Save →</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Prev / Next */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button
                  onClick={() => setActivePromptIndex(i => Math.max(0, i - 1))}
                  disabled={activePromptIndex === 0}
                  style={{ background: 'none', border: `1px solid rgba(${config.colorRgb},.2)`, color: activePromptIndex === 0 ? `rgba(${config.colorRgb},.2)` : config.color, padding: '8px 20px', borderRadius: 10, fontSize: '1rem', cursor: activePromptIndex === 0 ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                >‹ Prev</button>
                <button
                  onClick={() => setActivePromptIndex(i => Math.min(prompts.length - 1, i + 1))}
                  disabled={activePromptIndex === prompts.length - 1}
                  style={{ background: 'none', border: `1px solid rgba(${config.colorRgb},.2)`, color: activePromptIndex === prompts.length - 1 ? `rgba(${config.colorRgb},.2)` : config.color, padding: '8px 20px', borderRadius: 10, fontSize: '1rem', cursor: activePromptIndex === prompts.length - 1 ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                >Next ›</button>
              </div>
            </div>

            {/* Mindset check-in */}
            <div style={{ marginBottom: 14, background: `radial-gradient(ellipse at 50% 0%, rgba(${config.colorRgb},.07) 0%, rgba(13,13,18,0) 65%)`, border: `1px solid rgba(${config.colorRgb},.2)`, borderRadius: 20, padding: '28px 24px', animation: `fadeUp .55s ease both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase', color: config.color, opacity: .75 }}>{tod === 'morning' ? '☀' : '☽'} Check-In</span>
                {msSaved && <span style={{ fontSize: '.85rem', color: '#4cc97a', marginLeft: 'auto' }}>✓ saved</span>}
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.35rem', color: 'rgba(236,232,224,.85)', fontStyle: 'italic', marginBottom: 18, lineHeight: 1.4 }}>
                {tod === 'morning' ? config.scoreMorningQ : config.scoreEveningQ}
              </p>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setMs(n)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit',
                    background: ms === n ? config.scoreColors[n] : 'rgba(255,255,255,.07)',
                    color: ms === n ? '#000' : 'rgba(236,232,224,.5)',
                    transform: ms === n ? 'scale(1.12)' : 'scale(1)', transition: 'all .15s',
                  }}>{n}</button>
                ))}
              </div>
              {ms > 0 && <p style={{ textAlign: 'center', fontSize: '1rem', color: config.scoreColors[ms], marginBottom: 10, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{config.scoreLabels[ms]}</p>}
              <textarea value={msNote} onChange={e => setMsNote(e.target.value)} placeholder="Why this score?" rows={1}
                style={{ width: '100%', background: 'rgba(13,13,18,.7)', border: `1px solid rgba(${config.colorRgb},.15)`, borderRadius: 12, padding: '12px 16px', color: '#ece8e0', fontSize: '1rem', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, outline: 'none', transition: 'border-color .2s ease' }}
                onFocus={e => e.target.style.borderColor = `rgba(${config.colorRgb},.45)`}
                onBlur={e => e.target.style.borderColor = `rgba(${config.colorRgb},.15)`}
              />
              {ms > 0 && (ms !== existingScore || msNote !== (entries[today]?.[noteKey] || "")) && (
                <button onClick={saveMindset} style={{ marginTop: 8, background: `rgba(${config.colorRgb},.14)`, border: `1px solid rgba(${config.colorRgb},.35)`, color: config.color, padding: '6px 16px', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              )}
              {tod === 'evening' && todayShift !== null && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: '.95rem', color: todayShift >= 0 ? '#4cc97a' : '#c96a4c', opacity: .8 }}>
                  Shift: {entries[today]?.ms_am} → {entries[today]?.ms_pm} ({todayShift >= 0 ? '+' : ''}{todayShift})
                </div>
              )}
            </div>
          </>
        )}

        {/* Entries view */}
        {view === 'entries' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1rem', color: config.color, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>{entryDates.length} {entryDates.length === 1 ? 'day' : 'days'} logged</h3>
                <span style={{ fontSize: '.9rem', color: `rgba(${config.colorRgb},.5)` }}>
                  {(() => {
                    const cal = getCalendarDays().filter(d => !d.isFuture);
                    const months = [...new Set(cal.map(d => new Date(d.date + 'T12:00:00').toLocaleDateString('en', { month: 'short' })))];
                    return months.join(' – ');
                  })()}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {['Su','M','T','W','Th','F','Sa'].map(l => (
                  <div key={l} style={{ textAlign: 'center', fontSize: '.85rem', color: `rgba(${config.colorRgb},.5)`, paddingBottom: 6, fontWeight: 600 }}>{l}</div>
                ))}
                {getCalendarDays().map((d, i) => (
                  <div key={i} onClick={() => !d.isFuture && d.hasData && setSelectedDate(selectedDate === d.date ? null : d.date)} style={{
                    aspectRatio: '1', borderRadius: 6, cursor: !d.isFuture && d.hasData ? 'pointer' : 'default',
                    background: d.isFuture ? 'transparent' : selectedDate === d.date ? `rgba(${config.colorRgb},.6)` : d.score ? `rgba(${d.score >= 7 ? '76,200,122' : d.score >= 4 ? config.colorRgb : '201,76,76'},${.15 + (d.score / 10) * .4})` : d.hasData ? `rgba(${config.colorRgb},.12)` : 'rgba(255,255,255,.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.9rem',
                    color: d.isFuture ? 'transparent' : selectedDate === d.date ? '#000' : (d.hasData || d.score) ? '#ece8e0' : 'rgba(236,232,224,.25)',
                    fontWeight: d.isToday ? 700 : 400,
                    border: d.isToday ? `2px solid rgba(${config.colorRgb},.7)` : '1px solid transparent',
                  }}>{d.isFuture ? '' : d.num}</div>
                ))}
              </div>
              <p style={{ fontSize: '.9rem', color: 'rgba(236,232,224,.35)', textAlign: 'center', marginBottom: 16 }}>Tap a day to view that entry</p>
            </div>
            {selectedDate
              ? <DayEntry dk={selectedDate} />
              : entryDates.length > 0
                ? entryDates.map(dk => <DayEntry key={dk} dk={dk} />)
                : <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.4)', textAlign: 'center', padding: 30 }}>No entries yet.</p>
            }
          </>
        )}

        {/* Trends view */}
        {view === 'trends' && (
          <>
            <div style={{ marginTop: 8, marginBottom: 22 }}>
              <h3 style={{ fontSize: '1rem', color: config.color, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>{config.trendTitle}</h3>
              {history.length >= 2 ? (
                <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '16px 12px 8px', border: `1px solid rgba(${config.colorRgb},.1)` }}>
                  <Sparkline data={history} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 0', fontSize: '.9rem', color: 'rgba(236,232,224,.4)' }}>
                    <span>{history[0].label}</span>
                    <span>{history.at(-1).label}</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.4)', textAlign: 'center', padding: 20 }}>
                  {history.length === 0 ? 'Log your first check-in to start tracking' : 'One more day to see your trend line'}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
              {[
                { n: avgScore, l: 'Avg Score' },
                { n: trend ? (Number(trend) >= 0 ? `+${trend}` : trend) : '—', l: '7d Trend', c: trend ? (Number(trend) >= 0 ? '#4cc97a' : '#c94c4c') : null },
                { n: streak.current, l: 'Streak' },
                { n: streak.longest, l: 'Best' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', background: `rgba(${config.colorRgb},.05)`, borderRadius: 10, padding: '12px 4px' }}>
                  <div style={{ fontSize: '1.5rem', color: s.c || config.color, fontWeight: 700 }}>{s.n}</div>
                  <div style={{ fontSize: '.85rem', color: 'rgba(236,232,224,.45)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {(() => {
              const shifts = Object.keys(entries).sort()
                .filter(k => entries[k]?.ms_am && entries[k]?.ms_pm)
                .map(k => ({ shift: entries[k].ms_pm - entries[k].ms_am, label: new Date(k + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) }));
              if (!shifts.length) return null;
              const avg = (shifts.reduce((a, s) => a + s.shift, 0) / shifts.length).toFixed(1);
              return (
                <div style={{ marginBottom: 22, background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '16px', border: `1px solid rgba(${config.colorRgb},.1)` }}>
                  <h3 style={{ fontSize: '1rem', color: config.color, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Daily Shift (AM → PM)</h3>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 44 }}>
                    {shifts.slice(-20).map((s, i) => (
                      <div key={i} title={`${s.label}: ${s.shift >= 0 ? '+' : ''}${s.shift}`} style={{ flex: 1, borderRadius: 3, height: `${Math.max(4, Math.abs(s.shift) * 8)}px`, background: s.shift >= 0 ? 'rgba(76,200,122,.55)' : 'rgba(201,76,76,.55)' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '.95rem', color: 'rgba(236,232,224,.5)', marginTop: 8, textAlign: 'center' }}>
                    Avg shift: <span style={{ color: Number(avg) >= 0 ? '#4cc97a' : '#c96a4c' }}>{Number(avg) >= 0 ? '+' : ''}{avg}</span>
                  </p>
                </div>
              );
            })()}

            <div>
              <h3 style={{ fontSize: '1rem', color: config.color, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Check-In Log</h3>
              {history.slice().reverse().slice(0, 10).map(h => (
                <div key={h.date} onClick={() => { setSelectedDate(h.date); setView('entries'); }} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8, padding: '10px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 10, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                    {h.am > 0 && <div style={{ width: 26, height: 26, borderRadius: 6, background: config.scoreColors[h.am], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#000' }}>{h.am}</div>}
                    {h.am > 0 && h.pm > 0 && <span style={{ fontSize: '.85rem', color: h.pm >= h.am ? '#4cc97a' : '#c96a4c' }}>→</span>}
                    {h.pm > 0 && <div style={{ width: 26, height: 26, borderRadius: 6, background: config.scoreColors[h.pm], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#000' }}>{h.pm}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.95rem', color: 'rgba(236,232,224,.55)', marginBottom: 3 }}>{h.label}</div>
                    {h.amNote && <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.7)', lineHeight: 1.4, margin: '0 0 2px' }}>☀ {h.amNote}</p>}
                    {h.pmNote && <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.7)', lineHeight: 1.4, margin: 0 }}>☽ {h.pmNote}</p>}
                  </div>
                  <span style={{ fontSize: '1.1rem', color: `rgba(${config.colorRgb},.3)`, marginTop: 4 }}>›</span>
                </div>
              ))}
              {!history.length && <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.35)', textAlign: 'center', padding: 16 }}>No entries yet</p>}
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button onClick={async () => { if (confirm('Clear all data for this journal? Cannot be undone.')) { await deleteAllEntries(config.id); setEntries({}); setMs(0); setMsNote(""); } }}
                style={{ background: 'none', border: '1px solid rgba(201,76,76,.2)', color: 'rgba(201,76,76,.4)', padding: '6px 16px', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Reset Journal Data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
