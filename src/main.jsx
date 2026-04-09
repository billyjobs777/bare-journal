import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabase'
import { JOURNALS } from './journalConfigs'
import Auth from './Auth'
import Home from './Home'
import Journal from './Journal'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeJournal, setActiveJournal] = useState(null)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setDisplayName(session?.user?.user_metadata?.full_name || '')
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setActiveJournal(null)
      } else if (session) {
        setSession(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setActiveJournal(null)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0d0d12', color: '#f0c040',
        fontFamily: 'inherit', fontSize: '1rem',
      }}>
        Loading...
      </div>
    )
  }

  if (!session) return <Auth />

  if (!activeJournal) {
    return <Home onSelect={setActiveJournal} onLogout={handleLogout} user={session.user} displayName={displayName} onNameUpdate={setDisplayName} />
  }

  const config = JOURNALS[activeJournal]
  return (
    <Journal
      config={config}
      onBack={() => setActiveJournal(null)}
      onLogout={handleLogout}
      user={session.user}
      displayName={displayName}
      onNameUpdate={setDisplayName}
    />
  )
}

createRoot(document.getElementById('root')).render(<App />)
