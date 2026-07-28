<?php
// Pipedrive / MetricsRepository - agregacoes pre-calculadas (doc 03 §1.12, §32)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// TUDO local: le a base replicada (pipe_deals/deal_products/api_requests) e grava
// series em pipe_metrics_daily / pipe_metrics_hourly. NAO chama a API do Pipedrive,
// entao pode rodar ao fim de cada sync sem consumir orcamento de token.
//
// Estrategia idempotente: DELETE da janela + INSERT...SELECT (evita o problema de
// UNIQUE com colunas NULL e recalcula sempre a partir da verdade local).
declare(strict_types=1);

final class PipeMetricsRepository
{
    private PDO $pdo;

    // Chaves de metrica diaria (dimensao 'global').
    private const DAILY_KEYS = ['deals_created', 'deals_won', 'deals_lost', 'value_won', 'value_created'];

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ── Calculo ─────────────────────────────────────────────────────

    /** Recalcula a serie diaria global dos ultimos $days dias. @return int linhas gravadas. */
    public function computeDaily(int $days = 180): int
    {
        $days = max(1, min($days, 730));
        $from = (new DateTimeImmutable("-{$days} days"))->format('Y-m-d');

        $this->pdo->prepare("DELETE FROM pipe_metrics_daily WHERE dimension = 'global' AND metric_date >= :from")
                  ->execute([':from' => $from]);

        // Cada bloco: (coluna-data, filtro, agregacao) -> metric_key
        $blocos = [
            ['deals_created', 'add_time',  'is_deleted=0',                 'COUNT(*)'],
            ['value_created', 'add_time',  'is_deleted=0',                 'COALESCE(SUM(value),0)'],
            ['deals_won',     'won_time',  "is_deleted=0 AND status='won'",  'COUNT(*)'],
            ['value_won',     'won_time',  "is_deleted=0 AND status='won'",  'COALESCE(SUM(value),0)'],
            ['deals_lost',    'lost_time', "is_deleted=0 AND status='lost'", 'COUNT(*)'],
        ];
        $total = 0;
        foreach ($blocos as [$key, $col, $filtro, $agg]) {
            $sql = "INSERT INTO pipe_metrics_daily (metric_date, dimension, dimension_id, metric_key, metric_value)
                    SELECT DATE({$col}) d, 'global', NULL, :k, {$agg}
                      FROM pipe_deals
                     WHERE {$filtro} AND {$col} IS NOT NULL AND {$col} >= :from
                     GROUP BY DATE({$col})";
            $st = $this->pdo->prepare($sql);
            $st->execute([':k' => $key, ':from' => $from . ' 00:00:00']);
            $total += $st->rowCount();
        }
        return $total;
    }

    /** Recalcula a serie horaria de USO DA API (custo/erros) das ultimas $hours horas. */
    public function computeHourly(int $hours = 72): int
    {
        $hours = max(1, min($hours, 720));
        $from = (new DateTimeImmutable("-{$hours} hours"))->format('Y-m-d H:00:00');

        $this->pdo->prepare("DELETE FROM pipe_metrics_hourly WHERE metric_hour >= :from")
                  ->execute([':from' => $from]);

        $blocos = [
            ['api_calls',  'COUNT(*)'],
            ['api_errors', "SUM(result='error')"],
            ['token_cost', 'COALESCE(SUM(token_cost),0)'],
        ];
        $total = 0;
        foreach ($blocos as [$key, $agg]) {
            $sql = "INSERT INTO pipe_metrics_hourly (metric_hour, metric_key, metric_value)
                    SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') h, :k, {$agg}
                      FROM pipe_api_requests
                     WHERE created_at >= :from
                     GROUP BY h";
            $st = $this->pdo->prepare($sql);
            $st->execute([':k' => $key, ':from' => $from]);
            $total += $st->rowCount();
        }
        return $total;
    }

    // ── Leitura (endpoint /metrics) ─────────────────────────────────

    /** Serie diaria global pivotada por data (ultimos $days dias). */
    public function readDaily(int $days = 90): array
    {
        $days = max(1, min($days, 730));
        $from = (new DateTimeImmutable("-{$days} days"))->format('Y-m-d');
        $st = $this->pdo->prepare(
            "SELECT metric_date, metric_key, metric_value
               FROM pipe_metrics_daily
              WHERE dimension = 'global' AND metric_date >= :from
              ORDER BY metric_date ASC"
        );
        $st->execute([':from' => $from]);

        $porData = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $d = $r['metric_date'];
            if (!isset($porData[$d])) {
                $porData[$d] = ['date' => $d] + array_fill_keys(self::DAILY_KEYS, 0.0);
            }
            if (in_array($r['metric_key'], self::DAILY_KEYS, true)) {
                $porData[$d][$r['metric_key']] = (float)$r['metric_value'];
            }
        }
        return array_values($porData);
    }

    /** Uso da API por hora (ultimas $hours horas). */
    public function readHourly(int $hours = 72): array
    {
        $hours = max(1, min($hours, 720));
        $from = (new DateTimeImmutable("-{$hours} hours"))->format('Y-m-d H:00:00');
        $st = $this->pdo->prepare(
            "SELECT metric_hour, metric_key, metric_value
               FROM pipe_metrics_hourly WHERE metric_hour >= :from
              ORDER BY metric_hour ASC"
        );
        $st->execute([':from' => $from]);
        $porHora = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $h = $r['metric_hour'];
            if (!isset($porHora[$h])) { $porHora[$h] = ['hour' => $h, 'api_calls' => 0.0, 'api_errors' => 0.0, 'token_cost' => 0.0]; }
            $porHora[$h][$r['metric_key']] = (float)$r['metric_value'];
        }
        return array_values($porHora);
    }

    /** Ranking de produtos por valor em negocios (live a partir de deal_products). */
    public function topProducts(int $limit = 15): array
    {
        $limit = max(1, min($limit, 100));
        $st = $this->pdo->query(
            "SELECT dp.product_pd_id AS product_id, COALESCE(p.name, CONCAT('#', dp.product_pd_id)) AS name,
                    COUNT(DISTINCT dp.deal_pd_id) AS deals,
                    COALESCE(SUM(dp.quantity),0)   AS qty,
                    COALESCE(SUM(dp.`sum`),0)      AS valor_total,
                    COALESCE(SUM(CASE WHEN d.status='won' THEN dp.`sum` END),0) AS valor_ganho
               FROM pipe_deal_products dp
               JOIN pipe_deals d ON d.pipedrive_id = dp.deal_pd_id AND d.is_deleted = 0
          LEFT JOIN pipe_products p ON p.pipedrive_id = dp.product_pd_id
           GROUP BY dp.product_pd_id, p.name
           ORDER BY valor_total DESC
              LIMIT {$limit}"
        );
        return array_map(static fn($r) => [
            'product_id'  => $r['product_id'] !== null ? (int)$r['product_id'] : null,
            'name'        => $r['name'],
            'deals'       => (int)$r['deals'],
            'qty'         => (float)$r['qty'],
            'valor_total' => (float)$r['valor_total'],
            'valor_ganho' => (float)$r['valor_ganho'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** Ranking de vendedores por valor ganho (live a partir de pipe_deals). */
    public function ownerLeaderboard(int $limit = 10): array
    {
        $limit = max(1, min($limit, 50));
        $st = $this->pdo->query(
            "SELECT d.owner_id, COALESCE(u.name, CONCAT('#', d.owner_id)) AS name,
                    SUM(d.status='won')  AS ganhos,
                    COALESCE(SUM(CASE WHEN d.status='won' THEN d.value END),0) AS valor_ganho,
                    COALESCE(SUM(CASE WHEN d.status='open' THEN d.value END),0) AS valor_aberto
               FROM pipe_deals d
          LEFT JOIN pipe_users u ON u.pipedrive_id = d.owner_id
              WHERE d.is_deleted = 0 AND d.owner_id IS NOT NULL
           GROUP BY d.owner_id, u.name
           ORDER BY valor_ganho DESC
              LIMIT {$limit}"
        );
        return array_map(static fn($r) => [
            'owner_id'     => $r['owner_id'] !== null ? (int)$r['owner_id'] : null,
            'name'         => $r['name'],
            'ganhos'       => (int)$r['ganhos'],
            'valor_ganho'  => (float)$r['valor_ganho'],
            'valor_aberto' => (float)$r['valor_aberto'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** Cobertura de deal_products: quantos negocios ativos ja tem produtos sincronizados. */
    public function productsCoverage(): array
    {
        $comProdutos = (int)$this->pdo->query("SELECT COUNT(DISTINCT deal_pd_id) FROM pipe_deal_products")->fetchColumn();
        $itens       = (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_deal_products")->fetchColumn();
        $ativos      = (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_deals WHERE is_deleted=0 AND status IN ('open','won')")->fetchColumn();
        return ['deals_com_produtos' => $comProdutos, 'itens' => $itens, 'deals_ativos' => $ativos];
    }

    // ── Cards-resumo por entidade (Elevacao visual §Fase 3) ─────────
    //
    // Tudo LOCAL (zero chamada de API). Cada entidade devolve ate 4 tiles no MESMO formato,
    // para o front so montar: [{chave, rotulo, valor, formato, cor?, dica?}].
    // Formato: 'num' | 'brl' | 'pct'.  As consultas sao allow-list (entidade nunca entra em SQL).

    private const ENTIDADES_STATS = ['persons', 'organizations', 'products', 'activities', 'leads', 'notes'];

    public static function entidadesComStats(): array { return self::ENTIDADES_STATS; }

    /** @return array{entity:string,tiles:array<int,array<string,mixed>>} */
    public function entityStats(string $entity): array
    {
        switch ($entity) {
            case 'persons':      $tiles = $this->statsPersons();       break;
            case 'organizations':$tiles = $this->statsOrganizations(); break;
            case 'products':     $tiles = $this->statsProducts();      break;
            case 'activities':   $tiles = $this->statsActivities();    break;
            case 'leads':        $tiles = $this->statsLeads();         break;
            case 'notes':        $tiles = $this->statsNotes();         break;
            default:             $tiles = [];                          break;
        }
        return ['entity' => $entity, 'tiles' => $tiles];
    }

    /** Escalar simples (as consultas sao constantes no codigo — sem interpolacao de entrada). */
    private function escalar(string $sql): float
    {
        $v = $this->pdo->query($sql)->fetchColumn();
        return $v === false || $v === null ? 0.0 : (float)$v;
    }

    private function tile(string $chave, string $rotulo, float $valor, string $formato = 'num', ?string $cor = null, ?string $dica = null): array
    {
        $t = ['chave' => $chave, 'rotulo' => $rotulo, 'valor' => $valor, 'formato' => $formato];
        if ($cor !== null) { $t['cor'] = $cor; }
        if ($dica !== null) { $t['dica'] = $dica; }
        return $t;
    }

    private function statsPersons(): array
    {
        return [
            $this->tile('total', 'Pessoas', $this->escalar(
                "SELECT COUNT(*) FROM pipe_persons WHERE is_deleted=0")),
            $this->tile('com_email', 'Com e-mail', $this->escalar(
                "SELECT COUNT(*) FROM pipe_persons WHERE is_deleted=0 AND primary_email IS NOT NULL AND primary_email<>''"),
                'num', 'var(--pp-ok)', 'Pessoas com e-mail principal preenchido'),
            $this->tile('com_telefone', 'Com telefone', $this->escalar(
                "SELECT COUNT(*) FROM pipe_persons WHERE is_deleted=0 AND primary_phone IS NOT NULL AND primary_phone<>''"),
                'num', 'var(--pp-sync)'),
            $this->tile('novas_30d', 'Novas em 30 dias', $this->escalar(
                "SELECT COUNT(*) FROM pipe_persons WHERE is_deleted=0 AND add_time >= (NOW() - INTERVAL 30 DAY)")),
        ];
    }

    private function statsOrganizations(): array
    {
        return [
            $this->tile('total', 'Organizações', $this->escalar(
                "SELECT COUNT(*) FROM pipe_organizations WHERE is_deleted=0")),
            $this->tile('com_pessoas', 'Com contatos', $this->escalar(
                "SELECT COUNT(DISTINCT o.pipedrive_id) FROM pipe_organizations o
                   JOIN pipe_persons p ON p.org_id = o.pipedrive_id AND p.is_deleted=0
                  WHERE o.is_deleted=0"), 'num', 'var(--pp-sync)'),
            $this->tile('com_negocio_aberto', 'Com negócio aberto', $this->escalar(
                "SELECT COUNT(DISTINCT o.pipedrive_id) FROM pipe_organizations o
                   JOIN pipe_deals d ON d.org_id = o.pipedrive_id AND d.is_deleted=0 AND d.status='open'
                  WHERE o.is_deleted=0"), 'num', 'var(--pp-ok)'),
            $this->tile('valor_aberto', 'Valor em aberto', $this->escalar(
                "SELECT COALESCE(SUM(value),0) FROM pipe_deals WHERE is_deleted=0 AND status='open' AND org_id IS NOT NULL"), 'brl'),
        ];
    }

    private function statsProducts(): array
    {
        return [
            $this->tile('total', 'Produtos', $this->escalar(
                "SELECT COUNT(*) FROM pipe_products WHERE is_deleted=0")),
            $this->tile('ativos', 'Ativos', $this->escalar(
                "SELECT COUNT(*) FROM pipe_products WHERE is_deleted=0 AND is_active=1"), 'num', 'var(--pp-ok)'),
            $this->tile('usados', 'Usados em negócios', $this->escalar(
                "SELECT COUNT(DISTINCT product_pd_id) FROM pipe_deal_products"), 'num', 'var(--pp-sync)',
                'Produtos que aparecem em pelo menos um negócio sincronizado'),
            $this->tile('receita', 'Valor vinculado', $this->escalar(
                "SELECT COALESCE(SUM(dp.sum),0) FROM pipe_deal_products dp
                   JOIN pipe_deals d ON d.pipedrive_id = dp.deal_pd_id AND d.is_deleted=0 AND d.status IN ('open','won')"), 'brl'),
        ];
    }

    private function statsActivities(): array
    {
        return [
            $this->tile('total', 'Atividades', $this->escalar(
                "SELECT COUNT(*) FROM pipe_activities WHERE is_deleted=0")),
            $this->tile('pendentes', 'Pendentes', $this->escalar(
                "SELECT COUNT(*) FROM pipe_activities WHERE is_deleted=0 AND done=0"), 'num', 'var(--pp-sync)'),
            $this->tile('atrasadas', 'Atrasadas', $this->escalar(
                "SELECT COUNT(*) FROM pipe_activities WHERE is_deleted=0 AND done=0 AND due_date IS NOT NULL AND due_date < CURDATE()"),
                'num', 'var(--pp-danger)', 'Pendentes com data prevista no passado'),
            $this->tile('concluidas_30d', 'Concluídas em 30 dias', $this->escalar(
                "SELECT COUNT(*) FROM pipe_activities WHERE is_deleted=0 AND done=1 AND marked_done_time >= (NOW() - INTERVAL 30 DAY)"),
                'num', 'var(--pp-ok)'),
        ];
    }

    private function statsLeads(): array
    {
        return [
            $this->tile('total', 'Leads', $this->escalar(
                "SELECT COUNT(*) FROM pipe_leads WHERE is_deleted=0")),
            $this->tile('ativos', 'Ativos', $this->escalar(
                "SELECT COUNT(*) FROM pipe_leads WHERE is_deleted=0 AND is_archived=0"), 'num', 'var(--pp-ok)'),
            $this->tile('convertidos', 'Convertidos em negócio', $this->escalar(
                "SELECT COUNT(*) FROM pipe_leads WHERE is_deleted=0 AND converted_deal_id IS NOT NULL"), 'num', 'var(--pp-sync)'),
            $this->tile('valor', 'Valor dos ativos', $this->escalar(
                "SELECT COALESCE(SUM(value),0) FROM pipe_leads WHERE is_deleted=0 AND is_archived=0"), 'brl'),
        ];
    }

    private function statsNotes(): array
    {
        return [
            $this->tile('total', 'Notas', $this->escalar(
                "SELECT COUNT(*) FROM pipe_notes WHERE is_deleted=0")),
            $this->tile('ultimos_30d', 'Últimos 30 dias', $this->escalar(
                "SELECT COUNT(*) FROM pipe_notes WHERE is_deleted=0 AND add_time >= (NOW() - INTERVAL 30 DAY)"),
                'num', 'var(--pp-sync)'),
            $this->tile('negocios_com_nota', 'Negócios com nota', $this->escalar(
                "SELECT COUNT(DISTINCT deal_pd_id) FROM pipe_notes WHERE is_deleted=0 AND deal_pd_id IS NOT NULL"), 'num', 'var(--pp-ok)'),
            $this->tile('pessoas_com_nota', 'Pessoas com nota', $this->escalar(
                "SELECT COUNT(DISTINCT person_pd_id) FROM pipe_notes WHERE is_deleted=0 AND person_pd_id IS NOT NULL")),
        ];
    }
}
