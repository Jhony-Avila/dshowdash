// testes/regressao-layout.mjs — lote 801–810 (AS6 §2676–§2687, decisão
// #83): REGRESSÃO DE GEOMETRIA contra a baseline versionada no git.
// Recaptura a assinatura dos estados canônicos (layout-canonico.mjs) e
// compara com docs/AVATAR-STUDIO-6/baseline-layout.json (tolerância
// 2px). Desvio = ou um BUG de layout (classe §3041: sobreposição/
// sumiço/deslocamento) ou uma mudança INTENCIONAL — nesse caso rode
//   node scripts/avatar/testes/gerar-baseline-layout.mjs
// e revise o diff do JSON no commit (a mudança fica auditável).
// @version 1.0.0  @created 2026-08-08
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { abrir, irParaHarness } from './navegador.mjs';
import { ESTADOS_CANONICOS, assinaturaDoEstado, compararAssinaturas } from './layout-canonico.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const baseline = JSON.parse(readFileSync(join(RAIZ, 'docs', 'AVATAR-STUDIO-6', 'baseline-layout.json'), 'utf8'));
const falhas = [];

if (baseline.formato !== 'dshow-baseline-layout' || baseline.versao !== 1) {
  falhas.push('cabeçalho da baseline inválido');
}
for (const estado of ESTADOS_CANONICOS) {
  const esperado = baseline.estados[estado.id];
  if (!esperado) { falhas.push(`estado ${estado.id} ausente da baseline — regenere`); continue; }
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: (flags) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(flags)); },
    initArg: estado.flags,
  });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 900);
    const atual = await assinaturaDoEstado(pagina, estado);
    for (const d of compararAssinaturas(esperado, atual)) falhas.push(`${estado.id} · ${d}`);
    if (erros.length) falhas.push(`${estado.id} · erros JS: ${erros.join(' | ')}`);
  } catch (e) {
    falhas.push(`${estado.id} · exceção: ${e.message}`);
  } finally {
    await navegador.close();
  }
}
// estados da baseline que o código não conhece mais = baseline suja
for (const id of Object.keys(baseline.estados)) {
  if (!ESTADOS_CANONICOS.some((e) => e.id === id)) falhas.push(`baseline com estado órfão: ${id} — regenere`);
}

if (falhas.length) { console.error('FALHAS regressao-layout:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('regressao-layout OK');
