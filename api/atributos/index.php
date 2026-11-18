<?php
// /api/atributos/index.php (porte 18/11 de /api/equipamentos/atributos.php, atr/ponte-app 693c70c6) — API da web Equipamentos › Atributos (Fase B PREPARADA no clone, 31/10/2026; app-dshow DP-AUTO.37).
// ATRIBUTOS-WEB E1 (18/11): flags novas `panel_atributos_enabled` (leitura; mesma flag do painel React) e `panel_atributos_escrita`
// (escrita). Nesta etapa a API é SÓ LEITURA: ATR_ESCRITA_LIBERADA=false → todo POST e GET valores respondem 404 antes do CSRF,
// mesmo com a flag de escrita ligada. Rotas novas (nível ≥ 50): GET vitrine · GET ficha_produto&product_id= (ProdutosLeitura).
// Rota: /api/atributos/<rota> (PATH_INFO; a validação usa /api/atributos/index.php/<rota>) ou ?r=<rota>.
// SEMPRE atrás da flag do Dash `equipamentos.atributos` (ausente/desligada → 404, como se a rota não existisse). Sessão do Dash
// (SessionGate), CSRF em toda escrita, nível do usuário decidido aqui (regras em AtributosService). Uma rota por `r`:
//   GET  ?r=atributos[&q=&tipo=&inativos=1] · ?r=atributo&id= · ?r=unidades · ?r=grupos · ?r=valores&product_id=
//   GET  ?r=ficha&product_id= (Etapa 7: ficha APLICÁVEL — só a flag de leitura; produto validado no catálogo DSHOW_CATALOGO_SCHEMA)
//   Etapa 8 (módulo web): GET ?r=produtos&q= · ?r=categorias (80) · ?r=auditoria&entidade=&id= (80);
//        POST ?r=unidade (com id = editar) · ?r=unidade_ativa · ?r=grupo_ativo · ?r=valor_opcao_remover · ?r=ficha_revisar (V4/R1, nível 80)
//   POST ?r=atributo (cria/edita com versao) · ?r=atributo_ativo {id, ativo, versao} · ?r=opcao {atributo_id, rotulo}
//        ?r=opcao_ativa {id, ativo} · ?r=unidade {simbolo, nome, grandeza} · ?r=grupo (cria/edita, escopos, atributos) · ?r=valor
// Erros: 403 INSUFFICIENT_LEVEL · 404 NOT_FOUND · 409 CONFLICT/TYPE_CHANGE_BLOCKED · 422 VALIDATION_ERROR (meta.campos).
// Schema: DSHOW_EQUIPAMENTOS_SCHEMA (padrão = DSHOW_EQUIPAMENTOS, idêntico à produção; a validação usa DSHOW_EQUIPAMENTOS_VALIDACAO).
// Contrato da flag (Etapa 5, Bloco 3.2 — FICHA-PILOTO-ATRIBUTOS §1 e cabeçalho acima):
//   piloto desligado (flag ausente, OFF, fora da janela, outro ambiente, rollout 0) → 404 PARA TODOS, antes da sessão
//     (a rota "não existe": sem sessão também é 404, nunca 401 — não revela o recurso);
//   piloto ativo + sem sessão → 401 (política vigente do requireAuth);
//   piloto ativo + sessão fora do rollout/override OFF → 404 (para essa pessoa o recurso não existe);
//   autenticado sem nível → 403 (AtributosService);
//   flag ilegível (banco/consulta falhou: source=error) ou configuração defeituosa → 500 real, nunca 404.
//   Escrita e preenchimento (todo POST e GET ?r=valores) exigem também `equipamentos.atributos.escrita` (DP-F1.F1);
//   desligada → 404 nessas rotas.
declare(strict_types=1);

@ini_set('display_errors', '0');
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

/**
 * Conexão do módulo (ETAPA A, P2): usuário próprio `equipamentos_app` (SELECT/INSERT/UPDATE em DSHOW_EQUIPAMENTOS + SELECT coluna a coluna
 * no catálogo do app). Credencial em config/equipamentos_app.ini (root:www-data 0640, ao lado do db_connection.php), FORA do .env.
 * Sem o arquivo (validação): entrada EQUIPAMENTOS do config. Nenhum dos dois → exceção → 500 registrado; nunca cai na conexão do Dash.
 */
function eqConexao(): ?PDO
{
    $ini = __DIR__ . '/../../config/equipamentos_app.ini';
    if (!is_file($ini)) return getConnection('EQUIPAMENTOS');
    $c = (parse_ini_file($ini, true, INI_SCANNER_RAW) ?: [])['client'] ?? [];
    $t = static fn($v): string => trim((string) $v, " \t\"'");
    if ($t($c['user'] ?? '') === '') throw new RuntimeException('equipamentos_app.ini sem usuário');
    $dsn = 'mysql:host=' . ($t($c['host'] ?? '') ?: '127.0.0.1') . ';port=' . ((int) ($c['port'] ?? 3306) ?: 3306) . ';dbname=DSHOW_EQUIPAMENTOS;charset=utf8mb4';
    return new PDO($dsn, $t($c['user']), $t($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_TIMEOUT => 10]);
}
require_once __DIR__ . '/../feature-flags/resolver.php';
require_once __DIR__ . '/AtributosRepo.php';
require_once __DIR__ . '/CatalogoPdo.php';
require_once __DIR__ . '/ProdutosLeitura.php';
require_once __DIR__ . '/MiniaturasDir.php';
require_once __DIR__ . '/LeituraVitrinePdo.php';
require_once __DIR__ . '/KitsService.php';
require_once __DIR__ . '/SugestoesService.php';
require_once __DIR__ . '/Permissoes.php';

// ATRIBUTOS-WEB (18/11): rota por PATH_INFO (/api/atributos/<rota>, padrão do Bling); ?r=<rota> segue aceito (compatível com o ramo de origem).
// Conexão PRÓPRIA "EQUIPAMENTOS" (usuário dedicado equipamentos_app: SELECT/INSERT/UPDATE no DSHOW_EQUIPAMENTOS + SELECT coluna a coluna
// no catálogo do app), lida do config compartilhado (config/db_connection.php, fora do Git). As flags continuam na conexão do Dash.
function eqRota(): string {
    $p = trim((string) ($_SERVER['PATH_INFO'] ?? ''), '/');
    if ($p !== '') return preg_match('/^[a-z_]{1,40}$/', $p) ? $p : '__invalida__';
    return (string) ($_GET['r'] ?? '');
}

const EQ_FLAG = 'panel_atributos_enabled';           // E1: mesma chave do painel (ligada só para o usuário 75 em produção)
const EQ_FLAG_ESCRITA = 'panel_atributos_escrita';   // escrita (E3); desligada
const ATR_ESCRITA_LIBERADA = true;                   // missão 18/11: escrita existe, atrás da flag panel_atributos_escrita + CSRF + nível no serviço
// Fontes do resolvedor que significam "piloto desligado para todos" (→ 404 antes da sessão).
// ATR-VAL-E1 (18/11): 'rollout_excluded' SAIU desta lista. Sem identidade, rollout 0 + override por usuário (o padrão "ligada só para o 75")
// resolve como rollout_excluded e escondia a rota de TODOS, inclusive de quem tem override. O rollout é decidido depois da sessão (passo 3).
const EQ_DESLIGADO = ['not_found', 'disabled', 'not_started', 'expired', 'environment_mismatch'];

/** Decide pela fonte do resolvedor: erro de leitura nunca vira ausência. */
function eqFlagOuFalha(array $f): bool {
    $src = (string) ($f['source'] ?? 'error');
    if ($src === 'error') {
        error_log('[atributos] flag ilegível (' . (string) ($f['key'] ?? '?') . ')');
        ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Configuração do recurso indisponível.']);
    }
    return ($f['enabled'] ?? false) === true;
}

CorsPolicy::apply();
SessionGate::start();

try {
    $pdo = getConnection('DSHOWDASH');
    $resolver = new FeatureFlagResolver($pdo);
    // 1) antes da sessão: desligado para todos → 404 (a rota não existe)
    $pre = $resolver->resolve(EQ_FLAG, null);
    eqFlagOuFalha($pre);
    if (in_array((string) $pre['source'], EQ_DESLIGADO, true)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
} catch (Throwable $e) {
    error_log('[atributos] ' . get_class($e) . ': ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Erro interno.']);
}

// 2) piloto ativo: política de autenticação vigente (401)
$user = AuthHelpers::requireAuth();

try {
    // 3) a pessoa está no piloto? (rollout/override) — fora → 404 só para ela
    if (!eqFlagOuFalha($resolver->resolve(EQ_FLAG, (int) ($user['id'] ?? 0)))) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
    $metodoReq = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $rReq = eqRota();
    if ($metodoReq !== 'GET' && $metodoReq !== 'HEAD') {
        if (!ATR_ESCRITA_LIBERADA) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);   // E1: escrita não existe nesta etapa
    }
    if ($rReq === 'valores' && !ATR_ESCRITA_LIBERADA) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
    if ($metodoReq === 'POST' || $rReq === 'valores') {
        if (!eqFlagOuFalha($resolver->resolve(EQ_FLAG_ESCRITA, (int) ($user['id'] ?? 0)))) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
    }
    // 4) CSRF em toda escrita, depois das flags (escrita desligada responde 404 sem revelar a rota)
    AuthHelpers::requireCsrfForWrite();
    $pdoEq = eqConexao();   // credencial própria (P2) ou entrada EQUIPAMENTOS do config; nunca cai na conexão do Dash
    $schemaEq = (string) (getenv('DSHOW_EQUIPAMENTOS_SCHEMA') ?: 'DSHOW_EQUIPAMENTOS');
    $schemaCat = (string) (getenv('DSHOW_CATALOGO_SCHEMA') ?: 'APP_DSHOW');
    $nivel = (int) ($user['level'] ?? 0);
    $quem = (string) ($user['email'] ?: ('usuario:' . ($user['id'] ?? '?')));
    $repo = new AtributosRepoPdo($pdoEq, $schemaEq);
    $catalogo = new CatalogoPdo($pdoEq, $schemaCat);
    // Decisão do Jhony (18/11): nível ≥ 80 em geral só PREENCHE; administrar o catálogo = usuário 75 ou permissão explícita (UARPS 'allow').
    $administra = AtributosPermissoes::administra((int) ($user['id'] ?? 0), $nivel,
        method_exists('UARPSGate', 'checkTrigger') ? static fn(int $u, string $t) => UARPSGate::checkTrigger($u, $t) : null);
    $svc = new AtributosService($repo, $nivel, $quem, $catalogo, $administra);
    $leitura = fn() => new ProdutosLeitura(new LeituraVitrinePdo($pdoEq, $schemaEq, $schemaCat), $repo, $nivel, atrDirMiniaturas(),   // P4: env (validação/sobreposição) ou padrão fixo; sem pasta → cor média
        ATR_ESCRITA_LIBERADA && eqFlagOuFalha($resolver->resolve(EQ_FLAG_ESCRITA, (int) ($user['id'] ?? 0))), $administra);
    $kits = fn() => new KitsService($repo, $nivel, $quem, $catalogo, $administra);
    $sugestoes = fn() => new SugestoesService($repo, $svc, $administra ? $kits() : null, $nivel, $quem);
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $r = eqRota();
    // Miniatura (A6): resposta binária com cache privado e ETag; nunca expõe caminho nem storage_key. Sem arquivo → 404.
    if ($metodo === 'GET' && $r === 'foto') {
        $f = $leitura()->arquivoMiniatura((int) ($_GET['id'] ?? 0), (int) ($_GET['t'] ?? 480));
        if ($f === null) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
        header('Cache-Control: private, max-age=86400'); header('ETag: ' . $f['etag']); header('X-Content-Type-Options: nosniff');
        if (trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $f['etag']) { http_response_code(304); exit; }
        header('Content-Type: image/jpeg'); header('Content-Length: ' . filesize($f['caminho']));
        readfile($f['caminho']); exit;
    }
    $corpo = [];
    if ($metodo === 'POST') {
        $raw = file_get_contents('php://input');
        $corpo = $raw === '' || $raw === false ? [] : json_decode($raw, true);
        if (!is_array($corpo)) ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400);
    }
    $out = match ("$metodo $r") {
        // ---- leitura (nível ≥ 50) ----
        'GET visao_geral' => $leitura()->visaoGeral(),
        'GET vitrine' => $leitura()->vitrine(),
        'GET ficha_produto' => $leitura()->fichaProduto((int) ($_GET['product_id'] ?? 0)),
        'GET historico_produto' => $leitura()->historicoProduto((int) ($_GET['product_id'] ?? 0)),
        'GET kits' => $leitura()->kits(),
        'GET kit' => $leitura()->kit((int) ($_GET['id'] ?? 0)),
        'GET dicionario' => $leitura()->dicionario(),
        'GET unidades' => $leitura()->unidadesComUso(),
        'GET conferencia' => $leitura()->conferencia(),
        'GET atributos' => $svc->listar($_GET),
        'GET atributo' => $svc->detalhe((int) ($_GET['id'] ?? 0)),
        'GET grupos' => $svc->grupos(),
        'GET valores' => $svc->valoresDoProduto((int) ($_GET['product_id'] ?? 0)),
        'GET ficha' => $svc->ficha((int) ($_GET['product_id'] ?? 0), eqFlagOuFalha($resolver->resolve(EQ_FLAG_ESCRITA, (int) ($user['id'] ?? 0)))),
        'GET produtos' => $svc->buscarProdutos(isset($_GET['q']) ? (string) $_GET['q'] : null),
        'GET categorias' => $svc->categoriasCatalogo(),
        'GET auditoria' => $svc->auditoria((string) ($_GET['entidade'] ?? ''), (string) ($_GET['id'] ?? '')),
        // ---- valores (nível ≥ 80, A1) ----
        'POST valor' => $svc->gravarValor($corpo),
        'POST valor_limpar' => $svc->limparValor($corpo),
        'POST valor_unidade' => $svc->converterUnidade($corpo),
        'POST valor_opcao_remover' => $svc->removerOpcaoDoValor($corpo),
        // ---- vínculos e kits (nível ≥ 80) ----
        'POST kit' => $kits()->salvarKit($corpo),
        'POST kit_duplicar' => $kits()->duplicarKit($corpo),
        'POST kit_ativo' => $kits()->definirAtivo($corpo),
        'POST kit_itens' => $kits()->definirItens($corpo),
        'POST kit_escopos' => $kits()->definirEscopos($corpo),
        'POST kit_produtos' => $kits()->definirProdutosDoKit($corpo),
        'POST produto_kit' => $kits()->definirKitDoProduto($corpo),
        'POST produto_atributo' => $kits()->definirAjuste($corpo),
        'POST massa_previa' => $kits()->previaMassa($corpo),
        'POST massa_aplicar' => $kits()->aplicarMassa($corpo),
        // ---- dicionário e unidades (nível ≥ 80) ----
        'POST atributo' => $svc->salvarAtributo($corpo),
        'POST atributo_ativo' => $svc->definirAtivo((int) ($corpo['id'] ?? 0), !empty($corpo['ativo']), (int) ($corpo['versao'] ?? 0), isset($corpo['motivo']) ? (string) $corpo['motivo'] : null),
        'POST atributo_unidades' => $svc->definirUnidadesPermitidas($corpo),
        'POST opcao' => $svc->adicionarOpcao((int) ($corpo['atributo_id'] ?? 0), $corpo['rotulo'] ?? null),
        'POST opcao_renomear' => $svc->renomearOpcao((int) ($corpo['id'] ?? 0), $corpo['rotulo'] ?? null, $corpo['rotulo_atual'] ?? null),
        'POST opcao_reordenar' => $svc->reordenarOpcoes((int) ($corpo['atributo_id'] ?? 0), $corpo['ordem'] ?? null, $corpo['ordem_antes'] ?? null),
        'POST opcao_ativa' => $svc->definirOpcaoAtiva((int) ($corpo['id'] ?? 0), !empty($corpo['ativo'])),
        'POST unidade' => isset($corpo['id']) ? $svc->salvarUnidade($corpo) : $svc->criarUnidade($corpo),
        'POST unidade_ativa' => $svc->definirUnidadeAtiva((int) ($corpo['id'] ?? 0), !empty($corpo['ativo'])),
        // ---- sugestões e conferência (nível ≥ 80) ----
        'POST sugestao' => $sugestoes()->decidir($corpo),
        'POST sugestoes_lote' => $sugestoes()->aceitarLote($corpo),
        // ---- legado da etapa 8 (mantidas) ----
        'POST grupo' => $svc->salvarGrupo($corpo),
        'POST grupo_ativo' => $svc->definirGrupoAtivo((int) ($corpo['id'] ?? 0), !empty($corpo['ativo']), (int) ($corpo['versao'] ?? 0)),
        'POST ficha_revisar' => $svc->revisarFicha($corpo),
        default => null,
    };
    if ($out === null) ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400);
    ApiResponse::success($out);
} catch (CatalogoIndisponivel $e) {
    ApiResponse::error('CATALOG_UNAVAILABLE', 503, ['message' => 'Catálogo de produtos indisponível.']);
} catch (AtributosErro $e) {
    ApiResponse::error($e->codigo, $e->http, ['message' => $e->getMessage()] + ($e->campos ? ['campos' => $e->campos] : []));
} catch (Throwable $e) {
    error_log('[atributos] ' . get_class($e) . ': ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Erro interno.']);
}
