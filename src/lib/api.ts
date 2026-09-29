import type { Lingua } from './i18n.ts';

export interface Post {
  id: number; slug: string; source: 'auto' | 'admin'; category: string;
  title: string; lingua: Lingua; summary: string; body?: string;
  image: string | null; link: string | null;
  eventStart: string | null; eventEnd: string | null; publishedAt: string; views: number; pinned: boolean; favorito?: boolean;
}
export interface Lateral { recentes: Post[]; populares: Post[]; agora: Post[]; breve: Post[]; avisos: Post[] }
export interface Usuario {
  id: number; email: string; role: 'user' | 'admin'; name: string; team: 'valor' | 'mystic' | 'instinct' | null;
  avatarDex: number | null; bio: string; trainerLevel: number | null; favoritePokemon: number[];
}
export interface Lista { total: number; page: number; pages: number; posts: Post[] }
export interface Categoria { id: string; pt: string; en: string }

/** Do servidor (Server Components): fala direto com a API. */
const API = new URL(process.env.API_URL ?? 'http://localhost:4000').origin;

/** A API não respondeu (fora do ar ou erro 5xx). Diferente de "não existe": esse caso devolve null. */
export class ApiIndisponivel extends Error {
  constructor() { super('API indisponível'); }
}

/**
 * `null` = a API respondeu que não existe (404).
 * Se ela não responde, lança ApiIndisponivel: a página mostra um aviso de
 * instabilidade em vez de um 404 falso (que ainda ficaria em cache).
 */
export async function servidor<T>(caminho: string): Promise<T | null> {
  let r: Response;
  try {
    r = await fetch(`${API}${caminho}`, { next: { revalidate: 60 } });
  } catch {
    throw new ApiIndisponivel();
  }
  if (r.status === 404) return null;
  if (!r.ok) throw new ApiIndisponivel();
  return (await r.json()) as T;
}

/** Para dados de apoio (barra lateral, categorias): se falharem, a página segue sem eles. */
export async function servidorOpcional<T>(caminho: string): Promise<T | null> {
  try {
    return await servidor<T>(caminho);
  } catch {
    return null;
  }
}

export class ErroApi extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Do navegador: passa pelo /api do próprio site, então o cookie de login vai junto. */
export async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const r = await fetch(`/api${caminho}`, {
    method: metodo,
    credentials: 'same-origin',
    headers: corpo === undefined ? undefined : { 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const json = (await r.json().catch(() => ({}))) as { erro?: string };
  if (!r.ok) throw new ErroApi(r.status, json.erro ?? 'Erro');
  return json as T;
}
