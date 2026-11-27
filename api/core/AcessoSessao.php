<?php
declare(strict_types=1);
// api/core/AcessoSessao.php — PORTÃO DE SESSÃO para endpoints de leitura que respondiam SEM sessão (SEC-002, lote S1; AZUL 27/11).
// Mesmo modelo do api/monitoring/_acesso.php: chamado no TOPO do endpoint, antes do cache e de qualquer consulta.
//   · CLI ou loopback (REMOTE_ADDR 127.0.0.1/::1)  → passa (caminho interno; nunca pela internet; X-Forwarded-For não conta)
//   · sem sessão válida                           → 401 NOT_AUTHENTICATED
//   · $sistema = true e sem permissão de sistema  → 403 FORBIDDEN (nível ≥ 80, papel admin/super_admin ou system.access)
//   · senão                                       → o endpoint responde exatamente o que responde hoje
require_once __DIR__ . '/../status/_acesso.php';   // StatusAcesso::sessao() (sem emitir cookie) e temPermissaoDeSistema()

final class AcessoSessao
{
    /** null = pode; senão [HTTP, código]. */
    public static function decidir(string $sapi, string $remoto, ?array $sessao, bool $sistema): ?array
    {
        if ($sapi === 'cli' || in_array($remoto, ['127.0.0.1', '::1'], true)) { return null; }
        if ($sessao === null) { return [401, 'NOT_AUTHENTICATED']; }
        if ($sistema && !StatusAcesso::temPermissaoDeSistema($sessao)) { return [403, 'FORBIDDEN']; }
        return null;
    }

    public static function exigir(bool $sistema = false): void
    {
        $r = self::decidir(PHP_SAPI, (string) ($_SERVER['REMOTE_ADDR'] ?? ''), PHP_SAPI === 'cli' ? null : StatusAcesso::sessao(), $sistema);
        if ($r === null) { return; }
        if (!headers_sent()) {
            http_response_code($r[0]);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: private, no-store');
            header('Vary: Cookie');
        }
        echo json_encode(['ok' => false, 'data' => null, 'error' => $r[1]], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
