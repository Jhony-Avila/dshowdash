<?php
// /api/atributos/ProdutosLeitura.php — E1 (ATRIBUTOS-WEB 18/11): leitura RICA para a tela "Produtos" do Dash. SÓ LEITURA.
// - vitrine(): todos os produtos não excluídos do catálogo com indicadores (fotos, ficha do Precifica, preenchimento, kit do legado);
// - fichaProduto(): os atributos do produto em TRÊS CAMADAS distinguíveis + kit de origem de cada atribuição + Precifica ao lado:
//     1. preenchidos (eq_valor vivo) — com unidade, origem (importado/manual), data e lote;
//     2. atribuídos no legado SEM valor (eq_legado_bruto.mm_atributos_x_itens via eq_legado_vinculo) — "atribuído no legado, sem valor";
//     3. do modelo da subcategoria (ficha aplicável D4, regra do AtributosService) ainda vazios.
// Nenhuma escrita: só SELECT (DSHOW_EQUIPAMENTOS; APP_DSHOW.product_catalog/product_media/product_specs nas colunas do GRANT).
// Fotos: só METADADOS (id, capa, posição, cor média, dimensões). O binário depende da proposta de fotos (E1-FOTOS-PROPOSTA.md).
declare(strict_types=1);

require_once __DIR__ . '/AtributosService.php';
require_once __DIR__ . '/KitsLegado.php';

interface LeituraVitrine
{
    /** id => [id, nome, categoria, subcategoria, ativo] — catálogo sem os excluídos. */
    public function catalogo(): array;
    /** product_id => [n, capa_id, cor] — fotos publicadas e vivas. */
    public function fotosResumo(): array;
    /** Fotos publicadas e vivas do produto, capa primeiro: [id, capa, posicao, cor, largura, altura]. */
    public function fotos(int $productId): array;
    /** product_id => [kinds] da ficha do Precifica (product_specs vivos). Sem leitura → []. */
    public function familiasPrecifica(): array;
    /** kind => attrs (product_specs do produto). Sem leitura → null. */
    public function specs(int $productId): ?array;
    /** product_id => [atributo_id => true] dos valores vivos. */
    public function valoresResumo(): array;
    /** Valores vivos do produto com detalhe (unidade, opção, origem, datas, lote). */
    public function valoresDetalhe(int $productId): array;
    /** item legado => [ids_legado => [...], preenchidos => n] (mm_atributos_x_itens do lote). */
    public function legadoResumo(): array;
    /** Linhas legadas do item: [id_legado, valor, tp_unit, atualizado_legado]. */
    public function legadoDoItem(int $item): array;
    /** item legado => product_id (vínculos inequívocos). */
    public function vinculos(): array;
    /** TODOS os atributos: id => [id, codigo, rotulo, tipo, unidade, ativo, importancia, legado_id|null]. */
    public function atributos(): array;
    /** "categoria|subcategoria" ('' = categoria toda) => [atributo_id ativo => true] dos grupos ativos. */
    public function modelos(): array;
}

final class ProdutosLeitura
{
    /** Espelho do PRECIFICA_PAR do app (backend/api/src/modules/products/attributes.ts:76). Contrato: códigos estáveis. */
    public const PRECIFICA_PAR = [
        'pitch_138' => ['led_module.pitch'],
        'largura_409' => ['led_module.width_mm', 'panel_mounted.width_mm'],
        'altura_122' => ['led_module.height_mm', 'panel_mounted.height_mm'],
        'profundidade_397' => ['led_module.depth_mm', 'panel_mounted.depth_mm'],
        'peso_399' => ['panel_mounted.weight_kg'],
        'resolucao_de_altura_101' => ['led_module.height_resolution'],
        'resolucao_de_largura_152' => ['led_module.width_resolution'],
        'tipo_do_led_87' => ['led_module.usage_type'],
        'ip_rating_24' => ['panel_mounted.ip_rating'],
    ];

    public function __construct(private readonly LeituraVitrine $l, private readonly AtributosService $svc, private readonly int $nivel) {}

    private function exigir(): void
    {
        if ($this->nivel < AtributosService::NIVEL_CONSULTA) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
    }

    /** Conjunto de atributos ativos do modelo para categoria/subcategoria (união dos grupos aplicáveis). */
    private static function modeloDe(array $modelos, string $cat, ?string $sub): array
    {
        return ($modelos["$cat|" . ($sub ?? '')] ?? []) + ($modelos["$cat|"] ?? []);
    }

    public function vitrine(): array
    {
        $this->exigir();
        $cat = $this->l->catalogo(); $fotos = $this->l->fotosResumo(); $fam = $this->l->familiasPrecifica();
        $vals = $this->l->valoresResumo(); $leg = $this->l->legadoResumo(); $vin = $this->l->vinculos();
        $todos = $this->l->atributos(); $modelos = $this->l->modelos();
        $porLeg = [];
        foreach ($todos as $a) if ($a['legado_id'] !== null) $porLeg[(int) $a['legado_id']] = $a;
        $itemDe = [];
        foreach ($vin as $item => $pid) $itemDe[$pid] = $item;
        $ativoPorId = [];
        foreach ($todos as $a) $ativoPorId[(int) $a['id']] = (bool) $a['ativo'];
        $out = []; $facetas = [];
        foreach ($cat as $pid => $p) {
            $item = $itemDe[$pid] ?? null; $l = $item !== null ? ($leg[$item] ?? null) : null;
            $kit = $l ? KitsLegado::doConjunto($l['ids_legado']) : null;
            $legAtivos = [];
            if ($l) foreach ($l['ids_legado'] as $idl) { $a = $porLeg[$idl] ?? null; if ($a && $a['ativo']) $legAtivos[(int) $a['id']] = true; }
            $mod = self::modeloDe($modelos, $p['categoria'], $p['subcategoria']);
            $preench = [];
            foreach (array_keys($vals[$pid] ?? []) as $aid) if ($ativoPorId[$aid] ?? true) $preench[$aid] = true;
            $universo = $legAtivos + $mod + $preench;
            $f = $fotos[$pid] ?? null;
            $out[] = [
                'id' => $pid, 'nome' => $p['nome'], 'categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'ativo' => $p['ativo'],
                'fotos' => $f ? (int) $f['n'] : 0, 'capa_id' => $f ? (int) $f['capa_id'] : null, 'capa_cor' => $f['cor'] ?? null,
                'precifica' => $fam[$pid] ?? [],
                'preenchidos' => count($preench), 'universo' => count($universo),
                'legado' => $l ? ['kit' => $kit, 'kit_nome' => $kit ? KitsLegado::KITS[$kit]['nome'] : null, 'atribuidos' => count($l['ids_legado']), 'com_valor' => (int) $l['preenchidos']] : null,
                'modelo' => count($mod),
            ];
            $k = $p['categoria'] . '|' . ($p['subcategoria'] ?? '');
            $facetas[$k] ??= ['categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'produtos' => 0, 'ativos' => 0];
            $facetas[$k]['produtos']++; if ($p['ativo']) $facetas[$k]['ativos']++;
        }
        usort($out, static fn($a, $b) => $a['id'] <=> $b['id']);
        ksort($facetas);
        $kits = [];
        foreach (KitsLegado::KITS as $c => $k) $kits[] = ['codigo' => $c, 'nome' => $k['nome'], 'tamanho' => count($k['ids'])];
        return ['produtos' => $out, 'facetas' => array_values($facetas), 'kits' => $kits];
    }

    public function fichaProduto(int $productId): array
    {
        $this->exigir();
        // Modelo (ficha aplicável D4) + validação do produto no catálogo: regra única do AtributosService (404/503/422 dele).
        $f = $this->svc->ficha($productId, false);
        $porId = $this->l->atributos();
        $porLeg = [];
        foreach ($porId as $a) if ($a['legado_id'] !== null) $porLeg[(int) $a['legado_id']] = $a;
        // Legado
        $item = null;
        foreach ($this->l->vinculos() as $it => $pid) if ((int) $pid === $productId) { $item = (int) $it; break; }
        $linhasLeg = $item !== null ? $this->l->legadoDoItem($item) : [];
        $kit = $linhasLeg ? KitsLegado::doConjunto(array_column($linhasLeg, 'id_legado')) : null;
        $legPorAtr = [];
        foreach ($linhasLeg as $ln) {
            $a = $porLeg[(int) $ln['id_legado']] ?? null;
            if ($a) $legPorAtr[(int) $a['id']] = $ln;
        }
        // Modelo
        $modelo = [];
        foreach ($f['grupos'] as $g) foreach ($g['atributos'] as $a) $modelo[(int) $a['atributo_id']] = ['grupo' => $g['nome'], 'obrigatorio' => (bool) $a['obrigatorio'], 'posicao' => (int) $a['posicao']];
        // Precifica
        $specs = $this->l->specs($productId);
        $famil = $specs === null ? [] : array_keys($specs);
        // Valores
        $vals = [];
        foreach ($this->l->valoresDetalhe($productId) as $v) $vals[(int) $v['atributo_id']][] = $v;

        $item0 = function (int $aid) use ($porId, $modelo, $legPorAtr, $kit, $specs): array {
            $a = $porId[$aid] ?? null;
            $par = null;
            if ($a && $specs) foreach (self::PRECIFICA_PAR[$a['codigo']] ?? [] as $ref) {
                [$kind, $campo] = explode('.', $ref, 2);
                if (isset($specs[$kind]) && array_key_exists($campo, $specs[$kind])) { $par = ['chave' => $ref, 'valor' => $specs[$kind][$campo]]; break; }
            }
            $ln = $legPorAtr[$aid] ?? null;
            return [
                'atributo_id' => $aid, 'codigo' => $a['codigo'] ?? null, 'rotulo' => $a['rotulo'] ?? ('#' . $aid), 'tipo' => $a['tipo'] ?? null,
                'unidade' => $a['unidade'] ?? null, 'atributo_ativo' => (bool) ($a['ativo'] ?? false), 'importancia' => $a['importancia'] ?? null,
                'no_modelo' => isset($modelo[$aid]), 'grupo' => $modelo[$aid]['grupo'] ?? null, 'obrigatorio' => $modelo[$aid]['obrigatorio'] ?? false,
                'posicao' => $modelo[$aid]['posicao'] ?? null,
                'no_legado' => $ln !== null, 'kit_origem' => $ln !== null ? KitsLegado::origemDoAtributo($kit, (int) $ln['id_legado']) : null,
                'legado' => $ln === null ? null : ['tp_unit' => $ln['tp_unit'], 'atualizado_legado' => $ln['atualizado_legado']],
                'precifica' => $par,
            ];
        };
        $preenchidos = []; $legadoSem = []; $modeloVazio = [];
        foreach ($vals as $aid => $vs) {
            $x = $item0($aid);
            $v0 = $vs[0];
            $ops = array_values(array_filter(array_map(static fn($v) => $v['opcao'], $vs), static fn($o) => $o !== null));
            $x['valor'] = [
                'estado' => $v0['estado'], 'texto' => $v0['valor_texto'], 'numero' => $v0['valor_num'] === null ? null : (string) $v0['valor_num'],
                'booleano' => $v0['valor_bool'] === null ? null : (bool) (int) $v0['valor_bool'], 'data' => $v0['valor_data'], 'opcoes' => $ops,
                'casas' => $v0['casas'] === null ? null : (int) $v0['casas'],
                'origem' => $v0['origem'], 'criado_em' => $v0['criado_em'], 'atualizado_em' => $v0['atualizado_em'], 'lote_id' => $v0['lote_id'] === null ? null : (int) $v0['lote_id'],
                'versao' => (int) $v0['versao'], 'legado_bruto' => $v0['legado_bruto'],
            ];
            $preenchidos[] = $x;
        }
        foreach ($legPorAtr as $aid => $ln) {
            if (isset($vals[$aid])) continue;
            $legadoSem[] = $item0($aid);
        }
        foreach ($modelo as $aid => $m) {
            if (isset($vals[$aid]) || isset($legPorAtr[$aid])) continue;
            $modeloVazio[] = $item0($aid);
        }
        $ordem = static fn(array $a, array $b) => [$a['no_modelo'] ? 0 : 1, $a['grupo'] ?? '', $a['posicao'] ?? 9999, $a['rotulo']] <=> [$b['no_modelo'] ? 0 : 1, $b['grupo'] ?? '', $b['posicao'] ?? 9999, $b['rotulo']];
        usort($preenchidos, $ordem); usort($legadoSem, $ordem); usort($modeloVazio, $ordem);
        $ativos = static fn(array $xs) => count(array_filter($xs, static fn($x) => $x['atributo_ativo']));
        return [
            'produto' => $f['produto'],
            'fotos' => $this->l->fotos($productId),
            'legado' => $item === null ? null : ['item' => $item, 'kit' => $kit, 'kit_nome' => $kit ? KitsLegado::KITS[$kit]['nome'] : null, 'atribuidos' => count($linhasLeg),
                'com_valor' => count(array_filter($linhasLeg, static fn($ln) => $ln['valor'] !== null && trim((string) $ln['valor']) !== ''))],
            'precifica' => ['familias' => $famil, 'ficha' => $specs ?? [], 'disponivel' => $specs !== null],
            'camadas' => ['preenchidos' => $preenchidos, 'legado_sem_valor' => $legadoSem, 'modelo_vazio' => $modeloVazio],
            'contagens' => ['preenchidos' => count($preenchidos), 'legado_sem_valor' => count($legadoSem), 'modelo_vazio' => count($modeloVazio),
                'preenchidos_ativos' => $ativos($preenchidos), 'legado_sem_valor_ativos' => $ativos($legadoSem), 'modelo' => count($modelo)],
            'completude' => $f['completude'],
        ];
    }
}
