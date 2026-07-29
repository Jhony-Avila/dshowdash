<?php
declare(strict_types=1);

/**
 * /api/avatar/studio.php — persistência oficial do Avatar Studio (camadas).
 * @version 1.0.0  @created 2026-07-29
 *
 * Contrato (envelope {ok,data,error,meta} padrão do dash):
 *   GET               → avatar ativo do usuário logado:
 *                       { config, version, render_url, avatar_url }
 *                       (config = null quando o ativo é legado/arquivo)
 *   GET ?historico=1  → { itens: [{id, config, url, criado_em}] } (últimos 12)
 *   POST              → salva { config, svg, base_version }:
 *                       revalida o config, SANITIZA o svg (SvgSanitizer),
 *                       versiona em app_user_avatars (histórico preservado,
 *                       is_active único), publica o arquivo em
 *                       /assets/avatars/studio/ e espelha app_users.avatar_url.
 *                       base_version divergente → 409 (conflito entre abas).
 *
 * SEGURANÇA: nada do front é confiado — config é RECONSTRUÍDO campo a campo
 * (ids por regex, cores hex), o SVG passa por whitelist fail-closed, o
 * user_id vem SEMPRE da sessão (nunca do payload — sem IDOR), CSRF na
 * escrita, rate limit de 30 salvamentos/hora (mesmo padrão do avatar-upload).
 * Convive com o sistema legado: linhas antigas ficam intactas (is_active=0).
 */

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/SvgSanitizer.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true,
]);

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($metodo, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
$userId = (int) SessionGate::getUserId();

const AVST_DIR_PUBLICO = '/assets/avatars/studio';
const AVST_LIMITE_HORA = 30;

/** Envelope de sucesso (mesmo shape do restante do dash). */
function avst_ok(array $data): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['ok' => true, 'data' => $data, 'error' => null, 'meta' => ['endpoint' => 'avatar/studio', 'version' => '1.0.0']],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function avst_erro(string $codigo, int $status, array $extra = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['ok' => false, 'data' => $extra ?: null, 'error' => $codigo, 'meta' => ['endpoint' => 'avatar/studio']],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

/**
 * Reconstrói um AvatarConfig VÁLIDO a partir de entrada não confiável.
 * Espelha validarConfig() do front (ids [a-z0-9_], categorias fixas, hex).
 */
function avst_validar_config($bruto): array
{
    if (!is_array($bruto)) {
        throw new InvalidArgumentException('CONFIG_INVALIDO');
    }
    $reId = '/^[a-z0-9_]{1,40}$/';

    $base = $bruto['base'] ?? null;
    if (!is_string($base) || !preg_match($reId, $base)) {
        throw new InvalidArgumentException('CONFIG_BASE_INVALIDA');
    }

    $categorias = ['cabelo', 'olhos', 'boca', 'roupa', 'acessorio', 'fundo', 'moldura', 'efeito'];
    $camadas = [];
    foreach ($categorias as $cat) {
        $id = $bruto['camadas'][$cat] ?? null;
        if ($id === null || $id === 'nenhum') {
            continue;
        }
        if (!is_string($id) || !preg_match($reId, $id)) {
            throw new InvalidArgumentException("CONFIG_CAMADA_INVALIDA:$cat");
        }
        $camadas[$cat] = $id;
    }

    $cores = [];
    foreach (['pele', 'cabelo', 'roupa', 'destaque'] as $slot) {
        $hex = $bruto['cores'][$slot] ?? null;
        if (!is_string($hex) || !preg_match('/^#[0-9a-f]{6}$/i', $hex)) {
            throw new InvalidArgumentException("CONFIG_COR_INVALIDA:$slot");
        }
        $cores[$slot] = strtolower($hex);
    }

    $versao = $bruto['versao'] ?? 1;

    return [
        'formato' => 'camadas',
        'versao'  => is_int($versao) ? $versao : 1,
        'base'    => $base,
        'camadas' => (object) $camadas, // objeto mesmo vazio ({} e não [])
        'cores'   => $cores,
    ];
}

/** Linha ativa "camadas" do usuário (ou null). */
function avst_ativo(PDO $pdo, int $userId): ?array
{
    $st = $pdo->prepare("
        SELECT id, avatar_type, avatar_config, avatar_image_url, version, updated_at
        FROM app_user_avatars
        WHERE user_id = ? AND is_active = 1
        ORDER BY updated_at DESC
        LIMIT 1
    ");
    $st->execute([$userId]);
    $linha = $st->fetch(PDO::FETCH_ASSOC);
    return $linha ?: null;
}

function avst_config_da_linha(?array $linha): ?array
{
    if (!$linha || $linha['avatar_type'] !== 'generated' || empty($linha['avatar_config'])) {
        return null;
    }
    $cfg = json_decode((string) $linha['avatar_config'], true);
    return (is_array($cfg) && ($cfg['formato'] ?? '') === 'camadas') ? $cfg : null;
}

try {
    $pdo = getConnection('DSHOWDASH');

    // ── GET ─────────────────────────────────────────────────────────
    if ($metodo === 'GET') {
        if (isset($_GET['historico'])) {
            $st = $pdo->prepare("
                SELECT id, avatar_config, avatar_image_url, created_at
                FROM app_user_avatars
                WHERE user_id = ? AND avatar_type = 'generated'
                ORDER BY id DESC
                LIMIT 12
            ");
            $st->execute([$userId]);
            $itens = [];
            foreach ($st as $l) {
                $cfg = json_decode((string) ($l['avatar_config'] ?? ''), true);
                $itens[] = [
                    'id'        => (int) $l['id'],
                    'config'    => (is_array($cfg) && ($cfg['formato'] ?? '') === 'camadas') ? $cfg : null,
                    'url'       => $l['avatar_image_url'] ?: null,
                    'criado_em' => $l['created_at'],
                ];
            }
            session_write_close();
            avst_ok(['itens' => $itens]);
        }

        $ativo = avst_ativo($pdo, $userId);
        $stU = $pdo->prepare('SELECT avatar_url FROM app_users WHERE id = ?');
        $stU->execute([$userId]);
        $avatarUrl = (string) ($stU->fetchColumn() ?: '');

        session_write_close();
        avst_ok([
            'config'     => avst_config_da_linha($ativo),
            'version'    => $ativo ? (int) $ativo['version'] : 0,
            'render_url' => $ativo['avatar_image_url'] ?? null,
            'avatar_url' => $avatarUrl ?: null,
        ]);
    }

    // ── POST ────────────────────────────────────────────────────────
    requireCsrf();

    $corpo = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($corpo)) {
        avst_erro('JSON_INVALIDO', 400);
    }

    // Rate limit (mesmo padrão do avatar-upload.php)
    $stRl = $pdo->prepare("
        SELECT COUNT(*) FROM app_user_avatars
        WHERE user_id = ? AND avatar_type = 'generated' AND created_at > ?
    ");
    $stRl->execute([$userId, date('Y-m-d H:i:s', time() - 3600)]);
    if ((int) $stRl->fetchColumn() >= AVST_LIMITE_HORA) {
        avst_erro('RATE_LIMIT', 429, ['limite_por_hora' => AVST_LIMITE_HORA]);
    }

    try {
        $config = avst_validar_config($corpo['config'] ?? null);
    } catch (InvalidArgumentException $e) {
        avst_erro($e->getMessage(), 400);
    }

    $svgBruto = $corpo['svg'] ?? null;
    if (!is_string($svgBruto) || $svgBruto === '') {
        avst_erro('SVG_AUSENTE', 400);
    }
    try {
        $svgLimpo = SvgSanitizer::sanitizar($svgBruto);
    } catch (InvalidArgumentException $e) {
        error_log("AVST_SVG_REJEITADO user=$userId motivo=" . $e->getMessage());
        avst_erro('SVG_REJEITADO', 400, ['motivo' => $e->getMessage()]);
    }

    $baseVersion = isset($corpo['base_version']) ? (int) $corpo['base_version'] : null;

    // ── Transação: versão + histórico + espelhos ────────────────────
    $pdo->beginTransaction();

    $stV = $pdo->prepare("
        SELECT id, version FROM app_user_avatars
        WHERE user_id = ? AND is_active = 1
        ORDER BY updated_at DESC LIMIT 1
        FOR UPDATE
    ");
    $stV->execute([$userId]);
    $atual = $stV->fetch(PDO::FETCH_ASSOC);
    $versaoAtual = $atual ? (int) $atual['version'] : 0;

    // Conflito de abas: só quando o cliente declara de onde partiu
    if ($baseVersion !== null && $atual && $baseVersion !== $versaoAtual) {
        $pdo->rollBack();
        avst_erro('CONFLITO_VERSAO', 409, ['version' => $versaoAtual]);
    }

    $novaVersao = $versaoAtual + 1;

    // Publica o arquivo (nome versionado → fura o cache de 4h do Cloudflare)
    $dirFisico = realpath(__DIR__ . '/../../public') . AVST_DIR_PUBLICO;
    if (!is_dir($dirFisico) && !mkdir($dirFisico, 0755, true) && !is_dir($dirFisico)) {
        $pdo->rollBack();
        avst_erro('DIR_PUBLICACAO', 500);
    }
    $arquivo = sprintf('u%d-v%d.svg', $userId, $novaVersao);
    $caminho = $dirFisico . '/' . $arquivo;
    $tmp = $caminho . '.tmp';
    if (file_put_contents($tmp, $svgLimpo, LOCK_EX) === false || !rename($tmp, $caminho)) {
        @unlink($tmp);
        $pdo->rollBack();
        avst_erro('ESCRITA_ARQUIVO', 500);
    }
    $renderUrl = AVST_DIR_PUBLICO . '/' . $arquivo;

    $pdo->prepare('UPDATE app_user_avatars SET is_active = 0, updated_at = NOW() WHERE user_id = ? AND is_active = 1')
        ->execute([$userId]);

    $pdo->prepare("
        INSERT INTO app_user_avatars
            (user_id, avatar_type, avatar_config, avatar_image_url, is_active, version, created_at, updated_at)
        VALUES (?, 'generated', ?, ?, 1, ?, NOW(), NOW())
    ")->execute([
        $userId,
        json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $renderUrl,
        $novaVersao,
    ]);

    // Espelho para o header/sessão (mesmo comportamento do avatar.php legado)
    $pdo->prepare('UPDATE app_users SET avatar_url = ?, updated_at = NOW() WHERE id = ?')
        ->execute([$renderUrl, $userId]);

    $pdo->commit();

    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        $_SESSION['user']['avatar_url'] = $renderUrl; // check.php reflete sem relogin
    }
    session_write_close();

    avst_ok(['version' => $novaVersao, 'render_url' => $renderUrl]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[avatar/studio.php] ' . $e->getMessage());
    avst_erro('ERRO_INTERNO', 500);
}
