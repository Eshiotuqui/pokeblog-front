import { notFound } from 'next/navigation';
import { AuthForm } from '../../../components/AuthForm.tsx';
import { ehLingua } from '../../../lib/i18n.ts';

export const metadata = { robots: { index: false, follow: false } };

export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  return <AuthForm lingua={lang} modo="cadastro" />;
}
