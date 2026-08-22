#!/usr/bin/env node
// qa-visual/contact-sheet.mjs — onda 1425 (BRIEFING_COMPLEMENTAR_02
// §53/§67–§71/§116; decisão #217): CONTACT SHEETS por categoria — grid
// de thumbnails ISOLADOS, SEM nome/raridade/tema/ID (teste cego §53), p/
// a auditoria de distinctiveness (§50–§58). O agente NÃO decide MERGE/
// VARIANT/REWORK/KEEP (§73) — a folha vai ao Jhony p/ o olho humano.
//
// Também emite um relatório heurístico de similaridade (§72): silhueta
// (bbox+densidade) por thumbnail canonizado — só CANDIDATOS, não veredito.
//
// Uso: node scripts/avatar/qa-visual/contact-sheet.mjs [categoria...]
//   (sem args = cabelo olhos boca roupa fundo base — as prioritárias)
// Saída: scripts/avatar/testes/saida/contact-sheets/<cat>.png + .json
// @version 1.0.0  @created 2026-08-22
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const SAIDA = join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'contact-sheets');
mkdirSync(SAIDA, { recursive: true });
const sharp = (await import('sharp')).default;

const CATS = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const categorias = CATS.length ? CATS : ['cabelo', 'olhos', 'boca', 'roupa', 'fundo', 'base'];

// extrai, no painel, os SVGs isolados de todos os itens de cada categoria
const tmp = mkdtempSync(join(tmpdir(), 'cs-'));
writeFileSync(join(tmp, 'p.ts'), `
// liga o trilho premium p/ o catálogo incluir as partes _px_ na auditoria
(globalThis as Record<string, unknown>).localStorage = {
  _d: { 'dshow.avst.flags.v1': JSON.stringify({ 'as6.classico_premium': true, 'as6.face_v2': true }) } as Record<string, string>,
  getItem(k: string) { return this._d[k] ?? null; },
  setItem(k: string, v: string) { this._d[k] = v; },
  removeItem(k: string) { delete this._d[k]; },
};
import { itensDe, svgItemIsolado } from '@painel/services/AvatarCatalog';
import { focoItemDe } from '@painel/components/modoItem';
const cats = ${JSON.stringify(categorias)};
const out: Record<string, Array<{ id: string; svg: string }>> = {};
for (const cat of cats) {
  const itens = itensDe(cat as never);
  out[cat] = itens.map((i) => ({ id: i.id, svg: svgItemIsolado(i.id, { uid: 'cs-' + i.id, foco: focoItemDe(i.id, cat) }) }));
}
console.log(JSON.stringify(out));
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'p.ts')}" --bundle --format=esm --platform=node --alias:@painel="${PAINEL}/src" --outfile="${join(tmp, 'p.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const dados = JSON.parse(execSync(`node "${join(tmp, 'p.mjs')}"`, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim().split('\n').pop());
rmSync(tmp, { recursive: true, force: true });

const CELL = 150;
const COLS = 6;
for (const cat of categorias) {
  const itens = (dados[cat] ?? []).filter((x) => x.svg);
  if (!itens.length) { console.log(`(sem itens: ${cat})`); continue; }
  // rasteriza cada thumb num quadro neutro fixo (canonização §72)
  const quadros = [];
  const assinaturas = [];
  for (const it of itens) {
    const buf = await sharp(Buffer.from(it.svg), { density: 150 })
      .resize(CELL - 12, CELL - 12, { fit: 'contain', background: '#20242c' })
      .png().toBuffer();
    quadros.push(buf);
    // assinatura de CONTEÚDO (§72/§74): recorta o fundo (trim), normaliza
    // p/ 20×20 em tons de cinza — compara FORMA+preenchimento sem o viés
    // do fundo/posição (olhos quase iguais aparecem; formas distintas não).
    let g;
    try {
      g = await sharp(Buffer.from(it.svg), { density: 96 })
        .flatten({ background: '#000000' })
        .trim({ threshold: 12 })
        .resize(20, 20, { fit: 'fill' }).greyscale().raw().toBuffer();
    } catch { g = Buffer.alloc(400); }
    assinaturas.push({ id: it.id, sig: g.length === 400 ? [...g] : [...Buffer.alloc(400)] });
  }
  const linhas = Math.ceil(itens.length / COLS);
  const W = COLS * CELL;
  const H = linhas * CELL + 30;
  const comp = quadros.map((b, i) => ({ input: b, top: 30 + Math.floor(i / COLS) * CELL + 6, left: (i % COLS) * CELL + 6 }));
  await sharp({ create: { width: W, height: H, channels: 4, background: '#14161c' } })
    .composite([...comp, { input: Buffer.from(`<svg width="${W}" height="26"><text x="10" y="19" font-family="sans-serif" font-size="14" fill="#dfe4ee">contact sheet · ${cat} · ${itens.length} itens (teste cego — sem nomes/IDs)</text></svg>`), top: 2, left: 0 }])
    .png().toFile(join(SAIDA, `${cat}.png`));
  // candidatos a similaridade: 1 - (erro médio absoluto normalizado) entre
  // as assinaturas de conteúdo 16×16; limiar alto (só quase-duplicatas §72)
  const cands = [];
  for (let i = 0; i < assinaturas.length; i++) for (let j = i + 1; j < assinaturas.length; j++) {
    const a = assinaturas[i].sig; const b = assinaturas[j].sig;
    let soma = 0;
    for (let k = 0; k < a.length; k++) soma += Math.abs(a[k] - b[k]);
    const sim = Math.round((1 - soma / (a.length * 255)) * 100);
    cands.push({ a: assinaturas[i].id, b: assinaturas[j].id, similaridade: sim });
  }
  cands.sort((x, y) => y.similaridade - x.similaridade);
  // §72/§73: a ferramenta SUGERE, não decide — entregamos o SHORTLIST dos
  // 20 pares mais parecidos (o Jhony classifica MERGE/VARIANT/REWORK/KEEP)
  const shortlist = cands.slice(0, 20);
  const acima95 = cands.filter((c) => c.similaridade >= 95).length;
  writeFileSync(join(SAIDA, `${cat}.json`), `${JSON.stringify({ categoria: cat, total: itens.length, paresAcima95: acima95, shortlist }, null, 2)}\n`);
  console.log(`${cat}.png · ${itens.length} itens · top par ${shortlist[0]?.similaridade ?? 0}% · ${acima95} pares ≥95%`);
}
console.log('CONTACT-SHEETS OK →', SAIDA);
