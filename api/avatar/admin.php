<?php
declare(strict_types=1);

/**
 * /api/avatar/admin.php — ESCRITA do catálogo (Expansão, Trilha A).
 * @version 1.0.0  @created 2026-07-30
 *
 * Um endpoint, ações explícitas (padrão do dash), TUDO auditado em
 * avatar_catalog_audit. POST + CSRF + AdminGate (fail-closed).
 *
 *   POST {acao:'asset_salvar',   asset:{key,categoria,biblioteca,raridade,nome,…}}
 *   POST {acao:'colecao_salvar', colecao:{key,nome,…,itens:[assetKey,…]}}
 *   POST {acao:'regra_salvar',   regra:{source_key,rule_type,target_type,target_key|target_asset_key,message}}
 *   POST {acao:'desbloquear_usuario', user_id, asset_key}   (grant manual)
 *   POST {acao:'status_asset',   asset_key, status}         (publicar/retirar…)
 *   POST {acao:'publicar'}                                  (versão++ → ETag)
 *
 * Criar CATEGORIA/grupo continua por seed versionado (INSERT idempotente no
 * git) — mudança estrutural pede revisão de código, não clique.
 */
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/AdminGate.php';

CorsPolicy::setupApiEndpoint(['methods' => ['POST', 'OPTIONS'], 'no_cache' => true]);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
$userId = (int) SessionGate::getUserId();
requireCsrf();
if (!AdminGate::autorizado($userId)) {
    ApiResponse::error('SEM_PERMISSAO', 403);
}

function avadm_ok(array $data): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data, 'error' => null,
        'meta' => ['endpoint' => 'avatar/admin', 'version' => '1.0.0']],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function avadm_erro(string $codigo, int $status = 422): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'data' => null, 'error' => $codigo,
        'meta' => ['endpoint' => 'avatar/admin']], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Auditoria obrigatória de toda escrita (spec §21). */
function avadm_auditar(PDO $pdo, int $userId, string $acao, string $tipo, string $id, $antes, $depois): void
{
    $st = $pdo->prepare('
        INSERT INTO avatar_catalog_audit
          (user_id, action, entity_type, entity_id, previous_value, new_value, ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ');
    $st->execute([
        $userId, $acao, $tipo, $id,
        $antes === null ? null : json_encode($antes, JSON_UNESCAPED_UNICODE),
        $depois === null ? null : json_encode($depois, JSON_UNESCAPED_UNICODE),
        substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45),
    ]);
}

function avadm_id(PDO $pdo, string $tabela, string $key): ?int
{
    $st = $pdo->prepare("SELECT id FROM {$tabela} WHERE `key` = ?");
    $st->execute([$key]);
    $id = $st->fetchColumn();
    return $id === false ? null : (int) $id;
}

$RE_KEY = '/^[a-z0-9_]{1,80}$/';
$corpo = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($corpo)) {
    avadm_erro('CORPO_INVALIDO', 400);
}
$acao = (string) ($corpo['acao'] ?? '');

try {
    $pdo = getConnection('DSHOWDASH');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    session_write_close();

    // ── asset_salvar: upsert por key (draft por padrão) ─────────────
    if ($acao === 'asset_salvar') {
        $a = is_array($corpo['asset'] ?? null) ? $corpo['asset'] : [];
        $key = (string) ($a['key'] ?? '');
        if (!preg_match($RE_KEY, $key)) {
            avadm_erro('ASSET_KEY_INVALIDA');
        }
        $catId = avadm_id($pdo, 'avatar_categories', (string) ($a['categoria'] ?? ''));
        $bibId = avadm_id($pdo, 'avatar_libraries', (string) ($a['biblioteca'] ?? 'dshow_svg'));
        $rarId = avadm_id($pdo, 'avatar_rarities', (string) ($a['raridade'] ?? 'comum'));
        $nome = trim((string) ($a['nome'] ?? ''));
        if (!$catId || !$bibId || !$rarId || $nome === '' || mb_strlen($nome) > 120) {
            avadm_erro('ASSET_CAMPOS_INVALIDOS');
        }
        $renderers = in_array($a['supported_renderers'] ?? '', ['2d', '3d', '2d,3d'], true)
            ? $a['supported_renderers'] : '2d';
        $metadata = isset($a['metadata']) && is_array($a['metadata'])
            ? json_encode($a['metadata'], JSON_UNESCAPED_UNICODE) : null;

        $stAntes = $pdo->prepare('SELECT * FROM avatar_assets WHERE `key` = ?');
        $stAntes->execute([$key]);
        $antes = $stAntes->fetch(PDO::FETCH_ASSOC) ?: null;

        $st = $pdo->prepare("
            INSERT INTO avatar_assets
              (category_id, library_id, rarity_id, license_id, `key`, name,
               short_description, lore, asset_type, status, supported_renderers,
               default_renderer, tags, metadata, created_at, updated_at)
            VALUES (?, ?, ?, 2, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
              category_id = VALUES(category_id), library_id = VALUES(library_id),
              rarity_id = VALUES(rarity_id), name = VALUES(name),
              short_description = VALUES(short_description), lore = VALUES(lore),
              supported_renderers = VALUES(supported_renderers),
              tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW()
        ");
        $st->execute([
            $catId, $bibId, $rarId, $key, $nome,
            mb_substr((string) ($a['descricao'] ?? ''), 0, 255) ?: null,
            (string) ($a['lore'] ?? '') ?: null,
            preg_match($RE_KEY, (string) ($a['asset_type'] ?? '')) ? $a['asset_type'] : 'parte2d',
            $renderers,
            $renderers === '3d' ? '3d' : '2d',
            mb_substr((string) ($a['tags'] ?? ''), 0, 500) ?: null,
            $metadata,
        ]);
        avadm_auditar($pdo, $userId, $antes ? 'alterar' : 'criar', 'asset', $key, $antes, $a);
        avadm_ok(['asset' => $key, 'status' => $antes['status'] ?? 'draft']);
    }

    // ── status_asset: transições de ciclo de vida (soft delete §17) ──
    if ($acao === 'status_asset') {
        $key = (string) ($corpo['asset_key'] ?? '');
        $status = (string) ($corpo['status'] ?? '');
        $validos = ['draft', 'review', 'published', 'deprecated', 'retired', 'blocked'];
        if (!preg_match($RE_KEY, $key) || !in_array($status, $validos, true)) {
            avadm_erro('STATUS_INVALIDO');
        }
        $id = avadm_id($pdo, 'avatar_assets', $key);
        if (!$id) {
            avadm_erro('ASSET_INEXISTENTE', 404);
        }
        $anterior = $pdo->query("SELECT status FROM avatar_assets WHERE id = $id")->fetchColumn();
        $st = $pdo->prepare("
            UPDATE avatar_assets SET status = ?, updated_at = NOW(),
              published_at = IF(? = 'published' AND published_at IS NULL, NOW(), published_at),
              retired_at = IF(? IN ('retired','blocked'), NOW(), retired_at)
            WHERE id = ?
        ");
        $st->execute([$status, $status, $status, $id]);
        avadm_auditar($pdo, $userId, $status === 'published' ? 'publicar' : 'alterar',
            'asset', $key, ['status' => $anterior], ['status' => $status]);
        avadm_ok(['asset' => $key, 'status' => $status]);
    }

    // ── colecao_salvar: upsert + itens ───────────────────────────────
    if ($acao === 'colecao_salvar') {
        $c = is_array($corpo['colecao'] ?? null) ? $corpo['colecao'] : [];
        $key = (string) ($c['key'] ?? '');
        $nome = trim((string) ($c['nome'] ?? ''));
        if (!preg_match($RE_KEY, $key) || $nome === '' || mb_strlen($nome) > 120) {
            avadm_erro('COLECAO_CAMPOS_INVALIDOS');
        }
        $rarId = avadm_id($pdo, 'avatar_rarities', (string) ($c['raridade'] ?? 'raro'));
        $st = $pdo->prepare("
            INSERT INTO avatar_collections (`key`, name, description, rarity_id, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'published', NOW(), NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
              rarity_id = VALUES(rarity_id), updated_at = NOW()
        ");
        $st->execute([$key, $nome, mb_substr((string) ($c['descricao'] ?? ''), 0, 500) ?: null, $rarId]);
        $colId = avadm_id($pdo, 'avatar_collections', $key);
        $itens = array_values(array_filter((array) ($c['itens'] ?? []), fn ($x) => is_string($x) && preg_match($RE_KEY, $x)));
        if ($colId && $itens !== []) {
            $pdo->prepare('DELETE FROM avatar_collection_items WHERE collection_id = ?')->execute([$colId]);
            $ins = $pdo->prepare('INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
                SELECT ?, id, ? FROM avatar_assets WHERE `key` = ?');
            foreach ($itens as $i => $itemKey) {
                $ins->execute([$colId, $i, $itemKey]);
            }
        }
        avadm_auditar($pdo, $userId, 'alterar', 'colecao', $key, null, $c);
        avadm_ok(['colecao' => $key, 'itens' => count($itens)]);
    }

    // ── regra_salvar: regra declarativa (motor único 2D/3D) ──────────
    if ($acao === 'regra_salvar') {
        $r = is_array($corpo['regra'] ?? null) ? $corpo['regra'] : [];
        $tipos = ['requires', 'incompatible_with', 'hides', 'replaces', 'allows_only',
            'requires_species', 'requires_archetype', 'requires_slot', 'excludes_slot',
            'locks_color', 'changes_material', 'triggers_effect', 'requires_renderer'];
        $alvos = ['asset', 'category', 'slot', 'species', 'archetype', 'renderer'];
        $srcKey = (string) ($r['source_key'] ?? '');
        $ruleType = (string) ($r['rule_type'] ?? '');
        $targetType = (string) ($r['target_type'] ?? '');
        if (!preg_match($RE_KEY, $srcKey) || !in_array($ruleType, $tipos, true) || !in_array($targetType, $alvos, true)) {
            avadm_erro('REGRA_CAMPOS_INVALIDOS');
        }
        $srcId = avadm_id($pdo, 'avatar_assets', $srcKey);
        if (!$srcId) {
            avadm_erro('ASSET_INEXISTENTE', 404);
        }
        $targetId = null;
        if ($targetType === 'asset') {
            $targetId = avadm_id($pdo, 'avatar_assets', (string) ($r['target_asset_key'] ?? ''));
            if (!$targetId) {
                avadm_erro('ALVO_INEXISTENTE', 404);
            }
        }
        $targetKey = isset($r['target_key']) && preg_match($RE_KEY, (string) $r['target_key'])
            ? (string) $r['target_key'] : null;
        $st = $pdo->prepare('
            INSERT INTO avatar_asset_rules
              (source_asset_id, rule_type, target_type, target_id, target_key, message, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        ');
        $st->execute([$srcId, $ruleType, $targetType, $targetId, $targetKey,
            mb_substr((string) ($r['message'] ?? ''), 0, 255) ?: null]);
        avadm_auditar($pdo, $userId, 'regra', 'asset', $srcKey, null, $r);
        avadm_ok(['regra' => (int) $pdo->lastInsertId()]);
    }

    // ── desbloquear_usuario: grant manual (unlock_type=admin) ───────
    if ($acao === 'desbloquear_usuario') {
        $alvoUser = (int) ($corpo['user_id'] ?? 0);
        $assetKey = (string) ($corpo['asset_key'] ?? '');
        if ($alvoUser <= 0 || !preg_match($RE_KEY, $assetKey)) {
            avadm_erro('DESBLOQUEIO_CAMPOS_INVALIDOS');
        }
        $assetId = avadm_id($pdo, 'avatar_assets', $assetKey);
        if (!$assetId) {
            avadm_erro('ASSET_INEXISTENTE', 404);
        }
        $st = $pdo->prepare('
            INSERT IGNORE INTO avatar_user_unlocks
              (user_id, asset_id, source_type, source_id, unlocked_at, granted_by)
            VALUES (?, ?, ?, ?, NOW(), ?)
        ');
        $st->execute([$alvoUser, $assetId, 'admin', "admin:$userId", $userId]);
        avadm_auditar($pdo, $userId, 'desbloqueio_manual', 'user_unlock',
            "u{$alvoUser}:{$assetKey}", null, ['user' => $alvoUser, 'asset' => $assetKey]);
        avadm_ok(['desbloqueado' => $assetKey, 'user_id' => $alvoUser]);
    }

    // ── publicar: versão do catálogo ++ (invalida ETag/caches) ───────
    if ($acao === 'publicar') {
        $pdo->prepare('UPDATE avatar_catalog_meta SET version = version + 1,
            published_by = ?, published_at = NOW(), notes = ? WHERE id = 1')
            ->execute([$userId, mb_substr((string) ($corpo['notas'] ?? ''), 0, 500) ?: null]);
        $versao = (int) $pdo->query('SELECT version FROM avatar_catalog_meta WHERE id = 1')->fetchColumn();
        avadm_auditar($pdo, $userId, 'publicar', 'catalogo', 'meta', null, ['version' => $versao]);
        avadm_ok(['catalog_version' => $versao]);
    }

    avadm_erro('ACAO_DESCONHECIDA', 400);
} catch (Throwable $e) {
    error_log('[avatar/admin.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'data' => null, 'error' => 'ERRO_INTERNO']);
}
