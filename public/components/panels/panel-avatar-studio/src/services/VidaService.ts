// services/VidaService.ts — conquistas, eventos e Criar com IA (AS3 F3).
// @version 1.0.0  @created 2026-07-30
//
// Conquistas/eventos vêm SEMPRE do servidor (auditáveis — decisão #25).
// Criar com IA: tenta o /api/avatar/vida.php (ProvedorIA server-side,
// desacoplado de fornecedor — decisão #24); sem chave configurada (501),
// cai no COMPOSITOR TEMÁTICO local — o botão funciona desde o dia 1.
import type { AvatarConfig, Conquista } from '../domain/types';
import {
  CONFIG_PADRAO, CORES_SUGERIDAS, PARTES, aleatorio, itensDe, validarConfig,
} from './AvatarCatalog';

const URL_VIDA = '/api/avatar/vida.php';
const URL_SESSAO = '/api/auth/check.php';

export interface EventoSazonal {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  inicio: string;
  fim: string;
  itens: string[];
}

export interface Vida {
  conquistas: Conquista[];
  eventos: EventoSazonal[];
  desbloqueados: Set<string>;
  iaDisponivel: boolean;
}

export interface Personagem {
  config: AvatarConfig;
  nome: string;
  historia: string;
  fonte: 'ia' | 'local';
}

export async function carregarVida(signal?: AbortSignal): Promise<Vida | null> {
  try {
    const r = await fetch(URL_VIDA, { credentials: 'include', signal, cache: 'no-store' });
    if (!r.ok) return null;
    const d = (await r.json())?.data ?? {};
    return {
      conquistas: Array.isArray(d.conquistas) ? d.conquistas.map((c: Record<string, unknown>) => ({
        id: String(c.id ?? ''),
        nome: String(c.nome ?? ''),
        descricao: String(c.descricao ?? ''),
        conquistada: Boolean(c.conquistada),
        em: typeof c.em === 'string' ? c.em : null,
        recompensa: typeof c.recompensa === 'string' ? c.recompensa : null,
      })) : [],
      eventos: Array.isArray(d.eventos) ? d.eventos : [],
      desbloqueados: new Set(Array.isArray(d.desbloqueados) ? d.desbloqueados : []),
      iaDisponivel: Boolean(d.ia_disponivel),
    };
  } catch {
    return null;
  }
}

// ── Criar com IA ────────────────────────────────────────────────────

let _csrf: string | null = null;
async function csrf(): Promise<string | null> {
  if (_csrf) return _csrf;
  try {
    const r = await fetch(URL_SESSAO, { credentials: 'include', cache: 'no-store' });
    _csrf = (await r.json())?.data?.session?.csrf_token ?? null;
  } catch { /* sem sessão */ }
  return _csrf;
}

/** Catálogo compacto p/ o prompt (só o que a IA precisa escolher). */
function catalogoCompacto(): Record<string, Array<{ id: string; nome: string; tema: string; raridade: string }>> {
  const saida: Record<string, Array<{ id: string; nome: string; tema: string; raridade: string }>> = {};
  for (const p of PARTES) {
    if (p.bloqueadoPor) continue; // a IA não veste o que o usuário não destravou
    (saida[p.categoria] ??= []).push({ id: p.id, nome: p.nome, tema: p.tema, raridade: p.raridade });
  }
  return saida;
}

export async function criarComIA(pedido: string, base: AvatarConfig): Promise<Personagem> {
  try {
    const cab: Record<string, string> = { 'Content-Type': 'application/json' };
    const t = await csrf();
    if (t) cab['X-CSRF-Token'] = t;
    const r = await fetch(URL_VIDA, {
      method: 'POST', credentials: 'include', headers: cab,
      body: JSON.stringify({ pedido, catalogo: catalogoCompacto() }),
    });
    if (r.ok) {
      const p = (await r.json())?.data?.personagem ?? {};
      // resposta sem base utilizável → não confia: cai no compositor local
      if (typeof p.base === 'string' && p.base && p.camadas && typeof p.camadas === 'object') {
        return {
          config: validarConfig({ ...CONFIG_PADRAO, base: p.base, camadas: p.camadas, cores: { ...CONFIG_PADRAO.cores, ...p.cores } }),
          nome: p.nome || 'Personagem',
          historia: p.historia || '',
          fonte: 'ia',
        };
      }
    }
  } catch { /* cai no compositor local */ }
  return comporLocal(pedido, base);
}

// ── Compositor temático local (fallback e modo offline) ─────────────

const TEMAS: Array<{ chaves: string[]; temas: string[]; base?: string; nome: string; historia: string }> = [
  { chaves: ['cyber', 'hacker', 'neon', 'punk'], temas: ['cyberpunk', 'tecnologia'], nome: 'Corredor do Neon', historia: 'Nasceu nas vielas de dados. Nunca perdeu um ping.' },
  { chaves: ['executivo', 'ceo', 'terno', 'diretor', 'chefe'], temas: ['executivo'], nome: 'O Executivo', historia: 'Fecha trimestres como quem fecha portas: sem olhar para trás.' },
  { chaves: ['astronauta', 'espaco', 'espaço', 'galaxia', 'galáxia', 'orbital'], temas: ['espaço'], nome: 'Piloto Orbital', historia: 'Viu a Terra de cima e voltou com metas maiores.' },
  { chaves: ['samurai', 'dojo', 'guerreiro', 'kimono', 'oriental'], temas: ['oriental'], nome: 'Lâmina do Dojo', historia: 'Treina antes do stand-up. Todos os dias.' },
  { chaves: ['mago', 'magia', 'fantasia', 'arcano'], temas: ['fantasia'], nome: 'Arquimago do Dash', historia: 'Conjura relatórios com um gesto. O resto é segredo.' },
  { chaves: ['gamer', 'jogador', 'esports', 'e-sports'], temas: ['gamer'], nome: 'Pro Player', historia: 'O GG dele ecoa na arena até hoje.' },
  { chaves: ['robo', 'robô', 'android', 'androide', 'ia', 'sintetico'], temas: ['tecnologia', 'sci-fi'], base: 'bas_androide', nome: 'Unidade Nexus', historia: 'Acordou consciente. Escolheu trabalhar aqui.' },
  { chaves: ['raposa'], temas: ['animais'], base: 'bas_raposa', nome: 'A Raposa', historia: 'Três passos à frente. Sempre.' },
  { chaves: ['panda'], temas: ['animais'], base: 'bas_panda', nome: 'O Panda', historia: 'Calmo. Preciso. Imparável depois do café.' },
  { chaves: ['lobo'], temas: ['animais'], base: 'bas_lobo', nome: 'O Lobo', historia: 'A matilha confia. A meta cai.' },
  { chaves: ['leao', 'leão', 'rei'], temas: ['animais'], base: 'bas_leao', nome: 'O Leão', historia: 'O território é dele desde o onboarding.' },
  { chaves: ['dshow', 'mascote', 'led'], temas: ['dshow'], base: 'bas_ledbot', nome: 'LED Bot', historia: 'O primeiro pixel aceso da casa.' },
];

function semente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function comporLocal(pedido: string, atual: AvatarConfig): Personagem {
  const termo = pedido.toLowerCase();
  const tema = TEMAS.find((t) => t.chaves.some((c) => termo.includes(c)));

  if (!tema) {
    // "me surpreenda" e afins → randomizador ponderado com semente do pedido
    const cfg = aleatorio(semente(pedido || String(atual.versao)));
    return { config: cfg, nome: 'Surpresa do Estúdio', historia: 'Montado pelo destino (e por um bom gerador).', fonte: 'local' };
  }

  const rnd = ((s: number) => () => { s = (s * 48271) % 2147483647; return s / 2147483647; })(semente(pedido) || 7);
  const escolher = (categoria: Parameters<typeof itensDe>[0], obrigatorio: boolean): string | undefined => {
    const doTema = itensDe(categoria).filter((i) => !i.bloqueadoPor && tema.temas.includes(i.tema));
    const lista = doTema.length ? doTema : (obrigatorio ? itensDe(categoria).filter((i) => !i.bloqueadoPor) : []);
    if (!lista.length) return undefined;
    return lista[Math.floor(rnd() * lista.length)].id;
  };

  const cores = { ...atual.cores, destaque: CORES_SUGERIDAS.destaque[Math.floor(rnd() * CORES_SUGERIDAS.destaque.length)] };
  const config = validarConfig({
    ...CONFIG_PADRAO,
    base: tema.base ?? escolher('base', true) ?? CONFIG_PADRAO.base,
    camadas: {
      cabelo: escolher('cabelo', false) ?? atual.camadas.cabelo,
      olhos: escolher('olhos', true),
      boca: escolher('boca', true),
      roupa: escolher('roupa', true),
      acessorio: escolher('acessorio', false),
      fundo: escolher('fundo', true),
      moldura: escolher('moldura', false),
      efeito: escolher('efeito', false),
    },
    cores,
  });
  return { config, nome: tema.nome, historia: tema.historia, fonte: 'local' };
}
