<?php
declare(strict_types=1);

/**
 * /api/avatar/vida.php — conquistas, eventos e Criar com IA (AS3 Fase 3).
 * @version 1.0.0  @created 2026-07-30
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
require_once __DIR__ . '/ia/ProvedorAnthropic.php';

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

// ── Eventos sazonais (janelas fixas no fuso de SP) ──────────────────
function vida_eventos(): array
{
    $tz = new DateTimeZone('America/Sao_Paulo');
    $hoje = new DateTimeImmutable('now', $tz);
    $ano = (int) $hoje->format('Y');
    $def = [
        ['id' => 'natal', 'nome' => 'Natal Dshow', 'descricao' => 'Dezembro inteiro com o Gorro de Natal liberado.',
         'inicio' => "$ano-12-01", 'fim' => "$ano-12-31", 'itens' => ['ace_gorro_natal']],
        ['id' => 'halloween', 'nome' => 'Halloween', 'descricao' => 'Fim de outubro com o Chapéu de Bruxa liberado.',
         'inicio' => "$ano-10-15", 'fim' => "$ano-11-02", 'itens' => ['ace_chapeu_bruxa']],
    ];
    $saida = [];
    foreach ($def as $e) {
        $ini = new DateTimeImmutable($e['inicio'] . ' 00:00:00', $tz);
        $fim = new DateTimeImmutable($e['fim'] . ' 23:59:59', $tz);
        $e['ativo'] = $hoje >= $ini && $hoje <= $fim;
        $saida[] = $e;
    }
    return $saida;
}

// ── Conquistas (registro: cada entrada = cálculo auditável) ─────────
function vida_conquistas(PDO $pdo, int $userId): array
{
    // métricas base (uma passada)
    $st = $pdo->prepare("
        SELECT
            COUNT(*) AS total,
            SUM(avatar_type = 'image') AS fotos,
            MIN(created_at) AS primeiro,
            SUM(HOUR(created_at) BETWEEN 5 AND 8) AS madrugadas
        FROM app_user_avatars
        WHERE user_id = ? AND avatar_type IN ('generated','image')
    ");
    $st->execute([$userId]);
    $m = $st->fetch(PDO::FETCH_ASSOC) ?: [];

    $stU = $pdo->prepare('SELECT created_at FROM app_users WHERE id = ?');
    $stU->execute([$userId]);
    $contaEm = (string) ($stU->fetchColumn() ?: '');

    $stA = $pdo->prepare("SELECT updated_at FROM app_user_avatars WHERE user_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1");
    $stA->execute([$userId]);
    $ativoEm = (string) ($stA->fetchColumn() ?: '');

    $enesimo = function (int $n) use ($pdo, $userId): ?string {
        $st = $pdo->prepare("SELECT created_at FROM app_user_avatars WHERE user_id = ? AND avatar_type IN ('generated','image') ORDER BY id ASC LIMIT 1 OFFSET " . ($n - 1));
        $st->execute([$userId]);
        return $st->fetchColumn() ?: null;
    };

    $total = (int) ($m['total'] ?? 0);
    $fotos = (int) ($m['fotos'] ?? 0);
    $dias30 = $contaEm !== '' && strtotime($contaEm) <= strtotime('-30 days');
    $fiel7 = $ativoEm !== '' && strtotime($ativoEm) <= strtotime('-7 days');

    return [
        ['id' => 'primeiro_avatar', 'nome' => 'Primeira Identidade', 'descricao' => 'Salve seu primeiro avatar no estúdio.',
         'conquistada' => $total >= 1, 'em' => $total >= 1 ? ($m['primeiro'] ?? null) : null, 'recompensa' => 'mol_pioneiro'],
        ['id' => 'colecionador_5', 'nome' => 'Colecionador', 'descricao' => 'Chegue a 5 versões salvas (camadas ou fotos).',
         'conquistada' => $total >= 5, 'em' => $total >= 5 ? $enesimo(5) : null, 'recompensa' => 'efe_confete'],
        ['id' => 'fotografo', 'nome' => 'Fotogênico', 'descricao' => 'Use uma foto real como avatar pelo menos uma vez.',
         'conquistada' => $fotos >= 1, 'em' => null, 'recompensa' => null],
        ['id' => 'veterano_30d', 'nome' => 'Veterano', 'descricao' => 'Complete 30 dias de casa no Dshow Dash.',
         'conquistada' => $dias30, 'em' => $dias30 ? date('Y-m-d H:i:s', strtotime($contaEm . ' +30 days')) : null, 'recompensa' => 'ace_medalha'],
        ['id' => 'madrugador', 'nome' => 'Madrugador', 'descricao' => 'Salve um avatar entre 5h e 9h da manhã.',
         'conquistada' => ((int) ($m['madrugadas'] ?? 0)) >= 1, 'em' => null, 'recompensa' => null],
        ['id' => 'identidade_fiel', 'nome' => 'Identidade Fiel', 'descricao' => 'Mantenha o mesmo avatar por 7 dias seguidos.',
         'conquistada' => $fiel7, 'em' => null, 'recompensa' => null],
    ];
}

try {
    $pdo = getConnection('DSHOWDASH');
    $ia = new ProvedorAnthropic();

    if ($metodo === 'GET') {
        $conquistas = vida_conquistas($pdo, $userId);
        $eventos = vida_eventos();
        $desbloqueados = [];
        foreach ($conquistas as $c) {
            if ($c['conquistada'] && $c['recompensa']) {
                $desbloqueados[] = $c['recompensa'];
            }
        }
        foreach ($eventos as $e) {
            if ($e['ativo']) {
                $desbloqueados = array_merge($desbloqueados, $e['itens']);
            }
        }
        session_write_close();
        vida_ok([
            'conquistas' => $conquistas,
            'eventos' => $eventos,
            'desbloqueados' => array_values(array_unique($desbloqueados)),
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
