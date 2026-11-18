<?php
// /api/equipamentos/CatalogoPdo.php — leitura do CATÁLOGO de produtos para Equipamentos › Atributos (Etapa 7; E7-D1 = N1 A).
// Lê SÓ as 7 colunas do GRANT N1 em <DSHOW_CATALOGO_SCHEMA>.product_catalog (projeção do Precifica sincronizada pelo app; padrão APP_DSHOW,
// validação APP_DSHOW_VALIDACAO). Sem preço/custo/margem (a tabela não os tem). Falha de leitura → CatalogoIndisponivel (nunca "não existe").
declare(strict_types=1);

require_once __DIR__ . '/AtributosService.php';

final class CatalogoPdo implements CatalogoProdutos
{
    private string $t;

    public function __construct(private readonly ?PDO $pdo, string $schema = 'APP_DSHOW')
    {
        if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $schema)) throw new InvalidArgumentException('schema do catálogo inválido');
        $this->t = "`$schema`.`product_catalog`";
        $this->schema = $schema;
    }

    private string $schema;

    private function ler(string $sql, array $p): array
    {
        if ($this->pdo === null) throw new CatalogoIndisponivel('sem conexão');
        try { $st = $this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); }
        catch (PDOException $e) { error_log('[equipamentos/catalogo] leitura falhou: ' . ($e->errorInfo[1] ?? '?')); throw new CatalogoIndisponivel('catálogo ilegível', 0, $e); }
    }

    public function buscar(?string $q, int $limite): array
    {
        $lim = max(1, min(50, $limite));
        if ($q === null) $rs = $this->ler('SELECT id, name, category, subcategory, active FROM ' . $this->t . ' WHERE deleted = 0 ORDER BY name LIMIT ' . $lim, []);
        elseif (ctype_digit($q)) $rs = $this->ler('SELECT id, name, category, subcategory, active FROM ' . $this->t . ' WHERE deleted = 0 AND id = ?', [(int) $q]);
        else $rs = $this->ler('SELECT id, name, category, subcategory, active FROM ' . $this->t . ' WHERE deleted = 0 AND name LIKE ? ORDER BY name LIMIT ' . $lim, ['%' . addcslashes($q, '%_\\') . '%']);
        return array_map(static fn($r) => ['id' => (int) $r['id'], 'nome' => (string) $r['name'], 'categoria' => (string) $r['category'], 'subcategoria' => $r['subcategory'], 'ativo' => (int) $r['active'] === 1], $rs);
    }

    public function categorias(): array
    {
        return array_map(static fn($r) => ['categoria' => (string) $r['category'], 'subcategoria' => (string) ($r['subcategory'] ?? ''), 'produtos' => (int) $r['n']],
            $this->ler('SELECT category, subcategory, COUNT(*) AS n FROM ' . $this->t . ' WHERE deleted = 0 GROUP BY category, subcategory ORDER BY category, subcategory', []));
    }

    public function contar(string $categoria, string $subcategoria): int
    {
        $rs = $subcategoria === '' ? $this->ler('SELECT COUNT(*) AS n FROM ' . $this->t . ' WHERE deleted = 0 AND category = ?', [$categoria])
            : $this->ler('SELECT COUNT(*) AS n FROM ' . $this->t . ' WHERE deleted = 0 AND category = ? AND subcategory = ?', [$categoria, $subcategoria]);
        return (int) ($rs[0]['n'] ?? 0);
    }

    /** product_specs NÃO está no GRANT N1: sem leitura (1142/1146) → null ("ver a ficha do Precifica"), nunca erro. */
    public function specs(int $productId, string $kind): ?array
    {
        if ($this->pdo === null) return null;
        try {
            $st = $this->pdo->prepare('SELECT attrs_json FROM `' . $this->schema . '`.`product_specs` WHERE product_id = ? AND kind = ? AND deleted_at IS NULL');
            $st->execute([$productId, $kind]); $j = $st->fetchColumn();
        } catch (PDOException $e) { return null; }
        if ($j === false || $j === null) return [];
        $d = json_decode((string) $j, true);
        return is_array($d) ? $d : [];
    }

    public function produto(int $id): ?array
    {
        if ($this->pdo === null) throw new CatalogoIndisponivel('sem conexão');
        try {
            $st = $this->pdo->prepare('SELECT id, name, category, subcategory, active, deleted, synced_at FROM ' . $this->t . ' WHERE id = ?');
            $st->execute([$id]);
            $r = $st->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('[equipamentos/catalogo] leitura falhou: ' . ($e->errorInfo[1] ?? '?'));
            throw new CatalogoIndisponivel('catálogo ilegível', 0, $e);
        }
        if (!$r) return null;
        return ['id' => (int) $r['id'], 'nome' => (string) $r['name'], 'categoria' => (string) $r['category'], 'subcategoria' => $r['subcategory'] === null ? null : (string) $r['subcategory'],
                'ativo' => (int) $r['active'] === 1, 'excluido' => (int) $r['deleted'] === 1, 'sincronizado_em' => $r['synced_at'] === null ? null : (string) $r['synced_at']];
    }
}
