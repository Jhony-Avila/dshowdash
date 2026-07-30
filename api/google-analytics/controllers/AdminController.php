<?php
// Google Analytics / controllers/AdminController.php
// @module  google-analytics.controllers.admin
// @version 1.0.0
// @created 2026-07-30
//
// Administração (§13, §48): contas, propriedades e streams.
//
// ⚠️ Só LEITURA nesta fase. A Admin API tem recursos de escrita (criar públicos, alterar
// streams, gerar Measurement Protocol secrets) e alguns vivem em canais Alpha/Beta — o
// briefing §3.2 manda isolá-los por adapter e feature flag justamente porque mudam sem
// aviso. Nenhum deles entra na Fase 1.
declare(strict_types=1);

final class GaAdminController
{
    /** GET /properties — contas → propriedades → streams */
    public static function propriedades(GaProvider $p): void
    {
        $d = $p->propriedades();
        $meta = $d['meta'] ?? [];
        unset($d['meta']);
        ApiResponse::success($d, $meta + ['ts' => date('c')]);
    }

    /**
     * GET /quotas — consumo de quota por categoria (§57.1).
     *
     * ⚠️ Enquanto o provedor é mock, NÃO há consumo real: devolver número inventado aqui
     * seria mentir sobre o recurso mais crítico da integração. A tela mostra a estrutura e
     * diz que a medição começa com o provedor real.
     */
    public static function quotas(GaProvider $p): void
    {
        $mock = ga_is_mock();
        ApiResponse::success([
            'medindo'    => !$mock,
            'observacao' => $mock
                ? 'Sem consumo real: o provedor ativo é o mock. As três categorias abaixo passam a ser medidas quando a Data API entrar.'
                : null,
            'categorias' => [
                ['categoria' => 'core',     'rotulo' => 'Relatórios principais', 'consumo' => null, 'limite' => null, 'descricao' => 'runReport, runPivotReport, batchRunReports'],
                ['categoria' => 'realtime', 'rotulo' => 'Tempo real',            'consumo' => null, 'limite' => null, 'descricao' => 'runRealtimeReport — quota independente do core'],
                ['categoria' => 'funnel',   'rotulo' => 'Funil',                 'consumo' => null, 'limite' => null, 'descricao' => 'runFunnelReport — quota independente do core'],
                ['categoria' => 'admin',    'rotulo' => 'Administração',         'consumo' => null, 'limite' => null, 'descricao' => 'Admin API: contas, propriedades, streams'],
            ],
            'politica' => [
                'A tela de tempo real é o maior consumidor: refresh automático deve ser configurável e pausável (§18.3).',
                'Uma consulta por card é proibida: agrupar métricas na mesma requisição (§74).',
                'Cache curto para tempo real, cache longo para série histórica (§58).',
            ],
        ], ['fonte' => $mock ? 'mock' : 'ga4-data-api', 'ts' => date('c')]);
    }
}
