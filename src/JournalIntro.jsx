export const SERIF = "'Cormorant Garamond', Georgia, serif"

const INTROS = {
  wealth: {
    opening: "The Wealth Journal is not a budget tracker or a productivity system. It is a daily invitation to examine your inner world around money — the beliefs you carry, the stories you tell, the fears that quietly govern your choices.",
    body: "Over 90 days you will move through three chapters: Awareness, Action, and Manifestation. Each builds on the last. You begin by simply observing — honestly, without judgment — where you actually are. Then you move. Then you receive what that movement builds.",
    closing: "This is a private practice. No one grades it. What you write here belongs to you alone. The only requirement is honesty — the kind that costs something.",
    what: [
      "A daily morning and evening check-in — takes only a few minutes",
      "Prompts personalized to the intention you set at the start",
      "A mindset score each day, which becomes a map over time",
      "A weekly reflection, generated from what you actually wrote",
    ],
  },
  health: {
    opening: "The Health Journal holds space for your relationship with your body — not as a problem to solve, but as a living system worthy of attention and care.",
    body: "You will check in each morning and evening, noticing your energy, your choices, and the patterns that only become visible when you pay attention consistently. Three chapters guide the progression: Awareness, Action, Manifestation.",
    closing: "This is not about discipline or willpower. It is about building a rhythm of return. Each day, a small act of showing up. Over 90 days, that rhythm becomes the practice — and the practice becomes a different relationship with your body.",
    what: [
      "Morning and evening check-ins that take two to five minutes",
      "Prompts shaped around the specific intention you will set",
      "A mindset score that reveals energy patterns across weeks",
      "A weekly letter reflecting back what your entries showed",
    ],
  },
  motivational: {
    opening: "The Motivational Journal is for the part of you that already knows what it wants to build — but needs a daily witness to keep showing up when the feeling fades.",
    body: "This is not about hype or affirmation. It is about honest examination of what drives you, what depletes you, and what it actually looks like to build momentum across ninety days. The three chapters move from self-examination through deliberate action into a new understanding of your own capability.",
    closing: "Bring honesty, not performance. What you write here doesn't need to be inspiring. It needs to be true.",
    what: [
      "Daily morning and evening prompts tied to your intention",
      "A mindset score that traces your inner momentum over time",
      "Prompts that deepen with each chapter and week of your journey",
      "A weekly reflection generated from your actual writing",
    ],
  },
  gratitude: {
    opening: "The Gratitude Journal is a practice in attention. Not positivity — attention. The difference matters.",
    body: "Gratitude done well is not the suppression of difficulty. It is the expansion of notice — training yourself to see what is already present and good, even when difficulty is also real. Over 90 days, you develop a finer lens: for small things, easy-to-miss things, things that were always there waiting to be named.",
    closing: "This practice works quietly. You may not feel it shifting until something ordinary stops you mid-day and you realize you have been seeing differently for weeks.",
    what: [
      "Brief morning and evening prompts that train the attention",
      "A personal intention that shapes every prompt in your journey",
      "A mindset score that maps your inner landscape over time",
      "Weekly reflections that surface patterns you wrote into being",
    ],
  },
  creativity: {
    opening: "The Creativity Journal is a practice for those who make things — or who want to, but keep stopping before the thing is finished.",
    body: "This is not an art journal. It is a practice journal. Each day, a small moment of return: to what you are making, what you are exploring, what gets in the way. Over 90 days the rhythm of return becomes the practice itself. And the practice becomes the creative life.",
    closing: "Bring whatever you are working on. Bring the thing you have been avoiding. Bring the project you have been carrying for years. All of it is welcome here.",
    what: [
      "Daily morning and evening prompts tuned to your creative intention",
      "A mindset score that maps the texture of your creative days",
      "Prompts that grow with you across three chapters of the journey",
      "A weekly letter that reflects back what your practice is building",
    ],
  },
}

export function JournalIntroContent({ config }) {
  const intro = INTROS[config.id] || INTROS.wealth
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: 'rgba(236,232,224,.75)', lineHeight: 1.8, margin: '0 0 14px' }}>{intro.opening}</p>
      <p style={{ fontFamily: SERIF, fontSize: '1rem', color: 'rgba(236,232,224,.55)', lineHeight: 1.8, margin: '0 0 14px' }}>{intro.body}</p>
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: `rgba(${config.colorRgb},.5)`, lineHeight: 1.75, margin: 0 }}>{intro.closing}</p>
    </div>
  )
}

export default function JournalIntro({ config, onStart, onBack }) {
  const intro = INTROS[config.id] || INTROS.wealth

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
      background: '#0d0d12',
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      animation: 'fadeUp .5s ease both',
    }}>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '32px 28px 60px' }}>

        {/* Back */}
        <button onClick={onBack} style={{
          background: 'none', border: 'none',
          color: 'rgba(236,232,224,.3)', fontSize: '1rem',
          cursor: 'pointer', padding: '0 0 32px',
          fontFamily: SERIF, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ‹ All journals
        </button>

        {/* Icon + name */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: '2.8rem', color: config.color, marginBottom: 16,
            filter: `drop-shadow(0 0 18px rgba(${config.colorRgb},.5))`,
          }}>
            {config.icon}
          </div>
          <h1 style={{
            fontFamily: SERIF, fontSize: '2.4rem', fontWeight: 600,
            color: config.color, margin: '0 0 8px', lineHeight: 1.1,
          }}>
            {config.name}
          </h1>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: '1.1rem', color: `rgba(${config.colorRgb},.5)`,
            margin: 0,
          }}>
            {config.tagline}
          </p>
        </div>

        {/* Intro copy */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontFamily: SERIF, fontSize: '1.25rem',
            color: '#ece8e0', lineHeight: 1.8, margin: '0 0 20px',
          }}>
            {intro.opening}
          </p>
          <p style={{
            fontFamily: SERIF, fontSize: '1.1rem',
            color: 'rgba(236,232,224,.72)', lineHeight: 1.8, margin: '0 0 20px',
          }}>
            {intro.body}
          </p>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.1rem',
            color: `rgba(${config.colorRgb},.6)`, lineHeight: 1.75, margin: 0,
          }}>
            {intro.closing}
          </p>
        </div>

        {/* What to expect */}
        <div style={{
          background: `rgba(${config.colorRgb},.04)`,
          border: `1px solid rgba(${config.colorRgb},.12)`,
          borderRadius: 16, padding: '20px 22px', marginBottom: 40,
        }}>
          <p style={{
            fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase',
            color: `rgba(${config.colorRgb},.45)`, margin: '0 0 16px',
            fontFamily: SERIF,
          }}>
            What to expect
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {intro.what.map((item, i) => (
              <li key={i} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                marginBottom: i < intro.what.length - 1 ? 12 : 0,
              }}>
                <span style={{ color: config.color, flexShrink: 0, marginTop: 5, opacity: .6, fontSize: '.9rem' }}>✦</span>
                <span style={{
                  fontFamily: SERIF, fontSize: '1.05rem',
                  color: 'rgba(236,232,224,.65)', lineHeight: 1.6,
                }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 90 days + 3 chapters */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 44,
        }}>
          {[
            { num: 'I', name: 'Awareness', days: 'Days 1–30' },
            { num: 'II', name: 'Action', days: 'Days 31–60' },
            { num: 'III', name: 'Manifestation', days: 'Days 61–90' },
          ].map(ch => (
            <div key={ch.num} style={{
              background: 'rgba(236,232,224,.03)',
              border: '1px solid rgba(236,232,224,.07)',
              borderRadius: 12, padding: '12px 14px', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: SERIF, fontSize: '.78rem', letterSpacing: '.1em',
                textTransform: 'uppercase', color: `rgba(${config.colorRgb},.45)`,
                margin: '0 0 4px',
              }}>
                Chapter {ch.num}
              </p>
              <p style={{
                fontFamily: SERIF, fontSize: '1rem', fontWeight: 600,
                color: '#ece8e0', margin: '0 0 3px',
              }}>
                {ch.name}
              </p>
              <p style={{
                fontSize: '.78rem', color: 'rgba(236,232,224,.3)', margin: 0,
              }}>
                {ch.days}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          style={{
            width: '100%', background: config.color,
            border: 'none', borderRadius: 14,
            padding: '17px 0', fontSize: '1.1rem', fontWeight: 700,
            color: '#000', cursor: 'pointer',
            fontFamily: SERIF, letterSpacing: '.04em',
            transition: 'opacity .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Start this journal ›
        </button>

      </div>
    </div>
  )
}
