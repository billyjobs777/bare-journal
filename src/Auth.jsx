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
      background: '#1a1714', padding: 20,
    }}>
      <div style={{
        maxWidth: 380, width: '100%', textAlign: 'center',
        animation: 'fadeUp .6s both',
      }}>
        <h1 style={{
          fontSize: '1.1rem', color: '#c9a84c', letterSpacing: '.2em',
          textTransform: 'uppercase', fontWeight: 400, marginBottom: 4,
        }}>Wealth Journal</h1>
        <p style={{ fontSize: '.65rem', color: '#e8d59a', opacity: .35, letterSpacing: '.1em', marginBottom: 40 }}>
          90-Day Foundations
        </p>

        {status === 'sent' ? (
          <div style={{ animation: 'fadeUp .4s both' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'rgba(76,200,122,.12)',
              border: '1px solid rgba(76,200,122,.25)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.2rem',
            }}>✓</div>
            <p style={{ fontSize: '.85rem', color: '#f5f0e8', opacity: .7, lineHeight: 1.5 }}>
              Magic link sent to<br />
              <span style={{ color: '#c9a84c' }}>{email}</span>
            </p>
            <p style={{ fontSize: '.7rem', color: '#e8d59a', opacity: .35, marginTop: 12 }}>
              Check your email and click the link to sign in.
            </p>
            <button onClick={() => { setStatus('idle'); setEmail(''); }}
              style={{
                marginTop: 20, background: 'none', border: '1px solid rgba(201,168,76,.15)',
                color: '#c9a84c', padding: '8px 20px', borderRadius: 8, fontSize: '.7rem',
                cursor: 'pointer', fontFamily: 'Georgia, serif',
              }}>Try a different email</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '.8rem', color: '#f5f0e8', opacity: .45, marginBottom: 20, lineHeight: 1.5 }}>
              Enter your email to receive a sign-in link.<br />
              No password needed.
            </p>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
              style={{
                width: '100%', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(201,168,76,.15)',
                borderRadius: 10, padding: '14px 16px', color: '#f5f0e8', fontSize: '.85rem',
                fontFamily: 'Georgia, serif', outline: 'none', marginBottom: 12,
                textAlign: 'center',
              }}
            />
            <button onClick={handleLogin} disabled={status === 'sending' || !email}
              style={{
                width: '100%', background: email ? 'rgba(201,168,76,.12)' : 'rgba(201,168,76,.05)',
                border: `1px solid ${email ? 'rgba(201,168,76,.3)' : 'rgba(201,168,76,.1)'}`,
                color: email ? '#c9a84c' : 'rgba(201,168,76,.3)',
                padding: '12px 20px', borderRadius: 10, fontSize: '.8rem',
                cursor: email ? 'pointer' : 'default', fontFamily: 'Georgia, serif',
                letterSpacing: '.05em', transition: 'all .3s',
              }}>
              {status === 'sending' ? 'Sending...' : 'Send Magic Link'}
            </button>
            {status === 'error' && (
              <p style={{ fontSize: '.7rem', color: '#c94c4c', marginTop: 10 }}>
                Something went wrong. Try again.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
