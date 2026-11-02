<?php
// Bling / controllers/HeaderController.php - resumo do icone do header
// @module  bling.controller.header
// @version 1.0.0
// @created 2026-07-30
//
// Serve §8.2 (tooltip) e §8.3 (badge com prioridade).
// Endpoint deliberadamente ENXUTO: e chamado no boot do app-shell, com polling.
// Nao pode carregar a Visao Geral inteira so para mostrar seis linhas.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class HeaderController
{
    /**
     * Prioridade do badge (§8.3), do mais grave ao menos grave.
     * A ordem aqui É a regra — quem decide a cor do badge é o primeiro que casar.
     */
    private const PRIORIDADE = [
        'sync_interrompida',   // 1. falha critica de integracao
        'token_expirando',
        'notas_rejeitadas',    // 2. erro fiscal
        'pedidos_parados',     // 3. pedido parado
        'estoque_negativo',    // 4. estoque divergente
        'estoque_divergente',
        'contas_vencidas',     // 5. vencimento financeiro
        'compras_atrasadas',
        'webhooks_falha',
        'pedidos_sem_nota',
        'remessas_atraso',
    ];

    /** GET /header/summary */
    public static function resumo(): void
    {
        $p = BlingProvider::atual();
        $f = bling_filtros();
        $hoje = date('Y-m-d');

        $pedidos = $p->colecao('pedidos');
        $novos = count(array_filter($pedidos, static fn($x) => $x['data'] === $hoje));
        $aguardandoFat = count(array_filter($pedidos, static fn($x) => $x['situacao'] === 'aprovado'));

        $criticos = count(array_filter($p->colecao('estoque'), static fn($e) =>
            in_array($e['status'], ['critico', 'negativo', 'zerado'], true)));
        $notasErro = count(array_filter($p->colecao('notas'), static fn($n) => $n['situacao'] === 'rejeitada'));
        $vencidas = array_values(array_filter($p->colecao('receber'), static fn($r) => $r['situacao'] === 'vencido'));

        // Linhas do tooltip, na ordem do §8.2.
        $linhas = [
            ['rotulo' => 'pedidos novos hoje',        'valor' => $novos,        'formato' => 'inteiro', 'tela' => 'pedidos-venda'],
            ['rotulo' => 'aguardando faturamento',    'valor' => $aguardandoFat,'formato' => 'inteiro', 'tela' => 'pedidos-venda'],
            ['rotulo' => 'produtos com estoque crítico','valor' => $criticos,   'formato' => 'inteiro', 'tela' => 'estoque'],
            ['rotulo' => 'notas com erro',            'valor' => $notasErro,    'formato' => 'inteiro', 'tela' => 'notas-fiscais'],
            ['rotulo' => 'em contas vencidas',        'valor' => round(array_sum(array_column($vencidas, 'saldo')), 2),
             'formato' => 'moeda', 'tela' => 'contas-receber'],
        ];

        // Badge: primeira ocorrencia da lista de prioridade que tiver quantidade.
        $atencao = [];
        foreach ($p->atencao() as $o) {
            $atencao[$o['id']] = $o;
        }
        $badge = null;
        foreach (self::PRIORIDADE as $id) {
            if (isset($atencao[$id]) && $atencao[$id]['quantidade'] > 0) {
                $badge = [
                    'motivo'     => $id,
                    'descricao'  => $atencao[$id]['descricao'],
                    'quantidade' => $atencao[$id]['quantidade'],
                    'severidade' => $atencao[$id]['severidade'],
                    'cor'        => match ($atencao[$id]['severidade']) {
                        'critica' => 'erro', 'alta' => 'aviso',
                        'media'   => 'info', default => 'neutro',
                    },
                    'tela'       => $atencao[$id]['tela'],
                ];
                break;
            }
        }

        // Total do badge = soma de TUDO que exige atencao, nao so do motivo exibido.
        $totalPendencias = array_sum(array_map(static fn($o) => $o['quantidade'], $atencao));

        ApiResponse::success([
            'titulo'  => 'Bling',
            'estado'  => BlingSituacoes::descrever('conexao', BlingProvider::estadoConexao()),
            'linhas'  => $linhas,
            'badge'   => $badge,
            'total_pendencias' => $totalPendencias,
            'ultima_sync' => $p->ultimaSync(),
            'rota'    => '#/panel-bling',
        ], bling_meta());
    }
}
