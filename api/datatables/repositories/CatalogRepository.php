<?php
// DataTables / CatalogRepository - leitura do catalogo (listagens, busca, dashboard)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Somente leitura. Paginacao SEMPRE no servidor (§42.1): o catalogo pode ter
// dezenas de milhares de campos e o front nunca recebe a colecao inteira.
declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/RepositoryException.php';

final class DtCatalogRepository
{
    /** Teto rigido de pagina. Protege memoria mesmo se o front pedir mais. */
    private const MAX_LIMIT = 200;

    /** Colunas permitidas em ORDER BY, por listagem. Whitelist anti-injecao. */
    private const SORTABLE = [
        'databases' => ['name', 'status', 'environment_label', 'size_bytes', 'table_count',
                        'field_count', 'last_inventory_at'],
        'tables'    => ['name', 'database_name', 'size_bytes', 'row_count_approx', 'field_count',
                        'index_count', 'fk_count', 'classification', 'health_score', 'update_time'],
        'fields'    => ['name', 'table_name', 'data_type', 'ordinal', 'sensitivity'],
    ];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // DASHBOARD (§9)
    // ═══════════════════════════════════════════════════════════════

    /** Big numbers da tela inicial (§9.1). Uma passada por agregado. */
    public function dashboardCounters(): array
    {
        try {
            $conn = $this->pdo->query(
                'SELECT
                    COUNT(*)                                              total,
                    SUM(status = "online")                                online,
                    SUM(status = "offline")                               offline,
                    SUM(status = "unstable")                              unstable,
                    SUM(status = "slow")                                  slow,
                    SUM(status = "maintenance")                           maintenance,
                    SUM(status = "credential_expired")                    cred_expired,
                    SUM(status = "untested")                              untested
                   FROM DT_Conexao WHERE is_active = 1'
            )->fetch(PDO::FETCH_ASSOC) ?: [];

            $cat = $this->pdo->query(
                'SELECT
                   (SELECT COUNT(*) FROM DT_Servidor WHERE is_active = 1)                         servers,
                   (SELECT COUNT(*) FROM DT_Banco  WHERE is_present = 1)                          `databases`,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1)                          tables,
                   (SELECT COUNT(*) FROM DT_Campo  WHERE is_present = 1)                          fields,
                   (SELECT COUNT(*) FROM DT_Indice WHERE is_present = 1)                          indexes_total,
                   (SELECT COUNT(*) FROM DT_Chave_Estrangeira WHERE is_present = 1)               fks,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1 AND classification = "critical") critical_tables,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1 AND is_orphan = 1)        orphan_tables,
                   (SELECT COUNT(*) FROM DT_Campo  WHERE is_present = 1 AND sensitivity IS NOT NULL) sensitive_fields,
                   (SELECT COUNT(*) FROM DT_Alerta WHERE status = "active")                       active_alerts,
                   (SELECT COUNT(*) FROM DT_Alerta WHERE status = "active" AND severity = "critico") critical_alerts,
                   (SELECT COUNT(*) FROM DT_Problema_Qualidade WHERE is_open = 1)                 quality_issues,
                   (SELECT COUNT(*) FROM DT_Interrupcao WHERE ended_at IS NULL)                   ongoing_outages,
                   (SELECT COUNT(*) FROM DT_Manutencao WHERE ended_at IS NULL)                    open_maintenance'
            )->fetch(PDO::FETCH_ASSOC) ?: [];

            return array_map('intval', array_merge(
                ['connections' => $conn['total'] ?? 0],
                array_map(fn($v) => (int)$v, $conn),
                $cat
            ));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::dashboardCounters');
        }
    }

    /** Distribuicao de recursos por ambiente (§9.2). */
    public function distributionByEnvironment(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT e.id, e.env_key, e.label, e.color,
                        COUNT(DISTINCT c.id) connections,
                        COUNT(DISTINCT b.id) `databases`,
                        COALESCE(SUM(b.table_count), 0) `tables`
                   FROM DT_Ambiente e
              LEFT JOIN DT_Conexao c ON c.environment_id = e.id AND c.is_active = 1
              LEFT JOIN DT_Banco   b ON b.environment_id = e.id AND b.is_present = 1
                  WHERE e.is_active = 1
               GROUP BY e.id, e.env_key, e.label, e.color
               ORDER BY e.order_index'
            );
            return array_map(function ($r) {
                foreach (['id', 'connections', 'databases', 'tables'] as $k) {
                    $r[$k] = (int)$r[$k];
                }
                return $r;
            }, $st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::distributionByEnvironment');
        }
    }

    /** Conexoes com problema, para a area de destaque do dashboard (§9.3). */
    public function problemConnections(int $limit = 25): array
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT c.id, c.name, c.host, c.db_name, c.status, c.last_error, c.last_check_at,
                        c.last_success_at, s.name server_name, e.label environment_label, e.color environment_color,
                        sa.since, sa.step_failed, sa.consecutive_fail,
                        TIMESTAMPDIFF(SECOND, sa.since, NOW()) status_duration_sec
                   FROM DT_Conexao c
              LEFT JOIN DT_Servidor s  ON s.id = c.server_id
              LEFT JOIN DT_Ambiente e  ON e.id = c.environment_id
              LEFT JOIN DT_Status_Atual sa ON sa.connection_id = c.id
                  WHERE c.is_active = 1
                    AND c.status IN ("offline","unstable","slow","credential_expired","maintenance")
               ORDER BY FIELD(c.status,"offline","credential_expired","unstable","slow","maintenance"),
                        sa.since
                  LIMIT :lim'
            );
            $st->bindValue(':lim', $limit, PDO::PARAM_INT);
            $st->execute();
            return $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::problemConnections');
        }
    }

    /** Pendencias estruturais (§9.4). */
    public function structuralPending(): array
    {
        try {
            return $this->pdo->query(
                'SELECT
                   (SELECT COUNT(*) FROM DT_Conexao WHERE is_active = 1 AND last_inventory_at IS NULL)  not_inventoried,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1 AND (table_comment IS NULL OR table_comment = "")) tables_no_comment,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1 AND is_orphan = 1)              orphan_tables,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1 AND has_pk = 0 AND table_type = "BASE TABLE") tables_no_pk,
                   (SELECT COUNT(*) FROM DT_Chave_Estrangeira WHERE is_present = 1 AND is_broken = 1)   broken_fks,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 0)                                tables_vanished,
                   (SELECT COUNT(*) FROM DT_Campo  WHERE is_present = 0)                                fields_vanished,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1 AND first_seen_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) new_tables_7d'
            )->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::structuralPending');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LISTAGENS
    // ═══════════════════════════════════════════════════════════════

    /** Bancos com saude e estrutura (§11). */
    public function listDatabases(array $f = []): array
    {
        $where  = ['b.is_present = 1'];
        $params = [];

        if (!empty($f['environment_id'])) { $where[] = 'b.environment_id = :env'; $params[':env'] = (int)$f['environment_id']; }
        if (!empty($f['connection_id'])) { $where[] = 'b.connection_id = :conn'; $params[':conn'] = (int)$f['connection_id']; }
        if (!empty($f['status']))        { $where[] = 'c.status = :st';          $params[':st']   = (string)$f['status']; }
        if (!empty($f['search']))        { $where[] = 'b.name LIKE :q';          $params[':q']    = '%' . $f['search'] . '%'; }

        [$order, $dir] = $this->sortFor('databases', $f, 'name');
        [$limit, $offset, $page] = $this->pageFor($f);

        $sqlBase = 'FROM DT_Banco b
                LEFT JOIN DT_Conexao  c ON c.id = b.connection_id
                LEFT JOIN DT_Servidor s ON s.id = b.server_id
                LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                    WHERE ' . implode(' AND ', $where);

        try {
            $total = $this->countWith("SELECT COUNT(*) {$sqlBase}", $params);

            $sql = "SELECT b.id, b.name, b.charset, b.collation, b.size_bytes, b.table_count,
                           b.field_count, b.classification, b.status, b.last_inventory_at,
                           b.first_seen_at, b.last_seen_at,
                           c.id connection_id, c.name connection_name, c.status connection_status,
                           c.last_check_at, c.last_success_at, c.last_error,
                           s.name server_name,
                           e.label environment_label, e.color environment_color, e.env_key
                    {$sqlBase}
                    ORDER BY {$order} {$dir}
                    LIMIT :lim OFFSET :off";

            $st = $this->pdo->prepare($sql);
            foreach ($params as $k => $v) { $st->bindValue($k, $v); }
            $st->bindValue(':lim', $limit, PDO::PARAM_INT);
            $st->bindValue(':off', $offset, PDO::PARAM_INT);
            $st->execute();

            return $this->paged($st->fetchAll(PDO::FETCH_ASSOC), $total, $page, $limit);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::listDatabases');
        }
    }

    /** Tabelas catalogadas (§18). */
    public function listTables(array $f = []): array
    {
        $where  = ['t.is_present = 1'];
        $params = [];

        if (!empty($f['database_id']))   { $where[] = 't.database_id = :db';     $params[':db']  = (int)$f['database_id']; }
        if (!empty($f['environment_id'])){ $where[] = 'b.environment_id = :env'; $params[':env'] = (int)$f['environment_id']; }
        if (!empty($f['classification'])){ $where[] = 't.classification = :cls'; $params[':cls'] = (string)$f['classification']; }
        if (!empty($f['search']))        { $where[] = 't.name LIKE :q';          $params[':q']   = '%' . $f['search'] . '%'; }
        if (!empty($f['orphan_only']))   { $where[] = 't.is_orphan = 1'; }
        if (!empty($f['no_pk']))         { $where[] = 't.has_pk = 0 AND t.table_type = "BASE TABLE"'; }

        [$order, $dir] = $this->sortFor('tables', $f, 'name');
        [$limit, $offset, $page] = $this->pageFor($f);

        $sqlBase = 'FROM DT_Tabela t
                    JOIN DT_Banco  b ON b.id = t.database_id
               LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                   WHERE ' . implode(' AND ', $where);

        try {
            $total = $this->countWith("SELECT COUNT(*) {$sqlBase}", $params);

            // Query montada por extenso (nao reusa $sqlBase) porque o LEFT JOIN de
            // score precisa vir antes do WHERE - $sqlBase ja carrega o WHERE dentro.
            $sql = "SELECT t.id, t.name, t.table_type, t.engine, t.collation, t.row_count_approx,
                           t.size_bytes, t.field_count, t.index_count, t.fk_count, t.has_pk,
                           t.classification, t.is_orphan, t.health_score, t.table_comment,
                           t.create_time, t.update_time, t.first_seen_at,
                           b.id database_id, b.name database_name,
                           e.label environment_label, e.color environment_color,
                           sc.score, sc.classification health_class,
                           (SELECT COUNT(*) FROM DT_Problema_Qualidade p
                             WHERE p.table_id = t.id AND p.is_open = 1) open_issues
                      FROM DT_Tabela t
                      JOIN DT_Banco  b ON b.id = t.database_id
                 LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                 LEFT JOIN DT_Score_Tabela sc ON sc.table_id = t.id
                     WHERE " . implode(' AND ', $where) . "
                     ORDER BY {$order} {$dir}
                     LIMIT :lim OFFSET :off";

            $st = $this->pdo->prepare($sql);
            foreach ($params as $k => $v) { $st->bindValue($k, $v); }
            $st->bindValue(':lim', $limit, PDO::PARAM_INT);
            $st->bindValue(':off', $offset, PDO::PARAM_INT);
            $st->execute();

            return $this->paged($st->fetchAll(PDO::FETCH_ASSOC), $total, $page, $limit);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::listTables');
        }
    }

    /** Detalhe completo de uma tabela (§19). */
    public function tableDetail(int $tableId): ?array
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT t.*, b.name database_name, b.id database_id,
                        c.name connection_name, c.host, s.name server_name,
                        e.label environment_label, e.color environment_color
                   FROM DT_Tabela t
                   JOIN DT_Banco b   ON b.id = t.database_id
              LEFT JOIN DT_Conexao c  ON c.id = b.connection_id
              LEFT JOIN DT_Servidor s ON s.id = b.server_id
              LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                  WHERE t.id = :id LIMIT 1'
            );
            $st->execute([':id' => $tableId]);
            $table = $st->fetch(PDO::FETCH_ASSOC);
            if (!$table) {
                return null;
            }

            $fields = $this->pdo->prepare(
                'SELECT * FROM DT_Campo WHERE table_id = :id ORDER BY ordinal'
            );
            $fields->execute([':id' => $tableId]);

            $idx = $this->pdo->prepare(
                'SELECT * FROM DT_Indice WHERE table_id = :id ORDER BY name'
            );
            $idx->execute([':id' => $tableId]);

            $fks = $this->pdo->prepare(
                'SELECT * FROM DT_Chave_Estrangeira WHERE table_id = :id ORDER BY constraint_name'
            );
            $fks->execute([':id' => $tableId]);

            // Quem referencia ESTA tabela (§19.6 - dependencias inversas).
            $refBy = $this->pdo->prepare(
                'SELECT fk.table_id, t2.name table_name, b2.name database_name,
                        fk.constraint_name, fk.column_name, fk.ref_column
                   FROM DT_Chave_Estrangeira fk
                   JOIN DT_Tabela t2 ON t2.id = fk.table_id
                   JOIN DT_Banco  b2 ON b2.id = t2.database_id
                  WHERE fk.ref_table = :name AND fk.is_present = 1 AND fk.table_id <> :id'
            );
            $refBy->execute([':name' => $table['name'], ':id' => $tableId]);

            $issues = $this->pdo->prepare(
                'SELECT p.*, r.label rule_label, r.dimension
                   FROM DT_Problema_Qualidade p
              LEFT JOIN DT_Regra_Sistema r ON r.rule_key = p.rule_key
                  WHERE p.table_id = :id AND p.is_open = 1
               ORDER BY FIELD(p.severity,"critico","atencao","informativo")'
            );
            $issues->execute([':id' => $tableId]);

            $score = $this->pdo->prepare('SELECT * FROM DT_Score_Tabela WHERE table_id = :id');
            $score->execute([':id' => $tableId]);

            return [
                'table'          => $table,
                'fields'         => $this->decodeFields($fields->fetchAll(PDO::FETCH_ASSOC)),
                'indexes'        => $idx->fetchAll(PDO::FETCH_ASSOC),
                'foreign_keys'   => $fks->fetchAll(PDO::FETCH_ASSOC),
                'referenced_by'  => $refBy->fetchAll(PDO::FETCH_ASSOC),
                'quality_issues' => $issues->fetchAll(PDO::FETCH_ASSOC),
                'score'          => $score->fetch(PDO::FETCH_ASSOC) ?: null,
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::tableDetail');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BUSCA GLOBAL (§21)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Localiza servidor, banco, tabela ou campo.
     * Correspondencia EXATA tem prioridade (§21.1); o modo parcial e opcional.
     */
    public function globalSearch(string $term, bool $exact = false, int $limit = 50): array
    {
        $term = trim($term);
        if ($term === '') {
            return ['fields' => [], 'tables' => [], 'databases' => [], 'servers' => []];
        }

        $op   = $exact ? '=' : 'LIKE';
        $val  = $exact ? $term : '%' . $term . '%';

        try {
            // Campos: o caso de uso principal - "em quais tabelas Id_Usuario existe?"
            $f = $this->pdo->prepare(
                "SELECT c.id, c.name, c.data_type, c.column_type, c.is_pk, c.is_fk, c.sensitivity,
                        t.id table_id, t.name table_name,
                        b.id database_id, b.name database_name,
                        s.name server_name, e.label environment_label, e.color environment_color
                   FROM DT_Campo c
                   JOIN DT_Tabela t ON t.id = c.table_id
                   JOIN DT_Banco  b ON b.id = t.database_id
              LEFT JOIN DT_Servidor s ON s.id = b.server_id
              LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                  WHERE c.name {$op} :v AND c.is_present = 1
               ORDER BY b.name, t.name
                  LIMIT :lim"
            );
            $f->bindValue(':v', $val);
            $f->bindValue(':lim', $limit, PDO::PARAM_INT);
            $f->execute();

            $t = $this->pdo->prepare(
                "SELECT t.id, t.name, t.classification, t.field_count, t.size_bytes,
                        b.id database_id, b.name database_name, e.label environment_label
                   FROM DT_Tabela t
                   JOIN DT_Banco b ON b.id = t.database_id
              LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                  WHERE t.name {$op} :v AND t.is_present = 1
               ORDER BY b.name, t.name
                  LIMIT :lim"
            );
            $t->bindValue(':v', $val);
            $t->bindValue(':lim', $limit, PDO::PARAM_INT);
            $t->execute();

            $d = $this->pdo->prepare(
                "SELECT b.id, b.name, b.table_count, b.size_bytes, b.status,
                        e.label environment_label, s.name server_name
                   FROM DT_Banco b
              LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
              LEFT JOIN DT_Servidor s ON s.id = b.server_id
                  WHERE b.name {$op} :v AND b.is_present = 1
                  LIMIT :lim"
            );
            $d->bindValue(':v', $val);
            $d->bindValue(':lim', $limit, PDO::PARAM_INT);
            $d->execute();

            $sv = $this->pdo->prepare(
                "SELECT id, name, identifier, hostname, status, provider
                   FROM DT_Servidor
                  WHERE (name {$op} :v OR identifier {$op} :v2 OR hostname {$op} :v3) AND is_active = 1
                  LIMIT :lim"
            );
            $sv->bindValue(':v', $val);
            $sv->bindValue(':v2', $val);
            $sv->bindValue(':v3', $val);
            $sv->bindValue(':lim', $limit, PDO::PARAM_INT);
            $sv->execute();

            return [
                'fields'    => $f->fetchAll(PDO::FETCH_ASSOC),
                'tables'    => $t->fetchAll(PDO::FETCH_ASSOC),
                'databases' => $d->fetchAll(PDO::FETCH_ASSOC),
                'servers'   => $sv->fetchAll(PDO::FETCH_ASSOC),
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::globalSearch');
        }
    }

    /** Campos sensiveis agrupados (§20.2). */
    public function sensitiveFields(?string $kind = null, int $limit = 200): array
    {
        try {
            $sql = 'SELECT c.id, c.name, c.sensitivity, c.labels, c.data_type,
                           t.id table_id, t.name table_name, b.name database_name,
                           e.label environment_label
                      FROM DT_Campo c
                      JOIN DT_Tabela t ON t.id = c.table_id
                      JOIN DT_Banco  b ON b.id = t.database_id
                 LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                     WHERE c.sensitivity IS NOT NULL AND c.is_present = 1'
                 . ($kind !== null ? ' AND c.sensitivity = :k' : '') .
                  ' ORDER BY c.sensitivity, b.name, t.name LIMIT :lim';

            $st = $this->pdo->prepare($sql);
            if ($kind !== null) {
                $st->bindValue(':k', $kind);
            }
            $st->bindValue(':lim', $limit, PDO::PARAM_INT);
            $st->execute();
            return $this->decodeFields($st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::sensitiveFields');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ARVORE DE INFRAESTRUTURA (§8.1 / §38.2)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Servidor -> Banco -> Tabela, montada em 2 consultas.
     * Os CAMPOS ficam de fora de proposito: sao dezenas de milhares e a arvore
     * viraria um payload impraticavel. O nivel de campo mora no detalhe da tabela.
     */
    public function infrastructureTree(): array
    {
        try {
            // Conexao sem servidor cadastrado ainda precisa aparecer: agrupa em
            // um no sintetico, senao o banco fica invisivel na arvore.
            $conns = $this->pdo->query(
                'SELECT c.id, c.name, c.host, c.port, c.status, c.source_type,
                        s.id server_id, s.name server_name, s.identifier server_identifier,
                        s.provider, s.status server_status,
                        e.label environment_label, e.color environment_color
                   FROM DT_Conexao c
              LEFT JOIN DT_Servidor s ON s.id = c.server_id
              LEFT JOIN DT_Ambiente e ON e.id = c.environment_id
                  WHERE c.is_active = 1
               ORDER BY COALESCE(s.name, "~"), c.name'
            )->fetchAll(PDO::FETCH_ASSOC);

            $dbs = $this->pdo->query(
                'SELECT b.id, b.connection_id, b.name, b.size_bytes, b.table_count,
                        b.field_count, b.status, b.is_present
                   FROM DT_Banco b
                  WHERE b.is_present = 1
               ORDER BY b.name'
            )->fetchAll(PDO::FETCH_ASSOC);

            $byConn = [];
            foreach ($dbs as $d) {
                $byConn[(int)$d['connection_id']][] = $d;
            }

            $servers = [];
            foreach ($conns as $c) {
                $key = $c['server_id'] !== null ? 'srv_' . $c['server_id'] : 'sem_servidor';
                if (!isset($servers[$key])) {
                    $servers[$key] = [
                        'server_id'   => $c['server_id'] !== null ? (int)$c['server_id'] : null,
                        'name'        => $c['server_name'] ?? 'Sem servidor cadastrado',
                        'identifier'  => $c['server_identifier'],
                        'provider'    => $c['provider'],
                        'status'      => $c['server_status'],
                        'connections' => [],
                    ];
                }
                $servers[$key]['connections'][] = [
                    'id'                 => (int)$c['id'],
                    'name'               => $c['name'],
                    'host'               => $c['host'],
                    'port'               => (int)$c['port'],
                    'status'             => $c['status'],
                    'source_type'        => $c['source_type'],
                    'environment_label'  => $c['environment_label'],
                    'environment_color'  => $c['environment_color'],
                    'databases'          => array_map(static function ($d) {
                        return [
                            'id'          => (int)$d['id'],
                            'name'        => $d['name'],
                            'size_bytes'  => $d['size_bytes'] !== null ? (int)$d['size_bytes'] : null,
                            'table_count' => (int)$d['table_count'],
                            'field_count' => (int)$d['field_count'],
                            'status'      => $d['status'],
                        ];
                    }, $byConn[(int)$c['id']] ?? []),
                ];
            }

            return array_values($servers);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::infrastructureTree');
        }
    }

    /** Tabelas de um banco, para expansao sob demanda na arvore. */
    public function tablesOfDatabase(int $dbId, int $limit = 500): array
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT id, name, table_type, row_count_approx, size_bytes, field_count,
                        is_orphan, has_pk, health_score, classification
                   FROM DT_Tabela
                  WHERE database_id = :d AND is_present = 1
               ORDER BY name
                  LIMIT :lim'
            );
            $st->bindValue(':d', $dbId, PDO::PARAM_INT);
            $st->bindValue(':lim', $limit, PDO::PARAM_INT);
            $st->execute();
            return $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::tablesOfDatabase');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DEPENDENCIAS (§23 / §38.10)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Relacoes estruturais em formato de lista (§23: sem diagrama grafico).
     * Traz o ranking de mais referenciadas, as orfas e as FKs quebradas.
     */
    public function dependencies(int $limit = 100): array
    {
        try {
            $mostReferenced = $this->pdo->prepare(
                'SELECT t.id, t.name, b.name database_name, t.fk_count,
                        COUNT(fk.id) referenced_by,
                        (SELECT COUNT(*) FROM DT_Chave_Estrangeira x
                          WHERE x.ref_table = t.name AND x.is_broken = 1 AND x.is_present = 1) broken_in
                   FROM DT_Tabela t
                   JOIN DT_Banco b ON b.id = t.database_id
              LEFT JOIN DT_Chave_Estrangeira fk ON fk.ref_table = t.name AND fk.is_present = 1
                  WHERE t.is_present = 1
               GROUP BY t.id, t.name, b.name, t.fk_count
                 HAVING referenced_by > 0
               ORDER BY referenced_by DESC
                  LIMIT :lim'
            );
            $mostReferenced->bindValue(':lim', $limit, PDO::PARAM_INT);
            $mostReferenced->execute();

            $orphans = $this->pdo->prepare(
                'SELECT t.id, t.name, b.name database_name, t.row_count_approx, t.size_bytes,
                        t.classification, t.first_seen_at
                   FROM DT_Tabela t
                   JOIN DT_Banco b ON b.id = t.database_id
                  WHERE t.is_present = 1 AND t.is_orphan = 1
               ORDER BY t.size_bytes DESC
                  LIMIT :lim'
            );
            $orphans->bindValue(':lim', $limit, PDO::PARAM_INT);
            $orphans->execute();

            $broken = $this->pdo->query(
                'SELECT fk.id, fk.constraint_name, fk.column_name, fk.ref_table, fk.ref_column,
                        t.id table_id, t.name table_name, b.name database_name
                   FROM DT_Chave_Estrangeira fk
                   JOIN DT_Tabela t ON t.id = fk.table_id
                   JOIN DT_Banco  b ON b.id = t.database_id
                  WHERE fk.is_present = 1 AND fk.is_broken = 1
               ORDER BY t.name
                  LIMIT 200'
            )->fetchAll(PDO::FETCH_ASSOC);

            $counters = $this->pdo->query(
                'SELECT
                   (SELECT COUNT(*) FROM DT_Chave_Estrangeira WHERE is_present = 1)                 total_fks,
                   (SELECT COUNT(*) FROM DT_Chave_Estrangeira WHERE is_present = 1 AND is_broken=1) broken_fks,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1 AND is_orphan = 1)          orphans,
                   (SELECT COUNT(*) FROM DT_Tabela WHERE is_present = 1)                            total_tables'
            )->fetch(PDO::FETCH_ASSOC) ?: [];

            return [
                'counters'        => $counters,
                'most_referenced' => $mostReferenced->fetchAll(PDO::FETCH_ASSOC),
                'orphans'         => $orphans->fetchAll(PDO::FETCH_ASSOC),
                'broken'          => $broken,
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::dependencies');
        }
    }

    /**
     * Grafo (nó-aresta) de dependências de UM banco (§23 — o diagrama que faltava).
     * Nós = tabelas com ao menos uma FK (entrada ou saída); arestas = FKs presentes
     * resolvidas por NOME dentro do mesmo banco (alvo null = quebrada/externa).
     * `databases` lista os bancos que têm FK (seletor da UI); sem `databaseId`,
     * assume o banco com mais FKs. Escopo por banco mantém o grafo legível.
     */
    public function dependencyGraph(int $databaseId = 0): array
    {
        try {
            $databases = $this->pdo->query(
                'SELECT b.id, b.name, COUNT(fk.id) fk_count
                   FROM DT_Banco b
                   JOIN DT_Tabela t ON t.database_id = b.id AND t.is_present = 1
                   JOIN DT_Chave_Estrangeira fk ON fk.table_id = t.id AND fk.is_present = 1
                  WHERE b.is_present = 1
               GROUP BY b.id, b.name
                 HAVING fk_count > 0
               ORDER BY fk_count DESC'
            )->fetchAll(PDO::FETCH_ASSOC);
            foreach ($databases as &$d) { $d['id'] = (int)$d['id']; $d['fk_count'] = (int)$d['fk_count']; }
            unset($d);

            if ($databaseId <= 0) {
                $databaseId = (int)($databases[0]['id'] ?? 0);
            }
            if ($databaseId <= 0) {
                return ['database_id' => 0, 'databases' => $databases, 'nodes' => [], 'edges' => []];
            }

            $edgesRaw = $this->pdo->prepare(
                'SELECT fk.id, fk.table_id AS source, tgt.id AS target, fk.is_broken, fk.ref_table
                   FROM DT_Chave_Estrangeira fk
                   JOIN DT_Tabela st  ON st.id = fk.table_id AND st.database_id = :dba AND st.is_present = 1
              LEFT JOIN DT_Tabela tgt ON tgt.name = fk.ref_table AND tgt.database_id = :dbb AND tgt.is_present = 1
                  WHERE fk.is_present = 1'
            );
            $edgesRaw->execute([':dba' => $databaseId, ':dbb' => $databaseId]);

            $edges  = [];
            $usados = [];
            foreach ($edgesRaw->fetchAll(PDO::FETCH_ASSOC) as $e) {
                $src = (int)$e['source'];
                $tgt = $e['target'] !== null ? (int)$e['target'] : null;
                $usados[$src] = true;
                if ($tgt !== null) { $usados[$tgt] = true; }
                $edges[] = [
                    'source'    => $src,
                    'target'    => $tgt,                       // null = FK quebrada/externa
                    'ref_table' => $e['ref_table'],
                    'broken'    => ((int)$e['is_broken'] === 1 || $tgt === null),
                ];
            }

            $nodes = [];
            if ($usados) {
                $ids = array_keys($usados);
                $ph  = implode(',', array_fill(0, count($ids), '?'));
                $st  = $this->pdo->prepare(
                    "SELECT t.id, t.name, t.fk_count, t.is_orphan, t.size_bytes, t.field_count
                       FROM DT_Tabela t WHERE t.id IN ($ph)"
                );
                $st->execute($ids);
                foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $n) {
                    $nodes[] = [
                        'id'          => (int)$n['id'],
                        'name'        => $n['name'],
                        'fk_out'      => (int)$n['fk_count'],
                        'is_orphan'   => ((int)$n['is_orphan'] === 1),
                        'size_bytes'  => $n['size_bytes'] !== null ? (int)$n['size_bytes'] : null,
                        'field_count' => (int)$n['field_count'],
                    ];
                }
            }

            return [
                'database_id' => $databaseId,
                'databases'   => $databases,
                'nodes'       => $nodes,
                'edges'       => $edges,
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::dependencyGraph');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES (§10 / §38.4)
    // ═══════════════════════════════════════════════════════════════

    /** Servidores com agregados das conexoes que hospedam. */
    public function listServers(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT s.*, e.label environment_label, e.color environment_color,
                        COUNT(DISTINCT c.id)                                connection_count,
                        SUM(c.status = "online")                            conn_online,
                        SUM(c.status IN ("offline","credential_expired"))   conn_offline,
                        COUNT(DISTINCT b.id)                                database_count,
                        COALESCE(SUM(DISTINCT b.size_bytes), 0)             total_size,
                        MAX(c.last_check_at)                                last_check_at
                   FROM DT_Servidor s
              LEFT JOIN DT_Conexao  c ON c.server_id = s.id AND c.is_active = 1
              LEFT JOIN DT_Banco    b ON b.connection_id = c.id AND b.is_present = 1
              LEFT JOIN DT_Ambiente e ON e.id = s.environment_id
                  WHERE s.is_active = 1
               GROUP BY s.id, e.label, e.color
               ORDER BY s.name'
            );
            return array_map(static function ($r) {
                // total_size incluso: sem o (int) ele volta como STRING (SUM do PDO)
                // e o `reduce(s + total_size)` do front CONCATENA em vez de somar
                // (ex.: "6336114688"+"134217728" => volume total astronomico).
                foreach (['id', 'connection_count', 'conn_online', 'conn_offline', 'database_count', 'total_size'] as $k) {
                    $r[$k] = (int)($r[$k] ?? 0);
                }
                // IP mascarado por padrao (§10.1): so os 2 primeiros octetos.
                if (!empty($r['ip'])) {
                    $r['ip_masked'] = preg_replace('/^(\d+\.\d+)\.\d+\.\d+$/', '$1.x.x', (string)$r['ip']);
                }
                return $r;
            }, $st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::listServers');
        }
    }

    /** Visao por aplicacao -> modulo -> banco (§8.2 / §38.3). */
    public function applicationTree(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT a.id app_id, a.app_key, a.label app_label,
                        m.id module_id, m.label module_label,
                        c.id connection_id, c.name connection_name, c.status,
                        b.id database_id, b.name database_name, b.table_count,
                        e.label environment_label, e.color environment_color
                   FROM DT_Aplicacao a
              LEFT JOIN DT_Modulo   m ON m.application_id = a.id
              LEFT JOIN DT_Conexao  c ON c.application_id = a.id AND c.is_active = 1
              LEFT JOIN DT_Banco    b ON b.connection_id = c.id AND b.is_present = 1
              LEFT JOIN DT_Ambiente e ON e.id = c.environment_id
                  WHERE a.is_active = 1
               ORDER BY a.label, m.label, c.name, b.name'
            );

            $apps = [];
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $aid = (int)$r['app_id'];
                if (!isset($apps[$aid])) {
                    $apps[$aid] = [
                        'id' => $aid, 'app_key' => $r['app_key'], 'label' => $r['app_label'],
                        'modules' => [], 'connections' => [],
                    ];
                }
                if ($r['module_id'] !== null && !isset($apps[$aid]['modules'][(int)$r['module_id']])) {
                    $apps[$aid]['modules'][(int)$r['module_id']] = $r['module_label'];
                }
                if ($r['connection_id'] !== null) {
                    $cid = (int)$r['connection_id'];
                    if (!isset($apps[$aid]['connections'][$cid])) {
                        $apps[$aid]['connections'][$cid] = [
                            'id' => $cid, 'name' => $r['connection_name'], 'status' => $r['status'],
                            'environment_label' => $r['environment_label'],
                            'environment_color' => $r['environment_color'],
                            'databases' => [],
                        ];
                    }
                    if ($r['database_id'] !== null) {
                        $apps[$aid]['connections'][$cid]['databases'][(int)$r['database_id']] = [
                            'id' => (int)$r['database_id'], 'name' => $r['database_name'],
                            'table_count' => (int)$r['table_count'],
                        ];
                    }
                }
            }

            // Normaliza mapas para listas.
            return array_values(array_map(static function ($a) {
                $a['modules'] = array_values($a['modules']);
                $a['connections'] = array_values(array_map(static function ($c) {
                    $c['databases'] = array_values($c['databases']);
                    return $c;
                }, $a['connections']));
                return $a;
            }, $apps));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::applicationTree');
        }
    }

    /** Ambientes, servidores e aplicacoes para popular filtros do front. */
    public function lookups(): array
    {
        try {
            return [
                'environments' => $this->pdo->query(
                    'SELECT id, env_key, label, color FROM DT_Ambiente WHERE is_active = 1 ORDER BY order_index'
                )->fetchAll(PDO::FETCH_ASSOC),
                'servers' => $this->pdo->query(
                    'SELECT id, name, identifier, status FROM DT_Servidor WHERE is_active = 1 ORDER BY name'
                )->fetchAll(PDO::FETCH_ASSOC),
                'applications' => $this->pdo->query(
                    'SELECT id, app_key, label FROM DT_Aplicacao WHERE is_active = 1 ORDER BY label'
                )->fetchAll(PDO::FETCH_ASSOC),
                'sensitivity_kinds' => $this->pdo->query(
                    'SELECT sensitivity k, COUNT(*) n FROM DT_Campo
                      WHERE sensitivity IS NOT NULL AND is_present = 1
                   GROUP BY sensitivity ORDER BY n DESC'
                )->fetchAll(PDO::FETCH_ASSOC),
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::lookups');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    /** ORDER BY seguro: so aceita coluna da whitelist. */
    private function sortFor(string $listing, array $f, string $default): array
    {
        $allowed = self::SORTABLE[$listing] ?? [$default];
        $col = (string)($f['sort'] ?? $default);
        if (!in_array($col, $allowed, true)) {
            $col = $default;
        }
        $dir = strtoupper((string)($f['dir'] ?? 'ASC')) === 'DESC' ? 'DESC' : 'ASC';

        // Prefixa a tabela para evitar ambiguidade nos JOINs.
        $prefix = match (true) {
            in_array($col, ['database_name'], true)      => 'b.',
            in_array($col, ['environment_label'], true)  => 'e.',
            in_array($col, ['table_name'], true)         => 't.',
            $listing === 'databases'                     => 'b.',
            $listing === 'tables'                        => 't.',
            default                                      => '',
        };
        if ($col === 'database_name') { $col = 'name'; }
        if ($col === 'environment_label') { $col = 'label'; }

        return [$prefix . $col, $dir];
    }

    /** Paginacao com teto rigido. */
    private function pageFor(array $f): array
    {
        $limit = (int)($f['limit'] ?? 25);
        $limit = max(1, min($limit, self::MAX_LIMIT));
        $page  = max(1, (int)($f['page'] ?? 1));
        return [$limit, ($page - 1) * $limit, $page];
    }

    private function countWith(string $sql, array $params): int
    {
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $st->bindValue($k, $v);
        }
        $st->execute();
        return (int)$st->fetchColumn();
    }

    private function paged(array $items, int $total, int $page, int $limit): array
    {
        return [
            'items' => $items,
            'meta'  => [
                'total' => $total,
                'page'  => $page,
                'limit' => $limit,
                'pages' => $limit > 0 ? (int)ceil($total / $limit) : 0,
            ],
        ];
    }

    /**
     * Comparacao ESTRUTURAL entre dois bancos catalogados (deteccao de schema
     * drift entre clones prod/staging/dev). Read-only, so metadados LOCAIS
     * (DT_Tabela/DT_Campo) — NAO toca os bancos monitorados. Considera apenas
     * objetos presentes (is_present=1). Listas limitadas (bounded) + flag de
     * truncamento; tabelas com diferenca de coluna ordenadas pela mais divergente.
     */
    public function compareSchemas(int $aId, int $bId): array
    {
        try {
            // Cabecalho: nome + ambiente de cada banco (e valida a existencia).
            $mSt = $this->pdo->prepare(
                'SELECT b.id, b.name, e.label environment_label, e.color environment_color
                   FROM DT_Banco b
              LEFT JOIN DT_Ambiente e ON e.id = b.environment_id
                  WHERE b.id IN (:a, :b)'
            );
            $mSt->execute([':a' => $aId, ':b' => $bId]);
            $metas = [];
            foreach ($mSt->fetchAll(PDO::FETCH_ASSOC) as $m) {
                $metas[(int)$m['id']] = $m;
            }
            if (!isset($metas[$aId]) || !isset($metas[$bId])) {
                return ['error' => 'not_found'];
            }

            // Tabelas presentes dos dois bancos, em uma consulta.
            $tSt = $this->pdo->prepare(
                'SELECT id, database_id, name, table_type
                   FROM DT_Tabela
                  WHERE database_id IN (:a, :b) AND is_present = 1'
            );
            $tSt->execute([':a' => $aId, ':b' => $bId]);
            $tabelasA = [];
            $tabelasB = [];
            $todosTabIds = [];
            foreach ($tSt->fetchAll(PDO::FETCH_ASSOC) as $t) {
                $todosTabIds[] = (int)$t['id'];
                if ((int)$t['database_id'] === $aId) {
                    $tabelasA[$t['name']] = ['id' => (int)$t['id'], 'type' => $t['table_type']];
                } else {
                    $tabelasB[$t['name']] = ['id' => (int)$t['id'], 'type' => $t['table_type']];
                }
            }

            // Colunas presentes de todas essas tabelas (uma consulta, placeholders posicionais).
            $colsPorTabela = [];
            if ($todosTabIds) {
                $ph  = implode(',', array_fill(0, count($todosTabIds), '?'));
                $cSt = $this->pdo->prepare(
                    "SELECT table_id, name, column_type
                       FROM DT_Campo
                      WHERE table_id IN ($ph) AND is_present = 1"
                );
                $cSt->execute($todosTabIds);
                foreach ($cSt->fetchAll(PDO::FETCH_ASSOC) as $c) {
                    $colsPorTabela[(int)$c['table_id']][$c['name']] = (string)$c['column_type'];
                }
            }

            // Diff de tabelas.
            $LIM = 300;
            $soA = [];
            $soB = [];
            foreach ($tabelasA as $nome => $_) {
                if (!isset($tabelasB[$nome])) { $soA[] = $nome; }
            }
            foreach ($tabelasB as $nome => $_) {
                if (!isset($tabelasA[$nome])) { $soB[] = $nome; }
            }
            sort($soA);
            sort($soB);
            $comuns = array_values(array_intersect(array_keys($tabelasA), array_keys($tabelasB)));
            sort($comuns);

            // Diff de colunas nas tabelas comuns.
            $tabelasDiff  = [];
            $totalColDiff = 0;
            foreach ($comuns as $nome) {
                $colsA = $colsPorTabela[$tabelasA[$nome]['id']] ?? [];
                $colsB = $colsPorTabela[$tabelasB[$nome]['id']] ?? [];
                $colSoA  = [];
                $colSoB  = [];
                $tipoDif = [];
                foreach ($colsA as $cn => $tipoA) {
                    if (!isset($colsB[$cn])) {
                        $colSoA[] = $cn;
                    } elseif ($tipoA !== $colsB[$cn]) {
                        $tipoDif[] = ['column' => $cn, 'a' => $tipoA, 'b' => $colsB[$cn]];
                    }
                }
                foreach ($colsB as $cn => $_) {
                    if (!isset($colsA[$cn])) { $colSoB[] = $cn; }
                }
                $n = count($colSoA) + count($colSoB) + count($tipoDif);
                if ($n > 0) {
                    sort($colSoA);
                    sort($colSoB);
                    $totalColDiff += $n;
                    $tabelasDiff[] = [
                        'table'        => $nome,
                        'cols_only_a'  => $colSoA,
                        'cols_only_b'  => $colSoB,
                        'type_changed' => $tipoDif,
                        'diff_count'   => $n,
                    ];
                }
            }
            usort($tabelasDiff, fn($x, $y) => $y['diff_count'] <=> $x['diff_count']);

            return [
                'a'       => $metas[$aId],
                'b'       => $metas[$bId],
                'summary' => [
                    'tables_a'         => count($tabelasA),
                    'tables_b'         => count($tabelasB),
                    'only_a'           => count($soA),
                    'only_b'           => count($soB),
                    'common'           => count($comuns),
                    'tables_with_diff' => count($tabelasDiff),
                    'col_diffs'        => $totalColDiff,
                    'identical'        => count($soA) === 0 && count($soB) === 0 && count($tabelasDiff) === 0,
                ],
                'tables_only_a' => array_slice($soA, 0, $LIM),
                'tables_only_b' => array_slice($soB, 0, $LIM),
                'tables_diff'   => array_slice($tabelasDiff, 0, $LIM),
                'truncated'     => count($soA) > $LIM || count($soB) > $LIM || count($tabelasDiff) > $LIM,
            ];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtCatalogRepository::compareSchemas');
        }
    }

    /**
     * CSV do relatorio de drift (entregavel para o DBA/dono dos clones). Achata o
     * resultado de compareSchemas em linhas categoria/tabela/coluna/valor_a/valor_b.
     * BOM + colunas nomeadas pelos dois bancos. Devolve null se algum id nao existe.
     */
    public function compareExportCsv(int $aId, int $bId): ?string
    {
        $r = $this->compareSchemas($aId, $bId);
        if (($r['error'] ?? null) === 'not_found') {
            return null;
        }
        $an  = $r['a']['name'];
        $bn  = $r['b']['name'];
        $esc = static fn ($v): string => '"' . str_replace('"', '""', (string)($v ?? '')) . '"';
        $linha = static fn (array $c) => implode(',', array_map($esc, $c)) . "\r\n";

        $out = $linha(['categoria', 'tabela', 'coluna', $an, $bn]);
        foreach ($r['tables_only_a'] as $t) { $out .= $linha(['tabela só em A', $t, '', 'presente', 'ausente']); }
        foreach ($r['tables_only_b'] as $t) { $out .= $linha(['tabela só em B', $t, '', 'ausente', 'presente']); }
        foreach ($r['tables_diff'] as $td) {
            foreach ($td['type_changed'] as $c) { $out .= $linha(['tipo diferente', $td['table'], $c['column'], $c['a'], $c['b']]); }
            foreach ($td['cols_only_a'] as $c) { $out .= $linha(['coluna só em A', $td['table'], $c, 'presente', 'ausente']); }
            foreach ($td['cols_only_b'] as $c) { $out .= $linha(['coluna só em B', $td['table'], $c, 'ausente', 'presente']); }
        }
        return $out;
    }

    /** labels chega como JSON string; devolve array para o front. */
    private function decodeFields(array $rows): array
    {
        foreach ($rows as &$r) {
            if (isset($r['labels']) && is_string($r['labels'])) {
                $r['labels'] = json_decode($r['labels'], true) ?: [];
            }
            foreach (['is_pk', 'is_fk', 'is_unique', 'is_indexed', 'is_auto_increment', 'is_nullable'] as $k) {
                if (isset($r[$k])) {
                    $r[$k] = (bool)$r[$k];
                }
            }
        }
        return $rows;
    }
}
