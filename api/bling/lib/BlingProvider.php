<?php
// Bling / lib/BlingProvider.php - selecao do provedor e implementacao mock
// @module  bling.provider
// @version 1.0.0
// @created 2026-07-30
//
// BLING_PROVIDER = mock (padrao) | bling
//
// O provedor real (BlingReal) chega na Fase 5 e le do banco BLING; enquanto o
// banco nao existe, pedir `bling` responde 503 com instrucao - nunca cai em mock
// silenciosamente. Fallback silencioso para mock e como o dono descobre, tarde,
// que estava olhando numero inventado achando que era producao.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

/** Provedor simulado: entrega as colecoes do grafo coerente do BlingMock. */
final class BlingMockProvider extends BlingProviderBase
{
    public function nome(): string
    {
        return 'mock';
    }

    public function ehSimulado(): bool
    {
        return true;
    }

    public function ultimaSync(): ?string
    {
        return gmdate('c', strtotime('-6 minutes'));
    }

    public function colecao(string $nome): array
    {
        $g = BlingMock::grafo();
        return $g[$nome] ?? [];
    }
}

final class BlingProvider
{
    private static ?BlingProviderBase $instancia = null;

    /** Le a variavel de ambiente. `.env` do projeto e carregado pelo bootstrap da app. */
    public static function configurado(): string
    {
        $v = getenv('BLING_PROVIDER');
        if (!is_string($v) || $v === '') {
            $v = $_ENV['BLING_PROVIDER'] ?? $_SERVER['BLING_PROVIDER'] ?? 'mock';
        }
        $v = strtolower(trim((string) $v));
        return in_array($v, ['mock', 'bling'], true) ? $v : 'mock';
    }

    public static function atual(): BlingProviderBase
    {
        if (self::$instancia !== null) {
            return self::$instancia;
        }

        $escolhido = self::configurado();

        if ($escolhido === 'bling') {
            $repo = new BlingRepository();

            // Falha ALTO e explica o que falta. Cair em mock silenciosamente
            // seria o pior resultado possível: o dono olharia número inventado
            // achando que é produção.
            $falta = [];
            if (!$repo->disponivel()) {
                $falta[] = 'banco BLING inacessível — conferir DB_BLING_* no .env';
            } elseif (!$repo->schemaAplicado()) {
                $falta[] = 'schema não aplicado — rodar docs/BLING/02-banco-BLING.sql';
            } elseif ($repo->contaPadrao() === null) {
                $falta[] = 'nenhuma conta conectada — conectar em Administração › Integrações';
            }
            if (!BlingCrypto::disponivel()) {
                $falta[] = 'BLING_CRYPTO_KEY ausente — gerar com: openssl rand -hex 32';
            }

            if ($falta !== []) {
                ApiResponse::error('BLING_PROVIDER_INDISPONIVEL', 503, [
                    'message'  => 'O provedor real está selecionado, mas não está pronto para servir.',
                    'provider' => 'bling',
                    'falta'    => $falta,
                    'como_voltar' => 'Definir BLING_PROVIDER=mock no .env enquanto resolve.',
                ]);
            }

            return self::$instancia = new BlingReal($repo);
        }

        return self::$instancia = new BlingMockProvider();
    }

    /** Estado da integracao para o §8.4 e para a tela de Integrações. */
    public static function estadoConexao(): string
    {
        return self::configurado() === 'mock' ? 'mock' : 'conectado';
    }
}
