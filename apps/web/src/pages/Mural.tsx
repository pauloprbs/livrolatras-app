import React, { useState, useEffect } from 'react'
import { Sparkles, Calendar, BookMarked, Quote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Mural() {
  const [activeRound, setActiveRound] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchActiveRound = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/rounds/active')
        if (res.ok) {
          const round = await res.json()
          setActiveRound(round)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchActiveRound()
  }, [])

  const now = new Date()
  const votingOpensAt = activeRound?.voting_opens_at ? new Date(activeRound.voting_opens_at) : null
  const votingClosesAt = activeRound?.voting_closes_at ? new Date(activeRound.voting_closes_at) : null
  
  const isBeforeVoting = !votingOpensAt || now < votingOpensAt
  const isVotingOpen = votingOpensAt && votingClosesAt && now >= votingOpensAt && now <= votingClosesAt
  const isVotingClosed = votingClosesAt && now > votingClosesAt

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-club-blue tracking-tight">Mural do Clube</h1>
        <p className="text-gray-500 mt-2 text-lg">Acompanhe as novidades e o andamento da leitura.</p>
      </header>

      {/* Banner Destaque */}
      {activeRound ? (
        <div className="bg-club-blue rounded-2xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden min-h-[300px] flex flex-col justify-center">
          {activeRound.theme_image_url && (
            <>
              <img 
                src={activeRound.theme_image_url} 
                alt="Tema" 
                className="absolute inset-0 w-full h-full object-cover z-0" 
              />
              <div className="absolute inset-0 bg-black/60 z-10"></div>
            </>
          )}
          <div className="relative z-20">
            <span className="inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-4 backdrop-blur-md">
              <Sparkles className="w-4 h-4 mr-2 text-club-pink" />
              Tema do Mês
            </span>
            <h2 className="text-2xl md:text-4xl font-serif font-bold mb-2">{activeRound.theme_name}</h2>
            
            {/* Status Dinâmico */}
            {isBeforeVoting && (
              <p className="text-blue-100 font-medium mb-6">Indicações de livros em andamento</p>
            )}
            {isVotingOpen && (
              <p className="text-green-300 font-medium mb-6">Votação aberta! Escolha seu favorito.</p>
            )}
            {isVotingClosed && (
              <p className="text-yellow-300 font-medium mb-6">Livro escolhido! Veja o vencedor.</p>
            )}

            <button 
              onClick={() => {
                if (isBeforeVoting) navigate('/indicacoes')
                else if (isVotingOpen) navigate('/votacao')
                else navigate('/') // Futuro: link pro livro vencedor
              }}
              className="bg-club-pink text-white font-medium px-5 py-2.5 rounded-lg shadow hover:bg-pink-600 transition-colors"
            >
              {isBeforeVoting ? 'Ir para Indicações' : isVotingOpen ? 'Ir para Votação' : 'Ver Livro Vencedor'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-10 flex items-center justify-center text-gray-500">
          Nenhuma rodada ativa no momento.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Agenda */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-club-lightpink flex items-center justify-center mr-4">
              <Calendar className="w-5 h-5 text-club-pink" />
            </div>
            <h3 className="font-bold text-lg text-club-blue">Próximo Encontro</h3>
          </div>
          <p className="text-gray-600 mb-2">A data oficial do encontro desta rodada será definida em breve. Prepare seu checklist de leitura!</p>
          <div className="mt-4 inline-block bg-gray-100 text-gray-700 font-medium text-sm px-3 py-1 rounded-md">
            Status: Aguardando Agendamento
          </div>
        </div>

        {/* Card Inspiração */}
        <div className="bg-club-blue rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="relative z-10 h-full flex flex-col justify-center">
            <Quote className="w-8 h-8 text-club-pink/50 mb-3" />
            <p className="text-white font-serif italic text-lg leading-relaxed">
              "Um leitor vive mil vidas antes de morrer. O homem que nunca lê vive apenas uma."
            </p>
            <p className="text-blue-200 mt-4 text-sm font-medium">— George R.R. Martin</p>
          </div>
        </div>
      </div>
    </div>
  )
}
