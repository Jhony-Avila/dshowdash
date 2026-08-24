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
import { createHash } from 'node:crypto';
import { pontosPe, FOOTWEAR_ZONES, ESTRUTURA_PRESET, fatorSpreadCalcado } from '@painel/engine/footwear';
import { anatomiaCorpo } from '@painel/engine/partes/corpo';
import { renderAvatar } from '@painel/engine/render';
import { itemPorId, validarConfig, CONFIG_PADRAO } from '@painel/services/AvatarCatalog';
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

// [5] fator de spread: standard=1 (byte-idêntico), robusto>1, slim<1
out.fator = { slim:+fatorSpreadCalcado('slim').toFixed(3), standard:+fatorSpreadCalcado('standard').toFixed(3), robust:+fatorSpreadCalcado('robust').toFixed(3) };
// [6] render: standard SEM wrapper de calçado (byte-stable); robusto COM
const sha = (s:string)=>createHash('sha256').update(s).digest('hex').slice(0,12);
const mkCfg = (preset:string) => validarConfig({ formato:'camadas', versao:CONFIG_PADRAO.versao, base:'bas_px_oval', acabamento:'premium', cores:{...CONFIG_PADRAO.cores}, corpoV2:{preset}, camadas:{ cabelo:'cab_px_curto', olhos:'olh_px_confiante', boca:'boc_px_seria', roupa:'rou_px_blazer', acessorio_pes:'ace_px_tenis', fundo:'fun_px_estudio' } } as any);
const rndPrem = (c:any) => renderAvatar(c, itemPorId, { estatico:true, palco:true, enquadramento:'corpo', uid:'ftFIX', premium:true, fitV2:true } as any);
const svgStd = rndPrem(mkCfg('compacto'));   // standard
const svgRob = rndPrem(mkCfg('robusto'));
const PES_MARK = 'translate(120 0) scale('; // prefixo único do wrapper de calçado (pes)
out.stdSemWrapper = !svgStd.includes(PES_MARK);
out.robComWrapper = svgRob.includes(PES_MARK);
out.difStdRob = sha(svgStd) !== sha(svgRob);
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
ok(r.fator.standard === 1 && r.fator.robust > 1 && r.fator.slim < 1,
  `[5] fatorSpreadCalcado: slim=${r.fator.slim} < std=${r.fator.standard} < rob=${r.fator.robust}`);
ok(r.stdSemWrapper, `[6] render standard SEM wrapper de calçado (byte-stable, fator=1)`);
ok(r.robComWrapper, `[6] render robusto COM wrapper (calçado ancora ao pé)`);
ok(r.difStdRob, `[6] calçado difere entre standard e robusto`);
console.log(falhas ? `\n✗ FOOTWEAR: ${falhas} falha(s)` : '\n✓ footwear verde');
process.exit(falhas ? 1 : 0);
