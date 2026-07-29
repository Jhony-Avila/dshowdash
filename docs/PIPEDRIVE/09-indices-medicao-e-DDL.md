# Índices do PIPE_DSHOW — medição e DDL proposto (#46 / #62)

> **2026-07-29.** Nada aqui foi executado em produção. O DDL da §4 espera aval do dono/DBA.
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

| Índice | Consulta | Antes | Depois | Ganho |
|---|---|---|---|---|
| `pipe_deals (update_time)` | grid, ordenação padrão | 40 ms | **0 ms** | **100%** — elimina o `Using filesort`, vira `Backward index scan` |
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
leitura. *(À parte: `leads` e `notes` acusam **336.000** registros processados em 7 dias para
tabelas de 847 e 26.375 linhas — sinal de que o incremental reprocessa tudo a cada rodada.
Não é assunto de índice; anotado para o #42/#40.)*

## 5. Ordem recomendada

1. ~~**Código, sem DDL**~~ ✅ **FEITO em 2026-07-29** — ver §6.
2. **DDL da §4** — com o dono/DBA, em janela. **Agora vale a pena**: com as consultas
   sargable, `ix_add_time` e `ix_status_won` passam a ser usados de verdade
   (medido: 74 ms → **3 ms**).
3. **Reavaliar `leadSources`** (783 ms) por outro caminho: o custo é JSON. Opções: coluna
   gerada + índice, ou materializar a origem numa coluna real durante o sync.

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
