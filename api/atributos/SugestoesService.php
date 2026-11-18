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

final class SugestoesService
{
    public const MAX_LOTE = 200;

    public function __construct(
        private readonly AtributosRepositorio&ModuloRepositorio&SugestoesRepositorio $repo,
        private readonly AtributosService $atributos, private readonly ?KitsService $kits,
        private readonly int $nivel, private readonly string $usuario,
    ) {}

    public function decidir(array $b): array
    {
        if ($this->nivel < AtributosService::NIVEL_VALORES) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
        $id = (int) ($b['id'] ?? 0);
        $s = $this->repo->sugestao($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Sugestão não encontrada.');
        if ($s['estado'] !== 'pendente') return ['sugestao' => $s, 'sem_mudanca' => true];
        if ((int) ($b['versao'] ?? -1) !== (int) $s['versao']) throw new AtributosErro('CONFLICT', 409, 'Esta sugestão já foi decidida ou alterada. Recarregue.');
        $decisao = (string) ($b['decisao'] ?? '');
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
            $this->repo->auditar($this->usuario, $decisao === 'aceitar' ? 'aceitar_sugestao' : 'recusar_sugestao', 'sugestao', "$pid:$id", ['estado' => 'pendente', 'valor_proposto' => $s['valor_proposto']],
                ['estado' => $decisao === 'aceitar' ? 'aceita' : 'recusada', 'atributo_id' => (int) ($b['atributo_id'] ?? $s['atributo_id'])], $motivo);
            return ['decisao' => $decisao, 'valor' => $gravado['valor'] ?? null];
        });
    }

    /** "Aceitar todas" (coluna/fila) — só com confirmação explícita; cada item é decidido isolado (um erro não desfaz os outros). */
    public function aceitarLote(array $b): array
    {
        if ($this->nivel < AtributosService::NIVEL_VALORES) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
        if (($b['confirmar'] ?? null) !== true) throw new AtributosErro('VALIDATION_ERROR', 422, 'Confirme a aceitação em lote.', ['confirmar']);
        $ids = array_values(array_unique(array_map('intval', (array) ($b['ids'] ?? []))));
        if (!$ids || count($ids) > self::MAX_LOTE) throw new AtributosErro('VALIDATION_ERROR', 422, 'Escolha de 1 a ' . self::MAX_LOTE . ' sugestões.', ['ids']);
        $ok = 0; $falhas = [];
        foreach ($ids as $id) {
            $s = $this->repo->sugestao($id);
            if (!$s || $s['estado'] !== 'pendente') continue;
            try { $this->decidir(['id' => $id, 'versao' => (int) $s['versao'], 'decisao' => 'aceitar', 'motivo' => 'aceitação em lote']); $ok++; }
            catch (AtributosErro $e) { $falhas[] = ['id' => $id, 'erro' => $e->getMessage()]; }
        }
        return ['aceitas' => $ok, 'falhas' => $falhas];
    }
}
