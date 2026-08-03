<?php
declare(strict_types=1);

/**
 * /api/avatar/registry.php — ASSET REGISTRY do Avatar Studio 5.0 (AS5 F1).
 * @version 1.0.0  @created 2026-07-31
 *
 * Catálogo servido pelo BANCO como fonte (Parte 10 §618), leitura apenas.
 * Contrato de resposta no envelope §624 (success/data/meta/errors/traceId).
 *
 *   GET ?recurso=assets      → lista paginada com filtros (§618.1):
 *       categoria, slot, colecao, raridade, status, renderer, busca,
 *       favorito=1, pagina, por_pagina (máx 100), ordenacao (nome|raridade|recentes)
 *   GET ?recurso=asset&id=X  → um asset + regras de compatibilidade
 *   GET ?recurso=categorias  → taxonomia (grupos + categorias)
 *   GET ?recurso=colecoes    → coleções publicadas
 *
 * SEGURANÇA: sessão obrigatória; tudo parametrizado; filtros por whitelist;
 * paginação limitada. O front só ativa este caminho atrás da flag
 * as5.registry_api — o catálogo TS continua sendo o fallback (§ fallback F0).
 */
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
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
session_write_close();

/** Envelope §624 — traceId em toda resposta (correlação de logs). */
function avreg_responder(bool $sucesso, ?array $dados, array $meta = [], array $erros = []): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => $sucesso,
        'data'    => $dados,
        'meta'    => $meta + ['endpoint' => 'avatar/registry', 'version' => '1.0.0'],
        'errors'  => $erros,
        'traceId' => bin2hex(random_bytes(8)),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function avreg_erro(string $codigo, string $mensagem, int $http = 400): void
{
    http_response_code($http);
    avreg_responder(false, null, [], [['code' => $codigo, 'message' => $mensagem]]);
}

try {
    $pdo = getConnection('DSHOWDASH');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $recurso = (string) ($_GET['recurso'] ?? 'assets');

    // ── taxonomia ───────────────────────────────────────────────────
    if ($recurso === 'categorias') {
        $st = $pdo->query('
            SELECT c.`key`, c.name, c.slot_key, c.selection_mode, g.`key` AS grupo
            FROM avatar_categories c
            LEFT JOIN avatar_category_groups g ON g.id = c.group_id
            WHERE c.is_active = 1 ORDER BY g.sort_order, c.sort_order
        ');
        avreg_responder(true, ['categorias' => $st->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($recurso === 'colecoes') {
        $st = $pdo->query("
            SELECT col.`key`, col.name, col.description, col.theme,
                   COUNT(ci.asset_id) AS total_itens
            FROM avatar_collections col
            LEFT JOIN avatar_collection_items ci ON ci.collection_id = col.id
            WHERE col.status = 'published'
            GROUP BY col.id, col.`key`, col.name, col.description, col.theme
            ORDER BY col.`key`
        ");
        avreg_responder(true, ['colecoes' => $st->fetchAll(PDO::FETCH_ASSOC)]);
    }

    // ── um asset (§618: detalhe + compatibilidade) ──────────────────
    if ($recurso === 'asset') {
        $chave = (string) ($_GET['id'] ?? '');
        if (!preg_match('/^[a-z0-9_]{1,80}$/', $chave)) {
            avreg_erro('ID_INVALIDO', 'Identificador de asset inválido.');
        }
        $st = $pdo->prepare('
            SELECT a.`key`, a.name, a.short_description, a.lore, a.asset_type,
                   a.status, a.supported_renderers, a.default_renderer,
                   a.is_premium, a.is_exclusive, a.tags, a.metadata, a.version,
                   c.`key` AS categoria, r.`key` AS raridade, col.`key` AS colecao
            FROM avatar_assets a
            JOIN avatar_categories c ON c.id = a.category_id
            LEFT JOIN avatar_rarities r ON r.id = a.rarity_id
            LEFT JOIN avatar_collections col ON col.id = a.collection_id
            WHERE a.`key` = ? AND a.is_active = 1
            LIMIT 1
        ');
        $st->execute([$chave]);
        $asset = $st->fetch(PDO::FETCH_ASSOC);
        if (!$asset) {
            avreg_erro('NAO_ENCONTRADO', 'Asset não encontrado.', 404);
        }
        $reg = $pdo->prepare('SELECT rule_type, rule_json FROM avatar_asset_rules WHERE asset_id = (SELECT id FROM avatar_assets WHERE `key` = ?)');
        $reg->execute([$chave]);
        $asset['regras'] = $reg->fetchAll(PDO::FETCH_ASSOC);
        avreg_responder(true, ['asset' => $asset]);
    }

    // ── lista com filtros (§618.1) ──────────────────────────────────
    if ($recurso !== 'assets') {
        avreg_erro('RECURSO_INVALIDO', 'Recurso desconhecido.', 404);
    }

    $onde = ['a.is_active = 1', "a.status = 'published'"];
    $par = [];

    if (($v = (string) ($_GET['categoria'] ?? '')) !== '' && preg_match('/^[a-z0-9_]{1,60}$/', $v)) {
        $onde[] = 'c.`key` = ?'; $par[] = $v;
    }
    if (($v = (string) ($_GET['colecao'] ?? '')) !== '' && preg_match('/^[a-z0-9_]{1,60}$/', $v)) {
        $onde[] = 'col.`key` = ?'; $par[] = $v;
    }
    if (($v = (string) ($_GET['raridade'] ?? '')) !== '' && preg_match('/^[a-z0-9_]{1,30}$/', $v)) {
        $onde[] = 'r.`key` = ?'; $par[] = $v;
    }
    if (($v = (string) ($_GET['renderer'] ?? '')) !== '' && in_array($v, ['2d', '3d'], true)) {
        $onde[] = 'FIND_IN_SET(?, a.supported_renderers) > 0'; $par[] = $v;
    }
    if (($v = trim((string) ($_GET['busca'] ?? ''))) !== '' && mb_strlen($v) <= 60) {
        $onde[] = '(a.name LIKE ? OR a.tags LIKE ? OR a.lore LIKE ?)';
        $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $v) . '%';
        array_push($par, $like, $like, $like);
    }
    if ((string) ($_GET['favorito'] ?? '') === '1') {
        $onde[] = 'EXISTS (SELECT 1 FROM avatar_user_favorites f WHERE f.asset_id = a.id AND f.user_id = ?)';
        $par[] = $userId;
    }

    $ordenacoes = [
        'nome'     => 'a.name ASC',
        'raridade' => 'r.level DESC, a.sort_order ASC',
        'recentes' => 'a.id DESC',
        'padrao'   => 'a.sort_order ASC, a.id ASC',
    ];
    $ordem = $ordenacoes[(string) ($_GET['ordenacao'] ?? 'padrao')] ?? $ordenacoes['padrao'];

    $porPagina = max(1, min(100, (int) ($_GET['por_pagina'] ?? 48)));
    $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
    $desloc = ($pagina - 1) * $porPagina;

    $sqlBase = '
        FROM avatar_assets a
        JOIN avatar_categories c ON c.id = a.category_id
        LEFT JOIN avatar_rarities r ON r.id = a.rarity_id
        LEFT JOIN avatar_collections col ON col.id = a.collection_id
        WHERE ' . implode(' AND ', $onde);

    $stTotal = $pdo->prepare('SELECT COUNT(*) ' . $sqlBase);
    $stTotal->execute($par);
    $total = (int) $stTotal->fetchColumn();

    $st = $pdo->prepare('
        SELECT a.`key`, a.name, a.short_description, a.asset_type,
               a.supported_renderers, a.is_premium, a.thumbnail_url,
               c.`key` AS categoria, r.`key` AS raridade, col.`key` AS colecao
        ' . $sqlBase . '
        ORDER BY ' . $ordem . '
        LIMIT ' . $porPagina . ' OFFSET ' . $desloc);
    $st->execute($par);

    avreg_responder(true, ['assets' => $st->fetchAll(PDO::FETCH_ASSOC)], [
        'total' => $total, 'pagina' => $pagina, 'por_pagina' => $porPagina,
        'paginas' => (int) ceil($total / $porPagina),
    ]);
} catch (Throwable $e) {
    error_log('[avatar/registry] ' . $e->getMessage());
    avreg_erro('ERRO_INTERNO', 'Não foi possível consultar o catálogo agora.', 500);
}
