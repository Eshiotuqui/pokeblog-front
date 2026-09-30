import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AuthProvider } from '../../components/Auth.tsx';
import { Header } from '../../components/Header.tsx';
import { ehLingua, LINGUAS, textos } from '../../lib/i18n.ts';
import { Analytics } from '../../components/Analytics.tsx';
import { AvisoMfa } from '../../components/AvisoMfa.tsx';
import { servidorOpcional, type Categoria } from '../../lib/api.ts';
import { MARCA, NOME, SITE, SITE_PRINCIPAL, urlDe } from '../../lib/seo.ts';
import Link from 'next/link';
import './globals.css';

export const dynamicParams = false;
export const generateStaticParams = () => LINGUAS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!ehLingua(lang)) return {};
  const t = textos[lang];
  const google = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();
  const bing = process.env.NEXT_PUBLIC_BING_VERIFICATION?.trim();
  return {
    metadataBase: new URL(SITE),
    applicationName: NOME,
    // Cada página define o seu título completo; este modelo é só a rede de segurança.
    title: { default: t.seo.inicioTitulo, template: `%s | ${NOME}` },
    description: t.seo.inicioDescricao,
    authors: [{ name: MARCA, url: SITE_PRINCIPAL }],
    creator: MARCA,
    publisher: MARCA,
    formatDetection: { telephone: false, email: false, address: false },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    alternates: { types: { 'application/rss+xml': urlDe(lang, '/feed.xml') } },
    // Search Console e Bing Webmaster: cole o código de verificação no ambiente (ou verifique pelo DNS).
    verification: { ...(google ? { google } : {}), ...(bing ? { other: { 'msvalidate.01': bing } } : {}) },
  };
}

export const viewport: Viewport = { themeColor: '#14151b', width: 'device-width', initialScale: 1 };

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  // O tema escolhido vem num cookie: o servidor já entrega a página no tema certo, sem script e sem piscar.
  const salvo = (await cookies()).get('pokeblog_tema')?.value;
  const tema = salvo === 'claro' || salvo === 'escuro' ? salvo : undefined;
  const cats = (await servidorOpcional<{ categorias: Categoria[] }>('/categorias'))?.categorias ?? [];
  return (
    <html lang={lang === 'pt' ? 'pt-BR' : 'en'} data-tema={tema}>
      <body>
        <AuthProvider>
          <Header lingua={lang} />
          <AvisoMfa lingua={lang} />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl space-y-3 px-4 pb-10 pt-4 text-center text-xs text-muted">
            {cats.length > 0 && (
              <nav aria-label={textos[lang].seo.categorias} className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {cats.map((c) => <Link key={c.id} href={`/${lang}/categoria/${c.id}`} className="hover:text-ink hover:underline">{c[lang]}</Link>)}
                <a href={urlDe(lang, '/feed.xml')} className="hover:text-ink hover:underline">RSS</a>
              </nav>
            )}
            <p>{textos[lang].rodape}</p>
          </footer>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
