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
        // 17/11/2026: /contatos/fornecedores não existe no v3 (404). Fornecedor = GET /contatos?idTipoContato=<id do tipo
        // "Fornecedor">, id descoberto em GET /contatos/tipos (OpenAPI oficial, build/assets/openapi-CR5QY_N1.json).
        'fornecedores' => ['endpoint' => 'contatos',            'tabela' => 'bling_suppliers'],
        'produtos'     => ['endpoint' => 'produtos',            'tabela' => 'bling_products'],
        'estoque'      => ['endpoint' => 'estoques/saldos',     'tabela' => 'bling_inventory'],
        'pedidos'      => ['endpoint' => 'pedidos/vendas',      'tabela' => 'bling_sales_orders'],
        'compras'      => ['endpoint' => 'pedidos/compras',     'tabela' => 'bling_purchase_orders'],
        'notas'        => ['endpoint' => 'nfe',                 'tabela' => 'bling_invoices'],
        'receber'      => ['endpoint' => 'contas/receber',      'tabela' => 'bling_accounts_receivable'],
        'pagar'        => ['endpoint' => 'contas/pagar',        'tabela' => 'bling_accounts_payable'],
    ];

    /**
     * Recursos DESATIVADOS por conta (configuração, não código apagado: o recurso continua em RECURSOS).
     * Reativar = tirar a linha. O worker não agenda (incremental/reconciliação), o diagnóstico recusa e
     * sincronizar() devolve 'desativado' sem chamar o Bling nem mexer no estado.
     */
    public const RECURSOS_DESATIVADOS = [
        // BLING-SEM-RECEBER (17/11/2026, Jhony): as contas a receber da DSHOW ficam no Asaas, não no Bling.
        44 => ['receber' => 'recebíveis no Asaas'],
    ];

    /**
     * BLING-ESCOPO-AUSENTE (23/11/2026): 403 `insufficient_scope` = o token não tem o escopo do recurso. Repetir não adianta: o recurso
     * fica em 'atencao' com UM erro ESCOPO_AUSENTE, sem reagendamento nem DLQ, e só tenta de novo depois de ESCOPO_NOVA_TENTATIVA_S
     * (1 vez por dia) ou logo após a conta ser reautorizada (BlingAuthService::concluirConexao → liberarEscopoAusente).
     */
    public const ESCOPO_AUSENTE = 'ESCOPO_AUSENTE';
    public const ESCOPO_NOVA_TENTATIVA_S = 86400;

    /** A falha é "o token não tem o escopo" (403 insufficient_scope)? */
    public static function ehEscopoAusente(Throwable $e): bool
    {
        $m = $e->getMessage();
        return str_contains($m, 'HTTP 403') && str_contains($m, 'insufficient_scope');
    }

    /** Recurso marcado como "escopo ausente" e ainda dentro da espera (nem reautorizado, nem chegou a tentativa diária)? */
    private function escopoAusenteVigente(int $accountId, string $recurso, ?array $estado): bool
    {
        return $estado !== null && $this->repo->escopoSuspenso($accountId, $recurso);   // DSHOW-106: fonte única (repositório)
    }

    /** Motivo da desativação, ou null se o recurso está ativo para a conta. */
    public static function desativado(int $accountId, string $recurso): ?string
    {
        return self::RECURSOS_DESATIVADOS[$accountId][$recurso] ?? null;
    }

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

        $motivo = self::desativado($accountId, $recurso);
        if ($motivo !== null) {
            // BLING-SEM-RECEBER: nada de chamada ao Bling nem de job/estado; a fila trata como concluído.
            return ['recurso' => $recurso, 'situacao' => 'desativado', 'motivo' => $motivo,
                    'consultados' => 0, 'criados' => 0, 'atualizados' => 0, 'ignorados' => 0, 'erros' => 0];
        }

        // BLING-ESCOPO-AUSENTE: marcado e ainda na espera → nada de chamada ao Bling, job ou erro novo (a fila trata como concluído).
        if ($this->escopoAusenteVigente($accountId, $recurso, $this->repo->estadoSync($accountId, $recurso))) {
            return ['recurso' => $recurso, 'situacao' => 'escopo_ausente',
                    'motivo' => 'o token do Bling não tem o escopo deste recurso; aguardando reautorização ou a tentativa diária',
                    'consultados' => 0, 'criados' => 0, 'atualizados' => 0, 'ignorados' => 0, 'erros' => 0];
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
            if ($recurso === 'fornecedores') {
                $query['idTipoContato'] = $this->idTipoFornecedor($cliente);
            }

            // Carga interrompida retoma da página gravada — não recomeça.
            $paginaInicial = ($estadoAnterior && $estadoAnterior['situacao'] === 'parcial'
                              && in_array($estrategia, ['carga_inicial', 'incremental'], true))   // DSHOW-017: retomar também o incremental parcial
                ? max(1, (int) $estadoAnterior['pagina_atual']) : 1;

            $aCadaPagina =
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
                        // DSHOW-106 (2): SAVEPOINT por item — se gravar() falhar no meio (ex.: cabeçalho gravado e itens não),
                        // volta SÓ este item ao estado anterior; os outros itens da página seguem.
                        $this->repo->pdo()->exec('SAVEPOINT bling_item');
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
                            $this->repo->pdo()->exec('RELEASE SAVEPOINT bling_item');
                        } catch (Throwable $e) {
                            $this->repo->pdo()->exec('ROLLBACK TO SAVEPOINT bling_item');
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
                };

            // 17/11/2026: /estoques/saldos EXIGE idsProdutos[] (400 sem ele) — consulta em lotes de 100 produtos já sincronizados.
            $resultado = $recurso === 'estoque'
                ? $this->paginarEstoque($cliente, $accountId, $aCadaPagina)
                : $cliente->paginar(
                    $cfg['endpoint'],
                    $query,
                    $aCadaPagina,
                    100, 500, $paginaInicial,   // DSHOW-017: página inicial como parâmetro (não pela união de arrays)
                );

            // DSHOW-017: só uma coleta CONCLUÍDA avança o watermark e zera a página; parcial/interrompida/inválida
            // guardam a página para retomar e mantêm o watermark anterior (nada de "ok" sem cobertura).
            $estadoColeta = $resultado['estado'] ?? 'concluida';
            $concluida = $estadoColeta === 'concluida';
            $situacao = !$concluida ? ($estadoColeta === 'invalida' ? 'erro' : 'parcial')
                : ($contagem['erros'] === 0 ? 'ok'
                : ($contagem['erros'] < $contagem['consultados'] * 0.1 ? 'atencao' : 'parcial'));
            if (!$concluida) {
                $this->repo->registrarErroSync($accountId, $recurso, null, 'COLETA_' . strtoupper($estadoColeta),
                    sprintf('coleta %s (página %d)', $estadoColeta, (int) ($resultado['ultima_pagina'] ?? 0)), null, 1, $correlationId);
            }

            $this->repo->salvarEstadoSync($accountId, $recurso, [
                'estrategia' => $estrategia,
                'situacao'   => $situacao,
                'pagina_atual' => $concluida ? 1 : max(1, (int) ($resultado['ultima_pagina'] ?? 0) + ($estadoColeta === 'invalida' ? 0 : 1)),
                'cursor_atual' => null,
                // DSHOW-106 (2): o cursor só avança com coleta concluída E nenhum item com falha (senão o incremental relê o mesmo trecho)
                'watermark'  => ($concluida && $contagem['erros'] === 0) ? $watermarkNovo : ($estadoAnterior['watermark'] ?? null),
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

            // RELEITURA DOS PEDIDOS (23/11): canais sincronizaram com sucesso pela 1ª vez depois de falha/escopo ausente/nunca →
            // agenda UMA reconciliação completa de pedidos (prioridade 60, a mais baixa) para os pedidos já gravados ganharem o canal.
            if ($recurso === 'canais' && $concluida && ($estadoAnterior['situacao'] ?? null) !== 'ok') {
                $this->repo->enfileirar($accountId, 'sync', 'pedidos', null,
                    ['estrategia' => 'reconciliacao', 'correlation_id' => $correlationId, 'motivo' => 'canais-disponiveis'], 60);
            }

            $this->repo->fecharJob($jobId, $estadoColeta === 'invalida' ? 'falhou' : 'concluido', $contagem,   // enum do job não tem 'parcial': o estado vai na mensagem
                sprintf('%d páginas, %d itens, coleta %s', $resultado['paginas'], $resultado['itens'], $estadoColeta));

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
            if (self::ehEscopoAusente($e)) {
                // BLING-ESCOPO-AUSENTE: registra UMA vez, marca e espera — sem 'erro' (que a fila reagendaria até a DLQ).
                $this->repo->salvarEstadoSync($accountId, $recurso, [
                    'estrategia' => $estrategia,
                    'situacao'   => 'atencao',
                    'ultima_execucao_em'  => gmdate('Y-m-d H:i:s'),
                    'proxima_execucao_em' => gmdate('Y-m-d H:i:s', time() + self::ESCOPO_NOVA_TENTATIVA_S),
                    'duracao_ms' => (int) ((microtime(true) - $inicio) * 1000),
                    'erros' => 1,
                    'retry' => 0,
                ]);
                $this->repo->fecharJob($jobId, 'cancelado', $contagem,
                    'escopo ausente (403 insufficient_scope): nova tentativa em 24 h ou após reautorizar a conta');
                $this->repo->registrarErroSync($accountId, $recurso, null, self::ESCOPO_AUSENTE,
                    'O token do Bling não tem o escopo deste recurso (403 insufficient_scope). Reautorize a conta incluindo o escopo; '
                    . 'até lá, uma tentativa por dia.', 403, 1, $correlationId);
                return ['recurso' => $recurso, 'situacao' => 'escopo_ausente'] + $contagem;
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
                'pedidos'            => ['dataAlteracaoInicial' => $desde],
                // 17/11/2026: /pedidos/compras não tem dataAlteracaoInicial (era ignorado); filtra por data do pedido.
                'compras'            => ['dataInicial' => $desde],
                'notas'              => ['dataEmissaoInicial'   => $desde],
                'pagar'              => ['dataVencimentoInicial'=> $desde],
                // 17/11/2026: /contas/receber não tem dataVencimentoInicial (era ignorado → caía no padrão do Bling:
                // emissão nos últimos 12 meses). Incremental = emitidas desde o watermark; mudanças de situação ficam
                // com a reconciliação diária (janela ampla, abaixo).
                'receber'            => ['tipoFiltroData' => 'E', 'dataInicial' => $desde, 'dataFinal' => date('Y-m-d')],
                default              => ['dataAlteracaoInicial' => $desde],
            };
        }
        if ($recurso === 'receber') {
            // Sem filtro o Bling devolve só EMISSÃO nos últimos 12 meses (padrão documentado de dataInicial/dataFinal).
            // Carga/reconciliação: por VENCIMENTO, de 2 anos atrás a 2 anos à frente (parcelas futuras incluídas).
            return ['tipoFiltroData' => 'V',
                    'dataInicial' => date('Y-m-d', strtotime('-2 years')),
                    'dataFinal'   => date('Y-m-d', strtotime('+2 years'))];
        }
        return [];
    }

    /** Id do tipo de contato "Fornecedor" (GET /contatos/tipos). Sem ele, a sincronização falha com motivo claro. */
    private function idTipoFornecedor(BlingClient $cliente): int
    {
        $r = $cliente->get('contatos/tipos');
        if (!$r->ok()) {
            throw new RuntimeException(sprintf('Falha ao obter tipos de contato (HTTP %d).', $r->status));
        }
        foreach (($r->corpo['data'] ?? []) as $t) {
            if (preg_match('/fornecedor/i', (string) ($t['descricao'] ?? '')) && (int) ($t['id'] ?? 0) > 0) {
                return (int) $t['id'];
            }
        }
        throw new RuntimeException('Tipo de contato "Fornecedor" não existe nesta conta do Bling.');
    }

    /**
     * Saldos de estoque: /estoques/saldos exige idsProdutos[] (máx. 100 por requisição com multiempresa).
     * Percorre os produtos JÁ sincronizados em lotes de 100 e entrega ao callback um item por produto×depósito.
     * @return array{paginas:int,itens:int,interrompido:bool}
     */
    private function paginarEstoque(BlingClient $cliente, int $accountId, callable $aCadaPagina): array
    {
        $st = $this->repo->pdo()->prepare('SELECT bling_id FROM bling_products WHERE account_id = ? ORDER BY id');
        $st->execute([$accountId]);
        $ids = array_values(array_filter(array_map('strval', $st->fetchAll(PDO::FETCH_COLUMN)), 'ctype_digit'));

        $pagina = 0; $total = 0;
        foreach (array_chunk($ids, 100) as $lote) {
            $pagina++;
            // Montado à mão: http_build_query geraria idsProdutos[0]=…; o formato documentado é idsProdutos[]=…
            $qs = implode('&', array_map(static fn($id) => 'idsProdutos%5B%5D=' . $id, $lote));
            $r = $cliente->get('estoques/saldos?' . $qs);
            if (!$r->ok()) {
                throw new RuntimeException(sprintf('Falha ao obter saldos (lote %d, HTTP %d): %s', $pagina, $r->status,
                    substr(json_encode($r->corpo, JSON_UNESCAPED_UNICODE) ?: '', 0, 300)));
            }
            $itens = [];
            foreach (($r->corpo['data'] ?? []) as $s) {
                $prod = ['id' => $s['produto']['id'] ?? null];
                $deps = is_array($s['depositos'] ?? null) ? $s['depositos'] : [];
                if ($deps === []) {
                    $itens[] = ['produto' => $prod, 'saldoFisico' => $s['saldoFisicoTotal'] ?? 0,
                                'reservado' => max(0, (float) ($s['saldoFisicoTotal'] ?? 0) - (float) ($s['saldoVirtualTotal'] ?? 0))];
                    continue;
                }
                foreach ($deps as $d) {
                    $itens[] = ['produto' => $prod, 'deposito' => ['id' => $d['id'] ?? null],
                                'saldoFisico' => $d['saldoFisico'] ?? 0,
                                'reservado' => max(0, (float) ($d['saldoFisico'] ?? 0) - (float) ($d['saldoVirtual'] ?? 0))];
                }
            }
            $total += count($itens);
            if ($itens !== [] && $aCadaPagina($itens, $pagina) === false) {
                return ['paginas' => $pagina, 'itens' => $total, 'interrompido' => true];
            }
        }
        return ['paginas' => $pagina, 'itens' => $total, 'interrompido' => false];
    }

    /**
     * Diagnóstico SÓ DE LEITURA: conta quantos registros o Bling devolve para um endpoint+filtro, sem gravar nada.
     * Usado pelo worker (--modo=diagnostico). Teto de páginas para não gastar o limite diário.
     * @return array{registros:int,paginas:int,truncado:bool,http:int}
     */
    public function contarSemGravar(int $accountId, string $endpoint, array $query, int $maxPaginas = 30): array
    {
        $cliente = $this->auth->cliente($accountId);
        $n = 0; $pag = 0; $http = 200;
        for ($pag = 1; $pag <= $maxPaginas; $pag++) {
            $r = $cliente->get($endpoint, $query + ['pagina' => $pag, 'limite' => 100]);
            $http = $r->status;
            if (!$r->ok()) { break; }
            $k = count($r->corpo['data'] ?? []);
            $n += $k;
            if ($k < 100) { return ['registros' => $n, 'paginas' => $pag, 'truncado' => false, 'http' => $http]; }
        }
        return ['registros' => $n, 'paginas' => min($pag, $maxPaginas), 'truncado' => $http === 200, 'http' => $http];
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
            'pedidos'      => $this->gravarPedido($accountId, $bruto, self::ORIGEM_LISTAGEM),   // a sincronização (e a fila/webhook) lê a LISTAGEM
            'compras'      => $this->gravarCompra($accountId, $bruto, self::ORIGEM_LISTAGEM),
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
                                 ?float $promo, ?float $custo): void   // DSHOW-018: null = custo não informado pelo Bling
    {
        $atual = $this->repo->consultar(
            'SELECT preco, preco_promocional, custo FROM bling_prices
              WHERE product_id = ? AND sales_channel_id IS NULL', [$productId]
        );
        $antes = $atual[0] ?? null;

        $mudou = $antes === null
            || abs((float) $antes['preco'] - $preco) > 0.001
            || ($custo !== null && ($antes['custo'] === null || abs((float) $antes['custo'] - $custo) > 0.001))   // DSHOW-018: omitido não é mudança
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
               preco_promocional = VALUES(preco_promocional), custo = COALESCE(VALUES(custo), custo),   /* DSHOW-018: omitido não apaga custo conhecido */
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

    private function gravarPedido(int $accountId, array $bruto, string $origem): string
    {
        // Codex DSHOW-113 (2): classificar ANTES de qualquer escrita — lista inválida rejeita o pedido inteiro (o SAVEPOINT do laço devolve o
        // estado anterior e o erro vai para bling_sync_errors; o watermark não avança → o incremental relê).
        $estadoItens = self::classificarItens($bruto, $origem);
        if ($estadoItens === 'invalida') { throw new UnexpectedValueException('itens do pedido inválidos ou incoerentes com o cabeçalho — substituição rejeitada, pedido não gravado'); }
        $d = BlingNormalizer::pedidoVenda($bruto);
        $itens = $d['itens'];
        $contatoBling = $d['contato_bling_id'];
        $canalBling = $d['canal_bling_id'];
        $situacaoBling = $d['situacao_bling'];
        unset($d['itens'], $d['contato_bling_id'], $d['canal_bling_id']);

        // "ausência ≠ zero" (achados 2 e 3 da ACIMA_ESQUERDA): campo que NÃO veio na resposta não entra no upsert (que só grava as chaves
        // enviadas) → o valor conhecido fica. A listagem do Bling não traz desconto, transporte nem vendedor (só o detalhe).
        foreach (['desconto', 'frete', 'vendedor', 'forma_pagamento'] as $k) {
            if (array_key_exists($k, $d) && $d[$k] === null) { unset($d[$k]); }
        }
        // data_pedido é NOT NULL sem default e o upsert é INSERT … ON DUPLICATE KEY UPDATE (o MySQL valida o INSERT antes): sem data na resposta,
        // REPÕE a data conhecida; pedido novo sem data = erro registrado (nunca "hoje" no lugar)
        if ($d['data_pedido'] === null) {
            $conhecida = $this->repo->consultar('SELECT data_pedido FROM bling_sales_orders WHERE account_id = ? AND bling_id = ?', [$accountId, $d['bling_id']]);
            if ($conhecida === []) { throw new UnexpectedValueException('pedido novo sem data legível — não gravado (nunca "hoje" no lugar)'); }
            $d['data_pedido'] = (string) $conhecida[0]['data_pedido'];
        }
        $d['contact_id'] = $this->repo->idPorBlingId('bling_contacts', $accountId, $contatoBling);
        $d['sales_channel_id'] = $this->repo->idPorBlingId('bling_sales_channels', $accountId, $canalBling);
        // DSHOW-106 (2): guarda o identificador EXTERNO da loja (coluna criada pela migração 20261123; sem ela, segue sem gravar)
        if ($this->repo->temColuna('bling_sales_orders', 'loja_bling_id')) {
            $d['loja_bling_id'] = $canalBling;
        }
        // PORTÃO BLING SITUAÇÃO: sem a coluna (antes da migração 20261123-situacao), simplesmente não grava; id ausente na resposta
        // nunca apaga um id já conhecido.
        if (!$this->repo->temColuna('bling_sales_orders', 'situacao_bling_id')) {
            unset($d['situacao_bling_id']);
        } elseif ($d['situacao_bling_id'] === null) {
            $conhecido = $this->repo->consultar('SELECT situacao_bling_id FROM bling_sales_orders WHERE account_id = ? AND bling_id = ?',
                [$accountId, $d['bling_id']]);
            if (($conhecido[0]['situacao_bling_id'] ?? null) !== null) { $d['situacao_bling_id'] = (string) $conhecido[0]['situacao_bling_id']; }
        }
        // DSHOW-106 (2): resolução que FALHOU nunca troca uma associação válida por NULL
        $assoc = $this->repo->consultar('SELECT contact_id, sales_channel_id FROM bling_sales_orders WHERE account_id = ? AND bling_id = ?',
            [$accountId, $d['bling_id']]);
        if ($assoc !== []) {
            if ($d['sales_channel_id'] === null && $assoc[0]['sales_channel_id'] !== null) { $d['sales_channel_id'] = (int) $assoc[0]['sales_channel_id']; }
            if ($d['contact_id'] === null && $assoc[0]['contact_id'] !== null) { $d['contact_id'] = (int) $assoc[0]['contact_id']; }
        }
        $d['situacao'] = BlingVersionAdapter::situacaoPedido($situacaoBling);

        // Subtotal e custo saem dos ITENS, não do cabeçalho: o Bling nem sempre
        // manda os dois, e a coerência com o grid depende de bater com a soma.
        // RESPOSTA SEM ITENS (23/11 noite, risco da 711fcedc:700): a listagem do Bling não traz itens. Sem itens na resposta, NÃO se apaga
        // item gravado nem se zera subtotal/custo/qtd_itens: essas colunas ficam fora do UPDATE (o upsert só grava as chaves enviadas) e o
        // total do cabeçalho não é recalculado a partir de uma soma vazia. Ausência de itens = "não informado", nunca "zero itens".
        // Codex DSHOW-112: "campo ausente" ≠ "lista vazia" (aceite próprio). Ausente → nada muda; vazia confirmada → zero itens.
        $temItens = $estadoItens === 'com_itens';
        // "ausência ≠ zero" (24/11, opção B): o carimbo só existe quando os itens vieram de coleção COMPLETA; sem ele, subtotal/custo/qtd são
        // desconhecidos para quem lê (BlingReal devolve null). Sem a coluna (antes da migração 20261124) nada muda na gravação.
        if (($temItens || $estadoItens === 'vazia') && $this->repo->temColuna('bling_sales_orders', 'itens_lidos_em')) {
            $d['itens_lidos_em'] = gmdate('Y-m-d H:i:s');
        }
        if ($estadoItens === 'vazia') {
            $d['subtotal'] = 0.0; $d['custo_total'] = 0.0; $d['qtd_itens'] = 0;    // o Bling CONFIRMOU: pedido sem itens
            if ($d['total'] <= 0) { unset($d['total']); }
        } elseif ($temItens) {
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
                if (array_key_exists('desconto', $d) && array_key_exists('frete', $d)) {
                    $d['total'] = round($subtotal - $d['desconto'] + $d['frete'], 2);
                } else {
                    unset($d['total']);   // sem desconto/frete conhecidos não se deriva o total (mantém o gravado)
                }
            }
        } else {
            unset($d['subtotal'], $d['custo_total'], $d['qtd_itens']);
            if ($d['total'] <= 0) {
                unset($d['total']);   // cabeçalho sem total e sem itens: mantém o total já gravado (pedido novo fica com o padrão da tabela)
            }
        }

        // Situação mudou? Registra na timeline (§21.1) antes de sobrescrever.
        $anterior = $this->repo->consultar(
            'SELECT id, situacao FROM bling_sales_orders WHERE account_id = ? AND bling_id = ?',
            [$accountId, $d['bling_id']]
        );

        // CORREÇÃO DO HASH (23/11): o hash era só do JSON cru → um pedido igual era 'ignorado' e NUNCA ganhava o canal (ou o contato)
        // resolvido depois. Agora o hash inclui as referências RESOLVIDAS: quando o canal/contato passa a existir, o pedido é regravado
        // normalmente. Efeito único após a entrega: a 1ª releitura regrava cada pedido uma vez (hash novo).
        // DSHOW-106: com a coluna loja_bling_id criada, o hash muda uma vez → a releitura grava a loja também nos pedidos antigos
        $d['payload_hash'] = md5($d['payload_hash'] . '|canal=' . ($d['sales_channel_id'] ?? '') . '|contato=' . ($d['contact_id'] ?? '')
            . (array_key_exists('loja_bling_id', $d) ? '|loja=' . ($d['loja_bling_id'] ?? '') : '')
            . (array_key_exists('situacao_bling_id', $d) ? '|sitid=' . ($d['situacao_bling_id'] ?? '') : '')   // muda 1x após a migração → a releitura grava
            . (array_key_exists('itens_lidos_em', $d) ? '|itens=completos' : ''));   // "ausência ≠ zero": só o detalhe muda o hash (nada de regravação em massa)
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
            if ($estadoItens === 'com_itens' || $estadoItens === 'vazia') {   // só coleção COMPLETA substitui; ausente/preservar = nenhum DELETE
                $this->gravarItens($accountId, $pedidoId, $itens, $estadoItens === 'vazia');
            }
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
     * Itens: apaga e regrava — SÓ com uma lista NÃO VAZIA de itens na resposta.
     *
     * Merge item a item exigiria id estável do item, que nem todo endpoint do
     * Bling devolve. Apagar e regravar dentro da transação do pedido é mais
     * simples e não deixa item fantasma de uma versão anterior do pedido.
     * Lista vazia = resposta SEM itens (a listagem não os traz): nada é apagado (23/11 noite).
     */
    public const ORIGEM_LISTAGEM = 'listagem';
    public const ORIGEM_DETALHE = 'detalhe';

    /**
     * Codex DSHOW-113 (2) — classificador CONSERVADOR de completude dos itens (substitui o estadoItens do DSHOW-112).
     * Contrato (OpenAPI oficial do Bling v3, conferido em 24/11/2026): a LISTAGEM (`GET pedidos/vendas`, `VendasDadosBaseDTO`) NUNCA traz itens;
     * só o DETALHE (`GET pedidos/vendas/{id}`, `VendasDadosDTO`) traz a coleção `itens` COMPLETA. Por isso só a origem 'detalhe' prova completude.
     *  'ausente'   = o campo não veio → preserva.
     *  'preservar' = veio, mas não há contrato de coleção completa (qualquer coisa vinda da listagem; null; `[]` sem prova) → preserva.
     *                A ausência de totalProdutos não prova nada.
     *  'invalida'  = DETALHE com lista que não é lista, com algum item inválido (parcialmente inválida) ou `[]` contradizendo totalProdutos > 0
     *                → rejeita a substituição (o pedido não é gravado; erro registrado).
     *  'com_itens' = DETALHE com lista completa e TODOS os itens válidos → atualiza (apaga e regrava).
     *  'vazia'     = DETALHE com `[]` E totalProdutos presente e = 0 (o contrato justifica) → esvazia.
     * @return 'ausente'|'preservar'|'invalida'|'com_itens'|'vazia'
     */
    public static function classificarItens(array $bruto, string $origem): string
    {
        if ($origem !== self::ORIGEM_LISTAGEM && $origem !== self::ORIGEM_DETALHE) { throw new InvalidArgumentException('origem de itens desconhecida'); }
        $chave = array_key_exists('itens', $bruto) ? 'itens' : (array_key_exists('items', $bruto) ? 'items' : null);
        if ($chave === null) { return 'ausente'; }
        if ($origem !== self::ORIGEM_DETALHE) { return 'preservar'; }      // sem contrato de coleção completa, nada substitui
        $lista = $bruto[$chave];
        if ($lista === null) { return 'preservar'; }
        if (!is_array($lista) || !array_is_list($lista)) { return 'invalida'; }
        if ($lista === []) {
            $tp = $bruto['totalProdutos'] ?? null;
            if (!self::numeroValido($tp)) { return 'preservar'; }            // sem total de produtos, [] não prova "zero itens"
            return (float) $tp == 0.0 ? 'vazia' : 'invalida';               // [] com totalProdutos > 0: contradição
        }
        foreach ($lista as $i) {
            if (!self::itemValido($i)) { return 'invalida'; }                // parcialmente inválida = nenhuma substituição
        }
        return 'com_itens';
    }

    private static function numeroValido(mixed $v): bool
    {
        return is_int($v) || (is_float($v) && is_finite($v)) || (is_string($v) && is_numeric(trim($v)));
    }

    /** Item legível do detalhe: quantidade > 0, valor unitário ≥ 0 e alguma identificação (produto.id, código ou descrição). */
    private static function itemValido(mixed $i): bool
    {
        if (!is_array($i)) { return false; }
        $q = $i['quantidade'] ?? null;
        if (!self::numeroValido($q) || (float) $q <= 0) { return false; }
        $u = $i['valor'] ?? $i['valorUnitario'] ?? $i['preco'] ?? null;
        if (!self::numeroValido($u) || (float) $u < 0) { return false; }
        $pid = $i['produto']['id'] ?? $i['idProduto'] ?? null;
        $temId = (is_int($pid) && $pid > 0) || (is_string($pid) && ctype_digit($pid) && $pid !== '0');
        $texto = static fn($x) => is_string($x) && trim($x) !== '';
        return $temId || $texto($i['codigo'] ?? null) || $texto($i['descricao'] ?? null);
    }

    /**
     * Grava UM pedido vindo do DETALHE (`GET pedidos/vendas/{id}`) — o único contrato que prova coleção de itens completa.
     * Transação própria: lista inválida/incoerente → nada gravado, erro em bling_sync_errors (recurso 'pedidos', código DETALHE) e exceção.
     * Nenhum caminho de produção chama isto hoje (a sincronização lê a listagem); é o ponto de entrada do contrato completo.
     * @return 'criado'|'atualizado'|'ignorado'
     */
    public function gravarPedidoDetalhe(int $accountId, array $detalhe): string
    {
        $pdo = $this->repo->pdo();
        $pdo->beginTransaction();
        try {
            $r = $this->gravarPedido($accountId, $detalhe, self::ORIGEM_DETALHE);
            $pdo->commit();
            return $r;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) { $pdo->rollBack(); }
            $id = $detalhe['id'] ?? null;
            $this->repo->registrarErroSync($accountId, 'pedidos', (is_int($id) || (is_string($id) && ctype_digit($id))) ? (string) $id : null,
                'DETALHE', $e->getMessage(), null, 1, 'detalhe');
            throw $e;
        }
    }

    private function gravarItens(int $accountId, int $pedidoId, array $itens, bool $vaziaConfirmada = false): void
    {
        if ($itens === [] && !$vaziaConfirmada) {
            return;   // nunca apaga sem ter o que gravar no lugar, salvo lista vazia CONFIRMADA (Codex DSHOW-112)
        }
        $this->repo->pdo()->prepare('DELETE FROM bling_sales_order_items WHERE sales_order_id = ?')
            ->execute([$pedidoId]);

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

    private function gravarCompra(int $accountId, array $bruto, string $origem): string
    {
        $estadoItens = self::classificarItens($bruto, $origem);   // mesma regra conservadora dos pedidos de venda (Codex DSHOW-113)
        if ($estadoItens === 'invalida') { throw new UnexpectedValueException('itens da compra inválidos ou incoerentes — substituição rejeitada, compra não gravada'); }
        $d = BlingNormalizer::pedidoCompra($bruto);
        $itens = $d['itens'];
        $fornBling = $d['fornecedor_bling_id'];
        $situacaoBling = $d['situacao_bling'];
        unset($d['itens'], $d['fornecedor_bling_id']);

        $d['supplier_id'] = $this->repo->idPorBlingId('bling_suppliers', $accountId, $fornBling);
        $d['situacao'] = BlingVersionAdapter::situacaoCompra($situacaoBling);
        $substitui = $estadoItens === 'com_itens' || $estadoItens === 'vazia';
        if ($substitui && $this->repo->temColuna('bling_purchase_orders', 'itens_lidos_em')) {
            $d['itens_lidos_em'] = gmdate('Y-m-d H:i:s');   // "ausência ≠ zero": só coleção completa torna qtd_itens/qtd_total conhecidos
            $d['payload_hash'] = md5($d['payload_hash'] . '|itens=completos');   // senão um hash igual pularia o UPDATE e o carimbo não entraria
        }
        if ($substitui) {
            $d['qtd_itens'] = count($itens);
            $d['qtd_total'] = array_sum(array_column($itens, 'quantidade'));
        }
        // achado 2: nada no Bling informa a quantidade recebida — o 0 fixo virava "Recebido 0 / parcial". Não grava (a leitura devolve null).
        if (array_key_exists('valor', $d) && $d['valor'] === null) { unset($d['valor']); }   // ausência nunca sobrescreve o conhecido
        if ($d['data_emissao'] === null) {   // NOT NULL sem default: repõe a conhecida; compra nova sem data = erro (nunca "hoje")
            $conhecida = $this->repo->consultar('SELECT data_emissao FROM bling_purchase_orders WHERE account_id = ? AND bling_id = ?', [$accountId, $d['bling_id']]);
            if ($conhecida === []) { throw new UnexpectedValueException('compra nova sem data legível — não gravada (nunca "hoje" no lugar)'); }
            $d['data_emissao'] = (string) $conhecida[0]['data_emissao'];
        }

        $r = $this->repo->upsert('bling_purchase_orders', $accountId, $d);
        $compraId = $this->repo->idPorBlingId('bling_purchase_orders', $accountId, $d['bling_id']);

        if ($compraId !== null && $substitui) {
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

    // ─────────────────────────────────────────────────────────────
    // PORTÃO BLING SITUAÇÃO (ACIMA_DIREITA, 23/11/2026) — releitura única dos pedidos e lista de situações do módulo de vendas.
    // Só LEITURA no Bling (GET). Grava pelo MESMO gravarPedido da sincronização normal (mesmo hash, mesma regra de associação).
    // Progresso próprio em bling_sync_state (recurso 'releitura_situacao') — não mexe no estado da sincronização de 'pedidos'.

    public const RECURSO_RELEITURA = 'releitura_situacao';

    /**
     * Relê TODOS os pedidos de venda pela listagem (páginas de 100), em ritmo baixo, retomando da última página gravada.
     * @param Closure():bool $parar  consultado entre páginas (arquivo de parada, sinal…) — true = para e deixa 'parcial'
     * @param Closure(int):void $dormir  pausa entre páginas, em ms
     * @return array{situacao:string, paginas:int, consultados:int, criados:int, atualizados:int, ignorados:int, erros:int, pagina_inicial:int}
     */
    public function releituraPedidos(int $accountId, Closure $parar, Closure $dormir, int $pausaMs = 1500, int $maxPaginas = 500): array
    {
        if (!$this->repo->temColuna('bling_sales_orders', 'situacao_bling_id') || !$this->repo->temColuna('bling_sales_orders', 'loja_bling_id')) {
            return ['situacao' => 'sem_coluna', 'paginas' => 0, 'consultados' => 0, 'criados' => 0, 'atualizados' => 0, 'ignorados' => 0, 'erros' => 0, 'pagina_inicial' => 0];
        }
        $est = $this->repo->estadoSync($accountId, self::RECURSO_RELEITURA);
        $paginaInicial = ($est && $est['situacao'] === 'parcial') ? max(1, (int) $est['pagina_atual']) : 1;
        $c = ['consultados' => 0, 'criados' => 0, 'atualizados' => 0, 'ignorados' => 0, 'ausentes' => 0, 'erros' => 0];
        $paginas = 0; $parou = false;
        $cliente = $this->auth->cliente($accountId);
        $this->repo->salvarEstadoSync($accountId, self::RECURSO_RELEITURA, ['estrategia' => 'carga_inicial', 'situacao' => 'parcial',
            'pagina_atual' => $paginaInicial, 'ultima_execucao_em' => gmdate('Y-m-d H:i:s')]);
        try {
            $r = $cliente->paginar(self::RECURSOS['pedidos']['endpoint'], [],
                function (array $itens, int $pagina) use ($accountId, &$c, &$paginas, &$parou, $parar, $dormir, $pausaMs) {
                    $this->repo->pdo()->beginTransaction();
                    $erros = [];
                    foreach ($itens as $bruto) {
                        $c['consultados']++;
                        $this->repo->pdo()->exec('SAVEPOINT bling_item');
                        try {
                            // Codex DSHOW-111 (A2): a releitura NUNCA passa pela gravação completa (que apagaria itens e recalcularia valores).
                            $res = $this->gravarSituacaoLoja($accountId, $bruto);
                            $c[match ($res) { 'atualizado' => 'atualizados', 'ausente' => 'ausentes', default => 'ignorados' }]++;
                            $this->repo->pdo()->exec('RELEASE SAVEPOINT bling_item');
                        } catch (Throwable $e) {
                            $this->repo->pdo()->exec('ROLLBACK TO SAVEPOINT bling_item');
                            $c['erros']++;
                            $erros[] = [is_array($bruto) ? (string) ($bruto['id'] ?? '') : null, $e->getMessage()];
                        }
                    }
                    $this->repo->salvarEstadoSync($accountId, self::RECURSO_RELEITURA, ['estrategia' => 'carga_inicial', 'situacao' => 'parcial',
                        'pagina_atual' => $pagina, 'registros_consultados' => $c['consultados'], 'registros_atualizados' => $c['atualizados'],
                        'registros_criados' => $c['criados'], 'registros_ignorados' => $c['ignorados'], 'erros' => $c['erros']]);
                    $this->repo->pdo()->commit();
                    foreach ($erros as [$id, $msg]) {
                        $this->repo->registrarErroSync($accountId, self::RECURSO_RELEITURA, $id, 'NORMALIZACAO', $msg, null, 1, 'releitura-situacao');
                    }
                    $paginas++;
                    if (count($itens) < 100) { return null; }            // última página: fim natural
                    if ($parar()) { $parou = true; return false; }
                    $dormir($pausaMs);                                    // ritmo baixo: uma página por vez, com pausa
                    return null;
                }, 100, $maxPaginas, $paginaInicial);
        } catch (Throwable $e) {
            // falha de rede/HTTP depois das tentativas do cliente: fica 'parcial' na página gravada; rodar de novo retoma dali
            return ['situacao' => 'erro', 'erro' => $e->getMessage(), 'paginas' => $paginas, 'pagina_inicial' => $paginaInicial] + $c;
        }
        $concluida = !$parou && ($r['estado'] ?? '') === 'concluida';
        $this->repo->salvarEstadoSync($accountId, self::RECURSO_RELEITURA, ['situacao' => $concluida ? 'ok' : 'parcial',
            'watermark' => $concluida ? gmdate('Y-m-d H:i:s') : null]);
        // PARA-STATUS §132 (P2): terminar a passada com erro NÃO é "concluida" — o script sai com rc 1 e não contradiz o fechamento do portão.
        // O checkpoint fica 'ok' (a passada terminou; rodar de novo NÃO retoma, releria tudo) — os afetados vão pelo modo --pedidos.
        // Codex DSHOW-113 (P2): parada a pedido DEPOIS de erro nesta execução também não é sucesso → 'interrompida_com_erros' (o script sai com rc 1);
        // o checkpoint continua 'parcial' (rodar de novo retoma da página gravada) e os erros já estão em bling_sync_errors.
        return ['situacao' => $concluida ? ($c['erros'] > 0 ? 'concluida_com_erros' : 'concluida')
                                         : ($parou ? ($c['erros'] > 0 ? 'interrompida_com_erros' : 'interrompida') : (string) ($r['estado'] ?? 'parcial')),
                'paginas' => $paginas, 'pagina_inicial' => $paginaInicial] + $c;
    }

    public const RECURSO_REPROCESSO = 'releitura_situacao_pedidos';
    public const MAX_PEDIDOS_REPROCESSO = 1000;

    /**
     * Codex DSHOW-112 (4) / PARA-STATUS §132: relê SÓ os pedidos indicados — um GET pedidos/vendas/{id} por pedido, um por vez, com pausa —
     * e grava pelo MESMO gravarSituacaoLoja da releitura (só situacao_bling_id e loja_bling_id, COALESCE; pedido ausente não é criado).
     * - NÃO lê nem grava o checkpoint da releitura inteira (RECURSO_RELEITURA): o resultado desta execução fica em RECURSO_REPROCESSO.
     * - Erros vão para bling_sync_errors com recurso RECURSO_RELEITURA (é por ali que o fechamento do portão lista os afetados).
     * - Falha fechada: 404, HTTP ≠ 2xx, corpo sem `data` ou `data.id` diferente do pedido pedido = ERRO daquele pedido (nada gravado nele).
     * @param list<string> $ids  ids do Bling, só dígitos, sem repetição, 1..MAX_PEDIDOS_REPROCESSO
     * @return array{situacao:string, pedidos:int, consultados:int, atualizados:int, ignorados:int, ausentes:int, erros:int, afetados_com_erro:list<string>}
     */
    public function releituraPedidosIds(int $accountId, array $ids, Closure $parar, Closure $dormir, int $pausaMs = 1500): array
    {
        $ids = array_values($ids);
        if ($ids === [] || count($ids) > self::MAX_PEDIDOS_REPROCESSO || count(array_unique($ids)) !== count($ids)) {
            throw new InvalidArgumentException('lista de pedidos vazia, repetida ou acima de ' . self::MAX_PEDIDOS_REPROCESSO);
        }
        foreach ($ids as $id) {
            if (!is_string($id) || !preg_match('/^[1-9][0-9]{0,19}$/', $id)) { throw new InvalidArgumentException('id de pedido inválido'); }
        }
        $c = ['pedidos' => count($ids), 'consultados' => 0, 'atualizados' => 0, 'ignorados' => 0, 'ausentes' => 0, 'erros' => 0];
        if (!$this->repo->temColuna('bling_sales_orders', 'situacao_bling_id') || !$this->repo->temColuna('bling_sales_orders', 'loja_bling_id')) {
            return ['situacao' => 'sem_coluna', 'afetados_com_erro' => []] + $c;
        }
        $cliente = $this->auth->cliente($accountId);
        $endpoint = self::RECURSOS['pedidos']['endpoint'];
        $this->repo->salvarEstadoSync($accountId, self::RECURSO_REPROCESSO, ['estrategia' => 'carga_inicial', 'situacao' => 'parcial', 'pagina_atual' => 0,
            'registros_consultados' => 0, 'registros_atualizados' => 0, 'registros_ignorados' => 0, 'erros' => 0, 'ultima_execucao_em' => gmdate('Y-m-d H:i:s')]);
        $comErro = []; $parou = false;
        foreach ($ids as $i => $id) {
            if ($i > 0) {
                if ($parar()) { $parou = true; break; }
                $dormir($pausaMs);
            }
            $c['consultados']++;
            $erro = null; $http = null;
            try {
                $r = $cliente->get($endpoint . '/' . $id);
                $http = $r->status;
                $d = is_array($r->corpo) ? ($r->corpo['data'] ?? null) : null;
                if ($r->status === 404) { $erro = 'pedido não encontrado no Bling (404)'; }
                elseif (!$r->ok()) { $erro = 'Bling respondeu HTTP ' . $r->status; }
                elseif (!is_array($d) || (string) ($d['id'] ?? '') !== $id) { $erro = 'resposta sem o pedido pedido (data.id ausente ou diferente)'; }
                else {
                    $this->repo->pdo()->beginTransaction();
                    try {
                        $res = $this->gravarSituacaoLoja($accountId, $d);
                        $this->repo->pdo()->commit();
                        $c[match ($res) { 'atualizado' => 'atualizados', 'ausente' => 'ausentes', default => 'ignorados' }]++;
                    } catch (Throwable $e) {
                        if ($this->repo->pdo()->inTransaction()) { $this->repo->pdo()->rollBack(); }
                        $erro = $e->getMessage();
                    }
                }
            } catch (Throwable $e) {
                $erro = 'falha ao consultar o Bling: ' . $e->getMessage();
            }
            if ($erro !== null) {
                $c['erros']++; $comErro[] = $id;
                $this->repo->registrarErroSync($accountId, self::RECURSO_RELEITURA, $id, 'REPROCESSO', $erro, $http, 1, 'releitura-pedidos');
            }
            $this->repo->salvarEstadoSync($accountId, self::RECURSO_REPROCESSO, ['pagina_atual' => $c['consultados'], 'registros_consultados' => $c['consultados'],
                'registros_atualizados' => $c['atualizados'], 'registros_ignorados' => $c['ignorados'], 'erros' => $c['erros']]);
        }
        // Codex DSHOW-113 (P2): erro seguido de parada voluntária = 'interrompida_com_erros' (falha), com o estado do reprocesso em 'erro'
        $situacao = $parou ? ($c['erros'] > 0 ? 'interrompida_com_erros' : 'interrompida') : ($c['erros'] > 0 ? 'concluida_com_erros' : 'concluida');
        $this->repo->salvarEstadoSync($accountId, self::RECURSO_REPROCESSO, ['situacao' => $situacao === 'concluida' ? 'ok' : ($situacao === 'interrompida' ? 'parcial' : 'erro'),
            'watermark' => $situacao === 'concluida' ? gmdate('Y-m-d H:i:s') : null]);
        return ['situacao' => $situacao, 'afetados_com_erro' => $comErro] + $c;
    }

    /**
     * Codex DSHOW-111 (A2): caminho EXCLUSIVO da releitura. Lê do item da LISTAGEM só `id`, `situacao.id` e `loja.id` e faz UM UPDATE
     * nas duas colunas — nunca toca em itens, quantidades, valores, desconto, frete, totais, custo, hash, contato, canal, situação interna
     * ou histórico. Pedido que não existe na base NÃO é criado (conta como 'ausente'; a sincronização normal é quem cria pedidos).
     * Valor ausente na resposta nunca apaga o conhecido (COALESCE).
     * @return 'atualizado'|'ignorado'|'ausente'
     */
    private function gravarSituacaoLoja(int $accountId, array $bruto): string
    {
        $blingId = isset($bruto['id']) && (is_int($bruto['id']) || (is_string($bruto['id']) && ctype_digit($bruto['id']))) ? (string) $bruto['id'] : null;
        if ($blingId === null) { throw new InvalidArgumentException('pedido sem id na listagem'); }
        $sit = $bruto['situacao']['id'] ?? null;
        $sit = (is_int($sit) || (is_string($sit) && ctype_digit($sit))) ? (string) $sit : null;
        $loja = $bruto['loja']['id'] ?? null;
        $loja = (is_int($loja) || (is_string($loja) && ctype_digit($loja))) ? (string) $loja : null;
        $existe = $this->repo->consultar('SELECT situacao_bling_id, loja_bling_id FROM bling_sales_orders WHERE account_id = ? AND bling_id = ?', [$accountId, $blingId]);
        if ($existe === []) { return 'ausente'; }
        $novoSit = $sit ?? $existe[0]['situacao_bling_id']; $novaLoja = $loja ?? $existe[0]['loja_bling_id'];
        if ((string) $novoSit === (string) $existe[0]['situacao_bling_id'] && (string) $novaLoja === (string) $existe[0]['loja_bling_id']) { return 'ignorado'; }
        $this->repo->pdo()->prepare('UPDATE bling_sales_orders SET situacao_bling_id = COALESCE(?, situacao_bling_id), loja_bling_id = COALESCE(?, loja_bling_id)
                                      WHERE account_id = ? AND bling_id = ?')->execute([$sit, $loja, $accountId, $blingId]);
        return 'atualizado';
    }

    /**
     * Lista de situações do MÓDULO DE VENDAS (id e nome), para o Jhony escolher quais significam "finalizado".
     * 2 GETs: situacoes/modulos → acha o módulo de vendas → situacoes/modulos/{id}. 403 = escopo ausente: só informa (sem reautorizar, sem repetir).
     * Grava em bling_situacoes quando a tabela existe (migração 20261123-situacao); senão só devolve.
     */
    public function lerSituacoesVendas(int $accountId): array
    {
        $cliente = $this->auth->cliente($accountId);
        $m = $cliente->get('situacoes/modulos');
        if ($m->status === 403) { return ['situacao' => 'escopo_ausente', 'etapa' => 'situacoes/modulos', 'http' => 403]; }
        if (!$m->ok() || !is_array($m->corpo['data'] ?? null)) { return ['situacao' => 'erro', 'etapa' => 'situacoes/modulos', 'http' => $m->status]; }
        $modulos = $m->corpo['data'];
        $vendas = null;
        foreach ($modulos as $mod) {
            $nome = mb_strtolower(trim((string) ($mod['nome'] ?? '')));
            if ($nome === 'vendas' || $nome === 'pedidos de venda' || $nome === 'pedidos de vendas') { $vendas = $mod; break; }
        }
        if ($vendas === null) {
            return ['situacao' => 'modulo_nao_encontrado', 'modulos' => array_map(static fn($x) => ['id' => (string) ($x['id'] ?? ''), 'nome' => (string) ($x['nome'] ?? '')], $modulos)];
        }
        $idModulo = (string) ($vendas['id'] ?? '');
        if (!preg_match('/^[0-9]{1,20}$/', $idModulo)) { return ['situacao' => 'erro', 'etapa' => 'id do módulo inválido']; }
        $s = $cliente->get('situacoes/modulos/' . $idModulo);
        if ($s->status === 403) { return ['situacao' => 'escopo_ausente', 'etapa' => 'situacoes/modulos/{id}', 'http' => 403]; }
        if (!$s->ok() || !is_array($s->corpo['data'] ?? null)) { return ['situacao' => 'erro', 'etapa' => 'situacoes/modulos/{id}', 'http' => $s->status]; }
        $lista = [];
        foreach ($s->corpo['data'] as $x) {
            $id = (string) ($x['id'] ?? '');
            if (!preg_match('/^[0-9]{1,20}$/', $id)) { continue; }
            $lista[] = ['id' => $id, 'nome' => mb_substr((string) ($x['nome'] ?? ''), 0, 120),
                        'id_herdado' => isset($x['idHerdado']) ? (string) $x['idHerdado'] : null, 'cor' => isset($x['cor']) ? mb_substr((string) $x['cor'], 0, 16) : null];
        }
        if ($this->repo->temColuna('bling_situacoes', 'situacao_id')) {
            $st = $this->repo->pdo()->prepare('INSERT INTO bling_situacoes (account_id, modulo_id, modulo_nome, situacao_id, nome, id_herdado, cor, lido_em)
                VALUES (?,?,?,?,?,?,?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE modulo_id=VALUES(modulo_id), modulo_nome=VALUES(modulo_nome), nome=VALUES(nome),
                id_herdado=VALUES(id_herdado), cor=VALUES(cor), lido_em=VALUES(lido_em)');
            foreach ($lista as $x) { $st->execute([$accountId, $idModulo, mb_substr((string) ($vendas['nome'] ?? ''), 0, 80), $x['id'], $x['nome'], $x['id_herdado'], $x['cor']]); }
        }
        return ['situacao' => 'ok', 'modulo' => ['id' => $idModulo, 'nome' => (string) ($vendas['nome'] ?? '')], 'situacoes' => $lista];
    }

    /** Contagem antes/depois da releitura (só SELECT no banco local). */
    public function contagemSituacao(int $accountId): array
    {
        $temId = $this->repo->temColuna('bling_sales_orders', 'situacao_bling_id');
        $temLoja = $this->repo->temColuna('bling_sales_orders', 'loja_bling_id');
        $q = 'SELECT COUNT(*) pedidos, COALESCE(SUM(total),0) valor'
           . ($temId ? ', SUM(situacao_bling_id IS NOT NULL) com_situacao_id' : '')
           . ($temLoja ? ', SUM(loja_bling_id IS NOT NULL) com_loja' : '')
           . ' FROM bling_sales_orders WHERE account_id = ? AND deletado_em IS NULL';
        $base = $this->repo->consultar($q, [$accountId])[0] ?? [];
        $out = ['tem_coluna_situacao_id' => $temId, 'tem_coluna_loja' => $temLoja, 'pedidos' => (int) ($base['pedidos'] ?? 0), 'valor' => (string) ($base['valor'] ?? '0'),
                'com_situacao_id' => $temId ? (int) $base['com_situacao_id'] : null, 'com_loja' => $temLoja ? (int) $base['com_loja'] : null,
                'por_valor_antigo' => $this->repo->consultar('SELECT situacao_bling cod, COUNT(*) n FROM bling_sales_orders WHERE account_id = ? AND deletado_em IS NULL GROUP BY 1 ORDER BY 1', [$accountId])];
        if ($temId) {
            $out['por_situacao_id'] = $this->repo->consultar('SELECT situacao_bling_id id, COUNT(*) n, COALESCE(SUM(total),0) valor FROM bling_sales_orders WHERE account_id = ? AND deletado_em IS NULL GROUP BY 1 ORDER BY 2 DESC', [$accountId]);
        }
        $est = $this->repo->estadoSync($accountId, self::RECURSO_RELEITURA);
        $out['releitura'] = $est ? ['situacao' => $est['situacao'], 'pagina_atual' => (int) $est['pagina_atual']] : null;
        return $out;
    }
}
