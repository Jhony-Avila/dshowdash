# Go-live do módulo Google Calendar

> **Estado em 2026-07-30:** tudo pronto e provado. Falta **só colar as credenciais**.
> O caminho inteiro (consentimento → token → sincronização → telas) já roda de
> ponta a ponta contra o banco real com transporte de teste:
> `php scripts/gcal-fase4-golive.php` → **66 checks, 0 falha**.

---

## O comando que responde tudo

```bash
php scripts/gcal-golive.php
```

Mostra os 7 passos, quais faltam, **como resolver cada um** e o valor exato do
redirect URI. Sai com código `0` quando está pronto e `1` quando falta algo — dá
para encadear num deploy.

A **mesma** checklist aparece em três lugares, por construção:

| Onde | Para quem |
|---|---|
| `php scripts/gcal-golive.php` | quem está no terminal |
| Painel → **Contas Conectadas** | quem está no navegador |
| resposta `503` da API | quem chamou a rota antes da hora |

Fonte única: `api/google-calendar/lib/GcalGoLive.php`. Se ela divergisse por
superfície, a pessoa colando as credenciais receberia respostas diferentes
conforme onde olhasse.

---

## Os 5 passos, na ordem

### 1. Criar a credencial no Google Cloud

Console → **APIs e Serviços** → **Biblioteca** → habilitar **Google Calendar API**.
Depois **Credenciais** → *Criar credencial* → *ID do cliente OAuth* → **Aplicativo da Web**.

### 2. Cadastrar o redirect URI

Na mesma tela, em *URIs de redirecionamento autorizados*, colar **exatamente**:

```
https://dshowdash.com.br/api/google-calendar/accounts/callback
```

> Diferença de barra final ou de `http`/`https` produz `redirect_uri_mismatch`,
> que é o erro nº 1 de integração OAuth. O painel tem botão **Copiar** ao lado
> desse valor justamente para não se digitar à mão.

### 3. Colar no `.env`

```bash
GOOGLE_CALENDAR_OAUTH_CLIENT_ID=<...>.apps.googleusercontent.com
GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET=<...>
```

O resto já está no `.env` e **não precisa mudar**:

| Chave | Valor atual | Observação |
|---|---|---|
| `GCAL_CRYPTO_KEY` | já configurada | cifra os tokens; trocar invalida os já salvos |
| `GCAL_OAUTH_STAGE` | `read` | só leitura; ver "Ligar a escrita" abaixo |
| `GOOGLE_CALENDAR_REDIRECT_URI` | já configurada | opcional; o default já está certo |
| `DB_GCAL_DSHOW_*` | `gcal_app` | usuário de privilégio mínimo, sem DDL |

### 4. Virar a chave e recarregar

```bash
# no .env
GCAL_PROVIDER=google

sudo systemctl reload php8.3-fpm
php scripts/gcal-golive.php     # confere
```

### 5. Conectar a conta

Painel → **Contas Conectadas** → **Conectar conta**. O consentimento do Google
abre em página inteira (não popup — bloqueador mataria), e o retorno cai na
mesma tela com a confirmação. A descoberta de calendários roda automática logo
depois.

Se a agenda parecer vazia: **Sincronização** → *Sincronizar agora*.

### 6. Ligar as notificações em tempo real (opcional, recomendado)

O cron já está instalado (`/etc/cron.d/gcal-sync`) e mantém tudo em dia a cada
15 minutos sozinho. Para atualização quase instantânea, adicione ao `.env`:

```bash
GCAL_WEBHOOK_URL=https://dshowdash.com.br/api/google-calendar/webhook
```

e clique em **Sincronização → Religar canais**.

> Push é otimização, **não** garantia: o canal expira em ~1 semana, a entrega
> pode falhar e o Google desiste em silêncio. Por isso o fallback de 15 minutos
> continua rodando mesmo com push ligado — desenhar como se push fosse garantia
> é o que produz agenda silenciosamente desatualizada.

---

## Ligar a escrita (depois, quando a leitura estiver validada)

`GCAL_OAUTH_STAGE=write` acrescenta `calendar.events` aos escopos (§31.1).
Exige **reconectar** a conta — o Google não amplia escopo de token já emitido.
Começar em `read` é deliberado: valida-se a integração sem risco de alterar
agenda de ninguém.

---

## Se der errado

| Sintoma | Causa quase certa |
|---|---|
| `redirect_uri_mismatch` | passo 2 — comparar caractere a caractere |
| "O Google não devolveu refresh_token" | app já autorizado antes; revogar em myaccount.google.com/permissions e reconectar |
| `503` com lista de pendências | falta um passo; a própria resposta diz qual |
| Telas vazias após conectar | sincronização não rodou → *Sincronizar agora* |
| Erro 500 logo após editar algo em `api/` | **ACL**: `chown www-data:www-data && chmod 640 && setfacl -m u:agent_01:rwx -m u:agent_02:rwx -m u:agent_03:rwx` |
| Agenda para de atualizar sozinha | checklist item 8 (cron). Log: `storage/logs/gcal-worker.log` |
| `job(s) em estado 'dead'` no log do cron | erro permanente; retry não resolve. `SELECT * FROM gcal_sync_jobs WHERE status='dead'` |

Log do módulo: `grep '\[gcal\]' /var/log/nginx/error.log` (ou o error_log do PHP-FPM).

---

## O que fica pronto no dia do go-live

- **15 telas** servidas pelo banco (`GcalDb`), com as mesmas regras do mock —
  conflitos, disponibilidade, convites, alertas, KPIs e os 11 relatórios vêm de
  `GcalProviderBase`, código compartilhado entre mock e banco.
- **OAuth** Authorization Code + PKCE S256, `state` de uso único no banco,
  tokens em AES-256-GCM que nunca chegam ao navegador.
- **Sincronização** carga completa + incremental por `syncToken`, com o 410
  (`fullSyncRequired`) tratado sem apagar nada.
- **Isolamento por usuário** provado: outro `user_id` não vê conta, calendário
  nem evento.
- **Papel de acesso** conferido no servidor: calendário `reader` recusa escrita
  antes mesmo de chamar o Google.

- **Sincronização automática** já instalada: `/etc/cron.d/gcal-sync` roda o
  agendador a cada 5 min e o worker a cada 2 min. Enquanto `GCAL_PROVIDER=mock`
  os dois saem imediatamente com código 0. Fila com deduplicação, backoff
  exponencial, `dead` após 6 tentativas e destrave de worker morto.
- **Notificações push** (`watch` + webhook), prontas e provadas — basta definir
  `GCAL_WEBHOOK_URL` e clicar em *Religar canais*.

- **Exportação XLSX** nativa nos 11 relatórios, sem dependência nova — número e
  data chegam ao Excel como tipo nativo, então somam e ordenam.

## O que NÃO entra

- `resource-timeline` do FullCalendar — **licença comercial**. Hoje o mesmo
  papel é cumprido por uma visualização em D3.
