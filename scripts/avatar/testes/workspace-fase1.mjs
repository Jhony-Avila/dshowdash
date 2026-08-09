// testes/workspace-fase1.mjs — lote 771–780 (AS6 L2 §32/§39, decisão
// #79): fase 1 da componentização do workspace.
//   A) fronteira: BarraTopo/TrilhoCategorias existem em src/workspace/,
//      compilam ISOLADOS (esbuild) e não importam o ShellStudio (nada de
//      dependência circular — §3470);
//   B) o markup extraído NÃO volta inline no ShellStudio (doutrina: o
//      monólito só encolhe — §3414/§39);
//   C) estados que migraram (menu aleatório §90, prefs de som §178.2)
//      não sobram duplicados no pai.
// O comportamento/DOM é guardado pela suíte existente (shell-s1/som/
// show/cmd/... exercitam cada data-teste do header e da sidebar).
// @version 1.0.0  @created 2026-08-08
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) fronteira limpa ──────────────────────────────────────────────
const barra = readFileSync(join(PAINEL, 'src/workspace/BarraTopo.tsx'), 'utf8');
const trilho = readFileSync(join(PAINEL, 'src/workspace/TrilhoCategorias.tsx'), 'utf8');
const importaMonolito = (src) => /import[^;]*ShellStudio/.test(src);
ok(!importaMonolito(barra) && !importaMonolito(trilho),
  'componente do workspace importando o monólito (dependência circular §3470)');
const tmp = mkdtempSync(join(tmpdir(), 'avst-ws1-'));
writeFileSync(join(tmp, 'prova.tsx'), `
import { BarraTopo } from '${PAINEL}/src/workspace/BarraTopo';
import { TrilhoCategorias } from '${PAINEL}/src/workspace/TrilhoCategorias';
console.log(typeof BarraTopo === 'function' && typeof TrilhoCategorias === 'function');
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
try {
  execSync(`"${esbuild}" "${join(tmp, 'prova.tsx')}" --bundle --format=esm --platform=browser ` +
    '--external:react --external:react-dom --external:lucide-react ' +
    `--outfile="${join(tmp, 'prova.mjs')}"`, { stdio: 'pipe' });
} catch (e) {
  falhas.push(`componentes não compilam isolados: ${String(e.stderr ?? e.message).slice(0, 200)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── B) o markup extraído não volta inline ───────────────────────────
const shell = readFileSync(join(PAINEL, 'src/shell/ShellStudio.tsx'), 'utf8');
ok(!shell.includes('className="avst5-header"'),
  'o <header> voltou inline no ShellStudio — pertence ao BarraTopo (§39)');
ok(!shell.includes('avst5-cat-inicial'),
  'a sidebar voltou inline no ShellStudio — pertence ao TrilhoCategorias (§39)');
ok(shell.includes('<BarraTopo') && shell.includes('<TrilhoCategorias'),
  'ShellStudio deveria consumir os componentes do workspace');

// ── C) estados migrados não sobram no pai ───────────────────────────
ok(!shell.includes('menuAleatorio'), 'estado do menu aleatório duplicado no pai');
// ── FASE 2 (lote 821–830, decisão #85): painel direito ──────────────
const painel = readFileSync(join(PAINEL, 'src/workspace/PainelCatalogo.tsx'), 'utf8');
ok(!importaMonolito(painel), 'PainelCatalogo importando o monólito (§3470)');
ok(!shell.includes('avst5-painel-scroll'), 'o <aside> voltou inline no ShellStudio — pertence ao PainelCatalogo');
ok(shell.includes('<PainelCatalogo'), 'ShellStudio deveria consumir o PainelCatalogo');
ok(!shell.includes('const [propriedades') && !shell.includes('mostrarTopo'),
  'estados do painel duplicados no pai (fase 2)');
ok(painel.includes('mostrarTopo') && painel.includes('propriedades'),
  'estados locais do painel deveriam morar no PainelCatalogo');
ok(!shell.includes('somPrefsAberto') && !shell.includes('const [somPrefs'),
  'estado das prefs de som duplicado no pai');
ok(barra.includes('somPrefsAberto') && barra.includes('menuAleatorio'),
  'estados locais do header deveriam morar no BarraTopo');
// ── FASE 3b (lote 911–920, decisão #93): ComposicaoPalco + BarraCenas ─
const composicao = readFileSync(join(PAINEL, 'src/workspace/ComposicaoPalco.tsx'), 'utf8');
const cenas = readFileSync(join(PAINEL, 'src/workspace/BarraCenas.tsx'), 'utf8');
const dominio = readFileSync(join(PAINEL, 'src/workspace/palco.ts'), 'utf8');
ok(!importaMonolito(composicao) && !importaMonolito(cenas) && !importaMonolito(dominio),
  'componente da fase 3b importando o monólito (§3470)');
ok(!shell.includes('data-teste="cenarios-2d"') && !shell.includes('avst5-cenprops'),
  'a composição do palco voltou inline no ShellStudio — pertence ao ComposicaoPalco (§160–§165)');
ok(!shell.includes('data-teste="apresentacoes"'),
  'a barra de cenas voltou inline no ShellStudio — pertence à BarraCenas (§180/§185)');
ok(shell.includes('<ComposicaoPalco') && shell.includes('<BarraCenas'),
  'ShellStudio deveria consumir ComposicaoPalco e BarraCenas');
ok(!shell.includes('const [cenAberto') && !shell.includes('const [renomeandoAp')
  && !shell.includes('const [apresentacoes') && !shell.includes('sugestaoLuz')
  && !shell.includes('sugestaoCenario'),
  'estados/memos migrados na fase 3b sobrando no pai');
ok(composicao.includes('cenAberto') && cenas.includes('renomeandoAp')
  && cenas.includes('sugestaoCenario') && composicao.includes('sugestaoLuz'),
  'estados locais da fase 3b deveriam morar nos componentes');
ok(!shell.includes("const FUNDOS_PALCO") && dominio.includes('export const FUNDOS_PALCO'),
  'domínio do palco deveria morar em workspace/palco.ts (fase 3b)');

if (falhas.length) { console.error('FALHAS workspace-fase1:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('workspace-fase1 OK');
