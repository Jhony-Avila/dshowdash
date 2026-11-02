<?php
// Bling / services/BlingSyncService.php - carga, incremental e reconciliacao
// @module  bling.service.sync
// @version 1.0.0
// @created 2026-07-30
//
// TRÊS ESTRATÉGIAS, PROPÓSITOS DIFERENTES (§47):
//
//   carga_inicial   varre tudo uma vez. Cursor persistido: se cair no meio,
//                   retoma da página onde parou em vez de recomeçar.
//   incremental     lê só o que mudou desde o watermark. É o que roda de 15 em
//                   15 minutos.
//   reconciliacao   varredura completa periódica. É a REDE DE SEGURANÇA: o
//                   webhook pode se perder e o incremental pode ter uma janela
//                   cega. §46 é explícito que webhook não substitui isso.
//
// ORDEM IMPORTA: cadastros antes de movimento. Gravar um pedido antes do
// cliente existir deixaria a FK nula e o pedido órfão de dono na tela.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingSyncService
{
    /**
     * Recursos na ordem de dependência.
     * `tabela` null = recurso derivado, tratado dentro de outro.
     */
    public const RECURSOS = [
        'categorias'   => ['endpoint' => 'categorias/produtos', 'tabela' => 'bling_categories'],
        'depositos'    => ['endpoint' => 'depositos',           'tabela' => 'bling_warehouses'],
        'canais'       => ['endpoint' => 'canais-venda',        'tabela' => 'bling_sales_channels'],
        'contatos'     => ['endpoint' => 'contatos',            'tabela' => 'bling_contacts'],
        'fornecedores' => ['endpoint' => 'contatos/fornecedores','tabela' => 'bling_suppliers'],
        'produtos'     => ['endpoint' => 'produtos',            'tabela' => 'bling_products'],
        'estoque'      => ['endpoint' => 'estoques/saldos',     'tabela' => 'bling_inventory'],
        'pedidos'      => ['endpoint' => 'pedidos/vendas',      'tabela' => 'bling_sales_orders'],
        'compras'      => ['endpoint' => 'pedidos/compras',     'tabela' => 'bling_purchase_orders'],
        'notas'        => ['endpoint' => 'nfe',                 'tabela' => 'bling_invoices'],
        'receber'      => ['endpoint' => 'contas/receber',      'tabela' => 'bling_accounts_receivable'],
        'pagar'        => ['endpoint' => 'contas/pagar',        'tabela' => 'bling_accounts_payable'],
    ];

    public function __construct(
        private readonly BlingRepository $repo,
        private readonly BlingAuthService $auth,
    ) {}

    // ─────────────────────────────────────────────────────────────

    /**
     * Sincroniza um recurso.
     * @return array{recurso:string,situacao:string,consultados:int,criados:int,atualizados:int,ignorados:int,erros:int}
     */
    public function sincronizar(int $accountId, string $recurso, string $estrategia = 'incremental',
                                ?string $correlationId = null): array
    {
        if (!isset(self::RECURSOS[$recurso])) {
            throw new InvalidArgumentException("Recurso desconhecido: $recurso");
        }

        $cfg = self::RECURSOS[$recurso];
        $jobId = $this->repo->iniciarJob($accountId, $recurso, $estrategia, $correlationId);
        $inicio = microtime(true);

        $contagem = ['consultados' => 0, 'criados' => 0, 'atualizados' => 0, 'ignorados' => 0, 'erros' => 0];
        $estadoAnterior = $this->repo->estadoSync($accountId, $recurso);
        $watermarkNovo = gmdate('Y-m-d H:i:s');

        try {
            $cliente = $this->auth->cliente($accountId);
            $query = $this->montarQuery($recurso, $estrategia, $estadoAnterior);

            // Carga interrompida retoma da página gravada — não recomeça.
            $paginaInicial = ($estrategia === 'carga_inicial' && $estadoAnterior
                              && $estadoAnterior['situacao'] === 'parcial')
                ? max(1, (int) $estadoAnterior['pagina_atual']) : 1;

            $resultado = $cliente->paginar(
                $cfg['endpoint'],
                $query + ($paginaInicial > 1 ? ['pagina' => $paginaInicial] : []),
                function (array $itens, int $pagina) use ($accountId, $recurso, &$contagem, $correlationId) {
                    // ⚠️ UMA TRANSAÇÃO POR PÁGINA.
                    // Em autocommit, cada INSERT paga um fsync próprio: a carga
                    // da homologação (5.652 registros) levava 112s, ~20ms por
                    // registro, o que é absurdo para inserção local. O custo não
                    // estava na consulta, estava no commit.
                    //
                    // A página é a unidade certa: o progresso já é gravado a
                    // cada página, então o ponto de retomada e o limite da
                    // transação coincidem. Se cair no meio, a página inteira
                    // reverte e a sincronização retoma exatamente dali.
                    $this->repo->pdo()->beginTransaction();
                    $errosDaPagina = [];

                    foreach ($itens as $bruto) {
                        $contagem['consultados']++;
                        try {
                            // gravar() devolve 'criado'|'atualizado'|'ignorado' (singular);
                            // a contagem usa plural. Sem o mapa, o incremento criava
                            // chave nova e o relatório saía todo zerado — com Warning,
                            // não com erro.
                            $r = $this->gravar($accountId, $recurso, $bruto);
                            $contagem[match ($r) {
                                'criado'     => 'criados',
                                'atualizado' => 'atualizados',
                                default      => 'ignorados',
                            }]++;
                        } catch (Throwable $e) {
                            $contagem['erros']++;
                            // Um item ruim não pode derrubar o lote: guarda e
                            // segue. Interromper aqui faria um payload esquisito
                            // travar a sincronização do recurso inteiro.
                            //
                            // O erro é gravado DEPOIS do commit: dentro da
                            // transação ele seria revertido junto se a página
                            // falhasse, e a falha ficaria sem registro nenhum —
                            // exatamente a informação de que se precisa.
                            $errosDaPagina[] = [
                                is_array($bruto) ? (string) ($bruto['id'] ?? '') : null,
                                $e->getMessage(),
                            ];
                        }
                    }

                    // Progresso a cada página: se cair agora, retoma daqui.
                    $this->repo->salvarEstadoSync($accountId, $recurso, [
                        'pagina_atual' => $pagina,
                        'situacao'     => 'parcial',
                        'estrategia'   => 'carga_inicial',
                    ]);
                    $this->repo->pdo()->commit();

                    foreach ($errosDaPagina as [$blingId, $mensagem]) {
                        $this->repo->registrarErroSync($accountId, $recurso, $blingId,
                            'NORMALIZACAO', $mensagem, null, 1, $correlationId);
                    }
                    return true;
                },
            );

            $situacao = $contagem['erros'] === 0 ? 'ok'
                : ($contagem['erros'] < $contagem['consultados'] * 0.1 ? 'atencao' : 'parcial');

            $this->repo->salvarEstadoSync($accountId, $recurso, [
                'estrategia' => $estrategia,
                'situacao'   => $situacao,
                'pagina_atual' => 1,
                'cursor_atual' => null,
                'watermark'  => $watermarkNovo,
                'ultima_execucao_em'  => gmdate('Y-m-d H:i:s'),
                'proxima_execucao_em' => gmdate('Y-m-d H:i:s', time() + 900),
                'duracao_ms' => (int) ((microtime(true) - $inicio) * 1000),
                'registros_consultados' => $contagem['consultados'],
                'registros_criados'     => $contagem['criados'],
                'registros_atualizados' => $contagem['atualizados'],
                'registros_ignorados'   => $contagem['ignorados'],
                'erros' => $contagem['erros'],
                'retry' => 0,
                'limite_consumido_pct' => $cliente->consumo()['consumido_pct'],
            ]);

            $this->repo->fecharJob($jobId, 'concluido', $contagem,
                sprintf('%d páginas, %d itens', $resultado['paginas'], $resultado['itens']));

            // Solta o mapa de ids: o worker é processo longo e sincroniza
            // recurso atrás de recurso — segurar tudo em memória não tem volta.
            $this->repo->limparCacheIds();

            return ['recurso' => $recurso, 'situacao' => $situacao] + $contagem;

        } catch (Throwable $e) {
            // A exceção pode ter escapado com a transação da página aberta.
            // Sem o rollback, a conexão fica em transação e TODA gravação
            // seguinte — inclusive a do próprio estado de erro — entraria nela.
            if ($this->repo->pdo()->inTransaction()) {
                $this->repo->pdo()->rollBack();
            }
            $this->repo->salvarEstadoSync($accountId, $recurso, [
                'estrategia' => $estrategia,
                'situacao'   => 'erro',
                'ultima_execucao_em' => gmdate('Y-m-d H:i:s'),
                'duracao_ms' => (int) ((microtime(true) - $inicio) * 1000),
                'erros' => $contagem['erros'] + 1,
                'retry' => (int) ($estadoAnterior['retry'] ?? 0) + 1,
            ]);
            $this->repo->fecharJob($jobId, 'falhou', $contagem, $e->getMessage());
            $this->repo->registrarErroSync($accountId, $recurso, null, 'SYNC_FALHOU',
                $e->getMessage(), null, 1, $correlationId);

            return ['recurso' => $recurso, 'situacao' => 'erro'] + $contagem;
        }
    }

    /** Sincroniza TODOS os recursos, na ordem de dependência. */
    public function sincronizarTudo(int $accountId, string $estrategia = 'incremental',
                                    ?string $correlationId = null): array
    {
        $saida = [];
        foreach (array_keys(self::RECURSOS) as $recurso) {
            $saida[] = $this->sincronizar($accountId, $recurso, $estrategia, $correlationId);
        }
        return $saida;
    }

    // ─────────────────────────────────────────────────────────────

    private function montarQuery(string $recurso, string $estrategia, ?array $estado): array
    {
        // Incremental: só o que mudou desde o watermark, com 1 dia de folga.
        //
        // A folga não é preguiça — é o que cobre registro alterado durante a
        // própria execução anterior. Sem ela existe uma janela cega, e a
        // reconciliação teria que compensar todo dia.
        if ($estrategia === 'incremental' && !empty($estado['watermark'])) {
            $desde = date('Y-m-d', strtotime($estado['watermark'] . ' -1 day'));
            return match ($recurso) {
                'pedidos', 'compras' => ['dataAlteracaoInicial' => $desde],
                'notas'              => ['dataEmissaoInicial'   => $desde],
                'receber', 'pagar'   => ['dataVencimentoInicial'=> $desde],
                default              => ['dataAlteracaoInicial' => $desde],
            };
        }
        return [];
    }

    /** @return 'criado'|'atualizado'|'ignorado' */
    private function gravar(int $accountId, string $recurso, array $bruto): string
    {
        return match ($recurso) {
            'categorias'   => $this->repo->upsert('bling_categories', $accountId, BlingNormalizer::categoria($bruto)),
            'depositos'    => $this->repo->upsert('bling_warehouses', $accountId,
                                BlingNormalizer::deposito($bruto) + ['payload_hash' => BlingNormalizer::hash($bruto)]),
            'canais'       => $this->repo->upsert('bling_sales_channels', $accountId, BlingNormalizer::canal($bruto)),
            'contatos'     => $this->repo->upsert('bling_contacts', $accountId, BlingNormalizer::contato($bruto)),
            'fornecedores' => $this->repo->upsert('bling_suppliers', $accountId, BlingNormalizer::fornecedor($bruto)),
            'produtos'     => $this->gravarProduto($accountId, $bruto),
            'estoque'      => $this->gravarEstoque($accountId, $bruto),
            'pedidos'      => $this->gravarPedido($accountId, $bruto),
            'compras'      => $this->gravarCompra($accountId, $bruto),
            'notas'        => $this->gravarNota($accountId, $bruto),
            'receber'      => $this->gravarReceber($accountId, $bruto),
            'pagar'        => $this->gravarPagar($accountId, $bruto),
            default        => throw new InvalidArgumentException("Sem gravador para $recurso"),
        };
    }

    private function gravarProduto(int $accountId, array $bruto): string
    {
        $d = BlingNormalizer::produto($bruto);

        $preco    = $d['preco'];
        $promo    = $d['preco_promocional'];
        $custo    = $d['custo'];
        $catBling = $d['categoria_bling_id'];
        $fornBling= $d['fornecedor_bling_id'];
        unset($d['preco'], $d['preco_promocional'], $d['custo'],
              $d['categoria_bling_id'], $d['fornecedor_bling_id']);

        $d['category_id'] = $this->repo->idPorBlingId('bling_categories', $accountId, $catBling);
        $d['supplier_id'] = $this->repo->idPorBlingId('bling_suppliers', $accountId, $fornBling);
        $d['qualidade_score'] = $this->calcularQualidade($d, $preco, $custo);

        $r = $this->repo->upsert('bling_products', $accountId, $d);
        $productId = $this->repo->idPorBlingId('bling_products', $accountId, $d['bling_id']);

        if ($productId !== null) {
            $this->gravarPreco($accountId, $productId, $preco, $promo, $custo);
        }
        return $r;
    }

    /**
     * Preço vigente + histórico.
     *
     * O histórico só recebe linha quando o valor MUDA. É o que faz a tela §26.1
     * deixar de mostrar "valor vigente repetido" e passar a mostrar série real —
     * a limitação que a Fase 3 teve que declarar.
     */
    private function gravarPreco(int $accountId, int $productId, float $preco,
                                 ?float $promo, float $custo): void
    {
        $atual = $this->repo->consultar(
            'SELECT preco, preco_promocional, custo FROM bling_prices
              WHERE product_id = ? AND sales_channel_id IS NULL', [$productId]
        );
        $antes = $atual[0] ?? null;

        $mudou = $antes === null
            || abs((float) $antes['preco'] - $preco) > 0.001
            || abs((float) ($antes['custo'] ?? 0) - $custo) > 0.001
            || (float) ($antes['preco_promocional'] ?? 0) !== (float) ($promo ?? 0);

        // ⚠️ `canal_key` NÃO é redundância: o UNIQUE original era
        // (product_id, sales_channel_id) e o MySQL trata cada NULL como valor
        // DISTINTO, então ON DUPLICATE KEY nunca casava no preço padrão
        // (sales_channel_id NULL) e cada sincronização inseria uma linha nova.
        // O produto passava a aparecer duplicado na tela — uma cópia por sync.
        // canal_key espelha o canal com NULL→0 e devolve a garantia.
        $this->repo->pdo()->prepare(
            'INSERT INTO bling_prices (account_id, product_id, sales_channel_id, canal_key,
                                       preco, preco_promocional, custo, sincronizado_em)
             VALUES (?, ?, NULL, 0, ?, ?, ?, UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE preco = VALUES(preco),
               preco_promocional = VALUES(preco_promocional), custo = VALUES(custo),
               sincronizado_em = UTC_TIMESTAMP()'
        )->execute([$accountId, $productId, $preco, $promo, $custo]);

        if ($mudou) {
            $this->repo->pdo()->prepare(
                'INSERT INTO bling_price_history (account_id, product_id, preco, preco_promocional, custo, origem, observado_em)
                 VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
            )->execute([$accountId, $productId, $preco, $promo, $custo, 'sync']);
        }
    }

    /** Score de qualidade cadastral (§23) — 16 critérios, peso igual. */
    private function calcularQualidade(array $p, float $preco, float $custo): int
    {
        $criterios = [
            ($p['sku'] ?? '') !== '',        ($p['gtin'] ?? '') !== '',
            (int) ($p['descricao_ok'] ?? 0) === 1, (int) ($p['tem_imagem'] ?? 0) === 1,
            ($p['category_id'] ?? null) !== null,  ($p['marca'] ?? '') !== '',
            ($p['unidade'] ?? '') !== '',    ($p['peso_kg'] ?? null) !== null,
            ($p['dimensoes'] ?? null) !== null,    ($p['origem'] ?? '') !== '',
            ($p['ncm'] ?? '') !== '',        $custo > 0,
            $preco > 0,                      true,  // estoque: avaliado na sincronização de estoque
            ($p['supplier_id'] ?? null) !== null,   true,  // canal: idem
        ];
        return (int) round((count(array_filter($criterios)) / count($criterios)) * 100);
    }

    private function gravarEstoque(int $accountId, array $bruto): string
    {
        $d = BlingNormalizer::estoque($bruto);
        $productId = $this->repo->idPorBlingId('bling_products', $accountId, $d['produto_bling_id']);
        if ($productId === null) {
            // Produto ainda não sincronizado: o item volta no próximo ciclo,
            // depois que 'produtos' rodar. Ignorar é melhor que criar produto
            // fantasma só com id.
            return 'ignorado';
        }

        $warehouseId = $this->repo->idPorBlingId('bling_warehouses', $accountId, $d['deposito_bling_id']);
        if ($warehouseId === null) {
            $warehouseId = (int) $this->repo->valor(
                'SELECT id FROM bling_warehouses WHERE account_id = ? ORDER BY is_padrao DESC, id LIMIT 1',
                [$accountId]
            );
            if ($warehouseId === 0) {
                return 'ignorado';
            }
        }

        $this->repo->pdo()->prepare(
            'INSERT INTO bling_inventory (account_id, product_id, warehouse_id, fisico, reservado, minimo, maximo, sincronizado_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE fisico = VALUES(fisico), reservado = VALUES(reservado),
               minimo = VALUES(minimo), maximo = VALUES(maximo), sincronizado_em = UTC_TIMESTAMP()'
        )->execute([$accountId, $productId, $warehouseId,
                    $d['fisico'], $d['reservado'], $d['minimo'], $d['maximo']]);

        return 'atualizado';
    }

    private function gravarPedido(int $accountId, array $bruto): string
    {
        $d = BlingNormalizer::pedidoVenda($bruto);
        $itens = $d['itens'];
        $contatoBling = $d['contato_bling_id'];
        $canalBling = $d['canal_bling_id'];
        $situacaoBling = $d['situacao_bling'];
        unset($d['itens'], $d['contato_bling_id'], $d['canal_bling_id']);

        $d['contact_id'] = $this->repo->idPorBlingId('bling_contacts', $accountId, $contatoBling);
        $d['sales_channel_id'] = $this->repo->idPorBlingId('bling_sales_channels', $accountId, $canalBling);
        $d['situacao'] = BlingVersionAdapter::situacaoPedido($situacaoBling);

        // Subtotal e custo saem dos ITENS, não do cabeçalho: o Bling nem sempre
        // manda os dois, e a coerência com o grid depende de bater com a soma.
        $subtotal = 0.0;
        $custo = 0.0;
        foreach ($itens as $i) {
            $subtotal += $i['valor_total'];
            $custo += $i['custo_unitario'] * $i['quantidade'];
        }
        $d['subtotal'] = round($subtotal, 2);
        $d['custo_total'] = round($custo, 2);
        $d['qtd_itens'] = count($itens);
        if ($d['total'] <= 0) {
            $d['total'] = round($subtotal - $d['desconto'] + $d['frete'], 2);
        }

        // Situação mudou? Registra na timeline (§21.1) antes de sobrescrever.
        $anterior = $this->repo->consultar(
            'SELECT id, situacao FROM bling_sales_orders WHERE account_id = ? AND bling_id = ?',
            [$accountId, $d['bling_id']]
        );

        $r = $this->repo->upsert('bling_sales_orders', $accountId, $d);
        $pedidoId = $this->repo->idPorBlingId('bling_sales_orders', $accountId, $d['bling_id']);

        if ($pedidoId !== null) {
            $situacaoAntes = $anterior[0]['situacao'] ?? null;
            if ($situacaoAntes !== $d['situacao']) {
                $this->repo->pdo()->prepare(
                    'INSERT INTO bling_sales_order_status_history
                       (account_id, sales_order_id, situacao_de, situacao_para, origem, observado_em)
                     VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())'
                )->execute([$accountId, $pedidoId, $situacaoAntes, $d['situacao'], 'sync']);
            }
            $this->gravarItens($accountId, $pedidoId, $itens);
            $this->gravarEnvio($accountId, $pedidoId, $bruto, $d);
        }

        return $r;
    }

    /**
     * Envio DERIVADO do pedido.
     *
     * ⚠️ Não existe recurso "envio" separado na API v3 do Bling: transporte,
     * rastreio e prazo vêm dentro do próprio pedido, em `transporte`. Tratar
     * envio como recurso próprio significaria inventar um endpoint que não
     * existe — e a tela de Expedição ficaria vazia para sempre, que é
     * exatamente o que a homologação flagrou (`aguardando_expedicao` = 0 no
     * banco contra 31 no mock).
     *
     * A situação do envio é derivada da situação do PEDIDO: um pedido em
     * separação tem envio aguardando; entregue tem envio entregue. Derivar num
     * lugar só evita que a tela de expedição e a de pedidos discordem sobre o
     * mesmo pedido.
     */
    private function gravarEnvio(int $accountId, int $pedidoId, array $bruto, array $pedido): void
    {
        // Pedido que ainda não chegou a expedição não gera envio: criar um
        // registro "vazio" encheria a tela de Expedição de linhas sem sentido.
        $situacaoEnvio = match ($pedido['situacao']) {
            'separacao'                 => 'aguardando_separacao',
            'faturado', 'nota_emitida'  => 'separado',
            'enviado'                   => 'em_transito',
            'entregue'                  => 'entregue',
            'devolvido'                 => 'devolvido',
            default                     => null,
        };
        if ($situacaoEnvio === null) {
            return;
        }

        $t = BlingNormalizer::transporteDoPedido($bruto);

        $despacho = $pedido['data_saida'] ?? $pedido['data_pedido'] ?? null;
        $entrega  = $situacaoEnvio === 'entregue'
            ? ($pedido['data_entrega'] ?? $despacho) : null;

        $this->repo->upsert('bling_shipments', $accountId, [
            // O envio não tem id próprio no Bling — a identidade é a do pedido.
            'bling_id'       => 'ped:' . $pedido['bling_id'],
            'sales_order_id' => $pedidoId,
            'contact_id'     => $pedido['contact_id'] ?? null,
            'transportadora' => $t['transportadora'],
            'servico'        => $t['servico'],
            'rastreamento'   => $t['rastreamento'],
            'data_despacho'  => $despacho,
            'data_previsao'  => $t['previsao'],
            'data_entrega'   => $entrega,
            'uf_destino'     => $t['uf'],
            'custo'          => (float) ($pedido['frete'] ?? 0),
            'situacao'       => $situacaoEnvio,
            'situacao_bling' => (string) ($pedido['situacao'] ?? ''),
            'payload_hash'   => md5((string) json_encode([$t, $situacaoEnvio, $despacho, $entrega])),
        ]);
    }

    /**
     * Itens: apaga e regrava.
     *
     * Merge item a item exigiria id estável do item, que nem todo endpoint do
     * Bling devolve. Apagar e regravar dentro da transação do pedido é mais
     * simples e não deixa item fantasma de uma versão anterior do pedido.
     */
    private function gravarItens(int $accountId, int $pedidoId, array $itens): void
    {
        $this->repo->pdo()->prepare('DELETE FROM bling_sales_order_items WHERE sales_order_id = ?')
            ->execute([$pedidoId]);

        if ($itens === []) {
            return;
        }
        $st = $this->repo->pdo()->prepare(
            'INSERT INTO bling_sales_order_items
               (account_id, sales_order_id, product_id, bling_id, sku, descricao,
                quantidade, valor_unitario, valor_total, custo_unitario)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($itens as $i) {
            $st->execute([
                $accountId, $pedidoId,
                $this->repo->idPorBlingId('bling_products', $accountId, $i['produto_bling_id']),
                $i['bling_id'], $i['sku'], $i['descricao'],
                $i['quantidade'], $i['valor_unitario'], $i['valor_total'], $i['custo_unitario'],
            ]);
        }
    }

    private function gravarCompra(int $accountId, array $bruto): string
    {
        $d = BlingNormalizer::pedidoCompra($bruto);
        $itens = $d['itens'];
        $fornBling = $d['fornecedor_bling_id'];
        $situacaoBling = $d['situacao_bling'];
        unset($d['itens'], $d['fornecedor_bling_id']);

        $d['supplier_id'] = $this->repo->idPorBlingId('bling_suppliers', $accountId, $fornBling);
        $d['situacao'] = BlingVersionAdapter::situacaoCompra($situacaoBling);
        $d['qtd_itens'] = count($itens);
        $d['qtd_total'] = array_sum(array_column($itens, 'quantidade'));
        $d['qtd_recebida'] = 0;

        $r = $this->repo->upsert('bling_purchase_orders', $accountId, $d);
        $compraId = $this->repo->idPorBlingId('bling_purchase_orders', $accountId, $d['bling_id']);

        if ($compraId !== null) {
            $this->repo->pdo()->prepare('DELETE FROM bling_purchase_order_items WHERE purchase_order_id = ?')
                ->execute([$compraId]);
            $st = $this->repo->pdo()->prepare(
                'INSERT INTO bling_purchase_order_items
                   (account_id, purchase_order_id, product_id, sku, descricao, quantidade, valor_unitario, valor_total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            foreach ($itens as $i) {
                $st->execute([$accountId, $compraId,
                    $this->repo->idPorBlingId('bling_products', $accountId, $i['produto_bling_id']),
                    $i['sku'], $i['descricao'], $i['quantidade'], $i['valor_unitario'], $i['valor_total']]);
            }
        }
        return $r;
    }

    private function gravarNota(int $accountId, array $bruto): string
    {
        $d = BlingNormalizer::nota($bruto);
        $pedidoBling = $d['pedido_bling_id'];
        $contatoBling = $d['contato_bling_id'];
        $situacaoBling = $d['situacao_bling'];
        unset($d['pedido_bling_id'], $d['contato_bling_id']);

        $d['sales_order_id'] = $this->repo->idPorBlingId('bling_sales_orders', $accountId, $pedidoBling);
        $d['contact_id'] = $this->repo->idPorBlingId('bling_contacts', $accountId, $contatoBling);
        $d['situacao'] = BlingVersionAdapter::situacaoNota($situacaoBling);

        $r = $this->repo->upsert('bling_invoices', $accountId, $d);

        // Rejeição vira evento: é o que alimenta o diagnóstico do §30.3 e o
        // histórico de tentativas.
        if ($d['erro_codigo'] !== null) {
            $notaId = $this->repo->idPorBlingId('bling_invoices', $accountId, $d['bling_id']);
            if ($notaId !== null) {
                $this->repo->pdo()->prepare(
                    'INSERT INTO bling_invoice_events (account_id, invoice_id, evento, codigo, mensagem, observado_em)
                     VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())'
                )->execute([$accountId, $notaId, 'rejeicao', $d['erro_codigo'], $d['erro_mensagem']]);
            }
        }
        return $r;
    }

    private function gravarReceber(int $accountId, array $bruto): string
    {
        $d = BlingNormalizer::contaReceber($bruto);
        $contatoBling = $d['contato_bling_id'];
        $pedidoBling = $d['pedido_bling_id'];
        $catBling = $d['categoria_bling_id'];
        $formaBling = $d['forma_bling_id'];
        $situacaoBling = $d['situacao_bling'];
        unset($d['contato_bling_id'], $d['pedido_bling_id'], $d['categoria_bling_id'], $d['forma_bling_id']);

        $d['contact_id'] = $this->repo->idPorBlingId('bling_contacts', $accountId, $contatoBling);
        $d['sales_order_id'] = $this->repo->idPorBlingId('bling_sales_orders', $accountId, $pedidoBling);
        $d['financial_category_id'] = $this->repo->idPorBlingId('bling_financial_categories', $accountId, $catBling);
        $d['payment_method_id'] = $this->repo->idPorBlingId('bling_payment_methods', $accountId, $formaBling);
        $d['situacao'] = BlingVersionAdapter::situacaoTitulo($situacaoBling, $d['data_vencimento'],
                                                             $d['valor'], $d['valor_recebido']);
        return $this->repo->upsert('bling_accounts_receivable', $accountId, $d);
    }

    private function gravarPagar(int $accountId, array $bruto): string
    {
        $d = BlingNormalizer::contaPagar($bruto);
        $fornBling = $d['fornecedor_bling_id'];
        $pedidoBling = $d['pedido_bling_id'];
        $catBling = $d['categoria_bling_id'];
        $situacaoBling = $d['situacao_bling'];
        unset($d['fornecedor_bling_id'], $d['pedido_bling_id'], $d['categoria_bling_id'], $d['forma_bling_id']);

        $d['supplier_id'] = $this->repo->idPorBlingId('bling_suppliers', $accountId, $fornBling);
        $d['purchase_order_id'] = $this->repo->idPorBlingId('bling_purchase_orders', $accountId, $pedidoBling);
        $d['financial_category_id'] = $this->repo->idPorBlingId('bling_financial_categories', $accountId, $catBling);
        $d['situacao'] = BlingVersionAdapter::situacaoTitulo($situacaoBling, $d['data_vencimento'],
                                                             $d['valor'], $d['valor_pago']);
        return $this->repo->upsert('bling_accounts_payable', $accountId, $d);
    }
}
