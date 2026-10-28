<?php
// Google Calendar / GcalGoLive - a checklist do go-live, em UM lugar so
// @module google-calendar.golive
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// Tres superficies precisam responder "o que ainda falta para ligar?": o 503 do
// GcalReal, a rota /status (tela de Contas) e o script de terminal. Se cada uma
// tivesse a propria lista, elas divergiriam na primeira mudanca — e o operador
// que estiver colando as credenciais receberia respostas diferentes conforme
// onde olhasse. Entao a lista mora AQUI e as tres leem daqui.
//
// Cada item responde tres coisas, nessa ordem, porque e a ordem em que a pessoa
// precisa delas: o que e, se ja esta pronto, e o comando/passo exato que
// resolve. "Falta a chave" sem dizer como gerar a chave nao ajuda ninguem.
declare(strict_types=1);

final class GcalGoLive
{
    /**
     * Arquivo tocado pelo worker a cada execucao.
     *
     * E a unica forma barata de distinguir "o cron esta rodando e nao havia
     * trabalho" de "o cron nunca rodou". Sem o batimento, os dois casos
     * produzem exatamente a mesma tela — e so o segundo quebra a agenda.
     *
     * Fica em `storage/`, NAO em `/tmp`: o worker roda como www-data pelo cron
     * mas como root quando alguem testa a mao, e um arquivo em /tmp criado pelo
     * primeiro deixa o segundo sem permissao. Em `storage/` o dono e www-data,
     * que e quem importa.
     */
    public const ARQUIVO_BATIMENTO = __DIR__ . '/../../../storage/gcal-worker.heartbeat';

    /** Trava do worker. Mesmo motivo do batimento para nao ficar em /tmp. */
    public const ARQUIVO_TRAVA = __DIR__ . '/../../../storage/gcal-worker.lock';

    /** Chaves do .env que o modulo le. Fonte unica para doc e verificador. */
    public const CHAVES_ENV = [
        'GCAL_PROVIDER'                        => 'mock | google',
        'GOOGLE_CALENDAR_OAUTH_CLIENT_ID'      => 'OAuth 2.0 Client ID (Web application)',
        'GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET'  => 'OAuth 2.0 Client Secret',
        'GOOGLE_CALENDAR_REDIRECT_URI'         => 'opcional; default já aponta para o callback correto',
        'GCAL_OAUTH_STAGE'                     => 'read | write (§31.1 — começar em read)',
        'GCAL_CRYPTO_KEY'                      => '32 bytes em base64 (cifra os tokens)',
    ];

    /**
     * Memoria da requisicao. `pronto()`, `pendencias()` e `resumo()` chamam
     * `itens()`, e uma resposta de /status usa dois deles — sem cache seriam 6+
     * consultas ao banco para responder a mesma pergunta duas vezes.
     */
    private static ?array $cache = null;

    /**
     * @return array<int,array{id:string,titulo:string,ok:bool,detalhe:string,
     *                         resolver:string,bloqueia:bool}>
     */
    public static function itens(): array
    {
        if (self::$cache !== null) return self::$cache;
        return self::$cache = self::medir();
    }

    /** Descarta o cache — usado por scripts que mudam o estado e re-medem. */
    public static function esquecer(): void { self::$cache = null; }

    private static function medir(): array
    {
        $itens = [];

        // ── 1. Modo do provedor ──────────────────────────────────────
        $modo = strtolower((string)(getenv('GCAL_PROVIDER') ?: 'mock'));
        $itens[] = [
            'id' => 'provider', 'titulo' => 'GCAL_PROVIDER aponta para o Google',
            'ok' => $modo === 'google',
            'detalhe' => 'Valor atual: ' . $modo,
            'resolver' => 'No .env: GCAL_PROVIDER=google',
            // Nao bloqueia: e o ULTIMO passo, ligado de proposito so quando o
            // resto ja passou. Marcar como bloqueio faria a checklist gritar
            // durante todo o preparo legitimo em mock.
            'bloqueia' => false,
        ];

        // ── 2. Credenciais OAuth ─────────────────────────────────────
        $itens[] = [
            'id' => 'oauth', 'titulo' => 'Credenciais OAuth do Google Cloud',
            'ok' => GoogleOAuth::isConfigured(),
            'detalhe' => GoogleOAuth::isConfigured()
                ? 'CLIENT_ID e CLIENT_SECRET presentes no .env'
                : 'Faltam GOOGLE_CALENDAR_OAUTH_CLIENT_ID e/ou _SECRET',
            'resolver' => 'Google Cloud Console → APIs e Serviços → Credenciais → '
                        . 'Criar credencial → ID do cliente OAuth → Aplicativo da Web. '
                        . 'Colar os dois valores no .env.',
            'bloqueia' => true,
        ];

        // ── 3. Redirect URI ──────────────────────────────────────────
        // Nao da para VERIFICAR o que esta cadastrado no Google daqui; o que da
        // e mostrar o valor exato a colar, que e onde o erro costuma acontecer
        // (redirect_uri_mismatch e o campeao de tickets em integracao OAuth).
        $itens[] = [
            'id' => 'redirect', 'titulo' => 'Redirect URI autorizado no Google Cloud',
            'ok' => GoogleOAuth::isConfigured(),
            'detalhe' => GoogleOAuth::redirectUri(),
            'resolver' => 'Colar essa URI EXATA em "URIs de redirecionamento autorizados" '
                        . 'na mesma tela da credencial. Diferença de barra final ou de '
                        . 'http/https já causa redirect_uri_mismatch.',
            'bloqueia' => false,
        ];

        // ── 4. Chave de cifra ────────────────────────────────────────
        $itens[] = [
            'id' => 'crypto', 'titulo' => 'GCAL_CRYPTO_KEY (cifra dos tokens)',
            'ok' => GcalCrypto::isConfigured(),
            'detalhe' => GcalCrypto::isConfigured()
                ? 'Chave presente e com tamanho válido'
                : 'Ausente ou inválida — sem ela o token não pode ser guardado',
            'resolver' => "Gerar com:  openssl rand -base64 32\n"
                        . 'e colar em GCAL_CRYPTO_KEY no .env. '
                        . 'Trocar essa chave depois invalida os tokens já salvos.',
            'bloqueia' => true,
        ];

        // ── 5. Banco ─────────────────────────────────────────────────
        $banco = self::checarBanco();
        $itens[] = [
            'id' => 'banco', 'titulo' => 'Banco GCAL_DSHOW acessível',
            'ok' => $banco['ok'], 'detalhe' => $banco['detalhe'],
            'resolver' => 'mysql -h 127.0.0.1 < docs/GOOGLE-CALENDAR/02-banco-GCAL_DSHOW.sql '
                        . 'e conferir DB_GCAL_* no .env.',
            'bloqueia' => true,
        ];

        // ── 6. API habilitada / conta conectada ──────────────────────
        // Uma conta conectada e a unica prova de que a Calendar API esta mesmo
        // habilitada e o consentimento passou. Nao da para inferir do .env.
        $contas = self::contarContas();
        $itens[] = [
            'id' => 'conta', 'titulo' => 'Ao menos uma conta Google conectada',
            'ok' => $contas > 0,
            'detalhe' => $contas > 0
                ? $contas . ' conta(s) conectada(s)'
                : 'Nenhuma. É a prova de que a Calendar API está habilitada e o consentimento passou.',
            'resolver' => 'Abrir o painel → Contas → Conectar conta Google.',
            'bloqueia' => true,
        ];

        // ── 7. Primeira sincronização ────────────────────────────────
        $sync = self::checarSync();
        $itens[] = [
            'id' => 'sync', 'titulo' => 'Primeira sincronização concluída',
            'ok' => $sync['ok'], 'detalhe' => $sync['detalhe'],
            'resolver' => 'Painel → Sincronização → Sincronizar agora '
                        . '(ou: php scripts/gcal-sync.php --account=<id> --full).',
            'bloqueia' => false,
        ];

        // ── 8. Sincronização automática (Fase 5) ─────────────────────
        // Não bloqueia ligar, mas sem isso a agenda só atualiza quando alguém
        // clica — e ninguém percebe, porque a tela nunca fica com cara de erro.
        $bat = self::checarBatimento();
        $itens[] = [
            'id' => 'cron', 'titulo' => 'Sincronização automática (cron) ativa',
            'ok' => $bat['ok'], 'detalhe' => $bat['detalhe'],
            'resolver' => "sudo cp docs/GOOGLE-CALENDAR/gcal-sync.cron /etc/cron.d/gcal-sync\n"
                        . 'Sem o cron, a agenda só atualiza no botão "Sincronizar agora".',
            'bloqueia' => false,
        ];

        return $itens;
    }

    /** Pronto para ligar = nenhum item bloqueante em aberto. */
    public static function pronto(): bool
    {
        foreach (self::itens() as $i) {
            if ($i['bloqueia'] && !$i['ok']) return false;
        }
        return true;
    }

    /** Lista curta do que falta — o formato que o 503 e o /status usam. */
    public static function pendencias(): array
    {
        $out = [];
        foreach (self::itens() as $i) {
            if (!$i['ok'] && $i['bloqueia']) $out[] = $i['titulo'] . ' — ' . $i['resolver'];
        }
        return $out;
    }

    /** Resumo para a rota /status: a tela de Contas desenha a partir disto. */
    public static function resumo(): array
    {
        $itens = self::itens();
        $ok = count(array_filter($itens, static fn($i) => $i['ok']));
        return [
            'pronto'       => self::pronto(),
            'concluidos'   => $ok,
            'total'        => count($itens),
            'redirect_uri' => GoogleOAuth::redirectUri(),
            'escopos'      => explode(' ', GoogleOAuth::scopes()),
            'etapa_oauth'  => strtolower((string)(getenv('GCAL_OAUTH_STAGE') ?: 'read')),
            'itens'        => $itens,
        ];
    }

    // ── Sondas ───────────────────────────────────────────────────────

    private static function checarBanco(): array
    {
        try {
            $pdo = getConnection('GCAL_DSHOW');
            $n = (int)$pdo->query(
                "SELECT COUNT(*) FROM information_schema.tables
                  WHERE table_schema = DATABASE() AND table_name LIKE 'gcal!_%' ESCAPE '!'")
                ->fetchColumn();
            // Conectar nao basta: um schema vazio conecta igual e so falharia
            // na primeira escrita, ja com o usuario na tela.
            return $n >= 15
                ? ['ok' => true,  'detalhe' => $n . ' tabelas gcal_* presentes']
                : ['ok' => false, 'detalhe' => 'Conecta, mas só ' . $n . ' tabelas gcal_* — schema não aplicado'];
        } catch (\Throwable $e) {
            return ['ok' => false, 'detalhe' => 'Sem conexão: ' . $e->getMessage()];
        }
    }

    private static function contarContas(): int
    {
        try {
            return (int)getConnection('GCAL_DSHOW')
                ->query("SELECT COUNT(*) FROM gcal_accounts WHERE is_active = 1")->fetchColumn();
        } catch (\Throwable $e) { return 0; }
    }

    private static function checarBatimento(): array
    {
        $f = self::ARQUIVO_BATIMENTO;
        if (!is_file($f)) {
            return ['ok' => false, 'detalhe' => 'O worker nunca rodou neste servidor.'];
        }
        $idade = time() - (int)@filemtime($f);
        // O cron sugerido roda a cada 2 min; 15 min de folga cobre reboot,
        // deploy e um job longo sem virar alarme falso.
        return $idade < 900
            ? ['ok' => true,  'detalhe' => 'Último ciclo há ' . self::humano($idade) . '.']
            : ['ok' => false, 'detalhe' => 'Parado há ' . self::humano($idade)
                            . ' — a agenda só atualiza no botão.'];
    }

    private static function humano(int $seg): string
    {
        if ($seg < 90)    return $seg . ' s';
        if ($seg < 5400)  return intdiv($seg, 60) . ' min';
        if ($seg < 86400) return intdiv($seg, 3600) . ' h';
        return intdiv($seg, 86400) . ' dia(s)';
    }

    private static function checarSync(): array
    {
        try {
            // O JOIN com contas ATIVAS nao e decorativo: antes da migracao 02b
            // havia 16 linhas de sync orfas de contas de teste ja apagadas, e
            // esta consulta mostrava "5/16 calendarios ok" num banco com ZERO
            // contas — verde falso justamente no indicador de "pode ligar?".
            // A FK impede novos orfaos; o JOIN protege dumps antigos.
            $r = getConnection('GCAL_DSHOW')->query(
                "SELECT COUNT(*) n, SUM(s.status = 'ok') ok, MAX(s.last_sync_at) ult
                   FROM gcal_sync_state s
                   JOIN gcal_accounts a ON a.id = s.account_id AND a.is_active = 1")
                ->fetch(PDO::FETCH_ASSOC);
            if ((int)($r['n'] ?? 0) === 0) {
                return ['ok' => false, 'detalhe' => 'Nenhum calendário sincronizado ainda'];
            }
            return ['ok' => (int)$r['ok'] > 0,
                    'detalhe' => (int)$r['ok'] . '/' . (int)$r['n'] . ' calendários ok'
                               . ($r['ult'] ? ' — última em ' . $r['ult'] . ' UTC' : '')];
        } catch (\Throwable $e) {
            return ['ok' => false, 'detalhe' => 'Indisponível (banco fora do ar)'];
        }
    }
}
