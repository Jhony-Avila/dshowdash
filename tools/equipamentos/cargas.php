<?php
// tools/equipamentos/cargas.php — CARGAS de dados do módulo de atributos (missão §12; portão P3 em produção).
// Cada carga: idempotente (rodar 2× não duplica), --dry-run (relatório sem gravar), lote em eq_importacao_lote, relatório antes/depois, só
// INSERT onde não existe, nunca UPDATE em valor manual (D10), reversão por exclusão lógica (--reverter). Definições (C2–C4) passam pelos
// serviços (validação + auditoria na mesma transação); valores/sugestões (C5/C6) por SQL preparado com lote próprio.
//   C2 kit geral "Base (todos os produtos)" (D1, A5) · C3 kits do legado Controladoras/Cabos/Fontes + importância/destaque (D2, A3, A4)
//   C4 correções do dicionário (D4 Potência→W, D6 opções de Condições de Uso, D3 fatores, A9 integrações) · C5 valores do legado 2025
//   C6 sugestões pelo nome do produto · C7 prova de cobertura (só leitura).
// Uso: php tools/equipamentos/cargas.php --carga C2 --schema ATRWEB_VAL_EQ --credenciais <ini> [--dry-run] [--reverter] [--fonte <tsv C5>]
//      [--relatorio <pasta>]. Schema fora de ATRWEB_VAL_* exige --modo-producao + ATR_MIGRAR_PRODUCAO=APLICAR-NO-PORTAO (portão P3).
declare(strict_types=1);
require_once __DIR__ . '/../db/equipamentos-migrar.php';
require_once __DIR__ . '/../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../api/atributos/CatalogoPdo.php';
require_once __DIR__ . '/../../api/atributos/KitsService.php';
require_once __DIR__ . '/../../api/atributos/KitsLegado.php';

final class Cargas
{
    public const LOTES = ['C2' => 'carga C2 · kit geral (missão 18/11)', 'C3' => 'carga C3 · kits do legado (missão 18/11)', 'C4' => 'carga C4 · dicionário (missão 18/11)',
        'C5' => 'legado-2025-07-31', 'C6' => 'carga C6 · sugestões pelo nome (missão 18/11)',
        'C8' => 'carga C8 · Totens e Esferas (ETAPA B: T-3 a T-7)',
        'C9' => 'carga C9 · unidade efetiva nos valores antigos (DSHOW-048)'];
    /** Kits do legado → subcategorias atuais (D2; escopo pedido na missão §12-C3). */
    public const ESCOPOS = ['controladoras' => ['PROCESSOR', 'RECEIVING_CARD', 'SENDING_CARD', 'CONTROLLER'], 'cabos' => ['CABLE'], 'fontes' => ['POWER_SUPPLY']];
    public const NOMES = ['controladoras' => 'Controladoras', 'cabos' => 'Cabos', 'fontes' => 'Fontes'];
    public const BASE_NOME = 'Base (todos os produtos)';
    public const INTEGRACOES_NOME = 'Integrações';
    /** A9: campos de integração do dicionário de 2025 (Atributos_Itens.Atributos), fora do mm_atributos. */
    public const INTEGRACOES = [12 => 'Id Bling', 13 => 'Código Bling', 14 => 'Id Mercado Livre', 577 => 'Cod_Pai_Bling'];

    private string $s; private string $cs; private array $rel = [];
    /** $catalogo = schema do catálogo do app (produção: APP_DSHOW; validação: o próprio schema, com o retrato C1). */
    public function __construct(private readonly PDO $pdo, private readonly string $schema, private readonly bool $seco, private $log, private readonly ?string $catalogo = null)
    {
        $this->s = "`$schema`.";
        $this->cs = '`' . ($catalogo ?? $schema) . '`.';
    }
    private function q(string $sql, array $p = []): array { $st = $this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); }
    private function x(string $sql, array $p = []): int { if ($this->seco) return 0; $st = $this->pdo->prepare($sql); $st->execute($p); return $st->rowCount(); }
    private function n(string $t, string $w = '1', array $p = []): int { return (int) $this->q("SELECT COUNT(*) AS n FROM {$this->s}`$t` WHERE $w", $p)[0]['n']; }
    private function porLegado(): array { $o = []; foreach ($this->q("SELECT id, legado_id FROM {$this->s}eq_atributo WHERE legado_ns = 'Led_Lovers_PROD.mm_atributos'") as $r) $o[(int) $r['legado_id']] = (int) $r['id']; return $o; }
    private function temColunaExcluido(): bool { return (bool) $this->q("SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = 'eq_grupo_atributo' AND column_name = 'excluido_em'", [$this->schema]); }
    private function kitPorNome(string $nome): ?array { return $this->q("SELECT * FROM {$this->s}eq_grupo WHERE nome = ?", [$nome])[0] ?? null; }

    private function servicos(string $usuario): array
    {
        $repo = new AtributosRepoPdo($this->pdo, $this->schema);
        $cat = new CatalogoPdo($this->pdo, $this->catalogo ?? $this->schema);   // validação: retrato C1 no mesmo schema; produção: APP_DSHOW (P3)
        return [$repo, new KitsService($repo, 80, $usuario, $cat), new AtributosService($repo, 80, $usuario, $cat)];
    }

    /** Lote (eq_importacao_lote) da carga; identidade = sha256 da carga + regras + versão do script (P2-07). */
    private function lote(string $c, array $regras): int
    {
        $origem = self::LOTES[$c];
        $regra = hash('sha256', $c . '|' . json_encode($regras) . '|' . hash_file('sha256', __FILE__));
        $sha = hash('sha256', $regra . '|' . microtime(true) . '|' . bin2hex(random_bytes(8)));   // índice único: 1 por EXECUÇÃO; a regra fica no relatório
        // Um lote POR EXECUÇÃO (ETAPA B): a reversão desfaz só o que AQUELA execução gravou (ex.: a C6 do P3b não toca nas sugestões da ETAPA A).
        if ($this->seco) return 0;
        $this->x("INSERT INTO {$this->s}eq_importacao_lote (origem, arquivo_sha256, estado, relatorio, criado_por) VALUES (?, ?, 'ensaio', ?, ?)", [$origem, $sha, json_encode(['regras' => $regras, 'regra_sha256' => $regra]), "carga:$c"]);
        return $this->loteAtual = (int) $this->pdo->lastInsertId();
    }
    public ?int $loteAtual = null;
    private function fecharLote(int $lote, array $rel): void
    {
        if ($this->seco || !$lote) return;
        $this->x("UPDATE {$this->s}eq_importacao_lote SET estado = 'aplicado', relatorio = JSON_MERGE_PATCH(IFNULL(relatorio, '{}'), ?) WHERE id = ?", [json_encode(['resultado' => $rel]), $lote]);
    }

    private function importancia(array $legados): array
    {
        $o = [];
        foreach ($this->q("SELECT id, JSON_UNQUOTE(JSON_EXTRACT(legado_meta, '$.importancia_campos')) AS imp FROM {$this->s}eq_atributo") as $r)
            $o[(int) $r['id']] = Aplicabilidade::IMPORTANCIA_DO_LEGADO[$r['imp'] ?? ''] ?? null;
        return $o;
    }

    /** A4: até 4 destaques sugeridos entre obrigatórios e importantes, na ordem do kit. */
    private static function destaques(array $itens, array $imp): array
    {
        $n = 0;
        foreach ($itens as &$i) {
            $i['destaque'] = 0;
            if ($n < KitsService::MAX_DESTAQUES && in_array($i['importancia'] ?? $imp[$i['atributo_id']] ?? null, ['obrigatorio', 'importante'], true)) { $i['destaque'] = 1; $n++; }
        }
        return $itens;
    }

    // ---- C2 --------------------------------------------------------------------------------------------------------------------------
    public function c2(): array
    {
        [$repo, $kits] = $this->servicos('carga:C2');
        $leg = $this->porLegado(); $imp = $this->importancia([]);
        $base = array_map(static fn($l) => $leg[$l], KitsLegado::BASE);
        $desc = array_map(static fn($l) => $leg[$l], [1, 2, 3, 4, 5, 6]);
        $antes = ['descricoes_ativas' => $this->n('eq_atributo', 'id IN (' . implode(',', $desc) . ') AND ativo = 1'), 'kit' => (bool) $this->kitPorNome(self::BASE_NOME)];
        $lote = $this->lote('C2', ['base' => $base, 'A5' => 'descrições não visíveis no app']);
        $mud = ['descricoes_reativadas' => 0, 'kit_criado' => false, 'itens' => 0];
        // D1: reativar as 6 descrições (definição; auditada)
        foreach ($desc as $aid) {
            $a = $repo->atributo($aid);
            if ((int) $a['ativo'] === 1) continue;
            $mud['descricoes_reativadas']++;
            if (!$this->seco) (new AtributosService($repo, 80, 'carga:C2', new CatalogoPdo($this->pdo, $this->catalogo ?? $this->schema)))->definirAtivo($aid, true, (int) $a['versao'], 'D1: as 8 da base valem para todos os itens (carga C2)');
        }
        // A5 também nos grupos ANTIGOS: lá as 6 descrições estão marcadas visíveis no app (inofensivo enquanto inativas). Reativadas (D1),
        // a Descrição Interna/Fornecedor iriam para o app do cliente. Ficam visivel = 0 em todo kit (auditado, pelo serviço); o resto não muda.
        $mud['a5_grupos_antigos'] = [];
        foreach ($this->q("SELECT DISTINCT ga.grupo_id FROM {$this->s}eq_grupo_atributo ga WHERE ga.visivel = 1 AND ga.atributo_id IN (" . implode(',', $desc) . ")" . ($this->temColunaExcluido() ? ' AND ga.excluido_em IS NULL' : '')) as $r) {
            $g = $repo->grupo((int) $r['grupo_id']); if (!$g) continue;
            $mud['a5_grupos_antigos'][] = $g['nome'];
            if ($this->seco) continue;
            $it = array_map(static fn($x) => ['atributo_id' => (int) $x['atributo_id'], 'posicao' => $x['posicao'], 'obrigatorio' => (int) $x['obrigatorio'],
                'visivel' => in_array((int) $x['atributo_id'], $desc, true) ? 0 : (int) $x['visivel'], 'destaque' => (int) ($x['destaque'] ?? 0),
                'importancia' => $x['importancia'] ?? null, 'unidade_id' => $x['unidade_id'] ?? null], $g['atributos']);
            $kits->definirItens(['id' => (int) $g['id'], 'versao' => (int) $g['versao'], 'itens' => $it, 'motivo' => 'A5: descrições não visíveis no app (carga C2)']);
        }
        $k = $this->kitPorNome(self::BASE_NOME);
        if (!$k && !$this->seco) { $k = $kits->salvarKit(['nome' => self::BASE_NOME, 'descricao' => 'Os 8 atributos que o legado atribuía a TODOS os itens (D1). As 6 descrições ficam fora do app (A5).', 'aplica_a_todos' => 1, 'ordem' => -100])['kit']; $mud['kit_criado'] = true; }
        if ($k && !$this->seco) {
            $k = $repo->grupo((int) $k['id']);
            if (!$k['atributos']) {
                $itens = [];
                foreach ($base as $pos => $aid) $itens[] = ['atributo_id' => $aid, 'posicao' => $pos + 1, 'obrigatorio' => ($imp[$aid] ?? null) === 'obrigatorio' ? 1 : 0, 'visivel' => in_array($aid, $desc, true) ? 0 : 1, 'importancia' => $imp[$aid] ?? null, 'unidade_id' => null];
                $k = $kits->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => self::destaques($itens, $imp)])['kit']; $mud['itens'] = count($itens);
                // §9 compatibilidade: também como escopo de categoria — o app atual já vê o kit geral sem mudança
                $cats = array_column($this->q("SELECT DISTINCT category FROM {$this->cs}product_catalog WHERE deleted = 0 ORDER BY category"), 'category');
                $kits->definirEscopos(['id' => $k['id'], 'versao' => $k['versao'], 'escopos' => array_map(static fn($c) => ['categoria' => $c, 'subcategoria' => ''], $cats)]);
            }
        }
        // Q-N2 (Jhony, 18/11): "Descrição Interna" deixa de ser obrigatória no kit Base e vira "Importante" (o indicador mede o que falta de verdade)
        $kb = $this->kitPorNome(self::BASE_NOME); $interna = $leg[3] ?? null;
        if ($kb && $interna) {
            $kb = $repo->grupo((int) $kb['id']);
            $it = null; foreach ($kb['atributos'] as $x) if ((int) $x['atributo_id'] === $interna) $it = $x;
            if ($it && ((int) $it['obrigatorio'] === 1 || $it['importancia'] !== 'importante')) {
                $mud['qn2_interna_importante'] = 1;
                if (!$this->seco) $kits->definirItens(['id' => (int) $kb['id'], 'versao' => (int) $kb['versao'], 'motivo' => 'Q-N2: Descrição Interna = Importante (carga C2)', 'itens' => array_map(static fn($x) => ['atributo_id' => (int) $x['atributo_id'], 'posicao' => $x['posicao'],
                    'obrigatorio' => (int) $x['atributo_id'] === $interna ? 0 : (int) $x['obrigatorio'], 'visivel' => (int) $x['visivel'], 'destaque' => (int) $x['atributo_id'] === $interna ? 0 : (int) ($x['destaque'] ?? 0),
                    'importancia' => (int) $x['atributo_id'] === $interna ? 'importante' : ($x['importancia'] ?? null), 'unidade_id' => $x['unidade_id'] ?? null], $kb['atributos'])]);
            }
        }
        $rel = ['antes' => $antes, 'mudancas' => $mud, 'depois' => ['descricoes_ativas' => $this->n('eq_atributo', 'id IN (' . implode(',', $desc) . ') AND ativo = 1'), 'kit' => (bool) $this->kitPorNome(self::BASE_NOME)]];
        $this->fecharLote($lote, $rel);
        return $rel;
    }

    // ---- C3 --------------------------------------------------------------------------------------------------------------------------
    public function c3(): array
    {
        [$repo, $kits] = $this->servicos('carga:C3');
        $leg = $this->porLegado(); $imp = $this->importancia([]);
        $lote = $this->lote('C3', ['escopos' => self::ESCOPOS]);
        $antes = ['kits_ativos' => $this->n('eq_grupo', 'ativo = 1'), 'kits_com_itens' => (int) $this->q("SELECT COUNT(DISTINCT grupo_id) AS n FROM {$this->s}eq_grupo_atributo WHERE excluido_em IS NULL")[0]['n']];
        $mud = ['kits_criados' => [], 'itens' => [], 'kits_vazios_desativados' => 0, 'importancia_padrao' => 0, 'destaques_legado' => []];
        $profundidade = (int) ($this->q("SELECT id FROM {$this->s}eq_atributo WHERE codigo = 'profundidade_397'")[0]['id'] ?? 0);
        foreach (['controladoras', 'cabos', 'fontes'] as $cod) {
            $nome = self::NOMES[$cod];
            $ids = array_values(array_filter(array_map(static fn($l) => $leg[$l] ?? null, array_diff(KitsLegado::KITS[$cod]['ids'], KitsLegado::BASE))));
            if ($cod === 'cabos' && $profundidade && !in_array($profundidade, $ids, true)) $ids[] = $profundidade;   // D5: Cabos precisa de Profundidade E Comprimento
            $k = $this->kitPorNome($nome);
            if ($this->seco) { $mud['itens'][$nome] = count($ids); continue; }
            if (!$k) { $k = $kits->salvarKit(['nome' => $nome, 'descricao' => "Conjunto \"$nome\" do legado do Jhony (kit $cod): atributos exatos do legado" . ($cod === 'cabos' ? ' + Profundidade (D5)' : '') . '.'])['kit']; $mud['kits_criados'][] = $nome; }
            $k = $repo->grupo((int) $k['id']);
            if (!$k['atributos']) {
                $itens = [];
                foreach ($ids as $pos => $aid) $itens[] = ['atributo_id' => $aid, 'posicao' => $pos + 1, 'obrigatorio' => ($imp[$aid] ?? null) === 'obrigatorio' ? 1 : 0, 'visivel' => 1, 'importancia' => $imp[$aid] ?? null, 'unidade_id' => null];
                $k = $kits->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => self::destaques($itens, $imp)])['kit'];
                $k = $kits->definirEscopos(['id' => $k['id'], 'versao' => $k['versao'], 'escopos' => array_map(static fn($s) => ['categoria' => 'LED_PANEL', 'subcategoria' => $s], self::ESCOPOS[$cod])])['kit'];
            }
            $mud['itens'][$nome] = count($k['atributos']);
        }
        if (!$this->seco) {
            // A3/A4 também nos kits que já vieram do legado (Gabinete, Módulo, Parafusos): importância por item + destaques sugeridos
            foreach ($this->q("SELECT g.id FROM {$this->s}eq_grupo g WHERE g.legado_id IS NOT NULL AND g.ativo = 1 AND EXISTS (SELECT 1 FROM {$this->s}eq_grupo_atributo ga WHERE ga.grupo_id = g.id AND ga.excluido_em IS NULL)") as $r) {
                $k = $repo->grupo((int) $r['id']);
                if (array_filter($k['atributos'], static fn($i) => $i['importancia'] !== null)) continue;   // já feito (idempotente)
                $itens = array_map(static fn($i) => ['atributo_id' => (int) $i['atributo_id'], 'posicao' => (int) $i['posicao'], 'obrigatorio' => (int) $i['obrigatorio'], 'visivel' => (int) $i['visivel'], 'importancia' => $imp[(int) $i['atributo_id']] ?? null, 'unidade_id' => $i['unidade_id']], $k['atributos']);
                $kits->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => self::destaques($itens, $imp)]);
                $mud['destaques_legado'][] = $k['nome'];
            }
            // grupos antigos vazios ficam INATIVOS (não apagados)
            foreach ($this->q("SELECT g.id, g.versao FROM {$this->s}eq_grupo g WHERE g.ativo = 1 AND g.legado_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM {$this->s}eq_grupo_atributo ga WHERE ga.grupo_id = g.id AND ga.excluido_em IS NULL)") as $r) {
                $kits->definirAtivo(['id' => (int) $r['id'], 'versao' => (int) $r['versao'], 'ativo' => 0, 'motivo' => 'grupo do legado sem atributos (carga C3)']); $mud['kits_vazios_desativados']++;
            }
            // importância padrão do dicionário (A3) a partir do legado_meta, só onde está vazia
            $mud['importancia_padrao'] = $this->x("UPDATE {$this->s}eq_atributo SET importancia_padrao = CASE JSON_UNQUOTE(JSON_EXTRACT(legado_meta, '$.importancia_campos'))
                WHEN 'Campos Obrigatórios' THEN 'obrigatorio' WHEN 'Campos Importantes' THEN 'importante' WHEN 'Campos Básicos' THEN 'basico' WHEN 'Campos Complementares' THEN 'complementar'
                WHEN 'Campos Opcionais' THEN 'opcional' WHEN 'Campos Sem Importância' THEN 'sem_importancia' END WHERE importancia_padrao IS NULL AND legado_meta IS NOT NULL");
        }
        $rel = ['antes' => $antes, 'mudancas' => $mud, 'depois' => ['kits_ativos' => $this->n('eq_grupo', 'ativo = 1'), 'kits_com_itens' => (int) $this->q("SELECT COUNT(DISTINCT grupo_id) AS n FROM {$this->s}eq_grupo_atributo WHERE excluido_em IS NULL")[0]['n']]];
        $this->fecharLote($lote, $rel);
        return $rel;
    }

    // ---- C4 --------------------------------------------------------------------------------------------------------------------------
    public function c4(): array
    {
        [$repo, $kits, $svc] = $this->servicos('carga:C4');
        $lote = $this->lote('C4', ['D4' => 'Potência em W', 'D6' => ['Novo', 'Não especificado'], 'T1' => 'Semi-outdoor', 'fatores' => 'comprimento/massa', 'A9' => self::INTEGRACOES]);
        $mud = ['potencia_w' => false, 'opcoes_condicoes' => 0, 'fatores' => 0, 'integracoes_criadas' => 0, 'kit_integracoes' => false];
        $uni = []; foreach ($repo->unidades() as $u) $uni[$u['simbolo']] = $u;
        // D4: Potência em W (a unidade A estava errada; Amperagem é outro atributo)
        $pot = $this->q("SELECT id, unidade_id, versao FROM {$this->s}eq_atributo WHERE codigo = 'potencia_549'")[0] ?? null;
        if ($pot && (int) $pot['unidade_id'] !== (int) $uni['W']['id']) {
            $mud['potencia_w'] = true;
            if (!$this->seco) $svc->salvarAtributo(['id' => (int) $pot['id'], 'versao' => (int) $pot['versao'], 'unidade_id' => (int) $uni['W']['id'], 'motivo' => 'D4: Potência é em W; a unidade A estava errada (carga C4)']);
        }
        // D6: opções de Condições de Uso
        $cu = (int) ($this->q("SELECT id FROM {$this->s}eq_atributo WHERE codigo = 'condicoes_de_uso_15'")[0]['id'] ?? 0);
        if ($cu) foreach (['Novo', 'Não especificado'] as $rot) {
            if ($this->q("SELECT 1 FROM {$this->s}eq_opcao WHERE atributo_id = ? AND rotulo = ?", [$cu, $rot])) continue;
            $mud['opcoes_condicoes']++;
            if (!$this->seco) $svc->adicionarOpcao($cu, $rot);
        }
        // T-1 (Jhony, 18/11): opção "Semi-outdoor" em Tipo do Led (os totens Semi-Outdoor deixam de virar "outdoor"; a C6 revisa as sugestões)
        $tl = (int) ($this->q("SELECT id FROM {$this->s}eq_atributo WHERE codigo = 'tipo_do_led_87'")[0]['id'] ?? 0);
        if ($tl && !$this->q("SELECT 1 FROM {$this->s}eq_opcao WHERE atributo_id = ? AND LOWER(rotulo) = 'semi-outdoor'", [$tl])) {
            $mud['opcao_semi_outdoor'] = 1;
            if (!$this->seco) $svc->adicionarOpcao($tl, 'Semi-outdoor');
        }
        // D3: fatores para a unidade base da grandeza (exatos); unidade única da grandeza = fator 1; tempo sem conversão exata fica sem fator
        $fat = ['m' => '1', 'cm' => '0.01', 'mm' => '0.001', 'kg' => '1', 'g' => '0.001', 'h' => '1'];
        $porG = []; foreach ($uni as $u) $porG[(string) $u['grandeza']][] = $u['simbolo'];
        foreach ($uni as $sim => $u) {
            $f = $fat[$sim] ?? (count($porG[(string) $u['grandeza']] ?? []) === 1 ? '1' : null);
            if ($f === null || $u['fator_base'] !== null) continue;
            $mud['fatores']++;
            if (!$this->seco) $svc->salvarUnidade(['id' => (int) $u['id'], 'nome' => $u['nome'], 'grandeza' => $u['grandeza'], 'fator_base' => $f]);
        }
        // A9: atributos de integração (dicionário de 2025) num kit "Integrações", não visível no app
        $ids = [];
        foreach (self::INTEGRACOES as $lid => $rot) {
            $a = $this->q("SELECT id FROM {$this->s}eq_atributo WHERE legado_ns = 'Atributos_Itens.Atributos' AND legado_id = ?", [$lid])[0] ?? null;
            if (!$a) {
                $mud['integracoes_criadas']++;
                if ($this->seco) continue;
                $novo = $svc->salvarAtributo(['rotulo' => $rot, 'tipo' => 'texto', 'descricao' => 'Campo de integração (dicionário de 2025, A9). Não aparece no app.'])['atributo'];
                $this->x("UPDATE {$this->s}eq_atributo SET legado_ns = 'Atributos_Itens.Atributos', legado_id = ?, importancia_padrao = 'opcional' WHERE id = ?", [$lid, (int) $novo['id']]);
                $a = ['id' => $novo['id']];
            }
            $ids[] = (int) $a['id'];
        }
        if (!$this->seco && $ids) {
            $k = $this->kitPorNome(self::INTEGRACOES_NOME);
            if (!$k) { $k = $kits->salvarKit(['nome' => self::INTEGRACOES_NOME, 'descricao' => 'Códigos de integração (Bling, Mercado Livre). Não aparecem no app (A9). Pode ser desativado.', 'aplica_a_todos' => 1, 'ordem' => 900])['kit']; $mud['kit_integracoes'] = true; }
            $k = $repo->grupo((int) $k['id']);
            if (!$k['atributos']) $kits->definirItens(['id' => $k['id'], 'versao' => $k['versao'], 'itens' => array_map(static fn($aid, $p) => ['atributo_id' => $aid, 'posicao' => $p + 1, 'visivel' => 0, 'importancia' => 'opcional'], $ids, array_keys($ids))]);
        }
        $rel = ['mudancas' => $mud];
        $this->fecharLote($lote, $rel);
        return $rel;
    }

    // ---- C5 --------------------------------------------------------------------------------------------------------------------------
    /** Valores do legado 2025 (E0B §3b, decisões D1–D6): A1–A4 e B1 viram valor 'importado' (lote próprio, só onde não existe); C1/C2 viram
     *  sugestão de CONFERÊNCIA (D5); X não entra. Integração (Código Bling, Id ML) entra no kit Integrações (A9). */
    public function c5(string $fonte): array
    {
        if (!is_file($fonte)) throw new RuntimeException('fonte da C5 ausente (ANEXO-E0B-B-classificacao-carga.tsv)');
        $lote = $this->lote('C5', ['fonte' => basename($fonte), 'sha' => hash_file('sha256', $fonte)]);
        $uni = []; foreach ($this->q("SELECT id, simbolo FROM {$this->s}eq_unidade") as $u) $uni[$u['simbolo']] = (int) $u['id'];
        $porCod = []; foreach ($this->q("SELECT id, codigo, tipo FROM {$this->s}eq_atributo") as $a) $porCod[$a['codigo']] = $a;
        $op = []; foreach ($this->q("SELECT id, atributo_id, rotulo FROM {$this->s}eq_opcao WHERE ativo = 1") as $o) $op[(int) $o['atributo_id']][self::norm($o['rotulo'])] = (int) $o['id'];
        $n = ['valores_inseridos' => 0, 'ja_existiam' => 0, 'sugestoes_conferencia' => 0, 'nao_carregados' => 0, 'sem_opcao' => 0, 'por_faixa' => []];
        $linhas = array_map(static fn($l) => explode("\t", $l), array_slice(file($fonte, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES), 1));
        foreach ($linhas as $c) {
            [$faixa, $pid, , $sub, , $codigo, $rotulo, $tipo, , $valor] = $c;
            $n['por_faixa'][$faixa] = ($n['por_faixa'][$faixa] ?? 0) + 1;
            $pid = (int) $pid; $a = $porCod[$codigo] ?? null;
            if (!$a || str_starts_with($faixa, 'X')) { $n['nao_carregados']++; continue; }
            $aid = (int) $a['id'];
            if (str_starts_with($faixa, 'C')) {   // conferência (D5 e frequência de módulo): nunca muda de campo sozinho
                $alt = $faixa === 'C1' ? ($porCod['comprimento_' . self::legadoDe($porCod, 'Comprimento')] ?? null) : ($porCod['taxa_de_atualizacao_refresh_rate_93'] ?? null);
                $num = self::numero($valor);
                $chave = "legado_2025|$pid|$aid|conferencia";
                if ($this->q("SELECT 1 FROM {$this->s}eq_sugestao WHERE chave = ?", [$chave])) { $n['ja_existiam']++; continue; }
                $n['sugestoes_conferencia']++;
                $this->x("INSERT INTO {$this->s}eq_sugestao (chave, product_id, atributo_id, atributo_alternativo_id, fonte, tipo, valor_proposto, unidade_id, confianca, evidencia, lote_id)
                          VALUES (?, ?, ?, ?, 'legado_2025', 'conferencia', ?, ?, 'media', ?, ?)",
                    [$chave, $pid, $aid, $alt ? (int) $alt['id'] : null, $num ?? $valor, $faixa === 'C1' ? $uni['mm'] : $uni['Hz'], "Atributos_Itens 31/07/2025: \"$rotulo\" = $valor" . ($faixa === 'C1' ? ' (cabo: Profundidade ou Comprimento? D5)' : ' (módulo: frequência ou taxa de atualização?)'), $lote ?: null]);
                continue;
            }
            // valor (A1–A4, B1): só onde não existe valor vivo nem excluído (nunca sobrescreve; D10)
            if ($this->q("SELECT 1 FROM {$this->s}eq_valor WHERE product_id = ? AND atributo_id = ? AND opcao_chave = 0", [$pid, $aid])) { $n['ja_existiam']++; continue; }
            $d = ['valor_texto' => null, 'valor_num' => null, 'opcao_id' => null, 'unidade_id' => null];
            if (in_array($a['tipo'], ['numero', 'inteiro'], true)) {
                $d['valor_num'] = self::numero($valor);
                if ($d['valor_num'] === null) { $n['nao_carregados']++; continue; }
                if (str_ends_with($rotulo, 'da Caixa') || in_array($rotulo, ['Altura', 'Largura', 'Profundidade'], true)) $d['unidade_id'] = $uni['mm'];   // P5: a unidade real (mm)
                elseif ($rotulo === 'Potência') $d['unidade_id'] = $uni['W'];
                elseif ($rotulo === 'Frequência') $d['unidade_id'] = $uni['Hz'];
            } elseif ($a['tipo'] === 'opcao') {
                $alvo = self::norm(['NOVO' => 'Novo', 'NAO ESPECIFICADO' => 'Não especificado'][strtoupper(self::norm($valor))] ?? $valor);
                $d['opcao_id'] = $op[$aid][$alvo] ?? null;
                if ($d['opcao_id'] === null) { $n['sem_opcao']++; continue; }
            } else {
                $d['valor_texto'] = mb_substr(trim($valor), 0, 500);
                if ($d['valor_texto'] === '') { $n['nao_carregados']++; continue; }   // DSHOW-035 #4: nunca "informado" vazio
            }
            $n['valores_inseridos']++;
            $this->x("INSERT INTO {$this->s}eq_valor (product_id, atributo_id, opcao_id, opcao_chave, valor_texto, valor_num, unidade_id, estado, origem, legado_bruto, lote_id, atualizado_por)
                      VALUES (?, ?, ?, 0, ?, ?, ?, 'informado', 'importado', ?, ?, 'carga:C5')",
                [$pid, $aid, $d['opcao_id'], $d['valor_texto'], $d['valor_num'], $d['unidade_id'], mb_substr("legado 2025: $valor", 0, 256), $lote ?: null]);
        }
        $this->fecharLote($lote, $n);
        return $n;
    }

    private static function legadoDe(array $porCod, string $rotulo): string { foreach ($porCod as $cod => $_) if (preg_match('/^comprimento_(\d+)$/', $cod, $m)) return $m[1]; return '0'; }
    private static function norm(string $s): string { return strtolower(trim((string) iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s))); }
    /** "240.000" → 240 · "60Hz" → 60 · "1,25" → 1.25 · texto → null. */
    public static function numero(string $v): ?string
    {
        $t = str_replace(',', '.', trim($v));
        if (!preg_match('/^(-?\d+(?:\.\d+)?)\s*[A-Za-z²%°]*$/u', $t, $m)) return null;
        $x = rtrim(rtrim($m[1], '0'), '.');
        return str_contains($m[1], '.') ? ($x === '' || $x === '-' ? '0' : $x) : $m[1];
    }

    // ---- C6 --------------------------------------------------------------------------------------------------------------------------
    public const C6_SUBCATEGORIAS = ['CABINET', 'LED_MODULE', 'TOTEM', 'SPHERE', 'CAN', 'LED_BAG', 'AUTONOMOUS_TV', 'EASEL', 'BACKPACK', 'POWER_SUPPLY'];   // bloqueado: acessórios e serviços
    /** Fontes: só a Potência (NNNW) é inequívoca no nome; V/A podem ser entrada/saída e medidas "NNNmm x NNNmm" são do gabinete. */
    public const C6_SO_POTENCIA = ['POWER_SUPPLY'];
    /** Correções aprovadas pelo Jhony para nomes com erro na ORIGEM. O catálogo não muda: o pedido de correção vai para a fonte
     *  (atributos-web/entrega/CORRECOES-NA-FONTE.md). Aqui só a SUGESTÃO sai certa. */
    public const C6_CORRECOES = [
        283 => ['taxa_de_atualizacao_refresh_rate_93' => ['3840', 'correção aprovada pelo Jhony em 18/11: 3840 Hz (o nome traz "38040Hz", erro de digitação na origem)']],
    ];

    /** Leitura pura do nome (testável): medidas, pitch, Hz e ambiente. Hz só com 3–4 dígitos inteiros ("38040Hz" não vira 8040). */
    public static function lerNome(string $nome): array
    {
        $r = [];
        if (preg_match('/(\d{2,5})\s*mm\s*[xX×]\s*(\d{2,5})\s*mm/u', $nome, $m)) { $r['largura'] = $m[1]; $r['altura'] = $m[2]; }
        if (preg_match('/\bP\s*\.?\s*(\d{1,2}(?:[.,]\d{1,3})?)\b/u', $nome, $m)) $r['pitch'] = str_replace(',', '.', $m[1]);
        if (preg_match('/(?<![\d.,])(\d{3,4})\s*Hz/u', $nome, $m)) $r['hz'] = $m[1];
        if (preg_match('/\bSemi[\s-]*Outdoor\b/iu', $nome)) $r['ambiente'] = 'semi-outdoor';    // T-1 (Jhony, 18/11): antes virava "outdoor"
        elseif (preg_match('/\b(Indoor|Outdoor)\b/iu', $nome, $m)) $r['ambiente'] = strtolower($m[1]);
        return $r;
    }
    public function c6(): array
    {
        $lote = $this->lote('C6', ['subcategorias' => self::C6_SUBCATEGORIAS, 'regras' => 'NNNmm x NNNmm; P.x; NNNN Hz (3–4 dígitos); Semi-outdoor/Indoor/Outdoor; correções aprovadas; Fontes: NNNW → Potência']);
        $cod = []; foreach ($this->q("SELECT id, codigo FROM {$this->s}eq_atributo") as $a) $cod[$a['codigo']] = (int) $a['id'];
        $uni = []; foreach ($this->q("SELECT id, simbolo FROM {$this->s}eq_unidade") as $u) $uni[$u['simbolo']] = (int) $u['id'];
        $opLed = []; foreach ($this->q("SELECT id, rotulo FROM {$this->s}eq_opcao WHERE atributo_id = ? AND ativo = 1", [$cod['tipo_do_led_87']]) as $o) $opLed[strtolower($o['rotulo'])] = (int) $o['id'];
        $tem = []; foreach ($this->q("SELECT product_id, atributo_id FROM {$this->s}eq_valor WHERE excluido_em IS NULL") as $v) $tem[(int) $v['product_id'] . ':' . (int) $v['atributo_id']] = true;
        $n = ['produtos' => 0, 'sugestoes' => 0, 'ja_existiam' => 0, 'bloqueados' => 0, 'por_atributo' => []];
        $in = implode(',', array_fill(0, count(self::C6_SUBCATEGORIAS), '?'));
        foreach ($this->q("SELECT id, name, subcategory FROM {$this->cs}product_catalog WHERE deleted = 0 AND active = 1 AND category = 'LED_PANEL'") as $p) {
            if (!in_array($p['subcategory'], self::C6_SUBCATEGORIAS, true)) { $n['bloqueados']++; continue; }
            $pid = (int) $p['id']; $nome = (string) $p['name']; $props = [];
            if (in_array($p['subcategory'], self::C6_SO_POTENCIA, true)) {
                if (preg_match('/\b(\d{2,4})\s*W\b/iu', $nome, $m) && isset($uni['W'])) $props['potencia_549'] = [$m[1], $uni['W'], null];
            } else {
            $l = self::lerNome($nome);
            if (isset($l['largura'])) { $props['largura_409'] = [$l['largura'], $uni['mm'], null]; $props['altura_122'] = [$l['altura'], $uni['mm'], null]; }
            if (isset($l['pitch'])) $props['pitch_138'] = [$l['pitch'], $uni['mm'], null];
            if (isset($l['hz']) && isset($cod['taxa_de_atualizacao_refresh_rate_93'])) $props['taxa_de_atualizacao_refresh_rate_93'] = [$l['hz'], $uni['Hz'], null];
            if (isset($l['ambiente']) && isset($opLed[$l['ambiente']])) $props['tipo_do_led_87'] = [null, null, $opLed[$l['ambiente']]];
            }
            $nota = [];
            foreach (self::C6_CORRECOES[$pid] ?? [] as $c => [$v, $por]) { if (isset($cod[$c])) { $props[$c] = [$v, $c === 'taxa_de_atualizacao_refresh_rate_93' ? $uni['Hz'] : ($props[$c][1] ?? null), null]; $nota[$c] = $por; } }
            if ($props) $n['produtos']++;
            foreach ($props as $c => [$val, $u, $opc]) {
                $aid = $cod[$c] ?? null; if (!$aid || isset($tem["$pid:$aid"])) continue;
                $chave = "nome_produto|$pid|$aid";
                $prop = $val ?? ($opc !== null ? array_search($opc, $opLed, true) : null);
                $evid = mb_substr("Do nome: \"$nome\"" . (isset($nota[$c]) ? ' · ' . $nota[$c] : ''), 0, 500);
                $ex = $this->q("SELECT id, valor_proposto, opcao_id, estado, versao FROM {$this->s}eq_sugestao WHERE chave = ?", [$chave])[0] ?? null;
                if ($ex) {
                    // C6c: regra revista (Semi-outdoor, Hz) → atualiza só sugestão AINDA PENDENTE e não tocada desde a leitura (versao); decidida fica.
                    if ($ex['estado'] === 'pendente' && ((string) $ex['valor_proposto'] !== (string) $prop || (int) $ex['opcao_id'] !== (int) $opc)) {
                        $antes = ['valor_proposto' => $ex['valor_proposto'], 'opcao_id' => $ex['opcao_id'] === null ? null : (int) $ex['opcao_id']];
                        if ($this->seco || $this->x("UPDATE {$this->s}eq_sugestao SET valor_proposto = ?, opcao_id = ?, evidencia = ?, versao = versao + 1 WHERE id = ? AND versao = ? AND estado = 'pendente'", [$prop, $opc, $evid, $ex['id'], $ex['versao']]) === 1) {
                            $n['revistas'] = ($n['revistas'] ?? 0) + 1; $n['revistas_ids'][] = (int) $ex['id'];
                            if (!$this->seco) (new AtributosRepoPdo($this->pdo, $this->schema))->auditar('carga:C6', 'revisar_sugestao', 'sugestao', (string) $ex['id'], $antes, ['valor_proposto' => $prop, 'opcao_id' => $opc], 'C6c: regra do nome revista (Semi-outdoor; Hz com 3–4 dígitos; correções aprovadas)');
                        }
                    } else $n['ja_existiam']++;
                    continue;
                }
                $n['sugestoes']++; $n['por_atributo'][$c] = ($n['por_atributo'][$c] ?? 0) + 1;
                $this->x("INSERT INTO {$this->s}eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, opcao_id, unidade_id, confianca, evidencia, lote_id) VALUES (?, ?, ?, 'nome_produto', 'valor', ?, ?, ?, 'media', ?, ?)",
                    [$chave, $pid, $aid, $prop, $opc, $u, $evid, $lote ?: null]);
            }
        }
        $this->fecharLote($lote, $n);
        return $n;
    }

    // ---- C8 · Totens e Esferas (ETAPA B; respostas do Jhony T-3 a T-7, 18/11) ----------------------------------------------------------
    public const C8_KITS = [
        'Totens' => ['legado' => 'Totem de Led | Totem', 'escopos' => ['TOTEM', 'EASEL'],   // T-3: cavaletes no mesmo kit
            'obrigatorio' => ['pitch_138', 'tipo_do_led_87', 'altura_122', 'largura_409'],
            'importante' => ['taxa_de_atualizacao_refresh_rate_93', 'tipo_do_pixel_139', 'peso_399', 'potencia_549', 'tensao_de_entrada_548', 'resolucao_de_largura_152', 'resolucao_de_altura_101', 'brilho_77', 'tipo_do_parafuso_para_fixacao_95', 'condicoes_de_uso_15'],
            'basico' => ['profundidade_397', 'ip_rating_24', 'material_da_estrutura_116', 'angulo_maximo_de_visualizacao_horizontal_143', 'angulo_maximo_de_visualizacao_vertical_111', 'tipos_de_montagem_464', '@faces'],
            'destaques' => ['pitch_138', 'tipo_do_led_87', 'altura_122', 'largura_409'],   // T-5
            'descricao' => 'Totens de LED e estruturas de totem (T-3: inclui os cavaletes). Altura × Largura por face (T-6).'],
        'Esferas' => ['legado' => 'Painel Led | Esfera', 'escopos' => ['SPHERE'],
            'obrigatorio' => ['diametro_541', 'pitch_138', 'tipo_do_led_87'],
            'importante' => ['taxa_de_atualizacao_refresh_rate_93', 'tipo_do_pixel_139', 'peso_399', 'potencia_549', 'tensao_de_entrada_548', 'brilho_77', 'condicoes_de_uso_15'],
            'basico' => ['ip_rating_24', 'angulo_maximo_de_visualizacao_horizontal_143', 'tipos_de_montagem_464'],
            'destaques' => ['diametro_541', 'pitch_138', 'tipo_do_led_87', 'taxa_de_atualizacao_refresh_rate_93'],
            'descricao' => 'Esferas de LED. Diâmetro em cm (T-7).'],
    ];
    /** T-4: estruturas de totem sem LED ficam em Totens, com exceção (motivo) dos campos de LED. */
    public const C8_SEM_LED = [256, 476, 521, 558, 591, 1067];
    public const C8_SEM_LED_EXC = ['pitch_138', 'tipo_do_led_87', 'taxa_de_atualizacao_refresh_rate_93'];
    /** T-7: ficha do Precifica (panel_mounted) → SUGESTÃO (nunca valor direto). */
    public const C8_PRECIFICA = ['fixation' => ['tipo_do_parafuso_para_fixacao_95', ['MAGNETIC' => 'Imantado']], 'material' => ['material_da_estrutura_116', ['ALUMINUM' => 'Alumínio']]];

    /** Leitura pura do nome (testável): faces (T-6) e diâmetro da esfera em cm (T-7). */
    public static function lerNomeC8(string $nome): array
    {
        $r = [];
        if (preg_match('/\bdupla[\s-]*face\b/iu', $nome)) $r['faces'] = '2';
        if (preg_match('/(\d+(?:[.,]\d+)?)\s*metros?\s*(?:de\s*)?di[âa]metro/iu', $nome, $m)) {
            [$i, $f] = array_pad(explode('.', str_replace(',', '.', $m[1])), 2, '');
            $f = str_pad(substr($f, 0, 2), 2, '0'); $cm = ltrim($i . $f, '0'); $r['diametro_cm'] = $cm === '' ? '0' : $cm;   // metros → cm sem float
        }
        return $r;
    }

    public function c8(): array
    {
        [$repo, $kits, $svc] = $this->servicos('carga:C8');
        $lote = $this->lote('C8', ['kits' => array_keys(self::C8_KITS), 'T-3' => 'EASEL', 'T-4' => self::C8_SEM_LED, 'T-6' => 'Número de faces', 'T-7' => 'Precifica como sugestão; diâmetro em cm']);
        $mud = ['atributo_faces' => 0, 'opcoes' => [], 'kits' => [], 'excecoes' => 0, 'sugestoes' => ['faces' => 0, 'diametro' => 0, 'precifica' => 0], 'ja_existiam' => 0];
        $cod = []; foreach ($this->q("SELECT id, codigo, rotulo FROM {$this->s}eq_atributo") as $a) $cod[$a['codigo']] = (int) $a['id'];
        $uni = []; foreach ($this->q("SELECT id, simbolo FROM {$this->s}eq_unidade") as $u) $uni[$u['simbolo']] = (int) $u['id'];
        // T-6: atributo "Número de faces" (inteiro)
        $faces = (int) ($this->q("SELECT id FROM {$this->s}eq_atributo WHERE rotulo = 'Número de faces'")[0]['id'] ?? 0);
        if (!$faces) { $mud['atributo_faces'] = 1; if (!$this->seco) $faces = (int) $svc->salvarAtributo(['rotulo' => 'Número de faces', 'tipo' => 'inteiro', 'descricao' => 'Faces com LED (Dupla Face = 2). Altura × Largura são por face (T-6).'])['atributo']['id']; }
        // T-7: opções que faltam
        foreach (self::C8_PRECIFICA as [$c, $map]) foreach ($map as $rot) {
            $aid = $cod[$c] ?? 0; if (!$aid) continue;
            if ($this->q("SELECT 1 FROM {$this->s}eq_opcao WHERE atributo_id = ? AND rotulo = ?", [$aid, $rot])) continue;
            $mud['opcoes'][] = "$c: $rot"; if (!$this->seco) $svc->adicionarOpcao($aid, $rot);
        }
        // kits: reaproveita o grupo antigo (renomeia), itens, escopos, ativa
        foreach (self::C8_KITS as $nome => $def) {
            $k = $this->kitPorNome($nome) ?? $this->kitPorNome($def['legado']);
            $acoes = [];
            if (!$k) { $acoes[] = 'criar'; if ($this->seco) { $mud['kits'][$nome] = $acoes; continue; } $k = $kits->salvarKit(['nome' => $nome, 'descricao' => $def['descricao']])['kit']; }
            $k = $repo->grupo((int) $k['id']);
            if ($k['nome'] !== $nome) { $acoes[] = "renomear '{$k['nome']}'"; if (!$this->seco) $kits->salvarKit(['id' => (int) $k['id'], 'versao' => (int) $k['versao'], 'nome' => $nome, 'descricao' => $def['descricao'], 'motivo' => 'C8: kit de ' . $nome]); }
            $itens = []; $pos = 0;
            foreach (['obrigatorio', 'importante', 'basico'] as $imp) foreach ($def[$imp] as $c) {
                $aid = $c === '@faces' ? $faces : ($cod[$c] ?? 0); if (!$aid) continue;
                $itens[] = ['atributo_id' => $aid, 'posicao' => ++$pos, 'obrigatorio' => $imp === 'obrigatorio' ? 1 : 0, 'visivel' => 1, 'destaque' => in_array($c, $def['destaques'], true) ? 1 : 0, 'importancia' => $imp, 'unidade_id' => null];
            }
            $k = $repo->grupo((int) $k['id']);
            $norm = static fn(array $xs) => array_map(static fn($x) => implode('|', [(int) $x['atributo_id'], (int) $x['obrigatorio'], (int) $x['visivel'], (int) ($x['destaque'] ?? 0), (string) ($x['importancia'] ?? '')]), $xs);
            $atual = $norm($k['atributos']); $novo = $norm($itens); sort($atual); sort($novo);
            if ($atual !== $novo) { $acoes[] = 'itens ' . count($itens); if (!$this->seco) $kits->definirItens(['id' => (int) $k['id'], 'versao' => (int) $repo->grupo((int) $k['id'])['versao'], 'itens' => $itens, 'motivo' => "C8: itens do kit $nome"]); }
            $esc = array_map(static fn($sub) => ['categoria' => 'LED_PANEL', 'subcategoria' => $sub], $def['escopos']);
            $k = $repo->grupo((int) $k['id']);
            $ea = array_map(static fn($e) => $e['categoria'] . '|' . $e['subcategoria'], $k['escopos']); $en = array_map(static fn($e) => $e['categoria'] . '|' . $e['subcategoria'], $esc); sort($ea); sort($en);
            if ($ea !== $en) { $acoes[] = 'escopos ' . implode(',', $def['escopos']); if (!$this->seco) $kits->definirEscopos(['id' => (int) $k['id'], 'versao' => (int) $k['versao'], 'escopos' => $esc, 'motivo' => "C8: escopo do kit $nome"]); }
            $k = $repo->grupo((int) $k['id']);
            if ((int) $k['ativo'] !== 1) { $acoes[] = 'ativar'; if (!$this->seco) $kits->definirAtivo(['id' => (int) $k['id'], 'versao' => (int) $k['versao'], 'ativo' => 1, 'motivo' => "C8: kit $nome em uso"]); }
            $mud['kits'][$nome] = $acoes ?: ['sem mudança'];
        }
        // T-4: exceções nas estruturas sem LED
        $ativos = []; foreach ($this->q("SELECT id, name, subcategory FROM {$this->cs}product_catalog WHERE deleted = 0 AND active = 1 AND category = 'LED_PANEL' AND subcategory IN ('TOTEM', 'EASEL', 'SPHERE')") as $p) $ativos[(int) $p['id']] = $p;
        foreach (self::C8_SEM_LED as $pid) {
            if (!isset($ativos[$pid])) continue;
            foreach (self::C8_SEM_LED_EXC as $c) {
                $aid = $cod[$c] ?? 0; if (!$aid) continue;
                $aj = $repo->ajusteProduto($pid, $aid);
                if ($aj && $aj['excluido_em'] === null && $aj['modo'] === 'excluir') continue;
                $mud['excecoes']++;
                if (!$this->seco) $kits->definirAjuste(['product_id' => $pid, 'atributo_id' => $aid, 'modo' => 'excluir', 'motivo' => 'T-4: estrutura de totem sem LED', 'versao_vinculos' => $kits->versaoVinculosAtual($pid)]);
            }
        }
        // sugestões (lote desta execução; D10: nunca onde já há valor; idempotente pela chave)
        $tem = []; foreach ($this->q("SELECT product_id, atributo_id FROM {$this->s}eq_valor WHERE excluido_em IS NULL") as $v) $tem[(int) $v['product_id'] . ':' . (int) $v['atributo_id']] = true;
        $sug = function (string $fonte, int $pid, int $aid, ?string $val, ?int $opc, ?int $u, string $conf, string $evid, string $tipo) use (&$mud, $tem, $lote) {
            if (!$aid || isset($tem["$pid:$aid"])) return;
            $chave = "$fonte|$pid|$aid";
            if ($this->q("SELECT 1 FROM {$this->s}eq_sugestao WHERE chave = ?", [$chave])) { $mud['ja_existiam']++; return; }
            $mud['sugestoes'][$tipo]++;
            $this->x("INSERT INTO {$this->s}eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, opcao_id, unidade_id, confianca, evidencia, lote_id) VALUES (?, ?, ?, ?, 'valor', ?, ?, ?, ?, ?, ?)",
                [$chave, $pid, $aid, $fonte, $val, $opc, $u, $conf, mb_substr($evid, 0, 500), $lote ?: null]);
        };
        foreach ($ativos as $pid => $p) {
            $l = self::lerNomeC8((string) $p['name']);
            if (isset($l['faces']) && in_array($p['subcategory'], ['TOTEM', 'EASEL'], true) && $faces) $sug('nome_produto', $pid, $faces, $l['faces'], null, null, 'alta', "Do nome: \"{$p['name']}\" (T-6)", 'faces');
            if (isset($l['diametro_cm']) && $p['subcategory'] === 'SPHERE') $sug('nome_produto', $pid, $cod['diametro_541'] ?? 0, $l['diametro_cm'], null, $uni['cm'] ?? null, 'alta', "Do nome: \"{$p['name']}\" (T-7: metros → cm)", 'diametro');
        }
        $op = function (int $aid, string $rot): ?int { $r = $this->q("SELECT id FROM {$this->s}eq_opcao WHERE atributo_id = ? AND rotulo = ? AND ativo = 1", [$aid, $rot])[0]['id'] ?? null; return $r === null ? null : (int) $r; };
        $specs = $this->q("SELECT product_id, attrs_json FROM {$this->cs}product_specs WHERE kind = 'panel_mounted' AND deleted_at IS NULL");
        foreach ($specs as $sp) {
            $pid = (int) $sp['product_id']; if (!isset($ativos[$pid])) continue;
            $j = json_decode((string) $sp['attrs_json'], true) ?: [];
            if (isset($j['weight_kg']) && is_numeric($j['weight_kg'])) { $w = rtrim(rtrim((string) $j['weight_kg'], '0'), '.'); $sug('precifica', $pid, $cod['peso_399'] ?? 0, $w, null, $uni['kg'] ?? null, 'alta', "Precifica (panel_mounted.weight_kg = {$j['weight_kg']})", 'precifica'); }
            foreach (self::C8_PRECIFICA as $campo => [$c, $map]) {
                $v = $j[$campo] ?? null; if (!is_string($v) || !isset($map[$v]) || !isset($cod[$c])) continue;
                $o = $op($cod[$c], $map[$v]); if ($o === null && !$this->seco) continue;
                $sug('precifica', $pid, $cod[$c], $map[$v], $o, null, 'alta', "Precifica (panel_mounted.$campo = $v)", 'precifica');
            }
        }
        $this->fecharLote($lote, $mud);
        return $mud;
    }

    // ---- C9 · unidade efetiva nos valores numéricos antigos sem unidade (DSHOW-048, decisão do Jhony 18/11) ---------------------------
    /**
     * Grava em cada valor numérico VIVO e "informado" com unidade_id NULO a unidade EFETIVA de agora (ajuste do produto → item do kit da
     * 1ª ocorrência → padrão do atributo; mesma regra do Dash e do app). O que o app mostra NÃO muda (tripwire: foto com diferença 0).
     * Não sobe a versão (o significado exibido é o mesmo; a reversão por lote da C5 continua valendo); UPDATE guardado por versão e por
     * unidade_id IS NULL (edição concorrente ganha). Auditoria por linha com o lote; reversão: --reverter --lote <id>.
     */
    public function c9(): array
    {
        $repo = new AtributosRepoPdo($this->pdo, $this->schema);
        $lote = $this->lote('C9', ['regra' => 'unidade efetiva = ajuste do produto → item do kit (1ª ocorrência) → padrão do atributo']);
        $m = $repo->retratoModelo(null);
        $cat = []; foreach ($this->q("SELECT id, category, subcategory, active FROM {$this->cs}product_catalog WHERE deleted = 0") as $p) $cat[(int) $p['id']] = ['id' => (int) $p['id'], 'categoria' => $p['category'], 'subcategoria' => $p['subcategory'], 'ativo' => (bool) $p['active']];
        $rows = $this->q("SELECT v.id, v.product_id, v.atributo_id, v.versao FROM {$this->s}eq_valor v JOIN {$this->s}eq_atributo a ON a.id = v.atributo_id
            WHERE v.excluido_em IS NULL AND v.estado = 'informado' AND v.unidade_id IS NULL AND v.opcao_chave = 0 AND a.tipo IN ('numero', 'inteiro')");
        $n = ['candidatos' => count($rows), 'gravados' => 0, 'sem_unidade_definida' => 0, 'concorrentes' => 0, 'por_unidade' => []];
        $fichas = [];
        foreach ($rows as $r) {
            $pid = (int) $r['product_id']; $aid = (int) $r['atributo_id'];
            $u = null;
            if (isset($cat[$pid])) { $fichas[$pid] ??= Aplicabilidade::ficha($m, $cat[$pid]); if (isset($fichas[$pid][$aid])) $u = Aplicabilidade::unidadeEfetiva($fichas[$pid][$aid], null); }
            $u ??= isset($m->atributos[$aid]['unidade_id']) && $m->atributos[$aid]['unidade_id'] !== null ? (int) $m->atributos[$aid]['unidade_id'] : null;
            if ($u === null) { $n['sem_unidade_definida']++; continue; }
            $n['por_unidade'][$u] = ($n['por_unidade'][$u] ?? 0) + 1;
            if ($this->seco) { $n['gravados']++; continue; }
            if ($this->x("UPDATE {$this->s}eq_valor SET unidade_id = ? WHERE id = ? AND versao = ? AND unidade_id IS NULL AND excluido_em IS NULL", [$u, (int) $r['id'], (int) $r['versao']]) === 1) {
                $n['gravados']++;
                $repo->auditar('carga:C9', 'carimbar_unidade', 'valor', "$pid:$aid:0", ['unidade_id' => null], ['unidade_id' => $u, 'valor_id' => (int) $r['id'], 'versao' => (int) $r['versao'], 'lote' => $lote], 'DSHOW-048: unidade efetiva gravada no valor (exibição inalterada)');
            } else $n['concorrentes']++;
        }
        $this->fecharLote($lote, $n);
        return $n;
    }

    // ---- C7 --------------------------------------------------------------------------------------------------------------------------
    /** Prova de cobertura (só leitura): das atribuições do legado (item × atributo) dos produtos atuais, quantas a regra da §9 reproduz. */
    public function c7(): array
    {
        $repo = new AtributosRepoPdo($this->pdo, $this->schema);
        $m = $repo->retratoModelo(null);
        $cat = []; foreach ($this->q("SELECT id, category, subcategory, active FROM {$this->cs}product_catalog WHERE deleted = 0") as $p) $cat[(int) $p['id']] = ['id' => (int) $p['id'], 'categoria' => $p['category'], 'subcategoria' => $p['subcategory'], 'ativo' => (int) $p['active']];
        $vin = []; foreach ($this->q("SELECT chave_antiga, product_id FROM {$this->s}eq_legado_vinculo WHERE estado = 'inequivoca' AND product_id > 0") as $r) $vin[(int) $r['chave_antiga']] = (int) $r['product_id'];
        $leg = $this->porLegado();
        $tot = ['atribuicoes' => 0, 'reproduzidas' => 0, 'excecoes' => 0, 'ativos' => ['atribuicoes' => 0, 'reproduzidas' => 0]];
        $exc = [];
        foreach ($this->q("SELECT chave FROM {$this->s}eq_legado_bruto WHERE tabela = 'mm_atributos_x_itens'") as $r) {
            if (!preg_match('/^P(\d+)A(\d+)$/', $r['chave'], $mm)) continue;
            $pid = $vin[(int) $mm[1]] ?? null; if ($pid === null || !isset($cat[$pid])) continue;
            $aid = $leg[(int) $mm[2]] ?? null;
            static $cache = [];
            $cache[$pid] ??= Aplicabilidade::ficha($m, $cat[$pid]);
            $tot['atribuicoes']++; if ($cat[$pid]['ativo']) $tot['ativos']['atribuicoes']++;
            if ($aid !== null && isset($cache[$pid][$aid])) { $tot['reproduzidas']++; if ($cat[$pid]['ativo']) $tot['ativos']['reproduzidas']++; continue; }
            $tot['excecoes']++;
            $a = $aid ? $this->q("SELECT rotulo, ativo FROM {$this->s}eq_atributo WHERE id = ?", [$aid])[0] : null;
            $motivo = $a === null ? 'atributo legado sem par' : ((int) $a['ativo'] !== 1 ? 'atributo inativo: ' . $a['rotulo'] : 'fora dos kits da subcategoria ' . ($cat[$pid]['subcategoria'] ?? '—'));
            $exc[$motivo] = ($exc[$motivo] ?? 0) + 1;
        }
        arsort($exc);
        $tot['cobertura_pct'] = $tot['atribuicoes'] ? round(100 * $tot['reproduzidas'] / $tot['atribuicoes'], 2) : null;
        return $tot + ['excecoes_por_motivo' => $exc];
    }

    /** Reversão por exclusão lógica: valores do lote (versão 1, origem importado) e sugestões pendentes do lote; definições ficam na auditoria. */
    /** $lote = id de UM lote da carga (o do relatório da execução), 'ultimo', ou 'todos' (explícito). Sem $lote: recusa. */
    public function reverter(string $c, ?string $lote = null): array
    {
        $origem = self::LOTES[$c] ?? throw new RuntimeException("carga desconhecida: $c");
        if ($lote === null || $lote === '') throw new RuntimeException('informe --lote <id> (o da execução a desfazer), --lote ultimo ou --lote todos');
        $lotes = match (true) {
            $lote === 'todos' => $this->q("SELECT id FROM {$this->s}eq_importacao_lote WHERE origem = ? AND estado <> 'descartado'", [$origem]),
            $lote === 'ultimo' => $this->q("SELECT id FROM {$this->s}eq_importacao_lote WHERE origem = ? AND estado <> 'descartado' ORDER BY id DESC LIMIT 1", [$origem]),
            ctype_digit($lote) => $this->q("SELECT id FROM {$this->s}eq_importacao_lote WHERE origem = ? AND id = ? AND estado <> 'descartado'", [$origem, (int) $lote]),
            default => throw new RuntimeException('--lote inválido'),
        };
        if (!$lotes) throw new RuntimeException("nenhum lote '$lote' ativo da carga $c");
        $v = 0; $s = 0;
        foreach ($lotes as $l) {
            // Só desfaz o que a carga gravou e ninguém tocou depois (versao = 1); valor editado à mão fica (D10).
            $v += $this->x("UPDATE {$this->s}eq_valor SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1 WHERE lote_id = ? AND origem = 'importado' AND versao = 1 AND excluido_em IS NULL", [$l['id']]);
            $s += $this->x("UPDATE {$this->s}eq_sugestao SET estado = 'recusada', motivo = 'reversão da carga', versao = versao + 1 WHERE lote_id = ? AND estado = 'pendente'", [$l['id']]);
            if ($c === 'C9') foreach ($this->q("SELECT entidade_id, JSON_EXTRACT(depois, '$.valor_id') AS vid, JSON_EXTRACT(depois, '$.unidade_id') AS u, JSON_EXTRACT(depois, '$.versao') AS ver
                    FROM {$this->s}eq_auditoria WHERE acao = 'carimbar_unidade' AND usuario = 'carga:C9' AND CAST(JSON_EXTRACT(depois, '$.lote') AS UNSIGNED) = ?", [(int) $l['id']]) as $a) {
                // só onde ninguém mexeu depois: mesma unidade gravada pela C9 e mesma versão
                $desc = ($desc ?? 0) + $this->x("UPDATE {$this->s}eq_valor SET unidade_id = NULL WHERE id = ? AND unidade_id = ? AND versao = ? AND excluido_em IS NULL", [(int) $a['vid'], (int) $a['u'], (int) $a['ver']]);
            }
            $this->x("UPDATE {$this->s}eq_importacao_lote SET estado = 'descartado' WHERE id = ?", [$l['id']]);
        }
        return ['lotes' => array_map(static fn($l) => (int) $l['id'], $lotes), 'valores_excluidos' => $v, 'sugestoes_encerradas' => $s] + (isset($desc) ? ['unidades_desfeitas' => $desc] : []);
    }
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $o = getopt('', ['carga:', 'schema:', 'credenciais:', 'dry-run', 'reverter', 'fonte:', 'relatorio:', 'modo-producao', 'catalogo:', 'lote:']);
    $log = static function (string $m): void { fwrite(STDOUT, '[' . date('H:i:s') . "] $m\n"); };
    try {
        $schema = (string) ($o['schema'] ?? '');
        Migrador::validarSchema($schema, isset($o['modo-producao']), getenv('ATR_MIGRAR_PRODUCAO') ?: null);
        $c = strtoupper((string) ($o['carga'] ?? ''));
        $cg = new Cargas(migrador_conectar((string) ($o['credenciais'] ?? '')), $schema, isset($o['dry-run']), $log, isset($o['catalogo']) && preg_match('/^[A-Za-z0-9_]{1,64}$/', (string) $o['catalogo']) ? (string) $o['catalogo'] : null);
        $r = isset($o['reverter']) ? $cg->reverter($c, isset($o['lote']) ? (string) $o['lote'] : null) : match ($c) { 'C2' => $cg->c2(), 'C3' => $cg->c3(), 'C4' => $cg->c4(), 'C5' => $cg->c5((string) ($o['fonte'] ?? '')), 'C6' => $cg->c6(), 'C7' => $cg->c7(), 'C8' => $cg->c8(), 'C9' => $cg->c9(), default => throw new RuntimeException("carga desconhecida: $c") };
        $j = json_encode(['carga' => $c, 'seco' => isset($o['dry-run']), 'lote' => $cg->loteAtual, 'quando' => date('c'), 'resultado' => $r], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if (!empty($o['relatorio'])) file_put_contents(rtrim((string) $o['relatorio'], '/') . "/$c" . (isset($o['dry-run']) ? '-seco' : '') . (isset($o['reverter']) ? '-reverter' : '') . '.json', $j);
        echo $j, "\nCARGA_OK $c\n";
    } catch (Throwable $e) { fwrite(STDERR, 'CARGA_FALHOU: ' . get_class($e) . ': ' . $e->getMessage() . "\n"); exit(1); }
}
