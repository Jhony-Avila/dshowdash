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

## Critério de saída do M1 (briefing §1601)

Exposições críticas contidas (B1) · estado inicial preservado (hashes Onda 1 + backups) ·
serviços e portas com classificação inicial (doc 11 + A5) · contenção sem quebra
(smoke B3) · rollback validado.
