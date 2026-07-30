<?php
// Google Analytics / controllers/StatusController.php
// @module  google-analytics.controllers.status
// @version 1.0.0
// @created 2026-07-30
declare(strict_types=1);

final class GaStatusController
{
    /** GET /status — prontidão da integração (§9.4: os estados do badge). */
    public static function status(GaProvider $p): void
    {
        $d = $p->status();
        $meta = $d['meta'] ?? [];
        unset($d['meta']);
        ApiResponse::success($d, $meta + ['ts' => date('c')]);
    }

    /**
     * GET /header/summary — resumo do ícone do header (§9.2).
     *
     * ⚠️ Uma chamada só, com tudo que o tooltip mostra. A §74 é explícita: não fazer uma
     * requisição por card. E este endpoint é chamado no boot do shell por TODO usuário, então
     * é o mais sensível a custo de quota do módulo inteiro.
     */
    public static function headerSummary(GaProvider $p): void
    {
        $f  = ga_filtros();
        $rt = $p->tempoReal($f);
        $ov = $p->overview(['periodo' => 'hoje', 'inicio' => date('Y-m-d'), 'fim' => date('Y-m-d')]);

        $pega = static function (array $kpis, string $chave) {
            foreach ($kpis as $k) { if (($k['chave'] ?? '') === $chave) { return $k['valor']; } }
            return null;
        };

        $alertas = $ov['atencao'] ?? [];
        $altas = 0;
        foreach ($alertas as $a) { if (($a['severidade'] ?? '') === 'alta') { $altas++; } }

        // Prioridade do badge (§9.3): falha de autenticação vem antes de tudo.
        $badge = null;
        if (!($p->status()['pronto'] ?? false)) {
            $badge = ['tipo' => 'erro', 'texto' => 'não configurado'];
        } elseif ($altas > 0) {
            $badge = ['tipo' => 'atencao', 'texto' => (string)$altas];
        } elseif (count($alertas) > 0) {
            $badge = ['tipo' => 'info', 'texto' => (string)count($alertas)];
        }

        ApiResponse::success([
            'ativos_agora'   => $rt['ativos_agora'] ?? 0,
            'sessoes_hoje'   => $pega($ov['kpis'] ?? [], 'sessoes'),
            'conversoes_hoje'=> $pega($ov['kpis'] ?? [], 'conversoes'),
            'taxa_conversao' => $pega($ov['kpis'] ?? [], 'taxa_conversao'),
            'alertas'        => count($alertas),
            'alertas_altos'  => $altas,
            'badge'          => $badge,
            'estado'         => ga_is_mock() ? 'mock' : (($p->status()['pronto'] ?? false) ? 'conectado' : 'nao_configurado'),
        ], ($rt['meta'] ?? []) + ['ts' => date('c')]);
    }
}
