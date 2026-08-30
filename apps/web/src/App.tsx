import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Auth } from './pages/Auth'
import { Home } from './pages/Home'
import { Mural } from './pages/Mural'
import { SidebarLayout } from './components/SidebarLayout'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" />
  }

  return <SidebarLayout>{children}</SidebarLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Mural />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/indicacoes" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
        {/* Futuras rotas */}
        <Route path="/votacao" element={<PrivateRoute><div className="p-8 text-center text-zinc-500">Sistema de Votação (Em Breve)</div></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><div className="p-8 text-center text-zinc-500">Meu Perfil (Em Breve)</div></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
