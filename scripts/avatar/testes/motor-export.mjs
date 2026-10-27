#!/usr/bin/env node
// Onda 1 (Avatar nativo) — testa o ARTEFATO exportado do motor: (A) exportação determinística (2× → mesmo sha256);
// (B) os 16 goldens (golden-avatars.json) renderizados PELO ARTEFATO num contexto vm sem globais = baseline;
// (C) motor.json coerente (versão = sha256[0:12], bytes, flags_remotas iguais a nucleo/flags.ts, chave local igual);
// (D) definirFlags muda o catálogo (as6.vestuario_separado) sem mudar o render do padrão; (E) catálogo serializável sem funções.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import vm from 'node:vm';
const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const falhas = []; const ok = (c, m) => { if (!c) falhas.push(m); };
const tmp = mkdtempSync(join(tmpdir(), 'avst-motor-'));
const env = { ...process.env };
if (!env.ESBUILD) { const c = [join(RAIZ, 'node_modules/.bin/esbuild'), '/var/www/dshowdash/node_modules/.bin/esbuild'].find(existsSync); if (c) env.ESBUILD = c; }
execFileSync('node', ['scripts/avatar/exportar-motor.mjs', '--saida', join(tmp, 'a'), '--quieto'], { cwd: RAIZ, env });
execFileSync('node', ['scripts/avatar/exportar-motor.mjs', '--saida', join(tmp, 'b'), '--quieto'], { cwd: RAIZ, env });
const ma = JSON.parse(readFileSync(join(tmp, 'a/motor.json'), 'utf8')), mb = JSON.parse(readFileSync(join(tmp, 'b/motor.json'), 'utf8'));
ok(ma.sha256 === mb.sha256 && ma.versao === mb.versao, '[A] exportação não determinística');
const codigo = readFileSync(join(tmp, 'a', ma.arquivo));
ok(sha(codigo) === ma.sha256 && ma.versao === ma.sha256.slice(0, 12) && ma.bytes === codigo.length, '[C] motor.json incoerente com o artefato');
const flagsTs = readFileSync(join(RAIZ, 'public/components/panels/panel-avatar-studio/src/nucleo/flags.ts'), 'utf8');
ok(flagsTs.includes(`const CHAVE_LOCAL = '${ma.chave_flags_local}'`), '[C] chave local de flags difere de nucleo/flags.ts');
ok(ma.flags_remotas.length >= 5 && ma.flags_remotas.every((k) => flagsTs.includes(`'${k}'`)), '[C] flags_remotas não batem com flags.ts');
ok(ma.flags_padrao_render['as6.face_v2'] === false && ma.flags_padrao_render['as6.classico_premium'] === false, '[C] padrões de render não lidos');
// (B) goldens pelo artefato: o PRÓPRIO golden-casos.ts do Studio é empacotado com `@painel` apontando para um SHIM que
// reexporta do global DSHOWAvatarMotor — assim os casos canônicos rodam contra o ARTEFATO, sem alterar o fonte do Studio.
const base = JSON.parse(readFileSync(join(RAIZ, 'docs/AVATAR-STUDIO-6/golden-avatars.json'), 'utf8')).casos;
const ctx = vm.createContext(Object.create(null));
vm.runInContext(codigo.toString('utf8'), ctx, { filename: 'motor.js' });
mkdirSync(join(tmp, 'shim/services'), { recursive: true }); mkdirSync(join(tmp, 'shim/domain'), { recursive: true });
writeFileSync(join(tmp, 'shim/services/AvatarCatalog.ts'), `const M = (globalThis as any).DSHOWAvatarMotor;
export const CONFIG_PADRAO = M.CONFIG_PADRAO; export const itensDe = M.itensDe; export const svgDe = M.svgDe; export const svgFotoDe = M.svgFotoDe; export const validarConfig = M.validarConfig;\n`);
writeFileSync(join(tmp, 'shim/domain/types.ts'), 'export {};\n');
writeFileSync(join(tmp, 'casos-entry.ts'), `import { casosGolden } from '${join(RAIZ, 'scripts/avatar/testes/visual/golden-casos.ts')}';\n(globalThis as any).__casos = () => casosGolden();\n`);
execFileSync(env.ESBUILD, [join(tmp, 'casos-entry.ts'), '--bundle', '--format=iife', '--target=es2020', `--alias:@painel=${join(tmp, 'shim')}`, `--outfile=${join(tmp, 'casos.js')}`], { cwd: tmp, stdio: 'pipe' });
vm.runInContext(readFileSync(join(tmp, 'casos.js'), 'utf8'), ctx, { filename: 'casos.js' });
const casos = JSON.parse(vm.runInContext('JSON.stringify(__casos().map(c => ({ id: c.id, svg: c.svg })))', ctx));
let iguais = 0;
for (const c of casos) { if (base[c.id] && sha(c.svg) === base[c.id].sha256) iguais++; else falhas.push(`[B] golden ${c.id} difere pelo artefato`); }
ok(iguais === Object.keys(base).length, `[B] ${iguais}/${Object.keys(base).length} goldens pelo artefato`);
// (D)/(E)
const d = JSON.parse(vm.runInContext(`(() => { const M = DSHOWAvatarMotor; const cfg = M.validarConfig({});
  const total = () => M.CATEGORIAS.reduce((n, c) => n + M.itensDe(c.id).length, 0);
  const antes = M.svgDe(cfg); const nAntes = total();
  M.definirFlags({ 'as6.vestuario_separado': true }); const depois = M.svgDe(cfg); const nDepois = total();
  M.definirFlags({}); const cat = M.catalogoSerializavel(); const temFn = Object.values(cat.itens).flat().some((it) => Object.values(it).some((v) => typeof v === 'function'));
  return JSON.stringify({ mesmoRender: antes === depois, nAntes, nDepois, cats: cat.categorias.length, itens: Object.values(cat.itens).flat().length, temFn, uid: M.hashConfig(cfg) }); })()`, ctx));
ok(d.mesmoRender, '[D] flag de catálogo não pode mudar o render do padrão');
ok(d.nDepois > d.nAntes, `[D] as6.vestuario_separado deveria liberar as peças SEED (rin_*/ace_tenis_futuro) no catálogo (${d.nAntes} → ${d.nDepois})`);
ok(d.cats === 17 && d.itens >= 390 && !d.temFn, `[E] catálogo serializável: ${d.cats} categorias, ${d.itens} itens, funções=${d.temFn}`);
rmSync(tmp, { recursive: true, force: true });
console.log(falhas.length ? `[motor-export] FALHAS: ${falhas.join(' || ')}` : `[motor-export] OK — determinístico (${ma.versao}, ${ma.bytes} B), ${iguais}/16 goldens pelo artefato, flags e catálogo (${d.itens} itens) coerentes`);
process.exit(falhas.length ? 1 : 0);
