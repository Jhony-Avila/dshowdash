<?php
// /api/atributos/ProdutosLeitura.php — LEITURA do módulo (missão §10–§11): visão geral, produtos, ficha (regra §9), histórico, kits,
// dicionário, unidades, conferência e miniaturas. SÓ SELECT. Regras de aplicabilidade/completude: Aplicabilidade.php (um lugar só).
declare(strict_types=1);

require_once __DIR__ . '/AtributosService.php';
require_once __DIR__ . '/KitsLegado.php';

interface LeituraVitrine
{
    /** id => [id, nome, categoria, subcategoria, ativo] — catálogo sem os excluídos. */
    public function catalogo(): array;
    /** product_id => [n, capa_id, cor] — fotos elegíveis (publicadas, visíveis, não excluídas, não suprimidas). */
    public function fotosResumo(): array;
    /** Fotos elegíveis do produto, capa primeiro: [id, capa, posicao, cor, largura, altura]. */
    public function fotos(int $productId): array;
    /** A mídia é elegível? (para servir a miniatura) */
    public function fotoElegivel(int $mediaId): bool;
    /** product_id => [kinds] da ficha do Precifica. Sem leitura → []. */
    public function familiasPrecifica(): array;
    /** kind => attrs (ficha do Precifica do produto). Sem leitura → null. */
    public function specs(int $productId): ?array;
    /** product_id => [atributo_id => estado] dos valores vivos. */
    public function estadosValores(): array;
    /** Valores vivos do produto com detalhe (opção, unidade, origem, datas, lote, autor). */
    public function valoresDetalhe(int $productId): array;
    /** item legado => [ids_legado, preenchidos]. */
    public function legadoResumo(): array;
    /** Linhas legadas do item: [id_legado, valor, tp_unit, atualizado_legado]. */
    public function legadoDoItem(int $item): array;
    /** item legado => product_id (vínculos inequívocos). */
    public function vinculos(): array;
    /** TODOS os atributos: id => [...definição, unidade (símbolo), importancia_padrao, grupo_atributos, legado_id]. */
    public function atributos(): array;
    /** atributo_id => [[id, rotulo, posicao, ativo], …] para os ids pedidos. */
    public function opcoes(array $atributoIds): array;
    /** Todas as unidades: id => [id, simbolo, nome, grandeza, fator_base, ativo]. */
    public function unidades(): array;
    /** atributo_id => [unidade_id, …] (A8: permitidas além da grandeza). */
    public function unidadesExtras(): array;
    /** Sugestões pendentes do produto (ou de todos, se null). */
    public function sugestoes(?int $productId, ?string $fonte = null, ?string $tipo = null, int $limite = 500): array;
    /** product_id => n de sugestões pendentes. */
    public function sugestoesPendentesPorProduto(): array;
    /** Auditoria do produto (valores, vínculos, sugestões): entidade_id 'pid:…'. */
    public function historico(int $productId, int $limite): array;
    /** atributo_id => [kits (ativos) em que está, produtos com valor]. */
    public function usoAtributos(): array;
    /** unidade_id => [atributos, valores]. */
    public function usoUnidades(): array;
}

final class ProdutosLeitura
{
    /** Espelho do PRECIFICA_PAR do app (backend/api/src/modules/products/attributes.ts:76). Contrato: códigos estáveis. */
    public const PRECIFICA_PAR = [
        'pitch_138' => ['led_module.pitch'], 'largura_409' => ['led_module.width_mm', 'panel_mounted.width_mm'],
        'altura_122' => ['led_module.height_mm', 'panel_mounted.height_mm'], 'profundidade_397' => ['led_module.depth_mm', 'panel_mounted.depth_mm'],
        'peso_399' => ['panel_mounted.weight_kg'], 'resolucao_de_altura_101' => ['led_module.height_resolution'],
        'resolucao_de_largura_152' => ['led_module.width_resolution'], 'tipo_do_led_87' => ['led_module.usage_type'], 'ip_rating_24' => ['panel_mounted.ip_rating'],
    ];

    private ?array $cacheCat = null; private ?RetratoModelo $cacheModelo = null; private ?array $cacheAtr = null; private ?array $manifesto = null;

    public function __construct(
        private readonly LeituraVitrine $l, private readonly AtributosRepositorio $repo, private readonly int $nivel, private readonly ?string $dirMiniaturas = null,
        private readonly bool $escrita = true,   // flag panel_atributos_escrita: desligada → toda permissão de escrita (pode_*) volta false
    ) {}

    /** pode_* das respostas: nível E escrita ligada (com a flag desligada as rotas de escrita somem com 404; a tela não pode oferecê-las). */
    private function pode(int $min): bool { return $this->escrita && $this->nivel >= $min; }

    private function exigir(): void
    {
        if ($this->nivel < AtributosService::NIVEL_CONSULTA) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
    }
    private function cat(): array { return $this->cacheCat ??= $this->l->catalogo(); }
    private function modelo(): RetratoModelo { return $this->cacheModelo ??= $this->repo->retratoModelo(null); }
    private function atr(): array { return $this->cacheAtr ??= $this->l->atributos(); }

    /** Resumo calculado de cada produto (base de Visão geral, Produtos e Conferência). */
    private function resumos(): array
    {
        $m = $this->modelo(); $estados = $this->l->estadosValores(); $fotos = $this->l->fotosResumo(); $fam = $this->l->familiasPrecifica();
        $leg = $this->l->legadoResumo(); $itemDe = array_flip($this->l->vinculos()); $sug = $this->l->sugestoesPendentesPorProduto();
        $out = [];
        foreach ($this->cat() as $pid => $p) {
            $ficha = Aplicabilidade::ficha($m, $p);
            $kits = Aplicabilidade::kits($m, $p);
            $est = $estados[$pid] ?? [];
            $c = Aplicabilidade::completude($ficha, $est);
            $fora = array_diff_key($est, $ficha);
            $item = $itemDe[$pid] ?? null; $l = $item !== null ? ($leg[$item] ?? null) : null;
            $kitLeg = $l ? KitsLegado::doConjunto($l['ids_legado']) : null;
            $f = $fotos[$pid] ?? null;
            $especificos = array_filter($kits, static fn($k) => !array_filter($k['motivos'], static fn($mt) => $mt['tipo'] === 'todos'));
            $out[$pid] = [
                'id' => $pid, 'nome' => $p['nome'], 'categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'ativo' => $p['ativo'],
                'fotos' => $f ? (int) $f['n'] : 0, 'capa_id' => $f ? (int) $f['capa_id'] : null, 'capa_cor' => $f['cor'] ?? null,
                'precifica' => $fam[$pid] ?? [],
                'kits' => array_map(static fn($k) => ['id' => (int) $k['grupo']['id'], 'nome' => $k['grupo']['nome'], 'motivos' => array_values(array_unique(array_column($k['motivos'], 'tipo')))], array_values($kits)),
                'kits_especificos' => count($especificos),
                'essencial' => $c['essencial'], 'completo' => $c['completo'], 'geral' => $c['geral'], 'obrigatorios_vazios' => count($c['obrigatorios_vazios']),
                'fora_da_ficha' => count($fora), 'sugestoes' => (int) ($sug[$pid] ?? 0),
                'legado' => $l ? ['kit' => $kitLeg, 'kit_nome' => $kitLeg ? KitsLegado::KITS[$kitLeg]['nome'] : null, 'atribuidos' => count($l['ids_legado']), 'com_valor' => (int) $l['preenchidos']] : null,
                '_ficha' => $ficha, '_estados' => $est, '_obrigatorios' => $c['obrigatorios_vazios'],
            ];
        }
        return $out;
    }

    private static function publico(array $r): array { return array_diff_key($r, ['_ficha' => 1, '_estados' => 1, '_obrigatorios' => 1]); }

    public function vitrine(): array
    {
        $this->exigir();
        $res = $this->resumos();
        $facetas = [];
        foreach ($res as $p) {
            $k = $p['categoria'] . '|' . ($p['subcategoria'] ?? '');
            $facetas[$k] ??= ['categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'produtos' => 0, 'ativos' => 0];
            $facetas[$k]['produtos']++; if ($p['ativo']) $facetas[$k]['ativos']++;
        }
        ksort($facetas);
        $kits = [];
        foreach ($this->modelo()->grupos as $g) if ((int) $g['ativo']) $kits[] = ['id' => (int) $g['id'], 'nome' => $g['nome']];
        usort($kits, static fn($a, $b) => strcmp($a['nome'], $b['nome']));
        $legados = []; foreach (KitsLegado::KITS as $c => $k) $legados[] = ['codigo' => $c, 'nome' => $k['nome'], 'tamanho' => count($k['ids'])];
        return ['produtos' => array_values(array_map([self::class, 'publico'], $res)), 'facetas' => array_values($facetas), 'kits' => $kits, 'kits_legado' => $legados,
            'pode_vincular' => $this->pode(AtributosService::NIVEL_ADMIN)];
    }

    public function visaoGeral(): array
    {
        $this->exigir();
        $res = array_filter($this->resumos(), static fn($p) => $p['ativo']);
        $atr = $this->atr();
        $pct = static fn(array $x) => $x['total'] > 0 ? $x['feitos'] / $x['total'] : null;
        $media = static function (array $ps) use ($pct): ?float { $v = array_filter(array_map(static fn($p) => $pct($p['essencial']), $ps), static fn($x) => $x !== null); return $v ? round(100 * array_sum($v) / count($v), 1) : null; };
        $sub = []; $obrVazios = [];
        foreach ($res as $p) {
            $k = $p['categoria'] . '|' . ($p['subcategoria'] ?? '');
            $sub[$k] ??= ['categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'ativos' => 0, 'com_kit' => 0, '_ps' => []];
            $sub[$k]['ativos']++; if ($p['kits_especificos'] > 0) $sub[$k]['com_kit']++; $sub[$k]['_ps'][] = $p;
            foreach ($p['_obrigatorios'] as $aid) $obrVazios[$aid] = ($obrVazios[$aid] ?? 0) + 1;
        }
        foreach ($sub as &$s) { $s['essencial_medio'] = $media($s['_ps']); unset($s['_ps']); }
        unset($s);
        usort($sub, static fn($a, $b) => $b['ativos'] <=> $a['ativos']);
        arsort($obrVazios);
        $top = [];
        foreach (array_slice($obrVazios, 0, 10, true) as $aid => $n) $top[] = ['atributo_id' => $aid, 'rotulo' => $atr[$aid]['rotulo'] ?? "#$aid", 'produtos' => $n];
        $nSug = count($this->l->sugestoes(null, null, null, 100000));
        $fora = array_sum(array_column($res, 'fora_da_ficha'));
        return [
            'cartoes' => [
                'ativos' => count($res),
                'com_kit' => count(array_filter($res, static fn($p) => $p['kits_especificos'] > 0)),
                'essencial_medio' => $media($res),
                'sem_foto' => count(array_filter($res, static fn($p) => $p['fotos'] === 0)),
                'pendencias' => $nSug + $fora, 'sugestoes' => $nSug, 'fora_da_ficha' => $fora,
                'obrigatorios_vazios' => array_sum(array_column($res, 'obrigatorios_vazios')),
                'sem_kit' => count(array_filter($res, static fn($p) => $p['kits_especificos'] === 0)),
            ],
            'cobertura' => array_values($sub),
            'obrigatorios_mais_vazios' => $top,
        ];
    }

    private function unidadesPara(array $item, array $unidades, array $extras): array
    {
        $padrao = Aplicabilidade::unidadeEfetiva($item, null);
        $g = $padrao !== null ? ($unidades[$padrao]['grandeza'] ?? null) : null;
        $ex = array_flip($extras[(int) $item['def']['id']] ?? []);
        $out = [];
        foreach ($unidades as $id => $u) {
            if (!(int) $u['ativo'] && $id !== $padrao) continue;
            if ($id === $padrao || ($g !== null && $g !== '' && $u['grandeza'] === $g) || isset($ex[$id])) $out[] = ['id' => $id, 'simbolo' => $u['simbolo'], 'nome' => $u['nome'], 'padrao' => $id === $padrao, 'fator_base' => $u['fator_base']];
        }
        return $out;
    }

    private function parPrecifica(?string $codigo, ?array $specs): ?array
    {
        if (!$codigo || !$specs) return null;
        foreach (self::PRECIFICA_PAR[$codigo] ?? [] as $ref) {
            [$kind, $campo] = explode('.', $ref, 2);
            if (isset($specs[$kind]) && array_key_exists($campo, $specs[$kind])) return ['chave' => $ref, 'valor' => $specs[$kind][$campo]];
        }
        return null;
    }

    private static function valorPublico(array $vs): array
    {
        $v0 = $vs[0];
        return ['estado' => $v0['estado'], 'texto' => $v0['valor_texto'], 'numero' => $v0['valor_num'] === null ? null : (string) $v0['valor_num'],
            'booleano' => $v0['valor_bool'] === null ? null : (bool) (int) $v0['valor_bool'], 'data' => $v0['valor_data'],
            'opcao_ids' => array_values(array_filter(array_map(static fn($v) => $v['opcao_id'] === null ? null : (int) $v['opcao_id'], $vs))),
            'opcoes' => array_values(array_filter(array_map(static fn($v) => $v['opcao'], $vs))),
            'unidade_id' => $v0['unidade_id'] === null ? null : (int) $v0['unidade_id'], 'origem' => $v0['origem'], 'lote_id' => $v0['lote_id'] === null ? null : (int) $v0['lote_id'],
            'atualizado_em' => $v0['atualizado_em'], 'atualizado_por' => $v0['atualizado_por'], 'versao' => (int) $v0['versao'], 'legado_bruto' => $v0['legado_bruto']];
    }

    /** Ficha do produto (§11.3): itens aplicáveis com valor/unidade/origem, Precifica ao lado, sugestões, legado; fora da ficha; exceções. */
    public function fichaProduto(int $productId): array
    {
        $this->exigir();
        if ($productId <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['product_id']);
        $p = $this->cat()[$productId] ?? null;
        if ($p === null) throw new AtributosErro('PRODUCT_NOT_FOUND', 404, 'Produto não encontrado no catálogo.');
        $m = $this->repo->retratoModelo($productId);
        $excl = [];
        $ficha = Aplicabilidade::ficha($m, $p, $excl);
        $kits = Aplicabilidade::kits($m, $p);
        $atr = $this->atr(); $unid = $this->l->unidades(); $extras = $this->l->unidadesExtras();
        $vals = []; foreach ($this->l->valoresDetalhe($productId) as $v) $vals[(int) $v['atributo_id']][] = $v;
        $specs = $this->l->specs($productId);
        $sug = []; foreach ($this->l->sugestoes($productId) as $s) $sug[(int) $s['atributo_id']][] = $s;
        $item = null; foreach ($this->l->vinculos() as $it => $pid) if ((int) $pid === $productId) { $item = (int) $it; break; }
        $linhasLeg = $item !== null ? $this->l->legadoDoItem($item) : [];
        $kitLeg = $linhasLeg ? KitsLegado::doConjunto(array_column($linhasLeg, 'id_legado')) : null;
        $porLeg = []; foreach ($atr as $a) if ($a['legado_id'] !== null) $porLeg[(int) $a['legado_id']] = (int) $a['id'];
        $leg = []; foreach ($linhasLeg as $ln) if (isset($porLeg[(int) $ln['id_legado']])) $leg[$porLeg[(int) $ln['id_legado']]] = $ln;
        $opc = $this->l->opcoes(array_keys($ficha + $vals + $leg));
        $mk = function (int $aid, ?array $it) use ($atr, $unid, $extras, $vals, $specs, $sug, $leg, $kitLeg, $opc): array {
            $a = $atr[$aid] ?? ['id' => $aid, 'rotulo' => "#$aid", 'codigo' => null, 'tipo' => 'texto', 'unidade_id' => null, 'ativo' => 0];
            $base = ($it ?? ['unidade_produto_id' => null, 'unidade_kit_id' => null]) + ['def' => $a];
            $valor = isset($vals[$aid]) ? self::valorPublico($vals[$aid]) : null;
            $efet = Aplicabilidade::unidadeEfetiva($base, $valor['unidade_id'] ?? null);
            $ln = $leg[$aid] ?? null;
            return [
                'atributo_id' => $aid, 'codigo' => $a['codigo'], 'rotulo' => $a['rotulo'], 'tipo' => $a['tipo'], 'descricao' => $a['descricao'] ?? null,
                'casas' => isset($a['casas']) && $a['casas'] !== null ? (int) $a['casas'] : null, 'minimo' => $a['minimo'] ?? null, 'maximo' => $a['maximo'] ?? null,
                'aceita_nao_se_aplica' => (int) ($a['aceita_nao_se_aplica'] ?? 1) === 1, 'autoridade' => $a['autoridade'] ?? 'local',
                'atributo_ativo' => (bool) (int) ($a['ativo'] ?? 0), 'grupo_atributos' => $a['grupo_atributos'] ?? null,
                'kit_id' => $it['grupo_id'] ?? null, 'kit' => $it['grupo_nome'] ?? null, 'posicao' => $it['posicao'] ?? null,
                'obrigatorio' => (bool) ($it['obrigatorio'] ?? false), 'visivel_app' => (bool) ($it['visivel'] ?? true), 'destaque' => (bool) ($it['destaque'] ?? false),
                'importancia' => ($it['obrigatorio'] ?? false) ? 'obrigatorio' : ($it['importancia'] ?? ($a['importancia_padrao'] ?? null)),
                'origens' => $it['origens'] ?? [],
                'unidade_efetiva' => $efet !== null && isset($unid[$efet]) ? ['id' => $efet, 'simbolo' => $unid[$efet]['simbolo']] : null,
                'unidade_produto_id' => $base['unidade_produto_id'] ?? null,
                'unidades' => in_array($a['tipo'], ['numero', 'inteiro'], true) ? $this->unidadesPara($base, $unid, $extras) : [],
                'opcoes' => in_array($a['tipo'], ['opcao', 'multiopcao'], true) ? ($opc[$aid] ?? []) : [],
                'valor' => $valor,
                'precifica' => $this->parPrecifica($a['codigo'] ?? null, $specs),
                'sugestoes' => array_map(static fn($s) => ['id' => (int) $s['id'], 'fonte' => $s['fonte'], 'tipo' => $s['tipo'], 'valor_proposto' => $s['valor_proposto'], 'opcao_id' => $s['opcao_id'] === null ? null : (int) $s['opcao_id'],
                    'unidade_id' => $s['unidade_id'] === null ? null : (int) $s['unidade_id'], 'confianca' => $s['confianca'], 'evidencia' => $s['evidencia'],
                    'atributo_alternativo_id' => $s['atributo_alternativo_id'] === null ? null : (int) $s['atributo_alternativo_id'], 'versao' => (int) $s['versao']], $sug[$aid] ?? []),
                'legado' => $ln === null ? null : ['kit_origem' => KitsLegado::origemDoAtributo($kitLeg, (int) $ln['id_legado']), 'tp_unit' => $ln['tp_unit'], 'valor' => $ln['valor'], 'atualizado_legado' => $ln['atualizado_legado']],
            ];
        };
        $itens = []; foreach ($ficha as $aid => $it) $itens[] = $mk((int) $aid, $it);
        $fora = []; foreach (array_diff_key($vals, $ficha) as $aid => $_) $fora[] = $mk((int) $aid, null);
        $legNao = []; foreach (array_diff_key($leg, $ficha, $vals) as $aid => $_) $legNao[] = $mk((int) $aid, null);
        $estados = []; foreach ($vals as $aid => $vs) $estados[$aid] = $vs[0]['estado'];
        $exc = []; foreach ($excl as $aid => $e) $exc[] = ['atributo_id' => (int) $aid, 'rotulo' => $atr[$aid]['rotulo'] ?? "#$aid", 'motivo' => $e['motivo'], 'kits' => $e['grupos']];
        return [
            'produto' => $p, 'fotos' => array_map(fn($f) => $f + ['miniatura' => $this->miniaturaExiste((int) $f['id'])], $this->l->fotos($productId)),
            'kits' => array_values(array_map(static fn($k) => ['id' => (int) $k['grupo']['id'], 'nome' => $k['grupo']['nome'], 'motivos' => $k['motivos']], $kits)),
            'itens' => $itens, 'fora_da_ficha' => $fora, 'legado_nao_vinculado' => $legNao, 'excecoes' => $exc,
            'completude' => Aplicabilidade::completude($ficha, $estados),
            'legado' => $item === null ? null : ['item' => $item, 'kit' => $kitLeg, 'kit_nome' => $kitLeg ? KitsLegado::KITS[$kitLeg]['nome'] : null, 'atribuidos' => count($linhasLeg)],
            'precifica' => ['familias' => $specs === null ? [] : array_keys($specs), 'ficha' => $specs ?? [], 'disponivel' => $specs !== null],
            'pode_editar' => $this->pode(AtributosService::NIVEL_VALORES) && $p['ativo'], 'pode_vincular' => $this->pode(AtributosService::NIVEL_ADMIN),
        ];
    }

    public function historicoProduto(int $productId): array
    {
        $this->exigir();
        $atr = $this->atr();
        return ['historico' => array_map(static function ($h) use ($atr) {
            $p = explode(':', (string) $h['entidade_id']);
            $aid = in_array($h['entidade'], ['valor', 'produto_atributo'], true) ? (int) ($p[1] ?? 0) : null;
            return ['id' => (int) $h['id'], 'quando' => $h['criado_em'], 'quem' => $h['usuario'], 'acao' => $h['acao'], 'entidade' => $h['entidade'],
                'atributo' => $aid ? ($atr[$aid]['rotulo'] ?? "#$aid") : null, 'atributo_id' => $aid,
                'antes' => is_string($h['antes']) ? json_decode($h['antes'], true) : $h['antes'], 'depois' => is_string($h['depois']) ? json_decode($h['depois'], true) : $h['depois'], 'motivo' => $h['motivo']];
        }, $this->l->historico($productId, 300))];
    }

    /** Lista de kits (§11.5) com escopo, itens e alcance real (produtos ativos que recebem o kit). */
    public function kits(): array
    {
        $this->exigir();
        $m = $this->modelo(); $cat = $this->cat();
        $alc = [];
        foreach ($cat as $p) { if (!$p['ativo']) continue; foreach (Aplicabilidade::kits($m, $p) as $gid => $_) $alc[$gid] = ($alc[$gid] ?? 0) + 1; }
        $atr = $this->atr(); $out = [];
        foreach ($m->grupos as $gid => $g) {
            $itens = array_filter($m->itens[$gid] ?? [], static fn($i) => (int) ($atr[(int) $i['atributo_id']]['ativo'] ?? 0) === 1);
            $esc = array_values(array_filter($m->escopos, static fn($e) => (int) $e['grupo_id'] === (int) $gid));
            $out[] = ['id' => (int) $gid, 'nome' => $g['nome'], 'descricao' => $g['descricao'] ?? null, 'ativo' => (bool) (int) $g['ativo'], 'aplica_a_todos' => (bool) (int) ($g['aplica_a_todos'] ?? 0),
                'ordem' => (int) ($g['ordem'] ?? 0), 'versao' => (int) ($g['versao'] ?? 1), 'itens' => count($itens),
                'escopos' => array_map(fn($e) => ['categoria' => $e['categoria'], 'subcategoria' => $e['subcategoria'], 'produtos' => $this->contarAtivos($e['categoria'], $e['subcategoria'])], $esc),
                'diretos' => count(array_filter($m->diretos, static fn($gs) => in_array((int) $gid, $gs, true))), 'alcance' => $alc[$gid] ?? 0];
        }
        usort($out, static fn($a, $b) => [$b['ativo'], $b['itens'] > 0, mb_strtolower($a['nome'])] <=> [$a['ativo'], $a['itens'] > 0, mb_strtolower($b['nome'])]);
        return ['kits' => $out, 'subcategorias' => $this->subcategorias(), 'pode_editar' => $this->pode(AtributosService::NIVEL_ADMIN)];
    }

    private function contarAtivos(string $cat, string $sub): int
    {
        $n = 0; foreach ($this->cat() as $p) if ($p['ativo'] && $p['categoria'] === $cat && ($sub === '' || ($p['subcategoria'] ?? '') === $sub)) $n++;
        return $n;
    }

    private function subcategorias(): array
    {
        $out = [];
        foreach ($this->cat() as $p) { $k = $p['categoria'] . '|' . ($p['subcategoria'] ?? ''); $out[$k] ??= ['categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'] ?? '', 'ativos' => 0]; if ($p['ativo']) $out[$k]['ativos']++; }
        ksort($out);
        return array_values($out);
    }

    public function kit(int $id): array
    {
        $this->exigir();
        $g = $this->repo->grupo($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Kit não encontrado.');
        $m = $this->modelo(); $cat = $this->cat(); $unid = $this->l->unidades();
        $alc = [];
        foreach ($cat as $p) {
            $ks = Aplicabilidade::kits($m, $p);
            if (isset($ks[$id])) $alc[] = ['id' => $p['id'], 'nome' => $p['nome'], 'subcategoria' => $p['subcategoria'], 'ativo' => $p['ativo'], 'motivos' => array_values(array_unique(array_column($ks[$id]['motivos'], 'tipo')))];
        }
        $dir = [];
        foreach ($m->diretos as $pid => $gs) if (in_array($id, $gs, true)) $dir[] = ['id' => (int) $pid, 'nome' => $cat[$pid]['nome'] ?? "#$pid", 'subcategoria' => $cat[$pid]['subcategoria'] ?? null];
        $atr = $this->atr();
        $g['atributos'] = array_map(static fn($i) => $i + ['unidade' => $i['unidade_id'] !== null ? ($unid[(int) $i['unidade_id']]['simbolo'] ?? null) : null,
            'unidade_padrao' => $atr[(int) $i['atributo_id']]['unidade'] ?? null, 'unidade_padrao_id' => $atr[(int) $i['atributo_id']]['unidade_id'] ?? null,
            'importancia_padrao' => $atr[(int) $i['atributo_id']]['importancia_padrao'] ?? null], $g['atributos']);
        $g['escopos'] = array_map(fn($e) => $e + ['produtos' => $this->contarAtivos($e['categoria'], $e['subcategoria'])], $g['escopos']);
        $g['aplica_a_todos'] = (bool) (int) ($g['aplica_a_todos'] ?? 0); $g['ativo'] = (bool) (int) $g['ativo'];
        return ['kit' => $g, 'produtos_diretos' => $dir, 'alcance' => $alc, 'subcategorias' => $this->subcategorias(), 'unidades' => array_values($unid),
            'pode_editar' => $this->pode(AtributosService::NIVEL_ADMIN)];
    }

    /** Dicionário (§11.6): os atributos com uso (kits, produtos com valor), importância e grupo de atributos. */
    public function dicionario(): array
    {
        $this->exigir();
        $uso = $this->l->usoAtributos(); $extras = $this->l->unidadesExtras();
        $out = [];
        foreach ($this->atr() as $aid => $a) $out[] = $a + ['em_kits' => (int) ($uso[$aid]['kits'] ?? 0), 'produtos_com_valor' => (int) ($uso[$aid]['valores'] ?? 0), 'unidades_extras' => $extras[$aid] ?? []];
        usort($out, static fn($x, $y) => strcmp(mb_strtolower($x['rotulo']), mb_strtolower($y['rotulo'])));
        return ['atributos' => $out, 'unidades' => array_values($this->l->unidades()), 'pode_administrar' => $this->pode(AtributosService::NIVEL_ADMIN)];
    }

    public function unidadesComUso(): array
    {
        $this->exigir();
        $uso = $this->l->usoUnidades();
        return ['unidades' => array_values(array_map(static fn($u) => $u + ['atributos' => (int) ($uso[(int) $u['id']]['atributos'] ?? 0), 'valores' => (int) ($uso[(int) $u['id']]['valores'] ?? 0)], $this->l->unidades())),
            'pode_administrar' => $this->pode(AtributosService::NIVEL_ADMIN)];
    }

    /** Conferência (§11.9): 5 filas com ação direta. */
    public function conferencia(): array
    {
        $this->exigir();
        $todos = $this->resumos(); $res = array_filter($todos, static fn($p) => $p['ativo']);
        $atr = $this->atr(); $cat = $this->cat();
        // D10: diz em quais destinos o produto já tem valor (a tela não oferece "aceitar" ali; o serviço recusa com VALUE_EXISTS).
        $tem = static fn(int $pid, ?int $aid): bool => $aid !== null && isset($todos[$pid]['_estados'][$aid]);
        $sug = static fn($s) => ['ja_tem_valor' => $tem((int) $s['product_id'], (int) $s['atributo_id']),
            'alternativo_ja_tem_valor' => $tem((int) $s['product_id'], $s['atributo_alternativo_id'] === null ? null : (int) $s['atributo_alternativo_id']),
            'id' => (int) $s['id'], 'product_id' => (int) $s['product_id'], 'produto' => $cat[(int) $s['product_id']]['nome'] ?? '#' . $s['product_id'], 'atributo_id' => (int) $s['atributo_id'],
            'atributo' => $atr[(int) $s['atributo_id']]['rotulo'] ?? null, 'tipo_atributo' => $atr[(int) $s['atributo_id']]['tipo'] ?? null,
            'atributo_alternativo_id' => $s['atributo_alternativo_id'] === null ? null : (int) $s['atributo_alternativo_id'],
            'atributo_alternativo' => $s['atributo_alternativo_id'] !== null ? ($atr[(int) $s['atributo_alternativo_id']]['rotulo'] ?? null) : null,
            'fonte' => $s['fonte'], 'tipo' => $s['tipo'], 'valor_proposto' => $s['valor_proposto'], 'unidade_id' => $s['unidade_id'] === null ? null : (int) $s['unidade_id'],
            'unidade' => $s['unidade'] ?? null, 'confianca' => $s['confianca'], 'evidencia' => $s['evidencia'], 'versao' => (int) $s['versao']];
        $fora = []; $obr = []; $sem = [];
        foreach ($res as $pid => $p) {
            foreach (array_diff_key($p['_estados'], $p['_ficha']) as $aid => $est) $fora[] = ['product_id' => $pid, 'produto' => $p['nome'], 'atributo_id' => (int) $aid, 'atributo' => $atr[$aid]['rotulo'] ?? "#$aid", 'estado' => $est];
            foreach ($p['_obrigatorios'] as $aid) $obr[] = ['product_id' => $pid, 'produto' => $p['nome'], 'atributo_id' => (int) $aid, 'atributo' => $atr[$aid]['rotulo'] ?? "#$aid"];
            if ($p['kits_especificos'] === 0) $sem[] = ['product_id' => $pid, 'produto' => $p['nome'], 'subcategoria' => $p['subcategoria'], 'legado' => $p['legado']['kit_nome'] ?? null];
        }
        return ['filas' => [
            'legado' => array_map($sug, $this->l->sugestoes(null, 'legado_2025', null, 3000)),
            'nome' => array_map($sug, $this->l->sugestoes(null, 'nome_produto', null, 3000)),
            'fora_da_ficha' => $fora, 'obrigatorios_vazios' => array_slice($obr, 0, 1000), 'sem_kit' => $sem,
        ], 'totais' => ['obrigatorios_vazios' => count($obr)], 'pode_decidir' => $this->pode(AtributosService::NIVEL_VALORES)];
    }

    // ---- miniaturas (A6) ---------------------------------------------------------------------------------------------------------------
    private function manifesto(): array
    {
        if ($this->manifesto !== null) return $this->manifesto;
        $f = $this->dirMiniaturas ? $this->dirMiniaturas . '/manifesto.json' : null;
        return $this->manifesto = ($f && is_file($f)) ? (json_decode((string) file_get_contents($f), true) ?: []) : [];
    }
    private function miniaturaExiste(int $mediaId): bool { return isset($this->manifesto()[(string) $mediaId]['p480']); }

    /** Arquivo da miniatura (só mídia elegível e só arquivo listado no manifesto). Nunca expõe storage_key nem caminho ao cliente. */
    public function arquivoMiniatura(int $mediaId, int $lado): ?array
    {
        $this->exigir();
        if (!in_array($lado, [480, 1280], true) || $mediaId <= 0 || !$this->l->fotoElegivel($mediaId)) return null;
        $arq = $this->manifesto()[(string) $mediaId]["p$lado"] ?? null;
        if (!is_string($arq) || !preg_match('/^[0-9a-f]{64}-(480|1280)\.jpg$/', $arq)) return null;
        $cam = $this->dirMiniaturas . '/' . $arq;
        return is_file($cam) ? ['caminho' => $cam, 'etag' => '"' . substr($arq, 0, 40) . '"'] : null;
    }
}
