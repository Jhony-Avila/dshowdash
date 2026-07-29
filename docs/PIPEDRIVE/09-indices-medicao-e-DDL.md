# Índices do PIPE_DSHOW — medição e DDL (#46 / #62)

> **2026-07-29 — ✅ EXECUTADO em produção**, autorizado pelo dono. **A §4 é a proposta, a §7 é o
> que de fato está no banco** — e as duas divergem: um dos 4 índices propostos foi medido como
> inútil e substituído. Para saber o estado real, leia a §7.
>
> **2026-07-29 (levantamento original).**
> Medições feitas com aquecimento e **mediana de 7 tiros** (o primeiro tiro mede cache frio),
> e o ganho de cada índice foi medido numa **cópia sombra** (`CREATE TEMPORARY TABLE` com os
> mesmos dados), nunca na tabela real — conferido ao fim de cada script que produção ficou
> intocada.

---

## 1. O item do backlog estava errado em dois pontos

O #46 dizia: *"`GET /summary` ≈ 250 ms — sem índice em `add_time`/`won_time`"* e
*"`entity-stats?entity=atividades` ≈ 620 ms — sem índice em `done`/`due_date`"*.

| Afirmação do backlog | O que a medição mostra |
|---|---|
| `entity-stats?atividades` custa **620 ms** | Custa **0 ms**. A tela passou a ler `pipe_metrics_*` pré-agregado (#43 ✅). O número era de antes disso. |
| falta índice em `done` / `due_date` | **`ix_done` e `ix_due` já existem** em `pipe_activities`. |
| `/summary` 250 ms se resolve com índice em `add_time` | O tempo (**249–273 ms**) é real, mas **o índice não resolve** — ver §2. |

## 2. Por que o índice sozinho NÃO acelera o `/summary`

`AnalyticsRepository::metricasJanela()` pergunta assim:

```sql
SUM(DATE(add_time) BETWEEN ? AND ?)                    AS criados,
SUM(status='won' AND DATE(won_time) BETWEEN ? AND ?)   AS ganhos, ...
FROM pipe_deals WHERE is_deleted = 0
```

Dois problemas somados:

1. **`DATE(add_time)` envolve a coluna numa função** — o índice deixa de ser utilizável
   (não é *sargable*);
2. a janela não está no `WHERE`, e sim dentro de `SUM(CASE …)`: a consulta **precisa** varrer
   todas as linhas vivas por construção.

Medido na sombra, com `ix_add (add_time)` e `ix_status_won (status, won_time)` criados:

| | tempo | plano |
|---|---|---|
| query real, **sem** índice | **51 ms** | `type=ref key=ix_deleted rows=7145` |
| query real, **com** índice | **67 ms** | `type=ref key=ix_deleted rows=9629` — o índice **não é usado** |
| mesma pergunta, **sargable**, sem índice | 44 ms | `type=ref key=ix_deleted` |
| mesma pergunta, **sargable**, com `ix_add` | **2 ms** | `type=range key=ix_add rows=271` |

As duas formas devolvem o mesmo resultado (conferido: `criados` 256 = 256, `valor_criado`
R$ 10.186.516,25 idêntico).

> **Criar o índice antes de corrigir a consulta paga o custo e não colhe o ganho** — e neste
> caso chegou a piorar 16 ms, porque o otimizador passou a estimar mais linhas.

⚠️ Ao reescrever, usar **`add_time >= :de AND add_time < :dia_seguinte`**, não
`<= :ate`: a coluna é `DATETIME` e `<= '2026-07-29'` corta tudo depois da meia-noite,
perdendo o último dia inteiro da janela.

## 3. Onde o tempo realmente está

Medido pelos **métodos do repositório** (não por SQL solto), instância nova a cada tiro —
repositório com cache de instância mediria o cache, não o banco:

| Caminho | Tempo | Diagnóstico |
|---|---|---|
| `leadSources(0)` — Origem, histórico completo | **783 ms** | O custo é o **parsing de JSON** (`JSON_TYPE`/`JSON_TABLE` sobre `custom_fields`), não a data. Índice em `add_time` **não muda nada** (medido: 49 → 45 ms na parte de data). |
| `leadSources(12 meses)` | 352–396 ms | idem |
| `summary(30)` | **249–273 ms** | §2 — corrigir a consulta primeiro |
| `dealsPage(25)` — grid principal | **255 ms** | ~**126 ms** são as 3 *facets* (`owners` 70 ms + `lost_reasons` 56 ms) **recalculadas a cada página**, embora não mudem entre a página 1 e a 7. Correção de código, **sem DDL**. |
| `forecast()` | 33 ms | ok |
| `entityStats(*)` | 0–5 ms | ok (pré-agregado) |

## 4. DDL proposto — só o que ganhou na medição

Ganho medido na sombra, mesma consulta nas duas tabelas:

> ⚠️ **CORREÇÃO (2026-07-29, na execução):** a primeira linha desta tabela estava **errada** —
> `pipe_deals (update_time)` não serve para a consulta real do grid. Foi criado, medido, e
> **derrubado**; entrou `ix_upd_pd (update_time, pipedrive_id)` no lugar. Detalhe em §7.

| Índice | Consulta | Antes | Depois | Ganho |
|---|---|---|---|---|
| ~~`pipe_deals (update_time)`~~ ❌ **não serve** — ver §7 | grid, ordenação padrão | 40 ms | **0 ms** | medido **numa consulta que o código não executa** (sem o desempate do `ORDER BY`) |
| `pipe_deals (add_time)` | janela por data **após** a correção da §2 | 44 ms | **2 ms** | **95%** |
| `pipe_deals (status, won_time)` | ganhos na janela, idem | 17 ms | **0 ms** | **100%** |
| `pipe_activities (is_deleted, done, due_date)` | contagem por estado | 81 ms | **37 ms** | **54%** — sai de `type=ALL` (88 mil linhas) para `Using index` |

**Descartados por medição** (não entram no DDL):

- `pipe_deals (expected_close_date)` — 8 ms → 7 ms. O otimizador prefere o
  `index_merge(ix_status, ix_deleted)` que já existe.
- `pipe_deals (add_time)` **para a tela de Origem** — o gargalo lá é JSON, não data.

```sql
-- Executar em janela de baixo uso. MySQL 8: ALGORITHM=INPLACE não bloqueia leitura,
-- mas confirme o plano com o DBA antes.
-- Tempo estimado: a criação dos 4 índices na cópia sombra levou ~3,5 s (deals, 19.955
-- linhas) e ~6,7 s (activities, 105.585 linhas), incluindo a cópia dos dados.
-- Custo em disco: hoje pipe_deals tem 6,1 MB de índices e pipe_activities 11,1 MB;
-- cada índice novo nesta escala fica na casa de 0,3–1,5 MB.

ALTER TABLE pipe_deals
  ADD INDEX ix_update_time (update_time),
  ADD INDEX ix_add_time    (add_time),
  ADD INDEX ix_status_won  (status, won_time);

ALTER TABLE pipe_activities
  ADD INDEX ix_del_done_due (is_deleted, done, due_date);
```

**Rollback** (imediato, sem perda de dado — índice não altera linha):

```sql
ALTER TABLE pipe_deals
  DROP INDEX ix_update_time,
  DROP INDEX ix_add_time,
  DROP INDEX ix_status_won;

ALTER TABLE pipe_activities DROP INDEX ix_del_done_due;
```

### Custo de escrita: desprezível

Índice cobra em cada `UPSERT`. Medido nos últimos 7 dias:

- `pipe_deals`: **1.508** registros processados pelo sync, **379** de fato alterados (~54/dia);
- `pipe_activities`: **1.967** processados, **1.028** alterados (~147/dia).

Nessa ordem de grandeza o custo de manutenção dos índices é irrelevante perto do ganho de
leitura. *(À parte: `leads` e `notes` acusavam **336.000** registros processados em 7 dias para
tabelas de 853 e 26.389 linhas. ✅ **Virou o #67 e foi corrigido em 2026-07-29** — o stop-early
parava de paginar, mas só depois de regravar os 500 itens da página 1. E a suspeita de "gasta
quota de API" era **falsa**: 1 chamada por entidade por rodada; o custo era 100% escrita.)*

## 5. Ordem recomendada

1. ~~**Código, sem DDL**~~ ✅ **FEITO em 2026-07-29** — ver §6.
2. ~~**DDL da §4**~~ ✅ **EXECUTADO em 2026-07-29, autorizado pelo dono** — ver §7. ⚠️ **Um dos
   4 índices da §4 estava errado** e foi trocado; a tabela da §4 tem a correção anotada.
3. **Reavaliar `leadSources`** (353 ms medidos após o DDL — índice não muda nada, como previsto)
   por outro caminho: o custo é JSON. Opções: coluna gerada + índice, ou materializar a origem
   numa coluna real durante o sync.

---

## 6. Feito em 2026-07-29 (código, sem DDL)

**`metricasJanela()` e `seriesJanela()` agora são sargable.** O recorte foi para o `WHERE`
sem função sobre a coluna; `DATE()` sobrevive apenas no `SELECT`/`GROUP BY` da série, onde é
inevitável para agrupar por dia e não atrapalha o filtro. Em `seriesJanela`, as duas consultas
sobre `won_time` com filtro idêntico (ganhos e valor_ganho) viraram uma.

| | antes | depois |
|---|---|---|
| `seriesJanela` | 104 ms | **79 ms** |
| `summary(30)` | 249 ms | **222 ms** |
| `metricasJanela` (isolada, já sargable, **com** índice) | — | **3 ms** |

O ganho grande está represado no DDL: sem índice a forma nova apenas empata; com índice ela
cai para 3 ms.

⚠️ **Risco real não era performance, era a conta mudar em silêncio** — são os números da Visão
Geral. `tools/screenshot/valida-pipedrive-summary-sargable.php` mantém a **forma antiga
embutida** e exige resultado idêntico campo a campo e ponto a ponto da série, em 7 janelas
(em curso, ano, semana, janela fechada, dia único, mês fechado, mês antigo de alto volume).
**20 checagens, 0 falha.**

⚠️ E prova a armadilha do limite: no dia **2024-06-13**, que tem **677** negócios criados, a
forma com `<= dia` devolve **0**. Por isso `< dia+1`.

**Facets fora da paginação.** Etapas, donos e motivos são o catálogo da base — não dependem
dos filtros nem mudam ao paginar, mas eram recalculados a cada página. O backend passou a
aceitar `facets=0` (ausente = comportamento antigo, retrocompatível) e o front guarda a
primeira leva.

| | tempo |
|---|---|
| `dealsPage(25)` com facets (1ª carga) | 154 ms |
| `dealsPage(25)` sem facets (ao paginar) | **59 ms** — **62% menos** |

Prova: `tools/screenshot/valida-pipedrive-facets.mjs` — **22 checagens × 2 temas**. O risco
coberto não é tempo, é **filtro vazio ao paginar**: a prova exige que Etapas/Donos/Motivo
continuem populados depois de paginar, que filtrar ainda funcione, e que trocar de entidade
não reaproveite as facets erradas.

---

## 7. EXECUTADO em 2026-07-29 — e o que a execução corrigiu

Aplicado no banco `PIPE_DSHOW` com **`ALGORITHM=INPLACE, LOCK=NONE`** (MySQL 8.0.46), autorizado
pelo dono. `LOCK=NONE` é a trava certa aqui: se o MySQL não pudesse fazer online, ele **erraria**
em vez de bloquear a tabela. Tempo real: **0,44 s** (deals) + **0,73 s** (activities) — muito
abaixo dos ~3,5 s e ~6,7 s estimados na sombra, porque lá o custo incluía copiar os dados.
Índices: `pipe_deals` 6,1 → **8,4 MB**; `pipe_activities` 11,1 → **15,6 MB**.

Backup e rollback prontos em `/backup/pipedrive-ddl-indices-2026-07-29/`
(`esquema-antes.sql` + `ROLLBACK.sql`). ⚠️ O `ROLLBACK.sql` **não é o do §4** — ver abaixo.

### O que estava errado no DDL proposto

`ix_update_time (update_time)` foi criado e **não fez diferença**: a consulta real do grid ficou
em 55,95 ms com ele contra 53,86 ms sem nenhum índice. O `EXPLAIN` explicou — o otimizador
**ignorava** o índice novo e voltava para `ix_deleted` + `Using filesort` sobre 7.304 linhas.

**A causa**: o `ORDER BY` do `dealsPage()` tem desempate — `ORDER BY $sort $dir, d.pipedrive_id
DESC` — e um índice de **coluna única** não satisfaz uma ordenação de duas colunas. O "40 ms →
0 ms" da §4 tinha sido medido numa consulta **sem o desempate**, isto é, numa consulta que o
código não executa. ⚠️ **É a armadilha de medir o SQL reescrito à mão em vez do que o método
monta.** A medição desta execução foi feita chamando `dealsPage()`/`summary()`/`entityStats()`
de verdade, justamente para não repetir isso.

**A correção**: `ix_upd_pd (update_time, pipedrive_id)`, que casa exatamente com o `ORDER BY`.

| consulta real do grid | tempo |
|---|---|
| sem índice nenhum (base) | 53,86 ms |
| com `ix_update_time` (coluna única) | 55,95 ms — **o otimizador não usa** |
| com `ix_upd_pd` (composto) | **1,05 ms** — `Backward index scan`, `rows=50` |

O de coluna única foi **derrubado** (o composto o subsume: qualquer uso de `update_time` como
prefixo é atendido). Índices no banco hoje: `ix_upd_pd`, `ix_add_time`, `ix_status_won` em
`pipe_deals`; `ix_del_done_due` em `pipe_activities`.

### A/B por índice — mesma consulta com e sem, via `IGNORE INDEX`

Feito no mesmo estado do servidor, para isolar o índice do resto do endpoint:

| índice | consulta | sem | com | ganho |
|---|---|---|---|---|
| `ix_add_time` | janela por criação | 44,2 ms | **0,9 ms** | 98% |
| `ix_status_won` | ganhos na janela | 8,4 ms | **0,5 ms** | 94% |
| `ix_del_done_due` | atividades por estado | 142,1 ms | **21,0 ms** | 85% |
| `ix_del_done_due` | agenda do mês | 3,7 ms | **0,5 ms** | 86% |
| `ix_upd_pd` | grid, ordem padrão | 53,9 ms | **1,1 ms** | 98% |

⚠️ O `ix_status_won` partia de 8,4 ms, não dos 17 ms da §4 — o ganho percentual se mantém, a
base era menor.

### Ponta a ponta, pelos métodos reais

| método | antes do DDL | depois | ganho |
|---|---|---|---|
| `dealsPage` página 7 (`facets=0`) | 72,2 ms | **5,4 ms** | **−93%** |
| `summary(30)` | 207,2 ms | **19,3 ms** | **−91%** |
| `summary(90)` | 208,8 ms | **22,3 ms** | −89% |
| `summary(365)` | 247,8 ms | **177,7 ms** | −28% |
| `dealsPage` página 1 (com facets) | 199,6 ms | **104,0 ms** | −48% |
| `entityStats(activities)` | 193,2 ms | **144,7 ms** | −25% |
| `leadSources(12)` — **controle** | 361,5 ms | 353,3 ms | ~0% ✅ |

O **controle importa**: `leadSources` não devia mudar (o custo é parsing de JSON) e não mudou.
Se tivesse mudado, o resto da medição estaria contaminada.

⚠️ **A página 1 do grid continua em 104 ms** e isso **não é o índice**: são as facets — `owners`
64 ms + `lost_reasons` 40 ms. Já mitigado pelo `facets=0` das páginas seguintes (5,4 ms), que é
justamente por que a página 7 despencou e a 1 não.

⚠️ **`entityStats` não é 0 ms para tudo.** A §1 registrou "0 ms" — vale para `deals` (lê
`pipe_metrics_*`). Para `activities` são **145 ms** mesmo depois do índice.

### Custo de escrita: confirmado desprezível

A rodada completa do sync **caiu** de 10.661 ms para **7.253 ms** depois do DDL — o custo de
manter os índices na escrita é menor que o ganho de leitura dentro da própria rodada.

### Correção não mudou nenhuma conta

`valida-pipedrive-summary-sargable.php` — que guarda a **forma antiga embutida** e exige
resultado idêntico campo a campo em 7 janelas — passou com **20/20** depois do DDL. Índice não
deve mudar resultado, e a prova é o que garante isso em vez da confiança. Também verdes:
`cf-colunas` (42), `fila-morta` (47), `marca-dagua` (26), `ciclo-evento` (23); `check-all` no
mesmo 5/6 de sempre; app em 200.
