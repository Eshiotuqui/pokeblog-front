import { localeDe, type Lingua } from './i18n.ts';

/**
 * Datas de evento vêm sem fuso ("2026-09-28T06:00:00.000"): valem no horário
 * local de quem joga. Formatar em UTC mantém o número igual no servidor e no
 * navegador, sem descompasso de hidratação.
 */
export function dataDoEvento(s: string | null, l: Lingua): string | null {
  if (!s) return null;
  const d = new Date(`${s.slice(0, 19)}Z`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(localeDe(l), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(d);
}

export const dataDaPostagem = (iso: string, l: Lingua): string =>
  new Intl.DateTimeFormat(localeDe(l), { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));

/** Só http(s): a imagem e o link vêm de fora. */
export const urlSegura = (u: string | null): string | null => (u && /^https?:\/\//i.test(u) ? u : null);

export const spriteDe = (dex: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;
