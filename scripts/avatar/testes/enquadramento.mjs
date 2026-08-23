// testes/enquadramento.mjs — decisão A+ §8/§9/§10/§110: CATEGORY_FOCUS_MAP
// como FONTE ÚNICA. Verifica no módulo REAL (engine/enquadramento):
//   [1] cobertura: TODA CategoriaId resolve um foco (sem buraco → sem `if` na UI).
//   [2] limites: todo box normalizado ∈ [0,1] e o viewBox absoluto cai dentro
//       da fonte (busto 240×240 / corpo 240×400) — nada recorta fora do render.
//   [3] refinamento por slot sobrepõe a câmera coarse (acessorio+pes → pés).
//   [4] §110: o foco FINO de um item (ex. roupa=torso) DOMINA a viewport —
//       área menor que o corpo inteiro do palco (o alvo ocupa mais tela).
//   [5] determinismo: focoDe puro (mesma entrada ⇒ mesmo box).
// @version 1.0.0  @created 2026-08-23 (decisão A+)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-enq-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { focoDe, viewBoxDe, caixaPx, DIM_FONTE } from '@painel/engine/enquadramento';
import { CATEGORIAS } from '@painel/services/AvatarCatalog';

const cats = (CATEGORIAS as any[]).map((c) => c.id);
const inBox = (b:number[]) => b.every((v) => v >= 0 && v <= 1) && b[0]+b[2] <= 1.0001 && b[1]+b[3] <= 1.0001;
const areaNorm = (b:number[]) => b[2]*b[3];

const out:any = { cats, cobertura: {}, semBuraco: true, todosInBox: true, vbInBounds: true };
for (const c of cats) {
  const f = focoDe(c);
  if (!f) { out.semBuraco = false; continue; }
  if (!inBox(f.box)) out.todosInBox = false;
  const [W,H] = DIM_FONTE[f.src];
  const vb = viewBoxDe(f).split(' ').map(Number);
  if (vb[0] < 0 || vb[1] < 0 || vb[0]+vb[2] > W+0.5 || vb[1]+vb[3] > H+0.5) out.vbInBounds = false;
  out.cobertura[c] = { src: f.src, label: f.label, area: +areaNorm(f.box).toFixed(3) };
}
// [3] refino por slot
const calc = focoDe('acessorio', 'pes');
const acessPad = focoDe('acessorio');
out.slotRefina = calc.label === 'pés/calçado' && calc.src === 'corpo' && calc.label !== acessPad.label;
// [4] §110 dominar viewport: item fino menor que corpo inteiro
const roupa = focoDe('roupa'); const full = focoDe('fundo'); // fundo = quadro cheio
out.dominaViewport = areaNorm(roupa.box) < areaNorm(full.box);
out.roupaArea = +areaNorm(roupa.box).toFixed(3);
// [5] determinismo
out.determinista = JSON.stringify(focoDe('acessorio','pes')) === JSON.stringify(focoDe('acessorio','pes'));
// px sanity
out.pxPes = caixaPx(calc);
process.stdout.write(JSON.stringify(out));
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')].find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --external:sharp --alias:@painel="${join(PAINEL, 'src')}" --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }));
rmSync(tmp, { recursive: true, force: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
console.log('\n━━ CATEGORY_FOCUS_MAP — enquadramento fonte única (A+ §8/§110) ━━');
ok(r.semBuraco, `[1] cobertura: todas as ${r.cats.length} categorias resolvem foco`);
ok(r.todosInBox, `[2] todos os boxes normalizados ∈ [0,1] e dentro do quadro`);
ok(r.vbInBounds, `[2] viewBox absoluto cai dentro da fonte (busto/corpo)`);
ok(r.slotRefina, `[3] slot refina a câmera coarse (acessorio+pes → ${r.pxPes})`);
ok(r.dominaViewport, `[4] §110: item (roupa area=${r.roupaArea}) domina viewport vs quadro cheio`);
ok(r.determinista, `[5] focoDe determinístico`);
console.log(falhas ? `\n✗ ENQUADRAMENTO: ${falhas} falha(s)` : '\n✓ enquadramento verde');
process.exit(falhas ? 1 : 0);
