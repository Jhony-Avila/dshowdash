<?php
// DataTables / QualityService - analises de qualidade e integridade (§24)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// ═══════════════════════════════════════════════════════════════
// PROTECAO DE PRODUCAO (§33) — LEIA ANTES DE MEXER
// ═══════════════════════════════════════════════════════════════
// Este e o UNICO servico do modulo que executa consulta em tabela de negocio.
// Todo o resto le so information_schema. As travas abaixo NAO sao opcionais:
//
//   1. Regras ESTRUTURAIS (orfa, sem PK, FK quebrada, sem comentario) rodam
//      sobre o catalogo LOCAL - custo zero no banco monitorado.
//   2. Regras de DADOS (nulos, duplicidade, datas) tocam a tabela real e por
//      isso: (a) so em tabela abaixo de MAX_ROWS_SCAN; (b) sempre com
//      MAX_EXECUTION_TIME; (c) sempre com LIMIT na amostra; (d) uma tabela por
//      vez, sem paralelismo.
//   3. SELECT apenas. Nenhum ALTER/INSERT/UPDATE/DELETE jamais.
//   4. Identificadores vem do CATALOGO (information_schema), nunca do usuario,
//      e ainda assim passam por quoteIdent().
declare(strict_types=1);

require_once __DIR__ . '/../lib/ConnectionFactory.php';
require_once __DIR__ . '/../lib/FieldClassifier.php';
require_once __DIR__ . '/../../core/repositories/RepositoryException.php';

final class DtQualityService
{
    /** Acima disso, analise de dados e PULADA. Varrer tabela gigante em prod nao. */
    private const MAX_ROWS_SCAN = 2_000_000;

    /** Teto de tempo por consulta, em ms (MAX_EXECUTION_TIME do MySQL). */
    private const QUERY_TIMEOUT_MS = 5000;

    /** Amostra para checagens de padrao. */
    private const SAMPLE_LIMIT = 5000;

    /** Orcamento de tempo da fase de DADOS por conexao (§25: interromper em carga elevada).
     *  Tabelas menores primeiro; ao estourar, o resto vira "pulado" e entra na proxima rodada. */
    private const DATA_SCAN_BUDGET_S = 40.0;

    /** Percentual de nulos que dispara problema. Sobrescrito por DT_Limite. */
    private const NULL_PCT_WARN = 30.0;
    private const NULL_PCT_CRIT = 80.0;

    /** Acima disso, tabela tem dependencias excessivas (§23.3). */
    private const DEPS_WARN = 15;

    private PDO $local;

    public function __construct(PDO $localPdo)
    {
        $this->local = $localPdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // ORQUESTRACAO
    // ═══════════════════════════════════════════════════════════════

    /**
     * Roda a analise de uma conexao.
     *
     * @param array $conn Linha de DT_Conexao COM credencial
     * @param bool $includeData Se false, roda SO as regras estruturais (custo zero)
     */
    public function runForConnection(array $conn, bool $includeData = true): array
    {
        $connId = (int)$conn['id'];
        $stats  = ['structural' => 0, 'data' => 0, 'skipped' => 0, 'tables' => 0, 'errors' => 0];

        // ── Fase estrutural: catalogo local, sem tocar no banco monitorado ──
        $stats['structural'] += $this->checkOrphanTables($connId);
        $stats['structural'] += $this->checkMissingPk($connId);
        $stats['structural'] += $this->checkMissingComment($connId);
        $stats['structural'] += $this->checkBrokenForeignKeys($connId);
        $stats['structural'] += $this->checkExcessiveDeps($connId);

        // POLITICA SOMENTE-LEITURA (§25): conexoes marcadas `monitor_read_only`
        // no extra_json NAO recebem a fase de dados (COUNT/amostragem tocam a
        // tabela real pela rede). A estrutural (catalogo local, custo zero) roda
        // sempre. Protege a PRODUCAO do dono monitorada com credencial privilegiada.
        if (!$includeData || $this->isReadOnlyPolicy($conn)) {
            $this->recomputeScores($connId);
            return $stats + ['mode' => 'structural_only'];
        }

        // ── Fase de dados: toca a tabela real, sob todas as travas ──
        $remote = null;
        try {
            $remote = DtConnectionFactory::open($conn);

            $deadline = microtime(true) + self::DATA_SCAN_BUDGET_S;
            foreach ($this->tablesForDataScan($connId) as $t) {
                $stats['tables']++;
                // §25: orcamento de tempo estourado → interrompe; o resto entra na proxima rodada.
                if (microtime(true) > $deadline) {
                    $stats['skipped']++;
                    $stats['budget_hit'] = true;
                    break;
                }
                if ((int)($t['row_count_approx'] ?? 0) > self::MAX_ROWS_SCAN) {
                    $stats['skipped']++;
                    $this->markDataScanned((int)$t['id']);   // decidida (§33): rotaciona p/ o fim
                    continue;   // grande demais: nao varre (§33)
                }
                try {
                    $stats['data'] += $this->scanTableData($remote, $t);
                } catch (Throwable $e) {
                    $stats['errors']++;
                    error_log("[datatables:quality] tabela {$t['database_name']}.{$t['name']}: "
                        . DtConnectionFactory::safeError($e));
                }
                // Deu a vez a esta tabela (varrida ou tentada) → marca para a rotacao:
                // as menos-recentes (e as NUNCA varridas) vao para a frente na proxima rodada.
                $this->markDataScanned((int)$t['id']);
            }
        } catch (Throwable $e) {
            $stats['errors']++;
            error_log('[datatables:quality] conexao ' . $connId . ': ' . DtConnectionFactory::safeError($e));
        } finally {
            DtConnectionFactory::close($remote);
        }

        $this->recomputeScores($connId);
        return $stats + ['mode' => 'full'];
    }

    // ═══════════════════════════════════════════════════════════════
    // REGRAS ESTRUTURAIS (custo zero - so catalogo local)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Politica somente-leitura: extra_json.monitor_read_only === true.
     * `extra_json` chega como string (SELECT * de DT_Conexao) ou array — tolera os dois.
     */
    private function isReadOnlyPolicy(array $conn): bool
    {
        $raw = $conn['extra_json'] ?? null;
        if (is_string($raw) && $raw !== '') {
            $j = json_decode($raw, true);
            return is_array($j) && !empty($j['monitor_read_only']);
        }
        if (is_array($raw)) {
            return !empty($raw['monitor_read_only']);
        }
        return false;
    }

    private function checkOrphanTables(int $connId): int
    {
        $rows = $this->tablesOf($connId, 't.is_orphan = 1');
        foreach ($rows as $t) {
            $this->upsertIssue((int)$t['id'], null, 'table_orphan', 'informativo', null, null,
                'Sem chave estrangeira propria e nao referenciada por nenhuma outra tabela. '
                . 'E um sinal, nao necessariamente um problema.');
        }
        $this->closeStaleIssues($connId, 'table_orphan', array_column($rows, 'id'));
        return count($rows);
    }

    private function checkMissingPk(int $connId): int
    {
        $rows = $this->tablesOf($connId, 't.has_pk = 0 AND t.table_type = "BASE TABLE"');
        foreach ($rows as $t) {
            $this->upsertIssue((int)$t['id'], null, 'no_pk', 'atencao', null, null,
                'Tabela base sem chave primaria: dificulta replicacao, deduplicacao e atualizacao segura.');
        }
        $this->closeStaleIssues($connId, 'no_pk', array_column($rows, 'id'));
        return count($rows);
    }

    private function checkMissingComment(int $connId): int
    {
        $rows = $this->tablesOf($connId, '(t.table_comment IS NULL OR t.table_comment = "")');
        foreach ($rows as $t) {
            $this->upsertIssue((int)$t['id'], null, 'no_comment', 'informativo', null, null,
                'Sem documentacao no proprio banco (COMMENT vazio).');
        }
        $this->closeStaleIssues($connId, 'no_comment', array_column($rows, 'id'));
        return count($rows);
    }

    /**
     * FK apontando para tabela/campo que nao existe no catalogo (§23.2).
     * Detectavel sem tocar no banco: compara a FK com o proprio inventario.
     */
    private function checkBrokenForeignKeys(int $connId): int
    {
        try {
            $st = $this->local->prepare(
                'SELECT fk.id, fk.table_id, fk.constraint_name, fk.ref_table, fk.ref_column,
                        t.name table_name, b.name database_name
                   FROM DT_Chave_Estrangeira fk
                   JOIN DT_Tabela t ON t.id = fk.table_id
                   JOIN DT_Banco  b ON b.id = t.database_id
                  WHERE b.connection_id = :c AND fk.is_present = 1 AND t.is_present = 1'
            );
            $st->execute([':c' => $connId]);

            $broken = [];
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $fk) {
                $chk = $this->local->prepare(
                    'SELECT c.id
                       FROM DT_Campo c
                       JOIN DT_Tabela t2 ON t2.id = c.table_id
                       JOIN DT_Banco  b2 ON b2.id = t2.database_id
                      WHERE b2.connection_id = :c AND t2.name = :rt AND c.name = :rc
                        AND t2.is_present = 1 AND c.is_present = 1
                      LIMIT 1'
                );
                $chk->execute([':c' => $connId, ':rt' => $fk['ref_table'], ':rc' => $fk['ref_column']]);

                $ok = $chk->fetchColumn() !== false;
                $this->local->prepare('UPDATE DT_Chave_Estrangeira SET is_broken = :b WHERE id = :id')
                            ->execute([':b' => $ok ? 0 : 1, ':id' => $fk['id']]);

                if (!$ok) {
                    $broken[] = (int)$fk['table_id'];
                    $this->upsertIssue((int)$fk['table_id'], null, 'fk_broken', 'critico', null, null,
                        "Constraint {$fk['constraint_name']} referencia "
                        . "{$fk['ref_table']}.{$fk['ref_column']}, que nao existe no catalogo.");
                }
            }
            $this->closeStaleIssues($connId, 'fk_broken', array_unique($broken));
            return count($broken);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtQualityService::checkBrokenForeignKeys');
        }
    }

    private function checkExcessiveDeps(int $connId): int
    {
        $limit = $this->limitFor($connId, 'table_deps', self::DEPS_WARN);
        try {
            $st = $this->local->prepare(
                'SELECT t.id, t.name, COUNT(fk.id) deps
                   FROM DT_Tabela t
                   JOIN DT_Banco b ON b.id = t.database_id
              LEFT JOIN DT_Chave_Estrangeira fk
                     ON fk.ref_table = t.name AND fk.is_present = 1
                  WHERE b.connection_id = :c AND t.is_present = 1
               GROUP BY t.id, t.name
                 HAVING deps > :lim'
            );
            $st->bindValue(':c', $connId, PDO::PARAM_INT);
            $st->bindValue(':lim', $limit, PDO::PARAM_INT);
            $st->execute();

            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $t) {
                $this->upsertIssue((int)$t['id'], null, 'excess_deps', 'atencao', (float)$t['deps'], null,
                    "{$t['deps']} tabelas dependem desta (limite configurado: {$limit}). "
                    . 'Alteracoes aqui tem alcance amplo.');
            }
            $this->closeStaleIssues($connId, 'excess_deps', array_column($rows, 'id'));
            return count($rows);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtQualityService::checkExcessiveDeps');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // REGRAS DE DADOS (tocam a tabela real - sob todas as travas)
    // ═══════════════════════════════════════════════════════════════

    private function scanTableData(PDO $remote, array $t): int
    {
        $found = 0;
        $db    = $t['database_name'];
        $tbl   = $t['name'];
        $fq    = $this->quoteIdent($db) . '.' . $this->quoteIdent($tbl);

        // Total real (barato quando ha PK; a tabela ja passou pelo teto de linhas).
        $total = $this->scalar($remote, "SELECT COUNT(*) FROM {$fq}");
        if ($total === null || $total === 0) {
            return 0;   // tabela vazia: nada a avaliar
        }

        $cols = $this->columnsOf((int)$t['id']);

        foreach ($cols as $c) {
            // ── Excesso de nulos (§24.2) ──
            // CALIBRACAO: coluna declarada NULL com DEFAULT NULL e OPCIONAL POR
            // PROJETO. 96% de nulos em 'sensitivity' e o comportamento correto,
            // nao um defeito. Marcar isso como critico geraria centenas de
            // falsos criticos e destruiria a confianca no modulo. Portanto:
            // coluna anulavel NUNCA passa de 'atencao'; 'critico' fica reservado
            // a violacao real (NOT NULL preenchido com vazio - required_empty).
            if ((int)$c['is_nullable'] === 1) {
                $nulls = $this->scalar($remote,
                    "SELECT COUNT(*) FROM {$fq} WHERE " . $this->quoteIdent($c['name']) . ' IS NULL');
                if ($nulls !== null && $nulls > 0) {
                    $pct  = round(($nulls / $total) * 100, 2);
                    $warn = $this->limitFor((int)$t['connection_id'], 'null_pct', self::NULL_PCT_WARN);
                    if ($pct >= $warn) {
                        // So chega a 'atencao' se for quase-total E a coluna tiver
                        // cara de obrigatoria (identificador ou FK) - ai o vazio
                        // sugere dado faltando, nao campo opcional.
                        $looksRequired = (int)$c['is_pk'] === 1 || (int)$c['is_fk'] === 1
                            || in_array('identificador', is_string($c['labels'])
                                ? (json_decode($c['labels'], true) ?: []) : [], true);
                        $sev = ($pct >= self::NULL_PCT_CRIT && $looksRequired) ? 'atencao' : 'informativo';

                        $nota = $looksRequired
                            ? ' A coluna aparenta ser identificador/chave, entao o vazio pode indicar dado faltando.'
                            : ' A coluna e anulavel: pode ser opcional por projeto.';

                        $this->upsertIssue((int)$t['id'], (int)$c['id'], 'null_excess', $sev, $pct, $total,
                            "{$pct}% dos {$total} registros com valor nulo em '{$c['name']}'." . $nota);
                        $found++;
                    }
                }
            } else {
                // ── Obrigatorio preenchido com vazio (§24.1) - violacao real ──
                $found += $this->checkRequiredEmpty($remote, $fq, $c, (int)$t['id'], $total);
            }

            // ── Datas invalidas (§24.4) ──
            if (DtFieldClassifier::isTemporal((string)$c['data_type'])) {
                $found += $this->checkDates($remote, $fq, $c, (int)$t['id'], $total);
            }
        }

        // ── Duplicidade em coluna UNIQUE-esperada (§24.3) ──
        $found += $this->checkDuplicates($remote, $fq, $cols, (int)$t['id']);

        return $found;
    }

    /**
     * Coluna NOT NULL preenchida com string vazia (§24.1).
     * Aqui 'critico' se justifica: o schema declara obrigatorio e o dado nao esta
     * la - o vazio esta burlando a restricao, nao exercendo uma opcao.
     * So faz sentido em tipos textuais.
     */
    private function checkRequiredEmpty(PDO $remote, string $fq, array $col, int $tableId, int $total): int
    {
        $textual = ['char', 'varchar', 'text', 'tinytext', 'mediumtext', 'longtext'];
        if (!in_array(strtolower((string)$col['data_type']), $textual, true)) {
            return 0;
        }

        $c     = $this->quoteIdent($col['name']);
        $empty = $this->scalar($remote, "SELECT COUNT(*) FROM {$fq} WHERE TRIM({$c}) = ''");

        if ($empty !== null && $empty > 0) {
            $pct = round(($empty / max(1, $total)) * 100, 2);
            $this->upsertIssue($tableId, (int)$col['id'], 'required_empty',
                $pct >= 50 ? 'critico' : 'atencao', $pct, $total,
                "{$empty} de {$total} registros ({$pct}%) com valor vazio em '{$col['name']}', "
                . 'que e declarada NOT NULL. O vazio esta contornando a obrigatoriedade.');
            return 1;
        }
        return 0;
    }

    /** Datas zeradas, absurdamente futuras ou anteriores ao plausivel. */
    private function checkDates(PDO $remote, string $fq, array $col, int $tableId, int $total): int
    {
        $c = $this->quoteIdent($col['name']);

        // '0000-00-00' so existe sem strict mode; a comparacao textual cobre.
        $bad = $this->scalar($remote,
            "SELECT COUNT(*) FROM {$fq}
              WHERE {$c} IS NOT NULL
                AND ({$c} < '1900-01-01' OR {$c} > DATE_ADD(NOW(), INTERVAL 50 YEAR))");

        if ($bad !== null && $bad > 0) {
            $pct = round(($bad / max(1, $total)) * 100, 2);
            $this->upsertIssue($tableId, (int)$col['id'], 'invalid_date',
                $pct >= 10 ? 'atencao' : 'informativo', (float)$bad, $total,
                "{$bad} registro(s) com data fora do intervalo plausivel em '{$col['name']}' "
                . '(anterior a 1900 ou mais de 50 anos no futuro).');
            return 1;
        }
        return 0;
    }

    /**
     * Duplicidade em colunas que DEVERIAM ser unicas (§24.3).
     * Prioriza colunas com nome de identificador que NAO tem indice unico -
     * checar coluna ja unica seria desperdicio, o banco garante.
     */
    private function checkDuplicates(PDO $remote, string $fq, array $cols, int $tableId): int
    {
        $found = 0;
        foreach ($cols as $c) {
            if ((int)$c['is_unique'] === 1 || (int)$c['is_pk'] === 1) {
                continue;   // o banco ja garante
            }
            $labels = is_string($c['labels']) ? (json_decode($c['labels'], true) ?: []) : [];
            $isIdentifier = in_array('identificador', $labels, true)
                || in_array($c['sensitivity'], ['cpf', 'cnpj', 'email'], true);
            if (!$isIdentifier) {
                continue;
            }

            $qc  = $this->quoteIdent($c['name']);
            $dup = $this->scalar($remote,
                "SELECT COUNT(*) FROM (
                    SELECT {$qc} FROM {$fq} WHERE {$qc} IS NOT NULL
                     GROUP BY {$qc} HAVING COUNT(*) > 1 LIMIT " . self::SAMPLE_LIMIT . ') d');

            if ($dup !== null && $dup > 0) {
                $this->upsertIssue($tableId, (int)$c['id'], 'duplicate_key', 'atencao', (float)$dup, null,
                    "{$dup} valor(es) repetido(s) em '{$c['name']}', que aparenta ser identificador "
                    . 'e nao possui indice unico.');
                $found++;
            }
        }
        return $found;
    }

    // ═══════════════════════════════════════════════════════════════
    // SCORE DE SAUDE (§25)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Recalcula o score de todas as tabelas da conexao.
     * Pesos da §25.3: disponibilidade 20, performance 15, qualidade 30,
     * metadados 10, seguranca 10, dependencias/integridade 15.
     */
    public function recomputeScores(int $connId): int
    {
        $tables = $this->tablesOf($connId, '1=1');
        $n = 0;

        // Disponibilidade e performance sao da CONEXAO, nao da tabela.
        $conn = $this->local->prepare('SELECT status FROM DT_Conexao WHERE id = :c');
        $conn->execute([':c' => $connId]);
        $connStatus = (string)($conn->fetchColumn() ?: 'untested');

        $ptsAvail = match ($connStatus) {
            'online'      => 20,
            'slow'        => 14,
            'unstable'    => 8,
            'maintenance' => 20,
            'untested'    => 10,
            default       => 0,
        };
        $ptsPerf = match ($connStatus) {
            'online' => 15, 'slow' => 6, 'unstable' => 8, 'maintenance' => 15,
            'untested' => 8, default => 0,
        };

        foreach ($tables as $t) {
            $issues = $this->issuesByDimension((int)$t['id']);

            // Qualidade (30): critico custa 15, atencao 6, informativo 1.
            $ptsQual = max(0, 30 - ($issues['qualidade']['critico'] * 15
                                  + $issues['qualidade']['atencao'] * 6
                                  + $issues['qualidade']['informativo'] * 1));

            // Integridade/dependencias (15)
            $ptsDeps = max(0, 15 - ($issues['integridade']['critico'] * 8
                                  + $issues['integridade']['atencao'] * 4
                                  + $issues['integridade']['informativo'] * 1));

            // Metadados (10): comentario da tabela + comentarios de campo
            $ptsMeta = 10;
            if (empty($t['table_comment'])) {
                $ptsMeta -= 5;
            }
            $commented = $this->scalarLocal(
                'SELECT COUNT(*) FROM DT_Campo WHERE table_id = :t AND is_present = 1
                   AND column_comment IS NOT NULL AND column_comment <> ""', [':t' => $t['id']]);
            $fields = max(1, (int)$t['field_count']);
            if (($commented / $fields) < 0.3) {
                $ptsMeta -= 3;
            }
            $ptsMeta = max(0, $ptsMeta);

            // Seguranca (10): campos sensiveis pesam; sem chave primaria tambem.
            $sensitive = $this->scalarLocal(
                'SELECT COUNT(*) FROM DT_Campo WHERE table_id = :t AND is_present = 1
                   AND sensitivity IS NOT NULL', [':t' => $t['id']]);
            $ptsSec = 10;
            if ($sensitive > 0) {
                $ptsSec -= min(4, $sensitive);   // presenca de dado sensivel exige atencao
            }
            if ((int)$t['has_pk'] === 0) {
                $ptsSec -= 3;
            }
            $ptsSec = max(0, $ptsSec);

            $score = $ptsAvail + $ptsPerf + $ptsQual + $ptsMeta + $ptsSec + $ptsDeps;
            $score = max(0, min(100, $score));

            $class = match (true) {
                $score >= 80 => 'saudavel',
                $score >= 55 => 'atencao',
                default      => 'critico',
            };

            $this->local->prepare(
                'INSERT INTO DT_Score_Tabela
                   (table_id, score, classification, pts_disponibilidade, pts_performance,
                    pts_qualidade, pts_metadados, pts_seguranca, pts_dependencias, computed_at)
                 VALUES (:t, :s, :c, :a, :p, :q, :m, :sec, :d, NOW())
                 ON DUPLICATE KEY UPDATE
                    score = VALUES(score), classification = VALUES(classification),
                    pts_disponibilidade = VALUES(pts_disponibilidade),
                    pts_performance = VALUES(pts_performance), pts_qualidade = VALUES(pts_qualidade),
                    pts_metadados = VALUES(pts_metadados), pts_seguranca = VALUES(pts_seguranca),
                    pts_dependencias = VALUES(pts_dependencias), computed_at = NOW()'
            )->execute([
                ':t' => $t['id'], ':s' => $score, ':c' => $class, ':a' => $ptsAvail,
                ':p' => $ptsPerf, ':q' => $ptsQual, ':m' => $ptsMeta, ':sec' => $ptsSec, ':d' => $ptsDeps,
            ]);

            // Espelha na tabela para as listagens nao precisarem de JOIN.
            $this->local->prepare('UPDATE DT_Tabela SET health_score = :s WHERE id = :t')
                        ->execute([':s' => $score, ':t' => $t['id']]);
            $n++;
        }
        return $n;
    }

    // ═══════════════════════════════════════════════════════════════
    // AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Escapa identificador para interpolacao. Os nomes vem do information_schema
     * (nao do usuario), mas defesa em profundidade: crase duplicada e recusa de
     * qualquer coisa fora do conjunto valido.
     */
    private function quoteIdent(string $name): string
    {
        if ($name === '' || preg_match('/[\x00-\x1F\x7F]/', $name)) {
            throw new InvalidArgumentException('Identificador invalido no catalogo');
        }
        return '`' . str_replace('`', '``', $name) . '`';
    }

    /** SELECT escalar no banco REMOTO, com teto de tempo. Null em falha. */
    private function scalar(PDO $remote, string $sql): ?int
    {
        try {
            // MAX_EXECUTION_TIME so vale para SELECT; e a trava de tempo do §33.
            $sql = preg_replace('/^\s*SELECT\s/i',
                'SELECT /*+ MAX_EXECUTION_TIME(' . self::QUERY_TIMEOUT_MS . ') */ ', $sql, 1);
            $v = $remote->query($sql)->fetchColumn();
            return $v === false || $v === null ? null : (int)$v;
        } catch (Throwable $e) {
            // Timeout, permissao ou coluna exotica: pula sem derrubar a analise.
            return null;
        }
    }

    private function scalarLocal(string $sql, array $params): int
    {
        $st = $this->local->prepare($sql);
        $st->execute($params);
        return (int)$st->fetchColumn();
    }

    private function tablesOf(int $connId, string $extraWhere): array
    {
        $st = $this->local->prepare(
            "SELECT t.id, t.name, t.table_comment, t.field_count, t.has_pk, t.row_count_approx,
                    b.name database_name, b.connection_id
               FROM DT_Tabela t
               JOIN DT_Banco b ON b.id = t.database_id
              WHERE b.connection_id = :c AND t.is_present = 1 AND {$extraWhere}"
        );
        $st->execute([':c' => $connId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Tabelas elegiveis a varredura de dados, menores primeiro (barato antes). */
    /** Marca que a tabela recebeu sua vez na fase de dados (rotacao §25, best-effort). */
    private function markDataScanned(int $tableId): void
    {
        try {
            $st = $this->local->prepare('UPDATE DT_Tabela SET last_data_scan_at = NOW() WHERE id = :id');
            $st->execute([':id' => $tableId]);
        } catch (Throwable $e) {
            // rotacao e best-effort; nunca pode abortar a analise
        }
    }

    private function tablesForDataScan(int $connId): array
    {
        $st = $this->local->prepare(
            'SELECT t.id, t.name, t.row_count_approx, b.name database_name, b.connection_id
               FROM DT_Tabela t
               JOIN DT_Banco b ON b.id = t.database_id
              WHERE b.connection_id = :c AND t.is_present = 1 AND t.table_type = "BASE TABLE"
           ORDER BY (t.last_data_scan_at IS NULL) DESC,
                    t.last_data_scan_at ASC,
                    COALESCE(t.row_count_approx, 0) ASC'
        );
        $st->execute([':c' => $connId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    private function columnsOf(int $tableId): array
    {
        $st = $this->local->prepare(
            'SELECT id, name, data_type, is_nullable, is_pk, is_fk, is_unique, is_indexed,
                    column_default, labels, sensitivity
               FROM DT_Campo WHERE table_id = :t AND is_present = 1 ORDER BY ordinal'
        );
        $st->execute([':t' => $tableId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Limite configuravel (§16.2): especifico da conexao, senao global, senao default. */
    private function limitFor(int $connId, string $key, float $default): float
    {
        try {
            $st = $this->local->prepare(
                'SELECT warn_value FROM DT_Limite
                  WHERE metric_key = :k AND (connection_id = :c OR connection_id IS NULL)
                    AND is_active = 1
               ORDER BY connection_id IS NULL LIMIT 1'
            );
            $st->execute([':k' => $key, ':c' => $connId]);
            $v = $st->fetchColumn();
            return $v !== false && $v !== null ? (float)$v : $default;
        } catch (PDOException $e) {
            return $default;
        }
    }

    /** Upsert do problema. Reabre se estava fechado e voltou a valer. */
    private function upsertIssue(
        int $tableId, ?int $fieldId, string $ruleKey, string $severity,
        ?float $metric, ?int $sample, string $detail
    ): void {
        try {
            $this->local->prepare(
                'INSERT INTO DT_Problema_Qualidade
                   (table_id, field_id, rule_key, severity, metric_value, sample_size, detail,
                    is_open, first_seen_at, last_seen_at)
                 VALUES (:t, :f, :r, :s, :m, :sp, :d, 1, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE
                    severity = VALUES(severity), metric_value = VALUES(metric_value),
                    sample_size = VALUES(sample_size), detail = VALUES(detail),
                    is_open = 1, last_seen_at = NOW(), resolved_at = NULL'
            )->execute([
                // field_id 0 = problema de NIVEL DE TABELA. NAO usar NULL: em indice
                // UNIQUE do MySQL, NULL nunca colide com NULL, entao cada execucao
                // criaria uma linha nova em vez de atualizar a existente.
                ':t' => $tableId, ':f' => $fieldId ?? 0, ':r' => $ruleKey, ':s' => $severity,
                ':m' => $metric, ':sp' => $sample, ':d' => mb_substr($detail, 0, 1000),
            ]);
        } catch (PDOException $e) {
            error_log('[datatables:quality] upsertIssue: ' . $e->getMessage());
        }
    }

    /**
     * Fecha problemas daquela regra que nao apareceram nesta passada.
     * Sem isto, um problema corrigido ficaria aberto para sempre.
     */
    private function closeStaleIssues(int $connId, string $ruleKey, array $stillOpenTableIds): void
    {
        try {
            if ($stillOpenTableIds === []) {
                $st = $this->local->prepare(
                    'UPDATE DT_Problema_Qualidade p
                       JOIN DT_Tabela t ON t.id = p.table_id
                       JOIN DT_Banco  b ON b.id = t.database_id
                        SET p.is_open = 0, p.resolved_at = NOW()
                      WHERE b.connection_id = :c AND p.rule_key = :r AND p.is_open = 1'
                );
                $st->execute([':c' => $connId, ':r' => $ruleKey]);
                return;
            }
            $ph = implode(',', array_fill(0, count($stillOpenTableIds), '?'));
            $st = $this->local->prepare(
                "UPDATE DT_Problema_Qualidade p
                   JOIN DT_Tabela t ON t.id = p.table_id
                   JOIN DT_Banco  b ON b.id = t.database_id
                    SET p.is_open = 0, p.resolved_at = NOW()
                  WHERE b.connection_id = ? AND p.rule_key = ? AND p.is_open = 1
                    AND p.table_id NOT IN ({$ph})"
            );
            $st->execute(array_merge([$connId, $ruleKey], array_map('intval', $stillOpenTableIds)));
        } catch (PDOException $e) {
            error_log('[datatables:quality] closeStaleIssues: ' . $e->getMessage());
        }
    }

    /** Contagem de problemas abertos por dimensao e severidade. */
    private function issuesByDimension(int $tableId): array
    {
        $out = [
            'qualidade'   => ['critico' => 0, 'atencao' => 0, 'informativo' => 0],
            'integridade' => ['critico' => 0, 'atencao' => 0, 'informativo' => 0],
            'metadados'   => ['critico' => 0, 'atencao' => 0, 'informativo' => 0],
            'seguranca'   => ['critico' => 0, 'atencao' => 0, 'informativo' => 0],
        ];
        try {
            $st = $this->local->prepare(
                'SELECT r.dimension, p.severity, COUNT(*) n
                   FROM DT_Problema_Qualidade p
              LEFT JOIN DT_Regra_Sistema r ON r.rule_key = p.rule_key
                  WHERE p.table_id = :t AND p.is_open = 1
               GROUP BY r.dimension, p.severity'
            );
            $st->execute([':t' => $tableId]);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $d = $r['dimension'] ?? 'qualidade';
                $s = $r['severity'];
                if (isset($out[$d][$s])) {
                    $out[$d][$s] = (int)$r['n'];
                }
            }
        } catch (PDOException $e) {
            // Score degradado e melhor que score ausente.
        }
        return $out;
    }
}
