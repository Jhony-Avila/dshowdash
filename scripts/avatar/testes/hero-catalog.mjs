// testes/hero-catalog.mjs — decisão A+2: HEROES 2D no CATÁLOGO. Prova no motor
// REAL que um ativo autorado (importarHeroAsset) entra no catálogo como item e
// é gated pela flag as6.hero_2d:
//   [1] flag OFF → rou_hx_blazer NÃO aparece em itensDe('roupa').
//   [2] flag ON (premium+hero_2d) → aparece.
//   [3] config com roupa='rou_hx_blazer' sobrevive validarConfig (POR_ID resolve).
//   [4] svgDe premium desenha as CURVAS AUTORADAS (motor não reconstrói).
//   [5] byte-stability: um config LEGADO renderiza igual com hero_2d ON/OFF.
//   [6] espelho PHP: o id casa com o regex de studio.php (^[a-z0-9_]{1,40}$).
// Node puro via esbuild (localStorage polyfillado). Padrão flag-matrix.
// @version 1.0.0  @created 2026-08-24 (decisão A+2)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-herocat-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { createHash } from 'node:crypto';
const store: Record<string,string> = {};
(globalThis as any).localStorage = { getItem:(k:string)=> k in store ? store[k] : null, setItem:(k:string,v:string)=>{store[k]=v;}, removeItem:(k:string)=>{delete store[k];} };
const CHAVE = 'dshow.avst.flags.v1';
const setFlags = (o:Record<string,boolean>) => { store[CHAVE] = JSON.stringify(o); };
import { CONFIG_PADRAO, validarConfig, svgDe, itensDe, itemPorId } from '@painel/services/AvatarCatalog';
import type { AvatarConfig } from '@painel/domain/types';
const sha = (s:string)=>createHash('sha256').update(s).digest('hex').slice(0,12);
const temHero = () => (itensDe('roupa') as any[]).some((i)=>i.id==='rou_hx_blazer');

// D_BASE autorada do molde (silhueta do blazer) — deve aparecer intacta no render
const D_BASE = 'M107 108';

const out:any = {};
// [1] hero_2d OFF (mas premium ON) → não lista
setFlags({'as6.classico_premium':true,'as6.arte_v2':true,'as6.hero_2d':false});
out.offLista = temHero();
// [2] hero_2d ON → lista
setFlags({'as6.classico_premium':true,'as6.arte_v2':true,'as6.hero_2d':true});
out.onLista = temHero();
out.resolvePorId = !!itemPorId('rou_hx_blazer') && itemPorId('rou_hx_blazer')!.categoria==='roupa';

// [3] config com o hero sobrevive validarConfig
const cfgHero = validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_px_oval', acabamento:'premium',
  cores:{...CONFIG_PADRAO.cores, roupa:'#2b3550', destaque:'#c8892e'},
  camadas:{ cabelo:'cab_px_curto', olhos:'olh_px_confiante', boca:'boc_px_seria', roupa:'rou_hx_blazer', fundo:'fun_px_estudio' } } as any) as AvatarConfig;
out.validarMantem = (cfgHero.camadas as any).roupa === 'rou_hx_blazer';
// [4] render premium desenha as curvas autoradas
const svgHero = svgDe(cfgHero, { estatico:true, palco:true, enquadramento:'corpo', uid:'hc', premium:true } as any);
out.curvaIntacta = svgHero.includes(D_BASE);

// [5] byte-stability: LEGADO igual com hero_2d ON/OFF
const legado = validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_oval', cores:{...CONFIG_PADRAO.cores}, camadas:{ cabelo:'cab_curto', olhos:'olh_confiante', boca:'boc_neutra' } } as any) as AvatarConfig;
const rnd = (c:AvatarConfig) => svgDe(c, { estatico:true, palco:true, enquadramento:'corpo', uid:'legFIX' });
setFlags({'as6.classico_premium':true,'as6.arte_v2':true,'as6.hero_2d':true});  const legOn = sha(rnd(legado));
setFlags({'as6.classico_premium':true,'as6.arte_v2':true,'as6.hero_2d':false}); const legOff = sha(rnd(legado));
out.legadoByteStable = legOn === legOff;

// [6] espelho PHP: regex
out.phpRegex = /^[a-z0-9_]{1,40}$/.test('rou_hx_blazer');
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ HERO CATALOG — ativo autorado no catálogo (A+2) ━━');
ok(r.offLista === false, `[1] hero_2d OFF → rou_hx_blazer NÃO listado`);
ok(r.onLista === true, `[2] hero_2d ON → rou_hx_blazer listado`);
ok(r.resolvePorId, `[2] itemPorId resolve o hero como categoria roupa`);
ok(r.validarMantem, `[3] validarConfig mantém roupa='rou_hx_blazer'`);
ok(r.curvaIntacta, `[4] svgDe premium desenha a curva autorada (motor não reconstrói)`);
ok(r.legadoByteStable, `[5] legado byte-stable com hero_2d ON/OFF`);
ok(r.phpRegex, `[6] id casa com o regex de studio.php`);
console.log(falhas ? `\n✗ HERO CATALOG: ${falhas} falha(s)` : '\n✓ hero-catalog verde');
process.exit(falhas ? 1 : 0);
