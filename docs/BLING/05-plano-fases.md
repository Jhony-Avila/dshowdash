# 05 — Plano de fases e o que foi entregue

> Atualizado em **2026-07-30**. Fases 2, 3, 4 e **5** concluídas e provadas —
> as Fases 4 e 5 sem depender da credencial do Bling.

---

## Estado por fase

| Fase | Entrega | Estado |
|---|---|---|
| 0 | Investigação do terreno | ✅ 2026-07-29, revisada e retificada em 2026-07-30 |
| 1 | Decisões do dono + arquitetura | ✅ [01-arquitetura.md](01-arquitetura.md) |
| 2 | Base visual, 52 telas, mocks coerentes, API interna | ✅ 2026-07-30 |
| 3 | D3 + ECharts em profundidade, cross-filter, drill-down | ✅ **entregue em 2026-07-30** |
| 4 | Banco `BLING`, OAuth, jobs, filas, webhooks, cache, logs | ✅ **entregue em 2026-07-30** |
| 5 | Integração real e homologação | ✅ **homologado em 2026-07-30** — [06-homologacao.md](06-homologacao.md) |
| 6 | Operações de escrita | 🔜 após homologação |

---

## O que a Fase 2 entregou

### Backend — `api/bling/`

12 arquivos PHP. Roteador PATH_INFO no molde do Google Calendar, atrás de
`location ~ ^/api/bling(/.*)?$` no nginx (bloco aditivo, inserido antes do
genérico de diretório).

- **27 rotas analíticas** + **39 recursos de grid** = 66 endpoints, todos com
  envelope `{ok, data, error}`.
- `BlingProviderBase`: cálculo único herdado por mock e real. Trocar
  `BLING_PROVIDER` não pode mudar um número — e o smoke prova isso.
- `BlingMock`: grafo determinístico e coerente. Canais → pedidos → itens → notas
  → expedições → títulos; fornecedores → compras → recebimentos → contas a pagar.
  1.538 pedidos, 221 produtos, 190 clientes, 1.405 notas, 1.966 títulos.
- `BlingSituacoes`: vocabulário único de situações com cor semântica. Situação
  desconhecida vira rótulo neutro visível — não quebra tela nem some.
- Gate de acesso por nível (`requireAuth(50)`), decisão 8.3.

### Front-end — `panel-bling/` + `_shared-react/`

- **52 telas** do §10, distribuídas exatamente como o briefing pede
  (4+5+7+4+5+6+5+4+6+6).
- **17 telas customizadas** (Visão Geral, Central Operacional, Diretoria,
  Indicadores, Preços, Estoque, Depósitos, Notas Fiscais, Fluxo de Caixa,
  Rentabilidade, Curva ABC, Previsões, Anomalias, Relatórios, Integrações,
  Sincronização, Configurações).
- **35 telas de catálogo**, renderizadas por um único componente a partir de
  declaração. Uma correção lá vale para as 35.
- **`_shared-react/`** extraído (decisão 8.4): DataGrid, KpiCard, FilterBar,
  Badge, Drawer, Tabs, LinhaDoTempo, estados de tela, formatação pt-BR.
  Nenhum painel em produção foi tocado.
- **D3**: Sankey empresarial, Sankey financeiro, matriz giro × margem com corte
  por mediana, mapa de relacionamento por força. Todos com tooltip, seleção,
  reset e estado vazio (§52.1).
- **ECharts**: séries temporais com eixo duplo e zoom, funil, Pareto, barras,
  rosca, dispersão, waterfall.
- Sub-sidebar 240/72 px com persistência; abaixo de 860 px de espaço útil vira
  seletor — a sidebar do app-shell ocupa 312 px fixos e não cede.

### Provas

| Script | O que prova |
|---|---|
| `scripts/bling-smoke-all.php` | 49 verificações: integridade do grafo, ausência de órfãos, **coerência entre telas**, determinismo, invariantes de negócio, cenários do §60 |
| `scripts/bling-smoke-bundle.mjs` | 24 verificações no bundle: App presente, chunks separados, envelope, CSS de tema |
| `tools/screenshot/valida-bling-fase2.mjs` | 33 verificações no navegador real, com **controle** (Google Calendar, não tocado) |
| `tools/screenshot/valida-bling-fase3.mjs` | 26 verificações da Fase 3: visualizações novas, brush, drill-down com recorte, cross-filter atravessando telas, exportação |

Os quatro passam.

---

## Bugs que as provas pegaram (e que o build não pegou)

Registrados porque o padrão se repete no projeto: **ferramenta verde não é prova
de funcionamento**.

### 1. Bundle sem o App — `vite build` passou sem um aviso

Faltava `preserveEntrySignatures: 'strict'` no `rollupOptions`. O entry é
consumido como biblioteca pelo adaptador vanilla; sem essa linha o Rollup
concluiu que ninguém usa os exports e removeu o App inteiro. O bundle saiu com
23 kB (o correto é 160 kB) e o painel montaria em branco.

→ Travado por `scripts/bling-smoke-bundle.mjs`, que reprova bundle abaixo de
90 kB e exige marcadores do código real dentro do arquivo.

### 2. Curva ABC divergia do KPI de faturamento

A curva somava os **itens** (subtotal) enquanto o KPI somava o **total** do
pedido (subtotal − desconto + frete). Diferença de R$ 126.721 no período.

O primeiro teste só exercitava a dimensão "canais", que agrega por pedido — o bug
morava no caminho de agregação por item. Ao acrescentar as outras quatro
dimensões, apareceu.

→ Corrigido com rateio proporcional. As 5 dimensões agora fecham no mesmo número,
e o teste cobre todas.

### 3. Duas telas em branco — React error #310

`useMemo` chamado **depois** de `return` condicional em Fluxo de Caixa,
Rentabilidade e Notas Fiscais. O `tsc --noEmit` passou, o build passou, e as
telas montavam vazias no navegador.

→ Hooks movidos para antes dos returns nas três, com a nota explicando o porquê.

### 4. O app-shell REMONTA o painel a cada troca de hash (Fase 3)

Medido em 2026-07-30: abrir o painel = 1 montagem; um drill-down = 2; navegar
pela sub-sidebar = 3. **Cada navegação interna descarta o React inteiro.**

Consequência: `useState` não atravessa navegação. O drill-down aplicava o filtro,
navegava, e a tela de destino montava com o estado inicial — abrindo a lista
completa como se nada tivesse sido pedido. A falha era silenciosa: a tela certa
abria, só sem o recorte. E o cross-filter global seria exatamente o que não
funciona, porque só vale ao trocar de tela.

→ Filtros e seleção passaram a viver em `sessionStorage`, reidratados na
montagem. `sessionStorage` e não `localStorage`: é estado de sessão de análise,
morre com a aba.

**Corrigir na raiz** (fazer o shell não remontar) resolveria para todos os
painéis, mas mexe no container-main e é decisão do dono — está em §"Achados".

### 5. Drill-down passava o destino em vez do id do indicador (Fase 3)

`CartaoKpi` chamava `aoAbrir(kpi.drilldown)`, mas quem consome resolvia o destino
por um mapa indexado pelo **id**. O mapa nunca casava e o KPI abria a tela certa
**sem o recorte** — e o primeiro teste passou porque só verificava se havia
algum número na tela.

→ `aoAbrir(kpi.id, kpi.drilldown)`. O teste agora compara o total **com** e
**sem** filtro: 5 contra 85.

### 6. Entrega antes do despacho no gerador de mock (Fase 3)

24 envios com data de entrega anterior à de despacho. Aparecia quando a
transportadora tinha prazo curto (retirada no balcão, prazo 0) e o atraso
sorteado era negativo. Uma data impossível dessas envenena todo o cálculo de
prazo realizado do §39.

→ Piso no despacho, e o smoke passou a verificar a invariante.

---

## Achados fora do escopo, reportados ao dono

### 🔴 Os 10 ícones de painel do header não navegam

Medido em 2026-07-30 com clique real: **nenhum** dos dez botões
(`pipedrive, bling, mercado-livre, loja-integrada, google-drive, calendar,
adwords, asaas, chatgpt, maps`) leva ao painel correspondente. O do Pipedrive
está assim com o painel em produção.

**Causa:** o componente do header é servido **embutido no `header.bundle.js`**
(de 2026-04-30), não pelo `index.js` do diretório — bloquear esse arquivo no
navegador não faz o botão sumir e ele nunca é requisitado. O
`navigation-adapter` emite `NAV_INTENTS.NAVIGATE` no EventBus e devolve `true`
mesmo sem ouvinte, então a falha não aparece em lugar nenhum.

No caso do Bling, o clique carrega o **widget legado** (`panel-integration-bling`)
em vez do módulo, porque o bundle carrega a rota antiga `#/integrations/bling`.

**Correção já aplicada no fonte** (`header/components/panel-bling/index.{ts,js}`):
rota repontada para `#/panel-bling` e fallback de navegação. **Só passa a valer
com o rebuild do `header.bundle.js`** — que afeta o header inteiro e é decisão do
dono, porque o projeto já teve incidente com esse rebuild.

O módulo continua acessível pela **sidebar** (funciona, provado), pela rota direta
e pela busca.

### 🟠 Envelope errado no widget legado — corrigido

`panel-integration-bling` testava `j.success` contra uma API que devolve `{ok}`.
Display preso em `--` desde sempre, com HTTP 200 e `errorCount` zerado — a falha
se apresentava como sucesso. Corrigido no `.ts` **e** no `.js` (o `.js` é o
arquivo servido). A captura de tela pós-correção mostra o widget exibindo `✓`.

### ℹ️ §7.4 da Fase 0 era falso positivo

O `container: any` apontado no relatório é a anotação de tipo do parâmetro de
`mount`, não um argumento. O construtor sempre recebeu `{ container, config }`.
Retificado no [00-fase0-investigacao.md](00-fase0-investigacao.md#74).

---

## Fase 3 — o que foi entregue

### Cross-filter global (§54)

A seleção deixou de morrer dentro da tela. Clicar num canal, categoria,
fornecedor, vendedor ou depósito cria um **recorte que atravessa todas as telas**,
com barra fixa mostrando o que está ativo e o botão "Limpar seleção" do §54.

Quando o campo é filtrado pelo servidor, o recorte vem pronto da API. Quando não
é, a tela **diz** que o recorte vale só para a página carregada — em vez de
mostrar um total que não corresponde à lista.

### Drill-down com recorte (§55)

Cada KPI e cada ocorrência de "Exige atenção" leva a tela **e o filtro que a
explica**. Clicar em "Notas com erro: 5" abre Notas Fiscais com 5 registros, não
com 85. Os destinos estão declarados em `app/selecao.tsx` (`DESTINO_KPI` e
`DESTINO_ATENCAO`), não espalhados pelas telas.

### Gráfico de evolução (§17)

Brush para recortar o período arrastando sobre o gráfico, alternância entre
valor diário e acumulado, marcação de eventos e exportação da imagem.
O intervalo selecionado no brush vira o período de **toda a tela**.

### Visualizações que faltavam

| § | Onde | O que |
|---|---|---|
| 26.1 | Preços | Preço, custo e volume vendido do produto, com a origem de cada série declarada |
| 24.2 | Estoque | Cobertura por faixa, aging por tempo sem movimentação, projeção de ruptura e dispersão estoque × venda |
| 39 | Transportadoras | Prazo prometido × realizado, distribuição do prazo e custo por região |
| 40 | Rentabilidade | Matriz margem × volume com quadrantes e corte por mediana |

### Exportação (§43)

CSV e XLSX montados no **servidor**; PDF pela impressão do navegador.

O XLSX é um arquivo OOXML de verdade — número como número, data como serial —
gerado por `api/_helpers/XlsxWriter.php`, **extraído** do gerador que o Google
Calendar criou no mesmo dia. Zero dependência nova: `.xlsx` é um ZIP de XMLs e o
PHP já traz `ZipArchive`. O Google Calendar mantém a cópia dele e não foi tocado.

Todo arquivo leva no topo o título, o período, os filtros ativos, a contagem e o
aviso de dados simulados. Toda exportação é registrada na trilha de auditoria.

### O que continua fora

- Cross-filter por campo que o servidor não filtra recorta só a página (a tela avisa)
- Agendamento e compartilhamento de relatórios (§43) — fase futura, declarados como previstos na interface
- Histórico real de alteração de preço — só existe a partir da Fase 5

---

## Fase 4 — o que foi entregue

**Tudo provado sem a credencial.** Mesma estratégia do Google Calendar: o
transporte HTTP é injetável, então o caminho conectar → callback → gravar token
→ renovar → paginar → normalizar → gravar → servir as telas roda inteiro com
transporte falso **contra o banco `BLING` de verdade**.

### Banco

- 38 tabelas, 65 FKs, aplicadas e no ar.
- Usuário `bling_app` com `SELECT, INSERT, UPDATE, DELETE` em `BLING.*` —
  **sem DDL, sem GRANT, sem FILE**. Segundo módulo a não usar o root do MySQL.
  A ausência de DDL é provada ativamente: o teste tenta `CREATE TABLE` e exige
  que seja recusado.
- Criado para `'127.0.0.1'` **e** `'localhost'`: o MySQL trata os dois como
  hosts diferentes (TCP vs socket), e criar só um dá "Access denied" que parece
  senha errada e não é.
- FK desde o início. As seis exceções (`audit_logs`, `sync_errors`, `sync_jobs`,
  `queue`, `webhook_events`, `raw_payloads`) são deliberadas e documentadas.

### OAuth

- `client_secret`, `access_token` e `refresh_token` **nunca** chegam ao
  navegador (§4), verificado a cada execução procurando os valores reais do
  `.env` nas respostas.
- Tokens cifrados em repouso com **AES-256-GCM**; adulteração é detectada.
- `state` de uso único no **banco**, não na sessão — o retorno do Bling é uma
  navegação de topo vinda de outro site.
- Renovação preserva o `refresh_token` antigo quando o Bling não manda um novo.

### Sincronização, filas e webhooks

Detalhado em [03-sincronizacao-e-filas.md](03-sincronizacao-e-filas.md).
Três estratégias, fila com prioridade e `SKIP LOCKED`, DLQ, webhook assinado por
HMAC, cron com log, expurgo por retenção.

### Provas

```bash
bash scripts/bling-check-all.sh      # 5 suítes, 218 verificações
```

---

## Bugs que a Fase 4 encontrou (nenhum apareceu no build)

### 7. `UNIQUE` com coluna `NULL` duplicava o produto a cada sincronização

`bling_prices` tinha `UNIQUE (product_id, sales_channel_id)`, e o preço padrão
usa `sales_channel_id NULL`. O MySQL trata **cada `NULL` como valor distinto**:
o `ON DUPLICATE KEY` nunca casava e cada execução inseria uma linha nova. Como a
consulta de produtos faz `LEFT JOIN` com preços, o produto aparecia duplicado na
tela — uma cópia por sincronização. Com o cron de 15 minutos, seriam 96 cópias
por dia.

Encontrado porque o teste comparava a **contagem** de produtos, não só a
existência. Corrigido com a coluna `canal_key` (`NULL → 0`). Não pôde ser coluna
gerada: o InnoDB recusa (erro 1215) gerar a partir de coluna que participa de FK.

### 8. Webhook aceitava entrega **sem assinatura**

O endpoint é público, sem sessão e sem CSRF — é o que ele precisa ser, porque
quem chama é o Bling. Mas a primeira versão só recusava quando o segredo estava
configurado; sem segredo, aceitava. Qualquer pessoa na internet podia enfileirar
sincronização e consumir o limite diário da API.

A prova em PHP **não** pegou: ela chamava o serviço com os cabeçalhos que ela
mesma montava. Só a prova HTTP anônima, atravessando nginx + PHP-FPM, mostrou
`POST` sem nada respondendo `200`.

Agora sem `BLING_WEBHOOK_SECRET` o webhook fica **desligado**. Não se perde dado:
o incremental de 15 min e a reconciliação diária cobrem o intervalo.

### 9. Entrega forjada bloqueava a entrega legítima

Encadeado com o anterior: a recusa gravava a **mesma** chave de idempotência da
entrega válida. Bastava mandar o payload forjado antes do Bling para que a
entrega verdadeira fosse descartada como "duplicada" — negação de serviço a
custo zero. Recusas passaram a usar o espaço `rej:<hash>`.

Só apareceu porque o teste passou a exercitar a recusa **antes** da aceitação.

### 10. Checklist de ativação era hardcoded

Os seis itens tinham `false` fixo no código. A tela dizia "banco não
provisionado" com 38 tabelas no ar e o usuário restrito funcionando. Um
checklist que não mede é pior que nenhum: dá a impressão de estar acompanhando o
que na verdade ignora. Agora os nove itens são medidos em tempo real, e cada
pendência traz a ação para resolvê-la.

### 11. Cron sairia com `0` para sempre se não conseguisse a trava

A trava ficava em `/tmp`; o arquivo foi criado por `root` numa execução manual e
`www-data` não conseguia abrir. O `fopen` falhava e o código tratava isso como
"já está rodando", saindo com `0`. A sincronização pararia sem nenhum sinal —
que é exatamente como o problema mais caro deste servidor começou (dois crons de
warm-cache mortos por 14 dias, invisíveis porque descartavam a saída).

Trava movida para `/var/lib/bling`, e falha de abertura agora é **erro**.

### 12. `contasAtivas()` consultava uma coluna inexistente

A suíte de go-live passava com 92 verificações porque nada nela chamava o
worker. Um caminho coberto só pelo cron é um caminho que falha às 3 da manhã,
sem ninguém vendo. A suíte passou a executar os cinco modos do worker.

### 13. Expurgo apagaria zero linha

O código assumia `criado_em` em todas as tabelas. Só `bling_queue` tem essa
coluna — as outras usam `recebido_em`, `iniciado_em`, `ocorrido_em` ou
`expira_em`. O expurgo pareceria funcionando enquanto o disco enchia.

---

## Fase 5 — o que foi entregue

O grafo inteiro (6.251 registros) entra no banco pelo pipeline REAL e as 52
telas dão o mesmo número lidas do banco e do mock — 65 verificações. Sete
defeitos que só aparecem com volume, o desempenho medido e o roteiro de go-live
estão em [06-homologacao.md](06-homologacao.md).

O mais grave: **título quitado virava vencido** (`saldo: 0` sendo lido como
"nada pago"). 1.703 de 1.966 títulos vencidos, R$ 51 milhões de erro no KPI de
contas vencidas — a tela mostraria a empresa inteira inadimplente.

Também: nenhum canal de venda era gravado, a tela de Expedição ficaria vazia
para sempre, e a carga era 6× mais lenta que o necessário (autocommit).

---

## Fase 6 — o que falta (depende do dono)

```bash
php scripts/bling-golive.php     # sai 0 quando pode virar a chave
```

1. `BLING_CLIENT_ID` e `BLING_CLIENT_SECRET` — Bling › Preferências ›
   Integrações › API › Meus aplicativos.
2. Conectar a conta em `Administração › Integrações` e disparar a carga inicial.
3. **Só então** trocar `BLING_PROVIDER=mock` para `bling` — antes da carga as
   telas ficariam vazias, o que se lê como defeito e não é.
4. Opcional: `BLING_WEBHOOK_SECRET` + registrar `POST /api/bling/webhooks`.

Nenhuma linha de tela muda. É o que o `BlingProviderBase` existe para garantir —
e o que a homologação verifica item a item.
