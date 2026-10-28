<?php
// DataTables / InventoryService - descoberta automatica via information_schema
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// PROTECAO DE PRODUCAO (§33) - regras que este servico NUNCA quebra:
//   - le SOMENTE information_schema; zero SELECT em tabela de negocio
//   - row_count e APROXIMADO (TABLES.TABLE_ROWS); jamais COUNT(*) em tabela grande
//   - nenhum ALTER/DROP/CREATE no banco monitorado; e read-only por construcao
//   - schemas de sistema sao ignorados
//   - upserts em lote, dentro de transacao no banco LOCAL (nunca no monitorado)
//
// RECONCILIACAO (§36.3): objeto que sumiu NAO e apagado. Recebe is_present=0 e
// preserva last_seen_at, para consulta historica e alerta de remocao.
declare(strict_types=1);

require_once __DIR__ . '/../lib/ConnectionFactory.php';
require_once __DIR__ . '/../lib/FieldClassifier.php';
require_once __DIR__ . '/MetricsService.php';
require_once __DIR__ . '/../../core/repositories/RepositoryException.php';

final class DtInventoryService
{
    /** Schemas internos do MySQL - nunca inventariados. */
    private const SYSTEM_SCHEMAS = ['information_schema', 'performance_schema', 'mysql', 'sys'];

    /** Teto de tabelas por schema numa passada. Protege memoria e tempo. */
    private const MAX_TABLES_PER_SCHEMA = 5000;

    /** Tamanho do lote de INSERT. */
    private const BATCH = 200;

    private PDO $local;

    public function __construct(PDO $localPdo)
    {
        $this->local = $localPdo;
    }

    /**
     * Executa o inventario completo de uma conexao.
     *
     * @param array $conn Linha de DT_Conexao COM password_encrypted
     * @return array Resumo {status, databases, tables, fields, duration_ms, error?}
     */
    public function runForConnection(array $conn): array
    {
        $connId = (int)$conn['id'];
        $logId  = $this->openLog($connId);
        $t0     = microtime(true);

        $counts = ['databases' => 0, 'tables' => 0, 'fields' => 0, 'samples' => 0];
        $remote = null;

        try {
            // Estado estrutural ANTES do inventario (§36): permite diferenciar
            // tabela/campo NOVO x REMOVIDO x TIPO-ALTERADO comparando com o DEPOIS.
            $before = $this->structuralSnapshot($connId);

            $remote = DtConnectionFactory::open($conn);

            // Se db_name estiver definido, inventaria SO aquele schema.
            // Se for NULL, descobre todos os schemas visiveis a credencial.
            $targetDb = $conn['db_name'] ?? null;
            $schemas  = ($targetDb !== null && $targetDb !== '')
                ? [$targetDb]
                : $this->listSchemas($remote);

            $seenDbIds = [];

            foreach ($schemas as $schemaName) {
                if (in_array(strtolower($schemaName), self::SYSTEM_SCHEMAS, true)) {
                    continue;
                }

                $dbId = $this->upsertDatabase($connId, $conn, $remote, $schemaName);
                $seenDbIds[] = $dbId;
                $counts['databases']++;

                $c = $this->inventorySchema($remote, $dbId, $schemaName);
                $counts['tables'] += $c['tables'];
                $counts['fields'] += $c['fields'];

                // Serie historica (§16.1/§18.4). Reusa a conexao ja aberta e os
                // dados ja lidos: custo ADICIONAL zero no banco monitorado.
                // Falha aqui e opcional - nunca derruba o inventario.
                try {
                    $metrics = new DtMetricsService($this->local);
                    $metrics->captureDatabase($remote, $dbId);
                    $counts['samples'] = ($counts['samples'] ?? 0)
                        + $metrics->captureTables($dbId, $c['table_rows'] ?? []);
                } catch (Throwable $me) {
                    error_log('[datatables:inventory] metricas: ' . $me->getMessage());
                }
            }

            // Bancos que sumiram desde a ultima passada.
            $this->markAbsentDatabases($connId, $seenDbIds);

            // Diff estrutural (§36): compara o estado presente ANTES x DEPOIS.
            $diff = $this->computeStructuralDiff($before, $this->structuralSnapshot($connId));

            $durationMs = (int)round((microtime(true) - $t0) * 1000);
            $this->closeLog($logId, 'success', $counts, $durationMs, null);
            $this->touchConnectionInventory($connId);

            return $counts + ['status' => 'success', 'duration_ms' => $durationMs, 'diff' => $diff];

        } catch (Throwable $e) {
            $durationMs = (int)round((microtime(true) - $t0) * 1000);
            $safe = DtConnectionFactory::safeError($e);
            $this->closeLog($logId, 'error', $counts, $durationMs, $safe);
            error_log("[datatables:inventory] conn={$connId} {$safe}");

            return $counts + ['status' => 'error', 'duration_ms' => $durationMs, 'error' => $safe];
        } finally {
            DtConnectionFactory::close($remote);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DESCOBERTA REMOTA (read-only)
    // ═══════════════════════════════════════════════════════════════

    /** Schemas visiveis a credencial, ja excluindo os de sistema. */
    /**
     * Estado estrutural PRESENTE (is_present=1) de uma conexao: tabelas e campos,
     * com o tipo do campo (p/ detectar type_changed). Só o catálogo LOCAL — não
     * toca o banco monitorado. Chaveado por id (o upsert preserva o id; INSERT dá
     * id novo → "novo", is_present=0 → "removido").
     */
    private function structuralSnapshot(int $connId): array
    {
        $tabelas = [];
        $st = $this->local->prepare(
            'SELECT t.id, t.name, b.name AS database_name
               FROM DT_Tabela t JOIN DT_Banco b ON b.id = t.database_id
              WHERE b.connection_id = :c AND t.is_present = 1'
        );
        $st->execute([':c' => $connId]);
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $tabelas[(int)$r['id']] = ['name' => $r['name'], 'database_name' => $r['database_name']];
        }

        $campos = [];
        $sc = $this->local->prepare(
            'SELECT f.id, f.name, f.column_type, f.table_id, t.name AS table_name, b.name AS database_name
               FROM DT_Campo f
               JOIN DT_Tabela t ON t.id = f.table_id
               JOIN DT_Banco  b ON b.id = t.database_id
              WHERE b.connection_id = :c AND f.is_present = 1'
        );
        $sc->execute([':c' => $connId]);
        foreach ($sc->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $campos[(int)$r['id']] = [
                'name' => $r['name'], 'type' => (string)$r['column_type'],
                'table_id' => (int)$r['table_id'], 'table_name' => $r['table_name'],
                'database_name' => $r['database_name'],
            ];
        }
        return ['tables' => $tabelas, 'fields' => $campos];
    }

    /**
     * Diff estrutural (§36.2/§36.3): novas/removidas tabelas, novos/removidos
     * campos e mudanca de tipo. Campos de uma tabela NOVA/REMOVIDA são SILENCIADOS
     * (o alerta da tabela já cobre) para não gerar enxurrada.
     */
    private function computeStructuralDiff(array $before, array $after): array
    {
        $novasTab = []; $removTab = [];
        foreach ($after['tables'] as $id => $t) {
            if (!isset($before['tables'][$id])) {
                $novasTab[] = ['id' => $id, 'name' => $t['name'], 'database_name' => $t['database_name']];
            }
        }
        foreach ($before['tables'] as $id => $t) {
            if (!isset($after['tables'][$id])) {
                $removTab[] = ['id' => $id, 'name' => $t['name'], 'database_name' => $t['database_name'],
                               'last_seen_at' => date('Y-m-d H:i')];
            }
        }
        $novasTabSet  = array_fill_keys(array_column($novasTab, 'id'), true);
        $removTabSet  = array_fill_keys(array_column($removTab, 'id'), true);

        $novosCampos = []; $removCampos = []; $tipoMudou = [];
        foreach ($after['fields'] as $id => $f) {
            if (!isset($before['fields'][$id])) {
                if (isset($novasTabSet[$f['table_id']])) { continue; }   // campo de tabela nova → coberto
                $novosCampos[] = ['id' => $id, 'name' => $f['name'], 'table_name' => $f['table_name'], 'database_name' => $f['database_name']];
            } elseif ($before['fields'][$id]['type'] !== $f['type']) {
                $tipoMudou[] = ['id' => $id, 'name' => $f['name'], 'table_name' => $f['table_name'], 'database_name' => $f['database_name'],
                                'old_type' => $before['fields'][$id]['type'], 'new_type' => $f['type']];
            }
        }
        foreach ($before['fields'] as $id => $f) {
            if (!isset($after['fields'][$id])) {
                if (isset($removTabSet[$f['table_id']])) { continue; }   // campo de tabela removida → coberto
                $removCampos[] = ['id' => $id, 'name' => $f['name'], 'table_name' => $f['table_name'], 'database_name' => $f['database_name']];
            }
        }

        return [
            'new_tables'     => $novasTab,   'removed_tables' => $removTab,
            'new_fields'     => $novosCampos, 'removed_fields' => $removCampos,
            'type_changed'   => $tipoMudou,
        ];
    }

    private function listSchemas(PDO $remote): array
    {
        $ph  = implode(',', array_fill(0, count(self::SYSTEM_SCHEMAS), '?'));
        $st  = $remote->prepare(
            "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA
              WHERE LOWER(SCHEMA_NAME) NOT IN ({$ph})
              ORDER BY SCHEMA_NAME"
        );
        $st->execute(self::SYSTEM_SCHEMAS);
        return $st->fetchAll(PDO::FETCH_COLUMN) ?: [];
    }

    /** Inventaria um schema inteiro: tabelas, campos, indices, FKs. */
    private function inventorySchema(PDO $remote, int $dbId, string $schema): array
    {
        $tables = $this->fetchTables($remote, $schema);
        if ($tables === []) {
            $this->markAbsentTables($dbId, []);
            return ['tables' => 0, 'fields' => 0, 'table_rows' => []];
        }

        $columns = $this->fetchColumns($remote, $schema);
        $indexes = $this->fetchIndexes($remote, $schema);
        $fks     = $this->fetchForeignKeys($remote, $schema);

        // Conjunto de tabelas referenciadas - alimenta a deteccao de orfa (§23.1).
        $referenced = [];
        foreach ($fks as $fk) {
            if (!empty($fk['ref_table'])) {
                $referenced[$fk['ref_table']] = true;
            }
        }

        $fieldTotal = 0;
        $seenTableIds = [];
        $tableRows = [];   // alimenta a serie historica sem reconsultar o remoto

        foreach ($tables as $t) {
            $tName   = $t['name'];
            $tCols   = $columns[$tName] ?? [];
            $tIdx    = $indexes[$tName] ?? [];
            $tFks    = $fks[$tName] ?? [];

            // Marca PK/FK/indice em cada coluna antes de classificar.
            $pkCols  = [];
            $idxCols = [];
            $uniqCols = [];
            foreach ($tIdx as $ix) {
                foreach (explode(',', (string)$ix['columns_csv']) as $c) {
                    $c = trim($c);
                    if ($c === '') { continue; }
                    $idxCols[$c] = true;
                    if ($ix['name'] === 'PRIMARY') { $pkCols[$c] = true; }
                    if (!empty($ix['is_unique'])) { $uniqCols[$c] = true; }
                }
            }
            $fkCols = [];
            foreach ($tFks as $fk) {
                if (!empty($fk['column_name'])) { $fkCols[$fk['column_name']] = true; }
            }

            foreach ($tCols as &$c) {
                $c['is_pk']      = isset($pkCols[$c['name']]) ? 1 : 0;
                $c['is_fk']      = isset($fkCols[$c['name']]) ? 1 : 0;
                $c['is_indexed'] = isset($idxCols[$c['name']]) ? 1 : 0;
                $c['is_unique']  = isset($uniqCols[$c['name']]) ? 1 : 0;
                $cls = DtFieldClassifier::classify($c, $tName);
                $c['sensitivity'] = $cls['sensitivity'];
                $c['labels']      = json_encode($cls['labels'], JSON_UNESCAPED_UNICODE);
            }
            unset($c);

            // Orfa: nao tem FK saindo E ninguem a referencia (§23.1).
            $isOrphan = (count($tFks) === 0 && !isset($referenced[$tName])) ? 1 : 0;

            $t['field_count'] = count($tCols);
            $t['index_count'] = count($tIdx);
            $t['fk_count']    = count($tFks);
            $t['has_pk']      = $pkCols !== [] ? 1 : 0;
            $t['is_orphan']   = $isOrphan;

            // Uma transacao por tabela: sem ela cada INSERT vira um commit em
            // disco e o inventario de um schema medio leva dezenas de segundos.
            // Escopo por tabela (nao por schema) evita transacao longa demais.
            $ownTx = !$this->local->inTransaction();
            if ($ownTx) {
                $this->local->beginTransaction();
            }
            try {
                $tableId = $this->upsertTable($dbId, $t);
                $seenTableIds[] = $tableId;

                $this->upsertColumns($tableId, $tCols);
                $this->upsertIndexes($tableId, $tIdx);
                $this->upsertForeignKeys($tableId, $tFks);

                if ($ownTx) {
                    $this->local->commit();
                }
            } catch (Throwable $e) {
                if ($ownTx && $this->local->inTransaction()) {
                    $this->local->rollBack();
                }
                throw $e;
            }

            $tableRows[] = [
                'id'               => $tableId,
                'size_bytes'       => $t['size_bytes'],
                'row_count_approx' => $t['row_count_approx'],
            ];

            $fieldTotal += count($tCols);
        }

        $this->markAbsentTables($dbId, $seenTableIds);
        $this->refreshDatabaseCounters($dbId);

        return ['tables' => count($tables), 'fields' => $fieldTotal, 'table_rows' => $tableRows];
    }

    /** TABLES: metadados + tamanho + contagem APROXIMADA de linhas. */
    private function fetchTables(PDO $remote, string $schema): array
    {
        $st = $remote->prepare(
            'SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_COLLATION, TABLE_ROWS,
                    DATA_LENGTH, INDEX_LENGTH, TABLE_COMMENT, CREATE_TIME, UPDATE_TIME
               FROM information_schema.TABLES
              WHERE TABLE_SCHEMA = :s
              ORDER BY TABLE_NAME
              LIMIT ' . self::MAX_TABLES_PER_SCHEMA
        );
        $st->execute([':s' => $schema]);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $data  = (int)($r['DATA_LENGTH'] ?? 0);
            $index = (int)($r['INDEX_LENGTH'] ?? 0);
            $out[] = [
                'name'             => $r['TABLE_NAME'],
                'table_type'       => $r['TABLE_TYPE'] ?? 'BASE TABLE',
                'engine'           => $r['ENGINE'],
                'collation'        => $r['TABLE_COLLATION'],
                'row_count_approx' => $r['TABLE_ROWS'] !== null ? (int)$r['TABLE_ROWS'] : null,
                'data_length'      => $data,
                'index_length'     => $index,
                'size_bytes'       => $data + $index,
                'table_comment'    => $r['TABLE_COMMENT'] !== '' ? mb_substr((string)$r['TABLE_COMMENT'], 0, 500) : null,
                'create_time'      => $r['CREATE_TIME'],
                'update_time'      => $r['UPDATE_TIME'],
            ];
        }
        return $out;
    }

    /** COLUMNS de todo o schema, agrupadas por tabela (1 query em vez de N). */
    private function fetchColumns(PDO $remote, string $schema): array
    {
        $st = $remote->prepare(
            'SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE, COLUMN_TYPE,
                    IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_MAXIMUM_LENGTH,
                    NUMERIC_PRECISION, NUMERIC_SCALE, EXTRA, COLUMN_COMMENT
               FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = :s
              ORDER BY TABLE_NAME, ORDINAL_POSITION'
        );
        $st->execute([':s' => $schema]);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $out[$r['TABLE_NAME']][] = [
                'name'              => $r['COLUMN_NAME'],
                'ordinal'           => (int)$r['ORDINAL_POSITION'],
                'data_type'         => $r['DATA_TYPE'],
                'column_type'       => mb_substr((string)$r['COLUMN_TYPE'], 0, 255),
                'is_nullable'       => strtoupper((string)$r['IS_NULLABLE']) === 'YES' ? 1 : 0,
                'column_default'    => $r['COLUMN_DEFAULT'] !== null
                                       ? mb_substr((string)$r['COLUMN_DEFAULT'], 0, 255) : null,
                'char_length'       => $r['CHARACTER_MAXIMUM_LENGTH'] !== null
                                       ? (int)$r['CHARACTER_MAXIMUM_LENGTH'] : null,
                'numeric_precision' => $r['NUMERIC_PRECISION'] !== null ? (int)$r['NUMERIC_PRECISION'] : null,
                'numeric_scale'     => $r['NUMERIC_SCALE'] !== null ? (int)$r['NUMERIC_SCALE'] : null,
                'is_auto_increment' => stripos((string)$r['EXTRA'], 'auto_increment') !== false ? 1 : 0,
                'column_comment'    => $r['COLUMN_COMMENT'] !== '' ? mb_substr((string)$r['COLUMN_COMMENT'], 0, 500) : null,
            ];
        }
        return $out;
    }

    /** STATISTICS agregada em indices (uma linha por indice, colunas concatenadas). */
    private function fetchIndexes(PDO $remote, string $schema): array
    {
        $st = $remote->prepare(
            'SELECT TABLE_NAME, INDEX_NAME,
                    MIN(NON_UNIQUE)  AS NON_UNIQUE,
                    MIN(INDEX_TYPE)  AS INDEX_TYPE,
                    MAX(CARDINALITY) AS CARDINALITY,
                    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ",") AS COLS
               FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA = :s
              GROUP BY TABLE_NAME, INDEX_NAME'
        );
        $st->execute([':s' => $schema]);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $out[$r['TABLE_NAME']][] = [
                'name'        => $r['INDEX_NAME'],
                'is_unique'   => (int)$r['NON_UNIQUE'] === 0 ? 1 : 0,
                'index_type'  => $r['INDEX_TYPE'],
                'columns_csv' => mb_substr((string)$r['COLS'], 0, 500),
                'cardinality' => $r['CARDINALITY'] !== null ? (int)$r['CARDINALITY'] : null,
            ];
        }
        return $out;
    }

    /** KEY_COLUMN_USAGE + REFERENTIAL_CONSTRAINTS para regras ON UPDATE/DELETE. */
    private function fetchForeignKeys(PDO $remote, string $schema): array
    {
        $st = $remote->prepare(
            'SELECT k.TABLE_NAME, k.CONSTRAINT_NAME, k.COLUMN_NAME,
                    k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
                    r.UPDATE_RULE, r.DELETE_RULE
               FROM information_schema.KEY_COLUMN_USAGE k
          LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS r
                 ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
                AND r.CONSTRAINT_NAME   = k.CONSTRAINT_NAME
              WHERE k.TABLE_SCHEMA = :s
                AND k.REFERENCED_TABLE_NAME IS NOT NULL'
        );
        $st->execute([':s' => $schema]);

        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $out[$r['TABLE_NAME']][] = [
                'constraint_name' => $r['CONSTRAINT_NAME'],
                'column_name'     => $r['COLUMN_NAME'],
                'ref_database'    => $r['REFERENCED_TABLE_SCHEMA'],
                'ref_table'       => $r['REFERENCED_TABLE_NAME'],
                'ref_column'      => $r['REFERENCED_COLUMN_NAME'],
                'on_update'       => $r['UPDATE_RULE'],
                'on_delete'       => $r['DELETE_RULE'],
            ];
        }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════
    // PERSISTENCIA LOCAL (upsert + reconciliacao)
    // ═══════════════════════════════════════════════════════════════

    private function upsertDatabase(int $connId, array $conn, PDO $remote, string $schema): int
    {
        $meta = ['charset' => null, 'collation' => null];
        try {
            $st = $remote->prepare(
                'SELECT DEFAULT_CHARACTER_SET_NAME c, DEFAULT_COLLATION_NAME col
                   FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = :s LIMIT 1'
            );
            $st->execute([':s' => $schema]);
            if ($r = $st->fetch(PDO::FETCH_ASSOC)) {
                $meta = ['charset' => $r['c'], 'collation' => $r['col']];
            }
        } catch (PDOException $e) {
            // Metadado opcional - nao aborta o inventario.
        }

        $sizeBytes = null;
        try {
            $st = $remote->prepare(
                'SELECT SUM(DATA_LENGTH + INDEX_LENGTH) s
                   FROM information_schema.TABLES WHERE TABLE_SCHEMA = :s'
            );
            $st->execute([':s' => $schema]);
            $sizeBytes = $st->fetchColumn();
            $sizeBytes = $sizeBytes !== null && $sizeBytes !== false ? (int)$sizeBytes : null;
        } catch (PDOException $e) {
        }

        $sql = 'INSERT INTO DT_Banco
                  (connection_id, server_id, environment_id, name, charset, collation,
                   size_bytes, status, is_present, first_seen_at, last_seen_at, last_inventory_at)
                VALUES
                  (:conn, :srv, :env, :name, :cs, :col, :size, "online", 1, NOW(), NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                   charset = VALUES(charset), collation = VALUES(collation),
                   size_bytes = VALUES(size_bytes), status = "online", is_present = 1,
                   last_seen_at = NOW(), last_inventory_at = NOW(),
                   server_id = VALUES(server_id), environment_id = VALUES(environment_id)';

        $st = $this->local->prepare($sql);
        $st->execute([
            ':conn' => $connId,
            ':srv'  => $conn['server_id'] ?? null,
            ':env'  => $conn['environment_id'] ?? null,
            ':name' => $schema,
            ':cs'   => $meta['charset'],
            ':col'  => $meta['collation'],
            ':size' => $sizeBytes,
        ]);

        $id = (int)$this->local->lastInsertId();
        if ($id > 0) {
            return $id;
        }
        // ON DUPLICATE sem insercao: lastInsertId nao serve, busca o existente.
        $st = $this->local->prepare('SELECT id FROM DT_Banco WHERE connection_id = :c AND name = :n LIMIT 1');
        $st->execute([':c' => $connId, ':n' => $schema]);
        return (int)$st->fetchColumn();
    }

    private function upsertTable(int $dbId, array $t): int
    {
        $sql = 'INSERT INTO DT_Tabela
                  (database_id, name, table_type, engine, collation, row_count_approx,
                   size_bytes, data_length, index_length, table_comment, create_time, update_time,
                   field_count, index_count, fk_count, has_pk, is_orphan,
                   is_present, first_seen_at, last_seen_at)
                VALUES
                  (:db, :name, :ttype, :eng, :col, :rows, :size, :dlen, :ilen, :cmt, :ctime, :utime,
                   :fc, :ic, :fkc, :haspk, :orphan, 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                   table_type = VALUES(table_type), engine = VALUES(engine),
                   collation = VALUES(collation), row_count_approx = VALUES(row_count_approx),
                   size_bytes = VALUES(size_bytes), data_length = VALUES(data_length),
                   index_length = VALUES(index_length), table_comment = VALUES(table_comment),
                   create_time = VALUES(create_time), update_time = VALUES(update_time),
                   field_count = VALUES(field_count), index_count = VALUES(index_count),
                   fk_count = VALUES(fk_count), has_pk = VALUES(has_pk),
                   is_orphan = VALUES(is_orphan), is_present = 1, last_seen_at = NOW()';

        $st = $this->local->prepare($sql);
        $st->execute([
            ':db' => $dbId, ':name' => $t['name'], ':ttype' => $t['table_type'],
            ':eng' => $t['engine'], ':col' => $t['collation'], ':rows' => $t['row_count_approx'],
            ':size' => $t['size_bytes'], ':dlen' => $t['data_length'], ':ilen' => $t['index_length'],
            ':cmt' => $t['table_comment'], ':ctime' => $t['create_time'], ':utime' => $t['update_time'],
            ':fc' => $t['field_count'], ':ic' => $t['index_count'], ':fkc' => $t['fk_count'],
            ':haspk' => $t['has_pk'], ':orphan' => $t['is_orphan'],
        ]);

        $id = (int)$this->local->lastInsertId();
        if ($id > 0) {
            return $id;
        }
        $st = $this->local->prepare('SELECT id FROM DT_Tabela WHERE database_id = :d AND name = :n LIMIT 1');
        $st->execute([':d' => $dbId, ':n' => $t['name']]);
        return (int)$st->fetchColumn();
    }

    private function upsertColumns(int $tableId, array $cols): void
    {
        $seen = [];
        foreach (array_chunk($cols, self::BATCH) as $chunk) {
            foreach ($chunk as $c) {
                $sql = 'INSERT INTO DT_Campo
                          (table_id, name, ordinal, data_type, column_type, is_nullable,
                           column_default, char_length, numeric_precision, numeric_scale,
                           is_pk, is_fk, is_unique, is_indexed, is_auto_increment,
                           column_comment, labels, sensitivity, is_present, first_seen_at, last_seen_at)
                        VALUES
                          (:t, :n, :ord, :dt, :ct, :nul, :def, :clen, :np, :ns,
                           :pk, :fk, :uq, :ix, :ai, :cmt, :lbl, :sen, 1, NOW(), NOW())
                        ON DUPLICATE KEY UPDATE
                           ordinal = VALUES(ordinal), data_type = VALUES(data_type),
                           column_type = VALUES(column_type), is_nullable = VALUES(is_nullable),
                           column_default = VALUES(column_default), char_length = VALUES(char_length),
                           numeric_precision = VALUES(numeric_precision), numeric_scale = VALUES(numeric_scale),
                           is_pk = VALUES(is_pk), is_fk = VALUES(is_fk), is_unique = VALUES(is_unique),
                           is_indexed = VALUES(is_indexed), is_auto_increment = VALUES(is_auto_increment),
                           column_comment = VALUES(column_comment), labels = VALUES(labels),
                           sensitivity = VALUES(sensitivity), is_present = 1, last_seen_at = NOW()';
                $st = $this->local->prepare($sql);
                $st->execute([
                    ':t' => $tableId, ':n' => $c['name'], ':ord' => $c['ordinal'],
                    ':dt' => $c['data_type'], ':ct' => $c['column_type'], ':nul' => $c['is_nullable'],
                    ':def' => $c['column_default'], ':clen' => $c['char_length'],
                    ':np' => $c['numeric_precision'], ':ns' => $c['numeric_scale'],
                    ':pk' => $c['is_pk'], ':fk' => $c['is_fk'], ':uq' => $c['is_unique'],
                    ':ix' => $c['is_indexed'], ':ai' => $c['is_auto_increment'],
                    ':cmt' => $c['column_comment'], ':lbl' => $c['labels'], ':sen' => $c['sensitivity'],
                ]);
                $seen[] = $c['name'];
            }
        }
        $this->markAbsentByName('DT_Campo', 'table_id', $tableId, $seen);
    }

    private function upsertIndexes(int $tableId, array $idx): void
    {
        $seen = [];
        foreach ($idx as $i) {
            $st = $this->local->prepare(
                'INSERT INTO DT_Indice (table_id, name, is_unique, index_type, columns_csv, cardinality, is_present)
                 VALUES (:t, :n, :u, :ty, :c, :card, 1)
                 ON DUPLICATE KEY UPDATE
                    is_unique = VALUES(is_unique), index_type = VALUES(index_type),
                    columns_csv = VALUES(columns_csv), cardinality = VALUES(cardinality), is_present = 1'
            );
            $st->execute([
                ':t' => $tableId, ':n' => $i['name'], ':u' => $i['is_unique'],
                ':ty' => $i['index_type'], ':c' => $i['columns_csv'], ':card' => $i['cardinality'],
            ]);
            $seen[] = $i['name'];
        }
        $this->markAbsentByName('DT_Indice', 'table_id', $tableId, $seen);
    }

    private function upsertForeignKeys(int $tableId, array $fks): void
    {
        $seen = [];
        foreach ($fks as $f) {
            $st = $this->local->prepare(
                'INSERT INTO DT_Chave_Estrangeira
                   (table_id, constraint_name, column_name, ref_database, ref_table, ref_column,
                    on_update, on_delete, is_present)
                 VALUES (:t, :cn, :col, :rdb, :rt, :rc, :ou, :od, 1)
                 ON DUPLICATE KEY UPDATE
                    ref_database = VALUES(ref_database), ref_table = VALUES(ref_table),
                    ref_column = VALUES(ref_column), on_update = VALUES(on_update),
                    on_delete = VALUES(on_delete), is_present = 1'
            );
            $st->execute([
                ':t' => $tableId, ':cn' => $f['constraint_name'], ':col' => $f['column_name'],
                ':rdb' => $f['ref_database'], ':rt' => $f['ref_table'], ':rc' => $f['ref_column'],
                ':ou' => $f['on_update'], ':od' => $f['on_delete'],
            ]);
            $seen[] = $f['constraint_name'] . '|' . $f['column_name'];
        }
        // FK usa chave composta; reconciliacao por constraint+coluna.
        if ($seen === []) {
            $this->local->prepare('UPDATE DT_Chave_Estrangeira SET is_present = 0 WHERE table_id = :t')
                        ->execute([':t' => $tableId]);
            return;
        }
        $ph = implode(',', array_fill(0, count($seen), '?'));
        $st = $this->local->prepare(
            "UPDATE DT_Chave_Estrangeira SET is_present = 0
              WHERE table_id = ? AND CONCAT(constraint_name, '|', COALESCE(column_name,'')) NOT IN ({$ph})"
        );
        $st->execute(array_merge([$tableId], $seen));
    }

    /** Marca ausentes preservando historico (§36.3). */
    private function markAbsentByName(string $table, string $fkCol, int $fkVal, array $seenNames): void
    {
        if ($seenNames === []) {
            $this->local->prepare("UPDATE {$table} SET is_present = 0 WHERE {$fkCol} = :v")
                        ->execute([':v' => $fkVal]);
            return;
        }
        $ph = implode(',', array_fill(0, count($seenNames), '?'));
        $st = $this->local->prepare(
            "UPDATE {$table} SET is_present = 0 WHERE {$fkCol} = ? AND name NOT IN ({$ph})"
        );
        $st->execute(array_merge([$fkVal], $seenNames));
    }

    private function markAbsentTables(int $dbId, array $seenIds): void
    {
        if ($seenIds === []) {
            $this->local->prepare('UPDATE DT_Tabela SET is_present = 0 WHERE database_id = :d')
                        ->execute([':d' => $dbId]);
            return;
        }
        $ph = implode(',', array_fill(0, count($seenIds), '?'));
        $st = $this->local->prepare(
            "UPDATE DT_Tabela SET is_present = 0 WHERE database_id = ? AND id NOT IN ({$ph})"
        );
        $st->execute(array_merge([$dbId], $seenIds));
    }

    private function markAbsentDatabases(int $connId, array $seenIds): void
    {
        if ($seenIds === []) {
            $this->local->prepare('UPDATE DT_Banco SET is_present = 0 WHERE connection_id = :c')
                        ->execute([':c' => $connId]);
            return;
        }
        $ph = implode(',', array_fill(0, count($seenIds), '?'));
        $st = $this->local->prepare(
            "UPDATE DT_Banco SET is_present = 0 WHERE connection_id = ? AND id NOT IN ({$ph})"
        );
        $st->execute(array_merge([$connId], $seenIds));
    }

    /** Recalcula contadores agregados do banco a partir do catalogo local. */
    private function refreshDatabaseCounters(int $dbId): void
    {
        $this->local->prepare(
            'UPDATE DT_Banco b
                SET b.table_count = (SELECT COUNT(*) FROM DT_Tabela t
                                      WHERE t.database_id = b.id AND t.is_present = 1),
                    b.field_count = (SELECT COUNT(*) FROM DT_Campo c
                                       JOIN DT_Tabela t2 ON t2.id = c.table_id
                                      WHERE t2.database_id = b.id AND c.is_present = 1 AND t2.is_present = 1)
              WHERE b.id = :d'
        )->execute([':d' => $dbId]);
    }

    // ═══════════════════════════════════════════════════════════════
    // LOG DE INVENTARIO
    // ═══════════════════════════════════════════════════════════════

    private function openLog(int $connId): int
    {
        $st = $this->local->prepare(
            'INSERT INTO DT_Inventario_Log (connection_id, started_at, status) VALUES (:c, NOW(), "running")'
        );
        $st->execute([':c' => $connId]);
        return (int)$this->local->lastInsertId();
    }

    private function closeLog(int $logId, string $status, array $counts, int $durationMs, ?string $error): void
    {
        $st = $this->local->prepare(
            'UPDATE DT_Inventario_Log
                SET finished_at = NOW(), status = :st, databases_found = :d,
                    tables_found = :t, fields_found = :f, duration_ms = :ms, error = :e
              WHERE id = :id'
        );
        $st->execute([
            ':st' => $status, ':d' => $counts['databases'], ':t' => $counts['tables'],
            ':f' => $counts['fields'], ':ms' => $durationMs,
            ':e' => $error !== null ? mb_substr($error, 0, 1000) : null, ':id' => $logId,
        ]);
    }

    private function touchConnectionInventory(int $connId): void
    {
        $this->local->prepare('UPDATE DT_Conexao SET last_inventory_at = NOW() WHERE id = :c')
                    ->execute([':c' => $connId]);
    }
}
