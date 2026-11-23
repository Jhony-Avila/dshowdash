<?php
declare(strict_types=1);

/**
 * /api/midia/FotosProxy.php — DSHOW-103 (19/11, ACIMA_DIREITA): o fluxo INTEIRO do proxy de fotos, com as dependências INJETÁVEIS, para que
 * a ordem das portas seja provada em teste (sem banco, sem sessão real, sem flags reais, sem app). O index.php só monta as dependências
 * reais e emite a resposta.
 *
 * Ordem (nada abaixo de uma porta recusada acontece — nem chamada ao app, nem leitura do corpo):
 *   1) flag EXCLUSIVA de fotos `panel_fotos_enabled` (P1-1; nunca a de atributos), global: ausente/desligada/ilegível = OFF → 404
 *   2) SESSÃO COMPLETA (P1-2): SessionGate::validate + sessão ativa em app_user_sessions + usuário ativo (FotosSessao) → 401/503
 *   3) rota desconhecida para o método → 404
 *   4) flag de fotos para a PESSOA → 404 · POST: `panel_fotos_escrita` para a pessoa → 404
 *   5) CSRF em POST → 403
 *   6) publicador (configuração EXPLÍCITA do piloto, FotosPermissoes; "*" nunca habilita) → 403
 *   7) só então: lê o corpo (POST), monta o canal e fala com o app
 * Imagem (P1-3): `Cache-Control: private, no-store` (+ nosniff), nunca max-age.
 */

final class FotosResposta
{
    /**
     * @param 'ok'|'erro'|'imagem'|'vazio' $tipo
     * @param array<string, mixed>|null $dados  (ok)    · @param array<string, mixed>|null $meta (erro)
     * @param array<string, string> $cabecalhos
     */
    public function __construct(
        public readonly string $tipo,
        public readonly int $http,
        public readonly ?array $dados = null,
        public readonly string $codigo = '',
        public readonly ?array $meta = null,
        public readonly array $cabecalhos = [],
        public readonly string $bytes = '',
    ) {}

    public static function erro(string $codigo, int $http, ?array $meta = null): self { return new self('erro', $http, null, $codigo, $meta); }
}

final class FotosProxyDeps
{
    /**
     * @param Closure(string, ?int): array $flag             resolvedor de flag (FeatureFlagResolver::resolve)
     * @param Closure(): ?array $sessao                      SessionGate::validate()
     * @param Closure(): string $tokenSessao                 session_id()
     * @param Closure(): bool $csrf                          CSRF válido para escrita
     * @param Closure(int): FotosCanal $canal                fábrica do canal (usuário conferido)
     * @param Closure(int): string $corpo                    leitura PREGUIÇOSA do corpo (até N bytes)
     * @param list<int>|null $publicadores                   null = FotosPermissoes::publicadores()
     */
    public function __construct(
        public readonly Closure $flag,
        public readonly Closure $sessao,
        public readonly Closure $tokenSessao,
        public readonly FotosSessaoRepositorio $repo,
        public readonly Closure $csrf,
        public readonly Closure $canal,
        public readonly Closure $corpo,
        public readonly ?array $publicadores = null,
    ) {}
}

final class FotosProxy
{
    public const FLAG = 'panel_fotos_enabled';
    public const FLAG_ESCRITA = 'panel_fotos_escrita';

    /**
     * @param array<string, mixed> $get
     * @param array<string, string> $cab cabeçalhos relevantes já normalizados: chave (X-Chave-Operacao), se_nao_bater (If-None-Match), tamanho (Content-Length)
     */
    public static function atender(string $metodo, array $get, array $cab, FotosProxyDeps $d): FotosResposta
    {
        try {
            // 1) flag EXCLUSIVA de fotos, global, ANTES de tudo
            $g = ($d->flag)(self::FLAG, null);
            if (($p = FotosPortas::antesDaSessao((string) ($g['source'] ?? 'error'))) !== null) {
                return FotosResposta::erro($p[1], $p[0]);
            }
            // 2) sessão completa
            $uid = FotosSessao::exigir(($d->sessao)(), (string) ($d->tokenSessao)(), $d->repo);
            // 3) rota · 4) flags da pessoa
            $rota = is_string($get['r'] ?? null) ? $get['r'] : '';
            if (!in_array($rota, FotosPortas::ROTAS[$metodo] ?? [], true)) return FotosResposta::erro('NOT_FOUND', 404);
            $pessoa = self::ligada(($d->flag)(self::FLAG, $uid));
            $escrita = $metodo === 'POST' ? self::ligada(($d->flag)(self::FLAG_ESCRITA, $uid)) : false;
            if (($p = FotosPortas::rotaEFlags($metodo, $rota, $pessoa, $escrita)) !== null) return FotosResposta::erro($p[1], $p[0]);
            // 5) CSRF
            if ($metodo === 'POST' && !($d->csrf)()) return FotosResposta::erro('INVALID_CSRF_TOKEN', 403, ['message' => 'Token CSRF inválido.', 'desfecho' => 'recusada']);
            // 6) publicador
            if (FotosPortas::publicador($uid, $d->publicadores) !== null) return FotosResposta::erro('NOT_AUTHORIZED', 403, ['message' => 'Você não tem permissão para gerenciar as fotos.', 'desfecho' => 'recusada']);
            // 7) agora sim: corpo e app
            return $metodo === 'GET' ? self::leitura($rota, $get, $cab, ($d->canal)($uid)) : self::escrita($rota, $get, $cab, $d, $uid);
        } catch (FotosErro $e) {
            return FotosResposta::erro($e->codigo, $e->http, ['message' => $e->getMessage()] + $e->meta);
        } catch (Throwable $e) {
            error_log('[midia] ' . get_class($e) . ': ' . $e->getMessage());
            return FotosResposta::erro('INTERNAL_ERROR', 500, ['message' => 'Erro interno.'] + ($metodo === 'POST' ? ['desfecho' => 'desconhecido'] : []));
        }
    }

    /** flag da pessoa: só `enabled === true` liga; ausente, desligada ou ilegível (`source = error`) = OFF → 404 (DSHOW-103 §1) */
    private static function ligada(array $f): bool
    {
        if ((string) ($f['source'] ?? 'error') === 'error') { error_log('[midia] flag de fotos ilegível para a pessoa — tratada como OFF'); return false; }
        return ($f['enabled'] ?? false) === true;
    }

    private static function leitura(string $rota, array $get, array $cab, FotosCanal $canal): FotosResposta
    {
        switch ($rota) {
            case 'galeria':
                return new FotosResposta('ok', 200, $canal->galeria(FotosCanal::idEstrito($get['product_id'] ?? null, 'product_id')));
            case 'conferir':
                return new FotosResposta('ok', 200, $canal->conferir(is_string($get['chave'] ?? null) ? $get['chave'] : ''));
            default:   // imagem
                $t = $get['t'] ?? '768';
                $img = $canal->imagem(FotosCanal::idEstrito($get['id'] ?? null, 'id'), is_string($t) && ctype_digit($t) ? (int) $t : 0, ($get['removida'] ?? '') === '1', $cab['se_nao_bater'] ?? null);
                // P1-3: a foto de produto passa por sessão e permissão → NUNCA guardada por cache (nem do navegador, nem intermediário)
                $h = ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff'];
                if ($img['etag'] !== '') $h['ETag'] = $img['etag'];
                if ($img['status'] === 304) return new FotosResposta('vazio', 304, null, '', null, $h);
                return new FotosResposta('imagem', 200, null, '', null, $h + ['Content-Type' => $img['tipo'], 'Content-Length' => (string) strlen($img['corpo'])], $img['corpo']);
        }
    }

    private static function escrita(string $rota, array $get, array $cab, FotosProxyDeps $d, int $uid): FotosResposta
    {
        $chave = $cab['chave'] ?? '';
        if ($rota === 'publicar') {
            $produto = FotosCanal::idEstrito($get['product_id'] ?? null, 'product_id');
            if ((int) ($cab['tamanho'] ?? 0) > FotosCanal::MAX_BYTES) throw new FotosErro('PAYLOAD_TOO_LARGE', 413, 'Arquivo maior que 15 MB.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]);
            $bytes = ($d->corpo)(FotosCanal::MAX_BYTES + 1);
            $r = ($d->canal)($uid)->publicar($produto, $chave, $bytes);
            // DSHOW-103 D: publicar `aplicada` = 201; `sem_mudanca` = 200 (o app ≥ ea77d74 também). O reenvio mantém o status do original.
            return new FotosResposta('ok', $r['desfecho'] === 'aplicada' ? 201 : 200, $r);
        }
        $b = json_decode(($d->corpo)(65536), true);
        if (!is_array($b) || array_is_list($b)) throw new FotosErro('INVALID_JSON', 400, 'Corpo inválido.', ['desfecho' => 'recusada']);
        $versao = $b['versao'] ?? null;
        $versao = is_int($versao) ? $versao : 0;   // estrito: só inteiro JSON (o canal recusa < 1)
        $canal = ($d->canal)($uid);
        $r = match ($rota) {
            'capa' => $canal->capa(FotosCanal::idEstrito($b['id'] ?? null, 'id'), $chave, $versao),
            'ordem' => $canal->ordem(FotosCanal::idEstrito($b['product_id'] ?? null, 'product_id'), $chave, $versao, $b['ordem'] ?? null),
            'remover' => $canal->remover(FotosCanal::idEstrito($b['id'] ?? null, 'id'), $chave, $versao),
            'restaurar' => $canal->restaurar(FotosCanal::idEstrito($b['id'] ?? null, 'id'), $chave, $versao),
        };
        return new FotosResposta('ok', 200, $r);
    }
}

/** Emissão da FotosResposta no envelope de sempre do Dash (ApiResponse) — usada pelo index.php e pelo harness HTTP de teste. */
final class FotosProxyEmissor
{
    public static function emitir(FotosResposta $r): void
    {
        // DSHOW-103 §3 (coerência): NENHUMA resposta do proxy (JSON, erro, imagem, 304) é guardada por cache — o conteúdo passa por sessão
        if (!headers_sent()) { header('Cache-Control: private, no-store'); header('X-Content-Type-Options: nosniff'); }
        if ($r->tipo === 'ok') ApiResponse::success($r->dados, null, $r->http);
        if ($r->tipo === 'erro') ApiResponse::error($r->codigo, $r->http, $r->meta);
        foreach ($r->cabecalhos as $k => $v) header($k . ': ' . $v);
        http_response_code($r->http);
        if ($r->tipo === 'imagem') echo $r->bytes;
        exit;
    }
}
