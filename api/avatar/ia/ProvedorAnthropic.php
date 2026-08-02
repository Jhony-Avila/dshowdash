<?php
declare(strict_types=1);

/**
 * /api/avatar/ia/ProvedorAnthropic.php — adapter Anthropic (AS3 F3).
 * @version 1.0.0  @created 2026-07-30
 *
 * Chave SEMPRE server-side (padrão panel-anuncios): lida de config/.env
 * (ANTHROPIC_API_KEY; modelo opcional em AVATAR_IA_MODELO). Sem chave,
 * disponivel() = false e o front usa o compositor temático local.
 */
require_once __DIR__ . '/ProvedorIA.php';
require_once __DIR__ . '/EnvIA.php';

final class ProvedorAnthropic implements ProvedorIA
{
    private ?string $chave;
    private string $modelo;

    public function __construct()
    {
        // leitura centralizada (EnvIA) — F8.2: um só ponto de config p/ IA
        $this->chave = EnvIA::ler('ANTHROPIC_API_KEY');
        $this->modelo = EnvIA::ler('AVATAR_IA_MODELO') ?: 'claude-sonnet-4-5';
    }

    public function disponivel(): bool
    {
        return $this->chave !== null;
    }

    public function criar(string $pedido, array $catalogo): array
    {
        if (!$this->disponivel()) {
            throw new RuntimeException('IA_NAO_CONFIGURADA');
        }

        $prompt = "Você monta personagens para o Avatar Studio do Dshow Dash usando SOMENTE ids do catálogo abaixo.\n"
            . "Catálogo (categoria: id|nome|tema|raridade):\n" . json_encode($catalogo, JSON_UNESCAPED_UNICODE) . "\n\n"
            . "Pedido do usuário: \"{$pedido}\"\n\n"
            . 'Responda APENAS com JSON válido no formato: {"base":"id","camadas":{"cabelo":"id|nenhum","olhos":"id","boca":"id","roupa":"id","acessorio":"id|nenhum","fundo":"id","moldura":"id|nenhum","efeito":"id|nenhum"},"cores":{"pele":"#hex","cabelo":"#hex","roupa":"#hex","destaque":"#hex"},"nome":"nome curto do personagem","historia":"1 frase de lore em pt-BR"}';

        $corpo = json_encode([
            'model' => $this->modelo,
            'max_tokens' => 700,
            'messages' => [['role' => 'user', 'content' => $prompt]],
        ], JSON_UNESCAPED_UNICODE);

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $corpo,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-api-key: ' . $this->chave,
                'anthropic-version: 2023-06-01',
            ],
        ]);
        $resposta = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($resposta === false || $status !== 200) {
            throw new RuntimeException('IA_FALHA_HTTP_' . $status);
        }
        $dados = json_decode($resposta, true);
        $texto = $dados['content'][0]['text'] ?? '';
        if (!preg_match('/\{.*\}/s', $texto, $m)) {
            throw new RuntimeException('IA_SEM_JSON');
        }
        $json = json_decode($m[0], true);
        if (!is_array($json) || empty($json['base'])) {
            throw new RuntimeException('IA_JSON_INVALIDO');
        }
        return $json; // vida.php revalida ids/cores antes de devolver ao front
    }
}
