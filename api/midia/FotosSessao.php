<?php
declare(strict_types=1);
require_once __DIR__ . '/../core/SessaoRegistro.php';   // L02: SessaoRegistro::ref/refs/ehMesma

/**
 * /api/midia/FotosSessao.php — DSHOW-103 P1-2 (19/11, ACIMA_DIREITA): SESSÃO COMPLETA no proxy de fotos.
 * Não basta haver `user_id` na sessão PHP (era o que `AuthHelpers::requireAuth` conferia). O proxy exige, nesta ordem:
 *   1) `SessionGate::validate()` — sessão PHP válida (expiração, fingerprint, IP quando ligado); null → 401;
 *   2) a linha da sessão em `app_user_sessions` (session_token = session_id(), mesmo usuário) ATIVA e não expirada — sessão REVOGADA pelo
 *      admin (`terminateSession`/`terminateAllUserSessions` põem is_active = 0) ou encerrada → 401 SESSION_REVOKED;
 *   3) o usuário em `app_users` ATIVO (`status = 'active'`, `deleted_at IS NULL`) — DESATIVADO ou excluído → 401 USER_DISABLED;
 *   4) não deu para conferir (banco fora, exceção) → 503 e NADA segue (fail-closed; nunca "não conferido = libera").
 * O repositório é INJETÁVEL (interface): produção = PDO só-SELECT no DSHOWDASH (as mesmas tabelas que o login e o /api/auth/check.php
 * usam); testes = repositório FALSO. Nenhuma tabela nova, nenhuma escrita.
 */

interface FotosSessaoRepositorio
{
    /** @return array{sessao_ativa: bool, usuario_ativo: bool} */
    public function situacao(string $tokenSessao, int $userId): array;
}

final class FotosSessaoPdo implements FotosSessaoRepositorio
{
    public function __construct(private readonly PDO $pdo) {}

    public function situacao(string $tokenSessao, int $userId): array
    {
        $s = $this->pdo->prepare('SELECT 1 FROM app_user_sessions WHERE session_token IN (?, ?) AND user_id = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1');
        $s->execute([...SessaoRegistro::refs($tokenSessao), $userId]);
        $sessao = $s->fetchColumn() !== false;
        $u = $this->pdo->prepare("SELECT 1 FROM app_users WHERE id = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1");
        $u->execute([$userId]);
        return ['sessao_ativa' => $sessao, 'usuario_ativo' => $u->fetchColumn() !== false];
    }
}

final class FotosSessao
{
    /**
     * @param array<string, mixed>|null $sessao retorno de SessionGate::validate()
     * @return int o user_id da sessão conferida
     * @throws FotosErro 401 (sem sessão, revogada, usuário desativado) ou 503 (não deu para conferir)
     */
    public static function exigir(?array $sessao, string $tokenSessao, FotosSessaoRepositorio $repo): int
    {
        $uid = is_array($sessao) ? ($sessao['user_id'] ?? null) : null;
        $uid = is_int($uid) ? $uid : (is_string($uid) && preg_match('/^[1-9][0-9]{0,9}$/', $uid) ? (int) $uid : 0);
        if ($uid <= 0 || $tokenSessao === '') throw new FotosErro('NOT_AUTHENTICATED', 401, 'Não autenticado.');
        try {
            $st = $repo->situacao($tokenSessao, $uid);
        } catch (Throwable $e) {
            error_log('[midia/fotos] conferência da sessão falhou: ' . get_class($e));
            throw new FotosErro('SESSION_CHECK_UNAVAILABLE', 503, 'Não foi possível conferir a sua sessão agora. Tente de novo em instantes.');
        }
        if (($st['sessao_ativa'] ?? false) !== true) throw new FotosErro('SESSION_REVOKED', 401, 'Sua sessão foi encerrada. Entre de novo.');
        if (($st['usuario_ativo'] ?? false) !== true) throw new FotosErro('USER_DISABLED', 401, 'Usuário desativado.');
        return $uid;
    }
}
