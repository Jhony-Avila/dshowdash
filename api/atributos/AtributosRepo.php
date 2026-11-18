<?php
// /api/equipamentos/AtributosRepo.php — repositório PDO do banco DSHOW_EQUIPAMENTOS (Fase B PREPARADA; migração em
// app-dshow docs/projetos/equipamentos-atributos/fase-b/sql/001_schema.sql). Usa a conexão DSHOWDASH do Dash com nomes QUALIFICADOS
// (`DSHOW_EQUIPAMENTOS`.`eq_*`) — o grant SELECT/INSERT/UPDATE vem de scripts/setup/equipamentos-db-criar.sh (sem DELETE: nada é apagado).
// `$schema = ''` usa o banco da conexão (testes com tabelas TEMPORÁRIAS). Versão de edição: UPDATE … WHERE versao = ? (0 linhas = conflito).
declare(strict_types=1);

require_once __DIR__ . '/AtributosService.php';

final class AtributosRepoPdo implements AtributosRepositorio
{
    private string $p;

    public function __construct(private readonly PDO $pdo, string $schema = 'DSHOW_EQUIPAMENTOS')
    {
        if ($schema !== '' && !preg_match('/^[A-Za-z0-9_]{1,64}$/', $schema)) throw new InvalidArgumentException('schema inválido');
        $this->p = $schema === '' ? '' : "`$schema`.";
    }

    private function t(string $tabela): string { return $this->p . "`$tabela`"; }

    private function q(string $sql, array $params = []): array
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($params);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    private function exec(string $sql, array $params = []): int
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($params);
        return $st->rowCount();
    }

    public function transacao(callable $f): mixed
    {
        if ($this->pdo->inTransaction()) return $f();   // reentrante: a transação de fora decide o COMMIT/ROLLBACK
        $this->pdo->beginTransaction();
        try { $r = $f(); $this->pdo->commit(); return $r; }
        catch (Throwable $t) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            // V5 Lote 3 (P1-09): impasse (1213) ou espera de trava esgotada (1205) com outra gravação simultânea = conflito visível, nunca 500
            if ($t instanceof PDOException && in_array((int) ($t->errorInfo[1] ?? 0), [1205, 1213], true)) {
                throw new AtributosErro('CONFLICT', 409, 'Outra gravação simultânea neste atributo. Recarregue e tente de novo.');
            }
            throw $t;
        }
    }

    public function gruposAplicaveis(string $categoria, ?string $subcategoria): array
    {
        $rs = $this->q('SELECT g.id, g.nome, e.categoria AS escopo_categoria, e.subcategoria AS escopo_subcategoria
             FROM ' . $this->t('eq_grupo') . ' g JOIN ' . $this->t('eq_grupo_escopo') . ' e ON e.grupo_id = g.id
            WHERE g.ativo = 1 AND e.excluido_em IS NULL AND e.categoria = ? AND (e.subcategoria = \'\' OR e.subcategoria = ?)
            ORDER BY g.nome ASC, g.id ASC, e.subcategoria DESC', [$categoria, (string) ($subcategoria ?? '')]);
        $vistos = []; $out = [];
        foreach ($rs as $r) { if (isset($vistos[$r['id']])) continue; $vistos[$r['id']] = true; $out[] = $r; }   // um grupo uma vez (escopo mais específico)
        return $out;
    }

    public function vinculosLegado(int $productId): array
    {
        return $this->q('SELECT origem_ns, chave_antiga, estado FROM ' . $this->t('eq_legado_vinculo') . ' WHERE product_id = ? ORDER BY origem_ns, chave_antiga', [$productId]);
    }

    public function listarAtributos(?string $busca, ?string $tipo, bool $incluirInativos): array
    {
        $w = ['1=1']; $p = [];
        if (!$incluirInativos) $w[] = 'a.ativo = 1';
        if ($tipo !== null) { $w[] = 'a.tipo = ?'; $p[] = $tipo; }
        if ($busca !== null) { $w[] = '(a.rotulo LIKE ? OR a.codigo LIKE ?)'; $like = '%' . addcslashes($busca, '%_\\') . '%'; $p[] = $like; $p[] = $like; }
        return $this->q('SELECT a.id, a.codigo, a.rotulo, a.tipo, a.unidade_id, u.simbolo AS unidade, a.ativo, a.versao, a.autoridade, a.precifica_ref, a.aceita_nao_se_aplica,
                (SELECT COUNT(*) FROM ' . $this->t('eq_valor') . ' v WHERE v.atributo_id = a.id AND v.excluido_em IS NULL AND v.estado = \'informado\') AS valores,
                (SELECT COUNT(*) FROM ' . $this->t('eq_grupo_atributo') . ' ga WHERE ga.atributo_id = a.id) AS grupos
             FROM ' . $this->t('eq_atributo') . ' a LEFT JOIN ' . $this->t('eq_unidade') . ' u ON u.id = a.unidade_id
            WHERE ' . implode(' AND ', $w) . ' ORDER BY a.rotulo ASC, a.id ASC LIMIT 1000', $p);
    }

    public function atributo(int $id): ?array
    {
        $r = $this->q('SELECT a.id, a.codigo, a.rotulo, a.tipo, a.unidade_id, u.simbolo AS unidade, a.casas, a.minimo, a.maximo, a.descricao, a.ativo, a.versao, a.legado_ns, a.legado_id, a.autoridade, a.precifica_ref, a.aceita_nao_se_aplica
             FROM ' . $this->t('eq_atributo') . ' a LEFT JOIN ' . $this->t('eq_unidade') . ' u ON u.id = a.unidade_id WHERE a.id = ?', [$id]);
        return $r[0] ?? null;
    }

    public function codigoExiste(string $codigo, ?int $excetoId): bool
    {
        return (bool) $this->q('SELECT 1 FROM ' . $this->t('eq_atributo') . ' WHERE codigo = ? AND id <> ?', [$codigo, $excetoId ?? 0]);
    }

    public function criarAtributo(array $d): int
    {
        $cols = array_keys($d);
        $this->exec('INSERT INTO ' . $this->t('eq_atributo') . ' (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')', array_values($d));
        return (int) $this->pdo->lastInsertId();
    }

    private const EDITAVEIS_ATRIBUTO = ['rotulo', 'codigo', 'tipo', 'unidade_id', 'casas', 'minimo', 'maximo', 'descricao', 'ativo', 'autoridade', 'precifica_ref', 'aceita_nao_se_aplica'];

    public function atualizarAtributo(int $id, int $versao, array $d): bool
    {
        $sets = []; $p = [];
        foreach ($d as $k => $v) { if (!in_array($k, self::EDITAVEIS_ATRIBUTO, true)) continue; $sets[] = "$k = ?"; $p[] = $v; }
        $sets[] = 'versao = versao + 1';
        $p[] = $id; $p[] = $versao;
        return $this->exec('UPDATE ' . $this->t('eq_atributo') . ' SET ' . implode(', ', $sets) . ' WHERE id = ? AND versao = ?', $p) === 1;
    }

    public function contarValores(int $atributoId, bool $travar = false): int
    {
        // $travar (P1-09): leitura com trava compartilhada — vê o que já foi gravado e impede o 1º valor até o fim desta transação
        return (int) ($this->q('SELECT COUNT(*) AS n FROM ' . $this->t('eq_valor') . " WHERE atributo_id = ? AND excluido_em IS NULL AND estado = 'informado'" . ($travar ? ' FOR SHARE' : ''), [$atributoId])[0]['n'] ?? 0);
    }

    public function travarAtributo(int $id, bool $exclusivo): ?array
    {
        return $this->q('SELECT id, codigo, rotulo, tipo, unidade_id, casas, minimo, maximo, descricao, ativo, versao, autoridade, precifica_ref, aceita_nao_se_aplica FROM ' . $this->t('eq_atributo')
            . ' WHERE id = ? ' . ($exclusivo ? 'FOR UPDATE' : 'FOR SHARE'), [$id])[0] ?? null;
    }

    public function travarValores(int $productId, int $atributoId): array
    {
        return $this->q('SELECT id, product_id, atributo_id, opcao_id, opcao_chave, valor_texto, valor_num, valor_bool, valor_data, estado, origem, versao, excluido_em FROM ' . $this->t('eq_valor')
            . ' WHERE product_id = ? AND atributo_id = ? ORDER BY opcao_chave FOR UPDATE', [$productId, $atributoId]);
    }

    public function excluirValor(int $productId, int $atributoId, int $opcaoChave): bool
    {
        return $this->exec('UPDATE ' . $this->t('eq_valor') . ' SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1 WHERE product_id = ? AND atributo_id = ? AND opcao_chave = ? AND excluido_em IS NULL',
            [$productId, $atributoId, $opcaoChave]) === 1;
    }

    public function opcoes(int $atributoId): array
    {
        return $this->q('SELECT id, atributo_id, rotulo, posicao, ativo FROM ' . $this->t('eq_opcao') . ' WHERE atributo_id = ? ORDER BY posicao ASC, id ASC', [$atributoId]);
    }

    public function criarOpcao(int $atributoId, string $rotulo, int $posicao): int
    {
        $this->exec('INSERT INTO ' . $this->t('eq_opcao') . ' (atributo_id, rotulo, posicao) VALUES (?, ?, ?)', [$atributoId, $rotulo, $posicao]);
        return (int) $this->pdo->lastInsertId();
    }

    public function definirOpcaoAtiva(int $opcaoId, bool $ativo): bool
    {
        return $this->exec('UPDATE ' . $this->t('eq_opcao') . ' SET ativo = ? WHERE id = ?', [$ativo ? 1 : 0, $opcaoId]) >= 0;
    }

    public function renomearOpcao(int $opcaoId, string $rotulo, string $rotuloAtual): bool
    {
        return $this->exec('UPDATE ' . $this->t('eq_opcao') . ' SET rotulo = ? WHERE id = ? AND rotulo = ?', [$rotulo, $opcaoId, $rotuloAtual]) === 1;
    }

    public function definirPosicaoOpcao(int $opcaoId, int $atributoId, int $posicao): bool
    {
        return $this->exec('UPDATE ' . $this->t('eq_opcao') . ' SET posicao = ? WHERE id = ? AND atributo_id = ?', [$posicao, $opcaoId, $atributoId]) >= 0;
    }

    public function opcao(int $id): ?array
    {
        return $this->q('SELECT id, atributo_id, rotulo, posicao, ativo FROM ' . $this->t('eq_opcao') . ' WHERE id = ?', [$id])[0] ?? null;
    }

    public function unidades(): array
    {
        return $this->q('SELECT id, simbolo, nome, grandeza, ativo FROM ' . $this->t('eq_unidade') . ' ORDER BY simbolo ASC');
    }

    public function criarUnidade(string $simbolo, string $nome, ?string $grandeza): int
    {
        $this->exec('INSERT INTO ' . $this->t('eq_unidade') . ' (simbolo, nome, grandeza) VALUES (?, ?, ?)', [$simbolo, $nome, $grandeza]);
        return (int) $this->pdo->lastInsertId();
    }

    public function grupos(): array
    {
        $gs = $this->q('SELECT id, nome, descricao, ordem, aplica_a_todos, ativo, versao FROM ' . $this->t('eq_grupo') . ' ORDER BY nome ASC');
        foreach ($gs as &$g) $g = $this->comDetalhes($g);
        return $gs;
    }

    /** 004: só vínculos VIVOS (excluido_em IS NULL). */
    private function comDetalhes(array $g): array
    {
        $g['escopos'] = $this->q('SELECT categoria, subcategoria FROM ' . $this->t('eq_grupo_escopo') . ' WHERE grupo_id = ? AND excluido_em IS NULL ORDER BY categoria, subcategoria', [$g['id']]);
        $g['atributos'] = $this->q('SELECT ga.atributo_id, a.rotulo, a.codigo, a.tipo, a.ativo AS atributo_ativo, ga.posicao, ga.obrigatorio, ga.visivel, ga.destaque, ga.importancia, ga.unidade_id, ga.legado_id, ga.versao
             FROM ' . $this->t('eq_grupo_atributo') . ' ga JOIN ' . $this->t('eq_atributo') . ' a ON a.id = ga.atributo_id WHERE ga.grupo_id = ? AND ga.excluido_em IS NULL ORDER BY ga.posicao, ga.atributo_id', [$g['id']]);
        return $g;
    }

    public function grupo(int $id): ?array
    {
        $r = $this->q('SELECT id, nome, descricao, ordem, aplica_a_todos, ativo, versao FROM ' . $this->t('eq_grupo') . ' WHERE id = ?', [$id]);
        return $r ? $this->comDetalhes($r[0]) : null;
    }

    public function criarGrupo(string $nome): int
    {
        $this->exec('INSERT INTO ' . $this->t('eq_grupo') . ' (nome) VALUES (?)', [$nome]);
        return (int) $this->pdo->lastInsertId();
    }

    public function atualizarGrupo(int $id, int $versao, array $d): bool
    {
        $sets = ['versao = versao + 1']; $p = [];
        foreach ($d as $k => $v) { if (!in_array($k, ['nome', 'ativo', 'descricao', 'ordem', 'aplica_a_todos'], true)) continue; array_unshift($sets, "$k = ?"); array_unshift($p, $v); }
        $p[] = $id; $p[] = $versao;
        return $this->exec('UPDATE ' . $this->t('eq_grupo') . ' SET ' . implode(', ', $sets) . ' WHERE id = ? AND versao = ?', $p) === 1;
    }

    /** ATR-M1 (004): grava só o que mudou — insere o novo, revive o que voltou, exclui LOGICAMENTE o que saiu. Sem DELETE. */
    public function definirEscopo(int $grupoId, array $escopos, ?string $usuario = null): void
    {
        $this->transacao(function () use ($grupoId, $escopos, $usuario) {
            $atuais = [];
            foreach ($this->q('SELECT categoria, subcategoria, excluido_em FROM ' . $this->t('eq_grupo_escopo') . ' WHERE grupo_id = ? FOR UPDATE', [$grupoId]) as $r) $atuais[$r['categoria'] . '|' . $r['subcategoria']] = $r;
            $quero = [];
            foreach ($escopos as $e) $quero[$e['categoria'] . '|' . $e['subcategoria']] = $e;
            foreach ($quero as $k => $e) {
                if (!isset($atuais[$k])) $this->exec('INSERT INTO ' . $this->t('eq_grupo_escopo') . ' (grupo_id, categoria, subcategoria, atualizado_por) VALUES (?, ?, ?, ?)', [$grupoId, $e['categoria'], $e['subcategoria'], $usuario]);
                elseif ($atuais[$k]['excluido_em'] !== null) $this->exec('UPDATE ' . $this->t('eq_grupo_escopo') . ' SET excluido_em = NULL, versao = versao + 1, atualizado_por = ? WHERE grupo_id = ? AND categoria = ? AND subcategoria = ?', [$usuario, $grupoId, $e['categoria'], $e['subcategoria']]);
            }
            foreach ($atuais as $k => $r) if ($r['excluido_em'] === null && !isset($quero[$k])) $this->exec('UPDATE ' . $this->t('eq_grupo_escopo') . ' SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1, atualizado_por = ? WHERE grupo_id = ? AND categoria = ? AND subcategoria = ?', [$usuario, $grupoId, $r['categoria'], $r['subcategoria']]);
        });
    }

    /** ATR-M1 (004): idem para os itens do kit; preserva legado_id; atualiza só os campos que mudaram. */
    public function definirAtributosDoGrupo(int $grupoId, array $itens, ?string $usuario = null): void
    {
        $campos = ['posicao', 'obrigatorio', 'visivel', 'destaque', 'importancia', 'unidade_id'];
        $this->transacao(function () use ($grupoId, $itens, $usuario, $campos) {
            $atuais = [];
            foreach ($this->q('SELECT atributo_id, posicao, obrigatorio, visivel, destaque, importancia, unidade_id, excluido_em FROM ' . $this->t('eq_grupo_atributo') . ' WHERE grupo_id = ? FOR UPDATE', [$grupoId]) as $r) $atuais[(int) $r['atributo_id']] = $r;
            $quero = [];
            foreach ($itens as $i) $quero[(int) $i['atributo_id']] = $i + ['destaque' => 0, 'importancia' => null, 'unidade_id' => null, 'visivel' => 1, 'obrigatorio' => 0, 'posicao' => 0];
            foreach ($quero as $aid => $i) {
                if (!isset($atuais[$aid])) {
                    $this->exec('INSERT INTO ' . $this->t('eq_grupo_atributo') . ' (grupo_id, atributo_id, posicao, obrigatorio, visivel, destaque, importancia, unidade_id, atualizado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [$grupoId, $aid, (int) $i['posicao'], (int) $i['obrigatorio'], (int) $i['visivel'], (int) $i['destaque'], $i['importancia'], $i['unidade_id'], $usuario]);
                    continue;
                }
                $a = $atuais[$aid]; $sets = []; $p = [];
                foreach ($campos as $c) if ((string) ($a[$c] ?? '') !== (string) ($i[$c] ?? '')) { $sets[] = "$c = ?"; $p[] = $i[$c]; }
                if ($a['excluido_em'] !== null) $sets[] = 'excluido_em = NULL';
                if (!$sets) continue;
                $p[] = $usuario; $p[] = $grupoId; $p[] = $aid;
                $this->exec('UPDATE ' . $this->t('eq_grupo_atributo') . ' SET ' . implode(', ', $sets) . ', versao = versao + 1, atualizado_por = ? WHERE grupo_id = ? AND atributo_id = ?', $p);
            }
            foreach ($atuais as $aid => $a) if ($a['excluido_em'] === null && !isset($quero[$aid])) $this->exec('UPDATE ' . $this->t('eq_grupo_atributo') . ' SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1, atualizado_por = ? WHERE grupo_id = ? AND atributo_id = ?', [$usuario, $grupoId, $aid]);
        });
    }

    /** Retrato do modelo para a regra da ficha (Aplicabilidade). $productId = só os vínculos diretos/ajustes desse produto; null = todos. */
    public function retratoModelo(?int $productId = null): RetratoModelo
    {
        $grupos = [];
        foreach ($this->q('SELECT id, nome, descricao, ordem, aplica_a_todos, ativo, versao FROM ' . $this->t('eq_grupo')) as $g) $grupos[(int) $g['id']] = $g;
        $escopos = $this->q('SELECT grupo_id, categoria, subcategoria FROM ' . $this->t('eq_grupo_escopo') . ' WHERE excluido_em IS NULL');
        $itens = [];
        foreach ($this->q('SELECT grupo_id, atributo_id, posicao, obrigatorio, visivel, destaque, importancia, unidade_id, legado_id FROM ' . $this->t('eq_grupo_atributo') . ' WHERE excluido_em IS NULL') as $i) $itens[(int) $i['grupo_id']][] = $i;
        $f = $productId === null ? '' : ' AND product_id = ' . (int) $productId;
        $diretos = [];
        foreach ($this->q('SELECT grupo_id, product_id FROM ' . $this->t('eq_grupo_produto') . ' WHERE excluido_em IS NULL' . $f) as $d) $diretos[(int) $d['product_id']][] = (int) $d['grupo_id'];
        $ajustes = [];
        foreach ($this->q('SELECT product_id, atributo_id, modo, unidade_id, posicao, motivo FROM ' . $this->t('eq_produto_atributo') . ' WHERE excluido_em IS NULL' . $f) as $a) $ajustes[(int) $a['product_id']][(int) $a['atributo_id']] = $a;
        $atributos = [];
        foreach ($this->q('SELECT id, codigo, rotulo, tipo, ativo, unidade_id, importancia_padrao, legado_id, casas, autoridade, precifica_ref, aceita_nao_se_aplica FROM ' . $this->t('eq_atributo')) as $a) $atributos[(int) $a['id']] = $a;
        return new RetratoModelo($grupos, $escopos, $itens, $diretos, $ajustes, $atributos);
    }

    public function valoresDoProduto(int $productId): array
    {
        return $this->q('SELECT v.id, v.atributo_id, a.rotulo, a.tipo, u.simbolo AS unidade, v.opcao_id, v.opcao_chave, o.rotulo AS opcao, o.ativo AS opcao_ativa, v.valor_texto, v.valor_num, v.valor_bool, v.valor_data,
                v.estado, v.origem, v.versao, v.legado_bruto
             FROM ' . $this->t('eq_valor') . ' v JOIN ' . $this->t('eq_atributo') . ' a ON a.id = v.atributo_id
             LEFT JOIN ' . $this->t('eq_unidade') . ' u ON u.id = a.unidade_id LEFT JOIN ' . $this->t('eq_opcao') . ' o ON o.id = v.opcao_id
            WHERE v.product_id = ? AND v.excluido_em IS NULL ORDER BY a.rotulo, v.id', [$productId]);
    }

    public function valor(int $productId, int $atributoId, int $opcaoChave): ?array
    {
        return $this->q('SELECT id, product_id, atributo_id, opcao_id, opcao_chave, valor_texto, valor_num, valor_bool, valor_data, estado, origem, versao, excluido_em FROM ' . $this->t('eq_valor') . ' WHERE product_id = ? AND atributo_id = ? AND opcao_chave = ?', [$productId, $atributoId, $opcaoChave])[0] ?? null;
    }

    public function gravarValor(array $d, ?int $versaoEsperada): bool
    {
        if ($versaoEsperada === null) {
            $cols = ['product_id', 'atributo_id', 'opcao_id', 'opcao_chave', 'valor_texto', 'valor_num', 'valor_bool', 'valor_data', 'estado', 'origem', 'atualizado_por'];
            try {
                $this->exec('INSERT INTO ' . $this->t('eq_valor') . ' (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')', array_map(static fn($c) => $d[$c], $cols));
                return true;
            } catch (PDOException $e) {
                if (($e->errorInfo[1] ?? 0) === 1062) return false;   // outra pessoa gravou primeiro → conflito
                throw $e;
            }
        }
        return $this->exec('UPDATE ' . $this->t('eq_valor') . ' SET opcao_id = ?, valor_texto = ?, valor_num = ?, valor_bool = ?, valor_data = ?, estado = ?, origem = ?, atualizado_por = ?, excluido_em = NULL, versao = versao + 1
            WHERE product_id = ? AND atributo_id = ? AND opcao_chave = ? AND versao = ?',
            [$d['opcao_id'], $d['valor_texto'], $d['valor_num'], $d['valor_bool'], $d['valor_data'], $d['estado'], $d['origem'], $d['atualizado_por'], $d['product_id'], $d['atributo_id'], $d['opcao_chave'], $versaoEsperada]) === 1;
    }

    public function unidade(int $id): ?array
    {
        return $this->q('SELECT id, simbolo, nome, grandeza, ativo FROM ' . $this->t('eq_unidade') . ' WHERE id = ?', [$id])[0] ?? null;
    }

    public function atualizarUnidade(int $id, array $d): bool
    {
        $sets = []; $p = [];
        foreach ($d as $k => $v) { if (!in_array($k, ['nome', 'grandeza', 'ativo'], true)) continue; $sets[] = "$k = ?"; $p[] = $v; }
        if (!$sets) return true;
        $p[] = $id;
        return $this->exec('UPDATE ' . $this->t('eq_unidade') . ' SET ' . implode(', ', $sets) . ' WHERE id = ?', $p) >= 0;
    }

    public function precificaRefExiste(string $ref, ?int $excetoId): bool
    {
        return (bool) $this->q('SELECT 1 FROM ' . $this->t('eq_atributo') . ' WHERE precifica_ref = ? AND id <> ?', [$ref, $excetoId ?? 0]);
    }

    public function auditoria(string $entidade, string $entidadeId, int $limite): array
    {
        return $this->q('SELECT id, usuario, acao, antes, depois, motivo, criado_em FROM ' . $this->t('eq_auditoria') . ' WHERE entidade = ? AND (entidade_id = ? OR entidade_id LIKE ?) ORDER BY id DESC LIMIT ' . max(1, min(200, $limite)),
            [$entidade, $entidadeId, $entidadeId . ':%']);
    }

    public function ultimaRevisao(int $productId): ?array
    {
        $r = $this->q('SELECT usuario, depois, criado_em FROM ' . $this->t('eq_auditoria') . " WHERE entidade = 'ficha' AND entidade_id = ? AND acao = 'revisar' ORDER BY id DESC LIMIT 1", [(string) $productId]);
        if (!$r) return null;
        $d = json_decode((string) ($r[0]['depois'] ?? 'null'), true);
        return ['usuario' => $r[0]['usuario'], 'criado_em' => $r[0]['criado_em'], 'depois' => is_array($d) ? $d : []];
    }

    public function removerValorOpcao(int $productId, int $atributoId, int $opcaoId, int $versao): bool
    {
        return $this->exec('UPDATE ' . $this->t('eq_valor') . ' SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1 WHERE product_id = ? AND atributo_id = ? AND opcao_chave = ? AND versao = ? AND excluido_em IS NULL',
            [$productId, $atributoId, $opcaoId, $versao]) === 1;
    }

    public function auditar(string $usuario, string $acao, string $entidade, string $entidadeId, ?array $antes, ?array $depois, ?string $motivo): void
    {
        $this->exec('INSERT INTO ' . $this->t('eq_auditoria') . ' (usuario, acao, entidade, entidade_id, antes, depois, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [mb_substr($usuario, 0, 100), $acao, $entidade, mb_substr($entidadeId, 0, 64), $antes === null ? null : json_encode($antes, JSON_UNESCAPED_UNICODE), $depois === null ? null : json_encode($depois, JSON_UNESCAPED_UNICODE), $motivo === null ? null : mb_substr($motivo, 0, 255)]);
    }
}
