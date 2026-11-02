# Bling — Endpoints

> Fase 4 · 2026-07-30

Duas coisas diferentes com nomes parecidos:

- **§1** — os endpoints que **este módulo expõe** para o painel.
- **§2** — os endpoints da **API v3 do Bling** que consumimos.

---

## 1. Endpoints do módulo (`/api/bling/*`)

Roteador `PATH_INFO` em `api/bling/index.php`. Envelope
**`{ok, data, error}`** — nunca `{success}`.

> ⚠️ 17 painéis deste projeto testam `j.success` e por isso nunca saem do
> placeholder. O contrato aqui é `ok`.

### 1.1 Gate de acesso

| Rota | Sessão | Nível 50 | CSRF |
|---|:--:|:--:|:--:|
| `POST /webhooks` | **não** | **não** | **não** |
| `GET /oauth/callback` | sim | **não** | não |
| todo o resto | sim | sim | POST sim |

**`/webhooks` fica antes de `SessionGate::start()`.** Quem chama é o Bling, que
não tem cookie. O que autentica é a assinatura HMAC do corpo.

**`/oauth/callback` fica antes do gate de nível.** Quem chega é uma navegação de
topo vinda do `bling.com.br`; se o gate respondesse `401` em JSON — o que
acontece se a sessão expirar durante o fluxo, que leva minutos — o dono veria um
objeto numa página branca. O que autoriza a rota é o `state` de uso único.

### 1.2 Leitura

| Método | Rota | Devolve |
|---|---|---|
| GET | `/` · `/status` | checklist **medido** de ativação |
| GET | `/settings` | configurações do módulo |
| GET | `/integrations` | estado da conexão e dos canais |
| GET | `/accounts` | contas e unidades de negócio |
| GET | `/header/summary` | resumo do cabeçalho |
| GET | `/overview/*` | KPIs, evolução, saúde, atenção, insights |
| GET | `/analytics/*` | fluxo empresarial, funil fiscal, curva ABC, rentabilidade |
| GET | `/resources/{recurso}` | grid paginado, filtrado e ordenado (39 recursos) |
| GET | `/export/{recurso}` | CSV ou XLSX |
| GET | `/history/*` | séries históricas |
| GET | `/sync` | estado da sincronização por recurso |

### 1.3 Escrita

| Método | Rota | O que faz |
|---|---|---|
| POST | `/sync/run` | enfileira sincronização |
| POST | `/oauth/connect` | devolve a URL de autorização |
| GET | `/oauth/callback` | conclui a conexão e **redireciona** |
| POST | `/oauth/disconnect` | revoga e apaga os tokens |
| POST | `/webhooks` | recebe entrega do Bling |

`/oauth/connect` **não** redireciona: a chamada vem de `fetch()`, e um `302`
seria seguido pelo próprio `fetch` em vez de navegar a janela. Devolve
`{authorize_url, acao: 'redirecionar_janela'}`.

`voltar_para` só aceita destino começando com `#/`. Um valor livre viraria
*redirect* aberto: o atacante mandaria o dono conectar e a volta cairia em outro
site.

`/oauth/disconnect` **mantém os dados sincronizados**. Apagá-los junto com o
token seria destrutivo e irreversível a partir de um clique em "desconectar".

### 1.4 §4 — o navegador nunca vê segredo

Nada em `/api/bling/*` devolve `access_token`, `refresh_token`, `client_secret`,
`BLING_CRYPTO_KEY` ou `BLING_WEBHOOK_SECRET` — nem em erro, nem em log, nem em
campo "debug". Verificado a cada execução por `valida-bling-fase4.mjs`, que
procura os **valores** reais do `.env` nas respostas.

### 1.5 Internals não são executáveis

`public/api` é *symlink* para a árvore de fonte: cada arquivo do módulo é
alcançável por HTTP. Todo `lib/`, `services/`, `repositories/` e `controllers/`
começa com:

```php
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }
```

Só `index.php` (e os scripts CLI) declaram a constante. Sem esse guarda, um
usuário autenticado executaria internals **fora do roteador** — que é onde moram
o gate de permissão, o CSRF e o envelope.

---

## 2. API v3 do Bling (o que consumimos)

Base: `https://api.bling.com.br/Api/v3`

### 2.1 OAuth 2.0

| Passo | Endpoint |
|---|---|
| autorizar | `GET /oauth/authorize` |
| trocar código | `POST /oauth/token` (`grant_type=authorization_code`) |
| renovar | `POST /oauth/token` (`grant_type=refresh_token`) |

> ⚠️ **A renovação nem sempre devolve `refresh_token` novo.** Ausente significa
> "continue usando o atual" — nunca "apague". Gravar `NULL` por cima zeraria a
> conexão e exigiria reconexão manual. O `salvarTokens()` usa `COALESCE`.
> Mesmo caso já enfrentado no módulo Google Calendar.

`POST /oauth/token` exige `application/x-www-form-urlencoded`, não JSON.

### 2.2 Recursos sincronizados

| Recurso | Endpoint | Tabela |
|---|---|---|
| categorias | `categorias/produtos` | `bling_categories` |
| depósitos | `depositos` | `bling_warehouses` |
| canais | `canais-venda` | `bling_sales_channels` |
| contatos | `contatos` | `bling_contacts` |
| fornecedores | `contatos/fornecedores` | `bling_suppliers` |
| produtos | `produtos` | `bling_products` |
| estoque | `estoques/saldos` | `bling_inventory` |
| pedidos | `pedidos/vendas` | `bling_sales_orders` |
| compras | `pedidos/compras` | `bling_purchase_orders` |
| notas | `nfe` | `bling_invoices` |
| receber | `contas/receber` | `bling_accounts_receivable` |
| pagar | `contas/pagar` | `bling_accounts_payable` |

### 2.3 Paginação

`pagina` + `limite` (100). Página com menos itens que o limite é a última — não
existe total confiável no envelope. `paginar()` para sozinho ali e aceita um
*callback* que interrompe antes (é como o incremental para ao alcançar o
watermark).

O envelope de resposta varia: `data`, `retorno`, `itens` ou `items`.
`extrairItens()` aceita os quatro — assumir um só quebraria em recurso que usa
outro, e o erro apareceria como "zero registros", não como falha.

### 2.4 Normalização

`BlingNormalizer` lê campos por caminho tolerante (`campo($p, 'a.b', 'c.d')`).

- **Preço pt-BR**: `"1.234,56"` vira `1234.56`. `Number()` puro daria `NaN` e
  gravaria `0` em silêncio.
- **Fuso**: o Bling responde em horário de Brasília. Tudo é convertido para
  **UTC** na entrada. `23:30` de 15/07 em São Paulo vira `02:30` de 16/07 UTC.
  (`CONVERT_TZ` por *nome* devolve `NULL` neste servidor — a conversão é feita
  em PHP.)
- **Campo obrigatório ausente** levanta erro; **opcional ausente** vira `null`.

### 2.5 Códigos de situação

`BlingVersionAdapter` traduz numérico (`9`) e por extenso (`atendido`).

> **Código desconhecido nunca lança exceção**: vira o padrão neutro e é
> registrado em `desconhecidos()` para virar tarefa. Uma situação nova
> introduzida pelo Bling não pode derrubar a sincronização inteira.

Situação de título é **derivada da data e do valor pago**, não do código:
vencido, liquidado e parcial são calculados. O código do Bling é apenas mais uma
entrada.

---

## 3. Erros

| Código | HTTP | Quando |
|---|---|---|
| `BLING_PROVIDER_INDISPONIVEL` | 503 | `BLING_PROVIDER=bling` sem banco, schema, cifra ou conta |
| `BLING_NAO_PRONTO` | 503 | tentar conectar sem banco ou sem cifra |
| `BLING_SEM_CREDENCIAL` | 503 | tentar conectar sem `client_id`/`client_secret` |
| `ROTA_NAO_ENCONTRADA` | 404 | |
| `METODO_NAO_PERMITIDO` | 405 | |
| `ERRO_INTERNO` | 500 | com `correlation_id` para achar no log |

Os três `503` trazem `falta: [...]` dizendo exatamente o que resolver.

> **Nunca há queda silenciosa para mock.** Se o provedor real está selecionado e
> não pode servir, a resposta é `503` com instrução. Cair em mock sem avisar
> seria o pior resultado possível: o dono olharia número inventado achando que é
> produção.
