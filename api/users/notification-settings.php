<?php
// API: Notification Settings
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - Migrado para getConnection() centralizado
// v2.2.0: Removida getDbConnection() local

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet();
        break;
    case 'POST':
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdate();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGet(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');
        $stmt = $pdo->prepare("
            SELECT 
                email_notifications,
                push_notifications,
                sms_notifications,
                notification_frequency,
                quiet_hours_start,
                quiet_hours_end
            FROM app_user_preferences 
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$settings) {
            $settings = [
                'email_notifications' => true,
                'push_notifications' => true,
                'sms_notifications' => false,
                'notification_frequency' => 'instant',
                'quiet_hours_start' => null,
                'quiet_hours_end' => null
            ];
        }

        ApiResponse::success($settings);
    } catch (Exception $e) {
        error_log("NotificationSettings GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdate(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_user_preferences (user_id, email_notifications, push_notifications, sms_notifications, notification_frequency, quiet_hours_start, quiet_hours_end)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                email_notifications = VALUES(email_notifications),
                push_notifications = VALUES(push_notifications),
                sms_notifications = VALUES(sms_notifications),
                notification_frequency = VALUES(notification_frequency),
                quiet_hours_start = VALUES(quiet_hours_start),
                quiet_hours_end = VALUES(quiet_hours_end)
        ");

        $stmt->execute([
            $userId,
            $input['email_notifications'] ?? true,
            $input['push_notifications'] ?? true,
            $input['sms_notifications'] ?? false,
            $input['notification_frequency'] ?? 'instant',
            $input['quiet_hours_start'] ?? null,
            $input['quiet_hours_end'] ?? null
        ]);

        ApiResponse::success(['message' => 'Configurações atualizadas com sucesso']);
    } catch (Exception $e) {
        error_log("NotificationSettings UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
