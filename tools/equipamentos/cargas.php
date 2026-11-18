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
        'C5' => 'legado-2025-07-31', 'C6' => 'carga C6 · sugestões pelo nome (missão 18/11)'];
    /** Kits do legado → subcategorias atuais (D2; escopo pedido na missão §12-C3). */
    public const ESCOPOS = ['controladoras' => ['PROCESSOR', 'RECEIVING_CARD', 'SENDING_CARD', 'CONTROLLER'], 'cabos' => ['CABLE'], 'fontes' => ['POWER_SUPPLY']];
    public const NOMES = ['controladoras' => 'Controladoras', 'cabos' => 'Cabos', 'fontes' => 'Fontes'];
    public const BASE_NOME = 'Base (todos os produtos)';
    public const INTEGRACOES_NOME = 'Integrações';
    /** A9: campos de integração do dicionário de 2025 (Atributos_Itens.Atributos), fora do mm_atributos. */
    public const INTEGRACOES = [12 => 'Id Bling', 13 => 'Código Bling', 14 => 'Id Mercado Livre', 577 => 'Cod_Pai_Bling'];

    private string $s; private array $rel = [];
    public function __construct(private readonly PDO $pdo, private readonly string $schema, private readonly bool $seco, private $log)
    {
        $this->s = "`$schema`.";
    }
    private function q(string $sql, array $p = []): array { $st = $this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); }
    private function x(string $sql, array $p = []): int { if ($this->seco) return 0; $st = $this->pdo->prepare($sql); $st->execute($p); return $st->rowCount(); }
    private function n(string $t, string $w = '1', array $p = []): int { return (int) $this->q("SELECT COUNT(*) AS n FROM {$this->s}`$t` WHERE $w", $p)[0]['n']; }
    private function porLegado(): array { $o = []; foreach ($this->q("SELECT id, legado_id FROM {$this->s}eq_atributo WHERE legado_ns = 'Led_Lovers_PROD.mm_atributos'") as $r) $o[(int) $r['legado_id']] = (int) $r['id']; return $o; }
    private function kitPorNome(string $nome): ?array { return $this->q("SELECT * FROM {$this->s}eq_grupo WHERE nome = ?", [$nome])[0] ?? null; }

    private function servicos(string $usuario): array
    {
        $repo = new AtributosRepoPdo($this->pdo, $this->schema);
        $cat = new CatalogoPdo($this->pdo, $this->schema);   // validação: retrato C1 no mesmo schema; produção: APP_DSHOW (P3)
        return [$repo, new KitsService($repo, 80, $usuario, $cat), new AtributosService($repo, 80, $usuario, $cat)];
    }

    /** Lote (eq_importacao_lote) da carga; identidade = sha256 da carga + regras + versão do script (P2-07). */
    private function lote(string $c, array $regras): int
    {
        $origem = self::LOTES[$c];
        $sha = hash('sha256', $c . '|' . json_encode($regras) . '|' . hash_file('sha256', __FILE__));
        $r = $this->q("SELECT id FROM {$this->s}eq_importacao_lote WHERE origem = ? ORDER BY id DESC LIMIT 1", [$origem])[0] ?? null;
        if ($r) return (int) $r['id'];
        if ($this->seco) return 0;
        $this->x("INSERT INTO {$this->s}eq_importacao_lote (origem, arquivo_sha256, estado, relatorio, criado_por) VALUES (?, ?, 'ensaio', ?, ?)", [$origem, $sha, json_encode(['regras' => $regras]), "carga:$c"]);
        return (int) $this->pdo->lastInsertId();
    }
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
            if (!$this->seco) (new AtributosService($repo, 80, 'carga:C2', new CatalogoPdo($this->pdo, $this->schema)))->definirAtivo($aid, true, (int) $a['versao'], 'D1: as 8 da base valem para todos os itens (carga C2)');
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
                $cats = array_column($this->q("SELECT DISTINCT category FROM {$this->s}product_catalog WHERE deleted = 0 ORDER BY category"), 'category');
                $kits->definirEscopos(['id' => $k['id'], 'versao' => $k['versao'], 'escopos' => array_map(static fn($c) => ['categoria' => $c, 'subcategoria' => ''], $cats)]);
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
        $lote = $this->lote('C4', ['D4' => 'Potência em W', 'D6' => ['Novo', 'Não especificado'], 'fatores' => 'comprimento/massa', 'A9' => self::INTEGRACOES]);
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
            } else $d['valor_texto'] = mb_substr(trim($valor), 0, 500);
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
    public function c6(): array
    {
        $lote = $this->lote('C6', ['subcategorias' => self::C6_SUBCATEGORIAS, 'regras' => 'NNNmm x NNNmm; P.x; NNNN Hz; Indoor/Outdoor; Fontes: NNNW → Potência']);
        $cod = []; foreach ($this->q("SELECT id, codigo FROM {$this->s}eq_atributo") as $a) $cod[$a['codigo']] = (int) $a['id'];
        $uni = []; foreach ($this->q("SELECT id, simbolo FROM {$this->s}eq_unidade") as $u) $uni[$u['simbolo']] = (int) $u['id'];
        $opLed = []; foreach ($this->q("SELECT id, rotulo FROM {$this->s}eq_opcao WHERE atributo_id = ? AND ativo = 1", [$cod['tipo_do_led_87']]) as $o) $opLed[strtolower($o['rotulo'])] = (int) $o['id'];
        $tem = []; foreach ($this->q("SELECT product_id, atributo_id FROM {$this->s}eq_valor WHERE excluido_em IS NULL") as $v) $tem[(int) $v['product_id'] . ':' . (int) $v['atributo_id']] = true;
        $n = ['produtos' => 0, 'sugestoes' => 0, 'ja_existiam' => 0, 'bloqueados' => 0, 'por_atributo' => []];
        $in = implode(',', array_fill(0, count(self::C6_SUBCATEGORIAS), '?'));
        foreach ($this->q("SELECT id, name, subcategory FROM {$this->s}product_catalog WHERE deleted = 0 AND active = 1 AND category = 'LED_PANEL'") as $p) {
            if (!in_array($p['subcategory'], self::C6_SUBCATEGORIAS, true)) { $n['bloqueados']++; continue; }
            $pid = (int) $p['id']; $nome = (string) $p['name']; $props = [];
            if (in_array($p['subcategory'], self::C6_SO_POTENCIA, true)) {
                if (preg_match('/\b(\d{2,4})\s*W\b/iu', $nome, $m) && isset($uni['W'])) $props['potencia_549'] = [$m[1], $uni['W'], null];
            } else {
            if (preg_match('/(\d{2,5})\s*mm\s*[xX×]\s*(\d{2,5})\s*mm/u', $nome, $m)) { $props['largura_409'] = [$m[1], $uni['mm'], null]; $props['altura_122'] = [$m[2], $uni['mm'], null]; }
            if (preg_match('/\bP\s*\.?\s*(\d{1,2}(?:[.,]\d{1,3})?)\b/u', $nome, $m)) $props['pitch_138'] = [str_replace(',', '.', $m[1]), $uni['mm'], null];
            if (preg_match('/(\d{3,4})\s*Hz/u', $nome, $m) && isset($cod['taxa_de_atualizacao_refresh_rate_93'])) $props['taxa_de_atualizacao_refresh_rate_93'] = [$m[1], $uni['Hz'], null];
            if (preg_match('/\b(Indoor|Outdoor)\b/iu', $nome, $m) && isset($opLed[strtolower($m[1])])) $props['tipo_do_led_87'] = [null, null, $opLed[strtolower($m[1])]];
            }
            if ($props) $n['produtos']++;
            foreach ($props as $c => [$val, $u, $opc]) {
                $aid = $cod[$c] ?? null; if (!$aid || isset($tem["$pid:$aid"])) continue;
                $chave = "nome_produto|$pid|$aid";
                if ($this->q("SELECT 1 FROM {$this->s}eq_sugestao WHERE chave = ?", [$chave])) { $n['ja_existiam']++; continue; }
                $n['sugestoes']++; $n['por_atributo'][$c] = ($n['por_atributo'][$c] ?? 0) + 1;
                $this->x("INSERT INTO {$this->s}eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, opcao_id, unidade_id, confianca, evidencia, lote_id) VALUES (?, ?, ?, 'nome_produto', 'valor', ?, ?, ?, 'media', ?, ?)",
                    [$chave, $pid, $aid, $val ?? ($opc !== null ? array_search($opc, $opLed, true) : null), $opc, $u, mb_substr("Do nome: \"$nome\"", 0, 500), $lote ?: null]);
            }
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
        $cat = []; foreach ($this->q("SELECT id, category, subcategory, active FROM {$this->s}product_catalog WHERE deleted = 0") as $p) $cat[(int) $p['id']] = ['id' => (int) $p['id'], 'categoria' => $p['category'], 'subcategoria' => $p['subcategory'], 'ativo' => (int) $p['active']];
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
    public function reverter(string $c): array
    {
        $l = $this->q("SELECT id FROM {$this->s}eq_importacao_lote WHERE origem = ?", [self::LOTES[$c] ?? ''])[0] ?? null;
        if (!$l) return ['revertido' => 0];
        $v = $this->x("UPDATE {$this->s}eq_valor SET excluido_em = CURRENT_TIMESTAMP(3), versao = versao + 1 WHERE lote_id = ? AND origem = 'importado' AND versao = 1 AND excluido_em IS NULL", [$l['id']]);
        $s = $this->x("UPDATE {$this->s}eq_sugestao SET estado = 'recusada', motivo = 'reversão da carga', versao = versao + 1 WHERE lote_id = ? AND estado = 'pendente'", [$l['id']]);
        $this->x("UPDATE {$this->s}eq_importacao_lote SET estado = 'descartado' WHERE id = ?", [$l['id']]);
        return ['valores_excluidos' => $v, 'sugestoes_encerradas' => $s];
    }
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $o = getopt('', ['carga:', 'schema:', 'credenciais:', 'dry-run', 'reverter', 'fonte:', 'relatorio:', 'modo-producao']);
    $log = static function (string $m): void { fwrite(STDOUT, '[' . date('H:i:s') . "] $m\n"); };
    try {
        $schema = (string) ($o['schema'] ?? '');
        Migrador::validarSchema($schema, isset($o['modo-producao']), getenv('ATR_MIGRAR_PRODUCAO') ?: null);
        $c = strtoupper((string) ($o['carga'] ?? ''));
        $cg = new Cargas(migrador_conectar((string) ($o['credenciais'] ?? '')), $schema, isset($o['dry-run']), $log);
        $r = isset($o['reverter']) ? $cg->reverter($c) : match ($c) { 'C2' => $cg->c2(), 'C3' => $cg->c3(), 'C4' => $cg->c4(), 'C5' => $cg->c5((string) ($o['fonte'] ?? '')), 'C6' => $cg->c6(), 'C7' => $cg->c7(), default => throw new RuntimeException("carga desconhecida: $c") };
        $j = json_encode(['carga' => $c, 'seco' => isset($o['dry-run']), 'quando' => date('c'), 'resultado' => $r], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if (!empty($o['relatorio'])) file_put_contents(rtrim((string) $o['relatorio'], '/') . "/$c" . (isset($o['dry-run']) ? '-seco' : '') . (isset($o['reverter']) ? '-reverter' : '') . '.json', $j);
        echo $j, "\nCARGA_OK $c\n";
    } catch (Throwable $e) { fwrite(STDERR, 'CARGA_FALHOU: ' . get_class($e) . ': ' . $e->getMessage() . "\n"); exit(1); }
}
