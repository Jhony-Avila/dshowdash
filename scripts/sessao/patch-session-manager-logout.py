#!/usr/bin/env python3
# DSHOW-110 · patch CIRÚRGICO do session-manager.bundle.js (decisão do Jhony 23/11: não sobrar caminho com o logout antigo sem CSRF).
# Por que patch e não build: o módulo principal do session-manager (SessionManager + exposição global) NÃO existe mais na fonte —
# components/session-manager/index.ts só reexporta o próprio bundle desde antes do versionamento (27/07); "buildar" só reminifica o
# bundle velho. Mesmo caminho usado no header em 16/09 (/backup/header-fetch-warn-20260916). Entrada: SÓ o bundle servido (hash
# conferido). Saída determinística. Uso: patch-session-manager-logout.py <entrada> <saída>
import sys, hashlib
ENTRADA_SHA = '8412fcc5ff64bb06'   # session-manager.bundle.js da produção (30/04, = 1e5db249)
ent, sai = sys.argv[1], sys.argv[2]
s = open(ent, encoding='utf-8').read()
assert hashlib.sha256(s.encode()).hexdigest().startswith(ENTRADA_SHA), 'entrada não é o bundle servido conhecido'
trocas = [
  # 1) cliente da API: o cliente ÚNICO (CSRF relido, espera a confirmação; falha de rede/CSRF/5xx = ok:false)
  ('return t.track && t.track("session:api:logout:start"), Ke(N.endpoints.logout, { method: "POST", headers: { Accept: "application/json" } }, e.timeout).then(() => (f.successfulRequests++, t.track && t.track("session:api:logout:complete"), { ok: !0 })).catch((r) => (f.failedRequests++, t.track && t.track("session:api:logout:error", { error: r.message }), { ok: !0, serverError: r.message }));',
   'return t.track && t.track("session:api:logout:start"), __encerrarSessao(e.timeout || 1e4).then((r) => r.ok ? (f.successfulRequests++, t.track && t.track("session:api:logout:complete"), { ok: !0 }) : (f.failedRequests++, t.track && t.track("session:api:logout:error", { error: r.motivo }), { ok: !1, error: r.motivo || "falha", status: r.status }));'),
  # 2) auth: só limpa o estado e anuncia LOGOUT_SUCCESS com a confirmação do servidor
  ('return ce.logout(e).then(() => (i.clear(), E.clearAll(), zt(), t && K(m.LOGOUT_SUCCESS, { sessionId: r }), { ok: !0 }));',
   'return ce.logout(e).then((n) => n && n.ok ? (i.clear(), E.clearAll(), zt(), t && K(m.LOGOUT_SUCCESS, { sessionId: r }), { ok: !0 }) : { ok: !1, error: n && n.error || "logout não confirmado" });'),
  # 3) Codex DSHOW-114: consulta indisponível = estado DESCONHECIDO — nenhum SESSION_CHECKED (a guarda do roteador e a identidade global
  #    leriam authenticated:false como saída), nada limpo, nenhum logout anunciado (= core/auth.ts)
  ('return K(m.SESSION_CHECKED, { authenticated: !1, error: t.error }), { ok: !1, error: t.error };',
   'return b.sessionChecksUnknown = (b.sessionChecksUnknown || 0) + 1, { ok: !1, estado: "desconhecido", error: t.error };'),
]
for a, b in trocas:
    assert s.count(a) == 1, 'trecho esperado não encontrado exatamente 1 vez: ' + a[:60]
    s = s.replace(a, b)
assert '__encerrarSessao' not in open(ent, encoding='utf-8').read()
s = 'import { encerrarSessao as __encerrarSessao } from "/core/auth/logout-client.js";\n' + s
open(sai, 'w', encoding='utf-8').write(s)
print('ok', hashlib.sha256(s.encode()).hexdigest()[:16])
