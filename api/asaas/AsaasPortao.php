<?php
declare(strict_types=1);

/**
 * /api/asaas/AsaasPortao.php — portão HTTP do resumo Asaas (SÓ LEITURA do banco local; NUNCA chama o Asaas na requisição do navegador).
 * Dependências injetáveis para que a ordem seja provada em teste (mesmo molde do FotosProxy, DSHOW-103).
 *
 * Ordem (nada abaixo de uma porta recusada acontece):
 *   1) método ≠ GET → 404 (o endpoint é inerte para qualquer outro método)
 *   2) flag `financeiro_asaas_leitura` global ausente/desligada/ilegível → 404
 *   3) sessão completa (sessão ativa + usuário ativo) → 401 / 503
 *   4) rota ≠ resumo → 404
 *   5) flag para a PESSOA (canário: só o 75) → 404
 *   6) resumo do banco local; banco fora → 503 `dados_indisponiveis` (nunca zero)
 * Resposta sempre `Cache-Control: private, no-store` + `nosniff`.
 */

require_once __DIR__ . '/AsaasDados.php';

interface AsaasSessaoRepositorio
{
    /** @return array{sessao_ativa:bool, usuario_ativo:bool} */
    public function situacao(string $tokenSessao, int $userId): array;
}

final class AsaasSessaoPdo implements AsaasSessaoRepositorio
{
    public function __construct(private readonly PDO $pdo) {}

    public function situacao(string $tokenSessao, int $userId): array
    {
        $s = $this->pdo->prepare('SELECT 1 FROM app_user_sessions WHERE session_token = ? AND user_id = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1');
        $s->execute([$tokenSessao, $userId]);
        $sessao = $s->fetchColumn() !== false;
        $u = $this->pdo->prepare("SELECT 1 FROM app_users WHERE id = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1");
        $u->execute([$userId]);
        return ['sessao_ativa' => $sessao, 'usuario_ativo' => $u->fetchColumn() !== false];
    }
}

final class AsaasPortaoDeps
{
    /**
     * @param Closure(string, ?int): array $flag      resolver oficial de flags
     * @param Closure(): ?array            $sessao    SessionGate::validate()
     * @param Closure(): string            $token     session_id()
     * @param Closure(): array             $resumo    AsaasResumo::montar(...) já com as contas
     */
    public function __construct(
        public readonly Closure $flag,
        public readonly Closure $sessao,
        public readonly Closure $token,
        public readonly AsaasSessaoRepositorio $repo,
        public readonly Closure $resumo,
    ) {}
}

final class AsaasPortao
{
    public const FLAG = 'financeiro_asaas_leitura';
    public const ROTAS = ['resumo'];
    private const DESLIGADO = ['not_found', 'disabled', 'not_started', 'expired', 'environment_mismatch', 'error'];

    /** @return array{0:int, 1:array} status HTTP e corpo JSON */
    public static function atender(string $metodo, array $get, AsaasPortaoDeps $d): array
    {
        try {
            if ($metodo !== 'GET') return self::erro(404, 'NOT_FOUND');
            $g = ($d->flag)(self::FLAG, null);
            if (in_array((string) ($g['source'] ?? 'error'), self::DESLIGADO, true)) return self::erro(404, 'NOT_FOUND');

            $s = ($d->sessao)();
            $uid = is_array($s) ? ($s['user_id'] ?? null) : null;
            $uid = is_int($uid) ? $uid : (is_string($uid) && preg_match('/^[1-9][0-9]{0,9}$/', $uid) ? (int) $uid : 0);
            $tok = (string) ($d->token)();
            if ($uid <= 0 || $tok === '') return self::erro(401, 'NOT_AUTHENTICATED');
            try { $st = $d->repo->situacao($tok, $uid); }
            catch (Throwable $e) { error_log('[asaas] sessão: ' . get_class($e)); return self::erro(503, 'SESSION_CHECK_UNAVAILABLE'); }
            if (($st['sessao_ativa'] ?? false) !== true) return self::erro(401, 'SESSION_REVOKED');
            if (($st['usuario_ativo'] ?? false) !== true) return self::erro(401, 'USER_DISABLED');

            $rota = is_string($get['r'] ?? null) ? $get['r'] : '';
            if (!in_array($rota, self::ROTAS, true)) return self::erro(404, 'NOT_FOUND');
            $p = ($d->flag)(self::FLAG, $uid);
            if ((string) ($p['source'] ?? 'error') === 'error' || ($p['enabled'] ?? false) !== true) return self::erro(404, 'NOT_FOUND');

            try { $dados = ($d->resumo)(); }
            catch (Throwable $e) { error_log('[asaas] resumo: ' . get_class($e)); return self::erro(503, 'dados_indisponiveis'); }
            return [200, ['ok' => true, 'data' => $dados, 'error' => null]];
        } catch (Throwable $e) {
            error_log('[asaas] portão: ' . get_class($e));
            return self::erro(500, 'INTERNAL_ERROR');
        }
    }

    private static function erro(int $http, string $codigo): array
    {
        return [$http, ['ok' => false, 'data' => null, 'error' => ['code' => $codigo]]];
    }

    public static function emitir(array $r): void
    {
        http_response_code($r[0]);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($r[1], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
