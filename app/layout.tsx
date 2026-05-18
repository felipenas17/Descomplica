import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gestão de Escolas | Administração Educacional Moderna',
  description: 'App completo para gestão de horários, professores e controle financeiro de instituições de ensino.',
  keywords: 'Gestão de Escolas, Software Educacional, Agendamento Professores, Controle Financeiro Escolar, DRE Educação, App para Escolas, Organização Escolar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
