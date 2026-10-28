<?php
// Google Calendar / GcalWatchService - canais de notificacao push (§50)
// @module google-calendar.watch
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// O Google avisa que ALGO mudou; nunca diz o que. Entao um canal aberto nao
// substitui a sincronizacao — ele so a dispara mais cedo do que o fallback de
// 15 minutos faria. Confiar no corpo da notificacao e o erro classico aqui.
//
// Canal dura no maximo ~1 semana. Sem renovacao, a agenda simplesmente para de
// atualizar em tempo real e ninguem percebe: o fallback continua funcionando,
// so que devagar. Por isso `watch_renew` roda de hora em hora.
declare(strict_types=1);

final class GcalWatchService
{
    /** Renova canal que expira dentro desta janela. */
    public const HORAS_ANTECEDENCIA = 24;

    public function __construct(
        private GcalRepository $repo,
        private GcalAuthService $auth
    ) {}

    /**
     * Endereco publico do webhook.
     *
     * O Google exige HTTPS com certificado valido e NAO aceita porta fora do
     * padrao nem host local. Em desenvolvimento isto simplesmente nao funciona,
     * e e melhor falhar dizendo isso do que abrir um canal que nunca entrega.
     */
    public static function endereco(): string
    {
        $v = getenv('GCAL_WEBHOOK_URL');
        if (is_string($v) && $v !== '') return $v;
        return 'https://dshowdash.com.br/api/google-calendar/webhook';
    }

    public static function configurado(): bool
    {
        return str_starts_with(self::endereco(), 'https://');
    }

    /**
     * Abre um canal para um calendario e para o anterior, nessa ordem.
     *
     * A ORDEM IMPORTA: parar antes de abrir deixa uma janela sem cobertura, e
     * mudanca que acontecer nela so aparece no fallback. Abrir antes custa, no
     * pior caso, uma notificacao duplicada — que a deduplicacao da fila absorve.
     *
     * @return array{channel_id:string,expiration:string}
     */
    public function abrir(int $accountId, string $calendarId): array
    {
        if (!self::configurado()) {
            throw new RuntimeException(
                'Webhook precisa de uma URL https pública (GCAL_WEBHOOK_URL).');
        }

        $anteriores = $this->repo->canaisAtivosDe($accountId, $calendarId);

        $channelId = self::uuid();
        $token     = bin2hex(random_bytes(24));

        $r = $this->auth->clientePara($accountId)
            ->abrirCanal($calendarId, $channelId, self::endereco(), $token);

        $resourceId = (string)($r['resourceId'] ?? '');
        if ($resourceId === '') {
            throw new RuntimeException('O Google não devolveu resourceId ao abrir o canal.');
        }

        // `expiration` vem em MILISSEGUNDOS desde a época — dividir por mil é
        // obrigatório, senão a data cai no ano 56.000 e o canal nunca é
        // renovado (o sintoma seria a agenda parar de atualizar em ~1 semana).
        $ms = (int)($r['expiration'] ?? 0);
        $exp = $ms > 0
            ? gmdate('Y-m-d H:i:s', intdiv($ms, 1000))
            : gmdate('Y-m-d H:i:s', time() + 6 * 86400);

        $this->repo->salvarCanal([
            'channel_id' => $channelId, 'account_id' => $accountId,
            'calendar_id' => $calendarId, 'resource_id' => $resourceId,
            'token' => $token, 'expiration' => $exp,
        ]);

        foreach ($anteriores as $a) {
            $this->parar($accountId, (string)$a['channel_id'], (string)$a['resource_id']);
        }

        return ['channel_id' => $channelId, 'expiration' => $exp];
    }

    /**
     * Para um canal no Google e marca localmente.
     *
     * Se o Google recusar (canal já expirado é o caso comum), marcamos assim
     * mesmo: manter local um canal que não existe mais faria a renovação achar
     * que há cobertura onde não há.
     */
    public function parar(int $accountId, string $channelId, string $resourceId): void
    {
        try {
            $this->auth->clientePara($accountId)->fecharCanal($channelId, $resourceId);
        } catch (\Throwable $e) {
            error_log('[gcal] channels.stop falhou em ' . $channelId . ': ' . $e->getMessage());
        }
        $this->repo->marcarCanalParado($channelId);
    }

    /**
     * Renova todos os canais perto de vencer.
     *
     * @return array{renovados:int,falhas:int,detalhe:array}
     */
    public function renovarVencendo(int $horas = self::HORAS_ANTECEDENCIA): array
    {
        $out = ['renovados' => 0, 'falhas' => 0, 'detalhe' => []];
        foreach ($this->repo->canaisAVencer($horas) as $c) {
            try {
                $novo = $this->abrir((int)$c['account_id'], (string)$c['calendar_id']);
                $out['renovados']++;
                $out['detalhe'][] = ['calendar_id' => $c['calendar_id'], 'ok' => true,
                                     'expira' => $novo['expiration']];
            } catch (\Throwable $e) {
                // Um calendário sem permissão de watch não pode impedir a
                // renovação dos outros — senão um único erro congela o push
                // da conta inteira.
                $out['falhas']++;
                $out['detalhe'][] = ['calendar_id' => $c['calendar_id'], 'ok' => false,
                                     'erro' => mb_substr($e->getMessage(), 0, 180)];
                error_log('[gcal] renovação de canal falhou em ' . $c['calendar_id']
                        . ': ' . $e->getMessage());
            }
        }
        return $out;
    }

    /** Abre canal para todo calendário selecionado de uma conta. */
    public function abrirDaConta(int $accountId): array
    {
        $st = $this->repo->pdo()->prepare(
            "SELECT calendar_id FROM gcal_calendars WHERE account_id = :a AND deleted = 0");
        $st->execute([':a' => $accountId]);

        $out = ['abertos' => 0, 'falhas' => 0];
        foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $cal) {
            // Já coberto e longe de vencer? Não gasta chamada.
            $ativos = $this->repo->canaisAtivosDe($accountId, (string)$cal);
            if ($ativos && strtotime((string)$ativos[0]['expiration'] . ' UTC')
                           > time() + self::HORAS_ANTECEDENCIA * 3600) {
                continue;
            }
            try { $this->abrir($accountId, (string)$cal); $out['abertos']++; }
            catch (\Throwable $e) {
                $out['falhas']++;
                error_log('[gcal] watch falhou em ' . $cal . ': ' . $e->getMessage());
            }
        }
        return $out;
    }

    /** UUID v4 — o Google exige que o id do canal seja único e nosso. */
    private static function uuid(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
    }
}
