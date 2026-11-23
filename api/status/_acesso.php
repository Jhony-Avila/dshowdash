<?php
declare(strict_types=1);
// ═══════════════════════════════════════════════════════════════
// api/status/_acesso.php — PORTÃO DE ACESSO dos 42 handlers de status (Codex DSHOW-106 item 4, 23/11/2026)
// ───────────────────────────────────────────────────────────────
// Chamado pelo _init.php, que TODO handler inclui ANTES do cache (RedisHelper::serveIfCached) e de qualquer consulta — então nem o
// cache quente entrega detalhe a quem não pode ver.
//   · sem sessão válida            → só disponibilidade mínima: {status:'unknown', estado:'desconhecido', disponivel, requer:'login'}
//   · endpoint do grupo SISTEMA     → exige nível ≥ 80, papel admin/super_admin ou a permissão system.access (a mesma regra do
//                                     SessionGate::hasPermission do Dash); sem isso → mínimo com requer:'permissao'
//   · demais endpoints              → qualquer sessão válida
// A sessão é lida com SessionGate::readOnly() (não emite cookie nem inicia sessão). Nenhum detalhe, erro interno ou texto de API sai
// no mínimo. A política está numa constante só; a escolha dos grupos é DECISÃO registrada (Q-STATUS.1).
// ═══════════════════════════════════════════════════════════════

require_once __DIR__ . '/../core/SessionGate.php';

final class StatusAcesso
{
    /** Métricas de infraestrutura e números do negócio: só com permissão de sistema. */
    public const GRUPO_SISTEMA = ['activity', 'cloud', 'cpu', 'database', 'disk', 'files', 'financial', 'logs', 'memory', 'metrics',
        'monitor', 'network', 'performance', 'security', 'server', 'storage', 'web'];
    public const NIVEL_SISTEMA = 80;

    /** Sessão válida (usuário + não expirada) ou null. */
    public static function sessao(?array $s = null): ?array
    {
        $s ??= class_exists('SessionGate') ? SessionGate::readOnly() : [];
        if (empty($s['user_id'])) { return null; }
        if (isset($s['expires_at']) && (int) $s['expires_at'] > 0 && (int) $s['expires_at'] <= time()) { return null; }
        return $s;
    }

    public static function temPermissaoDeSistema(array $s): bool
    {
        $papeis = is_array($s['roles'] ?? null) ? $s['roles'] : [];
        $perms = is_array($s['permissions'] ?? null) ? $s['permissions'] : [];
        return (int) ($s['level'] ?? 0) >= self::NIVEL_SISTEMA
            || array_intersect(['admin', 'super_admin'], $papeis) !== []
            || in_array('system.access', $perms, true);
    }

    /** null = pode ver o detalhe; senão o motivo ('login' | 'permissao'). */
    public static function motivoDeBloqueio(string $endpoint, ?array $s): ?string
    {
        if ($s === null) { return 'login'; }
        if (in_array($endpoint, self::GRUPO_SISTEMA, true) && !self::temPermissaoDeSistema($s)) { return 'permissao'; }
        return null;
    }

    /** Resposta mínima (disponibilidade). Mesmo envelope {ok,data,error}; os cartões mostram "--"/desconhecido. */
    public static function minimo(string $endpoint, string $motivo): array
    {
        return ['status' => 'unknown', 'estado' => 'desconhecido', 'disponivel' => true, 'requer' => $motivo,
                'endpoint' => $endpoint, 'timestamp' => date(DATE_ATOM)];
    }

    /** Portão: chamado no _init.php. Sem acesso → responde o mínimo e ENCERRA antes do handler (e do cache dele). */
    public static function exigir(?string $endpoint = null): void
    {
        $endpoint ??= basename((string) ($_SERVER['SCRIPT_FILENAME'] ?? ''), '.php');
        $motivo = self::motivoDeBloqueio($endpoint, self::sessao());
        if ($motivo === null) { return; }
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: private, no-store');
            header('Vary: Cookie');
        }
        echo json_encode(['ok' => true, 'data' => self::minimo($endpoint, $motivo), 'error' => null], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
