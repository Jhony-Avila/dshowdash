<?php
declare(strict_types=1);

/**
 * api/rdstation/RdStation.php — conector do RD Station MARKETING (app privado "Dash DSHOW") · VINHO (ACIMA_ESQUERDA), 26/11/2026.
 *
 * SÓ LEITURA. O RD não oferece escopo só de leitura, então a garantia é NO CÓDIGO, em duas camadas:
 *   1) RdLeitura (cliente da API): qualquer método ≠ GET é recusado ANTES de qualquer rede (RdErro 'somente_leitura');
 *   2) RdCurl (transporte HTTP, o ÚNICO que fala com a rede): só GET para https://api.rd.services/platform/… (rotas da lista) e só UM POST:
 *      o da troca/renovação do token, para a URL EXATA RdAuth::TOKEN_URL. Qualquer outra combinação é recusada antes do curl.
 * Segredos: pasta compartilhada da config do Dash (<release>/config → /srv/dshow-shared/dash/config) /rdstation, 0700, arquivos 0600, dono do
 * php-fpm — o mesmo padrão das chaves do Asaas. client_id e client_secret entram SÓ pelo scripts/rdstation/rd-segredo.sh (read -s, Jhony).
 * Tokens (access + refresh) ficam CIFRADOS (AES-256-GCM, envelope v1 como o GcalCrypto/OutlookCrypto) em token.enc, com chave PRÓPRIA do
 * módulo (cripto.key, 32 bytes aleatórios gerados pelo rd-segredo.sh). Nada disso é logado, exibido ou devolvido ao navegador.
 * Rotas e formatos conferidos em developers.rdstation.com (26/11 13:0x): diálogo api.rd.services/auth/dialog (client_id, redirect_uri, state;
 * redirect_uri comparado como texto exato); troca do code = POST JSON em /auth/token?token_by=code {client_id, client_secret, code}; renovação =
 * POST JSON em /auth/token {client_id, client_secret, refresh_token}; access_token vale 86400 s; o refresh_token não expira (guardamos o que
 * vier em cada resposta). Analytics: /platform/analytics/funnel (SÓ plano Advanced; 60/h) e /platform/analytics/conversions (Pro 45 dias ou
 * Advanced); segmentações em {"segmentations": […]}. Endpoint fora do plano NÃO derruba a sincronização: aquele total fica null ("—").
 */

final class RdErro extends RuntimeException
{
    public function __construct(public readonly string $codigo, public readonly int $http = 0) { parent::__construct($codigo); }
}

/** Pasta de segredos e do estado do módulo (nunca devolve conteúdo de segredo para fora do conector). */
final class RdSegredos
{
    public const RE_ID = '/^[A-Za-z0-9._~-]{8,200}\z/';
    public const RE_SEGREDO = '/^[A-Za-z0-9._~-]{8,200}\z/';

    public function __construct(public readonly string $pasta) {}

    /** Produção: <raiz do Dash>/config/rdstation (config compartilhada). Caminho FIXO, sem variável de ambiente. */
    public static function padrao(): self { return new self(dirname(__DIR__, 2) . '/config/rdstation'); }

    private function ler(string $nome): ?string
    {
        $f = $this->pasta . '/' . $nome;
        if (!is_file($f) || is_link($f)) return null;
        $v = @file_get_contents($f);
        return is_string($v) ? trim($v) : null;
    }

    public function configurado(): bool { return $this->ler('client_id') !== null && $this->ler('client_secret') !== null && $this->ler('cripto.key') !== null; }

    /** @return array{id:string, segredo:string} */
    public function cliente(): array
    {
        $id = $this->ler('client_id'); $s = $this->ler('client_secret');
        if ($id === null || $s === null || preg_match(self::RE_ID, $id) !== 1 || preg_match(self::RE_SEGREDO, $s) !== 1) throw new RdErro('nao_configurado');
        return ['id' => $id, 'segredo' => $s];
    }

    public function chave(): string
    {
        $k = base64_decode((string) $this->ler('cripto.key'), true);
        if (!is_string($k) || strlen($k) !== 32) throw new RdErro('nao_configurado');
        return $k;
    }

    public function temToken(): bool { return $this->ler('token.enc') !== null; }
    public function tokenCifrado(): ?string { return $this->ler('token.enc'); }
    public function gravarToken(string $envelope): void { $this->gravar('token.enc', $envelope); }

    public function estado(): ?array
    {
        $v = $this->ler('estado.json');
        $j = $v !== null ? json_decode($v, true) : null;
        return is_array($j) ? $j : null;
    }
    public function gravarEstado(array $e): void { $this->gravar('estado.json', (string) json_encode($e, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); }

    /** Gravação atômica 0600 (temporário na mesma pasta + rename). */
    private function gravar(string $nome, string $conteudo): void
    {
        if (!is_dir($this->pasta) || is_link($this->pasta)) throw new RdErro('nao_configurado');
        $tmp = $this->pasta . '/.' . $nome . '.' . bin2hex(random_bytes(6));
        $old = umask(077);
        try {
            if (@file_put_contents($tmp, $conteudo . "\n", LOCK_EX) === false) throw new RdErro('gravacao_falhou');
            @chmod($tmp, 0600);
            if (!@rename($tmp, $this->pasta . '/' . $nome)) throw new RdErro('gravacao_falhou');
        } finally { umask($old); if (is_file($tmp)) @unlink($tmp); }
    }
}

/** AES-256-GCM, envelope "v1.<iv>.<tag>.<ct>" (base64), com dado associado fixo do módulo. */
final class RdCrypto
{
    private const AAD = 'dshow-rdstation-token-v1';

    public function __construct(#[\SensitiveParameter] private readonly string $chave)
    {
        if (strlen($chave) !== 32) throw new RdErro('nao_configurado');
    }

    public function cifrar(#[\SensitiveParameter] string $texto): string
    {
        $iv = random_bytes(12); $tag = '';
        $ct = openssl_encrypt($texto, 'aes-256-gcm', $this->chave, OPENSSL_RAW_DATA, $iv, $tag, self::AAD, 16);
        if ($ct === false) throw new RdErro('cripto');
        return 'v1.' . base64_encode($iv) . '.' . base64_encode($tag) . '.' . base64_encode($ct);
    }

    public function decifrar(string $env): string
    {
        $p = explode('.', $env);
        if (count($p) !== 4 || $p[0] !== 'v1') throw new RdErro('cripto');
        [$iv, $tag, $ct] = [base64_decode($p[1], true), base64_decode($p[2], true), base64_decode($p[3], true)];
        if (!is_string($iv) || strlen($iv) !== 12 || !is_string($tag) || strlen($tag) !== 16 || !is_string($ct)) throw new RdErro('cripto');
        $t = openssl_decrypt($ct, 'aes-256-gcm', $this->chave, OPENSSL_RAW_DATA, $iv, $tag, self::AAD);
        if ($t === false) throw new RdErro('cripto');
        return $t;
    }
}

interface RdTransporte
{
    /** @return array{status:int, corpo:string} */
    public function enviar(string $metodo, string $url, array $cabecalhos, ?string $corpo): array;
}

/** A REGRA DO QUE PODE SAIR para o RD — usada pelo transporte real e conferida em teste. */
final class RdGuarda
{
    public const BASE = 'https://api.rd.services';
    /** Rotas de LEITURA permitidas (GET). */
    public const RE_ROTA = '#^/platform/(segmentations(/[0-9]{1,12}/contacts)?|analytics/(conversions|funnel))\z#';

    public static function conferir(string $metodo, string $url): void
    {
        if ($metodo === 'POST') {
            if ($url !== RdAuth::TOKEN_URL && $url !== RdAuth::TOKEN_CODE_URL) throw new RdErro('somente_leitura');
            return;
        }
        if ($metodo !== 'GET') throw new RdErro('somente_leitura');
        $p = parse_url($url);
        if (!is_array($p) || ($p['scheme'] ?? '') !== 'https' || ($p['host'] ?? '') !== 'api.rd.services' || isset($p['port']) || isset($p['user'])
            || isset($p['fragment']) || preg_match(self::RE_ROTA, (string) ($p['path'] ?? '')) !== 1) throw new RdErro('rota_nao_permitida');
    }
}

/** Transporte real (curl). A guarda roda ANTES do curl_init: nada fora da regra chega à rede. */
final class RdCurl implements RdTransporte
{
    public function enviar(string $metodo, string $url, array $cabecalhos, ?string $corpo): array
    {
        RdGuarda::conferir($metodo, $url);
        $c = curl_init($url);
        $op = [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8,
               CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_HTTPHEADER => $cabecalhos];
        if (defined('CURLOPT_PROTOCOLS_STR')) $op[CURLOPT_PROTOCOLS_STR] = 'https'; else $op[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS;
        if ($metodo === 'POST') { $op[CURLOPT_POST] = true; $op[CURLOPT_POSTFIELDS] = (string) $corpo; } else { $op[CURLOPT_HTTPGET] = true; }
        curl_setopt_array($c, $op);
        $r = curl_exec($c); $st = (int) curl_getinfo($c, CURLINFO_RESPONSE_CODE); curl_close($c);
        if (!is_string($r)) throw new RdErro('rede');
        return ['status' => $st, 'corpo' => $r];
    }
}

/** OAuth do RD: diálogo de autorização e o ÚNICO POST permitido (troca do code / renovação). */
final class RdAuth
{
    public const DIALOGO_URL = 'https://api.rd.services/auth/dialog';
    public const TOKEN_URL = 'https://api.rd.services/auth/token';            // renovação (refresh_token)
    public const TOKEN_CODE_URL = 'https://api.rd.services/auth/token?token_by=code';   // troca do code (documentação do RD)
    /** O callback cadastrado no app privado (Diogo). Mudou no RD → muda aqui (degrau de 1 linha). */
    public const RETORNO_URL = 'https://dshowdash.com.br/api/integracoes/index.php?r=oauth/rdstation/retorno';   // ?r= (o nginx não passa PATH_INFO)

    public function __construct(private readonly RdTransporte $http, private readonly RdSegredos $seg) {}

    public function urlAutorizar(string $state): string
    {
        return self::DIALOGO_URL . '?' . http_build_query(['client_id' => $this->seg->cliente()['id'], 'redirect_uri' => self::RETORNO_URL, 'state' => $state]);
    }

    /** @return array{access_token:string, refresh_token:string, expires_in:int} */
    public function trocarCode(#[\SensitiveParameter] string $code): array { return $this->token(self::TOKEN_CODE_URL, ['code' => $code]); }
    public function renovar(#[\SensitiveParameter] string $refresh): array { return $this->token(self::TOKEN_URL, ['refresh_token' => $refresh]); }

    private function token(string $url, #[\SensitiveParameter] array $extra): array
    {
        if ($url !== self::TOKEN_URL && $url !== self::TOKEN_CODE_URL) throw new RdErro('somente_leitura');
        $c = $this->seg->cliente();
        $r = $this->http->enviar('POST', $url, ['Content-Type: application/json', 'Accept: application/json'],
            (string) json_encode(['client_id' => $c['id'], 'client_secret' => $c['segredo']] + $extra));
        unset($c);
        if (in_array($r['status'], [400, 401, 403], true)) throw new RdErro('reautorizar', $r['status']);
        if ($r['status'] !== 200) throw new RdErro('token_http_' . $r['status'], $r['status']);
        $j = json_decode($r['corpo'], true);
        if (!is_array($j) || !is_string($j['access_token'] ?? null) || $j['access_token'] === '' || !is_string($j['refresh_token'] ?? null)
            || $j['refresh_token'] === '' || !is_int($j['expires_in'] ?? null)) throw new RdErro('resposta_invalida', 200);
        return ['access_token' => $j['access_token'], 'refresh_token' => $j['refresh_token'], 'expires_in' => $j['expires_in']];
    }
}

/** Tokens cifrados em repouso + renovação. */
final class RdTokens
{
    public function __construct(private readonly RdSegredos $seg, private readonly RdCrypto $cripto) {}

    public function salvar(array $t, DateTimeImmutable $agora, ?int $usuario = null): void
    {
        $this->seg->gravarToken($this->cripto->cifrar((string) json_encode(['a' => $t['access_token'], 'r' => $t['refresh_token'],
            'exp' => $agora->getTimestamp() + max(0, $t['expires_in']), 'por' => $usuario, 'em' => $agora->format(DATE_ATOM)])));
    }

    /** Access token válido (renova com folga de 5 min). Sem token → 'nao_conectado'; refresh recusado → 'reautorizar'. */
    public function acesso(RdAuth $auth, DateTimeImmutable $agora): string
    {
        $env = $this->seg->tokenCifrado();
        if ($env === null) throw new RdErro('nao_conectado');
        $t = json_decode($this->cripto->decifrar($env), true);
        if (!is_array($t) || !is_string($t['a'] ?? null) || !is_string($t['r'] ?? null) || !is_int($t['exp'] ?? null)) throw new RdErro('cripto');
        if ($t['exp'] - 300 > $agora->getTimestamp()) return $t['a'];
        $n = $auth->renovar($t['r']);
        $this->salvar($n, $agora, is_int($t['por'] ?? null) ? $t['por'] : null);
        return $n['access_token'];
    }
}

/** Cliente da API para LEITURA. Não existe caminho de escrita: método ≠ GET é recusado aqui, antes do transporte. */
final class RdLeitura
{
    public function __construct(private readonly RdTransporte $http, #[\SensitiveParameter] private readonly string $acesso) {}

    public function get(string $rota, array $q = []): array { return $this->requisitar('GET', $rota, $q); }

    public function requisitar(string $metodo, string $rota, array $q = []): array
    {
        if ($metodo !== 'GET') throw new RdErro('somente_leitura');
        if (preg_match(RdGuarda::RE_ROTA, $rota) !== 1) throw new RdErro('rota_nao_permitida');
        $url = RdGuarda::BASE . $rota . ($q !== [] ? '?' . http_build_query($q) : '');
        $r = $this->http->enviar('GET', $url, ['Authorization: Bearer ' . $this->acesso, 'Accept: application/json'], null);
        if ($r['status'] === 401) throw new RdErro('reautorizar', 401);
        if ($r['status'] === 429) throw new RdErro('limite', 429);
        if ($r['status'] !== 200) throw new RdErro('http_' . $r['status'], $r['status']);
        $j = json_decode($r['corpo'], true);
        if (!is_array($j)) throw new RdErro('resposta_invalida', 200);
        return $j;
    }
}

/** state anti-CSRF do OAuth: uso ÚNICO, preso à sessão e ao usuário do Dash, 10 min. Guarda só o HASH do state na sessão. */
final class RdOAuth
{
    public const VALIDADE_S = 600;
    public const CHAVE_SESSAO = 'rdstation_oauth';

    /**
     * 26/11 (rota por ?r=): o RD documenta o retorno como "<callback>?code=…". Com o callback já tendo "?r=…", um provedor que só concatena
     * "?code=" entrega "?r=oauth/rdstation/retorno?code=X&state=Y" → o PHP lê r = "oauth/rdstation/retorno?code=X". Aqui a rota é separada
     * do resto e só code/state/error do resto entram nos parâmetros (o que já veio em $_GET tem precedência).
     * @return array{0:string, 1:array} [rota, parâmetros]
     */
    public static function rotaEParametros(array $get): array
    {
        $r = is_string($get['r'] ?? null) ? $get['r'] : '';
        $pos = strpos($r, '?');
        if ($pos !== false) {
            parse_str(substr($r, $pos + 1), $resto); $r = substr($r, 0, $pos);
            foreach (['code', 'state', 'error'] as $k) if (!isset($get[$k]) && is_string($resto[$k] ?? null)) $get[$k] = $resto[$k];
        }
        return [trim($r, '/'), $get];
    }

    public static function iniciar(RdAuth $auth, int $usuario, array &$sessao, DateTimeImmutable $agora): string
    {
        $state = bin2hex(random_bytes(32));
        $url = $auth->urlAutorizar($state);   // sem configuração → RdErro antes de gravar qualquer coisa
        $sessao[self::CHAVE_SESSAO] = ['h' => hash('sha256', $state), 'u' => $usuario, 'exp' => $agora->getTimestamp() + self::VALIDADE_S];
        return $url;
    }

    /** @return string resultado: ok | state_invalido | expirado | negado | code_invalido | reautorizar | nao_configurado | falhou */
    public static function retorno(array $get, int $usuario, array &$sessao, RdAuth $auth, RdTokens $tokens, DateTimeImmutable $agora): string
    {
        $p = $sessao[self::CHAVE_SESSAO] ?? null;
        unset($sessao[self::CHAVE_SESSAO]);   // uso único, mesmo quando falha
        $st = is_string($get['state'] ?? null) ? $get['state'] : '';
        if (!is_array($p) || preg_match('/^[0-9a-f]{64}\z/', $st) !== 1 || !is_string($p['h'] ?? null) || !hash_equals($p['h'], hash('sha256', $st))
            || ($p['u'] ?? null) !== $usuario) return 'state_invalido';
        if (!is_int($p['exp'] ?? null) || $p['exp'] < $agora->getTimestamp()) return 'expirado';
        if (isset($get['error'])) return 'negado';
        $code = is_string($get['code'] ?? null) ? $get['code'] : '';
        if (preg_match('/^[A-Za-z0-9._~-]{8,512}\z/', $code) !== 1) return 'code_invalido';
        try {
            $tokens->salvar($auth->trocarCode($code), $agora, $usuario);
            return 'ok';
        } catch (RdErro $e) {
            error_log('[rdstation] retorno: ' . $e->codigo);
            return in_array($e->codigo, ['reautorizar', 'nao_configurado'], true) ? $e->codigo : 'falhou';
        }
    }
}

/** Sincronização (cron): totais do período, SÓ números (nenhum contato, e-mail ou nome sai do RD para o Dash nesta etapa). */
final class RdSincronizador
{
    public const DIAS = 30;

    public function __construct(private readonly RdSegredos $seg, private readonly RdTransporte $http) {}

    public function rodar(DateTimeImmutable $agora): array
    {
        $agora = $agora->setTimezone(new DateTimeZone('America/Sao_Paulo'));
        $ant = $this->seg->estado() ?? [];
        $base = ['ultima_tentativa' => $agora->format(DATE_ATOM), 'ultima_sync_ok' => $ant['ultima_sync_ok'] ?? null, 'totais' => $ant['totais'] ?? null];
        try {
            $auth = new RdAuth($this->http, $this->seg);
            $acesso = (new RdTokens($this->seg, new RdCrypto($this->seg->chave())))->acesso($auth, $agora);
            $api = new RdLeitura($this->http, $acesso); unset($acesso);
            $q = ['start_date' => $agora->modify('-' . (self::DIAS - 1) . ' days')->format('Y-m-d'), 'end_date' => $agora->format('Y-m-d')];
            $fora = [];   // endpoint fora do plano/indisponível: aquele total vira null ("—"), o resto segue; 401 e 429 param tudo
            $ler = function (string $rota, array $qq, string $nome) use ($api, &$fora): ?array {
                try { return $api->get($rota, $qq); }
                catch (RdErro $x) { if (in_array($x->codigo, ['reautorizar', 'limite'], true)) throw $x; $fora[$nome] = $x->codigo; return null; }
            };
            $fu = $ler('/platform/analytics/funnel', $q, 'funil'); $co = $ler('/platform/analytics/conversions', $q, 'conversoes'); $sg = $ler('/platform/segmentations', [], 'segmentacoes');
            $totais = ['periodo' => $q, 'funil' => $fu !== null ? self::somar($fu['funnel'] ?? []) : null,
                       'conversoes' => $co !== null ? self::somar($co['conversions'] ?? []) : null,
                       'segmentacoes' => $sg !== null ? self::contar($sg) : null, 'indisponivel' => $fora];
            $e = ['estado' => 'ok', 'erro' => null, 'ultima_sync_ok' => $agora->format(DATE_ATOM), 'totais' => $totais] + $base;
        } catch (RdErro $x) {
            $e = ['estado' => 'erro', 'erro' => $x->codigo] + $base;
        }
        $this->seg->gravarEstado($e);
        return $e;
    }

    /** Soma, por nome de campo, os NÚMEROS da resposta (formato do RD: A CONFERIR); texto nunca entra. */
    public static function somar(array $j): array
    {
        $s = [];
        array_walk_recursive($j, function ($v, $k) use (&$s) { if (is_string($k) && str_ends_with($k, '_count') && is_int($v)) $s[$k] = ($s[$k] ?? 0) + $v; });
        ksort($s);
        return $s;
    }

    public static function contar(array $j): int
    {
        $l = isset($j['segmentations']) && is_array($j['segmentations']) ? $j['segmentations'] : (array_is_list($j) ? $j : []);
        return count($l);
    }
}

/** Card da tela Integrações (SEM segredo): estado, horário da última sincronização boa, erro em 1 linha e próximo passo. */
final class RdCard
{
    public const ATRASO_MIN = 180;
    public const CONECTAR_URL = '/api/integracoes/index.php?r=oauth/rdstation/conectar';

    public static function montar(RdSegredos $seg, DateTimeImmutable $agora): array
    {
        $b = ['id' => 'rdstation', 'nome' => 'RD Station Marketing', 'ultima_sincronizacao' => null, 'acao' => null];
        if (!$seg->configurado()) return $b + ['estado' => 'aguardando', 'erro' => 'As credenciais do app "Dash DSHOW" ainda não foram instaladas no servidor.',
            'proximo_passo' => 'Jhony: rodar scripts/rdstation/rd-segredo.sh --executar (Client ID e Secret com read -s).'];
        $conectar = ['rotulo' => 'Conectar', 'url' => self::CONECTAR_URL];
        if (!$seg->temToken()) return ['estado' => 'aguardando', 'erro' => 'A conta do RD Station ainda não foi conectada.',
            'proximo_passo' => 'Clicar em "Conectar" logado como administrador do RD Station.', 'acao' => $conectar] + $b;
        $e = $seg->estado();
        $ok = is_string($e['ultima_sync_ok'] ?? null) ? new DateTimeImmutable($e['ultima_sync_ok']) : null;
        $b['ultima_sincronizacao'] = $ok?->format(DATE_ATOM);
        if (($e['estado'] ?? null) === 'erro' && ($e['erro'] ?? null) === 'reautorizar') return ['estado' => 'com_problema', 'erro' => 'A conta do RD Station pede nova autorização.',
            'proximo_passo' => 'Clicar em "Conectar" de novo, logado como administrador do RD Station.', 'acao' => $conectar] + $b;
        if (($e['estado'] ?? null) === 'erro') return $b + ['estado' => 'com_problema', 'erro' => 'A última sincronização com o RD Station falhou (' . preg_replace('/[^a-z0-9_]/', '', (string) $e['erro']) . ').',
            'proximo_passo' => 'Ver o log da sincronização do RD Station e rodar de novo.'];
        if ($ok === null) return $b + ['estado' => 'aguardando', 'erro' => 'Conectado; aguardando a primeira sincronização.', 'proximo_passo' => 'Rodar a sincronização do RD Station (ou aguardar o agendamento).'];
        if ($agora->getTimestamp() - $ok->getTimestamp() > self::ATRASO_MIN * 60) return $b + ['estado' => 'atrasado', 'erro' => 'A última sincronização boa é antiga.',
            'proximo_passo' => 'Conferir o agendamento da sincronização do RD Station.'];
        return $b + ['estado' => 'ok', 'erro' => null, 'proximo_passo' => null];
    }
}
