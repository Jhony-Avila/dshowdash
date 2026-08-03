# AS5 — Fase 7: Coleções e progressão (§633–§634; P5 §206–§224)

**Fontes lidas:** §633–§634 na íntegra · P5 §206–§224 (coleções/conquistas/timeline/XP/badges) via índice da F4.

## Entregáveis §633 → estado

| Entregável | Estado |
|---|---|
| páginas de coleção + progresso | ✅ já existia (Colecoes.tsx AS3: barra, equipar, completa) |
| recompensas / conquistas / títulos | ✅ já existia (Conquistas.tsx 4.6: 30 conquistas auditáveis, recompensa aditiva; TITULOS) |
| vitrine / eventos | ✅ já existia (Vitrine.tsx; eventos sazonais na Vida) |
| **níveis + XP (§223)** | ✅ F7 — `ProgressoPerfil`: XP derivado (40×conquista + 2×item explorado), nível N = N²×60 XP; **fórmula exposta na UI (§634: transparência)**; XP nunca diminui (sem perda silenciosa) |
| **badges (§224)** | ✅ F7 — insígnia por categoria de conquistas 100% completa (derivada, sem schema novo) |
| **timeline (§220)** | ✅ F7 — últimas conquistas com data, mais recente primeiro |
| **recomendações (§89 — pendência F3)** | ✅ F7 — coleção incompleta mais PRÓXIMA de completar + itens faltantes (determinística e explicável; recomendação por telemetria de uso real → quando §619/registry ligarem) |

## §634 (gamificação responsável) — como foi respeitado

Sem ranking (nem opt-out necessário: não existe exposição), sem punição
por ausência, sem compra impulsiva (não há loja), fórmula do XP visível
na própria UI, XP monotônico (nunca cai), recomendação honesta (mostra
exatamente o que falta, sem urgência artificial).

## Pendências F3 restantes (para F9/polimento)

§67 drawer completo de detalhes do asset · §65.1/§65.2 comparação lado a
lado/sequencial. XP/nível persistidos no servidor (perfil público §222
completo) → junto do passo root.
