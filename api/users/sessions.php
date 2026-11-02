<?php
// API: User Sessions Management
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
        handleGetSessions();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteSession();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetSessions(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');
        // 2026-07-27: as colunas consultadas aqui NÃO existiam (`session_id`, `ip_address`,
        // `user_agent`, `last_activity`, `is_current`) — a listagem falhava 100% das vezes.
        // Nomes reais conferidos em information_schema; formato espelhado de
        // api/sessions/index.php, que é a implementação que funciona.
        $stmt = $pdo->prepare("
            SELECT
                id,
                session_token,
                device_type,
                browser,
                os,
                origin_ip,
                created_at,
                last_activity_at,
                expires_at
            FROM app_user_sessions
            WHERE user_id = ? AND is_active = 1
            ORDER BY last_activity_at DESC
            LIMIT 20
        ");
        $stmt->execute([$userId]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // SEGURANÇA: o token de sessão NUNCA sai daqui. O cliente recebe só os 8 últimos
        // caracteres, e usa o `id` da linha para encerrar a sessão. Mesmo critério de
        // api/sessions/index.php ("tokens sempre mascarados").
        $currentToken = session_id();
        foreach ($sessions as &$session) {
            $session['token_preview'] = '...' . substr((string)$session['session_token'], -8);
            $session['is_current'] = ($session['session_token'] === $currentToken);
            unset($session['session_token']);
        }
        unset($session);

        ApiResponse::success(['sessions' => $sessions]);
    } catch (Exception $e) {
        error_log("Sessions GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteSession(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    // Passa a identificar a sessão pelo `id` da linha, não pelo token: assim o cliente
    // nunca precisa possuir (nem devolver) um token de sessão. O `id` já vem na listagem.
    $input = json_decode(file_get_contents('php://input'), true);
    $rowId = $input['id'] ?? $_GET['id'] ?? null;

    if ($rowId === null || !ctype_digit((string)$rowId)) {
        ApiResponse::error('SESSION_ID_REQUIRED', 400, ['message' => 'Informe o id da sessão a encerrar.']);
        return;
    }
    $rowId = (int)$rowId;

    try {
        $pdo = getConnection('DSHOWDASH');

        // A sessão tem de ser DO usuário logado — e a atual não se encerra por aqui
        // (para isso existe o logout). A comparação com o token é feita no servidor.
        $check = $pdo->prepare("SELECT session_token FROM app_user_sessions WHERE id = ? AND user_id = ?");
        $check->execute([$rowId, $userId]);
        $alvo = $check->fetch(PDO::FETCH_ASSOC);

        if (!$alvo) {
            ApiResponse::error('SESSION_NOT_FOUND', 404);
            return;
        }
        if ((string)$alvo['session_token'] === session_id()) {
            ApiResponse::error('CANNOT_DELETE_CURRENT_SESSION', 400, ['message' => 'Use o logout para encerrar a sessão atual.']);
            return;
        }

        // Encerramento é LÓGICO (is_active=0 + logout_at/logout_reason), como em
        // api/sessions/index.php. O DELETE físico anterior descartaria a trilha.
        $stmt = $pdo->prepare("
            UPDATE app_user_sessions
               SET is_active = 0, logout_at = NOW(), logout_reason = 'user_revoked'
             WHERE id = ? AND user_id = ? AND is_active = 1
        ");
        $stmt->execute([$rowId, $userId]);

        if ($stmt->rowCount() === 0) {
            ApiResponse::error('SESSION_NOT_FOUND', 404);
            return;
        }

        ApiResponse::success(['message' => 'Sessão encerrada com sucesso']);
    } catch (Exception $e) {
        error_log("Sessions DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
