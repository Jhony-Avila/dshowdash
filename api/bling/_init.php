<?php
// Bling / _init.php - bootstrap do modulo
// @module  bling.init
// @version 1.0.0
// @created 2026-07-30
//
// Molde: api/google-calendar/_init.php (que espelha outlook -> pipedrive).
// Concentra requires, CORS e helpers de body/acesso.
//
// ENVELOPE: este modulo SEMPRE responde {ok, data, error} via ApiResponse.
// Nunca {success}. Ver docs/BLING/00-fase0-investigacao.md #7.8 - o widget
// legado do header testa j.success contra uma API que devolve {ok} e por isso
// esta preso em "--" desde sempre, com o erro voltando como HTTP 200.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

// ── Nucleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';

// ── Bibliotecas do modulo ───────────────────────────────────────
require_once __DIR__ . '/lib/BlingSituacoes.php';
require_once __DIR__ . '/lib/BlingProviderBase.php';
require_once __DIR__ . '/lib/BlingMock.php';

// ── Fase 4: banco, OAuth, cliente e sincronizacao ───────────────
require_once __DIR__ . '/lib/BlingCrypto.php';
require_once __DIR__ . '/lib/BlingTransporte.php';
require_once __DIR__ . '/lib/BlingOAuth.php';
require_once __DIR__ . '/lib/BlingVersionAdapter.php';
require_once __DIR__ . '/lib/BlingNormalizer.php';
require_once __DIR__ . '/repositories/BlingRepository.php';
require_once __DIR__ . '/lib/BlingClient.php';
require_once __DIR__ . '/lib/BlingReal.php';
require_once __DIR__ . '/services/BlingAuthService.php';
require_once __DIR__ . '/services/BlingSyncService.php';
require_once __DIR__ . '/services/BlingQueueService.php';
require_once __DIR__ . '/services/BlingWebhookService.php';

require_once __DIR__ . '/lib/BlingProvider.php';

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/StatusController.php';
require_once __DIR__ . '/controllers/HeaderController.php';
require_once __DIR__ . '/controllers/OverviewController.php';
require_once __DIR__ . '/controllers/ResourceController.php';
require_once __DIR__ . '/controllers/AnalyticsController.php';
require_once __DIR__ . '/controllers/SyncController.php';
require_once __DIR__ . '/controllers/HistoryController.php';
require_once __DIR__ . '/controllers/ExportController.php';
require_once __DIR__ . '/controllers/OAuthController.php';
require_once __DIR__ . '/controllers/WebhookController.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true,
]);

/**
 * Nivel minimo de acesso ao modulo (decisao 8.3: nivel na Fase 1, granular na 6).
 * Mesmo gate do Pipedrive.
 */
const BLING_NIVEL_MINIMO = 50;

/** Exige sessao valida e nivel minimo. Encerra a requisicao se reprovar. */
function bling_require_access(): array
{
    return AuthHelpers::requireAuth(BLING_NIVEL_MINIMO);
}

/** Body JSON do request. [] se vazio; 400 se malformado. */
function bling_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        ApiResponse::error('INVALID_JSON', 400, ['message' => 'Corpo da requisicao nao e JSON valido.']);
    }
    return $data;
}

/**
 * Identificador de correlacao da requisicao (§59, §63, §65).
 * Reaproveita o do cliente quando vem, para costurar o rastro fim a fim.
 */
function bling_correlation_id(): string
{
    static $id = null;
    if ($id !== null) {
        return $id;
    }
    $vindo = $_SERVER['HTTP_X_CORRELATION_ID'] ?? '';
    if (is_string($vindo) && preg_match('/^[A-Za-z0-9\-]{8,64}$/', $vindo)) {
        return $id = $vindo;
    }
    return $id = 'bl-' . bin2hex(random_bytes(8));
}

/** Query string: inteiro dentro de faixa, com padrao. */
function bling_int(string $chave, int $padrao, int $min, int $max): int
{
    $v = $_GET[$chave] ?? null;
    if ($v === null || $v === '' || !is_numeric($v)) {
        return $padrao;
    }
    return max($min, min($max, (int) $v));
}

/** Query string: texto saneado, com limite de tamanho. */
function bling_str(string $chave, string $padrao = '', int $max = 120): string
{
    $v = $_GET[$chave] ?? null;
    if (!is_string($v) || $v === '') {
        return $padrao;
    }
    return mb_substr(trim($v), 0, $max);
}

/**
 * Filtros comuns a praticamente todas as telas (§12).
 * O periodo e sempre resolvido para um par de datas ISO, nunca fica implicito.
 */
function bling_filtros(): array
{
    $periodo = bling_str('periodo', '30d', 12);
    $fim     = bling_str('ate', date('Y-m-d'), 10);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fim)) {
        $fim = date('Y-m-d');
    }

    $dias = match ($periodo) {
        'hoje'  => 1,
        '7d'    => 7,
        '30d'   => 30,
        '90d'   => 90,
        '12m'   => 365,
        default => 30,
    };

    $inicio = bling_str('de', '', 10);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inicio)) {
        $inicio = date('Y-m-d', strtotime("$fim -" . ($dias - 1) . " days"));
    }

    return [
        'periodo'     => $periodo,
        'de'          => $inicio,
        'ate'         => $fim,
        'dias'        => $dias,
        'conta'       => bling_str('conta', 'todas', 40),
        'unidade'     => bling_str('unidade', 'todas', 40),
        'busca'       => bling_str('q', '', 120),
        'situacao'    => bling_str('situacao', '', 40),
        'canal'       => bling_str('canal', '', 40),
        'deposito'    => bling_str('deposito', '', 40),
        'categoria'   => bling_str('categoria', '', 60),
        'fornecedor'  => bling_str('fornecedor', '', 60),
        'vendedor'    => bling_str('vendedor', '', 60),
        'ordenar'     => bling_str('ordenar', '', 60),
        'direcao'     => bling_str('direcao', 'desc', 4) === 'asc' ? 'asc' : 'desc',
        'pagina'      => bling_int('pagina', 1, 1, 10000),
        'limite'      => bling_int('limite', 50, 1, 500),
        'comparar'    => bling_str('comparar', 'periodo_anterior', 32),
        'granularidade' => bling_str('granularidade', 'dia', 12),
    ];
}

/**
 * meta padrao de toda resposta do modulo.
 * O front-end usa `simulado` para a tarja do §59 e NADA MAIS - nenhuma tela tem
 * ramo condicional por provedor. E isso que garante o §72.
 */
function bling_meta(array $extra = []): array
{
    $p = BlingProvider::atual();
    return array_merge([
        'provider'       => $p->nome(),
        'simulado'       => $p->ehSimulado(),
        'ultima_sync'    => $p->ultimaSync(),
        'correlation_id' => bling_correlation_id(),
        'gerado_em'      => gmdate('c'),
    ], $extra);
}
