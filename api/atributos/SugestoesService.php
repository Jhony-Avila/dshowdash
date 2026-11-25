<?php
// /api/atributos/SugestoesService.php — decisão das SUGESTÕES e da CONFERÊNCIA (missão §11.9, D5, D10): nada vira valor sem decisão humana.
// Aceitar = grava pelo AtributosService (validação, unidade, versão, auditoria) e marca a sugestão; recusar = só marca. O destino pode ser
// o atributo alternativo (D5: Profundidade × Comprimento). "Vincular" inclui o atributo como avulso quando ele não está na ficha.
declare(strict_types=1);

require_once __DIR__ . '/KitsService.php';

interface SugestoesRepositorio
{
    public function sugestao(int $id, bool $travar = false): ?array;
    public function decidirSugestao(int $id, int $versao, string $estado, string $usuario, ?string $motivo): bool;
}

/** Parte C (013): estados ignorada/substituida, sucessora, decisor estável. Interface à parte: os repositórios em memória não mudam. */
interface SugestoesDecisoes
{
    public function temEstadosSugestao(): bool;
    public function transicionarSugestao(int $id, int $versao, string $de, string $para, string $usuario, ?int $usuarioId, ?string $motivo, bool $limparDecisor): bool;
    public function temSucessora(int $id): bool;
    public function carimbarDecisor(int $id, int $usuarioId): void;
}

final class SugestoesService
{
    public const MAX_LOTE = 200;
    /** DSHOW-108 (A): o lote da Conferência é a PÁGINA (contrato: 50). Limite próprio, validado ANTES de reservar a chave (nada é escrito). */
    public const MAX_LOTE_DECIDIR = 50;
    /** Parte C: ação → [estado de origem, estado de destino, ação de auditoria]. Aceitar usa o caminho de sempre (decidir). */
    public const ACOES = [
        'aceitar'  => ['pendente', 'aceita', 'aceitar_sugestao'],
        'recusar'  => ['pendente', 'recusada', 'recusar_sugestao'],
        'ignorar'  => ['pendente', 'ignorada', 'ignorar_sugestao'],
        'devolver' => ['ignorada', 'pendente', 'devolver_sugestao'],
        'reabrir'  => ['recusada', 'pendente', 'reabrir_sugestao'],   // Q-SUG.6: só administrador, motivo obrigatório
    ];
    /** Erros de banco que são TÉCNICOS e passageiros (a transação do item voltou atrás): deadlock e espera de trava. */
    private const PDO_PASSAGEIROS = [1213, 1205];

    public function __construct(
        private readonly AtributosRepositorio&ModuloRepositorio&SugestoesRepositorio $repo,
        private readonly AtributosService $atributos, private readonly ?KitsService $kits,
        private readonly int $nivel, private readonly string $usuario, private readonly ?int $usuarioId = null,
    ) {}

    public function decidir(array $b): array
    {
        if ($this->nivel < AtributosService::NIVEL_VALORES) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
        $acaoNova = (string) ($b['decisao'] ?? $b['acao'] ?? '');
        if (in_array($acaoNova, ['ignorar', 'devolver', 'reabrir'], true)) return $this->decidirAvulsa($acaoNova, $b);   // Parte C, um item
        $id = (int) ($b['id'] ?? 0);
        $s = $this->repo->sugestao($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Sugestão não encontrada.');
        if ($s['estado'] !== 'pendente') return ['sugestao' => $s, 'sem_mudanca' => true];
        if ((int) ($b['versao'] ?? -1) !== (int) $s['versao']) throw new AtributosErro('CONFLICT', 409, 'Esta sugestão já foi decidida ou alterada. Recarregue.');
        $decisao = (string) ($b['decisao'] ?? $b['acao'] ?? '');
        if (!in_array($decisao, ['aceitar', 'recusar'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Decisão inválida.', ['decisao']);
        $pid = (int) $s['product_id'];
        $motivo = isset($b['motivo']) && is_string($b['motivo']) ? mb_substr(trim($b['motivo']), 0, 255) : null;
        return $this->repo->transacao(function () use ($s, $b, $decisao, $pid, $motivo, $id) {
            $gravado = null;
            if ($decisao === 'aceitar') {
                $destino = (int) ($b['atributo_id'] ?? $s['atributo_id']);
                if ($destino !== (int) $s['atributo_id'] && $destino !== (int) ($s['atributo_alternativo_id'] ?? 0)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Destino fora das opções desta sugestão.', ['atributo_id']);
                $aj = $this->repo instanceof ModuloRepositorio ? $this->repo->ajusteProduto($pid, $destino) : null;
                $jaIncluido = $aj && $aj['excluido_em'] === null && in_array($aj['modo'], ['incluir', 'ajustar'], true);
                // DSHOW-049 (3): vínculo administrativo embutido pedido por quem NÃO administra o catálogo → recusa INTEIRA (antes: o vínculo
                // era descartado em silêncio). Já na ficha (kit/escopo/avulso) = nada administrativo a fazer → segue como preenchimento.
                if (!empty($b['vincular']) && !$jaIncluido && !$this->kits && !$this->atributos->naFicha($pid, $destino)) throw new AtributosErro('NOT_CATALOG_ADMIN', 403, 'Vincular o atributo ao produto é só para quem administra o catálogo. Peça a quem administra ou grave em um atributo que já está na ficha.', ['vincular']);
                if (!empty($b['vincular']) && $this->kits && !$jaIncluido) {   // já vinculado/ajustado: não regrava (não perde a unidade do produto)
                    try { $this->kits->definirAjuste(['product_id' => $pid, 'atributo_id' => $destino, 'modo' => 'incluir', 'versao_vinculos' => $this->kits->versaoVinculosAtual($pid)]); } catch (AtributosErro $e) { if ($e->http !== 422) throw $e; }
                }
                $valor = array_key_exists('valor', $b) ? $b['valor'] : ($s['opcao_id'] !== null ? (int) $s['opcao_id'] : $s['valor_proposto']);
                // D10: sugestão nunca sobrescreve valor existente (manual ou importado), em NENHUMA chave (multiopção inclusive).
                $trilha = $this->repo->travarValores($pid, $destino);
                $vivos = array_filter($trilha, static fn($r) => empty($r['excluido_em']));
                if ($vivos) throw new AtributosErro('VALUE_EXISTS', 409, 'Este campo já tem valor neste produto. A sugestão não sobrescreve: edite na ficha ou recuse a sugestão.', ['atributo_id']);
                $req = ['product_id' => $pid, 'atributo_id' => $destino, 'valor' => $valor, 'motivo' => "sugestão #$id ({$s['fonte']})"];
                // DSHOW-049: o campo vazio foi conferido AQUI, sob a mesma trava (D10) → a versão do conjunto é a da trilha lida agora
                $req['versao_conjunto'] = AtributosService::versaoConjunto($trilha);
                if (array_key_exists('unidade_id', $b)) $req['unidade_id'] = $b['unidade_id']; elseif ($s['unidade_id'] !== null) $req['unidade_id'] = (int) $s['unidade_id'];
                $gravado = $this->atributos->gravarValor($req);
            }
            if (!$this->repo->decidirSugestao($id, (int) $s['versao'], $decisao === 'aceitar' ? 'aceita' : 'recusada', $this->usuario, $motivo)) throw new AtributosErro('CONFLICT', 409, 'Esta sugestão já foi decidida. Recarregue.');
            if ($this->usuarioId !== null && $this->repo instanceof SugestoesDecisoes) $this->repo->carimbarDecisor($id, $this->usuarioId);
            $this->repo->auditar($this->usuario, $decisao === 'aceitar' ? 'aceitar_sugestao' : 'recusar_sugestao', 'sugestao', "$pid:$id", ['estado' => 'pendente', 'valor_proposto' => $s['valor_proposto']],
                ['estado' => $decisao === 'aceitar' ? 'aceita' : 'recusada', 'atributo_id' => (int) ($b['atributo_id'] ?? $s['atributo_id'])], $motivo);
            return ['decisao' => $decisao, 'valor' => $gravado['valor'] ?? null];
        });
    }

    /**
     * "Aceitar todas" (coluna/fila) — só com confirmação explícita; cada item é decidido isolado (um erro não desfaz os outros).
     * P1-1: com chave de operação ($lote), o desfecho de CADA item é gravado na MESMA transação da decisão do item (ou numa transação só
     * dele, quando nada é gravado); reenvio da mesma chave reaproveita os desfechos já gravados — o item não é refeito nem auditado de novo.
     */
    public function aceitarLote(array $b, ?LoteDaOperacao $lote = null): array
    {
        if ($this->nivel < AtributosService::NIVEL_VALORES) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
        if (($b['confirmar'] ?? null) !== true) throw new AtributosErro('VALIDATION_ERROR', 422, 'Confirme a aceitação em lote.', ['confirmar']);
        $ids = array_values(array_unique(array_map('intval', (array) ($b['ids'] ?? []))));
        if (!$ids || count($ids) > self::MAX_LOTE) throw new AtributosErro('VALIDATION_ERROR', 422, 'Escolha de 1 a ' . self::MAX_LOTE . ' sugestões.', ['ids']);
        // DSHOW-087: conta SÓ as decisões EFETIVADAS nesta execução; separa aceitas / ignoradas / falhas com IDs e motivos; mantém "aceitas"
        $aceitas = []; $ignoradas = []; $falhas = [];
        $ja = $lote ? $lote->abrir($ids) : [];
        foreach ($ids as $id) {
            if (isset($ja[(string) $id])) { self::acumular($id, $ja[(string) $id]['desfecho'], $ja[(string) $id]['detalhe'] ?? [], $aceitas, $ignoradas, $falhas); continue; }
            [$desfecho, $detalhe] = $this->umItem($id, $lote);
            self::acumular($id, $desfecho, $detalhe, $aceitas, $ignoradas, $falhas);
        }
        return ['aceitas' => count($aceitas), 'aceitas_ids' => array_column($aceitas, 'id'), 'aceitas_detalhe' => $aceitas,
            'ignoradas' => $ignoradas, 'falhas' => $falhas, 'pedidas' => count($ids)];
    }

    /** @return array{0:string,1:array} [aceita|ignorada|falha, detalhe] */
    private function umItem(int $id, ?LoteDaOperacao $lote): array
    {
        $s = $this->repo->sugestao($id);
        $ignorar = !$s ? ['motivo' => 'nao_encontrada'] : ($s['estado'] !== 'pendente' ? ['motivo' => 'ja_decidida', 'estado' => $s['estado']] : null);
        if ($ignorar !== null) { $lote?->registrarSozinho($id, 'ignorada', $ignorar); return ['ignorada', $ignorar]; }
        $decidir = function () use ($id, $s): array {
            $r = $this->decidir(['id' => $id, 'versao' => (int) $s['versao'], 'decisao' => 'aceitar', 'motivo' => 'aceitação em lote']);
            return !empty($r['sem_mudanca'])   // decidida por outro entre a leitura e aqui
                ? ['ignorada', ['motivo' => 'ja_decidida', 'estado' => $r['sugestao']['estado'] ?? null]]
                : ['aceita', ['valor' => $r['valor'] ?? null]];
        };
        try { return $lote ? $lote->item($id, $decidir) : $decidir(); }
        catch (AtributosErro $e) {
            if (OperacoesGravacao::ehTomada($e)) throw $e;   // outra tentativa assumiu a chave: para o lote, sem efeito
            $falha = ['codigo' => $e->codigo, 'erro' => $e->getMessage(), 'campos' => $e->campos];
            $lote?->registrarSozinho($id, 'falha', $falha);
            return ['falha', $falha];
        }
    }

    // ===================================================================================================== PARTE C (013) — decisões
    /** Porta comum da Parte C: nível, 013 presente, ação válida, Reabrir só para quem administra com motivo (Q-SUG.6). */
    private function portaParteC(string $acao, ?string $motivo): void
    {
        if ($this->nivel < AtributosService::NIVEL_VALORES) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
        if (!isset(self::ACOES[$acao])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Ação inválida.', ['acao']);
        if (!$this->repo instanceof SugestoesDecisoes || !$this->repo->temEstadosSugestao())
            throw new AtributosErro('SUGGESTION_STATES_UNAVAILABLE', 503, 'Esta ação ainda não está disponível (migração 013 ausente). Nada foi gravado.');
        if ($acao === 'reabrir') {
            if ($this->kits === null) throw new AtributosErro('NOT_CATALOG_ADMIN', 403, 'Reabrir uma sugestão recusada é só para quem administra o catálogo.');
            if (mb_strlen(trim((string) $motivo)) < 3) throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe o motivo para reabrir (pelo menos 3 caracteres).', ['motivo']);
        }
    }

    private static function motivo(array $b): ?string
    {
        return isset($b['motivo']) && is_string($b['motivo']) && trim($b['motivo']) !== '' ? mb_substr(trim($b['motivo']), 0, 255) : null;
    }

    /**
     * UM item, DENTRO da transação de quem chama. Devolve [desfecho, detalhe]: 'aplicada' ou 'nao_aplicada' (motivo = código estável).
     * Erro de negócio do Aceitar (VALUE_EXISTS, VALIDATION_ERROR…) SOBE como AtributosErro: a transação do item volta atrás inteira.
     */
    private function umaDecisao(string $acao, int $id, int $versaoVista, ?string $motivo): array
    {
        [$de, $para, $acaoAud] = self::ACOES[$acao];
        $s = $this->repo->sugestao($id, true);   // FOR UPDATE: a decisão e a conferência de versão/estado sob a MESMA trava
        if (!$s) return ['nao_aplicada', ['motivo' => 'NOT_FOUND']];
        $atual = ['estado_atual' => $s['estado'], 'versao_atual' => (int) $s['versao']];
        if ((int) $s['versao'] !== $versaoVista || $s['estado'] !== $de) return ['nao_aplicada', ['motivo' => 'CONFLICT'] + $atual];
        if ($acao === 'aceitar') {
            $r = $this->decidir(['id' => $id, 'versao' => $versaoVista, 'decisao' => 'aceitar', 'motivo' => $motivo ?? 'decisão em lote']);
            if (!empty($r['sem_mudanca'])) return ['nao_aplicada', ['motivo' => 'CONFLICT'] + $atual];
            return ['aplicada', ['estado_atual' => 'aceita', 'versao_nova' => $versaoVista + 1, 'valor' => $r['valor'] ?? null]];
        }
        /** @var SugestoesDecisoes $repo */
        $repo = $this->repo;
        if ($acao === 'reabrir' && $repo->temSucessora($id)) return ['nao_aplicada', ['motivo' => 'CONFLICT', 'detalhe' => 'tem_sucessora'] + $atual];
        $limpar = $para === 'pendente';
        if (!$repo->transicionarSugestao($id, $versaoVista, $de, $para, $this->usuario, $this->usuarioId, $motivo, $limpar)) return ['nao_aplicada', ['motivo' => 'CONFLICT'] + $atual];
        $this->repo->auditar($this->usuario, $acaoAud, 'sugestao', $s['product_id'] . ':' . $id, ['estado' => $de, 'versao' => $versaoVista, 'valor_proposto' => $s['valor_proposto']],
            ['estado' => $para, 'versao' => $versaoVista + 1, 'decidido_por_id' => $this->usuarioId], $motivo);
        return ['aplicada', ['estado_atual' => $para, 'versao_nova' => $versaoVista + 1]];
    }

    /** POST sugestao com ignorar|devolver|reabrir: um item, mesma regra do lote; "não aplicada" vira erro com código (409/404). */
    private function decidirAvulsa(string $acao, array $b): array
    {
        $motivo = self::motivo($b);
        $this->portaParteC($acao, $motivo);
        $id = (int) ($b['id'] ?? 0); $versao = $b['versao'] ?? null;
        if ($id <= 0 || !is_int($versao) && !(is_string($versao) && ctype_digit($versao))) throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe id e versao da sugestão.', ['id', 'versao']);
        [$desfecho, $det] = $this->repo->transacao(fn() => $this->umaDecisao($acao, $id, (int) $versao, $motivo));
        if ($desfecho === 'aplicada') return ['decisao' => $acao, 'sugestao' => ['id' => $id] + $det];
        if (($det['motivo'] ?? '') === 'NOT_FOUND') throw new AtributosErro('NOT_FOUND', 404, 'Sugestão não encontrada.');
        $e = new AtributosErro('CONFLICT', 409, 'Esta sugestão mudou ou já foi decidida. Recarregue.'); $e->meta = $det; throw $e;
    }

    /**
     * POST sugestoes_decidir (Parte C, contrato PROPOSTA-CONTRATO-SUGESTOES v2 §4): Aceitar, Recusar, Ignorar, Devolver ou Reabrir de 1 a
     * MAX_LOTE itens {id, versao}. Chave OBRIGATÓRIA (o lote só existe com $lote). Cada item na própria transação, com o desfecho gravado em
     * eq_operacao_item no MESMO COMMIT; reenvio da mesma chave refaz só os 'pendente'. Desfechos: aplicada | nao_aplicada(motivo).
     */
    public function decidirLote(array $b, ?LoteDaOperacao $lote): array
    {
        if ($lote === null) throw new AtributosErro('CHAVE_OBRIGATORIA', 422, 'Esta ação exige a chave de operação (X-Chave-Operacao).', ['chave_operacao']);
        $acao = (string) ($b['acao'] ?? ''); $motivo = self::motivo($b);
        $this->portaParteC($acao, $motivo);
        if (($b['confirmar'] ?? null) !== true) throw new AtributosErro('VALIDATION_ERROR', 422, 'Confirme a decisão em lote.', ['confirmar']);
        $versoes = self::validarCorpoLote($b);
        $ja = $lote->abrir(array_keys($versoes));
        $saida = [];
        foreach ($versoes as $id => $v) {
            [$desfecho, $det] = isset($ja[(string) $id]) ? [$ja[(string) $id]['desfecho'], $ja[(string) $id]['detalhe'] ?? []] : $this->itemDoLote($acao, $id, $v, $motivo, $lote);
            $saida[] = ['id' => $id, 'desfecho' => $desfecho] + (array) $det;
        }
        $resumo = ['aplicadas' => 0, 'nao_aplicadas' => 0, 'pendentes' => 0];
        foreach ($saida as $x) $resumo[match ($x['desfecho']) { 'aplicada' => 'aplicadas', 'pendente' => 'pendentes', default => 'nao_aplicadas' }]++;
        if ($resumo['pendentes'] > 0) {   // DSHOW-105 C: o lote NÃO termina — fica interrompido para "Concluir este lote" (mesma chave, só os pendentes)
            $e = new AtributosErro('OPERATION_INTERRUPTED', 503, "O lote parou: {$resumo['pendentes']} item(ns) tiveram erro técnico momentâneo e continuam pendentes. Use \"Concluir este lote\".");
            $e->meta = ['desfecho' => 'interrompida', 'gravado' => $resumo['aplicadas'] + $resumo['nao_aplicadas'] > 0 ? 'parcial' : false, 'itens' => $saida, 'resumo' => $resumo];
            throw $e;
        }
        return ['acao' => $acao, 'itens' => $saida, 'resumo' => $resumo, 'sem_mudanca' => $resumo['aplicadas'] === 0];
    }

    /** Item com erro TÉCNICO transitório: nada foi gravado, o livro continua 'pendente' (não é desfecho; "Concluir" refaz só ele). */
    private static function itemPendente(): array
    {
        return ['pendente', ['motivo' => 'erro_tecnico', 'mensagem' => 'Erro técnico momentâneo; nada foi gravado neste item. Use "Concluir este lote".']];
    }

    /**
     * DSHOW-108 (A): validação do CORPO do sugestoes_decidir (pares id/versão, 1..MAX_LOTE_DECIDIR, sem repetição). Pura: a camada de gravação
     * chama ANTES de reservar a chave de operação (51 itens = 422 sem nenhuma escrita) e o serviço repete. @return array<int,int> id => versão
     */
    public static function validarCorpoLote(array $b): array
    {
        $itens = $b['itens'] ?? null;
        if (!is_array($itens) || !array_is_list($itens) || !$itens || count($itens) > self::MAX_LOTE_DECIDIR)
            throw new AtributosErro('VALIDATION_ERROR', 422, 'Escolha de 1 a ' . self::MAX_LOTE_DECIDIR . ' sugestões (uma página).', ['itens']);
        $versoes = [];
        foreach ($itens as $k => $it) {
            $id = is_array($it) ? ($it['id'] ?? null) : null; $v = is_array($it) ? ($it['versao'] ?? null) : null;
            if (!is_int($id) || $id <= 0 || !is_int($v) || $v < 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Item ' . ($k + 1) . ' inválido: informe id e versao inteiros.', ['itens']);
            if (isset($versoes[$id])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Sugestão repetida no lote.', ['itens']);
            $versoes[$id] = $v;
        }
        return $versoes;
    }

    /** @return array{0:string,1:array} um item do lote: 'aplicada', 'nao_aplicada' (negócio) ou 'pendente' (técnico; NÃO registrado). */
    private function itemDoLote(string $acao, int $id, int $versao, ?string $motivo, LoteDaOperacao $lote): array
    {
        for ($tentativa = 1; ; $tentativa++) {
            try { return $lote->item($id, fn() => $this->umaDecisao($acao, $id, $versao, $motivo)); }
            catch (AtributosErro $e) {
                if (OperacoesGravacao::ehTomada($e)) throw $e;   // outra tentativa assumiu a chave: para o lote, sem efeito
                if (($e->meta['motivo'] ?? null) === 'passageiro') {   // deadlock/espera de trava (AtributosRepoPdo::traduzir): técnico, não conflito
                    if ($tentativa < 2) continue;
                    return self::itemPendente();   // DSHOW-105 C: a transação do item voltou atrás → fica 'pendente' para "Concluir este lote"
                }
                $det = ['motivo' => $e->codigo, 'mensagem' => $e->getMessage()] + (isset($e->meta['motivo']) ? ['detalhe' => $e->meta['motivo']] : []);
                $lote->registrarSozinho($id, 'nao_aplicada', $det);
                return ['nao_aplicada', $det];
            } catch (PDOException $e) {
                if (!in_array((int) ($e->errorInfo[1] ?? 0), self::PDO_PASSAGEIROS, true)) throw $e;   // outro erro de banco: o lote PARA (interrompida)
                if ($tentativa < 2) continue;   // uma repetição do mesmo item
                return self::itemPendente();
            }
        }
    }

    private static function acumular(int $id, string $desfecho, array $detalhe, array &$aceitas, array &$ignoradas, array &$falhas): void
    {
        match ($desfecho) {
            'aceita' => $aceitas[] = ['id' => $id, 'valor' => $detalhe['valor'] ?? null],
            'ignorada' => $ignoradas[] = ['id' => $id] + $detalhe,
            default => $falhas[] = ['id' => $id] + $detalhe,
        };
    }
}
