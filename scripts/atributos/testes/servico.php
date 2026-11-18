<?php
// Equipamentos › Atributos — testes das REGRAS (AtributosService) com repositório EM MEMÓRIA (sem banco). Uso: php servico.php (exit 1 em falha).
declare(strict_types=1);
require_once __DIR__ . '/_memoria.php';

$falhas = 0; $n = 0;
$ok = function (string $nome, bool $c) use (&$falhas, &$n): void { $n++; if (!$c) { $falhas++; echo "[ERRO] $nome\n"; } };
$erro = function (callable $f): ?AtributosErro { try { $f(); } catch (AtributosErro $e) { return $e; } return null; };

$repo = new RepoMemoria();
$cat = new CatalogoMemoria();
$adm = new AtributosService($repo, 80, 'gestao@exemplo.invalid', $cat);
$ven = new AtributosService($repo, 50, 'vendedor@exemplo.invalid', $cat);
$bai = new AtributosService($repo, 40, 'baixo@exemplo.invalid', $cat);
// ATRIBUTOS-WEB 18/11: preencher valores exige nível ≥ 80 (NIVEL_VALORES). O preenchedor dos casos de valor é nível 80; o nível 50 só consulta.
$pre = new AtributosService($repo, 80, 'preenche@exemplo.invalid', $cat);

$ok('nível 40 não consulta', $erro(fn() => $bai->listar([]))?->http === 403);
$ok('nível 50 consulta, não administra', $ven->listar([])['pode_administrar'] === false && $erro(fn() => $ven->salvarAtributo(['rotulo' => 'X', 'codigo' => 'x_1', 'tipo' => 'texto']))?->http === 403);
$e = $erro(fn() => $adm->salvarAtributo(['rotulo' => '', 'codigo' => 'Inválido', 'tipo' => 'cor']));
$ok('validação: rótulo, código e tipo', $e?->http === 422 && $e->campos === ['rotulo', 'codigo', 'tipo']);
$mm = $repo->criarUnidade('mm', 'milímetro', 'comprimento');
$pitch = $adm->salvarAtributo(['rotulo' => 'Pitch', 'codigo' => 'pitch_mm', 'tipo' => 'numero', 'casas' => 2, 'minimo' => 0.5, 'maximo' => 20, 'unidade_id' => $mm])['atributo'];
$ok('cria atributo número com unidade', $pitch['tipo'] === 'numero' && (int) $pitch['unidade_id'] === $mm && $pitch['versao'] === 1);
$ok('código duplicado → 422', $erro(fn() => $adm->salvarAtributo(['rotulo' => 'Outro', 'codigo' => 'pitch_mm', 'tipo' => 'texto']))?->campos === ['codigo']);
$uso = $adm->salvarAtributo(['rotulo' => 'Uso', 'codigo' => 'uso', 'tipo' => 'opcao'])['atributo'];
$adm->adicionarOpcao($uso['id'], 'Indoor');
$ops = $adm->adicionarOpcao($uso['id'], 'Outdoor')['opcoes'];
$ok('opções criadas em ordem', array_column($ops, 'rotulo') === ['Indoor', 'Outdoor']);
$ok('opção repetida (maiúsculas) → 422', $erro(fn() => $adm->adicionarOpcao($uso['id'], 'indoor'))?->http === 422);
$ok('opção em atributo não-lista → 422', $erro(fn() => $adm->adicionarOpcao($pitch['id'], 'X'))?->http === 422);
$g = $adm->salvarGrupo(['nome' => 'Módulos LED', 'escopos' => [['categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE']], 'atributos' => [['atributo_id' => $pitch['id'], 'obrigatorio' => true], ['atributo_id' => $uso['id']]]])['grupo'];
$ok('grupo com escopo e atributos (ordem, obrigatório)', count($g['escopos']) === 1 && $g['atributos'][0]['obrigatorio'] === 1 && $g['atributos'][1]['posicao'] === 1);
$ok('grupo com escopo inválido → 422', $erro(fn() => $adm->salvarGrupo(['nome' => 'X', 'escopos' => [['categoria' => 'led painel']]]))?->campos === ['escopos']);
// valores
$ok('número com unidade no texto → 422 (nunca adivinha)', $erro(fn() => $pre->gravarValor(['product_id' => 7, 'atributo_id' => $pitch['id'], 'valor' => '2,5 mm']))?->campos === ['valor']);
$ok('número fora dos limites → 422', $erro(fn() => $pre->gravarValor(['product_id' => 7, 'atributo_id' => $pitch['id'], 'valor' => '25']))?->http === 422);
$v = $pre->gravarValor(['product_id' => 7, 'atributo_id' => $pitch['id'], 'valor' => '2.555'])['valor'];
$ok('vendedor preenche número (arredonda às casas; V5 Lote 3/P2-01: decimal como TEXTO)', $v['valor_num'] === '2.56' && $v['estado'] === 'informado' && $v['versao'] === 1);
$ok('edição com versão antiga → 409', $erro(fn() => $pre->gravarValor(['product_id' => 7, 'atributo_id' => $pitch['id'], 'valor' => '3', 'versao' => 0]))?->http === 409);
$v2 = $pre->gravarValor(['product_id' => 7, 'atributo_id' => $pitch['id'], 'valor' => '3', 'versao' => 1])['valor'];
$ok('edição com a versão certa (P2-01: texto com as casas)', $v2['valor_num'] === '3.00' && $v2['versao'] === 2);
$ok('não se aplica sem valor', $pre->gravarValor(['product_id' => 8, 'atributo_id' => $pitch['id'], 'estado' => 'nao_se_aplica'])['valor']['estado'] === 'nao_se_aplica');
$adm->definirOpcaoAtiva($ops[1]['id'], false);
$ok('opção desativada não pode ser escolhida', $erro(fn() => $pre->gravarValor(['product_id' => 7, 'atributo_id' => $uso['id'], 'valor' => $ops[1]['id']]))?->http === 422);
$ok('opção ativa grava o ID', $pre->gravarValor(['product_id' => 7, 'atributo_id' => $uso['id'], 'valor' => $ops[0]['id']])['valor']['opcao_id'] === $ops[0]['id']);
$ok('mudar tipo com valores → 409', $erro(fn() => $adm->salvarAtributo(['id' => $pitch['id'], 'tipo' => 'texto', 'versao' => 1]))?->codigo === 'TYPE_CHANGE_BLOCKED');
$ok('editar atributo com versão antiga → 409', $erro(fn() => $adm->salvarAtributo(['id' => $pitch['id'], 'rotulo' => 'Pitch (mm)', 'versao' => 9]))?->codigo === 'CONFLICT');
$ok('desativar (não apaga) e listar só ativos', $adm->definirAtivo($pitch['id'], false, 1, 'teste')['atributo']['ativo'] === 0 && count($ven->listar([])['atributos']) === 1 && count($ven->listar(['inativos' => '1'])['atributos']) === 2);
$ok('atributo desativado não recebe valor', $erro(fn() => $pre->gravarValor(['product_id' => 8, 'atributo_id' => $pitch['id'], 'valor' => '1']))?->http === 422);
// ---- Etapa 7: catálogo, ficha aplicável, transação gravação + auditoria ------------------------------------------------------
$adm->definirAtivo($pitch['id'], true, 2, 'teste');
$ok('produto inexistente → 422 PRODUCT_NOT_FOUND', $erro(fn() => $pre->gravarValor(['product_id' => 999, 'atributo_id' => $pitch['id'], 'valor' => '1']))?->codigo === 'PRODUCT_NOT_FOUND');
$ok('produto excluído → 422 PRODUCT_NOT_FOUND', $erro(fn() => $pre->gravarValor(['product_id' => 11, 'atributo_id' => $pitch['id'], 'valor' => '1']))?->codigo === 'PRODUCT_NOT_FOUND');
$ok('produto inativo → 422 PRODUCT_INACTIVE', $erro(fn() => $pre->gravarValor(['product_id' => 9, 'atributo_id' => $pitch['id'], 'valor' => '1']))?->codigo === 'PRODUCT_INACTIVE');
$ok('atributo fora da ficha (serviço) → 422 ATTRIBUTE_NOT_APPLICABLE', $erro(fn() => $pre->gravarValor(['product_id' => 10, 'atributo_id' => $pitch['id'], 'valor' => '1']))?->codigo === 'ATTRIBUTE_NOT_APPLICABLE');
$cat->fora = true;
$ok('catálogo ilegível → 503 CATALOG_UNAVAILABLE (nunca "não existe")', $erro(fn() => $pre->gravarValor(['product_id' => 7, 'atributo_id' => $pitch['id'], 'valor' => '1']))?->http === 503 && $erro(fn() => $ven->ficha(7, true))?->codigo === 'CATALOG_UNAVAILABLE');
$cat->fora = false;
$ok('sem catálogo configurado → 503', $erro(fn() => (new AtributosService($repo, 50, 'x'))->ficha(7, true))?->http === 503);
$f7 = $ven->ficha(7, true);
$at7 = array_column($f7['grupos'][0]['atributos'], null, 'codigo');
$ok('ficha: grupo do escopo com pitch (obrigatório, unidade) e uso (opções)', count($f7['grupos']) === 1 && $at7['pitch_mm']['obrigatorio'] === true && $at7['pitch_mm']['tipo'] === 'numero' && count($at7['uso']['opcoes']) === 2);
$ok('ficha: valor informado do produto 7', $at7['pitch_mm']['valor']['estado'] === 'informado' && (float) $at7['pitch_mm']['valor']['valor_num'] === 3.0);
$ok('ficha: produto 8 com "não se aplica" e uso não informado', array_column($ven->ficha(8, true)['grupos'][0]['atributos'], null, 'codigo')['uso']['valor']['estado'] === 'nao_informado');
$ok('ficha: serviço sem grupo aplicável → grupos vazio', $ven->ficha(10, true)['grupos'] === []);
$ok('ficha: inativo é somente leitura', $ven->ficha(9, true)['somente_leitura'] === true);
$ok('ficha: escrita desligada → somente leitura', $ven->ficha(7, false)['pode_preencher'] === false);
$ok('ficha: inexistente/excluído → 404 PRODUCT_NOT_FOUND', $erro(fn() => $ven->ficha(999, true))?->http === 404 && $erro(fn() => $ven->ficha(11, true))?->http === 404);
$ok('ficha: nível 40 → 403', $erro(fn() => $bai->ficha(7, true))?->http === 403);
$zero = $adm->salvarAtributo(['rotulo' => 'Brilho extra', 'codigo' => 'brilho_extra', 'tipo' => 'numero'])['atributo'];
$liga = $adm->salvarAtributo(['rotulo' => 'Tem vidro', 'codigo' => 'tem_vidro', 'tipo' => 'booleano'])['atributo'];
$adm->salvarGrupo(['id' => $g['id'], 'versao' => 1, 'atributos' => [['atributo_id' => $pitch['id'], 'obrigatorio' => true], ['atributo_id' => $uso['id']], ['atributo_id' => $zero['id']], ['atributo_id' => $liga['id']]]]);
$pre->gravarValor(['product_id' => 8, 'atributo_id' => $zero['id'], 'valor' => '0']);
$pre->gravarValor(['product_id' => 8, 'atributo_id' => $liga['id'], 'valor' => 0]);
$a8 = array_column($ven->ficha(8, true)['grupos'][0]['atributos'], null, 'codigo');
$ok('zero e falso preservados; não informado distinto', $a8['brilho_extra']['valor']['valor_num'] === '0' && $a8['tem_vidro']['valor']['valor_bool'] === false && $a8['uso']['valor']['estado'] === 'nao_informado');
$ok('valores diferentes em dois produtos (sem compartilhar)', (float) $at7['pitch_mm']['valor']['valor_num'] === 3.0 && $a8['pitch_mm']['valor']['estado'] === 'nao_se_aplica');
$repo->vin[] = ['product_id' => 7, 'origem_ns' => 'exemplo', 'chave_antiga' => 'X1', 'estado' => 'ambigua'];
$ok('vínculo legado ambíguo aparece e não gera valor', $ven->ficha(7, true)['vinculos_legado'][0]['estado'] === 'ambigua');
$nAud = count($repo->aud); $nVal = count($repo->v); $nAtr = count($repo->a);
$repo->falharAuditoria = true;
$e1 = null; try { $pre->gravarValor(['product_id' => 7, 'atributo_id' => $zero['id'], 'valor' => '5']); } catch (Throwable $t) { $e1 = $t; }
$e2 = null; try { $adm->salvarAtributo(['rotulo' => 'Sem auditoria', 'codigo' => 'sem_aud', 'tipo' => 'texto']); } catch (Throwable $t) { $e2 = $t; }
$repo->falharAuditoria = false;
$ok('auditoria falha → gravação desfeita (valor e definição)', $e1 !== null && $e2 !== null && count($repo->v) === $nVal && count($repo->a) === $nAtr && count($repo->aud) === $nAud);
$ok('auditoria de toda escrita', count($repo->aud) >= 10 && $repo->aud[0][0] === 'gestao@exemplo.invalid');
// ---- Etapa 8: módulo web (edição, unidades, grupos, catálogo, autoridade D3.6, multiopção) ----------------------------------
$e = $erro(fn() => $adm->salvarAtributo(['id' => $pitch['id'], 'unidade_id' => '', 'versao' => $repo->a[$pitch['id']]['versao']]));
$ok('mudar unidade com valores sem motivo → 422 UNIT_CHANGE_REQUIRES_REASON', $e?->codigo === 'UNIT_CHANGE_REQUIRES_REASON' && $e->campos === ['motivo']);
$v0 = $repo->a[$pitch['id']]['versao'];
$ok('mudar unidade com valores COM motivo → grava, sem converter valores', $adm->salvarAtributo(['id' => $pitch['id'], 'unidade_id' => '', 'versao' => $v0, 'motivo' => 'padronização'])['atributo']['unidade_id'] === null && (float) $at7['pitch_mm']['valor']['valor_num'] === 3.0);
$ok('detalhe traz auditoria (gestão)', count($adm->detalhe($pitch['id'])['auditoria']) >= 1);
$cm = $repo->criarUnidade('cm', 'centímetro', 'comprimento');
$ok('editar unidade (nome) e o símbolo não muda', $adm->salvarUnidade(['id' => $cm, 'nome' => 'Centímetro'])['unidades'] && $erro(fn() => $adm->salvarUnidade(['id' => $cm, 'nome' => 'x', 'simbolo' => 'CM']))?->campos === ['simbolo']);
$ok('desativar unidade (não apaga)', array_column($adm->definirUnidadeAtiva($cm, false)['unidades'], 'ativo', 'id')[$cm] === 0);
$ok('unidade: nível 50 não administra', $erro(fn() => $ven->definirUnidadeAtiva($cm, true))?->http === 403);
$gs = $ven->grupos()['grupos'];
$ok('grupos mostram o impacto (produtos no escopo)', $gs[0]['produtos_no_escopo'] === 3);
$ok('desativar grupo: some da ficha, nada apagado', $adm->definirGrupoAtivo($g['id'], false, $repo->g[$g['id']]['versao'])['grupo']['ativo'] === 0 && $ven->ficha(7, true)['grupos'] === [] && count($ven->ficha(7, true)['valores_fora_da_ficha']) >= 1);
$adm->definirGrupoAtivo($g['id'], true, $repo->g[$g['id']]['versao']);
$ok('busca de produtos e categorias do catálogo', count($ven->buscarProdutos('módulo')['produtos']) >= 2 && count($adm->categoriasCatalogo()['categorias']) >= 2 && $erro(fn() => $ven->categoriasCatalogo())?->http === 403);
// autoridade D3.6
$ok('precifica_ref inválido → 422', $erro(fn() => $adm->salvarAtributo(['rotulo' => 'Pitch RDS', 'codigo' => 'pitch_rds', 'tipo' => 'numero', 'autoridade' => 'precifica', 'precifica_ref' => 'xyz.pitch']))?->campos === ['precifica_ref']);
$rds = $adm->salvarAtributo(['rotulo' => 'Pitch (Precifica)', 'codigo' => 'pitch_rds', 'tipo' => 'numero', 'autoridade' => 'precifica', 'precifica_ref' => 'led_module.pitch'])['atributo'];
$ok('mesmo campo do Precifica em 2 atributos → 422', $erro(fn() => $adm->salvarAtributo(['rotulo' => 'Outro', 'codigo' => 'pitch_rds2', 'tipo' => 'numero', 'precifica_ref' => 'led_module.pitch']))?->campos === ['precifica_ref']);
$adm->salvarGrupo(['id' => $g['id'], 'versao' => $repo->g[$g['id']]['versao'], 'atributos' => array_merge(array_map(fn($x) => ['atributo_id' => $x['atributo_id']], $repo->ga[$g['id']]), [['atributo_id' => $rds['id']]])]);
$cat->specs = [7 => ['led_module' => ['pitch' => '2.500000']]];
$fr = array_column($ven->ficha(7, true)['grupos'][0]['atributos'], null, 'codigo')['pitch_rds'];
$ok('ficha: atributo de autoridade Precifica mostra o valor do Precifica', $fr['autoridade'] === 'precifica' && $fr['valor']['estado'] === 'precifica' && $fr['valor']['valor_precifica'] === '2.500000');
$ok('POST valor em atributo do Precifica → 409 AUTHORITY_PRECIFICA', $erro(fn() => $pre->gravarValor(['product_id' => 7, 'atributo_id' => $rds['id'], 'valor' => '9']))?->codigo === 'AUTHORITY_PRECIFICA');
$cat->specs = [];
$ok('sem leitura da ficha do Precifica → "indisponível", sem erro', array_column($ven->ficha(7, true)['grupos'][0]['atributos'], null, 'codigo')['pitch_rds']['valor']['disponivel'] === false);
// multiopção: marcar, desmarcar com versão, remarcar
$cert = $adm->salvarAtributo(['rotulo' => 'Certificações', 'codigo' => 'certs', 'tipo' => 'multiopcao'])['atributo'];
$adm->adicionarOpcao($cert['id'], 'CE'); $oc = $adm->adicionarOpcao($cert['id'], 'FCC')['opcoes'];
$adm->salvarGrupo(['id' => $g['id'], 'versao' => $repo->g[$g['id']]['versao'], 'atributos' => array_merge(array_map(fn($x) => ['atributo_id' => $x['atributo_id']], $repo->ga[$g['id']]), [['atributo_id' => $cert['id']]])]);
$pre->gravarValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'valor' => $oc[0]['id']]);
$pre->gravarValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'valor' => $oc[1]['id']]);
$fc = array_column($ven->ficha(8, true)['grupos'][0]['atributos'], null, 'codigo')['certs']['valor'];
$ok('multiopção: 2 opções marcadas', count($fc['opcoes']) === 2);
$vcCert = AtributosService::versaoConjunto($repo->travarValores(8, (int) $cert['id']));   // DSHOW-034 (B): a tela manda a versão do conjunto
$ok('desmarcar com versão antiga → 409', $erro(fn() => $pre->removerOpcaoDoValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'opcao_id' => $oc[0]['id'], 'versao' => 99, 'versao_conjunto' => $vcCert]))?->http === 409);
$ok('desmarcar com versão de CONJUNTO antiga → 409; sem ela → 422', $erro(fn() => $pre->removerOpcaoDoValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'opcao_id' => $oc[0]['id'], 'versao' => $fc['opcoes_versao'][0]['versao'], 'versao_conjunto' => (string) ((int) $vcCert - 1)]))?->http === 409
    && $erro(fn() => $pre->removerOpcaoDoValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'opcao_id' => $oc[0]['id'], 'versao' => $fc['opcoes_versao'][0]['versao']]))?->http === 422);
$pre->removerOpcaoDoValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'opcao_id' => $oc[0]['id'], 'versao' => $fc['opcoes_versao'][0]['versao'], 'versao_conjunto' => $vcCert]);
$ok('desmarcar: fica 1 opção (a outra preservada na tabela)', count(array_column($ven->ficha(8, true)['grupos'][0]['atributos'], null, 'codigo')['certs']['valor']['opcoes']) === 1 && isset($repo->v["8:{$cert['id']}:{$oc[0]['id']}"]));
$pre->gravarValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'valor' => $oc[0]['id']]);
$ok('remarcar opção desmarcada sem versão (não sobrescreve valor vivo)', count(array_column($ven->ficha(8, true)['grupos'][0]['atributos'], null, 'codigo')['certs']['valor']['opcoes']) === 2);
$ok('auditoria por entidade (valor do produto 8)', count($adm->auditoria('valor', "8")['auditoria']) >= 3);
// ---- V4/R1 (EA-011): obrigatório contextual — rascunho permitido, REVISÃO só com obrigatórios resolvidos; vale até a próxima gravação
$cat->p[13] = ['id' => 13, 'nome' => 'Módulo C (fictício, R1)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$adm->salvarGrupo(['id' => $g['id'], 'versao' => $repo->g[$g['id']]['versao'], 'atributos' => array_map(fn($x) => ['atributo_id' => $x['atributo_id'], 'obrigatorio' => $x['atributo_id'] === $pitch['id']], $repo->ga[$g['id']])]);   // Pitch volta a ser obrigatório
$atrDe = function (array $f, int $aid): ?array { foreach ($f['grupos'] as $gg) foreach ($gg['atributos'] as $a) if ($a['atributo_id'] === $aid) return $a; return null; };
$f13 = $ven->ficha(13, true);
$ok('R1 ficha nova: completude explícita (obrigatório pendente) e sem revisão', $f13['completude']['completa'] === false && $f13['completude']['obrigatorios'] >= 1
    && in_array($pitch['id'], array_column($f13['completude']['pendentes'], 'atributo_id'), true) && $f13['revisao'] === null);
$ok('R1 pode_revisar só para nível 80 com escrita ligada', $f13['pode_revisar'] === false && $adm->ficha(13, true)['pode_revisar'] === true && $adm->ficha(13, false)['pode_revisar'] === false);
$e = $erro(fn() => $adm->revisarFicha(['product_id' => 13]));
$ok('R1 revisar ficha incompleta → 422 FICHA_INCOMPLETA com o obrigatório nos campos', $e?->http === 422 && $e?->codigo === 'FICHA_INCOMPLETA' && in_array('atributo_' . $pitch['id'], $e->campos, true));
$ok('R1 rascunho permitido: gravar outro atributo com o obrigatório vazio funciona', (fn() => $pre->gravarValor(['product_id' => 13, 'atributo_id' => $uso['id'], 'estado' => 'desconhecido']))() !== null);
$ok('R1 nível 50 não revisa (403)', $erro(fn() => $ven->revisarFicha(['product_id' => 13]))?->http === 403);
$nAud13 = count($repo->aud);
$pre->gravarValor(['product_id' => 13, 'atributo_id' => $pitch['id'], 'estado' => 'informado', 'valor' => '2.5']);
$r13 = $adm->revisarFicha(['product_id' => 13, 'motivo' => 'conferido com o datasheet (teste)']);
$ok('R1 revisão com obrigatórios resolvidos: registrada na auditoria, vigente, por quem', $r13['completude']['completa'] === true && $r13['revisao']['vigente'] === true
    && $r13['revisao']['por'] === 'gestao@exemplo.invalid' && count(array_filter(array_slice($repo->aud, $nAud13), fn($x) => $x[1] === 'revisar' && $x[2] === 'ficha' && $x[3] === '13')) === 1);
$v13 = $atrDe($ven->ficha(13, true), $pitch['id'])['valor'];
$pre->gravarValor(['product_id' => 13, 'atributo_id' => $pitch['id'], 'estado' => 'informado', 'valor' => '2.6', 'versao' => $v13['versao']]);
$ok('R1 gravação depois da revisão → revisão deixa de valer (vigente=false), histórico preservado', $ven->ficha(13, true)['revisao']['vigente'] === false);
$v13 = $atrDe($ven->ficha(13, true), $pitch['id'])['valor'];
$pre->gravarValor(['product_id' => 13, 'atributo_id' => $pitch['id'], 'estado' => 'nao_se_aplica', 'versao' => $v13['versao']]);
$ok('R1 "não se aplica" é decisão explícita: conta como resolvido', $ven->ficha(13, true)['completude']['completa'] === true);
$ok('R1 produto inativo não é revisado', $erro(fn() => $adm->revisarFicha(['product_id' => 9]))?->codigo === 'PRODUCT_INACTIVE');
$ok('R1 auditoria por entidade aceita "ficha"', count($adm->auditoria('ficha', '13')['auditoria']) === 1);
// ---- ATRIBUTOS-WEB 18/11: nível 80 para valores + BR-02 (unidades) ----------------------------------------------------------
$ok('NIVEL_VALORES = 80', AtributosService::NIVEL_VALORES === 80);
$ok('nível 50 NÃO grava valor (403)', $erro(fn() => $ven->gravarValor(['product_id' => 7, 'atributo_id' => $uso['id'], 'estado' => 'desconhecido']))?->http === 403);
$ok('nível 50 NÃO desmarca opção (403)', $erro(fn() => $ven->removerOpcaoDoValor(['product_id' => 8, 'atributo_id' => $cert['id'], 'opcao_id' => $oc[0]['id'], 'versao' => 1]))?->http === 403);
$ok('nível 50: ficha sem pode_preencher', $ven->ficha(7, true)['pode_preencher'] === false && $pre->ficha(7, true)['pode_preencher'] === true);
$u1 = $adm->criarUnidade(['simbolo' => 'nitBR', 'nome' => 'nit teste', 'grandeza' => 'luminância']);
$ok('BR-02 criar unidade: resposta com pode_administrar e id', $u1['pode_administrar'] === true && $u1['ja_existia'] === false && $u1['id'] > 0);
$nAudU = count($repo->aud);
$u2 = $adm->criarUnidade(['simbolo' => 'nitBR', 'nome' => 'nit teste', 'grandeza' => 'luminância']);
$ok('BR-02 repetir a criação = sucesso idempotente (mesmo id, sem nova auditoria)', $u2['ja_existia'] === true && $u2['id'] === $u1['id'] && count($repo->aud) === $nAudU);
$ok('BR-02 mesmo símbolo com outro nome → 422', $erro(fn() => $adm->criarUnidade(['simbolo' => 'nitBR', 'nome' => 'outro']))?->http === 422);
$ok('BR-02 editar sem mudança = sem_mudanca, sem auditoria', ($adm->salvarUnidade(['id' => $u1['id'], 'nome' => 'nit teste', 'grandeza' => 'luminância'])['sem_mudanca'] ?? false) === true && count($repo->aud) === $nAudU);
$ok('BR-02 ativar já ativa = sem_mudanca', ($adm->definirUnidadeAtiva($u1['id'], true)['sem_mudanca'] ?? false) === true && count($repo->aud) === $nAudU);
$ok('BR-02 listar unidades traz pode_administrar (50 = false)', $ven->unidades()['pode_administrar'] === false && $adm->unidades()['pode_administrar'] === true);
echo ($falhas ? '[ERRO]' : '[OK]  ') . " servico (equipamentos/atributos): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
