<?php
// DataTables / index.php - roteador PATH_INFO do modulo
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Molde: api/koala/index.php. nginx mapeia ^/api/datatables(/.*)?$ para este arquivo.
//
// Rotas:
//   GET    /dashboard                 big numbers + distribuicao + problemas + pendencias
//   GET    /lookups                   ambientes/servidores/aplicacoes p/ filtros
//   GET    /search?q=&exact=          busca global (§21)
//   GET    /databases                 listagem paginada (§11)
//   GET    /tables                    listagem paginada (§18)
//   GET    /tables/{id}               detalhe completo (§19)
//   GET    /fields/sensitive?kind=    campos sensiveis (§20.2)
//   GET    /connections               listagem
//   POST   /connections               cadastro
//   GET    /connections/{id}          detalhe (sem credencial)
//   PATCH  /connections/{id}          edicao
//   DELETE /connections/{id}          desativacao (soft)
//   POST   /connections/{id}/check     verificacao sob demanda (§14)
//   POST   /connections/{id}/inventory inventario sob demanda (§7)
//   GET    /connections/{id}/health    card de saude + disponibilidade (§12)
//   GET    /infrastructure           arvore servidor->conexao->banco (§38.2)
//   GET    /infrastructure/tables?database_id=  tabelas de um banco (expansao)
//   GET    /applications              visao por aplicacao->modulo->banco (§38.3)
//   GET    /servers                   servidores e VPSs (§38.4)
//   POST   /servers                   cadastrar servidor
//   GET/PATCH/DELETE /servers/{id}    detalhe / editar / desativar
//   POST   /applications              cadastrar aplicacao
//   PATCH/DELETE /applications/{id}   editar / desativar
//   POST   /applications/{id}/modules            criar modulo
//   DELETE /applications/{id}/modules/{modId}    remover modulo
//   GET    /dependencies              relacoes, orfas e FKs quebradas (§38.10)
//   GET    /sources                    fontes externas: APIs, arquivos, caches (§34/35)
//   GET    /quality?severity=&rule=    problemas de qualidade (§38.11)
//   GET    /alerts?status=&severity=   central de alertas (§28)
//   POST   /alerts/{id}/acknowledge    reconhecer
//   POST   /alerts/{id}/resolve        resolver manualmente
//   GET    /admin                     limites, regras, canais, silencios, cron (§38.15)
//   POST/DELETE /admin/{limits|rules|silences}   configurar
//   PATCH  /admin/channels/{id}       canal (segredo cifrado)
//   GET    /maintenance                janelas abertas
//   POST   /maintenance                abrir janela (§27)
//   POST   /maintenance/{id}/close     encerrar janela
declare(strict_types=1);

@ini_set('display_errors', '0');   // nunca vazar stack/paths ao cliente

require_once __DIR__ . '/_init.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[datatables] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
        'message' => 'Erro interno ao processar a solicitacao.',
    ]);
});

SessionGate::start();
dt_require_access();
AuthHelpers::requireCsrfForWrite();   // gate central de CSRF para POST/PUT/PATCH/DELETE

$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path     = trim((string)($_SERVER['PATH_INFO'] ?? ''), '/');
$segments = $path === '' ? [] : explode('/', $path);

$pdo = getConnection('DSHOWDASH');

switch ($segments[0] ?? '') {
    case '':
    case 'dashboard':
        DtCatalogController::dashboard($method, $pdo);
        break;

    case 'lookups':
        DtCatalogController::lookups($method, $pdo);
        break;

    case 'search':
        DtCatalogController::search($method, $pdo);
        break;

    case 'databases':
        DtCatalogController::databases($method, $segments, $pdo);
        break;

    case 'tables':
        DtCatalogController::tables($method, $segments, $pdo);
        break;

    case 'fields':
        DtCatalogController::fields($method, $segments, $pdo);
        break;

    case 'connections':
        DtConnectionController::route($method, $segments, $pdo);
        break;

    case 'infrastructure':
        DtCatalogController::infrastructure($method, $segments, $pdo);
        break;

    case 'applications':
        DtServerController::applications($method, $segments, $pdo);
        break;

    case 'servers':
        DtServerController::servers($method, $segments, $pdo);
        break;

    case 'dependencies':
        DtCatalogController::dependencies($method, $segments, $pdo);
        break;

    case 'sources':
        requireMethod(['GET']);
        ApiResponse::success(
            (new DtExternalSourceService($pdo))->listSources(),
            ['timestamp' => date('c')]
        );
        break;

    case 'quality':
        requireMethod(['GET']);
        DtCatalogController::quality($method, $segments, $pdo);
        break;

    case 'alerts':
        DtAlertController::route($method, $segments, $pdo);
        break;

    case 'maintenance':
        DtMonitoringController::maintenance($method, $segments, $pdo);
        break;

    case 'admin':
        DtAdminController::route($method, $segments, $pdo);
        break;

    case 'metrics':
        // Serie de tendencia. ?db=<id> -> serie daquele banco (drawer de Banco);
        // sem db -> a serie executiva do maior banco (Visao Geral). Read-only.
        requireMethod(['GET']);
        $svcMetricas = new DtMetricsService($pdo);
        $dbMetrica   = isset($_GET['db']) ? (int) $_GET['db'] : 0;
        if ($dbMetrica > 0) {
            ApiResponse::success([
                'db_id'  => $dbMetrica,
                'series' => $svcMetricas->databaseSeries($dbMetrica, 90),
            ], ['timestamp' => date('c')]);
        } else {
            ApiResponse::success([
                'coverage' => $svcMetricas->coverage(),
                'series'   => $svcMetricas->overviewSeries(90),
            ], ['timestamp' => date('c')]);
        }
        break;

    case 'discovery':
        // Auditoria de descoberta e reconciliacao (§11/§12/§30).
        //   GET  /discovery              ultima rodada + big numbers + lista reconciliada
        //   GET  /discovery/evidences?key=  evidencias de um banco (drawer)
        //   POST /discovery/run          dispara uma rodada (CSRF ja exigido no topo)
        $svcDisc = new DtDiscoveryService($pdo);
        $sub = $segments[1] ?? '';
        if ($sub === 'run') {
            requireMethod(['POST']);
            @set_time_limit(120);
            ApiResponse::success(
                ['run' => $svcDisc->run('user#' . AuthHelpers::getCurrentUserId())],
                ['timestamp' => date('c')]
            );
        } elseif ($sub === 'evidences') {
            requireMethod(['GET']);
            ApiResponse::success(
                ['db_key' => (string)($_GET['key'] ?? ''), 'evidences' => $svcDisc->evidencesFor((string)($_GET['key'] ?? ''))],
                ['timestamp' => date('c')]
            );
        } elseif ($sub === 'report') {
            // Relatorio final §31: resumo + pendencias prioritarias + recomendacoes.
            requireMethod(['GET']);
            ApiResponse::success($svcDisc->getReport(), ['timestamp' => date('c')]);
        } elseif ($sub === 'export') {
            // §31: entregavel CSV da lista reconciliada (ex.: para o DBA criar credencial).
            requireMethod(['GET']);
            $csv = $svcDisc->exportCsv();
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="descoberta-bancos-' . date('Ymd-His') . '.csv"');
            header('Content-Length: ' . strlen($csv));
            echo "\xEF\xBB\xBF" . $csv;   // BOM p/ Excel abrir UTF-8 certo
            exit;
        } elseif (ctype_digit($sub) && ($segments[2] ?? '') === 'classify') {
            // POST /discovery/{id}/classify — classificação manual §11.4 (legado/falso_positivo/ignorado)
            requireMethod(['POST']);
            $body = dt_body();
            ApiResponse::success(
                ['database' => $svcDisc->classifyManual(
                    (int) $sub,
                    isset($body['status']) ? (string) $body['status'] : null,
                    isset($body['note']) ? (string) $body['note'] : null,
                    'user#' . AuthHelpers::getCurrentUserId()
                )],
                ['timestamp' => date('c')]
            );
        } else {
            requireMethod(['GET']);
            ApiResponse::success($svcDisc->getLatest(), ['timestamp' => date('c')]);
        }
        break;

    case 'health':
        // Sonda do proprio modulo - util para o painel saber se o backend responde.
        ApiResponse::success([
            'module'           => 'datatables',
            'version'          => '1.0.0',
            'crypto_configured' => DtCrypto::isConfigured(),
        ], ['timestamp' => date('c')]);
        break;

    default:
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
            'message' => 'Rota nao encontrada: ' . $path,
        ]);
}
