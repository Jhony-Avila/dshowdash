<?php
// DataTables / ConnectionFactory - abre PDO a partir de uma linha de DT_Conexao
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Diferente de config/db_connection.php (3 bancos hardcoded), aqui a conexao e
// DINAMICA: vem do cadastro. Nunca faz pool - cada probe abre e fecha.
//
// Regra de ouro (§33): timeout curto, sem retry agressivo, jamais escrita em
// tabela de negocio. Toda falha vira status classificado, nunca excecao solta.
declare(strict_types=1);

require_once __DIR__ . '/Crypto.php';

final class DtConnectionFactory
{
    /** Timeout de conexao em segundos. Curto de proposito: probe, nao workload. */
    public const CONNECT_TIMEOUT = 5;

    /** Acima disso a conexao e classificada como 'slow' (ms). Default; sobrescrito por conexao. */
    public const DEFAULT_SLOW_MS = 1500;

    // Status canonicos (§13)
    public const ST_ONLINE       = 'online';
    public const ST_UNSTABLE     = 'unstable';
    public const ST_SLOW         = 'slow';
    public const ST_OFFLINE      = 'offline';
    public const ST_UNTESTED     = 'untested';
    public const ST_MAINTENANCE  = 'maintenance';
    public const ST_CRED_EXPIRED = 'credential_expired';

    /**
     * Abre um PDO para a conexao cadastrada.
     *
     * @param array $conn Linha de DT_Conexao (com password_encrypted)
     * @param string|null $overrideDb Schema especifico (senao usa db_name; NULL = sem schema)
     * @throws PDOException|DtCryptoException
     */
    public static function open(array $conn, ?string $overrideDb = null): PDO
    {
        $host = (string)($conn['host'] ?? '');
        $port = (int)($conn['port'] ?? 3306);
        $db   = $overrideDb ?? ($conn['db_name'] ?? null);

        if ($host === '') {
            throw new InvalidArgumentException('Conexao sem host');
        }

        $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
        if ($db !== null && $db !== '') {
            $dsn .= ";dbname={$db}";
        }

        $password = '';
        $stored   = (string)($conn['password_encrypted'] ?? '');
        if ($stored !== '') {
            // Tolera texto plano legado, mas o caminho normal e envelope cifrado.
            $password = DtCrypto::looksEncrypted($stored) ? DtCrypto::decrypt($stored) : $stored;
        }

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => self::CONNECT_TIMEOUT,
            PDO::ATTR_PERSISTENT         => false,
        ];

        if (!empty($conn['ssl_enabled'])) {
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }

        return new PDO($dsn, (string)($conn['username'] ?? ''), $password, $options);
    }

    // ═══════════════════════════════════════════════════════════════
    // CLASSIFICACAO DE ERRO
    // ═══════════════════════════════════════════════════════════════

    /**
     * Traduz uma excecao de conexao no status canonico (§13).
     * Distingue credencial invalida de servidor fora - a diferenca importa
     * para o operador (renovar senha vs. subir servidor).
     */
    public static function classifyError(Throwable $e): string
    {
        if ($e instanceof DtCryptoException) {
            return self::ST_CRED_EXPIRED;
        }

        $code = (string)$e->getCode();
        $msg  = $e->getMessage();

        // MySQL: 1045 access denied, 1044 access denied to db, 1130 host not allowed,
        // 1698 auth plugin, 2059 auth plugin nao carregavel.
        if (preg_match('/\b(1045|1044|1130|1698|2059)\b/', $code . ' ' . $msg)) {
            return self::ST_CRED_EXPIRED;
        }
        if (stripos($msg, 'access denied') !== false || stripos($msg, 'authentication') !== false) {
            return self::ST_CRED_EXPIRED;
        }

        return self::ST_OFFLINE;
    }

    /** Mensagem de erro segura: sem credencial, sem DSN, truncada. */
    public static function safeError(Throwable $e): string
    {
        $msg = $e->getMessage();
        // Remove qualquer coisa que cheire a credencial/DSN.
        $msg = preg_replace('/\b(password|pwd|senha)\s*=\s*\S+/i', '$1=***', $msg) ?? $msg;
        $msg = preg_replace('/mysql:host=[^\s\']+/i', 'mysql:host=***', $msg) ?? $msg;
        $msg = preg_replace("/user\s+'[^']*'/i", "user '***'", $msg) ?? $msg;
        return mb_substr(trim($msg), 0, 900);
    }

    /** Classifica latencia em online|slow conforme limite da conexao. */
    public static function classifyLatency(float $ms, ?int $slowThresholdMs = null): string
    {
        $limit = $slowThresholdMs ?? self::DEFAULT_SLOW_MS;
        return $ms > $limit ? self::ST_SLOW : self::ST_ONLINE;
    }

    /** Fecha explicitamente (PDO nao tem close; liberar referencia). */
    public static function close(?PDO &$pdo): void
    {
        $pdo = null;
    }
}
