<?php
declare(strict_types=1);

/**
 * /api/avatar/studio.php — persistência oficial do Avatar Studio.
 * @version 1.7.0
 * @changelog 1.7.0 (2026-07-30) — RETOMADA DO 3D (fila #37): GET devolve
 *   também config_3d_recente (último formato:'3d' do usuário, RE-VALIDADO
 *   por avst_validar_config3d na leitura — fail-closed até contra linhas
 *   antigas); o Estúdio 3D reabre exatamente onde o usuário parou
 *   (sockets, palco vivo, cores, morfos), inclusive após reativar uma
 *   versão 3D pelo Histórico.
 * @changelog 1.6.0 (2026-07-30) — FOTO ESTILIZADA (4.6 §21, decisão #42):
 *   POST {foto, config_foto?, base_version} aceita parâmetros de APRESENTAÇÃO
 *   (fundo/banner/aura/efeito/moldura/emblema/título/destaque — NUNCA
 *   roupa/corpo) validados campo a campo e gravados como formato:
 *   'foto_estilizada' junto do PNG composto (re-encodado GD, como sempre);
 *   travas de desbloqueio valem também para os assets sobre a foto.
 * @changelog 1.5.0 (2026-07-30) — HISTÓRICO COMPLETO (4.6 §22, decisão #42):
 *   GET ?historico=1 passa a 100 itens com nome/fixado/ativo/versão (JOIN
 *   avatar_version_meta); POST {historico_meta:{id,nome?,fixado?}} nomeia e
 *   fixa versões (posse pela sessão); retenção de 100 versões por usuário
 *   com poda pós-salvamento — FIXADAS e a ATIVA nunca são podadas.
 * @changelog 1.4.0 (2026-07-30) — PERSISTÊNCIA 3D (Fase 2, PoC aprovada):
 *   POST {config3d, render, base_version} salva parâmetros JSON formato:'3d'
 *   (decisão #31) + PNG derivado re-encodado via GD como avatar oficial;
 *   GET/histórico reconhecem tipo_ativo '3d'.
 * @changelog 1.3.0 (2026-07-30) — desbloqueio validado no backend (403)
 * @changelog 1.2.0 (2026-07-29) — galeria de fotos (GET ?fotos=1, dedup por
 *   arquivo) e REATIVAÇÃO (POST {reativar_id}: clona a linha antiga como nova
 *   versão ativa reaproveitando o MESMO arquivo — histórico continua
 *   append-only; posse verificada por user_id da sessão, sem IDOR).
 * @changelog 1.1.0 (2026-07-29) — upload de FOTO (data:image/png recortado no
 *   front, re-ENCODADO no servidor via GD → mata payload embutido/polyglot,
 *   480×480, avatar_type='image'); GET devolve também tipo_ativo e
 *   config_camadas_recente (o estúdio recupera o último trabalho em camadas
 *   mesmo com foto ativa); rate limit passa a contar generated+image.
 * @created 2026-07-29
 *
 * Contrato (envelope {ok,data,error,meta} padrão do dash):
 *   GET               → { config, version, render_url, avatar_url,
 *                         tipo_ativo: 'camadas'|'foto'|'3d'|'legado'|null,
 *                         config_camadas_recente, config_3d_recente }
 *   GET ?historico=1  → { itens: [{id, tipo, config, url, criado_em, nome,
 *                         fixado, ativo, versao}], retencao } (100)
 *   POST {config,svg,base_version}  → salva avatar em camadas (SVG sanitizado)
 *   POST {foto,base_version}        → salva foto recortada (PNG re-encodado)
 *   POST {historico_meta:{id,nome?,fixado?}} → nomeia/fixa versão do usuário
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
require_once __DIR__ . '/VidaLib.php';
require_once __DIR__ . '/StudioLib.php'; // Onda 1 (Avatar nativo): validadores + persistência compartilhados com a ponte

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

try {
    $pdo = getConnection('DSHOWDASH');

    // ── GET ─────────────────────────────────────────────────────────
    if ($metodo === 'GET') {
        if (isset($_GET['historico'])) {
            $dados = avst_historico($pdo, $userId);
            session_write_close();
            avst_ok($dados);
        }

        // Galeria "Suas fotos" — todas as fotos já enviadas/capturadas,
        // deduplicadas por arquivo (reativações clonam a linha, não o PNG).
        if (isset($_GET['fotos'])) {
            $st = $pdo->prepare("
                SELECT MAX(id) AS id, avatar_image_url AS url, MAX(created_at) AS criado_em
                FROM app_user_avatars
                WHERE user_id = ? AND avatar_type = 'image' AND avatar_image_url IS NOT NULL
                GROUP BY avatar_image_url
                ORDER BY MAX(id) DESC
                LIMIT 24
            ");
            $st->execute([$userId]);
            $fotos = [];
            foreach ($st as $l) {
                $fotos[] = ['id' => (int) $l['id'], 'url' => $l['url'], 'criado_em' => $l['criado_em']];
            }
            session_write_close();
            avst_ok(['fotos' => $fotos]);
        }

        $dados = avst_estado($pdo, $userId);
        session_write_close();
        avst_ok($dados);
    }

    // ── POST ────────────────────────────────────────────────────────
    requireCsrf();

    $corpo = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($corpo)) {
        avst_erro('JSON_INVALIDO', 400);
    }

    // ── Modo HISTORICO_META (4.6 §22): nomear/fixar versão ──────────
    // Operação leve de metadado — não cria versão, então não consome o
    // rate limit de salvamento. Posse SEMPRE pela sessão (sem IDOR).
    if (isset($corpo['historico_meta'])) {
        $dados = avst_meta($pdo, $userId, $corpo['historico_meta']);
        session_write_close();
        avst_ok($dados);
    }

    // Rate limit (mesmo padrão do avatar-upload.php; conta camadas + fotos)
    $dados = avst_persistir($pdo, $userId, $corpo);
    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        $_SESSION['user']['avatar_url'] = $dados['render_url']; // check.php reflete sem relogin
    }
    session_write_close();
    avst_ok($dados);
} catch (AvstErro $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    avst_erro($e->codigo, $e->status, $e->extra);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[avatar/studio.php] ' . $e->getMessage());
    avst_erro('ERRO_INTERNO', 500);
}
