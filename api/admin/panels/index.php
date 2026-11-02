<?php
/**
 * Panel Admin API — List & Update panels
 * @version 1.0.0
 * @created 2026-03-29
 *
 * GET  /api/admin/panels         → Lista paineis com thumbnail, paginacao, filtros
 * PATCH /api/admin/panels?id=X   → Atualiza metadados de um painel
 */

declare(strict_types=1);

require_once __DIR__ . '/../../admin/_init.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';

header('Content-Type: application/json; charset=utf-8');

const UARPS_TRIGGER_PANELS_READ  = 'gate:admin:panels';
const UARPS_TRIGGER_PANELS_WRITE = 'gate:admin:panels:edit';

// ─── Auth ───
function enforcePanelsRead(): array {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::checkTrigger($userId, UARPS_TRIGGER_PANELS_READ);
    }
    return $session;
}

function enforcePanelsWrite(): array {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::enforceTrigger($userId, UARPS_TRIGGER_PANELS_WRITE, 'api/admin/panels');
    }
    requireCsrfForWrite();
    return $session;
}

// ─── Router ───
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Sub-route dispatch via PATH_INFO (nginx catch-all sends all /api/admin/panels/* here)
$pathInfo = $_SERVER['PATH_INFO'] ?? '';
if ($pathInfo === '') {
    // Try extracting from REQUEST_URI
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('#/api/admin/panels(/[a-zA-Z0-9_/-]+)#', $uri, $pm)) {
        $pathInfo = $pm[1];
    }
}

// Dispatch: /panel-id/screenshots → screenshots.php
if (preg_match('#^/([a-zA-Z0-9_-]+)/screenshots$#', $pathInfo, $subMatch)) {
    $_GET['panel_id'] = $subMatch[1];
    require __DIR__ . '/screenshots.php';
    exit;
}

// Dispatch: /panel-id/screenshot → screenshot.php
if (preg_match('#^/([a-zA-Z0-9_-]+)/screenshot$#', $pathInfo, $subMatch)) {
    $_GET['panel_id'] = $subMatch[1];
    require __DIR__ . '/screenshot.php';
    exit;
}

try {
    switch ($method) {
        case 'GET':
            handleGetPanels();
            break;
        case 'PATCH':
            handlePatchPanel();
            break;
        case 'OPTIONS':
            http_response_code(204);
            exit;
        default:
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
} catch (Throwable $e) {
    ApiResponse::exception($e);
}

// ═══════════════════════════════════════════════════
// GET /api/admin/panels
// ═══════════════════════════════════════════════════
function handleGetPanels(): void {
    enforcePanelsRead();

    $pdo = getConnection('DSHOWDASH');
    $input = new InputValidator($_GET);

    $category = $input->string('category', '', ['maxLength' => 50]);
    $status   = $input->string('status', 'all', ['maxLength' => 10]);
    $search   = $input->string('search', '', ['maxLength' => 100]);
    $page     = max(1, $input->int('page', 1));
    $perPage  = min(200, max(1, $input->int('per_page', 50)));
    $sort     = $input->string('sort', 'sort_order', ['maxLength' => 30]);
    $order    = strtoupper($input->string('order', 'asc', ['maxLength' => 4]));

    // Whitelist sort columns
    $allowedSort = ['sort_order', 'panel_id', 'title', 'category', 'is_active', 'updated_at', 'created_at'];
    if (!in_array($sort, $allowedSort, true)) {
        $sort = 'sort_order';
    }
    if (!in_array($order, ['ASC', 'DESC'], true)) {
        $order = 'ASC';
    }

    // Build WHERE
    $where = [];
    $params = [];

    if ($category !== '') {
        $where[] = 'pr.category = ?';
        $params[] = $category;
    }
    if ($status === 'active') {
        $where[] = 'pr.is_active = 1';
    } elseif ($status === 'inactive') {
        $where[] = 'pr.is_active = 0';
    }
    if ($search !== '') {
        $where[] = '(pr.title LIKE ? OR pr.panel_id LIKE ?)';
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }

    $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

    // Count total
    $countSql = "SELECT COUNT(*) FROM panel_registry pr {$whereClause}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $offset = ($page - 1) * $perPage;

    // Main query — subquery for route to avoid cartesian product
    $sql = "
        SELECT
            pr.panel_id,
            pr.module_name,
            pr.title,
            pr.description,
            pr.category,
            pr.icon,
            pr.is_active,
            pr.sort_order,
            pr.thumbnail_path,
            pr.thumbnail_updated_at,
            pr.tags,
            pr.version,
            pr.author,
            pr.created_at,
            pr.updated_at,
            (SELECT r.route_clean
             FROM app_nav_route_resolution_active a
             JOIN app_nav_route_resolution_revision rev ON a.resolution_rev_id = rev.resolution_rev_id
             JOIN app_nav_destination d ON rev.destination_id = d.destination_id
             JOIN app_nav_route r ON a.route_id = r.route_id AND r.is_active = 1
             WHERE d.destination_key = pr.panel_id
             LIMIT 1) AS route,
            (SELECT COUNT(*) FROM panel_screenshots ps WHERE ps.panel_id = pr.panel_id) AS screenshot_count,
            (SELECT ps2.captured_at FROM panel_screenshots ps2
             WHERE ps2.panel_id = pr.panel_id ORDER BY ps2.captured_at DESC LIMIT 1) AS last_screenshot_at
        FROM panel_registry pr
        {$whereClause}
        ORDER BY pr.{$sort} {$order}, pr.panel_id ASC
        LIMIT {$perPage} OFFSET {$offset}
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format rows
    $data = array_map(function (array $row): array {
        $thumbnailPath = $row['thumbnail_path'];
        $thumbnailUrl = $thumbnailPath
            ? '/storage/media/images/' . ltrim($thumbnailPath, '/')
            : null;

        return [
            'panel_id'              => $row['panel_id'],
            'module_name'           => $row['module_name'],
            'title'                 => $row['title'],
            'description'           => $row['description'],
            'category'              => $row['category'],
            'icon'                  => $row['icon'],
            'is_active'             => (bool)(int)$row['is_active'],
            'sort_order'            => (int)$row['sort_order'],
            'thumbnail_path'        => $thumbnailPath,
            'thumbnail_url'         => $thumbnailUrl,
            'thumbnail_updated_at'  => $row['thumbnail_updated_at'],
            'tags'                  => $row['tags'] ? json_decode($row['tags'], true) : [],
            'version'               => $row['version'],
            'author'                => $row['author'],
            'route'                 => $row['route'],
            'screenshot_count'      => (int)$row['screenshot_count'],
            'last_screenshot_at'    => $row['last_screenshot_at'],
            'created_at'            => $row['created_at'],
            'updated_at'            => $row['updated_at'],
        ];
    }, $rows);

    ApiResponse::success($data, [
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => $totalPages,
        'filters'     => [
            'category' => $category ?: null,
            'status'   => $status,
            'search'   => $search ?: null,
        ],
    ]);
}

// ═══════════════════════════════════════════════════
// PATCH /api/admin/panels?id=panel-XX
// ═══════════════════════════════════════════════════
function handlePatchPanel(): void {
    enforcePanelsWrite();

    $panelId = $_GET['id'] ?? '';
    if ($panelId === '') {
        ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400);
    }

    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body) || empty($body)) {
        ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400);
    }

    $pdo = getConnection('DSHOWDASH');

    // Check panel exists
    $check = $pdo->prepare("SELECT panel_id FROM panel_registry WHERE panel_id = ?");
    $check->execute([$panelId]);
    if (!$check->fetch()) {
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => "Painel '$panelId' nao encontrado"]);
    }

    // Allowed fields with validation
    $allowed = [
        'title'       => ['type' => 'string', 'max' => 150],
        'description' => ['type' => 'string', 'max' => 2000, 'nullable' => true],
        'is_active'   => ['type' => 'bool'],
        'category'    => ['type' => 'string', 'max' => 50],
        'icon'        => ['type' => 'string', 'max' => 100],
        'sort_order'  => ['type' => 'int', 'min' => 0],
        'tags'        => ['type' => 'json_array', 'max_items' => 20],
        'version'     => ['type' => 'string', 'max' => 20],
        'author'      => ['type' => 'string', 'max' => 100],
    ];

    $sets = [];
    $params = [];
    $updatedFields = [];

    foreach ($body as $field => $value) {
        if (!isset($allowed[$field])) {
            continue;
        }

        $rules = $allowed[$field];

        // Validate
        switch ($rules['type']) {
            case 'string':
                if ($value !== null && !is_string($value)) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => "Campo '$field' deve ser string"]);
                }
                if ($value !== null && isset($rules['max']) && mb_strlen($value) > $rules['max']) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => "Campo '$field' excede {$rules['max']} caracteres"]);
                }
                if ($value === '' && $field === 'title') {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => "Campo 'title' nao pode ser vazio"]);
                }
                break;

            case 'bool':
                $value = $value ? 1 : 0;
                break;

            case 'int':
                $value = (int)$value;
                if (isset($rules['min']) && $value < $rules['min']) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => "Campo '$field' deve ser >= {$rules['min']}"]);
                }
                break;

            case 'json_array':
                if (!is_array($value)) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => "Campo '$field' deve ser array"]);
                }
                if (isset($rules['max_items']) && count($value) > $rules['max_items']) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => "Campo '$field' excede {$rules['max_items']} itens"]);
                }
                $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                break;
        }

        $sets[] = "$field = ?";
        $params[] = $value;
        $updatedFields[] = $field;
    }

    if (empty($sets)) {
        ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Nenhum campo valido para atualizar']);
    }

    // Always update updated_at
    $sets[] = "updated_at = NOW()";
    $params[] = $panelId;

    $sql = "UPDATE panel_registry SET " . implode(', ', $sets) . " WHERE panel_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // If is_active changed, regenerate orchestrator manifest
    if (in_array('is_active', $updatedFields, true)) {
        exec('php /var/www/dshowdash/scripts/generate-orchestrator-manifest.php > /dev/null 2>&1 &');
    }

    ApiResponse::success([
        'panel_id'       => $panelId,
        'updated_fields' => $updatedFields,
        'updated_at'     => date('c'),
    ], [
        'message' => 'Painel atualizado com sucesso',
    ]);
}
