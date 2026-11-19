<?php
declare(strict_types=1);

/**
 * /api/midia/FotosCanal.php — FOTOS-1 (19/11, DIREITA): galeria de fotos do produto no Dash, escrevendo SÓ pelo app (decisão do Jhony:
 * o app é o único dono das fotos — product_media + pipeline do app; o Dash não grava foto em banco nem em disco; não existe eq_foto).
 * Contrato do app: docs/contracts/fotos-canal-publicacao.md (FOTOS-1). Contrato do Dash: "foi salvo ou não" (CONTRATO-FOI-SALVO.md).
 *
 * Porta de publicar (Dash), fail-closed: SÓ o usuário 75 no piloto (Jhony, 19/11). `produtos.foto.enviar` (fotógrafos) e qualquer
 * caminho por nível/UARPS ficam para depois, com aprovação. O app confere de novo (PRODUCT_PHOTO_WEB_PUBLISH_USER_IDS + regra dele) —
 * a palavra final é dele.
 *
 * Desfecho de toda escrita (mesmas palavras do contrato "foi salvo"):
 *   2xx com recibo → {desfecho: aplicada|sem_mudanca, recibo}; 2xx sem recibo ou ilegível → DESCONHECIDO (nunca "salvo");
 *   4xx com envelope → recusada/conflito (o que o app disser; nada gravado); 5xx, timeout ou rede → DESCONHECIDO com a MESMA chave
 *   (a tela oferece "Conferir gravação" = GET /operacoes/:chave, que nunca reexecuta); sem segredo → recusada (nada saiu do Dash).
 */
final class FotosErro extends RuntimeException
{
    /** @param array<string, mixed> $meta */
    public function __construct(public readonly string $codigo, public readonly int $http, string $mensagem, public readonly array $meta = [])
    {
        parent::__construct($mensagem);
    }
}

final class FotosPermissoes
{
    /** Piloto (Jhony, 19/11): SÓ o usuário 75 publica. O caminho por permissão explícita (UARPS) e por nível fica para depois, com
     *  `produtos.foto.enviar` e aprovação do Jhony — NÃO existe aqui. DSHOW_FOTOS_PUBLICADORES ("1,2") só na validação. */
    public const PUBLICADORES_PADRAO = [75];

    public static function publicadores(): array
    {
        $e = getenv('DSHOW_FOTOS_PUBLICADORES');
        return is_string($e) && preg_match('/^[1-9][0-9]{0,9}(,[1-9][0-9]{0,9})*$/', $e) ? array_map('intval', explode(',', $e)) : self::PUBLICADORES_PADRAO;
    }

    public static function publica(int $userId, ?array $publicadores = null): bool
    {
        return $userId > 0 && in_array($userId, $publicadores ?? self::publicadores(), true);
    }
}

final class FotosCanal
{
    public const MAX_BYTES = 15 * 1024 * 1024;   // o mesmo teto do app (15 MB)
    public const TAMANHOS = [256, 768, 1536, 2048];
    private const OPERACOES = ['publicar', 'capa', 'ordem', 'remover', 'restaurar'];

    public function __construct(private readonly FotosAppCliente $app, private readonly int $userId) {}

    /** Chave de operação do Dash (X-Chave-Operacao) = request_id do app: 16 a 64 [A-Za-z0-9_-]. */
    public static function chave(?string $c): string
    {
        $c = trim((string) $c);
        if (!preg_match('/^[A-Za-z0-9_-]{16,64}$/', $c)) throw new FotosErro('VALIDATION_ERROR', 422, 'Chave de operação ausente ou inválida.', ['desfecho' => 'recusada', 'campos' => ['chave']]);
        return $c;
    }

    /** Pré-filtro pelos BYTES (o app decide de novo pelo conteúdo): JPEG, PNG, WebP ou HEIC/HEIF. */
    public static function tipoPelosBytes(string $b): ?string
    {
        if (strncmp($b, "\xFF\xD8\xFF", 3) === 0) return 'jpeg';
        if (strncmp($b, "\x89PNG\r\n\x1A\n", 8) === 0) return 'png';
        if (strlen($b) >= 12 && substr($b, 0, 4) === 'RIFF' && substr($b, 8, 4) === 'WEBP') return 'webp';
        if (strlen($b) >= 12 && substr($b, 4, 4) === 'ftyp' && in_array(substr($b, 8, 4), ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'], true)) return 'heic';
        return null;
    }

    // ── leitura ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
    public function galeria(int $produtoId): array
    {
        if ($produtoId <= 0) throw new FotosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['campos' => ['product_id']]);
        $r = $this->app->pedir('GET', '/products/' . $produtoId . '/gallery', ['user_id' => $this->userId]);
        if ($r['erro'] !== null) throw self::indisponivel($r['erro'], false);
        $j = self::json($r['corpo']);
        if ($r['status'] === 200 && is_array($j) && isset($j['fotos']) && is_array($j['fotos'])) return $j;
        throw self::erroLeitura($r['status'], $j);
    }

    /** @return array{status:int, corpo:string, tipo:string, etag:string} 200 com bytes ou 304 sem corpo */
    public function imagem(int $mediaId, int $tamanho, bool $removida, ?string $etag): array
    {
        if ($mediaId <= 0 || !in_array($tamanho, self::TAMANHOS, true)) throw new FotosErro('VALIDATION_ERROR', 422, 'Pedido de imagem inválido.');
        $q = ['user_id' => $this->userId, 'size' => $tamanho, 'format' => 'webp'];
        if ($removida) $q['removida'] = 1;
        $r = $this->app->pedir('GET', '/products/media/' . $mediaId . '/image', $q, '', 'application/octet-stream', null, $etag);
        if ($r['erro'] !== null) throw self::indisponivel($r['erro'], false);
        if ($r['status'] === 304) return ['status' => 304, 'corpo' => '', 'tipo' => '', 'etag' => (string) ($r['etag'] ?? '')];
        if ($r['status'] === 200 && preg_match('#^image/(webp|jpeg)#', (string) $r['tipo'])) return ['status' => 200, 'corpo' => $r['corpo'], 'tipo' => (string) $r['tipo'], 'etag' => (string) ($r['etag'] ?? '')];
        throw self::erroLeitura($r['status'], self::json($r['corpo']));
    }

    /** Conferir gravação: GET /operacoes/:chave (nunca reexecuta) → forma do "Conferir" do Dash. */
    public function conferir(string $chave): array
    {
        $chave = self::chave($chave);
        $r = $this->app->pedir('GET', '/operacoes/' . $chave, ['user_id' => $this->userId]);
        if ($r['erro'] !== null) throw self::indisponivel($r['erro'], false);
        $j = self::json($r['corpo']);
        if ($r['status'] !== 200 || !is_array($j)) throw self::erroLeitura($r['status'], $j);
        $estado = (string) ($j['estado'] ?? '');
        $base = ['chave' => $chave, 'operacao' => isset($j['operacao']) ? 'foto_' . $j['operacao'] : null, 'recibo' => null, 'erro' => null];
        return match ($estado) {
            'aplicada', 'sem_mudanca' => array_merge($base, ['resultado' => $estado, 'recibo' => self::recibo($j['recibo'] ?? null)]),
            'em_andamento' => array_merge($base, ['resultado' => 'em_andamento', 'desde' => $j['desde'] ?? null]),
            'pode_estar_demorando' => array_merge($base, ['resultado' => 'em_andamento', 'sinal' => 'pode_estar_demorando', 'desde' => $j['desde'] ?? null]),
            'nao_aplicada' => array_merge($base, ['resultado' => 'nao_aplicada', 'erro' => ['codigo' => (string) ($j['erro']['code'] ?? 'recusada'),
                'http' => (int) ($j['http_status'] ?? 0), 'mensagem' => (string) ($j['erro']['message'] ?? 'Não foi salvo.')]]),
            'nao_encontrada' => array_merge($base, ['resultado' => 'nao_encontrada', 'reenvio_seguro' => true]),
            default => throw new FotosErro('RESULTADO_DESCONHECIDO', 502, 'Resposta do app sem estado conhecido.', ['desfecho' => 'desconhecido', 'chave' => $chave]),
        };
    }

    // ── escrita (uma chave por intenção) ─────────────────────────────────────────────────────────────────────────────────────
    public function publicar(int $produtoId, string $chave, string $bytes): array
    {
        $chave = self::chave($chave);
        if ($produtoId <= 0) throw new FotosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['desfecho' => 'recusada', 'campos' => ['product_id']]);
        if ($bytes === '') throw new FotosErro('VALIDATION_ERROR', 422, 'Arquivo vazio.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]);
        if (strlen($bytes) > self::MAX_BYTES) throw new FotosErro('PAYLOAD_TOO_LARGE', 413, 'Arquivo maior que 15 MB.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]);
        if (self::tipoPelosBytes($bytes) === null) throw new FotosErro('UNSUPPORTED_MEDIA', 415, 'Formato não aceito. Envie JPEG, PNG, WebP ou HEIC.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]);
        return $this->escrita('publicar', '/products/' . $produtoId . '/media', ['user_id' => $this->userId, 'request_id' => $chave], $bytes, $chave);
    }

    public function capa(int $mediaId, string $chave, int $versao): array
    {
        return $this->escrita('capa', '/products/media/' . self::id($mediaId) . '/cover', $this->q(self::chave($chave), $versao), '', $chave);
    }

    /** @param list<int> $ordem lista COMPLETA das fotos ativas, na ordem nova (a 1ª vira a capa) */
    public function ordem(int $produtoId, string $chave, int $versao, array $ordem): array
    {
        $ids = array_values(array_unique(array_map('intval', $ordem)));
        if (!$ids || count($ids) !== count($ordem) || min($ids) <= 0 || count($ids) > 200) throw new FotosErro('VALIDATION_ERROR', 422, 'Ordem inválida.', ['desfecho' => 'recusada', 'campos' => ['ordem']]);
        return $this->escrita('ordem', '/products/' . self::id($produtoId) . '/media/order', $this->q(self::chave($chave), $versao) + ['ordem' => implode(',', $ids)], '', $chave);
    }

    public function remover(int $mediaId, string $chave, int $versao): array
    {
        return $this->escrita('remover', '/products/media/' . self::id($mediaId) . '/remove', $this->q(self::chave($chave), $versao), '', $chave);
    }

    public function restaurar(int $mediaId, string $chave, int $versao): array
    {
        return $this->escrita('restaurar', '/products/media/' . self::id($mediaId) . '/restore', $this->q(self::chave($chave), $versao), '', $chave);
    }

    // ── internos ────────────────────────────────────────────────────────────────────────────────────────────────────────────
    private function q(string $chave, int $versao): array
    {
        if ($versao < 1) throw new FotosErro('VALIDATION_ERROR', 422, 'Versão da galeria ausente.', ['desfecho' => 'recusada', 'campos' => ['versao']]);
        return ['user_id' => $this->userId, 'request_id' => $chave, 'versao' => $versao];
    }

    private static function id(int $id): int
    {
        if ($id <= 0) throw new FotosErro('VALIDATION_ERROR', 422, 'Identificador inválido.', ['desfecho' => 'recusada', 'campos' => ['id']]);
        return $id;
    }

    private function escrita(string $op, string $caminho, array $query, string $corpo, string $chave): array
    {
        assert(in_array($op, self::OPERACOES, true));
        $r = $this->app->pedir('POST', $caminho, $query, $corpo);
        if ($r['erro'] === 'segredo') throw self::indisponivel('segredo', true);
        if ($r['erro'] !== null) {   // timeout/rede: pode ter gravado → desconhecido com a MESMA chave
            throw new FotosErro('RESULTADO_DESCONHECIDO', 504, 'Não conseguimos confirmar se foi salvo.', ['desfecho' => 'desconhecido', 'gravado' => null, 'chave' => $chave]);
        }
        $j = self::json($r['corpo']);
        if ($r['status'] >= 200 && $r['status'] < 300) {
            $rec = is_array($j) ? self::recibo($j['recibo'] ?? null) : null;
            $des = is_array($j) ? (string) ($j['desfecho'] ?? '') : '';
            if ($rec === null || !in_array($des, ['aplicada', 'sem_mudanca'], true)) {
                throw new FotosErro('RESULTADO_DESCONHECIDO', 502, 'Não conseguimos confirmar se foi salvo.', ['desfecho' => 'desconhecido', 'gravado' => null, 'chave' => $chave]);
            }
            return ['desfecho' => $des, 'recibo' => $rec, 'repetido' => !empty($r['replay'])];
        }
        $env = is_array($j) ? $j : [];
        $des = (string) ($env['desfecho'] ?? '');
        $msg = (string) ($env['error']['message'] ?? '');
        $codigo = (string) ($env['error']['code'] ?? '');
        // 5xx, desfecho "desconhecido" ou corpo ilegível (só uma recusa ESCRITA prova que não gravou) → desconhecido com a MESMA chave
        if ($r['status'] >= 500 || $des === 'desconhecido' || $env === []) {
            throw new FotosErro('RESULTADO_DESCONHECIDO', 502, 'Não conseguimos confirmar se foi salvo.', ['desfecho' => 'desconhecido', 'gravado' => null, 'chave' => $chave]);
        }
        $meta = ['desfecho' => in_array($des, ['recusada', 'conflito', 'em_andamento'], true) ? $des : 'recusada', 'gravado' => $env['gravado'] ?? false, 'chave' => $chave];
        if (($r['versao_galeria'] ?? '') !== '' && ctype_digit((string) $r['versao_galeria'])) $meta['versao_atual'] = (int) $r['versao_galeria'];
        if (!empty($r['retry_after'])) $meta['retry_after'] = (string) $r['retry_after'];
        $http = in_array($r['status'], [400, 403, 404, 409, 413, 415, 422, 429], true) ? $r['status'] : 422;
        throw new FotosErro($codigo !== '' ? strtoupper($codigo) : 'RECUSADA', $http, $msg !== '' ? $msg : 'Não foi salvo.', $meta);
    }

    /** Recibo do app → recibo do Dash (operacao prefixada; chaves em ordem alfabética, como o app). */
    private static function recibo(mixed $r): ?array
    {
        if (!is_array($r) || !isset($r['desfecho'], $r['chave'], $r['operacao'])) return null;
        $r['operacao'] = 'foto_' . (string) $r['operacao'];
        ksort($r);
        return $r;
    }

    private static function indisponivel(string $erro, bool $escrita): FotosErro
    {
        if ($erro === 'segredo') {
            return new FotosErro('APP_UNAVAILABLE', 503, 'O canal com o app de fotos não está configurado. Nada foi enviado.', ['desfecho' => 'recusada', 'gravado' => false]);
        }
        return new FotosErro('APP_UNAVAILABLE', 503, $erro === 'timeout' ? 'O app de fotos demorou para responder.' : 'O app de fotos não respondeu.', $escrita ? ['desfecho' => 'desconhecido'] : []);
    }

    private static function erroLeitura(int $status, mixed $j): FotosErro
    {
        $msg = is_array($j) ? (string) ($j['error']['message'] ?? '') : '';
        return match (true) {
            $status === 403 => new FotosErro('NOT_AUTHORIZED', 403, $msg ?: 'Você não tem permissão para gerenciar as fotos.'),
            $status === 404 => new FotosErro('NOT_FOUND', 404, $msg ?: 'Não encontrado.'),
            $status === 429 => new FotosErro('RATE_LIMITED', 429, $msg ?: 'Muitos pedidos seguidos. Espere um pouco.'),
            default => new FotosErro('APP_UNAVAILABLE', 503, 'O app de fotos respondeu com erro.'),
        };
    }

    private static function json(string $s): mixed
    {
        if ($s === '') return null;
        try { return json_decode($s, true, 32, JSON_THROW_ON_ERROR); } catch (JsonException) { return null; }
    }
}
