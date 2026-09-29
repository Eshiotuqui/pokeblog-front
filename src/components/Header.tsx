'use client';

import { Heart, LogOut, Moon, Shield, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { spriteDe } from '../lib/formato.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';
import { Pokebola } from './Marca.tsx';


export function Header({ lingua }: { lingua: Lingua }) {
  const t = textos[lingua];
  const { usuario, carregando, sair } = useAuth();
  const caminho = usePathname();
  const outra: Lingua = lingua === 'pt' ? 'en' : 'pt';
  // Troca só o primeiro segmento (/pt/... → /en/...), mantendo a página.
  const trocaLingua = caminho.replace(/^\/(pt|en)/, `/${outra}`);
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const h = document.documentElement.getAttribute('data-tema');
    setEscuro(h ? h === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const alternarTema = () => {
    const novo = escuro ? 'claro' : 'escuro';
    document.documentElement.setAttribute('data-tema', novo);
    document.cookie = `pokeblog_tema=${novo}; path=/; max-age=31536000; samesite=lax`;
    setEscuro(!escuro);
  };

  const link = 'grid min-h-10 min-w-9 place-items-center rounded-lg px-2 text-sm font-medium sm:px-2.5 text-muted transition hover:bg-highlight hover:text-ink';

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-0.5 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2.5">
        <Link href={`/${lingua}`} className="mr-auto flex min-w-0 items-center gap-2 whitespace-nowrap font-extrabold tracking-tight">
          <Pokebola />
          <span className="max-[379px]:hidden">PokeGoGuide<span className="text-tema max-[430px]:hidden"> Blog</span></span>
        </Link>

        {usuario && (
          <Link href={`/${lingua}/favoritos`} className={link} aria-label={t.nav.favoritos} title={t.nav.favoritos}>
            <Heart size={18} />
          </Link>
        )}
        {usuario?.role === 'admin' && (
          <Link href={`/${lingua}/admin`} className={link} aria-label={t.nav.admin} title={t.nav.admin}>
            <Shield size={18} className="sm:hidden" /><span className="hidden sm:inline">{t.nav.admin}</span>
          </Link>
        )}
        {usuario ? (
          <>
            {/* O círculo é o perfil: foto (o Pokémon escolhido) ou a inicial do nome. */}
            <Link href={`/${lingua}/perfil`} aria-label={`${t.nav.perfil}: ${usuario.name}`} title={usuario.name}
              className="grid size-9 place-items-center overflow-hidden rounded-full border border-line bg-raised text-sm font-extrabold transition hover:border-tema">
              {usuario.avatarDex
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={spriteDe(usuario.avatarDex)} alt="" width={36} height={36} className="size-9 object-contain" />
                : usuario.name.slice(0, 1).toUpperCase()}
            </Link>
            <button onClick={() => void sair()} className={link} aria-label={t.nav.sair} title={t.nav.sair}><LogOut size={18} /></button>
          </>
        ) : !carregando && (
          <Link href={`/${lingua}/entrar`} className="botao-suave !px-3 !py-1.5 text-sm whitespace-nowrap">{t.nav.entrar}</Link>
        )}

        <Link href={trocaLingua} className={`${link} uppercase`} hrefLang={outra} aria-label={outra === 'en' ? 'English' : 'Português'}>{outra}</Link>
        <button onClick={alternarTema} className={link} aria-label={t.tema}>
          {escuro ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      {/* Seções: Notícias (automáticas), Matérias (escritas por nós) e Perguntas. */}
      <nav aria-label="seções" className="sem-barra mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-1.5 sm:px-4">
        {([['', t.navSecoes.noticias], ['/materias', t.navSecoes.materias], ['/perguntas', t.navSecoes.perguntas]] as const).map(([c, rotulo]) => {
          const href = `/${lingua}${c}`;
          const ativo = c === '' ? caminho === `/${lingua}` || caminho.startsWith(`/${lingua}/noticias`) || caminho.startsWith(`/${lingua}/categoria`) : caminho.startsWith(href);
          return (
            <Link key={c} href={href} aria-current={ativo ? 'page' : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition ${ativo ? 'bg-tema text-bg' : 'text-muted hover:bg-highlight hover:text-ink'}`}>
              {rotulo}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
