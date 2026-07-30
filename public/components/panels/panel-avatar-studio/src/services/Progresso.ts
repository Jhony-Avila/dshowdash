// services/Progresso.ts — itens já usados + favoritos (AS3 F2c, §8/§16).
// @version 1.0.0  @created 2026-07-30
//
// "Usado" = já esteve equipado no editor alguma vez (alimenta o progresso
// das coleções). Favoritos alimentam o filtro da grade. Ambos por navegador
// (localStorage); quando as conquistas server-side chegarem (F3), este
// módulo passa a espelhar o backend — a interface não muda.
import type { AvatarConfig } from '../domain/types';

const CHAVE_USADOS = 'dshow.avatar.usados.v1';
const CHAVE_FAVORITOS = 'dshow.avatar.favoritos.v1';

function ler(chave: string): Set<string> {
  try {
    const bruto = localStorage.getItem(chave);
    const lista = bruto ? JSON.parse(bruto) : [];
    return new Set(Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : []);
  } catch { return new Set(); }
}

function gravar(chave: string, valores: Set<string>): void {
  try { localStorage.setItem(chave, JSON.stringify([...valores].slice(0, 500))); } catch { /* sem espaço */ }
}

export function itensUsados(): Set<string> {
  return ler(CHAVE_USADOS);
}

/** Marca tudo que está equipado no config como "já usado". */
export function registrarUso(config: AvatarConfig): void {
  const usados = ler(CHAVE_USADOS);
  const antes = usados.size;
  usados.add(config.base);
  for (const id of Object.values(config.camadas)) if (id) usados.add(id);
  if (usados.size !== antes) gravar(CHAVE_USADOS, usados);
}

export function favoritos(): Set<string> {
  return ler(CHAVE_FAVORITOS);
}

// ── Espelho no SERVIDOR (Expansão — avatar_user_favorites) ───────────
// localStorage continua sendo a fonte imediata (zero latência na UI);
// o servidor guarda a cópia multi-device. Sem catálogo migrado, o
// endpoint responde 'indisponivel' e nada muda por aqui.

let _csrfFav: string | null = null;
async function csrfFav(): Promise<string | null> {
  if (_csrfFav) return _csrfFav;
  try {
    const r = await fetch('/api/auth/check.php', { credentials: 'include', cache: 'no-store' });
    _csrfFav = (await r.json())?.data?.session?.csrf_token ?? null;
  } catch { /* sem sessão */ }
  return _csrfFav;
}

/** União servidor ∪ local no boot do estúdio (fire-and-forget no App). */
export async function sincronizarFavoritos(): Promise<void> {
  try {
    const r = await fetch('/api/avatar/favoritos.php', { credentials: 'include', cache: 'no-store' });
    if (!r.ok) return;
    const d = (await r.json())?.data;
    if (d?.fonte !== 'servidor' || !Array.isArray(d.itens)) return;
    const locais = ler(CHAVE_FAVORITOS);
    const unidos = new Set<string>([...locais, ...d.itens.filter((x: unknown) => typeof x === 'string')]);
    gravar(CHAVE_FAVORITOS, unidos);
    // itens só-locais sobem para o servidor (uma vez, melhor esforço)
    const soLocais = [...locais].filter((x) => !d.itens.includes(x));
    if (soLocais.length > 0) {
      const t = await csrfFav();
      for (const item of soLocais.slice(0, 30)) {
        void fetch('/api/avatar/favoritos.php', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...(t ? { 'X-CSRF-Token': t } : {}) },
          body: JSON.stringify({ item }),
        }).catch(() => undefined);
      }
    }
  } catch { /* offline — segue local */ }
}

export function alternarFavorito(id: string): Set<string> {
  const favs = ler(CHAVE_FAVORITOS);
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  gravar(CHAVE_FAVORITOS, favs);
  // espelha no servidor sem bloquear a UI
  void csrfFav().then((t) => fetch('/api/avatar/favoritos.php', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(t ? { 'X-CSRF-Token': t } : {}) },
    body: JSON.stringify({ item: id }),
  })).catch(() => undefined);
  return favs;
}
