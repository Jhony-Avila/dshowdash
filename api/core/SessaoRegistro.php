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
    /** P0 LOGS-010 (AZUL 28/11): a CONTA do titular não está ativa (status ≠ 'active') ou foi excluída (deleted_at) → a sessão não vale */
    public const CONTA_INATIVA = 'conta_inativa';
    /** QI VINHO 01:16 (P1-2): conta reativada com a revisão F1 PENDENTE (app_usuario_f1) não opera até a F1 ser registrada */
    public const F1_PENDENTE = 'f1_pendente';
    /** a tabela app_usuario_f1 existe? (nasce na DDL v2b; antes dela a regra da F1 não se aplica). null = ainda não conferido nesta requisição */
    private static ?bool $temF1 = null;

    /** @var null|callable(): PDO */
    private static $fornecedor = null;
    /** @var array<string, string> situação por "token|usuário", só dentro da requisição (FALHA nunca vai para o cache) */
    private static array $cache = [];

    public static function definirConexao(?callable $fornecedor): void
    {
        self::$fornecedor = $fornecedor;
        self::$cache = [];
        self::$temF1 = null;
    }

    public static function limparCache(): void
    {
        self::$cache = [];
        self::$temF1 = null;
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

    /** L02 (LOGS-009/011, autorizado 28/11 09:35): o registro guarda a REFERÊNCIA da sessão, nunca o id cru (que é o próprio cookie).
     *  'h1:' + sha256(id). O id do PHP só tem [A-Za-z0-9,-]: um valor 'h1:…' lido do banco não serve como cookie. */
    public static function ref(string $sid): string { return 'h1:' . hash('sha256', $sid); }
    /** Leitura na transição: a referência OU o id cru das linhas criadas antes da migração (scripts/seguranca/l02/01-migrar-PROPOSTA.sql). */
    public static function refs(string $sid): array { return (strpos($sid, ':') === false) ? [self::ref($sid), $sid] : [self::ref($sid), self::ref($sid)]; }
    /** O valor guardado corresponde a este id? (comparação em tempo constante) */
    public static function ehMesma(?string $guardado, string $sid): bool
    {
        if ($guardado === null || $guardado === '' || $sid === '') return false;
        return hash_equals($guardado, self::ref($sid)) || (strpos($sid, ':') === false && hash_equals($guardado, $sid));
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
            // P0 LOGS-010: a conta do titular entra na MESMA consulta (desativada, bloqueada, pendente ou excluída = a sessão não vale, sem depender de revogação)
            $pdo = self::pdo();   // UMA conexão para as duas leituras (o teste DSHOW-110 conta as chamadas à conexão)
            if (self::$temF1 === null) {   // 1 consulta por requisição; falha aqui = FALHA (nega), nunca "sem F1"
                self::$temF1 = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'app_usuario_f1'")->fetchColumn() === 1;
            }
            $f1 = self::$temF1 ? ", (SELECT COUNT(*) FROM app_usuario_f1 f WHERE f.user_id = s.user_id AND f.situacao = 'pendente_f1') AS f1_pendente" : ', 0 AS f1_pendente';
            $st = $pdo->prepare('SELECT s.user_id, s.is_active, (s.expires_at > NOW()) AS vigente, u.status AS conta_status, (u.deleted_at IS NULL) AS conta_viva' . $f1 . ' FROM app_user_sessions s LEFT JOIN app_users u ON u.id = s.user_id WHERE s.session_token IN (?, ?) LIMIT 1');
            $st->execute(self::refs($token));
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
        } elseif (($linha['conta_status'] ?? null) !== 'active' || (int) ($linha['conta_viva'] ?? 0) !== 1) {
            $r = self::CONTA_INATIVA;
        } elseif ((int) ($linha['f1_pendente'] ?? 0) > 0) {
            $r = self::F1_PENDENTE;
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
            $p = [self::ref($novo)];   // L02: a renovação já grava a referência (e migra a linha antiga)
            if ($csrf !== null) { $set .= ', csrf_token = ?'; $p[] = $csrf; }
            if ($expiraEm !== null) { $set .= ', expires_at = FROM_UNIXTIME(?)'; $p[] = $expiraEm; }
            $st = self::pdo()->prepare("UPDATE app_user_sessions SET $set WHERE session_token IN (?, ?) AND user_id = ? AND is_active = 1 AND expires_at > NOW()");
            $st->execute(array_merge($p, self::refs($antigo), [$userId]));
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
            $st = self::pdo()->prepare('UPDATE app_user_sessions SET is_active = 0, logout_at = NOW(3), logout_reason = ? WHERE session_token IN (?, ?) AND user_id = ? AND is_active = 1');
            $st->execute(array_merge([substr($motivo, 0, 50)], self::refs($token), [$userId]));
            // Codex DSHOW-113 (4): "encerrado" só com prova de que NÃO sobrou registro ativo com este id (o UPDATE sem erro não basta)
            $v = self::pdo()->prepare('SELECT COUNT(*) FROM app_user_sessions WHERE session_token IN (?, ?) AND is_active = 1');
            $v->execute(self::refs($token));
            return (int) $v->fetchColumn() === 0;
        } catch (\Throwable $e) {
            error_log('[SessaoRegistro] encerramento falhou: ' . get_class($e));
            return false;
        }
    }
}
