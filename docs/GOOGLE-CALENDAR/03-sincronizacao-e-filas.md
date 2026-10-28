# 03 — Sincronização e filas

> Fases 4 e 5. Nada disto roda na Fase 2 (mock puro).
> Molde: `docs/PIPEDRIVE/03-sincronizacao-e-filas.md` — único pipeline de sync já exercitado neste projeto.

---

## 1. Carga inicial (§49.1)

Janela configurável, **nunca "tudo"**. Default proposto: **90 dias para trás, 365 para frente**, por
calendário selecionado. O §77 proíbe carregar todo o histórico de todos os calendários, e a janela fica
gravada em `gcal_sync_state.window_from/to` para que a reconciliação saiba o que é "fora da janela" em
vez de confundir com "apagado".

Ordem: `calendarList` → `calendars` → `events` (paginado) → `attendees/reminders/recurrence/conference`.

`singleEvents=false` na carga: guardamos a **série** e a `RRULE`, não 500 instâncias expandidas. As
instâncias que interessam (as que o usuário move ou cancela individualmente) chegam como exceções com
`recurringEventId` + `originalStartTime`.

## 2. Incremental por syncToken (§49.2)

Cada resposta de `events.list` traz `nextSyncToken`. Guardamos **cifrado** em
`gcal_sync_state.sync_token_enc` e a chamada seguinte manda só `syncToken=…`, recebendo apenas o que mudou.

```
events.list(calendarId, syncToken)  →  itens alterados + novo nextSyncToken
    ├── status=cancelled  →  marca deleted=1 (NÃO apaga a linha)
    └── demais            →  upsert por (account_id, calendar_id, event_id)
```

`payload_hash` (sha1 do payload normalizado) evita `UPDATE` quando nada mudou de fato — o Google
reenvia itens por mudança de `etag` que não altera nada visível.

### 2.1. Token inválido (HTTP 410) — §49.3

É o caminho que mais dá errado em implementação apressada. A sequência correta:

1. registrar a ocorrência em `gcal_sync_errors` com o `correlation_id`;
2. marcar `gcal_sync_state.status = 'full_resync_required'`;
3. enfileirar job `full` para aquele calendário;
4. **NÃO apagar nada antes da reconciliação.**

A reconciliação compara o resultado da carga completa com o que está no banco e só então marca como
`deleted` o que não voltou **dentro da janela**. Apagar primeiro e recarregar depois deixa a agenda vazia
durante a janela de recarga — e se a recarga falhar no meio, ela fica vazia de vez.

## 3. Notificações push (§50)

```
1. watch(calendarId, {id, type:'web_hook', address, token})
2. guarda channel_id + resource_id + expiration em gcal_watch_channels
3. Google faz POST no webhook a cada mudança
4. valida X-Goog-Channel-ID e X-Goog-Resource-ID contra a tabela
5. enfileira job incremental — NÃO processa na requisição
6. responde 200 rápido
7. renova antes de expirar (canal dura no máximo ~1 semana)
```

**A notificação é um SINAL, não um dado.** Ela não diz o que mudou; a aplicação busca o delta pela API.
Confiar no corpo da notificação é o erro clássico aqui.

Duas consequências de projeto:

- o webhook precisa responder **rápido e sempre 200**: se demorar ou falhar, o Google faz backoff e
  depois **para de enviar** — a agenda passa a atrasar sem nada quebrar visivelmente;
- o webhook **não tem sessão nem CSRF** (a chamada é do Google). A autenticação é a tripla
  `channel_id` + `resource_id` + `token` conferida contra `gcal_watch_channels`. No nginx ele precisa
  de um `location` próprio, fora do gate de sessão — mesmo padrão do callback OAuth no `index.php` atual.

### 3.1. Renovação

Job `watch_renew` roda a cada hora e renova todo canal que expira em menos de 24 h. Renovar é criar um
canal novo e parar o antigo (`channels.stop`) — nessa ordem, senão há janela sem cobertura.

## 4. Filas e agendamento

Reusamos a infra que já existe em `/opt/dshow_secure/jobs/` (`job_supervisor.php`,
`retry_failed_jobs.php`, `auto_recovery.php`, todos em cron `*/15`–`*/30`).

| Job | Frequência | O que faz |
|---|---|---|
| `incremental` | disparado por webhook; fallback a cada 15 min | delta por syncToken |
| `full` | sob demanda (410, primeira conexão, pedido do admin) | carga da janela |
| `watch_renew` | horária | renova canais perto de expirar |
| `reconcile` | diária, madrugada | compara banco × API; corrige divergência |

Backoff exponencial com teto: 1 min, 2, 4, 8, 16, 32 → `dead` após 6 tentativas, com alerta técnico.

⚠️ **Cron HTTP nunca deve descartar a saída.** Neste servidor, dois crons de warm-cache deram 404/401
por 14 dias sem ninguém notar — eram exatamente os que faziam `>/dev/null`. Todo cron deste módulo loga.

## 5. Rate limit e cota

A Calendar API tem cota por projeto e por usuário. Regras:

- `gcal_api_requests` (ou o log de runs) registra cada chamada com duração e status;
- 403 `rateLimitExceeded` e 429 → backoff exponencial **com jitter** (sem jitter, todos os calendários
  do mesmo usuário voltam juntos e levam 429 de novo);
- nunca disparar sync de todos os calendários em paralelo: fila serial por conta.

## 6. Observabilidade (§78)

Todo log carrega `correlation_id` (ULID) que atravessa webhook → job → chamada → resultado, e é o mesmo
ID mostrado na tela de erro da UI. Campos: conta, calendário, operação, duração, status, tentativa,
`sync_token` **mascarado**, data/hora.

**Nunca vão para o log**: descrição de evento, lista de e-mails de participantes, link de reunião, PIN,
tokens, anexos.

## 7. Ordem de implementação

| Passo | Entrega | Depende de |
|---|---|---|
| 1 | `GCAL_DSHOW` provisionado + usuário `gcal_app` | decisão do dono; **saída do MySQL root** |
| 2 | OAuth real: `connect` → callback → tokens cifrados | projeto no Google Cloud |
| 3 | `full` de um calendário, sem fila | passo 2 |
| 4 | `incremental` + syncToken + tratamento do 410 | passo 3 |
| 5 | Fila + supervisor + backoff | passo 4 |
| 6 | Webhook + watch + renovação | passo 5 |
| 7 | `reconcile` diário | passo 6 |

Cada passo é verificável isoladamente: o painel já mostra `gcal_sync_state` na tela de Sincronização, então
o progresso aparece na UI sem precisar de tela nova.
