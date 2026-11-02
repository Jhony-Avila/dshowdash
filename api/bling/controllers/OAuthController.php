<?php
// Bling / controllers/OAuthController.php - conectar, retorno e desconectar
// @module  bling.controller.oauth
// @version 1.0.0
// @created 2026-07-30
//
// §4 É INEGOCIÁVEL: o navegador NUNCA vê client_secret, refresh_token nem
// access_token. Nada aqui devolve token para o cliente — nem em erro, nem em
// log, nem em campo "debug". O que o navegador recebe é: a URL de autorização
// do Bling e, no retorno, um redirecionamento.
//
// O `state` mora no BANCO, não na sessão: o retorno do Bling chega numa
// navegação de topo vinda de outro site e, dependendo do SameSite do cookie,
// a sessão pode não estar disponível. State em banco funciona nos dois casos e
// ainda permite uso único de verdade.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingOAuthController
{
    /**
     * POST /oauth/connect — devolve a URL para onde o navegador deve ir.
     *
     * Não redireciona daqui: a chamada vem de fetch(), e um 302 numa chamada
     * XHR seria seguido pelo próprio fetch em vez de navegar a janela.
     */
    public static function conectar(): void
    {
        // bling_require_access() já rodou no roteador e devolveu o usuário;
        // chamar de novo é barato e mantém o controller utilizável isolado.
        $usuario = bling_require_access();
        $repo = new BlingRepository();

        self::exigirPronto($repo);
        self::exigirCredencial();

        $corpo = json_decode(file_get_contents('php://input') ?: '{}', true);
        $voltarPara = is_array($corpo) ? (string) ($corpo['voltar_para'] ?? '') : '';

        // Só destino interno. Um `voltar_para` livre viraria redirect aberto:
        // o atacante mandaria o dono conectar e a volta cairia em outro site.
        if ($voltarPara === '' || !str_starts_with($voltarPara, '#/')) {
            $voltarPara = '#/panel-bling/administracao/integracoes';
        }

        $auth = new BlingAuthService($repo, new BlingTransporteCurl());
        $url = $auth->iniciarConexao((int) $usuario['id'], $voltarPara);

        $repo->auditar([
            'acao' => 'oauth.iniciar', 'entidade' => 'conta',
            'user_id' => (int) ($usuario['id'] ?? 0),
            'usuario_email' => (string) ($usuario['email'] ?? ''),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null, 'origem' => 'ui',
            'valor_novo' => ['voltar_para' => $voltarPara],
        ]);

        ApiResponse::success([
            'authorize_url' => $url,
            // Diz explicitamente o que o cliente deve fazer — a tela não precisa
            // adivinhar se abre popup, redireciona ou renderiza.
            'acao' => 'redirecionar_janela',
        ]);
    }

    /**
     * GET /oauth/callback — o Bling manda o navegador para cá.
     *
     * Termina em REDIRECIONAMENTO, não em JSON: quem está olhando é uma janela
     * de navegador, não um fetch. Devolver JSON aqui deixaria o dono numa página
     * branca com um objeto na tela.
     */
    public static function retorno(): void
    {
        $codigo = (string) ($_GET['code'] ?? '');
        $state  = (string) ($_GET['state'] ?? '');
        $erro   = (string) ($_GET['error'] ?? '');

        $repo = new BlingRepository();
        $destinoPadrao = '/#/panel-bling/administracao/integracoes';

        // O usuário clicou em "negar" no Bling. Não é falha do sistema.
        if ($erro !== '') {
            self::voltar($destinoPadrao, ['bling_resultado' => 'negado', 'bling_motivo' => $erro]);
        }

        if ($codigo === '' || $state === '') {
            self::voltar($destinoPadrao, ['bling_resultado' => 'erro',
                'bling_motivo' => 'retorno sem code ou state']);
        }

        try {
            $auth = new BlingAuthService($repo, new BlingTransporteCurl());
            $r = $auth->concluirConexao($codigo, $state);

            $destino = (string) ($r['voltar_para'] ?? '');
            $destino = ($destino !== '' && str_starts_with($destino, '#/'))
                ? '/' . $destino : $destinoPadrao;

            self::voltar($destino, ['bling_resultado' => 'conectado']);

        } catch (Throwable $e) {
            // A mensagem interna vai para o log; para a URL vai só o suficiente
            // para o dono saber o que houve, sem detalhe de implementação.
            error_log('[bling.oauth.callback] ' . $e->getMessage());
            self::voltar($destinoPadrao, ['bling_resultado' => 'erro',
                'bling_motivo' => 'nao_foi_possivel_concluir']);
        }
    }

    /** POST /oauth/disconnect — revoga localmente e apaga os tokens. */
    public static function desconectar(): void
    {
        $usuario = bling_require_access();
        $repo = new BlingRepository();
        self::exigirPronto($repo);

        $corpo = json_decode(file_get_contents('php://input') ?: '{}', true);
        $accountId = (int) ($corpo['account_id'] ?? 0);
        if ($accountId <= 0) {
            ApiResponse::error('PARAMETRO_INVALIDO', 400, ['message' => 'account_id é obrigatório']);
        }

        $conta = $repo->conta($accountId);
        if ($conta === null) {
            ApiResponse::error('CONTA_NAO_ENCONTRADA', 404);
        }

        $auth = new BlingAuthService($repo, new BlingTransporteCurl());
        $auth->desconectar($accountId, (int) ($usuario['id'] ?? 0));

        $repo->auditar([
            'account_id' => $accountId,
            'acao' => 'oauth.desconectar', 'entidade' => 'conta',
            'entidade_id' => (string) $accountId,
            'user_id' => (int) ($usuario['id'] ?? 0),
            'usuario_email' => (string) ($usuario['email'] ?? ''),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null, 'origem' => 'ui',
            // Nome, não token. Nunca token.
            'valor_anterior' => ['conta' => $conta['nome'] ?? ''],
        ]);

        ApiResponse::success([
            'account_id' => $accountId,
            'estado_conexao' => 'revogado',
            // Os dados sincronizados FICAM. Apagá-los junto com o token seria
            // destrutivo e irreversível a partir de um clique em "desconectar".
            'aviso' => 'Os dados já sincronizados foram mantidos. '
                     . 'Reconectar retoma a sincronização de onde parou.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────

    private static function exigirPronto(BlingRepository $repo): void
    {
        $falta = [];
        if (!$repo->disponivel()) {
            $falta[] = 'banco BLING inacessível — conferir DB_BLING_* no .env';
        } elseif (!$repo->schemaAplicado()) {
            $falta[] = 'schema não aplicado — rodar docs/BLING/02-banco-BLING.sql';
        }
        if (!BlingCrypto::disponivel()) {
            $falta[] = 'BLING_CRYPTO_KEY ausente — gerar com: openssl rand -hex 32';
        }
        if ($falta !== []) {
            ApiResponse::error('BLING_NAO_PRONTO', 503, [
                'message' => 'A integração não está pronta para conectar.',
                'falta' => $falta,
            ]);
        }
    }

    private static function exigirCredencial(): void
    {
        // Sem credencial, iniciar o fluxo levaria o dono a uma tela de erro do
        // próprio Bling — pior lugar possível para descobrir que falta config.
        if (BlingOAuth::clientId() === '' || BlingOAuth::clientSecret() === '') {
            ApiResponse::error('BLING_SEM_CREDENCIAL', 503, [
                'message' => 'Faltam as credenciais do aplicativo Bling.',
                'falta' => ['BLING_CLIENT_ID e BLING_CLIENT_SECRET no .env'],
                'onde_obter' => 'Bling › Preferências › Integrações › API › Meus aplicativos',
            ]);
        }
    }

    /** @param array<string,string> $params */
    private static function voltar(string $destino, array $params): never
    {
        // O destino é sempre relativo à própria origem — nunca vem de fora.
        $sep = str_contains($destino, '?') ? '&' : '?';
        $url = $destino . $sep . http_build_query($params);
        header('Location: ' . $url, true, 302);
        // Sem cache: o retorno carrega o resultado de uma ação única.
        header('Cache-Control: no-store');
        exit;
    }
}
