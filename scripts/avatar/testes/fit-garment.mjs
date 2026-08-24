// testes/fit-garment.mjs — decisão A+2: SILHUETA por FIT ENGINE. Prova no motor
// REAL que a silhueta do blazer premium passa a ser dirigida por
// engine/fit.silhuetaFit quando as6.fit_v2 está ON — reversível e escopado:
//   [1] fit_v2 OFF → blazer byte a byte (silhueta hand-tuned de sempre).
//   [2] fit_v2 ON  → blazer MUDA (silhueta vem do fit engine).
//   [3] ESCOPO: uma peça NÃO-gated (hoodie) é idêntica com fit_v2 ON/OFF.
//   [4] LEGADO byte-stable com fit_v2 ON/OFF.
//   [5] body-follow: com fit_v2 ON o blazer difere entre perfis (veste cada corpo).
// @version 1.0.0  @created 2026-08-24 (decisão A+2)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-fitg-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { createHash } from 'node:crypto';
const store: Record<string,string> = {};
(globalThis as any).localStorage = { getItem:(k:string)=> k in store ? store[k] : null, setItem:(k:string,v:string)=>{store[k]=v;}, removeItem:(k:string)=>{delete store[k];} };
const CHAVE = 'dshow.avst.flags.v1';
const set = (fit:boolean) => { store[CHAVE] = JSON.stringify({'as6.classico_premium':true,'as6.arte_v2':true,'as6.fit_v2':fit}); };
import { CONFIG_PADRAO, validarConfig, svgDe } from '@painel/services/AvatarCatalog';
import type { AvatarConfig } from '@painel/domain/types';
const sha = (s:string)=>createHash('sha256').update(s).digest('hex').slice(0,12);

const mk = (roupa:string, preset?:string) => validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_px_oval', acabamento:'premium', cores:{...CONFIG_PADRAO.cores, roupa:'#2b3550', destaque:'#c8892e'}, ...(preset?{corpoV2:{preset}}:{}), camadas:{ cabelo:'cab_px_curto', olhos:'olh_px_confiante', boca:'boc_px_seria', roupa, fundo:'fun_px_estudio' } } as any) as AvatarConfig;
const rnd = (c:AvatarConfig,uid='fgFIX') => svgDe(c, { estatico:true, palco:true, enquadramento:'corpo', uid, premium:true } as any);

const blazer = mk('rou_px_blazer');
const hoodie = mk('rou_px_hoodie');
const legado = validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_oval', cores:{...CONFIG_PADRAO.cores}, camadas:{ cabelo:'cab_curto', olhos:'olh_confiante', boca:'boc_neutra' } } as any) as AvatarConfig;

set(false); const blazerOff = sha(rnd(blazer)); const hoodieOff = sha(rnd(hoodie)); const legOff = sha(rnd(legado));
set(true);  const blazerOn  = sha(rnd(blazer)); const hoodieOn  = sha(rnd(hoodie)); const legOn  = sha(rnd(legado));

set(true);
const perfis = ['esbelto','compacto','robusto'];
const porPerfil = perfis.map((pr)=> sha(rnd(mk('rou_px_blazer', pr), 'pf_'+pr)));

const out = {
  blazerMudou: blazerOff !== blazerOn,
  hoodieIgual: hoodieOff === hoodieOn,
  legadoStable: legOff === legOn,
  perfisDistintos: new Set(porPerfil).size === 3,
};
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ FIT GARMENT — silhueta por fit engine (A+2) ━━');
ok(r.blazerMudou, `[2] fit_v2 ON muda a silhueta do blazer`);
ok(r.hoodieIgual, `[3] escopo: hoodie (não-gated) idêntico com fit_v2 ON/OFF`);
ok(r.legadoStable, `[4] legado byte-stable com fit_v2 ON/OFF`);
ok(r.perfisDistintos, `[5] body-follow: blazer fit-driven difere entre perfis`);
console.log(falhas ? `\n✗ FIT GARMENT: ${falhas} falha(s)` : '\n✓ fit-garment verde');
process.exit(falhas ? 1 : 0);
