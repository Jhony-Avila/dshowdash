<?php
// Bling / controllers/StatusController.php - prontidao da integracao
// @module  bling.controller.status
// @version 1.0.0
// @created 2026-07-30
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class StatusController
{
    /**
     * GET /status — o que existe, o que falta, e o que fazer.
     * Esta e a tela que responde "por que estou vendo dado simulado?".
     */
    public static function status(): void
    {
        $p = BlingProvider::atual();
        $provider = BlingProvider::configurado();

        // ⚠️ TODO ITEM AQUI É MEDIDO, NENHUM É DECLARADO.
        // A versão anterior tinha os seis itens com `false` fixo no código: o
        // checklist dizia "banco não provisionado" mesmo depois de o banco
        // existir, com 38 tabelas. Um checklist que não mede é pior que nenhum
        // — dá a impressão de estar acompanhando o que na verdade ignora.
        $repo = new BlingRepository();
        $bancoOk  = $repo->disponivel();
        $schemaOk = $bancoOk && $repo->schemaAplicado();

        $credOk = BlingOAuth::clientId() !== '' && BlingOAuth::clientSecret() !== '';
        $cifraOk = BlingCrypto::disponivel() && BlingCrypto::autoteste();
        $segredoWebhook = BlingWebhookService::segredo() !== '';
        $cronOk = is_readable('/etc/cron.d/bling');

        $contas = $schemaOk ? $repo->contas(true) : [];
        $conectadas = $schemaOk ? count($repo->contasAtivas()) : 0;
        $pendencias = $schemaOk ? $repo->contasComPendencia() : [];

        $privilegioMinimo = null;
        if ($bancoOk) {
            // Prova ATIVA: tenta um DDL e espera ser recusado. Ler o GRANT diria
            // o que está escrito; tentar diz o que o motor faz.
            $privilegioMinimo = !$repo->consegueDdl();
        }

        $checklist = [
            self::item('provider', 'Provedor selecionado', true,
                "BLING_PROVIDER=$provider", null),

            self::item('banco', 'Banco BLING acessível', $bancoOk,
                $bancoOk ? 'Conectado como ' . BlingRepository::configuracao()['user']
                         : 'Sem conexão',
                $bancoOk ? null : 'Conferir DB_BLING_HOST/PORT/NAME/USER/PASS no .env.'),

            self::item('schema', 'Schema aplicado', $schemaOk,
                $schemaOk ? $repo->contarTabelas() . ' tabelas' : 'Schema vazio ou incompleto',
                $schemaOk ? null : 'Aplicar docs/BLING/02-banco-BLING.sql.'),

            self::item('usuario_banco', 'Usuário do banco com privilégio mínimo',
                $privilegioMinimo === true,
                $privilegioMinimo === null ? 'Não verificável sem conexão'
                    : ($privilegioMinimo ? 'Sem DDL — CREATE TABLE recusado, como deve ser'
                                         : 'PERIGO: o usuário da aplicação consegue alterar o schema'),
                $privilegioMinimo === false
                    ? 'REVOKE de DDL: manter só SELECT, INSERT, UPDATE, DELETE em BLING.*' : null),

            self::item('cifra', 'Cifra dos tokens operacional', $cifraOk,
                $cifraOk ? 'AES-256-GCM, autoteste OK' : 'BLING_CRYPTO_KEY ausente ou inválida',
                $cifraOk ? null : 'Gerar com: openssl rand -hex 32 e gravar em BLING_CRYPTO_KEY.'),

            self::item('credencial', 'Credencial OAuth 2.0 cadastrada', $credOk,
                $credOk ? 'client_id e client_secret presentes' : 'Ausentes no .env',
                $credOk ? null
                    : 'Bling › Preferências › Integrações › API › Meus aplicativos. '
                    . 'Gravar BLING_CLIENT_ID e BLING_CLIENT_SECRET.'),

            self::item('conta', 'Conta Bling conectada', $conectadas > 0,
                $conectadas > 0 ? "$conectadas conta(s) conectada(s)"
                    : (count($contas) > 0 ? count($contas) . ' conta(s) cadastrada(s), nenhuma conectada'
                                          : 'Nenhuma conta'),
                $conectadas > 0 ? null : 'Conectar em Administração › Integrações.'),

            self::item('webhook', 'Webhook habilitado', $segredoWebhook,
                $segredoWebhook
                    ? 'Segredo configurado — entregas são verificadas por HMAC-SHA256'
                    : 'DESLIGADO: sem segredo, toda entrega é recusada',
                $segredoWebhook ? null
                    : 'Definir BLING_WEBHOOK_SECRET e registrar POST /api/bling/webhooks no Bling. '
                    . 'Sem webhook, o atraso máximo é o do incremental (15 min).'),

            self::item('cron', 'Rotinas de sincronização agendadas', $cronOk,
                $cronOk ? '/etc/cron.d/bling instalado (fila 5min, incremental 15min, '
                        . 'reconciliação diária, DLQ horária, expurgo diário)'
                        : 'Nenhum cron de Bling no servidor',
                $cronOk ? null : 'Instalar /etc/cron.d/bling.'),
        ];

        $pendentes = array_values(array_filter($checklist, static fn($i) => !$i['ok']));

        ApiResponse::success([
            'provider'   => $p->nome(),
            'simulado'   => $p->ehSimulado(),
            'estado'     => BlingSituacoes::descrever('conexao', BlingProvider::estadoConexao()),
            'ultima_sync'=> $p->ultimaSync(),
            'checklist'  => $checklist,
            'pendentes'  => count($pendentes),
            'pronto_para_go_live' => count($pendentes) === 0,
            // Contas ativas SEM token utilizável: a sincronização delas está
            // parada e isso não pode ficar só no log do cron.
            'contas_com_pendencia' => array_map(static fn($c) => [
                'id' => (int) $c['id'], 'nome' => $c['nome'],
                'estado' => BlingSituacoes::descrever('conexao', (string) $c['estado_conexao']),
            ], $pendencias),
            'fase_atual' => 'Fase 4 — banco, OAuth, filas, webhooks e jobs',
            'documentacao' => 'docs/BLING/',
        ], bling_meta());
    }

    private static function item(string $id, string $rotulo, bool $ok, string $detalhe, ?string $acao): array
    {
        return ['id' => $id, 'rotulo' => $rotulo, 'ok' => $ok, 'detalhe' => $detalhe, 'acao' => $acao];
    }

    /** GET /accounts — contas e unidades (§13). */
    public static function contas(): void
    {
        $p = BlingProvider::atual();
        ApiResponse::success([
            'contas'   => array_map(static function ($c) {
                $c['estado'] = BlingSituacoes::descrever('conexao', BlingProvider::estadoConexao());
                return $c;
            }, $p->colecao('contas')),
            'unidades' => $p->colecao('unidades'),
        ], bling_meta());
    }

    /** GET /settings — configuracoes do modulo (§10 item 52). */
    public static function configuracoes(): void
    {
        ApiResponse::success([
            'provedor' => [
                'atual' => BlingProvider::configurado(),
                'opcoes' => ['mock', 'bling'],
                'variavel' => 'BLING_PROVIDER',
                'editavel_pela_ui' => false,
                'nota' => 'Alterado apenas no .env do servidor. A interface não muda provedor.',
            ],
            'acesso' => [
                'nivel_minimo' => BLING_NIVEL_MINIMO,
                'modelo' => 'nível (Fase 1). Permissões granulares bling.* entram na Fase 6.',
            ],
            'privacidade' => [
                'mascaramento_documentos' => true,
                'mascaramento_contatos' => true,
                'exportacao_auditada' => true,
                'base' => 'LGPD — §62 do briefing.',
            ],
            'escrita' => [
                'habilitada' => false,
                'nota' => 'Nenhuma operação de escrita no Bling antes da Fase 6 homologada.',
            ],
        ], bling_meta());
    }

    /** GET /integrations — painel de integracoes (§10 item 47). */
    public static function integracoes(): void
    {
        $p = BlingProvider::atual();

        $linhas = [];
        foreach ($p->colecao('canais') as $c) {
            $linhas[] = [
                'id' => $c['id'], 'nome' => $c['nome'], 'tipo' => $c['tipo'],
                'integrado' => $c['integrado'],
                'estado' => $c['integrado'] ? 'conectado' : 'nao_configurado',
                'estado_info' => BlingSituacoes::descrever('conexao', $c['integrado'] ? 'conectado' : 'nao_configurado'),
                'modulo_dshow' => match ($c['id']) {
                    'ml'        => 'panel-mercadolivre',
                    'ecommerce' => null,
                    default     => null,
                },
            ];
        }

        ApiResponse::success([
            'bling' => [
                'estado' => BlingSituacoes::descrever('conexao', BlingProvider::estadoConexao()),
                'provider' => $p->nome(),
                'ultima_sync' => $p->ultimaSync(),
            ],
            'canais' => $linhas,
        ], bling_meta());
    }
}
