// testes/fit-garment.mjs — decisão A+2/A+3: SILHUETA por FIT ENGINE no
// GUARDA-ROUPA inteiro. Com as6.fit_v2, cada peça premium (camiseta/hoodie/
// blazer/sobretudo) tem a silhueta derivada de engine/fit.silhuetaFit pela sua
// CLASSE declarada (fitClass no ParteDef). Reversível e escopado:
//   [1] fit_v2 OFF → cada peça byte a byte (hand-tuned).
//   [2] fit_v2 ON  → cada peça MUDA (silhueta do fit engine).
//   [3] body-follow: com ON cada peça difere entre perfis (veste cada corpo).
//   [4] metadado: os ParteDefs declaram fitClass coerente com a classe da peça.
//   [5] LEGADO byte-stable com fit_v2 ON/OFF.
// @version 2.0.0  @created 2026-08-24 (decisão A+3)
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
import { CONFIG_PADRAO, validarConfig, svgDe, itemPorId } from '@painel/services/AvatarCatalog';
import type { AvatarConfig } from '@painel/domain/types';
const sha = (s:string)=>createHash('sha256').update(s).digest('hex').slice(0,12);

const PECAS = ['rou_px_camiseta','rou_px_hoodie','rou_px_blazer','rou_px_sobretudo'];
const CLASSE_ESPERADA: Record<string,string> = { rou_px_camiseta:'REGULAR', rou_px_hoodie:'OVERSIZED', rou_px_blazer:'STRUCTURED', rou_px_sobretudo:'RELAXED' };
const mk = (roupa:string, preset?:string) => validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_px_oval', acabamento:'premium', cores:{...CONFIG_PADRAO.cores, roupa:'#2b3550', destaque:'#c8892e'}, ...(preset?{corpoV2:{preset}}:{}), camadas:{ cabelo:'cab_px_curto', olhos:'olh_px_confiante', boca:'boc_px_seria', roupa, fundo:'fun_px_estudio' } } as any) as AvatarConfig;
const rnd = (c:AvatarConfig,uid='fgFIX') => svgDe(c, { estatico:true, palco:true, enquadramento:'corpo', uid, premium:true } as any);

const porPeca:any = {};
for (const peca of PECAS) {
  const c = mk(peca);
  set(false); const off = sha(rnd(c));
  set(true);  const on  = sha(rnd(c));
  set(true);
  const perfis = ['esbelto','compacto','robusto'].map((pr)=> sha(rnd(mk(peca,pr),'pf_'+pr)));
  const def:any = itemPorId(peca);
  porPeca[peca] = { mudou: off!==on, perfisDistintos: new Set(perfis).size===3, fitClass: def?.fitClass };
}
// legado byte-stable
const legado = validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_oval', cores:{...CONFIG_PADRAO.cores}, camadas:{ cabelo:'cab_curto', olhos:'olh_confiante', boca:'boc_neutra' } } as any) as AvatarConfig;
set(false); const legOff = sha(rnd(legado)); set(true); const legOn = sha(rnd(legado));

const out = {
  porPeca,
  todasMudaram: PECAS.every((p)=>porPeca[p].mudou),
  todasBodyFollow: PECAS.every((p)=>porPeca[p].perfisDistintos),
  metadadoOk: PECAS.every((p)=>porPeca[p].fitClass === CLASSE_ESPERADA[p]),
  legadoStable: legOff === legOn,
};
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ FIT GARMENT — guarda-roupa dirigido pelo fit engine (A+3) ━━');
for (const [peca, v] of Object.entries(r.porPeca)) {
  ok(v.mudou, `${peca}: fit_v2 ON muda a silhueta (fitClass=${v.fitClass})`);
}
ok(r.todasBodyFollow, `body-follow: cada peça fit-driven difere entre perfis`);
ok(r.metadadoOk, `metadado fitClass coerente em todas as peças`);
ok(r.legadoStable, `legado byte-stable com fit_v2 ON/OFF`);
console.log(falhas ? `\n✗ FIT GARMENT: ${falhas} falha(s)` : '\n✓ fit-garment verde');
process.exit(falhas ? 1 : 0);
