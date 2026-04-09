import { useState } from 'react'
import { generatePrompts, saveIntention } from './db'

const SERIF = "'Cormorant Garamond', Georgia, serif"

const THEME_KEYWORDS = {
  wealth:       ['money', 'income', 'financial', 'invest', 'rich', 'wealth', 'earn', 'business', 'revenue', 'profit', 'saving', 'asset', 'salary', 'cash', 'fund'],
  health:       ['body', 'exercise', 'workout', 'sleep', 'eat', 'nutrition', 'fitness', 'energy', 'weight', 'run', 'gym', 'healthy', 'movement', 'diet', 'strength'],
  motivational: ['discipline', 'mindset', 'habit', 'goal', 'focus', 'productivity', 'consistent', 'motivat', 'achieve', 'perform', 'success', 'grind', 'hustle', 'ambition'],
  gratitude:    ['grateful', 'gratitude', 'appreciat', 'thankful', 'abundance', 'blessing', 'joy', 'bless', 'thanksgiv', 'wonder', 'gift'],
  creativity:   ['creat', 'art', 'write', 'music', 'design', 'imagin', 'express', 'craft', 'draw', 'paint', 'build', 'make', 'story', 'poem', 'photo'],
}

const THEME_NAMES = {
  wealth: 'Wealth Journal',
  health: 'Health Journal',
  motivational: 'Motivational Journal',
  gratitude: 'Gratitude Journal',
  creativity: 'Creativity Journal',
}

const PLACEHOLDERS = {
  wealth:       'e.g. "Double my income, clear my debt, and stop letting fear drive my money decisions"',
  health:       'e.g. "Build a consistent movement practice and sleep 7+ hours every night"',
  motivational: 'e.g. "Show up with discipline every day and build unstoppable momentum in my goals"',
  gratitude:    'e.g. "Deepen my appreciation for what I already have and find joy in ordinary moments"',
  creativity:   'e.g. "Finish my first album, write every morning, and stop letting perfectionism stop me"',
}

function detectMismatch(journalId, text) {
  const lower = text.toLowerCase()
  let best = { id: null, score: 0 }
  for (const [id, keywords] of Object.entries(THEME_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length
    if (score > best.score) best = { id, score }
  }
  // Only flag if another theme scores clearly higher and has meaningful hits
  if (best.id && best.id !== journalId && best.score >= 2) return best.id
  return null
}

export default function IntentionSetup({ config, onComplete, onBack }) {
  const [intention, setIntention] = useState('')
  const [status, setStatus] = useState('idle') // idle | warning | generating | error
  const [suggestedJournal, setSuggestedJournal] = useState(null)

  const handleContinue = () => {
    if (!intention.trim()) return
    const mismatch = detectMismatch(config.id, intention.trim())
    if (mismatch) {
      setSuggestedJournal(mismatch)
      setStatus('warning')
    } else {
      generate()
    }
  }

  const generate = async () => {
    setStatus('generating')
    setSuggestedJournal(null)
    const generated = await generatePrompts(config.id, intention.trim())
    if (!generated) { setStatus('error'); return }
    const ok = await saveIntention(config.id, intention.trim(), generated)
    if (!ok) { setStatus('error'); return }
    onComplete({ intention: intention.trim(), generated_prompts: generated })
  }

  const isGenerating = status === 'generating'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Back */}
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'rgba(236,232,224,.35)',
          fontSize: '1rem', cursor: 'pointer', padding: '0 0 24px',
          fontFamily: SERIF, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ‹ All journals
        </button>

        {/* Icon + Journal name */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: '2.2rem', color: config.color }}>{config.icon}</span>
          <h1 style={{ fontFamily: SERIF, fontSize: '1.6rem', color: config.color, fontWeight: 600, margin: '8px 0 4px' }}>{config.name}</h1>
          <p style={{ fontSize: '.9rem', color: 'rgba(236,232,224,.35)', margin: 0 }}>Day 1 of 90</p>
        </div>

        {/* Heading */}
        <h2 style={{ fontFamily: SERIF, fontSize: '1.8rem', color: '#ece8e0', fontWeight: 600, margin: '0 0 12px', lineHeight: 1.2 }}>
          Set your intention.
        </h2>
        <p style={{ fontSize: '1rem', color: 'rgba(236,232,224,.5)', lineHeight: 1.65, margin: '0 0 28px' }}>
          What do you want to achieve or become over the next 90 days? Be honest and specific — this shapes every prompt in your journey.
        </p>

        {/* Theme mismatch warning */}
        {status === 'warning' && suggestedJournal && (
          <div style={{
            background: `rgba(${config.colorRgb},.06)`,
            border: `1px solid rgba(${config.colorRgb},.2)`,
            borderRadius: 14, padding: '18px 20px', marginBottom: 20,
            animation: 'fadeUp .3s ease both',
          }}>
            <p style={{ fontFamily: SERIF, fontSize: '1.25rem', fontStyle: 'italic', color: '#ece8e0', margin: '0 0 10px', lineHeight: 1.45 }}>
              This feels like it may belong in a different space.
            </p>
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: 'rgba(236,232,224,.5)', margin: '0 0 18px', lineHeight: 1.65 }}>
              The {config.name} holds space for a particular kind of reflection. What you've written carries the spirit of the <span style={{ color: config.color, fontStyle: 'italic' }}>{THEME_NAMES[suggestedJournal]}</span>. You're welcome to bring it here — or let it find its home there instead.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStatus('idle')} style={{
                flex: 1, background: 'none', border: `1px solid rgba(${config.colorRgb},.3)`,
                color: config.color, padding: '9px 0', borderRadius: 10,
                fontSize: '.95rem', cursor: 'pointer', fontFamily: SERIF, fontStyle: 'italic',
              }}>
                Let me rewrite it
              </button>
              <button onClick={generate} style={{
                flex: 1, background: `rgba(${config.colorRgb},.15)`,
                border: `1px solid rgba(${config.colorRgb},.25)`,
                color: config.color, padding: '9px 0', borderRadius: 10,
                fontSize: '.95rem', cursor: 'pointer', fontFamily: SERIF, fontStyle: 'italic',
              }}>
                Begin here anyway
              </button>
            </div>
          </div>
        )}

        {/* Intention input */}
        <textarea
          value={intention}
          onChange={e => { setIntention(e.target.value); if (status === 'warning') setStatus('idle') }}
          placeholder={PLACEHOLDERS[config.id] || 'Write your intention here...'}
          disabled={isGenerating}
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,.04)',
            border: `1.5px solid rgba(${config.colorRgb},.25)`,
            borderRadius: 12, color: '#ece8e0', fontSize: '1rem',
            fontFamily: 'inherit', lineHeight: 1.65, padding: '14px 16px',
            resize: 'vertical', outline: 'none', marginBottom: 20,
            opacity: isGenerating ? 0.5 : 1, transition: 'border-color .2s',
          }}
          onFocus={e => { e.target.style.borderColor = config.color }}
          onBlur={e => { e.target.style.borderColor = `rgba(${config.colorRgb},.25)` }}
        />

        {/* Generate button */}
        {status !== 'warning' && (
          <button
            onClick={handleContinue}
            disabled={!intention.trim() || isGenerating}
            style={{
              width: '100%',
              background: !intention.trim() || isGenerating ? `rgba(${config.colorRgb},.15)` : config.color,
              color: !intention.trim() || isGenerating ? `rgba(${config.colorRgb},.45)` : '#000',
              border: 'none', borderRadius: 12, padding: '14px 20px',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit',
              cursor: !intention.trim() || isGenerating ? 'default' : 'pointer',
              letterSpacing: '.04em', transition: 'all .2s',
            }}
          >
            {isGenerating ? 'Crafting your 90-day journey…' : 'Generate My Journey'}
          </button>
        )}

        {/* Generating message */}
        {isGenerating && (
          <p style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: `rgba(${config.colorRgb},.55)`, marginTop: 16, lineHeight: 1.55 }}>
            Crafting 90 personalized daily questions and 13 weekly prompts. This takes about 15–20 seconds.
          </p>
        )}

        {/* Error */}
        {status === 'error' && (
          <p style={{ textAlign: 'center', fontSize: '.9rem', color: '#c96a4c', marginTop: 16 }}>
            Something went wrong. Check your connection and try again.
          </p>
        )}
      </div>
    </div>
  )
}
