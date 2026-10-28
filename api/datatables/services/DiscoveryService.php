<?php
// DataTables / DiscoveryService - auditoria de descoberta e reconciliacao de bancos
// @version 1.0.0
// @created 2026-07-21
// @app DataTables
//
// Implementa o brief "Auditoria profunda de fontes e bancos nao identificados":
//   Camada MySQL (§7.3)  - enumera TODOS os schemas visiveis a cada credencial e
//                          detecta visao TOTAL vs PARCIAL a partir dos GRANTS (§14).
//   Camada Config (§7.4) - le blocos DB_*_ do(s) .env deste servidor (senha NUNCA
//                          armazenada; usuario mascarado).
//   Reconciliacao (§7.10)- cruza mysql x config x lista conhecida x catalogo e
//                          classifica cada banco (§8) com nivel de confianca (§9).
//
// REGRA CRITICA (§35): "o usuario so viu 1 banco" != "so existe 1 banco". Por isso
// hosts com visao parcial sao sinalizados e a contagem acessivel != conhecida.
//
// SEGURANCA (§24): conexoes somente-leitura, so information_schema, zero SELECT em
// tabela de negocio, nenhuma senha persistida/retornada, sem varredura de rede.
declare(strict_types=1);

final class DtDiscoveryService
{
    /** Schemas de sistema (§16): detectados, mas separados dos de negocio. */
    private const SYSTEM_SCHEMAS = ['information_schema', 'performance_schema', 'mysql', 'sys'];

    /** Lista conhecida historicamente (§32) - semente de reconciliacao, nao limite. */
    private const KNOWN = [
        'MONITORAMENTO_DADOS', 'Inconsistencias', 'credito_clientes', 'DSHOW_REF', 'consultar_io',
        'DSHOWDASH', 'DSHOW_MEDIA', 'DSHOW_PROD', 'Procedures', 'Kondado', 'DSHOW_DASH', 'LED_LOVERS',
        'INTEGRACAO', 'Logs', 'Kondado - Intermediaria', 'APIS', 'DSHOW_PROD_BACKUP', 'DSHOW_CORRECOES',
        'Backups', 'RDSATION',
    ];

    private PDO $local;

    public function __construct(PDO $local)
    {
        $this->local = $local;
    }

    /**
     * Executa uma rodada completa de descoberta e persiste o resultado.
     * @return array Resumo da rodada (mesmo shape de getLatest()['run']).
     */
    public function run(string $triggeredBy): array
    {
        $runId = $this->openRun($triggeredBy);

        // Acumuladores: db_key => fatos reconciliados; evidencias planas p/ o drawer.
        $dbs        = [];   // db_key => registro
        $nameIndex  = [];   // lower(name) => [db_key,...]
        $evidences  = [];   // [{db_key, db_name, source_type, host, port, username_masked, detail, confidence}]
        $hostVis    = [];   // host:port => {ok, full, label, status?}
        $errors     = [];

        // Estado da rodada ANTERIOR (antes do persist sobrescrever) — base do diff §23.
        $prior    = $this->snapshotForAlerts();
        $hadPrior = count($prior) > 0;

        try {
            // ── Camada Config (§7.4): descobre alvos e evidencias de arquivo ──
            $configConns = $this->discoverFromConfig($evidences, $dbs, $nameIndex);

            // ── Alvos de probe: config + conexoes registradas (dedup host:port) ──
            $targets = $this->buildProbeTargets($configConns);

            // ── Camada MySQL (§7.3): enumera schemas visiveis a cada credencial ──
            foreach ($targets as $t) {
                $this->probeHost($t, $evidences, $dbs, $nameIndex, $hostVis, $errors);
            }

            // ── Catalogo atual do DataTables (o que ja esta em DT_Banco) ──
            $this->tagCatalogued($dbs, $nameIndex, $evidences);

            // ── Lista conhecida (§32): semente de reconciliacao ──
            $this->seedKnown($dbs, $nameIndex, $evidences, $hostVis);

            // ── Camadas 5-9 (§7.5–§7.9): codigo/crons/containers/logs/backups ──
            // Scanner de filesystem/host (PHP puro, degrada com cobertura honesta §35).
            // Reconcilia CADA achado por NOME (§7.10), como a lista conhecida.
            $coverage = [];
            try {
                $scan = (new DtDiscoveryScanService(dirname(__DIR__, 3), self::KNOWN))->scan();
                foreach ($scan['findings'] as $f) {
                    $this->noteReference($dbs, $nameIndex, $evidences, $f);
                }
                $coverage = $scan['coverage'];
            } catch (\Throwable $e) {
                error_log('[datatables] discovery camadas 5-9 falharam: ' . $e->getMessage());
                $errors[] = 'camadas 5-9: ' . mb_substr($e->getMessage(), 0, 120);
            }

            // ── Classifica cada banco (§8/§9) ──
            $partialHosts = [];
            foreach ($hostVis as $hp => $v) {
                if (!empty($v['ok']) && empty($v['full'])) {
                    $partialHosts[] = $v['label'];
                }
            }
            foreach ($dbs as $k => &$d) {
                $this->classify($d, $partialHosts);
            }
            unset($d);

            // ── Persiste ──
            $this->persist($runId, $dbs, $evidences);

            // ── Alertas §23: difere esta rodada da anterior (novo/sumiu/só-backup/…) ──
            $alertsRaised = 0;
            try {
                $alertsRaised = $this->emitAlerts($prior, $hadPrior, $dbs, $hostVis);
            } catch (\Throwable $e) {
                error_log('[datatables] discovery alertas falharam: ' . $e->getMessage());
            }

            $stats = $this->computeStats($dbs, $hostVis, $partialHosts, $errors, $coverage);
            $stats['alerts_raised'] = $alertsRaised;
            $status = $alertsRaised > 0 ? 'completed_with_alerts' : 'completed';   // §29
            $this->closeRun($runId, $status, $stats, $errors ? implode(' | ', array_slice($errors, 0, 3)) : null);

            return $this->getRun($runId);
        } catch (\Throwable $e) {
            error_log('[datatables] discovery falhou: ' . $e->getMessage());
            $this->closeRun($runId, 'failed', ['error' => true], mb_substr($e->getMessage(), 0, 900));
            return $this->getRun($runId);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMADA CONFIG (§7.4)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Le os .env deste servidor. Retorna conexoes config {host,port,name,user,pass}
     * (pass so em memoria) e ja registra evidencias de arquivo (usuario MASCARADO).
     */
    private function discoverFromConfig(array &$evidences, array &$dbs, array &$nameIndex): array
    {
        $root  = dirname(__DIR__, 3); // /var/www/dshowdash
        $files = glob($root . '/.env*') ?: [];
        $conns = [];

        foreach ($files as $path) {
            if (!is_file($path) || !is_readable($path)) {
                continue;
            }
            // Templates/exemplos NAO carregam credencial real e geram falso positivo
            // com host vazio (§8.12). Sao ignorados por completo.
            if (preg_match('/\.(example|sample|dist|template)$/i', basename($path))) {
                continue;
            }

            foreach ($this->parseEnvDbBlocks($path) as $c) {
                $host = $c['host'] !== null ? trim($c['host']) : '';
                $name = $c['name'] !== null ? trim($c['name']) : '';
                // Exige host E nome reais; placeholders vazios sao descartados.
                if ($host === '' || $name === '') {
                    continue;
                }
                $c['host'] = $host;
                $conns[] = $c; // alvo de probe

                $key = $this->dbKey($host, $c['port'], $name);
                $this->touch($dbs, $nameIndex, $key, $name, $host, $c['port']);
                $dbs[$key]['seen_config'] = true;
                $dbs[$key]['application'] = $dbs[$key]['application'] ?? $c['group'];
                $evidences[] = [
                    'db_key' => $key, 'db_name' => $name, 'source_type' => 'config',
                    'host' => $host, 'port' => $c['port'],
                    'username_masked' => $this->maskUser($c['user']),
                    'detail' => $this->relPath($path, $root) . '  (bloco DB_' . $c['group'] . '_*)',
                    'confidence' => 'media',
                ];
            }
        }
        return $conns;
    }

    /** Extrai blocos DB_<GRUPO>_<CAMPO> de um arquivo estilo .env. */
    private function parseEnvDbBlocks(string $path): array
    {
        $kv    = [];
        $lines = @file($path, FILE_IGNORE_NEW_LINES) ?: [];
        foreach ($lines as $ln) {
            $ln = trim($ln);
            if ($ln === '' || $ln[0] === '#') {
                continue;
            }
            if (!preg_match('/^([A-Z0-9_]+)\s*=\s*(.*)$/', $ln, $m)) {
                continue;
            }
            $kv[$m[1]] = trim($m[2], " \t\"'");
        }
        $groups = [];
        foreach ($kv as $k => $v) {
            if (preg_match('/^DB_(.+)_(HOST|PORT|NAME|DATABASE|USER|USERNAME|PASS|PASSWORD)$/', $k, $m)) {
                $groups[$m[1]][strtoupper($m[2])] = $v;
            }
        }
        $out = [];
        foreach ($groups as $g => $f) {
            $out[] = [
                'group' => $g,
                'host'  => $f['HOST'] ?? null,
                'port'  => (int) ($f['PORT'] ?? 3306),
                'name'  => $f['NAME'] ?? $f['DATABASE'] ?? null,
                'user'  => $f['USER'] ?? $f['USERNAME'] ?? null,
                'pass'  => $f['PASS'] ?? $f['PASSWORD'] ?? null,
            ];
        }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMADA MYSQL (§7.3)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Une conexoes config + DT_Conexao registradas. Dedup por host:port:USUARIO —
     * credenciais DIFERENTES no MESMO host sondam separadamente e a visibilidade e
     * a UNIAO (§35: um user restrito ve 2 schemas, um amplo ve 22; juntos = 22).
     */
    private function buildProbeTargets(array $configConns): array
    {
        $targets = [];
        $keyOf = fn(string $host, int $port, ?string $user): string =>
            $this->hostPort($host, $port) . '|' . strtolower(trim((string) $user));

        foreach ($configConns as $c) {
            $k = $keyOf($c['host'], $c['port'], $c['user']);
            if (!isset($targets[$k])) {
                $targets[$k] = [
                    'host' => $c['host'], 'port' => $c['port'],
                    'user' => $c['user'], 'pass' => $c['pass'], 'enc' => false,
                    'label' => $this->hostLabel($c['host'], $c['port']),
                ];
            }
        }
        // Conexoes cadastradas (senha cifrada). Mesma credencial+host ja coberta = pula.
        try {
            $st = $this->local->query(
                'SELECT host, port, username, password_encrypted FROM DT_Conexao
                  WHERE is_active = 1 AND source_type IN ("mysql","mariadb") AND host <> ""'
            );
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $k = $keyOf($r['host'], (int) $r['port'], $r['username']);
                if (isset($targets[$k])) {
                    continue;
                }
                $targets[$k] = [
                    'host' => $r['host'], 'port' => (int) $r['port'],
                    'user' => $r['username'], 'pass' => (string) $r['password_encrypted'], 'enc' => true,
                    'label' => $this->hostLabel($r['host'], (int) $r['port']),
                ];
            }
        } catch (\Throwable $e) {
            // DT_Conexao pode nao ter as colunas; config ja cobre o essencial.
        }
        return array_values($targets);
    }

    /** Conecta read-only e enumera schemas + detecta visao total/parcial. */
    private function probeHost(array $t, array &$evidences, array &$dbs, array &$nameIndex, array &$hostVis, array &$errors): void
    {
        $hp   = $this->hostPort($t['host'], $t['port']);
        $conn = [
            'host' => $t['host'], 'port' => $t['port'], 'db_name' => null,
            'username' => $t['user'],
            // password_encrypted: cifrado (DT_Conexao) ou texto plano (config) - open() tolera ambos.
            'password_encrypted' => $t['pass'],
        ];
        $pdo = null;
        try {
            $pdo  = DtConnectionFactory::open($conn, null);
            $full = $this->hasFullVisibility($pdo);
            $uuid = $this->serverSignature($pdo);   // §19/§20: identidade real da instância

            $rows = $pdo->query(
                'SELECT s.SCHEMA_NAME AS nm,
                        COALESCE(t.c, 0)  AS tc,
                        COALESCE(t.sz, 0) AS sz
                   FROM information_schema.SCHEMATA s
                   LEFT JOIN (SELECT TABLE_SCHEMA, COUNT(*) c, SUM(DATA_LENGTH + INDEX_LENGTH) sz
                                FROM information_schema.TABLES GROUP BY TABLE_SCHEMA) t
                     ON t.TABLE_SCHEMA = s.SCHEMA_NAME'
            )->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $r) {
                $nm  = (string) $r['nm'];
                $sys = in_array(strtolower($nm), self::SYSTEM_SCHEMAS, true);
                $key = $this->dbKey($t['host'], $t['port'], $nm);
                $this->touch($dbs, $nameIndex, $key, $nm, $t['host'], $t['port']);
                $dbs[$key]['seen_mysql']   = true;
                $dbs[$key]['is_system']    = $sys;
                $dbs[$key]['table_count']  = (int) $r['tc'];
                $dbs[$key]['size_bytes']   = $r['sz'] !== null ? (int) $r['sz'] : null;
                $dbs[$key]['is_empty']     = ((int) $r['tc'] === 0);
                $dbs[$key]['server_uuid']  = $uuid;
                $evidences[] = [
                    'db_key' => $key, 'db_name' => $nm, 'source_type' => 'mysql',
                    'host' => $t['host'], 'port' => $t['port'],
                    'username_masked' => $this->maskUser($t['user']),
                    'detail' => 'visivel via information_schema.SCHEMATA (' . (int) $r['tc'] . ' tabelas)'
                                . ($full ? '' : ' — host de VISAO PARCIAL'),
                    'confidence' => 'alta',
                ];
            }
            // MESCLA com sonda anterior do MESMO host (outra credencial): fica a MELHOR
            // visao — total se qualquer uma for total, e o maior nº de schemas visto (§35 uniao).
            $prev = $hostVis[$hp] ?? null;
            $hostVis[$hp] = [
                'ok'      => true,
                'full'    => $full || (bool) ($prev['full'] ?? false),
                'label'   => $t['label'],
                'schemas' => max((int) count($rows), (int) ($prev['schemas'] ?? 0)),
                'uuid'    => $uuid ?: ($prev['uuid'] ?? null),
            ];
        } catch (\Throwable $e) {
            $status = DtConnectionFactory::classifyError($e);
            // Nao rebaixa um host que outra credencial ja provou acessivel.
            if (empty($hostVis[$hp]['ok'])) {
                $hostVis[$hp] = ['ok' => false, 'full' => false, 'label' => $t['label'], 'status' => $status];
            }
            $errors[] = $t['label'] . ': ' . $status;
        } finally {
            DtConnectionFactory::close($pdo);
        }
    }

    /** Detecta se a credencial enxerga TODOS os bancos (ALL PRIVILEGES/SHOW DATABASES em *.*). */
    private function hasFullVisibility(PDO $pdo): bool
    {
        try {
            $grants = $pdo->query('SHOW GRANTS')->fetchAll(PDO::FETCH_COLUMN) ?: [];
        } catch (\Throwable $e) {
            return false;
        }
        foreach ($grants as $g) {
            $gu = strtoupper((string) $g);
            if (preg_match('/ON \*\.\* TO/', $gu)
                && (str_contains($gu, 'ALL PRIVILEGES') || str_contains($gu, 'SHOW DATABASES'))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Assinatura da instância (§19/§20): identidade real do servidor, p/ detectar
     * aliases e "banco mudou de servidor". Tolerante: MySQL tem @@server_uuid;
     * MariaDB não → cai p/ hash de hostname+port+server_id. Nunca lança (só-leitura).
     */
    private function serverSignature(PDO $pdo): ?string
    {
        try {
            $u = $pdo->query('SELECT @@server_uuid')->fetchColumn();
            if ($u) {
                return (string) $u;
            }
        } catch (\Throwable $e) {
            // MariaDB não expõe @@server_uuid — usa fallback abaixo.
        }
        try {
            $r = $pdo->query('SELECT @@hostname AS h, @@port AS p, @@server_id AS s')->fetch(PDO::FETCH_ASSOC);
            if ($r) {
                return 'sig:' . substr(hash('sha256', ($r['h'] ?? '') . '|' . ($r['p'] ?? '') . '|' . ($r['s'] ?? '')), 0, 40);
            }
        } catch (\Throwable $e) {
            // sem assinatura possível
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════
    // CATALOGO + LISTA CONHECIDA
    // ═══════════════════════════════════════════════════════════════

    /** Marca seen_catalog nos bancos ja presentes em DT_Banco (via DT_Conexao). */
    private function tagCatalogued(array &$dbs, array &$nameIndex, array &$evidences): void
    {
        $sql = 'SELECT b.id, b.name, c.host, c.port
                  FROM DT_Banco b
                  JOIN DT_Conexao c ON c.id = b.connection_id
                 WHERE b.is_present = 1';
        try {
            $rows = $this->local->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            return;
        }
        foreach ($rows as $r) {
            $key = $this->dbKey((string) $r['host'], (int) $r['port'], (string) $r['name']);
            $this->touch($dbs, $nameIndex, $key, (string) $r['name'], (string) $r['host'], (int) $r['port']);
            $dbs[$key]['seen_catalog']        = true;
            $dbs[$key]['catalogued']          = true;
            $dbs[$key]['catalog_database_id'] = (int) $r['id'];
            $evidences[] = [
                'db_key' => $key, 'db_name' => (string) $r['name'], 'source_type' => 'catalog',
                'host' => (string) $r['host'], 'port' => (int) $r['port'], 'username_masked' => null,
                'detail' => 'ja catalogado no DataTables (DT_Banco #' . (int) $r['id'] . ')',
                'confidence' => 'alta',
            ];
        }
    }

    /** Reconcilia a lista conhecida (§32) por NOME; cria "referenciado" se nao achado. */
    private function seedKnown(array &$dbs, array &$nameIndex, array &$evidences, array $hostVis): void
    {
        foreach (self::KNOWN as $name) {
            $low   = strtolower($name);
            $found = $nameIndex[$low] ?? [];
            if ($found) {
                foreach ($found as $key) {
                    $dbs[$key]['seen_known'] = true;
                    $evidences[] = [
                        'db_key' => $key, 'db_name' => $name, 'source_type' => 'known_list',
                        'host' => $dbs[$key]['host'], 'port' => $dbs[$key]['port'], 'username_masked' => null,
                        'detail' => 'consta na lista conhecida do brief (§32)',
                        'confidence' => 'baixa',
                    ];
                }
                continue;
            }
            // Sem match exato: tenta VARIANTE/RENAME (ex.: LED_LOVERS ~ Led_Lovers_PROD;
            // "Kondado - Intermediaria" ~ Intermediaria) antes de dar como nao encontrado.
            $fz = $this->fuzzyKnownMatch($name, $dbs);
            if ($fz !== null) {
                $key = $fz['key'];
                $dbs[$key]['seen_known'] = true;
                $evidences[] = [
                    'db_key' => $key, 'db_name' => $name, 'source_type' => 'known_list',
                    'host' => $dbs[$key]['host'], 'port' => $dbs[$key]['port'], 'username_masked' => null,
                    'detail' => 'corresponde ao conhecido "' . $name . '" por '
                              . ($fz['kind'] === 'variante' ? 'variante/rename' : 'nome contido')
                              . ' (confirmar)',
                    'confidence' => 'media',
                ];
                continue;
            }
            // Nao encontrado em host algum: referencia pendente.
            $key = 'ref/' . $low;
            $this->touch($dbs, $nameIndex, $key, $name, null, null);
            $dbs[$key]['seen_known'] = true;
            $evidences[] = [
                'db_key' => $key, 'db_name' => $name, 'source_type' => 'known_list',
                'host' => null, 'port' => null, 'username_masked' => null,
                'detail' => 'consta na lista conhecida do brief, mas nao foi localizado em host acessivel',
                'confidence' => 'baixa',
            ];
        }
    }

    /**
     * Reconcilia um achado das camadas 5-9 (§7.5–§7.9) por NOME (§7.10):
     *   - se o nome ja existe (mysql/config/catalogo/conhecido) → anexa evidencia e
     *     marca a flag de origem (seen_code/cron/container/log/backup) em cada match;
     *   - senao → cria/atualiza referencia pendente ref/<nome> com a flag.
     * A senha NUNCA vem no achado (o scanner nao a captura). Fonte varchar-livre.
     */
    private function noteReference(array &$dbs, array &$nameIndex, array &$evidences, array $f): void
    {
        $name = (string) ($f['name'] ?? '');
        if ($name === '') {
            return;
        }
        $flag = 'seen_' . $f['source_type'];       // seen_code|seen_cron|seen_container|seen_log|seen_backup
        $ev = [
            'source_type' => $f['source_type'], 'db_name' => $name,
            'host' => $f['host'] ?? null, 'port' => $f['port'] ?? null, 'username_masked' => null,
            'detail' => $f['detail'] ?? null, 'confidence' => $f['confidence'] ?? 'baixa',
        ];

        $matches = $nameIndex[strtolower($name)] ?? [];
        if ($matches) {
            foreach ($matches as $key) {
                $dbs[$key][$flag] = true;
                if (!empty($f['application']) && empty($dbs[$key]['application'])) {
                    $dbs[$key]['application'] = $f['application'];
                }
                if (!empty($f['last_backup'])) {
                    $dbs[$key]['last_backup'] = $f['last_backup'];
                }
                $evidences[] = ['db_key' => $key] + $ev;
            }
            return;
        }

        // Nao encontrado em host algum: referencia pendente por nome.
        $key = 'ref/' . strtolower($name);
        $this->touch($dbs, $nameIndex, $key, $name, null, null);
        $dbs[$key][$flag] = true;
        if (!empty($f['application']) && empty($dbs[$key]['application'])) {
            $dbs[$key]['application'] = $f['application'];
        }
        if (!empty($f['last_backup'])) {
            $dbs[$key]['last_backup'] = $f['last_backup'];
        }
        $evidences[] = ['db_key' => $key] + $ev;
    }

    /**
     * Casa um nome conhecido com um banco REAL descoberto por VARIANTE/RENAME.
     * - variante: nomes iguais ao remover sufixo de ambiente (LED_LOVERS ~ Led_Lovers_PROD).
     * - token:    o nome encontrado e um token significativo do conhecido
     *             ("Kondado - Intermediaria" contem "Intermediaria"); prefere o token mais longo.
     * So casa contra bancos vistos no MySQL (nao contra outras referencias).
     */
    private function fuzzyKnownMatch(string $known, array $dbs): ?array
    {
        $kn      = $this->normNome($known);
        $kcore   = $this->coreNome($kn);
        // core especifico o suficiente para evitar casar por prefixo generico (ex.: "dshow").
        $kespecifico = (mb_strpos($kcore, ' ') !== false) || mb_strlen($kcore) >= 7;
        $ktokens = array_values(array_filter(explode(' ', $kn), static fn($t) => mb_strlen($t) >= 6));
        $tokenHit = null;
        $tokenLen = 0;

        foreach ($dbs as $key => $d) {
            if (empty($d['seen_mysql']) || !empty($d['is_system'])) {
                continue;
            }
            $fn = $this->normNome((string) $d['name']);
            if ($fn === $kn) {
                continue; // teria batido no exato
            }
            $fcore = $this->coreNome($fn);
            if ($kespecifico && $fcore !== '' && ($fcore === $kcore || $fcore === $kn || $fn === $kcore)) {
                return ['key' => $key, 'kind' => 'variante', 'name' => (string) $d['name']];
            }
            if (in_array($fn, $ktokens, true) && mb_strlen($fn) > $tokenLen) {
                $tokenLen = mb_strlen($fn);
                $tokenHit = ['key' => $key, 'kind' => 'token', 'name' => (string) $d['name']];
            }
        }
        return $tokenHit;
    }

    /** Normaliza: minusculas, separadores (_ - espaco) viram espaco unico. */
    private function normNome(string $n): string
    {
        return trim((string) preg_replace('/[_\-\s]+/', ' ', mb_strtolower(trim($n))));
    }

    /** Remove sufixo de ambiente no fim (prod/dev/staging/backup/...). */
    private function coreNome(string $norm): string
    {
        return trim((string) preg_replace('/\s*\b(prod|prd|dev|staging|homolog|hml|test|tst|backup|bkp|old|new)\b\s*$/', '', $norm));
    }

    // ═══════════════════════════════════════════════════════════════
    // CLASSIFICACAO (§8/§9)
    // ═══════════════════════════════════════════════════════════════

    private function classify(array &$d, array $partialHosts): void
    {
        if (!empty($d['seen_mysql'])) {
            $d['is_accessible'] = true;
            if (!empty($d['is_system'])) {
                $d['situation'] = 'sistema';
                $d['confidence'] = 'alta';
            } elseif (!empty($d['is_empty'])) {
                $d['situation'] = 'vazio';
                $d['confidence'] = 'alta';
                $d['reason'] = 'schema existe mas nao tem tabelas';
            } else {
                $d['situation'] = 'encontrado_acessivel';
                $d['confidence'] = 'alta';
            }
            if (empty($d['seen_catalog']) && empty($d['is_system'])) {
                $d['reason'] = 'acessivel, porem ainda NAO catalogado no DataTables';
            }
            return;
        }

        // Nao visto no MySQL: veio de config, lista conhecida e/ou camadas 5-9.
        $d['is_accessible'] = false;
        $d['situation'] = 'referenciado_nao_encontrado';

        // Origens que citam o banco (§7.10) — quanto mais fontes, maior a confianca.
        $origens = [];
        if (!empty($d['seen_config']))    { $origens[] = 'configuracao'; }
        if (!empty($d['seen_code']))      { $origens[] = 'codigo-fonte'; }
        if (!empty($d['seen_cron']))      { $origens[] = 'cron/rotina'; }
        if (!empty($d['seen_container'])) { $origens[] = 'container'; }
        if (!empty($d['seen_log']))       { $origens[] = 'log'; }
        if (!empty($d['seen_backup']))    { $origens[] = 'backup'; }
        if (!empty($d['seen_known']) && !$origens) { $origens[] = 'lista conhecida'; }

        // Confianca: 2+ fontes ou uma fonte forte (config/codigo) = media; senao baixa.
        $forte = !empty($d['seen_config']) || !empty($d['seen_code']);
        $d['confidence'] = (count($origens) >= 2 || $forte) ? 'media' : 'baixa';

        // Caso §7.9: presente APENAS em backup = historico/nao ativo.
        $soBackup = !empty($d['seen_backup']) && !$forte && empty($d['seen_cron'])
                    && empty($d['seen_container']) && empty($d['seen_log']);
        if ($soBackup) {
            $motivo = 'presente apenas em BACKUP (historico/nao ativo §7.9)'
                    . (!empty($d['last_backup']) ? ' — ultimo: ' . $d['last_backup'] : '');
        } else {
            $motivo = 'referenciado em ' . implode(', ', $origens ?: ['lista conhecida'])
                    . ', sem host acessivel que o exponha';
        }
        if ($partialHosts) {
            $motivo .= '. Pode estar oculto por permissao em host de visao parcial ('
                     . implode(', ', array_slice($partialHosts, 0, 2)) . ')';
        }
        $d['reason'] = mb_substr($motivo, 0, 300);
    }

    // ═══════════════════════════════════════════════════════════════
    // PERSISTENCIA
    // ═══════════════════════════════════════════════════════════════

    private function persist(int $runId, array $dbs, array $evidences): void
    {
        $this->local->beginTransaction();
        try {
            // Evidencias refletem o estado atual: reconstruidas a cada rodada.
            $this->local->exec('DELETE FROM DT_Discovery_Evidence');
            $ev = $this->local->prepare(
                'INSERT INTO DT_Discovery_Evidence
                   (run_id, db_key, db_name, source_type, host, port, username_masked, detail, confidence)
                 VALUES (:r,:k,:n,:s,:h,:p,:u,:d,:c)'
            );
            foreach ($evidences as $e) {
                $ev->execute([
                    ':r' => $runId, ':k' => $e['db_key'], ':n' => $e['db_name'] ?? null,
                    ':s' => $e['source_type'], ':h' => $e['host'] ?? null, ':p' => $e['port'] ?? null,
                    ':u' => $e['username_masked'] ?? null, ':d' => $e['detail'] ?? null,
                    ':c' => $e['confidence'] ?? 'media',
                ]);
            }

            $up = $this->local->prepare(
                'INSERT INTO DT_Discovered_Database
                   (run_id, db_key, name, host, port, server_context, environment, situation, confidence,
                    is_accessible, is_system, is_empty, catalogued, catalog_database_id, table_count, size_bytes,
                    application, seen_mysql, seen_config, seen_known, seen_catalog,
                    seen_code, seen_cron, seen_container, seen_log, seen_backup,
                    server_uuid, is_present, disappeared_at, reason, first_seen_at, last_seen_at)
                 VALUES
                   (:r,:k,:n,:h,:p,:sc,:env,:sit,:conf,:acc,:sys,:emp,:cat,:cid,:tc,:sz,:app,:sm,:scfg,:sk,:scat,
                    :scode,:scron,:scont,:slog,:sbak,:uuid,1,NULL,:reason,NOW(),NOW())
                 ON DUPLICATE KEY UPDATE
                    run_id=VALUES(run_id), name=VALUES(name), host=VALUES(host), port=VALUES(port),
                    server_context=VALUES(server_context), environment=VALUES(environment),
                    situation=VALUES(situation), confidence=VALUES(confidence), is_accessible=VALUES(is_accessible),
                    is_system=VALUES(is_system), is_empty=VALUES(is_empty), catalogued=VALUES(catalogued),
                    catalog_database_id=VALUES(catalog_database_id), table_count=VALUES(table_count),
                    size_bytes=VALUES(size_bytes), application=VALUES(application), seen_mysql=VALUES(seen_mysql),
                    seen_config=VALUES(seen_config), seen_known=VALUES(seen_known), seen_catalog=VALUES(seen_catalog),
                    seen_code=VALUES(seen_code), seen_cron=VALUES(seen_cron), seen_container=VALUES(seen_container),
                    seen_log=VALUES(seen_log), seen_backup=VALUES(seen_backup),
                    server_uuid=VALUES(server_uuid), is_present=1, disappeared_at=NULL,
                    reason=VALUES(reason), last_seen_at=NOW()'
            );
            foreach ($dbs as $key => $d) {
                $up->execute([
                    ':r' => $runId, ':k' => $key, ':n' => $d['name'],
                    ':h' => $d['host'], ':p' => $d['port'],
                    ':sc' => $this->serverContext($d['host']), ':env' => $d['environment'] ?? null,
                    ':sit' => $d['situation'] ?? 'referenciado_nao_encontrado', ':conf' => $d['confidence'] ?? 'media',
                    ':acc' => !empty($d['is_accessible']) ? 1 : 0, ':sys' => !empty($d['is_system']) ? 1 : 0,
                    ':emp' => !empty($d['is_empty']) ? 1 : 0, ':cat' => !empty($d['catalogued']) ? 1 : 0,
                    ':cid' => $d['catalog_database_id'] ?? null,
                    ':tc' => $d['table_count'] ?? null, ':sz' => $d['size_bytes'] ?? null,
                    ':app' => $d['application'] ?? null,
                    ':sm' => !empty($d['seen_mysql']) ? 1 : 0, ':scfg' => !empty($d['seen_config']) ? 1 : 0,
                    ':sk' => !empty($d['seen_known']) ? 1 : 0, ':scat' => !empty($d['seen_catalog']) ? 1 : 0,
                    ':scode' => !empty($d['seen_code']) ? 1 : 0, ':scron' => !empty($d['seen_cron']) ? 1 : 0,
                    ':scont' => !empty($d['seen_container']) ? 1 : 0, ':slog' => !empty($d['seen_log']) ? 1 : 0,
                    ':sbak' => !empty($d['seen_backup']) ? 1 : 0,
                    ':uuid' => $d['server_uuid'] ?? null,
                    ':reason' => $d['reason'] ?? null,
                ]);
            }

            // §8.5/§22: bancos que NÃO vieram nesta rodada (run_id != atual) = desapareceram.
            // Marca ausência (mantém a linha p/ histórico); reaparecer limpa via upsert acima.
            $this->local->prepare(
                'UPDATE DT_Discovered_Database
                    SET is_present = 0, disappeared_at = COALESCE(disappeared_at, NOW())
                  WHERE run_id <> :r AND is_present = 1'
            )->execute([':r' => $runId]);

            $this->local->commit();
        } catch (\Throwable $e) {
            $this->local->rollBack();
            throw $e;
        }
    }

    private function computeStats(array $dbs, array $hostVis, array $partialHosts, array $errors, array $coverage = []): array
    {
        $bucket = ['encontrado_acessivel' => 0, 'vazio' => 0, 'sistema' => 0,
                   'referenciado_nao_encontrado' => 0, 'sem_permissao' => 0];
        $catalogued = 0; $naoCat = 0;
        foreach ($dbs as $d) {
            $s = $d['situation'] ?? 'referenciado_nao_encontrado';
            $bucket[$s] = ($bucket[$s] ?? 0) + 1;
            if (!empty($d['seen_catalog'])) {
                $catalogued++;
            } elseif (($s === 'encontrado_acessivel')) {
                $naoCat++;
            }
        }
        $hostsOk = 0; $hostsFail = 0; $hosts = [];
        foreach ($hostVis as $hp => $v) {
            empty($v['ok']) ? $hostsFail++ : $hostsOk++;
            $status = empty($v['ok'])
                ? ($v['status'] ?? 'offline')          // offline|credential_expired|...
                : (!empty($v['full']) ? 'total' : 'parcial');
            $hosts[] = [
                'host'    => $v['label'] ?? $hp,
                'status'  => $status,
                'schemas' => $v['schemas'] ?? null,
            ];
        }
        $acessiveis = ($bucket['encontrado_acessivel'] ?? 0) + ($bucket['vazio'] ?? 0);
        $seenConfig = 0;
        foreach ($dbs as $d) {
            if (!empty($d['seen_config'])) { $seenConfig++; }
        }

        return [
            'hosts_ok' => $hostsOk, 'hosts_fail' => $hostsFail,
            'hosts_parciais' => count($partialHosts), 'hosts_parciais_labels' => $partialHosts,
            'hosts' => $hosts,
            'buckets' => $bucket, 'catalogados' => $catalogued, 'nao_catalogados' => $naoCat,
            'referenciados' => $bucket['referenciado_nao_encontrado'],
            'vazios' => $bucket['vazio'], 'sistema' => $bucket['sistema'],
            'layers' => $coverage,   // §7.5–§7.9: cobertura por camada (completa|parcial|indisponivel)
            'etapas' => $this->buildEtapas($hostsOk, $hostsFail, $acessiveis, $seenConfig, $coverage, count($dbs)),
            'erros' => array_slice($errors, 0, 5),
        ];
    }

    /**
     * Timeline das 11 etapas da rodada (§29/§30). Cada uma com status e um número.
     * status: ok | parcial | vazio | indisponivel.
     */
    private function buildEtapas(int $hostsOk, int $hostsFail, int $acessiveis, int $seenConfig, array $coverage, int $total): array
    {
        $covByLayer = [];
        foreach ($coverage as $c) {
            $covByLayer[$c['layer']] = $c;
        }
        $stEtapa = static function (int $n): string {
            return $n > 0 ? 'ok' : 'vazio';
        };
        $stHost = ($hostsOk > 0 && $hostsFail === 0) ? 'ok' : ($hostsOk > 0 ? 'parcial' : 'indisponivel');
        $fromLayer = static function (?array $c): array {
            if ($c === null) { return ['status' => 'vazio', 'n' => 0]; }
            return ['status' => $c['status'] === 'completa' ? 'ok' : $c['status'], 'n' => (int) ($c['hits'] ?? 0)];
        };
        $L = static fn(string $k) => $fromLayer($covByLayer[$k] ?? null);

        $etapas = [];
        $add = static function (string $rotulo, string $status, int $n, string $unid) use (&$etapas): void {
            $etapas[] = ['rotulo' => $rotulo, 'status' => $status, 'n' => $n, 'unidade' => $unid];
        };
        $add('Servidores', $stHost, $hostsOk + $hostsFail, 'host(s)');
        $add('Serviços MySQL', $stHost, $hostsOk, 'ativo(s)');
        $add('Conexões', $stHost, $hostsOk, 'ok');
        $add('Bancos', $stEtapa($acessiveis), $acessiveis, 'acessível(is)');
        $add('Configurações', $stEtapa($seenConfig), $seenConfig, 'no .env');
        $lc = $L('codigo');      $add('Código', $lc['status'], $lc['n'], 'citado(s)');
        $ct = $L('containers');  $add('Containers', $ct['status'], $ct['n'], 'declarado(s)');
        $cr = $L('crons');       $add('Crons', $cr['status'], $cr['n'], 'citado(s)');
        $lg = $L('logs');        $add('Logs', $lg['status'], $lg['n'], 'citado(s)');
        $bk = $L('backups');     $add('Backups', $bk['status'], $bk['n'], 'em backup');
        $add('Reconciliação', $stEtapa($total), $total, 'banco(s)');
        return $etapas;
    }

    // ═══════════════════════════════════════════════════════════════
    // ALERTAS (§23) — diff entre rodadas
    // ═══════════════════════════════════════════════════════════════

    /** Estado persistido da rodada anterior (db_key => fatos-chave), base do diff §23. */
    private function snapshotForAlerts(): array
    {
        try {
            $rows = $this->local->query(
                'SELECT id, db_key, name, host, port, situation, seen_mysql, seen_backup,
                        is_system, catalogued, user_status, server_uuid
                   FROM DT_Discovered_Database'
            )->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            return [];
        }
        $out = [];
        foreach ($rows as $r) {
            $out[(string) $r['db_key']] = $r;
        }
        return $out;
    }

    /**
     * Gera alertas (§23) comparando esta rodada com a anterior, REUSANDO DtAlertService
     * (dedup por fingerprint; aparecem na aba Alertas). Triados (user_status) são
     * silenciados nos alertas de banco. Retorna quantos foram levantados/reafirmados.
     * Idempotente entre rodadas: mesmas condições reafirmam o MESMO alerta, não duplicam.
     */
    private function emitAlerts(array $prior, bool $hadPrior, array $dbs, array $hostVis): int
    {
        if (!class_exists('DtAlertService')) {
            return 0;   // contexto sem o serviço de alertas (ex.: teste isolado)
        }
        $al  = new DtAlertService($this->local);
        $tt  = 'discovery';
        $n   = 0;

        // id atual por db_key (após o persist), p/ alvo estável do alerta.
        $idByKey = [];
        try {
            foreach ($this->local->query('SELECT id, db_key FROM DT_Discovered_Database')->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $idByKey[(string) $r['db_key']] = (int) $r['id'];
            }
        } catch (\Throwable $e) {
            // segue sem ids; alerta ainda registra pelo título
        }

        // Conjuntos de hosts acessíveis antes × agora (novo servidor).
        $priorHosts = [];
        foreach ($prior as $r) {
            if ((int) $r['seen_mysql'] === 1 && $r['host'] !== null) {
                $priorHosts[$this->hostPort((string) $r['host'], (int) $r['port'])] = true;
            }
        }

        foreach ($dbs as $key => $d) {
            $p       = $prior[$key] ?? null;
            $triado  = $p !== null && !empty($p['user_status']);   // triado = silenciado
            $id      = $idByKey[$key] ?? null;
            $name    = (string) $d['name'];
            $onde    = $d['host'] ? ($d['host'] . ':' . ($d['port'] ?: 3306)) : 'host desconhecido';
            $wasAcc  = $p !== null && (int) $p['seen_mysql'] === 1;

            if (!empty($d['seen_mysql']) && empty($d['is_system'])) {
                // Banco acessível: se voltou/é novo, resolve alertas de ausência.
                $al->resolve('discovery_db_vanished', $tt, $id);
                $al->resolve('discovery_backup_only', $tt, $id);
                if ($hadPrior && !$triado && !$wasAcc) {
                    $extra = empty($d['catalogued']) ? ' (ainda NÃO catalogado — §23 produção sem cadastro)' : '';
                    $al->raise('discovery_new_db', $tt, $id, "Novo banco descoberto: {$name}", "Acessível em {$onde}{$extra}.");
                    $n++;
                }
                continue;
            }

            // Antes acessível, agora não: desapareceu OU virou só-backup.
            if ($hadPrior && !$triado && $wasAcc && empty($d['is_system'])) {
                if (!empty($d['seen_backup'])) {
                    $al->raise('discovery_backup_only', $tt, $id, "Banco só em backup: {$name}",
                        "Estava acessível e agora só aparece em backup (histórico/inativo §7.9).");
                } else {
                    $al->raise('discovery_db_vanished', $tt, $id, "Banco desapareceu: {$name}",
                        "Estava acessível em {$onde} e não foi mais localizado.");
                }
                $n++;
                continue;
            }

            // Novo referenciado-não-encontrado (não existia na rodada anterior).
            if ($hadPrior && !$triado && $p === null && ($d['situation'] ?? '') === 'referenciado_nao_encontrado') {
                $al->raise('discovery_ref_found', $tt, $id, "Referenciado não encontrado: {$name}",
                    mb_substr((string) ($d['reason'] ?? 'citado em código/config/backup, sem host que o exponha'), 0, 300));
                $n++;
            }
        }

        // Chaves que sumiram por completo (não vieram nesta rodada).
        foreach ($prior as $key => $p) {
            if (isset($dbs[$key]) || (int) $p['seen_mysql'] !== 1 || !empty($p['user_status'])) {
                continue;
            }
            if ($hadPrior) {
                $al->raise('discovery_db_vanished', $tt, $idByKey[$key] ?? (int) $p['id'],
                    "Banco desapareceu: {$p['name']}", 'Estava acessível e não apareceu na última auditoria.');
                $n++;
            }
        }

        // Hosts: novo servidor, inventário parcial, credencial que parou.
        foreach ($hostVis as $hp => $v) {
            $sid   = $this->hostAlertId($hp);
            $label = $v['label'] ?? $hp;
            if (empty($v['ok'])) {
                $st = $v['status'] ?? 'offline';
                $al->raise('discovery_partial', 'server', $sid, "Inventário parcial: {$label}",
                    "Host não respondeu ao probe (status: {$st}) — a rodada é parcial (§23).");
                $n++;
            } elseif (empty($v['full'])) {
                $al->raise('discovery_partial', 'server', $sid, "Visão parcial: {$label}",
                    'A credencial enxerga só parte dos bancos (§35): o total "acessível" é um piso, não o teto.');
                $n++;
            } else {
                $al->resolve('discovery_partial', 'server', $sid);   // host OK e visão total → limpa
                if ($hadPrior && !isset($priorHosts[$hp])) {
                    $al->raise('discovery_new_server', 'server', $sid, "Novo servidor descoberto: {$label}",
                        'Host acessível não visto em auditorias anteriores.');
                    $n++;
                }
            }
        }

        // Banco MUDOU DE SERVIDOR (§23): mesmo NOME acessível numa instância diferente
        // (server_uuid §19/§20). Conservador: só quando antes estava numa ÚNICA instância,
        // agora está noutra, e não está mais na antiga — evita falso positivo por alias.
        if ($hadPrior) {
            $priorUuidByName = [];   // nome => set(server_uuid) onde estava acessível
            foreach ($prior as $r) {
                if ((int) $r['seen_mysql'] === 1 && !empty($r['server_uuid'])) {
                    $priorUuidByName[mb_strtolower((string) $r['name'])][(string) $r['server_uuid']] = true;
                }
            }
            foreach ($dbs as $key => $d) {
                if (empty($d['seen_mysql']) || empty($d['server_uuid']) || !empty($d['is_system'])) {
                    continue;
                }
                $ln  = mb_strtolower((string) $d['name']);
                $now = (string) $d['server_uuid'];
                $was = array_keys($priorUuidByName[$ln] ?? []);
                if (count($was) === 1 && $was[0] !== $now && !isset($priorUuidByName[$ln][$now])) {
                    $al->raise('discovery_db_moved', $tt, $idByKey[$key] ?? null,
                        "Banco mudou de servidor: {$d['name']}",
                        "Antes na instância {$was[0]}, agora em {$now} ({$d['host']}). Confirme se a migração é esperada.");
                    $n++;
                }
            }
        }

        // Colisão/duplicidade de nome (nomes distintos que colapsam ao mesmo alfanumérico).
        $byCollapse = [];
        foreach ($dbs as $key => $d) {
            if (!empty($d['is_system'])) {
                continue;
            }
            $c = (string) preg_replace('/[^a-z0-9]/', '', mb_strtolower((string) $d['name']));
            if ($c !== '') {
                $byCollapse[$c][$d['name']] = true;
            }
        }
        foreach ($byCollapse as $names) {
            if (count($names) < 2) {
                continue;   // 1 nome (mesmo em hosts distintos) = duplicidade, não colisão
            }
            $label = implode(' × ', array_keys($names));
            $al->raise('discovery_collision', $tt, crc32($label) & 0x7fffffff,
                "Colisão de nome: {$label}",
                'Nomes quase idênticos podem fazer uma string de conexão apontar para o banco errado.');
            $n++;
        }

        return $n;
    }

    /** id numérico estável de um host p/ dedup de alerta (host não tem id no catálogo). */
    private function hostAlertId(string $hp): int
    {
        return crc32($hp) & 0x7fffffff;
    }

    // ═══════════════════════════════════════════════════════════════
    // LEITURA (para as rotas GET)
    // ═══════════════════════════════════════════════════════════════

    /** Ultima rodada + big numbers + lista reconciliada (§11). */
    public function getLatest(): array
    {
        $run = $this->local->query(
            'SELECT * FROM DT_Discovery_Run ORDER BY id DESC LIMIT 1'
        )->fetch(PDO::FETCH_ASSOC) ?: null;

        $list = $this->local->query(
            'SELECT id, db_key, name, host, port, server_context, environment, situation, confidence,
                    is_accessible, is_system, is_empty, catalogued, catalog_database_id, table_count,
                    size_bytes, application, seen_mysql, seen_config, seen_known, seen_catalog,
                    seen_code, seen_cron, seen_container, seen_log, seen_backup,
                    is_present, disappeared_at, server_uuid, reason,
                    user_status, user_note, user_updated_by, user_updated_at, first_seen_at, last_seen_at
               FROM DT_Discovered_Database
              ORDER BY (situation = "sistema") ASC, catalogued ASC,
                       FIELD(situation,"encontrado_acessivel","sem_permissao","referenciado_nao_encontrado","vazio","sistema"),
                       size_bytes DESC, name ASC'
        )->fetchAll(PDO::FETCH_ASSOC);

        $shaped = array_map([$this, 'shapeDb'], $list);
        $this->flagCollisions($shaped);

        return [
            'run'      => $run ? $this->shapeRun($run) : null,
            'big'      => $this->bigNumbers(),
            'databases' => $shaped,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // RELATORIO FINAL (§31) + EXPORT
    // ═══════════════════════════════════════════════════════════════

    /**
     * Relatorio final da descoberta (§31): Resumo + Pendencias prioritarias +
     * Recomendacoes. Reusa getLatest() como fonte unica (big numbers + colisoes ja
     * calculados) e agrega em PHP. So-leitura.
     */
    public function getReport(): array
    {
        $data  = $this->getLatest();
        $dbs   = $data['databases'];
        $big   = $data['big'];
        $run   = $data['run'];
        $hosts = $run['stats']['hosts'] ?? [];

        $uuids = [];
        $legados = 0; $falsos = 0; $conflitos = 0; $semApp = 0;
        $prodNaoMonitorada = []; $refQuebradas = []; $semPermissao = []; $semAplicacao = []; $duplicidades = [];
        foreach ($dbs as $d) {
            if (!empty($d['server_uuid'])) { $uuids[$d['server_uuid']] = true; }
            if (($d['user_status'] ?? null) === 'legado') { $legados++; }
            if (($d['user_status'] ?? null) === 'falso_positivo') { $falsos++; }
            if (!empty($d['collision_with'])) { $conflitos++; }
            // Ausentes (is_present=0) nao entram nas pendencias ACIONAVEIS — sao histórico.
            if (empty($d['is_present'])) { continue; }
            $triado = !empty($d['user_status']);
            $item = ['name' => $d['name'], 'db_key' => $d['db_key'], 'host' => $d['host'],
                     'situation' => $d['situation'], 'server_context' => $d['server_context']];
            if ($d['situation'] === 'encontrado_acessivel' && !$d['catalogued'] && !$triado) {
                $prodNaoMonitorada[] = $item;
            }
            if ($d['situation'] === 'referenciado_nao_encontrado' && !$triado) {
                $refQuebradas[] = $item + ['reason' => $d['reason']];
            }
            if ($d['situation'] === 'sem_permissao' && !$triado) {
                $semPermissao[] = $item;
            }
            if (!empty($d['seen_mysql']) && empty($d['is_system']) && empty($d['application'])) {
                $semApp++;
                $semAplicacao[] = $item;
            }
            if (!empty($d['collision_with'])) {
                $duplicidades[] = $item + ['collision_with' => $d['collision_with']];
            }
        }

        // Servidores sem acesso / visao parcial (§31: credenciais necessarias).
        $servidoresSemAcesso = [];
        foreach ($hosts as $h) {
            if (!in_array($h['status'] ?? '', ['total', 'parcial'], true)) {
                $servidoresSemAcesso[] = ['host' => $h['host'], 'status' => $h['status'], 'motivo' => 'host nao respondeu / credencial'];
            } elseif (($h['status'] ?? '') === 'parcial') {
                $servidoresSemAcesso[] = ['host' => $h['host'], 'status' => 'parcial', 'motivo' => 'credencial enxerga so parte (§35)'];
            }
        }

        return [
            'run' => $run,
            'resumo' => [
                'servidores'       => count($hosts),
                'instancias'       => count($uuids),
                'encontrados'      => (int) $big['acessiveis'],
                'catalogados'      => (int) $big['catalogados'],
                'nao_catalogados'  => (int) $big['nao_catalogados'],
                'referenciados'    => (int) $big['referenciados'],
                'sem_permissao'    => (int) ($big['sem_permissao'] ?? 0),
                'vazios'           => (int) $big['vazios'],
                'sistema'          => (int) $big['sistema'],
                'desaparecidos'    => (int) ($big['desaparecidos'] ?? 0),
                'legados'          => $legados,
                'falsos_positivos' => $falsos,
                'sem_aplicacao'    => $semApp,
                'conflitos'        => $conflitos,
            ],
            'pendencias' => [
                'servidores_sem_acesso'  => $servidoresSemAcesso,
                'producao_nao_monitorada' => array_slice($prodNaoMonitorada, 0, 100),
                'referencias_quebradas'  => array_slice($refQuebradas, 0, 100),
                'sem_permissao'          => array_slice($semPermissao, 0, 100),
                'sem_aplicacao'          => array_slice($semAplicacao, 0, 100),
                'duplicidades'           => array_slice($duplicidades, 0, 100),
            ],
            'recomendacoes' => [
                'cadastrar_conexao'   => count($prodNaoMonitorada),   // §13
                'ampliar_permissao'   => count($servidoresSemAcesso), // §35
                'revisar_referencia'  => count($refQuebradas),        // legado/host correto
                'resolver_colisao'    => $conflitos,
                'associar_aplicacao'  => $semApp,
            ],
        ];
    }

    /** Exporta a lista reconciliada como CSV (§31: entregavel para o DBA). */
    public function exportCsv(): string
    {
        $dbs = $this->getLatest()['databases'];
        $cols = ['name', 'situation', 'server_context', 'host', 'port', 'server_uuid', 'table_count',
                 'size_bytes', 'catalogued', 'is_present', 'application', 'confidence', 'user_status', 'reason'];
        $origens = ['seen_mysql', 'seen_config', 'seen_code', 'seen_cron', 'seen_log', 'seen_backup', 'seen_known', 'seen_catalog'];
        $esc = static function ($v): string {
            $s = (string) ($v ?? '');
            return '"' . str_replace('"', '""', $s) . '"';
        };
        $out = implode(',', array_merge($cols, ['origens'])) . "\r\n";
        foreach ($dbs as $d) {
            $line = [];
            foreach ($cols as $c) {
                $v = $d[$c] ?? null;
                if (is_bool($v)) { $v = $v ? '1' : '0'; }
                $line[] = $esc($v);
            }
            $orig = [];
            foreach ($origens as $o) {
                if (!empty($d[$o])) { $orig[] = str_replace('seen_', '', $o); }
            }
            $line[] = $esc(implode('|', $orig));
            $out .= implode(',', $line) . "\r\n";
        }
        return $out;
    }

    /**
     * Marca COLISAO de nome: bancos DIFERENTES cujo nome colapsa ao mesmo
     * alfanumerico (ex.: DSHOWDASH x DSHOW_DASH). Nao e duplicidade (nomes iguais
     * em hosts distintos) — e risco de a string de conexao apontar para o errado.
     */
    private function flagCollisions(array &$rows): void
    {
        $byCollapse = [];
        foreach ($rows as $i => $d) {
            if (!empty($d['is_system'])) {
                continue;
            }
            $c = (string) preg_replace('/[^a-z0-9]/', '', mb_strtolower((string) $d['name']));
            if ($c === '') {
                continue;
            }
            $byCollapse[$c][] = $i;
        }
        foreach ($byCollapse as $idxs) {
            if (count($idxs) < 2) {
                continue;
            }
            $nomes = [];
            foreach ($idxs as $i) {
                $nomes[$rows[$i]['name']] = true;
            }
            if (count($nomes) < 2) {
                continue; // mesmo nome exato em hosts distintos = duplicidade, tratada a parte
            }
            foreach ($idxs as $i) {
                $outros = array_values(array_filter(array_keys($nomes), static fn($n) => $n !== $rows[$i]['name']));
                $rows[$i]['collision_with'] = implode(', ', $outros);
            }
        }
    }

    /** Evidencias de um banco (drawer §12). */
    public function evidencesFor(string $dbKey): array
    {
        $st = $this->local->prepare(
            'SELECT source_type, host, port, username_masked, detail, confidence, created_at
               FROM DT_Discovery_Evidence WHERE db_key = :k
              ORDER BY FIELD(source_type,"mysql","catalog","config","code","cron","container","backup","log","known_list"), id'
        );
        $st->execute([':k' => $dbKey]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Classificação MANUAL de um banco descoberto (§11.4). Persiste em colunas
     * `user_*` que o upsert de persist() NUNCA sobrescreve — sobrevive às rodadas.
     * $status vazio/inválido = limpa a classificação. Retorna a linha atualizada.
     */
    public function classifyManual(int $id, ?string $status, ?string $note, string $by): array
    {
        $valid = ['legado', 'falso_positivo', 'ignorado'];
        $st = ($status !== null && in_array($status, $valid, true)) ? $status : null;
        $nt = ($note !== null && trim($note) !== '') ? mb_substr(trim($note), 0, 500) : null;

        $up = $this->local->prepare(
            'UPDATE DT_Discovered_Database
                SET user_status = :s, user_note = :n, user_updated_by = :by, user_updated_at = NOW()
              WHERE id = :id'
        );
        $up->execute([':s' => $st, ':n' => $nt, ':by' => mb_substr($by, 0, 100), ':id' => $id]);

        $sel = $this->local->prepare(
            'SELECT id, db_key, name, host, port, server_context, environment, situation, confidence,
                    is_accessible, is_system, is_empty, catalogued, catalog_database_id, table_count,
                    size_bytes, application, seen_mysql, seen_config, seen_known, seen_catalog,
                    seen_code, seen_cron, seen_container, seen_log, seen_backup,
                    is_present, disappeared_at, server_uuid, reason,
                    user_status, user_note, user_updated_by, user_updated_at, first_seen_at, last_seen_at
               FROM DT_Discovered_Database WHERE id = :id'
        );
        $sel->execute([':id' => $id]);
        $row = $sel->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->shapeDb($row) : ['id' => $id, 'user_status' => $st];
    }

    private function bigNumbers(): array
    {
        // Contadores "acionáveis" (não catalogados/referenciados) EXCLUEM o que a
        // equipe já triou manualmente (user_status set) — a lista de pendências encolhe
        // conforme se marca legado/falso-positivo/ignorado.
        $r = $this->local->query(
            'SELECT
               COUNT(*)                                                                        AS total,
               SUM(situation="encontrado_acessivel")                                           AS acessiveis,
               SUM(situation="encontrado_acessivel" AND catalogued=1)                          AS catalogados,
               SUM(situation="encontrado_acessivel" AND catalogued=0 AND user_status IS NULL)  AS nao_catalogados,
               SUM(situation="referenciado_nao_encontrado" AND user_status IS NULL AND is_present=1) AS referenciados,
               SUM(situation="sem_permissao" AND user_status IS NULL AND is_present=1)          AS sem_permissao,
               SUM(situation="vazio" AND user_status IS NULL AND is_present=1)                  AS vazios,
               SUM(situation="sistema")                                                        AS sistema,
               SUM(is_present=0 AND user_status IS NULL)                                        AS desaparecidos,
               SUM(user_status IS NOT NULL)                                                    AS triados
             FROM DT_Discovered_Database'
        )->fetch(PDO::FETCH_ASSOC) ?: [];
        foreach ($r as $k => $v) {
            $r[$k] = (int) $v;
        }
        return $r;
    }

    private function openRun(string $by): int
    {
        $st = $this->local->prepare(
            'INSERT INTO DT_Discovery_Run (status, triggered_by) VALUES ("running", :b)'
        );
        $st->execute([':b' => mb_substr($by, 0, 100)]);
        return (int) $this->local->lastInsertId();
    }

    private function closeRun(int $id, string $status, array $stats, ?string $error): void
    {
        $b = $stats['buckets'] ?? [];
        $found = (int) ($b['encontrado_acessivel'] ?? 0);
        $cat   = (int) ($stats['catalogados'] ?? 0);
        $pend  = (int) (($b['referenciado_nao_encontrado'] ?? 0) + ($b['sem_permissao'] ?? 0) + ($stats['nao_catalogados'] ?? 0));
        $st = $this->local->prepare(
            'UPDATE DT_Discovery_Run
                SET status=:s, hosts_probed=:hp, hosts_failed=:hf, databases_found=:df,
                    databases_catalogued=:dc, databases_pending=:dp, stats_json=:js, error=:err, finished_at=NOW()
              WHERE id=:id'
        );
        $st->execute([
            ':s' => $status,
            ':hp' => (int) (($stats['hosts_ok'] ?? 0) + ($stats['hosts_fail'] ?? 0)),
            ':hf' => (int) ($stats['hosts_fail'] ?? 0),
            ':df' => $found, ':dc' => $cat, ':dp' => $pend,
            ':js' => json_encode($stats, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':err' => $error, ':id' => $id,
        ]);
    }

    private function getRun(int $id): array
    {
        $r = $this->local->prepare('SELECT * FROM DT_Discovery_Run WHERE id=:id');
        $r->execute([':id' => $id]);
        $row = $r->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->shapeRun($row) : ['id' => $id, 'status' => 'unknown'];
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    /** Cria (se novo) o registro acumulador do db_key. */
    private function touch(array &$dbs, array &$nameIndex, string $key, string $name, ?string $host, ?int $port): void
    {
        if (!isset($dbs[$key])) {
            $dbs[$key] = [
                'name' => $name, 'host' => $host, 'port' => $port,
                'seen_mysql' => false, 'seen_config' => false, 'seen_known' => false, 'seen_catalog' => false,
                'seen_code' => false, 'seen_cron' => false, 'seen_container' => false, 'seen_log' => false, 'seen_backup' => false,
                'is_system' => false, 'is_empty' => false, 'is_accessible' => false, 'catalogued' => false,
                'catalog_database_id' => null, 'table_count' => null, 'size_bytes' => null, 'last_backup' => null,
                'server_uuid' => null,
                'application' => null, 'environment' => null, 'situation' => null, 'confidence' => null, 'reason' => null,
            ];
            $low = strtolower($name);
            $nameIndex[$low][] = $key;
        }
    }

    private function dbKey(string $host, int $port, string $name): string
    {
        return $this->hostPort($host, $port) . '/' . $name;
    }

    private function hostPort(string $host, int $port): string
    {
        $h = strtolower(trim($host));
        if ($h === 'localhost') {
            $h = '127.0.0.1';
        }
        return $h . ':' . ($port ?: 3306);
    }

    private function hostLabel(string $host, int $port): string
    {
        return $host . ':' . ($port ?: 3306);
    }

    private function serverContext(?string $host): ?string
    {
        if ($host === null) {
            return null;
        }
        $h = strtolower($host);
        if ($h === 'localhost' || $h === '127.0.0.1') {
            return gethostname() ?: 'servidor-local';
        }
        return $host;
    }

    /** Usuario mascarado: nunca retorna o valor completo (§24). */
    private function maskUser(?string $u): ?string
    {
        if ($u === null || $u === '') {
            return null;
        }
        $u = trim($u);
        if (mb_strlen($u) <= 2) {
            return '***';
        }
        return mb_substr($u, 0, 2) . str_repeat('*', min(6, mb_strlen($u) - 2));
    }

    private function relPath(string $path, string $root): string
    {
        return ltrim(str_replace($root, '', $path), '/');
    }

    private function shapeRun(array $r): array
    {
        return [
            'id' => (int) $r['id'], 'status' => $r['status'], 'triggered_by' => $r['triggered_by'],
            'hosts_probed' => (int) $r['hosts_probed'], 'hosts_failed' => (int) $r['hosts_failed'],
            'databases_found' => (int) $r['databases_found'], 'databases_catalogued' => (int) $r['databases_catalogued'],
            'databases_pending' => (int) $r['databases_pending'],
            'stats' => $r['stats_json'] ? json_decode($r['stats_json'], true) : null,
            'error' => $r['error'], 'started_at' => $r['started_at'], 'finished_at' => $r['finished_at'],
        ];
    }

    private function shapeDb(array $r): array
    {
        return [
            'id' => (int) $r['id'], 'db_key' => $r['db_key'], 'name' => $r['name'],
            'host' => $r['host'], 'port' => $r['port'] !== null ? (int) $r['port'] : null,
            'server_context' => $r['server_context'], 'environment' => $r['environment'],
            'situation' => $r['situation'], 'confidence' => $r['confidence'],
            'is_accessible' => (bool) $r['is_accessible'], 'is_system' => (bool) $r['is_system'],
            'is_empty' => (bool) $r['is_empty'], 'catalogued' => (bool) $r['catalogued'],
            'catalog_database_id' => $r['catalog_database_id'] !== null ? (int) $r['catalog_database_id'] : null,
            'table_count' => $r['table_count'] !== null ? (int) $r['table_count'] : null,
            'size_bytes' => $r['size_bytes'] !== null ? (int) $r['size_bytes'] : null,
            'application' => $r['application'],
            'seen_mysql' => (bool) $r['seen_mysql'], 'seen_config' => (bool) $r['seen_config'],
            'seen_known' => (bool) $r['seen_known'], 'seen_catalog' => (bool) $r['seen_catalog'],
            'seen_code' => (bool) ($r['seen_code'] ?? 0), 'seen_cron' => (bool) ($r['seen_cron'] ?? 0),
            'seen_container' => (bool) ($r['seen_container'] ?? 0), 'seen_log' => (bool) ($r['seen_log'] ?? 0),
            'seen_backup' => (bool) ($r['seen_backup'] ?? 0),
            'is_present' => (bool) ($r['is_present'] ?? 1), 'disappeared_at' => $r['disappeared_at'] ?? null,
            'server_uuid' => $r['server_uuid'] ?? null,
            'reason' => $r['reason'],
            'user_status' => $r['user_status'] ?? null, 'user_note' => $r['user_note'] ?? null,
            'user_updated_by' => $r['user_updated_by'] ?? null, 'user_updated_at' => $r['user_updated_at'] ?? null,
            'collision_with' => null,
            'first_seen_at' => $r['first_seen_at'], 'last_seen_at' => $r['last_seen_at'],
        ];
    }
}
