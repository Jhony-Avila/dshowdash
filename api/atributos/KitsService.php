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
    ) {}

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
    }

    private function kit(int $id): array
    {
        return $this->repo->grupo($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Kit não encontrado.');
    }

    private function conferirVersao(array $g, mixed $versao): void
    {
        if ((int) $versao !== (int) $g['versao']) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa. Recarregue e tente de novo.');
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

    /** Escopo por categoria/subcategoria ('' = toda a categoria). */
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
        return $this->repo->transacao(function () use ($antes, $esc, $b) {
            $this->repo->definirEscopo((int) $antes['id'], array_values($esc), $this->usuario);
            if (!$this->repo->atualizarGrupo((int) $antes['id'], (int) $antes['versao'], [])) throw new AtributosErro('CONFLICT', 409, 'Este kit foi alterado por outra pessoa.');
            $this->repo->auditar($this->usuario, 'escopos', 'kit', (string) $antes['id'], ['escopos' => $antes['escopos']], ['escopos' => array_values($esc)], $b['motivo'] ?? null);
            return ['kit' => $this->kit((int) $antes['id'])];
        });
    }

    /** Produtos avulsos do kit (vínculo direto). */
    public function definirProdutosDoKit(array $b): array
    {
        $this->exigir();
        $g = $this->kit((int) ($b['id'] ?? 0));
        $add = array_values(array_unique(array_map('intval', (array) ($b['adicionar'] ?? []))));
        $rem = array_values(array_unique(array_map('intval', (array) ($b['remover'] ?? []))));
        if (count($add) + count($rem) > self::MAX_PRODUTOS_MASSA) throw new AtributosErro('VALIDATION_ERROR', 422, 'Produtos demais numa chamada.', ['adicionar']);
        foreach ($add as $pid) $this->produtoValido($pid);
        return $this->repo->transacao(function () use ($g, $add, $rem) {
            $n = ['adicionados' => 0, 'removidos' => 0];
            foreach ($add as $pid) if ($this->repo->definirKitProduto((int) $g['id'], $pid, true, $this->usuario)) { $n['adicionados']++; $this->repo->auditar($this->usuario, 'aplicar_kit', 'produto_kit', "$pid:{$g['id']}", null, ['grupo_id' => (int) $g['id']], null); }
            foreach ($rem as $pid) if ($this->repo->definirKitProduto((int) $g['id'], $pid, false, $this->usuario)) { $n['removidos']++; $this->repo->auditar($this->usuario, 'remover_kit', 'produto_kit', "$pid:{$g['id']}", ['grupo_id' => (int) $g['id']], null, null); }
            return $n + ['produtos' => $this->repo->produtosDiretosDoKit((int) $g['id'])];
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
        return $this->repo->transacao(function () use ($pid, $g, $ativo, $b) {
            $mudou = $this->repo->definirKitProduto((int) $g['id'], $pid, $ativo, $this->usuario);
            if ($mudou) $this->repo->auditar($this->usuario, $ativo ? 'aplicar_kit' : 'remover_kit', 'produto_kit', "$pid:{$g['id']}", $ativo ? null : ['grupo_id' => (int) $g['id']], $ativo ? ['grupo_id' => (int) $g['id']] : null, $b['motivo'] ?? null);
            return ['mudou' => $mudou];
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
        return $this->repo->transacao(function () use ($pid, $aid, $dados, $vivo, $b) {
            $mudou = $this->repo->definirAjusteProduto($pid, $aid, $dados, $this->usuario);
            if ($mudou) $this->repo->auditar($this->usuario, $dados === null ? 'remover_ajuste' : $dados['modo'], 'produto_atributo', "$pid:$aid", $vivo, $dados, $b['motivo'] ?? null);
            return ['mudou' => $mudou, 'ajuste' => $this->repo->ajusteProduto($pid, $aid)];
        });
    }

    // ---- em massa --------------------------------------------------------------------------------------------------------------------
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
            if (!$a || ((int) $a['ativo'] !== 1 && isset($aI[$aid]))) throw new AtributosErro('VALIDATION_ERROR', 422, "Atributo $aid inválido.", ['atributos_incluir']);
            if (isset($aI[$aid]) && !$this->unidadeValida($a, $aI[$aid])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Unidade inválida para "' . $a['rotulo'] . '".', ['atributos_incluir']);
        }
        foreach ($aE as $aid => $mot) { if (trim($mot) === '') throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe o motivo de cada exclusão.', ['atributos_excluir']);
            if (mb_strlen($mot) > 255) throw new AtributosErro('VALIDATION_ERROR', 422, 'Motivo com mais de 255 caracteres.', ['atributos_excluir']); }
        $prods = []; foreach ($pids as $pid) $prods[$pid] = $this->produtoValido($pid);
        return [$prods, $kA, $kR, $aI, $aE];
    }

    /** Prévia obrigatória (§11.4): efeito por produto antes de gravar. Simula sobre o retrato do modelo, sem gravar nada. */
    public function previaMassa(array $b): array
    {
        $this->exigir();
        [$prods, $kA, $kR, $aI, $aE] = $this->pedidoMassa($b);
        $m = $this->repo->retratoModelo(null);
        $dir = $m->diretos; $aj = $m->ajustes;
        $tot = ['produtos' => count($prods), 'produtos_afetados' => 0, 'atributos_acrescentados' => 0, 'atributos_removidos' => 0, 'ja_tinham' => 0, 'kits_ja_aplicados' => 0];
        $por = [];
        foreach ($prods as $pid => $p) {
            $antes = Aplicabilidade::ficha($m, $p);
            $d2 = $dir; $a2 = $aj;
            foreach ($kA as $g) { if (in_array($g, $d2[$pid] ?? [], true)) $tot['kits_ja_aplicados']++; $d2[$pid] = array_values(array_unique(array_merge($d2[$pid] ?? [], [$g]))); }
            foreach ($kR as $g) $d2[$pid] = array_values(array_diff($d2[$pid] ?? [], [$g]));
            foreach ($aI as $aid => $u) $a2[$pid][$aid] = ['modo' => 'incluir', 'unidade_id' => $u, 'posicao' => null, 'motivo' => null];
            foreach ($aE as $aid => $mot) $a2[$pid][$aid] = ['modo' => 'excluir', 'unidade_id' => null, 'posicao' => null, 'motivo' => $mot];
            $depois = Aplicabilidade::ficha(new RetratoModelo($m->grupos, $m->escopos, $m->itens, $d2, $a2, $m->atributos), $p);
            $mais = array_diff_key($depois, $antes); $menos = array_diff_key($antes, $depois);
            $ja = 0; foreach ($aI as $aid => $_) if (isset($antes[$aid])) $ja++;
            if ($mais || $menos) $tot['produtos_afetados']++;
            $tot['atributos_acrescentados'] += count($mais); $tot['atributos_removidos'] += count($menos); $tot['ja_tinham'] += $ja;
            $por[] = ['product_id' => $pid, 'nome' => $p['nome'], 'acrescenta' => count($mais), 'remove' => count($menos), 'antes' => count($antes), 'depois' => count($depois)];
        }
        return ['resumo' => $tot, 'produtos' => $por];
    }

    /** Aplica em massa, idempotente pela chave (repetir a mesma chave devolve o resultado da 1ª vez, sem gravar de novo). */
    public function aplicarMassa(array $b): array
    {
        $this->exigir();
        $chave = (string) ($b['chave'] ?? '');
        if (!preg_match('/^[A-Za-z0-9_-]{8,64}$/', $chave)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Chave de idempotência inválida.', ['chave']);
        [$p0, $k0, $r0, $i0, $e0] = $this->pedidoMassa($b);
        $assinatura = hash('sha256', json_encode([array_keys($p0), $k0, $r0, $i0, $e0]));
        $ja = $this->repo->auditoriaPorChave('massa', $chave);
        if ($ja) {
            $dep = is_array($ja['depois']) ? $ja['depois'] : (json_decode((string) $ja['depois'], true) ?: []);
            if (isset($dep['assinatura']) && $dep['assinatura'] !== $assinatura) throw new AtributosErro('CONFLICT', 409, 'Esta chave já foi usada para outro pedido. Gere a prévia de novo.');
            return ['repetido' => true] + $dep;
        }
        $previa = $this->previaMassa($b);
        [$prods, $kA, $kR, $aI, $aE] = $this->pedidoMassa($b);
        return $this->repo->transacao(function () use ($prods, $kA, $kR, $aI, $aE, $previa, $chave, $b, $assinatura) {
            $n = ['kits_aplicados' => 0, 'kits_removidos' => 0, 'inclusoes' => 0, 'exclusoes' => 0];
            foreach ($prods as $pid => $_) {
                foreach ($kA as $g) if ($this->repo->definirKitProduto($g, $pid, true, $this->usuario)) { $n['kits_aplicados']++; $this->repo->auditar($this->usuario, 'aplicar_kit', 'produto_kit', "$pid:$g", null, ['grupo_id' => $g, 'massa' => $chave], null); }
                foreach ($kR as $g) if ($this->repo->definirKitProduto($g, $pid, false, $this->usuario)) { $n['kits_removidos']++; $this->repo->auditar($this->usuario, 'remover_kit', 'produto_kit', "$pid:$g", ['grupo_id' => $g], ['massa' => $chave], null); }
                foreach ($aI as $aid => $u) { $ex = $this->repo->ajusteProduto($pid, $aid); $ex = $ex && $ex['excluido_em'] === null && in_array($ex['modo'], ['incluir', 'ajustar'], true) ? $ex : null;
                    $d = ['modo' => 'incluir', 'unidade_id' => $u ?? ($ex ? ($ex['unidade_id'] === null ? null : (int) $ex['unidade_id']) : null), 'posicao' => $ex && $ex['posicao'] !== null ? (int) $ex['posicao'] : null, 'motivo' => null]; if ($this->repo->definirAjusteProduto($pid, $aid, $d, $this->usuario)) { $n['inclusoes']++; $this->repo->auditar($this->usuario, 'incluir', 'produto_atributo', "$pid:$aid", null, $d + ['massa' => $chave], null); } }
                foreach ($aE as $aid => $mot) { $d = ['modo' => 'excluir', 'unidade_id' => null, 'posicao' => null, 'motivo' => $mot]; if ($this->repo->definirAjusteProduto($pid, $aid, $d, $this->usuario)) { $n['exclusoes']++; $this->repo->auditar($this->usuario, 'excluir', 'produto_atributo', "$pid:$aid", null, $d + ['massa' => $chave], null); } }
            }
            $res = ['gravado' => $n, 'resumo' => $previa['resumo'], 'assinatura' => $assinatura];
            $this->repo->auditar($this->usuario, 'aplicar', 'massa', $chave, null, $res, $b['motivo'] ?? null);
            return $res;
        });
    }
}
