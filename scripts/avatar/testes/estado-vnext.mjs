// testes/estado-vnext.mjs — lote 751–760 (AS6 L0 §3390–§3398, flag
// as6.estado_vnext): Avatar State vNext.
//   A) motor de migrações §3393: cadeia v1→v3 determinística, carimbo de
//      versão, cadeia quebrada para sem inventar, falha devolve o
//      ORIGINAL, entrada não-objeto passa intacta;
//   B) registros reais VAZIOS = identidade (nenhum byte muda em config
//      já salvo — byte-stability por construção);
//   C) dependências de flags §3398: pai OFF desliga o filho
//      (transitivo); rollback §651: as6.estado_vnext OFF = flag() plano;
//   D) capability registry §3396: 3 renderers × vocabulário completo.
// Node puro (padrão nucleo.test.mjs): esbuild + execução sem navegador.
// @version 1.0.0  @created 2026-08-08
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-vnext-'));

writeFileSync(join(tmp, 'prova.ts'), `
import {
  migrarSchema, migrarConfigVNext, migrarEstadoVNext,
  MIGRACOES_CONFIG, MIGRACOES_ESTADO,
  CAPACIDADES_RENDERER, capacidadesDe,
} from '${PAINEL}/src/nucleo/estado-vnext';
import type { RegistroMigracoes } from '${PAINEL}/src/nucleo/estado-vnext';

// localStorage de mentira ANTES de importar flags (módulo usa no flag())
const memoria = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => { memoria.set(k, String(v)); },
  removeItem: (k: string) => { memoria.delete(k); },
};
// import dinâmico não é preciso: esbuild avalia módulos na ordem do
// import — mas flags só LÊ storage dentro de flag(), então o stub acima
// já está de pé quando a primeira consulta acontece.
import { flag, DEPENDENCIAS_FLAGS } from '${PAINEL}/src/nucleo/flags';

const falhas: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) falhas.push(msg); };

// ── A) motor de migrações §3393 ─────────────────────────────────────
const registro: RegistroMigracoes = {
  campoVersao: 'versao',
  versaoAtual: 3,
  migracoes: [
    { de: 1, para: 2, motivo: 'teste', migrar: (d) => ({ ...d, a: (d as any).a * 2 }) },
    { de: 2, para: 3, motivo: 'teste', migrar: (d) => ({ ...d, b: 'novo' }) },
  ],
};
const r1 = migrarSchema(registro, { versao: 1, a: 21 });
ok(r1.aplicadas.join(',') === '1→2,2→3', 'cadeia não aplicou em ordem (' + r1.aplicadas.join(',') + ')');
ok((r1.dado as any).a === 42 && (r1.dado as any).b === 'novo', 'transformações não compuseram');
ok((r1.dado as any).versao === 3, 'versão final não carimbada (' + (r1.dado as any).versao + ')');
const r1b = migrarSchema(registro, { versao: 1, a: 21 });
ok(JSON.stringify(r1.dado) === JSON.stringify(r1b.dado), 'migração NÃO determinística');
// entrada já atual = identidade
const atual = { versao: 3, a: 1 };
const r2 = migrarSchema(registro, atual);
ok(r2.aplicadas.length === 0 && r2.dado === atual, 'dado atual deveria passar intacto');
// versão ACIMA da atual (dado do futuro) = intacto — nunca "desmigra"
const futuro = { versao: 9, a: 1 };
ok(migrarSchema(registro, futuro).dado === futuro, 'dado do futuro foi tocado');
// cadeia quebrada (v0 sem migração registrada) = para sem inventar
const r3 = migrarSchema(registro, { versao: 0 });
ok(r3.aplicadas.length === 0 && !r3.falhou, 'cadeia quebrada deveria parar sem falhar');
// migração que LANÇA = devolve o original e sinaliza
const explosivo: RegistroMigracoes = {
  campoVersao: 'versao', versaoAtual: 2,
  migracoes: [{ de: 1, para: 2, motivo: 'boom', migrar: () => { throw new Error('boom'); } }],
};
const origem = { versao: 1, x: 'intacto' };
const r4 = migrarSchema(explosivo, origem);
ok(r4.falhou && r4.dado === origem, 'falha deveria devolver o ORIGINAL');
// não-objeto passa intacto
ok(migrarSchema(registro, null).dado === null, 'null foi tocado');
ok((migrarSchema(registro, [1] as any).dado as any[])[0] === 1, 'array foi tocado');

// ── B) registros reais são VAZIOS = identidade (byte-stability) ─────
ok(MIGRACOES_CONFIG.migracoes.length === 0 && MIGRACOES_CONFIG.versaoAtual === 1,
  'MIGRACOES_CONFIG deveria nascer vazio na v1 (bump exige teste novo)');
ok(MIGRACOES_ESTADO.migracoes.length === 0 && MIGRACOES_ESTADO.versaoAtual === 1,
  'MIGRACOES_ESTADO deveria nascer vazio na v1');
const cfg = { formato: 'camadas', versao: 1, base: 'base_p1', camadas: { cabelo: 'cab_01' }, cores: { pele: '#e8b58c' } };
const antes = JSON.stringify(cfg);
const rc = migrarConfigVNext(cfg);
ok(rc.dado === cfg && rc.aplicadas.length === 0 && JSON.stringify(rc.dado) === antes,
  'migrarConfigVNext com registro vazio NÃO é identidade');
const est = { schemaVersion: 1, identity: { nome: null } };
ok(migrarEstadoVNext(est).dado === est, 'migrarEstadoVNext com registro vazio NÃO é identidade');

// ── C) dependências de flags §3398 + rollback §651 ──────────────────
// padrão (tudo ON) — cadeia inteira efetiva
ok(flag('as5.ual_extra') === true, 'padrão: ual_extra deveria estar ON');
ok(flag('as6.estado_vnext') === true, 'padrão: as6.estado_vnext deveria estar ON');
// pai OFF → filhos OFF (transitivo: palco3d → animacao3d → ual_extra)
memoria.set('dshow.avst.flags.v1', JSON.stringify({ 'as5.palco3d': false }));
ok(flag('as5.palco3d') === false, 'override local não pegou');
ok(flag('as5.assembler3d') === false, 'filho direto deveria desligar com o pai (§3398)');
ok(flag('as5.roupas3d') === false && flag('as5.cabelo3d') === false,
  'neto deveria desligar transitivamente (assembler→partes, §3398)');
ok(flag('as5.ual_extra') === false, 'ual_extra deveria desligar com o palco (§3398)');
// flags de motor com DUPLA entrada (Foto §329) NÃO desligam com o palco
ok(flag('as5.materiais3d') === true && flag('as5.morfos3d') === true
  && flag('as5.animacao3d') === true && flag('as5.foto3d') === true,
  'flags de dupla entrada (palco+Foto) não podem depender do palco');
// flags sem dependência não são afetadas
ok(flag('as5.consultor') === true, 'flag sem dependência foi afetada indevidamente');
// rollback §651: as6.estado_vnext OFF = comportamento PLANO anterior
memoria.set('dshow.avst.flags.v1', JSON.stringify({ 'as5.palco3d': false, 'as6.estado_vnext': false }));
ok(flag('as5.ual_extra') === true, 'rollback: com as6.estado_vnext OFF o flag() deveria ser plano');
ok(flag('as5.assembler3d') === true, 'rollback: filho deveria voltar ao valor cru');
memoria.delete('dshow.avst.flags.v1');
// grafo declarado é acíclico e só referencia flags conhecidas
for (const [filho, pais] of Object.entries(DEPENDENCIAS_FLAGS)) {
  for (const p of pais) {
    ok(p !== filho, 'auto-dependência em ' + filho);
    ok(flag(p) === true || flag(p) === false, 'pai desconhecido em ' + filho + ': ' + p);
  }
}

// ── D) capability registry §3396 ────────────────────────────────────
const CHAVES = ['suportaMorfos', 'suportaFisica', 'suportaPoderes', 'suportaLuz3d',
  'suportaFotoHQ', 'suportaFundoAnimado', 'suportaAnimacao', 'suportaCanaisCor'];
for (const id of ['2d', '3d', 'foto'] as const) {
  const cap = capacidadesDe(id);
  ok(!!cap, 'renderer ' + id + ' sem capacidades');
  for (const chave of CHAVES) {
    ok(typeof (cap as any)[chave] === 'boolean', id + ': chave ' + chave + ' ausente/não booleana');
  }
}
ok(Object.keys(CAPACIDADES_RENDERER).length === 3, 'registry deveria declarar exatamente os 3 renderers');
ok(capacidadesDe('3d').suportaAnimacao && !capacidadesDe('2d').suportaAnimacao,
  'animação: 3D sim, 2D não (§3396)');
ok(!capacidadesDe('2d').suportaLuz3d && capacidadesDe('3d').suportaLuz3d, 'luz 3D declarada errada');

if (falhas.length) { console.error('FALHAS estado-vnext:\\n- ' + falhas.join('\\n- ')); process.exit(1); }
console.log('estado-vnext OK');
`);

const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
try {
  execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=neutral ` +
    `--outfile="${join(tmp, 'prova.mjs')}"`, { stdio: 'inherit' });
  execSync(`node "${join(tmp, 'prova.mjs')}"`, { stdio: 'inherit' });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
