import { notFound } from 'next/navigation';
import { Admin } from '../../../components/Admin.tsx';
import { servidorOpcional, type Categoria } from '../../../lib/api.ts';
import { ehLingua } from '../../../lib/i18n.ts';

export const metadata = { robots: { index: false, follow: false } };

export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  const cats = await servidorOpcional<{ categorias: Categoria[] }>('/categorias');
  return <Admin lingua={lang} categorias={cats?.categorias ?? []} />;
}
