#!/usr/bin/env node
// avatar/cabelo-silhueta.mjs — onda 1413 (MEGA_BRIEFING_01 §881–§897;
// decisão #159): CONTACT-SHEET DE CABELOS — renderiza TODOS os cabelos
// (clássicos + premium `cab_px_*`) em 3 cores canônicas (escuro/loiro/
// branco) sobre a base golden e gera:
//   1. HTML auto-contido (SVGs inline) em scripts/avatar/testes/saida/
//      cabelo-silhueta.html — material de validação visual do Jhony,
//      FORA do git (§147 do .gitignore);
//   2. métricas DETERMINÍSTICAS (bytes/nós/gradientes/clip/camada de
//      trás + matriz §897 cabelo×headwear) em
//      docs/AVATAR-STUDIO-5/evidencias/cabelo-silhueta.json — o diff é
//      o relatório (mesma doutrina do orcamento-2d).
// PNGs ficam para o pipeline de QA visual (§2675) — aqui o HTML basta e
// mantém o script rápido e sem navegador.
// Uso (da raiz): node scripts/avatar/cabelo-silhueta.mjs [--json]
// @version 1.0.0  @created 2026-08-21
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const SAIDA = join(RAIZ, 'scripts', 'avatar', 'testes', 'saida');
const DESTINO = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'cabelo-silhueta.json');
const tmp = mkdtempSync(join(tmpdir(), 'cabsil-'));

// 3 cores canônicas: extremos de luminância + o loiro médio — se a rampa
// tintaPremium segura nos 3, segura no meio (§891 brilho por mecha).
const CORES = { escuro: '#14100c', loiro: '#d9b166', branco: '#e8e6e0' };

writeFileSync(join(tmp, 'prova.ts'), `
import { CONFIG_PADRAO, itensDe, svgDe, validarConfig } from '@painel/services/AvatarCatalog';
import { CABELOS_PREMIUM } from '@painel/engine/partes/premium/cabelos';
import { CABELOS } from '@painel/engine/partes/cabelos';
import { PERFIL_HEADWEAR, resolverEstadoCabelo, profundidadeRecorte } from '@painel/engine/compat-cabelo';
import type { AvatarConfig } from '@painel/domain/types';

const CORES: Record<string, string> = ${JSON.stringify(CORES)};
const classicos = CABELOS.map((c) => c.id);
const premium = CABELOS_PREMIUM.map((c) => c.id);

const casos: Record<string, any> = {};
for (const id of [...classicos, ...premium]) {
  const px = /_px_/.test(id);
  for (const [nomeCor, hex] of Object.entries(CORES)) {
    const config = validarConfig({
      ...CONFIG_PADRAO,
      ...(px ? { base: 'bas_px_oval' as any, acabamento: 'premium' as const } : {}),
      camadas: { ...CONFIG_PADRAO.camadas, cabelo: id },
      cores: { ...CONFIG_PADRAO.cores, cabelo: hex },
    } as AvatarConfig);
    const svg = svgDe(config, { uid: 'sil', ...(px ? { premium: true } : {}) });
    casos[id + '/' + nomeCor] = {
      premium: px,
      bytes: svg.length,
      nos: (svg.match(/</g) ?? []).length,
      gradientes: (svg.match(/<linearGradient|<radialGradient/g) ?? []).length,
      filtros: (svg.match(/<filter/g) ?? []).length,
      atras: svg.includes('silpxcatb'),
      corAplicada: svg.toLowerCase().includes(hex.toLowerCase()),
      svg,
    };
  }
}

// matriz §897: estado + profundidade de recorte por cabelo premium × headwear
const headwears = ['nenhum', ...Object.keys(PERFIL_HEADWEAR)];
const matriz: Record<string, Record<string, string>> = {};
for (const cab of premium) {
  matriz[cab] = {};
  for (const hw of headwears) {
    const estado = resolverEstadoCabelo(cab, hw === 'nenhum' ? null : hw);
    matriz[cab][hw] = estado + ':' + profundidadeRecorte(estado);
  }
}

// prova do clip no render: cabelo premium + boné justo → clipPath presente
const comBone = validarConfig({
  ...CONFIG_PADRAO, base: 'bas_px_oval' as any, acabamento: 'premium' as const,
  camadas: { ...CONFIG_PADRAO.camadas, cabelo: 'cab_px_coque', acessorio: 'ace_bone' },
} as AvatarConfig);
const clipPremium = svgDe(comBone, { uid: 'sil', premium: true }).includes('silhclip');
const clipSemPremium = svgDe(comBone, { uid: 'sil' }).includes('silhclip');

console.log(JSON.stringify({ casos, matriz, clipPremium, clipSemPremium, classicos: classicos.length, premium: premium.length }));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const dados = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim().split('\n').pop());
rmSync(tmp, { recursive: true, force: true });

// ── HTML contact-sheet (fora do git) ────────────────────────────────────
mkdirSync(SAIDA, { recursive: true });
const porCabelo = {};
for (const [chave, c] of Object.entries(dados.casos)) {
  const [id, cor] = chave.split('/');
  (porCabelo[id] ??= {})[cor] = c;
}
const celulas = Object.entries(porCabelo).map(([id, cores]) => {
  const px = cores.escuro.premium;
  const svgs = Object.entries(cores).map(([nome, c]) =>
    `<figure><div class="cx${px ? ' px' : ''}">${c.svg}</div><figcaption>${nome}</figcaption></figure>`).join('');
  return `<section><h2>${id}${px ? ' <em>premium</em>' : ''}</h2><div class="linha">${svgs}</div></section>`;
}).join('\n');
writeFileSync(join(SAIDA, 'cabelo-silhueta.html'), `<!doctype html><meta charset="utf-8">
<title>Cabelos — contact-sheet (onda 1413)</title>
<style>
body{font:13px system-ui;background:#14161c;color:#dfe3ec;margin:24px}
h1{font-size:18px} h2{font-size:13px;margin:18px 0 6px;font-weight:600} h2 em{color:#c9a75a;font-style:normal}
.linha{display:flex;gap:10px} figure{margin:0;text-align:center}
.cx{width:132px;height:132px;background:#232732;border-radius:10px;overflow:hidden}
.cx.px{outline:1px solid #c9a75a55}
.cx svg{width:100%;height:100%} figcaption{color:#8b93a5;margin-top:3px}
</style>
<h1>Contact-sheet de cabelos — ${dados.classicos} clássicos + ${dados.premium} premium × 3 cores</h1>
${celulas}`);

// ── métricas determinísticas (SEM os SVGs) → evidências ─────────────────
const metricas = {};
for (const [chave, c] of Object.entries(dados.casos)) {
  const { svg, ...resto } = c;
  metricas[chave] = resto;
}
const problemas = [];
for (const [chave, m] of Object.entries(metricas)) {
  // clássicos podem ignorar a paleta por design (ex.: cab_flamejante é fogo,
  // não tinta) — corAplicada só é GATE no trilho premium; no clássico é dado.
  if (m.premium && !m.corAplicada) problemas.push(`${chave}: cor global de cabelo NÃO aplicada`);
  if (m.premium && m.filtros > 0) problemas.push(`${chave}: filtro SVG em arte premium (proibido, #177)`);
}
if (!dados.clipPremium) problemas.push('clip §897 AUSENTE com premium+coque+boné');
if (dados.clipSemPremium) problemas.push('clip §897 vazando SEM premium (quebra byte-stability)');

const json = { versao: 1, onda: 1413, cores: CORES, casos: metricas, matriz: dados.matriz, clipPremium: dados.clipPremium, clipSemPremium: dados.clipSemPremium, problemas };
mkdirSync(join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias'), { recursive: true });
writeFileSync(DESTINO, JSON.stringify(json, null, 2) + '\n');

if (process.argv.includes('--json')) console.log(JSON.stringify(json, null, 2));
else {
  console.log(`cabelo-silhueta: ${Object.keys(metricas).length} renders (${dados.classicos} clássicos + ${dados.premium} premium × 3 cores)`);
  console.log(`HTML: scripts/avatar/testes/saida/cabelo-silhueta.html · evidências: docs/AVATAR-STUDIO-5/evidencias/cabelo-silhueta.json`);
  for (const p of problemas) console.log(`PROBLEMA: ${p}`);
  console.log(problemas.length ? `FALHAS: ${problemas.length}` : 'FALHAS: nenhuma');
}
process.exit(problemas.length ? 1 : 0)
