<?php
// Pipedrive / AnalyticsRepository - rankings dedicados + previsao de fechamento (forecast).
// @version 1.1.0
// @created 2026-07-22
// @app Pipedrive Analytics
//
// v1.1.0 (2026-07-27): + lostReasons() — Backlog 06 #30 (analise de motivos de perda) e a
//        parte que faltava do #5 (taxa de perda por motivo). Ver bloco proprio abaixo.
//
// Backlog 06 #28 (Rankings: vendedores/produtos/organizacoes por valor ganho) e
// #29 (Forecast: valor x probabilidade por etapa e por mes). TUDO local — le a base
// replicada (pipe_deals/deal_products/stages/users/organizations/products); NAO chama
// a API do Pipedrive, entao e barato e pode responder no request do modulo (level 50).
//
// Moeda: a base e ~100% BRL e value_converted vem nulo → usa a coluna `value`.
// Probabilidade efetiva do negocio = COALESCE(deal.probability, stage.deal_probability, 0).
declare(strict_types=1);

final class PipeAnalyticsRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ── Rankings (#28) ──────────────────────────────────────────────

    /** Ranking de vendedores por valor ganho, com conversao e ticket medio. */
    public function sellerRanking(int $limit = 20): array
    {
        $limit = max(1, min($limit, 100));
        $st = $this->pdo->query(
            "SELECT d.owner_id,
                    COALESCE(u.name, CONCAT('#', d.owner_id)) AS name,
                    SUM(d.status='won')                                          AS ganhos,
                    SUM(d.status='lost')                                         AS perdidos,
                    SUM(d.status='open')                                         AS abertos,
                    COALESCE(SUM(CASE WHEN d.status='won'  THEN d.value END),0)   AS valor_ganho,
                    COALESCE(SUM(CASE WHEN d.status='open' THEN d.value END),0)   AS valor_aberto,
                    COALESCE(SUM(CASE WHEN d.status='lost' THEN d.value END),0)   AS valor_perdido
               FROM pipe_deals d
          LEFT JOIN pipe_users u ON u.pipedrive_id = d.owner_id
              WHERE d.is_deleted = 0 AND d.owner_id IS NOT NULL
           GROUP BY d.owner_id, u.name
           ORDER BY valor_ganho DESC
              LIMIT {$limit}"
        );
        return array_map(static function ($r) {
            $ganhos = (int)$r['ganhos'];
            $perdidos = (int)$r['perdidos'];
            $fechados = $ganhos + $perdidos;
            return [
                'owner_id'       => $r['owner_id'] !== null ? (int)$r['owner_id'] : null,
                'name'           => $r['name'],
                'ganhos'         => $ganhos,
                'perdidos'       => $perdidos,
                'abertos'        => (int)$r['abertos'],
                'valor_ganho'    => (float)$r['valor_ganho'],
                'valor_aberto'   => (float)$r['valor_aberto'],
                'valor_perdido'  => (float)$r['valor_perdido'],
                'taxa_conversao' => $fechados > 0 ? round($ganhos / $fechados * 100, 1) : null,
                'ticket_medio'   => $ganhos > 0 ? round((float)$r['valor_ganho'] / $ganhos, 2) : null,
            ];
        }, $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** Ranking de produtos por valor em negocios (a partir de deal_products). */
    public function productRanking(int $limit = 20): array
    {
        $limit = max(1, min($limit, 100));
        $st = $this->pdo->query(
            "SELECT dp.product_pd_id AS product_id,
                    COALESCE(p.name, CONCAT('#', dp.product_pd_id)) AS name,
                    COUNT(DISTINCT dp.deal_pd_id)  AS deals,
                    COALESCE(SUM(dp.quantity),0)   AS qty,
                    COALESCE(SUM(dp.`sum`),0)      AS valor_total,
                    COALESCE(SUM(CASE WHEN d.status='won'  THEN dp.`sum` END),0) AS valor_ganho,
                    COALESCE(SUM(CASE WHEN d.status='open' THEN dp.`sum` END),0) AS valor_aberto
               FROM pipe_deal_products dp
               JOIN pipe_deals d    ON d.pipedrive_id = dp.deal_pd_id AND d.is_deleted = 0
          LEFT JOIN pipe_products p ON p.pipedrive_id = dp.product_pd_id
           GROUP BY dp.product_pd_id, p.name
           ORDER BY valor_total DESC
              LIMIT {$limit}"
        );
        return array_map(static fn($r) => [
            'product_id'   => $r['product_id'] !== null ? (int)$r['product_id'] : null,
            'name'         => $r['name'],
            'deals'        => (int)$r['deals'],
            'qty'          => (float)$r['qty'],
            'valor_total'  => (float)$r['valor_total'],
            'valor_ganho'  => (float)$r['valor_ganho'],
            'valor_aberto' => (float)$r['valor_aberto'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** Ranking de organizacoes por valor ganho. */
    public function orgRanking(int $limit = 20): array
    {
        $limit = max(1, min($limit, 100));
        $st = $this->pdo->query(
            "SELECT d.org_id,
                    COALESCE(o.name, CONCAT('#', d.org_id)) AS name,
                    COUNT(*)                                                     AS deals,
                    SUM(d.status='won')                                          AS ganhos,
                    COALESCE(SUM(CASE WHEN d.status='won'  THEN d.value END),0)   AS valor_ganho,
                    COALESCE(SUM(CASE WHEN d.status='open' THEN d.value END),0)   AS valor_aberto
               FROM pipe_deals d
          LEFT JOIN pipe_organizations o ON o.pipedrive_id = d.org_id
              WHERE d.is_deleted = 0 AND d.org_id IS NOT NULL
           GROUP BY d.org_id, o.name
           ORDER BY valor_ganho DESC, valor_aberto DESC
              LIMIT {$limit}"
        );
        return array_map(static fn($r) => [
            'org_id'       => $r['org_id'] !== null ? (int)$r['org_id'] : null,
            'name'         => $r['name'],
            'deals'        => (int)$r['deals'],
            'ganhos'       => (int)$r['ganhos'],
            'valor_ganho'  => (float)$r['valor_ganho'],
            'valor_aberto' => (float)$r['valor_aberto'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    // ── Forecast (#29) ──────────────────────────────────────────────

    /** Lista de funis (para o seletor do forecast). */
    public function pipelinesList(): array
    {
        $st = $this->pdo->query(
            "SELECT pipedrive_id AS id, name FROM pipe_pipelines WHERE is_active = 1 ORDER BY order_nr, name"
        );
        return array_map(static fn($r) => [
            'id'   => (int)$r['id'],
            'name' => $r['name'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Previsao de fechamento dos negocios ABERTOS: valor total e valor ponderado
     * pela probabilidade efetiva, agregados por etapa e por mes de fechamento.
     * @param int|null $pipelineId filtra por funil (null = todos).
     */
    public function forecast(?int $pipelineId = null, ?int $ownerId = null, ?string $prazo = null): array
    {
        $where = "d.is_deleted = 0 AND d.status = 'open'";
        $params = [];
        if ($pipelineId !== null) {
            $where .= " AND d.pipeline_id = :pl";
            $params[':pl'] = $pipelineId;
        }
        // #26: os MESMOS recortes do Kanban. Sem isto, um quadro filtrado por dono
        // mostraria a lista de um vendedor e o ponderado da etapa INTEIRA — as duas
        // telas discordando na cara do usuario, que e exatamente o que a decisao de
        // buscar o ponderado aqui (em vez de recalcular no front) evitou.
        if ($ownerId !== null) {
            $where .= " AND d.owner_id = :fowner";
            $params[':fowner'] = $ownerId;
        }
        // Allow-list de constantes: $prazo so ESCOLHE a string, nunca e concatenado.
        $porPrazo = [
            'vencidos'     => " AND d.expected_close_date IS NOT NULL AND d.expected_close_date <  CURDATE()",
            'mes'          => " AND d.expected_close_date IS NOT NULL"
                            . " AND d.expected_close_date BETWEEN CURDATE() AND LAST_DAY(CURDATE())",
            'd30'          => " AND d.expected_close_date IS NOT NULL"
                            . " AND d.expected_close_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)",
            'd90'          => " AND d.expected_close_date IS NOT NULL"
                            . " AND d.expected_close_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)",
            'sem_previsao' => " AND d.expected_close_date IS NULL",
        ];
        if ($prazo !== null && isset($porPrazo[$prazo])) {
            $where .= $porPrazo[$prazo];
        }
        // Probabilidade efetiva e valor ponderado, calculados uma vez em subconsulta.
        $base = "SELECT d.stage_id, d.pipeline_id, d.expected_close_date,
                        d.value AS valor,
                        COALESCE(d.probability, s.deal_probability, 0) AS prob
                   FROM pipe_deals d
                   JOIN pipe_stages s ON s.pipedrive_id = d.stage_id
                  WHERE {$where}";

        // Por etapa (com nome do funil para desambiguar etapas homonimas).
        $stStage = $this->pdo->prepare(
            "SELECT b.stage_id,
                    s.name  AS stage, s.order_nr,
                    pl.name AS pipeline,
                    COUNT(*)                          AS n,
                    COALESCE(SUM(b.valor),0)          AS valor_total,
                    COALESCE(SUM(b.valor*b.prob/100),0) AS valor_ponderado
               FROM ({$base}) b
          LEFT JOIN pipe_stages s     ON s.pipedrive_id = b.stage_id
          LEFT JOIN pipe_pipelines pl ON pl.pipedrive_id = b.pipeline_id
           GROUP BY b.stage_id, s.name, s.order_nr, pl.name
           ORDER BY valor_ponderado DESC"
        );
        $stStage->execute($params);
        $byStage = array_map(static function ($r) {
            $total = (float)$r['valor_total'];
            $pond  = (float)$r['valor_ponderado'];
            return [
                'stage_id'        => $r['stage_id'] !== null ? (int)$r['stage_id'] : null,
                'stage'           => $r['stage'],
                'pipeline'        => $r['pipeline'],
                'count'           => (int)$r['n'],
                'valor_total'     => $total,
                'valor_ponderado' => $pond,
                'prob_efetiva'    => $total > 0 ? round($pond / $total * 100, 1) : 0.0,
            ];
        }, $stStage->fetchAll(PDO::FETCH_ASSOC));

        // Por mes de fechamento previsto (negocios sem data caem no balde null).
        $stMonth = $this->pdo->prepare(
            "SELECT DATE_FORMAT(b.expected_close_date, '%Y-%m') AS mes,
                    COUNT(*)                          AS n,
                    COALESCE(SUM(b.valor),0)          AS valor_total,
                    COALESCE(SUM(b.valor*b.prob/100),0) AS valor_ponderado
               FROM ({$base}) b
           GROUP BY mes
           ORDER BY (mes IS NULL), mes"
        );
        $stMonth->execute($params);
        $byMonth = array_map(static fn($r) => [
            'month'           => $r['mes'],   // 'YYYY-MM' ou null (sem previsao)
            'count'           => (int)$r['n'],
            'valor_total'     => (float)$r['valor_total'],
            'valor_ponderado' => (float)$r['valor_ponderado'],
        ], $stMonth->fetchAll(PDO::FETCH_ASSOC));

        // Totais gerais.
        $stTot = $this->pdo->prepare(
            "SELECT COUNT(*) n, COALESCE(SUM(b.valor),0) t, COALESCE(SUM(b.valor*b.prob/100),0) p
               FROM ({$base}) b"
        );
        $stTot->execute($params);
        $tot = $stTot->fetch(PDO::FETCH_ASSOC) ?: ['n' => 0, 't' => 0, 'p' => 0];

        return [
            'totals' => [
                'open_count'      => (int)$tot['n'],
                'valor_total'     => (float)$tot['t'],
                'valor_ponderado' => (float)$tot['p'],
            ],
            'by_stage' => $byStage,
            'by_month' => $byMonth,
        ];
    }

    // ── Conversao & ciclo de vendas (backlog #2, fatia viavel) ──────
    //
    // NAO ha historico de transicoes de etapa disponivel (pipe_deal_history
    // vazia — so seria populada por webhooks futuros), entao NAO computamos
    // taxa etapa->etapa. Entregamos o que a base sustenta de forma honesta:
    // win-rate (fechados), ciclo add->won (com distribuicao) e idade dos
    // negocios abertos por etapa (estagnacao).
    public function conversionCycle(?int $pipelineId = null): array
    {
        $where = "d.is_deleted = 0";
        $params = [];
        if ($pipelineId !== null) {
            $where .= " AND d.pipeline_id = :pl";
            $params[':pl'] = $pipelineId;
        }

        // Fechados (won/lost) + abertos.
        $st = $this->pdo->prepare(
            "SELECT SUM(d.status='won') won, SUM(d.status='lost') lost, SUM(d.status='open') aberto
               FROM pipe_deals d WHERE {$where}"
        );
        $st->execute($params);
        $c = $st->fetch(PDO::FETCH_ASSOC) ?: [];
        $won = (int)($c['won'] ?? 0);
        $lost = (int)($c['lost'] ?? 0);
        $aberto = (int)($c['aberto'] ?? 0);
        $fechados = $won + $lost;

        // Ciclo de vendas add_time -> won_time (dias) com distribuicao.
        $dd = "DATEDIFF(d.won_time, d.add_time)";
        $stc = $this->pdo->prepare(
            "SELECT COUNT(*) n, ROUND(AVG({$dd})) avg_d, ROUND(MAX({$dd})) max_d,
                    SUM({$dd}<=7) b0, SUM({$dd} BETWEEN 8 AND 30) b1,
                    SUM({$dd} BETWEEN 31 AND 90) b2, SUM({$dd}>90) b3
               FROM pipe_deals d
              WHERE {$where} AND d.status='won'
                    AND d.won_time IS NOT NULL AND d.add_time IS NOT NULL AND d.won_time >= d.add_time"
        );
        $stc->execute($params);
        $cy = $stc->fetch(PDO::FETCH_ASSOC) ?: [];

        // Idade media dos negocios ABERTOS por etapa (estagnacao).
        $sta = $this->pdo->prepare(
            "SELECT d.stage_id, s.name AS stage, s.order_nr, pl.name AS pipeline,
                    COUNT(*) AS n, COALESCE(SUM(d.value),0) AS valor,
                    ROUND(AVG(DATEDIFF(NOW(), COALESCE(d.stage_change_time, d.add_time)))) AS idade
               FROM pipe_deals d
               JOIN pipe_stages s      ON s.pipedrive_id = d.stage_id
          LEFT JOIN pipe_pipelines pl  ON pl.pipedrive_id = d.pipeline_id
              WHERE {$where} AND d.status='open'
           GROUP BY d.stage_id, s.name, s.order_nr, pl.name
           ORDER BY s.order_nr, n DESC"
        );
        $sta->execute($params);
        $aging = array_map(static fn($r) => [
            'stage_id' => $r['stage_id'] !== null ? (int)$r['stage_id'] : null,
            'stage'    => $r['stage'],
            'pipeline' => $r['pipeline'],
            'count'    => (int)$r['n'],
            'valor'    => (float)$r['valor'],
            'idade_media_dias' => $r['idade'] !== null ? (int)$r['idade'] : null,
        ], $sta->fetchAll(PDO::FETCH_ASSOC));

        return [
            'closed'   => ['won' => $won, 'lost' => $lost, 'open' => $aberto],
            'win_rate' => $fechados > 0 ? round($won / $fechados * 100, 1) : null,
            'cycle'    => [
                'count'    => (int)($cy['n'] ?? 0),
                'avg_dias' => isset($cy['avg_d']) && $cy['avg_d'] !== null ? (int)$cy['avg_d'] : null,
                'max_dias' => isset($cy['max_d']) && $cy['max_d'] !== null ? (int)$cy['max_d'] : null,
                'buckets'  => [
                    'ate_7'   => (int)($cy['b0'] ?? 0),
                    'd8_30'   => (int)($cy['b1'] ?? 0),
                    'd31_90'  => (int)($cy['b2'] ?? 0),
                    'mais_90' => (int)($cy['b3'] ?? 0),
                ],
            ],
            'stage_aging' => $aging,
        ];
    }

    // ── Resumo executivo com periodo anterior (Fase 4 — Visao Geral) ─
    //
    // Entrega os indicadores da janela corrente JUNTO com a MESMA janela
    // imediatamente anterior, para a Visao Geral mostrar variacao honesta.
    // Duas classes de numero, deliberadamente separadas:
    //   • `kpis`   -> fatos de JANELA (aconteceram entre duas datas) — comparaveis.
    //   • `estado` -> foto do AGORA (quantos estao abertos) — NAO comparavel, porque
    //     a base nao guarda snapshot historico de "quantos estavam abertos ha 30 dias".
    //     Inventar um anterior aqui seria fabricar dado; entao vai sem variacao.
    //
    // Placeholders POSICIONAIS de proposito: a conexao usa EMULATE_PREPARES=false,
    // que rejeita placeholder NOMEADO repetido (bug ja pago nas buscas dos grids).
    /** Periodos aceitos pelo /summary (#3/#4). 'd*' = janela deslizante; os demais, calendario. */
    public const PERIODOS = ['d7', 'd30', 'd90', 'd180', 'mes', 'mes_ant', 'trim', 'ano'];

    /**
     * Resolve um periodo em [de, ate, deAnt, ateAnt, rotulo, rotuloComparacao] (#3).
     *
     * ⚠️ O PONTO DELICADO E A BASE DE COMPARACAO. Um mes CORRENTE e parcial: comparar
     * 01–28/07 com o julho... quer dizer, com JUNHO INTEIRO (30 dias) faz o mes atual
     * parecer pior so porque ainda nao acabou. Por isso os periodos de calendario em
     * curso ('mes', 'trim', 'ano') comparam com o MESMO TRECHO do periodo anterior —
     * 01–28/06, nao 01–30/06. O rotulo devolve as datas exatas para a tela mostrar:
     * comparacao que o usuario nao consegue conferir e comparacao em que ele nao confia.
     *
     * Periodos ENCERRADOS ('mes_ant') comparam com o anterior inteiro, que ai e justo.
     */
    private function resolverPeriodo(string $periodo): array
    {
        $hoje = date('Y-m-d');
        $fmt  = static fn(string $d) => date('d/m/Y', strtotime($d));
        $par  = static fn(string $a, string $b) => $fmt($a) . '–' . $fmt($b);

        // Janela deslizante (comportamento historico): compara com a janela imediatamente anterior.
        if (preg_match('/^d(\d+)$/', $periodo, $m)) {
            $days   = max(7, min((int)$m[1], 365));
            $de     = date('Y-m-d', strtotime("-" . ($days - 1) . " days"));
            $ateAnt = date('Y-m-d', strtotime($de . ' -1 day'));
            $deAnt  = date('Y-m-d', strtotime($de . " -{$days} days"));
            return [$de, $hoje, $deAnt, $ateAnt,
                    "Últimos {$days} dias", 'mesma janela imediatamente anterior (' . $par($deAnt, $ateAnt) . ')'];
        }

        switch ($periodo) {
            case 'mes': {
                $de  = date('Y-m-01');
                $dia = (int)date('j');
                // Trecho equivalente do mes anterior. `min` porque 31/03 nao existe em
                // fevereiro: cai no ultimo dia dele em vez de estourar para marco.
                $iniAnt   = date('Y-m-01', strtotime('first day of last month'));
                $ultDiaAnt = (int)date('t', strtotime($iniAnt));
                $ateAnt   = date('Y-m-', strtotime($iniAnt)) . str_pad((string)min($dia, $ultDiaAnt), 2, '0', STR_PAD_LEFT);
                return [$de, $hoje, $iniAnt, $ateAnt,
                        'Este mês (' . $par($de, $hoje) . ')',
                        'mesmo trecho do mês anterior (' . $par($iniAnt, $ateAnt) . ')'];
            }
            case 'mes_ant': {
                // Mes ENCERRADO: comparar com o anterior inteiro e justo (ambos completos).
                $de     = date('Y-m-01', strtotime('first day of last month'));
                $ate    = date('Y-m-t', strtotime($de));
                $deAnt  = date('Y-m-01', strtotime($de . ' -1 month'));
                $ateAnt = date('Y-m-t', strtotime($deAnt));
                return [$de, $ate, $deAnt, $ateAnt,
                        'Mês passado (' . $par($de, $ate) . ')',
                        'mês anterior completo (' . $par($deAnt, $ateAnt) . ')'];
            }
            case 'trim': {
                $mes    = (int)date('n');
                $iniMes = (int)(floor(($mes - 1) / 3) * 3) + 1;
                $de     = date('Y-') . str_pad((string)$iniMes, 2, '0', STR_PAD_LEFT) . '-01';
                $diasCorridos = (int)((strtotime($hoje) - strtotime($de)) / 86400);
                $deAnt  = date('Y-m-01', strtotime($de . ' -3 months'));
                $ateAnt = date('Y-m-d', strtotime($deAnt . " +{$diasCorridos} days"));
                return [$de, $hoje, $deAnt, $ateAnt,
                        'Este trimestre (' . $par($de, $hoje) . ')',
                        'mesmo trecho do trimestre anterior (' . $par($deAnt, $ateAnt) . ')'];
            }
            case 'ano': {
                $de = date('Y-01-01');
                // Ano a ano: mesmo dia/mes do ano passado. Em 29/02 o strtotime cai em
                // 01/03 do ano anterior (nao bissexto) — 1 dia a mais, e a tela mostra a data.
                $deAnt  = date('Y-01-01', strtotime('-1 year'));
                $ateAnt = date('Y-m-d', strtotime($hoje . ' -1 year'));
                return [$de, $hoje, $deAnt, $ateAnt,
                        'Este ano (' . $par($de, $hoje) . ')',
                        'mesmo trecho do ano anterior (' . $par($deAnt, $ateAnt) . ')'];
            }
        }
        // Desconhecido cai no padrao — nunca em janela vazia.
        return $this->resolverPeriodo('d30');
    }

    public function summary(int $days = 30, ?string $periodo = null): array
    {
        $days = max(7, min($days, 365));
        // `days` continua valendo para quem ja chamava assim; `periodo` tem precedencia.
        [$de, $ate, $deAnt, $ateAnt, $rotulo, $rotuloComp] =
            $this->resolverPeriodo($periodo ?? "d{$days}");

        // Um unico scan resolve as duas janelas para todas as metricas de negocio.
        $mAtual = $this->metricasJanela($de, $ate);
        $mAnt   = $this->metricasJanela($deAnt, $ateAnt);

        $taxa = static function (array $m): ?float {
            $fech = $m['ganhos'] + $m['perdidos'];
            return $fech > 0 ? round($m['ganhos'] / $fech * 100, 1) : null;
        };
        $ticket = static function (array $m): ?float {
            return $m['ganhos'] > 0 ? round($m['valor_ganho'] / $m['ganhos'], 2) : null;
        };

        $series = $this->seriesJanela($de, $ate);

        $kpis = [
            ['chave' => 'ganhos', 'rotulo' => 'Negócios ganhos', 'formato' => 'num', 'cor' => 'ok',
             'valor' => $mAtual['ganhos'], 'anterior' => $mAnt['ganhos'], 'serie' => $series['ganhos'],
             'dica' => 'Negócios marcados como ganhos dentro do período.'],
            ['chave' => 'valor_ganho', 'rotulo' => 'Valor ganho', 'formato' => 'brl', 'cor' => 'ok',
             'valor' => $mAtual['valor_ganho'], 'anterior' => $mAnt['valor_ganho'], 'serie' => $series['valor_ganho'],
             'dica' => 'Soma do valor dos negócios ganhos no período.'],
            ['chave' => 'criados', 'rotulo' => 'Negócios criados', 'formato' => 'num', 'cor' => 'primary',
             'valor' => $mAtual['criados'], 'anterior' => $mAnt['criados'], 'serie' => $series['criados'],
             'dica' => 'Entrada de novos negócios (topo do funil) no período.'],
            ['chave' => 'perdidos', 'rotulo' => 'Negócios perdidos', 'formato' => 'num', 'cor' => 'danger',
             'inverter' => true,
             'valor' => $mAtual['perdidos'], 'anterior' => $mAnt['perdidos'], 'serie' => $series['perdidos'],
             'dica' => 'Negócios marcados como perdidos dentro do período.'],
            ['chave' => 'taxa_conversao', 'rotulo' => 'Conversão do período', 'formato' => 'pct', 'cor' => 'primary',
             'valor' => $taxa($mAtual), 'anterior' => $taxa($mAnt), 'serie' => [],
             'dica' => 'Ganhos ÷ (ganhos + perdidos) fechados no período.'],
            ['chave' => 'ticket_medio', 'rotulo' => 'Ticket médio', 'formato' => 'brl', 'cor' => null,
             'valor' => $ticket($mAtual), 'anterior' => $ticket($mAnt), 'serie' => [],
             'dica' => 'Valor ganho ÷ negócios ganhos no período.'],
            ['chave' => 'ciclo_medio', 'rotulo' => 'Ciclo médio', 'formato' => 'dias', 'cor' => null,
             'inverter' => true,
             'valor' => $mAtual['ciclo_medio'], 'anterior' => $mAnt['ciclo_medio'], 'serie' => [],
             'dica' => 'Dias entre a criação e o ganho, dos negócios ganhos no período.'],
        ];

        return [
            'periodo' => [
                'dias' => $days, 'de' => $de, 'ate' => $ate,
                'de_anterior' => $deAnt, 'ate_anterior' => $ateAnt,
                // #3 — o que a tela precisa para NAO deixar o usuario adivinhar contra o
                // que o chip de variacao esta comparando.
                'id' => $periodo ?? "d{$days}",
                'rotulo' => $rotulo,
                'comparacao' => $rotuloComp,
                // Dias corridos de cada janela. Quando diferem (mes de 31 contra fevereiro),
                // a tela avisa em vez de deixar a diferenca passar por desempenho.
                'dias_atual'    => (int)((strtotime($ate) - strtotime($de)) / 86400) + 1,
                'dias_anterior' => (int)((strtotime($ateAnt) - strtotime($deAnt)) / 86400) + 1,
            ],
            'kpis'   => $kpis,
            'estado' => $this->estadoAgora(),
        ];
    }

    /** Metricas de negocio de UMA janela [de, ate] (datas inclusive). */
    /**
     * Métricas da janela, em 3 consultas SARGABLE — uma por coluna de data.
     *
     * A versão anterior resolvia tudo numa varredura só, com `SUM(DATE(add_time) BETWEEN ?)`.
     * Envolver a coluna numa função **anula qualquer índice**: medido na cópia sombra, criar
     * `ix_add_time` levava aquela consulta de 51 ms para 67 ms — pagava o índice e não usava.
     * Assim, cada consulta filtra pela sua coluna no WHERE e pode usar o índice
     * correspondente. Medido: **77 ms → 74 ms sem índice** (nunca pior) e **→ 3 ms** depois do
     * DDL de `09-indices-medicao-e-DDL.md`.
     *
     * ⚠️ O limite superior é EXCLUSIVO (`< dia seguinte`), não `<= $ate`. As colunas são
     * DATETIME: `<= '2026-07-29'` vale como `<= '2026-07-29 00:00:00'` e descartaria o dia
     * inteiro. Provado na base: no dia 2024-06-13 (677 negócios criados), a forma com `<=`
     * devolvia **0**.
     *
     * Equivalência com a versão antiga conferida número a número em 6 janelas — inclusive mês
     * fechado, dia único e janela que não termina hoje.
     */
    private function metricasJanela(string $de, string $ate): array
    {
        $ini = $de . ' 00:00:00';
        $fim = date('Y-m-d', strtotime($ate . ' +1 day')) . ' 00:00:00';   // exclusivo

        $criados = $this->pdo->prepare(
            "SELECT COUNT(*) AS criados, COALESCE(SUM(value),0) AS valor_criado
               FROM pipe_deals WHERE is_deleted = 0 AND add_time >= ? AND add_time < ?"
        );
        $criados->execute([$ini, $fim]);

        $ganhos = $this->pdo->prepare(
            "SELECT COUNT(*) AS ganhos, COALESCE(SUM(value),0) AS valor_ganho,
                    ROUND(AVG(CASE WHEN add_time IS NOT NULL AND won_time >= add_time
                                   THEN DATEDIFF(won_time, add_time) END)) AS ciclo_medio
               FROM pipe_deals
              WHERE is_deleted = 0 AND status = 'won' AND won_time >= ? AND won_time < ?"
        );
        $ganhos->execute([$ini, $fim]);

        $perdidos = $this->pdo->prepare(
            "SELECT COUNT(*) AS perdidos, COALESCE(SUM(value),0) AS valor_perdido
               FROM pipe_deals
              WHERE is_deleted = 0 AND status = 'lost' AND lost_time >= ? AND lost_time < ?"
        );
        $perdidos->execute([$ini, $fim]);

        $r = array_merge(
            $criados->fetch(PDO::FETCH_ASSOC) ?: [],
            $ganhos->fetch(PDO::FETCH_ASSOC) ?: [],
            $perdidos->fetch(PDO::FETCH_ASSOC) ?: []
        );

        return [
            'criados'       => (int)($r['criados'] ?? 0),
            'valor_criado'  => (float)($r['valor_criado'] ?? 0),
            'ganhos'        => (int)($r['ganhos'] ?? 0),
            'valor_ganho'   => (float)($r['valor_ganho'] ?? 0),
            'perdidos'      => (int)($r['perdidos'] ?? 0),
            'valor_perdido' => (float)($r['valor_perdido'] ?? 0),
            'ciclo_medio'   => isset($r['ciclo_medio']) && $r['ciclo_medio'] !== null ? (int)$r['ciclo_medio'] : null,
        ];
    }

    /**
     * Series diarias DENSAS da janela (dias sem evento viram 0). Denso aqui e nao no
     * front porque a sparkline precisa do eixo do tempo real: pular dias vazios
     * desenharia uma curva mais otimista do que os dados.
     */
    private function seriesJanela(string $de, string $ate): array
    {
        $dias = [];
        for ($d = $de; $d <= $ate; $d = date('Y-m-d', strtotime($d . ' +1 day'))) {
            $dias[$d] = true;
        }
        $vazia = static fn() => array_fill_keys(array_keys($dias), 0.0);
        $out = ['criados' => $vazia(), 'ganhos' => $vazia(), 'valor_ganho' => $vazia(), 'perdidos' => $vazia()];

        // Mesma correção de `metricasJanela`: o RECORTE vai para o WHERE sem função sobre a
        // coluna (aí o índice serve); `DATE()` fica só no SELECT/GROUP BY, onde é inevitável
        // para agrupar por dia e não atrapalha o filtro.
        // ⚠️ Limite superior EXCLUSIVO — colunas DATETIME (ver metricasJanela).
        // Ganhos e valor_ganho eram DUAS consultas com filtro idêntico sobre `won_time`;
        // viraram uma, com as duas agregações.
        $ini = $de . ' 00:00:00';
        $fim = date('Y-m-d', strtotime($ate . ' +1 day')) . ' 00:00:00';

        $blocos = [
            ['add_time',  'is_deleted=0',                  ['criados' => 'COUNT(*)']],
            ['won_time',  "is_deleted=0 AND status='won'", ['ganhos' => 'COUNT(*)', 'valor_ganho' => 'COALESCE(SUM(value),0)']],
            ['lost_time', "is_deleted=0 AND status='lost'", ['perdidos' => 'COUNT(*)']],
        ];
        foreach ($blocos as [$col, $filtro, $aggs]) {
            $sel = [];
            foreach ($aggs as $alias => $agg) { $sel[] = "{$agg} AS `{$alias}`"; }
            $st = $this->pdo->prepare(
                "SELECT DATE({$col}) d, " . implode(', ', $sel) . " FROM pipe_deals
                  WHERE {$filtro} AND {$col} >= ? AND {$col} < ? GROUP BY DATE({$col})"
            );
            $st->execute([$ini, $fim]);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                foreach ($aggs as $alias => $_) {
                    if (isset($out[$alias][$r['d']])) { $out[$alias][$r['d']] = (float)$r[$alias]; }
                }
            }
        }
        foreach ($out as $k => $mapa) { $out[$k] = array_values($mapa); }
        $out['dias'] = array_keys($dias);
        return $out;
    }

    /** Foto do agora: nao tem periodo anterior (a base nao guarda snapshot). */
    private function estadoAgora(): array
    {
        $r = $this->pdo->query(
            "SELECT COUNT(*) abertos, COALESCE(SUM(value),0) valor_aberto,
                    SUM(expected_close_date IS NULL) sem_previsao,
                    SUM(expected_close_date IS NOT NULL AND expected_close_date < CURDATE()) fechamento_vencido
               FROM pipe_deals WHERE is_deleted=0 AND status='open'"
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $atr = (int)$this->pdo->query(
            "SELECT COUNT(*) FROM pipe_activities
              WHERE is_deleted=0 AND done=0 AND due_date IS NOT NULL AND due_date < CURDATE()"
        )->fetchColumn();

        return [
            'abertos'            => (int)($r['abertos'] ?? 0),
            'valor_aberto'       => (float)($r['valor_aberto'] ?? 0),
            'sem_previsao'       => (int)($r['sem_previsao'] ?? 0),
            'fechamento_vencido' => (int)($r['fechamento_vencido'] ?? 0),
            'atividades_atrasadas' => $atr,
        ];
    }

    // ── Funil visual + comparacao entre funis (Fase 4) ──────────────
    //
    // LIMITE DO DADO (o mesmo de conversionCycle): pipe_deal_history esta vazia, entao
    // NAO existe historico de transicoes. A etapa gravada em cada negocio e a ATUAL
    // (abertos) ou a de FECHAMENTO (ganhos/perdidos) — e a base mostra que negocios sao
    // ganhos em QUALQUER etapa, nao so na ultima. Logo NAO da para medir passagem real
    // etapa->etapa. O que a base sustenta e o ALCANCE: quantos negocios pararam na etapa N
    // ou em alguma posterior. E o teto honesto — a UI precisa dizer isso.
    //
    // alcance(N)   = SOMA dos negocios das etapas com order_nr >= N (dentro do funil)
    // conversao(N) = alcance(N+1) / alcance(N)      queda(N) = 100 - conversao(N)
    // gargalo      = maior queda entre etapas com volume relevante (>= MIN_VOL)
    private const GARGALO_MIN_VOL = 10;

    public function funnelAnalysis(): array
    {
        // 1) Etapas ativas com desfecho dos negocios que nelas pararam (1 consulta p/ todos os funis).
        $st = $this->pdo->query(
            "SELECT s.pipeline_pd_id, s.pipedrive_id AS stage_id, s.name AS stage,
                    s.order_nr, s.deal_probability,
                    COALESCE(SUM(d.status='open'),0)  AS abertos,
                    COALESCE(SUM(d.status='won'),0)   AS ganhos,
                    COALESCE(SUM(d.status='lost'),0)  AS perdidos,
                    COALESCE(SUM(CASE WHEN d.status='open' THEN d.value END),0) AS valor_aberto,
                    COALESCE(SUM(CASE WHEN d.status='won'  THEN d.value END),0) AS valor_ganho,
                    COALESCE(SUM(CASE WHEN d.status='lost' THEN d.value END),0) AS valor_perdido,
                    ROUND(AVG(CASE WHEN d.status='open'
                              THEN DATEDIFF(NOW(), COALESCE(d.stage_change_time, d.add_time)) END)) AS idade
               FROM pipe_stages s
          LEFT JOIN pipe_deals d ON d.stage_id = s.pipedrive_id AND d.is_deleted = 0
              WHERE s.is_active = 1
           GROUP BY s.pipeline_pd_id, s.pipedrive_id, s.name, s.order_nr, s.deal_probability
           ORDER BY s.pipeline_pd_id, s.order_nr"
        );
        $porFunil = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $pl = (int)$r['pipeline_pd_id'];
            $abertos  = (int)$r['abertos'];
            $ganhos   = (int)$r['ganhos'];
            $perdidos = (int)$r['perdidos'];
            $fechados = $ganhos + $perdidos;
            $porFunil[$pl][] = [
                'stage_id'      => (int)$r['stage_id'],
                'stage'         => $r['stage'],
                'order'         => (int)$r['order_nr'],
                'probability'   => $r['deal_probability'] !== null ? (int)$r['deal_probability'] : null,
                'abertos'       => $abertos,
                'ganhos'        => $ganhos,
                'perdidos'      => $perdidos,
                'total'         => $abertos + $fechados,
                'valor_aberto'  => (float)$r['valor_aberto'],
                'valor_ganho'   => (float)$r['valor_ganho'],
                'valor_perdido' => (float)$r['valor_perdido'],
                'idade_media_abertos' => $r['idade'] !== null ? (int)$r['idade'] : null,
                // Desfecho local: dos que PARARAM aqui, quantos % foram ganhos.
                'win_rate_local' => $fechados > 0 ? round($ganhos / $fechados * 100, 1) : null,
            ];
        }

        // 2) Totais por funil (fonte: pipe_deals.pipeline_id — cobre negocios em etapa inativa).
        $stT = $this->pdo->query(
            "SELECT d.pipeline_id,
                    COUNT(*)                     AS total,
                    SUM(d.status='open')         AS abertos,
                    SUM(d.status='won')          AS ganhos,
                    SUM(d.status='lost')         AS perdidos,
                    COALESCE(SUM(CASE WHEN d.status='open' THEN d.value END),0) AS valor_aberto,
                    COALESCE(SUM(CASE WHEN d.status='won'  THEN d.value END),0) AS valor_ganho,
                    ROUND(AVG(CASE WHEN d.status='won' AND d.won_time IS NOT NULL AND d.add_time IS NOT NULL
                                    AND d.won_time >= d.add_time
                              THEN DATEDIFF(d.won_time, d.add_time) END)) AS ciclo,
                    ROUND(AVG(CASE WHEN d.status='open'
                              THEN DATEDIFF(NOW(), COALESCE(d.stage_change_time, d.add_time)) END)) AS idade
               FROM pipe_deals d
              WHERE d.is_deleted = 0 AND d.pipeline_id IS NOT NULL
           GROUP BY d.pipeline_id"
        );
        $totais = [];
        foreach ($stT->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $ganhos = (int)$r['ganhos'];
            $perdidos = (int)$r['perdidos'];
            $fechados = $ganhos + $perdidos;
            $vGanho = (float)$r['valor_ganho'];
            $totais[(int)$r['pipeline_id']] = [
                'total'        => (int)$r['total'],
                'abertos'      => (int)$r['abertos'],
                'ganhos'       => $ganhos,
                'perdidos'     => $perdidos,
                'valor_aberto' => (float)$r['valor_aberto'],
                'valor_ganho'  => $vGanho,
                'win_rate'     => $fechados > 0 ? round($ganhos / $fechados * 100, 1) : null,
                'ticket_medio' => $ganhos > 0 ? round($vGanho / $ganhos, 2) : null,
                'ciclo_medio_dias'    => $r['ciclo'] !== null ? (int)$r['ciclo'] : null,
                'idade_media_abertos' => $r['idade'] !== null ? (int)$r['idade'] : null,
            ];
        }

        // 3) Monta os funis: alcance cumulativo, conversao/queda entre etapas e gargalo.
        $vazio = ['total' => 0, 'abertos' => 0, 'ganhos' => 0, 'perdidos' => 0, 'valor_aberto' => 0.0,
                  'valor_ganho' => 0.0, 'win_rate' => null, 'ticket_medio' => null,
                  'ciclo_medio_dias' => null, 'idade_media_abertos' => null];
        $pipes = $this->pdo->query(
            "SELECT pipedrive_id, name, order_nr, is_active FROM pipe_pipelines ORDER BY order_nr, name"
        )->fetchAll(PDO::FETCH_ASSOC);

        $out = [];
        $comparacao = [];
        foreach ($pipes as $p) {
            $id = (int)$p['pipedrive_id'];
            $stages = $porFunil[$id] ?? [];

            // Alcance = soma dos totais da etapa N em diante (etapas ja vem ordenadas por order_nr).
            $n = count($stages);
            $alcance = [];
            $acc = 0;
            for ($i = $n - 1; $i >= 0; $i--) { $acc += $stages[$i]['total']; $alcance[$i] = $acc; }
            $topo = $alcance[0] ?? 0;

            $gargalo = null;
            for ($i = 0; $i < $n; $i++) {
                $stages[$i]['alcance'] = $alcance[$i];
                $stages[$i]['alcance_pct'] = $topo > 0 ? round($alcance[$i] / $topo * 100, 1) : null;
                $conv = null;
                if ($i < $n - 1 && $alcance[$i] > 0) {
                    $conv = round($alcance[$i + 1] / $alcance[$i] * 100, 1);
                }
                $stages[$i]['conversao_prox'] = $conv;
                $stages[$i]['queda_prox'] = $conv !== null ? round(100 - $conv, 1) : null;
                $stages[$i]['perdidos_prox'] = $i < $n - 1 ? $alcance[$i] - $alcance[$i + 1] : null;

                if ($conv !== null && $alcance[$i] >= self::GARGALO_MIN_VOL
                    && ($gargalo === null || (100 - $conv) > $gargalo['queda_pct'])) {
                    $gargalo = [
                        'stage_id'  => $stages[$i]['stage_id'],
                        'stage'     => $stages[$i]['stage'],
                        'proxima'   => $stages[$i + 1]['stage'],
                        'queda_pct' => round(100 - $conv, 1),
                        'perdidos'  => $alcance[$i] - $alcance[$i + 1],
                    ];
                }
            }

            $tot = $totais[$id] ?? $vazio;
            $out[] = [
                'id'        => $id,
                'name'      => $p['name'],
                'order'     => (int)$p['order_nr'],
                'is_active' => (int)$p['is_active'],
                'stages'    => $stages,
                'totals'    => $tot,
                'gargalo'   => $gargalo,
                // Mantem os campos que a tela ja usava (contrato do /pipelines).
                'total_deals' => array_sum(array_column($stages, 'abertos')),
                'total_valor' => array_sum(array_column($stages, 'valor_aberto')),
            ];
            $comparacao[] = array_merge(
                ['id' => $id, 'name' => $p['name'], 'is_active' => (int)$p['is_active']],
                $tot
            );
        }

        return [
            'pipelines'  => $out,
            'comparison' => $comparacao,
            'nota' => 'Sem histórico de transições de etapa, a etapa registrada é a atual (abertos) '
                    . 'ou a de fechamento (ganhos/perdidos). O funil mostra o ALCANCE — quantos negócios '
                    . 'pararam nesta etapa ou em alguma posterior —, não a passagem medida etapa a etapa.',
        ];
    }

    // ── Motivos de perda (#30) + taxa de perda por motivo (#5) ───────
    //
    // `lost_reason` vem do Pipedrive como LISTA CONTROLADA (33 valores distintos na base),
    // nao texto livre — por isso agrupar direto pela coluna e legitimo, sem normalizar.
    //
    // Duas honestidades que a UI precisa repetir:
    //  • Ha perdidos SEM motivo (1.682 no historico completo, quase todos antigos: na
    //    janela de 12 meses a cobertura e de 99,9%). Eles NAO somem — entram em `totais`
    //    e no denominador da participacao, para o ranking nao parecer o todo quando nao e.
    //  • O "ciclo ate a perda" e add_time -> lost_time. Nao e tempo por etapa (nao ha
    //    historico de transicoes; ver funnelAnalysis), e sim quanto tempo o negocio
    //    sobreviveu antes de ser dado como perdido.
    //
    // Custo: um scan por recorte sobre pipe_deals filtrado por status/janela. Sem chamada
    // externa; segue barato o bastante para responder no request do modulo.
    private const LOST_TREND_TOP = 6;   // motivos com serie propria na tendencia; resto = "Outros"

    /**
     * @param int      $months     janela em meses sobre lost_time; 0 = historico completo.
     * @param int|null $pipelineId recorte por funil (null = todos).
     */
    public function lostReasons(int $months = 12, ?int $pipelineId = null): array
    {
        $months = max(0, min($months, 120));
        $de = $months > 0 ? date('Y-m-d', strtotime("-{$months} months")) : null;

        // Placeholders POSICIONAIS: a conexao usa EMULATE_PREPARES=false e a mesma
        // condicao e remontada em varias consultas (ver nota em summary()).
        $cond = ["d.is_deleted = 0", "d.status = 'lost'"];
        $args = [];
        if ($de !== null)         { $cond[] = "d.lost_time >= ?";  $args[] = $de; }
        if ($pipelineId !== null) { $cond[] = "d.pipeline_id = ?"; $args[] = $pipelineId; }
        $where = implode(' AND ', $cond);

        $q = function (string $sql) use ($args) {
            $st = $this->pdo->prepare($sql);
            $st->execute($args);
            return $st->fetchAll(PDO::FETCH_ASSOC);
        };

        // 1) Totais da janela (com e sem motivo informado).
        $t = $q(
            "SELECT COUNT(*) AS perdidos,
                    COALESCE(SUM(d.lost_reason IS NOT NULL AND d.lost_reason <> ''),0) AS com_motivo,
                    COALESCE(SUM(d.value),0) AS valor,
                    COALESCE(SUM(CASE WHEN d.lost_reason IS NOT NULL AND d.lost_reason <> ''
                                 THEN d.value END),0) AS valor_com_motivo
               FROM pipe_deals d WHERE {$where}"
        )[0] ?? [];
        $perdidos   = (int)($t['perdidos'] ?? 0);
        $comMotivo  = (int)($t['com_motivo'] ?? 0);
        $valorTotal = (float)($t['valor'] ?? 0);

        // 2) Ganhos da MESMA janela — denominador da taxa de perda (#5).
        $cw = ["d.is_deleted = 0", "d.status = 'won'"];
        $aw = [];
        if ($de !== null)         { $cw[] = "d.won_time >= ?";   $aw[] = $de; }
        if ($pipelineId !== null) { $cw[] = "d.pipeline_id = ?"; $aw[] = $pipelineId; }
        $stw = $this->pdo->prepare(
            "SELECT COUNT(*) AS n, COALESCE(SUM(d.value),0) AS valor
               FROM pipe_deals d WHERE " . implode(' AND ', $cw)
        );
        $stw->execute($aw);
        $w = $stw->fetch(PDO::FETCH_ASSOC) ?: [];
        $ganhos   = (int)($w['n'] ?? 0);
        $fechados = $ganhos + $perdidos;

        // 3) Ranking de motivos (quantidade, valor, ticket e tempo ate a perda).
        $linhas = $q(
            "SELECT d.lost_reason AS motivo,
                    COUNT(*) AS n,
                    COALESCE(SUM(d.value),0) AS valor,
                    ROUND(AVG(CASE WHEN d.add_time IS NOT NULL AND d.lost_time >= d.add_time
                              THEN DATEDIFF(d.lost_time, d.add_time) END)) AS ciclo
               FROM pipe_deals d
              WHERE {$where} AND d.lost_reason IS NOT NULL AND d.lost_reason <> ''
           GROUP BY d.lost_reason
           ORDER BY n DESC, valor DESC"
        );
        $motivos = array_map(static function ($r) use ($perdidos, $valorTotal, $fechados) {
            $n = (int)$r['n'];
            $v = (float)$r['valor'];
            return [
                'motivo'          => $r['motivo'],
                'n'               => $n,
                'valor'           => $v,
                // Participacao sobre TODOS os perdidos (inclusive os sem motivo).
                'share_qtd'       => $perdidos > 0 ? round($n / $perdidos * 100, 1) : null,
                'share_valor'     => $valorTotal > 0 ? round($v / $valorTotal * 100, 1) : null,
                'ticket_medio'    => $n > 0 ? round($v / $n, 2) : null,
                'ciclo_medio_dias'=> $r['ciclo'] !== null ? (int)$r['ciclo'] : null,
                // #5: quanto este motivo pesa sobre tudo que FECHOU (ganho + perdido).
                'taxa_perda_pct'  => $fechados > 0 ? round($n / $fechados * 100, 1) : null,
            ];
        }, $linhas);

        // 4) Tendencia mensal — series proprias para os TOP e "Outros" para a cauda,
        //    para o grafico nao virar 33 linhas ilegiveis.
        $topNomes = array_map(static fn($m) => $m['motivo'], array_slice($motivos, 0, self::LOST_TREND_TOP));
        $topSet   = array_flip($topNomes);
        $mensal   = $q(
            "SELECT DATE_FORMAT(d.lost_time, '%Y-%m') AS mes, d.lost_reason AS motivo,
                    COUNT(*) AS n, COALESCE(SUM(d.value),0) AS valor
               FROM pipe_deals d
              WHERE {$where} AND d.lost_time IS NOT NULL
                    AND d.lost_reason IS NOT NULL AND d.lost_reason <> ''
           GROUP BY mes, d.lost_reason
           ORDER BY mes"
        );
        $meses = [];
        $acum  = [];   // motivo|Outros => [mes => ['n'=>, 'valor'=>]]
        foreach ($mensal as $r) {
            $mes = (string)$r['mes'];
            $meses[$mes] = true;
            $chave = isset($topSet[$r['motivo']]) ? (string)$r['motivo'] : 'Outros';
            $acum[$chave][$mes]['n']     = ($acum[$chave][$mes]['n']     ?? 0) + (int)$r['n'];
            $acum[$chave][$mes]['valor'] = ($acum[$chave][$mes]['valor'] ?? 0) + (float)$r['valor'];
        }
        $meses = array_keys($meses);
        sort($meses);
        $series = [];
        foreach (array_merge($topNomes, isset($acum['Outros']) ? ['Outros'] : []) as $nome) {
            if (!isset($acum[$nome])) { continue; }
            $series[] = [
                'motivo' => $nome,
                'n'      => array_map(static fn($m) => (int)($acum[$nome][$m]['n'] ?? 0), $meses),
                'valor'  => array_map(static fn($m) => round((float)($acum[$nome][$m]['valor'] ?? 0), 2), $meses),
            ];
        }

        return [
            'janela' => [
                'meses' => $months,
                'de'    => $de,
                'ate'   => date('Y-m-d'),
            ],
            'totais' => [
                'perdidos'         => $perdidos,
                'com_motivo'       => $comMotivo,
                'sem_motivo'       => $perdidos - $comMotivo,
                'cobertura_pct'    => $perdidos > 0 ? round($comMotivo / $perdidos * 100, 1) : null,
                'valor_perdido'    => $valorTotal,
                'valor_com_motivo' => (float)($t['valor_com_motivo'] ?? 0),
                'ganhos'           => $ganhos,
                'valor_ganho'      => (float)($w['valor'] ?? 0),
                'taxa_perda_pct'   => $fechados > 0 ? round($perdidos / $fechados * 100, 1) : null,
                'motivos_distintos'=> count($motivos),
            ],
            'motivos'   => $motivos,
            'tendencia' => ['meses' => $meses, 'series' => $series, 'top' => self::LOST_TREND_TOP],
            'por_etapa' => $this->lostPorRecorte($where, $args, 'etapa'),
            'por_dono'  => $this->lostPorRecorte($where, $args, 'dono'),
            'por_funil' => $this->lostPorRecorte($where, $args, 'funil'),
            'pipelines' => $this->pipelinesList(),
            'nota' => 'A etapa de um negócio perdido é a de FECHAMENTO, não a de origem — sem '
                    . 'histórico de transições não dá para dizer por onde ele passou. '
                    . 'O tempo exibido é da criação até a perda.',
        ];
    }

    private const LOST_RECORTE_MAX = 25;   // grupos devolvidos por recorte

    /**
     * Perdas agrupadas por etapa, dono ou funil, com o motivo predominante de cada grupo.
     * Uma consulta so (grupo x motivo); o predominante sai em PHP, evitando subconsulta
     * correlacionada por grupo.
     *
     * Devolve ['total' => quantos grupos existem, 'itens' => os LOST_RECORTE_MAX maiores].
     * O `total` vai junto de proposito: um corte silencioso faria a tela parecer completa
     * quando nao esta. (Hoje nenhum recorte chega perto do teto — 9 etapas, 19 donos, 3 funis.)
     */
    private function lostPorRecorte(string $where, array $args, string $tipo): array
    {
        if ($tipo === 'funil') {
            $sql = "SELECT pl.pipedrive_id AS id, pl.name AS nome, 0 AS ordem, '' AS contexto,
                           d.lost_reason AS motivo, COUNT(*) AS n, COALESCE(SUM(d.value),0) AS valor
                      FROM pipe_deals d
                      JOIN pipe_pipelines pl ON pl.pipedrive_id = d.pipeline_id
                     WHERE {$where}
                  GROUP BY pl.pipedrive_id, pl.name, d.lost_reason";
        } elseif ($tipo === 'etapa') {
            // LEFT JOIN de proposito: ha negocios apontando para etapa EXCLUIDA no Pipedrive
            // (a #23, extinta em 2019, com 20 perdidos). A sync nao guarda etapa removida, e
            // um INNER JOIN sumiria com eles — o recorte deixaria de fechar com o total.
            $sql = "SELECT d.stage_id AS id,
                           COALESCE(s.name, CONCAT('Etapa removida (#', d.stage_id, ')')) AS nome,
                           COALESCE(s.order_nr, 999) AS ordem,
                           COALESCE(pl.name, '—') AS contexto,
                           d.lost_reason AS motivo, COUNT(*) AS n, COALESCE(SUM(d.value),0) AS valor
                      FROM pipe_deals d
                 LEFT JOIN pipe_stages s     ON s.pipedrive_id = d.stage_id
                 LEFT JOIN pipe_pipelines pl ON pl.pipedrive_id = d.pipeline_id
                     WHERE {$where}
                  GROUP BY d.stage_id, s.name, s.order_nr, pl.name, d.lost_reason";
        } else {
            $sql = "SELECT d.owner_id AS id, COALESCE(u.name, CONCAT('#', d.owner_id)) AS nome,
                           0 AS ordem, '' AS contexto,
                           d.lost_reason AS motivo, COUNT(*) AS n, COALESCE(SUM(d.value),0) AS valor
                      FROM pipe_deals d
                 LEFT JOIN pipe_users u ON u.pipedrive_id = d.owner_id
                     WHERE {$where} AND d.owner_id IS NOT NULL
                  GROUP BY d.owner_id, u.name, d.lost_reason";
        }
        $st = $this->pdo->prepare($sql);
        $st->execute($args);

        $grupos = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $k = (string)$r['id'];
            if (!isset($grupos[$k])) {
                $grupos[$k] = [
                    'id'       => $r['id'] !== null ? (int)$r['id'] : null,
                    'nome'     => $r['nome'],
                    'contexto' => $r['contexto'],
                    'ordem'    => (int)$r['ordem'],
                    'n'        => 0,
                    'valor'    => 0.0,
                    'principal_motivo' => null,
                    'principal_n'      => 0,
                ];
            }
            $n = (int)$r['n'];
            $grupos[$k]['n']     += $n;
            $grupos[$k]['valor'] += (float)$r['valor'];
            // Motivo predominante: so entre os informados — "sem motivo" nao e um motivo.
            $motivo = $r['motivo'] !== null && $r['motivo'] !== '' ? (string)$r['motivo'] : null;
            if ($motivo !== null && $n > $grupos[$k]['principal_n']) {
                $grupos[$k]['principal_motivo'] = $motivo;
                $grupos[$k]['principal_n']      = $n;
            }
        }

        $out = array_values($grupos);
        usort($out, static fn($a, $b) => $b['n'] <=> $a['n']);
        $itens = array_map(static fn($g) => [
            'id'               => $g['id'],
            'nome'             => $g['nome'],
            'contexto'         => $g['contexto'],
            'n'                => $g['n'],
            'valor'            => round($g['valor'], 2),
            'principal_motivo' => $g['principal_motivo'],
            'principal_share'  => $g['n'] > 0 && $g['principal_motivo'] !== null
                ? round($g['principal_n'] / $g['n'] * 100, 1) : null,
        ], array_slice($out, 0, self::LOST_RECORTE_MAX));

        return ['total' => count($out), 'itens' => $itens];
    }

    // ── Origem de leads (#31) ───────────────────────────────────────
    //
    // De onde vem o lead NAO esta em coluna propria: `pipe_deals.origin` existe no schema
    // e esta 100% NULL (e uma das colunas mortas do #61 — a sync nunca a populou). O dado
    // real mora no campo customizado "Origem Lead", dentro do JSON `custom_fields`,
    // chaveado pelo hash do campo. Por isso este metodo explode o JSON em vez de agrupar
    // por coluna.
    //
    // ⚠️ TRES armadilhas do dado, todas ja pagas aqui:
    //
    //  1. O campo e do tipo `set` (MULTI-valor): o valor e um ARRAY de option_id
    //     (`[163]`, as vezes `[163, 927]`). Um negocio com duas origens entra nas DUAS —
    //     e por isso a soma das origens NAO fecha com o total de negocios. Devolvemos
    //     `multi_origem` para a tela poder dizer isso em vez de o usuario descobrir
    //     somando a coluna e achando que a conta esta errada.
    //
    //  2. `JSON_LENGTH` de um JSON `null` devolve 1, nao 0. O teste obvio
    //     (`JSON_LENGTH(...) > 0`) daria 19.930 negocios "com origem" quando so 14.261
    //     tem — uma cobertura de 100% falsa, que e exatamente o tipo de numero que passa
    //     despercebido. O teste correto e `JSON_TYPE(...) = 'ARRAY'`.
    //
    //  3. A janela e por DATA DE CRIACAO (coorte de leads), nao por fechamento — origem
    //     e uma propriedade do nascimento do lead. Consequencia: uma coorte recente ainda
    //     nao terminou de converter, entao a conversao dos ultimos meses sai subestimada.
    //     Devolvemos `abertos` (os ainda nao decididos) para a tela avisar.
    //
    // A conversao usa como denominador so o que FECHOU (ganho + perdido). Negocio aberto
    // nao e derrota; incluir os abertos no denominador afundaria toda origem recente.
    private const ORIGEM_FIELD_KEY = '422b56fbb7db7f73cb4c05876119d8de92bca622'; // "Origem Lead"
    // 5, e nao 6, por causa da LEGENDA: alem das origens a tendencia desenha "Outras"
    // (cauda) e "Sem origem" (ausencia). Com 6 sobravam 8 series e a cauda acabava
    // recebendo um cinza quase igual ao da ausencia — duas coisas diferentes com a mesma
    // cor. Com 5 a cauda ganha cor propria e o cinza fica reservado para "sem dado".
    private const LEAD_TREND_TOP   = 5;   // origens com serie propria na tendencia; resto = "Outras"
    private const LEAD_RECORTE_MAX = 25;  // grupos devolvidos por recorte

    /**
     * @param int      $months     janela em meses sobre add_time; 0 = historico completo.
     * @param int|null $pipelineId recorte por funil (null = todos).
     */
    public function leadSources(int $months = 12, ?int $pipelineId = null): array
    {
        $months = max(0, min($months, 120));
        $de = $months > 0 ? date('Y-m-d', strtotime("-{$months} months")) : null;
        $janela = ['meses' => $months, 'de' => $de, 'ate' => date('Y-m-d')];

        // O campo pode ter sido renomeado/removido no Pipedrive. Sem ele nao ha analise —
        // e melhor a tela dizer "campo nao configurado" do que desenhar zeros como verdade.
        $stf = $this->pdo->prepare(
            "SELECT id, name FROM pipe_custom_fields
              WHERE field_key = ? AND entity = 'deal' LIMIT 1"
        );
        $stf->execute([self::ORIGEM_FIELD_KEY]);
        $campo = $stf->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($campo === null) {
            return [
                'janela'    => $janela,
                'campo'     => ['existe' => false, 'nome' => null, 'field_key' => self::ORIGEM_FIELD_KEY],
                'totais'    => null,
                'origens'   => [],
                'tendencia' => ['meses' => [], 'series' => [], 'top' => self::LEAD_TREND_TOP],
                'por_dono'  => ['total' => 0, 'itens' => []],
                'por_funil' => ['total' => 0, 'itens' => []],
                'pipelines' => $this->pipelinesList(),
                'nota'      => 'O campo "Origem Lead" nao esta no catalogo de campos '
                             . 'customizados desta base — nao ha de onde tirar a origem.',
            ];
        }
        $fieldId = (int)$campo['id'];

        // Caminho JSON montado a partir de uma CONSTANTE hex de 40 chars (char(40) no
        // Pipedrive), nunca de entrada do usuario. A guarda existe para o dia em que
        // alguem trocar a constante por algo vindo de fora.
        if (preg_match('/^[0-9a-f]{40}$/', self::ORIGEM_FIELD_KEY) !== 1) {
            throw new RuntimeException('ORIGEM_FIELD_KEY invalida');
        }
        $json      = "JSON_EXTRACT(d.custom_fields, '$.\"" . self::ORIGEM_FIELD_KEY . "\"')";
        $temOrigem = "COALESCE(JSON_TYPE({$json}) = 'ARRAY', 0)";  // ver armadilha 2

        // Placeholders POSICIONAIS: a conexao usa EMULATE_PREPARES=false e a mesma
        // condicao e remontada em varias consultas (mesmo padrao de lostReasons).
        $cond = ["d.is_deleted = 0"];
        $args = [];
        if ($de !== null)         { $cond[] = "d.add_time >= ?";   $args[] = $de; }
        if ($pipelineId !== null) { $cond[] = "d.pipeline_id = ?"; $args[] = $pipelineId; }
        $where = implode(' AND ', $cond);

        $q = function (string $sql, array $extra = []) use ($args) {
            $st = $this->pdo->prepare($sql);
            $st->execute(array_merge($extra, $args));
            return $st->fetchAll(PDO::FETCH_ASSOC);
        };

        // 1) Totais da coorte + a fatia SEM origem medida a parte. A fatia sem origem
        //    ganha desfecho proprio de proposito: se ela converte muito diferente das
        //    classificadas, o ranking esta enviesado e a tela precisa poder dizer isso.
        $t = $q(
            "SELECT COUNT(*) AS negocios,
                    COALESCE(SUM({$temOrigem}),0)                                  AS com_origem,
                    COALESCE(SUM({$temOrigem} = 1 AND JSON_LENGTH({$json}) > 1),0) AS multi_origem,
                    COALESCE(SUM(d.status='won'),0)                                AS ganhos,
                    COALESCE(SUM(d.status='lost'),0)                               AS perdidos,
                    COALESCE(SUM(d.status='open'),0)                               AS abertos,
                    COALESCE(SUM(CASE WHEN d.status='won' THEN d.value END),0)     AS valor_ganho,
                    COALESCE(SUM({$temOrigem} = 0 AND d.status='won'),0)           AS sem_ganhos,
                    COALESCE(SUM({$temOrigem} = 0 AND d.status='lost'),0)          AS sem_perdas
               FROM pipe_deals d WHERE {$where}"
        )[0] ?? [];

        $negocios  = (int)($t['negocios'] ?? 0);
        $comOrigem = (int)($t['com_origem'] ?? 0);
        $ganhos    = (int)($t['ganhos'] ?? 0);
        $perdidos  = (int)($t['perdidos'] ?? 0);
        $fechados  = $ganhos + $perdidos;
        $semGanhos = (int)($t['sem_ganhos'] ?? 0);
        $semPerdas = (int)($t['sem_perdas'] ?? 0);
        $semFech   = $semGanhos + $semPerdas;

        // 2) Ranking por origem (JSON_TABLE explode o array; ver armadilha 1).
        //    LEFT JOIN nas opcoes: opcao excluida no Pipedrive vira "Opcao removida (#id)"
        //    em vez de sumir da conta — mesmo tratamento dado a etapa removida em #30.
        $linhas = $q(
            "SELECT jt.opt AS option_id,
                    COALESCE(o.label, CONCAT('Opção removida (#', jt.opt, ')')) AS origem,
                    COUNT(*)                                                   AS n,
                    COALESCE(SUM(d.status='won'),0)                            AS ganhos,
                    COALESCE(SUM(d.status='lost'),0)                           AS perdas,
                    COALESCE(SUM(d.status='open'),0)                           AS abertos,
                    COALESCE(SUM(CASE WHEN d.status='won'  THEN d.value END),0) AS valor_ganho,
                    COALESCE(SUM(CASE WHEN d.status='open' THEN d.value END),0) AS valor_aberto,
                    ROUND(AVG(CASE WHEN d.status='won' AND d.add_time IS NOT NULL
                                    AND d.won_time >= d.add_time
                               THEN DATEDIFF(d.won_time, d.add_time) END))     AS ciclo
               FROM pipe_deals d
               JOIN JSON_TABLE({$json}, '$[*]' COLUMNS (opt BIGINT PATH '$')) jt
          LEFT JOIN pipe_custom_field_options o ON o.field_id = ? AND o.option_id = jt.opt
              WHERE {$where}
           GROUP BY jt.opt, o.label
           ORDER BY n DESC",
            [$fieldId]
        );

        $origens = array_map(static function ($r) use ($comOrigem, $fechados) {
            $n   = (int)$r['n'];
            $g   = (int)$r['ganhos'];
            $p   = (int)$r['perdas'];
            $fec = $g + $p;
            $vg  = (float)$r['valor_ganho'];
            return [
                'option_id'    => (int)$r['option_id'],
                'origem'       => $r['origem'],
                'n'            => $n,
                'ganhos'       => $g,
                'perdas'       => $p,
                'abertos'      => (int)$r['abertos'],
                'fechados'     => $fec,
                // Conversao so entre os DECIDIDOS. Null (nao zero) quando nada fechou:
                // zero por cento e uma afirmacao, "ainda nao da para dizer" e outra.
                'conversao_pct'=> $fec > 0 ? round($g / $fec * 100, 1) : null,
                'valor_ganho'  => $vg,
                'valor_aberto' => (float)$r['valor_aberto'],
                'ticket_medio' => $g > 0 ? round($vg / $g, 2) : null,
                // Participacao sobre os CLASSIFICADOS (nao sobre o total): o denominador
                // honesto de "quanto esta origem representa" e o universo que tem origem.
                'share_qtd'    => $comOrigem > 0 ? round($n / $comOrigem * 100, 1) : null,
                'share_fechados' => $fechados > 0 ? round($fec / $fechados * 100, 1) : null,
                'ciclo_medio_dias' => $r['ciclo'] !== null ? (int)$r['ciclo'] : null,
            ];
        }, $linhas);

        return [
            'janela' => $janela,
            'campo'  => ['existe' => true, 'nome' => $campo['name'], 'field_key' => self::ORIGEM_FIELD_KEY],
            'totais' => [
                'negocios'      => $negocios,
                'com_origem'    => $comOrigem,
                'sem_origem'    => $negocios - $comOrigem,
                'cobertura_pct' => $negocios > 0 ? round($comOrigem / $negocios * 100, 1) : null,
                'multi_origem'  => (int)($t['multi_origem'] ?? 0),
                'ganhos'        => $ganhos,
                'perdidos'      => $perdidos,
                'abertos'       => (int)($t['abertos'] ?? 0),
                'fechados'      => $fechados,
                'conversao_pct' => $fechados > 0 ? round($ganhos / $fechados * 100, 1) : null,
                'valor_ganho'   => (float)($t['valor_ganho'] ?? 0),
                'origens_distintas' => count($origens),
                // Desfecho da fatia NAO classificada — o teste de vies do ranking.
                'sem_origem_fechados'      => $semFech,
                'sem_origem_conversao_pct' => $semFech > 0 ? round($semGanhos / $semFech * 100, 1) : null,
            ],
            'origens'   => $origens,
            'tendencia' => $this->leadSourcesTendencia($where, $args, $json, $temOrigem, $fieldId, $origens),
            'por_dono'  => $this->leadSourcesPorRecorte($where, $args, $json, $fieldId, 'dono'),
            'por_funil' => $this->leadSourcesPorRecorte($where, $args, $json, $fieldId, 'funil'),
            'pipelines' => $this->pipelinesList(),
            'nota' => 'A origem vem do campo customizado "' . $campo['name'] . '", que aceita MAIS '
                    . 'DE UMA opção por negócio — por isso a soma das origens pode passar do total '
                    . 'de negócios. A janela é por data de CRIAÇÃO do negócio: uma safra recente '
                    . 'ainda não terminou de converter, então a conversão dos últimos meses tende a '
                    . 'subir depois. A conversão considera apenas o que já fechou (ganho + perdido).',
        ];
    }

    /**
     * Tendencia mensal de leads criados por origem. As TOP ganham serie propria, a cauda
     * vai em "Outras" — e a fatia SEM origem entra como serie tambem, de proposito: ela
     * mostra se a classificacao esta melhorando ou piorando ao longo do tempo, que e o
     * que diz se da para confiar mais nos meses recentes do que nos antigos.
     */
    private function leadSourcesTendencia(
        string $where, array $args, string $json, string $temOrigem, int $fieldId, array $origens
    ): array {
        $topNomes = array_map(static fn($o) => $o['origem'], array_slice($origens, 0, self::LEAD_TREND_TOP));
        $topSet   = array_flip($topNomes);

        $st = $this->pdo->prepare(
            "SELECT DATE_FORMAT(d.add_time, '%Y-%m') AS mes,
                    COALESCE(o.label, CONCAT('Opção removida (#', jt.opt, ')')) AS origem,
                    COUNT(*) AS n
               FROM pipe_deals d
               JOIN JSON_TABLE({$json}, '$[*]' COLUMNS (opt BIGINT PATH '$')) jt
          LEFT JOIN pipe_custom_field_options o ON o.field_id = ? AND o.option_id = jt.opt
              WHERE {$where} AND d.add_time IS NOT NULL
           GROUP BY mes, origem
           ORDER BY mes"
        );
        $st->execute(array_merge([$fieldId], $args));

        $meses = [];
        $acum  = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $mes = (string)$r['mes'];
            $meses[$mes] = true;
            $chave = isset($topSet[$r['origem']]) ? (string)$r['origem'] : 'Outras';
            $acum[$chave][$mes] = ($acum[$chave][$mes] ?? 0) + (int)$r['n'];
        }

        // Serie "Sem origem": contada no NEGOCIO (nao explodida), senao ela nao existiria —
        // um negocio sem origem nao produz nenhuma linha no JSON_TABLE acima.
        $sts = $this->pdo->prepare(
            "SELECT DATE_FORMAT(d.add_time, '%Y-%m') AS mes, COUNT(*) AS n
               FROM pipe_deals d
              WHERE {$where} AND d.add_time IS NOT NULL AND {$temOrigem} = 0
           GROUP BY mes ORDER BY mes"
        );
        $sts->execute($args);
        foreach ($sts->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $mes = (string)$r['mes'];
            $meses[$mes] = true;
            $acum['Sem origem'][$mes] = ($acum['Sem origem'][$mes] ?? 0) + (int)$r['n'];
        }

        $meses = array_keys($meses);
        sort($meses);

        $ordem = $topNomes;
        if (isset($acum['Outras']))     { $ordem[] = 'Outras'; }
        if (isset($acum['Sem origem'])) { $ordem[] = 'Sem origem'; }

        $series = [];
        foreach ($ordem as $nome) {
            if (!isset($acum[$nome])) { continue; }
            $series[] = [
                'origem' => $nome,
                'n'      => array_map(static fn($m) => (int)($acum[$nome][$m] ?? 0), $meses),
            ];
        }

        return ['meses' => $meses, 'series' => $series, 'top' => self::LEAD_TREND_TOP];
    }

    /**
     * Leads agrupados por dono ou funil, com a origem predominante de cada grupo.
     * Uma consulta so (grupo x origem); o predominante sai em PHP.
     *
     * Devolve ['total' => quantos grupos existem, 'itens' => os LEAD_RECORTE_MAX maiores],
     * para um corte no teto nunca se passar por lista completa.
     */
    private function leadSourcesPorRecorte(
        string $where, array $args, string $json, int $fieldId, string $tipo
    ): array {
        if ($tipo === 'funil') {
            $sel  = "pl.pipedrive_id AS id, pl.name AS nome";
            $from = "JOIN pipe_pipelines pl ON pl.pipedrive_id = d.pipeline_id";
            $grp  = "pl.pipedrive_id, pl.name";
            $extra = '';
        } else {
            $sel  = "d.owner_id AS id, COALESCE(u.name, CONCAT('#', d.owner_id)) AS nome";
            $from = "LEFT JOIN pipe_users u ON u.pipedrive_id = d.owner_id";
            $grp  = "d.owner_id, u.name";
            $extra = ' AND d.owner_id IS NOT NULL';
        }

        $st = $this->pdo->prepare(
            "SELECT {$sel},
                    COALESCE(o.label, CONCAT('Opção removida (#', jt.opt, ')')) AS origem,
                    COUNT(*) AS n,
                    COALESCE(SUM(d.status='won'),0) AS ganhos,
                    COALESCE(SUM(d.status='lost'),0) AS perdas,
                    COALESCE(SUM(CASE WHEN d.status='won' THEN d.value END),0) AS valor_ganho
               FROM pipe_deals d
               JOIN JSON_TABLE({$json}, '$[*]' COLUMNS (opt BIGINT PATH '$')) jt
          LEFT JOIN pipe_custom_field_options o ON o.field_id = ? AND o.option_id = jt.opt
               {$from}
              WHERE {$where}{$extra}
           GROUP BY {$grp}, origem"
        );
        $st->execute(array_merge([$fieldId], $args));

        $grupos = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $k = (string)$r['id'];
            if (!isset($grupos[$k])) {
                $grupos[$k] = [
                    'id' => $r['id'] !== null ? (int)$r['id'] : null,
                    'nome' => $r['nome'], 'n' => 0, 'ganhos' => 0, 'perdas' => 0, 'valor' => 0.0,
                    'principal' => null, 'principal_n' => 0,
                ];
            }
            $n = (int)$r['n'];
            $grupos[$k]['n']      += $n;
            $grupos[$k]['ganhos'] += (int)$r['ganhos'];
            $grupos[$k]['perdas'] += (int)$r['perdas'];
            $grupos[$k]['valor']  += (float)$r['valor_ganho'];
            if ($n > $grupos[$k]['principal_n']) {
                $grupos[$k]['principal']   = (string)$r['origem'];
                $grupos[$k]['principal_n'] = $n;
            }
        }

        $out = array_values($grupos);
        usort($out, static fn($a, $b) => $b['n'] <=> $a['n']);
        $itens = array_map(static function ($g) {
            $fec = $g['ganhos'] + $g['perdas'];
            return [
                'id'    => $g['id'],
                'nome'  => $g['nome'],
                'n'     => $g['n'],
                'valor' => round($g['valor'], 2),
                'conversao_pct'   => $fec > 0 ? round($g['ganhos'] / $fec * 100, 1) : null,
                'principal_origem'=> $g['principal'],
                'principal_share' => $g['n'] > 0 && $g['principal'] !== null
                    ? round($g['principal_n'] / $g['n'] * 100, 1) : null,
            ];
        }, array_slice($out, 0, self::LEAD_RECORTE_MAX));

        return ['total' => count($out), 'itens' => $itens];
    }
}
