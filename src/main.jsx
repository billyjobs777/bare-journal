import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabase'
import Auth from './Auth'
import Journal from './Journal'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes (magic link redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#1a1714', color: '#c9a84c',
        fontFamily: 'Georgia, serif', fontSize: '.85rem',
      }}>
        Loading...
      </div>
    )
  }

  if (!session) return <Auth />
  return <Journal onLogout={handleLogout} />
}

createRoot(document.getElementById('root')).render(<App />)
