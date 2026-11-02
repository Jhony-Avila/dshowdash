<?php
// Bling / controllers/ResourceController.php - listagens paginadas server-side
// @module  bling.controller.resource
// @version 1.0.0
// @created 2026-07-30
//
// Motor das telas de catalogo. Cada recurso declara COMO monta suas linhas; a
// filtragem, busca, ordenacao, totalizacao e paginacao sao aplicadas por um
// caminho unico - e o que faz as 52 telas se comportarem igual (§51).
//
// SERVER-SIDE de verdade (§64): o navegador nunca recebe a colecao inteira. O
// recorte, a ordenacao e os totalizadores saem daqui ja prontos.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class ResourceController
{
    /** Recursos conhecidos -> metodo que monta as linhas. */
    private const RECURSOS = [
        'sales-orders'      => 'pedidosVenda',
        'sales'             => 'vendas',
        'channels'          => 'canais',
        'sellers'           => 'vendedores',
        'commissions'       => 'comissoes',
        'products'          => 'produtos',
        'variations'        => 'variacoes',
        'kits'              => 'kits',
        'categories'        => 'categorias',
        'prices'            => 'precos',
        'inventory'         => 'estoque',
        'warehouses'        => 'depositos',
        'purchase-orders'   => 'pedidosCompra',
        'suppliers'         => 'fornecedores',
        'receipts'          => 'recebimentos',
        'purchase-needs'    => 'necessidadesCompra',
        'invoices'          => 'notas',
        'service-invoices'  => 'notasServico',
        'fiscal-status'     => 'situacoesFiscais',
        'taxes'             => 'tributacoes',
        'documents'         => 'documentos',
        'receivables'       => 'receber',
        'payables'          => 'pagar',
        'reconciliation'    => 'conciliacao',
        'financial-categories' => 'categoriasFinanceiras',
        'payment-methods'   => 'formasPagamento',
        'shipments'         => 'envios',
        'carriers'          => 'transportadoras',
        'tracking'          => 'rastreamento',
        'dispatch'          => 'expedicao',
        'incidents'         => 'ocorrencias',
        'customers'         => 'clientes',
        'contacts'          => 'contatos',
        'commercial-history'=> 'historicoComercial',
        'alerts'            => 'alertas',
        'webhooks'          => 'webhooks',
        'logs'              => 'logs',
        'audit'             => 'auditoria',
        'accounts'          => 'contas',
    ];

    public static function listar(string $recurso): void
    {
        if (!isset(self::RECURSOS[$recurso])) {
            ApiResponse::error('RECURSO_DESCONHECIDO', 404, [
                'message'    => "Recurso '$recurso' não existe neste módulo.",
                'disponiveis'=> array_keys(self::RECURSOS),
            ]);
        }

        $f = bling_filtros();
        $p = BlingProvider::atual();
        $metodo = self::RECURSOS[$recurso];

        $dados = self::$metodo($p, $f);
        $linhas = $dados['linhas'];
        $colunas = $dados['colunas'] ?? [];
        $camposBusca = $dados['busca'] ?? [];
        $totalizar = $dados['totalizar'] ?? [];
        $facetas = $dados['facetas'] ?? [];

        // Busca -> ordenacao -> totalizadores (sobre o conjunto FILTRADO, nao a pagina)
        if ($f['busca'] !== '' && $camposBusca !== []) {
            $linhas = self::filtrarTexto($linhas, $f['busca'], $camposBusca);
        }
        if ($f['ordenar'] !== '') {
            $linhas = self::ordenarLinhas($linhas, $f['ordenar'], $f['direcao']);
        }

        $totais = [];
        foreach ($totalizar as $campo) {
            $totais[$campo] = round(array_sum(array_map(
                static fn($l) => (float) ($l[$campo] ?? 0), $linhas
            )), 2);
        }

        $total = count($linhas);
        $offset = ($f['pagina'] - 1) * $f['limite'];

        ApiResponse::success([
            'itens'   => array_values(array_slice($linhas, $offset, $f['limite'])),
            'colunas' => $colunas,
            'totais'  => $totais,
            'facetas' => $facetas,
        ], bling_meta([
            'total'   => $total,
            'pagina'  => $f['pagina'],
            'limite'  => $f['limite'],
            'paginas' => (int) ceil($total / max(1, $f['limite'])),
            'recurso' => $recurso,
            'filtros' => $f,
        ]));
    }

    /**
     * Mesmo caminho de dados de `listar()`, sem paginação — para exportação.
     *
     * Reaproveitar aqui é deliberado: se o export tivesse consulta própria, o
     * arquivo poderia divergir do que está na tela. Um relatório que não bate
     * com a tela que o originou é pior do que não ter relatório.
     *
     * @return array{titulo:string,colunas:array,linhas:array,totais:array,contexto:array,truncado:bool}
     */
    public static function montarParaExport(string $recurso, int $limite): array
    {
        if (!isset(self::RECURSOS[$recurso])) {
            ApiResponse::error('RECURSO_DESCONHECIDO', 404, [
                'message'     => "Recurso '$recurso' não existe neste módulo.",
                'disponiveis' => array_keys(self::RECURSOS),
            ]);
        }

        $f = bling_filtros();
        $p = BlingProvider::atual();
        $metodo = self::RECURSOS[$recurso];
        $dados = self::$metodo($p, $f);

        $linhas = $dados['linhas'];
        if ($f['busca'] !== '' && ($dados['busca'] ?? []) !== []) {
            $linhas = self::filtrarTexto($linhas, $f['busca'], $dados['busca']);
        }
        if ($f['ordenar'] !== '') {
            $linhas = self::ordenarLinhas($linhas, $f['ordenar'], $f['direcao']);
        }

        // Totais sobre o conjunto FILTRADO inteiro, não sobre o recorte exportado.
        $totais = [];
        foreach (($dados['totalizar'] ?? []) as $campo) {
            $totais[$campo] = round(array_sum(array_map(
                static fn($l) => (float) ($l[$campo] ?? 0), $linhas
            )), 2);
        }

        $total = count($linhas);
        $truncado = $total > $limite;
        if ($truncado) {
            $linhas = array_slice($linhas, 0, $limite);
        }

        // Contexto no topo do arquivo: sem título e período, o arquivo vira
        // órfão na pasta Downloads em duas semanas.
        $contexto = [
            'Bling — ' . self::rotuloRecurso($recurso),
            sprintf('Período: %s a %s', $f['de'], $f['ate']),
        ];
        $filtros = array_filter([
            'situação' => $f['situacao'], 'canal' => $f['canal'],
            'categoria' => $f['categoria'], 'fornecedor' => $f['fornecedor'],
            'depósito' => $f['deposito'], 'vendedor' => $f['vendedor'],
            'busca' => $f['busca'],
        ]);
        if ($filtros) {
            $partes = [];
            foreach ($filtros as $k => $v) {
                $partes[] = "$k: $v";
            }
            $contexto[] = 'Filtros — ' . implode(' · ', $partes);
        }
        $contexto[] = sprintf('%s registro(s)%s', number_format($total, 0, ',', '.'),
            $truncado ? sprintf(' — exportando os %s primeiros', number_format($limite, 0, ',', '.')) : '');
        if ($p->ehSimulado()) {
            $contexto[] = 'ATENÇÃO: ambiente de demonstração — os dados são simulados.';
        }
        $contexto[] = 'Gerado em ' . date('d/m/Y H:i');

        return [
            'titulo'   => self::rotuloRecurso($recurso),
            'colunas'  => $dados['colunas'] ?? [],
            'linhas'   => $linhas,
            'totais'   => $totais,
            'contexto' => $contexto,
            'truncado' => $truncado,
        ];
    }

    /** Nome legível do recurso, para título de arquivo e aba da planilha. */
    private static function rotuloRecurso(string $recurso): string
    {
        return match ($recurso) {
            'sales-orders' => 'Pedidos de Venda',      'sales' => 'Vendas',
            'channels' => 'Canais de Venda',           'sellers' => 'Vendedores',
            'commissions' => 'Comissões',              'products' => 'Produtos',
            'variations' => 'Variações',               'kits' => 'Kits e Estruturas',
            'categories' => 'Categorias',              'prices' => 'Preços',
            'inventory' => 'Estoque',                  'warehouses' => 'Depósitos',
            'purchase-orders' => 'Pedidos de Compra',  'suppliers' => 'Fornecedores',
            'receipts' => 'Recebimentos',              'purchase-needs' => 'Necessidades de Compra',
            'invoices' => 'Notas Fiscais',             'service-invoices' => 'Notas de Serviço',
            'fiscal-status' => 'Situações Fiscais',    'taxes' => 'Tributações',
            'documents' => 'Documentos',               'receivables' => 'Contas a Receber',
            'payables' => 'Contas a Pagar',            'reconciliation' => 'Conciliação',
            'financial-categories' => 'Categorias Financeiras',
            'payment-methods' => 'Formas de Pagamento','shipments' => 'Envios',
            'carriers' => 'Transportadoras',           'tracking' => 'Rastreamento',
            'dispatch' => 'Expedição',                 'incidents' => 'Ocorrências',
            'customers' => 'Clientes',                 'contacts' => 'Contatos',
            'commercial-history' => 'Histórico Comercial',
            'alerts' => 'Alertas',                     'webhooks' => 'Webhooks',
            'logs' => 'Logs',                          'audit' => 'Auditoria',
            'accounts' => 'Contas',                    default => ucfirst($recurso),
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers locais
    // ─────────────────────────────────────────────────────────────

    private static function filtrarTexto(array $linhas, string $termo, array $campos): array
    {
        $t = mb_strtolower($termo);
        return array_values(array_filter($linhas, static function ($l) use ($t, $campos) {
            foreach ($campos as $c) {
                if (isset($l[$c]) && str_contains(mb_strtolower((string) $l[$c]), $t)) {
                    return true;
                }
            }
            return false;
        }));
    }

    private static function ordenarLinhas(array $linhas, string $campo, string $direcao): array
    {
        usort($linhas, static function ($a, $b) use ($campo, $direcao) {
            $va = $a[$campo] ?? null;
            $vb = $b[$campo] ?? null;
            if ($va === null && $vb === null) {
                return 0;
            }
            if ($va === null) {
                return 1;   // nulos sempre no fim, independente da direcao
            }
            if ($vb === null) {
                return -1;
            }
            $cmp = is_numeric($va) && is_numeric($vb) ? ($va <=> $vb) : strcmp((string) $va, (string) $vb);
            return $direcao === 'asc' ? $cmp : -$cmp;
        });
        return $linhas;
    }

    /** Coluna no formato que o DataGrid compartilhado consome. */
    private static function col(string $id, string $rotulo, string $tipo = 'texto', array $extra = []): array
    {
        return array_merge([
            'id' => $id, 'rotulo' => $rotulo, 'tipo' => $tipo,
            'alinhamento' => in_array($tipo, ['moeda', 'numero', 'percentual', 'inteiro'], true) ? 'direita' : 'esquerda',
            'ordenavel' => true,
        ], $extra);
    }

    /** Indice id -> linha, para os joins de exibicao. */
    private static function indexar(array $linhas, string $chave = 'id'): array
    {
        $m = [];
        foreach ($linhas as $l) {
            $m[$l[$chave]] = $l;
        }
        return $m;
    }

    /** Contagem por valor de campo — alimenta os filtros facetados da FilterBar. */
    private static function facetar(array $linhas, string $campo): array
    {
        $m = [];
        foreach ($linhas as $l) {
            $v = (string) ($l[$campo] ?? '');
            if ($v === '') {
                continue;
            }
            $m[$v] = ($m[$v] ?? 0) + 1;
        }
        arsort($m);
        $saida = [];
        foreach ($m as $valor => $qtd) {
            $saida[] = ['valor' => $valor, 'quantidade' => $qtd];
        }
        return $saida;
    }

    // ─────────────────────────────────────────────────────────────
    // VENDAS
    // ─────────────────────────────────────────────────────────────

    private static function pedidosVenda(BlingProviderBase $p, array $f): array
    {
        $clientes = self::indexar($p->colecao('clientes'));
        $canais   = self::indexar($p->colecao('canais'));
        $vend     = self::indexar($p->colecao('vendedores'));
        $formas   = self::indexar($p->colecao('formas_pagamento'));

        $notas = [];
        foreach ($p->colecao('notas') as $n) {
            $notas[$n['pedido']] = $n;
        }
        $envios = [];
        foreach ($p->colecao('envios') as $e) {
            $envios[$e['pedido']] = $e;
        }

        $linhas = [];
        foreach ($p->colecao('pedidos') as $ped) {
            if (substr($ped['data'], 0, 10) < $f['de'] || substr($ped['data'], 0, 10) > $f['ate']) {
                continue;
            }
            if ($f['situacao'] !== '' && $ped['situacao'] !== $f['situacao']) {
                continue;
            }
            if ($f['canal'] !== '' && $ped['canal'] !== $f['canal']) {
                continue;
            }
            if ($f['vendedor'] !== '' && $ped['vendedor'] !== $f['vendedor']) {
                continue;
            }

            $nf  = $notas[$ped['id']] ?? null;
            $env = $envios[$ped['id']] ?? null;

            $linhas[] = [
                'id'          => $ped['id'],
                'numero'      => $ped['numero'],
                'bling_id'    => $ped['bling_id'],
                'situacao'    => $ped['situacao'],
                'situacao_info' => BlingSituacoes::descrever('pedido', $ped['situacao']),
                'data'        => $ped['data'],
                'cliente'     => $clientes[$ped['cliente']]['nome'] ?? '—',
                'cliente_id'  => $ped['cliente'],
                'vendedor'    => $vend[$ped['vendedor']]['nome'] ?? '—',
                'canal'       => $canais[$ped['canal']]['nome'] ?? $ped['canal'],
                'canal_id'    => $ped['canal'],
                'loja'        => $canais[$ped['canal']]['tipo'] ?? '—',
                'itens'       => $ped['qtd_itens'],
                'subtotal'    => $ped['subtotal'],
                'desconto'    => $ped['desconto'],
                'frete'       => $ped['frete'],
                'total'       => $ped['total'],
                'pagamento'   => $formas[$ped['forma_pagamento']]['nome'] ?? '—',
                'nota'        => $nf['numero'] ?? null,
                'nota_situacao' => $nf['situacao'] ?? null,
                'expedicao'   => $env['situacao'] ?? null,
                'rastreamento'=> $env['rastreamento'] ?? null,
                'erp_local'   => null,
                'atualizado_em' => $ped['atualizado_em'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['numero', 'cliente', 'nota', 'rastreamento', 'bling_id'],
            'totalizar' => ['subtotal', 'desconto', 'frete', 'total', 'itens'],
            'facetas' => [
                'situacao' => self::facetar($linhas, 'situacao'),
                'canal'    => self::facetar($linhas, 'canal'),
                'vendedor' => self::facetar($linhas, 'vendedor'),
            ],
            'colunas' => [
                self::col('numero', 'Número'),
                self::col('bling_id', 'ID Bling', 'inteiro'),
                self::col('situacao', 'Situação', 'badge'),
                self::col('data', 'Data', 'data'),
                self::col('cliente', 'Cliente'),
                self::col('vendedor', 'Vendedor'),
                self::col('canal', 'Canal'),
                self::col('loja', 'Loja'),
                self::col('itens', 'Itens', 'inteiro'),
                self::col('subtotal', 'Subtotal', 'moeda'),
                self::col('desconto', 'Desconto', 'moeda'),
                self::col('frete', 'Frete', 'moeda'),
                self::col('total', 'Total', 'moeda', ['destaque' => true]),
                self::col('pagamento', 'Pagamento'),
                self::col('nota', 'Nota'),
                self::col('expedicao', 'Expedição', 'badge'),
                self::col('rastreamento', 'Rastreamento'),
                self::col('atualizado_em', 'Atualização', 'datahora'),
            ],
        ];
    }

    /** "Vendas" = pedidos efetivados, agrupados por dia (visao gerencial, nao operacional). */
    private static function vendas(BlingProviderBase $p, array $f): array
    {
        $canais = self::indexar($p->colecao('canais'));
        $acum = [];
        foreach ($p->colecao('pedidos') as $ped) {
            if ($ped['data'] < $f['de'] || $ped['data'] > $f['ate']) {
                continue;
            }
            if (in_array($ped['situacao'], ['rascunho', 'cancelado'], true)) {
                continue;
            }
            $chave = $ped['data'] . '|' . $ped['canal'];
            if (!isset($acum[$chave])) {
                $acum[$chave] = [
                    'id' => $chave, 'data' => $ped['data'],
                    'canal' => $canais[$ped['canal']]['nome'] ?? $ped['canal'],
                    'pedidos' => 0, 'unidades' => 0, 'receita' => 0.0, 'custo' => 0.0,
                    'desconto' => 0.0, 'frete' => 0.0,
                ];
            }
            $a = &$acum[$chave];
            $a['pedidos']++;
            $a['receita'] += $ped['total'];
            $a['custo']   += $ped['custo'];
            $a['desconto']+= $ped['desconto'];
            $a['frete']   += $ped['frete'];
            foreach ($ped['itens'] as $it) {
                $a['unidades'] += $it['quantidade'];
            }
            unset($a);
        }

        $linhas = array_values($acum);
        foreach ($linhas as &$l) {
            foreach (['receita', 'custo', 'desconto', 'frete'] as $c) {
                $l[$c] = round($l[$c], 2);
            }
            $l['ticket_medio'] = $l['pedidos'] > 0 ? round($l['receita'] / $l['pedidos'], 2) : 0.0;
            $l['margem_pct']   = $l['receita'] > 0 ? round((($l['receita'] - $l['custo']) / $l['receita']) * 100, 1) : 0.0;
        }
        unset($l);
        usort($linhas, static fn($a, $b) => strcmp($b['data'], $a['data']));

        return [
            'linhas' => $linhas,
            'busca'  => ['data', 'canal'],
            'totalizar' => ['pedidos', 'unidades', 'receita', 'custo', 'desconto', 'frete'],
            'facetas' => ['canal' => self::facetar($linhas, 'canal')],
            'colunas' => [
                self::col('data', 'Data', 'data'),
                self::col('canal', 'Canal'),
                self::col('pedidos', 'Pedidos', 'inteiro'),
                self::col('unidades', 'Unidades', 'inteiro'),
                self::col('receita', 'Receita', 'moeda', ['destaque' => true]),
                self::col('ticket_medio', 'Ticket médio', 'moeda'),
                self::col('custo', 'Custo', 'moeda'),
                self::col('margem_pct', 'Margem', 'percentual'),
                self::col('desconto', 'Desconto', 'moeda'),
                self::col('frete', 'Frete', 'moeda'),
            ],
        ];
    }

    private static function canais(BlingProviderBase $p, array $f): array
    {
        $pedidos = $p->colecao('pedidos');
        $notas = [];
        foreach ($p->colecao('notas') as $n) {
            $notas[$n['pedido']] = $n;
        }

        $linhas = [];
        foreach ($p->colecao('canais') as $c) {
            $doCanal = array_values(array_filter($pedidos, static fn($x) =>
                $x['canal'] === $c['id'] && $x['data'] >= $f['de'] && $x['data'] <= $f['ate']));
            $validos = array_values(array_filter($doCanal, static fn($x) =>
                !in_array($x['situacao'], ['rascunho', 'cancelado'], true)));
            $cancelados = count($doCanal) - count($validos);

            $receita = array_sum(array_column($validos, 'total'));
            $custo   = array_sum(array_column($validos, 'custo'));
            $nfErro = 0;
            foreach ($validos as $ped) {
                if (isset($notas[$ped['id']]) && $notas[$ped['id']]['situacao'] === 'rejeitada') {
                    $nfErro++;
                }
            }

            $linhas[] = [
                'id'          => $c['id'],
                'nome'        => $c['nome'],
                'tipo'        => $c['tipo'],
                'integrado'   => $c['integrado'],
                'pedidos'     => count($validos),
                'faturamento' => round($receita, 2),
                'ticket_medio'=> count($validos) > 0 ? round($receita / count($validos), 2) : 0.0,
                'margem_pct'  => $receita > 0 ? round((($receita - $custo) / $receita) * 100, 1) : 0.0,
                'cancelamentos' => $cancelados,
                'taxa_cancelamento' => count($doCanal) > 0 ? round(($cancelados / count($doCanal)) * 100, 1) : 0.0,
                'notas_erro'  => $nfErro,
                'taxa_erro'   => count($validos) > 0 ? round(($nfErro / count($validos)) * 100, 1) : 0.0,
                'participacao'=> 0.0,
            ];
        }

        $totalFat = array_sum(array_column($linhas, 'faturamento'));
        foreach ($linhas as &$l) {
            $l['participacao'] = $totalFat > 0 ? round(($l['faturamento'] / $totalFat) * 100, 1) : 0.0;
        }
        unset($l);
        usort($linhas, static fn($a, $b) => $b['faturamento'] <=> $a['faturamento']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome', 'tipo'],
            'totalizar' => ['pedidos', 'faturamento', 'cancelamentos', 'notas_erro'],
            'colunas' => [
                self::col('nome', 'Canal'),
                self::col('tipo', 'Tipo'),
                self::col('integrado', 'Integração', 'booleano'),
                self::col('pedidos', 'Pedidos', 'inteiro'),
                self::col('faturamento', 'Faturamento', 'moeda', ['destaque' => true]),
                self::col('participacao', 'Participação', 'percentual'),
                self::col('ticket_medio', 'Ticket médio', 'moeda'),
                self::col('margem_pct', 'Margem', 'percentual'),
                self::col('cancelamentos', 'Cancelamentos', 'inteiro'),
                self::col('taxa_cancelamento', 'Taxa cancel.', 'percentual'),
                self::col('notas_erro', 'Notas c/ erro', 'inteiro'),
                self::col('taxa_erro', 'Taxa erro', 'percentual'),
            ],
        ];
    }

    private static function vendedores(BlingProviderBase $p, array $f): array
    {
        $pedidos = array_values(array_filter($p->colecao('pedidos'), static fn($x) =>
            $x['data'] >= $f['de'] && $x['data'] <= $f['ate']
            && !in_array($x['situacao'], ['rascunho', 'cancelado'], true)));

        $linhas = [];
        foreach ($p->colecao('vendedores') as $v) {
            $meus = array_values(array_filter($pedidos, static fn($x) => $x['vendedor'] === $v['id']));
            $receita = array_sum(array_column($meus, 'total'));
            $custo   = array_sum(array_column($meus, 'custo'));
            // Meta proporcional ao periodo analisado, nao a meta mensal cheia.
            $meses = max(1, (strtotime($f['ate']) - strtotime($f['de'])) / 86400 / 30.44);
            $meta = $v['meta_mensal'] * $meses;

            $linhas[] = [
                'id'        => $v['id'],
                'nome'      => $v['nome'],
                'pedidos'   => count($meus),
                'faturamento' => round($receita, 2),
                'ticket_medio'=> count($meus) > 0 ? round($receita / count($meus), 2) : 0.0,
                'margem_pct'=> $receita > 0 ? round((($receita - $custo) / $receita) * 100, 1) : 0.0,
                'comissao_pct' => $v['comissao_pct'],
                'comissao_valor' => round($receita * $v['comissao_pct'] / 100, 2),
                'meta'      => round($meta, 2),
                'atingimento' => $meta > 0 ? round(($receita / $meta) * 100, 1) : 0.0,
                'clientes'  => count(array_unique(array_column($meus, 'cliente'))),
            ];
        }
        usort($linhas, static fn($a, $b) => $b['faturamento'] <=> $a['faturamento']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome'],
            'totalizar' => ['pedidos', 'faturamento', 'comissao_valor', 'meta', 'clientes'],
            'colunas' => [
                self::col('nome', 'Vendedor'),
                self::col('pedidos', 'Pedidos', 'inteiro'),
                self::col('faturamento', 'Faturamento', 'moeda', ['destaque' => true]),
                self::col('meta', 'Meta', 'moeda'),
                self::col('atingimento', 'Atingimento', 'percentual'),
                self::col('ticket_medio', 'Ticket médio', 'moeda'),
                self::col('margem_pct', 'Margem', 'percentual'),
                self::col('comissao_pct', 'Comissão', 'percentual'),
                self::col('comissao_valor', 'Comissão R$', 'moeda'),
                self::col('clientes', 'Clientes', 'inteiro'),
            ],
        ];
    }

    private static function comissoes(BlingProviderBase $p, array $f): array
    {
        $vend = self::indexar($p->colecao('vendedores'));
        $clientes = self::indexar($p->colecao('clientes'));

        $linhas = [];
        foreach ($p->colecao('pedidos') as $ped) {
            if ($ped['data'] < $f['de'] || $ped['data'] > $f['ate']) {
                continue;
            }
            if (in_array($ped['situacao'], ['rascunho', 'cancelado'], true)) {
                continue;
            }
            $v = $vend[$ped['vendedor']] ?? null;
            if ($v === null) {
                continue;
            }
            $base = $ped['total'] - $ped['frete'];
            // Comissao so e devida quando o titulo foi efetivamente recebido.
            $devida = in_array($ped['situacao'], ['entregue', 'enviado'], true);

            $linhas[] = [
                'id'        => 'com-' . $ped['id'],
                'pedido'    => $ped['numero'],
                'data'      => $ped['data'],
                'vendedor'  => $v['nome'],
                'cliente'   => $clientes[$ped['cliente']]['nome'] ?? '—',
                'base'      => round($base, 2),
                'percentual'=> $v['comissao_pct'],
                'valor'     => round($base * $v['comissao_pct'] / 100, 2),
                'situacao'  => $devida ? 'devida' : 'provisionada',
                'situacao_info' => [
                    'chave' => $devida ? 'devida' : 'provisionada',
                    'rotulo'=> $devida ? 'Devida' : 'Provisionada',
                    'cor'   => $devida ? 'sucesso' : 'aviso',
                ],
            ];
        }
        usort($linhas, static fn($a, $b) => strcmp($b['data'], $a['data']));

        return [
            'linhas' => $linhas,
            'busca'  => ['pedido', 'vendedor', 'cliente'],
            'totalizar' => ['base', 'valor'],
            'facetas' => ['vendedor' => self::facetar($linhas, 'vendedor')],
            'colunas' => [
                self::col('pedido', 'Pedido'),
                self::col('data', 'Data', 'data'),
                self::col('vendedor', 'Vendedor'),
                self::col('cliente', 'Cliente'),
                self::col('base', 'Base de cálculo', 'moeda'),
                self::col('percentual', 'Percentual', 'percentual'),
                self::col('valor', 'Comissão', 'moeda', ['destaque' => true]),
                self::col('situacao', 'Situação', 'badge'),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // PRODUTOS
    // ─────────────────────────────────────────────────────────────

    private static function produtos(BlingProviderBase $p, array $f): array
    {
        $categorias = self::indexar($p->colecao('categorias'));
        $fornecedores = self::indexar($p->colecao('fornecedores'));
        $canais = self::indexar($p->colecao('canais'));

        $linhas = [];
        foreach ($p->colecao('produtos') as $prod) {
            if ($f['categoria'] !== '' && $prod['categoria'] !== $f['categoria']) {
                continue;
            }
            $linhas[] = [
                'id'        => $prod['id'],
                'bling_id'  => $prod['bling_id'],
                'imagem'    => $prod['imagem'],
                'sku'       => $prod['sku'],
                'gtin'      => $prod['gtin'],
                'nome'      => $prod['nome'],
                'tipo'      => $prod['tipo'],
                'categoria' => $categorias[$prod['categoria']]['nome'] ?? '—',
                'categoria_id' => $prod['categoria'],
                'marca'     => $prod['marca'],
                'variacoes' => $prod['variacoes'],
                'preco'     => $prod['preco'],
                'preco_promocional' => $prod['preco_promocional'],
                'custo'     => $prod['custo'],
                'margem_pct'=> $prod['margem_pct'],
                'estoque'   => $prod['estoque_total'],
                'situacao'  => $prod['ativo'] ? 'ativo' : 'inativo',
                'situacao_info' => [
                    'chave' => $prod['ativo'] ? 'ativo' : 'inativo',
                    'rotulo'=> $prod['ativo'] ? 'Ativo' : 'Inativo',
                    'cor'   => $prod['ativo'] ? 'sucesso' : 'neutro',
                ],
                'origem'    => $prod['origem'],
                'canais'    => implode(', ', array_map(static fn($c) => $canais[$c]['nome'] ?? $c, $prod['canais'])),
                'canais_qtd'=> count($prod['canais']),
                'fornecedor'=> $fornecedores[$prod['fornecedor']]['nome'] ?? '—',
                'ultima_venda' => $prod['ultima_venda'],
                'unidades_vendidas' => $prod['unidades_vendidas'],
                'receita'   => $prod['receita'],
                'qualidade_score' => $prod['qualidade_score'],
                'qualidade_pendencias' => $prod['qualidade_pendencias'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['sku', 'nome', 'gtin', 'marca', 'bling_id'],
            'totalizar' => ['estoque', 'unidades_vendidas', 'receita'],
            'facetas' => [
                'categoria' => self::facetar($linhas, 'categoria'),
                'marca'     => self::facetar($linhas, 'marca'),
                'tipo'      => self::facetar($linhas, 'tipo'),
            ],
            'colunas' => [
                self::col('imagem', 'Imagem', 'imagem', ['ordenavel' => false, 'largura' => 56]),
                self::col('bling_id', 'ID', 'inteiro'),
                self::col('sku', 'SKU'),
                self::col('gtin', 'GTIN/EAN'),
                self::col('nome', 'Nome', 'texto', ['largura' => 280]),
                self::col('tipo', 'Tipo'),
                self::col('categoria', 'Categoria'),
                self::col('marca', 'Marca'),
                self::col('variacoes', 'Variações', 'inteiro'),
                self::col('preco', 'Preço', 'moeda'),
                self::col('custo', 'Custo', 'moeda'),
                self::col('margem_pct', 'Margem', 'percentual'),
                self::col('estoque', 'Estoque', 'inteiro'),
                self::col('situacao', 'Situação', 'badge'),
                self::col('origem', 'Origem'),
                self::col('canais', 'Canais'),
                self::col('qualidade_score', 'Qualidade', 'medidor'),
                self::col('ultima_venda', 'Última venda', 'data'),
            ],
        ];
    }

    private static function variacoes(BlingProviderBase $p, array $f): array
    {
        $categorias = self::indexar($p->colecao('categorias'));
        $linhas = [];
        $atributos = ['Cor', 'Tamanho', 'Voltagem', 'Potência', 'Comprimento'];
        $valores = [
            'Cor' => ['Preto', 'Branco', 'Cinza'],
            'Tamanho' => ['P', 'M', 'G'],
            'Voltagem' => ['110V', '220V', 'Bivolt'],
            'Potência' => ['300W', '600W', '1200W'],
            'Comprimento' => ['1m', '3m', '5m', '10m'],
        ];

        foreach ($p->colecao('produtos') as $prod) {
            if ($prod['variacoes'] <= 0) {
                continue;
            }
            $attr = $atributos[crc32($prod['id']) % count($atributos)];
            for ($i = 0; $i < $prod['variacoes']; $i++) {
                $valor = $valores[$attr][$i % count($valores[$attr])];
                $linhas[] = [
                    'id'        => $prod['id'] . '-v' . ($i + 1),
                    'pai'       => $prod['nome'],
                    'pai_id'    => $prod['id'],
                    'sku'       => $prod['sku'] . '-' . strtoupper(substr($valor, 0, 3)),
                    'atributo'  => $attr,
                    'valor'     => $valor,
                    'categoria' => $categorias[$prod['categoria']]['nome'] ?? '—',
                    'preco'     => round($prod['preco'] * (1 + ($i * 0.04)), 2),
                    'custo'     => round($prod['custo'] * (1 + ($i * 0.03)), 2),
                    'estoque'   => (int) round($prod['estoque_total'] / max(1, $prod['variacoes'])),
                    'situacao'  => $prod['ativo'] ? 'ativo' : 'inativo',
                    'situacao_info' => [
                        'chave' => $prod['ativo'] ? 'ativo' : 'inativo',
                        'rotulo'=> $prod['ativo'] ? 'Ativo' : 'Inativo',
                        'cor'   => $prod['ativo'] ? 'sucesso' : 'neutro',
                    ],
                ];
            }
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['sku', 'pai', 'valor'],
            'totalizar' => ['estoque'],
            'facetas' => ['atributo' => self::facetar($linhas, 'atributo')],
            'colunas' => [
                self::col('sku', 'SKU'),
                self::col('pai', 'Produto pai', 'texto', ['largura' => 260]),
                self::col('atributo', 'Atributo'),
                self::col('valor', 'Valor'),
                self::col('categoria', 'Categoria'),
                self::col('preco', 'Preço', 'moeda'),
                self::col('custo', 'Custo', 'moeda'),
                self::col('estoque', 'Estoque', 'inteiro'),
                self::col('situacao', 'Situação', 'badge'),
            ],
        ];
    }

    private static function kits(BlingProviderBase $p, array $f): array
    {
        $produtos = $p->colecao('produtos');
        $porId = self::indexar($produtos);
        $linhas = [];

        foreach ($produtos as $prod) {
            if ($prod['tipo'] !== 'kit') {
                continue;
            }
            // Composicao deterministica: derivada do id, para nao mudar a cada request.
            $semente = crc32($prod['id']);
            $qtdComponentes = 2 + ($semente % 4);
            $componentes = [];
            $custoKit = 0.0;
            for ($i = 0; $i < $qtdComponentes; $i++) {
                $idx = ($semente + $i * 7919) % count($produtos);
                $c = $produtos[$idx];
                if ($c['id'] === $prod['id']) {
                    continue;
                }
                $q = 1 + (($semente + $i) % 3);
                $componentes[] = ['sku' => $c['sku'], 'nome' => $c['nome'], 'quantidade' => $q];
                $custoKit += $c['custo'] * $q;
            }

            $linhas[] = [
                'id'          => $prod['id'],
                'sku'         => $prod['sku'],
                'nome'        => $prod['nome'],
                'componentes' => count($componentes),
                'composicao'  => $componentes,
                'preco'       => $prod['preco'],
                'custo_kit'   => round($custoKit, 2),
                'custo_cadastrado' => $prod['custo'],
                'divergencia_custo' => round($custoKit - $prod['custo'], 2),
                'margem_pct'  => $prod['preco'] > 0 ? round((($prod['preco'] - $custoKit) / $prod['preco']) * 100, 1) : 0.0,
                'estoque'     => $prod['estoque_total'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['sku', 'nome'],
            'totalizar' => ['componentes', 'estoque'],
            'colunas' => [
                self::col('sku', 'SKU'),
                self::col('nome', 'Kit', 'texto', ['largura' => 280]),
                self::col('componentes', 'Componentes', 'inteiro'),
                self::col('preco', 'Preço', 'moeda'),
                self::col('custo_kit', 'Custo da composição', 'moeda'),
                self::col('custo_cadastrado', 'Custo cadastrado', 'moeda'),
                self::col('divergencia_custo', 'Divergência', 'moeda', ['semaforo' => true]),
                self::col('margem_pct', 'Margem', 'percentual'),
                self::col('estoque', 'Estoque', 'inteiro'),
            ],
        ];
    }

    private static function categorias(BlingProviderBase $p, array $f): array
    {
        $produtos = $p->colecao('produtos');
        $linhas = [];
        foreach ($p->colecao('categorias') as $c) {
            $daCategoria = array_values(array_filter($produtos, static fn($x) => $x['categoria'] === $c['id']));
            $receita = array_sum(array_column($daCategoria, 'receita'));
            $estoque = array_sum(array_column($daCategoria, 'estoque_total'));
            $margens = array_column($daCategoria, 'margem_pct');

            $linhas[] = [
                'id'       => $c['id'],
                'nome'     => $c['nome'],
                'produtos' => count($daCategoria),
                'ativos'   => count(array_filter($daCategoria, static fn($x) => $x['ativo'])),
                'receita'  => round($receita, 2),
                'estoque'  => $estoque,
                'margem_media' => count($margens) > 0 ? round(array_sum($margens) / count($margens), 1) : 0.0,
                'qualidade_media' => count($daCategoria) > 0
                    ? (int) round(array_sum(array_column($daCategoria, 'qualidade_score')) / count($daCategoria)) : 0,
            ];
        }
        usort($linhas, static fn($a, $b) => $b['receita'] <=> $a['receita']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome'],
            'totalizar' => ['produtos', 'ativos', 'receita', 'estoque'],
            'colunas' => [
                self::col('nome', 'Categoria'),
                self::col('produtos', 'Produtos', 'inteiro'),
                self::col('ativos', 'Ativos', 'inteiro'),
                self::col('receita', 'Receita', 'moeda', ['destaque' => true]),
                self::col('estoque', 'Estoque', 'inteiro'),
                self::col('margem_media', 'Margem média', 'percentual'),
                self::col('qualidade_media', 'Qualidade média', 'medidor'),
            ],
        ];
    }

    private static function precos(BlingProviderBase $p, array $f): array
    {
        $categorias = self::indexar($p->colecao('categorias'));
        $linhas = [];
        foreach ($p->colecao('produtos') as $prod) {
            $preco = $prod['preco_promocional'] ?? $prod['preco'];
            $linhas[] = [
                'id'        => $prod['id'],
                'sku'       => $prod['sku'],
                'nome'      => $prod['nome'],
                'categoria' => $categorias[$prod['categoria']]['nome'] ?? '—',
                'preco'     => $prod['preco'],
                'preco_promocional' => $prod['preco_promocional'],
                'desconto_pct' => $prod['preco_promocional'] !== null && $prod['preco'] > 0
                    ? round((1 - $prod['preco_promocional'] / $prod['preco']) * 100, 1) : 0.0,
                'custo'     => $prod['custo'],
                'margem_pct'=> $preco > 0 ? round((($preco - $prod['custo']) / $preco) * 100, 1) : 0.0,
                'markup'    => $prod['custo'] > 0 ? round($preco / $prod['custo'], 2) : 0.0,
                'abaixo_custo' => $preco < $prod['custo'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['sku', 'nome'],
            'totalizar' => [],
            'facetas' => ['categoria' => self::facetar($linhas, 'categoria')],
            'colunas' => [
                self::col('sku', 'SKU'),
                self::col('nome', 'Produto', 'texto', ['largura' => 280]),
                self::col('categoria', 'Categoria'),
                self::col('custo', 'Custo', 'moeda'),
                self::col('preco', 'Preço', 'moeda'),
                self::col('preco_promocional', 'Promocional', 'moeda'),
                self::col('desconto_pct', 'Desconto', 'percentual'),
                self::col('margem_pct', 'Margem', 'percentual', ['semaforo' => true]),
                self::col('markup', 'Markup', 'numero'),
                self::col('abaixo_custo', 'Abaixo do custo', 'booleano'),
            ],
        ];
    }

    private static function estoque(BlingProviderBase $p, array $f): array
    {
        $produtos = self::indexar($p->colecao('produtos'));
        $depositos = self::indexar($p->colecao('depositos'));

        $linhas = [];
        foreach ($p->colecao('estoque') as $e) {
            if ($f['deposito'] !== '' && $e['deposito'] !== $f['deposito']) {
                continue;
            }
            $prod = $produtos[$e['produto']] ?? null;
            if ($prod === null) {
                continue;
            }
            $linhas[] = [
                'id'         => $e['produto'] . '|' . $e['deposito'],
                'produto'    => $prod['nome'],
                'produto_id' => $e['produto'],
                'sku'        => $prod['sku'],
                'deposito'   => $depositos[$e['deposito']]['nome'] ?? $e['deposito'],
                'deposito_id'=> $e['deposito'],
                'fisico'     => $e['fisico'],
                'reservado'  => $e['reservado'],
                'disponivel' => $e['disponivel'],
                'minimo'     => $e['minimo'],
                'maximo'     => $e['maximo'],
                'giro_anual' => $e['giro_anual'],
                'cobertura_dias' => $e['cobertura_dias'],
                'consumo_90d'=> $e['consumo_90d'],
                'divergencia'=> $e['divergencia'],
                'valor'      => round(max(0, $e['fisico']) * $prod['custo'], 2),
                'margem_pct' => $prod['margem_pct'],
                'ultima_movimentacao' => $e['ultima_movimentacao'],
                'status'     => $e['status'],
                'status_info'=> self::statusEstoque($e['status']),
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['produto', 'sku', 'deposito'],
            'totalizar' => ['fisico', 'reservado', 'disponivel', 'valor'],
            'facetas' => [
                'deposito' => self::facetar($linhas, 'deposito'),
                'status'   => self::facetar($linhas, 'status'),
            ],
            'colunas' => [
                self::col('produto', 'Produto', 'texto', ['largura' => 280]),
                self::col('sku', 'SKU'),
                self::col('deposito', 'Depósito'),
                self::col('fisico', 'Físico', 'inteiro'),
                self::col('reservado', 'Reservado', 'inteiro'),
                self::col('disponivel', 'Disponível', 'inteiro', ['destaque' => true]),
                self::col('minimo', 'Mínimo', 'inteiro'),
                self::col('maximo', 'Máximo', 'inteiro'),
                self::col('giro_anual', 'Giro', 'numero'),
                self::col('cobertura_dias', 'Cobertura (dias)', 'numero'),
                self::col('divergencia', 'Divergência', 'inteiro', ['semaforo' => true]),
                self::col('valor', 'Valor', 'moeda'),
                self::col('ultima_movimentacao', 'Última mov.', 'data'),
                self::col('status', 'Status', 'badge'),
            ],
        ];
    }

    private static function statusEstoque(string $s): array
    {
        return match ($s) {
            'negativo'        => ['chave' => $s, 'rotulo' => 'Negativo',        'cor' => 'erro'],
            'zerado'          => ['chave' => $s, 'rotulo' => 'Zerado',          'cor' => 'erro'],
            'critico'         => ['chave' => $s, 'rotulo' => 'Crítico',         'cor' => 'aviso'],
            'baixa_cobertura' => ['chave' => $s, 'rotulo' => 'Cobertura baixa', 'cor' => 'aviso'],
            'parado'          => ['chave' => $s, 'rotulo' => 'Parado',          'cor' => 'neutro'],
            default           => ['chave' => $s, 'rotulo' => 'Normal',          'cor' => 'sucesso'],
        };
    }

    private static function depositos(BlingProviderBase $p, array $f): array
    {
        $produtos = self::indexar($p->colecao('produtos'));
        $estoque = $p->colecao('estoque');
        $unidades = self::indexar($p->colecao('unidades'));

        $linhas = [];
        foreach ($p->colecao('depositos') as $d) {
            $doDep = array_values(array_filter($estoque, static fn($e) => $e['deposito'] === $d['id']));
            $valor = 0.0;
            foreach ($doDep as $e) {
                $valor += max(0, $e['fisico']) * ($produtos[$e['produto']]['custo'] ?? 0);
            }
            $linhas[] = [
                'id'         => $d['id'],
                'nome'       => $d['nome'],
                'unidade'    => $unidades[$d['unidade']]['nome'] ?? '—',
                'padrao'     => $d['padrao'],
                'produtos'   => count($doDep),
                'fisico'     => array_sum(array_column($doDep, 'fisico')),
                'reservado'  => array_sum(array_column($doDep, 'reservado')),
                'disponivel' => array_sum(array_column($doDep, 'disponivel')),
                'valor'      => round($valor, 2),
                'zerados'    => count(array_filter($doDep, static fn($e) => $e['status'] === 'zerado')),
                'negativos'  => count(array_filter($doDep, static fn($e) => $e['status'] === 'negativo')),
                'divergencias' => count(array_filter($doDep, static fn($e) => $e['divergencia'] !== 0)),
            ];
        }
        usort($linhas, static fn($a, $b) => $b['valor'] <=> $a['valor']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome', 'unidade'],
            'totalizar' => ['produtos', 'fisico', 'reservado', 'disponivel', 'valor', 'zerados', 'negativos'],
            'colunas' => [
                self::col('nome', 'Depósito'),
                self::col('unidade', 'Unidade'),
                self::col('padrao', 'Padrão', 'booleano'),
                self::col('produtos', 'Produtos', 'inteiro'),
                self::col('fisico', 'Físico', 'inteiro'),
                self::col('reservado', 'Reservado', 'inteiro'),
                self::col('disponivel', 'Disponível', 'inteiro'),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('zerados', 'Zerados', 'inteiro'),
                self::col('negativos', 'Negativos', 'inteiro', ['semaforo' => true]),
                self::col('divergencias', 'Divergências', 'inteiro', ['semaforo' => true]),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // COMPRAS
    // ─────────────────────────────────────────────────────────────

    private static function pedidosCompra(BlingProviderBase $p, array $f): array
    {
        $forn = self::indexar($p->colecao('fornecedores'));
        $hoje = date('Y-m-d');

        $linhas = [];
        foreach ($p->colecao('compras') as $oc) {
            if ($oc['emissao'] < $f['de'] || $oc['emissao'] > $f['ate']) {
                continue;
            }
            if ($f['situacao'] !== '' && $oc['situacao'] !== $f['situacao']) {
                continue;
            }
            if ($f['fornecedor'] !== '' && $oc['fornecedor'] !== $f['fornecedor']) {
                continue;
            }

            $atrasado = $oc['recebimento'] === null && $oc['previsao'] < $hoje
                && !in_array($oc['situacao'], ['recebido', 'cancelado'], true);

            $linhas[] = [
                'id'          => $oc['id'],
                'numero'      => $oc['numero'],
                'bling_id'    => $oc['bling_id'],
                'fornecedor'  => $forn[$oc['fornecedor']]['nome'] ?? '—',
                'fornecedor_id' => $oc['fornecedor'],
                'situacao'    => $oc['situacao'],
                'situacao_info' => BlingSituacoes::descrever('compra', $oc['situacao']),
                'emissao'     => $oc['emissao'],
                'previsao'    => $oc['previsao'],
                'recebimento' => $oc['recebimento'],
                'atrasado'    => $atrasado,
                'dias_atraso' => $atrasado ? (int) ((strtotime($hoje) - strtotime($oc['previsao'])) / 86400) : 0,
                'itens'       => $oc['qtd_itens'],
                'qtd_total'   => $oc['qtd_total'],
                'qtd_recebida'=> $oc['qtd_recebida'],
                'pendente'    => $oc['qtd_total'] - $oc['qtd_recebida'],
                'valor'       => $oc['valor'],
                'comprador'   => $oc['comprador'],
                'divergencia' => $oc['divergencia'],
                'atualizado_em' => $oc['atualizado_em'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['numero', 'fornecedor', 'comprador'],
            'totalizar' => ['itens', 'qtd_total', 'qtd_recebida', 'pendente', 'valor'],
            'facetas' => [
                'situacao'   => self::facetar($linhas, 'situacao'),
                'fornecedor' => self::facetar($linhas, 'fornecedor'),
            ],
            'colunas' => [
                self::col('numero', 'Número'),
                self::col('fornecedor', 'Fornecedor', 'texto', ['largura' => 240]),
                self::col('situacao', 'Situação', 'badge'),
                self::col('emissao', 'Emissão', 'data'),
                self::col('previsao', 'Previsão', 'data'),
                self::col('recebimento', 'Recebimento', 'data'),
                self::col('dias_atraso', 'Atraso', 'inteiro', ['semaforo' => true]),
                self::col('itens', 'Itens', 'inteiro'),
                self::col('qtd_recebida', 'Recebido', 'inteiro'),
                self::col('pendente', 'Pendente', 'inteiro'),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('comprador', 'Comprador'),
                self::col('divergencia', 'Divergência', 'booleano'),
                self::col('atualizado_em', 'Atualização', 'datahora'),
            ],
        ];
    }

    private static function fornecedores(BlingProviderBase $p, array $f): array
    {
        $compras = $p->colecao('compras');
        $produtos = $p->colecao('produtos');

        $linhas = [];
        foreach ($p->colecao('fornecedores') as $fo) {
            $minhas = array_values(array_filter($compras, static fn($c) => $c['fornecedor'] === $fo['id']));
            $recebidas = array_values(array_filter($minhas, static fn($c) => $c['recebimento'] !== null));

            $atrasos = [];
            foreach ($recebidas as $c) {
                $atrasos[] = (int) ((strtotime($c['recebimento']) - strtotime($c['previsao'])) / 86400);
            }
            $atrasoMedio = count($atrasos) > 0 ? array_sum($atrasos) / count($atrasos) : 0.0;
            $noPrazo = count(array_filter($atrasos, static fn($a) => $a <= 0));
            $pontualidade = count($atrasos) > 0 ? ($noPrazo / count($atrasos)) * 100 : 0.0;
            $divergencias = count(array_filter($minhas, static fn($c) => $c['divergencia']));
            $totalComprado = array_sum(array_column($minhas, 'valor'));
            $meusProdutos = count(array_filter($produtos, static fn($x) => $x['fornecedor'] === $fo['id']));

            $datas = array_column($minhas, 'emissao');
            rsort($datas);

            // Score interno (§29) — 4 dimensoes, peso igual. NAO e avaliacao do Bling.
            $sPrazo    = max(0.0, min(100.0, $pontualidade));
            $sDiverg   = count($minhas) > 0 ? max(0.0, 100.0 - ($divergencias / count($minhas)) * 100) : 100.0;
            $sCadastro = $fo['cadastro_completo'] ? 100.0 : 45.0;
            $sRegular  = min(100.0, count($minhas) * 8.0);
            $score = (int) round(($sPrazo + $sDiverg + $sCadastro + $sRegular) / 4);

            $linhas[] = [
                'id'          => $fo['id'],
                'bling_id'    => $fo['bling_id'],
                'nome'        => $fo['nome'],
                'documento'   => $fo['cnpj_mascarado'],
                'uf'          => $fo['uf'],
                'pedidos'     => count($minhas),
                'total_comprado' => round($totalComprado, 2),
                'ticket_medio'=> count($minhas) > 0 ? round($totalComprado / count($minhas), 2) : 0.0,
                'prazo_contratado' => $fo['prazo_entrega_dias'],
                'atraso_medio'=> round($atrasoMedio, 1),
                'pontualidade'=> round($pontualidade, 1),
                'divergencias'=> $divergencias,
                'produtos'    => $meusProdutos,
                'ultima_compra' => $datas[0] ?? null,
                'cadastro_completo' => $fo['cadastro_completo'],
                'ativo'       => $fo['ativo'],
                'score'       => $score,
                'score_detalhe' => [
                    'prazo' => round($sPrazo), 'divergencias' => round($sDiverg),
                    'cadastro' => round($sCadastro), 'regularidade' => round($sRegular),
                ],
            ];
        }
        usort($linhas, static fn($a, $b) => $b['total_comprado'] <=> $a['total_comprado']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome', 'documento', 'uf'],
            'totalizar' => ['pedidos', 'total_comprado', 'divergencias', 'produtos'],
            'facetas' => ['uf' => self::facetar($linhas, 'uf')],
            'colunas' => [
                self::col('nome', 'Fornecedor', 'texto', ['largura' => 240]),
                self::col('documento', 'CNPJ'),
                self::col('uf', 'UF'),
                self::col('pedidos', 'Pedidos', 'inteiro'),
                self::col('total_comprado', 'Total comprado', 'moeda', ['destaque' => true]),
                self::col('ticket_medio', 'Ticket médio', 'moeda'),
                self::col('prazo_contratado', 'Prazo (dias)', 'inteiro'),
                self::col('atraso_medio', 'Atraso médio', 'numero', ['semaforo' => true]),
                self::col('pontualidade', 'Pontualidade', 'percentual'),
                self::col('divergencias', 'Divergências', 'inteiro'),
                self::col('produtos', 'Produtos', 'inteiro'),
                self::col('ultima_compra', 'Última compra', 'data'),
                self::col('score', 'Score interno', 'medidor',
                    ['tooltip' => 'Score calculado pelo Dshow Dash. Não é avaliação oficial do Bling.']),
            ],
        ];
    }

    private static function recebimentos(BlingProviderBase $p, array $f): array
    {
        $forn = self::indexar($p->colecao('fornecedores'));
        $linhas = [];
        foreach ($p->colecao('compras') as $oc) {
            if ($oc['recebimento'] === null) {
                continue;
            }
            if ($oc['recebimento'] < $f['de'] || $oc['recebimento'] > $f['ate']) {
                continue;
            }
            $atraso = (int) ((strtotime($oc['recebimento']) - strtotime($oc['previsao'])) / 86400);
            $linhas[] = [
                'id'         => 'rec-' . $oc['id'],
                'pedido'     => $oc['numero'],
                'fornecedor' => $forn[$oc['fornecedor']]['nome'] ?? '—',
                'previsao'   => $oc['previsao'],
                'recebimento'=> $oc['recebimento'],
                'atraso_dias'=> $atraso,
                'no_prazo'   => $atraso <= 0,
                'qtd_pedida' => $oc['qtd_total'],
                'qtd_recebida' => $oc['qtd_recebida'],
                'conferencia'=> $oc['qtd_recebida'] >= $oc['qtd_total'] ? 'completa' : 'parcial',
                'divergencia'=> $oc['divergencia'],
                'valor'      => $oc['valor'],
                'situacao_info' => [
                    'chave' => $oc['qtd_recebida'] >= $oc['qtd_total'] ? 'completa' : 'parcial',
                    'rotulo'=> $oc['qtd_recebida'] >= $oc['qtd_total'] ? 'Completa' : 'Parcial',
                    'cor'   => $oc['qtd_recebida'] >= $oc['qtd_total'] ? 'sucesso' : 'aviso',
                ],
            ];
        }
        usort($linhas, static fn($a, $b) => strcmp($b['recebimento'], $a['recebimento']));

        return [
            'linhas' => $linhas,
            'busca'  => ['pedido', 'fornecedor'],
            'totalizar' => ['qtd_pedida', 'qtd_recebida', 'valor'],
            'colunas' => [
                self::col('pedido', 'Pedido de compra'),
                self::col('fornecedor', 'Fornecedor', 'texto', ['largura' => 240]),
                self::col('previsao', 'Previsão', 'data'),
                self::col('recebimento', 'Recebimento', 'data'),
                self::col('atraso_dias', 'Atraso', 'inteiro', ['semaforo' => true]),
                self::col('qtd_pedida', 'Qtd. pedida', 'inteiro'),
                self::col('qtd_recebida', 'Qtd. recebida', 'inteiro'),
                self::col('conferencia', 'Conferência', 'badge'),
                self::col('divergencia', 'Divergência', 'booleano'),
                self::col('valor', 'Valor', 'moeda'),
            ],
        ];
    }

    /**
     * Necessidades de compra (§28): recomendacao com MOTIVO explicito.
     * Uma sugestao sem motivo nao e acionavel - o comprador precisa saber por que.
     */
    private static function necessidadesCompra(BlingProviderBase $p, array $f): array
    {
        $produtos = self::indexar($p->colecao('produtos'));
        $forn = self::indexar($p->colecao('fornecedores'));
        $depositos = self::indexar($p->colecao('depositos'));

        // Quantidade ja em transito por produto - evita sugerir compra do que ja vem.
        $emTransito = [];
        foreach ($p->colecao('compras') as $oc) {
            if (in_array($oc['situacao'], ['recebido', 'cancelado'], true)) {
                continue;
            }
            foreach ($oc['itens'] as $it) {
                $emTransito[$it['produto']] = ($emTransito[$it['produto']] ?? 0) + $it['quantidade'];
            }
        }

        // Consolida estoque por produto (soma dos depositos).
        $porProduto = [];
        foreach ($p->colecao('estoque') as $e) {
            if (!isset($porProduto[$e['produto']])) {
                $porProduto[$e['produto']] = [
                    'disponivel' => 0, 'minimo' => 0, 'consumo_dia' => 0.0, 'depositos' => [],
                ];
            }
            $porProduto[$e['produto']]['disponivel'] += $e['disponivel'];
            $porProduto[$e['produto']]['minimo']     += $e['minimo'];
            $porProduto[$e['produto']]['consumo_dia'] = max(
                $porProduto[$e['produto']]['consumo_dia'], $e['consumo_dia']
            );
            $porProduto[$e['produto']]['depositos'][] = $depositos[$e['deposito']]['nome'] ?? $e['deposito'];
        }

        $linhas = [];
        foreach ($porProduto as $pid => $d) {
            $prod = $produtos[$pid] ?? null;
            if ($prod === null || !$prod['ativo']) {
                continue;
            }

            $fo = $forn[$prod['fornecedor']] ?? null;
            $leadTime = $fo['prazo_entrega_dias'] ?? 21;
            $transito = $emTransito[$pid] ?? 0;
            $posicao = $d['disponivel'] + $transito;
            $cobertura = $d['consumo_dia'] > 0 ? $posicao / $d['consumo_dia'] : null;

            // Alvo: cobrir o lead time + 15 dias de seguranca, respeitando o minimo.
            $alvo = $d['consumo_dia'] > 0
                ? (int) ceil($d['consumo_dia'] * ($leadTime + 15))
                : $d['minimo'];
            $sugerida = max(0, $alvo - $posicao);

            [$motivo, $urgencia] = match (true) {
                $d['disponivel'] < 0 => ['Saldo negativo em estoque', 'critica'],
                $posicao <= 0        => ['Sem posição disponível e nada em trânsito', 'critica'],
                $cobertura !== null && $cobertura < $leadTime
                                     => ['Cobertura menor que o lead time do fornecedor', 'alta'],
                $posicao < $d['minimo'] => ['Abaixo do estoque mínimo cadastrado', 'alta'],
                $cobertura !== null && $cobertura < ($leadTime + 15)
                                     => ['Cobertura abaixo do alvo de segurança', 'media'],
                default              => ['', ''],
            };

            if ($motivo === '' || $sugerida <= 0) {
                continue;
            }

            $linhas[] = [
                'id'          => $pid,
                'sku'         => $prod['sku'],
                'produto'     => $prod['nome'],
                'disponivel'  => $d['disponivel'],
                'em_transito' => $transito,
                'posicao'     => $posicao,
                'minimo'      => $d['minimo'],
                'consumo_dia' => round($d['consumo_dia'], 2),
                'cobertura_dias' => $cobertura === null ? null : round($cobertura, 1),
                'lead_time'   => $leadTime,
                'quantidade_sugerida' => $sugerida,
                'custo_unitario' => $prod['custo'],
                'custo_estimado' => round($sugerida * $prod['custo'], 2),
                'fornecedor'  => $fo['nome'] ?? '—',
                'motivo'      => $motivo,
                'urgencia'    => $urgencia,
                'urgencia_info' => [
                    'chave' => $urgencia,
                    'rotulo'=> ucfirst($urgencia),
                    'cor'   => $urgencia === 'critica' ? 'erro' : ($urgencia === 'alta' ? 'aviso' : 'info'),
                ],
                'cobertura_prevista' => $d['consumo_dia'] > 0
                    ? round(($posicao + $sugerida) / $d['consumo_dia'], 1) : null,
            ];
        }

        $peso = ['critica' => 0, 'alta' => 1, 'media' => 2];
        usort($linhas, static fn($a, $b) =>
            [$peso[$a['urgencia']] ?? 9, -$a['custo_estimado']] <=> [$peso[$b['urgencia']] ?? 9, -$b['custo_estimado']]);

        return [
            'linhas' => $linhas,
            'busca'  => ['sku', 'produto', 'fornecedor', 'motivo'],
            'totalizar' => ['quantidade_sugerida', 'custo_estimado'],
            'facetas' => [
                'urgencia'   => self::facetar($linhas, 'urgencia'),
                'fornecedor' => self::facetar($linhas, 'fornecedor'),
            ],
            'colunas' => [
                self::col('urgencia', 'Urgência', 'badge'),
                self::col('sku', 'SKU'),
                self::col('produto', 'Produto', 'texto', ['largura' => 280]),
                self::col('disponivel', 'Disponível', 'inteiro'),
                self::col('em_transito', 'Em trânsito', 'inteiro'),
                self::col('minimo', 'Mínimo', 'inteiro'),
                self::col('cobertura_dias', 'Cobertura', 'numero'),
                self::col('lead_time', 'Lead time', 'inteiro'),
                self::col('quantidade_sugerida', 'Qtd. sugerida', 'inteiro', ['destaque' => true]),
                self::col('custo_estimado', 'Custo estimado', 'moeda'),
                self::col('fornecedor', 'Fornecedor'),
                self::col('motivo', 'Motivo', 'texto', ['largura' => 300]),
                self::col('cobertura_prevista', 'Cobertura prevista', 'numero'),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // FISCAL
    // ─────────────────────────────────────────────────────────────

    private static function notas(BlingProviderBase $p, array $f): array
    {
        $clientes = self::indexar($p->colecao('clientes'));
        $pedidos = self::indexar($p->colecao('pedidos'));

        $linhas = [];
        foreach ($p->colecao('notas') as $n) {
            if ($n['emissao'] < $f['de'] || $n['emissao'] > $f['ate']) {
                continue;
            }
            if ($f['situacao'] !== '' && $n['situacao'] !== $f['situacao']) {
                continue;
            }
            $linhas[] = [
                'id'        => $n['id'],
                'numero'    => $n['numero'],
                'serie'     => $n['serie'],
                'chave'     => $n['chave'],
                'pedido'    => $pedidos[$n['pedido']]['numero'] ?? '—',
                'pedido_id' => $n['pedido'],
                'cliente'   => $clientes[$n['cliente']]['nome'] ?? '—',
                'emissao'   => $n['emissao'],
                'valor'     => $n['valor'],
                'situacao'  => $n['situacao'],
                'situacao_info' => BlingSituacoes::descrever('nota', $n['situacao']),
                'finalidade'=> $n['finalidade'],
                'tipo'      => $n['tipo'],
                'danfe'     => $n['danfe'],
                'xml'       => $n['xml'],
                'erro_codigo'   => $n['erro']['codigo'] ?? null,
                'erro_mensagem' => $n['erro']['mensagem'] ?? null,
                'tentativas'=> $n['tentativas'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['numero', 'chave', 'cliente', 'pedido', 'erro_codigo'],
            'totalizar' => ['valor'],
            'facetas' => ['situacao' => self::facetar($linhas, 'situacao')],
            'colunas' => [
                self::col('numero', 'Número'),
                self::col('serie', 'Série'),
                self::col('chave', 'Chave', 'texto', ['largura' => 300, 'monoespacada' => true]),
                self::col('pedido', 'Pedido'),
                self::col('cliente', 'Cliente', 'texto', ['largura' => 240]),
                self::col('emissao', 'Emissão', 'data'),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('situacao', 'Situação', 'badge'),
                self::col('finalidade', 'Finalidade'),
                self::col('tipo', 'Tipo'),
                self::col('danfe', 'DANFE', 'link'),
                self::col('xml', 'XML', 'link'),
                self::col('erro_codigo', 'Erro'),
                self::col('tentativas', 'Tentativas', 'inteiro'),
            ],
        ];
    }

    private static function notasServico(BlingProviderBase $p, array $f): array
    {
        // Notas de servico derivam dos pedidos do canal de venda direta com servico agregado.
        $clientes = self::indexar($p->colecao('clientes'));
        $linhas = [];
        $n = 0;
        foreach ($p->colecao('pedidos') as $ped) {
            if ($ped['canal'] !== 'balcao' || $ped['data'] < $f['de'] || $ped['data'] > $f['ate']) {
                continue;
            }
            if (in_array($ped['situacao'], ['rascunho', 'cancelado'], true)) {
                continue;
            }
            if (crc32($ped['id']) % 5 !== 0) {
                continue;   // apenas parte dos pedidos gera NFS-e
            }
            $n++;
            $valor = round($ped['total'] * 0.18, 2);
            $situacao = crc32($ped['id'] . 'nfs') % 12 === 0 ? 'pendente' : 'autorizada';
            $linhas[] = [
                'id'       => 'nfs-' . $n,
                'numero'   => (string) (60000 + $n),
                'cliente'  => $clientes[$ped['cliente']]['nome'] ?? '—',
                'emissao'  => $ped['data'],
                'competencia' => substr($ped['data'], 0, 7),
                'descricao'=> 'Serviço de instalação e configuração',
                'valor'    => $valor,
                'iss_pct'  => 5.0,
                'iss_valor'=> round($valor * 0.05, 2),
                'situacao' => $situacao,
                'situacao_info' => BlingSituacoes::descrever('nota', $situacao),
            ];
        }
        usort($linhas, static fn($a, $b) => strcmp($b['emissao'], $a['emissao']));

        return [
            'linhas' => $linhas,
            'busca'  => ['numero', 'cliente', 'descricao'],
            'totalizar' => ['valor', 'iss_valor'],
            'colunas' => [
                self::col('numero', 'Número'),
                self::col('cliente', 'Cliente', 'texto', ['largura' => 240]),
                self::col('emissao', 'Emissão', 'data'),
                self::col('competencia', 'Competência'),
                self::col('descricao', 'Descrição', 'texto', ['largura' => 300]),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('iss_pct', 'ISS', 'percentual'),
                self::col('iss_valor', 'ISS R$', 'moeda'),
                self::col('situacao', 'Situação', 'badge'),
            ],
        ];
    }

    private static function situacoesFiscais(BlingProviderBase $p, array $f): array
    {
        $notas = array_values(array_filter($p->colecao('notas'), static fn($n) =>
            $n['emissao'] >= $f['de'] && $n['emissao'] <= $f['ate']));
        $total = count($notas);

        $linhas = [];
        foreach (BlingSituacoes::listar('nota') as $s) {
            $desta = array_values(array_filter($notas, static fn($n) => $n['situacao'] === $s['chave']));
            $linhas[] = [
                'id'          => $s['chave'],
                'situacao'    => $s['chave'],
                'situacao_info' => $s,
                'rotulo'      => $s['rotulo'],
                'quantidade'  => count($desta),
                'participacao'=> $total > 0 ? round((count($desta) / $total) * 100, 1) : 0.0,
                'valor'       => round(array_sum(array_column($desta, 'valor')), 2),
                'tentativas_media' => count($desta) > 0
                    ? round(array_sum(array_column($desta, 'tentativas')) / count($desta), 2) : 0.0,
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['rotulo'],
            'totalizar' => ['quantidade', 'valor'],
            'colunas' => [
                self::col('rotulo', 'Situação'),
                self::col('quantidade', 'Notas', 'inteiro'),
                self::col('participacao', 'Participação', 'percentual'),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('tentativas_media', 'Tentativas (média)', 'numero'),
            ],
        ];
    }

    private static function tributacoes(BlingProviderBase $p, array $f): array
    {
        $categorias = self::indexar($p->colecao('categorias'));
        $porNcm = [];
        foreach ($p->colecao('produtos') as $prod) {
            $ncm = $prod['ncm'] ?? '(sem NCM)';
            if (!isset($porNcm[$ncm])) {
                $porNcm[$ncm] = [
                    'id' => $ncm, 'ncm' => $ncm, 'produtos' => 0, 'receita' => 0.0,
                    'categorias' => [], 'sem_ncm' => $prod['ncm'] === null,
                ];
            }
            $porNcm[$ncm]['produtos']++;
            $porNcm[$ncm]['receita'] += $prod['receita'];
            $cat = $categorias[$prod['categoria']]['nome'] ?? '—';
            if (!in_array($cat, $porNcm[$ncm]['categorias'], true)) {
                $porNcm[$ncm]['categorias'][] = $cat;
            }
        }

        $linhas = array_values($porNcm);
        foreach ($linhas as &$l) {
            $l['receita'] = round($l['receita'], 2);
            $l['categorias'] = implode(', ', $l['categorias']);
            // Aliquotas exibidas como ESTIMATIVA (§26.2) - nao ha tabela fiscal real aqui.
            $l['icms_estimado'] = 18.0;
            $l['pis_estimado']  = 1.65;
            $l['cofins_estimado'] = 7.6;
            $l['carga_estimada'] = 27.25;
        }
        unset($l);
        usort($linhas, static fn($a, $b) => $b['receita'] <=> $a['receita']);

        return [
            'linhas' => $linhas,
            'busca'  => ['ncm', 'categorias'],
            'totalizar' => ['produtos', 'receita'],
            'colunas' => [
                self::col('ncm', 'NCM'),
                self::col('produtos', 'Produtos', 'inteiro'),
                self::col('categorias', 'Categorias', 'texto', ['largura' => 300]),
                self::col('receita', 'Receita', 'moeda', ['destaque' => true]),
                self::col('icms_estimado', 'ICMS est.', 'percentual'),
                self::col('pis_estimado', 'PIS est.', 'percentual'),
                self::col('cofins_estimado', 'COFINS est.', 'percentual'),
                self::col('carga_estimada', 'Carga est.', 'percentual',
                    ['tooltip' => 'Estimativa. Não substitui apuração contábil.']),
                self::col('sem_ncm', 'Sem NCM', 'booleano', ['semaforo' => true]),
            ],
        ];
    }

    private static function documentos(BlingProviderBase $p, array $f): array
    {
        $clientes = self::indexar($p->colecao('clientes'));
        $linhas = [];
        foreach ($p->colecao('notas') as $n) {
            if ($n['emissao'] < $f['de'] || $n['emissao'] > $f['ate']) {
                continue;
            }
            if (!$n['danfe'] && !$n['xml']) {
                continue;
            }
            $linhas[] = [
                'id'       => 'doc-' . $n['id'],
                'tipo'     => 'NF-e',
                'numero'   => $n['numero'],
                'chave'    => $n['chave'],
                'cliente'  => $clientes[$n['cliente']]['nome'] ?? '—',
                'emissao'  => $n['emissao'],
                'valor'    => $n['valor'],
                'danfe'    => $n['danfe'],
                'xml'      => $n['xml'],
                'situacao' => $n['situacao'],
                'situacao_info' => BlingSituacoes::descrever('nota', $n['situacao']),
            ];
        }
        usort($linhas, static fn($a, $b) => strcmp($b['emissao'], $a['emissao']));

        return [
            'linhas' => $linhas,
            'busca'  => ['numero', 'chave', 'cliente'],
            'totalizar' => ['valor'],
            'facetas' => ['tipo' => self::facetar($linhas, 'tipo')],
            'colunas' => [
                self::col('tipo', 'Tipo'),
                self::col('numero', 'Número'),
                self::col('chave', 'Chave', 'texto', ['largura' => 300, 'monoespacada' => true]),
                self::col('cliente', 'Cliente', 'texto', ['largura' => 240]),
                self::col('emissao', 'Emissão', 'data'),
                self::col('valor', 'Valor', 'moeda'),
                self::col('danfe', 'DANFE', 'link'),
                self::col('xml', 'XML', 'link'),
                self::col('situacao', 'Situação', 'badge'),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // FINANCEIRO
    // ─────────────────────────────────────────────────────────────

    private static function receber(BlingProviderBase $p, array $f): array
    {
        $clientes = self::indexar($p->colecao('clientes'));
        $pedidos = self::indexar($p->colecao('pedidos'));
        $formas = self::indexar($p->colecao('formas_pagamento'));
        $cats = self::indexar($p->colecao('categorias_financeiras'));

        $linhas = [];
        foreach ($p->colecao('receber') as $r) {
            if ($r['vencimento'] < $f['de'] || $r['vencimento'] > $f['ate']) {
                continue;
            }
            if ($f['situacao'] !== '' && $r['situacao'] !== $f['situacao']) {
                continue;
            }
            $linhas[] = [
                'id'        => $r['id'],
                'titulo'    => $r['titulo'],
                'cliente'   => $clientes[$r['cliente']]['nome'] ?? '—',
                'cliente_id'=> $r['cliente'],
                'pedido'    => $pedidos[$r['pedido']]['numero'] ?? '—',
                'emissao'   => $r['emissao'],
                'vencimento'=> $r['vencimento'],
                'parcela'   => $r['parcela'],
                'valor'     => $r['valor'],
                'recebido'  => $r['recebido'],
                'saldo'     => $r['saldo'],
                'situacao'  => $r['situacao'],
                'situacao_info' => BlingSituacoes::descrever('titulo', $r['situacao']),
                'forma'     => $formas[$r['forma']]['nome'] ?? '—',
                'categoria' => $cats[$r['categoria']]['nome'] ?? '—',
                'conta'     => $r['conta'],
                'atraso_dias' => $r['atraso_dias'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['titulo', 'cliente', 'pedido'],
            'totalizar' => ['valor', 'recebido', 'saldo'],
            'facetas' => [
                'situacao' => self::facetar($linhas, 'situacao'),
                'forma'    => self::facetar($linhas, 'forma'),
            ],
            'colunas' => [
                self::col('titulo', 'Título'),
                self::col('cliente', 'Cliente', 'texto', ['largura' => 240]),
                self::col('pedido', 'Pedido'),
                self::col('parcela', 'Parcela'),
                self::col('vencimento', 'Vencimento', 'data'),
                self::col('valor', 'Valor', 'moeda'),
                self::col('recebido', 'Recebido', 'moeda'),
                self::col('saldo', 'Saldo', 'moeda', ['destaque' => true]),
                self::col('situacao', 'Situação', 'badge'),
                self::col('forma', 'Forma'),
                self::col('categoria', 'Categoria'),
                self::col('atraso_dias', 'Atraso', 'inteiro', ['semaforo' => true]),
            ],
        ];
    }

    private static function pagar(BlingProviderBase $p, array $f): array
    {
        $forn = self::indexar($p->colecao('fornecedores'));
        $cats = self::indexar($p->colecao('categorias_financeiras'));
        $compras = self::indexar($p->colecao('compras'));

        $linhas = [];
        foreach ($p->colecao('pagar') as $t) {
            if ($t['vencimento'] < $f['de'] || $t['vencimento'] > $f['ate']) {
                continue;
            }
            if ($f['situacao'] !== '' && $t['situacao'] !== $f['situacao']) {
                continue;
            }
            $linhas[] = [
                'id'         => $t['id'],
                'titulo'     => $t['titulo'],
                'fornecedor' => $t['fornecedor'] !== null
                    ? ($forn[$t['fornecedor']]['nome'] ?? '—')
                    : ($t['descricao'] ?? '—'),
                'compra'     => $t['compra'] !== null ? ($compras[$t['compra']]['numero'] ?? '—') : null,
                'vencimento' => $t['vencimento'],
                'competencia'=> $t['competencia'],
                'valor'      => $t['valor'],
                'pago'       => $t['pago'],
                'saldo'      => $t['saldo'],
                'categoria'  => $cats[$t['categoria']]['nome'] ?? '—',
                'conta'      => $t['conta'],
                'situacao'   => $t['situacao'],
                'situacao_info' => BlingSituacoes::descrever('titulo', $t['situacao']),
                'recorrente' => $t['recorrente'],
                'atraso_dias'=> $t['atraso_dias'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['titulo', 'fornecedor', 'categoria'],
            'totalizar' => ['valor', 'pago', 'saldo'],
            'facetas' => [
                'situacao'  => self::facetar($linhas, 'situacao'),
                'categoria' => self::facetar($linhas, 'categoria'),
            ],
            'colunas' => [
                self::col('titulo', 'Título'),
                self::col('fornecedor', 'Fornecedor / Descrição', 'texto', ['largura' => 260]),
                self::col('compra', 'Pedido de compra'),
                self::col('vencimento', 'Vencimento', 'data'),
                self::col('competencia', 'Competência'),
                self::col('valor', 'Valor', 'moeda'),
                self::col('pago', 'Pago', 'moeda'),
                self::col('saldo', 'Saldo', 'moeda', ['destaque' => true]),
                self::col('categoria', 'Categoria'),
                self::col('situacao', 'Situação', 'badge'),
                self::col('recorrente', 'Recorrente', 'booleano'),
                self::col('atraso_dias', 'Atraso', 'inteiro', ['semaforo' => true]),
            ],
        ];
    }

    /** Conciliacao (§36): compara pedido x nota x titulo e classifica a divergencia. */
    private static function conciliacao(BlingProviderBase $p, array $f): array
    {
        $notas = [];
        foreach ($p->colecao('notas') as $n) {
            $notas[$n['pedido']] = $n;
        }
        $titulos = [];
        foreach ($p->colecao('receber') as $r) {
            if ($r['pedido'] !== null) {
                $titulos[$r['pedido']][] = $r;
            }
        }
        $clientes = self::indexar($p->colecao('clientes'));
        $canais = self::indexar($p->colecao('canais'));

        $linhas = [];
        foreach ($p->colecao('pedidos') as $ped) {
            if ($ped['data'] < $f['de'] || $ped['data'] > $f['ate']) {
                continue;
            }
            if (in_array($ped['situacao'], ['rascunho', 'cancelado'], true)) {
                continue;
            }

            $nf = $notas[$ped['id']] ?? null;
            $tits = $titulos[$ped['id']] ?? [];
            $valorTitulos = array_sum(array_column($tits, 'valor'));
            $recebido = array_sum(array_column($tits, 'recebido'));

            $deltaNota = $nf !== null ? round($nf['valor'] - $ped['total'], 2) : null;
            $deltaTitulo = count($tits) > 0 ? round($valorTitulos - $ped['total'], 2) : null;

            $status = match (true) {
                $nf === null && count($tits) === 0                   => 'nao_encontrado',
                $nf !== null && $nf['situacao'] === 'rejeitada'      => 'erro',
                count($tits) === 0                                  => 'pendente',
                abs($deltaTitulo ?? 0) > 0.05 || abs($deltaNota ?? 0) > 0.05 => 'divergente',
                $recebido > 0 && $recebido < $valorTitulos          => 'parcial',
                $recebido >= $valorTitulos && $valorTitulos > 0     => 'conciliado',
                default                                             => 'pendente',
            };

            $linhas[] = [
                'id'        => 'conc-' . $ped['id'],
                'pedido'    => $ped['numero'],
                'pedido_id' => $ped['id'],
                'data'      => $ped['data'],
                'cliente'   => $clientes[$ped['cliente']]['nome'] ?? '—',
                'canal'     => $canais[$ped['canal']]['nome'] ?? $ped['canal'],
                'valor_pedido' => $ped['total'],
                'nota'      => $nf['numero'] ?? null,
                'valor_nota'=> $nf['valor'] ?? null,
                'delta_nota'=> $deltaNota,
                'titulos'   => count($tits),
                'valor_titulos' => round($valorTitulos, 2),
                'delta_titulo'  => $deltaTitulo,
                'recebido'  => round($recebido, 2),
                'status'    => $status,
                'status_info' => self::statusConciliacao($status),
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['pedido', 'cliente', 'nota'],
            'totalizar' => ['valor_pedido', 'valor_nota', 'valor_titulos', 'recebido'],
            'facetas' => [
                'status' => self::facetar($linhas, 'status'),
                'canal'  => self::facetar($linhas, 'canal'),
            ],
            'colunas' => [
                self::col('status', 'Status', 'badge'),
                self::col('pedido', 'Pedido'),
                self::col('data', 'Data', 'data'),
                self::col('cliente', 'Cliente', 'texto', ['largura' => 240]),
                self::col('canal', 'Canal'),
                self::col('valor_pedido', 'Valor pedido', 'moeda'),
                self::col('nota', 'Nota'),
                self::col('valor_nota', 'Valor nota', 'moeda'),
                self::col('delta_nota', 'Δ nota', 'moeda', ['semaforo' => true]),
                self::col('titulos', 'Títulos', 'inteiro'),
                self::col('valor_titulos', 'Valor títulos', 'moeda'),
                self::col('delta_titulo', 'Δ título', 'moeda', ['semaforo' => true]),
                self::col('recebido', 'Recebido', 'moeda'),
            ],
        ];
    }

    private static function statusConciliacao(string $s): array
    {
        return match ($s) {
            'conciliado'     => ['chave' => $s, 'rotulo' => 'Conciliado',     'cor' => 'sucesso'],
            'divergente'     => ['chave' => $s, 'rotulo' => 'Divergente',     'cor' => 'erro'],
            'parcial'        => ['chave' => $s, 'rotulo' => 'Parcial',        'cor' => 'aviso'],
            'duplicado'      => ['chave' => $s, 'rotulo' => 'Duplicado',      'cor' => 'erro'],
            'nao_encontrado' => ['chave' => $s, 'rotulo' => 'Não encontrado', 'cor' => 'neutro'],
            'erro'           => ['chave' => $s, 'rotulo' => 'Erro',           'cor' => 'erro'],
            default          => ['chave' => $s, 'rotulo' => 'Pendente',       'cor' => 'aviso'],
        };
    }

    private static function categoriasFinanceiras(BlingProviderBase $p, array $f): array
    {
        $receber = $p->colecao('receber');
        $pagar = $p->colecao('pagar');

        $linhas = [];
        foreach ($p->colecao('categorias_financeiras') as $c) {
            $mov = $c['tipo'] === 'receita'
                ? array_values(array_filter($receber, static fn($r) => $r['categoria'] === $c['id']
                    && $r['vencimento'] >= $f['de'] && $r['vencimento'] <= $f['ate']))
                : array_values(array_filter($pagar, static fn($t) => $t['categoria'] === $c['id']
                    && $t['vencimento'] >= $f['de'] && $t['vencimento'] <= $f['ate']));

            $liquidado = $c['tipo'] === 'receita'
                ? array_sum(array_column($mov, 'recebido'))
                : array_sum(array_column($mov, 'pago'));

            $linhas[] = [
                'id'        => $c['id'],
                'nome'      => $c['nome'],
                'tipo'      => $c['tipo'],
                'tipo_info' => [
                    'chave' => $c['tipo'], 'rotulo' => ucfirst($c['tipo']),
                    'cor'   => $c['tipo'] === 'receita' ? 'sucesso' : 'erro',
                ],
                'lancamentos' => count($mov),
                'valor'     => round(array_sum(array_column($mov, 'valor')), 2),
                'liquidado' => round($liquidado, 2),
                'saldo'     => round(array_sum(array_column($mov, 'saldo')), 2),
            ];
        }
        usort($linhas, static fn($a, $b) => $b['valor'] <=> $a['valor']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome', 'tipo'],
            'totalizar' => ['lancamentos', 'valor', 'liquidado', 'saldo'],
            'facetas' => ['tipo' => self::facetar($linhas, 'tipo')],
            'colunas' => [
                self::col('nome', 'Categoria'),
                self::col('tipo', 'Tipo', 'badge'),
                self::col('lancamentos', 'Lançamentos', 'inteiro'),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('liquidado', 'Liquidado', 'moeda'),
                self::col('saldo', 'Saldo', 'moeda'),
            ],
        ];
    }

    private static function formasPagamento(BlingProviderBase $p, array $f): array
    {
        $receber = $p->colecao('receber');
        $linhas = [];
        foreach ($p->colecao('formas_pagamento') as $fp) {
            $meus = array_values(array_filter($receber, static fn($r) => $r['forma'] === $fp['id']
                && $r['vencimento'] >= $f['de'] && $r['vencimento'] <= $f['ate']));
            $valor = array_sum(array_column($meus, 'valor'));
            $vencidos = count(array_filter($meus, static fn($r) => $r['situacao'] === 'vencido'));

            $linhas[] = [
                'id'         => $fp['id'],
                'nome'       => $fp['nome'],
                'prazo_dias' => $fp['prazo_dias'],
                'taxa_pct'   => $fp['taxa_pct'],
                'titulos'    => count($meus),
                'valor'      => round($valor, 2),
                'custo_taxa' => round($valor * $fp['taxa_pct'] / 100, 2),
                'recebido'   => round(array_sum(array_column($meus, 'recebido')), 2),
                'vencidos'   => $vencidos,
                'inadimplencia_pct' => count($meus) > 0 ? round(($vencidos / count($meus)) * 100, 1) : 0.0,
            ];
        }
        usort($linhas, static fn($a, $b) => $b['valor'] <=> $a['valor']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome'],
            'totalizar' => ['titulos', 'valor', 'custo_taxa', 'recebido', 'vencidos'],
            'colunas' => [
                self::col('nome', 'Forma de pagamento'),
                self::col('prazo_dias', 'Prazo (dias)', 'inteiro'),
                self::col('taxa_pct', 'Taxa', 'percentual'),
                self::col('titulos', 'Títulos', 'inteiro'),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('custo_taxa', 'Custo da taxa', 'moeda'),
                self::col('recebido', 'Recebido', 'moeda'),
                self::col('vencidos', 'Vencidos', 'inteiro'),
                self::col('inadimplencia_pct', 'Inadimplência', 'percentual', ['semaforo' => true]),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // LOGISTICA
    // ─────────────────────────────────────────────────────────────

    private static function envios(BlingProviderBase $p, array $f): array
    {
        $clientes = self::indexar($p->colecao('clientes'));
        $transp = self::indexar($p->colecao('transportadoras'));
        $pedidos = self::indexar($p->colecao('pedidos'));

        $linhas = [];
        foreach ($p->colecao('envios') as $e) {
            if ($e['despacho'] < $f['de'] || $e['despacho'] > $f['ate']) {
                continue;
            }
            if ($f['situacao'] !== '' && $e['situacao'] !== $f['situacao']) {
                continue;
            }
            $atraso = $e['entrega'] !== null
                ? (int) ((strtotime($e['entrega']) - strtotime($e['previsao'])) / 86400)
                : ($e['previsao'] < date('Y-m-d')
                    ? (int) ((strtotime(date('Y-m-d')) - strtotime($e['previsao'])) / 86400) : 0);

            $linhas[] = [
                'id'         => $e['id'],
                'pedido'     => $pedidos[$e['pedido']]['numero'] ?? '—',
                'pedido_id'  => $e['pedido'],
                'cliente'    => $clientes[$e['cliente']]['nome'] ?? '—',
                'transportadora' => $transp[$e['transportadora']]['nome'] ?? '—',
                'servico'    => $e['servico'],
                'rastreamento' => $e['rastreamento'],
                'despacho'   => $e['despacho'],
                'previsao'   => $e['previsao'],
                'entrega'    => $e['entrega'],
                'atraso_dias'=> $atraso,
                'uf'         => $e['uf'],
                'custo'      => $e['custo'],
                'situacao'   => $e['situacao'],
                'situacao_info' => BlingSituacoes::descrever('envio', $e['situacao']),
                'ocorrencia' => $e['ocorrencia'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['pedido', 'cliente', 'rastreamento', 'transportadora'],
            'totalizar' => ['custo'],
            'facetas' => [
                'situacao'       => self::facetar($linhas, 'situacao'),
                'transportadora' => self::facetar($linhas, 'transportadora'),
                'uf'             => self::facetar($linhas, 'uf'),
            ],
            'colunas' => [
                self::col('pedido', 'Pedido'),
                self::col('cliente', 'Cliente', 'texto', ['largura' => 220]),
                self::col('transportadora', 'Transportadora'),
                self::col('servico', 'Serviço'),
                self::col('rastreamento', 'Rastreamento', 'texto', ['monoespacada' => true]),
                self::col('despacho', 'Despacho', 'data'),
                self::col('previsao', 'Previsão', 'data'),
                self::col('entrega', 'Entrega', 'data'),
                self::col('atraso_dias', 'Atraso', 'inteiro', ['semaforo' => true]),
                self::col('uf', 'UF'),
                self::col('custo', 'Custo', 'moeda'),
                self::col('situacao', 'Situação', 'badge'),
                self::col('ocorrencia', 'Ocorrência', 'texto', ['largura' => 220]),
            ],
        ];
    }

    private static function transportadoras(BlingProviderBase $p, array $f): array
    {
        $envios = array_values(array_filter($p->colecao('envios'), static fn($e) =>
            $e['despacho'] >= $f['de'] && $e['despacho'] <= $f['ate']));

        $linhas = [];
        foreach ($p->colecao('transportadoras') as $t) {
            $meus = array_values(array_filter($envios, static fn($e) => $e['transportadora'] === $t['id']));
            $entregues = array_values(array_filter($meus, static fn($e) => $e['entrega'] !== null));

            $atrasos = [];
            foreach ($entregues as $e) {
                $atrasos[] = (int) ((strtotime($e['entrega']) - strtotime($e['previsao'])) / 86400);
            }
            $noPrazo = count(array_filter($atrasos, static fn($a) => $a <= 0));

            $linhas[] = [
                'id'         => $t['id'],
                'nome'       => $t['nome'],
                'envios'     => count($meus),
                'entregues'  => count($entregues),
                'prazo_prometido' => $t['prazo_medio'],
                'prazo_realizado' => count($entregues) > 0
                    ? round(array_sum(array_map(static fn($e) =>
                        (strtotime($e['entrega']) - strtotime($e['despacho'])) / 86400, $entregues)) / count($entregues), 1)
                    : null,
                'atraso_medio' => count($atrasos) > 0 ? round(array_sum($atrasos) / count($atrasos), 1) : 0.0,
                'no_prazo_pct' => count($atrasos) > 0 ? round(($noPrazo / count($atrasos)) * 100, 1) : 0.0,
                'atrasados'  => count(array_filter($meus, static fn($e) => $e['situacao'] === 'atrasado')),
                'devolvidos' => count(array_filter($meus, static fn($e) => $e['situacao'] === 'devolvido')),
                'ocorrencias'=> count(array_filter($meus, static fn($e) => $e['ocorrencia'] !== null)),
                'custo_total'=> round(array_sum(array_column($meus, 'custo')), 2),
                'custo_medio'=> count($meus) > 0 ? round(array_sum(array_column($meus, 'custo')) / count($meus), 2) : 0.0,
            ];
        }
        usort($linhas, static fn($a, $b) => $b['envios'] <=> $a['envios']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome'],
            'totalizar' => ['envios', 'entregues', 'atrasados', 'devolvidos', 'ocorrencias', 'custo_total'],
            'colunas' => [
                self::col('nome', 'Transportadora'),
                self::col('envios', 'Envios', 'inteiro'),
                self::col('entregues', 'Entregues', 'inteiro'),
                self::col('prazo_prometido', 'Prazo prometido', 'inteiro'),
                self::col('prazo_realizado', 'Prazo realizado', 'numero'),
                self::col('atraso_medio', 'Atraso médio', 'numero', ['semaforo' => true]),
                self::col('no_prazo_pct', 'No prazo', 'percentual'),
                self::col('atrasados', 'Atrasados', 'inteiro'),
                self::col('devolvidos', 'Devolvidos', 'inteiro'),
                self::col('ocorrencias', 'Ocorrências', 'inteiro'),
                self::col('custo_total', 'Custo total', 'moeda', ['destaque' => true]),
                self::col('custo_medio', 'Custo médio', 'moeda'),
            ],
        ];
    }

    private static function rastreamento(BlingProviderBase $p, array $f): array
    {
        // Rastreamento = envios ainda em curso. A tela de Envios mostra o historico.
        $base = self::envios($p, $f);
        $emCurso = ['despachado', 'em_transito', 'atrasado', 'separado', 'aguardando_separacao'];
        $base['linhas'] = array_values(array_filter($base['linhas'], static fn($l) =>
            in_array($l['situacao'], $emCurso, true)));
        $base['facetas'] = [
            'situacao'       => self::facetar($base['linhas'], 'situacao'),
            'transportadora' => self::facetar($base['linhas'], 'transportadora'),
        ];
        return $base;
    }

    private static function expedicao(BlingProviderBase $p, array $f): array
    {
        $base = self::envios($p, $f);
        $aExpedir = ['aguardando_separacao', 'separado'];
        $base['linhas'] = array_values(array_filter($base['linhas'], static fn($l) =>
            in_array($l['situacao'], $aExpedir, true)));
        $base['facetas'] = ['situacao' => self::facetar($base['linhas'], 'situacao')];
        return $base;
    }

    private static function ocorrencias(BlingProviderBase $p, array $f): array
    {
        $base = self::envios($p, $f);
        $base['linhas'] = array_values(array_filter($base['linhas'], static fn($l) =>
            $l['ocorrencia'] !== null || $l['situacao'] === 'atrasado' || $l['situacao'] === 'devolvido'));
        $base['facetas'] = [
            'ocorrencia'     => self::facetar($base['linhas'], 'ocorrencia'),
            'transportadora' => self::facetar($base['linhas'], 'transportadora'),
        ];
        return $base;
    }

    // ─────────────────────────────────────────────────────────────
    // RELACIONAMENTO
    // ─────────────────────────────────────────────────────────────

    private static function clientes(BlingProviderBase $p, array $f): array
    {
        $pedidos = $p->colecao('pedidos');
        $receber = $p->colecao('receber');
        $hoje = date('Y-m-d');

        $porCliente = [];
        foreach ($pedidos as $ped) {
            if (in_array($ped['situacao'], ['rascunho', 'cancelado'], true)) {
                continue;
            }
            $c = $ped['cliente'];
            if (!isset($porCliente[$c])) {
                $porCliente[$c] = ['pedidos' => 0, 'receita' => 0.0, 'ultima' => null, 'primeira' => null];
            }
            $porCliente[$c]['pedidos']++;
            $porCliente[$c]['receita'] += $ped['total'];
            if ($porCliente[$c]['ultima'] === null || $ped['data'] > $porCliente[$c]['ultima']) {
                $porCliente[$c]['ultima'] = $ped['data'];
            }
            if ($porCliente[$c]['primeira'] === null || $ped['data'] < $porCliente[$c]['primeira']) {
                $porCliente[$c]['primeira'] = $ped['data'];
            }
        }

        $vencidoPorCliente = [];
        foreach ($receber as $r) {
            if ($r['situacao'] === 'vencido') {
                $vencidoPorCliente[$r['cliente']] = ($vencidoPorCliente[$r['cliente']] ?? 0) + $r['saldo'];
            }
        }

        $linhas = [];
        foreach ($p->colecao('clientes') as $c) {
            $d = $porCliente[$c['id']] ?? ['pedidos' => 0, 'receita' => 0.0, 'ultima' => null, 'primeira' => null];
            $diasSemComprar = $d['ultima'] !== null
                ? (int) ((strtotime($hoje) - strtotime($d['ultima'])) / 86400) : null;

            $classe = match (true) {
                $d['pedidos'] === 0                              => 'sem_compra',
                $diasSemComprar !== null && $diasSemComprar > 180 => 'inativo',
                $d['pedidos'] >= 4                               => 'recorrente',
                $d['primeira'] !== null && $d['primeira'] >= date('Y-m-d', strtotime('-90 days')) => 'novo',
                default                                          => 'ativo',
            };

            $linhas[] = [
                'id'        => $c['id'],
                'bling_id'  => $c['bling_id'],
                'nome'      => $c['nome'],
                'tipo'      => $c['tipo'],
                'documento' => $c['documento_mascarado'],
                'uf'        => $c['uf'],
                'pedidos'   => $d['pedidos'],
                'faturamento' => round($d['receita'], 2),
                'ticket_medio' => $d['pedidos'] > 0 ? round($d['receita'] / $d['pedidos'], 2) : 0.0,
                'primeira_compra' => $d['primeira'],
                'ultima_compra'   => $d['ultima'],
                'dias_sem_comprar'=> $diasSemComprar,
                'contas_vencidas' => round($vencidoPorCliente[$c['id']] ?? 0, 2),
                'cadastro_completo' => $c['cadastro_completo'],
                'classe'    => $classe,
                'classe_info' => self::classeCliente($classe),
            ];
        }
        usort($linhas, static fn($a, $b) => $b['faturamento'] <=> $a['faturamento']);

        return [
            'linhas' => $linhas,
            'busca'  => ['nome', 'documento', 'uf', 'bling_id'],
            'totalizar' => ['pedidos', 'faturamento', 'contas_vencidas'],
            'facetas' => [
                'classe' => self::facetar($linhas, 'classe'),
                'uf'     => self::facetar($linhas, 'uf'),
                'tipo'   => self::facetar($linhas, 'tipo'),
            ],
            'colunas' => [
                self::col('nome', 'Cliente', 'texto', ['largura' => 260]),
                self::col('tipo', 'Tipo'),
                self::col('documento', 'Documento', 'texto', ['mascarado' => true]),
                self::col('uf', 'UF'),
                self::col('classe', 'Classificação', 'badge'),
                self::col('pedidos', 'Pedidos', 'inteiro'),
                self::col('faturamento', 'Faturamento', 'moeda', ['destaque' => true]),
                self::col('ticket_medio', 'Ticket médio', 'moeda'),
                self::col('primeira_compra', 'Primeira compra', 'data'),
                self::col('ultima_compra', 'Última compra', 'data'),
                self::col('dias_sem_comprar', 'Dias sem comprar', 'inteiro'),
                self::col('contas_vencidas', 'Contas vencidas', 'moeda', ['semaforo' => true]),
            ],
        ];
    }

    private static function classeCliente(string $c): array
    {
        return match ($c) {
            'recorrente' => ['chave' => $c, 'rotulo' => 'Recorrente', 'cor' => 'sucesso'],
            'novo'       => ['chave' => $c, 'rotulo' => 'Novo',       'cor' => 'info'],
            'ativo'      => ['chave' => $c, 'rotulo' => 'Ativo',      'cor' => 'info'],
            'inativo'    => ['chave' => $c, 'rotulo' => 'Inativo',    'cor' => 'aviso'],
            default      => ['chave' => $c, 'rotulo' => 'Sem compra', 'cor' => 'neutro'],
        };
    }

    private static function contatos(BlingProviderBase $p, array $f): array
    {
        $linhas = [];
        foreach ($p->colecao('clientes') as $c) {
            $primeiro = explode(' ', $c['nome'])[0];
            $linhas[] = [
                'id'       => 'cont-' . $c['id'],
                'nome'     => $c['nome'],
                'vinculo'  => 'Cliente',
                'tipo'     => $c['tipo'],
                'documento'=> $c['documento_mascarado'],
                // Contato mascarado por padrao (§62). O valor real exige permissao.
                'email'    => mb_strtolower($primeiro) . '@***',
                'telefone' => '(**) ****-' . substr((string) $c['bling_id'], -4),
                'uf'       => $c['uf'],
                'cadastro_completo' => $c['cadastro_completo'],
                'ativo'    => $c['ativo'],
            ];
        }
        foreach ($p->colecao('fornecedores') as $fo) {
            $linhas[] = [
                'id'       => 'cont-' . $fo['id'],
                'nome'     => $fo['nome'],
                'vinculo'  => 'Fornecedor',
                'tipo'     => 'juridica',
                'documento'=> $fo['cnpj_mascarado'],
                'email'    => 'contato@***',
                'telefone' => '(**) ****-' . substr((string) $fo['bling_id'], -4),
                'uf'       => $fo['uf'],
                'cadastro_completo' => $fo['cadastro_completo'],
                'ativo'    => $fo['ativo'],
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['nome', 'documento', 'uf'],
            'totalizar' => [],
            'facetas' => [
                'vinculo' => self::facetar($linhas, 'vinculo'),
                'uf'      => self::facetar($linhas, 'uf'),
            ],
            'colunas' => [
                self::col('nome', 'Nome', 'texto', ['largura' => 260]),
                self::col('vinculo', 'Vínculo', 'badge'),
                self::col('tipo', 'Tipo'),
                self::col('documento', 'Documento', 'texto', ['mascarado' => true]),
                self::col('email', 'E-mail', 'texto', ['mascarado' => true]),
                self::col('telefone', 'Telefone', 'texto', ['mascarado' => true]),
                self::col('uf', 'UF'),
                self::col('cadastro_completo', 'Cadastro completo', 'booleano'),
                self::col('ativo', 'Ativo', 'booleano'),
            ],
        ];
    }

    private static function historicoComercial(BlingProviderBase $p, array $f): array
    {
        $clientes = self::indexar($p->colecao('clientes'));
        $canais = self::indexar($p->colecao('canais'));
        $vend = self::indexar($p->colecao('vendedores'));
        $notas = [];
        foreach ($p->colecao('notas') as $n) {
            $notas[$n['pedido']] = $n;
        }

        $linhas = [];
        foreach ($p->colecao('pedidos') as $ped) {
            if ($ped['data'] < $f['de'] || $ped['data'] > $f['ate']) {
                continue;
            }
            $linhas[] = [
                'id'       => 'hist-' . $ped['id'],
                'data'     => $ped['data'],
                'cliente'  => $clientes[$ped['cliente']]['nome'] ?? '—',
                'evento'   => 'Pedido ' . $ped['numero'],
                'situacao' => $ped['situacao'],
                'situacao_info' => BlingSituacoes::descrever('pedido', $ped['situacao']),
                'canal'    => $canais[$ped['canal']]['nome'] ?? $ped['canal'],
                'vendedor' => $vend[$ped['vendedor']]['nome'] ?? '—',
                'itens'    => $ped['qtd_itens'],
                'valor'    => $ped['total'],
                'nota'     => $notas[$ped['id']]['numero'] ?? null,
            ];
        }
        usort($linhas, static fn($a, $b) => strcmp($b['data'], $a['data']));

        return [
            'linhas' => $linhas,
            'busca'  => ['cliente', 'evento', 'vendedor'],
            'totalizar' => ['itens', 'valor'],
            'facetas' => ['canal' => self::facetar($linhas, 'canal')],
            'colunas' => [
                self::col('data', 'Data', 'data'),
                self::col('cliente', 'Cliente', 'texto', ['largura' => 240]),
                self::col('evento', 'Evento'),
                self::col('situacao', 'Situação', 'badge'),
                self::col('canal', 'Canal'),
                self::col('vendedor', 'Vendedor'),
                self::col('itens', 'Itens', 'inteiro'),
                self::col('valor', 'Valor', 'moeda', ['destaque' => true]),
                self::col('nota', 'Nota'),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // ADMINISTRACAO
    // ─────────────────────────────────────────────────────────────

    private static function alertas(BlingProviderBase $p, array $f): array
    {
        $linhas = [];
        foreach ($p->atencao() as $i => $o) {
            $linhas[] = [
                'id'         => $o['id'],
                'severidade' => $o['severidade'],
                'severidade_info' => [
                    'chave' => $o['severidade'],
                    'rotulo'=> ucfirst($o['severidade']),
                    'cor'   => match ($o['severidade']) {
                        'critica' => 'erro', 'alta' => 'aviso',
                        'media'   => 'info', default => 'neutro',
                    },
                ],
                'modulo'     => $o['modulo'],
                'descricao'  => $o['descricao'],
                'quantidade' => $o['quantidade'],
                'valor_impactado' => $o['valor_impactado'],
                'acao_recomendada'=> $o['acao_recomendada'],
                'tela'       => $o['tela'],
                'ordem'      => $i,
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['descricao', 'modulo', 'acao_recomendada'],
            'totalizar' => ['quantidade', 'valor_impactado'],
            'facetas' => [
                'severidade' => self::facetar($linhas, 'severidade'),
                'modulo'     => self::facetar($linhas, 'modulo'),
            ],
            'colunas' => [
                self::col('severidade', 'Severidade', 'badge'),
                self::col('modulo', 'Módulo'),
                self::col('descricao', 'Descrição', 'texto', ['largura' => 340]),
                self::col('quantidade', 'Quantidade', 'inteiro'),
                self::col('valor_impactado', 'Valor impactado', 'moeda'),
                self::col('acao_recomendada', 'Ação recomendada', 'texto', ['largura' => 300]),
            ],
        ];
    }

    private static function webhooks(BlingProviderBase $p, array $f): array
    {
        $linhas = [];
        foreach ($p->colecao('webhooks') as $w) {
            $linhas[] = [
                'id'        => $w['id'],
                'evento'    => $w['evento'],
                'origem'    => $w['origem'],
                'recebido_em' => $w['recebido_em'],
                'situacao'  => $w['situacao'],
                'situacao_info' => self::statusWebhook($w['situacao']),
                'tentativas'=> $w['tentativas'],
                'duracao_ms'=> $w['duracao_ms'],
                'correlation_id' => $w['correlation_id'],
                'resultado' => $w['resultado'],
                // Payload nunca sai por padrao (§46 "payload protegido").
                'payload_protegido' => true,
            ];
        }

        return [
            'linhas' => $linhas,
            'busca'  => ['evento', 'correlation_id', 'resultado'],
            'totalizar' => ['tentativas'],
            'facetas' => [
                'situacao' => self::facetar($linhas, 'situacao'),
                'evento'   => self::facetar($linhas, 'evento'),
            ],
            'colunas' => [
                self::col('evento', 'Evento'),
                self::col('origem', 'Origem'),
                self::col('recebido_em', 'Recebido em', 'datahora'),
                self::col('situacao', 'Situação', 'badge'),
                self::col('tentativas', 'Tentativas', 'inteiro'),
                self::col('duracao_ms', 'Duração (ms)', 'inteiro'),
                self::col('correlation_id', 'Correlation ID', 'texto', ['monoespacada' => true]),
                self::col('resultado', 'Resultado', 'texto', ['largura' => 320]),
            ],
        ];
    }

    private static function statusWebhook(string $s): array
    {
        return match ($s) {
            'processado' => ['chave' => $s, 'rotulo' => 'Processado', 'cor' => 'sucesso'],
            'falhou'     => ['chave' => $s, 'rotulo' => 'Falhou',     'cor' => 'erro'],
            'duplicado'  => ['chave' => $s, 'rotulo' => 'Duplicado',  'cor' => 'aviso'],
            'na_fila'    => ['chave' => $s, 'rotulo' => 'Na fila',    'cor' => 'info'],
            'dlq'        => ['chave' => $s, 'rotulo' => 'Dead-letter','cor' => 'erro'],
            default      => ['chave' => $s, 'rotulo' => $s,           'cor' => 'neutro'],
        };
    }

    private static function logs(BlingProviderBase $p, array $f): array
    {
        // Log tecnico derivado dos eventos de sincronizacao e webhook - mesmos fatos,
        // visao de operacao. Nao inventa eventos que nao existem no grafo.
        $linhas = [];
        foreach ($p->colecao('sync') as $s) {
            $linhas[] = [
                'id'        => 'log-sync-' . $s['recurso'],
                'quando'    => $s['ultima_execucao'],
                'nivel'     => $s['situacao'] === 'erro' ? 'erro' : ($s['situacao'] === 'ok' ? 'info' : 'aviso'),
                'origem'    => 'sincronizacao',
                'recurso'   => $s['recurso'],
                'metodo'    => 'GET',
                'endpoint'  => '/' . $s['recurso'],
                'status'    => $s['situacao'] === 'erro' ? 500 : 200,
                'duracao_ms'=> (int) round($s['duracao_s'] * 1000),
                'tentativa' => $s['retry'] + 1,
                'limite_consumido' => $s['limite_consumido_pct'],
                'correlation_id'   => 'bl-sync-' . substr(md5($s['recurso']), 0, 12),
                'mensagem'  => sprintf('%d consultados, %d criados, %d atualizados, %d erros',
                    $s['consultados'], $s['criados'], $s['atualizados'], $s['erros']),
            ];
        }
        foreach (array_slice($p->colecao('webhooks'), 0, 120) as $w) {
            $linhas[] = [
                'id'        => 'log-wh-' . $w['id'],
                'quando'    => $w['recebido_em'],
                'nivel'     => in_array($w['situacao'], ['falhou', 'dlq'], true) ? 'erro' : 'info',
                'origem'    => 'webhook',
                'recurso'   => $w['evento'],
                'metodo'    => 'POST',
                'endpoint'  => '/webhooks',
                'status'    => in_array($w['situacao'], ['falhou', 'dlq'], true) ? 500 : 200,
                'duracao_ms'=> $w['duracao_ms'],
                'tentativa' => $w['tentativas'],
                'limite_consumido' => null,
                'correlation_id'   => $w['correlation_id'],
                'mensagem'  => $w['resultado'] ?? 'Processado com sucesso',
            ];
        }
        usort($linhas, static fn($a, $b) => strcmp($b['quando'], $a['quando']));

        return [
            'linhas' => $linhas,
            'busca'  => ['recurso', 'mensagem', 'correlation_id', 'endpoint'],
            'totalizar' => [],
            'facetas' => [
                'nivel'  => self::facetar($linhas, 'nivel'),
                'origem' => self::facetar($linhas, 'origem'),
            ],
            'colunas' => [
                self::col('quando', 'Quando', 'datahora'),
                self::col('nivel', 'Nível', 'badge'),
                self::col('origem', 'Origem'),
                self::col('recurso', 'Recurso'),
                self::col('metodo', 'Método'),
                self::col('endpoint', 'Endpoint'),
                self::col('status', 'Status', 'inteiro'),
                self::col('duracao_ms', 'Duração (ms)', 'inteiro'),
                self::col('tentativa', 'Tentativa', 'inteiro'),
                self::col('limite_consumido', 'Limite consumido', 'percentual'),
                self::col('correlation_id', 'Correlation ID', 'texto', ['monoespacada' => true]),
                self::col('mensagem', 'Mensagem', 'texto', ['largura' => 360]),
            ],
        ];
    }

    /**
     * Auditoria (§63). No mock a trilha esta VAZIA de proposito: nao houve acao
     * de usuario para registrar. Inventar trilha de auditoria seria o pior tipo
     * de dado falso - o dono precisa saber que aqui ainda nao ha nada real.
     */
    private static function auditoria(BlingProviderBase $p, array $f): array
    {
        return [
            'linhas' => [],
            'busca'  => ['usuario', 'acao', 'entidade'],
            'totalizar' => [],
            'colunas' => [
                self::col('quando', 'Quando', 'datahora'),
                self::col('usuario', 'Usuário'),
                self::col('conta', 'Conta'),
                self::col('acao', 'Ação', 'badge'),
                self::col('entidade', 'Entidade'),
                self::col('valor_anterior', 'Valor anterior'),
                self::col('valor_novo', 'Valor novo'),
                self::col('ip', 'IP'),
                self::col('origem', 'Origem'),
                self::col('resultado', 'Resultado', 'badge'),
                self::col('correlation_id', 'Correlation ID', 'texto', ['monoespacada' => true]),
            ],
        ];
    }

    private static function contas(BlingProviderBase $p, array $f): array
    {
        $linhas = [];
        foreach ($p->colecao('contas') as $c) {
            $linhas[] = array_merge($c, [
                'estado' => BlingProvider::estadoConexao(),
                'estado_info' => BlingSituacoes::descrever('conexao', BlingProvider::estadoConexao()),
            ]);
        }
        return [
            'linhas' => $linhas,
            'busca'  => ['nome', 'cnpj_mascarado', 'unidade'],
            'totalizar' => ['pendencias'],
            'colunas' => [
                self::col('nome', 'Conta'),
                self::col('cnpj_mascarado', 'CNPJ', 'texto', ['mascarado' => true]),
                self::col('unidade', 'Unidade'),
                self::col('ambiente', 'Ambiente'),
                self::col('estado', 'Estado', 'badge'),
                self::col('ultima_sync', 'Última sincronização', 'datahora'),
                self::col('pendencias', 'Pendências', 'inteiro'),
            ],
        ];
    }
}
