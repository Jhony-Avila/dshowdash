# Elevação Basal — 11 · Mapa da Superfície Pública (M2) + Inventário de Serviços

> Fonte: `evidencias/baseline-servidor-2026-08-10.md` §6–§8. Base para a contenção M1.

## 1. Vhosts Nginx

| Vhost | Listen | Root | Situação |
|---|---|---|---|
| `dshowdash.com.br` | 80/443 (+IPv6, http2) | `/var/www/dshowdash/public` | ATIVO — produção |
| `dshowdash-v3` | **8080 (0.0.0.0)** | `/var/www/dshowdash_v3/public` (**inexistente**) | ÓRFÃO — 404; BASAL-011 |

`nginx -t` OK. Proteções já existentes no vhost de produção: bloqueio de
`.bak/.old/.tmp/.swp/.orig/.map/.log` (l.39), bloqueio de `package*.json`/`tsconfig*.json`
(l.667), `deny` de dotfiles (l.684), rotas `/api/*` por alias explícito com catch-all
`^/api/(.+\.php)$`.

## 2. Exposição confirmada (HTTP 200 em fontes internas) — BASAL-004

```text
200  /components/_shared-react/components/DataGrid.tsx
200  /components/_shared-react/components/Painel.tsx
200  /components/_shared-react/index.ts
200  /components/_shared-react/lib/formato.ts
200  /components/_shared/icons.ts
200  /components/_shared/permissions/builders/index.ts
200  /koala/src/api/client.ts
```

Amostra de 7/7 com 200 ⇒ a regra geral serve `.ts/.tsx` livremente. O universo real é
maior (todo `.ts` físico sob `public/`). Nenhum `.patch` encontrado até profundidade 3
(questão aberta 21).

**Plano M1** (ordem §1598 do briefing): comprovar zero consumidores de `.ts/.tsx` via
HTTP → bloquear extensão no vhost → smoke → observar. Ver doc 20.

## 3. Achado novo: `/phpmyadmin/` publicado — BASAL-016 (P0 até prova de controle)

O vhost de produção serve `alias /usr/share/phpmyadmin/` (l.687-703). Não há evidência
coletada de allowlist de IP, auth_basic ou Cloudflare Access nessas locations.
Ação M1: coletar as linhas de controle de acesso; sem controle comprovado, restringir
(IP allowlist + rate limit) ou retirar da superfície pública (túnel/SSH port-forward).

## 4. Portas em escuta (ss -tlnp)

| Porta | Bind | Serviço | Classificação M1 |
|---|---|---|---|
| 80/443 | 0.0.0.0 + [::] | Nginx produção | OK — pública intencional (atrás de Cloudflare) |
| 8080 | 0.0.0.0 | Nginx vhost órfão | REMOVER (BASAL-011) |
| 3306 | **0.0.0.0** | MySQL 8.0.46 | P0 até validação de firewall (BASAL-005; questões 19–20) |
| 33060 | 127.0.0.1 | MySQL X protocol | OK — local |
| 6379 | 127.0.0.1 + [::1] | Redis | OK — local |
| 8100 | 127.0.0.1 | Decision Engine (Python) | OK — local |
| 22 | 0.0.0.0 + [::] | SSH (hardening key-only dez/2025) | OK — reconfirmar config no M12 |
| 53 | 127.0.0.53/54 | systemd-resolved | OK — local |
| 20241 | 127.0.0.1 | **desconhecido** | CLASSIFICAR (questão 18) |
| 37865 | 127.0.0.1 | **desconhecido** | CLASSIFICAR (questão 18) |

## 5. Serviços ativos

`nginx` · `php8.3-fpm` · `mysql` (8.0.46) · `redis-server` · `cloudflared` (tunnel) ·
`decision-engine` (Google Ads API Python). Toolchain: Node v20.20.2, npm 10.8.2,
PHP 8.3.6, nginx/1.24.0 (Ubuntu 24.04).

## 6. Regras derivadas

1. Nenhuma regra de bloqueio ampla sobre `public/` antes do build canônico (o runtime vive lá) — bloqueios M1 são **por extensão/diretório comprovadamente sem consumidor**.
2. O vhost órfão sai por desativação (symlink de `sites-enabled` movido a `/backup`), nunca por delete de config.
3. Toda mudança de Nginx: cópia timestampada em `/backup` → edição → `nginx -t` → reload → smoke → rollback documentado.
