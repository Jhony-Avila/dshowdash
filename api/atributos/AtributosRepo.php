<?php
// /api/equipamentos/AtributosRepo.php — repositório PDO do banco DSHOW_EQUIPAMENTOS (Fase B PREPARADA; migração em
// app-dshow docs/projetos/equipamentos-atributos/fase-b/sql/001_schema.sql). Usa a conexão DSHOWDASH do Dash com nomes QUALIFICADOS
// (`DSHOW_EQUIPAMENTOS`.`eq_*`) — o grant SELECT/INSERT/UPDATE vem de scripts/setup/equipamentos-db-criar.sh (sem DELETE: nada é apagado).
// `$schema = ''` usa o banco da conexão (testes com tabelas TEMPORÁRIAS). Versão de edição: UPDATE … WHERE versao = ? (0 linhas = conflito).
declare(strict_types=1);

require_once __DIR__ . '/AtributosService.php';
require_once __DIR__ . '/KitsService.php';
require_once __DIR__ . '/SugestoesService.php';

final class AtributosRepoPdo implements AtributosRepositorio, ModuloRepositorio, SugestoesRepositorio, SugestoesDecisoes, UnidadesComTrava, OperacoesRepositorio, KitsPrioridade
{
    private string $p;
    /** "FOI SALVO OU NÃO": ganchos executados DENTRO da transação, antes do COMMIT (recibo atômico com a gravação) e contador de COMMITs. */
    private array $antesDoCommit = [];
    private int $commits = 0;
    /**
     * DSHOW-093 A / P1-2 b · COMMIT ADIADO (só escrita COM chave em rota de um item): a 1ª transação lógica do serviço abre a transação
     * física (conferindo a tentativa dona SOB TRAVA logo no início — `aoIniciar`) e NÃO faz COMMIT; blocos seguintes viram SAVEPOINT. O
     * COMMIT único acontece em `confirmarAdiada`, depois que o recibo COMPLETO foi gravado na mesma transação. Sem chave: nada muda.
     */
    private bool $adiar = false;
    private bool $adiada = false;
    private array $aoIniciar = [];
    private int $commitsAntesAdiar = 0;
    private int $profundidade = 0;
    private int $savepoints = 0;

    public function __construct(private readonly PDO $pdo, string $schema = 'DSHOW_EQUIPAMENTOS')
    {
        if ($schema !== '' && !preg_match('/^[A-Za-z0-9_]{1,64}$/', $schema)) throw new InvalidArgumentException('schema inválido');
        $this->p = $schema === '' ? '' : "`$schema`.";
    }

    private function t(string $tabela): string { return $this->p . "`$tabela`"; }

    private ?bool $temPrioridadeKit = null;

    /**
     * P1 kit-prioridade: a coluna eq_grupo.prioridade (migração 012) existe? Lido uma vez por instância (SHOW COLUMNS: só SELECT; enxerga
     * também tabela TEMPORÁRIA dos testes). Sem a coluna o código segue a regra antiga, sem erro.
     */
    public function temPrioridadeKit(): bool
    {
        return $this->temPrioridadeKit ??= (bool) $this->q('SHOW COLUMNS FROM ' . $this->t('eq_grupo') . " LIKE 'prioridade'");
    }

    /**
     * P1 kit-prioridade (ação kit_prioridade): trava a fila INTEIRA de eq_grupo (todas as linhas: a reescrita 1..N pode tocar qualquer uma;
     * em REPEATABLE READ o FOR UPDATE sem WHERE também segura a criação de kit simultânea, que lê MAX(prioridade)). `ordem_nome` = posição de
     * (nome, id) na colação do MySQL, a mesma do retratoModelo (regra antiga para kit com prioridade NULL).
     */
    public function travarFilaKits(): array
    {
        $r = 0; $out = [];
        foreach ($this->q('SELECT id, nome, ativo, prioridade FROM ' . $this->t('eq_grupo') . ' ORDER BY nome, id FOR UPDATE') as $g) $out[] = $g + ['ordem_nome' => $r++];
        return $out;
    }

    public function definirPrioridadeKit(int $grupoId, int $prioridade): bool
    {
        // atualizado_em = atualizado_em: o ON UPDATE não dispara (mesma regra do preenchimento da 012); versao não muda
        return $this->exec('UPDATE ' . $this->t('eq_grupo') . ' SET prioridade = ?, atualizado_em = atualizado_em WHERE id = ? AND NOT (prioridade <=> ?)', [$prioridade, $grupoId, $prioridade]) > 0;
    }

    /** Colunas lidas de eq_grupo (com `prioridade` só se a 012 estiver aplicada). */
    private function colunasGrupo(): string
    {
        return 'id, nome, descricao, ordem, aplica_a_todos, ativo, versao' . ($this->temPrioridadeKit() ? ', prioridade' : '');
    }

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
        if ($this->adiada && $this->profundidade === 0) return $this->blocoAdiado($f);   // novo bloco lógico dentro da transação adiada
        if ($this->pdo->inTransaction()) return $f();   // reentrante: a transação de fora decide o COMMIT/ROLLBACK
        $this->pdo->beginTransaction();
        $this->profundidade++;
        try {
            if ($this->adiar) foreach ($this->aoIniciar as $g) $g();   // posse da operação conferida ANTES de qualquer efeito
            $r = $f();
            if ($this->adiar) { $this->profundidade--; $this->adiada = true; $this->commits++; return $r; }   // COMMIT fica para confirmarAdiada
            foreach ($this->antesDoCommit as $g) $g();
            $this->pdo->commit(); $this->profundidade--; $this->commits++; return $r;
        }
        catch (Throwable $t) {
            if ($this->profundidade > 0) $this->profundidade--;
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw self::traduzir($t);
        }
    }

    /** V5 Lote 3 (P1-09): impasse (1213) ou espera de trava esgotada (1205) com outra gravação simultânea = conflito visível, nunca 500 */
    private static function traduzir(Throwable $t): Throwable
    {
        if ($t instanceof PDOException && in_array((int) ($t->errorInfo[1] ?? 0), [1205, 1213], true)) {
            $e = new AtributosErro('CONFLICT', 409, 'Outra gravação simultânea neste atributo. Recarregue e tente de novo.');
            $e->meta = ['motivo' => 'passageiro'];   // Parte C: o lote reconhece o erro TÉCNICO passageiro (repete 1×; depois erro_tecnico)
            return $e;
        }
        return $t;
    }

    private function blocoAdiado(callable $f): mixed
    {
        $sp = 'atr_sp_' . (++$this->savepoints);
        $this->pdo->exec("SAVEPOINT $sp");
        $this->profundidade++;
        try { $r = $f(); $this->profundidade--; $this->pdo->exec("RELEASE SAVEPOINT $sp"); $this->commits++; return $r; }
        catch (Throwable $t) {
            $this->profundidade--;
            // impasse desfaz a transação INTEIRA no InnoDB → descarta tudo (nada do adiado sobrevive; ninguém o confirma por engano)
            if ($t instanceof PDOException && (int) ($t->errorInfo[1] ?? 0) === 1213) $this->descartarAdiada();
            else { try { $this->pdo->exec("ROLLBACK TO SAVEPOINT $sp"); } catch (Throwable $x) { $this->descartarAdiada(); } }
            throw self::traduzir($t);
        }
    }

    public function adiarConfirmacao(?callable $aoIniciar): void
    {
        $this->adiar = true; $this->adiada = false; $this->aoIniciar = $aoIniciar ? [$aoIniciar] : []; $this->commitsAntesAdiar = $this->commits;
    }

    public function temGravacaoAdiada(): bool { return $this->adiada; }

    /** Roda $antesDoCommit DENTRO da transação adiada (recibo completo + posse) e faz o COMMIT único. Sem gravação adiada: só desliga o modo. */
    public function confirmarAdiada(callable $antesDoCommit): bool
    {
        $this->adiar = false; $this->aoIniciar = [];
        if (!$this->adiada) return false;
        try { $antesDoCommit(); $this->pdo->commit(); $this->adiada = false; return true; }
        catch (Throwable $t) { $this->descartarAdiada(); throw self::traduzir($t); }
    }

    /** Desfaz a transação adiada (se houver) e volta o contador: para a camada, nada foi gravado. */
    public function descartarAdiada(): void
    {
        $this->adiar = false; $this->aoIniciar = [];
        if (!$this->adiada) return;
        $this->adiada = false; $this->commits = $this->commitsAntesAdiar;
        if ($this->pdo->inTransaction()) { try { $this->pdo->rollBack(); } catch (Throwable $t) {} }
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

    private const EDITAVEIS_ATRIBUTO = ['rotulo', 'codigo', 'tipo', 'unidade_id', 'casas', 'minimo', 'maximo', 'descricao', 'ativo', 'autoridade', 'precifica_ref', 'aceita_nao_se_aplica', 'importancia_padrao'];

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
        return $this->q('SELECT id, product_id, atributo_id, opcao_id, opcao_chave, valor_texto, valor_num, valor_bool, valor_data, unidade_id, estado, origem, versao, excluido_em FROM ' . $this->t('eq_valor')
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
        return $this->q('SELECT id, simbolo, nome, grandeza, fator_base, ativo FROM ' . $this->t('eq_unidade') . ' ORDER BY simbolo ASC');
    }

    public function criarUnidade(string $simbolo, string $nome, ?string $grandeza): int
    {
        $this->exec('INSERT INTO ' . $this->t('eq_unidade') . ' (simbolo, nome, grandeza) VALUES (?, ?, ?)', [$simbolo, $nome, $grandeza]);
        return (int) $this->pdo->lastInsertId();
    }

    public function grupos(): array
    {
        $gs = $this->q('SELECT ' . $this->colunasGrupo() . ' FROM ' . $this->t('eq_grupo') . ' ORDER BY nome ASC');
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
        $r = $this->q('SELECT ' . $this->colunasGrupo() . ' FROM ' . $this->t('eq_grupo') . ' WHERE id = ?', [$id]);
        return $r ? $this->comDetalhes($r[0]) : null;
    }

    /**
     * P1 kit-prioridade: com a 012, kit NOVO entra no FIM da fila de precedência (MAX(prioridade) + 1) — nunca muda a ficha dos produtos
     * que já tinham kits. Duas criações simultâneas podem empatar: o desempate é o id (o mais novo perde). Sem a 012: como antes.
     */
    public function criarGrupo(string $nome): int
    {
        if ($this->temPrioridadeKit()) $this->exec('INSERT INTO ' . $this->t('eq_grupo') . ' (nome, prioridade) SELECT ?, COALESCE(MAX(prioridade), 0) + 1 FROM ' . $this->t('eq_grupo'), [$nome]);
        else $this->exec('INSERT INTO ' . $this->t('eq_grupo') . ' (nome) VALUES (?)', [$nome]);
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
        // DSHOW-035 #1: a ordem (nome, id) dos kits vem do MySQL — mesma colação (sem caixa/acento) que o app usa no ORDER BY g.nome, g.id.
        // P1 kit-prioridade: com a 012, `prioridade` também vem e manda (Aplicabilidade::compararKits); ordem_nome fica como regra antiga/fim da fila.
        $r = 0; foreach ($this->q('SELECT ' . $this->colunasGrupo() . ' FROM ' . $this->t('eq_grupo') . ' ORDER BY nome, id') as $g) $grupos[(int) $g['id']] = $g + ['ordem_nome' => $r++];
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
        return $this->q('SELECT id, product_id, atributo_id, opcao_id, opcao_chave, valor_texto, valor_num, valor_bool, valor_data, unidade_id, estado, origem, versao, excluido_em FROM ' . $this->t('eq_valor') . ' WHERE product_id = ? AND atributo_id = ? AND opcao_chave = ?', [$productId, $atributoId, $opcaoChave])[0] ?? null;
    }

    public function gravarValor(array $d, ?int $versaoEsperada): bool
    {
        if ($versaoEsperada === null) {
            $cols = ['product_id', 'atributo_id', 'opcao_id', 'opcao_chave', 'valor_texto', 'valor_num', 'valor_bool', 'valor_data', 'unidade_id', 'estado', 'origem', 'atualizado_por'];
            try {
                $this->exec('INSERT INTO ' . $this->t('eq_valor') . ' (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')', array_map(static fn($c) => $d[$c] ?? null, $cols));
                return true;
            } catch (PDOException $e) {
                if (($e->errorInfo[1] ?? 0) === 1062) return false;   // outra pessoa gravou primeiro → conflito
                throw $e;
            }
        }
        return $this->exec('UPDATE ' . $this->t('eq_valor') . ' SET opcao_id = ?, valor_texto = ?, valor_num = ?, valor_bool = ?, valor_data = ?, unidade_id = ?, estado = ?, origem = ?, atualizado_por = ?, excluido_em = NULL, versao = versao + 1
            WHERE product_id = ? AND atributo_id = ? AND opcao_chave = ? AND versao = ?',
            [$d['opcao_id'], $d['valor_texto'], $d['valor_num'], $d['valor_bool'], $d['valor_data'], $d['unidade_id'] ?? null, $d['estado'], $d['origem'], $d['atualizado_por'], $d['product_id'], $d['atributo_id'], $d['opcao_chave'], $versaoEsperada]) === 1;
    }

    public function unidade(int $id): ?array
    {
        return $this->q('SELECT id, simbolo, nome, grandeza, fator_base, ativo FROM ' . $this->t('eq_unidade') . ' WHERE id = ?', [$id])[0] ?? null;
    }

    public function definirUnidadesExtras(int $atributoId, array $unidades, string $usuario): void
    {
        $atuais = [];
        foreach ($this->q('SELECT unidade_id, excluido_em FROM ' . $this->t('eq_atributo_unidade') . ' WHERE atributo_id = ? FOR UPDATE', [$atributoId]) as $x) $atuais[(int) $x['unidade_id']] = $x['excluido_em'];
        foreach ($unidades as $u) {
            if (!array_key_exists($u, $atuais)) $this->exec('INSERT INTO ' . $this->t('eq_atributo_unidade') . ' (atributo_id, unidade_id, criado_por) VALUES (?, ?, ?)', [$atributoId, $u, $usuario]);
            elseif ($atuais[$u] !== null) $this->exec('UPDATE ' . $this->t('eq_atributo_unidade') . ' SET excluido_em = NULL WHERE atributo_id = ? AND unidade_id = ?', [$atributoId, $u]);
        }
        foreach ($atuais as $u => $exc) if ($exc === null && !in_array($u, $unidades, true)) $this->exec('UPDATE ' . $this->t('eq_atributo_unidade') . ' SET excluido_em = CURRENT_TIMESTAMP(3) WHERE atributo_id = ? AND unidade_id = ?', [$atributoId, $u]);
    }

    /** A8: unidades permitidas além da regra da grandeza (008). */
    public function unidadesExtras(int $atributoId): array
    {
        return array_map('intval', array_column($this->q('SELECT unidade_id FROM ' . $this->t('eq_atributo_unidade') . ' WHERE atributo_id = ? AND excluido_em IS NULL', [$atributoId]), 'unidade_id'));
    }

    public function atualizarUnidade(int $id, array $d): bool
    {
        $sets = []; $p = [];
        foreach ($d as $k => $v) { if (!in_array($k, ['nome', 'grandeza', 'ativo', 'fator_base'], true)) continue; $sets[] = "$k = ?"; $p[] = $v; }
        if (!$sets) return true;
        $p[] = $id;
        return $this->exec('UPDATE ' . $this->t('eq_unidade') . ' SET ' . implode(', ', $sets) . ' WHERE id = ?', $p) >= 0;
    }

    /** DSHOW-071: trava a linha da unidade (dentro de transacao()). */
    public function travarUnidade(int $id): ?array
    {
        return $this->q('SELECT id, simbolo, nome, grandeza, fator_base, ativo FROM ' . $this->t('eq_unidade') . ' WHERE id = ? FOR UPDATE', [$id])[0] ?? null;
    }

    /** DSHOW-071: UPDATE condicionado ao estado travado (defesa extra; quem decide o conflito é o serviço, pela linha travada). */
    public function atualizarUnidadeSe(int $id, array $atual, array $d): void
    {
        $sets = []; $p = [];
        foreach ($d as $k => $v) { if (!in_array($k, ['nome', 'grandeza', 'fator_base'], true)) continue; $sets[] = "$k = ?"; $p[] = $v; }
        if (!$sets) return;
        array_push($p, $id, $atual['nome'], $atual['grandeza'], $atual['fator_base']);
        $this->exec('UPDATE ' . $this->t('eq_unidade') . ' SET ' . implode(', ', $sets) . ' WHERE id = ? AND nome = ? AND grandeza <=> ? AND fator_base <=> ?', $p);
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

    // ---- ModuloRepositorio (missão §8: 006/007; nada é apagado) -------------------------------------------------------------------
    public function produtosDiretosDoKit(int $grupoId): array
    {
        return array_map('intval', array_column($this->q('SELECT product_id FROM ' . $this->t('eq_grupo_produto') . ' WHERE grupo_id = ? AND excluido_em IS NULL ORDER BY product_id', [$grupoId]), 'product_id'));
    }

    public function definirKitProduto(int $grupoId, int $productId, bool $ativo, string $usuario, string $origem = 'manual'): bool
    {
        $r = $this->q('SELECT id, excluido_em, versao FROM ' . $this->t('eq_grupo_produto') . ' WHERE grupo_id = ? AND product_id = ? FOR UPDATE', [$grupoId, $productId])[0] ?? null;
        if ($ativo) {
            if ($r === null) { $this->exec('INSERT INTO ' . $this->t('eq_grupo_produto') . ' (grupo_id, product_id, origem, criado_por, atualizado_por) VALUES (?, ?, ?, ?, ?)', [$grupoId, $productId, $origem, $usuario, $usuario]); return true; }
            if ($r['excluido_em'] === null) return false;
            return $this->exec('UPDATE ' . $this->t('eq_grupo_produto') . ' SET excluido_em = NULL, versao = versao + 1, atualizado_por = ? WHERE id = ? AND versao = ?', [$usuario, $r['id'], $r['versao']]) === 1;
        }
        if ($r === null || $r['excluido_em'] !== null) return false;
        return $this->exec('UPDATE ' . $this->t('eq_grupo_produto') . ' SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1, atualizado_por = ? WHERE id = ? AND versao = ?', [$usuario, $r['id'], $r['versao']]) === 1;
    }

    public function ajusteProduto(int $productId, int $atributoId): ?array
    {
        return $this->q('SELECT id, product_id, atributo_id, modo, unidade_id, posicao, motivo, versao, excluido_em, atualizado_por, atualizado_em FROM ' . $this->t('eq_produto_atributo') . ' WHERE product_id = ? AND atributo_id = ?', [$productId, $atributoId])[0] ?? null;
    }

    public function definirAjusteProduto(int $productId, int $atributoId, ?array $dados, string $usuario): bool
    {
        $r = $this->q('SELECT id, modo, unidade_id, posicao, motivo, excluido_em, versao FROM ' . $this->t('eq_produto_atributo') . ' WHERE product_id = ? AND atributo_id = ? FOR UPDATE', [$productId, $atributoId])[0] ?? null;
        if ($dados === null) {
            if ($r === null || $r['excluido_em'] !== null) return false;
            return $this->exec('UPDATE ' . $this->t('eq_produto_atributo') . ' SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1, atualizado_por = ? WHERE id = ? AND versao = ?', [$usuario, $r['id'], $r['versao']]) === 1;
        }
        if ($r === null) {
            $this->exec('INSERT INTO ' . $this->t('eq_produto_atributo') . ' (product_id, atributo_id, modo, unidade_id, posicao, motivo, criado_por, atualizado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [$productId, $atributoId, $dados['modo'], $dados['unidade_id'], $dados['posicao'], $dados['motivo'], $usuario, $usuario]);
            return true;
        }
        $igual = $r['excluido_em'] === null && $r['modo'] === $dados['modo'] && (string) $r['unidade_id'] === (string) $dados['unidade_id'] && (string) $r['posicao'] === (string) $dados['posicao'] && (string) $r['motivo'] === (string) $dados['motivo'];
        if ($igual) return false;
        return $this->exec('UPDATE ' . $this->t('eq_produto_atributo') . ' SET modo = ?, unidade_id = ?, posicao = ?, motivo = ?, excluido_em = NULL, versao = versao + 1, atualizado_por = ? WHERE id = ? AND versao = ?',
            [$dados['modo'], $dados['unidade_id'], $dados['posicao'], $dados['motivo'], $usuario, $r['id'], $r['versao']]) === 1;
    }

    /**
     * Versão dos VÍNCULOS de cada produto (risco residual 5): impressão digital das linhas de kit direto (eq_grupo_produto) e de ajuste
     * (eq_produto_atributo) do produto, vivas ou excluídas, por (id, versao). Toda mudança de vínculo sobe a `versao` de uma linha ou cria
     * uma linha nova, então a impressão muda. $travar = FOR UPDATE (com trava de intervalo no índice por produto: segura também inserções).
     * @param int[] $productIds  @return array<int,string> product_id => 16 hex (produto sem linha nenhuma também tem versão)
     */
    public function versoesVinculos(array $productIds, bool $travar = false): array
    {
        $ids = array_values(array_unique(array_map('intval', $productIds))); if (!$ids) return [];
        $partes = array_fill_keys($ids, ['gp' => [], 'pa' => []]);
        foreach (array_chunk($ids, 500) as $lote) {
            $in = implode(',', array_fill(0, count($lote), '?')); $fu = $travar ? ' FOR UPDATE' : '';
            foreach ($this->q('SELECT id, product_id, versao FROM ' . $this->t('eq_grupo_produto') . " WHERE product_id IN ($in) ORDER BY id$fu", $lote) as $r) $partes[(int) $r['product_id']]['gp'][] = $r['id'] . ':' . $r['versao'];
            foreach ($this->q('SELECT id, product_id, versao FROM ' . $this->t('eq_produto_atributo') . " WHERE product_id IN ($in) ORDER BY id$fu", $lote) as $r) $partes[(int) $r['product_id']]['pa'][] = $r['id'] . ':' . $r['versao'];
        }
        $out = []; foreach ($partes as $pid => $x) $out[$pid] = substr(hash('sha256', 'gp=' . implode(',', $x['gp']) . '|pa=' . implode(',', $x['pa'])), 0, 16);
        return $out;
    }

    /** Pedido de massa (010): insere a chave na transação corrente. false = a chave já existe (outro pedido aplicou ou está aplicando). */
    public function registrarPedidoMassa(string $chave, string $assinatura, string $usuario, int $produtos): bool
    {
        try {
            $this->exec('INSERT INTO ' . $this->t('eq_pedido_massa') . ' (chave, assinatura, usuario, produtos) VALUES (?, ?, ?, ?)', [$chave, $assinatura, mb_substr($usuario, 0, 100), $produtos]);
            return true;
        } catch (PDOException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) === 1062) return false;   // chave única: duplicada
            throw $e;
        }
    }

    public function pedidoMassa(string $chave): ?array
    {
        $r = $this->q('SELECT chave, assinatura, usuario, ' . ($this->temTitularMassa() ? 'titular_id' : 'NULL AS titular_id') . ', produtos, resultado, criado_em, concluido_em FROM ' . $this->t('eq_pedido_massa') . ' WHERE chave = ?', [$chave])[0] ?? null;
        if ($r !== null) $r['resultado'] = $r['resultado'] === null ? null : json_decode((string) $r['resultado'], true);
        return $r;
    }

    /** 011 aplicada? (a coluna titular_id é aditiva; antes dela, o recibo da massa confere pelo `usuario`) */
    private ?bool $titularMassa = null;
    public function temTitularMassa(): bool
    {
        return $this->titularMassa ??= (bool) $this->q("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = " . ($this->p === '' ? 'DATABASE()' : '?') . " AND TABLE_NAME = 'eq_pedido_massa' AND COLUMN_NAME = 'titular_id'",
            $this->p === '' ? [] : [trim($this->p, '`.')])[0]['n'];
    }

    public function concluirPedidoMassa(string $chave, array $resultado): void
    {
        $this->exec('UPDATE ' . $this->t('eq_pedido_massa') . ' SET resultado = ?, concluido_em = CURRENT_TIMESTAMP(3) WHERE chave = ?', [json_encode($resultado, JSON_UNESCAPED_UNICODE), $chave]);
    }

    public function auditoriaPorChave(string $entidade, string $entidadeId): ?array
    {
        return $this->q('SELECT id, usuario, acao, antes, depois, criado_em FROM ' . $this->t('eq_auditoria') . ' WHERE entidade = ? AND entidade_id = ? ORDER BY id DESC LIMIT 1', [$entidade, $entidadeId])[0] ?? null;
    }

    // ---- SugestoesRepositorio (009) ------------------------------------------------------------------------------------------------------
    public function sugestao(int $id, bool $travar = false): ?array
    {
        return $this->q('SELECT * FROM ' . $this->t('eq_sugestao') . ' WHERE id = ?' . ($travar ? ' FOR UPDATE' : ''), [$id])[0] ?? null;
    }

    // ---- SugestoesDecisoes (013, Parte C) -----------------------------------------------------------------------------------------------
    private ?bool $tem013 = null;
    public function temEstadosSugestao(): bool
    {
        $schema = $this->p === '' ? null : substr($this->p, 1, -2);   // "`SCHEMA`." → SCHEMA (sem prefixo = o banco da conexão)
        return $this->tem013 ??= (bool) $this->q("SELECT 1 FROM information_schema.columns WHERE table_schema = " . ($schema === null ? 'DATABASE()' : '?')
            . " AND table_name = 'eq_sugestao' AND column_name = 'substitui_id' LIMIT 1", $schema === null ? [] : [$schema]);
    }

    /** Transição com trava otimista (versão + estado de origem). Devolver/Reabrir limpam o decisor. 1062 = já há pendente da identidade. */
    public function transicionarSugestao(int $id, int $versao, string $de, string $para, string $usuario, ?int $usuarioId, ?string $motivo, bool $limparDecisor): bool
    {
        $sets = $limparDecisor ? 'decidido_por = NULL, decidido_por_id = NULL, decidido_em = NULL' : 'decidido_por = ?, decidido_por_id = ?, decidido_em = CURRENT_TIMESTAMP(3)';
        $p = $limparDecisor ? [$para, $motivo, $id, $versao, $de] : [$para, $motivo, $usuario, $usuarioId, $id, $versao, $de];
        try {
            return $this->exec('UPDATE ' . $this->t('eq_sugestao') . " SET estado = ?, motivo = ?, $sets, versao = versao + 1 WHERE id = ? AND versao = ? AND estado = ?", $p) === 1;
        } catch (PDOException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) !== 1062) throw $e;
            $err = new AtributosErro('CONFLICT', 409, 'Já existe uma sugestão mais nova em aberto para este campo deste produto.');
            $err->meta = ['motivo' => 'pendente_existente'];
            throw $err;
        }
    }

    public function temSucessora(int $id): bool
    {
        return (bool) $this->q('SELECT 1 FROM ' . $this->t('eq_sugestao') . ' WHERE substitui_id = ? LIMIT 1', [$id]);
    }

    /** Titular estável de quem decidiu (aceitar/recusar pelo caminho antigo): só preenche, nunca troca. */
    public function carimbarDecisor(int $id, int $usuarioId): void
    {
        if (!$this->temEstadosSugestao()) return;
        $this->exec('UPDATE ' . $this->t('eq_sugestao') . ' SET decidido_por_id = ? WHERE id = ? AND decidido_por_id IS NULL AND estado IN (\'aceita\', \'recusada\')', [$usuarioId, $id]);
    }

    public function decidirSugestao(int $id, int $versao, string $estado, string $usuario, ?string $motivo): bool
    {
        return $this->exec('UPDATE ' . $this->t('eq_sugestao') . " SET estado = ?, decidido_por = ?, decidido_em = CURRENT_TIMESTAMP(3), motivo = ?, versao = versao + 1 WHERE id = ? AND versao = ? AND estado = 'pendente'",
            [$estado, $usuario, $motivo, $id, $versao]) === 1;
    }

    // ---- "FOI SALVO OU NÃO" (011): recibos por chave de operação --------------------------------------------------------------------
    public function aoConfirmar(?callable $gancho): void { $this->antesDoCommit = $gancho ? [$gancho] : []; }
    public function confirmacoes(): int { return $this->commits; }

    public function operacao(string $chave): ?array
    {
        $r = $this->q('SELECT chave, titular_id, titular, rota, assinatura, estado, tentativa, recibo, recibo_texto, erro, tentativas, criado_em, concluido_em, TIMESTAMPDIFF(SECOND, atualizado_em, CURRENT_TIMESTAMP(3)) AS idade_s FROM '
            . $this->t('eq_operacao') . ' WHERE chave = ?', [$chave])[0] ?? null;
        if ($r === null) return null;
        foreach (['recibo', 'erro'] as $k) $r[$k] = $r[$k] === null ? null : json_decode((string) $r[$k], true);
        if ($r['recibo_texto'] !== null) $r['recibo'] = json_decode((string) $r['recibo_texto'], true);   // DSHOW-093 A: o MESMO texto da resposta
        return $r;
    }

    public function reservarOperacao(string $chave, int $titularId, string $titular, string $rota, string $assinatura, string $tentativa): bool
    {
        try {
            $this->exec('INSERT INTO ' . $this->t('eq_operacao') . ' (chave, titular_id, titular, rota, assinatura, tentativa) VALUES (?, ?, ?, ?, ?, ?)', [$chave, $titularId, mb_substr($titular, 0, 100), $rota, $assinatura, $tentativa]);
            return true;
        } catch (PDOException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) === 1062) return false;
            throw $e;
        }
    }

    /**
     * Uma NOVA tentativa assume a chave (reenvio depois de recusa/conflito/falha/interrupção, ou em_andamento sem sinal de vida) SÓ se:
     * a linha da operação não está travada por ninguém (FOR UPDATE NOWAIT — uma tentativa viva no meio da gravação segura essa trava do
     * início ao COMMIT) E estado/tentativa ainda são os lidos (comparação-e-troca). true = assumiu · false = mudou · null = travada (viva).
     */
    public function assumirOperacao(string $chave, string $estadoLido, ?string $tentativaLida, string $novaTentativa): ?bool
    {
        if ($this->pdo->inTransaction()) throw new LogicException('assumirOperacao fora de transação');
        $this->pdo->beginTransaction();
        try {
            $r = $this->q('SELECT estado, tentativa FROM ' . $this->t('eq_operacao') . ' WHERE chave = ? FOR UPDATE NOWAIT', [$chave])[0] ?? null;
            if ($r === null || $r['estado'] !== $estadoLido || $r['tentativa'] !== $tentativaLida) { $this->pdo->rollBack(); return false; }
            $this->exec('UPDATE ' . $this->t('eq_operacao') . " SET estado = 'em_andamento', tentativa = ?, recibo = NULL, recibo_texto = NULL, erro = NULL, concluido_em = NULL, tentativas = tentativas + 1 WHERE chave = ?", [$novaTentativa, $chave]);
            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            if (in_array((int) ($e->errorInfo[1] ?? 0), [3572, 1205, 1213], true)) return null;   // 3572 = NOWAIT: travada por uma tentativa viva
            throw $e;
        }
    }

    /** Marca o desfecho SÓ se a operação ainda é desta tentativa (false = outra tentativa assumiu: nada muda). */
    public function marcarOperacao(string $chave, string $tentativa, string $estado, ?array $recibo, ?array $erro): bool
    {
        $texto = $recibo === null ? null : OperacoesGravacao::textoRecibo($recibo);
        return $this->exec('UPDATE ' . $this->t('eq_operacao') . ' SET estado = ?, recibo = COALESCE(?, recibo), recibo_texto = COALESCE(?, recibo_texto), erro = ?, concluido_em = ' . ($estado === 'em_andamento' || $estado === 'interrompida' ? 'NULL' : 'CURRENT_TIMESTAMP(3)') . ' WHERE chave = ? AND tentativa = ?',
            [$estado, $texto, $texto, $erro === null ? null : json_encode($erro, JSON_UNESCAPED_UNICODE), $chave, $tentativa]) === 1;
    }

    /** P1-2 b: dentro da transação, TRAVA a linha da operação e confere que ela ainda pertence a esta tentativa; toca `atualizado_em` (sinal de vida). */
    public function donoDaOperacao(string $chave, string $tentativa): bool
    {
        $atual = $this->q('SELECT tentativa FROM ' . $this->t('eq_operacao') . ' WHERE chave = ? FOR UPDATE', [$chave])[0]['tentativa'] ?? null;
        if ($atual !== $tentativa) return false;
        $this->exec('UPDATE ' . $this->t('eq_operacao') . ' SET atualizado_em = CURRENT_TIMESTAMP(3) WHERE chave = ?', [$chave]);
        return true;
    }

    /** P1-1: itens do lote como 'pendente' (os que já existem, de tentativa anterior, ficam como estão). */
    public function abrirItensOperacao(string $chave, array $itens): void
    {
        foreach (array_chunk(array_values($itens), 200, true) as $parte) {
            $vals = []; $ps = [];
            foreach ($parte as $pos => $item) { $vals[] = '(?, ?, ?)'; array_push($ps, $chave, (string) $item, (int) $pos); }
            $this->exec('INSERT IGNORE INTO ' . $this->t('eq_operacao_item') . ' (chave, item, posicao) VALUES ' . implode(', ', $vals), $ps);
        }
    }

    /** @return list<array{item:string,posicao:int,desfecho:string,detalhe:?array,atualizado_em:string}> na ordem do pedido */
    public function itensOperacao(string $chave): array
    {
        $out = [];
        foreach ($this->q('SELECT item, posicao, desfecho, detalhe, atualizado_em FROM ' . $this->t('eq_operacao_item') . ' WHERE chave = ? ORDER BY posicao, id', [$chave]) as $r)
            $out[] = ['item' => (string) $r['item'], 'posicao' => (int) $r['posicao'], 'desfecho' => (string) $r['desfecho'], 'detalhe' => $r['detalhe'] === null ? null : json_decode((string) $r['detalhe'], true), 'atualizado_em' => $r['atualizado_em']];
        return $out;
    }

    /** P1-1: grava o desfecho de UM item (só de 'pendente'): false = o item já tinha desfecho (outra tentativa o fez). */
    public function decidirItemOperacao(string $chave, string $item, string $desfecho, ?array $detalhe): bool
    {
        return $this->exec('UPDATE ' . $this->t('eq_operacao_item') . " SET desfecho = ?, detalhe = ? WHERE chave = ? AND item = ? AND desfecho = 'pendente'",
            [$desfecho, $detalhe === null ? null : json_encode($detalhe, JSON_UNESCAPED_UNICODE), $chave, $item]) === 1;
    }

    public function titularPedidoMassa(string $chave, int $titularId): void
    {
        $this->exec('UPDATE ' . $this->t('eq_pedido_massa') . ' SET titular_id = ? WHERE chave = ? AND titular_id IS NULL', [$titularId, $chave]);
    }
}
