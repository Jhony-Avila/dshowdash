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
import { deLegado2d, deLegado3d, paraLegado2d } from '${PAINEL}/src/nucleo/adaptadores';
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

// adaptadores: roundtrip 2D sem perda + migração de 'acessorio' + 3D parcial
const cfg = { formato: 'camadas' as const, versao: 1, base: 'bas_gotico',
  camadas: { cabelo: 'cab_moicano', acessorio: 'ace_oculos', xdesconhecida: 'lixo' },
  cores: { destaque: '#7c5cff', pele: '#e0ac69' }, titulo: 'tit_lenda' };
const est = deLegado2d(cfg);
ok(est.body.base === 'bas_gotico', 'deLegado2d base');
ok(est.equipment.acessorio_cabeca === 'ace_oculos', 'acessorio legado deveria migrar p/ cabeca');
ok(!('xdesconhecida' in est.equipment), 'chave desconhecida deveria ser descartada');
ok(est.presentation.titulo === 'tit_lenda', 'titulo deveria virar presentation');
const volta = paraLegado2d(est);
ok(volta.base === 'bas_gotico' && volta.camadas.cabelo === 'cab_moicano'
  && volta.camadas.acessorio_cabeca === 'ace_oculos' && volta.cores.destaque === '#7c5cff'
  && volta.titulo === 'tit_lenda', 'roundtrip 2D perdeu dados');
const est3 = deLegado3d({ arquetipo: 'humano', sockets: { head: 'soc_coroa', pet: 'soc_pet_bit' },
  cores: { pele: '#c68642' }, material: { metal: 0.6, brilho: 0.7 }, morfos: { bravo: 0.5 },
  iluminacao: 'neon', cenario: 'dojo', hora: 'noite', clima: 'neve' });
ok(est3.equipment.head === 'soc_coroa' && est3.equipment.pet === 'soc_pet_bit', '3d sockets');
ok(est3.environment.cenario === 'dojo' && est3.environment.clima === 'neve', '3d environment');
ok(est3.renderer.preferido === '3d' && est3.body.morfos.bravo === 0.5, '3d renderer/morfos');
const semSockets3d = paraLegado2d(est3);
ok(!('head' in semSockets3d.camadas) && !('pet' in semSockets3d.camadas), 'sockets 3D vazaram p/ 2D');

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
