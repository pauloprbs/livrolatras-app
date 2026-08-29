import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute() {
  const { user, loading } = useAuth()

  // Enquanto verifica o token no Supabase, mostra um esqueleto de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-club-beige dark:bg-club-darkbg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Se não estiver logado, joga o visitante para a tela de login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se estiver logado, renderiza a tela solicitada
  return <Outlet />
}
