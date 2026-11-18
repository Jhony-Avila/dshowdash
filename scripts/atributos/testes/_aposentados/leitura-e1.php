<?php
// ATRIBUTOS-WEB E1 — testes SEM BANCO da leitura rica (ProdutosLeitura): três camadas, kit de origem, Precifica ao lado, indicadores da vitrine.
declare(strict_types=1);
require_once __DIR__ . '/_memoria.php';
require_once __DIR__ . '/../../../api/atributos/ProdutosLeitura.php';

$falhas = 0; $n = 0;
$ok = function (string $nome, bool $c) use (&$falhas, &$n): void { $n++; if (!$c) { $falhas++; echo "[ERRO] $nome\n"; } };
$erro = function (callable $f): ?AtributosErro { try { $f(); } catch (AtributosErro $e) { return $e; } return null; };

/** Leitura em memória sobre o RepoMemoria/CatalogoMemoria (mesmo contrato da LeituraVitrinePdo). */
final class LeituraMemoria implements LeituraVitrine
{
    public array $legado = [];   // item => [id_legado => [valor, tp_unit]]
    public array $vinc = [];     // item => product_id
    public array $fot = [];      // product_id => [[id, capa, posicao, cor, largura, altura]]
    public ?array $spec = [];    // product_id => kind => attrs   (null = sem leitura)
    public array $leg2id = [];   // legado_id => atributo_id
    public function __construct(private RepoMemoria $r, private CatalogoMemoria $c) {}
    public function catalogo(): array { $o = []; foreach ($this->c->p as $p) if (!$p['excluido']) $o[$p['id']] = ['id' => $p['id'], 'nome' => $p['nome'], 'categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'ativo' => $p['ativo']]; return $o; }
    public function fotosResumo(): array { $o = []; foreach ($this->fot as $pid => $fs) $o[$pid] = ['n' => count($fs), 'capa_id' => $fs[0]['id'], 'cor' => $fs[0]['cor']]; return $o; }
    public function fotos(int $p): array { return $this->fot[$p] ?? []; }
    public function familiasPrecifica(): array { $o = []; foreach ($this->spec ?? [] as $pid => $k) $o[$pid] = array_keys($k); return $o; }
    public function specs(int $p): ?array { return $this->spec === null ? null : ($this->spec[$p] ?? []); }
    public function valoresResumo(): array { $o = []; foreach ($this->r->v as $v) if (empty($v['excluido_em'])) $o[$v['product_id']][$v['atributo_id']] = true; return $o; }
    public function valoresDetalhe(int $p): array {
        $o = [];
        foreach ($this->r->v as $v) if ($v['product_id'] === $p && empty($v['excluido_em'])) $o[] = ['atributo_id' => $v['atributo_id'], 'opcao' => isset($v['opcao_id']) ? ($this->r->o[$v['opcao_id']]['rotulo'] ?? null) : null,
            'valor_texto' => $v['valor_texto'] ?? null, 'valor_num' => $v['valor_num'] ?? null, 'valor_bool' => $v['valor_bool'] ?? null, 'valor_data' => $v['valor_data'] ?? null,
            'estado' => $v['estado'], 'origem' => $v['origem'], 'versao' => $v['versao'], 'lote_id' => $v['lote_id'] ?? null, 'legado_bruto' => null, 'criado_em' => '2026-11-16 16:46:00', 'atualizado_em' => '2026-11-16 16:46:00', 'casas' => null];
        return $o;
    }
    public function legadoResumo(): array { $o = []; foreach ($this->legado as $it => $ls) { $ids = array_keys($ls); sort($ids); $o[$it] = ['ids_legado' => $ids, 'preenchidos' => count(array_filter($ls, fn($x) => $x[0] !== null && $x[0] !== ''))]; } return $o; }
    public function legadoDoItem(int $i): array { $o = []; foreach ($this->legado[$i] ?? [] as $idl => [$v, $u]) $o[] = ['id_legado' => $idl, 'valor' => $v, 'tp_unit' => $u, 'atualizado_legado' => '2025-05-20 07:00:00']; return $o; }
    public function vinculos(): array { return $this->vinc; }
    public function atributos(): array { $l2 = array_flip($this->leg2id); $o = []; foreach ($this->r->a as $aid => $a) { $l = $l2[$aid] ?? null; $o[$aid] = ['id' => $aid, 'legado_id' => $l, 'codigo' => $a['codigo'], 'rotulo' => $a['rotulo'], 'tipo' => $a['tipo'], 'unidade' => null, 'ativo' => (bool) $a['ativo'], 'importancia' => $a['importancia'] ?? null]; } return $o; }
    public function modelos(): array { $o = []; foreach ($this->r->g as $gid => $g) { if (!$g['ativo']) continue; foreach ($this->r->ge[$gid] ?? [] as $e) foreach ($this->r->ga[$gid] ?? [] as $it) if ($this->r->a[$it['atributo_id']]['ativo']) $o[$e['categoria'] . '|' . $e['subcategoria']][$it['atributo_id']] = true; } return $o; }
}

$repo = new RepoMemoria(); $cat = new CatalogoMemoria();
$cat->p[20] = ['id' => 20, 'nome' => 'Cabo DC (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$cat->p[21] = ['id' => 21, 'nome' => 'Cabo sem legado (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$cat->p[22] = ['id' => 22, 'nome' => 'Módulo com Precifica (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$lm = new LeituraMemoria($repo, $cat);
// Dicionário: um atributo por id legado do kit Cabos (base 8 + 13); as descrições 2–6 inativas (como hoje em produção)
foreach (KitsLegado::KITS['cabos']['ids'] as $idl) {
    $aid = $repo->criarAtributo(['codigo' => "leg_$idl", 'rotulo' => "Legado $idl", 'tipo' => 'texto', 'autoridade' => 'local', 'importancia' => $idl === 18 ? 'Campos Importantes' : 'Campos Opcionais']);
    if (in_array($idl, [2, 3, 4, 5, 6], true)) $repo->a[$aid]['ativo'] = 0;
    $lm->leg2id[$idl] = $aid;
}
$larg = $repo->criarAtributo(['codigo' => 'largura_409', 'rotulo' => 'Largura', 'tipo' => 'numero', 'autoridade' => 'local']); $lm->leg2id[409] = $larg;
$fora = $repo->criarAtributo(['codigo' => 'comprimento_x', 'rotulo' => 'Comprimento', 'tipo' => 'numero', 'autoridade' => 'local']);   // só no modelo, fora do kit
// Modelo "Periféricos | Cabos" = 1 atributo do kit (Garantia, legado 18) + Comprimento (fora do kit)
$g = $repo->criarGrupo('Periféricos | Cabos'); $repo->definirEscopo($g, [['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE']]);
$repo->definirAtributosDoGrupo($g, [['atributo_id' => $lm->leg2id[18], 'posicao' => 1, 'obrigatorio' => 0, 'visivel' => 1], ['atributo_id' => $fora, 'posicao' => 2, 'obrigatorio' => 1, 'visivel' => 1]]);
$gm = $repo->criarGrupo('Painel Led | Módulo'); $repo->definirEscopo($gm, [['categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE']]);
$repo->definirAtributosDoGrupo($gm, [['atributo_id' => $larg, 'posicao' => 1, 'obrigatorio' => 0, 'visivel' => 1]]);
// Legado do produto 20: item 2000, kit Cabos completo; só a Descrição Curta (1) tem valor
$lm->vinc[2000] = 20;
foreach (KitsLegado::KITS['cabos']['ids'] as $idl) $lm->legado[2000][$idl] = [$idl === 1 ? 'Cabo DC' : null, $idl === 18 ? 'Meses' : null];
// eq_valor: a Descrição Curta importada (atributo 1 está ATIVO neste teste)
$repo->v['20:' . $lm->leg2id[1] . ':0'] = ['product_id' => 20, 'atributo_id' => $lm->leg2id[1], 'opcao_chave' => 0, 'opcao_id' => null, 'valor_texto' => 'Cabo DC', 'valor_num' => null, 'valor_bool' => null, 'valor_data' => null, 'estado' => 'informado', 'origem' => 'importado', 'versao' => 1, 'lote_id' => 1];
$repo->v['22:' . $larg . ':0'] = ['product_id' => 22, 'atributo_id' => $larg, 'opcao_chave' => 0, 'opcao_id' => null, 'valor_texto' => null, 'valor_num' => '320.000000', 'valor_bool' => null, 'valor_data' => null, 'estado' => 'informado', 'origem' => 'importado', 'versao' => 1, 'lote_id' => 1];
$lm->spec = [22 => ['led_module' => ['width_mm' => '320.00', 'pitch' => '2.5000']]];
$lm->fot = [20 => [['id' => 501, 'capa' => true, 'posicao' => 1, 'cor' => 'a0a0a0', 'largura' => 800, 'altura' => 600]]];

$svc = new AtributosService($repo, 50, 'leitor@exemplo.invalid', $cat);
$pl = new ProdutosLeitura($lm, $svc, 50);

// ---- kits ----
$ok('KitsLegado: 7 kits, base de 8 contida em todos', count(KitsLegado::KITS) === 7 && count(array_filter(KitsLegado::KITS, fn($k) => array_intersect(KitsLegado::BASE, $k['ids']) === KitsLegado::BASE)) === 7);
$ok('KitsLegado: conjunto exato → kit; fora dos 7 → null', KitsLegado::doConjunto(array_reverse(KitsLegado::KITS['cabos']['ids'])) === 'cabos' && KitsLegado::doConjunto([1, 2]) === null);
$ok('KitsLegado: origem do atributo (base × kit)', KitsLegado::origemDoAtributo('cabos', 18) === 'Base (8)' && KitsLegado::origemDoAtributo('cabos', 30) === 'Cabos' && KitsLegado::origemDoAtributo(null, 18) === null);

// ---- ficha do produto 20 (kit Cabos) ----
$f = $pl->fichaProduto(20);
$c = $f['camadas'];
$ok('ficha: kit do legado identificado (Cabos, 21 atribuídos, 1 com valor)', $f['legado']['kit'] === 'cabos' && $f['legado']['atribuidos'] === 21 && $f['legado']['com_valor'] === 1);
$ok('camada 1: só o valor vivo (Descrição Curta, importado, lote 1)', count($c['preenchidos']) === 1 && $c['preenchidos'][0]['valor']['origem'] === 'importado' && $c['preenchidos'][0]['valor']['lote_id'] === 1 && $c['preenchidos'][0]['kit_origem'] === 'Base (8)');
$ok('camada 2: 20 atribuídos no legado sem valor (inclui inativos, marcados)', count($c['legado_sem_valor']) === 20 && count(array_filter($c['legado_sem_valor'], fn($x) => !$x['atributo_ativo'])) === 5);
$ok('camada 2: kit de origem por atributo (Base × Cabos)', count(array_filter($c['legado_sem_valor'], fn($x) => $x['kit_origem'] === 'Cabos')) === 13 && count(array_filter($c['legado_sem_valor'], fn($x) => $x['kit_origem'] === 'Base (8)')) === 7);
$ok('camada 2: atributo também do modelo marca no_modelo e grupo', ($x = array_values(array_filter($c['legado_sem_valor'], fn($x) => $x['codigo'] === 'leg_18'))[0]) && $x['no_modelo'] && $x['grupo'] === 'Periféricos | Cabos' && $x['legado']['tp_unit'] === 'Meses');
$ok('camada 3: só o que é do modelo e não está nem no legado nem preenchido (Comprimento, obrigatório)', count($c['modelo_vazio']) === 1 && $c['modelo_vazio'][0]['codigo'] === 'comprimento_x' && $c['modelo_vazio'][0]['obrigatorio'] === true && $c['modelo_vazio'][0]['no_legado'] === false);
$ok('camadas não se sobrepõem', count(array_unique(array_merge(...array_map(fn($k) => array_column($c[$k], 'atributo_id'), ['preenchidos', 'legado_sem_valor', 'modelo_vazio'])))) === 22);
$ok('ficha: fotos (metadados) e Precifica sem família', count($f['fotos']) === 1 && $f['fotos'][0]['id'] === 501 && $f['precifica']['familias'] === [] && $f['precifica']['disponivel'] === true);
// ---- produto sem legado ----
$f21 = $pl->fichaProduto(21);
$ok('sem legado: legado=null, camada 3 = modelo inteiro (2)', $f21['legado'] === null && count($f21['camadas']['modelo_vazio']) === 2 && $f21['camadas']['legado_sem_valor'] === []);
// ---- Precifica ao lado ----
$f22 = $pl->fichaProduto(22);
$ok('Precifica: par largura_409 ↔ led_module.width_mm ao lado do valor DSHOW', $f22['camadas']['preenchidos'][0]['precifica'] === ['chave' => 'led_module.width_mm', 'valor' => '320.00'] && $f22['precifica']['familias'] === ['led_module']);
$lm->spec = null;
$ok('Precifica sem leitura → disponivel=false, sem erro', $pl->fichaProduto(22)['precifica']['disponivel'] === false);
$lm->spec = [22 => ['led_module' => ['width_mm' => '320.00']]];
// ---- vitrine ----
$v = $pl->vitrine(); $vp = array_column($v['produtos'], null, 'id');
$ok('vitrine: sem excluídos, ordenada por id', !isset($vp[11]) && array_column($v['produtos'], 'id') === array_values(array_map('intval', array_keys($vp))) && $v['produtos'][0]['id'] < $v['produtos'][1]['id']);
$ok('vitrine: indicador do 20 = 1 preenchido de 17 (16 legados ativos + Comprimento)', $vp[20]['preenchidos'] === 1 && $vp[20]['universo'] === 17 && $vp[20]['legado']['kit'] === 'cabos' && $vp[20]['modelo'] === 2);
$ok('vitrine: fotos e capa', $vp[20]['fotos'] === 1 && $vp[20]['capa_id'] === 501 && $vp[20]['capa_cor'] === 'a0a0a0' && $vp[21]['fotos'] === 0 && $vp[21]['capa_id'] === null);
$ok('vitrine: Precifica por produto', $vp[22]['precifica'] === ['led_module'] && $vp[20]['precifica'] === []);
$ok('vitrine: facetas por categoria/subcategoria e 7 kits', count($v['kits']) === 7 && in_array(['categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE', 'produtos' => 2, 'ativos' => 2], $v['facetas'], true));
// ---- permissões e erros ----
$ok('nível 40 → 403 na vitrine e na ficha', $erro(fn() => (new ProdutosLeitura($lm, $svc, 40))->vitrine())?->http === 403 && $erro(fn() => (new ProdutosLeitura($lm, $svc, 40))->fichaProduto(20))?->http === 403);
$ok('ficha: produto inexistente/excluído → 404 (regra do serviço)', $erro(fn() => $pl->fichaProduto(999))?->http === 404 && $erro(fn() => $pl->fichaProduto(11))?->http === 404);
$ok('ficha: sem product_id → 422', $erro(fn() => $pl->fichaProduto(0))?->http === 422);
$ok('nada foi gravado (auditoria vazia, valores intactos)', $repo->aud === [] && count($repo->v) === 2);

echo ($falhas ? '[ERRO]' : '[OK]  ') . " leitura (E1, ProdutosLeitura): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
