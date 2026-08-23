// testes/flag-matrix.mjs — #219-R1 / V4 §73: MATRIZ DE FLAGS 2D (RC_FLAG_MATRIX).
// Prova A/B/C de classico_premium × arte_v2 no caminho REAL:
//   A cp OFF/av OFF → catálogo esconde _px_, render CLÁSSICO
//   B cp ON /av OFF → catálogo mostra _px_, render ainda CLÁSSICO (arte_v2 gaticia)
//   C cp ON /av ON  → catálogo mostra _px_, ARTE ELEVADA (corpoInteiroPremium)
// Para cada estado: catalog · render · save · reload · Legacy byte-stable.
// Node puro via esbuild (localStorage polyfillado p/ setar override de flag).
// @version 1.0.0  @created 2026-08-23 (V4 checkpoint 1)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-flagm-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { createHash } from 'node:crypto';
const store: Record<string,string> = {};
(globalThis as any).localStorage = { getItem:(k:string)=> k in store ? store[k] : null, setItem:(k:string,v:string)=>{store[k]=v;}, removeItem:(k:string)=>{delete store[k];} };
const CHAVE = 'dshow.avst.flags.v1';
const setFlags = (cp:boolean, av:boolean) => { store[CHAVE] = JSON.stringify({'as6.classico_premium':cp,'as6.arte_v2':av}); };
import { CONFIG_PADRAO, validarConfig, svgDe, itensDe } from '@painel/services/AvatarCatalog';
import { flag } from '@painel/nucleo/flags';
import type { AvatarConfig } from '@painel/domain/types';

const prem = validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_px_oval', acabamento:'premium', cores:{...CONFIG_PADRAO.cores, pele:'#e7b48a'}, camadas:{cabelo:'cab_px_curto', olhos:'olh_px_confiante', boca:'boc_px_seria', roupa:'rou_px_blazer', fundo:'fun_px_estudio'} } as any) as AvatarConfig;
const legado = validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_oval', cores:{...CONFIG_PADRAO.cores}, camadas:{cabelo:'cab_curto', olhos:'olh_confiante', boca:'boc_neutra'} } as any) as AvatarConfig;
const rnd = (c:AvatarConfig, uid:string) => svgDe(c, { estatico:true, palco:true, enquadramento:'corpo', uid });
const sha = (s:string) => createHash('sha256').update(s).digest('hex').slice(0,12);
const temArteElevada = (svg:string) => /cpx/.test(svg); // corpoInteiroPremium

const out:any = { estados: {}, legadoSha: [] };
for (const [nome, cp, av] of [['A',false,false],['B',true,false],['C',true,true]] as const) {
  setFlags(cp, av);
  const svgLeg = rnd(legado, 'flFIX');
  out.legadoSha.push(sha(svgLeg));
  out.estados[nome] = {
    cp: flag('as6.classico_premium'), av: flag('as6.arte_v2'),
    pxRoupa: (itensDe('roupa') as any[]).filter(i=>/_px_/.test(i.id)).length,
    arteElevada: temArteElevada(rnd(prem, 'fmFIX')),
    // save/reload: validarConfig idempotente (config não muda com flag)
    reValida: JSON.stringify(validarConfig(prem as any)) === JSON.stringify(prem),
  };
}
process.stdout.write(JSON.stringify(out));
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ FLAG MATRIX 2D (#219-R1 / §73) ━━');
const { A, B, C } = r.estados;
ok(A.cp === false && A.av === false, `A: cp=OFF av=OFF`);
ok(B.cp === true && B.av === false, `B: cp=ON av=OFF`);
ok(C.cp === true && C.av === true, `C: cp=ON av=ON`);
ok(A.pxRoupa === 0, `A: catálogo esconde _px_ (roupa _px_=${A.pxRoupa})`);
ok(B.pxRoupa > 0 && C.pxRoupa > 0, `B/C: catálogo mostra _px_ (roupa _px_=${B.pxRoupa})`);
ok(!A.arteElevada && !B.arteElevada && C.arteElevada, `Arte elevada SÓ em C (A=${A.arteElevada} B=${B.arteElevada} C=${C.arteElevada})`);
ok(r.legadoSha[0] === r.legadoSha[1] && r.legadoSha[1] === r.legadoSha[2], `Legacy byte-stable nos 3 estados (${r.legadoSha[0]})`);
ok(A.reValida && B.reValida && C.reValida, `save/reload: config premium sobrevive re-validação nos 3`);
console.log(falhas ? `\n✗ FLAG MATRIX: ${falhas} falha(s)` : '\n✓ flag-matrix verde');
process.exit(falhas ? 1 : 0);
