<?php
declare(strict_types=1);

/**
 * /api/avatar/ia/FabricaIA.php — FÁBRICA de provedores de IA (AS5 F8.2).
 * @version 1.0.0  @created 2026-08-02
 *
 * A aplicação NUNCA instancia um provedor concreto: pede à fábrica, que
 * resolve pelo config (AVATAR_IA_PROVEDOR). Trocar Anthropic → OpenAI →
 * Gemini → modelo local = 1 linha no .env + 1 classe nova registrada em
 * PROVEDORES — zero mudança em vida.php ou no front (o contrato é o
 * ProvedorIA, e o front tem fallback local de qualquer forma).
 *
 * Config (config/.env — NUNCA versionado):
 *   AVATAR_IA_PROVEDOR=anthropic        # chave do registro abaixo
 *   AVATAR_IA_MODELO=claude-sonnet-4-5  # repassado ao provedor
 *   ANTHROPIC_API_KEY=...               # credencial do provedor ativo
 *
 * Diagnóstico (§652 observabilidade): diagnostico() NUNCA expõe segredos —
 * só presença/motivo. Provedor desconhecido degrada para indisponível
 * (fail-safe: o front cai no compositor local, o botão nunca falha).
 */
require_once __DIR__ . '/ProvedorIA.php';
require_once __DIR__ . '/EnvIA.php';
require_once __DIR__ . '/ProvedorAnthropic.php';

final class FabricaIA
{
    /** registro nome → classe (novos provedores entram AQUI, e só aqui) */
    private const PROVEDORES = [
        'anthropic' => ProvedorAnthropic::class,
        // 'openai'  => ProvedorOpenAI::class,   // futura: mesma interface
        // 'gemini'  => ProvedorGemini::class,   // futura: mesma interface
        // 'local'   => ProvedorLocal::class,    // futura: mesma interface
    ];

    private const PADRAO = 'anthropic';

    public static function criar(): ProvedorIA
    {
        $nome = self::nomeConfigurado();
        $classe = self::PROVEDORES[$nome] ?? null;
        if ($classe === null) {
            // provedor desconhecido no .env: NUNCA derruba a request —
            // devolve um provedor nulo (indisponível) e o diagnóstico conta
            return new ProvedorNulo($nome);
        }
        return new $classe();
    }

    /** nome efetivo (normalizado) vindo do config, com padrão seguro. */
    public static function nomeConfigurado(): string
    {
        $bruto = EnvIA::ler('AVATAR_IA_PROVEDOR');
        return $bruto !== null && $bruto !== '' ? strtolower(trim($bruto)) : self::PADRAO;
    }

    /**
     * Diagnóstico de inicialização (validação sem segredos):
     * o admin vê O QUE falta sem nunca ver credenciais.
     */
    public static function diagnostico(): array
    {
        $nome = self::nomeConfigurado();
        $conhecido = isset(self::PROVEDORES[$nome]);
        $provedor = self::criar();
        $motivo = null;
        if (!$conhecido) {
            $motivo = 'provedor_desconhecido (registrados: ' . implode(', ', array_keys(self::PROVEDORES)) . ')';
        } elseif (!$provedor->disponivel()) {
            $motivo = 'credencial_ausente (defina a chave do provedor no config/.env do servidor)';
        }
        return [
            'provedor' => $nome,
            'conhecido' => $conhecido,
            'disponivel' => $provedor->disponivel(),
            'modelo' => EnvIA::ler('AVATAR_IA_MODELO') ?: '(padrao do provedor)',
            'motivo_indisponivel' => $motivo,
        ];
    }
}

/** Provedor NULO — objeto nulo para config inválido (nunca quebra o fluxo). */
final class ProvedorNulo implements ProvedorIA
{
    public function __construct(private string $nomePedido)
    {
    }

    public function disponivel(): bool
    {
        return false;
    }

    public function criar(string $pedido, array $catalogo): array
    {
        throw new RuntimeException('IA_PROVEDOR_DESCONHECIDO:' . $this->nomePedido);
    }
}
