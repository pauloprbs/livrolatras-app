import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle } from 'lucide-react'
import logo01 from '../../imgs/logo_01.jpeg'

export function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-club-beige bg-cover bg-center"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80")' }}
    >
      <div className="absolute inset-0 bg-club-darkbg/70 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
        <div className="flex flex-col items-center mb-8">
          <img src={logo01} alt="Livrólatras Logo" className="w-24 h-24 object-contain rounded-2xl mb-4 shadow-sm" />
          <h1 className="text-3xl font-serif font-bold text-club-blue tracking-tight">Livrólatras</h1>
          <p className="text-club-pink mt-2 font-medium">Clube do Livro - Goiânia (GO)</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>

      </div>
    </div>
  )
}
