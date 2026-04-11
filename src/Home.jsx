import { useState, useEffect, useRef } from 'react'
import { JOURNALS } from './journalConfigs'
import { loadAllEntriesForJournals, calcStreakFromEntries } from './db'
import ProfileMenu from './ProfileMenu'

const SERIF = "'Cormorant Garamond', Georgia, serif"

const MORNING_LINES = [
  "The morning is yours. Where will you begin?",
  "A new page. What truth will you meet today?",
  "The day opens, quiet and ready.",
  "Begin before the world asks anything of you.",
  "Something waits to be written. Come.",
  "Before the noise starts — a few honest words.",
  "What would you write if no one was watching?",
  "Your thoughts deserve a home. Give them one.",
  "The page is patient. It will wait for you.",
  "What are you carrying today that needs a name?",
  "Clarity lives on the other side of writing.",
  "The pen doesn't judge. Neither does this page.",
  "What did you notice this morning that you almost let pass?",
  "One true sentence. That's all it takes to begin.",
  "You don't have to have it figured out. Write anyway.",
  "This is your quiet before the day's noise.",
  "What's asking for your attention right now?",
  "Let the morning speak through you.",
  "Something is ready to surface. Let it.",
  "Today hasn't been written yet. That's the point.",
  "What does the truest version of you want to say?",
  "You came back. That matters. Now write.",
  "Not every thought needs to be polished. Just real.",
  "What would you say if you had to be honest?",
  "The act of writing is the act of knowing yourself.",
  "What's already shifting inside you, even now?",
  "Words are the bridge between feeling and understanding.",
  "Don't wait to be inspired. Begin and inspiration follows.",
  "What deserves your attention before anything else today?",
  "The morning asks nothing of you but presence.",
  "What would make today feel like it mattered?",
  "Resistance is just energy without direction. Write.",
  "Even three sentences can change the shape of a day.",
  "You already know what you need to say.",
  "What are you grateful for that you've never written down?",
  "This is the part where you get honest.",
  "Your inner world is worth visiting.",
  "The quietest voice in you has something important to say.",
  "What would you regret not writing down?",
  "A few minutes here can anchor an entire day.",
  "What truth is hiding just below the surface?",
  "You don't journal to remember. You journal to see.",
  "Let your guard down. Just for these few lines.",
  "What does this morning feel like, really?",
  "Begin anywhere. The page will catch you.",
  "Nothing is too small to notice. Write it.",
  "What question have you been avoiding?",
  "Showing up here is already the hardest part.",
  "The version of you on the other side of this entry is clearer.",
  "Write what you'd never say out loud.",
]

const EVENING_LINES = [
  "The day has asked much of you. What remains?",
  "Let the evening be honest with you.",
  "Come back to yourself. What did today teach?",
  "The night holds space for what the day could not.",
  "Rest is not the end. It is the next beginning.",
  "What did you almost miss today?",
  "Before you close the day — what's still open?",
  "The quiet after a long day asks: how are you, really?",
  "You made it. Now let's look at what that meant.",
  "What moment from today is worth keeping?",
  "What would you do differently? No shame — just learning.",
  "Let the day finish the way it deserves: with reflection.",
  "Something shifted today. Name it.",
  "Gratitude looks clearest in the evening light.",
  "What surprised you about yourself today?",
  "The day is closing. What does it owe you?",
  "Not every day is remarkable. But every day is writable.",
  "What conversation is still running in your mind?",
  "The evening belongs to you. Use it honestly.",
  "What are you releasing before sleep?",
  "Today had a texture. What was it?",
  "What did your body tell you that your mind ignored?",
  "Who needed you today — and were you there?",
  "What did you learn that you won't forget?",
  "You were somewhere today. Now be here.",
  "What would tomorrow-you want tonight-you to write?",
  "The day is asking: were you present?",
  "Even on ordinary days, something extraordinary happens.",
  "What do you want to remember about today?",
  "The stillness after a full day is a gift. Write in it.",
  "What fear showed up today, and what did you do with it?",
  "What were you proud of, even quietly?",
  "What began today that needs more time?",
  "The best endings are honest ones.",
  "There's wisdom in what tired you today.",
  "Name one thing today tried to teach you.",
  "What went unsaid that deserved to be heard?",
  "Come back to the feeling you had at 7am. What's changed?",
  "You lived today. Make it count by understanding it.",
  "What does the most honest version of today look like?",
  "Write the version of today you'd want to remember.",
  "The night is wide. Bring what you're carrying.",
  "Before rest — a reckoning. What was today, really?",
  "What intention did you carry into today? Did you keep it?",
  "Whatever happened today, you're still here. Write from there.",
  "What lit you up today, even briefly?",
  "Evening is the hour of truth. Speak it here.",
  "What are you taking into tomorrow that doesn't belong there?",
  "The page holds what memory tends to blur.",
  "Today mattered. Let's figure out exactly how.",
]

function getGreeting(randomIndex, name) {
  const h = new Date().getHours()
  const base = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const salutation = name ? `${base}, ${name.split(' ')[0]}.` : base
  const lines = h < 18 ? MORNING_LINES : EVENING_LINES
  return { salutation, poetic: lines[randomIndex % lines.length] }
}

function streakGlow(streak, colorRgb) {
  if (streak <= 0) return {}
  const blur = Math.min(14, 4 + streak * 0.7)
  const opacity = Math.min(1, 0.5 + streak * 0.04)
  return { filter: `drop-shadow(0 0 ${blur}px rgba(${colorRgb},${opacity}))` }
}

function JournalCard({ journal: j, streak, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => !j.comingSoon && onSelect(j.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 220,
        minHeight: 300,
        flexShrink: 0,
        background: `radial-gradient(ellipse 160% 80% at 80% -15%, rgba(${j.colorRgb},.28) 0%, transparent 60%), #0d0d12`,
        border: `1px solid rgba(${j.colorRgb}, ${hovered && !j.comingSoon ? '.42' : '.22'})`,
        borderRadius: 20,
        padding: '28px 24px',
        cursor: j.comingSoon ? 'default' : 'pointer',
        opacity: j.comingSoon ? .4 : 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transform: hovered && !j.comingSoon ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'transform .35s ease, border-color .3s ease',
        userSelect: 'none',
      }}
    >
      {/* Top: icon + name */}
      <div>
        <div style={{ fontSize: '2rem', color: j.color, marginBottom: 14 }}>{j.icon}</div>
        <h2 style={{
          fontFamily: SERIF,
          fontSize: '1.3rem',
          fontWeight: 600,
          color: '#ece8e0',
          margin: '0 0 8px',
          lineHeight: 1.2,
        }}>{j.name}</h2>
        <p style={{
          fontFamily: SERIF,
          fontSize: '1rem',
          fontStyle: 'italic',
          color: `rgba(${j.colorRgb},.65)`,
          margin: 0,
          lineHeight: 1.4,
        }}>{j.tagline}</p>
      </div>

      {/* Bottom: streak or CTA */}
      <div style={{ marginTop: 24 }}>
        {j.comingSoon ? (
          <span style={{ fontSize: '.8rem', color: j.color, opacity: .6, letterSpacing: '.1em', textTransform: 'uppercase' }}>Coming soon</span>
        ) : streak > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem', color: j.color, ...streakGlow(streak, j.colorRgb) }}>✦</span>
            <span style={{ fontFamily: SERIF, fontSize: '1.05rem', color: j.color }}>{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
        ) : (
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '.95rem', color: `rgba(${j.colorRgb},.5)` }}>Begin your practice</span>
        )}
      </div>
    </div>
  )
}

function getCardSizes(width) {
  if (width >= 1200) return { cardW: 340, cardH: 380, gap: 28, padding: '36px 32px', iconSize: '2.5rem', titleSize: '1.65rem', taglineSize: '1.15rem', streakSize: '1.15rem', carouselH: 430 }
  if (width >= 768)  return { cardW: 295, cardH: 340, gap: 24, padding: '32px 28px', iconSize: '2.2rem',  titleSize: '1.45rem', taglineSize: '1.05rem', streakSize: '1.1rem',  carouselH: 385 }
  return                     { cardW: 260, cardH: 300, gap: 20, padding: '28px 24px', iconSize: '1.8rem',  titleSize: '1.3rem',  taglineSize: '1rem',    streakSize: '1.05rem', carouselH: 340 }
}

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])
  return width
}

export default function Home({ onSelect, onLogout, user, displayName, onNameUpdate, onOpenHelp, onOpenFAQ }) {
  const windowWidth = useWindowWidth()
  const sz = getCardSizes(windowWidth)
  const STEP = sz.cardW + sz.gap

  const allJournals = Object.values(JOURNALS)
  const MID = Math.floor(allJournals.length / 2) // 2 for 5 journals
  const [journals, setJournals] = useState(allJournals)
  const [journalEntries, setJournalEntries] = useState({})
  const [loadingStreaks, setLoadingStreaks] = useState(true)
  const [greetingIndex] = useState(() => Math.floor(Math.random() * 50))
  const [activeIndex, setActiveIndex] = useState(MID)
  const touchStartX = useRef(null)
  const greeting = getGreeting(greetingIndex, displayName)

  useEffect(() => {
    const ids = allJournals.map(j => j.id)
    loadAllEntriesForJournals(ids).then(map => {
      setJournalEntries(map)
      setLoadingStreaks(false)
      // Find the most-used journal
      let mostUsed = allJournals.reduce((best, j) =>
        Object.keys(map[j.id] || {}).length > Object.keys(map[best.id] || {}).length ? j : best
      , allJournals[0])
      // Reorder: place most-used at the center slot, others fill around it
      const others = allJournals.filter(j => j.id !== mostUsed.id)
      const left = others.slice(0, MID)
      const right = others.slice(MID)
      setJournals([...left, mostUsed, ...right])
      setActiveIndex(MID)
    })
  }, [])

  const prev = () => setActiveIndex(i => Math.max(0, i - 1))
  const next = () => setActiveIndex(i => Math.min(journals.length - 1, i + 1))

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -40) next()
    else if (dx > 40) prev()
    touchStartX.current = null
  }

  // total days practiced across all journals
  const allDates = new Set()
  journals.forEach(j => Object.keys(journalEntries[j.id] || {}).forEach(d => allDates.add(d)))
  const totalDays = allDates.size

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d12', position: 'relative', overflow: 'hidden' }}>

      {/* Profile — top right */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ProfileMenu user={user} displayName={displayName} onNameUpdate={onNameUpdate} onLogout={onLogout} onOpenHelp={onOpenHelp} onOpenFAQ={onOpenFAQ} />
      </div>

      {/* Greeting */}
      <div style={{
        padding: windowWidth >= 1200 ? '80px 48px 44px' : windowWidth >= 768 ? '72px 36px 40px' : '64px 28px 36px',
        maxWidth: windowWidth >= 1200 ? 860 : windowWidth >= 768 ? 700 : 560,
        margin: '0 auto',
      }}>
        <p style={{
          fontFamily: SERIF,
          fontSize: windowWidth >= 1200 ? '1.05rem' : windowWidth >= 768 ? '.95rem' : '.85rem',
          letterSpacing: '.14em',
          textTransform: 'uppercase', color: 'rgba(236,232,224,.4)', margin: '0 0 12px',
        }}>
          {greeting.salutation}
        </p>
        <h1 style={{
          fontFamily: SERIF,
          fontSize: windowWidth >= 1200 ? '3.6rem' : windowWidth >= 768 ? '3rem' : '2.1rem',
          fontWeight: 600,
          color: '#ece8e0', margin: 0, lineHeight: 1.2,
          maxWidth: windowWidth >= 1200 ? 680 : windowWidth >= 768 ? 520 : 360,
          animation: 'fadeUp .6s ease both',
        }}>
          {greeting.poetic}
        </h1>
      </div>

      {/* Carousel */}
      <div
        style={{ position: 'relative', height: sz.carouselH, userSelect: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track — centered on activeIndex */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center',
          transform: `translateX(calc(50vw - ${sz.cardW / 2 + activeIndex * STEP}px))`,
          transition: 'transform .45s cubic-bezier(.4,0,.2,1)',
          gap: sz.gap,
          paddingLeft: 0,
        }}>
          {journals.map((j, i) => {
            const dist = Math.abs(i - activeIndex)
            const isActive = i === activeIndex
            const streak = calcStreakFromEntries(journalEntries[j.id] || {})
            return (
              <div
                key={j.id}
                onClick={() => isActive ? onSelect(j.id) : setActiveIndex(i)}
                style={{
                  width: sz.cardW,
                  minHeight: sz.cardH,
                  flexShrink: 0,
                  background: `radial-gradient(ellipse 160% 80% at 80% -15%, rgba(${j.colorRgb},.28) 0%, transparent 60%), #0d0d12`,
                  border: `1px solid rgba(${j.colorRgb}, ${isActive ? '.35' : '.14'})`,
                  borderRadius: 20,
                  padding: sz.padding,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  opacity: dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2,
                  transform: `scale(${isActive ? 1 : 0.91})`,
                  transition: 'opacity .4s ease, transform .4s ease, border-color .3s ease',
                  boxShadow: isActive ? `0 0 40px rgba(${j.colorRgb},.08)` : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: sz.iconSize, color: j.color, marginBottom: 14 }}>{j.icon}</div>
                  <h2 style={{ fontFamily: SERIF, fontSize: sz.titleSize, fontWeight: 600, color: '#ece8e0', margin: '0 0 8px', lineHeight: 1.2 }}>{j.name}</h2>
                  <p style={{ fontFamily: SERIF, fontSize: sz.taglineSize, fontStyle: 'italic', color: `rgba(${j.colorRgb},.65)`, margin: 0, lineHeight: 1.4 }}>{j.tagline}</p>
                </div>
                <div style={{ marginTop: 24 }}>
                  {streak > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: sz.streakSize, color: j.color, ...streakGlow(streak, j.colorRgb) }}>✦</span>
                      <span style={{ fontFamily: SERIF, fontSize: sz.streakSize, color: j.color }}>{streak} day{streak !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: sz.taglineSize, color: `rgba(${j.colorRgb},.5)` }}>Begin your practice</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 20 }}>
        {journals.map((j, i) => (
          <button key={i} onClick={() => setActiveIndex(i)} style={{
            width: i === activeIndex ? 20 : 6, height: 6, borderRadius: 3,
            border: 'none', padding: 0, cursor: 'pointer',
            background: i === activeIndex ? journals[activeIndex].color : 'rgba(236,232,224,.18)',
            transition: 'all .35s ease',
          }} />
        ))}
      </div>

      {/* Open button for active card */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button
          onClick={() => onSelect(journals[activeIndex].id)}
          style={{
            fontFamily: SERIF,
            fontSize: windowWidth >= 1200 ? '1.2rem' : windowWidth >= 768 ? '1.12rem' : '1.05rem',
            fontStyle: 'italic',
            background: 'none', border: `1px solid rgba(${journals[activeIndex].colorRgb},.3)`,
            color: journals[activeIndex].color,
            padding: windowWidth >= 1200 ? '12px 40px' : windowWidth >= 768 ? '11px 36px' : '10px 32px',
            borderRadius: 24, cursor: 'pointer',
            transition: 'all .3s ease',
            letterSpacing: '.02em',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `rgba(${journals[activeIndex].colorRgb},.1)`}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          Open journal ›
        </button>
      </div>

      {/* Practice count */}
      {!loadingStreaks && (
        <p style={{
          fontFamily: SERIF, fontStyle: 'italic',
          fontSize: windowWidth >= 1200 ? '1.1rem' : '1rem',
          color: 'rgba(236,232,224,.3)', textAlign: 'center',
          marginTop: 28, paddingBottom: 48,
        }}>
          {totalDays > 0 ? `${totalDays} ${totalDays === 1 ? 'day' : 'days'} of practice.` : 'Your practice awaits.'}
        </p>
      )}

    </div>
  )
}
