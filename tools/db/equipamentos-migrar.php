<?php
// tools/db/equipamentos-migrar.php — EXECUTOR de migrações do DSHOW_EQUIPAMENTOS (ATRIBUTOS-WEB, 18/11/2026).
// Formato da tabela = o que já existe em produção: eq_schema_migrations(version PK, checksum CHAR(64), applied_at).
//   version = nome do arquivo sem .sql (001_schema…); checksum = sha256 do arquivo. Cada migração grava a PRÓPRIA linha (checksum NULL) e o
//   executor preenche o sha256 logo depois (mesmo protocolo do scripts/setup/equipamentos-db-criar.sh do app, que aplicou 001–003).
// Regras:
//   - aplica em ordem os db/equipamentos/migrations/NNN_*.sql que faltam (os *.revert.sql ficam fora do glob);
//   - migração JÁ aplicada com checksum diferente do arquivo → ABORTA sem alterar nada; checksum NULL (antes da 002) → preenche;
//   - retoma: a próxima execução começa da primeira não aplicada; --dry-run só mostra o plano;
//   - schema obrigatório por parâmetro e só `ATRWEB_VAL_*` (validação). Qualquer outro nome exige --modo-producao E a variável
//     ATR_MIGRAR_PRODUCAO=APLICAR-NO-PORTAO (fluxo do portão P1; não usado na missão de 18/11).
//   - --reverter <versao>: roda o <versao>.revert.sql (só validação) se ela for a ÚLTIMA aplicada.
// Uso: php tools/db/equipamentos-migrar.php --schema ATRWEB_VAL_EQ --credenciais /caminho/arquivo.ini [--dry-run] [--reverter 009_sugestao]
//   credenciais (600): user=…  password=…  socket=… (ou host=… port=…)
declare(strict_types=1);

final class MigradorErro extends RuntimeException {}

final class Migrador
{
    public const PREFIXO_VALIDACAO = 'ATRWEB_VAL_';

    public function __construct(private readonly PDO $pdo, private readonly string $schema, private readonly string $dir, private $log) {}

    public static function validarSchema(string $schema, bool $modoProducao, ?string $senhaPortao): void
    {
        if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $schema)) throw new MigradorErro("schema inválido: $schema");
        if (str_starts_with($schema, self::PREFIXO_VALIDACAO)) return;
        if (!$modoProducao || $senhaPortao !== 'APLICAR-NO-PORTAO') {
            throw new MigradorErro("recusado: '$schema' não começa com " . self::PREFIXO_VALIDACAO . ' (produção só no portão, com --modo-producao)');
        }
    }

    /** @return array<string,string> versao => caminho, em ordem */
    public function arquivos(): array
    {
        $out = [];
        foreach (glob($this->dir . '/[0-9][0-9][0-9]_*.sql') ?: [] as $f) {
            if (str_ends_with($f, '.revert.sql')) continue;
            $out[basename($f, '.sql')] = $f;
        }
        ksort($out, SORT_STRING);
        return $out;
    }

    private function q(string $sql, array $p = []): array { $st = $this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); }

    private function temTabela(string $t): bool
    {
        return (bool) $this->q('SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?', [$this->schema, $t]);
    }

    private function temColuna(string $t, string $c): bool
    {
        return (bool) $this->q('SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', [$this->schema, $t, $c]);
    }

    /** @return array<string,?string> versao => checksum */
    public function aplicadas(): array
    {
        if (!$this->temTabela('eq_schema_migrations')) return [];
        $col = $this->temColuna('eq_schema_migrations', 'checksum') ? 'checksum' : 'NULL AS checksum';
        $out = [];
        foreach ($this->q("SELECT version, $col FROM `{$this->schema}`.`eq_schema_migrations` ORDER BY version") as $r) $out[(string) $r['version']] = $r['checksum'];
        return $out;
    }

    /** Divide um arquivo SQL em comandos (fora de aspas e comentários). As migrações não usam DELIMITER nem rotinas. */
    public static function comandos(string $sql): array
    {
        $out = []; $buf = ''; $n = strlen($sql); $q = null;
        for ($i = 0; $i < $n; $i++) {
            $c = $sql[$i]; $prox = $sql[$i + 1] ?? '';
            if ($q !== null) {
                $buf .= $c;
                if ($c === '\\' && $q !== '`') { $buf .= $prox; $i++; continue; }
                if ($c === $q) { if ($prox === $q) { $buf .= $prox; $i++; } else $q = null; }
                continue;
            }
            if ($c === '-' && $prox === '-' && (($sql[$i + 2] ?? ' ') === ' ' || ($sql[$i + 2] ?? '') === "\t" || ($sql[$i + 2] ?? "\n") === "\n")) { $j = strpos($sql, "\n", $i); $i = $j === false ? $n : $j; $buf .= "\n"; continue; }
            if ($c === '#') { $j = strpos($sql, "\n", $i); $i = $j === false ? $n : $j; $buf .= "\n"; continue; }
            if ($c === '/' && $prox === '*') { $j = strpos($sql, '*/', $i + 2); $i = $j === false ? $n : $j + 1; continue; }
            if ($c === "'" || $c === '"' || $c === '`') { $q = $c; $buf .= $c; continue; }
            if ($c === ';') { if (trim($buf) !== '') $out[] = trim($buf); $buf = ''; continue; }
            $buf .= $c;
        }
        if (trim($buf) !== '') $out[] = trim($buf);
        return $out;
    }

    /** @return array{aplicadas:string[], conferidas:string[], checksum_preenchido:string[]} */
    public function executar(bool $seco): array
    {
        $res = ['aplicadas' => [], 'conferidas' => [], 'checksum_preenchido' => []];
        $feitas = $this->aplicadas();
        // 1) conferência de TUDO antes de aplicar qualquer coisa (checksum divergente aborta sem efeito)
        foreach ($this->arquivos() as $v => $f) {
            if (!array_key_exists($v, $feitas)) continue;
            $sha = hash_file('sha256', $f);
            $cur = $feitas[$v];
            if ($cur !== null && $cur !== '' && $cur !== $sha) throw new MigradorErro("$v já aplicada com checksum " . substr($cur, 0, 12) . "… ≠ arquivo " . substr($sha, 0, 12) . "… — o arquivo mudou depois de aplicado; nada foi alterado");
        }
        foreach ($feitas as $v => $cur) if (!isset($this->arquivos()[$v]) && !str_contains($v, '_revertida_')) ($this->log)("aviso: $v consta como aplicada mas não há arquivo");
        // 2) aplica as que faltam, em ordem
        foreach ($this->arquivos() as $v => $f) {
            $sha = hash_file('sha256', $f);
            if (array_key_exists($v, $feitas)) {
                if ($feitas[$v] === null || $feitas[$v] === '') {
                    if (!$seco && $this->temColuna('eq_schema_migrations', 'checksum')) { $this->pdo->prepare("UPDATE `{$this->schema}`.`eq_schema_migrations` SET checksum = ? WHERE version = ? AND checksum IS NULL")->execute([$sha, $v]); $res['checksum_preenchido'][] = $v; }
                } else $res['conferidas'][] = $v;
                continue;
            }
            ($this->log)(($seco ? '[seco] ' : '') . "aplicar $v (sha256 " . substr($sha, 0, 12) . '…)');
            if (!$seco) {
                $this->pdo->exec("USE `{$this->schema}`");
                foreach (self::comandos((string) file_get_contents($f)) as $cmd) $this->pdo->exec($cmd);
                if ($this->temColuna('eq_schema_migrations', 'checksum')) $this->pdo->prepare("UPDATE `{$this->schema}`.`eq_schema_migrations` SET checksum = ? WHERE version = ?")->execute([$sha, $v]);
                // migrações anteriores à coluna checksum (001 antes da 002) recebem o sha agora
                if ($this->temColuna('eq_schema_migrations', 'checksum')) foreach ($this->arquivos() as $v2 => $f2) $this->pdo->prepare("UPDATE `{$this->schema}`.`eq_schema_migrations` SET checksum = ? WHERE version = ? AND checksum IS NULL")->execute([hash_file('sha256', $f2), $v2]);
            }
            $res['aplicadas'][] = $v;
        }
        return $res;
    }

    public function reverter(string $versao): void
    {
        if (!str_starts_with($this->schema, self::PREFIXO_VALIDACAO)) throw new MigradorErro('reversão só em validação');
        $feitas = array_keys(array_filter($this->aplicadas(), static fn($c, $v) => !str_contains((string) $v, '_revertida_'), ARRAY_FILTER_USE_BOTH));
        sort($feitas, SORT_STRING);
        if (end($feitas) !== $versao) throw new MigradorErro("só a última aplicada pode ser revertida (última: " . (end($feitas) ?: '-') . ')');
        $f = $this->dir . "/$versao.revert.sql";
        if (!is_file($f)) throw new MigradorErro("sem arquivo de reversão: $versao.revert.sql");
        $this->pdo->exec("USE `{$this->schema}`");
        foreach (self::comandos((string) file_get_contents($f)) as $cmd) $this->pdo->exec($cmd);
        ($this->log)("revertida $versao");
    }
}

function migrador_conectar(string $credenciais): PDO
{
    if (!is_file($credenciais)) throw new MigradorErro("credenciais ausentes: $credenciais");
    if ((fileperms($credenciais) & 0077) !== 0) throw new MigradorErro('credenciais com permissão aberta (exige 600)');
    $c = parse_ini_file($credenciais, false, INI_SCANNER_RAW);
    if (!$c || empty($c['user'])) throw new MigradorErro('credenciais ilegíveis');
    $dsn = !empty($c['socket']) ? 'mysql:unix_socket=' . $c['socket'] . ';charset=utf8mb4' : 'mysql:host=' . ($c['host'] ?? '127.0.0.1') . ';port=' . ($c['port'] ?? '3306') . ';charset=utf8mb4';
    return new PDO($dsn, (string) $c['user'], (string) ($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $o = getopt('', ['schema:', 'credenciais:', 'dry-run', 'reverter:', 'modo-producao', 'dir:']);
    $log = static function (string $m): void { fwrite(STDOUT, '[' . date('H:i:s') . "] $m\n"); };
    try {
        $schema = (string) ($o['schema'] ?? '');
        Migrador::validarSchema($schema, isset($o['modo-producao']), getenv('ATR_MIGRAR_PRODUCAO') ?: null);
        $pdo = migrador_conectar((string) ($o['credenciais'] ?? ''));
        $m = new Migrador($pdo, $schema, (string) ($o['dir'] ?? (__DIR__ . '/../../db/equipamentos/migrations')), $log);
        if (isset($o['reverter'])) { $m->reverter((string) $o['reverter']); exit(0); }
        $r = $m->executar(isset($o['dry-run']));
        $log((isset($o['dry-run']) ? 'SECO' : 'OK') . ' aplicadas=' . count($r['aplicadas']) . ' conferidas=' . count($r['conferidas']) . ' checksum_preenchido=' . count($r['checksum_preenchido']));
        echo 'MIGRAR_OK ' . json_encode($r) . "\n";
    } catch (Throwable $e) {
        fwrite(STDERR, 'MIGRAR_FALHOU: ' . $e->getMessage() . "\n");
        exit(1);
    }
}
