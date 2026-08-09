// services/ProjetosFoto.ts — PROJETOS do Photo Studio (mega 57 · §364).
// @version 1.0.0  @created 2026-08-04
//
// Um projeto guarda a FOTO-BASE (miniaturizada p/ caber no localStorage)
// + o estilo completo + o formato — reabrir devolve o trabalho exatamente
// onde parou. Molde PresetsPessoais: storage versionado, limite explícito,
// fail-safe. A foto é recomprimida a 480px JPEG (~40–80KB) — 6 projetos
// cabem com folga na cota; o export final SEMPRE recompõe do estilo.
import type { AvatarConfig, EstiloFoto } from '../domain/types';
import type { FormatoFotoId } from '../engine/render-foto';
import { flag } from '../nucleo/flags';
import { processarFoto } from './PipelineAsset'; // lote 581-590 (§268)
import { esquecer, guardar } from './CacheNiveis'; // lote 581-590 (§277)

const CHAVE = 'dshow.avst5.foto.projetos.v1';
const LIMITE = 8; // mega 252 (§364 v2): 6→8
const LADO_MINIATURA = 480;
const TTL_THUMB_MS = 90 * 24 * 60 * 60 * 1000; // §277: thumb vive 90 dias
// lote 971–980 (AS6 §1417, flag as6.foto_projeto): versão do SCHEMA do
// projeto. v1 = mega 57 (sem campo); v2 = + versao/atualizadoEm/
// avatarFonte (§1226). Projeto antigo segue abrindo (§1418): a leitura
// normaliza sem regravar (nenhum byte muda em disco por abrir).
const VERSAO_PROJETO = 2;

export interface ProjetoFoto {
  id: string;
  nome: string;
  criadoEm: string;   // ISO
  foto: string;       // dataURI JPEG 480 (base do trabalho)
  estilo: EstiloFoto;
  formato: FormatoFotoId;
  /** §1417 (v2): versão do schema — ausente = v1 (migração de leitura §1418) */
  versao?: number;
  /** §1202 (v2): último toque (salvar/renomear/atualizar fonte) */
  atualizadoEm?: string;
  /** §1226 (v2): SNAPSHOT do avatar usado como fonte — o projeto não
   *  muda quando o avatar principal muda; §1227 atualiza sob demanda */
  avatarFonte?: AvatarConfig;
}

const FORMATOS_VALIDOS = ['perfil', 'header', 'banner', 'wallpaper'];

function lerTudo(): ProjetoFoto[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    if (!Array.isArray(bruto)) return [];
    return bruto.filter((p): p is ProjetoFoto =>
      !!p && typeof p.id === 'string' && typeof p.nome === 'string'
      && typeof p.foto === 'string' && p.foto.startsWith('data:image/')
      && !!p.estilo && typeof p.estilo === 'object')
      // §1418 (lote 971–980): MIGRAÇÃO DE LEITURA — projeto de qualquer
      // versão abre; formato desconhecido degrada p/ 'perfil' em vez de
      // derrubar o painel (nada é regravado por abrir)
      .map((p) => (FORMATOS_VALIDOS.includes(p.formato) ? p : { ...p, formato: 'perfil' as FormatoFotoId }));
  } catch { return []; }
}

function gravar(lista: ProjetoFoto[]): void {
  try { localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, LIMITE))); } catch { /* cota/indisponível */ }
}

export function listarProjetosFoto(): ProjetoFoto[] {
  return lerTudo();
}

/** Recomprime a foto-base p/ caber no storage (JPEG 480, qualidade .85). */
export async function miniaturizarFoto(dataUri: string): Promise<string> {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUri; });
  const lado = Math.min(LADO_MINIATURA, Math.max(img.width, img.height) || LADO_MINIATURA);
  const c = document.createElement('canvas');
  c.width = lado; c.height = lado;
  const g = c.getContext('2d');
  if (!g) return dataUri;
  g.fillStyle = '#0a0d15';
  g.fillRect(0, 0, lado, lado);
  g.drawImage(img, 0, 0, lado, lado);
  return c.toDataURL('image/jpeg', 0.85);
}

/** Salva (nome vazio ganha "Projeto N"). Devolve null no limite/cota.
 *  megas 581–586 (§268/§277, flag as5.infra_v3): a foto passa pelo
 *  PIPELINE com fases (importação→validação→compressão→thumbnail→
 *  preview→metadados) e a thumb 96px vai ao cache multinível (IDB);
 *  flag off = caminho legado byte a byte (miniaturizarFoto direto). */
export async function salvarProjetoFoto(
  fotoDataUri: string, estilo: EstiloFoto, formato: FormatoFotoId, nome = '',
  avatarFonte?: AvatarConfig,
): Promise<ProjetoFoto | null> {
  const atuais = lerTudo();
  if (atuais.length >= LIMITE) return null;
  const id = `pf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  let foto: string;
  if (flag('as5.infra_v3')) {
    const r = await processarFoto(fotoDataUri, LADO_MINIATURA);
    if (r.ok && r.foto) {
      foto = r.foto;
      if (r.thumb) guardar(`foto-thumb:${id}`, r.thumb, TTL_THUMB_MS); // §277
    } else {
      foto = await miniaturizarFoto(fotoDataUri); // fase falhou → legado
    }
  } else {
    foto = await miniaturizarFoto(fotoDataUri);
  }
  const projeto: ProjetoFoto = {
    id,
    nome: (nome.trim() || `Projeto ${atuais.length + 1}`).slice(0, 32),
    criadoEm: new Date().toISOString(),
    foto,
    estilo,
    formato,
    // §1417/§1226 (as6.foto_projeto): schema v2 SÓ com a flag — off
    // grava o shape anterior byte a byte (§651)
    ...(flag('as6.foto_projeto')
      ? {
        versao: VERSAO_PROJETO,
        atualizadoEm: new Date().toISOString(),
        ...(avatarFonte ? { avatarFonte } : {}),
      }
      : {}),
  };
  gravar([projeto, ...atuais]);
  return projeto;
}

/** §1227 (as6.foto_projeto): troca a FONTE do projeto pelo avatar atual —
 *  a estilização fica; a base e o snapshot mudam juntos. */
export function atualizarFonteProjeto(id: string, foto: string, avatarFonte: AvatarConfig): ProjetoFoto | null {
  if (!flag('as6.foto_projeto')) return null;
  let atualizado: ProjetoFoto | null = null;
  const lista = lerTudo().map((p) => {
    if (p.id !== id) return p;
    atualizado = {
      ...p, foto, avatarFonte,
      versao: VERSAO_PROJETO,
      atualizadoEm: new Date().toISOString(),
    };
    return atualizado;
  });
  if (atualizado) gravar(lista);
  return atualizado;
}

/** mega 252 (§364 v2): renomear projeto (sanitizado; vazio = no-op). */
export function renomearProjetoFoto(id: string, nome: string): void {
  const limpo = nome.replace(/[^\p{L}\p{N} \-]/gu, '').slice(0, 24).trim();
  if (!limpo) return;
  try {
    const lista = listarProjetosFoto().map((p) => (p.id === id ? { ...p, nome: limpo } : p));
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch { /* sem storage */ }
}

export function excluirProjetoFoto(id: string): void {
  gravar(lerTudo().filter((p) => p.id !== id));
  esquecer(`foto-thumb:${id}`); // §277: thumb acompanha o projeto
}
