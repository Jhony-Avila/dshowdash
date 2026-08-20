#!/usr/bin/env node
// assets3d/ficha-qa.mjs — onda 1410 (MEGA_BRIEFING_01 §2663–§2677, §3055,
// §3082; VISUAL-QA.md §5–§7): FICHA DE QA VISUAL por asset/versão como
// status machine executável.
//
// - Ficha completa vive FORA do público: storage/visual-qa/<id>/ficha-v<versao>.json
//   (storage/ é gitignored — evidência local/servidor, nunca no repo).
// - O manifest publicado guarda só o RESUMO (`qaVisual`: status/reviewer/
//   date/notes) — schema v2 da onda 1406.
// - Transições válidas (§2675): pending → approved | approved_with_notes |
//   rework | rejected; rework → pending (nova rodada); approved_with_notes
//   exige issue rastreada (§3082: notas + owner + prazo). Nada mais.
// - Checklist por categoria (VISUAL-QA §6): eixos NÃO aplicáveis nascem
//   null e não contam; aprovar exige todos os eixos aplicáveis avaliados
//   (nota 0–10) e nenhum hardFail aberto.
// - QUEM APROVA É O JHONY (reviewer humano) — este módulo só registra e
//   valida; nenhuma transição para approved acontece automaticamente.
//
// Uso (da raiz):
//   node scripts/avatar/assets3d/ficha-qa.mjs criar <pasta-publicada>
//   node scripts/avatar/assets3d/ficha-qa.mjs status <pasta> <novo-status> --reviewer <nome> [--nota k=v ...] [--soft "..."] [--hard "..."] [--issue "..."] [--obs "..."] [--data AAAA-MM-DD]
//   node scripts/avatar/assets3d/ficha-qa.mjs ver <pasta>
// @version 1.0.0  @created 2026-08-20
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
export const DIR_FICHAS = join(RAIZ, 'storage', 'visual-qa');

/** Os 18 eixos (VISUAL-QA §1) e a aplicabilidade por tipo (§6). */
export const EIXOS = ['silhueta', 'proporcao', 'rosto', 'olhos', 'pele', 'cabelo', 'roupa', 'materialidade', 'acessorios', 'iluminacao', 'sombras', 'camera', 'profundidade', 'vfx', 'coerencia', 'closeup', 'movimento', 'thumbnail'];
const COMUNS = ['silhueta', 'proporcao', 'materialidade', 'iluminacao', 'sombras', 'camera', 'coerencia', 'closeup', 'thumbnail'];
export const EIXOS_POR_TIPO = {
  personagem_base: [...COMUNS, 'rosto', 'olhos', 'pele', 'profundidade', 'movimento'],
  parte_cabelo: [...COMUNS, 'cabelo', 'movimento'],
  parte_barba: [...COMUNS, 'cabelo'],
  parte_roupa: [...COMUNS, 'roupa', 'movimento'],
  parte_acessorio: [...COMUNS, 'acessorios'],
  pacote_animacoes: ['movimento', 'coerencia'],
  cenario: ['iluminacao', 'sombras', 'profundidade', 'coerencia', 'vfx', 'camera'],
};

export const TRANSICOES = {
  pending: ['approved', 'approved_with_notes', 'rework', 'rejected'],
  rework: ['pending'],
  approved: [], // aprovado é terminal na versão; mudança = nova versão
  approved_with_notes: [],
  rejected: [],
};

export function eixosDe(tipo) {
  return EIXOS_POR_TIPO[tipo] ?? COMUNS;
}

function caminhoFicha(manifest) {
  return join(DIR_FICHAS, manifest.id, `ficha-v${manifest.versao ?? 1}.json`);
}

/** Cria a ficha `pending` com o checklist da categoria (eixos fora = null). */
export function criarFicha(pasta, { forcar = false } = {}) {
  const manifest = JSON.parse(readFileSync(join(resolve(pasta), 'manifest.json'), 'utf8'));
  const arq = caminhoFicha(manifest);
  if (existsSync(arq) && !forcar) return { ficha: JSON.parse(readFileSync(arq, 'utf8')), arquivo: arq, criada: false };
  const aplicaveis = eixosDe(manifest.tipo);
  const ficha = {
    assetId: manifest.id,
    versao: String(manifest.versao ?? 1),
    artBibleVersion: manifest.artBibleVersion ?? '1.0',
    status: 'pending',
    reviewer: null,
    data: null,
    // eixo aplicável AUSENTE de `notas` = ainda sem nota; não-aplicável = null
    eixosAplicaveis: aplicaveis,
    notas: Object.fromEntries(EIXOS.filter((e) => !aplicaveis.includes(e)).map((e) => [e, null])),
    hardFails: [],
    softFails: [],
    issues: [], // §3082: cada approved_with_notes gera { texto, owner, severidade, prazo }
    evidencias: [],
    historico: [],
    observacoes: '',
  };
  mkdirSync(join(DIR_FICHAS, manifest.id), { recursive: true });
  writeFileSync(arq, `${JSON.stringify(ficha, null, 2)}\n`);
  return { ficha, arquivo: arq, criada: true };
}

/** Valida uma transição + pré-condições. Puro → { ok, erros }. */
export function validarTransicao(ficha, novoStatus, { reviewer, issues = [] } = {}) {
  const erros = [];
  const permitidas = TRANSICOES[ficha.status] ?? [];
  if (!permitidas.includes(novoStatus)) erros.push(`transição ${ficha.status} → ${novoStatus} inválida (§2675: ${ficha.status} → ${permitidas.join('|') || '∅ (terminal — publique nova versão)'})`);
  if (novoStatus !== 'pending' && !reviewer) erros.push('reviewer humano obrigatório (aprovação é do Jhony — VISUAL-QA §7.4)');
  if (novoStatus === 'approved' || novoStatus === 'approved_with_notes') {
    const pendentes = (ficha.eixosAplicaveis ?? []).filter((e) => !(e in ficha.notas));
    if (pendentes.length) erros.push(`eixos aplicáveis sem nota: ${pendentes.join(', ')}`);
    if (ficha.hardFails.length) erros.push(`hard fails abertos: ${ficha.hardFails.join('; ')} (VISUAL-QA §3 — hard fail nunca aprova)`);
    if (!ficha.evidencias.length) erros.push('sem evidências anexadas (gerar-evidencias.mjs antes de aprovar)');
  }
  if (novoStatus === 'approved' && ficha.softFails.length) erros.push(`soft fails abertos: use approved_with_notes com issue rastreada (§3082)`);
  if (novoStatus === 'approved_with_notes') {
    const todas = [...(ficha.issues ?? []), ...issues];
    const cobertos = todas.filter((i) => i && i.texto && i.owner && i.severidade && i.prazo);
    if (ficha.softFails.length && cobertos.length < ficha.softFails.length) erros.push(`§3082: cada soft fail exige issue com texto+owner+severidade+prazo (${cobertos.length}/${ficha.softFails.length})`);
  }
  return { ok: erros.length === 0, erros };
}

/** Aplica a transição, grava a ficha e espelha o RESUMO no manifest. */
export function transicionar(pasta, novoStatus, opcoes = {}) {
  const dir = resolve(pasta);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const arq = caminhoFicha(manifest);
  if (!existsSync(arq)) throw new Error(`ficha ausente — rode "criar" antes (${arq})`);
  const ficha = JSON.parse(readFileSync(arq, 'utf8'));
  for (const [k, v] of Object.entries(opcoes.notas ?? {})) {
    if (!EIXOS.includes(k)) throw new Error(`eixo desconhecido "${k}"`);
    if (!(ficha.eixosAplicaveis ?? []).includes(k)) throw new Error(`eixo "${k}" não se aplica ao tipo ${manifest.tipo}`);
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 10) throw new Error(`nota de ${k} fora de 0–10`);
    ficha.notas[k] = n;
  }
  if (opcoes.softFails) ficha.softFails.push(...opcoes.softFails);
  if (opcoes.hardFails) ficha.hardFails.push(...opcoes.hardFails);
  if (opcoes.resolverHardFails) ficha.hardFails = [];
  if (opcoes.issues) ficha.issues.push(...opcoes.issues);
  if (opcoes.evidencias) ficha.evidencias = [...new Set([...ficha.evidencias, ...opcoes.evidencias])];
  if (opcoes.observacoes) ficha.observacoes = opcoes.observacoes;
  const v = validarTransicao(ficha, novoStatus, opcoes);
  if (!v.ok) throw new Error(`transição recusada:\n  ${v.erros.join('\n  ')}`);
  const data = opcoes.data ?? null;
  ficha.historico.push({ de: ficha.status, para: novoStatus, reviewer: opcoes.reviewer ?? null, data });
  ficha.status = novoStatus;
  ficha.reviewer = opcoes.reviewer ?? ficha.reviewer;
  ficha.data = data ?? ficha.data;
  writeFileSync(arq, `${JSON.stringify(ficha, null, 2)}\n`);
  // resumo no manifest (schema v2 1406): status/reviewer/date/notes
  manifest.qaVisual = {
    status: novoStatus,
    ...(ficha.reviewer ? { reviewer: ficha.reviewer } : {}),
    ...(ficha.data ? { date: ficha.data } : {}),
    ...(ficha.softFails.length || ficha.observacoes ? { notes: [...ficha.softFails, ficha.observacoes].filter(Boolean).join(' · ').slice(0, 200) } : {}),
  };
  writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { ficha, arquivo: arq };
}

/** Lê a ficha (ou null). */
export function lerFicha(pasta) {
  const manifest = JSON.parse(readFileSync(join(resolve(pasta), 'manifest.json'), 'utf8'));
  const arq = caminhoFicha(manifest);
  return existsSync(arq) ? { ficha: JSON.parse(readFileSync(arq, 'utf8')), arquivo: arq } : null;
}

// ── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [cmd, pasta, ...resto] = process.argv.slice(2);
  const arg = (nome) => { const i = process.argv.indexOf(`--${nome}`); return i > -1 ? process.argv[i + 1] : null; };
  const args = (nome) => process.argv.flatMap((a, i) => (a === `--${nome}` ? [process.argv[i + 1]] : []));
  try {
    if (cmd === 'criar') {
      const { arquivo, criada } = criarFicha(pasta, { forcar: process.argv.includes('--forcar') });
      console.log(`${criada ? 'FICHA_CRIADA' : 'FICHA_EXISTE'} ${arquivo}`);
    } else if (cmd === 'status') {
      const novo = resto.find((r) => !r.startsWith('--'));
      const notas = Object.fromEntries(args('nota').map((kv) => kv.split('=')));
      const { arquivo, ficha } = transicionar(pasta, novo, {
        reviewer: arg('reviewer'), data: arg('data'), notas,
        softFails: args('soft'), hardFails: args('hard'),
        issues: args('issue').map((s) => { const [texto, owner, severidade, prazo] = s.split('|'); return { texto, owner, severidade, prazo }; }),
        observacoes: arg('obs'),
        resolverHardFails: process.argv.includes('--resolver-hard'),
      });
      console.log(`FICHA_${ficha.status.toUpperCase()} ${arquivo}`);
    } else if (cmd === 'ver') {
      const r = lerFicha(pasta);
      console.log(r ? JSON.stringify(r.ficha, null, 2) : 'sem ficha');
    } else {
      console.error('uso: ficha-qa.mjs criar|status|ver <pasta> [...opções]');
      process.exit(2);
    }
  } catch (e) { console.error(`✗ ${e.message}`); process.exit(1); }
}
