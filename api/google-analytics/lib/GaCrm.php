<?php
// Google Analytics / lib/GaCrm.php — o lado REAL da conciliação de leads (§32)
// @module  google-analytics.lib.crm
// @version 1.0.0
// @created 2026-07-30
//
// ════════════════════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE
// ════════════════════════════════════════════════════════════════════════════
// A §32 do briefing pede a conciliação "leads registrados no GA4 × leads recebidos no CRM".
// De todas as conciliações da §47, esta é a ÚNICA com as duas pontas reais possíveis hoje: o
// site dispara `generate_lead` de verdade e o Pipedrive está LIVE com dado real. As demais
// linhas daquela tabela (E-commerce, Bling, Financeiro) seriam mock conciliando com mock.
//
// Aqui só existe o lado CRM, e ele é REAL. Leitura pura em PIPE_DSHOW.
//
// ════════════════════════════════════════════════════════════════════════════
// ⚠️ O QUE A MEDIÇÃO MOSTROU, E POR QUE A DIVERGÊNCIA FICA SUSPENSA
// ════════════════════════════════════════════════════════════════════════════
// Medido em 2026-07-30: **43 leads** no CRM nos últimos 28 dias. O mock do GA4 devolve
// ~1.426 `generate_lead` no mesmo período. Calcular "divergência" entre esses dois números
// produziria um alarme de −97% que **não significa nada**: um lado é inventado.
//
// Por isso `podeCompararCom()` exige que AMBOS os lados sejam reais. Enquanto o GA4 é mock,
// a tela mostra os dois números com a procedência de cada um e diz que a comparação está
// suspensa. Um painel de análise que exibe divergência entre dado real e dado simulado é
// pior que um painel sem a conciliação — porque alguém decide com base nele.
//
// ⚠️ E CRUZAR POR CANAL NÃO É POSSÍVEL: `pipe_leads.origin` só tem dois valores em
// produção — `ManuallyCreated` (570) e `API` (255). Não há UTM, canal nem campanha. Qualquer
// atribuição de lead a canal via esta tabela seria invenção.
declare(strict_types=1);

final class GaCrm
{
    /** Alias de conexão do módulo Pipedrive (LIVE). */
    private const BANCO = 'PIPE_DSHOW';

    /**
     * Lado CRM da conciliação, no mesmo período do relatório.
     *
     * Devolve `disponivel: false` com o motivo quando o banco não responde — nunca lança e
     * nunca inventa número. A tela de conversões precisa continuar funcionando se o Pipedrive
     * estiver fora.
     */
    public static function leads(string $inicio, string $fim): array
    {
        try {
            $pdo = getConnection(self::BANCO);
        } catch (\Throwable $e) {
            error_log('[ga] CRM indisponivel: ' . $e->getMessage());
            return self::indisponivel('Não foi possível conectar ao banco do Pipedrive.');
        }

        try {
            // Janela por DIA inteiro: `add_time` é datetime e `<= fim` sem hora perderia o
            // último dia inteiro do período.
            $st = $pdo->prepare(
                "SELECT COUNT(*) AS total,
                        SUM(converted_deal_id IS NOT NULL) AS convertidos,
                        SUM(origin = 'ManuallyCreated')    AS manuais,
                        SUM(origin = 'API')                AS via_api,
                        SUM(COALESCE(value, 0))            AS valor_total
                   FROM pipe_leads
                  WHERE is_deleted = 0
                    AND add_time >= :ini
                    AND add_time <  DATE_ADD(:fim, INTERVAL 1 DAY)"
            );
            $st->execute([':ini' => $inicio, ':fim' => $fim]);
            $r = $st->fetch(PDO::FETCH_ASSOC) ?: [];

            // Série diária — permite sobrepor a curva do CRM à do GA4 na tela.
            $sd = $pdo->prepare(
                "SELECT DATE(add_time) AS dia, COUNT(*) AS n
                   FROM pipe_leads
                  WHERE is_deleted = 0
                    AND add_time >= :ini
                    AND add_time <  DATE_ADD(:fim, INTERVAL 1 DAY)
                  GROUP BY dia
                  ORDER BY dia"
            );
            $sd->execute([':ini' => $inicio, ':fim' => $fim]);
            $porDia = $sd->fetchAll(PDO::FETCH_ASSOC) ?: [];

            $total = (int)($r['total'] ?? 0);
            $manuais = (int)($r['manuais'] ?? 0);

            return [
                'disponivel'   => true,
                'fonte'        => 'pipedrive-real',
                'banco'        => self::BANCO,
                'total'        => $total,
                'convertidos_em_negocio' => (int)($r['convertidos'] ?? 0),
                'valor_total'  => round((float)($r['valor_total'] ?? 0), 2),
                'por_origem'   => [
                    // ⚠️ ACHADO DE NEGÓCIO, não detalhe técnico: a maioria dos leads é criada
                    // À MÃO pelo time comercial, não chega pelo site. Isso explica boa parte
                    // de qualquer diferença contra o GA4 — e é a primeira coisa a olhar antes
                    // de suspeitar da instrumentação.
                    ['origem' => 'ManuallyCreated', 'rotulo' => 'Criado à mão no CRM', 'total' => $manuais],
                    ['origem' => 'API', 'rotulo' => 'Entrou por integração/API', 'total' => (int)($r['via_api'] ?? 0)],
                ],
                'pct_manual'   => $total > 0 ? round(($manuais / $total) * 100, 1) : null,
                'por_dia'      => array_map(
                    static fn(array $l): array => ['data' => (string)$l['dia'], 'leads' => (int)$l['n']],
                    $porDia
                ),
                'aviso_origem' => 'A tabela de leads do Pipedrive não guarda canal nem UTM: `origin` só distingue "criado à mão" de "entrou por API". Atribuir lead a canal por esta fonte seria invenção.',
            ];
        } catch (\Throwable $e) {
            error_log('[ga] consulta CRM falhou: ' . $e->getMessage());
            return self::indisponivel('A consulta ao Pipedrive falhou.');
        }
    }

    private static function indisponivel(string $motivo): array
    {
        return [
            'disponivel' => false,
            'fonte'      => 'pipedrive-real',
            'motivo'     => $motivo,
            'total'      => null,
            'por_dia'    => [],
        ];
    }

    /**
     * A divergência pode ser calculada?
     *
     * ⚠️ SÓ quando os dois lados são reais. Comparar `generate_lead` simulado com lead real
     * gera um número alarmante e sem sentido (medido: 1.426 × 43). Esta função é o portão que
     * impede a tela de mostrar esse número.
     */
    public static function podeCompararCom(string $fonteGa4): bool
    {
        return $fonteGa4 !== 'mock';
    }
}
