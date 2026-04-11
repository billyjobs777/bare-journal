import { useState, useEffect, useRef } from 'react'
import { loadAllEntries, saveEntry, deleteAllEntries, loadIntention, calcJourneyDay, calcWeekNumber, loadWeeklyReflection, saveWeeklyReflection, generateWeeklyReflection } from './db'
import { JOURNAL_CHAPTERS, STREAK_MILESTONES, getChapterNumber } from './journalConfigs'
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
const fmtDate = (ds) => new Date(ds + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });

export default function Journal({ onLogout, onBack, config, user, displayName, onNameUpdate, onOpenHelp, onOpenFAQ }) {
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
  const [carouselIndex, setCarouselIndex] = useState(0); // index into entryDates (0 = most recent)
  const [showCalendar, setShowCalendar] = useState(false);
  const [chapterIntroToShow, setChapterIntroToShow] = useState(null); // 1|2|3|null
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [streakBanner, setStreakBanner] = useState(null);
  const [weeklyReflection, setWeeklyReflection] = useState(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState(false);
  const letterLoadedRef = useRef(false);

  const today = dateKey();
  const isMonday = new Date().getDay() === 1;
  const loftyPool = intention?.generated_prompts?.loftyQuestions?.length >= 90
    ? intention.generated_prompts.loftyQuestions
    : config.loftyQuestions;
  const weeklyPool = intention?.generated_prompts?.weeklyPrompts?.length >= 13
    ? intention.generated_prompts.weeklyPrompts
    : config.weeklyPrompts;

  // Journey-relative prompt selection: Day 1 = index 0, Day 90 = index 89
  const journeyDay = intention?.created_at ? calcJourneyDay(intention.created_at) : 1;
  const weekNumber = calcWeekNumber(journeyDay);
  const loftyIndex = Math.min(Math.max(0, journeyDay - 1), loftyPool.length - 1);
  const todayLofty = loftyPool[loftyIndex];
  const thisWeekly = weeklyPool[weekNumber % weeklyPool.length];

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
    const resolvedIntention = intentionData || false;
    setIntention(resolvedIntention);
    const t = dateKey();
    const todTod = new Date().getHours() < 15 ? "morning" : "evening";
    const sk = todTod === "morning" ? "ms_am" : "ms_pm";
    const nk = todTod === "morning" ? "msn_am" : "msn_pm";
    if (data[t]?.[sk]) setMs(data[t][sk]);
    if (data[t]?.[nk]) setMsNote(data[t][nk]);

    // Chapter intro and celebration logic
    if (resolvedIntention && resolvedIntention.created_at) {
      const jDay = calcJourneyDay(resolvedIntention.created_at);
      const chNum = getChapterNumber(jDay);

      // Chapter 1 intro on first open
      if (jDay <= 2) {
        const key = `bj_chapter_seen_${user.id}_${config.id}_1`;
        if (!localStorage.getItem(key)) setChapterIntroToShow(1);
      }
      // Chapter 2 transition (Day 31+)
      if (jDay >= 31 && chNum === 2) {
        const key = `bj_chapter_seen_${user.id}_${config.id}_2`;
        if (!localStorage.getItem(key)) setChapterIntroToShow(2);
      }
      // Chapter 3 transition (Day 61+)
      if (jDay >= 61 && chNum === 3) {
        const key = `bj_chapter_seen_${user.id}_${config.id}_3`;
        if (!localStorage.getItem(key)) setChapterIntroToShow(3);
      }
      // Celebration at Day 90+
      if (jDay >= 90) {
        const celebKey = `bj_celebration_seen_${user.id}_${config.id}`;
        if (!localStorage.getItem(celebKey)) setCelebrationVisible(true);
      }
    }

    // Streak milestone check (compute directly from data, not from state)
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const has = (k) => data[k]?.ms_am || data[k]?.ms_pm;
    let d = new Date(), currentStreak = 0;
    if (has(fmt(d))) { currentStreak = 1; d.setDate(d.getDate() - 1); }
    else d.setDate(d.getDate() - 1);
    while (has(fmt(d))) { currentStreak++; d.setDate(d.getDate() - 1); }

    for (const m of [90, 60, 30, 21, 14, 7, 3]) {
      if (currentStreak >= m) {
        const key = `bj_streak_seen_${user.id}_${config.id}_${m}`;
        if (!localStorage.getItem(key)) {
          const found = STREAK_MILESTONES.find(s => s.days === m);
          if (found) setStreakBanner(found.message);
        }
        break;
      }
    }

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
    if (view === "entries") {
      setCarouselIndex(0);
      setSelectedDate(null);
      setShowCalendar(false);
    }
    if (view === "trends" && !letterLoadedRef.current && intention && intention !== false) {
      letterLoadedRef.current = true;
      loadWeeklyLetter();
    }
  }, [tod, entries, today, view]);

  const loadWeeklyLetter = async () => {
    if (reflectionLoading) return;
    setReflectionLoading(true);
    setReflectionError(false);

    // 1. Check DB for existing reflection this week
    const existing = await loadWeeklyReflection(config.id, weekNumber);
    if (existing) {
      setWeeklyReflection(existing);
      setReflectionLoading(false);
      return;
    }

    // 2. Build weekEntries from entries state
    const startOfJourney = new Date(intention.created_at);
    const startLocal = new Date(startOfJourney.getFullYear(), startOfJourney.getMonth(), startOfJourney.getDate());
    const weekStartJD = weekNumber * 7 + 1;
    const weekEndJD = weekNumber * 7 + 7;
    const weekEntries = [];
    for (let jd = weekStartJD; jd <= weekEndJD; jd++) {
      const d = new Date(startLocal.getTime() + (jd - 1) * 86400000);
      const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      weekEntries.push({ date: dk, ...(entries[dk] || {}) });
    }

    // 3. Only generate if there's at least 1 entry with a score
    const hasAnyData = weekEntries.some(e => e.ms_am || e.ms_pm);
    if (!hasAnyData) {
      setReflectionLoading(false);
      return;
    }

    // 4. Call AI (max once per week — DB caches the result)
    const result = await generateWeeklyReflection(
      config.id, intention.intention, journeyDay, weekEntries, thisWeekly
    );

    if (!result) {
      setReflectionError(true);
      setReflectionLoading(false);
      return;
    }

    // 5. Save to DB so future opens skip the AI call
    await saveWeeklyReflection(config.id, weekNumber, result.reflection_text, result.entries_count);
    setWeeklyReflection({ reflection_text: result.reflection_text, entries_count: result.entries_count });
    setReflectionLoading(false);
  };

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
    // Journey-relative lofty question for this past day
    const entryJourneyDay = intention?.created_at
      ? Math.max(1, Math.floor((new Date(dk + 'T12:00:00') - new Date(new Date(intention.created_at).toDateString())) / 86400000) + 1)
      : dayIndexForDate(dk) + 1;
    const loftyQ = loftyPool[Math.min(entryJourneyDay - 1, loftyPool.length - 1)];
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

      {/* Chapter intro modal — full-screen overlay */}
      {chapterIntroToShow && (() => {
        const ch = JOURNAL_CHAPTERS[config.id][chapterIntroToShow];
        const chNum = chapterIntroToShow;
        const dismiss = () => {
          localStorage.setItem(`bj_chapter_seen_${user.id}_${config.id}_${chNum}`, "1");
          setChapterIntroToShow(null);
        };
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: '#0d0d12',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            padding: '32px 28px', animation: 'fadeUp .6s ease both', overflowY: 'auto',
          }}>
            <div style={{ maxWidth: 480, width: '100%' }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(236,232,224,.3)', fontSize: '1rem', cursor: 'pointer', padding: '0 0 24px', fontFamily: "'Cormorant Garamond', Georgia, serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                ‹ All journals
              </button>
              <p style={{ fontSize: '.78rem', letterSpacing: '.16em', textTransform: 'uppercase', color: `rgba(${config.colorRgb},.5)`, marginBottom: 14, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Chapter {chNum} of 3
              </p>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '3rem', color: config.color, fontWeight: 600, margin: '0 0 6px', lineHeight: 1.1 }}>
                {ch.name}
              </h1>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem', fontStyle: 'italic', color: `rgba(${config.colorRgb},.45)`, margin: '0 0 36px' }}>
                {ch.days}
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.25rem', color: '#ece8e0', lineHeight: 1.8, margin: '0 0 24px' }}>
                {ch.opening}
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem', color: 'rgba(236,232,224,.5)', lineHeight: 1.75, margin: '0 0 32px', fontStyle: 'italic' }}>
                {ch.expectation}
              </p>
              <p style={{ fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase', color: `rgba(${config.colorRgb},.4)`, margin: '0 0 14px' }}>
                This chapter is yours to explore
              </p>
              <ul style={{ padding: 0, margin: '0 0 44px', listStyle: 'none' }}>
                {ch.goals.map((g, i) => (
                  <li key={i} style={{ display: 'flex', gap: 14, marginBottom: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: config.color, flexShrink: 0, marginTop: 4, opacity: .7 }}>✦</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem', color: 'rgba(236,232,224,.7)', lineHeight: 1.65 }}>{g}</span>
                  </li>
                ))}
              </ul>
              <button onClick={dismiss} style={{
                width: '100%', background: config.color, border: 'none', borderRadius: 14,
                padding: '16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#000',
                cursor: 'pointer', fontFamily: "'Cormorant Garamond', Georgia, serif",
                letterSpacing: '.06em',
              }}>
                {chNum === 1 ? 'Enter the ritual' : chNum === 2 ? 'Step into the next room' : 'Complete the journey'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Day 90 celebration overlay */}
      {celebrationVisible && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: '#0d0d12',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 28px', animation: 'fadeUp .6s ease both',
        }}>
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: config.color, marginBottom: 28, filter: `drop-shadow(0 0 24px rgba(${config.colorRgb},.7))` }}>✦</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '2.8rem', color: config.color, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.1 }}>
              Ninety Days.
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.3rem', fontStyle: 'italic', color: 'rgba(236,232,224,.7)', margin: '0 0 24px', lineHeight: 1.75 }}>
              You showed up. Day after day, you came back to these pages. That is not a small thing.
            </p>
            <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.4)', lineHeight: 1.75, margin: '0 0 48px', fontStyle: 'italic' }}>
              The practice doesn't end here — it becomes part of you. Keep writing. Keep showing up.
            </p>
            <button onClick={() => {
              localStorage.setItem(`bj_celebration_seen_${user.id}_${config.id}`, "1");
              setCelebrationVisible(false);
            }} style={{
              background: config.color, border: 'none', borderRadius: 14, padding: '14px 40px',
              fontSize: '1rem', fontWeight: 700, color: '#000', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Continue the practice ›
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{ padding: '20px 20px 0', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(236,232,224,.35)', fontSize: '1rem', cursor: 'pointer', padding: '0 0 6px', fontFamily: "'Cormorant Garamond', Georgia, serif", display: 'flex', alignItems: 'center', gap: 4 }}>
              ‹ All journals
            </button>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem', color: config.color, letterSpacing: '.02em', fontWeight: 600, margin: 0 }}>{config.name}</h1>
            <p style={{ fontSize: '.9rem', color: 'rgba(236,232,224,.35)', margin: '3px 0 0' }}>
              {intention?.created_at
                ? `Chapter ${getChapterNumber(journeyDay)}: ${JOURNAL_CHAPTERS[config.id][getChapterNumber(journeyDay)].name} · Day ${journeyDay}`
                : `Day ${Math.max(1, Object.keys(entries).length)} of 90`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <ProfileMenu user={user} displayName={displayName} onNameUpdate={onNameUpdate} onLogout={onLogout} onOpenHelp={onOpenHelp} onOpenFAQ={onOpenFAQ} accentColor={config.color} accentRgb={config.colorRgb} />
          </div>
        </div>

        {/* Nav — icon row + inline morning/evening toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          {/* View icons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'journal', icon: '✎', title: 'Today' },
              { id: 'entries', icon: '◎', title: 'Pages' },
              { id: 'trends', icon: '◈', title: 'Weekly Letter' },
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
            {/* Streak milestone banner */}
            {streakBanner && (
              <div
                onClick={() => {
                  const m = STREAK_MILESTONES.find(s => s.message === streakBanner);
                  if (m) localStorage.setItem(`bj_streak_seen_${user.id}_${config.id}_${m.days}`, "1");
                  setStreakBanner(null);
                }}
                style={{
                  marginBottom: 16,
                  background: `rgba(${config.colorRgb},.06)`,
                  border: `1px solid rgba(${config.colorRgb},.2)`,
                  borderRadius: 14, padding: '16px 20px',
                  cursor: 'pointer', animation: 'fadeUp .4s ease both',
                }}
              >
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.15rem', fontStyle: 'italic',
                  color: config.color, margin: 0, lineHeight: 1.6,
                }}>
                  {streakBanner}
                </p>
                <p style={{ fontSize: '.8rem', color: `rgba(${config.colorRgb},.4)`, margin: '6px 0 0' }}>Tap to continue</p>
              </div>
            )}

            {/* Prompt card navigator — Pulse is the final slide */}
            {(() => {
              const allPrompts = [...prompts, { id: '__pulse__', isPulse: true }];
              const lastIdx = allPrompts.length - 1;
              return (
                <div style={{ marginBottom: 20 }}>
                  {/* Progress dots */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
                    {allPrompts.map((p, i) => (
                      <button key={i} onClick={() => setActivePromptIndex(i)} style={{
                        width: i === activePromptIndex ? 22 : 6,
                        height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                        background: i === activePromptIndex ? config.color : `rgba(${config.colorRgb},.25)`,
                        transition: 'all .35s ease', padding: 0,
                      }} />
                    ))}
                  </div>

                  {/* Active card */}
                  {allPrompts.map((p, idx) => {
                    if (idx !== activePromptIndex) return null;

                    // — Pulse card (last slide) —
                    if (p.isPulse) return (
                      <div key="__pulse__" style={{
                        background: `radial-gradient(ellipse at 50% 0%, rgba(${config.colorRgb},.07) 0%, rgba(13,13,18,0) 65%)`,
                        border: `1px solid rgba(${config.colorRgb},.2)`,
                        borderRadius: 20, padding: '32px 24px 24px',
                        minHeight: 280, animation: 'fadeUp .5s ease both',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                          <span style={{ fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase', color: config.color, opacity: .75 }}>
                            {tod === 'morning' ? '☀' : '☽'} Pulse
                          </span>
                          {msSaved && <span style={{ fontSize: '.85rem', color: '#4cc97a', marginLeft: 'auto' }}>✓ saved</span>}
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.35rem', color: 'rgba(236,232,224,.85)', fontStyle: 'italic', marginBottom: 22, lineHeight: 1.45 }}>
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
                        {ms > 0 && <p style={{ textAlign: 'center', fontSize: '1rem', color: config.scoreColors[ms], margin: '8px 0 12px', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{config.scoreLabels[ms]}</p>}
                        <textarea value={msNote} onChange={e => setMsNote(e.target.value)} placeholder="A word or two about this…" rows={1}
                          style={{ width: '100%', background: 'rgba(13,13,18,.7)', border: `1px solid rgba(${config.colorRgb},.15)`, borderRadius: 12, padding: '12px 16px', color: '#ece8e0', fontSize: '1rem', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, outline: 'none', transition: 'border-color .2s ease' }}
                          onFocus={e => e.target.style.borderColor = `rgba(${config.colorRgb},.45)`}
                          onBlur={e => e.target.style.borderColor = `rgba(${config.colorRgb},.15)`}
                        />
                        {ms > 0 && (ms !== existingScore || msNote !== (entries[today]?.[noteKey] || "")) && (
                          <button onClick={saveMindset} style={{ marginTop: 10, background: `rgba(${config.colorRgb},.14)`, border: `1px solid rgba(${config.colorRgb},.35)`, color: config.color, padding: '6px 18px', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                        )}
                        {tod === 'evening' && todayShift !== null && (
                          <div style={{ marginTop: 12, textAlign: 'center', fontSize: '.9rem', color: `rgba(${config.colorRgb},.5)`, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}>
                            {entries[today]?.ms_am} {todayShift >= 0 ? '↑' : '↓'} {entries[today]?.ms_pm} — {todayShift >= 0 ? 'lifted' : 'softened'} through the day
                          </div>
                        )}
                      </div>
                    );

                    // — Regular prompt card —
                    const existing = entries[today]?.[p.id] || '';
                    const draft = drafts[p.id] ?? existing;
                    return (
                      <div key={p.id} style={{
                        background: `radial-gradient(ellipse at 50% 0%, rgba(${config.colorRgb},.08) 0%, rgba(13,13,18,0) 65%)`,
                        border: `1px solid rgba(${config.colorRgb},.2)`,
                        borderRadius: 20, padding: '32px 24px 24px',
                        minHeight: 280, animation: 'fadeUp .5s ease both',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                          <span style={{ fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase', color: p.color, opacity: .75 }}>{p.label}</span>
                          {p.weekly && <span style={{ fontSize: '.75rem', background: 'rgba(201,76,110,.15)', color: '#c94c6e', padding: '2px 8px', borderRadius: 10 }}>WEEKLY</span>}
                          {saved[p.id] && <span style={{ fontSize: '.85rem', color: '#4cc97a', marginLeft: 'auto' }}>✓ saved</span>}
                        </div>
                        <p style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: p.isQuestion ? '1.55rem' : '1.4rem',
                          fontWeight: p.isQuestion ? 600 : 400,
                          fontStyle: p.isQuestion ? 'italic' : 'normal',
                          color: p.isQuestion ? p.color : '#ece8e0',
                          lineHeight: 1.45, margin: '0 0 16px', whiteSpace: 'pre-line',
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
                                <button onClick={() => { saveField(p.id, draft); setActivePromptIndex(i => Math.min(lastIdx, i + 1)); }} style={{ background: `rgba(${config.colorRgb},.12)`, border: `1px solid rgba(${config.colorRgb},.3)`, color: config.color, padding: '8px 22px', borderRadius: 10, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>Save →</button>
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
                      onClick={() => setActivePromptIndex(i => Math.min(lastIdx, i + 1))}
                      disabled={activePromptIndex === lastIdx}
                      style={{ background: 'none', border: `1px solid rgba(${config.colorRgb},.2)`, color: activePromptIndex === lastIdx ? `rgba(${config.colorRgb},.2)` : config.color, padding: '8px 20px', borderRadius: 10, fontSize: '1rem', cursor: activePromptIndex === lastIdx ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                    >Next ›</button>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Pages view */}
        {view === 'entries' && (() => {
          const currentDk = selectedDate || entryDates[carouselIndex];
          const currentIdx = selectedDate ? entryDates.indexOf(selectedDate) : carouselIndex;
          const navigate = (dk) => {
            const idx = entryDates.indexOf(dk);
            if (idx >= 0) { setCarouselIndex(idx); setSelectedDate(dk); }
          };
          return (
            <>
              {/* Calendar toggle */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCalendar ? 12 : 0 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '.95rem', fontStyle: 'italic', color: `rgba(${config.colorRgb},.4)`, margin: 0 }}>
                    {entryDates.length === 0 ? "Your pages will gather here." : entryDates.length === 1 ? "One page written." : `${entryDates.length} pages in this journey.`}
                  </p>
                  <button onClick={() => setShowCalendar(v => !v)} title="Jump to date" style={{
                    background: showCalendar ? `rgba(${config.colorRgb},.15)` : 'none',
                    border: `1px solid rgba(${config.colorRgb},.2)`,
                    borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
                    color: showCalendar ? config.color : `rgba(${config.colorRgb},.5)`,
                    fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s', flexShrink: 0,
                  }}>▦</button>
                </div>

                {showCalendar && (
                  <div style={{ animation: 'fadeUp .25s ease both' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                      {['Su','M','T','W','Th','F','Sa'].map(l => (
                        <div key={l} style={{ textAlign: 'center', fontSize: '.78rem', color: `rgba(${config.colorRgb},.4)`, paddingBottom: 6, fontWeight: 600, letterSpacing: '.06em' }}>{l}</div>
                      ))}
                      {getCalendarDays().map((d, i) => {
                        const isActive = d.date === currentDk;
                        return (
                          <div key={i} onClick={() => { if (!d.isFuture && d.hasData) { navigate(d.date); setShowCalendar(false); } }} style={{
                            aspectRatio: '1', borderRadius: 6,
                            cursor: !d.isFuture && d.hasData ? 'pointer' : 'default',
                            background: d.isFuture ? 'transparent'
                              : isActive ? config.color
                              : d.score ? `rgba(${d.score >= 7 ? '76,200,122' : d.score >= 4 ? config.colorRgb : '201,76,76'},${.12 + (d.score / 10) * .35})`
                              : d.hasData ? `rgba(${config.colorRgb},.12)`
                              : 'rgba(255,255,255,.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '.85rem',
                            color: d.isFuture ? 'transparent' : isActive ? '#000' : (d.hasData || d.score) ? '#ece8e0' : 'rgba(236,232,224,.2)',
                            fontWeight: d.isToday ? 700 : 400,
                            border: d.isToday && !isActive ? `1px solid rgba(${config.colorRgb},.5)` : '1px solid transparent',
                            transition: 'background .15s',
                          }}>{d.isFuture ? '' : d.num}</div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Entry carousel */}
              {entryDates.length === 0 ? (
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(236,232,224,.3)', textAlign: 'center', padding: '40px 20px', lineHeight: 1.7 }}>
                  Begin today, and your first page will live here.
                </p>
              ) : (
                <>
                  {/* Carousel navigation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <button
                      onClick={() => { const next = Math.min(entryDates.length - 1, currentIdx + 1); setCarouselIndex(next); setSelectedDate(entryDates[next]); }}
                      disabled={currentIdx >= entryDates.length - 1}
                      style={{ background: 'none', border: `1px solid rgba(${config.colorRgb},.2)`, color: currentIdx >= entryDates.length - 1 ? `rgba(${config.colorRgb},.15)` : config.color, padding: '7px 16px', borderRadius: 10, fontSize: '1rem', cursor: currentIdx >= entryDates.length - 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}
                    >‹ Earlier</button>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '.9rem', color: `rgba(${config.colorRgb},.4)`, fontStyle: 'italic' }}>
                      {currentIdx + 1} of {entryDates.length}
                    </span>
                    <button
                      onClick={() => { const prev = Math.max(0, currentIdx - 1); setCarouselIndex(prev); setSelectedDate(entryDates[prev]); }}
                      disabled={currentIdx <= 0}
                      style={{ background: 'none', border: `1px solid rgba(${config.colorRgb},.2)`, color: currentIdx <= 0 ? `rgba(${config.colorRgb},.15)` : config.color, padding: '7px 16px', borderRadius: 10, fontSize: '1rem', cursor: currentIdx <= 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}
                    >Later ›</button>
                  </div>

                  {currentDk && <DayEntry dk={currentDk} key={currentDk} />}
                </>
              )}
            </>
          );
        })()}

        {/* Weekly Letter view */}
        {view === 'trends' && (
          <div style={{ marginTop: 8 }}>
            {/* Context */}
            <p style={{ fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase', color: `rgba(${config.colorRgb},.4)`, marginBottom: 4 }}>
              Week {weekNumber + 1} of your journey
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '.95rem', fontStyle: 'italic', color: `rgba(${config.colorRgb},.5)`, marginBottom: 32 }}>
              Chapter {getChapterNumber(journeyDay)}: {JOURNAL_CHAPTERS[config.id][getChapterNumber(journeyDay)].name} · Day {journeyDay}
            </p>

            {/* Loading */}
            {reflectionLoading && (
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', color: `rgba(${config.colorRgb},.45)`, fontSize: '1.1rem', textAlign: 'center', padding: 40 }}>
                Reading your week…
              </p>
            )}

            {/* No entries yet this week */}
            {!reflectionLoading && !weeklyReflection && !reflectionError && (
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', color: 'rgba(236,232,224,.35)', fontSize: '1.1rem', textAlign: 'center', padding: '40px 20px', lineHeight: 1.7 }}>
                Your weekly letter will appear after your first check-in this week.
              </p>
            )}

            {/* Error */}
            {reflectionError && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'rgba(236,232,224,.35)', marginBottom: 16, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}>
                  Couldn't reach the letter writer just now.
                </p>
                <button onClick={() => { letterLoadedRef.current = false; loadWeeklyLetter(); }} style={{
                  background: 'none', border: `1px solid rgba(${config.colorRgb},.25)`,
                  color: config.color, padding: '8px 20px', borderRadius: 10,
                  fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>Try again</button>
              </div>
            )}

            {/* The letter */}
            {weeklyReflection && (
              <>
                {/* Attendance — poetic, never a raw number */}
                <div style={{ marginBottom: 24, padding: '0 4px' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem', color: `rgba(${config.colorRgb},.55)`, fontStyle: 'italic', margin: 0, lineHeight: 1.7 }}>
                    {weeklyReflection.entries_count === 7
                      ? "You showed up every day this week."
                      : weeklyReflection.entries_count === 6
                      ? "Six of seven days, you came back."
                      : weeklyReflection.entries_count >= 4
                      ? `${weeklyReflection.entries_count === 5 ? 'Five' : 'Four'} days this week, you came back to yourself.`
                      : weeklyReflection.entries_count === 3
                      ? "Three days this week, you chose to return."
                      : weeklyReflection.entries_count === 2
                      ? "Twice this week, you found your way back."
                      : weeklyReflection.entries_count === 1
                      ? "Once this week, you chose to return. That counts."
                      : "A quiet week. The practice remains."}
                  </p>
                </div>

                {/* Letter card */}
                <div style={{
                  background: `radial-gradient(ellipse at 50% 0%, rgba(${config.colorRgb},.07) 0%, rgba(13,13,18,0) 70%)`,
                  border: `1px solid rgba(${config.colorRgb},.15)`,
                  borderRadius: 20, padding: '32px 28px',
                  animation: 'fadeUp .5s ease both', marginBottom: 20,
                }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.35rem', fontStyle: 'italic', color: '#ece8e0', lineHeight: 1.75, margin: 0 }}>
                    {weeklyReflection.reflection_text}
                  </p>
                </div>

                {/* This week's reflection prompt */}
                {thisWeekly && (
                  <div style={{ marginBottom: 32, padding: '16px 20px', background: 'rgba(255,255,255,.03)', borderRadius: 12, border: `1px solid rgba(${config.colorRgb},.08)` }}>
                    <p style={{ fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase', color: `rgba(${config.colorRgb},.4)`, margin: '0 0 8px' }}>This week's reflection</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1rem', color: 'rgba(236,232,224,.55)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                      {thisWeekly}
                    </p>
                  </div>
                )}
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: weeklyReflection ? 8 : 40 }}>
              <button onClick={async () => { if (confirm('Clear all data for this journal? Cannot be undone.')) { await deleteAllEntries(config.id); setEntries({}); setMs(0); setMsNote(""); setWeeklyReflection(null); letterLoadedRef.current = false; } }}
                style={{ background: 'none', border: '1px solid rgba(201,76,76,.2)', color: 'rgba(201,76,76,.4)', padding: '6px 16px', borderRadius: 8, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Reset Journal Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
