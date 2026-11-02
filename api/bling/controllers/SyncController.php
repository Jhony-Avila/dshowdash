<?php
// Bling / controllers/SyncController.php - estado da sincronizacao (§47)
// @module  bling.controller.sync
// @version 1.0.0
// @created 2026-07-30
//
// Tela tecnica E gerencial: mostra cursor, watermark, retry e limite consumido
// junto com o resumo por recurso. Em mock, a sincronizacao NAO roda - dizer que
// rodou seria mentira operacional.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class SyncController
{
    /** GET /sync */
    public static function estado(): void
    {
        $p = BlingProvider::atual();
        $recursos = $p->colecao('sync');

        $resumo = [
            'recursos'    => count($recursos),
            'ok'          => count(array_filter($recursos, static fn($s) => $s['situacao'] === 'ok')),
            'atencao'     => count(array_filter($recursos, static fn($s) => $s['situacao'] === 'atencao')),
            'parcial'     => count(array_filter($recursos, static fn($s) => $s['situacao'] === 'parcial')),
            'erro'        => count(array_filter($recursos, static fn($s) => $s['situacao'] === 'erro')),
            'consultados' => array_sum(array_column($recursos, 'consultados')),
            'criados'     => array_sum(array_column($recursos, 'criados')),
            'atualizados' => array_sum(array_column($recursos, 'atualizados')),
            'erros'       => array_sum(array_column($recursos, 'erros')),
            'limite_consumido_max' => $recursos === [] ? 0 : max(array_column($recursos, 'limite_consumido_pct')),
        ];

        foreach ($recursos as &$r) {
            $r['situacao_info'] = match ($r['situacao']) {
                'ok'      => ['chave' => 'ok',      'rotulo' => 'Em dia',   'cor' => 'sucesso'],
                'atencao' => ['chave' => 'atencao', 'rotulo' => 'Atenção',  'cor' => 'aviso'],
                'parcial' => ['chave' => 'parcial', 'rotulo' => 'Parcial',  'cor' => 'aviso'],
                default   => ['chave' => 'erro',    'rotulo' => 'Erro',     'cor' => 'erro'],
            };
        }
        unset($r);

        ApiResponse::success([
            'resumo'   => $resumo,
            'recursos' => $recursos,
            'estrategia' => [
                'carga_inicial'  => 'paginação completa por recurso, com cursor persistido',
                'incremental'    => 'filtro por data de alteração a partir do watermark',
                'reconciliacao'  => 'varredura periódica completa — rede de segurança do webhook',
                'idempotencia'   => 'chave única (conta, id_bling); reprocessar não duplica',
                'deduplicacao'   => 'hash do payload — payload igual não gera escrita',
                'retry'          => 'exponencial com jitter, respeitando Retry-After',
                'dead_letter'    => 'após esgotar tentativas, o evento vai para a DLQ com o erro',
            ],
            'ativa' => !$p->ehSimulado(),
            'nota'  => $p->ehSimulado()
                ? 'Provedor simulado: nenhuma sincronização real está em execução. '
                . 'Os números abaixo ilustram o formato da tela.'
                : null,
        ], bling_meta());
    }

    /**
     * POST /sync/run — dispara sincronizacao.
     * Em mock, recusa explicitamente. Fingir que sincronizou seria pior que falhar.
     */
    public static function executar(): void
    {
        AuthHelpers::requireCsrf();

        if (BlingProvider::atual()->ehSimulado()) {
            ApiResponse::error('SINCRONIZACAO_INDISPONIVEL', 409, [
                'message' => 'Não há sincronização a executar: o módulo está em provedor simulado.',
                'provider' => 'mock',
                'como_habilitar' => 'Concluir a Fase 4 (banco + OAuth) e definir BLING_PROVIDER=bling.',
            ]);
        }

        ApiResponse::error('NAO_IMPLEMENTADO', 501, [
            'message' => 'A execução de sincronização entra na Fase 4.',
        ]);
    }
}
