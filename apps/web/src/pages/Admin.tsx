import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function Admin() {
  const { role } = useAuth()
  const [activeRound, setActiveRound] = useState<any>(null)
  const [nominations, setNominations] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [attendances, setAttendances] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      // Get Active Round
      const roundRes = await fetch('http://127.0.0.1:8000/rounds/active')
      if (roundRes.ok) {
        const round = await roundRes.json()
        setActiveRound(round)
        
        // Get Nominations
        const nomRes = await fetch(`http://127.0.0.1:8000/nominations/round/${round.id}`)
        if (nomRes.ok) setNominations(await nomRes.json())
          
        // Get Attendances
        const attRes = await fetch(`http://127.0.0.1:8000/rounds/${round.id}/attendance`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (attRes.ok) {
          const atts = await attRes.json()
          setAttendances(atts.map((a: any) => a.user_id))
        }
      }

      // Get Members
      const memRes = await fetch('http://127.0.0.1:8000/auth/members', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (memRes.ok) setMembers(await memRes.json())

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (nomId: string, status: str) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const res = await fetch(`http://127.0.0.1:8000/nominations/${nomId}/status?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        fetchData()
      } else {
        alert("Erro ao atualizar status.")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleAttendance = async (userId: string, isAttending: boolean) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !activeRound) return

    try {
      const url = `http://127.0.0.1:8000/rounds/${activeRound.id}/attendance/${userId}`
      const method = isAttending ? 'POST' : 'DELETE'
      
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (res.ok) {
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (role !== 'admin' && role !== 'super_admin') {
    return <div className="p-8 text-center text-red-500 font-bold">Acesso Negado.</div>
  }

  if (loading) return <div className="p-8">Carregando painel...</div>

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-club-blue tracking-tight">Painel do Admin</h1>
        <p className="text-gray-500 mt-2 text-lg">Moderação de indicações e controle de presença.</p>
      </header>

      {!activeRound ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">Nenhuma rodada ativa para gerenciar.</div>
      ) : (
        <>
          {/* Sessão de Configuração do Tema (Placeholder Futuro) */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
              <span className="bg-club-blue text-white px-4 py-2 rounded-full font-bold shadow-lg">Em Breve (Fase 11)</span>
            </div>
            
            <h2 className="text-2xl font-bold text-club-blue mb-4">Configurar Rodada Atual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Tema</label>
                <input type="text" disabled value={activeRound.theme_name} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Texto do Mural</label>
                <select disabled className="w-full border rounded-lg p-2">
                  <option>Branco (Para fundos escuros)</option>
                  <option>Preto (Para fundos claros)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abertura da Votação</label>
                <input type="datetime-local" disabled className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encerramento da Votação</label>
                <input type="datetime-local" disabled className="w-full border rounded-lg p-2" />
              </div>
            </div>
          </section>

          {/* Sessão de Indicações */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-club-blue mb-6">Aprovação de Indicações</h2>
            
            <div className="space-y-4">
              {nominations.filter(n => n.status === 'pending' || n.status === 'pending_metadata').length === 0 && (
                <p className="text-gray-500">Nenhuma indicação pendente de moderação.</p>
              )}
              
              {nominations.filter(n => n.status === 'pending' || n.status === 'pending_metadata').map(nom => (
                <div key={nom.id} className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  {nom.cover_url ? (
                    <img src={nom.cover_url} alt={nom.title} className="w-16 h-24 object-cover rounded shadow" />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 rounded flex flex-col items-center justify-center text-[10px] text-gray-500 text-center px-1">Sem Capa</div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{nom.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{nom.author}</p>
                    {nom.llm_opinion && (
                      <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded mb-2 border border-blue-100">
                        <strong>🤖 IA:</strong> {nom.llm_opinion}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleUpdateStatus(nom.id, 'approved')}
                      className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Aprovar
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(nom.id, 'rejected')}
                      className="flex-1 md:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">Livros já avaliados nesta rodada:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nominations.filter(n => n.status === 'approved' || n.status === 'rejected').map(nom => (
                <div key={nom.id} className={`p-4 rounded-xl border ${nom.status === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <h4 className="font-bold text-sm truncate">{nom.title}</h4>
                  <p className="text-xs text-gray-600 truncate">{nom.author}</p>
                  <span className={`text-[10px] font-bold uppercase mt-2 inline-block px-2 py-1 rounded ${nom.status === 'approved' ? 'text-green-800 bg-green-200' : 'text-red-800 bg-red-200'}`}>
                    {nom.status === 'approved' ? 'Aprovado' : 'Recusado'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Sessão de Presenças */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-club-blue mb-2">Check-in do Encontro</h2>
            <p className="text-gray-500 text-sm mb-6">Membros com presença confirmada terão peso 1.3 nos votos da próxima rodada.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {members.map(member => {
                const isPresent = attendances.includes(member.id)
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-club-lightpink flex items-center justify-center text-club-pink font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="font-medium text-sm text-gray-900 truncate">{member.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase">{member.role}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleToggleAttendance(member.id, !isPresent)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPresent ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                    >
                      {isPresent ? '✓' : ''}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
