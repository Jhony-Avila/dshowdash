<?php
declare(strict_types=1);

/**
 * /api/avatar/favoritos.php — favoritos por USUÁRIO no servidor (Expansão).
 * @version 1.0.0  @created 2026-07-30
 *
 * Migra os favoritos do localStorage p/ avatar_user_favorites (multi-device).
 *   GET          → { itens: [assetKey,…], fonte: 'servidor'|'indisponivel' }
 *   POST {item}  → alterna favorito (CSRF) → { favorito: bool, sincronizado }
 *
 * Gracioso por construção: sem o catálogo migrado (tabelas ausentes) devolve
 * fonte='indisponivel'/sincronizado=false — o front segue no localStorage.
 */
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'POST', 'OPTIONS'], 'no_cache' => true]);
$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($metodo, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
$userId = (int) SessionGate::getUserId();

function avfav_ok(array $data): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data, 'error' => null,
        'meta' => ['endpoint' => 'avatar/favoritos', 'version' => '1.0.0']],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $pdo = getConnection('DSHOWDASH');

    if ($metodo === 'GET') {
        session_write_close();
        try {
            $st = $pdo->prepare('
                SELECT a.`key` FROM avatar_user_favorites f
                JOIN avatar_assets a ON a.id = f.asset_id
                WHERE f.user_id = ? ORDER BY f.created_at
            ');
            $st->execute([$userId]);
            avfav_ok(['itens' => $st->fetchAll(PDO::FETCH_COLUMN), 'fonte' => 'servidor']);
        } catch (Throwable $e) {
            avfav_ok(['itens' => [], 'fonte' => 'indisponivel']);
        }
    }

    // POST — alterna
    requireCsrf();
    $corpo = json_decode(file_get_contents('php://input') ?: '', true);
    $item = is_array($corpo) ? (string) ($corpo['item'] ?? '') : '';
    if (!preg_match('/^[a-z0-9_]{1,80}$/', $item)) {
        ApiResponse::error('ITEM_INVALIDO', 422);
    }
    session_write_close();
    try {
        $st = $pdo->prepare('SELECT id FROM avatar_assets WHERE `key` = ?');
        $st->execute([$item]);
        $assetId = (int) ($st->fetchColumn() ?: 0);
        if ($assetId === 0) {
            avfav_ok(['favorito' => false, 'sincronizado' => false]);
        }
        $del = $pdo->prepare('DELETE FROM avatar_user_favorites WHERE user_id = ? AND asset_id = ?');
        $del->execute([$userId, $assetId]);
        if ($del->rowCount() > 0) {
            avfav_ok(['favorito' => false, 'sincronizado' => true]);
        }
        $ins = $pdo->prepare('INSERT IGNORE INTO avatar_user_favorites (user_id, asset_id, created_at) VALUES (?, ?, NOW())');
        $ins->execute([$userId, $assetId]);
        avfav_ok(['favorito' => true, 'sincronizado' => true]);
    } catch (Throwable $e) {
        avfav_ok(['favorito' => false, 'sincronizado' => false]);
    }
} catch (Throwable $e) {
    error_log('[avatar/favoritos.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'data' => null, 'error' => 'ERRO_INTERNO']);
}
