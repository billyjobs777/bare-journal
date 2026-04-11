import { useState } from 'react'

const SERIF = "'Cormorant Garamond', Georgia, serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

const SECTIONS = [
  {
    id: 'overview',
    title: 'What is Bare Journal?',
    icon: '◈',
    content: `Bare Journal is a guided 90-day journaling practice designed to help you develop lasting clarity, intention, and self-awareness. Rather than an open-ended blank page, Bare Journal gives you thoughtful, AI-personalized prompts that evolve with you across your journey.

Each journal is organized around a 90-day arc divided into three chapters — Awareness, Action, and Manifestation — with prompts and themes that deepen week by week. You set a personal intention at the start, and everything that follows is shaped around it.

You can run multiple journals simultaneously. Each one tracks its own 90-day journey, streak, and weekly reflections.`,
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '◇',
    steps: [
      { label: 'Sign in', text: 'Use your email address to receive a magic link — no password needed.' },
      { label: 'Choose a journal', text: 'From the home screen, select one of the five journal types: Wealth, Health, Motivational, Gratitude, or Creativity.' },
      { label: 'Set your intention', text: 'Write a meaningful intention for your 90-day journey in that journal. This shapes all the prompts you will receive.' },
      { label: 'Start writing', text: 'Open the journal each morning or evening and respond to your daily prompts. That\'s it — you\'ve begun.' },
    ],
  },
  {
    id: 'journals',
    title: 'The Five Journals',
    icon: '◉',
    journals: [
      { name: 'Wealth Journal', color: '#f0c040', desc: 'Focus on financial clarity, abundance mindset, and your relationship with money and value.' },
      { name: 'Health Journal', color: '#7ecba1', desc: 'Tend to your body, energy, sleep, movement, and the rituals that sustain vitality.' },
      { name: 'Motivational Journal', color: '#c084fc', desc: 'Reignite your drive, clarify your purpose, and build the mental architecture for consistent action.' },
      { name: 'Gratitude Journal', color: '#f97316', desc: 'Anchor each day in appreciation, shifting attention toward what is already working and good.' },
      { name: 'Creativity Journal', color: '#38bdf8', desc: 'Explore imagination, artistic expression, and the inner life that feeds original thought.' },
    ],
  },
  {
    id: 'chapters',
    title: 'The 90-Day Journey',
    icon: '◑',
    content: `Each journal unfolds across three chapters, each lasting 30 days:`,
    chapters: [
      { name: 'Chapter I — Awareness', days: 'Days 1–30', desc: 'The opening chapter is about honest observation. You examine where you are, what patterns shape your life, and what has been quietly true beneath the surface. Prompts here are exploratory and reflective.' },
      { name: 'Chapter II — Action', days: 'Days 31–60', desc: 'With awareness established, this chapter turns toward movement. Prompts shift to planning, commitment, and the deliberate choices that create change. You begin building new habits and testing what works.' },
      { name: 'Chapter III — Manifestation', days: 'Days 61–90', desc: 'The final chapter integrates everything. You witness how your intention has taken shape, celebrate what has shifted, and consolidate the identity and practices you want to carry forward.' },
    ],
  },
  {
    id: 'entries',
    title: 'Writing an Entry',
    icon: '✦',
    content: `Each day you are presented with a set of thoughtful prompts tailored to your intention and current chapter. Here is how it works:`,
    items: [
      { label: 'Morning vs. Evening', text: 'The app detects the time of day automatically. Before 3 pm, you see morning prompts focused on intention and preparation. After 3 pm, evening prompts invite reflection on how the day unfolded.' },
      { label: 'Mindset Score', text: 'Each entry begins with a 1–10 mindset rating. This brief self-check creates a data point you can revisit in the Trends view to observe patterns over time.' },
      { label: 'Prompt Carousel', text: 'Swipe or click through multiple prompts. Each is tied to your unique intention, your chapter, and the week of your journey. You can respond to any or all of them.' },
      { label: 'Free Notes', text: 'Below the prompts is an open text field for anything else on your mind — observations, gratitude, intentions, or stream of consciousness.' },
      { label: 'Saving', text: 'Your entry saves automatically when you press Save Entry. You can return and edit the same day\'s entry as many times as you like before midnight.' },
    ],
  },
  {
    id: 'streaks',
    title: 'Streaks & Milestones',
    icon: '◎',
    content: `Your streak counts consecutive days you have written an entry in a given journal. Missing a day resets the streak for that journal.

Milestones are celebrated at 3, 7, 14, 21, 30, 60, and 90 days. Reaching 90 days completes the journey — a genuine achievement worth marking.

The home screen shows each journal's current streak alongside the total number of days you have ever journaled across all journals.`,
  },
  {
    id: 'ai',
    title: 'AI Prompts & Weekly Reflections',
    icon: '⊹',
    content: `Bare Journal uses AI in two places:`,
    items: [
      { label: 'Personalized Prompts', text: 'When you set your intention, the app generates a set of prompts tailored specifically to your words and goals. These evolve across chapters and weeks, becoming progressively deeper as your journey unfolds.' },
      { label: 'Weekly Reflections', text: 'At the end of each week, the Trends view generates an AI-written reflection based on your actual entries from that week. It surfaces themes, patterns, and shifts you may not have noticed yourself. Reflections are generated once per week and cached.' },
    ],
  },
  {
    id: 'trends',
    title: 'Trends & Past Entries',
    icon: '∿',
    content: `The journal has three main views, accessible from the navigation tabs at the top:`,
    items: [
      { label: 'Journal (Write)', text: 'Your daily entry space. Opens here by default.' },
      { label: 'Entries (Browse)', text: 'A calendar and carousel view of every past entry. Tap any date to read what you wrote. Use the arrow buttons to move week by week through your history.' },
      { label: 'Trends (Reflect)', text: 'A week-by-week view of your mindset scores and AI-generated weekly reflections. Browse your entire journey at a glance.' },
    ],
  },
  {
    id: 'account',
    title: 'Your Account',
    icon: '◐',
    items: [
      { label: 'Display Name', text: 'Tap your initials in the top-right corner to open the profile menu. Click your name (or "Set your name") to edit it.' },
      { label: 'Sign Out', text: 'Use the Sign Out option in the profile menu. Your data is saved to your account and will be there when you return.' },
      { label: 'Multiple Devices', text: 'Your journals sync to your account, so you can write on any device that is signed in with your email.' },
    ],
  },
]

export default function Help({ onBack }) {
  const [activeSection, setActiveSection] = useState(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d12',
      color: '#ece8e0',
      fontFamily: SANS,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(13,13,18,.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(236,232,224,.07)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid rgba(236,232,224,.15)',
            borderRadius: 8, padding: '6px 14px',
            color: 'rgba(236,232,224,.6)', fontSize: '.88rem',
            fontFamily: 'inherit', cursor: 'pointer',
            transition: 'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,232,224,.07)'; e.currentTarget.style.color = '#ece8e0' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(236,232,224,.6)' }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 600, color: '#ece8e0', margin: 0 }}>Help</h1>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: SERIF, fontSize: '3rem', color: 'rgba(240,192,64,.6)', marginBottom: 16, lineHeight: 1 }}>◈</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '2.2rem', fontWeight: 400, color: '#ece8e0', margin: '0 0 12px' }}>
            Everything you need to know
          </h2>
          <p style={{ color: 'rgba(236,232,224,.45)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            Bare Journal is a 90-day guided practice. This guide covers every feature from your first entry to your last.
          </p>
        </div>

        {/* Table of Contents */}
        <div style={{
          background: 'rgba(236,232,224,.04)',
          border: '1px solid rgba(236,232,224,.08)',
          borderRadius: 16, padding: '20px 24px',
          marginBottom: 48,
        }}>
          <p style={{ fontSize: '.8rem', color: 'rgba(236,232,224,.35)', letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>In this guide</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px 24px' }}>
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                style={{
                  color: 'rgba(236,232,224,.55)', fontSize: '.9rem',
                  textDecoration: 'none', padding: '4px 0',
                  borderBottom: '1px solid transparent',
                  transition: 'color .15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ece8e0' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(236,232,224,.55)' }}
              >
                <span style={{ color: 'rgba(240,192,64,.5)', fontSize: '.8rem' }}>{s.icon}</span>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section, idx) => (
          <div
            key={section.id}
            id={section.id}
            style={{
              marginBottom: 48,
              paddingBottom: 48,
              borderBottom: idx < SECTIONS.length - 1 ? '1px solid rgba(236,232,224,.07)' : 'none',
              scrollMarginTop: 80,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <span style={{ color: 'rgba(240,192,64,.55)', fontSize: '1.3rem', lineHeight: 1 }}>{section.icon}</span>
              <h2 style={{ fontFamily: SERIF, fontSize: '1.65rem', fontWeight: 400, color: '#ece8e0', margin: 0 }}>
                {section.title}
              </h2>
            </div>

            {/* Plain text content */}
            {section.content && (
              <p style={{ color: 'rgba(236,232,224,.72)', lineHeight: 1.8, fontSize: '.97rem', margin: '0 0 20px', whiteSpace: 'pre-line' }}>
                {section.content}
              </p>
            )}

            {/* Numbered steps */}
            {section.steps && (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {section.steps.map((step, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    marginBottom: 16,
                  }}>
                    <span style={{
                      minWidth: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(240,192,64,.1)',
                      border: '1px solid rgba(240,192,64,.25)',
                      color: '#f0c040', fontSize: '.85rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <span style={{ color: '#ece8e0', fontWeight: 600, fontSize: '.97rem' }}>{step.label}: </span>
                      <span style={{ color: 'rgba(236,232,224,.65)', lineHeight: 1.7, fontSize: '.97rem' }}>{step.text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Journal cards */}
            {section.journals && (
              <div style={{ display: 'grid', gap: 12 }}>
                {section.journals.map(j => (
                  <div key={j.name} style={{
                    background: 'rgba(236,232,224,.03)',
                    border: `1px solid rgba(236,232,224,.08)`,
                    borderLeft: `3px solid ${j.color}`,
                    borderRadius: 12, padding: '14px 18px',
                  }}>
                    <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: j.color, margin: '0 0 4px', fontWeight: 600 }}>{j.name}</p>
                    <p style={{ color: 'rgba(236,232,224,.6)', fontSize: '.92rem', lineHeight: 1.6, margin: 0 }}>{j.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chapter cards */}
            {section.chapters && (
              <div style={{ display: 'grid', gap: 12, marginTop: section.content ? 16 : 0 }}>
                {section.chapters.map((ch, i) => (
                  <div key={ch.name} style={{
                    background: 'rgba(236,232,224,.03)',
                    border: '1px solid rgba(236,232,224,.08)',
                    borderRadius: 12, padding: '16px 20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: '#ece8e0', margin: 0, fontWeight: 600 }}>{ch.name}</p>
                      <span style={{
                        fontSize: '.78rem', color: 'rgba(240,192,64,.6)',
                        background: 'rgba(240,192,64,.08)',
                        border: '1px solid rgba(240,192,64,.15)',
                        borderRadius: 20, padding: '2px 10px',
                        whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 12,
                      }}>{ch.days}</span>
                    </div>
                    <p style={{ color: 'rgba(236,232,224,.6)', fontSize: '.92rem', lineHeight: 1.65, margin: 0 }}>{ch.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Labeled items */}
            {section.items && (
              <div style={{ display: 'grid', gap: 14 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(236,232,224,.03)',
                    border: '1px solid rgba(236,232,224,.07)',
                    borderRadius: 12, padding: '14px 18px',
                  }}>
                    <p style={{ fontSize: '.92rem', fontWeight: 600, color: 'rgba(240,192,64,.8)', margin: '0 0 5px', letterSpacing: '.01em' }}>{item.label}</p>
                    <p style={{ color: 'rgba(236,232,224,.62)', fontSize: '.93rem', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: 'rgba(236,232,224,.3)', fontStyle: 'italic' }}>
            Still have questions? Check the FAQ or write to us.
          </p>
        </div>
      </div>
    </div>
  )
}
