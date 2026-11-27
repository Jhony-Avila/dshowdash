<?php
// ERP novo (31/10/2026, Noite 2) — teste ESTÁTICO do SQL dos 5 pontos contra o catálogo real do `ds_prod` (ds_prod-colunas.json, só nomes):
// toda tabela citada existe; todo alias.coluna existe na tabela do alias (por consulta/método); nenhuma tabela ou enum do ERP ANTIGO/intermediário
// (português) sobrou. Sem banco, sem rede. Uso: php sql-novo.php (exit 1 em falha)
declare(strict_types=1);
$cat = json_decode((string)file_get_contents(__DIR__ . '/ds_prod-colunas.json'), true)['tabelas'];
$raiz = __DIR__ . '/../../..';
$falhas = []; $n = 0;
$blocos = [];
// camada de compatibilidade: cada define() é um bloco
$compat = (string)file_get_contents("$raiz/api/modules/panels/_erp-compat-novo.php");
foreach (preg_split("/define\\('/", $compat) as $i => $b) { if ($i > 0) { $blocos['compat:' . strtok($b, "'")] = $b; } }
// Koala: cada método é um bloco
// 26/11 (rebase, um componente por degrau): Koala e rodapé só entram quando os arquivos deles existirem neste degrau
$koala = is_file("$raiz/api/koala/repositories/RemoteErpRepositoryNovo.php") ? (string)file_get_contents("$raiz/api/koala/repositories/RemoteErpRepositoryNovo.php") : '';
$consts = '';
if (preg_match_all('/private const (CLI_COLS|CLI_JOIN) = "([^"]+)";/', $koala, $m)) { $consts = implode(' ', $m[2]); }
foreach (preg_split('/public function /', $koala) as $i => $b) { if ($i > 0) { $blocos['koala:' . strtok($b, '(')] = $b . (str_contains($b, 'self::CLI_') ? ' ' . $consts : ''); } }
// rodapé financeiro
$fin = (string)@file_get_contents("$raiz/api/status/financial.php");
$ini = strpos($fin, "erp_novo_ligado('rodape_financeiro')");
if ($ini !== false) { $blocos['rodape'] = substr($fin, $ini, (int)strpos($fin, '} else {', $ini) - $ini); }   // só o ramo do ERP novo, se existir
$reservadas = ['select', 'from', 'where', 'and', 'or', 'join', 'left', 'on', 'as', 'limit', 'order', 'by', 'group', 'not', 'exists', 'union', 'all', 'case', 'when', 'then', 'else', 'end', 'in', 'is', 'null', 'desc', 'asc', 'distinct'];
foreach ($blocos as $nome => $sql) {
    $alias = [];
    if (preg_match_all('/\b(?:FROM|JOIN)\s+`?([a-z][a-z_]+)`?(?:\s+(?:AS\s+)?([a-z][a-z0-9]{0,3}))?\b/i', $sql, $mm, PREG_SET_ORDER)) {
        foreach ($mm as $x) {
            $t = $x[1]; $n++;
            if (!isset($cat[$t])) { $falhas[] = "$nome: tabela inexistente no ds_prod: $t"; continue; }
            $a = strtolower($x[2] ?? '');
            if ($a !== '' && !in_array($a, $reservadas, true)) { $alias[$a] = $t; }
        }
    }
    if (preg_match_all('/\b([a-z][a-z0-9]{0,3})\.`?([a-z_][a-z0-9_]*)`?/', $sql, $cc, PREG_SET_ORDER)) {
        foreach ($cc as $x) {
            [$tudo, $a, $col] = $x;
            if (!isset($alias[$a])) { continue; }   // não é alias SQL (ex.: texto/PHP)
            $n++;
            if (!in_array($col, $cat[$alias[$a]], true)) { $falhas[] = "$nome: coluna inexistente: {$alias[$a]}.$col (alias $a)"; }
        }
    }
}
// nada do ERP antigo/intermediário (português) nos arquivos novos
$novo = $compat . $koala . $blocos['rodape'];
foreach (['orc_orcamento', 'ent_cliente', 'ent_entidade', 'ent_pessoa', 'ent_organizacao', 'ent_fornecedor', 'log_produto', 'sys_usuario', 'shr_contato', 'shr_endereco', 'fin_requisicao', 'fin_conta_receber', 'fin_dado_bancario', 'fin_chave_pix', 'fin_centro_custo', 'requisicoes'] as $velho) {
    $n++; if (preg_match('/\b' . $velho . '\b/', preg_replace('/^\s*\/\/.*$/m', '', $novo))) { $falhas[] = "nome do ERP antigo ainda no SQL novo: $velho"; }
}
foreach (["'PENDENTE'", "'GANHO'", "'PERDIDO'", "'EM_ANDAMENTO'", "'REEMBOLSO'", "'EM_ABERTO'", "'RECEBIDO'", "'ATUALIZADO'", "'PAGO'", "'PARCIALMENTE_PAGO'", "'CONVERTIDO'", "'pendente'"] as $enum) {
    $n++; if (str_contains(preg_replace('/^\s*\/\/.*$/m', '', $novo), $enum)) { $falhas[] = "enum em português no SQL novo: $enum"; }
}
if ($falhas) { echo "[ERRO] sql-novo: " . count($falhas) . " falha(s) em $n verificações:\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "[OK]   sql-novo: $n verificações (tabelas, alias.coluna, nomes e enums antigos) contra o catálogo real do ds_prod\n";
