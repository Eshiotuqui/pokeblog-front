import { CalendarClock, Clock, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { servidorOpcional, type Lateral as Dados, type Post } from '../lib/api.ts';
import { dataDaPostagem, dataDoEvento } from '../lib/formato.ts';
import { localeDe, textos, type Lingua } from '../lib/i18n.ts';
import { Pokebola } from './Marca.tsx';
import { Cartao } from './Secao.tsx';
import { rastreio } from '../lib/analytics.ts';

const SITE = process.env.NEXT_PUBLIC_MAIN_SITE ?? 'https://pokegoguide.com';

function Item({ p, lingua, linha }: { p: Post; lingua: Lingua; linha: string }) {
  return (
    <li className="border-b border-line/70 py-3 last:border-0">
      <Link href={`/${lingua}/noticias/${p.slug}`} className="line-clamp-2 font-semibold leading-snug transition hover:text-tema">{p.title}</Link>
      <p className="mt-1 text-xs text-muted">{linha}</p>
    </li>
  );
}

/** "2026-10-05T10:00:00" → { dia: '05', mes: 'out' }, sem fuso (é o horário local de quem joga). */
function diaMes(s: string | null, lingua: Lingua) {
  if (!s) return null;
  const d = new Date(`${s.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return {
    dia: new Intl.DateTimeFormat(localeDe(lingua), { day: '2-digit', timeZone: 'UTC' }).format(d),
    mes: new Intl.DateTimeFormat(localeDe(lingua), { month: 'short', timeZone: 'UTC' }).format(d).replace('.', ''),
  };
}

/** Barra lateral: avisos, recentes/populares, agenda e atalho para o app. */
export async function Lateral({ lingua }: { lingua: Lingua }) {
  const t = textos[lingua].lateral;
  const d = await servidorOpcional<Dados>(`/posts/lateral?lang=${lingua}`);
  if (!d) return null;

  return (
    <aside className="space-y-5">
      {d.avisos.length > 0 && (
        <section aria-label={t.avisos} className="rounded-3xl border border-brand/30 bg-brand/[0.06] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand"><Megaphone size={15} />{t.avisos}</h3>
          <ul className="space-y-2">
            {d.avisos.map((p) => (
              <li key={p.id}><Link href={`/${lingua}/noticias/${p.slug}`} className="font-semibold leading-snug hover:underline">{p.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <Cartao titulo={t.recentes} icone={<Clock size={15} />}>
        <ul>{d.recentes.map((p) => <Item key={p.id} p={p} lingua={lingua} linha={dataDaPostagem(p.publishedAt, lingua)} />)}</ul>
      </Cartao>

      {d.agora.length > 0 && (
        <Cartao titulo={t.agora} icone={<span className="ao-vivo size-2 rounded-full bg-brand" aria-hidden="true" />}>
          <ul>
            {d.agora.map((p) => <Item key={p.id} p={p} lingua={lingua} linha={`${t.ate} ${dataDoEvento(p.eventEnd, lingua) ?? ''}`} />)}
          </ul>
        </Cartao>
      )}

      {d.breve.length > 0 && (
        <Cartao titulo={t.breve} icone={<CalendarClock size={15} />}>
          <ul className="space-y-3 pt-1">
            {d.breve.map((p) => {
              const dm = diaMes(p.eventStart, lingua);
              return (
                <li key={p.id} className="flex items-center gap-3">
                  {dm && (
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-raised text-center leading-none">
                      <span><span className="block text-lg font-extrabold">{dm.dia}</span><span className="block text-[10px] font-bold uppercase text-tema">{dm.mes}</span></span>
                    </span>
                  )}
                  <Link href={`/${lingua}/noticias/${p.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug transition hover:text-tema">{p.title}</Link>
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}

      <a href={SITE} {...rastreio('ir_para_guia', { origem: 'lateral', destino: '/' })} className="group relative block overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-tema/20 via-surface to-surface p-5 transition hover:border-tema">
        <Pokebola tamanho={44} />
        <strong className="mt-3 block text-lg">PokeGoGuide</strong>
        <span className="block text-sm text-muted">{t.ferramentasTexto}</span>
        <span className="mt-3 inline-block text-sm font-bold text-tema transition group-hover:translate-x-1">{t.abrirSite} →</span>
      </a>
    </aside>
  );
}
