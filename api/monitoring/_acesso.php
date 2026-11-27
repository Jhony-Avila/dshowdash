<?php
declare(strict_types=1);
// api/monitoring/_acesso.php — PORTÃO DE ACESSO dos 14 endpoints de monitoramento (SEC-002, aprovado pelo arquiteto 27/11; AZUL).
// Antes: o _init.php só carregava CORS e ApiResponse — scripts em execução, crons, métricas de infraestrutura e jobs respondiam SEM sessão.
// Agora (chamado no _init.php, ANTES do cache e de qualquer consulta):
//   · CLI (cron que roda `php …`)                 → passa (caminho interno; nunca pela internet)
//   · conexão de loopback (REMOTE_ADDR 127.0.0.1/::1, ex.: cron com curl na própria máquina) → passa (caminho interno)
//   · sem sessão válida                           → 401 NOT_AUTHENTICATED
//   · sessão sem permissão de sistema             → 403 FORBIDDEN (nível ≥ 80, papel admin/super_admin ou system.access — o
//                                                    mesmo critério de StatusAcesso::temPermissaoDeSistema dos status/*)
//   · com permissão                               → o handler responde EXATAMENTE o que responde hoje
// O IP vem do REMOTE_ADDR (quem abriu a conexão): X-Forwarded-For não conta. A sessão é lida sem emitir cookie (SessionGate::readOnly).
require_once __DIR__ . '/../status/_acesso.php';   // StatusAcesso::sessao() e temPermissaoDeSistema() — uma regra só

final class MonitoramentoAcesso
{
    /** null = pode; senão [HTTP, código]. */
    public static function decidir(string $sapi, string $remoto, ?array $sessao): ?array
    {
        if ($sapi === 'cli') { return null; }
        if (in_array($remoto, ['127.0.0.1', '::1'], true)) { return null; }
        if ($sessao === null) { return [401, 'NOT_AUTHENTICATED']; }
        if (!StatusAcesso::temPermissaoDeSistema($sessao)) { return [403, 'FORBIDDEN']; }
        return null;
    }

    public static function exigir(): void
    {
        $r = self::decidir(PHP_SAPI, (string) ($_SERVER['REMOTE_ADDR'] ?? ''), PHP_SAPI === 'cli' ? null : StatusAcesso::sessao());
        if ($r === null) { return; }
        [$http, $codigo] = $r;
        if (!headers_sent()) {
            http_response_code($http);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: private, no-store');
            header('Vary: Cookie');
        }
        echo json_encode(['ok' => false, 'data' => null, 'error' => $codigo], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
