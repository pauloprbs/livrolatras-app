import React, { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Library, CheckSquare, User, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import logo01 from '../../imgs/logo_01.jpeg'

export function SidebarLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Mural' },
    { path: '/indicacoes', icon: Library, label: 'Indicações' },
    { path: '/votacao', icon: CheckSquare, label: 'Votação' },
    { path: '/perfil', icon: User, label: 'Meu Perfil' },
  ]

  return (
    <div className="min-h-screen bg-club-beige flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <img src={logo01} alt="Logo" className="w-8 h-8 object-contain rounded-lg mr-3 shadow-sm" />
          <span className="font-serif font-bold text-xl text-club-blue tracking-tight">Livrólatras</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-club-lightpink text-club-pink' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-club-blue'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-club-pink' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400" />
            Sair do Clube
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header (if needed) */}
        <div className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
             <img src={logo01} alt="Logo" className="w-8 h-8 object-contain rounded-lg mr-2 shadow-sm" />
             <span className="font-serif font-bold text-lg text-club-blue">Livrólatras</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
