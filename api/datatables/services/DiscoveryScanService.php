<?php
// DataTables / DiscoveryScanService - camadas 5-9 da auditoria de descoberta
// @version 1.0.0
// @created 2026-07-21
// @app DataTables
//
// Complementa DiscoveryService (camadas MySQL/Config/Reconciliacao) com as camadas
// de FILESYSTEM/HOST do brief:
//   Camada 5 (§7.5) Codigo-fonte  - nomes de banco em PDO/mysqli/python/USE/CREATE DATABASE/DSN.
//   Camada 6 (§7.6) Crons         - /etc/crontab + /etc/cron.d + cron.* (mysqldump/mysql/nomes).
//   Camada 7 (§7.7) Containers    - docker/compose (indisponivel neste host: sem docker/sock).
//   Camada 8 (§7.8) Logs          - Unknown database / Access denied nos logs LEGIVEIS.
//   Camada 9 (§7.9) Backups       - .sql/.dump/.bak + /backup (nome + cabecalho mysqldump).
//
// FILOSOFIA (§35): cada camada reporta COBERTURA (completa|parcial|indisponivel) com o
// motivo. Rodando como www-data, muitas fontes de sistema sao negadas (crontab do root,
// logs do mysql/php-fpm, docker.sock) - isso e REPORTADO, nunca escondido.
//
// SEGURANCA (§24): NENHUMA senha e capturada. So caminho/linha/nome-do-banco. Usuario
// SEMPRE mascarado. Somente LEITURA de arquivos; nenhuma execucao de comando.
declare(strict_types=1);

final class DtDiscoveryScanService
{
    /** Extensoes de codigo-fonte relevantes (§7.5). Frontend TS/JS nao conecta a banco → fora. */
    private const CODE_EXT = ['php', 'py', 'sh', 'sql', 'inc'];

    /** Diretorios NUNCA descidos (ruido/binario/pesado). */
    private const SKIP_DIRS = ['node_modules', 'vendor', 'dist', '.git', '.cache', 'cache', 'backups', 'tmp'];

    private const MAX_FILE_BYTES   = 524288;   // 512 KB: pula arquivos maiores
    private const MAX_CODE_FILES   = 4000;
    private const MAX_BACKUP_FILES = 3000;      // arquivos de dump CASADOS
    private const MAX_BACKUP_VISIT = 40000;     // entradas percorridas (limita travessia)
    private const MAX_LOG_LINES    = 6000;      // por arquivo de log (cauda)
    private const PEEK_BYTES       = 8192;      // cabecalho de dump lido
    private const TIME_BUDGET_S    = 18.0;      // orcamento total de varredura

    /** Extensoes que sao DE FATO dumps de banco (nao .bak/.old, que aqui sao backup de FONTE). */
    private const DUMP_RE = '/\.(sql|sql\.gz|sql\.bz2|dump|mysqldump)$/i';

    private string $root;
    /** @var string[] nomes conhecidos "especificos" o suficiente p/ busca por mencao */
    private array $mentionNames;
    private float $deadline;
    private int $bkVisited = 0;

    /** @param string[] $known Lista conhecida (§32); filtrada p/ nomes especificos. */
    public function __construct(string $root, array $known)
    {
        $this->root         = rtrim($root, '/');
        $this->mentionNames = array_values(array_filter($known, [$this, 'isSpecific']));
        $this->deadline     = microtime(true) + self::TIME_BUDGET_S;
    }

    /**
     * Executa as 5 camadas. Retorna:
     *   findings: [{name, host?, port?, source_type, detail, confidence, application?}]
     *             (ja AGREGADO por nome+fonte — uma evidencia por banco/camada).
     *   coverage: [{layer, rotulo, status, note, scanned, hits}]
     */
    public function scan(): array
    {
        $findings = [];
        $coverage = [];
        foreach (['scanCode', 'scanCrons', 'scanContainers', 'scanLogs', 'scanBackups'] as $m) {
            [$f, $c] = $this->$m();
            foreach ($f as $one) {
                $findings[] = $one;
            }
            $coverage[] = $c;
        }
        return ['findings' => $findings, 'coverage' => $coverage];
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMADA 5 — CODIGO-FONTE (§7.5)
    // ═══════════════════════════════════════════════════════════════

    private function scanCode(): array
    {
        // Escopo = codigo servidor (conecta a banco). Frontend (public/components) NAO
        // conecta a MySQL — vai pela API — por isso e excluido (documentado na cobertura).
        $dirs = [];
        foreach (['api', 'scripts', 'config'] as $d) {
            if (is_dir($this->root . '/' . $d)) {
                $dirs[] = $this->root . '/' . $d;
            }
        }

        $agg     = [];   // name => ['confidence'=>, 'hits'=>[ 'rel:line' ], 'why'=>set]
        $scanned = 0;
        foreach ($dirs as $dir) {
            $this->walkCode($dir, 0, $agg, $scanned);
        }
        // Arquivos .php/.sh no topo do webroot (fora de subdirs pesados).
        foreach (glob($this->root . '/*.{php,sh,sql}', GLOB_BRACE) ?: [] as $top) {
            if ($scanned >= self::MAX_CODE_FILES || microtime(true) > $this->deadline) {
                break;
            }
            $this->scanCodeFile($top, $agg, $scanned);
        }

        $findings = $this->aggToFindings($agg, 'code', 'referencia(s) em codigo-fonte');
        $note = 'codigo servidor (api, scripts, config). Frontend nao varrido (nao conecta a banco).';
        if ($scanned >= self::MAX_CODE_FILES) {
            $note .= ' LIMITE de ' . self::MAX_CODE_FILES . ' arquivos atingido.';
        }
        return [$findings, $this->cov('codigo', 'Codigo-fonte', 'completa', $note, $scanned, count($findings))];
    }

    /** Percorre um diretorio de codigo aplicando skip-list e caps. */
    private function walkCode(string $dir, int $depth, array &$agg, int &$scanned): void
    {
        if ($depth > 12 || $scanned >= self::MAX_CODE_FILES || microtime(true) > $this->deadline) {
            return;
        }
        $entries = @scandir($dir);
        if ($entries === false) {
            return;
        }
        foreach ($entries as $e) {
            if ($e === '.' || $e === '..') {
                continue;
            }
            $path = $dir . '/' . $e;
            if (is_dir($path)) {
                if (in_array(strtolower($e), self::SKIP_DIRS, true) || is_link($path)) {
                    continue;
                }
                $this->walkCode($path, $depth + 1, $agg, $scanned);
                if ($scanned >= self::MAX_CODE_FILES || microtime(true) > $this->deadline) {
                    return;
                }
                continue;
            }
            $ext = strtolower((string) pathinfo($e, PATHINFO_EXTENSION));
            if (!in_array($ext, self::CODE_EXT, true)) {
                continue;
            }
            $this->scanCodeFile($path, $agg, $scanned);
        }
    }

    private function scanCodeFile(string $path, array &$agg, int &$scanned): void
    {
        if (!is_file($path) || !is_readable($path)) {
            return;
        }
        // Nao auditar o PROPRIO auditor: DiscoveryService.php tem a lista KNOWN literal e
        // DiscoveryScanService.php tem os padroes — senao todo nome conhecido casaria aqui.
        if (strpos($path, '/datatables/services/Discovery') !== false) {
            return;
        }
        $sz = @filesize($path);
        if ($sz === false || $sz > self::MAX_FILE_BYTES) {
            return;
        }
        $scanned++;
        $rel   = $this->rel($path);
        $lines = @file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return;
        }
        foreach ($lines as $i => $ln) {
            foreach ($this->harvestNames($ln) as $hit) {
                $loc = $rel . ':' . ($i + 1);
                $this->addHit($agg, $hit, $loc);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMADA 6 — CRONS E ROTINAS (§7.6)
    // ═══════════════════════════════════════════════════════════════

    private function scanCrons(): array
    {
        $files = [];
        foreach (['/etc/crontab'] as $f) {
            if (is_file($f) && is_readable($f)) {
                $files[] = $f;
            }
        }
        foreach (['/etc/cron.d', '/etc/cron.hourly', '/etc/cron.daily', '/etc/cron.weekly', '/etc/cron.monthly'] as $d) {
            foreach (@scandir($d) ?: [] as $e) {
                if ($e === '.' || $e === '..') {
                    continue;
                }
                $p = $d . '/' . $e;
                if (is_file($p) && is_readable($p) && (@filesize($p) ?: 0) <= self::MAX_FILE_BYTES) {
                    $files[] = $p;
                }
            }
        }

        $agg = [];
        foreach ($files as $p) {
            $rel   = $p; // caminhos de sistema absolutos (fora do webroot)
            $lines = @file($p, FILE_IGNORE_NEW_LINES) ?: [];
            foreach ($lines as $i => $ln) {
                $t = trim($ln);
                if ($t === '' || $t[0] === '#') {
                    continue;
                }
                foreach ($this->harvestNames($ln) as $hit) {
                    $this->addHit($agg, $hit, basename($p) . ':' . ($i + 1));
                }
            }
        }

        // Crontabs de usuario (root incluso) exigem privilegio → tipicamente NEGADO ao www-data.
        $userCronReadable = is_readable('/var/spool/cron/crontabs') || is_readable('/var/spool/cron');
        $note = count($files) . ' arquivo(s) de cron do sistema lido(s) (/etc/crontab, /etc/cron.d, cron.*).';
        $status = 'parcial';
        if (!$userCronReadable) {
            $note .= ' Crontab de usuario/root NAO legivel (privilegio); timers systemd nao inspecionados.';
        } else {
            $status = 'completa';
        }

        $findings = $this->aggToFindings($agg, 'cron', 'referencia(s) em cron/rotina');
        return [$findings, $this->cov('crons', 'Crons e rotinas', $status, $note, count($files), count($findings))];
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMADA 7 — CONTAINERS (§7.7)
    // ═══════════════════════════════════════════════════════════════

    private function scanContainers(): array
    {
        // Sem execucao de comando (§seguranca). Verifica presenca de docker/sock/compose.
        $hasDockerSock = @file_exists('/var/run/docker.sock');
        $dockerBin     = @is_file('/usr/bin/docker') || @is_file('/usr/local/bin/docker');
        $composes = [];
        foreach (['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'] as $name) {
            foreach ([$this->root, $this->root . '/api', dirname($this->root)] as $base) {
                $p = $base . '/' . $name;
                if (is_file($p) && is_readable($p)) {
                    $composes[] = $p;
                }
            }
        }

        $agg = [];
        foreach ($composes as $p) {
            $lines = @file($p, FILE_IGNORE_NEW_LINES) ?: [];
            foreach ($lines as $i => $ln) {
                // MYSQL_DATABASE / MARIADB_DATABASE em Compose = banco declarado.
                if (preg_match('/(?:MYSQL|MARIADB)_DATABASE\s*[:=]\s*["\']?([A-Za-z0-9_]+)/i', $ln, $m)) {
                    $this->addHit($agg, ['name' => $m[1], 'confidence' => 'alta', 'why' => 'MYSQL_DATABASE em Compose'], $this->rel($p) . ':' . ($i + 1));
                }
                foreach ($this->harvestNames($ln) as $hit) {
                    $this->addHit($agg, $hit, $this->rel($p) . ':' . ($i + 1));
                }
            }
        }

        $findings = $this->aggToFindings($agg, 'container', 'declarado em Compose');
        if (!$dockerBin && !$hasDockerSock && !$composes) {
            $note = 'Docker NAO instalado neste host (sem binario, sem /var/run/docker.sock) e nenhum arquivo Compose no webroot. '
                  . 'O container MariaDB remoto (displaysolutions) e inferido pelas camadas Config/MySQL, nao inspecionavel daqui.';
            return [$findings, $this->cov('containers', 'Containers', 'indisponivel', $note, 0, 0)];
        }
        $note = ($composes ? count($composes) . ' arquivo(s) Compose lido(s). ' : '')
              . (!$hasDockerSock ? 'docker.sock nao legivel (containers em execucao nao inspecionados).' : 'docker.sock presente.');
        return [$findings, $this->cov('containers', 'Containers', 'parcial', $note, count($composes), count($findings))];
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMADA 8 — LOGS (§7.8)
    // ═══════════════════════════════════════════════════════════════

    private function scanLogs(): array
    {
        // Logs candidatos: nginx (legivel), app-logs no webroot. mysql/php-fpm negados ao www-data.
        $targets = [];
        foreach (['/var/log/nginx/error.log', '/var/log/nginx/error.log.1'] as $p) {
            if (is_file($p) && is_readable($p)) {
                $targets[] = $p;
            }
        }
        foreach (['storage/logs', 'logs', 'api/logs', 'var/log'] as $d) {
            $dir = $this->root . '/' . $d;
            foreach (@glob($dir . '/*.log') ?: [] as $p) {
                if (is_readable($p)) {
                    $targets[] = $p;
                }
            }
        }

        $agg       = [];
        $accessDen = 0;
        $connFail  = 0;
        foreach ($targets as $p) {
            foreach ($this->tailLines($p, self::MAX_LOG_LINES) as $ln) {
                if (preg_match('/Unknown database\s+["\']?([A-Za-z0-9_]+)/i', $ln, $m)) {
                    $this->addHit($agg, ['name' => $m[1], 'confidence' => 'alta', 'why' => 'log: Unknown database'], basename($p));
                }
                if (preg_match('/CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\']?([A-Za-z0-9_]+)/i', $ln, $m)) {
                    $this->addHit($agg, ['name' => $m[1], 'confidence' => 'media', 'why' => 'log: CREATE DATABASE'], basename($p));
                }
                if (stripos($ln, 'Access denied for user') !== false) {
                    $accessDen++;
                }
                if (preg_match('/Can\'t connect to (?:MySQL|local MySQL) server|Unknown MySQL server host/i', $ln)) {
                    $connFail++;
                }
                // nome conhecido citado em log tambem conta (baixa)
                foreach ($this->harvestNames($ln) as $hit) {
                    if (($hit['confidence'] ?? '') !== 'alta') {
                        $this->addHit($agg, $hit, basename($p));
                    }
                }
            }
        }

        $findings = $this->aggToFindings($agg, 'log', 'referencia(s) em log');
        $extra = [];
        if ($accessDen > 0) {
            $extra[] = $accessDen . ' linha(s) "Access denied"';
        }
        if ($connFail > 0) {
            $extra[] = $connFail . ' falha(s) de conexao';
        }
        $note = count($targets) . ' log(s) legivel(is) (nginx/app). Logs do MySQL e php-fpm NAO legiveis ao www-data.';
        if ($extra) {
            $note .= ' Sinais: ' . implode(', ', $extra) . '.';
        }
        return [$findings, $this->cov('logs', 'Logs', 'parcial', $note, count($targets), count($findings))];
    }

    // ═══════════════════════════════════════════════════════════════
    // CAMADA 9 — BACKUPS (§7.9)
    // ═══════════════════════════════════════════════════════════════

    private function scanBackups(): array
    {
        $roots = [];
        foreach (['/backup', $this->root] as $r) {
            if (is_dir($r) && is_readable($r)) {
                $roots[] = $r;
            }
        }

        $agg     = [];   // name => hits + extras (mtime)
        $scanned = 0;
        foreach ($roots as $r) {
            $this->walkBackups($r, 0, $agg, $scanned);
        }

        // findings com detalhe enriquecido (ultimo backup)
        $findings = [];
        foreach ($agg as $name => $a) {
            $locs = array_slice($a['hits'], 0, 3);
            $more = count($a['hits']) - count($locs);
            $detail = count($a['hits']) . ' arquivo(s) de backup: ' . implode(', ', $locs) . ($more > 0 ? " (+$more)" : '');
            if (!empty($a['last'])) {
                $detail .= ' — ultimo: ' . date('Y-m-d', $a['last']);
            }
            $findings[] = [
                'name' => $name, 'host' => null, 'port' => null, 'source_type' => 'backup',
                'detail' => mb_substr($detail, 0, 480),
                'confidence' => $a['confidence'] ?? 'media',
                'application' => null,
                'last_backup' => !empty($a['last']) ? date('Y-m-d', $a['last']) : null,
            ];
        }

        $note = count($roots) . ' raiz(es) de backup lida(s) (/backup + webroot). Storage remoto/off-site nao verificado.';
        if ($scanned >= self::MAX_BACKUP_FILES) {
            $note .= ' LIMITE de ' . self::MAX_BACKUP_FILES . ' arquivos atingido.';
        }
        return [$findings, $this->cov('backups', 'Backups', 'completa', $note, $scanned, count($findings))];
    }

    private function walkBackups(string $dir, int $depth, array &$agg, int &$scanned): void
    {
        if ($depth > 8 || $scanned >= self::MAX_BACKUP_FILES
            || $this->bkVisited >= self::MAX_BACKUP_VISIT || microtime(true) > $this->deadline) {
            return;
        }
        $entries = @scandir($dir);
        if ($entries === false) {
            return;
        }
        foreach ($entries as $e) {
            if ($e === '.' || $e === '..') {
                continue;
            }
            $this->bkVisited++;
            $path = $dir . '/' . $e;
            if (is_dir($path)) {
                // Fora de dumps: dirs de fonte/dependencia nao guardam backup de BANCO.
                if (in_array(strtolower($e), ['node_modules', 'vendor', '.git', '.cache', 'components', 'koala'], true) || is_link($path)) {
                    continue;
                }
                $this->walkBackups($path, $depth + 1, $agg, $scanned);
                if ($scanned >= self::MAX_BACKUP_FILES || $this->bkVisited >= self::MAX_BACKUP_VISIT
                    || microtime(true) > $this->deadline) {
                    return;
                }
                continue;
            }
            if (!preg_match(self::DUMP_RE, $e)) {
                continue;
            }
            $scanned++;
            $this->harvestBackupFile($path, $e, $agg);
        }
    }

    private function harvestBackupFile(string $path, string $fname, array &$agg): void
    {
        $mtime = @filemtime($path) ?: null;
        $rel   = $this->rel($path);

        // 1) Nome do arquivo → candidato APENAS p/ dumps completos (compactado/.dump).
        //    Um .sql puro costuma ser DDL de TABELA (traffic_schema.sql, nav_audit_ddl.sql):
        //    o nome do arquivo NAO e o do banco → confia so no cabecalho (passo 2).
        if (preg_match('/\.(sql\.gz|sql\.bz2|dump|mysqldump)$/i', $fname)) {
            // Corta data/timestamp/versao embutidos (DSHOW_PROD_20260331_000006 → DSHOW_PROD).
            $base = preg_replace('/\.(sql\.gz|sql\.bz2|dump|mysqldump)$/i', '', $fname);
            $base = preg_replace('/[._-]\d{4,}.*$/', '', (string) $base);   // 1o grupo de 4+ digitos (data)
            $base = preg_replace('/[._-]v?\d+$/i', '', (string) $base);      // versao final
            $cand = trim((string) $base, '_-.');
            // Nome plausivel = so alfanum/underscore (nomes com hifen, ex. app-permissions-*, sao descartados).
            if ($cand !== '' && $this->plausibleName($cand)) {
                $conf = (stripos($rel, 'databases') !== false || $this->isSpecific($cand)) ? 'media' : 'baixa';
                $this->addBackupHit($agg, $cand, $rel, $mtime, $conf);
            }
        }

        // 2) Cabecalho de dump nao comprimido (mysqldump grava Host/Database + USE/CREATE).
        if (preg_match('/\.(sql|dump|mysqldump)$/i', $fname) && (@filesize($path) ?: 0) > 0) {
            $head = @file_get_contents($path, false, null, 0, self::PEEK_BYTES);
            if ($head !== false && $head !== '') {
                if (preg_match_all('/(?:^--\s*Host:.*?Database:\s*|USE\s+`?|CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?)([A-Za-z0-9_]+)/im', $head, $mm)) {
                    foreach (array_unique($mm[1]) as $nm) {
                        if ($this->plausibleName($nm)) {
                            $this->addBackupHit($agg, $nm, $rel, $mtime, 'alta');
                        }
                    }
                }
            }
        }
    }

    private function addBackupHit(array &$agg, string $name, string $loc, ?int $mtime, string $conf): void
    {
        if (!isset($agg[$name])) {
            $agg[$name] = ['hits' => [], 'last' => $mtime, 'confidence' => $conf];
        }
        if (count($agg[$name]['hits']) < 60) {
            $agg[$name]['hits'][] = $loc;
        }
        if ($mtime !== null && ($agg[$name]['last'] === null || $mtime > $agg[$name]['last'])) {
            $agg[$name]['last'] = $mtime;
        }
        if ($conf === 'alta') {
            $agg[$name]['confidence'] = 'alta';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXTRACAO DE NOMES DE BANCO (compartilhada)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Extrai candidatos a nome de banco de UMA linha de texto.
     * NUNCA captura senha: os padroes param no nome do banco.
     * @return array<int,array{name:string,confidence:string,why:string}>
     */
    private function harvestNames(string $line): array
    {
        if (mb_strlen($line) > 4000) {
            $line = mb_substr($line, 0, 4000);
        }
        $out  = [];
        $seen = [];
        $push = function (string $name, string $conf, string $why) use (&$out, &$seen): void {
            $name = trim($name);
            if (!$this->plausibleName($name)) {
                return;
            }
            $k = strtolower($name);
            if (isset($seen[$k])) {
                return;
            }
            $seen[$k] = true;
            $out[] = ['name' => $name, 'confidence' => $conf, 'why' => $why];
        };

        // Estruturados (alta): DSN, chamada de conexao, USE, CREATE DATABASE, python.
        if (preg_match_all('/dbname\s*=\s*[`"\']?([A-Za-z0-9_]+)/i', $line, $m)) {
            foreach ($m[1] as $n) { $push($n, 'alta', 'DSN dbname='); }
        }
        if (preg_match_all('/getConnection\(\s*[\'"]([A-Za-z0-9_]+)[\'"]/', $line, $m)) {
            foreach ($m[1] as $n) { $push($n, 'alta', "getConnection('...')"); }
        }
        if (preg_match_all('/\bdatabase\s*[:=]\s*[\'"]([A-Za-z0-9_]+)[\'"]/i', $line, $m)) {
            foreach ($m[1] as $n) { $push($n, 'alta', 'database=...'); }
        }
        // USE so MAIUSCULO = SQL. (evita o `use LoggerTrait;` do PHP, que e minusculo.)
        if (preg_match_all('/\bUSE\s+[`"\']?([A-Za-z0-9_]+)[`"\']?\s*;/', $line, $m)) {
            foreach ($m[1] as $n) { $push($n, 'alta', 'USE <banco>'); }
        }
        if (preg_match_all('/CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\']?([A-Za-z0-9_]+)/i', $line, $m)) {
            foreach ($m[1] as $n) { $push($n, 'alta', 'CREATE DATABASE'); }
        }
        // mysqldump/mysql CLI: --databases X  ou  ... X > arquivo
        if (preg_match_all('/--databases?\s+([A-Za-z0-9_]+)/i', $line, $m)) {
            foreach ($m[1] as $n) { $push($n, 'alta', 'mysql --databases'); }
        }

        // Mencao de nome conhecido especifico (baixa/media) — pega DSHOW_PROD.Orcamento etc.
        foreach ($this->mentionNames as $kn) {
            if (preg_match('/(?<![A-Za-z0-9_])' . preg_quote($kn, '/') . '(?![A-Za-z0-9_])/', $line)) {
                $push($kn, 'baixa', 'nome conhecido citado');
            }
        }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════
    // AGREGACAO E HELPERS
    // ═══════════════════════════════════════════════════════════════

    /** Acumula um hit (name/confidence/why) numa localizacao. */
    private function addHit(array &$agg, array $hit, string $loc): void
    {
        $name = $hit['name'];
        if (!isset($agg[$name])) {
            $agg[$name] = ['confidence' => $hit['confidence'], 'hits' => [], 'why' => []];
        }
        if (count($agg[$name]['hits']) < 80) {
            $agg[$name]['hits'][] = $loc;
        }
        // mantem a MAIOR confianca vista
        if ($this->confRank($hit['confidence']) > $this->confRank($agg[$name]['confidence'])) {
            $agg[$name]['confidence'] = $hit['confidence'];
        }
        $agg[$name]['why'][$hit['why']] = true;
    }

    /** Converte o agregado em findings (uma evidencia por banco/camada). */
    private function aggToFindings(array $agg, string $sourceType, string $rotulo): array
    {
        $out = [];
        foreach ($agg as $name => $a) {
            $locs = array_slice($a['hits'], 0, 3);
            $more = count($a['hits']) - count($locs);
            $why  = implode(', ', array_slice(array_keys($a['why']), 0, 3));
            $detail = count($a['hits']) . ' ' . $rotulo . ': ' . implode(', ', $locs)
                    . ($more > 0 ? " (+$more)" : '') . ($why ? "  [$why]" : '');
            $out[] = [
                'name' => $name, 'host' => null, 'port' => null, 'source_type' => $sourceType,
                'detail' => mb_substr($detail, 0, 480), 'confidence' => $a['confidence'],
                'application' => null,
            ];
        }
        return $out;
    }

    private function cov(string $layer, string $rotulo, string $status, string $note, int $scanned, int $hits): array
    {
        return ['layer' => $layer, 'rotulo' => $rotulo, 'status' => $status,
                'note' => mb_substr($note, 0, 400), 'scanned' => $scanned, 'hits' => $hits];
    }

    /** Le ate N linhas do FIM de um arquivo (cauda), sem carregar tudo em memoria. */
    private function tailLines(string $path, int $maxLines): array
    {
        $sz = @filesize($path);
        if ($sz === false || $sz === 0) {
            return [];
        }
        $chunk = min($sz, 2097152); // le no maximo os ultimos 2 MB
        $fh = @fopen($path, 'rb');
        if (!$fh) {
            return [];
        }
        @fseek($fh, -$chunk, SEEK_END);
        $data = @fread($fh, $chunk) ?: '';
        @fclose($fh);
        $lines = explode("\n", $data);
        if (count($lines) > $maxLines) {
            $lines = array_slice($lines, -$maxLines);
        }
        return $lines;
    }

    /** Nome e "especifico" o suficiente p/ busca por mencao (evita 'Logs','APIS'). */
    private function isSpecific(string $name): bool
    {
        $n = trim($name);
        if (strpos($n, ' ') !== false) {
            return false; // nomes compostos ("Kondado - Intermediaria") nao viram regex de mencao
        }
        if (strpos($n, '_') !== false) {
            return true;  // DSHOW_PROD, LED_LOVERS...
        }
        return (bool) preg_match('/^[A-Z0-9]{6,}$/', $n); // INTEGRACAO, RDSATION
    }

    /** Filtra falso-positivo obvio (palavra generica, muito curto). */
    private function plausibleName(string $name): bool
    {
        if (!preg_match('/^[A-Za-z][A-Za-z0-9_]{2,63}$/', $name)) {
            return false;
        }
        $low = strtolower($name);
        static $stop = [
            'true', 'false', 'null', 'test', 'name', 'value', 'data', 'type', 'default', 'string',
            'array', 'object', 'error', 'debug', 'info', 'class', 'function', 'return', 'public',
            'private', 'static', 'const', 'select', 'insert', 'update', 'delete', 'where', 'from',
            'table', 'index', 'utf8mb4', 'localhost', 'password', 'username', 'charset', 'collation',
        ];
        return !in_array($low, $stop, true);
    }

    private function confRank(string $c): int
    {
        return ['baixa' => 1, 'media' => 2, 'alta' => 3][$c] ?? 1;
    }

    private function rel(string $path): string
    {
        return ltrim(str_replace($this->root, '', $path), '/');
    }
}
