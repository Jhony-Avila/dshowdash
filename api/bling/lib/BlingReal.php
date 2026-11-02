<?php
// Bling / lib/BlingReal.php - provedor que le do banco BLING
// @module  bling.provider.real
// @version 1.0.0
// @created 2026-07-30
//
// ⚠️ CONTRATO CRÍTICO
// Este arquivo devolve as MESMAS estruturas que o BlingMock. Não parecidas —
// as mesmas: mesmos nomes de chave, mesmos tipos, mesmos derivados.
//
// Quem calcula é o BlingProviderBase, herdado pelos dois. Se uma chave sair com
// nome diferente aqui, o cálculo não quebra com erro: ele devolve zero, e a
// tela mostra R$ 0,00 com cara de verdade. Foi assim que mock e banco
// divergiram no Google Calendar.
//
// O smoke `bling-fase4-provider.php` compara as CHAVES dos dois provedores
// item a item, justamente para que essa divergência não passe.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingReal extends BlingProviderBase
{
    /** Coleções memoizadas por requisição — a base pede a mesma várias vezes. */
    private array $cache = [];
    private ?int $accountId = null;

    public function __construct(
        private readonly BlingRepository $repo,
    ) {}

    public function nome(): string
    {
        return 'bling';
    }

    public function ehSimulado(): bool
    {
        return false;
    }

    public function ultimaSync(): ?string
    {
        $v = $this->repo->valor(
            'SELECT MAX(ultima_execucao_em) FROM bling_sync_state WHERE account_id = ?',
            [$this->conta()]
        );
        return $v === false || $v === null ? null : gmdate('c', strtotime($v . ' UTC'));
    }

    /** Conta ativa. Sem conta conectada, o módulo não tem o que mostrar. */
    private function conta(): int
    {
        if ($this->accountId !== null) {
            return $this->accountId;
        }
        $c = $this->repo->contaPadrao();
        if ($c === null) {
            throw new RuntimeException(
                'Nenhuma conta Bling conectada. Conecte uma conta em Administração › Integrações.'
            );
        }
        return $this->accountId = (int) $c['id'];
    }

    public function colecao(string $nome): array
    {
        if (isset($this->cache[$nome])) {
            return $this->cache[$nome];
        }
        return $this->cache[$nome] = match ($nome) {
            'contas'        => $this->contas(),
            'unidades'      => $this->unidades(),
            'canais'        => $this->canais(),
            'depositos'     => $this->depositos(),
            'categorias'    => $this->categorias(),
            'transportadoras' => $this->transportadoras(),
            'vendedores'    => $this->vendedores(),
            'formas_pagamento' => $this->formasPagamento(),
            'categorias_financeiras' => $this->categoriasFinanceiras(),
            'fornecedores'  => $this->fornecedores(),
            'produtos'      => $this->produtos(),
            'estoque'       => $this->estoque(),
            'clientes'      => $this->clientes(),
            'pedidos'       => $this->pedidos(),
            'notas'         => $this->notas(),
            'envios'        => $this->envios(),
            'receber'       => $this->receber(),
            'compras'       => $this->compras(),
            'pagar'         => $this->pagar(),
            'webhooks'      => $this->webhooks(),
            'sync'          => $this->sync(),
            default         => [],
        };
    }

    // ══════════════════════════════════════════════════════════
    // CADASTROS
    // ══════════════════════════════════════════════════════════

    private function contas(): array
    {
        $saida = [];
        foreach ($this->repo->contas(true) as $c) {
            $pendencias = (int) $this->repo->valor(
                "SELECT COUNT(*) FROM bling_sync_state WHERE account_id = ? AND situacao IN ('erro','parcial')",
                [(int) $c['id']]
            );
            $saida[] = [
                'id'   => 'conta-' . $c['id'],
                'nome' => $c['nome'],
                // Documento SEMPRE mascarado na saída (§62). O valor inteiro
                // existe no banco e nunca sai por aqui.
                'cnpj_mascarado' => self::mascararDocumento($c['cnpj']),
                'unidade'  => $c['nome'],
                'ambiente' => $c['ambiente'],
                'situacao' => $c['estado_conexao'],
                'ultima_sync' => $c['ultima_sync_em'] ? gmdate('c', strtotime($c['ultima_sync_em'] . ' UTC')) : null,
                'pendencias'  => $pendencias,
                'padrao'   => (bool) $c['is_padrao'],
            ];
        }
        return $saida;
    }

    private function unidades(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, nome, uf FROM bling_business_units WHERE account_id = ? ORDER BY nome',
            [$this->conta()]
        );
        return array_map(static fn($u) => [
            'id' => 'un-' . $u['id'], 'conta' => 'conta-padrao',
            'nome' => $u['nome'], 'uf' => $u['uf'],
        ], $r);
    }

    private function canais(): array
    {
        $r = $this->repo->consultar(
            'SELECT c.id, c.nome, c.tipo, c.integrado,
                    COALESCE(SUM(p.total), 0) receita
               FROM bling_sales_channels c
               LEFT JOIN bling_sales_orders p
                 ON p.sales_channel_id = c.id AND p.situacao NOT IN (\'rascunho\',\'cancelado\')
              WHERE c.account_id = ?
              GROUP BY c.id, c.nome, c.tipo, c.integrado
              ORDER BY receita DESC',
            [$this->conta()]
        );
        $total = array_sum(array_map(static fn($x) => (float) $x['receita'], $r)) ?: 1.0;
        return array_map(static fn($c) => [
            'id' => (string) $c['id'], 'nome' => $c['nome'],
            'tipo' => $c['tipo'] ?? 'loja',
            // `peso` existe no mock como participação esperada. Aqui é a real.
            'peso' => round(((float) $c['receita']) / $total, 4),
            'integrado' => (bool) $c['integrado'],
        ], $r);
    }

    private function depositos(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, nome, business_unit_id, is_padrao FROM bling_warehouses WHERE account_id = ? ORDER BY is_padrao DESC, nome',
            [$this->conta()]
        );
        return array_map(static fn($d) => [
            'id' => (string) $d['id'], 'nome' => $d['nome'],
            'unidade' => $d['business_unit_id'] === null ? 'un-1' : 'un-' . $d['business_unit_id'],
            'padrao' => (bool) $d['is_padrao'],
        ], $r);
    }

    private function categorias(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, nome FROM bling_categories WHERE account_id = ? ORDER BY nome', [$this->conta()]
        );
        return array_map(static fn($c) => ['id' => (string) $c['id'], 'nome' => $c['nome']], $r);
    }

    /**
     * Transportadoras: derivadas dos envios.
     *
     * O Bling não expõe cadastro de transportadora como recurso próprio na v3 —
     * o nome vem no envio. Agregar aqui é o que permite a tela do §39 existir.
     */
    private function transportadoras(): array
    {
        $r = $this->repo->consultar(
            "SELECT transportadora nome,
                    AVG(DATEDIFF(data_entrega, data_despacho)) prazo,
                    SUM(data_entrega IS NOT NULL AND data_entrega <= data_previsao) no_prazo,
                    SUM(data_entrega IS NOT NULL) entregues
               FROM bling_shipments
              WHERE account_id = ? AND transportadora IS NOT NULL
              GROUP BY transportadora",
            [$this->conta()]
        );
        return array_map(static fn($t) => [
            'id' => 'tr-' . md5((string) $t['nome']),
            'nome' => $t['nome'],
            'prazo_medio' => (int) round((float) ($t['prazo'] ?? 0)),
            'confiabilidade' => (int) $t['entregues'] > 0
                ? round(((int) $t['no_prazo']) / ((int) $t['entregues']), 3) : 1.0,
        ], $r);
    }

    /** Vendedores: também derivados dos pedidos (não há recurso próprio). */
    private function vendedores(): array
    {
        $r = $this->repo->consultar(
            'SELECT vendedor nome, COUNT(*) pedidos FROM bling_sales_orders
              WHERE account_id = ? AND vendedor IS NOT NULL AND vendedor <> \'\'
              GROUP BY vendedor ORDER BY pedidos DESC',
            [$this->conta()]
        );
        return array_map(static fn($v) => [
            'id' => 'vend-' . md5((string) $v['nome']),
            'nome' => $v['nome'],
            // Comissão e meta não existem na API do Bling. Ficam em zero e a
            // tela mostra zero — inventar um percentual daria número falso na
            // coluna de comissão, que é dinheiro de gente.
            'comissao_pct' => 0.0,
            'meta_mensal'  => 0,
        ], $r);
    }

    private function formasPagamento(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, nome, prazo_dias, taxa_percentual FROM bling_payment_methods WHERE account_id = ?',
            [$this->conta()]
        );
        return array_map(static fn($f) => [
            'id' => (string) $f['id'], 'nome' => $f['nome'],
            'prazo_dias' => (int) ($f['prazo_dias'] ?? 0),
            'taxa_pct'   => (float) ($f['taxa_percentual'] ?? 0),
            'peso'       => 0.0,
        ], $r);
    }

    private function categoriasFinanceiras(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, nome, tipo FROM bling_financial_categories WHERE account_id = ? ORDER BY nome',
            [$this->conta()]
        );
        return array_map(static fn($c) => [
            'id' => (string) $c['id'], 'nome' => $c['nome'], 'tipo' => $c['tipo'],
        ], $r);
    }

    private function fornecedores(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, bling_id, nome, documento, uf, prazo_entrega_dias, cadastro_completo, is_ativo
               FROM bling_suppliers WHERE account_id = ? AND deletado_em IS NULL ORDER BY nome',
            [$this->conta()]
        );
        return array_map(static fn($f) => [
            'id' => (string) $f['id'], 'bling_id' => (int) $f['bling_id'],
            'nome' => $f['nome'],
            'cnpj_mascarado' => self::mascararDocumento($f['documento']),
            'uf' => $f['uf'] ?? '',
            'prazo_entrega_dias' => (int) ($f['prazo_entrega_dias'] ?? 0),
            'pontualidade' => 1.0,
            'cadastro_completo' => (bool) $f['cadastro_completo'],
            'ativo' => (bool) $f['is_ativo'],
        ], $r);
    }

    private function clientes(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, bling_id, nome, tipo_pessoa, documento, uf, cadastro_completo, is_ativo
               FROM bling_contacts WHERE account_id = ? AND deletado_em IS NULL AND is_cliente = 1',
            [$this->conta()]
        );
        return array_map(static fn($c) => [
            'id' => (string) $c['id'], 'bling_id' => (int) $c['bling_id'],
            'nome' => $c['nome'], 'tipo' => $c['tipo_pessoa'],
            'documento_mascarado' => self::mascararDocumento($c['documento']),
            'uf' => $c['uf'] ?? '',
            'cadastro_completo' => (bool) $c['cadastro_completo'],
            'ativo' => (bool) $c['is_ativo'],
        ], $r);
    }

    private function produtos(): array
    {
        // Derivados (receita, unidades, última venda) vêm agregados na consulta:
        // calcular em PHP sobre milhares de produtos inviabilizaria a tela.
        $r = $this->repo->consultar(
            "SELECT p.id, p.bling_id, p.sku, p.gtin, p.nome, p.tipo, p.category_id,
                    p.marca, p.unidade, p.ncm, p.origem, p.peso_kg, p.dimensoes,
                    p.tem_imagem, p.descricao_ok, p.supplier_id, p.is_ativo, p.qualidade_score,
                    COALESCE(pr.preco, 0) preco, pr.preco_promocional, COALESCE(pr.custo, 0) custo,
                    COALESCE(v.unidades, 0) unidades, COALESCE(v.receita, 0) receita,
                    v.ultima_venda, COALESCE(e.disponivel, 0) estoque_total
               FROM bling_products p
               LEFT JOIN bling_prices pr ON pr.product_id = p.id AND pr.sales_channel_id IS NULL
               LEFT JOIN (
                 SELECT i.product_id, SUM(i.quantidade) unidades, SUM(i.valor_total) receita,
                        MAX(o.data_pedido) ultima_venda
                   FROM bling_sales_order_items i
                   JOIN bling_sales_orders o ON o.id = i.sales_order_id
                  WHERE o.situacao NOT IN ('rascunho','cancelado')
                  GROUP BY i.product_id
               ) v ON v.product_id = p.id
               LEFT JOIN (
                 SELECT product_id, SUM(disponivel) disponivel FROM bling_inventory GROUP BY product_id
               ) e ON e.product_id = p.id
              WHERE p.account_id = ? AND p.deletado_em IS NULL",
            [$this->conta()]
        );

        $canaisPorProduto = [];   // vínculo com canal não existe na v3 por produto

        return array_map(static function ($p) use ($canaisPorProduto) {
            $preco = (float) ($p['preco_promocional'] ?? 0) ?: (float) $p['preco'];
            $custo = (float) $p['custo'];
            return [
                'id' => (string) $p['id'], 'bling_id' => (int) $p['bling_id'],
                'sku' => $p['sku'] ?? '', 'gtin' => $p['gtin'],
                'nome' => $p['nome'], 'tipo' => $p['tipo'],
                'categoria' => $p['category_id'] === null ? '' : (string) $p['category_id'],
                'marca' => $p['marca'] ?? '', 'unidade' => $p['unidade'] ?? '',
                'custo' => $custo, 'preco' => (float) $p['preco'],
                'preco_promocional' => $p['preco_promocional'] === null ? null : (float) $p['preco_promocional'],
                'peso_kg' => $p['peso_kg'] === null ? null : (float) $p['peso_kg'],
                'dimensoes' => $p['dimensoes'], 'ncm' => $p['ncm'],
                'origem' => $p['origem'] ?? '', 'imagem' => (bool) $p['tem_imagem'],
                'descricao_ok' => (bool) $p['descricao_ok'],
                'fornecedor' => $p['supplier_id'] === null ? '' : (string) $p['supplier_id'],
                'ativo' => (bool) $p['is_ativo'], 'variacoes' => 0,
                'canais' => $canaisPorProduto[$p['id']] ?? [],
                // Derivados — mesmos nomes do mock (BlingMock::enriquecerProdutos)
                'margem_pct' => $preco > 0 ? round((($preco - $custo) / $preco) * 100, 1) : 0.0,
                'ultima_venda' => $p['ultima_venda'],
                'unidades_vendidas' => (int) $p['unidades'],
                'receita' => round((float) $p['receita'], 2),
                'estoque_total' => (int) $p['estoque_total'],
                'qualidade_score' => (int) ($p['qualidade_score'] ?? 0),
                'qualidade_pendencias' => [],
            ];
        }, $r);
    }

    private function estoque(): array
    {
        $corte = gmdate('Y-m-d', strtotime('-90 days'));
        $r = $this->repo->consultar(
            "SELECT e.product_id, e.warehouse_id, e.fisico, e.reservado, e.disponivel,
                    e.minimo, e.maximo, e.ultima_movimentacao,
                    COALESCE(c.consumo, 0) consumo_90d
               FROM bling_inventory e
               LEFT JOIN (
                 SELECT i.product_id, SUM(i.quantidade) consumo
                   FROM bling_sales_order_items i
                   JOIN bling_sales_orders o ON o.id = i.sales_order_id
                  WHERE o.data_pedido >= ? AND o.situacao NOT IN ('rascunho','cancelado')
                  GROUP BY i.product_id
               ) c ON c.product_id = e.product_id
              WHERE e.account_id = ?",
            [$corte, $this->conta()]
        );

        return array_map(static function ($e) {
            $consumo90 = (float) $e['consumo_90d'];
            $consumoDia = $consumo90 / 90;
            $disponivel = (int) $e['disponivel'];
            $fisico = (int) $e['fisico'];
            $minimo = (int) ($e['minimo'] ?? 0);
            $cobertura = $consumoDia > 0 ? round($disponivel / $consumoDia, 1) : null;

            // Mesma classificação do mock. Duplicar a REGRA aqui seria o erro:
            // ela é idêntica de propósito e o smoke compara os dois provedores.
            $status = match (true) {
                $fisico < 0                          => 'negativo',
                $disponivel <= 0                     => 'zerado',
                $minimo > 0 && $disponivel < $minimo => 'critico',
                $cobertura !== null && $cobertura < 15 => 'baixa_cobertura',
                $consumo90 == 0 && $fisico > 0       => 'parado',
                default                              => 'normal',
            };

            return [
                'produto' => (string) $e['product_id'],
                'deposito' => (string) $e['warehouse_id'],
                'fisico' => $fisico, 'reservado' => (int) $e['reservado'],
                'disponivel' => $disponivel, 'minimo' => $minimo,
                'maximo' => (int) ($e['maximo'] ?? 0), 'divergencia' => 0,
                'ultima_movimentacao' => $e['ultima_movimentacao']
                    ? substr((string) $e['ultima_movimentacao'], 0, 10) : gmdate('Y-m-d'),
                'consumo_90d' => (int) $consumo90,
                'consumo_dia' => round($consumoDia, 3),
                'cobertura_dias' => $cobertura,
                'giro_anual' => $fisico > 0 ? round(($consumo90 / 90 * 365) / max(1, $fisico), 2) : 0.0,
                'status' => $status,
            ];
        }, $r);
    }

    // ══════════════════════════════════════════════════════════
    // MOVIMENTO
    // ══════════════════════════════════════════════════════════

    private function pedidos(): array
    {
        $pedidos = $this->repo->consultar(
            'SELECT id, bling_id, numero, data_pedido, situacao, contact_id, sales_channel_id,
                    vendedor, forma_pagamento, subtotal, desconto, frete, total, custo_total,
                    qtd_itens, atualizado_externo_em
               FROM bling_sales_orders
              WHERE account_id = ? AND deletado_em IS NULL',
            [$this->conta()]
        );
        if ($pedidos === []) {
            return [];
        }

        // Itens em UMA consulta e agrupados em memória. Uma consulta por pedido
        // seria N+1 e derrubaria a tela com alguns milhares de pedidos.
        $itens = $this->repo->consultar(
            'SELECT i.sales_order_id, i.product_id, i.sku, i.descricao,
                    i.quantidade, i.valor_unitario, i.valor_total, i.custo_unitario
               FROM bling_sales_order_items i
               JOIN bling_sales_orders o ON o.id = i.sales_order_id
              WHERE o.account_id = ?',
            [$this->conta()]
        );
        $porPedido = [];
        foreach ($itens as $i) {
            $porPedido[(int) $i['sales_order_id']][] = [
                'produto' => (string) ($i['product_id'] ?? ''),
                'sku' => $i['sku'] ?? '', 'nome' => $i['descricao'] ?? '',
                'quantidade' => (int) $i['quantidade'],
                'unitario' => (float) $i['valor_unitario'],
                'total' => (float) $i['valor_total'],
                'custo_unitario' => (float) $i['custo_unitario'],
            ];
        }

        $vendedores = [];
        foreach ($this->colecao('vendedores') as $v) {
            $vendedores[$v['nome']] = $v['id'];
        }
        $formas = [];
        foreach ($this->colecao('formas_pagamento') as $f) {
            $formas[$f['nome']] = $f['id'];
        }

        return array_map(static function ($p) use ($porPedido, $vendedores, $formas) {
            return [
                'id' => (string) $p['id'], 'numero' => (string) ($p['numero'] ?? $p['id']),
                'bling_id' => (int) $p['bling_id'],
                'data' => (string) $p['data_pedido'],
                'situacao' => $p['situacao'],
                'cliente' => (string) ($p['contact_id'] ?? ''),
                'vendedor' => $vendedores[$p['vendedor'] ?? ''] ?? '',
                'canal' => (string) ($p['sales_channel_id'] ?? ''),
                'conta' => 'conta-padrao',
                'itens' => $porPedido[(int) $p['id']] ?? [],
                'qtd_itens' => (int) $p['qtd_itens'],
                'subtotal' => (float) $p['subtotal'],
                'desconto' => (float) $p['desconto'],
                'frete' => (float) $p['frete'],
                'total' => (float) $p['total'],
                'custo' => (float) $p['custo_total'],
                'forma_pagamento' => $formas[$p['forma_pagamento'] ?? ''] ?? '',
                'atualizado_em' => $p['atualizado_externo_em']
                    ? gmdate('c', strtotime($p['atualizado_externo_em'] . ' UTC'))
                    : $p['data_pedido'] . 'T12:00:00Z',
            ];
        }, $pedidos);
    }

    private function notas(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, bling_id, numero, serie, chave, sales_order_id, contact_id,
                    data_emissao, valor, situacao, finalidade, tipo,
                    erro_codigo, erro_mensagem, tentativas, url_danfe, url_xml
               FROM bling_invoices WHERE account_id = ? AND deletado_em IS NULL',
            [$this->conta()]
        );
        return array_map(static fn($n) => [
            'id' => (string) $n['id'], 'numero' => (string) ($n['numero'] ?? ''),
            'serie' => (string) ($n['serie'] ?? '1'),
            'chave' => (string) ($n['chave'] ?? ''),
            'pedido' => (string) ($n['sales_order_id'] ?? ''),
            'cliente' => (string) ($n['contact_id'] ?? ''),
            'conta' => 'conta-padrao',
            'emissao' => (string) $n['data_emissao'],
            'valor' => (float) $n['valor'],
            'situacao' => $n['situacao'],
            'finalidade' => $n['finalidade'] ?? 'normal',
            'tipo' => $n['tipo'],
            'erro' => $n['erro_codigo'] === null ? null
                : ['codigo' => $n['erro_codigo'], 'mensagem' => (string) $n['erro_mensagem']],
            'tentativas' => (int) $n['tentativas'],
            'danfe' => $n['url_danfe'] !== null,
            'xml' => $n['url_xml'] !== null,
        ], $r);
    }

    private function envios(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, sales_order_id, invoice_id, contact_id, transportadora, servico,
                    rastreamento, data_despacho, data_previsao, data_entrega,
                    uf_destino, custo, situacao, ocorrencia
               FROM bling_shipments WHERE account_id = ?',
            [$this->conta()]
        );
        return array_map(static fn($e) => [
            'id' => (string) $e['id'],
            'pedido' => (string) ($e['sales_order_id'] ?? ''),
            'nota' => (string) ($e['invoice_id'] ?? ''),
            'cliente' => (string) ($e['contact_id'] ?? ''),
            'transportadora' => 'tr-' . md5((string) ($e['transportadora'] ?? '')),
            'servico' => $e['servico'] ?? 'Padrão',
            'rastreamento' => $e['rastreamento'] ?? '',
            'despacho' => (string) ($e['data_despacho'] ?? ''),
            'previsao' => (string) ($e['data_previsao'] ?? ''),
            'entrega' => $e['data_entrega'],
            'custo' => (float) $e['custo'],
            'situacao' => $e['situacao'],
            'uf' => $e['uf_destino'] ?? '',
            'ocorrencia' => $e['ocorrencia'],
        ], $r);
    }

    private function receber(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, titulo, contact_id, sales_order_id, financial_category_id, payment_method_id,
                    data_emissao, data_vencimento, parcela, valor, valor_recebido, saldo, situacao
               FROM bling_accounts_receivable WHERE account_id = ? AND deletado_em IS NULL',
            [$this->conta()]
        );
        $hoje = gmdate('Y-m-d');
        return array_map(static fn($t) => [
            'id' => (string) $t['id'],
            'titulo' => (string) ($t['titulo'] ?? $t['id']),
            'pedido' => $t['sales_order_id'] === null ? null : (string) $t['sales_order_id'],
            'cliente' => (string) ($t['contact_id'] ?? ''),
            'conta' => 'conta-padrao',
            'emissao' => (string) ($t['data_emissao'] ?? $t['data_vencimento']),
            'vencimento' => (string) $t['data_vencimento'],
            'parcela' => (string) ($t['parcela'] ?? '1/1'),
            'valor' => (float) $t['valor'],
            'recebido' => (float) $t['valor_recebido'],
            'saldo' => (float) $t['saldo'],
            'situacao' => $t['situacao'],
            'forma' => (string) ($t['payment_method_id'] ?? ''),
            'categoria' => (string) ($t['financial_category_id'] ?? ''),
            'atraso_dias' => $t['situacao'] === 'vencido'
                ? (int) ((strtotime($hoje) - strtotime((string) $t['data_vencimento'])) / 86400) : 0,
        ], $r);
    }

    private function pagar(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, titulo, supplier_id, purchase_order_id, financial_category_id, descricao,
                    data_emissao, data_vencimento, competencia, valor, valor_pago, saldo,
                    situacao, is_recorrente
               FROM bling_accounts_payable WHERE account_id = ? AND deletado_em IS NULL',
            [$this->conta()]
        );
        $hoje = gmdate('Y-m-d');
        return array_map(static fn($t) => [
            'id' => (string) $t['id'],
            'titulo' => (string) ($t['titulo'] ?? $t['id']),
            'compra' => $t['purchase_order_id'] === null ? null : (string) $t['purchase_order_id'],
            'fornecedor' => $t['supplier_id'] === null ? null : (string) $t['supplier_id'],
            'conta' => 'conta-padrao',
            'emissao' => (string) ($t['data_emissao'] ?? $t['data_vencimento']),
            'competencia' => (string) ($t['competencia'] ?? substr((string) $t['data_vencimento'], 0, 7)),
            'vencimento' => (string) $t['data_vencimento'],
            'valor' => (float) $t['valor'],
            'pago' => (float) $t['valor_pago'],
            'saldo' => (float) $t['saldo'],
            'situacao' => $t['situacao'],
            'categoria' => (string) ($t['financial_category_id'] ?? ''),
            'descricao' => $t['descricao'],
            'recorrente' => (bool) $t['is_recorrente'],
            'atraso_dias' => $t['situacao'] === 'vencido'
                ? (int) ((strtotime($hoje) - strtotime((string) $t['data_vencimento'])) / 86400) : 0,
        ], $r);
    }

    private function compras(): array
    {
        $compras = $this->repo->consultar(
            'SELECT id, bling_id, numero, supplier_id, situacao, data_emissao, data_previsao,
                    data_recebimento, valor, qtd_itens, qtd_total, qtd_recebida, comprador,
                    tem_divergencia, atualizado_externo_em
               FROM bling_purchase_orders WHERE account_id = ? AND deletado_em IS NULL',
            [$this->conta()]
        );
        if ($compras === []) {
            return [];
        }

        $itens = $this->repo->consultar(
            'SELECT i.purchase_order_id, i.product_id, i.sku, i.descricao,
                    i.quantidade, i.valor_unitario, i.valor_total
               FROM bling_purchase_order_items i
               JOIN bling_purchase_orders o ON o.id = i.purchase_order_id
              WHERE o.account_id = ?',
            [$this->conta()]
        );
        $porCompra = [];
        foreach ($itens as $i) {
            $porCompra[(int) $i['purchase_order_id']][] = [
                'produto' => (string) ($i['product_id'] ?? ''),
                'sku' => $i['sku'] ?? '', 'nome' => $i['descricao'] ?? '',
                'quantidade' => (int) $i['quantidade'],
                'unitario' => (float) $i['valor_unitario'],
                'total' => (float) $i['valor_total'],
            ];
        }

        return array_map(static fn($c) => [
            'id' => (string) $c['id'], 'numero' => (string) ($c['numero'] ?? $c['id']),
            'bling_id' => (int) $c['bling_id'],
            'fornecedor' => (string) ($c['supplier_id'] ?? ''),
            'conta' => 'conta-padrao',
            'emissao' => (string) $c['data_emissao'],
            'previsao' => (string) ($c['data_previsao'] ?? $c['data_emissao']),
            'recebimento' => $c['data_recebimento'],
            'itens' => $porCompra[(int) $c['id']] ?? [],
            'qtd_itens' => (int) $c['qtd_itens'],
            'qtd_total' => (int) $c['qtd_total'],
            'qtd_recebida' => (int) $c['qtd_recebida'],
            'valor' => (float) $c['valor'],
            'situacao' => $c['situacao'],
            'comprador' => $c['comprador'] ?? '',
            'divergencia' => (bool) $c['tem_divergencia'],
            'atualizado_em' => $c['atualizado_externo_em']
                ? gmdate('c', strtotime($c['atualizado_externo_em'] . ' UTC'))
                : $c['data_emissao'] . 'T12:00:00Z',
        ], $compras);
    }

    // ══════════════════════════════════════════════════════════
    // OBSERVABILIDADE
    // ══════════════════════════════════════════════════════════

    private function webhooks(): array
    {
        $r = $this->repo->consultar(
            'SELECT id, evento, situacao, tentativas, duracao_ms, correlation_id,
                    resultado, recebido_em
               FROM bling_webhook_events ORDER BY recebido_em DESC LIMIT 500'
        );
        return array_map(static fn($w) => [
            'id' => (string) $w['id'], 'evento' => $w['evento'], 'origem' => 'bling',
            'recebido_em' => gmdate('c', strtotime($w['recebido_em'] . ' UTC')),
            'situacao' => match ($w['situacao']) {
                'processado' => 'processado', 'duplicado' => 'duplicado',
                'na_fila' => 'na_fila', 'dlq' => 'dlq', default => 'falhou',
            },
            'tentativas' => (int) $w['tentativas'],
            'duracao_ms' => (int) ($w['duracao_ms'] ?? 0),
            'correlation_id' => $w['correlation_id'] ?? '',
            'resultado' => $w['resultado'],
        ], $r);
    }

    private function sync(): array
    {
        $rotulos = [
            'categorias' => 'Categorias', 'depositos' => 'Depósitos', 'canais' => 'Canais de venda',
            'contatos' => 'Contatos', 'fornecedores' => 'Fornecedores', 'produtos' => 'Produtos',
            'estoque' => 'Estoque', 'pedidos' => 'Pedidos de venda', 'compras' => 'Pedidos de compra',
            'notas' => 'Notas fiscais', 'receber' => 'Contas a receber', 'pagar' => 'Contas a pagar',
        ];

        $saida = [];
        foreach ($this->repo->estadosSync($this->conta()) as $s) {
            $saida[] = [
                'recurso' => $s['recurso'],
                'rotulo' => $rotulos[$s['recurso']] ?? ucfirst((string) $s['recurso']),
                'conta' => 'conta-padrao',
                'situacao' => $s['situacao'] === 'nunca_executado' ? 'atencao' : $s['situacao'],
                'ultima_execucao' => $s['ultima_execucao_em']
                    ? gmdate('c', strtotime($s['ultima_execucao_em'] . ' UTC')) : gmdate('c'),
                'proxima_execucao' => $s['proxima_execucao_em']
                    ? gmdate('c', strtotime($s['proxima_execucao_em'] . ' UTC')) : gmdate('c'),
                'duracao_s' => round(((int) ($s['duracao_ms'] ?? 0)) / 1000, 1),
                'consultados' => (int) $s['registros_consultados'],
                'criados' => (int) $s['registros_criados'],
                'atualizados' => (int) $s['registros_atualizados'],
                'ignorados' => (int) $s['registros_ignorados'],
                'erros' => (int) $s['erros'],
                'pagina' => (int) $s['pagina_atual'],
                'cursor' => (string) ($s['cursor_atual'] ?? ''),
                'watermark' => $s['watermark'] ? gmdate('c', strtotime($s['watermark'] . ' UTC')) : gmdate('c'),
                'limite_consumido_pct' => (int) ($s['limite_consumido_pct'] ?? 0),
                'retry' => (int) $s['retry'],
                'estrategia' => $s['estrategia'],
            ];
        }
        return $saida;
    }

    // ══════════════════════════════════════════════════════════

    /**
     * Mascaramento de documento (§62).
     * O valor inteiro NUNCA sai deste arquivo — a máscara acontece na origem,
     * não na tela. Se dependesse da tela, um endpoint novo esqueceria.
     */
    private static function mascararDocumento(?string $doc): string
    {
        $d = preg_replace('/\D/', '', (string) $doc);
        if ($d === '' || $d === null) {
            return '—';
        }
        if (strlen($d) === 14) {   // CNPJ
            return sprintf('%s.***.***/%s-**', substr($d, 0, 2), substr($d, 8, 4));
        }
        if (strlen($d) === 11) {   // CPF
            return sprintf('***.%s.***-**', substr($d, 3, 3));
        }
        return str_repeat('*', max(0, strlen($d) - 4)) . substr($d, -4);
    }
}
