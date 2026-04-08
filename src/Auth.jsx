import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000000', padding: 20,
    }}>
      <div style={{
        maxWidth: 380, width: '100%', textAlign: 'center',
        animation: 'fadeUp .6s both',
      }}>
        <h1 style={{
          fontSize: '1.1rem', color: '#f0c040', letterSpacing: '.2em',
          textTransform: 'uppercase', fontWeight: 400, marginBottom: 4,
        }}>Wealth Journal</h1>
        <p style={{ fontSize: '.85rem', color: '#f5e070', opacity: .65, letterSpacing: '.1em', marginBottom: 40 }}>
          90-Day Foundations
        </p>

        {status === 'sent' ? (
          <div style={{ animation: 'fadeUp .4s both' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'rgba(76,200,122,.12)',
              border: '1px solid rgba(76,200,122,.25)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.2rem',
            }}>✓</div>
            <p style={{ fontSize: '.85rem', color: '#f0f0f0', opacity: .9, lineHeight: 1.5 }}>
              Magic link sent to<br />
              <span style={{ color: '#f0c040' }}>{email}</span>
            </p>
            <p style={{ fontSize: '.9rem', color: '#f5e070', opacity: .65, marginTop: 12 }}>
              Check your email and click the link to sign in.
            </p>
            <button onClick={() => { setStatus('idle'); setEmail(''); }}
              style={{
                marginTop: 20, background: 'none', border: '1px solid rgba(240,192,64,.15)',
                color: '#f0c040', padding: '8px 20px', borderRadius: 8, fontSize: '.9rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Try a different email</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '.8rem', color: '#f0f0f0', opacity: .8, marginBottom: 20, lineHeight: 1.5 }}>
              Enter your email to receive a sign-in link.<br />
              No password needed.
            </p>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
              style={{
                width: '100%', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(240,192,64,.15)',
                borderRadius: 10, padding: '14px 16px', color: '#f5f0e8', fontSize: '.85rem',
                fontFamily: 'inherit', outline: 'none', marginBottom: 12,
                textAlign: 'center',
              }}
            />
            <button onClick={handleLogin} disabled={status === 'sending' || !email}
              style={{
                width: '100%', background: email ? 'rgba(240,192,64,.12)' : 'rgba(240,192,64,.05)',
                border: `1px solid ${email ? 'rgba(240,192,64,.3)' : 'rgba(240,192,64,.1)'}`,
                color: email ? '#f0c040' : 'rgba(240,192,64,.3)',
                padding: '12px 20px', borderRadius: 10, fontSize: '.8rem',
                cursor: email ? 'pointer' : 'default', fontFamily: 'inherit',
                letterSpacing: '.05em', transition: 'all .3s',
              }}>
              {status === 'sending' ? 'Sending...' : 'Send Magic Link'}
            </button>
            {status === 'error' && (
              <p style={{ fontSize: '.9rem', color: '#c94c4c', marginTop: 10 }}>
                Something went wrong. Try again.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
