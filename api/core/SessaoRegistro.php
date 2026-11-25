<?php
// SessaoRegistro — DSHOW-110 (decisão do Jhony, 23/11): o registro em app_user_sessions é OBRIGATÓRIO para a sessão valer.
//
// Sessão válida = sessão do PHP válida (SessionGate) + registro existente, ATIVO, do MESMO titular, com o MESMO id e dentro da validade.
// - Falha de consulta NÃO autoriza (FALHA ≠ OK; quem chama nega).
// - Sessão antiga sem registro: exige novo login (AUSENTE ≠ OK).
// - Troca de id (renovação): atualiza o MESMO registro pelo titular + id anterior, só se ativo e vigente, e confere que EXATAMENTE uma
//   linha mudou. Revogada, expirada ou já trocada por outra renovação → false (nada é ressuscitado; quem chama encerra a sessão).
// - Encerramento (logout): o registro fica INATIVO (is_active = 0, logout_at, logout_reason) — histórico preservado.
// Conexão: getConnection('DSHOWDASH') (config/db_connection.php); os testes injetam por definirConexao().
declare(strict_types=1);

final class SessaoRegistro
{
    public const OK = 'ok';
    public const AUSENTE = 'ausente';
    public const OUTRO_TITULAR = 'outro_titular';
    public const REVOGADA = 'revogada';
    public const EXPIRADA = 'expirada';
    public const FALHA = 'falha';

    /** @var null|callable(): PDO */
    private static $fornecedor = null;
    /** @var array<string, string> situação por "token|usuário", só dentro da requisição (FALHA nunca vai para o cache) */
    private static array $cache = [];

    public static function definirConexao(?callable $fornecedor): void
    {
        self::$fornecedor = $fornecedor;
        self::$cache = [];
    }

    public static function limparCache(): void
    {
        self::$cache = [];
    }

    private static function pdo(): PDO
    {
        if (self::$fornecedor !== null) {
            return (self::$fornecedor)();
        }
        if (!function_exists('getConnection')) {
            $arquivo = __DIR__ . '/../../config/db_connection.php';
            if (!is_file($arquivo)) {
                throw new RuntimeException('config/db_connection.php ausente');
            }
            require_once $arquivo;
        }
        return getConnection('DSHOWDASH');
    }

    /** OK | AUSENTE | OUTRO_TITULAR | REVOGADA | EXPIRADA | FALHA */
    public static function situacao(string $token, int $userId): string
    {
        if ($token === '' || $userId <= 0) {
            return self::AUSENTE;
        }
        $chave = $token . '|' . $userId;
        if (isset(self::$cache[$chave])) {
            return self::$cache[$chave];
        }
        try {
            $st = self::pdo()->prepare('SELECT user_id, is_active, (expires_at > NOW()) AS vigente FROM app_user_sessions WHERE session_token = ? LIMIT 1');
            $st->execute([$token]);
            $linha = $st->fetch(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            error_log('[SessaoRegistro] consulta falhou: ' . get_class($e));
            return self::FALHA;
        }
        if (!$linha) {
            $r = self::AUSENTE;
        } elseif ((int) $linha['user_id'] !== $userId) {
            $r = self::OUTRO_TITULAR;
        } elseif ((int) $linha['is_active'] !== 1) {
            $r = self::REVOGADA;
        } elseif ((int) $linha['vigente'] !== 1) {
            $r = self::EXPIRADA;
        } else {
            $r = self::OK;
        }
        return self::$cache[$chave] = $r;
    }

    /** Renovação: antigo → novo no MESMO registro (titular + id anterior, ativo e vigente). true só se EXATAMENTE uma linha mudou. */
    public static function trocar(string $antigo, string $novo, int $userId, ?string $csrf = null, ?int $expiraEm = null): bool
    {
        self::$cache = [];
        if ($antigo === '' || $novo === '' || $antigo === $novo || $userId <= 0) {
            return false;
        }
        try {
            $set = 'session_token = ?, last_activity_at = NOW(3)';
            $p = [$novo];
            if ($csrf !== null) { $set .= ', csrf_token = ?'; $p[] = $csrf; }
            if ($expiraEm !== null) { $set .= ', expires_at = FROM_UNIXTIME(?)'; $p[] = $expiraEm; }
            $st = self::pdo()->prepare("UPDATE app_user_sessions SET $set WHERE session_token = ? AND user_id = ? AND is_active = 1 AND expires_at > NOW()");
            $st->execute(array_merge($p, [$antigo, $userId]));
            return $st->rowCount() === 1;
        } catch (\Throwable $e) {
            error_log('[SessaoRegistro] troca falhou: ' . get_class($e));
            return false;
        }
    }

    /** Logout: o registro fica inativo. true = o banco confirmou (inclusive quando já estava inativo); false = não deu para gravar. */
    public static function encerrar(string $token, int $userId, string $motivo = 'logout'): bool
    {
        self::$cache = [];
        if ($token === '' || $userId <= 0) {
            return false;
        }
        try {
            $st = self::pdo()->prepare('UPDATE app_user_sessions SET is_active = 0, logout_at = NOW(3), logout_reason = ? WHERE session_token = ? AND user_id = ? AND is_active = 1');
            $st->execute([substr($motivo, 0, 50), $token, $userId]);
            return true;
        } catch (\Throwable $e) {
            error_log('[SessaoRegistro] encerramento falhou: ' . get_class($e));
            return false;
        }
    }
}
