// testes/corpo-fit.mjs — decisão A+ §13/§14/§15/§16: ANATOMIA REAL por perfil
// + CLASSES DE CAIMENTO. Verifica no motor REAL (engine/partes/corpo + engine/fit):
//   [1] BYTE-STABLE: anatomiaCorpo('standard') == baseline histórico E o SHA de
//       corpoInteiroPremium('standard') não muda (perfil padrão intocado).
//   [2] ANATOMIA REAL (não só escala X): a proporção VERTICAL difere por perfil —
//       cintura ALTA em atlético/feminino, BAIXA em robusto (razão ombro↔cintura↔
//       quadril própria), não apenas larguras.
//   [3] os 5 perfis produzem silhuetas distintas (SHA do corpo todas diferentes).
//   [4] FIT monotônico: cinturaW FITTED<REGULAR<RELAXED<OVERSIZED (mesmo perfil).
//   [5] FIT muda o body-follow: FITTED envolve cada corpo com folga CONSTANTE
//       sobre a cintura real (dispersão ~0); OVERSIZED flutua diferente por
//       corpo (dispersão maior) — a peça larga não "segue" a cintura.
// @version 1.0.0  @created 2026-08-23 (decisão A+)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-corpofit-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { createHash } from 'node:crypto';
import { anatomiaCorpo, corpoInteiroPremium } from '@painel/engine/partes/corpo';
import { silhuetaFit, FIT_CLASSES } from '@painel/engine/fit';
import { paletaDe } from '@painel/engine/cores';
const p = paletaDe({ pele:'#e8b58c', cabelo:'#3d2b1f', roupa:'#2d4a8a', destaque:'#7c5cff' } as any);
const sha = (s:string)=>createHash('sha256').update(s).digest('hex').slice(0,16);
const perfis = ['slim','standard','athletic','robust','feminino'] as const;
const std = anatomiaCorpo('standard');
const bodies: Record<string,string> = {};
const anat: Record<string,any> = {};
for (const pf of perfis) { bodies[pf]=sha(corpoInteiroPremium(p,'bFIX',pf)); anat[pf]=anatomiaCorpo(pf); }

// waist ratio = (yCin - yOmb)/(yQua - yOmb): fração do torso até a cintura
const waistRatio = (a:any)=> (a.yCin - a.yOmb)/(a.yQua - a.yOmb);
const stdev = (xs:number[])=>{ const m=xs.reduce((s,v)=>s+v,0)/xs.length; return Math.sqrt(xs.reduce((s,v)=>s+(v-m)**2,0)/xs.length); };

// fit monotonic (standard) — cinturaW crescente
const stdA = anat['standard'];
const wF = ['FITTED','REGULAR','RELAXED','OVERSIZED'].map(f=> silhuetaFit(stdA, f as any).cinturaW);
// body-follow: dispersão da cinturaW entre perfis por classe
const disp = (f:string)=> stdev(perfis.map(pf=> silhuetaFit(anat[pf], f as any).cinturaW - anat[pf].cintura));

const out = {
  stdBaseline: {
    yPei: std.yPei, yCin: std.yCin, yQua: std.yQua, yEnt: std.yEnt, yJoe: std.yJoe,
    ombro: std.ombro, peito: std.peito, cintura: std.cintura, quadril: std.quadril,
  },
  stdBodySha: bodies['standard'],
  bodies,
  waistRatio: Object.fromEntries(perfis.map(pf=>[pf, +waistRatio(anat[pf]).toFixed(3)])),
  wF, fitMono: wF[0] < wF[1] && wF[1] < wF[2] && wF[2] < wF[3],
  dispFitted: +disp('FITTED').toFixed(2), dispOver: +disp('OVERSIZED').toFixed(2),
  fitClasses: FIT_CLASSES,
};
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

// baseline histórico de standard (valores originais congelados)
const BASE = { yPei: 150, yCin: 192, yQua: 220, yEnt: 236, yJoe: 298, ombro: 47, peito: 42, cintura: 30, quadril: 36 };
const BODY_STD = '54dd553ea024557d';

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ ANATOMIA REAL + FIT (A+ §13/§14/§15/§16) ━━');
ok(JSON.stringify(r.stdBaseline) === JSON.stringify(BASE), `[1] anatomiaCorpo('standard') == baseline histórico`);
ok(r.stdBodySha === BODY_STD, `[1] corpoInteiroPremium('standard') byte-stable (${r.stdBodySha})`);
// [2] cintura alta (ratio menor) atlético/feminino; baixa (maior) robusto
const wr = r.waistRatio;
ok(wr.athletic < wr.standard && wr.feminino < wr.standard && wr.robust > wr.standard,
  `[2] cintura real por perfil: atl=${wr.athletic} fem=${wr.feminino} < std=${wr.standard} < rob=${wr.robust}`);
// [3] 5 silhuetas distintas
const shas = Object.values(r.bodies); ok(new Set(shas).size === 5, `[3] 5 perfis → 5 silhuetas distintas`);
ok(r.fitMono, `[4] fit monotônico na cintura: ${r.wF.map((v)=>v.toFixed(1)).join(' < ')}`);
ok(r.dispFitted < r.dispOver, `[5] body-follow: FITTED folga constante (disp=${r.dispFitted}) < OVERSIZED flutua (disp=${r.dispOver})`);
ok(r.fitClasses.length === 5, `classes de fit: ${r.fitClasses.join('/')}`);
console.log(falhas ? `\n✗ CORPO-FIT: ${falhas} falha(s)` : '\n✓ corpo-fit verde');
process.exit(falhas ? 1 : 0);
