import { useState } from 'react'

const SERIF = "'Cormorant Garamond', Georgia, serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

const CATEGORIES = [
  {
    id: 'about',
    label: 'About Bare Journal',
    icon: '◈',
    faqs: [
      {
        q: 'What is Bare Journal?',
        a: 'Bare Journal is a 90-day guided journaling practice. It gives you personalized, AI-shaped prompts each day, organized around an intention you set at the start. The journey unfolds across three chapters — Awareness, Action, and Manifestation — with prompts that deepen as you progress.',
      },
      {
        q: 'Is this a subscription service?',
        a: 'Bare Journal is currently free to use. You can start a journal, complete a 90-day journey, and use all features including AI prompts and weekly reflections at no cost.',
      },
      {
        q: 'What devices and browsers does Bare Journal support?',
        a: 'Bare Journal works in any modern browser — Chrome, Safari, Firefox, Edge — on desktop, tablet, or mobile. Your journal syncs to your account, so you can write on any device.',
      },
      {
        q: 'Do I need to download an app?',
        a: 'No download required. Bare Journal runs entirely in your web browser. On mobile, you can add it to your home screen from your browser\'s share menu for a native-feeling experience.',
      },
    ],
  },
  {
    id: 'journey',
    label: 'The 90-Day Journey',
    icon: '◑',
    faqs: [
      {
        q: 'How does the 90-day structure work?',
        a: 'Each journal is divided into three 30-day chapters: Awareness (Days 1–30), Action (Days 31–60), and Manifestation (Days 61–90). Each chapter has its own tone and focus. Prompts evolve week by week within each chapter, growing progressively deeper.',
      },
      {
        q: 'What happens at the end of 90 days?',
        a: 'When you reach Day 90, a completion celebration appears. At that point you can reflect on how your intention has manifested over the course of the journey. You can start a fresh 90-day journey in the same journal by setting a new intention.',
      },
      {
        q: 'Can I pause or restart my journey?',
        a: 'Your streak tracks consecutive days, but missing days does not erase your entries or reset your chapter. If you miss a day, your streak resets but you continue from wherever you left off in the chapter and day count.',
      },
      {
        q: 'Can I run multiple journals at the same time?',
        a: 'Yes. You can have up to five journals active simultaneously — one for each type: Wealth, Health, Motivational, Gratitude, and Creativity. Each runs its own independent 90-day journey with its own intention, prompts, streak, and weekly reflections.',
      },
      {
        q: 'What are the five journal types?',
        a: 'Wealth focuses on financial clarity and abundance. Health tends to the body and energy. Motivational builds drive and purpose. Gratitude anchors attention on what is good. Creativity explores imagination and expression. Each has its own chapter themes, prompt library, and weekly focus areas.',
      },
    ],
  },
  {
    id: 'entries',
    label: 'Writing Entries',
    icon: '✦',
    faqs: [
      {
        q: 'How often should I write?',
        a: 'Once a day is the intended rhythm. The app supports one entry per day per journal, but that entry can be updated multiple times before midnight. Consistency matters more than length — even a few honest lines a day is the practice.',
      },
      {
        q: 'What is the difference between morning and evening entries?',
        a: 'Before 3 pm, the app presents morning prompts oriented toward intention, preparation, and what you want to create today. After 3 pm, evening prompts invite reflection on how the day unfolded. Both sessions are stored as a single entry for the day.',
      },
      {
        q: 'Can I edit a past entry?',
        a: 'You can edit today\'s entry at any time before midnight. Past entries (from previous days) are read-only. They are preserved as a historical record of your journey.',
      },
      {
        q: 'What is the mindset score?',
        a: 'At the start of each entry, you rate your mindset on a scale of 1 to 10. This takes two seconds and creates a longitudinal data point. Over time, the Trends view uses these scores to show you patterns — which days, weeks, and chapters felt strongest.',
      },
      {
        q: 'Do I have to respond to all the prompts?',
        a: 'No. The prompts are invitations, not requirements. You can respond to one, several, or none of them and write freely in the notes field instead. The practice is yours to shape.',
      },
      {
        q: 'What if I skip a day?',
        a: 'Your streak resets, but your entries, chapter progress, and intention remain intact. There is no penalty beyond the streak counter. Many people find that a missed day actually sharpens their appreciation for the practice when they return.',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI Features',
    icon: '⊹',
    faqs: [
      {
        q: 'How does the AI personalize my prompts?',
        a: 'When you write your intention at the start of a journal, Bare Journal uses it to generate a tailored set of prompts for your specific goals and words. These are not generic templates — they are written to reflect your stated direction. The prompts also evolve across chapters and weeks, responding to where you are in the 90-day arc.',
      },
      {
        q: 'What are weekly reflections?',
        a: 'At the end of each week, the Trends view can generate a written reflection based on the actual entries you made that week. It surfaces themes, emotional patterns, and shifts you may not have noticed from inside the experience. Reflections are generated once per week and cached — they will not change if you re-read them.',
      },
      {
        q: 'Can the AI read all my entries?',
        a: 'The AI processes the text of your entries only to generate the weekly reflection for that specific week. Your entries are not stored by or shared with any third-party AI provider beyond what is needed to generate that reflection. Your data stays in your account.',
      },
      {
        q: 'What if I do not want AI-generated reflections?',
        a: 'Weekly reflections are generated on demand — they only appear when you navigate to the Trends view and trigger one. If you prefer to reflect on your own, simply do not use the Trends view.',
      },
    ],
  },
  {
    id: 'streaks',
    label: 'Streaks & Progress',
    icon: '◎',
    faqs: [
      {
        q: 'How is my streak calculated?',
        a: 'Your streak counts consecutive calendar days you have made an entry in a specific journal. Writing on Monday and Wednesday — with nothing on Tuesday — resets the streak to 1 on Wednesday. Streaks are per-journal, so your Wealth Journal streak and Health Journal streak are independent.',
      },
      {
        q: 'What are the streak milestones?',
        a: 'Milestones are celebrated at 3, 7, 14, 21, 30, 60, and 90 consecutive days. Each one is marked with a brief celebration when you save your entry. Reaching 90 days completes the chapter journey.',
      },
      {
        q: 'What is the total days counter on the home screen?',
        a: 'The total days counter shows the cumulative number of days you have ever written an entry across all journals combined. It is a lifetime measure of your journaling practice, separate from any individual streak.',
      },
      {
        q: 'Can I recover a lost streak?',
        a: 'Streaks are not manually adjustable. Missing a day resets it. This is by design — the streak is a reflection of the actual rhythm of your practice, not a score to be optimized.',
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy & Data',
    icon: '◐',
    faqs: [
      {
        q: 'Who can see my journal entries?',
        a: 'Only you. Your entries are stored in your private account and protected by row-level security — no other user or third party can access them. The app uses Supabase for secure authentication and storage.',
      },
      {
        q: 'How do I sign in without a password?',
        a: 'Bare Journal uses passwordless authentication via magic links. Enter your email, and we send you a secure one-time link. Clicking it signs you in immediately. There is no password to forget, reuse, or have stolen.',
      },
      {
        q: 'Can I export my entries?',
        a: 'Export functionality is on the roadmap. It is not available yet, but it is coming. Your data belongs to you.',
      },
      {
        q: 'What happens to my data if I stop using the app?',
        a: 'Your account and all entries remain intact indefinitely. If you decide you want your data deleted entirely, contact support and we will remove it.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: '◇',
    faqs: [
      {
        q: 'How do I change my display name?',
        a: 'Tap the initials avatar in the top-right corner of any screen to open the profile menu. Click your name (or "Set your name" if you have not set one) and type your name. Press Save or hit Enter to confirm.',
      },
      {
        q: 'How do I sign out?',
        a: 'Open the profile menu using the initials button in the top-right corner, then tap Sign out. Your data is saved and waiting when you sign back in.',
      },
      {
        q: 'I did not receive my magic link email. What do I do?',
        a: 'Check your spam or junk folder first. Magic links arrive quickly but can be filtered by some email providers. If you still do not see it after a minute, try the sign-in process again. Make sure you are using the same email address you originally signed up with.',
      },
      {
        q: 'Can I use Bare Journal on multiple devices?',
        a: 'Yes. Sign in with the same email on any device. Your journals, entries, streaks, and reflections are all tied to your account and will be there on every device.',
      },
    ],
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: '1px solid rgba(236,232,224,.07)',
      transition: 'all .2s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '16px 0', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 16,
          cursor: 'pointer', textAlign: 'left',
          transition: 'all .15s',
        }}
      >
        <span style={{
          fontFamily: SERIF, fontSize: '1.1rem',
          color: open ? '#ece8e0' : 'rgba(236,232,224,.8)',
          lineHeight: 1.5, fontWeight: 400,
          transition: 'color .15s',
        }}>
          {q}
        </span>
        <span style={{
          color: open ? 'rgba(240,192,64,.8)' : 'rgba(236,232,224,.3)',
          fontSize: '1.2rem', lineHeight: 1, flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform .2s, color .15s',
          marginTop: 2,
        }}>
          +
        </span>
      </button>
      {open && (
        <p style={{
          color: 'rgba(236,232,224,.6)', lineHeight: 1.8,
          fontSize: '.95rem', margin: '0 0 18px',
          paddingRight: 32,
          animation: 'fadeUp .2s ease both',
        }}>
          {a}
        </p>
      )}
    </div>
  )
}

export default function FAQ({ onBack }) {
  const [activeCategory, setActiveCategory] = useState('about')

  const current = CATEGORIES.find(c => c.id === activeCategory)

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
          <h1 style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 600, color: '#ece8e0', margin: 0 }}>FAQ</h1>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: SERIF, fontSize: '3rem', color: 'rgba(240,192,64,.6)', marginBottom: 16, lineHeight: 1 }}>?</div>
          <h2 style={{ fontFamily: SERIF, fontSize: '2.2rem', fontWeight: 400, color: '#ece8e0', margin: '0 0 12px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'rgba(236,232,224,.45)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            Answers to the most common questions about Bare Journal, the 90-day practice, and how everything works.
          </p>
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          marginBottom: 40,
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: activeCategory === cat.id ? 'rgba(240,192,64,.12)' : 'rgba(236,232,224,.04)',
                border: activeCategory === cat.id ? '1px solid rgba(240,192,64,.3)' : '1px solid rgba(236,232,224,.1)',
                borderRadius: 20, padding: '6px 14px',
                color: activeCategory === cat.id ? '#f0c040' : 'rgba(236,232,224,.55)',
                fontSize: '.87rem', fontFamily: 'inherit', cursor: 'pointer',
                transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: '.8rem', opacity: .8 }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Active category */}
        {current && (
          <div style={{ animation: 'fadeUp .2s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <span style={{ color: 'rgba(240,192,64,.55)', fontSize: '1.3rem' }}>{current.icon}</span>
              <h3 style={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 400, color: '#ece8e0', margin: 0 }}>
                {current.label}
              </h3>
            </div>

            <div style={{
              background: 'rgba(236,232,224,.02)',
              border: '1px solid rgba(236,232,224,.07)',
              borderRadius: 16, padding: '0 24px',
            }}>
              {current.faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        )}

        {/* All categories index at bottom */}
        <div style={{ marginTop: 60 }}>
          <p style={{ fontSize: '.8rem', color: 'rgba(236,232,224,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            All topics
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{
                  background: 'rgba(236,232,224,.03)',
                  border: '1px solid rgba(236,232,224,.08)',
                  borderRadius: 12, padding: '12px 16px',
                  color: 'rgba(236,232,224,.6)', fontSize: '.9rem',
                  fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,232,224,.06)'; e.currentTarget.style.color = '#ece8e0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(236,232,224,.03)'; e.currentTarget.style.color = 'rgba(236,232,224,.6)' }}
              >
                <span style={{ color: 'rgba(240,192,64,.5)' }}>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(236,232,224,.25)', fontSize: '.8rem' }}>{cat.faqs.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: 40, marginTop: 40, borderTop: '1px solid rgba(236,232,224,.06)' }}>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: 'rgba(236,232,224,.3)', fontStyle: 'italic' }}>
            Didn't find what you were looking for? Check the full Help guide.
          </p>
        </div>
      </div>
    </div>
  )
}
