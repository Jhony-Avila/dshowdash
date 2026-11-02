# Bling — Sincronização, filas e webhooks

> Fase 4 · 2026-07-30 · estado: **implementado e provado sem credencial**

Este documento descreve o que já está no ar. O que depende do dono está em
[05-plano-fases.md](05-plano-fases.md) e no checklist medido de
`Administração › Integrações`.

---

## 1. Como um dado do Bling chega na tela

```
Bling API v3
   │
   ├── webhook  ──► POST /api/bling/webhooks ──┐   (imediato, se habilitado)
   │                                            │
   └── polling  ──► worker --modo=incremental ──┤   (a cada 15 min)
                    worker --modo=reconciliacao ┤   (diário, rede de segurança)
                                                │
                                          bling_queue
                                                │
                                worker --modo=fila (a cada 5 min)
                                                │
                                       BlingSyncService
                                    normaliza → adapta versão → upsert
                                                │
                                          banco BLING
                                                │
                                          BlingReal
                                                │
                                    api/bling/* → painel
```

**As três origens são redundantes de propósito.** O webhook pode se perder, o
incremental pode ter janela cega. A reconciliação diária existe exatamente para
que nenhuma das duas falhas vire divergência permanente.

---

## 2. Estratégias

| Estratégia | Quando | O que faz |
|---|---|---|
| `carga_inicial` | uma vez, disparada pela tela | varre tudo; grava a página a cada lote e **retoma de onde parou** se cair |
| `incremental` | a cada 15 min (cron) | lê só o que mudou desde o watermark |
| `reconciliacao` | diária, 04h10 UTC | varredura completa; corrige o que o webhook e o incremental perderam |

A carga inicial **não** é disparada pelo cron. Enfileirar varredura completa
automaticamente pode consumir o limite diário da API inteiro antes que alguém
perceba.

### Ordem dos recursos

Cadastros antes de movimento — gravar um pedido antes do cliente existir
deixaria a FK nula e o pedido órfão de dono na tela:

```
categorias → depositos → canais → contatos → fornecedores → produtos
→ estoque → pedidos → compras → notas → receber → pagar
```

---

## 3. Fila

Tabela `bling_queue`, consumida com `FOR UPDATE SKIP LOCKED` — dois workers
simultâneos nunca pegam o mesmo item.

### Prioridade (menor = antes)

| Valor | Origem | Por quê |
|---|---|---|
| 10 | webhook | é o que o usuário acabou de mudar no Bling |
| 30 | incremental | rotina |
| 50 | carga inicial | pesada, pode esperar |
| 60 | reconciliação | rede de segurança, nunca atrasa o resto |

### Falha e DLQ

Falha reagenda com espera crescente. Ao esgotar as tentativas, o item vai para
`situacao = 'dlq'` — **sem isso ele giraria para sempre consumindo o limite
diário da API**. A DLQ é reprocessada de hora em hora; o que falha de novo
volta para ela.

---

## 4. Idempotência

Três camadas, cada uma resolvendo um problema diferente:

1. **`UNIQUE (account_id, bling_id)`** — a mesma entidade nunca vira duas linhas.
2. **`payload_hash`** — payload idêntico ao gravado não gera `UPDATE`. Evita
   escrita inútil e mantém `atualizado_em` significando "mudou de verdade".
3. **chave de idempotência do webhook** — evento + id + hash do corpo. A mesma
   entrega, reenviada, não vira dois processamentos.

> ⚠️ **`UNIQUE` com coluna `NULL` não deduplica.** O MySQL trata cada `NULL`
> como valor distinto. `bling_prices` tinha `UNIQUE (product_id,
> sales_channel_id)` e o preço padrão usa `sales_channel_id NULL`: o
> `ON DUPLICATE KEY` nunca casava e **cada sincronização inseria uma linha
> nova**, duplicando o produto na tela. Corrigido com a coluna `canal_key`
> (`NULL → 0`). Não pode ser coluna gerada — o InnoDB recusa (erro 1215) gerar
> a partir de coluna que participa de FK.

---

## 5. Webhook

`POST /api/bling/webhooks` — **o único endpoint do módulo sem sessão e sem
CSRF**, porque quem chama é um servidor externo que não tem cookie e não pode
ter. Fica roteado **antes** de `SessionGate::start()`: passar pela sessão
abriria uma sessão nova a cada entrega e encheria o disco de arquivos órfãos.

O que autentica é a **assinatura HMAC-SHA256** do corpo cru, comparada com
`hash_equals` (comparação comum vaza informação pelo tempo de execução).

> ⚠️ **Sem `BLING_WEBHOOK_SECRET` o endpoint fica DESLIGADO** e recusa tudo.
> A primeira versão aceitava quando o segredo não estava configurado, "até o
> dono configurar". Num endpoint exposto na internet aberta isso permitia que
> qualquer pessoa enfileirasse sincronização e consumisse o limite diário da
> API. A prova HTTP flagrou: `POST` anônimo respondia `200`.
>
> Não se perde dado com o webhook desligado — o incremental de 15 minutos e a
> reconciliação diária cobrem tudo que ele adiantaria.

> ⚠️ **Entrega recusada não ocupa a chave de idempotência da entrega legítima.**
> Se ocupasse, bastaria mandar o payload forjado antes do Bling para que a
> entrega verdadeira fosse descartada como duplicada — negação de serviço a
> custo zero. Recusas usam o espaço `rej:<hash>`.

### Respostas

| Situação | HTTP | Por quê |
|---|---|---|
| aceito | 200 | |
| duplicado | 200 | do ponto de vista do Bling deu certo; é o que impede reenvio em laço |
| sem assinatura válida | 400 | sem detalhe — detalhar ajudaria a calibrar uma forja |
| banco fora | 503 | diz "tente de novo"; `200` faria o Bling descartar um evento nunca processado |
| falha nossa | 500 | faz o Bling reenviar, que é o desejado |

---

## 6. Limite de requisições

`BlingClient` implementa *token bucket*: **3 por segundo, 120.000 por dia**.

- `429` e `5xx` são reprocessados com espera crescente e *jitter*; `Retry-After`
  é respeitado quando vem.
- `4xx` (exceto 429) **não** é reprocessado: o pedido está errado, repetir só
  gasta limite.
- O consumo é gravado em `bling_sync_state.limite_consumido_pct` e aparece na
  tela de Sincronização.

---

## 7. Cron

`/etc/cron.d/bling`, tudo rodando como `www-data`:

| Frequência | Modo | Papel |
|---|---|---|
| 5 min | `fila` | é quem efetivamente fala com a API |
| 15 min | `incremental` | só enfileira o que venceu |
| diário 04h10 UTC | `reconciliacao` | rede de segurança |
| horário | `dlq` | devolve falha transitória para a fila |
| diário 04h40 UTC | `limpeza` | expurgo por retenção |

> ⚠️ **Nenhuma linha descarta a saída.** Neste servidor, dois dos três crons de
> warm-cache davam 404/401 havia 14 dias (4.297 requisições inúteis) e ninguém
> viu — eram exatamente os que faziam `>/dev/null`. Tudo aqui vai para
> `/var/log/bling-worker.log`, com rotação em `/etc/logrotate.d/bling`.

### Trava

`/var/lib/bling/worker-<modo>.lock`, com `flock`. **Não fica em `/tmp`**: lá o
arquivo pode ter sido criado por outro usuário — foi o que aconteceu (criado por
`root`, `www-data` sem acesso).

E falha ao abrir a trava é reportada como **erro**, nunca como "já está
rodando". Confundir os dois faria o cron sair com `0` para sempre e a
sincronização parar sem nenhum sinal.

### Conta sem token utilizável

Conta ativa em `reauth_necessaria` ou `revogado` **não entra** na lista do cron:
tentar só encheria a DLQ com falhas que nenhuma repetição resolve. Mas aparece —
no log do worker e em `contas_com_pendencia` no `/status`. Pular em silêncio
seria sincronização parada que ninguém vê.

---

## 8. Retenção

| Tabela | Prazo | Coluna |
|---|---|---|
| `bling_raw_payloads` | `expira_em` da própria linha (7 dias) | `expira_em` |
| `bling_webhook_events` | 30 dias | `recebido_em` |
| `bling_sync_jobs` | 60 dias | `iniciado_em` |
| `bling_sync_errors` | 60 dias | `ocorrido_em` |
| `bling_audit_logs` | 365 dias | `ocorrido_em` |
| `bling_queue` (concluído) | 3 dias | `atualizado_em` |

> ⚠️ **A coluna de data tem nome diferente em cada tabela** — não há `criado_em`
> universal. Assumir um nome só apagaria zero linha, e o expurgo pareceria
> funcionando enquanto o disco enche.

O `DELETE` é feito em lotes de 5.000: um `DELETE` de milhões de linhas seguraria
a tabela, e o webhook — que chega a qualquer momento — esperaria pelo lock.

---

## 9. Como provar tudo isto sem credencial

```bash
bash scripts/bling-check-all.sh      # as 5 suítes, 218 verificações
```

| Suíte | Camada | Defeito real que já pegou |
|---|---|---|
| `bling-smoke-all.php` | dados e contratos | divergência de R$ 126.721 entre curva ABC e KPI |
| `bling-smoke-bundle.mjs` | bundle | entry sem `App` (23 kB em vez de 160 kB) — `vite build` não avisa |
| `bling-fase4-golive.php` | mecânica | `UNIQUE` com `NULL` duplicando produto a cada sync |
| `bling-fase4-rotas.sh` | rotas anônimas | webhook aceitando entrega sem assinatura |
| `valida-bling-fase4.mjs` | navegador | checklist hardcoded dizendo "banco não provisionado" com 38 tabelas no ar |

`bling-fase4-golive.php` executa o caminho **conectar → callback → gravar token →
renovar → paginar → normalizar → gravar → servir as telas** com transporte falso
contra o banco real, e apaga a conta de teste ao final — inclusive em caso de
erro. Se ele passa, o que falta no go-live é só colar as credenciais.

---

## 10. O que falta (depende do dono)

1. `BLING_CLIENT_ID` e `BLING_CLIENT_SECRET` — Bling › Preferências ›
   Integrações › API › Meus aplicativos.
2. `BLING_WEBHOOK_SECRET` e registro de `POST /api/bling/webhooks` no Bling.
   Opcional: sem ele o atraso máximo é o do incremental (15 min).
3. Conectar a conta em `Administração › Integrações`.
4. Trocar `BLING_PROVIDER=mock` para `bling`.

O checklist da tela de Integrações mede os quatro em tempo real.
