#!/usr/bin/env node
// assets3d/publicar-animacoes.mjs — PACOTE DE ANIMAÇÕES (lote 661–670 ·
// §432/§436/§437).
// @version 1.0.0  @created 2026-08-07
//
// Extrai clipes CURADOS de um GLB da UAL (Universal Animation Library,
// CC0 — mesmo rig ubc-v1 das bases) num GLB SLIM: esqueleto + animações,
// SEM malhas/materiais/texturas. O runtime aplica os tracks por NOME de
// bone em qualquer personagem montado do rig (§436: reuso direto).
// O root motion NÃO é tocado aqui (fonte da verdade preservada) — o
// Animation Manager remove §437 no carregamento.
//
// Uso:
//   node publicar-animacoes.mjs --fonte <glb> --listar
//   node publicar-animacoes.mjs --fonte <glb> --saida <pasta> --id ual_basico \
//     [--clipes Idle,Walk,Run] [--regex 'idle|walk|wave'] [--rig ubc-v1] \
//     [--origem ual-v1] [--comprovante <caminho>] [--data AAAA-MM-DD]
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';

const argumento = (nome, padrao = null) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : padrao;
};

/** Publica e devolve { pasta, manifest }. Exportado p/ o teste. */
export async function publicarAnimacoes(opcoes) {
  const {
    fonte, saida, id,
    clipes = null,          // lista exata; null = usar regex
    regex = null,           // filtro por nome; null com clipes null = TODOS
    rig = 'ubc-v1',
    origem = 'ual-v1',
    licencaTipo = 'CC0',
    comprovante = 'storage/assets-3d-fonte/ual-v1/License.txt',
    data = null,
    log = (m) => console.log(m),
  } = opcoes;
  if (!fonte || !saida || !id) throw new Error('obrigatórios: fonte, saida, id');

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(resolve(fonte));
  const raiz = doc.getRoot();

  // seleção de clipes (nome exato > regex > todos) — valida ANTES de mexer
  const queridos = new Set((clipes ?? []).map((c) => c.trim()).filter(Boolean));
  const re = regex ? new RegExp(regex, 'i') : null;
  const todas = raiz.listAnimations();
  const nomesFonte = todas.map((a) => a.getName());
  const faltando = [...queridos].filter((q) => !nomesFonte.includes(q));
  if (faltando.length) throw new Error(`clipes ausentes na fonte: ${faltando.join(', ')}`);
  let mantidas = 0;
  for (const anim of todas) {
    const nome = anim.getName();
    const fica = queridos.size ? queridos.has(nome) : re ? re.test(nome) : true;
    if (fica) { mantidas += 1; continue; }
    anim.dispose();
  }
  if (!mantidas) throw new Error('nenhum clipe selecionado — confira --clipes/--regex');

  // SLIM: derruba malhas/materiais/texturas — o esqueleto fica (os
  // tracks apontam para os nodes dos bones); prune limpa o resto
  for (const m of raiz.listMeshes()) m.dispose();
  for (const m of raiz.listMaterials()) m.dispose();
  for (const t of raiz.listTextures()) t.dispose();
  for (const s of raiz.listSkins()) s.dispose();
  await doc.transform(prune());

  // sanidade §436: todo track deve apontar p/ bone do rig declarado
  const listaRig = (() => {
    try {
      const arq = resolve(import.meta.dirname, `rig-${rig}.json`);
      return new Set(JSON.parse(readFileSync(arq, 'utf8')).bones ?? []);
    } catch { return null; }
  })();
  const nomesClipes = [];
  const foraDoRig = new Set();
  for (const anim of raiz.listAnimations()) {
    nomesClipes.push(anim.getName());
    if (!listaRig) continue;
    for (const canal of anim.listChannels()) {
      const alvo = canal.getTargetNode()?.getName() ?? '';
      if (alvo && !listaRig.has(alvo)) foraDoRig.add(alvo);
    }
  }
  if (foraDoRig.size) {
    log(`⚠ tracks fora do rig ${rig}: ${[...foraDoRig].slice(0, 5).join(', ')}${foraDoRig.size > 5 ? '…' : ''} (aplicação degrada por nome — conferir)`);
  }

  const pasta = resolve(saida);
  mkdirSync(pasta, { recursive: true });
  const arquivo = join(pasta, 'pacote.glb');
  await io.write(arquivo, doc);
  const bytes = readFileSync(arquivo);
  const kb = Math.round(bytes.length / 1024);
  log(`pacote.glb escrito: ${nomesClipes.length} clipe(s), ${kb}KB`);

  const manifest = {
    id,
    tipo: 'pacote_animacoes',
    versao: 1,
    rig,
    arquivo: 'pacote.glb',
    clipes: nomesClipes.sort(),
    hashes: { pacote: createHash('sha256').update(bytes).digest('hex') },
    licenca: { tipo: licencaTipo, fonte: origem, comprovante },
    origem,
    fonte_original: basename(String(fonte)),
    ...(data ? { criado_em: data } : {}),
  };
  writeFileSync(join(pasta, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  log(`manifest.json escrito (${manifest.hashes.pacote.slice(0, 18)}…)`);
  return { pasta, manifest };
}

// ── CLI ─────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const fonte = argumento('fonte');
  if (fonte && process.argv.includes('--listar')) {
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
    const doc = await io.read(resolve(fonte));
    for (const a of doc.getRoot().listAnimations()) console.log(a.getName());
    process.exit(0);
  }
  const saida = argumento('saida');
  const id = argumento('id');
  if (!fonte || !saida || !id) {
    console.error('uso: publicar-animacoes.mjs --fonte <glb> [--listar] --saida <pasta> --id <slug> [--clipes a,b | --regex padrao] [--rig --origem --comprovante --data]');
    process.exit(2);
  }
  publicarAnimacoes({
    fonte, saida, id,
    clipes: process.argv.includes('--clipes')
      ? argumento('clipes', '').split(',').map((s) => s.trim()).filter(Boolean)
      : null,
    regex: argumento('regex', null),
    rig: argumento('rig', 'ubc-v1'),
    origem: argumento('origem', 'ual-v1'),
    licencaTipo: argumento('licenca', 'CC0'),
    comprovante: argumento('comprovante', 'storage/assets-3d-fonte/ual-v1/License.txt'),
    data: argumento('data', null),
  }).then(({ pasta, manifest }) => {
    console.log(`PUBLICADO em ${pasta} · ${manifest.clipes.length} clipe(s): ${manifest.clipes.join(', ')}`);
  }).catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
