# Google Analytics (GA4) — FASE 0: Investigação

> Entregável da **seção 6** do briefing. Auditoria executada em **2026-07-29/30**, antes de
> qualquer linha de código do módulo — como manda a seção 4.1.
> Cada item traz a classificação exigida pelo briefing: `funcionando` · `funcionando
> parcialmente` · `incorreto` · `duplicado` · `ausente` · `não validado` · `obsoleto` ·
> `inseguro` · `contaminado por testes` · `aguardando decisão`.
>
> **Método**: tudo aqui foi medido, não presumido. Onde não foi possível medir, o item está
> marcado como `não validado` e o motivo está escrito. Nenhum número foi estimado.

---

## 1. Veredito em uma página

**A coleta GA4 existe e está viva — mas fora deste servidor, e com defeitos concretos.**
**A plataforma para construir o módulo é a mais favorável do projeto até hoje.**
**A Fase 4 (integração real) está 100% bloqueada por credencial.**

| Frente | Situação | Classificação |
|---|---|---|
| GA4 no site institucional | GTM ativo, GA4 presente, **UA legado ainda disparando** | `funcionando parcialmente` |
| GA4 no Dshow Dash (webroot) | Não existe — e **está correto**: é dashboard interno | `ausente` (por desenho) |
| Inventário de contas/propriedades/streams | **Impossível sem credencial** — ver §3.6 | `não validado` |
| E-commerce medido | **Nenhum** evento de e-commerce no container | `ausente` |
| Credenciais Google (qualquer API) | Todas as variáveis existem e estão **vazias** | `ausente` |
| Banco analítico | Zero tabelas; `DSHOW_BI_ANALYTICS` existe e está **vazio** | `ausente` |
| Front-end reutilizável | ECharts + 12 subpacotes D3 + **9 gráficos D3 prontos** + 2 grids maduros | `funcionando` |
| Grupo de sidebar do briefing | "Marketing e Aquisição" **não existe** | `aguardando decisão` |
| Conectividade com as APIs Google | Testada, sem bloqueio de saída | `funcionando` |

**O que isto significa para o cronograma**: as Fases 1–3 (mock, telas, D3) podem começar
imediatamente e reaproveitam muito mais do que o briefing supõe. A Fase 4 não pode nem ser
estimada antes de o dono decidir §9.1. A investigação **não pode ser fechada** como os critérios
da seção 80 pedem — três dos dez critérios dependem de credencial (ver §11).

---

## 2. Coleta existente (briefing §5.1)

### 2.1. O que foi auditado, e como

Este servidor hospeda **3 webroots** (`/var/www/dshowdash`, `/var/www/dshowdash_v3` — que o nginx
aponta mas **não existe** —, `/var/www/html`) e um projeto de conhecimento
(`/var/www/google-ads-decision-engine`).

**Nenhum deles tem GA4, GTM, gtag.js, UA ou Firebase.** Verificado padrão por padrão:
`googletagmanager.com` = 0 · `gtag(` = 0 · `GTM-` = 0 · `UA-` = 0 · `google-analytics.com` = 0 ·
`firebase` = 0. Os 32 arquivos que casaram com o padrão de measurement ID eram **falso positivo**:
a string era `G-VERBOSITY`.

⚠️ **Isto não é um defeito.** O Dshow Dash é ferramenta interna autenticada; medir uso interno com
GA4 seria contaminar as propriedades de marketing. **Recomendação: manter sem GA4.**

### 2.2. Site institucional — `dshow.com.br`

Auditado pelo HTML público e pelo bundle servido. **Este é o único ativo de coleta que foi possível
confirmar de fora.**

| Item | Valor medido | Classificação |
|---|---|---|
| Container GTM | **`GTM-M8KJKVV`** | `funcionando` |
| Onde a tag vive | **Dentro de `/js/app.min.js`** (298 KB), não no HTML | `funcionando parcialmente` |
| Measurement ID GA4 | **`G-WGDR8WJ7G8`** (via `vtp_measurementIdOverride`) | `funcionando` |
| Tag de configuração GA4 | tipo `__gaawc` presente | `funcionando` |
| Tags de evento GA4 | **15** tags tipo `__gaawe` | `funcionando` |
| **Universal Analytics** | **`UA-945670-1`, 4 tags tipo `__ua` ainda no container** | 🔴 `obsoleto` |
| Google Ads (conversão) | ID `1064122859`, 114 referências a `conversion` | `funcionando` |
| Tags de HTML customizado | **17** tags tipo `__html` | ⚠️ `não validado` |
| Listeners | 9 click (`__cl`), 7 timer (`__tl`), 4 scroll (`__sdl`) | `funcionando` |
| Cross-domain | **Nenhum domínio próprio** na configuração do container | `não validado` |
| Terceiros | `veinteractive.com` (remarketing legado), YouTube, DoubleClick | `não validado` |
| Meta Pixel | `fbevents`/`facebook` aparecem, mas **nenhum pixel ID** foi encontrado | `não validado` |

⚠️ **A tag estar dentro do `app.min.js` importa**: qualquer deploy do site que regenere esse bundle
pode derrubar a coleta inteira sem aviso, e a tag não é auditável por quem só olha o HTML. Foi
exatamente por isso que a primeira varredura deste relatório deu "zero tags" no site — o dado só
apareceu ao abrir o bundle.

### 2.3. Eventos configurados no container — os 16 encontrados

```
generate_lead                iniciou_formulario           gtm.timer
clicou_whatsapp              scrool_25   scrool_50        time_5segundos    time_10segundos
iniciou_conversa_whatsapp    scrool_75   scrool_100       time_15segundos   time_30segundos
                                                          time_60segundos   time_90segundos
                                                          time_120segundos
```

| Achado | Detalhe | Classificação |
|---|---|---|
| 🔴 **Erro de grafia em 4 eventos** | **`scrool_25/50/75/100`** — é `scroll`, com dois "l" | `incorreto` |
| `generate_lead` correto | É o nome recomendado pelo Google — bom sinal | `funcionando` |
| Convenção misturada | `generate_lead` (EN/recomendado) + `clicou_whatsapp` (PT) no mesmo container | `incorreto` |
| **7 eventos de timer** | `time_5..120segundos` — inflam contagem de eventos e consomem quota | ⚠️ `não validado` |
| **Zero eventos de e-commerce** | Nenhum `view_item`, `add_to_cart`, `begin_checkout`, `purchase` | 🔴 `ausente` |

⚠️ **`scrool_*` não tem correção indolor.** Renomear cria série nova e parte o histórico;
manter perpetua o erro. É decisão do dono (§10, decisão 6) — não uma correção óbvia.

⚠️ **A ausência de e-commerce derruba a base de 3 seções inteiras do briefing** (§33 E-commerce,
§34 Produtos, §35 Checkout) e de parte de §47 (conciliação de pedidos). Sem `purchase` com
`transaction_id`, não há o que conciliar contra Bling/Loja Integrada.

### 2.4. Loja virtual — não localizada

O briefing fala de "lojas virtuais" (§1, §33–35). **Nenhum domínio de loja existe no projeto**:
zero referências a `lojaintegrada.com.br` ou similar em código, docs ou `.env`.

O que existe é andaime: `panel-integration-loja-integrada` (90 linhas) aponta para
`/api/status/lojaintegrada.php`, que responde
`{"ok":true,"data":{"status":"not_configured","configured":false}}` — e o `isConfigured = false`
está **fixo no código**, não vem de configuração. Mesmo padrão do `api/status/calendar.php` que a
investigação do Google Calendar encontrou. Classificação: `ausente`.

`panel-mercadolivre` (23 seções) e `panel-metaads` (23 seções) existem **sem backend próprio** —
são mock. Classificação: `funcionando parcialmente` (como mock).

### 2.5. Aplicativos / Firebase

Nenhum vestígio de Firebase Analytics em nenhum webroot. Se existem apps, estão fora deste
servidor. Classificação: `não validado`.

### 2.6. ⚠️ O limite desta auditoria — leia antes de cobrar a §80

O briefing §5.1 e §80 pedem o inventário de **contas, propriedades, streams, dimensões e métricas
personalizadas, eventos importantes, links de BigQuery e permissões**. **Nada disso é obtível sem
credencial GA4** — essa informação só existe atrás da Admin API ou da interface do GA4.

O que este relatório conseguiu foi **engenharia reversa do container GTM público**, que revela o
measurement ID e as tags, mas **não** revela: quantas propriedades existem, quais streams, quais
eventos estão marcados como importantes (conversões), quais dimensões personalizadas existem, se há
BigQuery vinculado, nem quem tem acesso.

Portanto: **1 measurement ID confirmado (`G-WGDR8WJ7G8`) não significa "1 propriedade".** Pode
haver outras propriedades sem tag neste site, ou o mesmo site enviando para várias. Classificação
honesta: `não validado`.

---

## 3. Infraestrutura e credenciais (briefing §5.3, §56)

| Item | Estado medido | Classificação |
|---|---|---|
| Conectividade de saída para as APIs | `analyticsdata`, `analyticsadmin`, `bigquery`, `oauth2` **respondem** (404/301 = TLS ok) | `funcionando` |
| Composer / `vendor/` | **Não existem** — projeto sem autoloader | `ausente` |
| SDK oficial Google (PHP) | Impossível sem composer | `ausente` |
| `gcloud` / `bq` CLI | **Não instalados** | `ausente` |
| Service account (`.json`) | **Nenhum** no servidor | `ausente` |
| `GOOGLE_ADS_*` no `.env` | 4 variáveis, **todas vazias** | `ausente` |
| `GOOGLE_CALENDAR_OAUTH_*` | client id/secret **vazios**; redirect_uri preenchido | `ausente` |
| Variáveis de GA4 / BigQuery | **Não existem ainda** | `ausente` |
| `ADS_PROVIDER` / `GCAL_PROVIDER` | ambos `mock` | `funcionando` (mock-first) |
| `DB_ADS_DSHOW_USER` / `PASS` | host/port/name preenchidos, **usuário e senha vazios** | 🔴 `inseguro` |
| `DB_GCAL_DSHOW_USER` / `PASS` | idem | 🔴 `inseguro` |
| App roda como **MySQL root** | `DB_DSHOWDASH_USER=root`, ALL PRIVILEGES | 🔴 `inseguro` |

### 3.1. A boa notícia: o OAuth do Google já foi escrito

`api/google-calendar/lib/` entregou, em 2026-07-29:
- **`GoogleOAuth`** — PKCE S256 pronto (nunca exercitado com credencial real);
- **`GcalCrypto`** — AES-GCM para guardar token cifrado no banco (herdado do Outlook);
- **`GcalProvider`** — interface + `GcalMock` + `GcalReal` que responde 503 listando pendências.

**Este é o molde exato do que o GA precisa** (§54, §55, §56). Não é preciso desenhar autenticação
Google de novo — só instanciar o padrão. Classificação: `funcionando` (reúso confirmado).

### 3.2. Sem SDK, como falar com a Data API

O projeto **não tem** composer, então não haverá `google/analytics-data`. O caminho é o mesmo que o
Pipedrive já usa em produção: cliente REST próprio via cURL (`api/pipedrive/lib/PipedriveClient.php`
— com retry de 429, paginação por cursor/offset e contabilidade de custo por chamada). É um molde
maduro, testado, e já resolve o que a Data API exige.

⚠️ **BigQuery (§48) é o único que sofre de verdade sem SDK/CLI**: autenticação JWT assinada e jobs
de query dão bem mais trabalho em REST puro. Ver decisão 5 em §10.

---

## 4. Banco de dados (briefing §5.4, §59)

| Item | Medido | Classificação |
|---|---|---|
| Tabelas `ga_*` | **Zero**, em qualquer schema | `ausente` |
| Tabelas com "analytic" no nome | **Zero** | `ausente` |
| `DSHOW_BI_ANALYTICS` | **O banco existe e tem 0 tabelas** | `ausente` |
| Schemas `DSHOW%` com tabelas | Apenas **3** de dezenas | `ausente` |

O modelo de dados da seção 59 (25 tabelas `ga_*`) é **100% greenfield**. Isso é uma vantagem:
nenhuma migração, nenhum drift a resolver. O molde de DDL é `docs/GOOGLE-ADS/02-banco-ADS_DSHOW.sql`
e o schema do Pipedrive (`pipe_*`), que já tem o padrão de `raw_payload` + `last_synced_at` +
`sync_jobs` + `sync_errors` que a §59 pede.

⚠️ **Trap medida no Pipedrive, aplicável aqui**: índice de **coluna única não serve** quando o
`ORDER BY` do grid tem desempate — foi preciso `(update_time, pipedrive_id)` para sair de 53,9 ms
para 1,05 ms. Ao criar as tabelas `ga_*`, indexar já pensando no `ORDER BY` real dos grids.

⚠️ **Trap de fuso, crítica para GA4**: `mysql.time_zone_name` está **vazia** neste servidor, então
`CONVERT_TZ` por nome retorna **NULL** — e NULL num `WHERE` de janela **faz a linha desaparecer sem
erro no log**. GA4 tem timezone **por propriedade**, e o briefing pede seletor de fuso (§13). Regra
herdada do Google Calendar: **guardar UTC, converter só na borda**.

---

## 5. Front-end (briefing §5.2, §60–62, §78)

### 5.1. Reúso confirmado — muito além do que o briefing supõe

| Recurso | O que existe | Onde |
|---|---|---|
| **9 gráficos D3 prontos** (1.258 linhas) | `SankeyFluxo`, `GeoMapaBrasil`, `Treemap`, `CalendarHeatmap`, `GrafoForca`, `ChordDiagram`, `RadarComparativo`, `RelogioPolar`, `Streamgraph` | `panel-ads/src/components/viz/d3/` |
| **12 subpacotes D3** | `d3-sankey`, `d3-hierarchy`, `d3-geo`, `d3-force`, `d3-zoom`, `d3-drag`, `d3-selection`, `d3-scale`, `d3-scale-chromatic`, `d3-shape`, `d3-array`, `d3-chord` | package.json raiz |
| **ECharts 6.1.0** | com **import seletivo** provado: 1126 → **496 kB** | `panel-google-calendar` |
| **Grid maduro** | `EntityGrid.tsx` (**837 linhas**): colunas fixas, master-detail, zebra opaca, seleção+export, totalizadores, 25/50/100/200, facets com `facets=0` | `panel-pipedrive` |
| **Grid alternativo** | `DataGrid.tsx` (252 linhas): densidade, virtualização, totalizadores, export, zebra | `panel-datatables` |
| **TanStack** table + virtual + query | já em uso em 3 painéis | `metaads`, `mercadolivre`, `google-calendar` |
| **Lucide** `lucide-react@1.25.0` | atende §68 sem instalar nada | package.json raiz |
| **Molde de painel com 22 telas** | `VisaoGeral`, `Diretoria`, `Campanhas`, `LandingPages`, `Localizacoes`, `Dispositivos`, `Funil`, `Conversoes`, `Publicos`, `Qualidade`, `Relatorios`, `Alertas`… | `panel-ads/src/screens/` |
| Base | React **19.2.4**, TypeScript **5.9.3**, Vite **7.3.1** | package.json raiz |

⚠️ **Correção a uma leitura apressada do briefing §78**: o pacote guarda-chuva `d3` **não** está
instalado — e não precisa estar. O projeto usa os **módulos** D3, que é a forma recomendada e dá
tree-shaking. Os 5 gráficos que o briefing mais pede (Sankey §21, mapa §40, treemap §20, coorte
§37, grafo de navegação §26) **já existem em produção**.

### 5.2. Ausentes — e o preço de instalar

`ag-grid` · `zustand` · `zod` · `react-hook-form` · `@radix-ui/*` · `framer-motion` · `date-fns`.

⚠️ **O `package.json` é da RAIZ e é compartilhado por todos os painéis.** Instalar qualquer uma
dessas mexe no build de **todo** o dashboard — é a trap que o módulo de Ads já registrou. O briefing
§60 aceita TanStack Table + TanStack Virtual como alternativa ao AG Grid, e **ambos já estão
instalados e em uso**. Recomendação: **não instalar AG Grid**; usar `EntityGrid` (que já tem quase
tudo da §60.1) ou TanStack. Para datas, `Intl` nativo, como o Google Calendar fez em vez de instalar
`date-fns`. Decisão 4 em §10.

### 5.3. `panel-analytics` — o que é o painel que já existe

Existe `public/components/panels/panel-analytics` (index 149 linhas .ts / 204 .js). É um painel
**genérico de andaime**: `CONFIG = { id: 'analytics', label: 'Analytics', svgIcon: barChart, kind:
'panel-component' }`, sem `apiEndpoint`, com `store`/`updaters`/`validators` do scaffold.

Pontos verificados: **não** tem o bug do `container: any`, **não** tem o bug do `j.success`, e o
`StateStore` dele é **classe de verdade** (não o alias-objeto que quebrou 3 painéis `panel-user-*`).
Está em `panel-paths` (1 referência) mas **não** está em `ui_nav_items` — inalcançável pela UI.

Classificação: `obsoleto`. **Recomendação: não reaproveitar** — o nome `panel-analytics` é genérico
e o módulo novo deve nascer como `panel-google-analytics`, seguindo `panel-google-calendar`. O que
fazer com o andaime é a decisão 7 (§10).

### 5.4. Traps de UI herdadas que valem para este módulo

- 🔴 **Envelope é `{ok, data, error, meta}` — nunca `success`.** `ApiResponse.php` grava a chave
  `ok`; o método apenas se *chama* `success()`. **17 painéis** deste projeto testam `j.success` e
  por isso **nunca saem do placeholder**. O `ApiEnvelope<T>` do `panel-ads` já está correto — usar
  aquele tipo.
- 🔴 **Tema**: `<html class="theme-light">` fica **presa nos dois temas** — não é sinal de tema. Os
  sinais reais são `html[data-theme]` e `body.theme-dark|theme-light`. Usar `:root.theme-light`
  prende o painel em claro para sempre.
- 🔴 **Zona morta do app-shell**: a sidebar do shell é de **312 px fixos**, então em janelas de
  600–820 px o painel fica com 208–258 px — pior que um celular. O briefing §11.1 pede sub-sidebar
  de **240 px**: somados aos 312 px do shell, isso precisa ser **medido** nessa faixa antes de
  fechar o layout. `minmax(0,1fr)` na pista não basta: precisa `min-width: 0` no item.
- ⚠️ **Ctrl+K**: a paleta real é a da **sidebar** (`sidebar/features/command-palette.js`, servida
  bundlada). Registrar os comandos do módulo lá — não criar paleta nova (§65).
- ⚠️ `vite build` como root exige **`chown -R www-data:www-data dist`**, senão o painel serve 403.
- ⚠️ Editar `api/` destrói owner+ACL e derruba o app com 500 — refazer `chown`+`setfacl` sempre.

---

## 6. Acesso ao módulo (briefing §7, §8)

### 6.1. 🔴 O grupo "Marketing e Aquisição" não existe

O briefing §8.1 manda posicionar o botão no grupo **"Marketing e Aquisição"**, na ordem Ads → Meta
Ads → Google Analytics → Anúncios. **Esse grupo não existe** em `ui_nav_items`.

Onde os módulos de marketing realmente estão hoje (todos ativos, todos no mesmo grupo):

| `item_key` | label | grupo (`parent_key`) | `order_index` |
|---|---|---|---|
| `sidebar.ads` | Ads | **`sidebar.grp-favoritos`** | 7 |
| `sidebar.metaads` | Meta Ads | `sidebar.grp-favoritos` | 8 |
| `sidebar.anuncios` | Anuncios | `sidebar.grp-favoritos` | 9 |
| `sidebar.google-calendar` | Google Calendar | `sidebar.grp-favoritos` | 12 |

Também existem, **inativos** (`is_active=0`), resíduos antigos: `sidebar.google-ads` (order 26, em
`grp-automacoes`, apontando para `panel-integration-adwords`) e `sidebar.dash.google-ads` (em
`grp-dashboards`, apontando para `panel-stub-dev`). Classificação: `obsoleto`.

**Duas saídas, e é decisão do dono** (decisão 1 em §10):
- **(A) Seguir o padrão vigente**: `sidebar.google-analytics` em `grp-favoritos` com `order_index`
  9, empurrando `Anuncios` para 10 — respeita a *ordem relativa* que o briefing pede, com 1 linha
  de UPDATE. É o caminho que o Google Calendar seguiu semana passada.
- **(B) Criar o grupo "Marketing e Aquisição"** e mover Ads, Meta Ads, Anúncios e o GA para lá —
  é o que o briefing pede à letra, mas mexe em 4 itens de navegação que hoje funcionam, e afeta
  usuários que já têm o hábito de achá-los em Favoritos.

### 6.2. Restante do acesso

`ícone no header` (§9), `busca global` (§65), `atalhos da home` e `cards de outros módulos` (§7):
todos têm precedente pronto — o Google Calendar repontou o ícone do header e criou a flag
`panel_google_calendar_enabled` de verdade. Classificação: `funcionando` (molde disponível).

⚠️ Sobre a flag: o módulo Outlook **vive de fallback** porque a flag dele nunca foi criada. Criar
`panel_google_analytics_enabled` **de verdade** desde o início.

---

## 7. Integrações relacionadas (briefing §5.5, §32, §47)

| Módulo | Estado real | Serve para conciliação? |
|---|---|---|
| **Pipedrive** | 🟢 **LIVE**, 18 telas, dado real (105.646 atividades) | **Sim** — é a única fonte real hoje |
| Ads (Google Ads) | mock (`ADS_PROVIDER=mock`), 22 telas | Não até ter credencial |
| Meta Ads | mock, 23 seções, sem backend | Não |
| Mercado Livre | mock, 23 seções, sem backend | Não |
| Bling | andaime | Não |
| Loja Integrada | andaime (`isConfigured=false` fixo) | Não |
| Outlook | mock (`OUTLOOK_PROVIDER=mock`) | Não |
| ERP / Financeiro | `DSHOW_PROD` com dados **até 2026-02-06** | Parcial, e desatualizado |

**Consequência direta para o briefing**: a conciliação da §47 (GA4 → Pipedrive → CRM → E-commerce →
Bling → Financeiro) só tem **duas pontas reais** hoje: GA4 e Pipedrive. As demais linhas daquela
tabela seriam mock conciliando com mock. A §32 (Leads GA4 × CRM) **é viável de verdade** — e é a
integração de maior valor imediato, porque o site já dispara `generate_lead` e o Pipedrive tem os
leads reais do outro lado.

### 7.1. 🔎 O módulo de Ads já esperava por este

`docs/GOOGLE-ADS/01-arquitetura.md` lista **"GA4 (Data API)"** como fonte ao lado de Pipedrive e
ERP, e `05-plano-fases.md` tem como pendência aberta do dono: **"GA4 (propriedade + escopos) —
Informar a propriedade GA4 (Fase 2)"**.

Ou seja: a propriedade GA4 que este relatório precisa é **a mesma** que o módulo de Ads está
esperando. Uma decisão destrava os dois. Vale tratar `G-WGDR8WJ7G8` como candidata e confirmar com
o dono se é a propriedade correta (decisão 2 em §10).

---

## 8. Riscos

| # | Risco | Gravidade | Mitigação proposta |
|---|---|---|---|
| 1 | **Sem credencial**, a Fase 4 não começa e a §80 não fecha | 🔴 Alta | Decisão 1 do dono; Fases 1–3 seguem em mock |
| 2 | **UA-945670-1 ainda no container** (4 tags), coleta morta desde 2023 | 🟠 Média | Remover do GTM; ganho de carregamento, zero perda |
| 3 | **`scrool_*`** grafado errado em 4 eventos | 🟠 Média | Decisão 6 — renomear parte o histórico |
| 4 | **Zero e-commerce medido** → §33/§34/§35 sem base | 🔴 Alta | Decisão 3: instrumentar a loja, ou remover as seções do escopo |
| 5 | **Quota da Data API** (Core/Realtime/Funnel são categorias separadas) | 🟠 Média | Tempo real (§18) é o maior consumidor: cache curto + refresh configurável + tela de quota (§57.1) desde a Fase 4 |
| 6 | **App roda como MySQL root**; `DB_ADS`/`DB_GCAL` com user/pass vazios | 🔴 Alta | Herdado; resolver antes da Fase 4 (já é pendência do DBA) |
| 7 | **17 tags `__html`** no container = código arbitrário em produção | 🟠 Média | Revisar uma a uma antes de confiar na coleta |
| 8 | **Zona morta do app-shell** × sub-sidebar de 240 px | 🟠 Média | Medir 600–820 px antes de fechar layout |
| 9 | Tag do site vive dentro de `app.min.js` | 🟠 Média | Um deploy do site pode zerar a coleta sem aviso; monitorar |
| 10 | `package.json` da RAIZ | 🟡 Baixa | Não instalar AG Grid/zustand/date-fns; usar o que há |
| 11 | Instalar SDK/CLI para BigQuery | 🟡 Baixa | Fase 5 é opcional; decidir só ao chegar lá |

---

## 9. Plano de fases — ajustado ao que foi medido

O briefing propõe 8 fases (§79). Ajustes propostos, **com o motivo**:

| Fase | Escopo | Muda em relação ao briefing? |
|---|---|---|
| **0** | Esta investigação | ✅ concluída, com 3 itens `não validado` por falta de credencial |
| **1** | Mock + shell + sub-sidebar + telas da Visão/Aquisição/Comportamento | Igual — mas **muito mais rápido**: molde do `panel-ads` (22 telas) + `ApiEnvelope` correto |
| **2** | D3 e ECharts | **Encurtada**: Sankey, mapa, treemap, coorte e grafo **já existem**; é adaptar, não criar |
| **3** | Grids, cross-filter, drill-down | **Encurtada**: `EntityGrid` já tem a maior parte da §60.1 |
| **4** | Backend real (Data API + Admin API) | 🔴 **Bloqueada por credencial.** Molde: `PipedriveClient` + `GoogleOAuth` do gcal |
| **5** | BigQuery | **Rebaixada para opcional**: sem composer/SDK/CLI, custa desproporcional ao ganho inicial |
| **6** | Measurement Protocol | Mantida, **depois** da 4 — e o `api_secret` nunca chega ao front (§45.4) |
| **7** | Integração interna | **Reordenada**: começar por **Pipedrive** (única ponta real). Ads/Meta/Bling só quando saírem do mock |
| **8** | Homologação | Igual, com os detectores do `check-all.sh` |

**Ordem recomendada de valor**: Fase 1 → 2 → 3 → **§32 (Leads GA4 × Pipedrive)** → 4 → 7 → 6 → 5.
A conciliação de leads é o primeiro lugar onde o módulo entrega resposta que ninguém tem hoje, e é
a única que tem **as duas pontas reais**.

---

## 10. Decisões que dependem do dono

1. 🔴 **Credencial GA4.** Sem isto, Fase 4 não começa e a §80 não fecha. Duas opções (§56):
   **service account** (recomendado — o módulo é corporativo e roda em backend/jobs; basta dar
   acesso de leitura à propriedade) ou **OAuth por usuário** (só se cada pessoa for conectar a
   própria propriedade). Requer também: projeto no Google Cloud + habilitar Data API e Admin API.
   ⚠️ O Google Calendar tem a mesma pendência aberta — uma decisão pode servir aos dois.
2. **A propriedade é `G-WGDR8WJ7G8`?** É o único measurement ID encontrado. Confirmar se é a
   propriedade oficial, se há outras, e quais contas/propriedades o módulo deve enxergar.
3. 🔴 **E-commerce**: instrumentar a loja com os eventos da §33.2 (aí §33/§34/§35 fazem sentido), ou
   **remover** essas seções do escopo desta versão? Hoje não há um único evento de e-commerce.
4. **Bibliotecas**: aprovar usar `EntityGrid`/TanStack em vez de instalar **AG Grid**, e `Intl` em
   vez de `date-fns` — evita mexer no `package.json` da raiz, que afeta todo o dashboard.
5. **BigQuery (§48)**: entra agora ou fica para depois? Sem composer/`bq` CLI, o custo é
   desproporcional. Recomendo **depois**.
6. **`scrool_*`**: renomear para `scroll_*` (série nova, histórico partido) ou manter o erro e
   documentar? Recomendo renomear **com** data de corte registrada.
7. **`panel-analytics`** (andaime inalcançável): aposentar ou deixar como está?
8. **Sidebar (§8.1)**: criar o grupo "Marketing e Aquisição" e mover 4 itens, ou colocar o GA em
   `grp-favoritos` com `order_index` 9, como o briefing pede em ordem relativa?
9. **UA-945670-1**: autorizar a remoção das 4 tags legadas do container?

---

## 11. Critérios de aceite da investigação (briefing §80) — status honesto

| Critério | Status | Observação |
|---|---|---|
| Contas e propriedades mapeadas | 🔴 **Não atendido** | Exige credencial. 1 measurement ID achado ≠ inventário de propriedades |
| Streams mapeados | 🔴 **Não atendido** | Exige Admin API |
| Tags identificadas | ✅ **Atendido** | `GTM-M8KJKVV`, tipos e contagem por tipo |
| Eventos catalogados | ✅ **Atendido** | Os 16 do container, com os defeitos apontados |
| Conversões documentadas | 🟠 **Parcial** | `generate_lead` existe; **quais eventos são "importantes"** só a Admin API diz |
| Problemas de coleta descritos | ✅ **Atendido** | §2.2, §2.3, riscos 2/3/4/7/9 |
| Credenciais e permissões validadas | ✅ **Atendido** (resultado: **não existem**) | Validado que está tudo vazio |
| BigQuery avaliado | 🟠 **Parcial** | Avaliada a **viabilidade** (sem SDK/CLI); a **existência de link** exige credencial |
| Riscos documentados | ✅ **Atendido** | §8, 11 riscos |
| Plano de correção definido | ✅ **Atendido** | §9 e §10 |

**7 de 10 atendidos; 3 bloqueados pela mesma causa** — ausência de credencial GA4. Não considero a
Fase 0 "fechada": ela fica **aberta em 3 itens**, que se resolvem em poucas horas assim que a
decisão 1 sair. Fechá-la agora seria marcar como pronto o que não foi medido.

---

## 12. Como reproduzir esta auditoria

```bash
# 1. Coleta no webroot (esperado: zero)
grep -rlE "googletagmanager\.com|gtag\(|GTM-[A-Z0-9]{4,}|UA-[0-9]{4,}-" public/ | grep -v node_modules

# 2. Tag do site institucional (está no bundle, NÃO no HTML)
curl -sL https://www.dshow.com.br/js/app.min.js | grep -oE "GTM-[A-Z0-9]+"

# 3. Container público -> measurement ID, UA legado, eventos, tipos de tag
curl -sL "https://www.googletagmanager.com/gtm.js?id=GTM-M8KJKVV" -o /tmp/gtm.js
grep -oE '"G-[A-Za-z0-9]+"' /tmp/gtm.js | sort -u
grep -oE "UA-[0-9]+-[0-9]+" /tmp/gtm.js | sort -u
grep -oE '"vtp_eventName":"[^"]+"' /tmp/gtm.js | sort -u
grep -oE '"function":"__[a-z]+"' /tmp/gtm.js | sort | uniq -c | sort -rn

# 4. Conectividade com as APIs (esperado 404/301 = TLS ok)
for h in analyticsdata analyticsadmin bigquery oauth2; do
  curl -s -o /dev/null -w "$h %{http_code}\n" "https://$h.googleapis.com/"; done

# 5. Banco (esperado: zero tabelas ga_*/analytics)
# SELECT TABLE_SCHEMA,TABLE_NAME FROM information_schema.TABLES
#  WHERE TABLE_NAME REGEXP '^ga_|analytic';
```
