# Elevação Basal — 20 · Plano M1: Contenção P0

> Executado em duas fases pelo script `scripts/basal/m1-contencao.sh`, seguindo a ordem
> obrigatória do briefing §1598: listar → verificar consumidores → bloquear → validar →
> smoke → observar → rollback preservado. **Nada é aplicado se um pré-check falhar.**

## Fase A — Pré-checks (read-only, sempre executam)

| # | Check | Critério para liberar a Fase B |
|---|---|---|
| A1 | Grep de consumidores de `.ts/.tsx` no runtime: busca literal `".ts"`/`".tsx"` em todos os `.js`, `.html` e manifests servidos sob `public/` (inclui bundles ignorados) | Zero referência de carga HTTP a `.ts/.tsx` (referências em sourceMappingURL ou comentários não contam) |
| A2 | Consumidores do vhost 8080: ingress do cloudflared (só linhas de serviço/porta), crontabs e configs de monitoração citando `:8080` | Zero consumidor |
| A3 | Controle de acesso do `/phpmyadmin/`: extrai `allow/deny/auth_basic/include` das locations no vhost | Informativo — decide tratamento (não bloqueia Fase B) |
| A4 | Firewall: `ufw status` (ou nft/iptables) — regras para 3306 | Informativo — alimenta questões 19–20 |
| A5 | Processos das portas 20241/37865 (`ss -tlnp` com nome do processo, como root) | Informativo |
| A6 | Busca completa por `*.patch` sob `public/` | Informativo (fecha questão 21) |

Saída da Fase A: `docs/ELEVACAO-BASAL/evidencias/m1-prechecks-<data>.md` (sem segredos).

## Fase B — Contenções (só com A1/A2 verdes)

### B1 — Bloqueio de `.ts/.tsx` no vhost de produção (BASAL-004)
Snippet incluído no topo do `server` 443 (antes das locations que servem estáticos):

```nginx
# Elevacao Basal M1 (doc 20): fontes nunca sao servidas. Rollback: remover include.
location ~* \.(ts|tsx)$ { deny all; return 404; }
```

Implementado como arquivo `snippets/basal-m1-deny-fontes.conf` + `include` no vhost —
1 linha adicionada ao vhost, remoção trivial. `nginx -t` antes do reload.

### B2 — Desativação do vhost órfão :8080 (BASAL-011 / LL-01)
`sites-enabled/dshowdash-v3` (symlink) movido para `/backup/elevacao-basal/<data>/`
(regra oficial: nada se apaga). O arquivo real em `sites-available` permanece intacto.

### B3 — Smoke pós-reload (falha = rollback imediato)
```text
GET /                              → 200
GET /components/app-shell/dist/app-shell.bundle.js → 200
GET /api/health                    → 200
GET /koala/src/api/client.ts       → 404 (era 200)
GET /components/_shared/icons.ts   → 404 (era 200)
porta 8080                         → connection refused/timeout (era 404 HTTP)
```

### Rollback completo
1. Restaurar cópia timestampada do vhost de `/backup/elevacao-basal/<data>/`;
2. Recriar symlink `sites-enabled/dshowdash-v3` a partir do backup;
3. `nginx -t && systemctl reload nginx`;
4. Repetir smoke com expectativa invertida.

## Fora da Fase B (exigem decisão do sponsor — não automatizados)

- **MySQL 3306**: mudança de `bind-address` só depois das questões 19–20 (quem consome remotamente?). Até lá, evidência de firewall (A4) documenta o risco real.
- **phpMyAdmin**: tratamento definido após A3 (allowlist × auth extra × despublicar + túnel). Registrado como BASAL-016.

## Resultado da 1ª execução (2026-08-10, rc=2) — Fase B corretamente bloqueada

Pré-check A1 REPROVOU o bloqueio `.ts/.tsx` (comportamento correto): encontrou
referências a `.ts` em `public/components/vite.components.config.js` (`keepExternal`,
build) e em `public/koala/index.html` (DEV). A2 verde (0 consumidores do :8080). A6
**encontrou o `.patch` do §3.7**: `public/components/footer/components/registry/index.js.patch`
(9 linhas, resíduo, ignorado pelo Git). phpMyAdmin sem `allow/deny/auth_basic` visível
(BASAL-016 mantém P0). Portas: 20241 = cloudflared, 37865 = VS Code Server (ambas locais,
benignas — LL-07/questão 18 fechadas). UFW não legível pelo usuário do coletor (questão 19
segue aberta).

## Fase M1b (doc: este arquivo; script `scripts/basal/m1b-contencao.sh`) — refino

Separa build de runtime e contém o que já é seguro:
- **P1** — imports de `.ts/.tsx` em artefatos SERVIDOS (exclui `*.config.*` e `/src/` dev). Se vazio → bloqueio `.ts/.tsx` é seguro.
- **P2** — os `*.bundle.js` de permissions realmente contêm os `.ts` do `keepExternal`? (a fonte `integration.ts` não os importa; confirmar no bundle servido).
- **P3** — `/koala/` serve `dist/` compilado (o `/src/main.tsx` é só DEV) → o bloqueio não quebra o Koala.
- **P4** — consumidores do `.patch` (esperado: nenhum).
- **B0** (sempre): `deny .patch` + **quarentena do arquivo para `/backup`**.
- **B1** (só com P1 verde): `deny .ts/.tsx`.
Smoke inclui `patch=404` e (quando aplicável) `ts=404`; rollback automático.

## M1 ENCERRADO em 2026-08-10 (EB-018)

| Item | Status final | Evidência |
|---|---|---|
| `.patch` exposto (BASAL-004b) | **FECHADO** — quarentena + `deny .patch` | m1d/m1e |
| Vhost órfão :8080 (BASAL-011) | **FECHADO** — desativado + firewall dropa 8080 | m1d + probe |
| phpMyAdmin público (BASAL-016) | **FECHADO** — `allow 127.0.0.1 + 187.15.86.187; deny all` | m1e |
| MySQL `0.0.0.0:3306` (BASAL-005) | **MITIGADO (P2)** — DROP externo comprovado; bind mantido de propósito | probe externo (EB-017) |
| Portas 20241/37865 (BASAL-017) | **FECHADO** — cloudflared + VS Code Server | m1 §A5 |
| Bloqueio `.ts/.tsx` (BASAL-004) | **ADIADO p/ M5/M6** (EB-010) — runtime importa `.ts` por ESM | m1b P1 |
| Origin :443 sem restrição a CF (BASAL-018) | **ABERTO P2** — endurecer no M12 | probe externo |

Firewall efetivo (não-UFW): allowlist de IPs ativo — 3306/8080/22 com DROP para IPs
não-autorizados, 443 aberto. home/bundle/health intactos em todas as ondas
(oráculo por content-type, EB-013).

### Critério de saída do M1 (§1601) — atendido
Exposições críticas contidas ✔ · secrets tratados (nenhum exposto; `.patch` era código, não segredo) ✔ ·
estado inicial preservado (hashes Onda 1 + `/backup`) ✔ · serviços/portas classificados ✔ ·
contenção sem quebra ✔ · rollback validado (Ondas 3–4 exerceram o rollback automático) ✔.

## Critério de saída do M1 (briefing §1601)

Exposições críticas contidas (B1) · estado inicial preservado (hashes Onda 1 + backups) ·
serviços e portas com classificação inicial (doc 11 + A5) · contenção sem quebra
(smoke B3) · rollback validado.
