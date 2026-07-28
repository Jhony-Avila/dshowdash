# 08 — `GET /api/pipedrive/funnel` (backend pronto da Fase 4 · Funis)

> Escrito em 2026-07-27 por uma sessão que **parou** ao detectar outra sessão trabalhando
> na mesma Fase 4 em paralelo. O backend abaixo **já está no ar e provado** — a tela de
> Funis deve **consumir este endpoint**, não reimplementar a agregação.

## O que existe

| Arquivo | Mudança |
|---|---|
| `repositories/AnalyticsRepository.php` | novo `funnelAnalysis()` + const `GARGALO_MIN_VOL = 10` |
| `controllers/AnalyticsController.php` | novo `PipeAnalyticsController::funnel()` (GET, nível 50) |
| `index.php` | nova rota `case 'funnel'` |

Nada foi removido nem alterado: `/pipelines`, `/conversion` e `/forecast` seguem idênticos (PNR).

## O limite do dado (dizer isso na tela)

`pipe_deal_history` está **vazia** → não há histórico de transições. A etapa gravada em cada
negócio é a **atual** (abertos) ou a **de fechamento** (ganhos/perdidos). E a base mostra que
negócios são ganhos em **qualquer** etapa (Principal: 1.113 ganhos na etapa 1, 2.425 na etapa 4)
— então **não dá para medir passagem etapa→etapa**.

O que a base sustenta, e é o que o endpoint entrega:

```
alcance(N)   = Σ total dos negócios das etapas com order_nr >= N   (dentro do funil)
conversao(N) = alcance(N+1) / alcance(N) * 100      queda(N) = 100 - conversao(N)
gargalo      = maior queda entre etapas com alcance >= 10 (evita ruído de funil vazio)
```

O campo `nota` vem no próprio payload com essa ressalva em pt-BR — **renderize-o**, no mesmo
espírito da nota que já existe em “Conversão & ciclo de vendas”.

## Forma da resposta

```jsonc
{
  "pipelines": [{
    "id": 1, "name": "Principal", "order": 0, "is_active": 1,
    "stages": [{
      "stage_id": 30, "stage": "Primeiro Contato", "order": 1, "probability": null,
      "abertos": 81, "ganhos": 1113, "perdidos": 6053, "total": 7247,
      "valor_aberto": 14502.0, "valor_ganho": 0.0, "valor_perdido": 0.0,
      "idade_media_abertos": 68,      // dias parados (abertos), null se não há aberto
      "win_rate_local": 15.5,         // dos que PARARAM aqui, % ganhos
      "alcance": 19874, "alcance_pct": 100.0,
      "conversao_prox": 63.5, "queda_prox": 36.5, "perdidos_prox": 7247  // null na última etapa
    }],
    "totals": { "total": 19894, "abertos": 246, "ganhos": 3592, "perdidos": 16056,
                "valor_aberto": 11677795.0, "valor_ganho": 136273173.0,
                "win_rate": 18.3, "ticket_medio": 37937.4,
                "ciclo_medio_dias": 11, "idade_media_abertos": 42 },
    "gargalo": { "stage_id": 119, "stage": "Propostas", "proxima": "Negociação",
                 "queda_pct": 42.6, "perdidos": 3492 },   // null se não houver
    "total_deals": 246, "total_valor": 11677795.0          // compat: mesmos campos de /pipelines
  }],
  "comparison": [ { "id", "name", "is_active", ...mesmos campos de totals } ],
  "nota": "Sem histórico de transições de etapa, …"
}
```

- `stages` traz **só etapas ativas** (`is_active = 1`), ordenadas por `order_nr`.
- `totals` vem de `pipe_deals.pipeline_id` (não da soma das etapas) — por isso
  `totals.total` (19.894) pode ser **maior** que `alcance` do topo (19.874): há 20 negócios
  em etapa inativa/inexistente. Não escreva “X negócios” colando os dois números.
- Funis sem negócio devolvem zeros e `gargalo: null` (Automacoes, Pedidos ClickLed) —
  a tela precisa do estado vazio, não de um funil de barras zeradas.

## Custo medido

164 ms para os 5 funis (3 agregações; 19.923 negócios). Um `refetchInterval` de 120 s
como o das outras telas já basta; não precisa de índice novo.

## Prova

Sandbox contra o PIPE_DSHOW real (sem HTTP/auth), validando invariantes — alcance monotônico
decrescente, `alcance(topo) == Σ totais`, `pct <= 100`, `conversão <= 100`:

```
/tmp/claude-0/-root/<sessão>/scratchpad/prova-funnel.php   →  INVARIANTES: OK
```

Resultados reais do tenant: **Principal** gargalo em *Propostas → Negociação* (queda 42,6%,
3.492 negócios); **Prospecção** perde 92,9% já em *Primeiro Contato → Demonstração*.

⚠️ Falta a prova **E2E autenticada** (`tools/screenshot/valida-pipedrive-*.mjs`) — a sessão
parou antes de escrevê-la. O caminho HTTP (SessionGate nível 50 + envelope `ApiResponse`)
segue o mesmo molde de `/conversion`, mas **não foi exercitado**.

## Backup

`/backup/pipedrive-fase4-20260727-163714` (`api-pipedrive/`, `panel-src/`, `07-elevacao-visual.md`)
— estado **anterior** a estas mudanças.
