import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h2 className="text-4xl font-bold text-primary mb-4">404</h2>
      <p className="text-gray-500 mb-8">Página não encontrada.</p>
      <Link
        href="/"
        className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-all"
      >
        Voltar ao Início
      </Link>
    </div>
  );
}
