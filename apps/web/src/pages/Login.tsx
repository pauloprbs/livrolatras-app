import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth()

  if (loading) return null

  // Se já estiver logado, nem deixa ver essa tela, joga pro Feed
  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-club-beige dark:bg-club-darkbg p-4 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-club-lightpink dark:bg-club-blue rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-club-pink dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-md bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-700 shadow-2xl rounded-3xl p-10 flex flex-col items-center text-center">
        
        <img 
          src="/imgs/logo_01.jpeg" 
          alt="Logo do Clube" 
          className="w-24 h-24 rounded-full border-4 border-club-pink dark:border-club-blue shadow-lg mb-6 object-cover" 
        />
        
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          Bem-vindo ao Clube
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          O seu espaço exclusivo para compartilhar, descobrir e votar nas nossas próximas aventuras literárias.
        </p>

        <button 
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-2xl shadow-lg transition-transform transform hover:-translate-y-1"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Google
        </button>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          Acesso restrito para membros convidados.
        </p>
      </div>
    </div>
  )
}
