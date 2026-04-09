import { JOURNALS } from './journalConfigs'

export default function Home({ onSelect, onLogout }) {
  const journals = Object.values(JOURNALS);

  return (
    <div style={{ minHeight: '100vh', padding: '32px 20px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: '#f0f0f0', fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>Bare Journal</h1>
          <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.4)', marginTop: 6 }}>Choose your practice</p>
        </div>
        <button onClick={onLogout} style={{
          background: 'none', border: '1px solid rgba(240,240,240,.15)',
          color: 'rgba(240,240,240,.4)', padding: '6px 14px', borderRadius: 8,
          fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
        }}>Sign out</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {journals.map(j => (
          <div
            key={j.id}
            onClick={() => !j.comingSoon && onSelect(j.id)}
            style={{
              background: `rgba(${j.colorRgb}, .05)`,
              border: `1px solid rgba(${j.colorRgb}, ${j.comingSoon ? '.12' : '.25'})`,
              borderRadius: 14,
              padding: '22px 22px',
              cursor: j.comingSoon ? 'default' : 'pointer',
              opacity: j.comingSoon ? .45 : 1,
              transition: 'background .2s, border-color .2s',
              userSelect: 'none',
            }}
            onMouseEnter={e => { if (!j.comingSoon) e.currentTarget.style.background = `rgba(${j.colorRgb}, .09)` }}
            onMouseLeave={e => { if (!j.comingSoon) e.currentTarget.style.background = `rgba(${j.colorRgb}, .05)` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `rgba(${j.colorRgb}, .15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', color: j.color, flexShrink: 0,
                }}>{j.icon}</div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', color: j.color, fontWeight: 600, margin: 0 }}>{j.name}</h2>
                  <p style={{ fontSize: '1rem', color: 'rgba(240,240,240,.55)', margin: '4px 0 0' }}>{j.description}</p>
                </div>
              </div>
              {j.comingSoon
                ? <span style={{ fontSize: '.85rem', color: j.color, background: `rgba(${j.colorRgb}, .15)`, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 12 }}>Coming soon</span>
                : <span style={{ fontSize: '1.3rem', color: `rgba(${j.colorRgb}, .5)`, marginLeft: 12 }}>›</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
