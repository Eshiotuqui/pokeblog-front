import { notFound } from 'next/navigation';
import { AuthForm } from '../../../components/AuthForm.tsx';
import { ehLingua } from '../../../lib/i18n.ts';
import { destinoSeguro } from '../../../lib/seguranca.ts';

export const metadata = { robots: { index: false, follow: false } };

export default async function Pagina({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string }> }) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  const { next } = await searchParams;
  // "next" só vale se for um caminho do próprio site (nada de //outro-site.com): senão vira redirecionamento aberto.
  return <AuthForm lingua={lang} modo="entrar" destino={destinoSeguro(next, lang)} />;
}
