// testes/footwear.mjs — decisão A+ §12/§71-73: CALÇADO como domínio. Verifica
// no motor REAL (engine/footwear + engine/partes/corpo):
//   [1] pontosPe deriva de anatomiaCorpo e casa com a matemática do pé de
//       corpo.perna() (hx=cx+s·quadril/2; ax=hx−s; pa=max(8,coxa−4)).
//   [2] simetria L/R: os pés são espelhados em torno de cx.
//   [3] o pé ACOMPANHA o perfil (largura/posição mudam com a anatomia — o
//       calçado autorado pousa no pé certo, não em coords fixas).
//   [4] estrutura: 9 zonas nomeadas; presets tênis/social/bota coerentes.
// @version 1.0.0  @created 2026-08-23 (decisão A+)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-foot-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { pontosPe, FOOTWEAR_ZONES, ESTRUTURA_PRESET } from '@painel/engine/footwear';
import { anatomiaCorpo } from '@painel/engine/partes/corpo';
const perfis = ['slim','standard','athletic','robust','feminino'] as const;
// referência: matemática do pé de corpo.perna() reimplementada aqui p/ casar
const pernaFoot = (perfil:any, s:1|-1) => { const A=anatomiaCorpo(perfil); const hx=A.cx+s*(A.quadril*0.5); const ax=hx-s*1; const pa=Math.max(8,A.coxa-4); return { ax, yTornozelo:A.yTor-4, yChao:A.yPe+5, larguraPe:pa-1, drift:s*3 }; };
const out:any = { casa: true, simetria: true, porPerfil: {}, zonas: FOOTWEAR_ZONES.length, presets: {} };
for (const pf of perfis) {
  for (const s of [-1,1] as const) {
    const P = pontosPe(pf, s); const R = pernaFoot(pf, s);
    if (P.ax!==R.ax || P.yTornozelo!==R.yTornozelo || P.yChao!==R.yChao || P.larguraPe!==R.larguraPe || P.drift!==R.drift) out.casa = false;
  }
  const L = pontosPe(pf,-1), Rr = pontosPe(pf,1);
  if (Math.abs((120 - L.ax) - (Rr.ax - 120)) > 0.001) out.simetria = false;
  out.porPerfil[pf] = { ax: Rr.ax, larguraPe: Rr.larguraPe, yTornozelo: Rr.yTornozelo };
}
for (const k of ['tenis','social','bota'] as const) { const e = ESTRUTURA_PRESET[k]; out.presets[k] = { salto: e.salto, cano: e.cano, zonas: e.zonas.length }; }
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ FOOTWEAR — domínio do calçado (A+ §12/§71-73) ━━');
ok(r.casa, `[1] pontosPe casa com a matemática do pé de corpo.perna() nos 5 perfis`);
ok(r.simetria, `[2] simetria L/R dos pés em torno de cx`);
const larguras = Object.values(r.porPerfil).map((x) => x.larguraPe);
ok(new Set(larguras).size > 1, `[3] o pé acompanha o perfil (larguras: ${larguras.join('/')})`);
const axs = Object.values(r.porPerfil).map((x) => x.ax);
ok(new Set(axs).size > 1, `[3] posição do pé (ax) varia por perfil: ${axs.join('/')}`);
ok(r.zonas === 9, `[4] 9 zonas estruturais nomeadas`);
ok(r.presets.bota.cano > r.presets.tenis.cano && r.presets.social.salto >= r.presets.tenis.salto,
  `[4] presets coerentes (bota cano=${r.presets.bota.cano} > tênis; social salto=${r.presets.social.salto})`);
console.log(falhas ? `\n✗ FOOTWEAR: ${falhas} falha(s)` : '\n✓ footwear verde');
process.exit(falhas ? 1 : 0);
