#!/usr/bin/env node
// testes/rodar-todos.mjs — roda a suíte inteira em sequência.
// @version 1.0.0  @created 2026-07-30
//
// Preparação (uma vez por build):
//   1. npx vite build nos painéis (panel-avatar-studio e panel-dashboard)
//   2. node scripts/avatar/gerar-harness.mjs        (da raiz do repo)
//   3. python3 -m http.server 8901                  (de public/, em background)
//   4. npm i playwright-core (onde a suíte rodar) + Chromium (PW_CHROME)
// Screenshots caem em testes/saida/ (fora do git).
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { acharChromium } from './navegador.mjs';

// onda 1426 (#218 §12 — veredito 23/08): PREFLIGHT de reprodutibilidade.
// Antes de rodar ~156 testes, confere num passo só que o ambiente está
// completo — e, se faltar algo, imprime O procedimento (não deixa o dev
// caçar Playwright/Sharp/Chromium/gltf no meio da suíte).
function preflight() {
  const req = createRequire(import.meta.url);
  const faltando = [];
  for (const dep of ['playwright-core', 'sharp', '@gltf-transform/core']) {
    try { req.resolve(dep); } catch { faltando.push(dep); }
  }
  const chrome = acharChromium();
  const problemas = [];
  if (faltando.length) problemas.push(`dependências ausentes: ${faltando.join(', ')}`);
  if (!chrome) problemas.push('Chromium não encontrado (PW_CHROME / /opt/pw-browsers / bundle do playwright)');
  if (problemas.length) {
    console.error('\n✗ PREFLIGHT FALHOU:\n  - ' + problemas.join('\n  - '));
    console.error('\n  Procedimento único (ver scripts/avatar/testes/RUNBOOK-TESTES.md):');
    console.error('    1) npm ci                    (na raiz do repo — instala playwright-core, sharp, @gltf-transform/core, vite/esbuild)');
    console.error('    2) npx playwright install chromium   (ou defina PW_CHROME=/caminho/do/chrome)');
    console.error('    3) (build+harness+http 8901 — o RUNBOOK detalha)\n');
    process.exit(2);
  }
  console.log(`preflight OK · chromium: ${chrome}`);
}
preflight();

const TESTES = ['palco-vivo.mjs', 'sockets-3d.mjs', 'retomada-3d.mjs', 'home-pessoal.mjs', 'home-compacto.mjs', 'shell-s1.mjs', 'shell-s2.mjs', 'shell-s3.mjs', 'shell-s4.mjs', 'shell-c1.mjs', 'shell-c2.mjs', 'shell-c3.mjs', 'shell-p1.mjs', 'shell-f4.mjs', 'foto-f6.mjs', 'conquistas-f7.mjs', 'shell-f3d.mjs', 'shell-619.mjs', 'shell-show.mjs', 'shell-cmd.mjs', 'shell-tour.mjs', 'shell-vgrid.mjs', 'foto-wide.mjs', 'shell-polish.mjs', 'shell-save.mjs', 'assets3d.test.mjs', 'pipeline3d.test.mjs', 'renderizador3d.test.mjs', 'shell-palco3d.mjs', 'shell-som.mjs', 'foto-3d.mjs', 'shell-palco3d-criativo.mjs', 'shell-atalhos-backup.mjs', 'shell-palco3d-pro.mjs', 'shell-telemetria.mjs', 'rollout-padrao.mjs', 'foto-pro.mjs', 'palco-apresentacao.mjs', 'manifest.test.mjs', 'lotes-gigantes.mjs', 'programa-160.mjs', 'onda-200.mjs', 'clima-210.mjs', 'foto-galeria-220.mjs', 'foto-canvas-pro.mjs', 'showcase-editor.mjs', 'onda-230.mjs', 'palco-v2.mjs', 'progressao-v2.mjs', 'criacao-v2.mjs', 'palco3d-v2.mjs', 'fundacoes-v2.mjs', 'poderes-familia.mjs', 'progressao-v3.mjs', 'foto-fina.mjs', 'palco-sensorial.mjs', 'palco3d-cine.mjs', 'presets-v2.mjs', 'efeitos-v2.mjs', 'temporadas.mjs', 'portabilidade.mjs', 'orcamento.mjs', 'catalogo-v2.mjs', 'i18n.mjs', 'busca-v2.mjs', 'cards-v2.mjs', 'editor-efeitos.mjs', 'pos3d-real.mjs', 'analytics-local.mjs', 'luz-contextual.mjs', 'memorias-v2.mjs', 'a11y-v2.mjs', 'i18n-catalogo.mjs', 'i18n-paineis.mjs', 'foto-entrada.mjs', 'foto-pro2.mjs', 'roupas-camada.mjs', 'criacao-fina.mjs', 'palco-v3.mjs', 'infra-v3.mjs', 'ux-final.mjs', 'assembler.mjs', 'roupas3d.mjs', 'materiais3d.mjs', 'cabelo3d.mjs', 'animacao3d.mjs', 'classico-aaa.mjs', 'progressivo3d.mjs', 'captura-quality.mjs', 'homologacao.mjs', 'foto329.mjs', 'ual-extra.mjs', 'estado-vnext.mjs', 'tokens-as6.mjs', 'workspace-fase1.mjs', 'viewport-as6.mjs', 'dock-as6.mjs', 'regressao-layout.mjs', 'color-studio.mjs', 'dock-classico.mjs', 'paineis-dock.mjs', 'visual-851.mjs', 'workspace-fixo.mjs', 'meta-assets.mjs', 'inspector-as6.mjs', 'creator-v6.mjs', 'dock-mag.mjs', 'contexto-as6.mjs', 'diff-v6.mjs', 'foto-projeto.mjs', 'foto-camadas.mjs', 'golden-avatars.mjs', 'virtual-as6.mjs', 'quality-as6.mjs', 'touch-as6.mjs', 'ia-registry.mjs', 'derivados.mjs', 'cms-ro.mjs', 'vida-shell.mjs', 'workers-as6.mjs', 'dock-inferior.mjs', 'tour-v6.mjs', 'motion-v2.mjs', 'light-v6.mjs', 'nav-dock.mjs', 'workers-v2.mjs', 'perf-baseline.mjs', 'cms-ro2.mjs', 'ia-apply.mjs', 'contextos-v6.mjs', 'cobertura-1240.mjs', 'mobile-v6.mjs', 'layouts-as6.mjs', 'dock-fit.mjs', 'corpo-preview.mjs', 'acessorios-v2.mjs', 'variantes-thumb-item.mjs', 'populacao-1402.mjs', 'populacao-1403.mjs', 'slots-corpo.mjs', 'docs-aaa.mjs', 'qualidade-visual.mjs', 'visual-diff.mjs', 'regressao-visual.mjs', 'camera3d.mjs', // onda 1419 (#204/#205)
  'posfoto.mjs', // onda 1420 (#206/#207)
  'materiais-familias.mjs', // onda 1421 (#208/#209)
  'corpo3d-v2.mjs', // onda 1422 (#210/#211)
  'corretivo-a.mjs', // onda 1423 (BRIEFING_CORRETIVO_01 Fase A; #212–#215)
  'asset-clarity.mjs', // onda 1425 (BRIEFING_COMPLEMENTAR_02; #217)
  'looks3d.mjs', 'bundle-assets.mjs', 'homologacao-3d.mjs', 'qa-pipeline.mjs', 'qa-studio.mjs', 'golden-classic.mjs',
  'feminino-save-reload.mjs', 'flag-matrix.mjs', /* V4 §73/§74 */
  'hero-import.mjs', /* A+ §5/§6/§23: pipeline de ativo autorado */
  'enquadramento.mjs', /* A+ §8/§110: CATEGORY_FOCUS_MAP fonte única */
  'corpo-fit.mjs', /* A+ §13-16: anatomia real por perfil + classes de fit */
  'footwear.mjs', /* A+ §12/§71-73: calçado como domínio (âncora do pé + zonas) */
  'gates.mjs', /* A+ §17/§18: apresentação ≠ arte (gates independentes) */
  'hero-catalog.mjs', /* A+2: heroes autorados no catálogo (flag as6.hero_2d) */
  'fit-garment.mjs', /* A+2: silhueta do blazer dirigida pelo fit engine (as6.fit_v2) */
  'v42-single2d.mjs', /* V4.2 §1/§36/§58 (#64): produto 2D único — troca de modo some da experiência principal */
  'v43-single2d-parity.mjs', /* V4.3 §25/§26 (#66): paridade — ferramentas clássicas absorvidas abrem DENTRO do shell único */
  'v43-single2d-flow.mjs', /* V4.3 §25/§53 (#66): PRODUCT E2E — fluxo entry→edit→tools→SAVE sem sair do shell */
  'v43-legacy-compat.mjs', /* V4.3 §16/§54 (#66): COMPATIBILITY E2E — avatar legado abre/renderiza/salva no shell único */
  'v43-category-focus.mjs', /* V4.3 FINAL §7-10 (#67): prova SEMÂNTICA — Calçados deriva de FOCO_FINO.pes (fonte única), pés dominam o palco */
  'art-intake.mjs', /* V4.3 FINAL Track B (#68): ART INTAKE GATE — segurança P0 + contrato + motor real; veredito só FAIL/AWAITING_HUMAN */
  'art-intake-hardening.mjs', /* rodada 3 (readiness hardening): segurança ampliada + enum/âncoras canônicas/roupa_inferior + qualidade de mensagens */
  // TRACK C — AVATAR STUDIO MOBILE (flag as6.mobile_studio, default OFF). E2E da
  // composição responsiva; desktop aprovado segue coberto pelos v43-* (flag OFF).
  'mobile-shell-layout.mjs', 'mobile-touch-navigation.mjs', 'mobile-category-flow.mjs',
  'mobile-tools-overlays.mjs', 'mobile-asset-selection.mjs', 'mobile-color-controls.mjs',
  'mobile-save-flow.mjs', 'mobile-safe-area.mjs', 'mobile-orientation-change.mjs',
  'mobile-landscape.mjs', 'mobile-keyboard-viewport.mjs', 'mobile-legacy-compat.mjs',
  'mobile-accessibility-smoke.mjs', 'mobile-performance-smoke.mjs',
  'mobile-small-screen-320.mjs', 'mobile-tablet-layout.mjs', 'mobile-viewport-matrix.mjs',
  'mobile-touch-inventory.mjs', 'mobile-contrast-audit.mjs', 'mobile-color-flow.mjs',
  'mobile-catalog-density.mjs', 'mobile-adverse-states.mjs', 'mobile-back-navigation.mjs',
  'desktop-responsive-regression.mjs'];
let falhas = 0;
const vermelhos = []; // QA onda 1111: lista EXPLÍCITA no resumo — um red
// que só estoura exceção (sem linha "FALHAS:") não passa mais batido
for (const t of TESTES) {
  console.log(`\n━━ ${t} ━━`);
  const r = spawnSync('node', [resolve(import.meta.dirname, t)], { stdio: 'inherit' });
  if (r.status !== 0) { falhas += 1; vermelhos.push(t); }
}
console.log(`\n${TESTES.length - falhas}/${TESTES.length} testes verdes`);
if (vermelhos.length) console.log(`VERMELHOS: ${vermelhos.join(' · ')}`);
process.exit(falhas ? 1 : 0);
