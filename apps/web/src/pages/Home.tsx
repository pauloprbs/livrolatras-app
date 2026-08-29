export default function Home() {
  return (
    <>
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

      {/* Placeholder para futuras indicações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-h-[200px] text-gray-400 dark:text-gray-500 border-dashed border-2">
          <p>Nenhum livro indicado ainda.</p>
          <p className="text-sm">Seja o primeiro!</p>
        </div>
      </div>
    </>
  )
}
