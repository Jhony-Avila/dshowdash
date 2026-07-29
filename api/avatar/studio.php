<?php
declare(strict_types=1);

/**
 * /api/avatar/studio.php — persistência oficial do Avatar Studio.
 * @version 1.1.0
 * @changelog 1.1.0 (2026-07-29) — upload de FOTO (data:image/png recortado no
 *   front, re-ENCODADO no servidor via GD → mata payload embutido/polyglot,
 *   480×480, avatar_type='image'); GET devolve também tipo_ativo e
 *   config_camadas_recente (o estúdio recupera o último trabalho em camadas
 *   mesmo com foto ativa); rate limit passa a contar generated+image.
 * @created 2026-07-29
 *
 * Contrato (envelope {ok,data,error,meta} padrão do dash):
 *   GET               → { config, version, render_url, avatar_url,
 *                         tipo_ativo: 'camadas'|'foto'|'legado'|null,
 *                         config_camadas_recente }
 *   GET ?historico=1  → { itens: [{id, tipo, config, url, criado_em}] } (12)
 *   POST {config,svg,base_version}  → salva avatar em camadas (SVG sanitizado)
 *   POST {foto,base_version}        → salva foto recortada (PNG re-encodado)
 *   base_version divergente → 409 (conflito entre abas).
 *
 * SEGURANÇA: nada do front é confiado — config é RECONSTRUÍDO campo a campo
 * (ids por regex, cores hex), o SVG passa por whitelist fail-closed, fotos
 * são re-encodadas pixel a pixel via GD, o user_id vem SEMPRE da sessão
 * (nunca do payload — sem IDOR), CSRF na escrita, rate limit 30/h.
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

/**
 * Decodifica e RE-ENCODA a foto (front envia canvas PNG já recortado).
 * Re-encodar pixel a pixel via GD elimina metadados e payloads embutidos.
 * @return string bytes PNG 480×480
 */
function avst_processar_foto(string $dataUrl): string
{
    if (!function_exists('imagecreatefromstring')) {
        throw new RuntimeException('SEM_GD');
    }
    if (!preg_match('#^data:image/png;base64,#', $dataUrl)) {
        throw new InvalidArgumentException('FOTO_FORMATO');
    }
    $b64 = substr($dataUrl, strlen('data:image/png;base64,'));
    if (strlen($b64) > 8_000_000) { // ~6 MB decodificado
        throw new InvalidArgumentException('FOTO_MUITO_GRANDE');
    }
    $bytes = base64_decode($b64, true);
    if ($bytes === false) {
        throw new InvalidArgumentException('FOTO_BASE64');
    }
    $img = @imagecreatefromstring($bytes);
    if ($img === false) {
        throw new InvalidArgumentException('FOTO_INVALIDA');
    }
    $lg = imagesx($img);
    $al = imagesy($img);
    if ($lg < 64 || $al < 64) {
        imagedestroy($img);
        throw new InvalidArgumentException('FOTO_PEQUENA');
    }
    // recorte central quadrado (o front já manda quadrado; garantimos aqui)
    $lado = min($lg, $al);
    $final = imagecreatetruecolor(480, 480);
    imagealphablending($final, false);
    imagesavealpha($final, true);
    imagecopyresampled(
        $final, $img,
        0, 0,
        (int) (($lg - $lado) / 2), (int) (($al - $lado) / 2),
        480, 480, $lado, $lado
    );
    imagedestroy($img);
    ob_start();
    imagepng($final, null, 7);
    imagedestroy($final);
    $png = ob_get_clean();
    if ($png === false || $png === '') {
        throw new RuntimeException('FOTO_ENCODE');
    }
    return $png;
}

try {
    $pdo = getConnection('DSHOWDASH');

    // ── GET ─────────────────────────────────────────────────────────
    if ($metodo === 'GET') {
        if (isset($_GET['historico'])) {
            $st = $pdo->prepare("
                SELECT id, avatar_type, avatar_config, avatar_image_url, created_at
                FROM app_user_avatars
                WHERE user_id = ? AND avatar_type IN ('generated', 'image')
                ORDER BY id DESC
                LIMIT 12
            ");
            $st->execute([$userId]);
            $itens = [];
            foreach ($st as $l) {
                $cfg = json_decode((string) ($l['avatar_config'] ?? ''), true);
                $itens[] = [
                    'id'        => (int) $l['id'],
                    'tipo'      => $l['avatar_type'] === 'image' ? 'foto' : 'camadas',
                    'config'    => (is_array($cfg) && ($cfg['formato'] ?? '') === 'camadas') ? $cfg : null,
                    'url'       => $l['avatar_image_url'] ?: null,
                    'criado_em' => $l['created_at'],
                ];
            }
            session_write_close();
            avst_ok(['itens' => $itens]);
        }

        $ativo = avst_ativo($pdo, $userId);
        $configAtivo = avst_config_da_linha($ativo);

        // último trabalho em CAMADAS (mesmo que uma foto esteja ativa agora)
        $configRecente = $configAtivo;
        if ($configRecente === null) {
            $stC = $pdo->prepare("
                SELECT avatar_config FROM app_user_avatars
                WHERE user_id = ? AND avatar_type = 'generated' AND avatar_config IS NOT NULL
                ORDER BY id DESC LIMIT 1
            ");
            $stC->execute([$userId]);
            $bruto = json_decode((string) ($stC->fetchColumn() ?: ''), true);
            if (is_array($bruto) && ($bruto['formato'] ?? '') === 'camadas') {
                $configRecente = $bruto;
            }
        }

        $tipoAtivo = null;
        if ($ativo) {
            $tipoAtivo = $configAtivo !== null ? 'camadas'
                : ($ativo['avatar_type'] === 'image' ? 'foto' : 'legado');
        }

        $stU = $pdo->prepare('SELECT avatar_url FROM app_users WHERE id = ?');
        $stU->execute([$userId]);
        $avatarUrl = (string) ($stU->fetchColumn() ?: '');
        if ($tipoAtivo === null && $avatarUrl !== '') {
            $tipoAtivo = 'legado';
        }

        session_write_close();
        avst_ok([
            'config'                 => $configAtivo,
            'version'                => $ativo ? (int) $ativo['version'] : 0,
            'render_url'             => $ativo['avatar_image_url'] ?? null,
            'avatar_url'             => $avatarUrl ?: null,
            'tipo_ativo'             => $tipoAtivo,
            'config_camadas_recente' => $configRecente,
        ]);
    }

    // ── POST ────────────────────────────────────────────────────────
    requireCsrf();

    $corpo = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($corpo)) {
        avst_erro('JSON_INVALIDO', 400);
    }

    // Rate limit (mesmo padrão do avatar-upload.php; conta camadas + fotos)
    $stRl = $pdo->prepare("
        SELECT COUNT(*) FROM app_user_avatars
        WHERE user_id = ? AND avatar_type IN ('generated', 'image') AND created_at > ?
    ");
    $stRl->execute([$userId, date('Y-m-d H:i:s', time() - 3600)]);
    if ((int) $stRl->fetchColumn() >= AVST_LIMITE_HORA) {
        avst_erro('RATE_LIMIT', 429, ['limite_por_hora' => AVST_LIMITE_HORA]);
    }

    // ── Modo do salvamento: FOTO ou CAMADAS ─────────────────────────
    $modoFoto  = isset($corpo['foto']);
    $conteudo  = '';   // bytes a publicar
    $extensao  = '';
    $tipoLinha = '';
    $configJson = null;

    if ($modoFoto) {
        try {
            $conteudo = avst_processar_foto(is_string($corpo['foto']) ? $corpo['foto'] : '');
        } catch (InvalidArgumentException $e) {
            avst_erro($e->getMessage(), 400);
        } catch (RuntimeException $e) {
            error_log('[avatar/studio.php] foto: ' . $e->getMessage());
            avst_erro($e->getMessage(), 500);
        }
        $extensao = 'png';
        $tipoLinha = 'image';
    } else {
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
            $conteudo = SvgSanitizer::sanitizar($svgBruto);
        } catch (InvalidArgumentException $e) {
            error_log("AVST_SVG_REJEITADO user=$userId motivo=" . $e->getMessage());
            avst_erro('SVG_REJEITADO', 400, ['motivo' => $e->getMessage()]);
        }
        $extensao = 'svg';
        $tipoLinha = 'generated';
        $configJson = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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
    $arquivo = sprintf('u%d-v%d.%s', $userId, $novaVersao, $extensao);
    $caminho = $dirFisico . '/' . $arquivo;
    $tmp = $caminho . '.tmp';
    if (file_put_contents($tmp, $conteudo, LOCK_EX) === false || !rename($tmp, $caminho)) {
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
        VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())
    ")->execute([$userId, $tipoLinha, $configJson, $renderUrl, $novaVersao]);

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
