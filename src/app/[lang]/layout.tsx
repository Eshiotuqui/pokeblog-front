import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AuthProvider } from '../../components/Auth.tsx';
import { Header } from '../../components/Header.tsx';
import { ehLingua, LINGUAS, textos } from '../../lib/i18n.ts';
import './globals.css';

export const dynamicParams = false;
export const generateStaticParams = () => LINGUAS.map((lang) => ({ lang }));

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!ehLingua(lang)) return {};
  const t = textos[lang];
  return {
    metadataBase: new URL(SITE),
    title: { default: t.titulo, template: `%s | ${t.titulo}` },
    description: t.descricao,
    alternates: { languages: { 'pt-BR': '/pt', en: '/en' } },
    openGraph: { siteName: t.titulo, locale: lang === 'pt' ? 'pt_BR' : 'en_US', type: 'website' },
  };
}

export const viewport: Viewport = { themeColor: '#14151b', width: 'device-width', initialScale: 1 };

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  // O tema escolhido vem num cookie: o servidor já entrega a página no tema certo, sem script e sem piscar.
  const salvo = (await cookies()).get('pokeblog_tema')?.value;
  const tema = salvo === 'claro' || salvo === 'escuro' ? salvo : undefined;
  return (
    <html lang={lang === 'pt' ? 'pt-BR' : 'en'} data-tema={tema}>
      <body>
        <AuthProvider>
          <Header lingua={lang} />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-muted">{textos[lang].rodape}</footer>
        </AuthProvider>
      </body>
    </html>
  );
}
