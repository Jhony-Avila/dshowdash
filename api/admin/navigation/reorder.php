<?php
// API: Navigation Reorder
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()
// v2.2.0: Migrado para UARPSGate + getConnection() centralizado + removido use statements

declare(strict_types=1);

require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';
require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../core/helpers/RedisHelper.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

UARPSGate::enforceTrigger($userId, 'gate:admin:navigation');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST' && $method !== 'PUT') {
    ApiResponse::error('METHOD_NOT_ALLOWED', 405);
    exit;
}

AuthHelpers::requireCsrf();

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['items']) || !is_array($input['items'])) {
    ApiResponse::error('INVALID_INPUT', 400, ['message' => 'items array é obrigatório']);
    exit;
}

$items = $input['items'];

if (empty($items)) {
    ApiResponse::error('EMPTY_ITEMS', 400, ['message' => 'Lista de itens vazia']);
    exit;
}

// ─── Allowed source tables (whitelist) ───
$ALLOWED_TABLES = [
    'ui_nav_items'      => true,
    'navrail_items'     => true,
    'header_components' => true,
    'footer_items'      => true,
];

try {
    $pdo = getConnection('DSHOWDASH');
    $pdo->beginTransaction();

    $updatedCount = 0;

    foreach ($items as $index => $item) {
        $sourceTable = $item['source_table'] ?? 'ui_nav_items';
        $id = (int)($item['source_id'] ?? $item['id'] ?? 0);
        $order = (int)($item['order_index'] ?? $item['order'] ?? $index);

        if ($id <= 0) {
            continue;
        }

        if (!isset($ALLOWED_TABLES[$sourceTable])) {
            throw new InvalidArgumentException("Tabela inválida: $sourceTable");
        }

        $stmt = $pdo->prepare("UPDATE `$sourceTable` SET order_index = :ord WHERE id = :id");
        $stmt->execute(['ord' => $order, 'id' => $id]);
        $updatedCount += $stmt->rowCount();
    }

    $pdo->commit();

    // Cache Redis
    RedisHelper::invalidateByPattern('ui:nav:*');
    RedisHelper::close();

    ApiResponse::success([
        'message' => 'Ordenação atualizada com sucesso',
        'items_updated' => $updatedCount,
        '_cache_bust' => time()
    ]);

} catch (InvalidArgumentException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Navigation Reorder validation error: " . $e->getMessage());
    ApiResponse::error('INVALID_SOURCE_TABLE', 400, ['message' => $e->getMessage()]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Navigation Reorder error: " . $e->getMessage());
    ApiResponse::error('DATABASE_ERROR', 500);
}
