import React from 'react'
import { Sparkles, Calendar, BookMarked, Quote } from 'lucide-react'

export function Mural() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-club-blue tracking-tight">Mural do Clube</h1>
        <p className="text-gray-500 mt-2 text-lg">Acompanhe as novidades e o andamento da leitura.</p>
      </header>

      {/* Banner Destaque */}
      <div className="bg-club-blue rounded-2xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-4 backdrop-blur-md">
            <Sparkles className="w-4 h-4 mr-2 text-club-pink" />
            Rodada em Andamento
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">Grandes Épicos</h2>
          <p className="text-blue-100 max-w-lg text-sm md:text-base leading-relaxed mb-6">
            O tema oficial deste mês foca em jornadas grandiosas, mundos expansivos e heróis inesquecíveis. A fase de indicação de livros já começou!
          </p>
          <button className="bg-club-pink text-white font-medium px-5 py-2.5 rounded-lg shadow hover:bg-pink-600 transition-colors">
            Ver Indicações
          </button>
        </div>
        {/* Decoração Background */}
        <BookMarked className="absolute -right-8 -bottom-8 w-64 h-64 text-black/10" />
      </div>

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
