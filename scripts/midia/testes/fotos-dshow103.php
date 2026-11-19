<?php
// DSHOW-103 (19/11, ACIMA_DIREITA) — proxy de fotos do Dash: os 3 P1 + secundárias A–D + alinhamento com o app ea77d74.
// FotosProxy::atender com dependências FALSAS que CONTAM: chamadas ao app (transporte), leituras do corpo, consultas de sessão.
// Nada de banco, sessão real, flag real, rede ou segredo real (arquivo temporário 0600 com valor sintético).
// Rodar: php scripts/midia/testes/fotos-dshow103.php
declare(strict_types=1);
foreach (['FotosAppCliente', 'FotosCanal', 'FotosPortas', 'FotosSessao', 'FotosProxy'] as $c) require_once __DIR__ . "/../../../api/midia/$c.php";
$n = 0; $f = 0;
$ok = function (string $nome, bool $c, string $x = '') use (&$n, &$f) { $n++; if (!$c) { $f++; echo "[ERRO] $nome" . ($x !== '' ? " · $x" : '') . "\n"; } };
$seg = tempnam(sys_get_temp_dir(), 'm103'); file_put_contents($seg, str_repeat('s', 40) . "\n"); chmod($seg, 0600);   // sintético
$CH = 'op-teste103-0123456789';
$JPG = "\xFF\xD8\xFF\xE0" . str_repeat('x', 100);
$rec = fn(string $op, array $x = []) => array_merge(['canal' => 'dash', 'chave' => $CH, 'confirmado_em' => '2026-11-19T12:00:00.000Z', 'desfecho' => 'aplicada', 'foto_id' => 812, 'operacao' => $op, 'produto_id' => 550, 'titular_user_id' => 75, 'versao_nova' => 8], $x);
$ok200 = fn(array $corpo, int $st = 200, array $extra = []) => ['status' => $st, 'corpo' => json_encode($corpo), 'tipo' => 'application/json', 'erro' => null] + $extra;

/** ambiente: contadores + flags/sessão/repositório/CSRF configuráveis; a resposta do app é dada por $app (fn(m, url) → resposta) */
final class Amb
{
    public int $app = 0; public int $corpo = 0; public int $sessao = 0; public int $repo = 0; public array $flagsLidas = []; public array $urls = [];
    public array $flags = ['panel_fotos_enabled' => ['enabled' => true, 'source' => 'global'], 'panel_fotos_escrita' => ['enabled' => true, 'source' => 'global']];
    public ?array $sess = ['user_id' => 75]; public string $token = 'tok-sessao-sintetico';
    public array $situacao = ['sessao_ativa' => true, 'usuario_ativo' => true]; public bool $repoFalha = false; public bool $csrf = true;
    public ?array $publicadores = [75]; public string $corpoBytes = '';
    /** @var Closure */ public $resp;
    public function deps(string $seg): FotosProxyDeps
    {
        $self = $this;
        $repo = new class($self) implements FotosSessaoRepositorio {
            public function __construct(private Amb $a) {}
            public function situacao(string $t, int $u): array { $this->a->repo++; $this->a->repoVisto = [$t, $u]; if ($this->a->repoFalha) throw new RuntimeException('banco fora'); return $this->a->situacao; }
        };
        $transporte = function (string $m, string $url, array $cab, string $c, int $t) use ($self) { $self->app++; $self->urls[] = $url; return ($self->resp)($m, $url, $c); };
        return new FotosProxyDeps(
            flag: function (string $k, ?int $uid) use ($self) { $self->flagsLidas[] = [$k, $uid]; return ['key' => $k] + ($self->flags[$k] ?? ['enabled' => false, 'source' => 'not_found']); },
            sessao: function () use ($self) { $self->sessao++; return $self->sess; },
            tokenSessao: fn() => $self->token,
            repo: $repo,
            csrf: fn() => $self->csrf,
            canal: fn(int $uid) => new FotosCanal(new FotosAppCliente(3100, $seg, $transporte), $uid),
            corpo: function (int $max) use ($self) { $self->corpo++; return substr($self->corpoBytes, 0, $max); },
            publicadores: $self->publicadores,
        );
    }
    public mixed $repoVisto = null;
}
$amb = function () use ($rec, $ok200): Amb { $a = new Amb(); $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'aplicada', 'recibo' => $rec('publicar')], 201); return $a; };
$req = function (Amb $a, string $metodo, array $get, array $cab = []) use ($seg, $CH): FotosResposta { return FotosProxy::atender($metodo, $get, $cab + ['chave' => $CH], $a->deps($seg)); };
$nada = fn(Amb $a) => $a->app === 0 && $a->corpo === 0;

// ── P1-1: flag EXCLUSIVA de fotos, OFF por padrão → 404, zero chamadas ao app, corpo nunca lido ─────────────────────────────────
foreach (['not_found', 'disabled', 'not_started', 'expired', 'environment_mismatch'] as $fonte) {
  $a = $amb(); $a->flags['panel_fotos_enabled'] = ['enabled' => false, 'source' => $fonte]; $a->corpoBytes = $JPG;
  $r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
  $ok("P1-1 flag de fotos $fonte → 404; 0 app, corpo NÃO lido, sessão NÃO consultada", $r->http === 404 && $r->codigo === 'NOT_FOUND' && $nada($a) && $a->sessao === 0 && $a->repo === 0, json_encode([$r->http, $a->app, $a->corpo, $a->sessao]));
}
$a = $amb(); unset($a->flags['panel_fotos_enabled']);   // flag inexistente no banco = padrão
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']);
$ok('P1-1 flag de fotos AUSENTE (padrão) → 404, 0 app', $r->http === 404 && $nada($a));
$a = $amb(); $a->flags = ['panel_atributos_enabled' => ['enabled' => true, 'source' => 'global'], 'panel_atributos_escrita' => ['enabled' => true, 'source' => 'global']];
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']);
$ok('P1-1 EXCLUSIVA: atributos ligada, fotos ausente → 404 (a flag de atributos não abre fotos)', $r->http === 404 && $nada($a) && !in_array('panel_atributos_enabled', array_column($a->flagsLidas, 0), true));
foreach (['GET' => ['r' => 'galeria', 'product_id' => '550'], 'POST' => ['r' => 'publicar', 'product_id' => '550']] as $met => $get) {
  // DSHOW-103 §1 (teste bloqueante): atributos LIGADA para o 75 + flag de fotos INVÁLIDA/ilegível + segredo sintético VÁLIDO presente → 404
  $a = $amb(); $a->flags = ['panel_atributos_enabled' => ['enabled' => true, 'source' => 'global'], 'panel_fotos_enabled' => ['enabled' => true, 'source' => 'error']]; $a->corpoBytes = $JPG;
  $r = $req($a, $met, $get, ['tamanho' => (string) strlen($JPG)]);
  $ok("P1-1 $met: flag de fotos ilegível/inválida (mesmo com enabled=true no lixo) = OFF → 404, 0 app, corpo não lido, com segredo válido presente", $r->http === 404 && $nada($a) && is_file($seg));
  $a = $amb(); $a->flags['panel_fotos_escrita'] = ['enabled' => true, 'source' => 'error']; $a->corpoBytes = $JPG;
  $r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
  if ($met === 'POST') $ok('P1-1 flag de ESCRITA ilegível = OFF → 404, corpo não lido', $r->http === 404 && $nada($a));
}
$a = $amb(); $a->flags['panel_fotos_enabled'] = ['enabled' => true, 'source' => 'rollout']; $a->flags['panel_fotos_enabled_pessoa'] = null;
$a->flags = ['panel_fotos_enabled' => ['enabled' => true, 'source' => 'global']];   // pessoa: mesma chave; escrita ausente
$a->corpoBytes = $JPG;
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('P1-1 POST com `panel_fotos_escrita` AUSENTE → 404, corpo não lido, 0 app', $r->http === 404 && $nada($a));
$a = $amb(); $pessoa = 0;
$a->flags = ['panel_fotos_enabled' => ['enabled' => true, 'source' => 'global'], 'panel_fotos_escrita' => ['enabled' => true, 'source' => 'global']];
$d = $a->deps($seg);
$dd = new FotosProxyDeps(function (string $k, ?int $uid) use ($a) { $a->flagsLidas[] = [$k, $uid]; return $uid === null ? ['enabled' => true, 'source' => 'rollout_no_identity'] : ['enabled' => false, 'source' => 'rollout_excluded']; },
  $d->sessao, $d->tokenSessao, $d->repo, $d->csrf, $d->canal, $d->corpo, $d->publicadores);
$r = FotosProxy::atender('GET', ['r' => 'galeria', 'product_id' => '550'], [], $dd);
$ok('P1-1 pessoa fora da flag de fotos → 404, 0 app', $r->http === 404 && $nada($a));
$a = $amb(); $a->csrf = false; $a->corpoBytes = $JPG;
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('P1-1 CSRF inválido → 403, corpo NÃO lido, 0 app', $r->http === 403 && $nada($a));
$a = $amb(); $a->publicadores = [546]; $a->corpoBytes = $JPG;
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('P1-1 não publicador → 403 recusada, corpo NÃO lido, 0 app', $r->http === 403 && $r->meta['desfecho'] === 'recusada' && $nada($a));
$a = $amb(); $a->corpoBytes = $JPG;
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) (FotosCanal::MAX_BYTES + 1)]);
$ok('P1-1 Content-Length > 15 MB → 413 antes de ler o corpo', $r->http === 413 && $nada($a));
$a = $amb(); $a->corpoBytes = $JPG;
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('P1-1 tudo ligado → lê o corpo UMA vez e chama o app UMA vez', $r->http === 201 && $a->corpo === 1 && $a->app === 1, json_encode([$r->http, $r->meta, $a->corpo, $a->app]));
$ok('P1-1 flags lidas = só as de fotos (global, pessoa, escrita)', array_column($a->flagsLidas, 0) === ['panel_fotos_enabled', 'panel_fotos_enabled', 'panel_fotos_escrita'] && $a->flagsLidas[1][1] === 75);

// ── P1-2: SESSÃO COMPLETA (SessionGate + sessão ativa + usuário ativo, repositório injetável) ──────────────────────────────────
$a = $amb(); $a->sess = null;
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']);
$ok('P1-2 sem sessão (SessionGate::validate null) → 401, 0 app, repositório não consultado', $r->http === 401 && $nada($a) && $a->repo === 0);
$a = $amb(); $a->situacao = ['sessao_ativa' => false, 'usuario_ativo' => true];
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']);
$ok('P1-2 sessão REVOGADA (is_active=0 / expirada) → 401 SESSION_REVOKED, 0 app', $r->http === 401 && $r->codigo === 'SESSION_REVOKED' && $nada($a));
$a = $amb(); $a->situacao = ['sessao_ativa' => true, 'usuario_ativo' => false]; $a->corpoBytes = $JPG;
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('P1-2 usuário DESATIVADO → 401 USER_DISABLED, corpo não lido, 0 app', $r->http === 401 && $r->codigo === 'USER_DISABLED' && $nada($a));
$a = $amb(); $a->repoFalha = true;
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']);
$ok('P1-2 conferência da sessão fora (banco) → 503, nada segue (fail-closed)', $r->http === 503 && $r->codigo === 'SESSION_CHECK_UNAVAILABLE' && $nada($a));
$a = $amb(); $a->token = '';
$ok('P1-2 sem token de sessão → 401', $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550'])->http === 401 && $nada($a) && $a->repo === 0);
foreach ([['user_id' => '75abc'], ['user_id' => 0], ['user_id' => -1], ['user_id' => true], []] as $i => $s) {
  $a = $amb(); $a->sess = $s;
  $ok("P1-2 user_id da sessão inválido #$i → 401", $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550'])->http === 401 && $nada($a));
}
$a = $amb(); $a->resp = fn($m, $url, $c) => ['status' => 200, 'corpo' => json_encode(['produto' => ['id' => 550], 'versao_galeria' => 7, 'fotos' => [], 'removidas' => []]), 'tipo' => 'application/json', 'erro' => null];
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']);
$ok('P1-2 sessão válida + ativa + usuário ativo → segue; o repositório recebe o token e o user_id DA SESSÃO', $r->http === 200 && $a->repoVisto === ['tok-sessao-sintetico', 75] && str_contains($a->urls[0], 'user_id=75'));
$ok('P1-2 o index.php usa SessionGate::validate + FotosSessaoPdo (não o requireAuth antigo)', (function () { $s = (string) file_get_contents(__DIR__ . '/../../../api/midia/index.php');
  return str_contains($s, 'SessionGate::validate()') && str_contains($s, 'new FotosSessaoPdo(') && !str_contains($s, 'requireAuth'); })());
$ok('P1-2 FotosSessaoPdo: só SELECT, sessão ativa e não expirada + usuário active e não excluído', (function () { $s = (string) file_get_contents(__DIR__ . '/../../../api/midia/FotosSessao.php');
  return str_contains($s, 'is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())') && str_contains($s, "status = 'active' AND deleted_at IS NULL") && !preg_match('/\b(INSERT|UPDATE|DELETE|CREATE)\b/', $s); })());
// repositório PDO contra um PDO FALSO (sem banco): parâmetros certos e leitura de "nenhuma linha"
$pdoFalso = new class extends PDO { public array $sql = []; public array $linhas = [true, false];
  public function __construct() {}
  public function prepare(string $q, array $o = []): PDOStatement|false { $this->sql[] = $q; $self = $this; $v = array_shift($this->linhas);
    return new class($self, $v) extends PDOStatement { public array $p = []; public function __construct(private $pdo, private $v) {} public function execute(?array $p = null): bool { $this->pdo->params[] = $p; return true; } public function fetchColumn(int $c = 0): mixed { return $this->v ? 1 : false; } }; }
  public array $params = []; };
$st = (new FotosSessaoPdo($pdoFalso))->situacao('tok-x', 75);
$ok('P1-2 FotosSessaoPdo (PDO falso): sessão ativa + usuário sem linha → usuario_ativo false; parâmetros token/uid', $st === ['sessao_ativa' => true, 'usuario_ativo' => false] && $pdoFalso->params === [['tok-x', 75], [75]]);

// DSHOW-103 §2 (testes dirigidos): outro usuário "informando" o ID 75 — a identidade é SEMPRE a da sessão
$a = $amb(); $a->sess = ['user_id' => 76]; $a->publicadores = [75, 76];
$a->resp = fn($m, $url, $c) => ['status' => 200, 'corpo' => json_encode(['produto' => ['id' => 550], 'versao_galeria' => 7, 'fotos' => [], 'removidas' => []]), 'tipo' => 'application/json', 'erro' => null];
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550', 'user_id' => '75']);
$ok('P1-2 sessão 76 com ?user_id=75 na URL → o app recebe user_id=76 (o da URL é ignorado)', $r->http === 200 && str_contains($a->urls[0], 'user_id=76') && !str_contains($a->urls[0], 'user_id=75'));
$a = $amb(); $a->sess = ['user_id' => 76]; $a->publicadores = [75, 76]; $a->corpoBytes = json_encode(['id' => 812, 'versao' => 7, 'user_id' => 75, 'titular_user_id' => 75]);
$a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'aplicada', 'recibo' => $rec('capa', ['titular_user_id' => 76])]);
$r = $req($a, 'POST', ['r' => 'capa', 'user_id' => '75']);
$ok('P1-2 sessão 76 com user_id=75 na URL e no corpo → o app recebe user_id=76; recibo do titular 76', $r->http === 200 && str_contains($a->urls[0], 'user_id=76') && !str_contains($a->urls[0], 'user_id=75') && $r->dados['recibo']['titular_user_id'] === 76);
foreach (['imagem' => ['r' => 'imagem', 'id' => '812', 't' => '256'], 'conferir' => ['r' => 'conferir', 'chave' => $CH]] as $nome => $get) {
  foreach (['sessão expirada/encerrada' => ['sessao_ativa' => false, 'usuario_ativo' => true], 'usuário revogado/desativado' => ['sessao_ativa' => true, 'usuario_ativo' => false]] as $caso => $sit) {
    $a = $amb(); $a->situacao = $sit;
    $ok("P1-2 GET $nome depois de $caso → 401, 0 app", $req($a, 'GET', $get)->http === 401 && $nada($a));
  }
}

// ── P1-3: imagem com Cache-Control: private, no-store ───────────────────────────────────────────────────────────────────────
$a = $amb(); $a->resp = fn($m, $url, $c) => ['status' => 200, 'corpo' => 'RIFF0000WEBP', 'tipo' => 'image/webp', 'erro' => null, 'etag' => '"v1-812-256"'];
$r = $req($a, 'GET', ['r' => 'imagem', 'id' => '812', 't' => '256']);
$ok('P1-3 imagem 200: Cache-Control exatamente "private, no-store" (sem max-age), nosniff, tipo', $r->http === 200 && ($r->cabecalhos['Cache-Control'] ?? '') === 'private, no-store' && !str_contains(implode(' ', $r->cabecalhos), 'max-age') && ($r->cabecalhos['X-Content-Type-Options'] ?? '') === 'nosniff' && $r->cabecalhos['Content-Type'] === 'image/webp');
$a = $amb(); $a->resp = fn($m, $url, $c) => ['status' => 304, 'corpo' => '', 'tipo' => '', 'erro' => null, 'etag' => '"v1-812-256"'];
$r = $req($a, 'GET', ['r' => 'imagem', 'id' => '812', 't' => '256'], ['se_nao_bater' => '"v1-812-256"']);
$ok('P1-3 imagem 304 também "private, no-store"', $r->http === 304 && $r->cabecalhos['Cache-Control'] === 'private, no-store');
$ok('P1-3 o código não tem mais max-age para imagem', !str_contains((string) file_get_contents(__DIR__ . '/../../../api/midia/index.php') . file_get_contents(__DIR__ . '/../../../api/midia/FotosProxy.php'), 'max-age='));

// ── A: recibo CORRELACIONADO ao pedido ──────────────────────────────────────────────────────────────────────────────────────
$casos = [
  'chave de outra operação' => ['publicar', $rec('publicar', ['chave' => 'op-outra-0000000000000'])],
  'operação diferente' => ['publicar', $rec('capa')],
  'titular diferente' => ['publicar', $rec('publicar', ['titular_user_id' => 76])],
  'sem titular (app < ea77d74)' => ['publicar', array_diff_key($rec('publicar'), ['titular_user_id' => 1])],
  'produto diferente' => ['publicar', $rec('publicar', ['produto_id' => 551])],
  'foto diferente na capa' => ['capa', $rec('capa', ['foto_id' => 813])],
  'ordem diferente' => ['ordem', $rec('ordem', ['foto_id' => null, 'ordem' => [2, 1]])],
  'desfecho do recibo ≠ resposta' => ['publicar', $rec('publicar', ['desfecho' => 'sem_mudanca'])],
];
foreach ($casos as $nome => [$op, $recibo]) {
  $a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'aplicada', 'recibo' => $recibo], 201); $a->corpoBytes = $op === 'publicar' ? $JPG : json_encode(['id' => 812, 'product_id' => 550, 'versao' => 7, 'ordem' => [1, 2]]);
  $r = $req($a, 'POST', ['r' => $op] + ($op === 'publicar' ? ['product_id' => '550'] : []), ['tamanho' => (string) strlen($a->corpoBytes)]);
  $ok("A recibo NÃO correlacionado ($nome) → desconhecido, gravado null, MESMA chave (nunca \"salvo\")", $r->tipo === 'erro' && $r->meta['desfecho'] === 'desconhecido' && $r->meta['gravado'] === null && $r->meta['chave'] === $CH, json_encode([$r->http, $r->meta]));
}
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'aplicada', 'recibo' => $rec('ordem', ['foto_id' => null, 'ordem' => [1, 2]])]); $a->corpoBytes = json_encode(['product_id' => 550, 'versao' => 7, 'ordem' => [1, 2]]);
$ok('A recibo correlacionado (ordem 1,2) → 200 aplicada', ($r = $req($a, 'POST', ['r' => 'ordem']))->http === 200 && $r->dados['desfecho'] === 'aplicada');
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['estado' => 'aplicada', 'operacao' => 'publicar', 'desfecho' => 'aplicada', 'recibo' => $rec('publicar', ['titular_user_id' => 76])]);
$r = $req($a, 'GET', ['r' => 'conferir', 'chave' => $CH]);
$ok('A conferir com recibo de OUTRO titular → desconhecido (não afirma nada)', $r->tipo === 'erro' && $r->meta['desfecho'] === 'desconhecido');
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['estado' => 'aplicada', 'operacao' => 'publicar', 'desfecho' => 'aplicada', 'recibo' => $rec('publicar', ['chave' => 'op-outra-0000000000000'])]);
$ok('A conferir com recibo de OUTRA chave → desconhecido', ($r = $req($a, 'GET', ['r' => 'conferir', 'chave' => $CH]))->tipo === 'erro' && $r->meta['desfecho'] === 'desconhecido');
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['estado' => 'aplicada', 'operacao' => 'publicar', 'desfecho' => 'aplicada', 'recibo' => $rec('publicar')]);
$ok('A conferir correlacionado → aplicada + recibo com titular', ($r = $req($a, 'GET', ['r' => 'conferir', 'chave' => $CH]))->http === 200 && $r->dados['recibo']['titular_user_id'] === 75);
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['estado' => 'aplicada', 'operacao' => 'publicar', 'desfecho' => 'aplicada', 'recibo' => null]);
$ok('A conferir "aplicada" com recibo NULO → desconhecido (nunca confirma sem recibo utilizável)', ($r = $req($a, 'GET', ['r' => 'conferir', 'chave' => $CH]))->tipo === 'erro' && $r->meta['desfecho'] === 'desconhecido');
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['estado' => 'nao_encontrada']);
$r = $req($a, 'GET', ['r' => 'conferir', 'chave' => $CH]);
$ok('A conferir nao_encontrada → reenvio só com a MESMA chave (com_a_mesma_chave=true; nunca chave nova)', $r->http === 200 && $r->dados['resultado'] === 'nao_encontrada' && $r->dados['com_a_mesma_chave'] === true && $r->dados['chave'] === $CH);
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['estado' => 'pode_estar_demorando', 'operacao' => 'publicar', 'desde' => 'x']);
$r = $req($a, 'GET', ['r' => 'conferir', 'chave' => $CH]);
$ok('A conferir sem resultado conclusivo → em_andamento + sinal, sem recibo (não declara aplicada)', $r->dados['resultado'] === 'em_andamento' && $r->dados['recibo'] === null);

// ── B: IDs ESTRITOS (≤ 100 na ordem), nada sai para o app ───────────────────────────────────────────────────────────────────
foreach (['12abc', '012', '1.5', '', '-3', '0', ' 12', '1e3', '99999999999999999999'] as $v) {
  $a = $amb(); $r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => $v]);
  $ok("B product_id \"$v\" → 422 recusado, 0 app", $r->http === 422 && $a->app === 0);
}
$a = $amb(); $ok('B product_id em lista (?product_id[]=1) → 422', $req($a, 'GET', ['r' => 'galeria', 'product_id' => ['1']])->http === 422 && $a->app === 0);
$a = $amb(); $ok('B imagem id "812x" → 422', $req($a, 'GET', ['r' => 'imagem', 'id' => '812x'])->http === 422 && $a->app === 0);
$ordensRuins = ['objeto' => ['a' => 1], '101 ids' => range(1, 101), 'texto com letra' => [1, '2a'], 'zero à esquerda' => [1, '02'], 'booleano' => [1, true],
  'repetido' => [3, 3], 'vazia' => [], 'aninhada' => [[1], 2], 'negativo' => [1, -2], 'não lista' => 'xyz'];
foreach ($ordensRuins as $nome => $ordem) {
  $a = $amb(); $a->corpoBytes = json_encode(['product_id' => 550, 'versao' => 7, 'ordem' => $ordem]);
  $r = $req($a, 'POST', ['r' => 'ordem']);
  $ok("B ordem ($nome) → 422 recusada, 0 app", $r->http === 422 && $r->meta['desfecho'] === 'recusada' && $a->app === 0, json_encode([$r->http, $r->meta]));
}
// decimais em JSON LITERAL (o json_encode deste PHP escreve 2.0 como "2"; o navegador pode mandar "2.0")
foreach (['ordem decimal' => ['ordem', '{"product_id":550,"versao":7,"ordem":[1,2.0]}'], 'product_id decimal' => ['ordem', '{"product_id":550.0,"versao":7,"ordem":[1,2]}'],
          'versao 7.0' => ['capa', '{"id":812,"versao":7.0}'], 'capa id 812.0' => ['capa', '{"id":812.0,"versao":7}'], 'id 1e3' => ['remover', '{"id":1e3,"versao":7}']] as $nome => [$rota, $json]) {
  $a = $amb(); $a->corpoBytes = $json;
  $r = $req($a, 'POST', ['r' => $rota]);
  $ok("B $nome (JSON literal) → 422 recusada, 0 app", $r->http === 422 && $a->app === 0, json_encode([$r->http, $r->meta]));
}
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'aplicada', 'recibo' => $rec('ordem', ['foto_id' => null, 'ordem' => range(1, 100)])]);
$a->corpoBytes = json_encode(['product_id' => 550, 'versao' => 7, 'ordem' => array_map('strval', range(1, 100))]);
$ok('B ordem com 100 ids em texto só-dígitos → passa (1 chamada)', $req($a, 'POST', ['r' => 'ordem'])->http === 200 && $a->app === 1);
foreach (['"7"' => '7', 'null' => null] as $nome => $v) {
  $a = $amb(); $a->corpoBytes = json_encode(['id' => 812, 'versao' => $v]);
  $ok("B versao $nome (não inteiro JSON) → 422, 0 app", $req($a, 'POST', ['r' => 'capa'])->http === 422 && $a->app === 0);
}
foreach (['"812"' => '812', '"812a"' => '812a'] as $nome => $v) {
  $a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'aplicada', 'recibo' => $rec('capa')]);
  $a->corpoBytes = json_encode(['id' => $v, 'versao' => 7]);
  $r = $req($a, 'POST', ['r' => 'capa']);
  $ok("B capa id $nome", $nome === '"812"' ? $r->http === 200 : ($r->http === 422 && $a->app === 0), json_encode([$r->http]));
}
$a = $amb(); $a->corpoBytes = json_encode([1, 2]);
$ok('B corpo JSON lista (não objeto) → 400 INVALID_JSON', $req($a, 'POST', ['r' => 'capa'])->http === 400 && $a->app === 0);

// ── C: configuração do piloto EXPLÍCITA, "*" nunca habilita ────────────────────────────────────────────────────────────────
$ok('C ausente → o PILOTO versionado [75]', FotosPermissoes::publicadores(null, false) === [75] && FotosPermissoes::PILOTO === [75]);
foreach (['*', ' * ', '75,*', '*,75', '', ' ', '75, 546', '75;546', '075', '0', 'todos', str_repeat('1,', 20) . '1'] as $v) {
  $ok("C DSHOW_FOTOS_PUBLICADORES=\"$v\" → NINGUÉM (nunca todos, nunca o piloto por engano)", @FotosPermissoes::publicadores($v) === []);
}
$ok('C lista estrita "75,546" → [75, 546]', FotosPermissoes::publicadores('75,546') === [75, 546]);
$ok('C publica() com lista mal formada ["*"] → false para todos', !FotosPermissoes::publica(75, ['*']) && !FotosPermissoes::publica(1, ['*']));
$a = $amb(); $a->publicadores = @FotosPermissoes::publicadores('*');
$ok('C pelo proxy: "*" → 403 recusada para o 75, 0 app', ($r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']))->http === 403 && $a->app === 0);

// ── D: 201 só para publicar aplicada; sem_mudanca = 200 (contraprova na mutação) ─────────────────────────────────────────
$a = $amb(); $a->corpoBytes = $JPG; $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'sem_mudanca', 'recibo' => $rec('publicar', ['desfecho' => 'sem_mudanca', 'duplicada' => true])], 201);
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('D (DSHOW-103 §4/§5-D) app responde HTTP 201 com recibo sem_mudanca → proxy 200, desfecho sem_mudanca, titular preservado', $r->http === 200 && $r->dados['desfecho'] === 'sem_mudanca' && $r->dados['recibo']['titular_user_id'] === 75, (string) $r->http);
$a = $amb(); $a->corpoBytes = $JPG;
$ok('D publicar aplicada → 201', $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)])->http === 201);
$a = $amb(); $a->corpoBytes = $JPG; $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'sem_mudanca', 'recibo' => $rec('publicar', ['desfecho' => 'sem_mudanca', 'duplicada' => true])]);
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('D publicar sem_mudanca (app 200) → 200, nunca 201', $r->http === 200 && $r->dados['desfecho'] === 'sem_mudanca', (string) $r->http);
$a = $amb(); $a->corpoBytes = $JPG; $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'aplicada', 'recibo' => $rec('publicar')], 201, ['replay' => true]);
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('D reenvio de publicar aplicada → 201 (mesmo status do original) e repetido=true', $r->http === 201 && $r->dados['repetido'] === true);
$a = $amb(); $a->resp = fn($m, $url, $c) => $ok200(['desfecho' => 'sem_mudanca', 'recibo' => $rec('capa', ['desfecho' => 'sem_mudanca'])]); $a->corpoBytes = json_encode(['id' => 812, 'versao' => 7]);
$ok('D capa sem_mudanca → 200', $req($a, 'POST', ['r' => 'capa'])->http === 200);

// ── alinhamento com o app ea77d74: 409 em_andamento (tentativa que perdeu a posse) ───────────────────────────────────────
$a = $amb(); $a->corpoBytes = $JPG;
$a->resp = fn($m, $url, $c) => ['status' => 409, 'corpo' => json_encode(['error' => ['code' => 'request_in_progress', 'message' => 'Em andamento.'], 'desfecho' => 'em_andamento', 'gravado' => null, 'chave' => 'x']), 'tipo' => 'application/json', 'erro' => null];
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('ea77d74 409 em_andamento → 409 em_andamento, gravado NULL (não "não salvo"), mesma chave', $r->http === 409 && $r->meta['desfecho'] === 'em_andamento' && $r->meta['gravado'] === null && $r->meta['chave'] === $CH, json_encode($r->meta));
$a = $amb(); $a->corpoBytes = json_encode(['id' => 812, 'versao' => 7]);
$a->resp = fn($m, $url, $c) => ['status' => 409, 'corpo' => json_encode(['error' => ['code' => 'version_conflict', 'message' => 'Mudou.'], 'desfecho' => 'conflito', 'gravado' => false]), 'tipo' => 'application/json', 'erro' => null, 'versao_galeria' => '9'];
$r = $req($a, 'POST', ['r' => 'capa']);
$ok('ea77d74 409 conflito continua gravado false + versao_atual', $r->http === 409 && $r->meta['gravado'] === false && $r->meta['versao_atual'] === 9);

// ── integração (DSHOW-100 §6): o app recusa assinatura com 403 assinatura_invalida (não 401) ─────────────────────────────────
$sig403 = fn($m, $url, $c) => ['status' => 403, 'corpo' => json_encode(['error' => ['code' => 'assinatura_invalida', 'message' => 'Acesso negado.'], 'desfecho' => 'recusada', 'gravado' => false]), 'tipo' => 'application/json', 'erro' => null];
$a = $amb(); $a->corpoBytes = $JPG; $a->resp = $sig403;
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('integração: escrita com 403 assinatura_invalida → 503 APP_UNAVAILABLE recusada, gravado false (canal, não permissão)', $r->http === 503 && $r->codigo === 'APP_UNAVAILABLE' && $r->meta['desfecho'] === 'recusada' && $r->meta['gravado'] === false, json_encode([$r->http, $r->codigo]));
$a = $amb(); $a->resp = $sig403;
$r = $req($a, 'GET', ['r' => 'galeria', 'product_id' => '550']);
$ok('integração: leitura com 403 assinatura_invalida → 503 APP_UNAVAILABLE', $r->http === 503 && $r->codigo === 'APP_UNAVAILABLE');
$a = $amb(); $a->corpoBytes = $JPG; $a->resp = fn($m, $url, $c) => ['status' => 403, 'corpo' => json_encode(['error' => ['code' => 'sem_permissao', 'message' => 'Sem permissão.'], 'desfecho' => 'recusada', 'gravado' => false]), 'tipo' => 'application/json', 'erro' => null];
$r = $req($a, 'POST', ['r' => 'publicar', 'product_id' => '550'], ['tamanho' => (string) strlen($JPG)]);
$ok('integração: 403 sem_permissao continua 403 recusada (permissão do usuário)', $r->http === 403 && $r->codigo === 'SEM_PERMISSAO');

@unlink($seg);
echo ($f ? '[ERRO]' : '[OK]  ') . " fotos-dshow103 (P1-1/2/3 + A–D + ea77d74, dependências falsas): $n casos, $f falha(s)\n";
exit($f ? 1 : 0);
