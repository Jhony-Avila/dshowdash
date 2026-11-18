<?php
// API: Security Events Management
// @version 2.3.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()
// v2.3.0: Migrado para UARPSGate + getConnection() centralizado
// v2.2.0: Migrado para InputValidator

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../_helpers/GuardaDono.php';   // UARPS-DONO (P0 17/11/2026)
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../core/helpers/InputValidator.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

UARPSGate::enforceTrigger($userId, 'gate:admin:security-events');
dshow_exigir_nivel($userId, 80, 'security-events');   // UARPS-DONO (P0 17/11/2026): nível de antes da P3 (requireAdmin = 80)

// DSHOW-009: chaves de event_context_json que a tela pode ver (lista fechada; session_token e chaves desconhecidas nunca saem)
const SE_CHAVES_DETALHE = ['device', 'username', 'request_id', 'endpoint', 'reason', 'source'];

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetEvents();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handleCreateEvent();
        break;
    case 'PUT':
    case 'PATCH':
        // DSHOW-009 opção B (18/11): "resolver evento" não tem onde gravar (sem campo de resolução; sem DDL) → 501, nada é gravado.
        AuthHelpers::requireCsrf();
        ApiResponse::error('NOT_IMPLEMENTED', 501, ['message' => 'Recurso não implantado: resolver evento de segurança ainda não tem armazenamento.']);
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteEvents();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetEvents(): void {
    $validator = InputValidator::fromGet();
    $pagination = $validator->pagination(50, 100);
    $page = $pagination['page'];
    $limit = $pagination['limit'];
    $allowedSeverities = ['critical', 'high', 'medium', 'low', 'info', 'warning'];   // + warning: valor real em app_user_security_events.event_severity
    $severity = $validator->enum('severity', '', $allowedSeverities) ?: null;
    $eventType = $validator->string('event_type', '', ['maxLength' => 100]) ?: null;
    $userId = $validator->id('user_id', 0);
    $dateFrom = $validator->string('date_from', '', ['maxLength' => 20]) ?: null;
    $dateTo = $validator->string('date_to', '', ['maxLength' => 20]) ?: null;
    $resolved = $validator->string('resolved', '', ['maxLength' => 1]) ?: null;

    $offset = $pagination['offset'];
    // DSHOW-009 (18/11): filtro opcional — ausente/vazio = sem filtro (0); não numérico = 400 VALIDATION_ERROR (padrão do settings) (antes: TypeError por passar false no parâmetro int)
    if ($validator->hasErrors()) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Parâmetros inválidos.', 'details' => $validator->getErrors()]); return; }
    if (isset($_GET['resolved']) && (string) $_GET['resolved'] !== '') { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Filtro "resolved" indisponível: a tabela de eventos não tem campo de resolução.']); return; }

    try {
        $pdo = getConnection('DSHOWDASH');

        // DSHOW-009 opção A (18/11): lê a tabela REAL app_user_security_events (a app_security_events nunca existiu).
        // Mapa explícito: severity ← event_severity · details ← event_context_json SÓ com as chaves da lista SE_CHAVES_DETALHE
        // (nunca session_token nem chave desconhecida) · message, is_resolved, resolved_by, resolved_at ← NULL (sem equivalente).
        $where = ['se.deleted_at IS NULL'];
        $params = [];

        if ($severity) {
            $where[] = "se.event_severity = ?";
            $params[] = $severity;
        }

        if ($eventType) {
            $where[] = "se.event_type = ?";
            $params[] = $eventType;
        }

        if ($userId) {
            $where[] = "se.user_id = ?";
            $params[] = $userId;
        }

        if ($dateFrom) {
            $where[] = "se.created_at >= ?";
            $params[] = $dateFrom;
        }

        if ($dateTo) {
            $where[] = "se.created_at <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM app_user_security_events se {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                se.id,
                se.event_type,
                se.event_severity AS severity,
                NULL AS message,
                se.event_context_json AS details,
                se.user_id,
                u.username AS user_name   /* app_users sem coluna name (DSHOW-009) */,
                u.email as user_email,
                se.ip_address,
                se.user_agent,
                NULL AS is_resolved,
                NULL AS resolved_by,
                NULL AS resolved_at,
                se.created_at
            FROM app_user_security_events se
            LEFT JOIN app_users u ON se.user_id = u.id
            {$whereClause}
            ORDER BY se.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($events as &$event) {
            $event['is_resolved'] = null;   // sem campo de resolução na tabela real (nunca inventado)
            $ctx = $event['details'] ? json_decode((string) $event['details'], true) : null;
            $event['details'] = is_array($ctx) ? array_intersect_key($ctx, array_flip(SE_CHAVES_DETALHE)) : null;
        }
        unset($event);

        // stats: sem campo de resolução, conta TODOS os eventos não excluídos por severidade (stats_escopo informa isso à tela)
        $statsStmt = $pdo->query("
            SELECT 
                event_severity,
                COUNT(*) as count
            FROM app_user_security_events
            WHERE deleted_at IS NULL
            GROUP BY event_severity
        ");
        $stats = $statsStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        ApiResponse::success([
            'events' => $events,
            'stats' => [
                'critical' => (int)($stats['critical'] ?? 0),
                'high' => (int)($stats['high'] ?? 0),
                'medium' => (int)($stats['medium'] ?? 0),
                'low' => (int)($stats['low'] ?? 0),
                'info' => (int)($stats['info'] ?? 0),
                'warning' => (int)($stats['warning'] ?? 0)
            ],
            'stats_escopo' => 'todos (a tabela não registra resolução)',
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (Exception $e) {
        error_log("SecurityEvents GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleCreateEvent(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $eventType = $input['event_type'] ?? null;
    $message = $input['message'] ?? null;

    if (!$eventType || !$message) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'event_type e message são obrigatórios']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_security_events 
            (event_type, severity, message, details, user_id, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $eventType,
            $input['severity'] ?? 'info',
            $message,
            isset($input['details']) ? json_encode($input['details']) : null,
            $input['user_id'] ?? $_SESSION['user_id'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

        ApiResponse::success([
            'message' => 'Evento registrado com sucesso',
            'event_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("SecurityEvents POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateEvent(): void {
    $validator = InputValidator::fromGet();
    $input = json_decode(file_get_contents('php://input'), true);
    $eventId = (int) ($input['id'] ?? $validator->id('id', 0));   // DSHOW-009: 0 = ausente → MISSING_EVENT_ID abaixo (antes: TypeError)

    if (!$eventId) {
        ApiResponse::error('MISSING_EVENT_ID', 400);
        return;
    }

    $action = $input['action'] ?? 'resolve';

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($action === 'resolve') {
            $stmt = $pdo->prepare("
                UPDATE app_security_events 
                SET is_resolved = 1, resolved_by = ?, resolved_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$_SESSION['user_id'] ?? null, $eventId]);

            if ($stmt->rowCount() === 0) {
                ApiResponse::error('EVENT_NOT_FOUND', 404);
                return;
            }

            ApiResponse::success(['message' => 'Evento marcado como resolvido']);
            return;
        }

        if ($action === 'unresolve') {
            $stmt = $pdo->prepare("
                UPDATE app_security_events 
                SET is_resolved = 0, resolved_by = NULL, resolved_at = NULL
                WHERE id = ?
            ");
            $stmt->execute([$eventId]);

            if ($stmt->rowCount() === 0) {
                ApiResponse::error('EVENT_NOT_FOUND', 404);
                return;
            }

            ApiResponse::success(['message' => 'Evento reaberto']);
            return;
        }

        if ($action === 'bulk_resolve' && isset($input['ids'])) {
            $ids = $input['ids'];
            if (empty($ids)) {
                ApiResponse::error('EMPTY_IDS', 400);
                return;
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $params = array_merge([$_SESSION['user_id'] ?? null], $ids);

            $stmt = $pdo->prepare("
                UPDATE app_security_events 
                SET is_resolved = 1, resolved_by = ?, resolved_at = NOW()
                WHERE id IN ({$placeholders})
            ");
            $stmt->execute($params);

            ApiResponse::success([
                'message' => 'Eventos marcados como resolvidos',
                'count' => $stmt->rowCount()
            ]);
            return;
        }

        ApiResponse::error('INVALID_ACTION', 400);

    } catch (Exception $e) {
        error_log("SecurityEvents UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteEvents(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    $olderThan = $input['older_than'] ?? null;
    $severity = $input['severity'] ?? null;
    $onlyResolved = $input['only_resolved'] ?? true;

    if (!$olderThan) {
        ApiResponse::error('MISSING_DATE', 400, ['message' => 'older_than é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $where = ["created_at < ?"];
        $params = [$olderThan];

        if ($severity) {
            $where[] = "severity = ?";
            $params[] = $severity;
        }

        if ($onlyResolved) {
            $where[] = "is_resolved = 1";
        }

        $whereClause = implode(' AND ', $where);

        $stmt = $pdo->prepare("DELETE FROM app_security_events WHERE {$whereClause}");
        $stmt->execute($params);

        ApiResponse::success([
            'message' => 'Eventos excluídos com sucesso',
            'deleted_count' => $stmt->rowCount()
        ]);

    } catch (Exception $e) {
        error_log("SecurityEvents DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
