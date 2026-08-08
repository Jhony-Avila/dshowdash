#!/usr/bin/env node
// testes/gerar-baseline-layout.mjs — lote 801–810 (AS6 §2676–§2687):
// gera a BASELINE DE GEOMETRIA dos estados canônicos do estúdio.
// @version 1.0.0  @created 2026-08-08
//
// Em vez de baseline de PIXELS (que exigiria binários no git e lib de
// diff), capturamos a ASSINATURA DE LAYOUT: bounding box arredondada +
// visibilidade dos elementos estruturais de cada estado canônico. Isso
// pega a classe de defeito que o próprio briefing cita nominalmente
// (§3041: "legenda por baixo de outro componente" — sobreposição/desvio)
// e vira um JSON textual: regenerar é um ATO INTENCIONAL cujo diff se
// revisa no git (decisão #83).
//
// Uso: node scripts/avatar/testes/gerar-baseline-layout.mjs
// (servidor 8901 de pé; harness gerado). Saída:
// docs/AVATAR-STUDIO-6/baseline-layout.json
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { abrir, irParaHarness } from './navegador.mjs';
import { ESTADOS_CANONICOS, assinaturaDoEstado } from './layout-canonico.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const SAIDA_JSON = join(RAIZ, 'docs', 'AVATAR-STUDIO-6', 'baseline-layout.json');

const baseline = { formato: 'dshow-baseline-layout', versao: 1, viewport: '1440x900', estados: {} };
for (const estado of ESTADOS_CANONICOS) {
  // um navegador POR estado: cada um define as próprias flags no init
  const { navegador, pagina } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: (flags) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(flags)); },
    initArg: estado.flags,
  });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 900);
    baseline.estados[estado.id] = await assinaturaDoEstado(pagina, estado);
    console.log(`[baseline] ${estado.id}: ${Object.keys(baseline.estados[estado.id]).length} elementos`);
  } finally {
    await navegador.close();
  }
}
writeFileSync(SAIDA_JSON, JSON.stringify(baseline, null, 1) + '\n');
console.log(`[baseline] gravado em ${SAIDA_JSON}`);
