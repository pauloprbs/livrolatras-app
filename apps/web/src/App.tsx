import { useState, useEffect } from 'react'

function App() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen bg-club-beige dark:bg-club-darkbg transition-colors duration-300">
      
      {/* Navbar Premium */}
      <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/imgs/logo_01.jpeg" alt="Livrólatras" className="w-10 h-10 rounded-full object-cover border-2 border-club-pink dark:border-club-blue" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-club-pink to-rose-400 dark:from-club-blue dark:to-cyan-400 bg-clip-text text-transparent">
              Clube do Livro
            </h1>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      {/* Conteúdo (Home Feed) */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Banner da Rodada */}
        <section className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 p-8 mb-10 flex flex-col items-start gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-club-lightpink dark:bg-club-blue rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white bg-club-pink dark:bg-club-blue rounded-full">
            Votação Aberta
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">
            Mistérios em alto mar
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
            Neste mês, embarcamos em narrativas cercadas pelo oceano, onde o isolamento e as águas profundas escondem segredos que ninguém imagina.
          </p>
          <button className="mt-4 px-6 py-3 bg-club-pink dark:bg-club-blue hover:bg-pink-600 dark:hover:bg-blue-700 text-white font-medium rounded-full shadow-lg shadow-pink-500/30 dark:shadow-blue-500/30 transition-transform transform hover:-translate-y-1">
            Indicar Livro
          </button>
        </section>

      </main>
    </div>
  )
}

export default App
