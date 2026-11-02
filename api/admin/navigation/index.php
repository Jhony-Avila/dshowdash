<?php
/**
 * Navigation Admin API — Unified Triggers Management
 * @version 4.1.0-AVAILABLE-ROUTES
 * @description API unificada de administração de TODOS os triggers de navegação
 *   Lê de 4 tabelas via UNION: ui_nav_items, navrail_items, header_components, footer_items
 *   Mutações roteadas para a tabela correta conforme display_context
 *
 * GET endpoints:
 *   ?action=manifest         → seções + items (todas as tabelas)
 *   ?action=available-routes → lista de route_paths + panel_ids disponíveis
 *   /items (default)         → lista unificada de todos os triggers
 *   /sections                → grupos de todas as tabelas
 *   /tree                    → árvore hierárquica por display_context
 *
 * POST /items         → criar item (display_context determina tabela)
 * POST /sections      → criar grupo/seção
 * POST /reorder       → reordenar items
 * PATCH /items?id=X   → atualizar item (source_table determina tabela)
 * DELETE /items?id=X  → soft-delete item
 */

declare(strict_types=1);

require_once __DIR__ . '/../../admin/_init.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';
require_once __DIR__ . '/../../core/AuditLogger.php';
require_once __DIR__ . '/../../core/helpers/RedisHelper.php';

header('Content-Type: application/json; charset=utf-8');

const UARPS_TRIGGER_NAV_READ  = 'gate:admin:navigation';
const UARPS_TRIGGER_NAV_WRITE = 'gate:admin:navigation:write';
const API_VERSION = '4.1.0-AVAILABLE-ROUTES';

// ─── Source table constants ───
const SRC_SIDEBAR  = 'ui_nav_items';
const SRC_NAVRAIL  = 'navrail_items';
const SRC_HEADER   = 'header_components';
const SRC_FOOTER   = 'footer_items';

// ─── Cache invalidation ───
function invalidateNavCache(): void {
    $removed = RedisHelper::invalidateByPattern('ui:nav:*');
    RedisHelper::close();
    if ($removed > 0) {
        error_log("[NavAdmin] Cache invalidated: {$removed} keys removed");
    }
}

// ─── Auth helpers ───
function enforceNavReadAccess(): array {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::checkTrigger($userId, UARPS_TRIGGER_NAV_READ);
    }
    return $session;
}

function enforceNavWriteAccess(): int {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::enforceTrigger($userId, UARPS_TRIGGER_NAV_WRITE, 'api/admin/navigation');
    }
    return $userId;
}

// ─── Unified UNION query for all triggers ───
function buildUnifiedItemsQuery(): string {
    return "
    SELECT * FROM (
        -- SIDEBAR: ui_nav_items (navigation items only, skip groups)
        SELECT
            u.id                                   AS source_id,
            'ui_nav_items'                         AS source_table,
            'sidebar'                              AS display_context,
            u.item_key                             AS item_key,
            u.label                                AS label,
            u.display_title                        AS display_title,
            u.icon                                 AS icon_name,
            u.item_type                            AS item_type,
            u.route_path                           AS route_path,
            u.panel_id                             AS panel_id,
            u.parent_key                           AS parent_key,
            COALESCE(sg.label, '')                 AS parent_label,
            u.order_index                          AS order_index,
            COALESCE(sg.order_index, 999)          AS parent_order_index,
            u.is_active                            AS is_active,
            u.is_visible                           AS is_visible,
            u.min_level                            AS min_level,
            u.uarps_trigger_id                     AS uarps_trigger_id,
            u.description                          AS description,
            u.created_at                           AS created_at,
            u.updated_at                           AS updated_at
        FROM ui_nav_items u
        LEFT JOIN sidebar_groups sg ON sg.group_key = u.parent_key
        WHERE u.item_type = 'navigation' AND u.is_active = 1

        UNION ALL

        -- NAVRAIL: navrail_items
        SELECT
            n.id                                   AS source_id,
            'navrail_items'                        AS source_table,
            'navrail'                              AS display_context,
            n.item_key                             AS item_key,
            n.label                                AS label,
            n.display_title                        AS display_title,
            n.icon_name                            AS icon_name,
            n.action_type                          AS item_type,
            NULL                                   AS route_path,
            JSON_UNQUOTE(JSON_EXTRACT(n.action_data, '$.panelId')) AS panel_id,
            ng.group_key                           AS parent_key,
            COALESCE(ng.label, '')                 AS parent_label,
            n.order_index                          AS order_index,
            COALESCE(ng.order_index, n.order_index) AS parent_order_index,
            n.is_active                            AS is_active,
            n.is_visible                           AS is_visible,
            n.min_access_level                     AS min_level,
            n.uarps_trigger_id                     AS uarps_trigger_id,
            n.tooltip                              AS description,
            n.created_at                           AS created_at,
            n.updated_at                           AS updated_at
        FROM navrail_items n
        LEFT JOIN navrail_groups ng ON n.group_id = ng.id
        WHERE n.is_deleted = 0 AND n.is_active = 1

        UNION ALL

        -- HEADER: header_components
        SELECT
            h.id                                   AS source_id,
            'header_components'                    AS source_table,
            'header'                               AS display_context,
            h.component_key                        AS item_key,
            h.label                                AS label,
            NULL                                   AS display_title,
            h.icon_name                            AS icon_name,
            h.component_type                       AS item_type,
            NULL                                   AS route_path,
            NULL                                   AS panel_id,
            hg.group_key                           AS parent_key,
            COALESCE(hg.label, '')                 AS parent_label,
            h.order_index                          AS order_index,
            COALESCE(hg.order_index, h.order_index) AS parent_order_index,
            h.is_active                            AS is_active,
            h.is_visible                           AS is_visible,
            h.min_access_level                     AS min_level,
            h.uarps_trigger_id                     AS uarps_trigger_id,
            h.description                          AS description,
            h.created_at                           AS created_at,
            h.updated_at                           AS updated_at
        FROM header_components h
        LEFT JOIN header_groups hg ON h.group_id = hg.id
        WHERE h.is_deleted = 0 AND h.is_active = 1

        UNION ALL

        -- FOOTER: footer_items
        SELECT
            f.id                                   AS source_id,
            'footer_items'                         AS source_table,
            'footer'                               AS display_context,
            f.item_key                             AS item_key,
            f.label                                AS label,
            NULL                                   AS display_title,
            f.icon_name                            AS icon_name,
            f.action_type                          AS item_type,
            NULL                                   AS route_path,
            JSON_UNQUOTE(JSON_EXTRACT(f.action_data, '$.panelId')) AS panel_id,
            f.group_name                           AS parent_key,
            COALESCE(f.group_name, '')             AS parent_label,
            f.order_index                          AS order_index,
            f.order_index                          AS parent_order_index,
            f.is_active                            AS is_active,
            f.is_visible                           AS is_visible,
            f.min_access_level                     AS min_level,
            NULL                                   AS uarps_trigger_id,
            f.tooltip                              AS description,
            f.created_at                           AS created_at,
            f.updated_at                           AS updated_at
        FROM footer_items f
        WHERE f.is_active = 1
    ) AS unified
    ORDER BY
        FIELD(display_context, 'sidebar', 'navrail', 'header', 'footer'),
        parent_order_index ASC,
        order_index ASC
    ";
}

// ─── Unified sections/groups query ───
function buildUnifiedSectionsQuery(string $context = ''): string {
    // v4.2.0: Optional context filter — whitelist to prevent injection
    $validContexts = ['sidebar', 'navrail', 'header', 'footer'];
    $contextFilter = '';
    if ($context !== '' && in_array($context, $validContexts, true)) {
        $contextFilter = " WHERE display_context = '$context'";
    }
    return "
    SELECT * FROM (
        -- SIDEBAR groups
        SELECT
            u.id           AS source_id,
            'ui_nav_items' AS source_table,
            'sidebar'      AS display_context,
            u.item_key     AS group_key,
            u.label        AS label,
            u.icon         AS icon_name,
            u.order_index  AS order_index,
            u.is_active    AS is_active,
            u.is_visible   AS is_visible,
            u.parent_key   AS parent_key,
            u.created_at   AS created_at,
            u.updated_at   AS updated_at
        FROM ui_nav_items u
        WHERE u.item_type = 'group' AND u.is_active = 1

        UNION ALL

        -- NAVRAIL groups
        SELECT
            ng.id              AS source_id,
            'navrail_groups'   AS source_table,
            'navrail'          AS display_context,
            ng.group_key       AS group_key,
            ng.label           AS label,
            ng.icon_name       AS icon_name,
            ng.order_index     AS order_index,
            ng.is_active       AS is_active,
            1                  AS is_visible,
            NULL               AS parent_key,
            ng.created_at      AS created_at,
            ng.updated_at      AS updated_at
        FROM navrail_groups ng
        WHERE ng.is_deleted = 0 AND ng.is_active = 1

        UNION ALL

        -- HEADER groups
        SELECT
            hg.id              AS source_id,
            'header_groups'    AS source_table,
            'header'           AS display_context,
            hg.group_key       AS group_key,
            hg.label           AS label,
            hg.icon_name       AS icon_name,
            hg.order_index     AS order_index,
            hg.is_active       AS is_active,
            1                  AS is_visible,
            NULL               AS parent_key,
            hg.created_at      AS created_at,
            hg.updated_at      AS updated_at
        FROM header_groups hg
        WHERE hg.is_deleted = 0 AND hg.is_active = 1
    ) AS unified_sections
    $contextFilter
    ORDER BY
        FIELD(display_context, 'sidebar', 'navrail', 'header', 'footer'),
        order_index
    ";
}

// ─── v4.1.0: Available routes query ───
function buildAvailableRoutesQuery(): string {
    return "
    SELECT DISTINCT route_path AS value, 'route' AS type
    FROM ui_nav_items
    WHERE route_path IS NOT NULL AND route_path != ''
    UNION
    SELECT DISTINCT panel_id AS value, 'panel' AS type
    FROM ui_nav_items
    WHERE panel_id IS NOT NULL AND panel_id != ''
    UNION
    SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(action_data, '$.panelId')) AS value, 'panel' AS type
    FROM navrail_items
    WHERE action_data IS NOT NULL
      AND JSON_EXTRACT(action_data, '$.panelId') IS NOT NULL
      AND JSON_UNQUOTE(JSON_EXTRACT(action_data, '$.panelId')) != ''
    UNION
    SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(action_data, '$.panelId')) AS value, 'panel' AS type
    FROM footer_items
    WHERE action_data IS NOT NULL
      AND JSON_EXTRACT(action_data, '$.panelId') IS NOT NULL
      AND JSON_UNQUOTE(JSON_EXTRACT(action_data, '$.panelId')) != ''
    ORDER BY type, value
    ";
}

// ─── Ensure unique item_key (handles duplicate -copy collisions) ───
function ensureUniqueItemKey(PDO $pdo, string $table, string $keyColumn, string $baseKey): string {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM $table WHERE $keyColumn = :k");
    $stmt->execute(['k' => $baseKey]);
    if ((int)$stmt->fetchColumn() === 0) {
        return $baseKey;
    }
    // Strip existing -copy[-N] suffix to get the root key
    $rootKey = preg_replace('/-copy(-\d+)?$/', '', $baseKey);
    $counter = 2;
    do {
        $candidate = $rootKey . '-copy-' . $counter;
        $stmt->execute(['k' => $candidate]);
        $exists = (int)$stmt->fetchColumn() > 0;
        $counter++;
    } while ($exists && $counter < 100);
    return $candidate;
}

// ─── Resolve source table for mutations ───
function resolveSourceTable(string $displayContext): string {
    $map = [
        'sidebar' => SRC_SIDEBAR,
        'navrail' => SRC_NAVRAIL,
        'header'  => SRC_HEADER,
        'footer'  => SRC_FOOTER,
    ];
    return $map[$displayContext] ?? '';
}

// ─── Route mutation to correct table ───
function routeInsert(PDO $pdo, array $data, int $actorId): int {
    $context = $data['display_context'] ?? '';
    $table = resolveSourceTable($context);

    if (!$table) {
        ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
            'message' => "display_context inválido: '$context'. Use: sidebar, navrail, header, footer"
        ]);
        exit;
    }

    switch ($table) {
        case SRC_SIDEBAR:
            $rawKey = $data['item_key'] ?? 'item_' . time();
            $uniqueKey = ensureUniqueItemKey($pdo, 'ui_nav_items', 'item_key', $rawKey);
            $stmt = $pdo->prepare("
                INSERT INTO ui_nav_items
                (item_key, label, icon, item_type, display_context, route_path, panel_id,
                 parent_key, order_index, is_active, is_visible, min_level, uarps_trigger_id,
                 description, created_by)
                VALUES
                (:key, :label, :icon, :item_type, 'sidebar', :route, :panel,
                 :parent, :ord, :active, :visible, :level, :uarps, :desc, :actor)
            ");
            $stmt->execute([
                'key'       => $uniqueKey,
                'label'     => $data['label'] ?? 'Novo Item',
                'icon'      => $data['icon_name'] ?? 'circle',
                'item_type' => $data['item_type'] ?? 'navigation',
                'route'     => $data['route_path'] ?? null,
                'panel'     => $data['panel_id'] ?? null,
                'parent'    => $data['parent_key'] ?? null,
                'ord'       => (int)($data['order_index'] ?? 99),
                'active'    => (int)($data['is_active'] ?? 1),
                'visible'   => (int)($data['is_visible'] ?? 1),
                'level'     => (int)($data['min_level'] ?? 0),
                'uarps'     => $data['uarps_trigger_id'] ?? null,
                'desc'      => $data['description'] ?? null,
                'actor'     => $actorId,
            ]);
            return (int)$pdo->lastInsertId();

        case SRC_NAVRAIL:
            $groupId = null;
            if (!empty($data['parent_key'])) {
                $gs = $pdo->prepare("SELECT id FROM navrail_groups WHERE group_key = :gk LIMIT 1");
                $gs->execute(['gk' => $data['parent_key']]);
                $groupId = $gs->fetchColumn() ?: null;
            }
            $actionData = json_encode(['panelId' => $data['panel_id'] ?? null]);
            $stmt = $pdo->prepare("
                INSERT INTO navrail_items
                (item_key, label, icon_name, action_type, action_data, group_id,
                 order_index, is_active, is_visible, min_access_level, uarps_trigger_id, tooltip)
                VALUES
                (:key, :label, :icon, :atype, :adata, :gid,
                 :ord, :active, :visible, :level, :uarps, :tip)
            ");
            $nrKey = $data['item_key'] ?? 'nr_' . time();
            $nrKey = ensureUniqueItemKey($pdo, 'navrail_items', 'item_key', $nrKey);
            $stmt->execute([
                'key'     => $nrKey,
                'label'   => $data['label'] ?? 'Novo Item',
                'icon'    => $data['icon_name'] ?? 'circle',
                'atype'   => $data['item_type'] ?? 'openPanel',
                'adata'   => $actionData,
                'gid'     => $groupId,
                'ord'     => (int)($data['order_index'] ?? 99),
                'active'  => (int)($data['is_active'] ?? 1),
                'visible' => (int)($data['is_visible'] ?? 1),
                'level'   => (int)($data['min_level'] ?? 0),
                'uarps'   => $data['uarps_trigger_id'] ?? null,
                'tip'     => $data['description'] ?? null,
            ]);
            return (int)$pdo->lastInsertId();

        case SRC_HEADER:
            $groupId = null;
            if (!empty($data['parent_key'])) {
                $gs = $pdo->prepare("SELECT id FROM header_groups WHERE group_key = :gk LIMIT 1");
                $gs->execute(['gk' => $data['parent_key']]);
                $groupId = $gs->fetchColumn() ?: null;
            }
            $stmt = $pdo->prepare("
                INSERT INTO header_components
                (component_key, label, icon_name, component_type, group_id,
                 order_index, is_active, is_visible, min_access_level, uarps_trigger_id, description)
                VALUES
                (:key, :label, :icon, :ctype, :gid,
                 :ord, :active, :visible, :level, :uarps, :desc)
            ");
            $hdrKey = $data['item_key'] ?? 'hdr_' . time();
            $hdrKey = ensureUniqueItemKey($pdo, 'header_components', 'component_key', $hdrKey);
            $stmt->execute([
                'key'     => $hdrKey,
                'label'   => $data['label'] ?? 'Novo Item',
                'icon'    => $data['icon_name'] ?? 'circle',
                'ctype'   => $data['item_type'] ?? 'indicator',
                'gid'     => $groupId,
                'ord'     => (int)($data['order_index'] ?? 99),
                'active'  => (int)($data['is_active'] ?? 1),
                'visible' => (int)($data['is_visible'] ?? 1),
                'level'   => (int)($data['min_level'] ?? 0),
                'uarps'   => $data['uarps_trigger_id'] ?? null,
                'desc'    => $data['description'] ?? null,
            ]);
            return (int)$pdo->lastInsertId();

        case SRC_FOOTER:
            $actionData = json_encode(['panelId' => $data['panel_id'] ?? null]);
            $stmt = $pdo->prepare("
                INSERT INTO footer_items
                (item_key, label, icon_name, action_type, action_data, group_name,
                 order_index, is_active, is_visible, min_access_level, tooltip)
                VALUES
                (:key, :label, :icon, :atype, :adata, :grp,
                 :ord, :active, :visible, :level, :tip)
            ");
            $ftrKey = $data['item_key'] ?? 'ftr_' . time();
            $ftrKey = ensureUniqueItemKey($pdo, 'footer_items', 'item_key', $ftrKey);
            $stmt->execute([
                'key'     => $ftrKey,
                'label'   => $data['label'] ?? 'Novo Item',
                'icon'    => $data['icon_name'] ?? 'circle',
                'atype'   => $data['item_type'] ?? 'openPanel',
                'adata'   => $actionData,
                'grp'     => $data['parent_key'] ?? 'dock',
                'ord'     => (int)($data['order_index'] ?? 99),
                'active'  => (int)($data['is_active'] ?? 1),
                'visible' => (int)($data['is_visible'] ?? 1),
                'level'   => (int)($data['min_level'] ?? 0),
                'tip'     => $data['description'] ?? null,
            ]);
            return (int)$pdo->lastInsertId();
    }

    return 0;
}

// ─── Route UPDATE to correct table ───
function routeUpdate(PDO $pdo, string $sourceTable, int $sourceId, array $data): bool {
    switch ($sourceTable) {
        case SRC_SIDEBAR:
            $allowed = ['label','display_title','icon','item_type','route_path','panel_id','parent_key',
                        'display_context','order_index','is_active','is_visible','min_level',
                        'uarps_trigger_id','description'];
            $fieldMap = ['icon_name' => 'icon'];
            break;
        case SRC_NAVRAIL:
            $allowed = ['label','display_title','icon_name','action_type','order_index','is_active',
                        'is_visible','min_access_level','uarps_trigger_id','tooltip'];
            $fieldMap = ['icon' => 'icon_name', 'item_type' => 'action_type',
                        'min_level' => 'min_access_level', 'description' => 'tooltip'];
            break;
        case SRC_HEADER:
            $allowed = ['label','icon_name','component_type','order_index','is_active',
                        'is_visible','min_access_level','uarps_trigger_id','description'];
            $fieldMap = ['icon' => 'icon_name', 'item_type' => 'component_type',
                        'min_level' => 'min_access_level'];
            break;
        case SRC_FOOTER:
            $allowed = ['label','icon_name','action_type','order_index','is_active',
                        'is_visible','min_access_level','tooltip'];
            $fieldMap = ['icon' => 'icon_name', 'item_type' => 'action_type',
                        'min_level' => 'min_access_level', 'description' => 'tooltip'];
            break;
        default:
            return false;
    }

    // Handle panel_id → action_data for navrail/footer
    if (in_array($sourceTable, [SRC_NAVRAIL, SRC_FOOTER]) && isset($data['panel_id'])) {
        $data['action_data'] = json_encode(['panelId' => $data['panel_id']]);
        $allowed[] = 'action_data';
        unset($data['panel_id']);
    }

    // Handle parent_key → group_id for navrail/header
    if (in_array($sourceTable, [SRC_NAVRAIL, SRC_HEADER]) && isset($data['parent_key'])) {
        $groupTable = ($sourceTable === SRC_NAVRAIL) ? 'navrail_groups' : 'header_groups';
        $groupCol   = 'group_key';
        $gs = $pdo->prepare("SELECT id FROM $groupTable WHERE $groupCol = :gk LIMIT 1");
        $gs->execute(['gk' => $data['parent_key']]);
        $data['group_id'] = $gs->fetchColumn() ?: null;
        $allowed[] = 'group_id';
        unset($data['parent_key']);
    }

    // Handle parent_key → group_name for footer
    if ($sourceTable === SRC_FOOTER && isset($data['parent_key'])) {
        $data['group_name'] = $data['parent_key'];
        $allowed[] = 'group_name';
        unset($data['parent_key']);
    }

    // Map unified field names to table-specific names
    $mapped = [];
    foreach ($data as $k => $v) {
        $realField = $fieldMap[$k] ?? $k;
        if (in_array($realField, $allowed)) {
            $mapped[$realField] = $v;
        }
    }

    if (empty($mapped)) return false;

    $sets = [];
    $params = ['id' => $sourceId];
    foreach ($mapped as $field => $value) {
        $sets[] = "$field = :f_$field";
        $params["f_$field"] = $value;
    }

    $table = $sourceTable;
    $sql = "UPDATE $table SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
}

// ─── Route DELETE (soft-delete) ───
function routeDelete(PDO $pdo, string $sourceTable, int $sourceId): bool {
    switch ($sourceTable) {
        case SRC_SIDEBAR:
            $stmt = $pdo->prepare("UPDATE ui_nav_items SET is_active = 0, is_visible = 0, updated_at = NOW() WHERE id = :id");
            break;
        case SRC_NAVRAIL:
            $stmt = $pdo->prepare("UPDATE navrail_items SET is_deleted = 1, is_active = 0, updated_at = NOW() WHERE id = :id");
            break;
        case SRC_HEADER:
            $stmt = $pdo->prepare("UPDATE header_components SET is_deleted = 1, is_active = 0, updated_at = NOW() WHERE id = :id");
            break;
        case SRC_FOOTER:
            $stmt = $pdo->prepare("UPDATE footer_items SET is_active = 0, is_visible = 0, updated_at = NOW() WHERE id = :id");
            break;
        default:
            return false;
    }
    return $stmt->execute(['id' => $sourceId]);
}

// ══════════════════════════════════════════════════
//  MAIN ROUTER
// ══════════════════════════════════════════════════

$method   = $_SERVER['REQUEST_METHOD'];
$path     = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path);
$resource = $segments[count($segments) - 1] ?? '';

$input  = InputValidator::fromGet();
$action = $input->string('action', '', ['maxLength' => 50]);

try {
    switch ($method) {

        // ─── GET ───
        case 'GET':
            $session = enforceNavReadAccess();
            $pdo = getDbConnection('DSHOWDASH');

            // GET ?action=manifest → sections + items (all tables)
            // v4.2.0: Optional ?context= filter for sections (e.g. ?context=sidebar)
            $contextFilter = isset($_GET['context']) ? trim($_GET['context']) : '';
            if ($action === 'manifest') {
                $itemsStmt    = $pdo->query(buildUnifiedItemsQuery());
                $items        = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
                $sectionsStmt = $pdo->query(buildUnifiedSectionsQuery($contextFilter));
                $sections     = $sectionsStmt->fetchAll(PDO::FETCH_ASSOC);

                ApiResponse::success([
                    'sections' => $sections,
                    'items'    => $items,
                ], [
                    'version'   => API_VERSION,
                    'timestamp' => date('c'),
                    'sources'   => ['ui_nav_items', 'navrail_items', 'header_components', 'footer_items'],
                    '_uarps'    => ['trigger' => UARPS_TRIGGER_NAV_READ, 'enforced' => false],
                ]);
            }

            // GET ?action=available-routes → distinct route_paths + panel_ids
            if ($action === 'available-routes') {
                $stmt   = $pdo->query(buildAvailableRoutesQuery());
                $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

                ApiResponse::success($routes, [
                    'total'   => count($routes),
                    'version' => API_VERSION,
                    '_uarps'  => ['trigger' => UARPS_TRIGGER_NAV_READ, 'enforced' => false],
                ]);
            }

            // GET /audit → navigation audit history
            if ($resource === 'audit') {
                $limit = max(1, min(200, (int)($input->int('limit') ?? 50)));

                $stmt = $pdo->prepare("
                    SELECT
                        al.id,
                        al.actor_id,
                        COALESCE(u.username, u.email, CONCAT('User #', al.actor_id)) AS actor_name,
                        al.event_type,
                        al.resource_type,
                        al.resource_id,
                        al.before_state,
                        al.after_state,
                        al.context_json,
                        al.ip_address,
                        DATE_FORMAT(al.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
                    FROM app_audit_log al
                    LEFT JOIN app_users u ON u.id = al.actor_id
                    WHERE al.resource_type IN ('navigation', 'nav_item', 'navrail_item', 'header_component', 'footer_item', 'ui_nav_items', 'sidebar')
                       OR al.event_type LIKE 'navigation.%'
                    ORDER BY al.created_at DESC
                    LIMIT :lim
                ");
                $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
                $stmt->execute();
                $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($entries as &$entry) {
                    if ($entry['before_state']) {
                        $entry['before_state'] = json_decode($entry['before_state'], true);
                    }
                    if ($entry['after_state']) {
                        $entry['after_state'] = json_decode($entry['after_state'], true);
                    }
                    if ($entry['context_json']) {
                        $entry['context_json'] = json_decode($entry['context_json'], true);
                    }
                }
                unset($entry);

                ApiResponse::success($entries, [
                    'total'   => count($entries),
                    'limit'   => $limit,
                    'version' => API_VERSION,
                ]);
            }

            // GET /items (default) → unified list
            if ($resource === 'items' || $resource === 'index.php' || $resource === 'navigation') {
                $stmt  = $pdo->query(buildUnifiedItemsQuery());
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

                ApiResponse::success($items, [
                    'total'     => count($items),
                    'version'   => API_VERSION,
                    'sources'   => ['ui_nav_items', 'navrail_items', 'header_components', 'footer_items'],
                    '_uarps'    => ['trigger' => UARPS_TRIGGER_NAV_READ, 'enforced' => false],
                ]);
            }

            // GET /sections → unified groups (v4.2.0: optional ?context= filter)
            if ($resource === 'sections') {
                $stmt     = $pdo->query(buildUnifiedSectionsQuery($contextFilter));
                $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);

                ApiResponse::success($sections, [
                    'total'   => count($sections),
                    'version' => API_VERSION,
                    '_uarps'  => ['trigger' => UARPS_TRIGGER_NAV_READ, 'enforced' => false],
                ]);
            }

            // GET /tree → hierarchical tree by display_context (v4.2.0: optional ?context= filter)
            if ($resource === 'tree') {
                $itemsStmt    = $pdo->query(buildUnifiedItemsQuery());
                $items        = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
                $sectionsStmt = $pdo->query(buildUnifiedSectionsQuery($contextFilter));
                $sections     = $sectionsStmt->fetchAll(PDO::FETCH_ASSOC);

                $tree = [];
                foreach ($sections as $s) {
                    $ctx = $s['display_context'];
                    if (!isset($tree[$ctx])) {
                        $tree[$ctx] = ['context' => $ctx, 'groups' => []];
                    }
                    $tree[$ctx]['groups'][$s['group_key']] = [
                        'key'   => $s['group_key'],
                        'label' => $s['label'],
                        'icon'  => $s['icon_name'],
                        'items' => [],
                    ];
                }

                foreach ($items as $item) {
                    $ctx = $item['display_context'];
                    $pk  = $item['parent_key'] ?? '_ungrouped';
                    if (!isset($tree[$ctx])) {
                        $tree[$ctx] = ['context' => $ctx, 'groups' => []];
                    }
                    if (!isset($tree[$ctx]['groups'][$pk])) {
                        $tree[$ctx]['groups'][$pk] = [
                            'key'   => $pk,
                            'label' => $item['parent_label'] ?? $pk,
                            'icon'  => null,
                            'items' => [],
                        ];
                    }
                    $tree[$ctx]['groups'][$pk]['items'][] = $item;
                }

                foreach ($tree as &$ctx) {
                    $ctx['groups'] = array_values($ctx['groups']);
                }

                ApiResponse::success(array_values($tree), [
                    'version' => API_VERSION,
                    '_uarps'  => ['trigger' => UARPS_TRIGGER_NAV_READ, 'enforced' => false],
                ]);
            }

            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Resource not found']);
            break;

        // ─── POST ───
        case 'POST':
            $actorId = enforceNavWriteAccess();
            AuthHelpers::requireCsrf();
            $inputData = json_decode(file_get_contents('php://input'), true) ?? [];
            $pdo = getDbConnection('DSHOWDASH');

            // v4.2.0: Normalize field aliases for frontend convenience
            if (isset($inputData['context']) && !isset($inputData['display_context'])) {
                $inputData['display_context'] = $inputData['context'];
            }
            if (isset($inputData['href']) && !isset($inputData['route_path'])) {
                $inputData['route_path'] = $inputData['href'];
            }
            if (isset($inputData['icon']) && !isset($inputData['icon_name'])) {
                $inputData['icon_name'] = $inputData['icon'];
            }

            if ($resource === 'items') {
                if (empty($inputData['display_context'])) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                        'message' => 'display_context é obrigatório (sidebar, navrail, header, footer). Alias aceito: context'
                    ]);
                }

                $newId = routeInsert($pdo, $inputData, $actorId);

                AuditLogger::log($pdo, $actorId, 'navigation.item.created', $inputData['display_context'], $inputData['item_key'] ?? 'unknown', null, [
                    'item_key'        => $inputData['item_key'] ?? null,
                    'label'           => $inputData['label'] ?? null,
                    'display_context' => $inputData['display_context'],
                    'source_table'    => resolveSourceTable($inputData['display_context']),
                ]);

                invalidateNavCache();

                ApiResponse::success(['id' => $newId], [
                    'message' => 'Item criado com sucesso',
                    'source'  => resolveSourceTable($inputData['display_context']),
                    '_uarps'  => ['trigger' => UARPS_TRIGGER_NAV_WRITE, 'enforced' => true],
                ]);
            }

            if ($resource === 'sections') {
                $context = $inputData['display_context'] ?? 'sidebar';
                $table = resolveSourceTable($context);

                if ($context === 'sidebar') {
                    $stmt = $pdo->prepare("
                        INSERT INTO ui_nav_items
                        (item_key, label, icon, item_type, display_context, order_index, is_active, is_visible, created_by)
                        VALUES (:key, :label, :icon, 'group', 'sidebar', :ord, :active, 1, :actor)
                    ");
                    $stmt->execute([
                        'key'    => $inputData['group_key'] ?? 'sidebar.grp-' . time(),
                        'label'  => $inputData['label'] ?? 'Novo Grupo',
                        'icon'   => $inputData['icon_name'] ?? 'folder',
                        'ord'    => (int)($inputData['order_index'] ?? 99),
                        'active' => (int)($inputData['is_active'] ?? 1),
                        'actor'  => $actorId,
                    ]);
                } elseif ($context === 'navrail') {
                    $stmt = $pdo->prepare("
                        INSERT INTO navrail_groups
                        (group_key, label, icon_name, order_index, is_active)
                        VALUES (:key, :label, :icon, :ord, :active)
                    ");
                    $stmt->execute([
                        'key'    => $inputData['group_key'] ?? 'nr_grp_' . time(),
                        'label'  => $inputData['label'] ?? 'Novo Grupo',
                        'icon'   => $inputData['icon_name'] ?? null,
                        'ord'    => (int)($inputData['order_index'] ?? 99),
                        'active' => (int)($inputData['is_active'] ?? 1),
                    ]);
                } elseif ($context === 'header') {
                    $stmt = $pdo->prepare("
                        INSERT INTO header_groups
                        (group_key, label, icon_name, order_index, is_active)
                        VALUES (:key, :label, :icon, :ord, :active)
                    ");
                    $stmt->execute([
                        'key'    => $inputData['group_key'] ?? 'hdr_grp_' . time(),
                        'label'  => $inputData['label'] ?? 'Novo Grupo',
                        'icon'   => $inputData['icon_name'] ?? null,
                        'ord'    => (int)($inputData['order_index'] ?? 99),
                        'active' => (int)($inputData['is_active'] ?? 1),
                    ]);
                } else {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                        'message' => 'Footer não suporta criação de grupos'
                    ]);
                }

                $newId = (int)$pdo->lastInsertId();

                AuditLogger::log($pdo, $actorId, 'navigation.section.created', $context, $inputData['group_key'] ?? 'unknown', null, [
                    'group_key'       => $inputData['group_key'] ?? null,
                    'label'           => $inputData['label'] ?? null,
                    'display_context' => $context,
                ]);

                invalidateNavCache();

                ApiResponse::success(['id' => $newId], [
                    'message' => 'Grupo criado com sucesso',
                    '_uarps'  => ['trigger' => UARPS_TRIGGER_NAV_WRITE, 'enforced' => true],
                ]);
            }

            if ($resource === 'reorder') {
                $reorderType = $inputData['type'] ?? 'items';
                $items = $inputData['items'] ?? [];

                if ($reorderType === 'groups') {
                    // MELHORIA 3: Reorder groups by group_key
                    foreach ($items as $item) {
                        $groupKey = $item['group_key'] ?? '';
                        $order = (int)($item['order_index'] ?? 0);
                        if (!$groupKey) continue;

                        // Update sidebar_groups
                        $stmt = $pdo->prepare("UPDATE sidebar_groups SET order_index = :ord, updated_at = NOW() WHERE group_key = :gk");
                        $stmt->execute(['ord' => $order, 'gk' => $groupKey]);

                        // Update ui_nav_items (groups stored as item_type='group')
                        $stmt2 = $pdo->prepare("UPDATE ui_nav_items SET order_index = :ord, updated_at = NOW() WHERE item_key = :gk AND item_type = 'group'");
                        $stmt2->execute(['ord' => $order, 'gk' => $groupKey]);

                        // Update navrail_groups if key matches
                        $stmt3 = $pdo->prepare("UPDATE navrail_groups SET order_index = :ord, updated_at = NOW() WHERE group_key = :gk");
                        $stmt3->execute(['ord' => $order, 'gk' => $groupKey]);
                    }

                    AuditLogger::log($pdo, $actorId, 'navigation.groups.reordered', 'unified', null, null, [
                        'groups_count' => count($items),
                    ]);
                } else {
                    // Standard items reorder
                    foreach ($items as $item) {
                        $st = $item['source_table'] ?? SRC_SIDEBAR;
                        $id = (int)($item['source_id'] ?? $item['id'] ?? 0);
                        $order = (int)($item['order_index'] ?? $item['order'] ?? 0);
                        if ($id > 0) {
                            $colId = 'id';
                            $stmt = $pdo->prepare("UPDATE $st SET order_index = :ord WHERE $colId = :id");
                            $stmt->execute(['ord' => $order, 'id' => $id]);
                        }
                    }

                    AuditLogger::log($pdo, $actorId, 'navigation.items.reordered', 'unified', null, null, [
                        'items_count' => count($items),
                    ]);
                }

                invalidateNavCache();

                ApiResponse::success(null, [
                    'message' => $reorderType === 'groups' ? 'Ordem dos grupos atualizada' : 'Ordem atualizada',
                    '_cache_bust' => time(),
                    '_uarps'  => ['trigger' => UARPS_TRIGGER_NAV_WRITE, 'enforced' => true],
                ]);
            }

            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Invalid resource']);
            break;

        // ─── PUT / PATCH ───
        case 'PUT':
        case 'PATCH':
            $actorId = enforceNavWriteAccess();
            AuthHelpers::requireCsrf();
            $bodyData = json_decode(file_get_contents('php://input'), true) ?? [];

            // v4.2.0: Normalize field aliases for PATCH
            if (isset($bodyData['context']) && !isset($bodyData['display_context'])) {
                $bodyData['display_context'] = $bodyData['context'];
            }
            if (isset($bodyData['href']) && !isset($bodyData['route_path'])) {
                $bodyData['route_path'] = $bodyData['href'];
            }
            if (isset($bodyData['icon']) && !isset($bodyData['icon_name'])) {
                $bodyData['icon_name'] = $bodyData['icon'];
            }

            // MELHORIA 7: PATCH /sections — update group label inline
            if ($resource === 'sections') {
                $sourceTable = $bodyData['source_table'] ?? '';
                $sourceId    = (int)($bodyData['source_id'] ?? 0);
                $newLabel    = $bodyData['label'] ?? null;

                if (!$sourceTable || !$sourceId) {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                        'message' => 'source_table e source_id são obrigatórios'
                    ]);
                }

                $pdo = getDbConnection('DSHOWDASH');
                $ok = false;

                if ($sourceTable === SRC_SIDEBAR || $sourceTable === 'ui_nav_items') {
                    // Sidebar groups are stored in ui_nav_items with item_type='group'
                    $sets = [];
                    $params = ['id' => $sourceId];
                    if ($newLabel !== null) {
                        $sets[] = 'label = :label';
                        $params['label'] = $newLabel;
                    }
                    if (!empty($bodyData['icon_name'])) {
                        $sets[] = 'icon = :icon';
                        $params['icon'] = $bodyData['icon_name'];
                    }
                    if (isset($bodyData['order_index'])) {
                        $sets[] = 'order_index = :ord';
                        $params['ord'] = (int)$bodyData['order_index'];
                    }
                    if (!empty($sets)) {
                        $sql = "UPDATE ui_nav_items SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE id = :id AND item_type = 'group'";
                        $stmt = $pdo->prepare($sql);
                        $ok = $stmt->execute($params);
                    }
                    // Also update sidebar_groups if it exists
                    if ($newLabel !== null) {
                        try {
                            // Get group_key from ui_nav_items
                            $gkStmt = $pdo->prepare("SELECT item_key FROM ui_nav_items WHERE id = :id LIMIT 1");
                            $gkStmt->execute(['id' => $sourceId]);
                            $groupKey = $gkStmt->fetchColumn();
                            if ($groupKey) {
                                $sgStmt = $pdo->prepare("UPDATE sidebar_groups SET label = :label, updated_at = NOW() WHERE group_key = :gk");
                                $sgStmt->execute(['label' => $newLabel, 'gk' => $groupKey]);
                            }
                        } catch (Throwable $e) {
                            // sidebar_groups may not exist or may not have this key — non-critical
                            error_log("[NavAdmin] sidebar_groups update skipped: " . $e->getMessage());
                        }
                    }
                } elseif ($sourceTable === 'navrail_groups') {
                    $sets = [];
                    $params = ['id' => $sourceId];
                    if ($newLabel !== null) { $sets[] = 'label = :label'; $params['label'] = $newLabel; }
                    if (!empty($bodyData['icon_name'])) { $sets[] = 'icon_name = :icon'; $params['icon'] = $bodyData['icon_name']; }
                    if (isset($bodyData['order_index'])) { $sets[] = 'order_index = :ord'; $params['ord'] = (int)$bodyData['order_index']; }
                    if (!empty($sets)) {
                        $sql = "UPDATE navrail_groups SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE id = :id";
                        $stmt = $pdo->prepare($sql);
                        $ok = $stmt->execute($params);
                    }
                } elseif ($sourceTable === 'header_groups') {
                    $sets = [];
                    $params = ['id' => $sourceId];
                    if ($newLabel !== null) { $sets[] = 'label = :label'; $params['label'] = $newLabel; }
                    if (!empty($bodyData['icon_name'])) { $sets[] = 'icon_name = :icon'; $params['icon'] = $bodyData['icon_name']; }
                    if (isset($bodyData['order_index'])) { $sets[] = 'order_index = :ord'; $params['ord'] = (int)$bodyData['order_index']; }
                    if (!empty($sets)) {
                        $sql = "UPDATE header_groups SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE id = :id";
                        $stmt = $pdo->prepare($sql);
                        $ok = $stmt->execute($params);
                    }
                } else {
                    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                        'message' => "source_table inválido para grupo: '$sourceTable'"
                    ]);
                }

                AuditLogger::log($pdo, $actorId, 'navigation.section.updated', $sourceTable, (string)$sourceId, null, $bodyData);
                invalidateNavCache();

                ApiResponse::success(null, [
                    'message'      => 'Grupo atualizado com sucesso',
                    'source_table' => $sourceTable,
                    'source_id'    => $sourceId,
                    '_uarps'       => ['trigger' => UARPS_TRIGGER_NAV_WRITE, 'enforced' => true],
                ]);
            }

            $sourceTable = $bodyData['source_table'] ?? '';
            $sourceId    = (int)($bodyData['source_id'] ?? 0);

            if (!$sourceTable || !$sourceId) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                    'message' => 'source_table e source_id são obrigatórios para edição'
                ]);
            }

            $validTables = [SRC_SIDEBAR, SRC_NAVRAIL, SRC_HEADER, SRC_FOOTER];
            if (!in_array($sourceTable, $validTables)) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                    'message' => "source_table inválido: '$sourceTable'"
                ]);
            }

            $pdo = getDbConnection('DSHOWDASH');

            // Debug: log PATCH payload for display_title troubleshooting
            if (isset($bodyData['display_title'])) {
                error_log("[NavAdmin][PATCH] display_title update — sourceTable={$sourceTable}, sourceId={$sourceId}, display_title=" . json_encode($bodyData['display_title']));
            }

            $ok = routeUpdate($pdo, $sourceTable, $sourceId, $bodyData);

            if (!$ok) {
                error_log("[NavAdmin][PATCH] routeUpdate FAILED — sourceTable={$sourceTable}, sourceId={$sourceId}, bodyKeys=" . implode(',', array_keys($bodyData)));
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                    'message' => 'Nenhum campo válido para atualizar'
                ]);
            }

            AuditLogger::log($pdo, $actorId, 'navigation.item.updated', $sourceTable, (string)$sourceId, null, $bodyData);

            invalidateNavCache();

            ApiResponse::success(null, [
                'message'      => 'Atualizado com sucesso',
                'source_table' => $sourceTable,
                'source_id'    => $sourceId,
                '_uarps'       => ['trigger' => UARPS_TRIGGER_NAV_WRITE, 'enforced' => true],
            ]);
            break;

        // ─── DELETE ───
        case 'DELETE':
            $actorId = enforceNavWriteAccess();
            AuthHelpers::requireCsrf();
            $input2 = InputValidator::fromGet();
            $bodyData = json_decode(file_get_contents('php://input'), true) ?? [];

            $sourceTable = $bodyData['source_table'] ?? $input2->string('source_table', '');
            $sourceId    = (int)($bodyData['source_id'] ?? $input2->id('source_id') ?? 0);

            if (!$sourceTable || !$sourceId) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, [
                    'message' => 'source_table e source_id são obrigatórios para exclusão'
                ]);
            }

            $pdo = getDbConnection('DSHOWDASH');
            $ok = routeDelete($pdo, $sourceTable, $sourceId);

            AuditLogger::log($pdo, $actorId, 'navigation.item.deleted', $sourceTable, (string)$sourceId, ['id' => $sourceId], null, ['action' => 'deleted']);

            invalidateNavCache();

            ApiResponse::success(null, [
                'message'      => 'Removido com sucesso',
                'source_table' => $sourceTable,
                'source_id'    => $sourceId,
                '_uarps'       => ['trigger' => UARPS_TRIGGER_NAV_WRITE, 'enforced' => true],
            ]);
            break;

        case 'OPTIONS':
            http_response_code(204);
            exit;

        default:
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
} catch (Throwable $e) {
    error_log("Navigation Admin API Error [v" . API_VERSION . "]: " . $e->getMessage());
    ApiResponse::exception($e);
}
