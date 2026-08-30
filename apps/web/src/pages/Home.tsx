import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function Home() {
  const [activeRound, setActiveRound] = useState<any>(null)
  const [nominations, setNominations] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Voting State
  const [isVoting, setIsVoting] = useState<string | null>(null)
  const [userVote, setUserVote] = useState<string | null>(null) // ID do livro votado
  const { memberId } = useAuth()

  const fetchNominations = async (roundId: string) => {
    const res = await fetch(`http://127.0.0.1:8000/nominations/round/${roundId}`)
    if (res.ok) {
      setNominations(await res.json())
    }
  }

  const checkUserVote = async (roundId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const res = await fetch(`http://127.0.0.1:8000/rounds/${roundId}/my_vote`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const vote = await res.json()
        setUserVote(vote.nomination_id)
      }
    } catch (e) {
      console.error("Não foi possível carregar o voto", e)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/rounds/active')
        if (res.ok) {
          const round = await res.json()
          setActiveRound(round)
          fetchNominations(round.id)
          checkUserVote(round.id)
        }
      } catch (e) {
        console.error(e)
      }
    }
    init()
  }, [])

  const now = new Date();
  const votingOpensAt = activeRound?.voting_opens_at ? new Date(activeRound.voting_opens_at) : null;
  const votingClosesAt = activeRound?.voting_closes_at ? new Date(activeRound.voting_closes_at) : null;
  
  // Condições de Tempo
  const isBeforeVoting = !votingOpensAt || now < votingOpensAt;
  const isVotingOpen = votingOpensAt && votingClosesAt && now >= votingOpensAt && now <= votingClosesAt;
  const isVotingClosed = votingClosesAt && now > votingClosesAt;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim().length > 2) {
      searchBooks(searchQuery)
    } else {
      setSearchResults([])
    }
  }

  const searchBooks = async (query: string) => {
    setIsSearching(true)
    setHasSearched(true)
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.items || [])
      } else if (res.status === 429) {
        // Fallback para OpenLibrary em caso de bloqueio de IP do Google
        console.warn("Google Books retornou 429. Usando fallback OpenLibrary.")
        const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`)
        if (olRes.ok) {
          const olData = await olRes.json()
          const items = olData.docs.map((doc: any) => ({
            id: doc.key,
            volumeInfo: {
              title: doc.title,
              authors: doc.author_name || [],
              description: "", // Deixamos vazio para que o Backend tente enriquecer via BrasilAPI
              imageLinks: doc.cover_i ? { thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` } : null,
              industryIdentifiers: doc.isbn ? [{ type: 'ISBN_13', identifier: doc.isbn[0] }] : []
            }
          }))
          setSearchResults(items)
        } else {
          alert("O Google bloqueou suas buscas temporariamente e o servidor reserva também falhou. Tente novamente em alguns minutos.")
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBook) return
    setIsSubmitting(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !activeRound) return

    const vol = selectedBook.volumeInfo
    const isbnObj = vol.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10')
    const thumb = vol.imageLinks?.thumbnail?.replace('http:', 'https:') || ''

    const payload = {
      isbn: isbnObj ? isbnObj.identifier : '',
      title: vol.title || '',
      author: vol.authors ? vol.authors.join(', ') : '',
      synopsis: vol.description || '',
      cover_url: thumb
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/nominations/round/${activeRound.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        closeModal()
        fetchNominations(activeRound.id)
      } else {
        const errData = await res.json()
        alert(`Não foi possível enviar a indicação: ${errData.detail}`)
      }
    } catch (err) {
      console.error(err)
      alert("Houve um erro de comunicação com o servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const closeModal = () => {
    setIsModalOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSelectedBook(null)
  }

  return (
    <>
      {activeRound ? (
        <section className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 p-8 mb-10 flex flex-col items-start gap-4 min-h-[300px] justify-center">
          {/* Fundo da Rodada (Imagem ou Cores de fallback) */}
          {activeRound.theme_image_url ? (
            <>
              <img 
                src={activeRound.theme_image_url} 
                alt="Tema" 
                className="absolute inset-0 w-full h-full object-cover z-0" 
              />
              <div className="absolute inset-0 bg-black/60 z-10"></div>
            </>
          ) : (
            <div className="absolute inset-0 bg-white dark:bg-gray-800 z-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-club-lightpink dark:bg-club-blue rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            </div>
          )}
          
          <div className="relative z-20 flex flex-col items-start gap-4">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white bg-club-pink dark:bg-club-blue rounded-full">
              Votação Aberta
            </span>
            <h2 className={`text-4xl font-extrabold mt-2 ${activeRound.theme_image_url ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {activeRound.theme_name}
            </h2>
            <p className={`max-w-2xl text-lg whitespace-pre-wrap ${activeRound.theme_image_url ? 'text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}>
              {activeRound.theme_description}
            </p>
            
            {isBeforeVoting && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-6 py-3 bg-club-pink dark:bg-club-blue hover:bg-pink-600 dark:hover:bg-blue-700 text-white font-medium rounded-full shadow-lg transition-transform transform hover:-translate-y-1"
              >
                Indicar Livro
              </button>
            )}
            
            {isVotingOpen && (
              <div className="mt-4 flex flex-col items-start gap-2">
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 text-white font-medium">
                  {userVote ? 'Seu voto foi registrado!' : 'Votação em andamento! Escolha abaixo.'}
                </div>
                {userVote && (
                  <p className="text-sm text-white/80 italic ml-2">Você ainda pode trocar seu voto até o encerramento.</p>
                )}
              </div>
            )}
            
            {isVotingClosed && (
              <div className="mt-4 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 text-white font-medium">
                Votação Encerrada.
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="text-center py-20 text-gray-500">Nenhuma rodada ativa no momento.</div>
      )}

      {/* Grid de Indicações */}
      {activeRound && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nominations.length > 0 ? (
            nominations.map((nom) => (
              <div key={nom.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-lg transition-shadow">
                {nom.cover_url ? (
                  <img src={nom.cover_url} alt={nom.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">Sem Capa</div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{nom.title || 'Livro sem título'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{nom.author || 'Autor desconhecido'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-1">
                    {nom.synopsis || 'Sem sinopse disponível.'}
                  </p>
                  
                  {/* Etiqueta de Status */}
                  <div className="flex flex-col gap-2 mt-2">
                    {nom.status === 'pending_metadata' && (
                      <span className="self-start text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Aguardando Curadoria</span>
                    )}
                    {nom.status === 'pending' && (
                      <span className="self-start text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Em Validação</span>
                    )}
                    {nom.status === 'approved' && (
                      <span className="self-start text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1 font-medium shadow-sm">
                        <span>✨</span> Aprovado para Votação
                      </span>
                    )}
                    {nom.status === 'rejected' && (
                      <span className="self-start text-xs bg-red-100 text-red-800 px-2 py-1 rounded" title="Recusado por fuga ao tema">
                        🚫 Fora do Tema
                      </span>
                    )}
                    
                    {/* Parecer da IA (Apenas se rejeitado) */}
                    {nom.status === 'rejected' && nom.llm_opinion && (
                      <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                        <p className="text-xs text-red-700 dark:text-red-400 font-semibold mb-1">Motivo da Recusa (IA):</p>
                        <p className="text-xs text-red-600 dark:text-red-300 italic">"{nom.llm_opinion}"</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Botão de Votar */}
                  {isVotingOpen && nom.status === 'approved' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      {nom.user_id === memberId ? (
                        <div className="text-center text-sm text-gray-500 font-medium py-2">
                          Seu livro indicado
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (!session) return
                            setIsVoting(nom.id)
                            try {
                              const res = await fetch(`http://127.0.0.1:8000/rounds/${activeRound.id}/vote`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({ nomination_id: nom.id })
                              })
                              if (res.ok) {
                                setUserVote(nom.id)
                                alert("Voto registrado com sucesso!")
                              } else {
                                const err = await res.json()
                                alert(`Erro ao votar: ${err.detail}`)
                              }
                            } catch (e) {
                              alert("Erro de conexão.")
                            } finally {
                              setIsVoting(null)
                            }
                          }}
                          disabled={isVoting === nom.id || userVote === nom.id}
                          className={`w-full py-2.5 rounded-lg font-bold transition-all ${
                            userVote === nom.id 
                              ? 'bg-green-500 text-white cursor-default' 
                              : userVote !== null 
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                                : 'bg-club-blue hover:bg-blue-800 text-white shadow-md'
                          }`}
                        >
                          {isVoting === nom.id ? 'Processando...' : userVote === nom.id ? 'Seu Voto Atual ✓' : userVote !== null ? 'Trocar para este Livro' : 'Votar Neste Livro'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-h-[200px] text-gray-400 border-dashed border-2">
              <p>Nenhum livro indicado ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Indicação Interativa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-full">✕</button>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Encontre o Livro</h3>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative mb-4 flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={e => { setSearchQuery(e.target.value); setSelectedBook(null) }}
                  placeholder="Digite o título ou autor..."
                  className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg dark:text-white focus:border-club-pink dark:focus:border-club-blue outline-none transition-colors"
                  autoFocus
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              </div>
              <button 
                type="submit" 
                disabled={isSearching || searchQuery.trim().length < 3}
                className="px-6 py-4 bg-club-blue hover:bg-blue-800 text-white font-bold rounded-2xl shadow-lg disabled:opacity-50 transition-colors"
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
              {!selectedBook && searchResults.length > 0 && searchResults.map((book) => {
                const vol = book.volumeInfo
                const thumb = vol.imageLinks?.thumbnail?.replace('http:', 'https:')
                return (
                  <div 
                    key={book.id} 
                    onClick={() => setSelectedBook(book)}
                    className="flex gap-4 p-3 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all items-center"
                  >
                    {thumb ? (
                      <img src={thumb} alt="Capa" className="w-12 h-16 object-cover rounded shadow-sm" />
                    ) : (
                      <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400 text-center leading-tight">Sem<br/>Capa</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate">{vol.title}</h4>
                      <p className="text-sm text-gray-500 truncate">{vol.authors?.join(', ') || 'Autor desconhecido'}</p>
                    </div>
                  </div>
                )
              })}
              
              {!selectedBook && searchResults.length === 0 && hasSearched && !isSearching && (
                <div className="text-center py-8 text-gray-500">Nenhum livro encontrado. Tente simplificar a busca.</div>
              )}
            </div>

            {/* Selected Book Confirmation */}
            {selectedBook && (
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 animate-fade-in mt-4">
                <div className="flex gap-6 p-6 bg-club-beige dark:bg-gray-800 rounded-2xl border border-club-pink/20 dark:border-club-blue/20">
                  {selectedBook.volumeInfo.imageLinks?.thumbnail ? (
                    <img src={selectedBook.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')} alt="Capa" className="w-24 h-36 object-cover rounded-lg shadow-md" />
                  ) : (
                    <div className="w-24 h-36 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">Sem Capa</div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-extrabold text-xl text-gray-900 dark:text-white mb-1 line-clamp-2">{selectedBook.volumeInfo.title}</h4>
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-3">{selectedBook.volumeInfo.authors?.join(', ')}</p>
                    <p className="text-xs text-gray-500 line-clamp-3 italic">"{selectedBook.volumeInfo.description || 'Sinopse não disponível.'}"</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setSelectedBook(null)} className="flex-1 py-3 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold rounded-xl transition-colors">
                    Voltar
                  </button>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="flex-[2] py-3 bg-club-blue hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Analisando e Enviando...' : 'Confirmar Indicação'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
