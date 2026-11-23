<?php
// /api/atributos/LeituraVitrinePdo.php — implementação PDO da LeituraVitrine (só SELECT; schemas qualificados). Na validação, o "catálogo"
// é o retrato (C1) dentro do próprio schema de atributos; em produção, APP_DSHOW (permissão coluna a coluna, portão P2).
declare(strict_types=1);

require_once __DIR__ . '/ProdutosLeitura.php';
require_once __DIR__ . '/CatalogoPdo.php';

final class LeituraVitrinePdo implements LeituraVitrine, LeituraConferencia
{
    private string $eq; private string $ap; private string $schemaApp; private ?bool $temSuprimida = null;

    public function __construct(private readonly PDO $pdo, string $schemaEq = 'DSHOW_EQUIPAMENTOS', string $schemaApp = 'APP_DSHOW')
    {
        foreach ([$schemaEq, $schemaApp] as $s) if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $s)) throw new InvalidArgumentException('schema inválido');
        $this->eq = "`$schemaEq`."; $this->ap = "`$schemaApp`."; $this->schemaApp = $schemaApp;
    }

    private function q(string $sql, array $p = []): array { $st = $this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); }
    private function qOpcional(string $sql, array $p = []): ?array
    {
        try { return $this->q($sql, $p); }
        catch (PDOException $e) { error_log('[atributos/leitura] opcional sem leitura: ' . ($e->errorInfo[1] ?? '?')); return null; }
    }

    /** Filtro de mídia elegível (§13): publicada, visível, não excluída e não suprimida. */
    private function filtroMidia(string $a = 'm'): string
    {
        if ($this->temSuprimida === null) $this->temSuprimida = (bool) $this->qOpcional("SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = 'product_media' AND column_name = 'suprimida'", [$this->schemaApp]);
        $sup = $this->temSuprimida ? " AND $a.suprimida = 0"
            : " AND NOT EXISTS (SELECT 1 FROM {$this->ap}`product_media_suppressions` s WHERE s.lifted_at IS NULL AND (s.media_id = $a.id OR (s.product_id = $a.product_id AND s.sha256 = $a.sha256)))";
        return "$a.deleted_at IS NULL AND $a.visibility = 'published' AND $a.hidden_at IS NULL$sup";
    }

    public function catalogo(): array
    {
        $out = [];
        try { $rs = $this->q('SELECT id, name, category, subcategory, active FROM ' . $this->ap . '`product_catalog` WHERE deleted = 0'); }
        catch (PDOException $e) { throw new CatalogoIndisponivel('catálogo ilegível', 0, $e); }
        foreach ($rs as $r) $out[(int) $r['id']] = ['id' => (int) $r['id'], 'nome' => (string) $r['name'], 'categoria' => (string) $r['category'],
            'subcategoria' => $r['subcategory'] === null ? null : (string) $r['subcategory'], 'ativo' => (int) $r['active'] === 1];
        return $out;
    }

    public function fotosResumo(): array
    {
        $rs = $this->qOpcional("SELECT m.product_id, COUNT(*) AS n,
                SUBSTRING_INDEX(GROUP_CONCAT(m.id ORDER BY m.is_cover DESC, m.position, m.id), ',', 1) AS capa_id,
                SUBSTRING_INDEX(GROUP_CONCAT(IFNULL(m.avg_color, '') ORDER BY m.is_cover DESC, m.position, m.id), ',', 1) AS cor
             FROM " . $this->ap . "`product_media` m WHERE " . $this->filtroMidia() . " GROUP BY m.product_id") ?? [];
        $out = [];
        foreach ($rs as $r) $out[(int) $r['product_id']] = ['n' => (int) $r['n'], 'capa_id' => (int) $r['capa_id'], 'cor' => $r['cor'] === '' ? null : $r['cor']];
        return $out;
    }

    public function fotos(int $productId): array
    {
        $rs = $this->qOpcional("SELECT m.id, m.is_cover, m.position, m.avg_color, m.width, m.height FROM " . $this->ap . "`product_media` m
             WHERE m.product_id = ? AND " . $this->filtroMidia() . " ORDER BY m.is_cover DESC, m.position, m.id", [$productId]) ?? [];
        return array_map(static fn($r) => ['id' => (int) $r['id'], 'capa' => (int) $r['is_cover'] === 1, 'posicao' => (int) $r['position'],
            'cor' => $r['avg_color'], 'largura' => (int) $r['width'], 'altura' => (int) $r['height']], $rs);
    }

    public function fotoElegivel(int $mediaId): bool
    {
        return (bool) $this->qOpcional('SELECT 1 FROM ' . $this->ap . '`product_media` m WHERE m.id = ? AND ' . $this->filtroMidia(), [$mediaId]);
    }

    public function familiasPrecifica(): array
    {
        $out = [];
        foreach ($this->qOpcional('SELECT product_id, kind FROM ' . $this->ap . '`product_specs` WHERE deleted_at IS NULL ORDER BY product_id, kind') ?? [] as $r) $out[(int) $r['product_id']][] = (string) $r['kind'];
        return $out;
    }

    public function specs(int $productId): ?array
    {
        $rs = $this->qOpcional('SELECT kind, attrs_json FROM ' . $this->ap . '`product_specs` WHERE product_id = ? AND deleted_at IS NULL ORDER BY kind', [$productId]);
        if ($rs === null) return null;
        $out = [];
        foreach ($rs as $r) { $d = json_decode((string) $r['attrs_json'], true); $out[(string) $r['kind']] = is_array($d) ? $d : []; }
        return $out;
    }

    public function estadosValores(): array
    {
        $out = [];
        foreach ($this->q('SELECT product_id, atributo_id, MIN(estado) AS estado FROM ' . $this->eq . '`eq_valor` WHERE excluido_em IS NULL GROUP BY product_id, atributo_id') as $r) $out[(int) $r['product_id']][(int) $r['atributo_id']] = $r['estado'];
        return $out;
    }

    /** DSHOW-049: a trilha de cada atributo do produto (linhas vivas E excluídas) para a versão do conjunto. @return array<int,list<array>> */
    public function trilhaConjuntos(int $productId): array
    {
        $out = []; foreach ($this->q('SELECT atributo_id, opcao_chave, versao, excluido_em FROM ' . $this->eq . '`eq_valor` WHERE product_id = ?', [$productId]) as $r) $out[(int) $r['atributo_id']][] = $r;
        return $out;
    }

    public function valoresDetalhe(int $productId): array
    {
        return $this->q('SELECT v.atributo_id, v.opcao_id, o.rotulo AS opcao, v.valor_texto, v.valor_num, v.valor_bool, v.valor_data, v.unidade_id, v.estado, v.origem, v.versao, v.lote_id,
                v.legado_bruto, v.atualizado_por, v.criado_em, v.atualizado_em
             FROM ' . $this->eq . '`eq_valor` v LEFT JOIN ' . $this->eq . '`eq_opcao` o ON o.id = v.opcao_id
            WHERE v.product_id = ? AND v.excluido_em IS NULL ORDER BY v.atributo_id, o.posicao, o.id, v.id', [$productId]);   // DSHOW-035 #5: opções na ordem do dicionário, como o app
    }

    /** Chave do bruto = "P<item>A<atributo legado>" (nas 450 órfãs o Id_atributo do JSON é NULL e a chave o recupera). */
    public function legadoResumo(): array
    {
        $rs = $this->q("SELECT CAST(SUBSTRING(SUBSTRING_INDEX(chave, 'A', 1), 2) AS UNSIGNED) AS item,
                GROUP_CONCAT(CAST(SUBSTRING_INDEX(chave, 'A', -1) AS UNSIGNED) ORDER BY CAST(SUBSTRING_INDEX(chave, 'A', -1) AS UNSIGNED)) AS ids,
                SUM(TRIM(IFNULL(JSON_UNQUOTE(JSON_EXTRACT(linha, '$.valor_atributo')), '')) NOT IN ('', 'null')) AS preenchidos
             FROM " . $this->eq . "`eq_legado_bruto` WHERE tabela = 'mm_atributos_x_itens' AND chave LIKE 'P%A%' GROUP BY item");
        $out = [];
        foreach ($rs as $r) $out[(int) $r['item']] = ['ids_legado' => array_map('intval', explode(',', (string) $r['ids'])), 'preenchidos' => (int) $r['preenchidos']];
        return $out;
    }

    public function legadoDoItem(int $item): array
    {
        $rs = $this->q("SELECT CAST(SUBSTRING_INDEX(chave, 'A', -1) AS UNSIGNED) AS id_legado,
                JSON_UNQUOTE(JSON_EXTRACT(linha, '$.valor_atributo')) AS valor, JSON_UNQUOTE(JSON_EXTRACT(linha, '$.tp_unit')) AS tp_unit,
                JSON_UNQUOTE(JSON_EXTRACT(linha, '$.updated_at')) AS atualizado_legado
             FROM " . $this->eq . "`eq_legado_bruto` WHERE tabela = 'mm_atributos_x_itens' AND chave LIKE ? ORDER BY id_legado", ['P' . $item . 'A%']);
        return array_map(static fn($r) => ['id_legado' => (int) $r['id_legado'], 'valor' => $r['valor'] === 'null' ? null : $r['valor'],
            'tp_unit' => $r['tp_unit'] === 'null' ? null : $r['tp_unit'], 'atualizado_legado' => $r['atualizado_legado'] === 'null' ? null : $r['atualizado_legado']], $rs);
    }

    public function vinculos(): array
    {
        $out = [];
        foreach ($this->q("SELECT chave_antiga, product_id FROM " . $this->eq . "`eq_legado_vinculo` WHERE estado = 'inequivoca' AND product_id > 0") as $r) $out[(int) $r['chave_antiga']] = (int) $r['product_id'];
        return $out;
    }

    public function atributos(): array
    {
        $out = [];
        foreach ($this->q("SELECT a.id, a.codigo, a.rotulo, a.tipo, a.unidade_id, u.simbolo AS unidade, a.casas, a.minimo, a.maximo, a.descricao, a.ativo, a.versao,
                a.autoridade, a.precifica_ref, a.aceita_nao_se_aplica, a.importancia_padrao, a.legado_id,
                JSON_UNQUOTE(JSON_EXTRACT(a.legado_meta, '$.importancia_campos')) AS importancia_legado,
                JSON_UNQUOTE(JSON_EXTRACT(a.legado_meta, '$.normalizado.grupo_atributos')) AS grupo_atributos
             FROM " . $this->eq . "`eq_atributo` a LEFT JOIN " . $this->eq . "`eq_unidade` u ON u.id = a.unidade_id") as $r) {
            $imp = $r['importancia_padrao'] ?? (Aplicabilidade::IMPORTANCIA_DO_LEGADO[$r['importancia_legado'] ?? ''] ?? null);
            $out[(int) $r['id']] = ['id' => (int) $r['id'], 'legado_id' => $r['legado_id'] === null ? null : (int) $r['legado_id'], 'codigo' => (string) $r['codigo'],
                'rotulo' => (string) $r['rotulo'], 'tipo' => (string) $r['tipo'], 'unidade_id' => $r['unidade_id'] === null ? null : (int) $r['unidade_id'], 'unidade' => $r['unidade'],
                'casas' => $r['casas'] === null ? null : (int) $r['casas'], 'minimo' => $r['minimo'], 'maximo' => $r['maximo'], 'descricao' => $r['descricao'],
                'ativo' => (int) $r['ativo'], 'versao' => (int) $r['versao'], 'autoridade' => $r['autoridade'], 'precifica_ref' => $r['precifica_ref'],
                'aceita_nao_se_aplica' => (int) $r['aceita_nao_se_aplica'], 'importancia_padrao' => $imp, 'importancia_legado' => $r['importancia_legado'] === 'null' ? null : $r['importancia_legado'],
                'grupo_atributos' => $r['grupo_atributos'] === 'null' ? null : $r['grupo_atributos']];
        }
        return $out;
    }

    public function opcoes(array $atributoIds): array
    {
        $ids = array_values(array_filter(array_map('intval', $atributoIds)));
        if (!$ids) return [];
        $out = [];
        foreach ($this->q('SELECT id, atributo_id, rotulo, posicao, ativo FROM ' . $this->eq . '`eq_opcao` WHERE atributo_id IN (' . implode(',', array_fill(0, count($ids), '?')) . ') ORDER BY atributo_id, posicao, id', $ids) as $o)
            $out[(int) $o['atributo_id']][] = ['id' => (int) $o['id'], 'rotulo' => $o['rotulo'], 'posicao' => (int) $o['posicao'], 'ativo' => (bool) (int) $o['ativo']];
        return $out;
    }

    public function unidades(): array
    {
        $out = [];
        foreach ($this->q('SELECT id, simbolo, nome, grandeza, fator_base, ativo FROM ' . $this->eq . '`eq_unidade` ORDER BY grandeza, simbolo') as $u) $out[(int) $u['id']] = ['id' => (int) $u['id'], 'simbolo' => $u['simbolo'], 'nome' => $u['nome'], 'grandeza' => $u['grandeza'], 'fator_base' => $u['fator_base'], 'ativo' => (int) $u['ativo']];
        return $out;
    }

    public function unidadesExtras(): array
    {
        $out = [];
        foreach ($this->q('SELECT atributo_id, unidade_id FROM ' . $this->eq . '`eq_atributo_unidade` WHERE excluido_em IS NULL') as $r) $out[(int) $r['atributo_id']][] = (int) $r['unidade_id'];
        return $out;
    }

    public function sugestoes(?int $productId, ?string $fonte = null, ?string $tipo = null, int $limite = 500): array
    {
        $w = ["s.estado = 'pendente'"]; $p = [];
        if ($productId !== null) { $w[] = 's.product_id = ?'; $p[] = $productId; }
        if ($fonte !== null) { $w[] = 's.fonte = ?'; $p[] = $fonte; }
        if ($tipo !== null) { $w[] = 's.tipo = ?'; $p[] = $tipo; }
        return $this->q('SELECT s.*, u.simbolo AS unidade FROM ' . $this->eq . '`eq_sugestao` s LEFT JOIN ' . $this->eq . '`eq_unidade` u ON u.id = s.unidade_id WHERE ' . implode(' AND ', $w)
            . ' ORDER BY s.product_id, s.atributo_id, s.id LIMIT ' . max(1, min(100000, $limite)), $p);
    }

    // ---- Parte C (conferencia_fila): total real e página por CURSOR (keyset), só SELECT ------------------------------------------------
    private function filtroSugestoes(string $fonte, string $estado, ?int $atributoId, ?array $pids): array
    {
        $w = ['s.fonte = ?', 's.estado = ?']; $p = [$fonte, $estado];
        if ($atributoId !== null) { $w[] = 's.atributo_id = ?'; $p[] = $atributoId; }
        if ($pids !== null) { if (!$pids) $w[] = '1 = 0'; else { $w[] = 's.product_id IN (' . implode(',', array_fill(0, count($pids), '?')) . ')'; array_push($p, ...array_values($pids)); } }
        return [$w, $p];
    }

    public function contarSugestoes(string $fonte, string $estado, ?int $atributoId = null, ?array $pids = null): int
    {
        [$w, $p] = $this->filtroSugestoes($fonte, $estado, $atributoId, $pids);
        return (int) ($this->q('SELECT COUNT(*) AS n FROM ' . $this->eq . '`eq_sugestao` s WHERE ' . implode(' AND ', $w), $p)[0]['n'] ?? 0);
    }

    /** @param ?array{0:int,1:int,2:int} $depois cursor (product_id, atributo_id, id) da última linha vista */
    public function sugestoesPagina(string $fonte, string $estado, ?int $atributoId, ?array $pids, ?array $depois, int $limite): array
    {
        [$w, $p] = $this->filtroSugestoes($fonte, $estado, $atributoId, $pids);
        if ($depois !== null) { $w[] = '(s.product_id, s.atributo_id, s.id) > (?, ?, ?)'; array_push($p, ...$depois); }
        return $this->q('SELECT s.*, u.simbolo AS unidade FROM ' . $this->eq . '`eq_sugestao` s LEFT JOIN ' . $this->eq . '`eq_unidade` u ON u.id = s.unidade_id WHERE '
            . implode(' AND ', $w) . ' ORDER BY s.product_id, s.atributo_id, s.id LIMIT ' . max(1, min(101, $limite)), $p);
    }

    /** Valores VIVOS por par (produto, atributo) — uma consulta para a página inteira. @return array<string,list<array>> "pid:aid" => linhas */
    public function valoresDosPares(array $pares): array
    {
        $out = []; $pares = array_values(array_unique(array_map(static fn($x) => (int) $x[0] . ':' . (int) $x[1], $pares)));
        if (!$pares) return $out;
        $p = []; foreach ($pares as $k) { [$a, $b] = explode(':', $k); $p[] = (int) $a; $p[] = (int) $b; }
        foreach ($this->q('SELECT v.product_id, v.atributo_id, v.opcao_id, o.rotulo AS opcao, v.valor_texto, v.valor_num, v.valor_bool, v.valor_data, v.unidade_id, v.estado, v.origem, v.versao,
                v.lote_id, v.legado_bruto, v.atualizado_por, v.atualizado_em FROM ' . $this->eq . '`eq_valor` v LEFT JOIN ' . $this->eq . '`eq_opcao` o ON o.id = v.opcao_id
                WHERE v.excluido_em IS NULL AND (v.product_id, v.atributo_id) IN (' . implode(',', array_fill(0, count($pares), '(?, ?)')) . ')
                ORDER BY v.product_id, v.atributo_id, o.posicao, o.id, v.id', $p) as $r) $out[(int) $r['product_id'] . ':' . (int) $r['atributo_id']][] = $r;
        return $out;
    }

    /**
     * Sugestões com gravação "A conferir" DESTE titular: item 'pendente' de lote cuja operação não terminou (em_andamento|interrompida),
     * dentro da retenção de 30 dias. Sem a 011 (tabela ausente, 42S02) = nenhuma; qualquer outra falha SOBE (nunca esconde "A conferir").
     */
    public function sugestoesAConferir(int $titularId, array $ids): array
    {
        if (!$ids || $titularId <= 0) return [];
        try {
            $rs = $this->q('SELECT i.item, i.chave FROM ' . $this->eq . '`eq_operacao_item` i JOIN ' . $this->eq . '`eq_operacao` o ON o.chave = i.chave
                WHERE o.titular_id = ? AND o.rota IN (\'sugestoes_lote\', \'sugestoes_decidir\') AND o.estado IN (\'em_andamento\', \'interrompida\')
                  AND o.criado_em > CURRENT_TIMESTAMP(3) - INTERVAL 30 DAY AND i.desfecho = \'pendente\' AND i.item IN (' . implode(',', array_fill(0, count($ids), '?')) . ')',
                [$titularId, ...array_map('strval', $ids)]);
        } catch (PDOException $e) { if (($e->errorInfo[0] ?? '') === '42S02') return []; throw $e; }   // só "sem a 011" vira nenhuma; falha real sobe
        $out = []; foreach ($rs as $r) $out[(int) $r['item']] ??= (string) $r['chave'];
        return $out;
    }

    public function sugestoesPendentesPorProduto(): array
    {
        $out = [];
        foreach ($this->q("SELECT product_id, COUNT(*) AS n FROM " . $this->eq . "`eq_sugestao` WHERE estado = 'pendente' GROUP BY product_id") as $r) $out[(int) $r['product_id']] = (int) $r['n'];
        return $out;
    }

    public function historico(int $productId, int $limite): array
    {
        return $this->q("SELECT id, usuario, acao, entidade, entidade_id, antes, depois, motivo, criado_em FROM " . $this->eq . "`eq_auditoria`
            WHERE entidade IN ('valor', 'produto_kit', 'produto_atributo', 'sugestao') AND entidade_id LIKE ? ORDER BY id DESC LIMIT " . max(1, min(1000, $limite)), [$productId . ':%']);
    }

    /**
     * DSHOW-066: histórico de UM atributo do produto, filtrado no banco ANTES do limite: valor ("pid:aid:chave"), vínculo avulso/exceção
     * ("pid:aid") e decisões de sugestão cujo destino é o atributo (depois.atributo_id). Vínculo de kit (produto_kit) não é de um atributo.
     */
    public function historicoDoAtributo(int $productId, int $atributoId, int $limite): array
    {
        return $this->q("SELECT id, usuario, acao, entidade, entidade_id, antes, depois, motivo, criado_em FROM " . $this->eq . "`eq_auditoria`
            WHERE (entidade = 'valor' AND entidade_id LIKE ?) OR (entidade = 'produto_atributo' AND entidade_id = ?)
               OR (entidade = 'sugestao' AND entidade_id LIKE ? AND JSON_EXTRACT(depois, '$.atributo_id') = ?)
            ORDER BY id DESC LIMIT " . max(1, min(1000, $limite)), [$productId . ':' . $atributoId . ':%', $productId . ':' . $atributoId, $productId . ':%', $atributoId]);
    }

    public function usoAtributos(): array
    {
        $out = [];
        foreach ($this->q('SELECT ga.atributo_id, COUNT(DISTINCT ga.grupo_id) AS n FROM ' . $this->eq . '`eq_grupo_atributo` ga JOIN ' . $this->eq . '`eq_grupo` g ON g.id = ga.grupo_id
             WHERE ga.excluido_em IS NULL AND g.ativo = 1 GROUP BY ga.atributo_id') as $r) $out[(int) $r['atributo_id']]['kits'] = (int) $r['n'];
        foreach ($this->q('SELECT atributo_id, COUNT(DISTINCT product_id) AS n FROM ' . $this->eq . '`eq_valor` WHERE excluido_em IS NULL GROUP BY atributo_id') as $r) $out[(int) $r['atributo_id']]['valores'] = (int) $r['n'];
        return $out;
    }

    public function usoUnidades(): array
    {
        $out = [];
        foreach ($this->q('SELECT unidade_id, COUNT(*) AS n FROM ' . $this->eq . '`eq_atributo` WHERE unidade_id IS NOT NULL GROUP BY unidade_id') as $r) $out[(int) $r['unidade_id']]['atributos'] = (int) $r['n'];
        foreach ($this->q('SELECT unidade_id, COUNT(*) AS n FROM ' . $this->eq . '`eq_valor` WHERE unidade_id IS NOT NULL AND excluido_em IS NULL GROUP BY unidade_id') as $r) $out[(int) $r['unidade_id']]['valores'] = (int) $r['n'];
        return $out;
    }
}
