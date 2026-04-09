import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const SERIF = "'Cormorant Garamond', Georgia, serif"

export default function ProfileMenu({ user, displayName, onNameUpdate, onLogout, accentColor = '#ece8e0', accentRgb = '236,232,224' }) {
  const [open, setOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(displayName || '')
  const [saving, setSaving] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => { setNameInput(displayName || '') }, [displayName])

  useEffect(() => {
    if (!open) return
    const handle = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase()

  const saveName = async () => {
    const name = nameInput.trim()
    if (!name) return
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: name } })
    onNameUpdate(name)
    setSaving(false)
    setEditingName(false)
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `rgba(${accentRgb},.1)`,
          border: `1px solid rgba(${accentRgb},.2)`,
          color: accentColor,
          fontSize: '.9rem', fontWeight: 600, letterSpacing: '.04em',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit',
          transition: 'background .2s, border-color .2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `rgba(${accentRgb},.18)`; e.currentTarget.style.borderColor = `rgba(${accentRgb},.4)` }}
        onMouseLeave={e => { e.currentTarget.style.background = `rgba(${accentRgb},.1)`; e.currentTarget.style.borderColor = `rgba(${accentRgb},.2)` }}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, zIndex: 100,
          background: '#141419',
          border: '1px solid rgba(236,232,224,.12)',
          borderRadius: 16, padding: '8px 0',
          minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
          animation: 'fadeUp .2s ease both',
        }}>

          {/* Name section */}
          <div style={{ padding: '12px 18px 14px', borderBottom: '1px solid rgba(236,232,224,.08)' }}>
            {editingName ? (
              <div>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  placeholder="Your name"
                  style={{
                    width: '100%', background: 'rgba(236,232,224,.06)',
                    border: '1px solid rgba(236,232,224,.2)', borderRadius: 8,
                    padding: '7px 10px', color: '#ece8e0',
                    fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
                    marginBottom: 8,
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveName} disabled={saving} style={{ flex: 1, background: 'rgba(236,232,224,.1)', border: '1px solid rgba(236,232,224,.2)', color: '#ece8e0', borderRadius: 7, padding: '5px 0', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {saving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingName(false)} style={{ flex: 1, background: 'none', border: '1px solid rgba(236,232,224,.1)', color: 'rgba(236,232,224,.45)', borderRadius: 7, padding: '5px 0', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingName(true)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: '#ece8e0', fontWeight: 600, margin: '0 0 2px' }}>
                  {displayName || 'Set your name'}
                </p>
                <p style={{ fontSize: '.82rem', color: 'rgba(236,232,224,.35)', margin: 0 }}>
                  {displayName ? 'Tap to edit' : user?.email}
                </p>
              </button>
            )}
          </div>

          {/* Menu items */}
          {[
            { label: 'Help', icon: '?', soon: true },
            { label: 'Account Settings', icon: '⊙', soon: true },
          ].map(item => (
            <button key={item.label} disabled={item.soon} style={{
              width: '100%', background: 'none', border: 'none',
              padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12,
              cursor: item.soon ? 'default' : 'pointer',
              color: item.soon ? 'rgba(236,232,224,.28)' : 'rgba(236,232,224,.7)',
              fontSize: '.95rem', fontFamily: 'inherit', textAlign: 'left',
              transition: 'background .15s',
            }}
            onMouseEnter={e => { if (!item.soon) e.currentTarget.style.background = 'rgba(236,232,224,.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <span style={{ width: 18, textAlign: 'center', fontSize: '.9rem', opacity: .6 }}>{item.icon}</span>
              {item.label}
              {item.soon && <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'rgba(236,232,224,.2)', letterSpacing: '.06em' }}>SOON</span>}
            </button>
          ))}

          <div style={{ borderTop: '1px solid rgba(236,232,224,.08)', margin: '4px 0' }} />

          <button onClick={() => { setOpen(false); onLogout() }} style={{
            width: '100%', background: 'none', border: 'none',
            padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', color: 'rgba(201,76,76,.7)',
            fontSize: '.95rem', fontFamily: 'inherit', textAlign: 'left',
            transition: 'background .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,76,76,.07)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <span style={{ width: 18, textAlign: 'center', fontSize: '.9rem', opacity: .7 }}>→</span>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
