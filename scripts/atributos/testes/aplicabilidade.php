<?php
// ATRIBUTOS-WEB — testes da REGRA DA FICHA (missão §9; Aplicabilidade.php), sem banco.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/Aplicabilidade.php';
$falhas = 0; $n = 0;
$ok = function (string $nome, bool $c) use (&$falhas, &$n): void { $n++; if (!$c) { $falhas++; echo "[ERRO] $nome\n"; } };
$a = fn(int $id, int $ativo = 1, ?int $u = null, ?string $imp = null) => ['id' => $id, 'codigo' => "a$id", 'rotulo' => "A$id", 'tipo' => 'numero', 'ativo' => $ativo, 'unidade_id' => $u, 'importancia_padrao' => $imp];
$it = fn(int $aid, int $pos, int $obr = 0, int $vis = 1, int $dest = 0, ?string $imp = null, ?int $u = null) => ['atributo_id' => $aid, 'posicao' => $pos, 'obrigatorio' => $obr, 'visivel' => $vis, 'destaque' => $dest, 'importancia' => $imp, 'unidade_id' => $u, 'legado_id' => null];
$grupos = [
    1 => ['id' => 1, 'nome' => 'Base (todos)', 'ativo' => 1, 'aplica_a_todos' => 1],
    2 => ['id' => 2, 'nome' => 'Cabos', 'ativo' => 1, 'aplica_a_todos' => 0],
    3 => ['id' => 3, 'nome' => 'Extra direto', 'ativo' => 1, 'aplica_a_todos' => 0],
    4 => ['id' => 4, 'nome' => 'Desligado', 'ativo' => 0, 'aplica_a_todos' => 1],
    5 => ['id' => 5, 'nome' => 'Abrangente LED', 'ativo' => 1, 'aplica_a_todos' => 0],
];
$escopos = [['grupo_id' => 2, 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE'], ['grupo_id' => 5, 'categoria' => 'LED_PANEL', 'subcategoria' => '']];
$itens = [
    1 => [$it(18, 1, 0, 1, 0, 'importante'), $it(19, 2)],
    2 => [$it(30, 2, 1, 0, 1, null, 7), $it(18, 9, 1), $it(31, 1)],
    3 => [$it(40, 1)],
    4 => [$it(50, 1)],
    5 => [$it(60, 1, 0, 1, 0, 'basico'), $it(61, 2)],
];
$atributos = [18 => $a(18, 1, 3), 19 => $a(19), 30 => $a(30, 1, 5), 31 => $a(31, 0), 40 => $a(40), 50 => $a(50), 60 => $a(60), 61 => $a(61, 1, null, 'opcional'), 70 => $a(70, 1, 9, 'obrigatorio'), 71 => $a(71, 0)];
$m = new RetratoModelo($grupos, $escopos, $itens, [100 => [3]], [100 => [61 => ['modo' => 'excluir', 'motivo' => 'não tem', 'unidade_id' => null, 'posicao' => null], 70 => ['modo' => 'incluir', 'unidade_id' => 11, 'posicao' => 1, 'motivo' => null], 71 => ['modo' => 'incluir', 'unidade_id' => null, 'posicao' => 2, 'motivo' => null], 30 => ['modo' => 'ajustar', 'unidade_id' => 12, 'posicao' => null, 'motivo' => null]]], $atributos);
$cabo = ['id' => 100, 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE'];
$outro = ['id' => 200, 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE'];
$serv = ['id' => 300, 'categoria' => 'SERVICE', 'subcategoria' => 'INSTALLATION'];

$k = Aplicabilidade::kits($m, $cabo);
$ok('kits: escopo da subcategoria + escopo da categoria inteira + aplica a todos + direto; ordem (nome, id); inativo fora', array_keys($k) === [5, 1, 2, 3]);
$ok('kits: motivo de cada um', $k[2]['motivos'][0]['tipo'] === 'escopo' && $k[1]['motivos'][0]['tipo'] === 'todos' && $k[3]['motivos'][0]['tipo'] === 'direto' && $k[5]['motivos'][0]['subcategoria'] === '');
$f = Aplicabilidade::ficha($m, $cabo, $exc);
$ok('ficha: atributos ativos dos kits + avulso ativo − exclusão', array_keys($f) == [60, 18, 19, 30, 40, 70] || (count($f) === 6 && !isset($f[61], $f[31], $f[50], $f[71])));
$ok('exclusão do produto some só nele (61 excluído no 100, presente no 200)', !isset($f[61]) && isset($exc[61]) && $exc[61]['motivo'] === 'não tem' && isset(Aplicabilidade::ficha($m, $outro)[61]));
$ok('atributo inativo nunca entra (31 no kit, 71 avulso)', !isset($f[31]) && !isset($f[71]));
$ok('kit inativo não vale, mesmo "aplica a todos"', !isset($f[50]));
$ok('em dois kits: aparece uma vez; 1º kit (ordem nome) define grupo e posição', $f[18]['grupo_id'] === 1 && $f[18]['posicao'] === 1 && count($f[18]['origens']) === 2);
$ok('em dois kits: obrigatório = OU; visível = OU', $f[18]['obrigatorio'] === true && $f[18]['visivel'] === true);
$ok('importância: 1º item que tem; senão a padrão do atributo', $f[18]['importancia'] === 'importante' && $f[70]['importancia'] === 'obrigatorio' && $f[19]['importancia'] === null);
$ok('avulso: grupo virtual 0, depois dos kits', $f[70]['grupo_id'] === Aplicabilidade::AVULSO && array_key_last($f) === 70);
$ok('kit direto aplicado', isset($f[40]) && $f[40]['origens'][0]['motivos'][0]['tipo'] === 'direto');
$ok('produto sem kit direto não recebe o kit direto do outro', !isset(Aplicabilidade::ficha($m, $outro)[40]));
$ok('serviço: só o "aplica a todos"', array_keys(Aplicabilidade::ficha($m, $serv)) === [18, 19]);
// unidade efetiva
$ok('unidade: valor vence tudo', Aplicabilidade::unidadeEfetiva($f[30], 99) === 99);
$ok('unidade: produto (ajustar) vence kit e padrão', Aplicabilidade::unidadeEfetiva($f[30], null) === 12);
$ok('unidade: kit vence padrão', Aplicabilidade::unidadeEfetiva(Aplicabilidade::ficha($m, $outro)[30], null) === 7);
$ok('unidade: padrão do atributo', Aplicabilidade::unidadeEfetiva($f[18], null) === 3);
$ok('unidade: avulso com unidade do produto', Aplicabilidade::unidadeEfetiva($f[70], null) === 11);
$ok('unidade: nenhuma → null', Aplicabilidade::unidadeEfetiva($f[19], null) === null);
// completude
$c = Aplicabilidade::completude($f, [18 => 'informado', 30 => 'desconhecido', 70 => 'nao_se_aplica', 60 => 'informado']);
$ok('completude: "desconhecido" não conta, "não se aplica" conta', $c['geral'] === ['feitos' => 3, 'total' => 6]);
$ok('completude essencial = obrigatórios + importantes (18 obr., 30 obr., 70 obr.)', $c['essencial'] === ['feitos' => 2, 'total' => 3]);
$ok('completude completo = + básicos (60)', $c['completo'] === ['feitos' => 3, 'total' => 4]);
$ok('obrigatórios vazios (30 está "desconhecido")', $c['obrigatorios_vazios'] === [30]);
$ok('importância do legado → enum', Aplicabilidade::IMPORTANCIA_DO_LEGADO['Campos Importantes'] === 'importante' && count(Aplicabilidade::IMPORTANCIA_DO_LEGADO) === 6);

echo ($falhas ? '[ERRO]' : '[OK]  ') . " aplicabilidade (§9): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
