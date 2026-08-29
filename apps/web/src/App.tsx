import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública (Tela de Login Exclusiva) */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Privadas do Clube (Trancadas pelo Guardião) */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            {/* Futuras rotas aqui: /admin, /perfil, etc */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
