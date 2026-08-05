# Runbook de OPERAÇÃO — Avatar Studio (lote 159 · §651/§312)

Consolidação operacional. Complementa RUNBOOK-BANCO.md (migrações, root).

## Deploy (sempre pelo script — nunca à mão)
```bash
cd /var/www/dshowdash && bash scripts/deploy/deploy-as5.sh
```
Backup duplo automático (código tar + banco mysqldump) → /backup · gate de
peso versionado · smoke do dist (lote 151) · php -l · diagnóstico do banco
(nunca aplica). O script roda de CÓPIA efêmera (imune ao próprio merge).

## Auto-deploy (webhook · decisão #47)
Fluxo normal desde 2026-08-05: **push no `main` → deploy sozinho em ≤1 min**
(fim do patch/scp manual). Duas peças, ambas versionadas:
- **Endpoint** `api/deploy/webhook.php` (público): valida HMAC sha256 do corpo
  (`X-Hub-Signature-256`, `hash_equals`) contra `config/webhook-secret.txt`
  (fora do git, 600); `ping`→`pong`; só age em push de `refs/heads/main`.
  NUNCA executa shell — apenas grava `storage/deploy-fila/pedido-<sha>`.
  Sem assinatura válida → 403. Config secret ausente → 503.
- **Runner** `scripts/deploy/auto-deploy-runner.sh` (root, via
  `/etc/cron.d/dshow-auto-deploy`, 1/min): `flock` (1 por vez), consome a
  fila e roda `deploy-as5.sh` (backup duplo/gate/smoke/rollback). Log em
  `/backup/deploy-logs/auto-deploy.log`. Instalação e cron no cabeçalho do
  próprio script.
- **Interruptor:** `touch config/auto-deploy.off` desliga (webhook responde
  202 `desligado`, runner sai limpo) · `rm config/auto-deploy.off` religa.
- **Diagnóstico:** fila presa? `ls storage/deploy-fila/` · último deploy?
  `tail /backup/deploy-logs/auto-deploy.log` · webhook chegou? log do PHP/nginx.

## Rollback
1. **Total (código+dist):** impresso no resumo de CADA deploy —
   `git reset --hard <commit> && tar -xzf /backup/pre-as5-<carimbo>-dist.tar.gz -C /var/www/dshowdash`
2. **Banco:** `gunzip < /backup/db-pre-as5-<carimbo>.sql.gz | mysql ...`
   (runbook do banco; sempre o dump do MESMO carimbo do código).
3. **Por feature (§651):** desligar a flag em nucleo/flags.ts (1 linha +
   deploy) ou por usuário via `dshow.avst.flags.v1` no console.

## Sinais de saúde
- Console do navegador: `[avst:erro]`/`[avst:aviso]` (Log §291).
- Viewer dev (flag as5.telemetria_painel): eventos §290 + saúde do storage.
- HUD 3D (flag as5.hud3d): fps · tier · sombras.
- Espelho §619: drawer Versões mostra consistência §629 e cai com aviso
  honesto se a API sumir (leitura segue no legado).

## Incidentes comuns
- **Palco 3D indisponível** → watchdog/retry agem sozinhos; usuário tem
  "Tentar de novo"; persiste = conferir /assets/avatars/3d/personagens.
- **Gate de peso estourou** → crescimento intencional? Atualizar
  pesos-esperados.json NO COMMIT da feature (com justificativa).
- **Smoke do dist falhou** → build parcial/disco; NÃO seguir; re-rodar
  deploy (idempotente) após espaço/permissões.
- **Storage cheio (aviso ao usuário)** → projetos/cenas antigos; nada
  quebra (writes degradam com try/catch).

## Segredos (regra de ferro)
Chaves/senhas NUNCA por chat/git/log. Chave IA: Anexo B do RUNBOOK-BANCO
(`read -s`). Banco: config/db_connection.php (fora do git).
