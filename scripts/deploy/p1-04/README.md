# P1-04 — candidatos (NÃO instalados, NÃO executados)
> **Etapa 5 (02/11/2026)**: versionados no branch local `p1-04a/lock-unico` do Dash com o LOCK ÚNICO de publicação (`../lock-publicacao.sh`). Continuam NÃO instalados e NÃO executados em produção.

Desenho completo: `/srv/dshow-modularizacao/fase1/20261101-212153-etapa1/BLOCO-C-P1-04.md`.

| Arquivo | Papel | Destino quando aprovado |
|---|---|---|
| `publicar-sha.sh` | publica UM SHA do `main`: espelho bare → `git archive` em `releases/.montando-*` → symlinks do estado compartilhado → build fora da pasta servida → `php -l`/smoke-dist → troca atômica (`ln -sfn` + `mv -T`) → reload php-fpm/nginx → smoke na origem (`--resolve …:127.0.0.1`) com rollback automático → purge Cloudflare só de entradas sem hash | `/usr/local/sbin/dshow-publicar-sha.sh` (root 0700) |
| `rollback.sh` | volta o symlink para a release anterior (do `historico.log`) ou uma indicada; nada reconstruído nem apagado | `/usr/local/sbin/dshow-rollback-dash.sh` |
| `runner-sha.sh` | substitui `/usr/local/bin/dshow-auto-deploy.sh`: lock em `/run`, publica o SHA do pedido mais recente, demais pedidos MOVIDOS para `superados/` | `/usr/local/bin/dshow-auto-deploy.sh` |
| `listar-releases.sh` | retenção sem apagar: lista e sugere o que mover para `/backup/_restrito/` | `/usr/local/sbin/` |
| `migracao-inicial.sh` | corte único diretório vivo → symlink (estado para `/srv/dshow-shared/dash`, árvore viva inteira para `/backup/_restrito/<ts>-f1-arvore-viva`) | executado uma vez, pelo Jhony |
| `webhook-patch.diff` + `webhook/webhook.php.proposto` | webhook confere `repository.full_name`, rejeita `after` inválido/zero e push de remoção, fila 0770, falha visível | commit no `main` do Dash pelo regime oficial (PORTÃO) |

Todos com `bash -n` OK; padrão `--dry-run`; `--aplicar` exige root e o PORTÃO 2.
Credencial do Cloudflare: `/etc/dshow-deploy/cloudflare.env` (0600 root) com as chaves `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ZONE_ID` — criado pelo Jhony; nunca impresso.
