<?php
// Bling / controllers/OverviewController.php - Visao Geral e telas executivas
// @module  bling.controller.overview
// @version 1.0.0
// @created 2026-07-30
//
// Serve §14 (KPIs), §15 (saude), §16 "Exige atencao", §17 (evolucao),
// §18 (Sankey empresarial) e §19 (mapa de relacionamento).
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class OverviewController
{
    /** GET /overview — payload completo da tela inicial, em UMA chamada. */
    public static function overview(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();

        ApiResponse::success([
            'kpis'     => $p->kpis($f),
            'saude'    => $p->saude(),
            'atencao'  => $p->atencao(),
            'evolucao' => $p->evolucao($f),
            'fluxo'    => $p->fluxoEmpresarial($f),
            'periodo'  => ['de' => $f['de'], 'ate' => $f['ate'], 'rotulo' => $f['periodo']],
        ], bling_meta(['filtros' => $f]));
    }

    /** GET /evolution — §17 isolado, para a tela recarregar so o grafico. */
    public static function evolucao(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        ApiResponse::success($p->evolucao($f), bling_meta(['filtros' => $f]));
    }

    /** GET /flow — §18 isolado. */
    public static function fluxo(): void
    {
        $f = bling_filtros();
        ApiResponse::success(BlingProvider::atual()->fluxoEmpresarial($f), bling_meta(['filtros' => $f]));
    }

    /** GET /health — §15 isolado. */
    public static function saude(): void
    {
        ApiResponse::success(BlingProvider::atual()->saude(), bling_meta());
    }

    /** GET /attention — §16 isolado. */
    public static function atencao(): void
    {
        ApiResponse::success(BlingProvider::atual()->atencao(), bling_meta());
    }

    /**
     * GET /network — §19, mapa de relacionamento entre entidades.
     * Limitado aos nos mais relevantes: um grafo com 200 clientes nao e legivel,
     * e mandar tudo para o navegador contraria o §64.
     */
    public static function rede(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();

        $pedidos = array_values(array_filter($p->colecao('pedidos'), static fn($x) =>
            $x['data'] >= $f['de'] && $x['data'] <= $f['ate']
            && !in_array($x['situacao'], ['rascunho', 'cancelado'], true)));

        $clientes = [];
        foreach ($p->colecao('clientes') as $c) {
            $clientes[$c['id']] = $c;
        }
        $canais = [];
        foreach ($p->colecao('canais') as $c) {
            $canais[$c['id']] = $c;
        }
        $produtos = [];
        foreach ($p->colecao('produtos') as $x) {
            $produtos[$x['id']] = $x;
        }
        $categorias = [];
        foreach ($p->colecao('categorias') as $c) {
            $categorias[$c['id']] = $c;
        }

        // Top 25 clientes por receita — o resto vira o no agregado "Demais clientes".
        $receitaCliente = [];
        foreach ($pedidos as $ped) {
            $receitaCliente[$ped['cliente']] = ($receitaCliente[$ped['cliente']] ?? 0) + $ped['total'];
        }
        arsort($receitaCliente);
        $top = array_slice(array_keys($receitaCliente), 0, 25);
        $topSet = array_flip($top);

        $nos = [];
        $arestas = [];
        $addNo = static function (string $id, string $rotulo, string $tipo, float $peso) use (&$nos): void {
            if (!isset($nos[$id])) {
                $nos[$id] = ['id' => $id, 'rotulo' => $rotulo, 'tipo' => $tipo, 'peso' => 0.0];
            }
            $nos[$id]['peso'] += $peso;
        };
        $addAresta = static function (string $de, string $para, float $peso) use (&$arestas): void {
            $k = "$de\x00$para";
            if (!isset($arestas[$k])) {
                $arestas[$k] = ['origem' => $de, 'destino' => $para, 'peso' => 0.0];
            }
            $arestas[$k]['peso'] += $peso;
        };

        foreach ($pedidos as $ped) {
            $canalId = 'canal:' . $ped['canal'];
            $addNo($canalId, $canais[$ped['canal']]['nome'] ?? $ped['canal'], 'canal', $ped['total']);

            $clienteId = isset($topSet[$ped['cliente']])
                ? 'cliente:' . $ped['cliente']
                : 'cliente:outros';
            $addNo($clienteId,
                isset($topSet[$ped['cliente']]) ? ($clientes[$ped['cliente']]['nome'] ?? '—') : 'Demais clientes',
                'cliente', $ped['total']);
            $addAresta($canalId, $clienteId, $ped['total']);

            foreach ($ped['itens'] as $it) {
                $prod = $produtos[$it['produto']] ?? null;
                $catId = 'categoria:' . ($prod['categoria'] ?? 'sem');
                $addNo($catId, $categorias[$prod['categoria'] ?? '']['nome'] ?? 'Sem categoria', 'categoria', $it['total']);
                $addAresta($clienteId, $catId, $it['total']);
            }
        }

        foreach ($nos as &$n) {
            $n['peso'] = round($n['peso'], 2);
        }
        unset($n);
        foreach ($arestas as &$a) {
            $a['peso'] = round($a['peso'], 2);
        }
        unset($a);

        ApiResponse::success([
            'nos'     => array_values($nos),
            'arestas' => array_values($arestas),
            'nota'    => 'Exibindo os 25 maiores clientes do período; os demais aparecem agregados.',
        ], bling_meta(['filtros' => $f]));
    }

    /**
     * GET /operations — Central Operacional: fila de trabalho, nao relatorio.
     * Cada bloco e uma acao pendente com dono e prazo, ordenada por urgencia.
     */
    public static function operacional(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();
        $hoje = date('Y-m-d');

        $pedidos = $p->colecao('pedidos');
        $notas = [];
        foreach ($p->colecao('notas') as $n) {
            $notas[$n['pedido']] = $n;
        }
        $clientes = [];
        foreach ($p->colecao('clientes') as $c) {
            $clientes[$c['id']] = $c;
        }

        $fila = static function (string $id, string $titulo, string $area, array $itens, string $acao): array {
            return [
                'id' => $id, 'titulo' => $titulo, 'area' => $area,
                'quantidade' => count($itens), 'acao' => $acao,
                'itens' => array_slice($itens, 0, 20),
                'truncado' => count($itens) > 20,
            ];
        };

        $aprovar = [];
        $faturar = [];
        $emitir  = [];
        $separar = [];
        foreach ($pedidos as $ped) {
            $linha = [
                'id' => $ped['id'], 'numero' => $ped['numero'], 'data' => $ped['data'],
                'cliente' => $clientes[$ped['cliente']]['nome'] ?? '—', 'valor' => $ped['total'],
                'dias_parado' => (int) ((strtotime($hoje) - strtotime($ped['data'])) / 86400),
            ];
            match ($ped['situacao']) {
                'aguardando_aprovacao' => $aprovar[] = $linha,
                'aprovado'             => $faturar[] = $linha,
                'faturado'             => $emitir[]  = $linha,
                'nota_emitida'         => $separar[] = $linha,
                default                => null,
            };
        }

        $ordenar = static function (array &$l): void {
            usort($l, static fn($a, $b) => $b['dias_parado'] <=> $a['dias_parado']);
        };
        $ordenar($aprovar);
        $ordenar($faturar);
        $ordenar($emitir);
        $ordenar($separar);

        $rejeitadas = [];
        foreach ($p->colecao('notas') as $n) {
            if ($n['situacao'] !== 'rejeitada') {
                continue;
            }
            $rejeitadas[] = [
                'id' => $n['id'], 'numero' => $n['numero'],
                'cliente' => $clientes[$n['cliente']]['nome'] ?? '—',
                'valor' => $n['valor'], 'erro' => $n['erro']['mensagem'] ?? '—',
                'codigo' => $n['erro']['codigo'] ?? '—', 'tentativas' => $n['tentativas'],
            ];
        }

        $vencidos = [];
        foreach ($p->colecao('receber') as $r) {
            if ($r['situacao'] !== 'vencido') {
                continue;
            }
            $vencidos[] = [
                'id' => $r['id'], 'titulo' => $r['titulo'],
                'cliente' => $clientes[$r['cliente']]['nome'] ?? '—',
                'saldo' => $r['saldo'], 'atraso_dias' => $r['atraso_dias'],
            ];
        }
        usort($vencidos, static fn($a, $b) => $b['atraso_dias'] <=> $a['atraso_dias']);

        ApiResponse::success([
            'filas' => [
                $fila('aprovar', 'Aguardando aprovação', 'Vendas', $aprovar, 'Aprovar ou recusar'),
                $fila('faturar', 'Aprovados sem faturamento', 'Vendas', $faturar, 'Faturar'),
                $fila('emitir', 'Faturados sem nota', 'Fiscal', $emitir, 'Emitir nota fiscal'),
                $fila('rejeitadas', 'Notas rejeitadas', 'Fiscal', $rejeitadas, 'Corrigir e reenviar'),
                $fila('separar', 'Aguardando separação', 'Logística', $separar, 'Separar e despachar'),
                $fila('cobranca', 'Títulos vencidos', 'Financeiro', $vencidos, 'Acionar cobrança'),
            ],
        ], bling_meta(['filtros' => $f]));
    }

    /** GET /board — Diretoria: leitura executiva, sem detalhe operacional. */
    public static function diretoria(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();

        $kpis = $p->kpis($f);
        $porId = [];
        foreach ($kpis as $k) {
            $porId[$k['id']] = $k;
        }
        $executivos = ['faturamento_bruto', 'margem_estimada', 'ticket_medio', 'pedidos',
                       'contas_vencidas', 'saldo_projetado'];

        ApiResponse::success([
            'kpis'         => array_values(array_intersect_key($porId, array_flip($executivos))),
            'evolucao'     => $p->evolucao($f),
            'canais'       => $p->curvaAbc('canais', 'faturamento', $f),
            'rentabilidade'=> array_slice($p->rentabilidade('canal', $f), 0, 10),
            'insights'     => $p->insights($f),
            'funil'        => $p->funilFiscal($f),
        ], bling_meta(['filtros' => $f]));
    }

    /** GET /indicators — Indicadores: todos os KPIs com sua definicao de calculo. */
    public static function indicadores(): void
    {
        $f = bling_filtros();
        $p = BlingProvider::atual();

        $definicoes = [
            'faturamento_bruto'  => 'Soma do total dos pedidos não cancelados no período.',
            'faturamento_liquido'=> 'Faturamento bruto menos frete.',
            'ticket_medio'       => 'Faturamento bruto dividido pelo número de pedidos.',
            'margem_estimada'    => 'Estimativa: (líquido − custo de produto) ÷ líquido. Não inclui apuração contábil.',
            'saldo_projetado'    => 'Contas a receber em aberto menos contas a pagar em aberto.',
            'estoque_total'      => 'Soma do saldo físico positivo valorizado pelo custo cadastrado.',
        ];

        $kpis = $p->kpis($f);
        foreach ($kpis as &$k) {
            $k['definicao'] = $definicoes[$k['id']] ?? 'Contagem direta sobre o período selecionado.';
        }
        unset($k);

        ApiResponse::success(['kpis' => $kpis], bling_meta(['filtros' => $f]));
    }
}
