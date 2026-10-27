#!/usr/bin/env node
// Onda 1 (Avatar nativo) — PROVA TEXTUAL: a StudioLib.php é movimento do studio.php MONOLÍTICO do git.
//  Referência = HEAD enquanto o studio.php ainda contiver avst_validar_config; depois do commit que moveu as funções,
//  o PAI desse commit (git log -S). Assim o teste vale antes e depois da entrega.
//  (A) as 6 funções top-level são BYTE A BYTE iguais ao HEAD;
//  (B) toda consulta SQL (prepare('…')) do HEAD aparece verbatim na StudioLib;
//  (C) todo avst_erro('CODIGO', status[, extra]) do HEAD aparece como throw new AvstErro('CODIGO', status[, extra]) na lib
//      (exceto JSON_INVALIDO e ERRO_INTERNO, que continuam no studio.php);
//  (D) o studio.php novo não tem mais SQL nem validação própria (só delega) e mantém o envelope/sessão/CSRF/gate;
//  (E) constantes AVST_* idênticas.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' });
function studioMonolitico() {
  const emHead = git(['show', 'HEAD:api/avatar/studio.php']);
  if (emHead.includes('\nfunction avst_validar_config(')) return emHead;
  const moveu = git(['log', '-1', '--format=%H', '-S', 'function avst_validar_config(', '--', 'api/avatar/studio.php']).trim();
  if (!/^[0-9a-f]{40}$/.test(moveu)) throw new Error('[studio-lib-equivalencia] commit que moveu avst_validar_config não encontrado no git');
  return git(['show', `${moveu}^:api/avatar/studio.php`]);
}
const head = studioMonolitico();
const lib = readFileSync(join(RAIZ, 'api/avatar/StudioLib.php'), 'utf8');
const novo = readFileSync(join(RAIZ, 'api/avatar/studio.php'), 'utf8');
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
function funcao(src, nome) {
  const i = src.indexOf(`\nfunction ${nome}(`); if (i < 0) return null;
  const a = src.indexOf('{', i); let d = 0, inS = null;
  for (let p = a; p < src.length; p++) {
    const c = src[p];
    if (inS) { if (c === '\\') { p++; continue; } if (c === inS) inS = null; continue; }
    if (c === "'" || c === '"') { inS = c; continue; }
    if (c === '{') d++; else if (c === '}') { d--; if (d === 0) return src.slice(i + 1, p + 1); }
  }
  return null;
}
// (A)
for (const f of ['avst_validar_config', 'avst_validar_config_foto', 'avst_validar_config3d', 'avst_ativo', 'avst_config_da_linha', 'avst_processar_foto']) {
  const a = funcao(head, f), b = funcao(lib, f);
  ok(a && b && a === b, `[A] ${f} difere do HEAD ou ausente`);
  ok(funcao(novo, f) === null, `[D] ${f} ainda definida no studio.php novo`);
}
// (B) SQL verbatim
const sqls = [...head.matchAll(/prepare\((["'])([\s\S]*?)\1\)/g)].map((m) => m[2]);
const sqlsFotos = sqls.filter((s) => s.includes("avatar_type = 'image' AND avatar_image_url IS NOT NULL")); // galeria de fotos fica no studio.php
for (const s of sqls) {
  if (sqlsFotos.includes(s)) { ok(novo.includes(s), '[B] SQL da galeria de fotos sumiu do studio.php'); continue; }
  ok(lib.includes(s), `[B] SQL do HEAD ausente na StudioLib: ${s.trim().slice(0, 60)}…`);
}
ok(sqls.length >= 15, `[B] poucos SQL encontrados no HEAD (${sqls.length})`);
// (C) códigos de erro
const erros = [...head.matchAll(/^\s*avst_erro\(((?:'|\$)[^;]*?)\);/gm)].map((m) => m[1]);
for (const e of erros) {
  if (/^'JSON_INVALIDO'/.test(e) || /^'ERRO_INTERNO'/.test(e)) { ok(novo.includes(`avst_erro(${e});`), `[C] ${e} deveria continuar no studio.php`); continue; }
  ok(lib.includes(`throw new AvstErro(${e});`), `[C] avst_erro(${e}) sem equivalente throw na lib`);
}
ok(erros.length >= 18, `[C] poucos avst_erro no HEAD (${erros.length})`);
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/[^\n]*$/gm, '');
const libCod = semComentarios(lib);
ok(!/avst_erro\(/.test(libCod), '[C] a lib não pode responder HTTP (avst_erro)');
ok(!/session_write_close\(|\$_SESSION\[|avst_ok\(/.test(libCod), '[C] a lib não pode tocar sessão/envelope');
// (D) studio.php novo
ok((novo.match(/prepare\(/g) || []).length === 1, '[D] studio.php novo deve ter exatamente 1 prepare( (galeria de fotos)');
for (const t of ['SessionGate::start();', 'requireCsrf();', "require_once __DIR__ . '/StudioLib.php';", 'catch (AvstErro $e)', "avst_erro($e->codigo, $e->status, $e->extra);", "$_SESSION['user']['avatar_url'] = $dados['render_url'];", 'avst_persistir($pdo, $userId, $corpo)', 'avst_meta($pdo, $userId, $corpo[\'historico_meta\'])', 'avst_historico($pdo, $userId)', 'avst_estado($pdo, $userId)'])
  ok(novo.includes(t), `[D] studio.php novo sem: ${t}`);
ok(funcao(novo, 'avst_ok') === funcao(head, 'avst_ok') && funcao(novo, 'avst_erro') === funcao(head, 'avst_erro'), '[D] envelope avst_ok/avst_erro mudou');
// (E) constantes
for (const c of ['AVST_DIR_PUBLICO', 'AVST_LIMITE_HORA', 'AVST_RETENCAO_VERSOES', 'AVST_NOME_VERSAO_MAX']) {
  const m = head.match(new RegExp(`const ${c} = [^\\n]*`)); ok(m && lib.includes(m[0]), `[E] constante ${c} difere`); ok(!novo.includes(`const ${c}`), `[E] ${c} duplicada no studio.php`);
}
// mudança funcional ÚNICA permitida: $dirFisico injetável
ok(lib.includes("$dirFisico = $dirFisico ?? (realpath(__DIR__ . '/../../public') . AVST_DIR_PUBLICO);"), '[F] $dirFisico injetável ausente');
console.log(falhas.length ? `[studio-lib-equivalencia] FALHAS: ${falhas.join(' || ')}` : `[studio-lib-equivalencia] OK — 6 funções byte a byte, ${sqls.length} SQL, ${erros.length} códigos de erro, constantes e studio.php delegando`);
process.exit(falhas.length ? 1 : 0);
