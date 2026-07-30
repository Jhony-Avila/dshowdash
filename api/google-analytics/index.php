<?php
// Google Analytics / index.php — roteador PATH_INFO do módulo
// @version 1.0.0
// @created 2026-07-30
// @app Google Analytics
//
// Molde: api/google-calendar/index.php. nginx mapeia ^/api/google-analytics(/.*)?$ para
// este arquivo com PATH_INFO.
//
// Rotas (Fase 1 — mock-first, tudo GET e só leitura):
//   GET /status                  prontidão da integração + pendências do provedor real
//   GET /header/summary          resumo do ícone do header (§9.2) — 1 chamada, não 1 por card
//   GET /overview                KPIs + série + "exige atenção" (§15, §16, §17)
//   GET /realtime                tempo real (§18)                    [quota: REALTIME]
//   GET /acquisition             canais, campanhas, diagnóstico UTM (§19, §20, §22)
//   GET /acquisition/flow        Sankey da aquisição (§21)
//   GET /pages                   páginas + landing pages com score (§23, §24)
//   GET /events                  central de eventos + ausentes (§28)
//   GET /conversions             eventos importantes + conciliação CRM (§29, §32)
//   GET /funnel                  funis (§30, §31)                    [quota: FUNNEL]
//   GET /ecommerce               e-commerce, produtos, checkout (§33–§35)
//   GET /users                   usuários, dispositivos, regiões, coortes (§36–§40)
//   GET /quality                 qualidade da coleta + tagging (§42, §44)
//   GET /alerts                  alertas e regras (§50, §52)
//   GET /properties              contas → propriedades → streams (§13)
//   GET /quotas                  consumo por categoria de quota (§57.1)
//
// ⚠️ NENHUMA rota de escrita nesta fase. Measurement Protocol (§45) e edição de públicos
// (§38) entram depois — e o `api_secret` do MP nunca pode chegar ao front (§45.4).
declare(strict_types=1);

@ini_set('display_errors', '0');   // nunca vazar stack/paths ao cliente

require_once __DIR__ . '/_init.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[ga] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
        'message' => 'Erro interno ao processar a solicitação.',
    ]);
});

$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path     = trim((string)($_SERVER['PATH_INFO'] ?? ''), '/');
$segments = $path === '' ? [] : array_map('rawurldecode', explode('/', $path));

SessionGate::start();
ga_require_access();
AuthHelpers::requireCsrfForWrite();   // gate central; hoje não há rota de escrita, mas o gate fica

$p = ga_provider();

/** 405 padronizado, com o Allow correto. */
$metodoInvalido = static function (array $permitidos): void {
    header('Allow: ' . implode(', ', $permitidos));
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, [
        'message' => 'Método não permitido nesta rota.',
    ]);
};

/** Toda rota desta fase é GET. */
$soGet = static function () use ($method, $metodoInvalido): void {
    if ($method !== 'GET') { $metodoInvalido(['GET']); }
};

switch ($segments[0] ?? '') {
    case '':
    case 'status':
        $soGet();
        GaStatusController::status($p);
        break;

    case 'header':
        $soGet();
        GaStatusController::headerSummary($p);
        break;

    case 'overview':
        $soGet();
        GaReportController::overview($p);
        break;

    case 'realtime':
        $soGet();
        GaReportController::tempoReal($p);
        break;

    case 'acquisition':
        $soGet();
        if (($segments[1] ?? '') === 'flow') {
            GaReportController::fluxo($p);
        } else {
            GaReportController::aquisicao($p);
        }
        break;

    case 'pages':
        $soGet();
        GaReportController::paginas($p);
        break;

    case 'events':
        $soGet();
        GaReportController::eventos($p);
        break;

    case 'conversions':
        $soGet();
        GaReportController::conversoes($p);
        break;

    case 'funnel':
        $soGet();
        GaReportController::funil($p);
        break;

    case 'ecommerce':
        $soGet();
        GaReportController::ecommerce($p);
        break;

    case 'users':
        $soGet();
        GaReportController::usuarios($p);
        break;

    case 'quality':
        $soGet();
        GaReportController::qualidade($p);
        break;

    case 'alerts':
        $soGet();
        GaReportController::alertas($p);
        break;

    case 'properties':
        $soGet();
        GaAdminController::propriedades($p);
        break;

    case 'quotas':
        $soGet();
        GaAdminController::quotas($p);
        break;

    default:
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
            'message' => 'Rota não encontrada no módulo Google Analytics.',
            'rota'    => $path,
        ]);
}
