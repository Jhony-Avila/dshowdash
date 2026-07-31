// testes/nucleo.test.mjs — testes PUROS do núcleo AS5 (store/comandos/bus/regras).
// @version 1.0.0  @created 2026-07-31
// Roda em node puro: bundla o núcleo com esbuild (mesmo padrão do gerar-seed)
// e executa asserções sem navegador. Uso: node scripts/avatar/testes/nucleo.test.mjs
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const tmp = mkdtempSync(join(tmpdir(), 'avst-nucleo-'));

writeFileSync(join(tmp, 'prova.ts'), `
import { AvatarStore } from '${PAINEL}/src/nucleo/estado';
import { avaliarRegras, checksumEstado, estadoVazio } from '${PAINEL}/src/nucleo/contratos';
import type { Comando, EstadoAvatar } from '${PAINEL}/src/nucleo/estado';

const falhas: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) falhas.push(msg); };

// comando com inverso
const equipar = (id: string): Comando => ({
  nome: 'equipar:cabelo',
  executar: (e) => ({ ...e, equipment: { ...e.equipment, cabelo: id } }),
  desfazer: (e) => { const eq = { ...e.equipment }; delete eq.cabelo; return { ...e, equipment: eq }; },
});

const store = new AvatarStore();
const eventos: string[] = [];
store.bus.em('comando:executado', (d) => eventos.push('exec:' + d.nome));
store.bus.em('comando:desfeito', (d) => eventos.push('undo:' + d.nome));
store.bus.em('comando:refeito', (d) => eventos.push('redo:' + d.nome));

store.executar(equipar('cab_classico'));
ok(store.estadoDraft.equipment.cabelo === 'cab_classico', 'comando nao aplicou');
ok(store.temMudancas, 'temMudancas deveria ser true');
ok(store.podeDesfazer, 'podeDesfazer deveria ser true');

store.desfazer();
ok(store.estadoDraft.equipment.cabelo === undefined, 'undo nao reverteu');
ok(store.podeRefazer, 'podeRefazer deveria ser true');
store.refazer();
ok(store.estadoDraft.equipment.cabelo === 'cab_classico', 'redo nao reaplicou');
ok(eventos.length === 3, 'bus deveria ter 3 eventos, teve ' + eventos.length);

// preview NUNCA contamina o draft (§608)
store.visualizar((e) => ({ ...e, equipment: { ...e.equipment, cabelo: 'cab_teste' } }));
ok(store.estadoVisivel.equipment.cabelo === 'cab_teste', 'preview nao visivel');
ok(store.estadoDraft.equipment.cabelo === 'cab_classico', 'preview CONTAMINOU o draft');
store.limparPreview();
ok(store.estadoVisivel.equipment.cabelo === 'cab_classico', 'limparPreview falhou');

// persistencia: confirmar zera mudancas; descartar volta ao persistido
store.confirmarPersistencia(7);
ok(!store.temMudancas && store.versao === 7, 'confirmarPersistencia falhou');
store.executar(equipar('cab_moicano'));
store.descartarDraft();
ok(store.estadoDraft.equipment.cabelo === 'cab_classico', 'descartarDraft falhou');
ok(!store.podeDesfazer, 'descartar deveria limpar pilha de undo');

// checksum deterministico
const a = checksumEstado(estadoVazio());
const b = checksumEstado(estadoVazio());
ok(a === b && a.length > 0, 'checksum nao deterministico');

// motor de regras (§617)
const estado: EstadoAvatar = { ...estadoVazio(), body: { base: 'bas_robo', morfos: {} },
  equipment: { acessorio_rosto: 'ace_oculos' } };
ok(!avaliarRegras({ id: 'x', slot: 'cabelo', regras: [{ rule: 'requires_species', species: ['bas_humano'] }] }, estado, '2d').ok,
  'requires_species deveria bloquear');
ok(!avaliarRegras({ id: 'x', slot: null, regras: [{ rule: 'conflicts_with', assets: ['ace_oculos'] }] }, estado, '2d').ok,
  'conflicts_with deveria bloquear');
ok(!avaliarRegras({ id: 'x', slot: null, regras: [{ rule: 'requires_renderer', renderer: '3d' }] }, estado, '2d').ok,
  'requires_renderer deveria bloquear');
ok(avaliarRegras({ id: 'x', slot: null, regras: [{ rule: 'requires_asset', assets: ['ace_oculos'] }] }, estado, '2d').ok,
  'requires_asset deveria passar');

console.log('[nucleo] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
`);

// esbuild: usa o do painel se existir, senão o da raiz do repo (hoisted)
import { existsSync } from 'node:fs';
const candidatos = [
  join(PAINEL, 'node_modules', '.bin', 'esbuild'),
  join(RAIZ, 'node_modules', '.bin', 'esbuild'),
];
const esbuild = candidatos.find((c) => existsSync(c)) ?? 'esbuild';
execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --platform=node --format=esm --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: 'inherit' });
try {
  execSync(`node "${join(tmp, 'prova.mjs')}"`, { stdio: 'inherit' });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
