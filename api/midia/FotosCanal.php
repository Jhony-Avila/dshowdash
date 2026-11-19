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
    /**
     * CONFIGURAÇÃO DO PILOTO, EXPLÍCITA E VERSIONADA (DSHOW-103 C, 19/11): quem publica pelo Dash. Piloto aprovado pelo Jhony = SÓ o 75.
     * Mudar esta lista é mudança de código (commit + revisão + deploy oficial) — nunca um padrão implícito.
     * O caminho por permissão (UARPS `produtos.foto.enviar`) e por nível NÃO existe aqui (depois, com aprovação).
     */
    public const PILOTO = [75];

    /**
     * Fonte efetiva da lista. `DSHOW_FOTOS_PUBLICADORES` só substitui o piloto quando é uma lista ESTRITA de ids ("75" ou "75,546", até 20).
     * Qualquer outro valor PRESENTE — "*", vazio, espaços, "75,*", lixo — vale NINGUÉM (fail-closed, com log), nunca "todos" e nunca o
     * piloto por engano. Ausente = o PILOTO versionado acima.
     * @return list<int>
     */
    public static function publicadores(?string $env = null, bool $lerAmbiente = true): array
    {
        $e = $env ?? ($lerAmbiente ? getenv('DSHOW_FOTOS_PUBLICADORES') : false);
        if ($e === false || $e === null) return self::PILOTO;
        if (!is_string($e) || !preg_match('/^[1-9][0-9]{0,9}(,[1-9][0-9]{0,9}){0,19}$/', $e)) {
            error_log('[midia/fotos] DSHOW_FOTOS_PUBLICADORES inválido (valor omitido) — ninguém publica (fail-closed)');
            return [];
        }
        return array_values(array_unique(array_map('intval', explode(',', $e))));
    }

    /** @param list<int>|null $publicadores */
    public static function publica(int $userId, ?array $publicadores = null): bool
    {
        $lista = $publicadores ?? self::publicadores();
        foreach ($lista as $x) if (!is_int($x)) return false;   // lista mal formada (ex.: '*') nunca habilita
        return $userId > 0 && in_array($userId, $lista, true);
    }
}

final class FotosCanal
{
    public const MAX_BYTES = 15 * 1024 * 1024;   // o mesmo teto do app (15 MB)
    public const TAMANHOS = [256, 768, 1536, 2048];
    public const MAX_ORDEM = 100;                 // o limite do app (DSHOW-100)
    private const OPERACOES = ['publicar', 'capa', 'ordem', 'remover', 'restaurar'];

    public function __construct(private readonly FotosAppCliente $app, private readonly int $userId) {}

    /**
     * DSHOW-103 B: identificador ESTRITO — inteiro JSON > 0 ou texto só de dígitos sem zero à esquerda ("12"), até 18 dígitos.
     * "12abc", "012", 12.0, true, "" e negativos são recusados (nada de intval que transforma lixo em id).
     */
    public static function idEstrito(mixed $v, string $campo): int
    {
        if (is_int($v) && $v > 0) return $v;
        if (is_string($v) && preg_match('/^[1-9][0-9]{0,17}$/', $v)) return (int) $v;
        throw new FotosErro('VALIDATION_ERROR', 422, 'Identificador inválido.', ['desfecho' => 'recusada', 'campos' => [$campo]]);
    }

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
            'aplicada', 'sem_mudanca' => array_merge($base, ['resultado' => $estado, 'recibo' => $this->reciboConferido($j['recibo'] ?? null, $chave, $estado)]),
            'em_andamento' => array_merge($base, ['resultado' => 'em_andamento', 'desde' => $j['desde'] ?? null]),
            'pode_estar_demorando' => array_merge($base, ['resultado' => 'em_andamento', 'sinal' => 'pode_estar_demorando', 'desde' => $j['desde'] ?? null]),
            'nao_aplicada' => array_merge($base, ['resultado' => 'nao_aplicada', 'erro' => ['codigo' => (string) ($j['erro']['code'] ?? 'recusada'),
                'http' => (int) ($j['http_status'] ?? 0), 'mensagem' => (string) ($j['erro']['message'] ?? 'Não foi salvo.')]]),
            // DSHOW-103 §5-A: "não encontrada" NÃO autoriza chave nova — um POST ainda em trânsito pode chegar depois. Reenviar só com a
            // MESMA chave (idempotente: se o primeiro chegar, o app devolve o recibo dele ou "em andamento"). Campo aditivo.
            'nao_encontrada' => array_merge($base, ['resultado' => 'nao_encontrada', 'reenvio_seguro' => true, 'com_a_mesma_chave' => true]),
            default => throw new FotosErro('RESULTADO_DESCONHECIDO', 502, 'Resposta do app sem estado conhecido.', ['desfecho' => 'desconhecido', 'chave' => $chave]),
        };
    }

    /** Conferir: o recibo devolvido tem de ser DESTA chave e DESTE titular (DSHOW-103 A); senão não há o que afirmar. */
    private function reciboConferido(mixed $r, string $chave, string $estado): array
    {
        $rec = self::recibo($r);
        if ($rec === null || ($rec['chave'] ?? null) !== $chave || ($rec['titular_user_id'] ?? null) !== $this->userId || ($rec['desfecho'] ?? null) !== $estado) {
            throw new FotosErro('RESULTADO_DESCONHECIDO', 502, 'Resposta do app sem recibo desta operação.', ['desfecho' => 'desconhecido', 'chave' => $chave]);
        }
        return $rec;
    }

    // ── escrita (uma chave por intenção) ─────────────────────────────────────────────────────────────────────────────────────
    public function publicar(int $produtoId, string $chave, string $bytes): array
    {
        $chave = self::chave($chave);
        if ($produtoId <= 0) throw new FotosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['desfecho' => 'recusada', 'campos' => ['product_id']]);
        if ($bytes === '') throw new FotosErro('VALIDATION_ERROR', 422, 'Arquivo vazio.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]);
        if (strlen($bytes) > self::MAX_BYTES) throw new FotosErro('PAYLOAD_TOO_LARGE', 413, 'Arquivo maior que 15 MB.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]);
        if (self::tipoPelosBytes($bytes) === null) throw new FotosErro('UNSUPPORTED_MEDIA', 415, 'Formato não aceito. Envie JPEG, PNG, WebP ou HEIC.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]);
        return $this->escrita('publicar', '/products/' . $produtoId . '/media', ['user_id' => $this->userId, 'request_id' => $chave], $bytes, $chave, ['produto_id' => $produtoId]);
    }

    public function capa(int $mediaId, string $chave, int $versao): array
    {
        $chave = self::chave($chave);
        return $this->escrita('capa', '/products/media/' . self::id($mediaId) . '/cover', $this->q($chave, $versao), '', $chave, ['foto_id' => $mediaId]);
    }

    /**
     * @param list<mixed> $ordem lista COMPLETA das fotos ativas, na ordem nova (a 1ª vira a capa). DSHOW-103 B: lista JSON (não objeto), 1 a
     * 100 itens (o limite do app, sem paginação), cada item um id ESTRITO, sem repetição — senão 422 recusada e nada sai para o app.
     */
    public function ordem(int $produtoId, string $chave, int $versao, mixed $ordem): array
    {
        $erro = new FotosErro('VALIDATION_ERROR', 422, 'Ordem inválida.', ['desfecho' => 'recusada', 'campos' => ['ordem']]);
        if (!is_array($ordem) || !array_is_list($ordem) || $ordem === [] || count($ordem) > self::MAX_ORDEM) throw $erro;
        $ids = [];
        foreach ($ordem as $x) { try { $ids[] = self::idEstrito($x, 'ordem'); } catch (FotosErro) { throw $erro; } }
        if (count(array_unique($ids)) !== count($ids)) throw $erro;
        $chave = self::chave($chave);
        return $this->escrita('ordem', '/products/' . self::id($produtoId) . '/media/order', $this->q($chave, $versao) + ['ordem' => implode(',', $ids)], '', $chave,
            ['produto_id' => $produtoId, 'ordem' => $ids]);
    }

    public function remover(int $mediaId, string $chave, int $versao): array
    {
        $chave = self::chave($chave);
        return $this->escrita('remover', '/products/media/' . self::id($mediaId) . '/remove', $this->q($chave, $versao), '', $chave, ['foto_id' => $mediaId]);
    }

    public function restaurar(int $mediaId, string $chave, int $versao): array
    {
        $chave = self::chave($chave);
        return $this->escrita('restaurar', '/products/media/' . self::id($mediaId) . '/restore', $this->q($chave, $versao), '', $chave, ['foto_id' => $mediaId]);
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

    /** @param array<string, mixed> $espera campos que o recibo TEM de trazer iguais ao pedido (correlação, DSHOW-103 A) */
    private function escrita(string $op, string $caminho, array $query, string $corpo, string $chave, array $espera = []): array
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
            // DSHOW-103 A: o recibo tem de ser DESTE pedido — mesma chave, mesma operação, mesmo titular, mesma foto/produto, e o desfecho
            // do recibo igual ao da resposta. Qualquer divergência = não dá para afirmar "salvo" → desconhecido com a MESMA chave.
            if ($rec !== null && !$this->correlato($rec, $op, $chave, $espera, $des)) {
                error_log('[midia/fotos] recibo do app NÃO correlaciona com o pedido (' . $op . ') — tratado como desconhecido');
                $rec = null;
            }
            if ($rec === null || !in_array($des, ['aplicada', 'sem_mudanca'], true)) {
                throw new FotosErro('RESULTADO_DESCONHECIDO', 502, 'Não conseguimos confirmar se foi salvo.', ['desfecho' => 'desconhecido', 'gravado' => null, 'chave' => $chave]);
            }
            return ['desfecho' => $des, 'recibo' => $rec, 'repetido' => !empty($r['replay'])];
        }
        $env = is_array($j) ? $j : [];
        if (self::assinaturaRecusada($r['status'], $env)) {   // o app recusou a ASSINATURA (segredo diferente/ausente lá): nada foi gravado; é configuração do canal
            throw new FotosErro('APP_UNAVAILABLE', 503, 'O app de fotos recusou a assinatura do canal. Nada foi gravado.', ['desfecho' => 'recusada', 'gravado' => false, 'chave' => $chave]);
        }
        $des = (string) ($env['desfecho'] ?? '');
        $msg = (string) ($env['error']['message'] ?? '');
        $codigo = (string) ($env['error']['code'] ?? '');
        // 5xx, desfecho "desconhecido" ou corpo ilegível (só uma recusa ESCRITA prova que não gravou) → desconhecido com a MESMA chave
        if ($r['status'] >= 500 || $des === 'desconhecido' || $env === []) {
            throw new FotosErro('RESULTADO_DESCONHECIDO', 502, 'Não conseguimos confirmar se foi salvo.', ['desfecho' => 'desconhecido', 'gravado' => null, 'chave' => $chave]);
        }
        // em_andamento (inclusive a tentativa que PERDEU a posse no app, ea77d74) = gravado DESCONHECIDO (null) → a tela confere pela MESMA chave
        $desfecho = in_array($des, ['recusada', 'conflito', 'em_andamento'], true) ? $des : 'recusada';
        $gravado = $desfecho === 'em_andamento' ? null : (array_key_exists('gravado', $env) && $env['gravado'] === null ? null : false);
        $meta = ['desfecho' => $desfecho, 'gravado' => $gravado, 'chave' => $chave];
        if (($r['versao_galeria'] ?? '') !== '' && ctype_digit((string) $r['versao_galeria'])) $meta['versao_atual'] = (int) $r['versao_galeria'];
        if (!empty($r['retry_after'])) $meta['retry_after'] = (string) $r['retry_after'];
        $http = in_array($r['status'], [400, 403, 404, 409, 413, 415, 422, 429], true) ? $r['status'] : 422;
        throw new FotosErro($codigo !== '' ? strtoupper($codigo) : 'RECUSADA', $http, $msg !== '' ? $msg : 'Não foi salvo.', $meta);
    }

    /** @param array<string, mixed> $rec recibo já convertido (operacao com prefixo foto_) */
    private function correlato(array $rec, string $op, string $chave, array $espera, string $desfechoResposta): bool
    {
        if (($rec['chave'] ?? null) !== $chave || ($rec['operacao'] ?? null) !== 'foto_' . $op) return false;
        if (($rec['titular_user_id'] ?? null) !== $this->userId) return false;   // app ≥ ea77d74: o recibo identifica o titular
        if (($rec['desfecho'] ?? null) !== $desfechoResposta) return false;
        foreach ($espera as $campo => $valor) if (($rec[$campo] ?? null) !== $valor) return false;
        return true;
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

    /**
     * Integração DSHOW-100 §6 (19/11): o app responde **403 `assinatura_invalida`** quando a assinatura não confere (contrato
     * fotos-navegador.md §6 / web-channel-routes.ts), não 401. Os dois são "o canal recusou a assinatura" — configuração, nada gravado —
     * e NUNCA "sem permissão" do usuário.
     */
    private static function assinaturaRecusada(int $status, mixed $j): bool
    {
        return $status === 401 || ($status === 403 && is_array($j) && (($j['error']['code'] ?? null) === 'assinatura_invalida'));
    }

    private static function erroLeitura(int $status, mixed $j): FotosErro
    {
        $msg = is_array($j) ? (string) ($j['error']['message'] ?? '') : '';
        return match (true) {
            self::assinaturaRecusada($status, $j) => new FotosErro('APP_UNAVAILABLE', 503, 'O app de fotos recusou a assinatura do canal.'),
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
