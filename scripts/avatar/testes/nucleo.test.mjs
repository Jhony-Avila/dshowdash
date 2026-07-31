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
// REGRESSÃO (bug F1 achado na C2): estados com equipment/base diferentes
// TÊM que dar checksums diferentes (o replacer-whitelist os igualava)
const comCabelo = { ...estadoVazio(), equipment: { cabelo: 'cab_moicano' } };
ok(checksumEstado(comCabelo) !== a, 'checksum IGNOROU equipment (whitelist recursiva)');
ok(checksumEstado({ ...estadoVazio(), body: { base: 'bas_robo', morfos: {} } }) !== a,
  'checksum IGNOROU body.base');

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

// §71 (F3 C2): propriedades por asset — roundtrip + sanitização + motor
import { sanitizarParams, aplicarParamsSvg } from '${PAINEL}/src/engine/params';
const cfgP = { formato: 'camadas' as const, versao: 1, base: 'bas_gotico',
  camadas: { aura: 'aur_neon', emblema: 'emb_coroa' }, cores: { destaque: '#7c5cff' },
  params: { aura: { intensidade: 0.6, velocidade: 1.5 }, emblema: { escala: 1.2 } } };
const estP = deLegado2d(cfgP);
ok(estP.appearance.params?.aura?.intensidade === 0.6, 'deLegado2d perdeu params');
const voltaP = paraLegado2d(estP);
ok(voltaP.params?.aura?.velocidade === 1.5 && voltaP.params?.emblema?.escala === 1.2,
  'roundtrip 2D perdeu params');
ok(paraLegado2d(deLegado2d({ ...cfgP, params: undefined })).params === undefined,
  'config sem params deveria voltar SEM params (byte-estavel)');
// estado sem params tem o MESMO checksum de antes da feature
ok(checksumEstado(estadoVazio()) === a, 'params opcionais mudaram o checksum do estado vazio');
// sanitização: grampeia, descarta desconhecido, remove padrão
const san = sanitizarParams('aura', { intensidade: 0.1, velocidade: 1, foo: 3 });
ok(san?.intensidade === 0.25 && !('velocidade' in (san ?? {})) && !('foo' in (san ?? {})),
  'sanitizarParams: grampo/padrao/desconhecido');
ok(sanitizarParams('aura', { intensidade: 9 }) === undefined,
  'grampear NO padrao (max=padrao) deveria descartar');
ok(sanitizarParams('cabelo', { x: 1 }) === undefined, 'categoria sem props deveria dar undefined');
// aplicação no SVG: byte-estável sem params; wrappers/dur com params
const frag = '<g><animate dur="3.2s"/></g>';
ok(aplicarParamsSvg('aura', frag, undefined) === frag, 'sem params deveria ser byte-identico');
const comP = aplicarParamsSvg('aura', frag, { intensidade: 0.5, velocidade: 2 });
ok(comP.includes('opacity="0.5"') && comP.includes('dur="1.6s"'), 'aura: opacity/dur nao aplicados');
const emb = aplicarParamsSvg('emblema', '<circle/>', { escala: 1.2 });
ok(emb.includes('translate(152 206) scale(1.2)'), 'emblema: escala fora do centro do peito');

// §73 (F3 C3): canais de cor por camada — roundtrip + paleta LOCAL no motor
import { renderAvatar } from '${PAINEL}/src/engine/render';
const cfgC = { formato: 'camadas' as const, versao: 1, base: 'bas_gotico',
  camadas: { roupa: 'rou_x', aura: 'aur_x' }, cores: { destaque: '#7c5cff' },
  coresCamada: { roupa: { destaque: '#ff5f8f' } } };
const estC = deLegado2d(cfgC);
ok(estC.appearance.coresCamada?.roupa?.destaque === '#ff5f8f', 'deLegado2d perdeu coresCamada');
ok(paraLegado2d(estC).coresCamada?.roupa?.destaque === '#ff5f8f', 'roundtrip perdeu coresCamada');
ok(paraLegado2d(deLegado2d({ ...cfgC, coresCamada: undefined })).coresCamada === undefined,
  'config sem canais deveria voltar SEM coresCamada');
// motor: a peça com canal usa a paleta LOCAL; quem divide a cor global não muda
const resolver = (id: string) => ({
  id, categoria: id.startsWith('rou') ? 'roupa' : 'aura', nome: id, descricao: '',
  raridade: 'comum', tema: 't',
  render: (p: { destaque: { base: string } }) =>
    '<rect data-id="' + id + '" fill="' + p.destaque.base + '"/>',
} as never);
const svgC = renderAvatar(cfgC as never, resolver as never, { uid: 'tt' });
ok(svgC.includes('data-id="rou_x" fill="#ff5f8f"'), 'roupa deveria usar o canal PRÓPRIO');
ok(svgC.includes('data-id="aur_x" fill="#7c5cff"'), 'aura deveria manter o destaque GLOBAL');
// sem override → byte-idêntico ao render de antes da feature
const svgSem1 = renderAvatar({ ...cfgC, coresCamada: undefined } as never, resolver as never, { uid: 'tt' });
const svgSem2 = renderAvatar({ ...cfgC, coresCamada: {} } as never, resolver as never, { uid: 'tt' });
ok(svgSem1 === svgSem2, 'coresCamada vazio deveria render byte-identico ao ausente');

// §90 (F3 P1'): aleatório inteligente — determinismo + bloqueios + modos
import { CONFIG_PADRAO, aleatorioInteligente, itensDe, validarConfig } from '${PAINEL}/src/services/AvatarCatalog';
const cab0 = itensDe('cabelo')[0].id;
const cfgA = validarConfig({ ...CONFIG_PADRAO, camadas: { ...CONFIG_PADRAO.camadas, cabelo: cab0 } });
const r1 = aleatorioInteligente(cfgA, { semente: 42, modo: 'completo', bloqueados: new Set(['cabelo']) });
const r2 = aleatorioInteligente(cfgA, { semente: 42, modo: 'completo', bloqueados: new Set(['cabelo']) });
ok(JSON.stringify(r1) === JSON.stringify(r2), 'aleatorioInteligente nao deterministico');
ok(r1.camadas.cabelo === cab0, 'slot BLOQUEADO foi trocado pelo aleatorio');
const rc = aleatorioInteligente(cfgA, { semente: 7, modo: 'cores' });
ok(JSON.stringify(rc.camadas) === JSON.stringify(cfgA.camadas) && rc.base === cfgA.base,
  'modo cores mexeu nas camadas');
ok(JSON.stringify(rc.cores) !== JSON.stringify(cfgA.cores), 'modo cores nao trocou as cores');
const rk = aleatorioInteligente(cfgA, { semente: 7, modo: 'categoria', categoria: 'olhos' });
ok(rk.camadas.cabelo === cab0 && rk.base === cfgA.base, 'modo categoria vazou p/ outros slots');
ok(typeof rk.camadas.olhos === 'string', 'modo categoria nao sorteou a categoria pedida');
// slot bloqueado VAZIO permanece vazio (§135.1: ausencia tambem e escolha)
const semAura = validarConfig({ ...cfgA, camadas: { ...cfgA.camadas } });
delete (semAura.camadas as Record<string, string>).aura;
const rv = aleatorioInteligente(semAura, { semente: 1, modo: 'completo', bloqueados: new Set(['aura']) });
ok(!rv.camadas.aura, 'slot bloqueado VAZIO foi preenchido');

// §401 (F5): contrato RenderizadorAvatar + Renderizador2d headless
import { pendenciasPara } from '${PAINEL}/src/nucleo/renderizador';
import { Renderizador2d } from '${PAINEL}/src/services/Renderizador2d';
const estadoMisto = { ...estadoVazio(), body: { base: 'bas_classica', morfos: {} },
  equipment: { cabelo: itensDe('cabelo')[0].id, aura: itensDe('aura')[0].id,
    head: 'soc_coroa', pet: 'soc_pet_bit' } };
const pend = pendenciasPara(estadoMisto as never, '2d');
ok(pend.includes('head') && pend.includes('pet') && !pend.includes('cabelo'),
  'pendenciasPara deveria listar SÓ os sockets 3D');
ok(pendenciasPara(estadoMisto as never, '3d').length === 0, '3D não deveria ter pendências');
const r2d = new Renderizador2d();
await r2d.inicializar({ qualidade: 'auto' });
const alvoFake = { innerHTML: '' };
await r2d.montar(alvoFake);
const res = await r2d.aplicarEstado(estadoMisto as never);
ok(res.ok && res.pendencias.length === 2, 'aplicarEstado: ok+pendencias');
ok(alvoFake.innerHTML.startsWith('<svg') && alvoFake.innerHTML.includes('</svg>'),
  'renderizador 2D não pintou SVG no alvo');
const animado = alvoFake.innerHTML;
r2d.pausar();
ok(!alvoFake.innerHTML.includes('<animate') && animado !== alvoFake.innerHTML,
  'pausar deveria congelar o SMIL');
r2d.retomar();
ok(alvoFake.innerHTML === animado, 'retomar deveria voltar ao render animado');
const cap = await r2d.capturar({ largura: 96, altura: 96, deterministica: true });
ok(cap.dataUri.startsWith('data:image/svg+xml') && !decodeURIComponent(cap.dataUri).includes('<animate'),
  'captura deveria ser dataUri ESTÁTICO (§508)');
await r2d.descartar();
ok(alvoFake.innerHTML === '', 'descartar deveria limpar o alvo');

// §636 (F8): validador de sugestão de IA — nunca inventa ID, relata rejeições
import { validarSugestaoIA, resumirAjustes } from '${PAINEL}/src/services/ValidadorIA';
const cabeloReal = itensDe('cabelo')[0].id;
const bloqueadoReal = itensDe('moldura').find((i) => i.bloqueadoPor)?.id;
const rel = validarSugestaoIA({
  base: 'bas_inventada_pela_ia',
  camadas: { cabelo: cabeloReal, olhos: 'olho_fake_9000', roupa: cabeloReal,
    ...(bloqueadoReal ? { moldura: bloqueadoReal } : {}) },
  cores: { destaque: '#39d98a' },
}, new Set());
ok(rel.rejeitados.some((r) => r.id === 'bas_inventada_pela_ia' && r.motivo === 'id_inexistente'),
  'base inventada deveria cair como id_inexistente');
ok(rel.rejeitados.some((r) => r.id === 'olho_fake_9000' && r.motivo === 'id_inexistente'),
  'id inventado em camada deveria cair');
ok(rel.rejeitados.some((r) => r.slot === 'roupa' && r.motivo === 'categoria_incompativel'),
  'cabelo no slot roupa deveria cair como categoria_incompativel');
if (bloqueadoReal) {
  ok(rel.rejeitados.some((r) => r.id === bloqueadoReal && r.motivo === 'bloqueado'),
    'item bloqueado deveria cair sem desbloqueio');
}
ok(rel.aceitos.includes(cabeloReal) && rel.config.camadas.cabelo === cabeloReal,
  'item válido deveria sobreviver');
ok(rel.config.base && rel.config.formato === 'camadas', 'config final deveria ser seguro');
ok((resumirAjustes(rel.rejeitados) ?? '').includes('não existe'), 'resumo deveria citar ids inexistentes');
ok(resumirAjustes([]) === null, 'sem rejeições → sem nota');
// com desbloqueio, o item bloqueado passa
if (bloqueadoReal) {
  const rel2 = validarSugestaoIA({ camadas: { moldura: bloqueadoReal } }, new Set([bloqueadoReal]));
  ok(rel2.aceitos.includes(bloqueadoReal), 'desbloqueado deveria passar');
}

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
