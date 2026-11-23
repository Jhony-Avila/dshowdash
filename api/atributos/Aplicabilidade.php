<?php
// /api/atributos/Aplicabilidade.php — REGRA DA FICHA (missão §9), num lugar só e sem banco (função pura sobre um retrato do modelo).
// Atributos aplicáveis a um produto =
//   kits ATIVOS cujo escopo vivo cobre a categoria/subcategoria do produto ('' = toda a categoria)
//   + kits ativos marcados aplica_a_todos + kits ativos vinculados direto ao produto (eq_grupo_produto vivo)
//   + inclusões avulsas do produto (eq_produto_atributo modo 'incluir')  − exclusões do produto (modo 'excluir').
// Só atributos ATIVOS. Atributo em vários kits aparece UMA vez: kits na ordem (nome, id) — regra D4 existente —, a 1ª ocorrência
// define kit e posição; obrigatório, visível e destaque = OU entre as ocorrências (extensão documentada da D4); importância = a do 1º
// item que a tiver, senão a importância padrão do atributo (A3). Avulsos entram depois dos kits (posição, id).
// Unidade efetiva (D3) = a do valor → a do produto (eq_produto_atributo, qualquer modo vivo) → a do kit (1ª ocorrência com unidade)
//   → a padrão do atributo.
// Completude (A3): essencial = obrigatórios + importantes; completo = + básicos. "informado" e "nao_se_aplica" contam como preenchidos;
// "desconhecido" não conta.
declare(strict_types=1);

final class RetratoModelo
{
    /**
     * @param array<int,array> $grupos   id => [id, nome, ativo, aplica_a_todos, ordem, descricao]
     * @param array<int,array> $escopos  lista [grupo_id, categoria, subcategoria]
     * @param array<int,array> $itens    grupo_id => lista [atributo_id, posicao, obrigatorio, visivel, destaque, importancia, unidade_id, legado_id]
     * @param array<int,array> $diretos  product_id => [grupo_id, …]
     * @param array<int,array> $ajustes  product_id => atributo_id => [modo, unidade_id, posicao, motivo]
     * @param array<int,array> $atributos id => [id, codigo, rotulo, tipo, ativo, unidade_id, importancia_padrao, …]
     */
    public function __construct(
        public readonly array $grupos, public readonly array $escopos, public readonly array $itens,
        public readonly array $diretos, public readonly array $ajustes, public readonly array $atributos,
    ) {}
}

final class Aplicabilidade
{
    public const IMPORTANCIAS = ['obrigatorio', 'importante', 'basico', 'complementar', 'opcional', 'sem_importancia'];
    /** Texto do legado (legado_meta.importancia_campos) → importância (A3). */
    public const IMPORTANCIA_DO_LEGADO = ['Campos Obrigatórios' => 'obrigatorio', 'Campos Importantes' => 'importante', 'Campos Básicos' => 'basico',
        'Campos Complementares' => 'complementar', 'Campos Opcionais' => 'opcional', 'Campos Sem Importância' => 'sem_importancia'];
    public const ESSENCIAIS = ['obrigatorio', 'importante'];
    public const COMPLETOS = ['obrigatorio', 'importante', 'basico'];
    public const AVULSO = 0;   // "kit" virtual dos atributos avulsos do produto

    /** Kits que valem para o produto, na ordem (nome, id), com o motivo de cada um. @return array<int,array{grupo:array,motivos:array}> */
    public static function kits(RetratoModelo $m, array $produto): array
    {
        $cat = (string) $produto['categoria']; $sub = (string) ($produto['subcategoria'] ?? ''); $pid = (int) $produto['id'];
        $out = [];
        foreach ($m->escopos as $e) {
            $g = $m->grupos[(int) $e['grupo_id']] ?? null;
            if (!$g || !(int) $g['ativo'] || $e['categoria'] !== $cat || ($e['subcategoria'] !== '' && $e['subcategoria'] !== $sub)) continue;
            $out[(int) $g['id']]['grupo'] = $g;
            $out[(int) $g['id']]['motivos'][] = ['tipo' => 'escopo', 'categoria' => $e['categoria'], 'subcategoria' => $e['subcategoria']];
        }
        foreach ($m->grupos as $g) if ((int) $g['ativo'] && (int) ($g['aplica_a_todos'] ?? 0)) { $out[(int) $g['id']]['grupo'] = $g; $out[(int) $g['id']]['motivos'][] = ['tipo' => 'todos']; }
        foreach ($m->diretos[$pid] ?? [] as $gid) {
            $g = $m->grupos[(int) $gid] ?? null;
            if ($g && (int) $g['ativo']) { $out[(int) $gid]['grupo'] = $g; $out[(int) $gid]['motivos'][] = ['tipo' => 'direto']; }
        }
        // DSHOW-035 #1: com 'ordem_nome' (posição dada pelo MySQL, mesma colação do app) ela manda; sem ela (repositório em memória), nome e id
        uasort($out, static fn($a, $b) => isset($a['grupo']['ordem_nome'], $b['grupo']['ordem_nome'])
            ? (int) $a['grupo']['ordem_nome'] <=> (int) $b['grupo']['ordem_nome']
            : [(string) $a['grupo']['nome'], (int) $a['grupo']['id']] <=> [(string) $b['grupo']['nome'], (int) $b['grupo']['id']]);
        return $out;
    }

    /**
     * Ficha aplicável. @return array<int,array> atributo_id => [def, grupo_id (0 = avulso), grupo_nome, posicao, obrigatorio, visivel, destaque,
     *   importancia, unidade_kit_id, unidade_produto_id, origens:[{tipo, grupo_id?, grupo_nome?, motivos?}], excluido:false]
     * e as exclusões do produto em $excluidos (atributo_id => [motivo, grupo_ids]).
     */
    public static function ficha(RetratoModelo $m, array $produto, ?array &$excluidos = null): array
    {
        $pid = (int) $produto['id'];
        $aj = $m->ajustes[$pid] ?? [];
        $excluidos = [];
        $out = [];
        foreach (self::kits($m, $produto) as $gid => $k) {
            $itens = $m->itens[$gid] ?? [];
            usort($itens, static fn($a, $b) => [(int) $a['posicao'], (int) $a['atributo_id']] <=> [(int) $b['posicao'], (int) $b['atributo_id']]);
            foreach ($itens as $it) {
                $aid = (int) $it['atributo_id'];
                $def = $m->atributos[$aid] ?? null;
                if (!$def || !(int) $def['ativo']) continue;
                if (($aj[$aid]['modo'] ?? null) === 'excluir') { $excluidos[$aid] ??= ['motivo' => $aj[$aid]['motivo'] ?? null, 'grupos' => []]; $excluidos[$aid]['grupos'][] = $gid; continue; }
                $origem = ['tipo' => 'kit', 'grupo_id' => $gid, 'grupo_nome' => $k['grupo']['nome'], 'motivos' => $k['motivos']];
                if (isset($out[$aid])) {
                    $o = &$out[$aid];
                    $o['obrigatorio'] = $o['obrigatorio'] || (int) $it['obrigatorio'];
                    $o['visivel'] = $o['visivel'] || (int) $it['visivel'];
                    $o['destaque'] = $o['destaque'] || (int) ($it['destaque'] ?? 0);
                    $o['importancia'] ??= $it['importancia'] ?? null;
                    $o['unidade_kit_id'] ??= isset($it['unidade_id']) && $it['unidade_id'] !== null ? (int) $it['unidade_id'] : null;
                    $o['origens'][] = $origem;
                    unset($o);
                    continue;
                }
                $out[$aid] = ['def' => $def, 'grupo_id' => $gid, 'grupo_nome' => $k['grupo']['nome'], 'posicao' => (int) $it['posicao'],
                    'obrigatorio' => (bool) (int) $it['obrigatorio'], 'visivel' => (bool) (int) $it['visivel'], 'destaque' => (bool) (int) ($it['destaque'] ?? 0),
                    'importancia' => $it['importancia'] ?? null, 'unidade_kit_id' => isset($it['unidade_id']) && $it['unidade_id'] !== null ? (int) $it['unidade_id'] : null,
                    'unidade_produto_id' => null, 'origens' => [$origem]];
            }
        }
        // avulsos (modo incluir), depois dos kits
        $avulsos = array_filter($aj, static fn($a) => ($a['modo'] ?? '') === 'incluir');
        uksort($avulsos, static fn($a, $b) => [(int) ($avulsos[$a]['posicao'] ?? 9999), $a] <=> [(int) ($avulsos[$b]['posicao'] ?? 9999), $b]);
        foreach ($avulsos as $aid => $a) {
            $def = $m->atributos[(int) $aid] ?? null;
            if (!$def || !(int) $def['ativo']) continue;
            if (isset($out[$aid])) { $out[$aid]['origens'][] = ['tipo' => 'avulso']; continue; }
            $out[(int) $aid] = ['def' => $def, 'grupo_id' => self::AVULSO, 'grupo_nome' => 'Avulsos deste produto', 'posicao' => (int) ($a['posicao'] ?? 9999),
                'obrigatorio' => false, 'visivel' => true, 'destaque' => false, 'importancia' => null, 'unidade_kit_id' => null, 'unidade_produto_id' => null,
                'origens' => [['tipo' => 'avulso']]];
        }
        foreach ($out as $aid => &$o) {
            $o['importancia'] ??= $o['def']['importancia_padrao'] ?? null;
            $u = $aj[$aid]['unidade_id'] ?? null;
            $o['unidade_produto_id'] = $u === null ? null : (int) $u;
        }
        unset($o);
        return $out;
    }

    /** Unidade efetiva (D3): valor → produto → kit → padrão do atributo. */
    public static function unidadeEfetiva(array $item, ?int $unidadeDoValor): ?int
    {
        foreach ([$unidadeDoValor, $item['unidade_produto_id'] ?? null, $item['unidade_kit_id'] ?? null, $item['def']['unidade_id'] ?? null] as $u) {
            if ($u !== null && $u !== '' && (int) $u > 0) return (int) $u;
        }
        return null;
    }

    /**
     * Unidade que passa a valer se o AJUSTE do produto (eq_produto_atributo.unidade_id) deixar de existir — ex.: ao remover o vínculo
     * avulso (KitsService::definirAjuste, modo null → AtributosRepo::definirAjusteProduto marca excluido_em na linha inteira, com a
     * unidade). Mesma cascata de unidadeEfetiva SEM o degrau do produto e SEM o do valor: kit (1ª ocorrência com unidade) → padrão do
     * atributo. Atributo só avulso (sem kit) sai da ficha; o valor salvo vai para "fora da ficha", onde a unidade é a do valor → a padrão
     * do atributo (ProdutosLeitura::fichaProduto, item sem aplicabilidade) — o mesmo resultado, porque unidade_kit_id é null.
     * A unidade própria do VALOR (eq_valor.unidade_id), se houver, continua vencendo: não muda com a remoção.
     */
    public static function unidadeSemAjuste(array $item): ?int
    {
        return self::unidadeEfetiva(['unidade_produto_id' => null] + $item, null);
    }

    /** "informado" e "não se aplica" contam; "desconhecido" não (§9). */
    public static function contaComoPreenchido(?string $estado): bool { return $estado === 'informado' || $estado === 'nao_se_aplica'; }

    /**
     * Completude (A3). $estados = atributo_id => estado do valor vivo (ausente = sem valor).
     * @return array{essencial:array{feitos:int,total:int}, completo:array{feitos:int,total:int}, geral:array{feitos:int,total:int}, obrigatorios_vazios:int[]}
     */
    public static function completude(array $ficha, array $estados): array
    {
        $r = ['essencial' => ['feitos' => 0, 'total' => 0], 'completo' => ['feitos' => 0, 'total' => 0], 'geral' => ['feitos' => 0, 'total' => 0], 'obrigatorios_vazios' => []];
        foreach ($ficha as $aid => $it) {
            $feito = self::contaComoPreenchido($estados[$aid] ?? null);
            $imp = $it['obrigatorio'] ? 'obrigatorio' : ($it['importancia'] ?? null);
            $r['geral']['total']++; if ($feito) $r['geral']['feitos']++;
            if (in_array($imp, self::ESSENCIAIS, true)) { $r['essencial']['total']++; if ($feito) $r['essencial']['feitos']++; }
            if (in_array($imp, self::COMPLETOS, true)) { $r['completo']['total']++; if ($feito) $r['completo']['feitos']++; }
            if ($it['obrigatorio'] && !$feito) $r['obrigatorios_vazios'][] = $aid;
        }
        return $r;
    }
}
