# 04 — Endpoints da API interna

> Base: `/api/google-calendar` · roteado por nginx (`location ~ ^/api/google-calendar(/.*)?$`) para
> `api/google-calendar/index.php` com `PATH_INFO`. Implementado e no ar na Fase 2.

---

## Convenções

- **Envelope**: `{ok, data, error, meta}` — **não** `success`. `ok:false` pode vir com HTTP 200, então
  o cliente checa os dois (painéis que testaram `j.success` neste projeto montaram e nunca saíram do
  placeholder).
- **Sessão**: todas as rotas exigem sessão (`SessionGate` + `requireAuth`). Sem sessão → **401**.
- **CSRF**: `POST/PUT/PATCH/DELETE` passam por `AuthHelpers::requireCsrfForWrite()`. O token vem de
  `/api/auth/check.php` — **com** o sufixo `.php`, senão cai no fallback do SPA e dá 403.
- **Datas**: entram e saem em ISO-8601 **com offset**. Dia inteiro usa data pura (`2026-07-30`).
- **Janela**: `de`/`ate` são obrigatórios na prática (default = hoje) e o backend limita a **400 dias**.
- **IDs no path**: `calendarId` é um e-mail; o cliente faz `encodeURIComponent` e o router decodifica.

## Rotas

| Método | Rota | O que devolve |
|---|---|---|
| GET | `/status` | prontidão: provider, mock, contas, calendários, escopos, última sync |
| GET | `/header/summary` | resumo do ícone do header: estado, nº de hoje, próxima, pendentes, conflitos |
| GET | `/header/next` | 3 próximos compromissos para o popover |
| GET | `/overview` | KPIs de hoje + série de carga de 28 dias |
| GET | `/accounts` | contas Google conectadas (sem token) |
| POST | `/accounts/connect` | inicia OAuth · **501 no mock**, 503 sem credencial |
| GET | `/accounts/callback` | callback do OAuth (browser; sem CSRF, valida `state`) |
| GET | `/calendars` | calendários acessíveis, com `access_role` |
| GET | `/calendars/resources` | só recursos (salas, showroom, veículos) |
| GET | `/events` | eventos da janela |
| POST | `/events` | cria evento |
| GET | `/events/{calendarId}/{eventId}` | evento com participantes, recorrência, vínculos |
| PATCH | `/events/{calendarId}/{eventId}` | edita/move (`?escopo=this\|following\|all`) |
| DELETE | `/events/{calendarId}/{eventId}` | exclui (`?notificar=0\|1`, `?escopo=`) |
| GET | `/freebusy` | matriz de disponibilidade + melhores horários |
| GET | `/invitations` | convites por categoria + contagem de todas as categorias |
| POST | `/invitations/{calendarId}/{eventId}/respond` | aceita/recusa/talvez + comentário |
| GET | `/conflicts` | conflitos da janela, agrupados por tipo |
| GET | `/alerts` | alertas de agenda, organização e técnicos |
| GET | `/sync` | estado da sincronização por calendário |
| POST | `/sync/run` | dispara sync · **202 `simulado:true` no mock** |

## Parâmetros de janela (GET)

| Param | Default | Observação |
|---|---|---|
| `de`, `ate` | hoje | `yyyy-mm-dd`; invertidos são corrigidos; teto de 400 dias |
| `tz` | `America/Sao_Paulo` | fuso inválido cai no padrão, nunca no default do PHP |
| `calendars` | todos | lista separada por vírgula |
| `q` | — | busca em título, descrição, local e e-mail de participante |
| `tipo` | — | `default\|focusTime\|outOfOffice\|workingLocation` |
| `resposta` | — | `accepted\|declined\|tentative\|needsAction` |
| `incluir_cancelados` | `0` | cancelado sai da grade por padrão, mas não do banco |
| `pessoas`, `duracao` | — | só em `/freebusy` (máx. 20 pessoas) |
| `categoria`, `severidade` | — | `/invitations`, `/alerts`, `/conflicts` |

## Códigos de erro

| HTTP | `error` | Quando |
|---|---|---|
| 401 | `AUTH_REQUIRED` | sem sessão |
| 403 | `INVALID_CSRF_TOKEN` | escrita sem token |
| 403 | `NOT_AUTHORIZED` | calendário `reader`/`freeBusyReader` numa escrita |
| 404 | `NOT_FOUND` | evento inexistente ou rota desconhecida |
| 405 | `METHOD_NOT_ALLOWED` | método errado (header `Allow` vem preenchido) |
| 422 | `VALIDATION_ERROR` | `meta.campos` traz o erro por campo |
| 501 | `INVALID_ACTION` | ação que só existe no provedor real |
| 503 | `DATABASE_ERROR` | provedor real sem provisionamento; `meta.pendencias` lista o que falta |

## Validações do servidor (§17.3)

Fim ≤ início · duração > 24 h sem `all_day` · fuso desconhecido · participante sem e-mail válido ·
calendário inexistente · calendário sem permissão de escrita · resposta de convite fora de
`accepted|declined|tentative`.

O front valida os mesmos casos antes de enviar — não para substituir o servidor, mas para não gastar
uma ida-e-volta em erro óbvio.

## Exemplos

```bash
# Janela de uma semana, dois calendários
GET /api/google-calendar/events?de=2026-07-29&ate=2026-08-04&tz=America/Sao_Paulo\
&calendars=primary,comercial%40dshow.com.br

# Melhores horários de 1 h para duas pessoas
GET /api/google-calendar/freebusy?de=2026-07-30&ate=2026-08-01&duracao=60\
&pessoas=jhony%40dshow.com.br,marina.costa%40dshow.com.br

# Responder convite
POST /api/google-calendar/invitations/primary/evt_1006/respond
{ "resposta": "accepted", "comentario": "Confirmado" }

# Cancelar a série inteira SEM avisar ninguém (default)
DELETE /api/google-calendar/events/primary/evt_1001?escopo=all&notificar=0
```

> O default de `notificar` é **0**. Avisar 20 pessoas por engano não tem desfazer, então a UI
> pergunta explicitamente antes (§59).
