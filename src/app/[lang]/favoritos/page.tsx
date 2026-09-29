import { notFound } from 'next/navigation';
import { Favoritos } from '../../../components/Favoritos.tsx';
import { servidorOpcional, type Categoria } from '../../../lib/api.ts';
import { ehLingua, textos } from '../../../lib/i18n.ts';

export const metadata = { robots: { index: false } };

export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  const cats = await servidorOpcional<{ categorias: Categoria[] }>('/categorias');
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{textos[lang].favoritos.titulo}</h1>
      <Favoritos lingua={lang} categorias={cats?.categorias ?? []} />
    </div>
  );
}
