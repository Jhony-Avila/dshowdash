<?php
declare(strict_types=1);

// /api/sessions/index.php - Gerenciamento de sessões do usuário
// @version 2.3.0-ENTERPRISE - Migrado para _init.php
// @updated 2026-01-21
// P3.3: Migrado para padrão _init.php (CorsPolicy + RedisHelper + InputValidator)
// P3.2: Adicionado CSRF para action revoke
// P0.1: Migrado applyCors() para CorsPolicy::setupApiEndpoint()

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/bootstrap.php';
require_once __DIR__ . '/../../config/db_connection.php';

// Método
requireMethod(['GET', 'POST', 'DELETE', 'OPTIONS']);

// Auth
$user = requireAuth();
$userId = $user['user_id'];

$action = $_GET['action'] ?? 'list';

try {
    $pdo = getDbConnection('DSHOWDASH');
    
    switch ($action) {
        case 'list':
            // scope=all + ADMIN (level>=80, gate server-side autoritativo) => TODAS as sessões ativas
            // (visão read-only cross-user + identificação do usuário). Caso contrário, só as próprias.
            // SEGURANÇA: tokens sempre mascarados; nenhuma revogação cross-user é exposta (revoke exige o
            // token completo, indisponível; revoke_all é escopado ao próprio user_id). 2026-07-08.
            $scope = $_GET['scope'] ?? 'mine';
            $isAdmin = (int)($user['level'] ?? 0) >= 80;
            $adminAll = ($scope === 'all' && $isAdmin);

            if ($adminAll) {
                $stmt = $pdo->prepare("
                    SELECT s.id, s.session_token, s.user_id, u.username AS user_name, u.email AS user_email,
                           s.device_type, s.browser, s.os, s.origin_ip,
                           s.is_active, s.created_at, s.last_activity_at, s.expires_at
                    FROM app_user_sessions s
                    LEFT JOIN app_users u ON u.id = s.user_id
                    WHERE s.is_active = 1
                    ORDER BY s.last_activity_at DESC
                    LIMIT 1000
                ");
                $stmt->execute();
            } else {
                $stmt = $pdo->prepare("
                    SELECT id, session_token, device_type, browser, os, origin_ip,
                           is_active, created_at, last_activity_at, expires_at
                    FROM app_user_sessions
                    WHERE user_id = ? AND is_active = 1
                    ORDER BY last_activity_at DESC
                ");
                $stmt->execute([$userId]);
            }
            $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Mascarar tokens (mostrar apenas últimos 8 chars)
            $currentToken = session_id();
            foreach ($sessions as &$session) {
                $session['token_preview'] = '...' . substr((string)$session['session_token'], -8);
                $session['is_current'] = ($session['session_token'] === $currentToken);
                unset($session['session_token']);
            }
            unset($session);

            ApiResponse::success($sessions, [
                'count' => count($sessions),
                'scope' => $adminAll ? 'all' : 'mine',
                'capped' => $adminAll && count($sessions) >= 1000
            ]);
            break;
            
        case 'current':
            // Detalhes da sessão atual
            $currentToken = session_id();
            $stmt = $pdo->prepare("
                SELECT device_type, browser, os, origin_ip, created_at, last_activity_at, expires_at
                FROM app_user_sessions 
                WHERE session_token = ? AND user_id = ?
            ");
            $stmt->execute([$currentToken, $userId]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$session) {
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Sessão não encontrada']);
            }
            
            ApiResponse::success($session);
            break;
            
        case 'create':
            // Criar nova sessão (para uso programático)
            requireMethod('POST');
            requireCsrf();
            
            $sessionToken = bin2hex(random_bytes(32));
            $stmt = $pdo->prepare("
                INSERT INTO app_user_sessions 
                (user_id, session_token, device_type, browser, os, origin_ip, is_active, expires_at)
                VALUES (?, ?, 'api', 'API Client', 'Unknown', ?, 1, DATE_ADD(NOW(), INTERVAL 7 DAY))
            ");
            $stmt->execute([$userId, $sessionToken, $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
            
            ApiResponse::success(['session_token' => $sessionToken], ['message' => 'Sessão criada']);
            break;
            
        case 'refresh':
            // Atualizar atividade da sessão atual
            $currentToken = session_id();
            $stmt = $pdo->prepare("
                UPDATE app_user_sessions 
                SET last_activity_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
                WHERE session_token = ? AND user_id = ?
            ");
            $stmt->execute([$currentToken, $userId]);
            
            ApiResponse::success(null, ['updated' => $stmt->rowCount() > 0]);
            break;
            
        case 'revoke':
            // Revogar uma sessão específica
            requireMethod(['POST', 'DELETE']);
            requireCsrf();

            $token = $_GET['token'] ?? $_POST['token'] ?? null;
            if (!$token) {
                ApiResponse::error('TOKEN_REQUIRED', 400, ['message' => 'Token da sessão é obrigatório']);
            }
            
            // Não permitir revogar a própria sessão por este método
            if ($token === session_id()) {
                ApiResponse::error('CANNOT_REVOKE_CURRENT', 400, ['message' => 'Use logout para encerrar a sessão atual']);
            }
            
            $stmt = $pdo->prepare("UPDATE app_user_sessions SET is_active = 0 WHERE session_token = ? AND user_id = ?");
            $stmt->execute([$token, $userId]);
            
            ApiResponse::success(null, ['revoked' => $stmt->rowCount() > 0]);
            break;
            
        case 'revoke_all':
            // Revogar todas as sessões exceto a atual
            requireMethod(['POST', 'DELETE']);
            requireCsrf();
            
            $currentToken = session_id();
            $stmt = $pdo->prepare("
                UPDATE app_user_sessions 
                SET is_active = 0 
                WHERE user_id = ? AND session_token != ? AND is_active = 1
            ");
            $stmt->execute([$userId, $currentToken]);
            
            ApiResponse::success(null, [
                'revoked_count' => $stmt->rowCount(),
                'message' => 'Todas as outras sessões foram encerradas'
            ]);
            break;

        case 'revoke_by_id':
            // Revogar sessões por ID (PK app_user_sessions). Individual ou em massa.
            // SEGURANÇA: não-admin só revoga as PRÓPRIAS (filtro user_id); ADMIN (level>=80) pode cross-user;
            // NUNCA a sessão atual (session_token <> current); tokens nunca trafegam. 2026-07-08.
            requireMethod(['POST', 'DELETE']);
            requireCsrf();

            $body = json_decode(file_get_contents('php://input'), true);
            if (!is_array($body)) { $body = []; }
            $rawIds = $body['ids'] ?? (isset($body['id']) ? [$body['id']] : ($_POST['ids'] ?? $_GET['ids'] ?? []));
            if (!is_array($rawIds)) { $rawIds = [$rawIds]; }
            $ids = array_values(array_unique(array_filter(array_map('intval', $rawIds), function ($v) { return $v > 0; })));
            if (empty($ids)) {
                ApiResponse::error('IDS_REQUIRED', 400, ['message' => 'IDs de sessão são obrigatórios']);
            }

            $isAdmin = (int)($user['level'] ?? 0) >= 80;
            $currentToken = session_id();
            $placeholders = implode(',', array_fill(0, count($ids), '?'));

            if ($isAdmin) {
                $sql = "UPDATE app_user_sessions SET is_active = 0 WHERE id IN ($placeholders) AND is_active = 1 AND session_token <> ?";
                $params = array_merge($ids, [$currentToken]);
            } else {
                $sql = "UPDATE app_user_sessions SET is_active = 0 WHERE id IN ($placeholders) AND user_id = ? AND is_active = 1 AND session_token <> ?";
                $params = array_merge($ids, [$userId, $currentToken]);
            }
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $revoked = $stmt->rowCount();

            ApiResponse::success(null, [
                'requested' => count($ids),
                'revoked' => $revoked,
                'skipped' => count($ids) - $revoked,
                'cross_user' => $isAdmin
            ]);
            break;

        default:
            ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
    }
    
} catch (PDOException $e) {
    error_log("[sessions/index.php] DB Error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['message' => 'Erro de banco de dados']);
} catch (Exception $e) {
    ApiResponse::exception($e);
}
