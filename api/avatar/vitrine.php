<?php
declare(strict_types=1);

/**
 * /api/avatar/vitrine.php — vitrine de avatares (AS3 F4, decisão #26).
 * @version 1.0.0  @created 2026-07-30
 *
 * Leaderboard OPCIONAL e focado em COLEÇÃO (nunca produtividade): aparece
 * quem CRIOU um avatar no estúdio (ato voluntário); ranking = nº de versões
 * exploradas (dado auditável de app_user_avatars). GET → { vitrine: [
 * {usuario, url, versoes, atualizado_em, sou_eu} ] } (top 12).
 */
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
$userId = (int) SessionGate::getUserId();

try {
    $pdo = getConnection('DSHOWDASH');
    $st = $pdo->query("
        SELECT u.id, u.username, a.avatar_image_url AS url, a.updated_at,
               (SELECT COUNT(*) FROM app_user_avatars x
                 WHERE x.user_id = u.id AND x.avatar_type IN ('generated','image')) AS versoes
        FROM app_user_avatars a
        JOIN app_users u ON u.id = a.user_id AND u.deleted_at IS NULL
        WHERE a.is_active = 1
          AND a.avatar_type IN ('generated','image')
          AND a.avatar_image_url IS NOT NULL
        ORDER BY versoes DESC, a.updated_at DESC
        LIMIT 12
    ");
    $vitrine = [];
    foreach ($st as $l) {
        $vitrine[] = [
            'usuario' => (string) $l['username'],
            'url' => (string) $l['url'],
            'versoes' => (int) $l['versoes'],
            'atualizado_em' => (string) $l['updated_at'],
            'sou_eu' => ((int) $l['id']) === $userId,
        ];
    }
    session_write_close();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => ['vitrine' => $vitrine], 'error' => null,
        'meta' => ['endpoint' => 'avatar/vitrine', 'version' => '1.0.0']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('[avatar/vitrine.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'data' => null, 'error' => 'ERRO_INTERNO']);
}
