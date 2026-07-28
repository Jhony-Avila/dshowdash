<?php
// Pipedrive / AuthController - credencial dinamica (validar/conectar/reconectar)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Rotas (todas POST, admin + CSRF; token so no corpo, nunca devolvido):
//   POST /auth/validate    testa o token, nao salva
//   POST /auth/connect     valida + cifra + persiste
//   POST /auth/reconnect   substitui a credencial ativa
//   POST /auth/disconnect  desativa a credencial ativa (sem token no corpo)
declare(strict_types=1);

final class PipeAuthController
{
    public static function route(string $method, array $segments, PDO $pdo): void
    {
        requireMethod(['POST']);
        // Configurar credencial e' acao de administrador (§7.3/§45.2).
        AuthHelpers::requireAuth(80);

        $sub = $segments[1] ?? '';
        $body = pipe_body();
        $token = is_string($body['token'] ?? null) ? trim($body['token']) : '';

        $repo = new PipeAccountRepository($pdo);
        $svc  = new PipeAuthService($repo);

        switch ($sub) {
            case 'validate':
                $r = $svc->validate($token);
                if (!$r['ok']) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                        'reason' => $r['error'] ?? 'INVALIDO',
                        'meta'   => $r['meta'] ?? null,
                    ]);
                }
                ApiResponse::success($r, ['action' => 'validate']);
                break;

            case 'connect':
                $r = $svc->connect($token);
                if (!$r['ok']) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                        'reason' => $r['error'] ?? 'INVALIDO',
                    ]);
                }
                ApiResponse::success($r, ['action' => 'connect']);
                break;

            case 'reconnect':
                $r = $svc->reconnect($token);
                if (!$r['ok']) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                        'reason' => $r['error'] ?? 'INVALIDO',
                    ]);
                }
                ApiResponse::success($r, ['action' => 'reconnect']);
                break;

            case 'disconnect':
                // Desligar a integracao nao exige token no corpo.
                $r = $svc->disconnect();
                ApiResponse::success($r, ['action' => 'disconnect']);
                break;

            default:
                ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 404, [
                    'message' => 'Acao de auth desconhecida: ' . $sub,
                ]);
        }
    }
}
