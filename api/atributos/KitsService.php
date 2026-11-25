<?php
// /api/atributos/KitsService.php — VÍNCULOS (missão §8–§10): kits (A2: nome de tela do eq_grupo), itens, escopos, kits diretos por produto,
// ajustes por produto (incluir/excluir/ajustar) e aplicação EM MASSA com prévia. Nível de administração (A1) e auditoria antes/depois na
// mesma transação. Nada é apagado: vínculos saem por exclusão lógica (004/006/007).
declare(strict_types=1);

require_once __DIR__ . '/AtributosService.php';

interface ModuloRepositorio
{
    public function produtosDiretosDoKit(int $grupoId): array;
    /** Insere/revive (ativo) ou exclui logicamente (inativo). @return bool se mudou */
    public function definirKitProduto(int $grupoId, int $productId, bool $ativo, string $usuario, string $origem = 'manual'): bool;
    public function ajusteProduto(int $productId, int $atributoId): ?array;
    /** $dados null = exclui logicamente o ajuste. @return bool se mudou */
    public function definirAjusteProduto(int $productId, int $atributoId, ?array $dados, string $usuario): bool;
    public function auditoriaPorChave(string $entidade, string $entidadeId): ?array;
    /** @param int[] $productIds @return array<int,string> versão dos vínculos por produto (kit direto + ajustes) */
    public function versoesVinculos(array $productIds, bool $travar = false): array;
    /** DSHOW-096: versão de cada kit; $travar = FOR SHARE em todos (nenhum kit muda até o COMMIT). @return array<int,int> */
    public function versoesGrupos(bool $travar = false): array;
    public function registrarPedidoMassa(string $chave, string $assinatura, string $usuario, int $produtos): bool;
    public function pedidoMassa(string $chave): ?array;
    public function concluirPedidoMassa(string $chave, array $resultado): void;
}

/**
 * P1 kit-prioridade · ação de REORDENAR (18/11, depois do foi-salvo): trava e reescrita da fila de precedência (eq_grupo.prioridade, 012).
 * Interface SEPARADA (molde UnidadesComTrava): só o AtributosRepoPdo a implementa; o RepoMemoria dos testes não — a ação responde 503
 * KIT_PRIORITY_UNAVAILABLE sem mutar. Chamar dentro de transacao().
 */
interface KitsPrioridade
{
    /** A coluna eq_grupo.prioridade (012) existe? */
    public function temPrioridadeKit(): bool;
    /** SELECT … FOR UPDATE de TODAS as linhas de eq_grupo (id, nome, ativo, prioridade) na ordem (nome, id) do MySQL, com `ordem_nome` = posição. */
    public function travarFilaKits(): array;
    /** UPDATE só da prioridade (versao e atualizado_em ficam como estão: nenhuma tela de kit ganha conflito por reordenar). @return bool mudou */
    public function definirPrioridadeKit(int $grupoId, int $prioridade): bool;
}

final class KitsService
{
    public const MAX_DESTAQUES = 4;            // A4
    public const MAX_PRODUTOS_MASSA = 1000;    // limite por chamada (§10)

    public function __construct(
        private readonly AtributosRepositorio&ModuloRepositorio $repo,
        private readonly int $nivel,
        private readonly string $usuario,
        private readonly CatalogoProdutos $catalogo,
        private readonly ?bool $administra = null,   // AtributosPermissoes (18/11): null = só pelo nível
        private readonly ?int $titularId = null,     // DSHOW-086: identidade ESTÁVEL do usuário (id do Dash) para o recibo da massa
    ) {}

    /**
     * DSHOW-086: o recibo da massa é do TITULAR. Com titular_id gravado (011), confere pelo id estável; recibo antigo (sem titular_id),
     * pelo `usuario` gravado. Quem não é o titular não recebe o resultado (o gate de admin continua antes).
     */
    public static function titularDoPedido(array $ped, ?int $titularId, string $usuario): bool
    {
        if (isset($ped['titular_id']) && $ped['titular_id'] !== null && $titularId !== null) return (int) $ped['titular_id'] === $titularId;
        return (string) ($ped['usuario'] ?? '') === mb_substr($usuario, 0, 100);
    }

    /**
     * Recibo da massa — UMA função para a resposta, o reenvio e o "conferir gravação" (DSHOW-093 A: byte a byte iguais). Derivado só do
     * resultado guardado em eq_pedido_massa: desfecho `sem_mudanca` quando o lote teve 0 efeitos (campos_gravados []), senão `aplicada`
     * (['vinculos']). confirmado_em = o carimbo gravado no MESMO COMMIT (null em recibos antigos, gravados antes dele).
     */
    /** Ordem canônica (alfabética) das chaves dos objetos, recursiva — resposta da massa = reenvio, byte a byte. */
    private static function canonMassa(array $v): array
    {
        if (!array_is_list($v)) ksort($v, SORT_STRING);
        foreach ($v as $k => $x) if (is_array($x)) $v[$k] = self::canonMassa($x);
        return $v;
    }

    public static function reciboMassa(string $chave, array $resultado): array
    {
        $sem = ($resultado['sem_mudanca'] ?? false) === true;
        // a coluna JSON do MySQL reordena as chaves dos objetos: ordem canônica (alfabética) nos aninhados, para a resposta sair igual ao guardado
        $canon = static function ($v) use (&$canon) { if (!is_array($v)) return $v; if (!array_is_list($v)) ksort($v, SORT_STRING); return array_map($canon, $v); };
        $r = ['operacao' => 'massa_aplicar', 'chave' => $chave, 'desfecho' => $sem ? 'sem_mudanca' : 'aplicada', 'confirmado_em' => $resultado['confirmado_em'] ?? null,
            'gravado' => $canon($resultado['gravado'] ?? null), 'resumo' => $canon($resultado['resumo'] ?? null), 'versao_nova' => null, 'campos_gravados' => $sem ? [] : ['vinculos']];
        return json_decode(json_encode($r, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), true);   // a mesma forma do texto guardado
    }

    /** A8: unidade aceitável para o atributo: existe, está ativa e é da mesma grandeza da unidade padrão (ou é extra explícita). */
    private function unidadeValida(array $a, ?int $uid): bool
    {
        if ($uid === null) return true;
        if (!in_array($a['tipo'], ['numero', 'inteiro'], true)) return false;
        $u = $this->repo->unidade($uid);
        if (!$u || !(int) ($u['ativo'] ?? 1)) return false;
        if ($a['unidade_id'] === null || (int) $a['unidade_id'] === $uid || in_array($uid, array_map('intval', $this->repo->unidadesExtras((int) $a['id'])), true)) return true;
        $p = $this->repo->unidade((int) $a['unidade_id']);
        return $p && ($p['grandeza'] ?? '') !== '' && ($p['grandeza'] ?? null) === ($u['grandeza'] ?? null);
    }

    private static function posicao(mixed $v, string $campo): ?int
    {
        if ($v === null || $v === '') return null;
        if (!is_numeric($v) || (int) $v < 0 || (int) $v > 65535) throw new AtributosErro('VALIDATION_ERROR', 422, 'Posição inválida (0 a 65535).', [$campo]);
        return (int) $v;
    }

    private function exigir(): void
    {
        if ($this->nivel < AtributosService::NIVEL_ADMIN) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
        if ($this->administra === false) throw new AtributosErro('NOT_CATALOG_ADMIN', 403, 'Só quem administra o catálogo de atributos pode mexer em kits, vínculos e massa. Você pode preencher valores.');
    }

    private function kit(int $id): array
    {
        return $this->repo->grupo($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Kit não encontrado.');
    }

    private function conferirVersao(array $g, mixed $versao): void
    {
        if ((int) $versao !== (int) $g['versao']) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa. Recarregue e tente de novo.');
    }

    /** Risco residual 5: a versão dos vínculos do produto é OBRIGATÓRIA em toda mudança de vínculo feita pela ficha/conferência. */
    private static function versaoVinculosInformada(array $b): string
    {
        $v = $b['versao_vinculos'] ?? null;
        if (!is_string($v) || !preg_match('/^[0-9a-f]{16}$/', $v)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Falta a versão dos vínculos deste produto. Recarregue a ficha.', ['versao_vinculos']);
        return $v;
    }

    /** Confere a versão SOB TRAVA (dentro da transação): quem mudou os vínculos do produto depois da leitura recebe 409. */
    private function conferirVinculos(int $pid, string $v): void
    {
        if (($this->repo->versoesVinculos([$pid], true)[$pid] ?? '') !== $v) throw new AtributosErro('CONFLICT', 409, 'Os vínculos deste produto foram alterados por outra pessoa. Recarregue e tente de novo.');
    }

    private function versaoVinculos(int $pid): string { return $this->repo->versoesVinculos([$pid])[$pid]; }

    /** Para chamadas internas (aceitar sugestão + vincular) que já estão na mesma transação: a versão vigente, lida agora. */
    public function versaoVinculosAtual(int $pid): string { return $this->versaoVinculos($pid); }

    /** Versão da prévia em massa: vínculos de cada produto + versão de cada kit envolvido. Muda se qualquer um mudar depois da prévia. */
    /**
     * DSHOW-056: a INTENÇÃO completa, canônica (a ordem de chegada dos IDs não importa): produtos, kits a aplicar e a remover (inteiros
     * ordenados), atributos a incluir como pares [id, unidade|null] e a excluir como pares [id, motivo], ordenados por id. Estruturas reais
     * (pedidoMassa): $prods = [pid => produto], $kA/$kR = listas de int, $aI = [aid => unidade|null], $aE = [aid => motivo].
     */
    private static function intencaoMassa(array $prods, array $kA, array $kR, array $aI, array $aE): array
    {
        $ids = static function (array $xs): array { $xs = array_values(array_unique(array_map('intval', $xs))); sort($xs, SORT_NUMERIC); return $xs; };
        $pares = static function (array $m, callable $v): array { ksort($m, SORT_NUMERIC); $o = []; foreach ($m as $k => $x) $o[] = [(int) $k, $v($x)]; return $o; };
        return ['produtos' => $ids(array_keys($prods)), 'kits_aplicar' => $ids($kA), 'kits_remover' => $ids($kR),
            'atributos_incluir' => $pares($aI, static fn($u) => $u === null ? null : (int) $u), 'atributos_excluir' => $pares($aE, static fn($m) => (string) $m)];
    }

    /**
     * DSHOW-096 (Codex P1): PLANO determinístico da massa — a MESMA função na prévia e na gravação, sobre o retrato do modelo de cada momento.
     * Por produto: o efeito em CADA atributo tocado (ficha antes ∪ depois ∪ pedido) = incluir | remover | sem_mudanca; os avulsos que entram;
     * e os KITS DE ORIGEM — todo kit que vale para o produto antes ou depois (por escopo, "todos" ou direto: origem INDIRETA incluída).
     * @return array{produtos: array<int,array{efeito: array<int,string>, entram: array<int,?int>, kits_origem: int[], antes: int, depois: int, kits_ja: int}>, kits_origem: int[]}
     */
    public static function planoMassa(RetratoModelo $m, array $prods, array $kA, array $kR, array $aI, array $aE): array
    {
        $ints = static function (array $xs): array { $xs = array_values(array_unique(array_map('intval', $xs))); sort($xs, SORT_NUMERIC); return $xs; };
        $plano = []; $todosKits = array_merge($kA, $kR);
        foreach ($prods as $pid => $p) {
            $pid = (int) $pid;
            $antes = Aplicabilidade::ficha($m, $p);
            $d2 = $m->diretos; $a2 = $m->ajustes; $kitsJa = 0;
            foreach ($kA as $g) { if (in_array($g, $d2[$pid] ?? [], true)) $kitsJa++; $d2[$pid] = array_values(array_unique(array_merge($d2[$pid] ?? [], [$g]))); }
            foreach ($kR as $g) $d2[$pid] = array_values(array_diff($d2[$pid] ?? [], [$g]));
            $entram = self::inclusoesQueEntram($antes, $aI); ksort($entram, SORT_NUMERIC);
            foreach ($entram as $aid => $u) $a2[$pid][$aid] = ['modo' => 'incluir', 'unidade_id' => $u, 'posicao' => null, 'motivo' => null];
            foreach ($aE as $aid => $mot) $a2[$pid][$aid] = ['modo' => 'excluir', 'unidade_id' => null, 'posicao' => null, 'motivo' => $mot];
            $m2 = new RetratoModelo($m->grupos, $m->escopos, $m->itens, $d2, $a2, $m->atributos);
            $depois = Aplicabilidade::ficha($m2, $p);
            $efeito = [];
            foreach ($ints(array_merge(array_keys($antes), array_keys($depois), array_keys($aI), array_keys($aE))) as $aid)
                $efeito[$aid] = isset($depois[$aid]) && !isset($antes[$aid]) ? 'incluir' : (isset($antes[$aid]) && !isset($depois[$aid]) ? 'remover' : 'sem_mudanca');
            $origem = $ints(array_merge(array_keys(Aplicabilidade::kits($m, $p)), array_keys(Aplicabilidade::kits($m2, $p))));
            $todosKits = array_merge($todosKits, $origem);
            $plano[$pid] = ['efeito' => $efeito, 'entram' => $entram, 'kits_origem' => $origem, 'antes' => count($antes), 'depois' => count($depois), 'kits_ja' => $kitsJa];
        }
        ksort($plano, SORT_NUMERIC);
        return ['produtos' => $plano, 'kits_origem' => $ints($todosKits)];
    }

    /**
     * Versão da prévia = intenção canônica + vínculos dos produtos + versão de CADA kit de origem (inclusive indireta) + o PLANO inteiro
     * (DSHOW-056: a prévia de X não confirma Y; DSHOW-096: um kit de origem que mudou, ou um efeito diferente, não confirma a prévia).
     * $gv = versoesGrupos() (na gravação: lida SOB TRAVA, FOR SHARE).
     */
    private function versaoMassa(array $prods, array $kA, array $kR, array $aI, array $aE, array $plano, array $gv, bool $travar): string
    {
        $vs = $this->repo->versoesVinculos(array_keys($prods), $travar); ksort($vs);
        $ks = []; foreach ($plano['kits_origem'] as $g) $ks[$g] = $gv[$g] ?? null; ksort($ks);
        return hash('sha256', json_encode([self::intencaoMassa($prods, $kA, $kR, $aI, $aE), $vs, $ks, $plano['produtos']]));
    }

    private static function texto(mixed $v, int $max, string $campo, bool $obrig): ?string
    {
        if ($v === null || (is_string($v) && trim($v) === '')) { if ($obrig) throw new AtributosErro('VALIDATION_ERROR', 422, 'Campo obrigatório.', [$campo]); return null; }
        if (!is_string($v) || mb_strlen(trim($v)) > $max) throw new AtributosErro('VALIDATION_ERROR', 422, "Texto inválido (até $max caracteres).", [$campo]);
        return trim($v);
    }

    private function produtoValido(int $pid): array
    {
        try { $p = $this->catalogo->produto($pid); } catch (CatalogoIndisponivel) { throw new AtributosErro('CATALOG_UNAVAILABLE', 503, 'Catálogo de produtos indisponível.'); }
        if ($p === null || $p['excluido']) throw new AtributosErro('PRODUCT_NOT_FOUND', 422, "Produto $pid não encontrado no catálogo.", ['product_id']);
        return $p;
    }

    // ---- kit -------------------------------------------------------------------------------------------------------------------------
    /** Cria (sem id) ou edita (com id + versao) nome, descrição, ordem e "aplica a todos". */
    public function salvarKit(array $b): array
    {
        $this->exigir();
        $nome = self::texto($b['nome'] ?? null, 160, 'nome', !isset($b['id']));
        $desc = array_key_exists('descricao', $b) ? self::texto($b['descricao'], 500, 'descricao', false) : null;
        return $this->repo->transacao(function () use ($b, $nome, $desc) {
            if (!isset($b['id'])) {
                foreach ($this->repo->grupos() as $g) if (mb_strtolower($g['nome']) === mb_strtolower((string) $nome)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Já existe um kit com este nome.', ['nome']);
                $id = $this->repo->criarGrupo((string) $nome);
                $d = ['descricao' => $desc, 'aplica_a_todos' => !empty($b['aplica_a_todos']) ? 1 : 0, 'ordem' => (int) ($b['ordem'] ?? 0)];
                $this->repo->atualizarGrupo($id, 1, $d);
                $novo = $this->kit($id);
                $this->repo->auditar($this->usuario, 'criar', 'kit', (string) $id, null, ['nome' => $nome] + $d, null);
                return ['kit' => $novo];
            }
            $antes = $this->kit((int) $b['id']); $this->conferirVersao($antes, $b['versao'] ?? null);
            $d = [];
            if ($nome !== null && $nome !== $antes['nome']) {
                foreach ($this->repo->grupos() as $g) if ((int) $g['id'] !== (int) $antes['id'] && mb_strtolower($g['nome']) === mb_strtolower($nome)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Já existe um kit com este nome.', ['nome']);
                $d['nome'] = $nome;
            }
            if (array_key_exists('descricao', $b)) $d['descricao'] = $desc;
            if (array_key_exists('aplica_a_todos', $b)) $d['aplica_a_todos'] = !empty($b['aplica_a_todos']) ? 1 : 0;
            if (array_key_exists('ordem', $b)) $d['ordem'] = (int) $b['ordem'];
            if (!$d) return ['kit' => $antes, 'sem_mudanca' => true];
            if (!$this->repo->atualizarGrupo((int) $antes['id'], (int) $antes['versao'], $d)) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa. Recarregue e tente de novo.');
            $this->repo->auditar($this->usuario, 'editar', 'kit', (string) $antes['id'], array_intersect_key($antes, $d), $d, $b['motivo'] ?? null);
            return ['kit' => $this->kit((int) $antes['id'])];
        });
    }

    /** "Criar a partir de": copia itens (e, se pedido, escopos) para um kit novo. Produtos diretos não são copiados. */
    public function duplicarKit(array $b): array
    {
        $this->exigir();
        $orig = $this->kit((int) ($b['id'] ?? 0));
        return $this->repo->transacao(function () use ($b, $orig) {   // atômico: falha nos itens/escopos não deixa "cópia" vazia
        $r = $this->salvarKit(['nome' => $b['nome'] ?? ($orig['nome'] . ' (cópia)'), 'descricao' => $orig['descricao'] ?? null]);
        $novo = $r['kit'];
        $itens = array_map(static fn($i) => ['atributo_id' => (int) $i['atributo_id'], 'posicao' => (int) $i['posicao'], 'obrigatorio' => (int) $i['obrigatorio'], 'visivel' => (int) $i['visivel'],
            'destaque' => (int) ($i['destaque'] ?? 0), 'importancia' => $i['importancia'] ?? null, 'unidade_id' => $i['unidade_id'] ?? null], $orig['atributos']);
        $novo = $this->definirItens(['id' => $novo['id'], 'versao' => $novo['versao'], 'itens' => $itens])['kit'];
        if (!empty($b['com_escopos']) && $orig['escopos']) $novo = $this->definirEscopos(['id' => $novo['id'], 'versao' => $novo['versao'], 'escopos' => $orig['escopos']])['kit'];
        return ['kit' => $novo, 'origem_id' => (int) $orig['id']];
        });
    }

    public function definirAtivo(array $b): array
    {
        $this->exigir();
        $antes = $this->kit((int) ($b['id'] ?? 0)); $this->conferirVersao($antes, $b['versao'] ?? null);
        $ativo = !empty($b['ativo']) ? 1 : 0;
        if ((int) $antes['ativo'] === $ativo) return ['kit' => $antes, 'sem_mudanca' => true];
        return $this->repo->transacao(function () use ($antes, $ativo, $b) {
            if (!$this->repo->atualizarGrupo((int) $antes['id'], (int) $antes['versao'], ['ativo' => $ativo])) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa.');
            $this->repo->auditar($this->usuario, $ativo ? 'reativar' : 'desativar', 'kit', (string) $antes['id'], ['ativo' => (int) $antes['ativo']], ['ativo' => $ativo], $b['motivo'] ?? null);
            return ['kit' => $this->kit((int) $antes['id'])];
        });
    }

    /**
     * P1 kit-prioridade · REORDENAR a fila de precedência (POST kit_prioridade; docs/atributos/PORTAO-012-KIT-PRIORIDADE.md §9).
     * Corpo: {ordem: [ids de TODOS os kits ATIVOS na nova precedência], ordem_antes: [a ordem dos ativos que a tela viu], motivo?}.
     * Forma escolhida = LISTA COMPLETA (não "mover X para N"): o pedido diz o resultado inteiro, é idempotente por natureza (reenviar não
     * empurra de novo) e a tela confere o que vai gravar; "mover" dependeria da posição atual e repetido moveria duas vezes.
     *  · 422 antes de mutar: lista malformada/vazia, id repetido, id que não existe em eq_grupo, ordem ≠ conjunto de ordem_antes (incompleta
     *    ou com kit a mais). ordem_antes é obrigatória (sensível à ordem, molde DSHOW-045 do opcao_reordenar).
     *  · sob trava de TODA a fila (FOR UPDATE em eq_grupo): ordem_antes ≠ ativos atuais na precedência atual → 409 CONFLICT com meta.atual
     *    {ordem, kits} (só em conflito real); depois, kit inativo/desconhecido na ordem → 422.
     *  · ordem = atual → sem_mudanca (nada gravado, nada auditado).
     *  · Grava: a fila INTEIRA vira 1..N — os ativos ocupam, na nova ordem, as vagas que os ativos ocupavam; os INATIVOS ficam onde estavam
     *    (posição relativa preservada; não entram na ficha). Kit com prioridade NULL é normalizado. Só a coluna prioridade muda (versao e
     *    atualizado_em do kit não: nenhuma tela de kit ganha 409 por isso). Auditoria `reordenar_kits` (antes/depois) na mesma transação.
     *  · Nenhum VALOR é tocado; a ficha efetiva muda só onde kits disputam atributo (quem é dono do item: posição, importância, unidade do kit).
     * Resposta (lida DENTRO da transação que gravou): {ordem, kits: [{id, nome, ativo, prioridade}] na precedência, versao_prioridade}.
     */
    public function reordenarPrioridade(array $b): array
    {
        $this->exigir();
        $repo = $this->repo;
        if (!$repo instanceof KitsPrioridade || !$repo->temPrioridadeKit())
            throw new AtributosErro('KIT_PRIORITY_UNAVAILABLE', 503, 'A precedência de kits ainda não está disponível neste banco (migração 012). Nada foi gravado.');
        $ordem = self::idsDaOrdem($b['ordem'] ?? null, 'ordem');
        $antes = self::idsDaOrdem($b['ordem_antes'] ?? null, 'ordem_antes');
        $a1 = $ordem; $b1 = $antes; sort($a1); sort($b1);
        if ($a1 !== $b1) throw new AtributosErro('VALIDATION_ERROR', 422, 'A nova ordem precisa ter exatamente os kits ativos da lista atual, cada um uma vez.', ['ordem']);
        $motivo = isset($b['motivo']) && is_string($b['motivo']) && trim($b['motivo']) !== '' ? trim($b['motivo']) : null;
        return $this->repo->transacao(function () use ($repo, $ordem, $antes, $motivo): array {
            $fila = $repo->travarFilaKits();
            usort($fila, [Aplicabilidade::class, 'compararKits']);
            $porId = []; foreach ($fila as $g) $porId[(int) $g['id']] = $g;
            $inexistentes = array_values(array_filter($ordem, static fn($id) => !isset($porId[$id])));
            if ($inexistentes) throw new AtributosErro('VALIDATION_ERROR', 422, 'Kit inexistente na ordem: ' . implode(', ', $inexistentes) . '.', ['ordem']);
            $ativos = array_values(array_map(static fn($g) => (int) $g['id'], array_filter($fila, static fn($g) => (int) $g['ativo'] === 1)));
            if ($antes !== $ativos) {
                $e = new AtributosErro('CONFLICT', 409, 'A lista de kits ou a precedência mudou desde que você abriu. Recarregue e tente de novo.');
                $e->meta = ['atual' => ['ordem' => $ativos, 'kits' => self::filaPublica($fila)]];
                throw $e;
            }
            // ordem_antes = ativos e conjunto(ordem) = conjunto(ordem_antes): a ordem cobre exatamente os ativos (sem inativo, sem faltar)
            if ($ordem === $ativos) return ['ordem' => $ativos, 'kits' => self::filaPublica($fila), 'versao_prioridade' => self::versaoPrioridade($fila), 'sem_mudanca' => true];
            $proximo = 0; $nova = [];
            foreach ($fila as $g) $nova[] = (int) $g['ativo'] === 1 ? $porId[$ordem[$proximo++]] : $g;
            $prioAntes = []; $prioDepois = [];
            foreach ($fila as $g) $prioAntes[(string) $g['id']] = $g['prioridade'] === null ? null : (int) $g['prioridade'];
            foreach ($nova as $i => $g) { $repo->definirPrioridadeKit((int) $g['id'], $i + 1); $prioDepois[(string) $g['id']] = $i + 1; }
            $this->repo->auditar($this->usuario, 'reordenar_kits', 'kit_prioridade', 'fila', ['ordem' => $ativos, 'prioridade' => $prioAntes], ['ordem' => $ordem, 'prioridade' => $prioDepois], $motivo);
            $depois = $repo->travarFilaKits();   // releitura NA MESMA transação (o recibo ecoa o que ficou gravado)
            usort($depois, [Aplicabilidade::class, 'compararKits']);
            $lido = array_values(array_map(static fn($g) => (int) $g['id'], array_filter($depois, static fn($g) => (int) $g['ativo'] === 1)));
            if ($lido !== $ordem) throw new RuntimeException('kit_prioridade: releitura diverge da ordem gravada');   // defesa: desfaz tudo
            return ['ordem' => $lido, 'kits' => self::filaPublica($depois), 'versao_prioridade' => self::versaoPrioridade($depois)];
        });
    }

    /** Lista de ids positivos, não vazia, sem repetição (até 1000). */
    private static function idsDaOrdem(mixed $v, string $campo): array
    {
        if (!is_array($v) || !array_is_list($v) || $v === [] || count($v) > 1000) throw new AtributosErro('VALIDATION_ERROR', 422, 'Ordem de kits inválida.', [$campo]);
        $ids = [];
        foreach ($v as $x) {
            $i = is_int($x) ? $x : (is_string($x) && preg_match('/^[1-9][0-9]{0,9}$/', $x) ? (int) $x : 0);
            if ($i <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Ordem de kits inválida.', [$campo]);
            $ids[] = $i;
        }
        if (count(array_unique($ids)) !== count($ids)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Kit repetido na ordem.', [$campo]);
        return $ids;
    }

    private static function filaPublica(array $fila): array
    {
        return array_map(static fn($g) => ['id' => (int) $g['id'], 'nome' => (string) $g['nome'], 'ativo' => (int) $g['ativo'] === 1, 'prioridade' => $g['prioridade'] === null ? null : (int) $g['prioridade']], array_values($fila));
    }

    /** Versão da fila (sensível à ordem e às prioridades gravadas): sha256 curto de [id, prioridade, ativo] na precedência. */
    public static function versaoPrioridade(array $fila): string
    {
        return substr(hash('sha256', json_encode(array_map(static fn($g) => [(int) $g['id'], $g['prioridade'] === null ? null : (int) $g['prioridade'], (int) $g['ativo']], array_values($fila)))), 0, 16);
    }

    /** Itens do kit: ordem, obrigatório, visível no app, destaque (até 4), importância, unidade do kit. Grava só o que mudou (ATR-M1). */
    public function definirItens(array $b): array
    {
        $this->exigir();
        $antes = $this->kit((int) ($b['id'] ?? 0)); $this->conferirVersao($antes, $b['versao'] ?? null);
        if (!is_array($b['itens'] ?? null) || count($b['itens']) > 500) throw new AtributosErro('VALIDATION_ERROR', 422, 'Lista de itens inválida (até 500).', ['itens']);
        $itens = []; $destaques = 0; $vistos = [];
        foreach (array_values($b['itens']) as $k => $i) {
            $aid = (int) ($i['atributo_id'] ?? 0);
            $a = $aid > 0 ? $this->repo->atributo($aid) : null;
            if (!$a) throw new AtributosErro('VALIDATION_ERROR', 422, "Atributo inexistente na posição " . ($k + 1) . '.', ['itens']);
            if (isset($vistos[$aid])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Atributo repetido no kit.', ['itens']);
            $vistos[$aid] = true;
            $imp = $i['importancia'] ?? null;
            if ($imp !== null && $imp !== '' && !in_array($imp, Aplicabilidade::IMPORTANCIAS, true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Importância inválida.', ['itens']);
            $uid = isset($i['unidade_id']) && $i['unidade_id'] !== '' && $i['unidade_id'] !== null ? (int) $i['unidade_id'] : null;
            if (!$this->unidadeValida($a, $uid)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Unidade do kit inválida para "' . $a['rotulo'] . '".', ['itens']);
            $dest = !empty($i['destaque']) ? 1 : 0; $destaques += $dest;
            $itens[] = ['atributo_id' => $aid, 'posicao' => self::posicao($i['posicao'] ?? null, 'itens') ?? $k + 1, 'obrigatorio' => !empty($i['obrigatorio']) ? 1 : 0,
                'visivel' => array_key_exists('visivel', $i) ? (!empty($i['visivel']) ? 1 : 0) : 1, 'destaque' => $dest, 'importancia' => ($imp === '' ? null : $imp), 'unidade_id' => $uid];
        }
        if ($destaques > self::MAX_DESTAQUES) throw new AtributosErro('VALIDATION_ERROR', 422, 'No máximo ' . self::MAX_DESTAQUES . ' destaques por kit.', ['itens']);
        return $this->repo->transacao(function () use ($antes, $itens, $b) {
            $this->repo->definirAtributosDoGrupo((int) $antes['id'], $itens, $this->usuario);
            if (!$this->repo->atualizarGrupo((int) $antes['id'], (int) $antes['versao'], [])) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa.');
            $this->repo->auditar($this->usuario, 'itens', 'kit', (string) $antes['id'], ['itens' => $antes['atributos']], ['itens' => $itens], $b['motivo'] ?? null);
            return ['kit' => $this->kit((int) $antes['id'])];
        });
    }

    /**
     * Escopo por categoria/subcategoria ('' = toda a categoria). DSHOW-065: aceita `aplica_a_todos` opcional e grava os DOIS numa única
     * transação — primeiro a versão do kit (0 linhas → 409; sobe UMA vez), depois o escopo, depois UMA auditoria. Sem a flag = forma antiga.
     */
    public function definirEscopos(array $b): array
    {
        $this->exigir();
        $antes = $this->kit((int) ($b['id'] ?? 0)); $this->conferirVersao($antes, $b['versao'] ?? null);
        $esc = [];
        foreach ((array) ($b['escopos'] ?? []) as $e) {
            $c = (string) ($e['categoria'] ?? ''); $s = (string) ($e['subcategoria'] ?? '');
            if (!preg_match('/^[A-Z][A-Z0-9_]{1,39}$/', $c) || ($s !== '' && !preg_match('/^[A-Z][A-Z0-9_]{1,59}$/', $s))) throw new AtributosErro('VALIDATION_ERROR', 422, 'Escopo inválido.', ['escopos']);
            $esc["$c|$s"] = ['categoria' => $c, 'subcategoria' => $s];
        }
        $todos = array_key_exists('aplica_a_todos', $b) ? (!empty($b['aplica_a_todos']) ? 1 : 0) : null;
        return $this->repo->transacao(function () use ($antes, $esc, $b, $todos) {
            if (!$this->repo->atualizarGrupo((int) $antes['id'], (int) $antes['versao'], $todos === null ? [] : ['aplica_a_todos' => $todos])) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa.');
            $this->repo->definirEscopo((int) $antes['id'], array_values($esc), $this->usuario);
            $todosAntes = (int) ($antes['aplica_a_todos'] ?? 0);
            $this->repo->auditar($this->usuario, 'escopos', 'kit', (string) $antes['id'], ['aplica_a_todos' => $todosAntes, 'escopos' => $antes['escopos']], ['aplica_a_todos' => $todos ?? $todosAntes, 'escopos' => array_values($esc)], $b['motivo'] ?? null);
            return ['kit' => $this->kit((int) $antes['id'])];
        });
    }

    /** Produtos avulsos do kit (vínculo direto). */
    public function definirProdutosDoKit(array $b): array
    {
        $this->exigir();
        $g = $this->kit((int) ($b['id'] ?? 0));
        if (!isset($b['versao'])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Falta a versão do kit. Recarregue.', ['versao']);
        $this->conferirVersao($g, $b['versao']);
        $add = array_values(array_unique(array_map('intval', (array) ($b['adicionar'] ?? []))));
        $rem = array_values(array_unique(array_map('intval', (array) ($b['remover'] ?? []))));
        if (count($add) + count($rem) > self::MAX_PRODUTOS_MASSA) throw new AtributosErro('VALIDATION_ERROR', 422, 'Produtos demais numa chamada.', ['adicionar']);
        foreach ($add as $pid) $this->produtoValido($pid);
        return $this->repo->transacao(function () use ($g, $add, $rem) {
            // risco 5: a versão do kit sobe junto (quem leu o kit antes recebe 409), conferida no próprio UPDATE
            if (!$this->repo->atualizarGrupo((int) $g['id'], (int) $g['versao'], [])) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa. Recarregue e tente de novo.');
            $n = ['adicionados' => 0, 'removidos' => 0];
            foreach ($add as $pid) if ($this->repo->definirKitProduto((int) $g['id'], $pid, true, $this->usuario)) { $n['adicionados']++; $this->repo->auditar($this->usuario, 'aplicar_kit', 'produto_kit', "$pid:{$g['id']}", null, ['grupo_id' => (int) $g['id']], null); }
            foreach ($rem as $pid) if ($this->repo->definirKitProduto((int) $g['id'], $pid, false, $this->usuario)) { $n['removidos']++; $this->repo->auditar($this->usuario, 'remover_kit', 'produto_kit', "$pid:{$g['id']}", ['grupo_id' => (int) $g['id']], null, null); }
            return $n + ['produtos' => $this->repo->produtosDiretosDoKit((int) $g['id']), 'versao' => (int) $this->kit((int) $g['id'])['versao']];
        });
    }

    // ---- produto ---------------------------------------------------------------------------------------------------------------------
    /** Kit direto num produto (aba Vínculos). */
    public function definirKitDoProduto(array $b): array
    {
        $this->exigir();
        $pid = (int) ($b['product_id'] ?? 0); $this->produtoValido($pid);
        $g = $this->kit((int) ($b['grupo_id'] ?? 0));
        $ativo = !array_key_exists('ativo', $b) || !empty($b['ativo']);
        $vv = self::versaoVinculosInformada($b);
        return $this->repo->transacao(function () use ($pid, $g, $ativo, $b, $vv) {
            $this->conferirVinculos($pid, $vv);
            $mudou = $this->repo->definirKitProduto((int) $g['id'], $pid, $ativo, $this->usuario);
            if ($mudou) $this->repo->auditar($this->usuario, $ativo ? 'aplicar_kit' : 'remover_kit', 'produto_kit', "$pid:{$g['id']}", $ativo ? null : ['grupo_id' => (int) $g['id']], $ativo ? ['grupo_id' => (int) $g['id']] : null, $b['motivo'] ?? null);
            return ['mudou' => $mudou, 'versao_vinculos' => $this->versaoVinculos($pid)];
        });
    }

    /**
     * Ajuste por produto: modo 'incluir' (avulso), 'excluir' (exceção ao kit; motivo obrigatório), 'ajustar' (só unidade/posição) ou null
     * (remove o ajuste). unidade_id = unidade deste produto para o atributo (D3), mesmo vindo de kit.
     */
    public function definirAjuste(array $b): array
    {
        $this->exigir();
        $pid = (int) ($b['product_id'] ?? 0); $this->produtoValido($pid);
        $aid = (int) ($b['atributo_id'] ?? 0);
        $a = $aid > 0 ? $this->repo->atributo($aid) : null;
        if (!$a) throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        $modo = $b['modo'] ?? null;
        if ($modo !== null && !in_array($modo, ['incluir', 'excluir', 'ajustar'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Modo inválido.', ['modo']);
        if ($modo === 'incluir' && (int) $a['ativo'] !== 1) throw new AtributosErro('VALIDATION_ERROR', 422, 'Atributo desativado não pode ser vinculado.', ['atributo_id']);
        $motivo = self::texto($b['motivo'] ?? null, 255, 'motivo', $modo === 'excluir');
        $uid = isset($b['unidade_id']) && $b['unidade_id'] !== '' && $b['unidade_id'] !== null ? (int) $b['unidade_id'] : null;
        if (!$this->unidadeValida($a, $uid)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Unidade inválida para este atributo.', ['unidade_id']);
        $pos = self::posicao($b['posicao'] ?? null, 'posicao');
        if ($modo === 'ajustar' && $uid === null && !isset($b['posicao'])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe a unidade (ou a posição) a ajustar.', ['unidade_id']);
        $antes = $this->repo->ajusteProduto($pid, $aid);
        $vivo = $antes && $antes['excluido_em'] === null ? $antes : null;
        if ($vivo && isset($b['versao']) && (int) $b['versao'] !== (int) $vivo['versao']) throw new AtributosErro('CONFLICT', 409, 'Este vínculo foi alterado por outra pessoa. Recarregue e tente de novo.');
        // incluir/ajustar sem unidade/posição explícitas mantém as do ajuste vivo (não apaga a unidade do produto sem querer)
        if ($vivo && in_array($modo, ['incluir', 'ajustar'], true) && in_array($vivo['modo'], ['incluir', 'ajustar'], true)) {
            if (!array_key_exists('unidade_id', $b)) $uid = $vivo['unidade_id'] === null ? null : (int) $vivo['unidade_id'];
            if (!array_key_exists('posicao', $b)) $pos = $vivo['posicao'] === null ? null : (int) $vivo['posicao'];
        }
        $dados = $modo === null ? null : ['modo' => $modo, 'unidade_id' => $uid, 'posicao' => $pos, 'motivo' => $motivo];
        $vv = self::versaoVinculosInformada($b);
        return $this->repo->transacao(function () use ($pid, $aid, $dados, $vivo, $b, $vv) {
            $this->conferirVinculos($pid, $vv);   // risco 5: versão obrigatória, conferida sob trava (o UPDATE do repo também exige a versão da linha)
            if ($dados !== null && $dados['modo'] === 'incluir') { $at = $this->repo->travarAtributo($aid, false); if (!$at || (int) $at['ativo'] !== 1) throw new AtributosErro('VALIDATION_ERROR', 422, 'O atributo foi desativado. Atualize a seleção.', ['atributo_id']); }   // P1 (18/11)
            $mudou = $this->repo->definirAjusteProduto($pid, $aid, $dados, $this->usuario);
            if ($mudou) $this->repo->auditar($this->usuario, $dados === null ? 'remover_ajuste' : $dados['modo'], 'produto_atributo', "$pid:$aid", $vivo, $dados, $b['motivo'] ?? null);
            return ['mudou' => $mudou, 'ajuste' => $this->repo->ajusteProduto($pid, $aid), 'versao_vinculos' => $this->versaoVinculos($pid)];
        });
    }

    // ---- em massa --------------------------------------------------------------------------------------------------------------------
    /** Pedido normalizado SEM validar contra o estado atual (só formato) — base da assinatura do recibo (DSHOW-085). */
    private static function pedidoBruto(array $b): array
    {
        $pids = array_values(array_unique(array_map('intval', (array) ($b['produtos'] ?? []))));
        $kA = array_values(array_unique(array_map('intval', (array) ($b['kits_aplicar'] ?? []))));
        $kR = array_values(array_unique(array_map('intval', (array) ($b['kits_remover'] ?? []))));
        $aI = []; foreach ((array) ($b['atributos_incluir'] ?? []) as $x) { $id = (int) (is_array($x) ? ($x['atributo_id'] ?? 0) : $x); if ($id > 0) $aI[$id] = is_array($x) && isset($x['unidade_id']) && $x['unidade_id'] !== '' ? (int) $x['unidade_id'] : null; }
        $aE = []; foreach ((array) ($b['atributos_excluir'] ?? []) as $x) { $id = (int) (is_array($x) ? ($x['atributo_id'] ?? 0) : $x); if ($id > 0) $aE[$id] = is_array($x) ? (string) ($x['motivo'] ?? '') : ''; }
        return [array_fill_keys($pids, true), $kA, $kR, $aI, $aE];
    }

    private function pedidoMassa(array $b): array
    {
        $pids = array_values(array_unique(array_map('intval', (array) ($b['produtos'] ?? []))));
        if (!$pids) throw new AtributosErro('VALIDATION_ERROR', 422, 'Escolha ao menos um produto.', ['produtos']);
        if (count($pids) > self::MAX_PRODUTOS_MASSA) throw new AtributosErro('VALIDATION_ERROR', 422, 'No máximo ' . self::MAX_PRODUTOS_MASSA . ' produtos por vez.', ['produtos']);
        $kA = array_values(array_unique(array_map('intval', (array) ($b['kits_aplicar'] ?? []))));
        $kR = array_values(array_unique(array_map('intval', (array) ($b['kits_remover'] ?? []))));
        $aI = []; foreach ((array) ($b['atributos_incluir'] ?? []) as $x) { $id = (int) (is_array($x) ? ($x['atributo_id'] ?? 0) : $x); if ($id > 0) $aI[$id] = is_array($x) && isset($x['unidade_id']) && $x['unidade_id'] !== '' ? (int) $x['unidade_id'] : null; }
        $aE = []; foreach ((array) ($b['atributos_excluir'] ?? []) as $x) { $id = (int) (is_array($x) ? ($x['atributo_id'] ?? 0) : $x); if ($id > 0) $aE[$id] = is_array($x) ? (string) ($x['motivo'] ?? '') : ''; }
        if (!$kA && !$kR && !$aI && !$aE) throw new AtributosErro('VALIDATION_ERROR', 422, 'Escolha o que aplicar ou remover.', ['kits_aplicar']);
        foreach (array_merge($kA, $kR) as $g) $this->kit($g);
        foreach (array_keys($aI + $aE) as $aid) {
            $a = $this->repo->atributo($aid);
            if (!$a) throw new AtributosErro('VALIDATION_ERROR', 422, "Atributo $aid inválido.", ['atributos_incluir']);
            // P1 (18/11): $aI é [id => unidade|null] — isset() é falso para [id => null] e deixava passar o atributo DESATIVADO
            $incluir = array_key_exists($aid, $aI);
            if ($incluir && (int) $a['ativo'] !== 1) throw self::erroDesativado();
            if ($incluir && !$this->unidadeValida($a, $aI[$aid])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Unidade inválida para "' . $a['rotulo'] . '".', ['atributos_incluir']);
        }
        foreach ($aE as $aid => $mot) { if (trim($mot) === '') throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe o motivo de cada exclusão.', ['atributos_excluir']);
            if (mb_strlen($mot) > 255) throw new AtributosErro('VALIDATION_ERROR', 422, 'Motivo com mais de 255 caracteres.', ['atributos_excluir']); }
        $prods = []; foreach ($pids as $pid) $prods[$pid] = $this->produtoValido($pid);
        return [$prods, $kA, $kR, $aI, $aE];
    }

    /** P1 (18/11): atributo desativado entre a escolha (ou a prévia) e a confirmação — nada é gravado. */
    private static function erroDesativado(): AtributosErro
    {
        return new AtributosErro('VALIDATION_ERROR', 422, 'O atributo foi desativado. Atualize a seleção.', ['atributos_incluir']);
    }

    /**
     * P1 (18/11, prévia × gravação): UMA regra, usada pela prévia E pela gravação, para decidir se incluir o atributo $aid no produto muda
     * algo. Já presente na ficha por QUALQUER origem (kit geral, por escopo, direto ou avulso) = sem mudança: nenhum avulso é criado.
     * Ausente (inclusive excluído do produto por exceção) = entra na ficha como avulso. $fichaAntes = Aplicabilidade::ficha ANTES do pedido.
     * @param array<int,mixed> $fichaAntes  @param array<int,?int> $aI  @return array<int,?int> só os atributos que ENTRAM
     */
    public static function inclusoesQueEntram(array $fichaAntes, array $aI): array
    {
        return array_diff_key($aI, $fichaAntes);
    }

    /** Ações opostas (hotfix 18/11): o mesmo kit em aplicar E remover, ou o mesmo atributo em incluir E excluir → 422, nada é gravado. */
    private function recusarAmbiguo(array $kA, array $kR, array $aI, array $aE): void
    {
        if ($k = array_values(array_intersect($kA, $kR)))
            throw new AtributosErro('VALIDATION_ERROR', 422, 'O kit ' . $this->kit((int) $k[0])['nome'] . ' está marcado para aplicar e remover. Escolha uma ação.', ['kits_aplicar', 'kits_remover']);
        if ($a = array_values(array_intersect(array_keys($aI), array_keys($aE))))
            throw new AtributosErro('VALIDATION_ERROR', 422, 'O atributo ' . ($this->repo->atributo((int) $a[0])['rotulo'] ?? '#' . $a[0]) . ' está marcado para incluir e excluir. Escolha uma ação.', ['atributos_incluir', 'atributos_excluir']);
    }

    /** Prévia obrigatória (§11.4): efeito por produto antes de gravar. Simula sobre o retrato do modelo, sem gravar nada. */
    public function previaMassa(array $b): array
    {
        $this->exigir();
        [$prods, $kA, $kR, $aI, $aE] = $this->pedidoMassa($b);
        $this->recusarAmbiguo($kA, $kR, $aI, $aE);
        $gv = $this->repo->versoesGrupos(false);
        $m = $this->repo->retratoModelo(null);
        $plano = self::planoMassa($m, $prods, $kA, $kR, $aI, $aE);   // DSHOW-096: o MESMO plano que a gravação recalcula e confere sob trava
        [$tot, $por] = self::resumoDoPlano($plano, $prods, $aI, $aE);
        return ['resumo' => $tot, 'produtos' => $por, 'versao_previa' => $this->versaoMassa($prods, $kA, $kR, $aI, $aE, $plano, $gv, false)];
    }

    /** Resumo e linhas por produto de UM plano (a prévia mostra; a gravação grava o mesmo resumo no recibo). @return array{0: array, 1: array} */
    private static function resumoDoPlano(array $plano, array $prods, array $aI, array $aE): array
    {
        $tot = ['produtos' => count($prods), 'produtos_afetados' => 0, 'atributos_acrescentados' => 0, 'atributos_removidos' => 0, 'ja_tinham' => 0, 'kits_ja_aplicados' => 0, 'vinculos_novos' => 0];
        $por = [];
        foreach ($prods as $pid => $p) {
            $pl = $plano['produtos'][(int) $pid];
            $mais = array_keys($pl['efeito'], 'incluir', true); $menos = array_keys($pl['efeito'], 'remover', true);
            if ($mais || $menos) $tot['produtos_afetados']++;
            $tot['atributos_acrescentados'] += count($mais); $tot['atributos_removidos'] += count($menos); $tot['ja_tinham'] += count($aI) - count($pl['entram']);
            $tot['vinculos_novos'] += count($pl['entram']); $tot['kits_ja_aplicados'] += $pl['kits_ja'];
            // efeitos mostrados: o que muda + o que foi pedido (array_key_exists: $aI é [id => unidade|null] e isset seria falso para null)
            $efeitos = []; foreach ($pl['efeito'] as $aid => $ef) if ($ef !== 'sem_mudanca' || array_key_exists($aid, $aI) || array_key_exists($aid, $aE)) $efeitos[] = ['atributo_id' => $aid, 'efeito' => $ef];
            $por[] = ['product_id' => $pid, 'nome' => $p['nome'], 'acrescenta' => count($mais), 'remove' => count($menos), 'antes' => $pl['antes'], 'depois' => $pl['depois'],
                'entram' => array_map('intval', array_keys($pl['entram'])), 'ja_aplicaveis' => array_map('intval', array_keys(array_diff_key($aI, $pl['entram']))),
                'efeitos' => $efeitos, 'kits_origem' => $pl['kits_origem']];
        }
        return [$tot, $por];
    }

    /**
     * Aplica em massa, idempotente pela chave (risco residual 1): a chave entra em eq_pedido_massa (índice ÚNICO) na MESMA transação que
     * grava. Dois envios simultâneos com a mesma chave ficam em fila no índice: só um aplica; o outro devolve o resultado do primeiro
     * ("repetido") ou 409 se o pedido for outro. Risco 5: a versão da prévia é obrigatória e conferida sob trava → 409 se algo mudou.
     */
    public function aplicarMassa(array $b): array
    {
        $this->exigir();
        $chave = (string) ($b['chave'] ?? '');
        if (!preg_match('/^[A-Za-z0-9_-]{8,64}$/', $chave)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Chave de idempotência inválida.', ['chave']);
        $vp = $b['versao_previa'] ?? null;
        if (!is_string($vp) || !preg_match('/^[0-9a-f]{64}$/', $vp)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Falta a versão da prévia. Gere a prévia de novo.', ['versao_previa']);
        // DSHOW-085: lote INCERTO reenviado com a mesma chave = devolve o recibo, sem revalidar contra o estado de agora (um produto que saiu
        // do catálogo depois não transforma "já gravado" em 422) e sem criar operação nova. Assinatura pelo pedido bruto canônico (= a gravada).
        if ($ja = $this->repo->pedidoMassa($chave)) {
            [$pb, $kb, $rb, $ib, $eb] = self::pedidoBruto($b);
            $ab = hash('sha256', json_encode(self::intencaoMassa($pb, $kb, $rb, $ib, $eb)));
            if (!self::titularDoPedido($ja, $this->titularId, $this->usuario)) throw new AtributosErro('CONFLICT', 409, 'Esta chave já foi usada para outro pedido. Gere a prévia de novo.');   // DSHOW-086
            if ($ja['assinatura'] === $ab) return ['repetido' => true] + self::canonMassa(is_array($ja['resultado']) ? $ja['resultado'] : []);   // mesma ordem da 1ª resposta
            // assinatura legada (pré-DSHOW-056) ou pedido diferente: o caminho completo abaixo decide (repetido legado × 409)
        }
        [$p0, $k0, $r0, $i0, $e0] = $this->pedidoMassa($b);
        $assinatura = hash('sha256', json_encode(self::intencaoMassa($p0, $k0, $r0, $i0, $e0)));   // DSHOW-056: canônica (ordem não importa)
        $assinaturaLegada = hash('sha256', json_encode([array_keys($p0), $k0, $r0, $i0, $e0]));     // recibos gravados antes continuam válidos
        $repetido = function (array $ped) use ($assinatura, $assinaturaLegada): array {
            if (!self::titularDoPedido($ped, $this->titularId, $this->usuario)) throw new AtributosErro('CONFLICT', 409, 'Esta chave já foi usada para outro pedido. Gere a prévia de novo.');   // DSHOW-086: mesma resposta, sem revelar o titular
            if ($ped['assinatura'] !== $assinatura && $ped['assinatura'] !== $assinaturaLegada) throw new AtributosErro('CONFLICT', 409, 'Esta chave já foi usada para outro pedido. Gere a prévia de novo.');
            return ['repetido' => true] + self::canonMassa(is_array($ped['resultado']) ? $ped['resultado'] : []);   // mesma ordem de chaves da 1ª resposta
        };
        if ($ja = $this->repo->pedidoMassa($chave)) return $repetido($ja);
        $this->recusarAmbiguo($k0, $r0, $i0, $e0);   // depois do recibo (chave já gravada continua "repetido"), antes de prévia/registro/gravação
        [$prods, $kA, $kR, $aI, $aE] = [$p0, $k0, $r0, $i0, $e0];
        $res = $this->repo->transacao(function () use ($prods, $kA, $kR, $aI, $aE, $chave, $b, $assinatura, $vp) {
            if (!$this->repo->registrarPedidoMassa($chave, $assinatura, $this->usuario, count($prods))) return null;   // outro envio com a mesma chave já gravou
            if ($this->titularId !== null && $this->repo instanceof OperacoesRepositorio && method_exists($this->repo, 'temTitularMassa') && $this->repo->temTitularMassa())
                $this->repo->titularPedidoMassa($chave, $this->titularId);   // DSHOW-086: titular estável, na MESMA transação
            // DSHOW-096 (Codex P1): TRAVAS antes de ler o modelo — todos os kits (FOR SHARE: nenhum kit muda até o COMMIT) e os vínculos dos
            // produtos (FOR UPDATE). P1 (18/11): o atributo continua ATIVO? (trava compartilhada; desativado = 422, antes da conferência do plano).
            $gv = $this->repo->versoesGrupos(true);
            $this->repo->versoesVinculos(array_keys($prods), true);
            foreach ($aI as $aid => $_) { $at = $this->repo->travarAtributo((int) $aid, false); if (!$at || (int) $at['ativo'] !== 1) throw self::erroDesativado(); }
            // o PLANO é recalculado aqui, com o modelo lido DEPOIS das travas, e tem de ser IGUAL ao da prévia (efeito por produto×atributo,
            // kits de origem — inclusive indireta — e suas versões). Divergiu = 409 e o ROLLBACK leva junto o registro da chave: nenhum avulso,
            // nenhuma auditoria de inclusão, nenhum recibo de sucesso.
            $m = $this->repo->retratoModelo(null);
            $plano = self::planoMassa($m, $prods, $kA, $kR, $aI, $aE);
            if ($this->versaoMassa($prods, $kA, $kR, $aI, $aE, $plano, $gv, true) !== $vp)
                throw new AtributosErro('CONFLICT', 409, 'O pedido, os vínculos ou um kit de origem mudaram desde a prévia. Gere a prévia de novo.');
            $n = ['kits_aplicados' => 0, 'kits_removidos' => 0, 'inclusoes' => 0, 'exclusoes' => 0];
            foreach ($prods as $pid => $p) {
                $entram = $plano['produtos'][(int) $pid]['entram'];   // exatamente o que a prévia mostrou
                foreach ($kA as $g) if ($this->repo->definirKitProduto($g, $pid, true, $this->usuario)) { $n['kits_aplicados']++; $this->repo->auditar($this->usuario, 'aplicar_kit', 'produto_kit', "$pid:$g", null, ['grupo_id' => $g, 'massa' => $chave], null); }
                foreach ($kR as $g) if ($this->repo->definirKitProduto($g, $pid, false, $this->usuario)) { $n['kits_removidos']++; $this->repo->auditar($this->usuario, 'remover_kit', 'produto_kit', "$pid:$g", ['grupo_id' => $g], ['massa' => $chave], null); }
                foreach ($entram as $aid => $u) { $ex = $this->repo->ajusteProduto($pid, $aid); $ex = $ex && $ex['excluido_em'] === null && in_array($ex['modo'], ['incluir', 'ajustar'], true) ? $ex : null;
                    $d = ['modo' => 'incluir', 'unidade_id' => $u ?? ($ex ? ($ex['unidade_id'] === null ? null : (int) $ex['unidade_id']) : null), 'posicao' => $ex && $ex['posicao'] !== null ? (int) $ex['posicao'] : null, 'motivo' => null]; if ($this->repo->definirAjusteProduto($pid, $aid, $d, $this->usuario)) { $n['inclusoes']++; $this->repo->auditar($this->usuario, 'incluir', 'produto_atributo', "$pid:$aid", null, $d + ['massa' => $chave], null); } }
                foreach ($aE as $aid => $mot) { $d = ['modo' => 'excluir', 'unidade_id' => null, 'posicao' => null, 'motivo' => $mot]; if ($this->repo->definirAjusteProduto($pid, $aid, $d, $this->usuario)) { $n['exclusoes']++; $this->repo->auditar($this->usuario, 'excluir', 'produto_atributo', "$pid:$aid", null, $d + ['massa' => $chave], null); } }
            }
            $res = ['gravado' => $n, 'resumo' => self::resumoDoPlano($plano, $prods, $aI, $aE)[0], 'assinatura' => $assinatura] + (array_sum($n) === 0 ? ['sem_mudanca' => true] : [])   // 0 efeitos = desfecho sem_mudanca
                + ['confirmado_em' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\\TH:i:s.v\\Z')];   // carimbo do recibo, no MESMO COMMIT
            $res = self::canonMassa($res);   // ordem canônica: a 1ª resposta sai igual ao reenvio (a coluna JSON do MySQL reordena as chaves)
            $this->repo->concluirPedidoMassa($chave, $res);
            $this->repo->auditar($this->usuario, 'aplicar', 'massa', $chave, null, $res, $b['motivo'] ?? null);
            return $res;
        });
        if ($res !== null) return $res;
        $ped = $this->repo->pedidoMassa($chave);
        if ($ped === null) throw new AtributosErro('CONFLICT', 409, 'Outro envio com esta chave está em andamento. Recarregue e confira.');
        return $repetido($ped);
    }
}
