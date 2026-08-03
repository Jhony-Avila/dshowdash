<?php
declare(strict_types=1);

/**
 * /api/avatar/vida.php — conquistas, eventos e Criar com IA (AS3 Fase 3).
 * @version 1.1.0  @created 2026-07-30  @updated 2026-07-30 (lógica na VidaLib)
 *
 * GET  → { conquistas: [{id,nome,descricao,conquistada,em,recompensa}],
 *          eventos: [{id,nome,descricao,ativo,inicio,fim,itens}],
 *          desbloqueados: [itemId,…], ia_disponivel: bool }
 * POST {pedido} → Criar com IA (ProvedorIA desacoplado — decisão #24);
 *          sem chave configurada devolve 501 IA_NAO_CONFIGURADA e o front
 *          usa o compositor temático local.
 *
 * CONQUISTAS REAIS E AUDITÁVEIS (decisão #25): calculadas AQUI, só de dados
 * verificáveis (app_user_avatars / app_users). Desbloqueio ADITIVO: o
 * catálogo atual permanece livre; conquistas/eventos liberam itens NOVOS.
 * Fontes novas (ex.: Pipedrive) entram como mais uma entrada no registro.
 */

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/ia/FabricaIA.php';
require_once __DIR__ . '/VidaLib.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'POST', 'OPTIONS'], 'no_cache' => true]);

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

function vida_ok(array $data): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data, 'error' => null, 'meta' => ['endpoint' => 'avatar/vida', 'version' => '1.0.0']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function vida_erro(string $codigo, int $status): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'data' => null, 'error' => $codigo, 'meta' => ['endpoint' => 'avatar/vida']], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getConnection('DSHOWDASH');
    $ia = FabricaIA::criar(); // provedor resolvido por config (AS5 F8.2)

    if ($metodo === 'GET') {
        $conquistas = vida_conquistas($pdo, $userId);
        $eventos = vida_eventos();
        session_write_close();
        vida_ok([
            'conquistas' => $conquistas,
            'eventos' => $eventos,
            'desbloqueados' => vida_desbloqueados($pdo, $userId),
            'ia_disponivel' => $ia->disponivel(),
        ]);
    }

    // ── POST: Criar com IA ──────────────────────────────────────────
    requireCsrf();
    $corpo = json_decode(file_get_contents('php://input') ?: '', true);
    $pedido = is_array($corpo) ? trim((string) ($corpo['pedido'] ?? '')) : '';
    if ($pedido === '' || mb_strlen($pedido) > 300) {
        vida_erro('PEDIDO_INVALIDO', 400);
    }
    $catalogo = is_array($corpo['catalogo'] ?? null) ? $corpo['catalogo'] : [];
    if (!$ia->disponivel()) {
        vida_erro('IA_NAO_CONFIGURADA', 501);
    }

    $bruto = $ia->criar($pedido, $catalogo);
    // revalida shape: ids só [a-z0-9_], cores só hex — o front revalida de novo
    $re = '/^[a-z0-9_]{1,40}$/';
    $limpo = ['base' => '', 'camadas' => [], 'cores' => [], 'nome' => '', 'historia' => ''];
    if (isset($bruto['base']) && preg_match($re, (string) $bruto['base'])) {
        $limpo['base'] = $bruto['base'];
    }
    foreach ((array) ($bruto['camadas'] ?? []) as $cat => $id) {
        if (preg_match('/^[a-z]{3,12}$/', (string) $cat) && preg_match($re, (string) $id)) {
            $limpo['camadas'][$cat] = $id;
        }
    }
    foreach ((array) ($bruto['cores'] ?? []) as $slot => $hex) {
        if (preg_match('/^[a-z]{3,10}$/', (string) $slot) && preg_match('/^#[0-9a-fA-F]{6}$/', (string) $hex)) {
            $limpo['cores'][$slot] = strtolower((string) $hex);
        }
    }
    $limpo['nome'] = mb_substr(strip_tags((string) ($bruto['nome'] ?? '')), 0, 60);
    $limpo['historia'] = mb_substr(strip_tags((string) ($bruto['historia'] ?? '')), 0, 240);

    session_write_close();
    vida_ok(['personagem' => $limpo, 'fonte' => 'anthropic']);
} catch (Throwable $e) {
    error_log('[avatar/vida.php] ' . $e->getMessage());
    vida_erro('ERRO_INTERNO', 500);
}
