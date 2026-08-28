# Track C Mobile — Resultados de Rede e Save (caracterização precisa)

Captura via wrap de `window.fetch` no harness (mocks controlados; **sem produção
real**). Fonte: `scripts/avatar/testes/_save_char` → `net/save-characterization.json`.

## 1. Contrato de UM save normal (sequência real capturada)

```
1. GET  /api/auth/check.php      (csrf/sessão)
2. POST /api/avatar/studio.php   (SAVE AUTORITATIVO — fonte da verdade, legado)
3. GET  /api/auth/check.php      (csrf p/ o espelho)
4. POST /api/avatar/estado.php   (ESPELHO §619 — draft)
5. POST /api/avatar/estado.php   (ESPELHO §619 — versão publicada)
```

| Request | Método | Propósito | Componente que inicia | Payload (chaves) |
|---|---|---|---|---|
| `studio.php` | POST | save autoritativo do avatar (fonte da verdade) | `AvatarService.salvarAvatar` (via botão salvar / `store.confirmarPersistencia`) | version, config (campos neutros omitidos — byte-stability) |
| `estado.php` (draft) | POST | espelho §619, rascunho | `EstadoService.salvarDraft` via `espelhar619(false)` | perfilId, estado, checksum |
| `estado.php` (versão) | POST | espelho §619, versão publicada | `EstadoService.salvarVersao` via `espelhar619(true)` | perfilId, estado, change_summary, checksum |
| `check.php` | GET | token CSRF/sessão | `EstadoService.csrf` | — |

**Determinação:** os dois endpoints são **duas etapas legítimas e distintas do
contrato**, não duplicação do mesmo save: `studio.php` é a fonte da verdade e
`estado.php` é o espelho §619 (draft + versão), best-effort e atrás de flag
(`as5.estado_api`). O espelho falhar não quebra o save (cai no legado).

## 2. Matriz de toques (mobile ON vs desktop OFF)

| Cenário | studio.php POST | estado.php POST | Duplicou? |
|---|---|---|---|
| MOBILE 1 toque | 1 | 2 | não (contrato normal) |
| MOBILE 2 toques síncronos (0ms) | 2 | 4 | **sim** (mesmo tick JS) |
| MOBILE 2 toques @100ms | 1 | 2 | **não** (2º toque absorvido) |
| MOBILE 2 toques @500ms | 1 | 2 | **não** (2º toque absorvido) |
| DESKTOP OFF 1 toque | 1 | 2 | não |
| DESKTOP OFF 2 síncronos (0ms) | 2 | 4 | sim (idêntico ao mobile) |

## 3. Conclusão sobre duplo-envio

O único caso que duplica é **dois cliques disparados no MESMO tick de JS
(gap 0ms)** — um artefato de teste (`b.click(); b.click()`), fisicamente
impossível por toque humano. A **partir de ~100ms** (qualquer duplo-toque real,
por mais rápido que seja) o segundo toque é **absorvido**: após o primeiro save o
estado "pendente" já foi limpo, então não há o que salvar de novo.

- **Risco real para o usuário:** praticamente nulo (nenhum duplo-toque humano
  cai no caso de 0ms).
- **Paridade:** mobile (flag ON) ≡ desktop (flag OFF) em todos os cenários — o
  Track C não altera nada de rede/save.
- **Enter/submit:** o salvar é um `<button>`, não `<form>`; Enter com foco no
  botão equivale a 1 toque (mesmo contrato).

## 4. Risco e recomendação (separados)

- **P2 (opcional, fora do escopo Track C):** adicionar `disabled` no botão salvar
  enquanto o POST está em voo fecharia até o caso teórico de 0ms. É melhoria de
  robustez do **serviço de save compartilhado (Track A)**, não do mobile —
  reabrir o handler congelado exige decisão separada. Não recomendado nesta
  rodada (o risco real já é nulo a ≥100ms).
- **Sem duplicação evitável no caminho normal:** os 2 estado.php são draft +
  versão (§619), corretos e intencionais.
