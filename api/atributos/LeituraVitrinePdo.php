<?php
// /api/atributos/LeituraVitrinePdo.php — E1: implementação PDO da LeituraVitrine (só SELECT; schemas qualificados).
declare(strict_types=1);

require_once __DIR__ . '/ProdutosLeitura.php';
require_once __DIR__ . '/CatalogoPdo.php';

/** Leitura PDO (schemas qualificados; só SELECT). Falha de leitura do Precifica/fotos = vazio (a tela mostra "indisponível"), nunca 500. */
final class LeituraVitrinePdo implements LeituraVitrine
{
    private string $eq; private string $ap;

    public function __construct(private readonly PDO $pdo, string $schemaEq = 'DSHOW_EQUIPAMENTOS', string $schemaApp = 'APP_DSHOW')
    {
        foreach ([$schemaEq, $schemaApp] as $s) if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $s)) throw new InvalidArgumentException('schema inválido');
        $this->eq = "`$schemaEq`."; $this->ap = "`$schemaApp`.";
    }

    private function q(string $sql, array $p = []): array { $st = $this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); }
    private function qOpcional(string $sql, array $p = []): ?array
    {
        try { return $this->q($sql, $p); }
        catch (PDOException $e) { error_log('[atributos/leitura] opcional sem leitura: ' . ($e->errorInfo[1] ?? '?')); return null; }
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
        $rs = $this->qOpcional("SELECT product_id, COUNT(*) AS n,
                SUBSTRING_INDEX(GROUP_CONCAT(id ORDER BY is_cover DESC, position, id), ',', 1) AS capa_id,
                SUBSTRING_INDEX(GROUP_CONCAT(IFNULL(avg_color, '') ORDER BY is_cover DESC, position, id), ',', 1) AS cor
             FROM " . $this->ap . "`product_media` WHERE deleted_at IS NULL AND visibility = 'published' GROUP BY product_id") ?? [];
        $out = [];
        foreach ($rs as $r) $out[(int) $r['product_id']] = ['n' => (int) $r['n'], 'capa_id' => (int) $r['capa_id'], 'cor' => $r['cor'] === '' ? null : $r['cor']];
        return $out;
    }

    public function fotos(int $productId): array
    {
        $rs = $this->qOpcional("SELECT id, is_cover, position, avg_color, width, height FROM " . $this->ap . "`product_media`
             WHERE product_id = ? AND deleted_at IS NULL AND visibility = 'published' ORDER BY is_cover DESC, position, id", [$productId]) ?? [];
        return array_map(static fn($r) => ['id' => (int) $r['id'], 'capa' => (int) $r['is_cover'] === 1, 'posicao' => (int) $r['position'],
            'cor' => $r['avg_color'], 'largura' => (int) $r['width'], 'altura' => (int) $r['height']], $rs);
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

    public function valoresResumo(): array
    {
        $out = [];
        foreach ($this->q('SELECT DISTINCT product_id, atributo_id FROM ' . $this->eq . '`eq_valor` WHERE excluido_em IS NULL') as $r) $out[(int) $r['product_id']][(int) $r['atributo_id']] = true;
        return $out;
    }

    public function valoresDetalhe(int $productId): array
    {
        return $this->q('SELECT v.atributo_id, o.rotulo AS opcao, v.valor_texto, v.valor_num, v.valor_bool, v.valor_data, v.estado, v.origem, v.versao, v.lote_id,
                v.legado_bruto, v.criado_em, v.atualizado_em, a.casas
             FROM ' . $this->eq . '`eq_valor` v JOIN ' . $this->eq . '`eq_atributo` a ON a.id = v.atributo_id LEFT JOIN ' . $this->eq . '`eq_opcao` o ON o.id = v.opcao_id
            WHERE v.product_id = ? AND v.excluido_em IS NULL ORDER BY v.atributo_id, v.opcao_chave, v.id', [$productId]);
    }

    /** Chave do bruto = "P<item>A<atributo legado>" (o Id original; nas 450 órfãs o Id_atributo do JSON é NULL e a chave o recupera). */
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
        foreach ($this->q("SELECT a.id, a.codigo, a.rotulo, a.tipo, u.simbolo AS unidade, a.ativo, a.legado_id,
                JSON_UNQUOTE(JSON_EXTRACT(a.legado_meta, '$.importancia_campos')) AS importancia
             FROM " . $this->eq . "`eq_atributo` a LEFT JOIN " . $this->eq . "`eq_unidade` u ON u.id = a.unidade_id") as $r) {
            $out[(int) $r['id']] = ['id' => (int) $r['id'], 'legado_id' => $r['legado_id'] === null ? null : (int) $r['legado_id'], 'codigo' => (string) $r['codigo'], 'rotulo' => (string) $r['rotulo'], 'tipo' => (string) $r['tipo'],
                'unidade' => $r['unidade'], 'ativo' => (int) $r['ativo'] === 1, 'importancia' => $r['importancia'] === 'null' ? null : $r['importancia']];
        }
        return $out;
    }

    public function modelos(): array
    {
        $out = [];
        foreach ($this->q('SELECT e.categoria, e.subcategoria, ga.atributo_id FROM ' . $this->eq . '`eq_grupo` g
                JOIN ' . $this->eq . '`eq_grupo_escopo` e ON e.grupo_id = g.id JOIN ' . $this->eq . '`eq_grupo_atributo` ga ON ga.grupo_id = g.id
                JOIN ' . $this->eq . '`eq_atributo` a ON a.id = ga.atributo_id WHERE g.ativo = 1 AND a.ativo = 1') as $r) $out[$r['categoria'] . '|' . $r['subcategoria']][(int) $r['atributo_id']] = true;
        return $out;
    }
}
