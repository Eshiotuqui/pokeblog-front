import { notFound } from 'next/navigation';
import { PerfilForm } from '../../../components/PerfilForm.tsx';
import { ehLingua } from '../../../lib/i18n.ts';

export const metadata = { robots: { index: false } };

export default async function Perfil({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  return <PerfilForm lingua={lang} />;
}
