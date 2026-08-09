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
import { resolve } from 'node:path';

const TESTES = ['palco-vivo.mjs', 'sockets-3d.mjs', 'retomada-3d.mjs', 'home-pessoal.mjs', 'home-compacto.mjs', 'shell-s1.mjs', 'shell-s2.mjs', 'shell-s3.mjs', 'shell-s4.mjs', 'shell-c1.mjs', 'shell-c2.mjs', 'shell-c3.mjs', 'shell-p1.mjs', 'shell-f4.mjs', 'foto-f6.mjs', 'conquistas-f7.mjs', 'shell-f3d.mjs', 'shell-619.mjs', 'shell-show.mjs', 'shell-cmd.mjs', 'shell-tour.mjs', 'shell-vgrid.mjs', 'foto-wide.mjs', 'shell-polish.mjs', 'shell-save.mjs', 'assets3d.test.mjs', 'pipeline3d.test.mjs', 'renderizador3d.test.mjs', 'shell-palco3d.mjs', 'shell-som.mjs', 'foto-3d.mjs', 'shell-palco3d-criativo.mjs', 'shell-atalhos-backup.mjs', 'shell-palco3d-pro.mjs', 'shell-telemetria.mjs', 'rollout-padrao.mjs', 'foto-pro.mjs', 'palco-apresentacao.mjs', 'manifest.test.mjs', 'lotes-gigantes.mjs', 'programa-160.mjs', 'onda-200.mjs', 'clima-210.mjs', 'foto-galeria-220.mjs', 'foto-canvas-pro.mjs', 'showcase-editor.mjs', 'onda-230.mjs', 'palco-v2.mjs', 'progressao-v2.mjs', 'criacao-v2.mjs', 'palco3d-v2.mjs', 'fundacoes-v2.mjs', 'poderes-familia.mjs', 'progressao-v3.mjs', 'foto-fina.mjs', 'palco-sensorial.mjs', 'palco3d-cine.mjs', 'presets-v2.mjs', 'efeitos-v2.mjs', 'temporadas.mjs', 'portabilidade.mjs', 'orcamento.mjs', 'catalogo-v2.mjs', 'i18n.mjs', 'busca-v2.mjs', 'cards-v2.mjs', 'editor-efeitos.mjs', 'pos3d-real.mjs', 'analytics-local.mjs', 'luz-contextual.mjs', 'memorias-v2.mjs', 'a11y-v2.mjs', 'i18n-catalogo.mjs', 'i18n-paineis.mjs', 'foto-entrada.mjs', 'foto-pro2.mjs', 'roupas-camada.mjs', 'criacao-fina.mjs', 'palco-v3.mjs', 'infra-v3.mjs', 'ux-final.mjs', 'assembler.mjs', 'roupas3d.mjs', 'materiais3d.mjs', 'cabelo3d.mjs', 'animacao3d.mjs', 'classico-aaa.mjs', 'progressivo3d.mjs', 'captura-quality.mjs', 'homologacao.mjs', 'foto329.mjs', 'ual-extra.mjs', 'estado-vnext.mjs', 'tokens-as6.mjs', 'workspace-fase1.mjs', 'viewport-as6.mjs', 'dock-as6.mjs', 'regressao-layout.mjs', 'color-studio.mjs', 'dock-classico.mjs', 'paineis-dock.mjs', 'visual-851.mjs', 'workspace-fixo.mjs', 'meta-assets.mjs', 'inspector-as6.mjs', 'creator-v6.mjs', 'dock-mag.mjs', 'contexto-as6.mjs', 'diff-v6.mjs', 'foto-projeto.mjs', 'foto-camadas.mjs', 'golden-avatars.mjs', 'virtual-as6.mjs', 'quality-as6.mjs', 'touch-as6.mjs', 'ia-registry.mjs'];
let falhas = 0;
for (const t of TESTES) {
  console.log(`\n━━ ${t} ━━`);
  const r = spawnSync('node', [resolve(import.meta.dirname, t)], { stdio: 'inherit' });
  if (r.status !== 0) falhas += 1;
}
console.log(`\n${TESTES.length - falhas}/${TESTES.length} testes verdes`);
process.exit(falhas ? 1 : 0);
