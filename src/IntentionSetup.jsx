import { useState } from 'react'
import { generatePrompts, saveIntention } from './db'

export default function IntentionSetup({ config, onComplete, onBack }) {
  const [intention, setIntention] = useState('');
  const [status, setStatus] = useState('idle'); // idle | generating | error

  const handleGenerate = async () => {
    if (!intention.trim()) return;
    setStatus('generating');

    const generated = await generatePrompts(config.id, intention.trim());
    if (!generated) {
      setStatus('error');
      return;
    }

    const ok = await saveIntention(config.id, intention.trim(), generated);
    if (!ok) {
      setStatus('error');
      return;
    }

    onComplete({ intention: intention.trim(), generated_prompts: generated });
  };

  const isGenerating = status === 'generating';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'rgba(240,240,240,.4)', fontSize: '1rem', cursor: 'pointer', padding: '0 0 24px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ‹ All journals
        </button>

        {/* Icon + Journal name */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: '2.2rem', color: config.color }}>{config.icon}</span>
          <h1 style={{ fontSize: '1.2rem', color: config.color, letterSpacing: '.05em', fontWeight: 600, margin: '8px 0 4px' }}>{config.name}</h1>
          <p style={{ fontSize: '.95rem', color: 'rgba(240,240,240,.4)', margin: 0 }}>Day 1 of 90</p>
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: '1.5rem', color: '#f0f0f0', fontWeight: 700, margin: '0 0 10px', lineHeight: 1.2 }}>
          Set your intention
        </h2>
        <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.55)', lineHeight: 1.6, margin: '0 0 28px' }}>
          What do you want to achieve or become over the next 90 days? Be honest and specific — this shapes every prompt in your journal.
        </p>

        {/* Intention input */}
        <textarea
          value={intention}
          onChange={e => setIntention(e.target.value)}
          placeholder={`e.g. "${config.id === 'health' ? 'Build a consistent movement practice and sleep 7+ hours every night' : 'Show up with discipline every day and build unstoppable momentum in my goals'}"` }
          disabled={isGenerating}
          rows={4}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,.05)',
            border: `1.5px solid rgba(${config.colorRgb},.3)`,
            borderRadius: 10,
            color: '#f0f0f0',
            fontSize: '1rem',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            padding: '14px 16px',
            resize: 'vertical',
            outline: 'none',
            marginBottom: 20,
            opacity: isGenerating ? 0.5 : 1,
          }}
          onFocus={e => { e.target.style.borderColor = config.color; }}
          onBlur={e => { e.target.style.borderColor = `rgba(${config.colorRgb},.3)`; }}
        />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!intention.trim() || isGenerating}
          style={{
            width: '100%',
            background: !intention.trim() || isGenerating ? `rgba(${config.colorRgb},.2)` : config.color,
            color: !intention.trim() || isGenerating ? `rgba(${config.colorRgb},.5)` : '#000',
            border: 'none',
            borderRadius: 10,
            padding: '14px 20px',
            fontSize: '1rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: !intention.trim() || isGenerating ? 'default' : 'pointer',
            letterSpacing: '.04em',
            transition: 'all .2s',
          }}
        >
          {isGenerating ? 'Generating your 90-day journey...' : 'Generate My Journey'}
        </button>

        {/* Generating state message */}
        {isGenerating && (
          <p style={{ textAlign: 'center', fontSize: '.9rem', color: `rgba(${config.colorRgb},.6)`, marginTop: 16, lineHeight: 1.5 }}>
            Crafting 90 personalized daily questions and 13 weekly prompts tailored to your intention. This takes about 15–20 seconds.
          </p>
        )}

        {/* Error state */}
        {status === 'error' && (
          <p style={{ textAlign: 'center', fontSize: '.9rem', color: '#c96a4c', marginTop: 16 }}>
            Something went wrong. Check your connection and try again.
          </p>
        )}
      </div>
    </div>
  );
}
