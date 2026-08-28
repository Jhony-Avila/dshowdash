# Track C Mobile — Performance sob Estresse

Baseline reprodutível (perf-bench, 12 reps + 2 warmup, 390×844, flag ON):
shell 190/236ms (mediana/p95), cat 69/97ms, tool 31/43ms.

## Estabilidade sob ciclos (mobile-performance-smoke)
10 ciclos abrir/fechar ferramenta + trocar categoria:
- heap JS: 12.2 MB → 12.2 MB (Δ0, sem leak)
- DOM: 4049 → 3097 (sem crescimento)
- listeners: pareados no cleanup (hooks mobileStudio) — sem acúmulo
- erros JS: 0

## Limites de aceite (definidos)
| Métrica | Limite | Medido |
|---|---|---|
| shell utilizável (p95) | ≤ 600 ms | 236 ms ✓ |
| troca de categoria (p95) | ≤ 200 ms | 97 ms ✓ |
| abertura de ferramenta (p95) | ≤ 300 ms | 43 ms ✓ |
| Δ heap após 10 ciclos | ≤ 3 MB | 0 MB ✓ |
| Δ DOM após 10 ciclos | ≤ +15% | negativo ✓ |
| erros JS | 0 | 0 ✓ |

## Pendente de device / harness estendido
Throttling de CPU (4-6×) e rede lenta (3G), e catálogo com 100/500 assets reais,
exigem dados de catálogo autenticados e um device físico para medida fiel
(FPS/scroll/bateria). O headless mede custo de interação, não FPS de campo.
Plano no MOBILE_REAL_DEVICE_TEST_KIT.
