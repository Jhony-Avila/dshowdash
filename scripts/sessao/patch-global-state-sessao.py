#!/usr/bin/env python3
# Codex DSHOW-114 (P7) · patch CIRÚRGICO do global-state.bundle.js: só "não autenticado CONFIRMADO" limpa a identidade global.
# Por que patch e não build: modules/global-state/index.ts só reexporta o próprio bundle (como o session-manager); "buildar" só reminifica o
# bundle velho e a fonte core/auth-integration.ts NÃO entra nele. A fonte recebeu a mesma regra (referência). Entrada: SÓ o bundle servido
# (hash conferido). Saída determinística. Uso: patch-global-state-sessao.py <entrada> <saída>
import sys, hashlib
ENTRADA_SHA = 'a6ac88931ef820f8'   # global-state.bundle.js servido (P6 e383000b = 13cace49)
ent, sai = sys.argv[1], sys.argv[2]
s = open(ent, encoding='utf-8').read()
assert hashlib.sha256(s.encode()).hexdigest().startswith(ENTRADA_SHA), 'entrada não é o bundle servido conhecido'
trocas = [
  # SESSION_CHECKED sem authenticated, com erro ou com estado desconhecido (consulta indisponível) NÃO limpa, NÃO emite SESSION_CLEARED
  (': f != null && f.authenticated || (e.clearSession(), F(e, k.SESSION_CLEARED, { source: "session-checked-unauthenticated" })));',
   ': f != null && f.authenticated === !1 && !f.error && f.estado !== "desconhecido" && (e.clearSession(), F(e, k.SESSION_CLEARED, { source: "session-checked-unauthenticated" })));'),
]
for a, b in trocas:
    assert s.count(a) == 1, 'trecho esperado não encontrado exatamente 1 vez: ' + a[:60]
    s = s.replace(a, b)
open(sai, 'w', encoding='utf-8').write(s)
print('ok', hashlib.sha256(s.encode()).hexdigest()[:16])
