<?php
// Google Analytics / _init.php — bootstrap do módulo
// @module  google-analytics.init
// @version 1.0.0
// @created 2026-07-30
//
// Molde: api/google-calendar/_init.php (que espelha outlook, que espelha pipedrive).
declare(strict_types=1);

// ── Núcleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
// ⚠️ Banco entra aqui por UM motivo só: a conciliação de leads (§32) precisa do lado CRM
// REAL (PIPE_DSHOW). O módulo NÃO tem banco próprio — nenhuma tabela `ga_*` existe.
// Toda leitura daqui é somente-leitura e vive em `GaCrm`.
require_once __DIR__ . '/../../config/db_connection.php';

// ── Bibliotecas do módulo ───────────────────────────────────────
require_once __DIR__ . '/lib/GaProvider.php';
require_once __DIR__ . '/lib/GaCrm.php';
require_once __DIR__ . '/lib/GaMock.php';
require_once __DIR__ . '/lib/GaReal.php';

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/StatusController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/AdminController.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true,
]);

/**
 * Acesso ao módulo: qualquer usuário autenticado.
 *
 * ⚠️ A matriz de permissões da §71 (Administrador / Gestor / Analista / Comercial / Técnico /
 * Somente leitura) NÃO está implementada aqui, e isso é deliberado nesta fase: o modelo de
 * autorização real deste projeto é UARPS (`app_user_trigger_permissions` + `app_user_roles`),
 * e gravar permissão em tabela que ninguém lê criaria a ilusão de controle. Enquanto a Fase 1
 * é mock e só lê, o gate é autenticação. A §71 entra junto com a Fase 4, sobre UARPS.
 */
function ga_require_access(): void
{
    AuthHelpers::requireAuth();
}

/** Modo de demonstração — ligado por GA_PROVIDER=mock (default). */
function ga_is_mock(): bool
{
    return GaMock::isEnabled();
}

/**
 * Provedor ativo. A troca NÃO muda rota, contrato nem tela (§4.3, §83 do briefing).
 * ⚠️ O real responde 503 com a lista de pendências; jamais cai para mock silenciosamente.
 */
function ga_provider(): GaProvider
{
    return ga_is_mock() ? new GaMock() : new GaReal();
}

/** Inteiro de query com faixa; devolve o default quando ausente/inválido. */
function ga_qint(string $key, int $default, int $min, int $max): int
{
    $v = $_GET[$key] ?? null;
    if ($v === null || $v === '' || !is_numeric($v)) { return $default; }
    $n = (int)$v;
    return $n < $min ? $min : ($n > $max ? $max : $n);
}

/**
 * Filtros globais (§66), lidos da query string e NORMALIZADOS aqui — nunca no provedor.
 *
 * ⚠️ A janela é obrigatoriamente limitada (teto de 400 dias). A Data API cobra por
 * requisição e por linha; deixar o cliente pedir "desde 2022" é o caminho mais curto para
 * estourar a quota Core e derrubar o módulo inteiro (§57).
 *
 * ⚠️ TUDO em America/Sao_Paulo. GA4 tem timezone POR PROPRIEDADE, e este servidor tem as
 * tabelas de fuso do MySQL vazias (`CONVERT_TZ` por nome devolve NULL, e NULL num WHERE de
 * janela faz a linha desaparecer sem erro no log). Regra do projeto: guardar UTC, converter
 * só na borda — aqui, que é a borda.
 */
function ga_filtros(): array
{
    $tz  = new DateTimeZone('America/Sao_Paulo');
    $hoje = new DateTimeImmutable('today', $tz);

    $preset = (string)($_GET['periodo'] ?? '28d');
    $mapa = [
        'hoje'   => [0, 0],
        'ontem'  => [1, 1],
        '7d'     => [6, 0],
        '14d'    => [13, 0],
        '28d'    => [27, 0],
        '30d'    => [29, 0],
        '90d'    => [89, 0],
        '365d'   => [364, 0],
    ];

    if (isset($_GET['inicio'], $_GET['fim'])) {
        $ini = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$_GET['inicio'], $tz);
        $fim = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$_GET['fim'], $tz);
        if ($ini === false || $fim === false) {
            ApiResponse::error('GA_PERIODO_INVALIDO', 400, ['message' => 'Datas devem estar no formato YYYY-MM-DD.']);
        }
        $preset = 'personalizado';
    } else {
        [$de, $ate] = $mapa[$preset] ?? $mapa['28d'];
        if (!isset($mapa[$preset])) { $preset = '28d'; }
        $ini = $hoje->modify("-{$de} days");
        $fim = $hoje->modify("-{$ate} days");
    }

    if ($ini > $fim) { [$ini, $fim] = [$fim, $ini]; }

    $dias = (int)$ini->diff($fim)->days + 1;
    if ($dias > 400) {
        $ini = $fim->modify('-399 days');
        $dias = 400;
    }
    // Futuro não existe em relatório: corta em hoje.
    if ($fim > $hoje) { $fim = $hoje; }

    return [
        'periodo'    => $preset,
        'inicio'     => $ini->format('Y-m-d'),
        'fim'        => $fim->format('Y-m-d'),
        'dias'       => $dias,
        'comparar'   => (string)($_GET['comparar'] ?? 'anterior'),
        'cenario'    => (string)($_GET['cenario'] ?? 'saudavel'),
        // Dimensões de corte (cross-filter, §63) — cada tela usa o que precisa.
        'canal'      => isset($_GET['canal']) ? (string)$_GET['canal'] : null,
        'campanha'   => isset($_GET['campanha']) ? (string)$_GET['campanha'] : null,
        'dispositivo'=> isset($_GET['dispositivo']) ? (string)$_GET['dispositivo'] : null,
        'pagina'     => isset($_GET['pagina']) ? (string)$_GET['pagina'] : null,
        'evento'     => isset($_GET['evento']) ? (string)$_GET['evento'] : null,
        'limite'     => ga_qint('limite', 100, 5, 500),
    ];
}
