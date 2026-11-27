// teste-reforco-p2.cjs (AZUL/ESQUERDA, 27/11) — degrau P2 de reforço aprovado pelo arquiteto (vira P1 antes de ligar cada função):
//  (1) panel-01 kanban e timeline: dado interpolado em HTML com escape (texto e atributo) e cor só como valor CSS simples;
//  (2) fila de fotos: depois de "Entrar novamente" em outra aba, retoma SÓ se a sessão nova for do MESMO usuário (titular da página);
//  (3) Conciliação: 404/403/sem acesso retira o bloco MESMO com leitura anterior.
// Módulos REAIS empacotados com o esbuild da receita; fetch e DOM simulados. Uso: node scripts/seguranca/teste-reforco-p2.cjs <RAIZ> [esbuild]
'use strict';
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(process.argv[2] || '.');
const es = require(process.argv[3] || path.join(RAIZ, 'public/react/node_modules/esbuild'));
let n = 0; const f = []; const ok = (c, nome) => { n++; if (!c) f.push(nome); };
const carregar = (rel) => {
  const r = es.buildSync({ entryPoints: [path.join(RAIZ, rel)], bundle: true, write: false, format: 'cjs', platform: 'node', target: 'es2022', logLevel: 'silent' });
  const m = { exports: {} }; new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require); return m.exports;
};
(async () => {
  // ── (1) kanban e timeline ──
  const MAL = '<img src=x onerror=alert(1)>', ID = '1" onmouseover="alert(2)';
  try {
    const k = carregar('public/components/panels/panel-01/ui/kanban-view.ts');
    const cont = { innerHTML: '', querySelectorAll: () => [] };
    const kv = new k.KanbanViewManager({ container: cont, columns: [{ id: 'a', label: '<b>Col</b>', color: 'red;background:url(//exemplo.invalid/x)', status: 'P" data-x="1' }], groupField: 'situacao' });
    kv.setData([{ situacao: 'P" data-x="1', id: ID, descricao: MAL }]); kv.render();
    const h = cont.innerHTML;
    ok(!h.includes('<img') && h.includes('&lt;img') && !h.includes('" onmouseover') && !h.includes('<b>') && !h.includes('url(') && !h.includes('" data-x="1"'),
      'kanban: descrição, id, rótulo e status escapados; cor injetada vira neutra · ' + h.slice(0, 160));
  } catch (e) { ok(false, 'kanban: ' + e.message); }
  try {
    const t = carregar('public/components/panels/panel-01/ui/timeline-view.ts');
    const tv = new t.TimelineViewManager({});
    const h = tv._renderDay('k', { date: new Date(2026, 10, 27), items: [{ id: ID, descricao: '<script>alert(3)</script>', valor_total: 10 }], count: 1, total: 10 });
    ok(!h.includes('<script>') && h.includes('&lt;script&gt;') && !h.includes('" onmouseover'), 'timeline: descrição e id escapados · ' + h.slice(0, 120));
  } catch (e) { ok(false, 'timeline: ' + e.message); }
  // ── (2) fila de fotos: titular ──
  const resp = (body, status = 200) => ({ status, headers: { get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null) },
    text: async () => JSON.stringify(body), clone() { return resp(body, status); } });
  const ativa = (id, tok) => resp({ ok: true, data: { authenticated: true, user: id === null ? {} : { id }, session: { token: tok, csrf_token: 'c' } }, error: null });
  const encerrada = resp({ ok: true, data: { authenticated: false, user: null, session: { csrf_token: 'c' } }, error: null });
  globalThis.window = { setTimeout, clearTimeout, location: { assign() {} } }; globalThis.document = { querySelector: () => null };
  const fila = []; globalThis.fetch = async () => (fila.length ? fila.shift() : resp({}, 503));
  const fotos = () => carregar('public/components/panels/panel-atributos/src/lib/fotos.ts');
  try {
    let F = fotos(); fila.push(ativa(990501, 't1')); const tit = F.lembrarTitular ? await F.lembrarTitular() : (await F.checarSessao(), 'sem lembrarTitular');   // versão antiga: mostra o comportamento, não um erro
    fila.push(ativa(990501, 't2')); const mesma = await F.sessaoRenovada('t1');
    fila.push(ativa(990502, 't3')); const outra = await F.sessaoRenovada('t1');
    fila.push(ativa(990501, 't1')); const antiga = await F.sessaoRenovada('t1');
    fila.push(encerrada); const sem = await F.sessaoRenovada('t1');
    fila.push(resp({}, 503)); const desc = await F.sessaoRenovada('t1');
    F = fotos(); fila.push(ativa(null, 't9')); if (F.lembrarTitular) { await F.lembrarTitular(); } else { await F.checarSessao(); } fila.push(ativa(990501, 't10')); const semTitular = await F.sessaoRenovada('t9');
    ok(tit === 990501 && mesma === 'nova' && outra === 'outra_conta' && antiga === 'antiga' && sem === 'sem_login' && desc === 'desconhecido' && semTitular === 'outra_conta',
      'fotos: titular = 1º usuário da página; mesma conta com sessão nova → nova; OUTRA conta → outra_conta (não retoma); sessão antiga, sem login e check indisponível como antes; titular desconhecido → outra_conta · '
      + JSON.stringify({ tit, mesma, outra, antiga, sem, desc, semTitular }));
  } catch (e) { ok(false, 'fotos: ' + e.message); }
  const g = (() => { try { return fs.readFileSync(path.join(RAIZ, 'public/components/panels/panel-atributos/src/ui/fotos/GaleriaFotos.tsx'), 'utf8'); } catch { return ''; } })();
  ok(/v === 'outra_conta'\) \{ descartarFilas\(\);/.test(g) && /void lembrarTitular\(\);/.test(g), 'fotos (tela): outra conta descarta a fila e NÃO chama aoContinuar; titular fixado ao abrir a ficha');
  // ── (3) Conciliação ──
  const c = (() => { try { return fs.readFileSync(path.join(RAIZ, 'public/components/panels/panel-dashboard/src/v2/Conciliacao.tsx'), 'utf8'); } catch { return ''; } })();
  ok(/const naoMostra = b\.erro instanceof ErroV2 && \(b\.erro\.http === 404 \|\| b\.erro\.http === 403 \|\| b\.erro\.semAcesso\);/.test(c) && !/semAcesso\) && !b\.dados/.test(c),
    'Conciliação: 404/403/sem acesso retira o bloco mesmo com leitura anterior (a condição !b.dados saiu)');
  if (f.length) { console.log(`[ERRO] teste-reforco-p2: ${f.length} de ${n}`); for (const x of f) console.log(' - ' + x); process.exit(1); }
  console.log(`[OK]   teste-reforco-p2: ${n} verificações (kanban e timeline escapados; fila de fotos só retoma com o mesmo usuário; Conciliação retirada em 403/404)`);
})();
