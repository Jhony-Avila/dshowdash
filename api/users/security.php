<?php
// API: User Security Settings
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
        handleGetSecurity();
        break;
    case 'POST':
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdateSecurity();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetSecurity(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            SELECT 
                two_factor_enabled,
                two_factor_method,
                login_alerts,
                session_timeout,
                ip_whitelist,
                last_password_change,
                password_expires_at
            FROM app_user_security
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $security = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$security) {
            $security = [
                'two_factor_enabled' => false,
                'two_factor_method' => null,
                'login_alerts' => true,
                'session_timeout' => 3600,
                'ip_whitelist' => null,
                'last_password_change' => null,
                'password_expires_at' => null
            ];
        } else {
            $security['two_factor_enabled'] = (bool)$security['two_factor_enabled'];
            $security['login_alerts'] = (bool)$security['login_alerts'];
            if ($security['ip_whitelist']) {
                $security['ip_whitelist'] = json_decode($security['ip_whitelist'], true);
            }
        }

        $sessionsStmt = $pdo->prepare("
            SELECT COUNT(*) as active_sessions
            FROM app_user_sessions
            WHERE user_id = ? AND is_active = 1
              AND last_activity_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $sessionsStmt->execute([$userId]);
        $sessions = $sessionsStmt->fetch(PDO::FETCH_ASSOC);

        $security['active_sessions'] = (int)($sessions['active_sessions'] ?? 0);

        ApiResponse::success(['security' => $security]);

    } catch (Exception $e) {
        error_log("UserSecurity GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateSecurity(): void {
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

        $checkStmt = $pdo->prepare("SELECT user_id FROM app_user_security WHERE user_id = ?");
        $checkStmt->execute([$userId]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $updates = [];
            $params = [];

            if (isset($input['two_factor_enabled'])) {
                $updates[] = "two_factor_enabled = ?";
                $params[] = (int)$input['two_factor_enabled'];
            }

            if (isset($input['two_factor_method'])) {
                $updates[] = "two_factor_method = ?";
                $params[] = $input['two_factor_method'];
            }

            if (isset($input['login_alerts'])) {
                $updates[] = "login_alerts = ?";
                $params[] = (int)$input['login_alerts'];
            }

            if (isset($input['session_timeout'])) {
                $updates[] = "session_timeout = ?";
                $params[] = (int)$input['session_timeout'];
            }

            if (isset($input['ip_whitelist'])) {
                $updates[] = "ip_whitelist = ?";
                $params[] = is_array($input['ip_whitelist']) ? json_encode($input['ip_whitelist']) : $input['ip_whitelist'];
            }

            if (empty($updates)) {
                ApiResponse::error('NO_UPDATES', 400);
                return;
            }

            $updates[] = "updated_at = NOW()";
            $params[] = $userId;

            $sql = "UPDATE app_user_security SET " . implode(', ', $updates) . " WHERE user_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO app_user_security 
                (user_id, two_factor_enabled, two_factor_method, login_alerts, session_timeout, ip_whitelist, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $stmt->execute([
                $userId,
                (int)($input['two_factor_enabled'] ?? 0),
                $input['two_factor_method'] ?? null,
                (int)($input['login_alerts'] ?? 1),
                (int)($input['session_timeout'] ?? 3600),
                isset($input['ip_whitelist']) ? json_encode($input['ip_whitelist']) : null
            ]);
        }

        ApiResponse::success(['message' => 'Configurações de segurança atualizadas']);

    } catch (Exception $e) {
        error_log("UserSecurity UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
