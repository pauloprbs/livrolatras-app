import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const [theme, setTheme] = useState('light')
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  return (
    <div className="min-h-screen bg-club-beige dark:bg-club-darkbg transition-colors duration-300 flex flex-col">
      {/* Navbar Premium */}
      <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/imgs/logo_01.jpeg" alt="Livrólatras" className="w-10 h-10 rounded-full object-cover border-2 border-club-pink dark:border-club-blue" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-club-pink to-rose-400 dark:from-club-blue dark:to-cyan-400 bg-clip-text text-transparent">
              Clube do Livro
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {user && (
              <div className="flex items-center gap-3">
                <img src={user.user_metadata.avatar_url || "https://ui-avatars.com/api/?name=" + user.user_metadata.full_name} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-gray-300" />
                <button onClick={signOut} className="text-sm font-medium text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400">
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Conteúdo da Tela */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
