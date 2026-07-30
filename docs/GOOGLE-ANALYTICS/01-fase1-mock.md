# Google Analytics — FASE 1: módulo no mock

> Entregue em **2026-07-30**. Corresponde à Fase 2 do §79 do briefing (estrutura visual e
> mocks), com a Fase 1 do §79 (investigação) já em [`00-fase0-investigacao.md`](00-fase0-investigacao.md).
>
> **Estado**: no ar em `GA_PROVIDER=mock`. Verificação: `bash scripts/ga-smoke-all.sh`.

---

## 1. O que está no ar

| Camada | Onde | Conteúdo |
|---|---|---|
| Backend | `api/google-analytics/` | 16 rotas GET, `GaProvider` + `GaMock` + `GaReal` |
| Painel | `public/components/panels/panel-google-analytics/` | React 19 + TS, **21 telas com dados** |
| Rota nginx | `location ~ ^/api/google-analytics(/.*)?$` | PATH_INFO, molde do Google Calendar |
| Sidebar | `ui_nav_items` → `sidebar.google-analytics` | `grp-favoritos`, `order_index` **9** |
| Flag | `app_feature_flags` → `panel_google_analytics_enabled` | criada **de verdade**, habilitada |
| Verificação | `scripts/ga-smoke-all.sh` · `tools/screenshot/valida-google-analytics-fase1.mjs` | 26 + 77 checagens |

### Rotas

```
GET /status              GET /overview            GET /pages           GET /ecommerce
GET /header/summary      GET /realtime  [RT]      GET /events          GET /users
GET /acquisition         GET /acquisition/flow    GET /conversions     GET /quality
GET /funnel  [FUNNEL]    GET /alerts              GET /properties      GET /quotas
```

`[RT]` e `[FUNNEL]` consomem **categorias de quota separadas** da Data API (§57). Estão em
métodos distintos do provedor exatamente para poder medir e limitar cada um sem afetar o resto —
não é separação cosmética.

### Telas (21 com dados, 3 declaradas para fase seguinte)

**Visão**: Visão Geral · Tempo Real · ~~Diretoria~~
**Aquisição**: Aquisição Geral · Canais · Campanhas · ~~Fluxo (Sankey)~~
**Comportamento**: Páginas · Landing Pages
**Conversões**: Eventos · Eventos Importantes · Funis · E-commerce · Produtos
**Usuários**: Usuários · Dispositivos · Localizações · Retenção e Coortes
**Qualidade**: Qualidade da Coleta · Tagging e GTM
**Inteligência**: Alertas · ~~Insights~~
**Administração**: Propriedades · Quotas

⚠️ As riscadas aparecem no menu com a etiqueta "fase 2" **e o motivo no tooltip**. Item de menu
que abre tela vazia sem explicação é pior que item ausente.

⚠️ **A fonte da verdade das telas é `src/shell/types.ts` (`GRUPOS`/`TELAS`) + `api/google-analytics/index.php`** —
nunca este documento. O smoke test (item 8) confere que toda tela `disponivel: true` tem componente.

---

## 2. As duas decisões de desenho que valem mais que o código

### 2.1. O mock usa os eventos REAIS

`GaMock` não inventa `page_view`/`add_to_cart` genéricos: usa os **16 eventos que a Fase 0
extraiu do container de produção** — inclusive `scrool_25/50/75/100`, com o erro de grafia que
existe na origem, e os 7 `time_Nsegundos`.

**Por quê**: quando a Data API entrar, a forma da tela não muda. Um mock com nomes fantasia
produziria telas que quebram no dia da troca — exatamente o que a §84 manda evitar. E a tela de
Qualidade mostra defeitos **verdadeiros** desde o primeiro dia, em vez de uma lista decorativa.

### 2.2. E-commerce nasce vazio, de propósito

Não existe **um** evento de e-commerce no container (`view_item`, `add_to_cart`, `purchase`:
zero, auditado). O cenário padrão devolve e-commerce **não instrumentado**, com o motivo, a lista
de eventos que faltam e o que fazer. `?cenario=ecommerce` exercita o layout com dados.

Fabricar receita aqui daria um painel bonito que mente sobre a operação — e é o tipo de defeito
que só é descoberto quando alguém toma uma decisão de negócio com base nele.

---

## 3. 🔴 O bug que a medição pegou no próprio mock

A primeira versão passava em todos os testes de rota e **estava incoerente**:

| Comparação | Antes | Depois |
|---|---|---|
| Sessões: Visão Geral × soma por canal | **24,2% de diferença** | **0,00%** |
| Conversões: Visão Geral × soma por canal | **22,2% de diferença** | **0,00%** |

**Duas causas independentes:**
1. `Direct` (17,1% do tráfego) e `Organic Social` (8,2%) **não tinham campanha** e por isso
   desapareciam do agregado por canal — 25,3% do volume evaporava. No GA4 real esses canais
   aparecem como `(direct)`/`(not set)`; agora aparecem aqui também.
2. O jitter por campanha (0,72–1,28) nunca somava 1, e o fator de qualidade por canal
   (`qual`) tem média ponderada ≠ 1. Resolvido normalizando as fatias pela própria soma e
   reescalando as conversões, com a **última linha absorvendo o arredondamento** para a soma
   fechar exata.

⚠️ **Um painel de análise que não fecha consigo mesmo é pior que um painel vazio, porque parece
certo.** A incoerência só aparece quando alguém confere duas telas lado a lado — e aí a
credibilidade do módulo já foi. Por isso o smoke test tem a verificação de coerência (item 6)
rodando em 4 cenários: é a barreira que impede isso de voltar.

---

## 4. Reúso — nada foi instalado

⚠️ O `package.json` é da **RAIZ** e é compartilhado por todos os painéis do dashboard. Instalar
uma dependência aqui muda o build de todo o resto.

| Precisava | Usado | Em vez de instalar |
|---|---|---|
| Gráficos de série | **ECharts 6** com import seletivo (`echarts/core` + Line/Bar + Grid/Tooltip/Legend/DataZoom + **SVGRenderer**) | — |
| Ícones | **lucide-react**, importados nominalmente | `import * as Lucide` (puxaria centenas) |
| Datas | **`Intl`** nativo | `date-fns` |
| Grid | tabela própria com zebra, sticky header, totalizadores, números à direita | **AG Grid** (a §60 aceita a alternativa) |
| Sparkline | **SVG puro** (30–90 pontos numa faixa de 26px) | motor de gráfico |

ECharts saiu em **chunk separado de 596 kB** — só entra na conta de quem abre uma tela com
gráfico. O entry do módulo tem **66 kB**.

---

## 5. Traps herdadas que este módulo respeita

- 🔴 **Envelope é `{ok, data, error, meta}`** — nunca `success`. O `pedir()` do serviço testa
  **`res.ok` E `corpo.ok`**: `ok:false` pode vir com HTTP 200, e testar só um dos dois foi o bug
  que deixou 17 painéis presos no placeholder.
- 🔴 **Tema**: `html[data-theme]` + `body.theme-dark|theme-light`. **Nunca `:root.theme-light`**,
  que fica presa nos dois temas e prende o painel em claro para sempre.
- 🔴 **ResizeObserver no gráfico**: colapsar a sub-sidebar muda a largura sem disparar `resize`
  na janela. Provado na prova: **870px → 1038px**.
- ⚠️ **Zona morta do app-shell**: a sidebar do shell é de 312px fixos. A sub-sidebar de 240px
  (§11.1) **colapsa sozinha abaixo de 1100px**, e o item da pista tem `min-width: 0` — sem isso
  o conteúdo estoura e aparece scroll horizontal.
- ⚠️ `chown -R www-data:www-data dist` **depois de todo `vite build`**, senão o painel serve 403.
- ⚠️ `chown` + `chmod 640` + `setfacl` depois de **qualquer** edição em `api/`.
- ⚠️ Fuso na **borda** (`ga_filtros()`), tudo em `America/Sao_Paulo`: `CONVERT_TZ` por nome
  devolve NULL neste servidor, e NULL num `WHERE` de janela some com a linha sem erro no log.

---

## 6. O que a Fase 1 deliberadamente NÃO fez

| Item | Por quê |
|---|---|
| Sankey em D3 (§21) | Fase 2. O endpoint `/acquisition/flow` **já devolve nós e links**, e `SankeyFluxo.tsx` já existe no módulo de Ads |
| Mapa em D3 (§40) | Fase 2. `GeoMapaBrasil.tsx` já existe; a tela hoje mostra a tabela |
| Matriz de permissões (§71) | O modelo real é **UARPS**; gravar permissão em tabela que ninguém lê criaria ilusão de controle. Entra com a Fase 4 |
| Rotas de escrita | Nenhuma. Measurement Protocol (§45) entra depois, e o `api_secret` **nunca** pode chegar ao front |
| Exportação CSV/XLSX/PDF (§51.2) | Fase 3 |
| Ícone no header (§9) | A sessão paralela estava editando o header no mesmo momento; evitei conflito. É o próximo passo, pequeno |
| Medição de quota real (§57.1) | A tela existe e diz que **não está medindo** — inventar consumo seria mentir sobre o recurso mais crítico da integração |

---

## 7. Como verificar

```bash
# tudo (26 checagens + prova de UI com 77)
bash scripts/ga-smoke-all.sh

# sem a prova de navegador
bash scripts/ga-smoke-all.sh --rapido

# só a UI, nos dois temas
PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
  node tools/screenshot/valida-google-analytics-fase1.mjs
```

O smoke cobre: `php -l` no backend · `tsc --noEmit` · `node --check` no adaptador · as 16 rotas ·
**gate de autenticação (anônimo tem de levar 401)** · **coerência dos números em 4 cenários** ·
estabilidade da semente · catálogo × mapa de telas.

A prova de UI cobre: ordem na sidebar (§8.1) · o painel **montar** · as 21 telas abrindo sem erro
de console · colapso + persistência + ResizeObserver · faixa de dados simulados · rodapé de
procedência em toda tela · achados reais na tela de Tagging · **os dois temas, com prova de que
foram exercitados**.

---

## 8. Próximos passos

**Sem depender de ninguém** (Fase 2): Sankey e mapa em D3 (componentes já existem), Diretoria,
Insights, exportação, ícone no header.

**Dependem de decisão do dono** — as 9 do §10 do doc 00, com estas três na frente:
1. 🔴 **credencial GA4** (destrava a Fase 4 e também o módulo de Ads, que espera a mesma propriedade);
2. 🔴 **e-commerce**: instrumentar a loja ou remover §33/§34/§35 do escopo;
3. **sidebar**: manter em Favoritos (como está) ou criar o grupo "Marketing e Aquisição".

**Maior valor imediato depois da Fase 2**: §32 — Leads GA4 × Pipedrive. É a única conciliação com
**as duas pontas reais**; o resto da §47 seria mock conciliando com mock. O endpoint
`/conversions` já devolve a estrutura de conciliação, hoje com o CRM simulado.
