// testes/ia-registry.mjs — lote 1041–1050 (decisão #106, flag
// as6.ia_registry): Prompt Registry da IA (AS6 Parte 12).
//   A) ESPELHO: api/avatar/ia/prompts.json (fonte do servidor) e
//      services/PromptRegistry.ts (front) são IDÊNTICOS byte a byte em
//      template/versão/descrição — mesma doutrina do espelho PHP.
//   B) MOTOR: renderizarPrompt substitui todos os placeholders (puro,
//      sem eval), preserva o desconhecido e devolve null p/ id inválido.
//   C) FIO: VidaService envia prompt_versao gated por as6.ia_registry;
//      ProvedorAnthropic monta do prompts.json com fallback embutido e
//      NUNCA guarda segredo no front (nenhuma chave fora do servidor).
// Node puro. @version 1.0.0  @created 2026-08-09
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A+B via bundle node do registry ─────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'avst-iareg-'));
writeFileSync(join(tmp, 'prova.ts'), `
import { PROMPTS_IA, renderizarPrompt, versaoPrompt } from '${PAINEL}/src/services/PromptRegistry';
const saida = {
  criar: PROMPTS_IA.criar_avatar,
  versao: versaoPrompt('criar_avatar'),
  render: renderizarPrompt('criar_avatar', { catalogo: 'CAT', pedido: 'PED' }),
  renderParcial: renderizarPrompt('criar_avatar', { pedido: 'PED' }),
  inexistente: renderizarPrompt('nao_existe', {}),
};
console.log(JSON.stringify(saida));
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim());
rmSync(tmp, { recursive: true, force: true });

const json = JSON.parse(readFileSync(join(RAIZ, 'api', 'avatar', 'ia', 'prompts.json'), 'utf8'));
ok(r.versao >= 2, `versão do prompt deveria ser ≥2 (veio ${r.versao})`);
ok(json.criar_avatar?.versao === r.criar.versao, 'versões divergem entre prompts.json e o espelho TS');
ok(json.criar_avatar?.template === r.criar.template, 'TEMPLATE diverge entre prompts.json e o espelho TS (fonte única quebrada)');
ok(json.criar_avatar?.descricao === r.criar.descricao, 'descrição diverge entre prompts.json e o espelho TS');
ok(r.render.includes('CAT') && r.render.includes('"PED"') && !r.render.includes('{{'), 'renderizarPrompt não substituiu tudo');
ok(r.renderParcial.includes('{{catalogo}}'), 'placeholder sem valor deveria ser PRESERVADO (auditável)');
ok(r.inexistente === null, 'prompt inexistente deveria devolver null');

// ── C) fios ─────────────────────────────────────────────────────────
const vida = readFileSync(join(PAINEL, 'src/services/VidaService.ts'), 'utf8');
ok(vida.includes('prompt_versao') && vida.includes("flag('as6.ia_registry')"),
  'VidaService deveria enviar prompt_versao gated pela flag');
const prov = readFileSync(join(RAIZ, 'api', 'avatar', 'ia', 'ProvedorAnthropic.php'), 'utf8');
ok(prov.includes('prompts.json') && prov.includes('{{catalogo}}'),
  'ProvedorAnthropic deveria montar do prompts.json (com fallback embutido)');
execSync(`php -l "${join(RAIZ, 'api', 'avatar', 'ia', 'ProvedorAnthropic.php')}"`, { stdio: 'pipe' });
// segredos NUNCA no front: nenhuma chave/env de IA no registry TS
const reg = readFileSync(join(PAINEL, 'src/services/PromptRegistry.ts'), 'utf8');
ok(!/api[-_]?key|x-api-key|sk-/i.test(reg), 'registry do front não pode conter credencial');

if (falhas.length) { console.error('[ia-registry] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[ia-registry] FALHAS: nenhuma');
