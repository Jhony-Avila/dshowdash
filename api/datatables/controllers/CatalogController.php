<?php
// DataTables / CatalogController - leitura do catalogo e dashboard
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
declare(strict_types=1);

final class DtCatalogController
{
    /** GET /dashboard (§9) */
    public static function dashboard(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new DtCatalogRepository($pdo);

        ApiResponse::success([
            'counters'     => $repo->dashboardCounters(),
            'environments' => $repo->distributionByEnvironment(),
            'problems'     => $repo->problemConnections(),
            'pending'      => $repo->structuralPending(),
        ], ['timestamp' => date('c')]);
    }

    /** GET /lookups */
    public static function lookups(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);
        ApiResponse::success((new DtCatalogRepository($pdo))->lookups(), ['timestamp' => date('c')]);
    }

    /** GET /search?q=&exact=1 (§21) */
    public static function search(string $method, PDO $pdo): void
    {
        requireMethod(['GET']);

        $q = trim((string)($_GET['q'] ?? ''));
        if (mb_strlen($q) < 2) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                'message' => 'Informe ao menos 2 caracteres para buscar',
            ]);
        }

        $exact = filter_var($_GET['exact'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $res   = (new DtCatalogRepository($pdo))->globalSearch($q, $exact);

        ApiResponse::success($res, [
            'timestamp' => date('c'),
            'query'     => $q,
            'exact'     => $exact,
            'total'     => array_sum(array_map('count', $res)),
        ]);
    }

    /** GET /databases (§11) */
    public static function databases(string $method, array $segments, PDO $pdo): void
    {
        // GET /databases/compare?a=&b=          -> diff estrutural entre dois bancos (schema drift).
        // GET /databases/compare/export?a=&b=   -> mesmo diff em CSV (relatorio para o DBA).
        if (($segments[1] ?? '') === 'compare') {
            requireMethod(['GET']);
            $q = dt_query(['a', 'b']);
            $a = (int)($q['a'] ?? 0);
            $b = (int)($q['b'] ?? 0);
            if ($a <= 0 || $b <= 0) {
                ApiResponse::error('INVALID_PARAMS', 400, ['message' => 'Informe os dois bancos (parametros a e b).']);
            }
            if ($a === $b) {
                ApiResponse::error('INVALID_PARAMS', 400, ['message' => 'Escolha dois bancos diferentes.']);
            }
            $repo = new DtCatalogRepository($pdo);

            if (($segments[2] ?? '') === 'export') {
                $csv = $repo->compareExportCsv($a, $b);
                if ($csv === null) {
                    ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Banco nao encontrado no catalogo.']);
                }
                $corpo = "\xEF\xBB\xBF" . $csv;   // BOM p/ Excel abrir UTF-8 certo
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="comparar-esquemas-' . date('Ymd-His') . '.csv"');
                header('Content-Length: ' . strlen($corpo));
                echo $corpo;
                exit;
            }

            $r = $repo->compareSchemas($a, $b);
            if (($r['error'] ?? null) === 'not_found') {
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Banco nao encontrado no catalogo.']);
            }
            ApiResponse::success($r, ['timestamp' => date('c')]);
            return;
        }

        requireMethod(['GET']);
        $f = dt_query(['environment_id', 'connection_id', 'status', 'search', 'sort', 'dir', 'page', 'limit']);
        $r = (new DtCatalogRepository($pdo))->listDatabases($f);
        ApiResponse::success($r['items'], $r['meta'] + ['timestamp' => date('c')]);
    }

    /** GET /tables | GET /tables/{id} (§18, §19) */
    public static function tables(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new DtCatalogRepository($pdo);

        if (isset($segments[1]) && $segments[1] !== '') {
            $id = (int)$segments[1];
            if ($id <= 0) {
                ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'ID de tabela invalido']);
            }
            $detail = $repo->tableDetail($id);
            if ($detail === null) {
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Tabela nao encontrada']);
            }
            ApiResponse::success($detail, ['timestamp' => date('c')]);
        }

        $f = dt_query(['database_id', 'environment_id', 'classification', 'search',
                       'orphan_only', 'no_pk', 'sort', 'dir', 'page', 'limit']);
        $r = $repo->listTables($f);
        ApiResponse::success($r['items'], $r['meta'] + ['timestamp' => date('c')]);
    }

    /** GET /infrastructure (§38.2) | GET /infrastructure/tables?database_id= */
    public static function infrastructure(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new DtCatalogRepository($pdo);

        if (($segments[1] ?? '') === 'tables') {
            $dbId = (int)($_GET['database_id'] ?? 0);
            if ($dbId <= 0) {
                ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'database_id obrigatorio']);
            }
            ApiResponse::success($repo->tablesOfDatabase($dbId), ['timestamp' => date('c')]);
        }

        ApiResponse::success($repo->infrastructureTree(), ['timestamp' => date('c')]);
    }

    /** GET /applications (§38.3) */
    public static function applications(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        ApiResponse::success((new DtCatalogRepository($pdo))->applicationTree(), ['timestamp' => date('c')]);
    }

    /** GET /servers (§38.4) */
    public static function servers(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        ApiResponse::success((new DtCatalogRepository($pdo))->listServers(), ['timestamp' => date('c')]);
    }

    /** GET /dependencies (§38.10) */
    public static function dependencies(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);
        $repo = new DtCatalogRepository($pdo);

        // GET /dependencies/graph[?database_id=N] — grafo nó-aresta (§23).
        if (($segments[1] ?? '') === 'graph') {
            $dbId = isset($_GET['database_id']) ? (int)$_GET['database_id'] : 0;
            ApiResponse::success($repo->dependencyGraph($dbId), [
                'timestamp' => date('c'),
                'aviso'     => 'Grafo por banco: nos = tabelas com FK; arestas = chaves estrangeiras (alvo nulo = quebrada/externa).',
            ]);
            return;
        }

        ApiResponse::success($repo->dependencies(), [
            'timestamp' => date('c'),
            'aviso'     => 'Tabela orfa e um SINAL, nao necessariamente um problema (§23.1).',
        ]);
    }

    /** GET /quality?severity=&rule=&limit= (§38.11) */
    public static function quality(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);

        $where  = ['p.is_open = 1'];
        $params = [];
        if (!empty($_GET['severity'])) { $where[] = 'p.severity = :sev'; $params[':sev'] = (string)$_GET['severity']; }
        if (!empty($_GET['rule']))     { $where[] = 'p.rule_key = :rk';  $params[':rk']  = (string)$_GET['rule']; }
        if (!empty($_GET['table_id'])) { $where[] = 'p.table_id = :tid'; $params[':tid'] = (int)$_GET['table_id']; }

        $limit = max(1, min((int)($_GET['limit'] ?? 100), 300));

        $sql = 'SELECT p.id, p.rule_key, p.severity, p.metric_value, p.sample_size, p.detail,
                       p.first_seen_at, p.last_seen_at,
                       t.id table_id, t.name table_name, t.health_score,
                       c.name field_name,
                       b.name database_name,
                       r.label rule_label, r.dimension
                  FROM DT_Problema_Qualidade p
                  JOIN DT_Tabela t ON t.id = p.table_id
                  JOIN DT_Banco  b ON b.id = t.database_id
             LEFT JOIN DT_Campo  c ON c.id = p.field_id AND p.field_id > 0
             LEFT JOIN DT_Regra_Sistema r ON r.rule_key = p.rule_key
                 WHERE ' . implode(' AND ', $where) . '
              ORDER BY FIELD(p.severity,"critico","atencao","informativo"),
                       p.metric_value DESC, t.name
                 LIMIT :lim';

        $st = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $st->bindValue($k, $v);
        }
        $st->bindValue(':lim', $limit, PDO::PARAM_INT);
        $st->execute();

        $counters = $pdo->query(
            'SELECT
               SUM(severity = "critico")     critico,
               SUM(severity = "atencao")     atencao,
               SUM(severity = "informativo") informativo,
               COUNT(*)                      total
             FROM DT_Problema_Qualidade WHERE is_open = 1'
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $byRule = $pdo->query(
            'SELECT p.rule_key, r.label, r.dimension, p.severity, COUNT(*) n
               FROM DT_Problema_Qualidade p
          LEFT JOIN DT_Regra_Sistema r ON r.rule_key = p.rule_key
              WHERE p.is_open = 1
           GROUP BY p.rule_key, r.label, r.dimension, p.severity
           ORDER BY n DESC'
        )->fetchAll(PDO::FETCH_ASSOC);

        $scores = $pdo->query(
            'SELECT classification, COUNT(*) n, ROUND(AVG(score)) avg_score
               FROM DT_Score_Tabela GROUP BY classification'
        )->fetchAll(PDO::FETCH_ASSOC);

        ApiResponse::success([
            'issues'   => $st->fetchAll(PDO::FETCH_ASSOC),
            'counters' => $counters,
            'by_rule'  => $byRule,
            'scores'   => $scores,
        ], ['timestamp' => date('c')]);
    }

    /** GET /fields/sensitive?kind= (§20.2) */
    public static function fields(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['GET']);

        if (($segments[1] ?? '') !== 'sensitive') {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota nao encontrada']);
        }

        $kind = isset($_GET['kind']) && $_GET['kind'] !== '' ? (string)$_GET['kind'] : null;
        $rows = (new DtCatalogRepository($pdo))->sensitiveFields($kind);

        ApiResponse::success($rows, [
            'timestamp' => date('c'),
            'kind'      => $kind,
            'total'     => count($rows),
            'aviso'     => 'Classificacao por metadado (nome/comentario). E indicio, nao confirmacao de conteudo.',
        ]);
    }
}
