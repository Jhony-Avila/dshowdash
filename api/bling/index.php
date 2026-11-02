<?php
// Bling / index.php - roteador PATH_INFO do modulo
// @version 1.0.0
// @created 2026-07-30
// @app Bling
//
// Molde: api/google-calendar/index.php. nginx mapeia ^/api/bling(/.*)?$ para
// este arquivo com PATH_INFO.
//
// TODAS as respostas usam o envelope {ok, data, error} (ApiResponse).
//
// Rotas (Fase 2 — mock-first):
//   GET  /status                    prontidao da integracao + checklist de go-live
//   GET  /settings                  configuracoes do modulo
//   GET  /integrations              painel de integracoes e canais
//   GET  /accounts                  contas Bling e unidades de negocio (§13)
//   GET  /header/summary            resumo do icone do header (§8.2, §8.3)
//
//   GET  /overview                  KPIs + saude + atencao + evolucao + Sankey (§14-§18)
//   GET  /operations                Central Operacional — filas de trabalho
//   GET  /board                     Diretoria — leitura executiva
//   GET  /indicators                Indicadores com definicao de calculo
//   GET  /health                    §15 isolado
//   GET  /attention                 §16 isolado
//   GET  /evolution                 §17 isolado
//   GET  /flow                      §18 Sankey empresarial
//   GET  /network                   §19 mapa de relacionamento
//
//   GET  /resources/{recurso}       listagem paginada server-side (§51)
//                                   recursos em ResourceController::RECURSOS
//
//   GET  /abc                       §41 curva ABC
//   GET  /profitability             §40 rentabilidade + waterfall
//   GET  /fiscal-funnel             §31 funil fiscal
//   GET  /cashflow                  §34 fluxo de caixa
//   GET  /financial-flow            §35 Sankey financeiro
//   GET  /inventory-matrix          §24.3 matriz giro x margem
//   GET  /warehouse-flow            §25 fluxo entre depositos
//   GET  /price-simulator           §26.2 simulador (calculadora, nao persiste)
//   GET  /quality                   §23 qualidade cadastral
//   GET  /insights                  §42 anomalias por regra
//   GET  /forecast                  §43 projecao com R² exposto
//   GET  /reports                   §43 catalogo de relatorios
//
//   GET  /price-history             §26.1 historico de preco/custo/margem/volume
//   GET  /inventory-analytics       §24.2 cobertura, ruptura, aging, estoque x venda
//   GET  /logistics-analytics       §39 prometido x realizado, custo por regiao
//   GET  /margin-volume             §40 matriz margem x volume
//   GET  /export                    formatos disponiveis
//   GET  /export/{recurso}?formato= csv | xlsx  (PDF = impressao do navegador)
//   GET  /sync                      §47 estado da sincronizacao
//   POST /sync/run                  dispara sincronizacao (CSRF) — Fase 4
//   POST /oauth/connect             devolve a URL de autorizacao (CSRF)
//   GET  /oauth/callback            retorno do Bling — SEM gate de nivel
//   POST /oauth/disconnect          revoga e apaga tokens (CSRF)
//   POST /webhooks                  entrega do Bling — SEM sessao, SEM CSRF
declare(strict_types=1);

@ini_set('display_errors', '0');   // nunca vazar stack/paths ao cliente

// Declara a entrada ANTES do bootstrap: os internals recusam execução
// direta sem esta constante (ver guarda no topo de cada arquivo).
define('BLING_ENTRADA', true);
require_once __DIR__ . '/_init.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[bling] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine()
        . ' cid=' . bling_correlation_id());
    ApiResponse::error('ERRO_INTERNO', 500, [
        'message' => 'Erro interno ao processar a solicitacao.',
        'correlation_id' => bling_correlation_id(),
    ]);
});

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metodo === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$caminho = $_SERVER['PATH_INFO'] ?? '';
$caminho = '/' . trim((string) $caminho, '/');
$seg = $caminho === '/' ? [] : array_values(array_filter(explode('/', $caminho), static fn($s) => $s !== ''));
$rota = implode('/', $seg);

// ── WEBHOOK: ANTES da sessão e do gate, de propósito ────────────
// Quem chama é o Bling, um servidor externo. Não tem cookie, não tem token de
// sessão e não pode ter — o que o autentica é a assinatura HMAC do corpo,
// verificada dentro do BlingWebhookService.
//
// ⚠️ Passar por SessionGate::start() aqui seria ativamente ruim: abriria uma
// sessão nova a cada entrega do Bling, e o handler de sessão em disco encheria
// de arquivos órfãos.
if ($rota === 'webhooks') {
    BlingWebhookController::receber();   // sempre encerra a requisição
}

SessionGate::start();

// ── retorno do OAuth: ANTES do gate de nível ────────────────────
// Quem chega aqui é uma navegação de TOPO vinda do bling.com.br, não um fetch.
// Se o gate respondesse 401/403 em JSON — o que acontece se a sessão expirar
// durante o fluxo, que leva minutos —, o dono veria um objeto numa página
// branca em vez de voltar para a tela.
//
// O que autoriza esta rota é o `state`: uso único, gravado no banco no momento
// do "conectar", vinculado ao usuário que iniciou. Sem state válido, o
// controller redireciona com erro e nada é gravado. O nível já foi exigido lá,
// em /oauth/connect.
if ($rota === 'oauth/callback') {
    BlingOAuthController::retorno();   // sempre encerra em redirect
}

// Gate de acesso: nivel minimo, aplicado a TODAS as rotas do modulo.
// Decisao 8.3 — nivel na Fase 1, permissoes granulares bling.* na Fase 6.
bling_require_access();

// ── GET ─────────────────────────────────────────────────────────
if ($metodo === 'GET') {
    switch (true) {
        case $rota === '' || $rota === 'status':
            StatusController::status();
            break;
        case $rota === 'settings':
            StatusController::configuracoes();
            break;
        case $rota === 'integrations':
            StatusController::integracoes();
            break;
        case $rota === 'accounts':
            StatusController::contas();
            break;
        case $rota === 'header/summary':
            HeaderController::resumo();
            break;

        case $rota === 'overview':
            OverviewController::overview();
            break;
        case $rota === 'operations':
            OverviewController::operacional();
            break;
        case $rota === 'board':
            OverviewController::diretoria();
            break;
        case $rota === 'indicators':
            OverviewController::indicadores();
            break;
        case $rota === 'health':
            OverviewController::saude();
            break;
        case $rota === 'attention':
            OverviewController::atencao();
            break;
        case $rota === 'evolution':
            OverviewController::evolucao();
            break;
        case $rota === 'flow':
            OverviewController::fluxo();
            break;
        case $rota === 'network':
            OverviewController::rede();
            break;

        case count($seg) === 2 && $seg[0] === 'resources':
            ResourceController::listar($seg[1]);
            break;

        case $rota === 'abc':
            AnalyticsController::abc();
            break;
        case $rota === 'profitability':
            AnalyticsController::rentabilidade();
            break;
        case $rota === 'fiscal-funnel':
            AnalyticsController::funilFiscal();
            break;
        case $rota === 'cashflow':
            AnalyticsController::fluxoCaixa();
            break;
        case $rota === 'financial-flow':
            AnalyticsController::fluxoFinanceiro();
            break;
        case $rota === 'inventory-matrix':
            AnalyticsController::matrizEstoque();
            break;
        case $rota === 'warehouse-flow':
            AnalyticsController::fluxoDepositos();
            break;
        case $rota === 'price-simulator':
            AnalyticsController::simuladorPreco();
            break;
        case $rota === 'quality':
            AnalyticsController::qualidade();
            break;
        case $rota === 'insights':
            AnalyticsController::insights();
            break;
        case $rota === 'forecast':
            AnalyticsController::previsoes();
            break;
        case $rota === 'reports':
            AnalyticsController::relatorios();
            break;

        case $rota === 'sync':
            SyncController::estado();
            break;

        // ── Fase 3: séries históricas e análises profundas ──────
        case $rota === 'price-history':
            HistoryController::historicoPreco();
            break;
        case $rota === 'inventory-analytics':
            HistoryController::analiseEstoque();
            break;
        case $rota === 'logistics-analytics':
            HistoryController::analiseLogistica();
            break;
        case $rota === 'margin-volume':
            HistoryController::margemVolume();
            break;

        // ── Fase 3: exportação ──────────────────────────────────
        case $rota === 'export':
            ExportController::catalogo();
            break;
        case count($seg) === 2 && $seg[0] === 'export':
            ExportController::exportar($seg[1]);
            break;

        default:
            ApiResponse::error('ROTA_NAO_ENCONTRADA', 404, [
                'message' => "Rota GET /$rota não existe neste módulo.",
                'caminho' => $caminho,
            ]);
    }
    exit;
}

// ── POST ────────────────────────────────────────────────────────
if ($metodo === 'POST') {
    switch (true) {
        case $rota === 'sync/run':
            SyncController::executar();
            break;

        // OAuth. `connect` e `disconnect` são escrita: passam pelo CSRF do
        // módulo como qualquer POST. `callback` NÃO está aqui — é GET e foi
        // tratado antes do gate, porque vem do bling.com.br.
        case $rota === 'oauth/connect':
            BlingOAuthController::conectar();
            break;
        case $rota === 'oauth/disconnect':
            BlingOAuthController::desconectar();
            break;

        default:
            ApiResponse::error('ROTA_NAO_ENCONTRADA', 404, [
                'message' => "Rota POST /$rota não existe neste módulo.",
            ]);
    }
    exit;
}

ApiResponse::error('METODO_NAO_PERMITIDO', 405, [
    'message'   => "Método $metodo não é aceito neste módulo.",
    'permitidos'=> ['GET', 'POST', 'OPTIONS'],
]);
