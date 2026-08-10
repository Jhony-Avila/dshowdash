# Elevação Basal — 03 · Registro de Riscos

> Classificação: P0 crítico · P1 alto · P2 médio · P3 baixo (critérios no doc 01/briefing §24).
> Owner padrão desta fase: Jhony (sponsor) + agente (execução). Revisar a cada marco.

| ID | Risco | Prio | Status | Mitigação planejada | Marco |
|---|---|---|---|---|---|
| BASAL-001 | Runtime dependente de arquivos ignorados (74–76 deps do index; fundações inteiras sem tracking) | **P0** | ABERTO | Hashes preservados (Onda 1) → incorporação governada (M3) → build canônico (M5) | M3–M5 |
| BASAL-002 | Backend ativo parcialmente ignorado (~444 arquivos em `api/`) | **P0** | ABERTO | Classificação fonte×config×dado (M3) → versionar fonte ativa sem segredos | M3 |
| BASAL-003 | Release não reproduzível por clone limpo | **P0** | ABERTO | Confirmado no clone em 2026-08-10 (0 dist). Build reproduzível no M5 | M5 |
| BASAL-004 | Fontes e `.patch` acessíveis por HTTP | **P0** | ABERTO | Coletor confirma lista → bloqueio progressivo sem quebrar runtime (M1, briefing §11/§1598) | M1 |
| BASAL-005 | MySQL escutando `0.0.0.0:3306` | **P0** até validação | ABERTO | Coletor + verificação de firewall/UFW → bind local ou regra explícita | M1 |
| BASAL-006 | Builds basais defasados (43/63 dist com fonte mais nova) | P1 | ABERTO | Confirmar por build+comparação (M5); nunca atualizar manualmente | M5 |
| BASAL-007 | `app/` e `public/app/` divergentes (árvores concorrentes) | P1 | ABERTO | ADR-001; consolidação na Parte 8 (M6); até lá, regras transitórias doc 01 §4 | M6 |
| BASAL-008 | TS e JS concorrentes (5.540 pares; 27 com TS mais novo) | P1 | ABERTO | ADR-004; verificação prioritária dos 27 (M4) | M4 |
| BASAL-009 | Ausência de CI | P1 | ABERTO | Pipeline mínimo após scripts canônicos (M4) → CI/CD completo (M11) | M11 |
| BASAL-010 | Testes basais insuficientes (~10 fora do Avatar Studio) | P1 | ABERTO | Characterization tests antes de refatorar (M2); metas no M10 | M2/M10 |
| BASAL-011 | Nginx :8080 → root inexistente (config órfã) | P1 | ABERTO | Coletor confirma → remover/corrigir vhost com teste de config (M1/M12) | M1 |
| BASAL-012 | Migrations sem governança central comprovada | P1 | ABERTO | Inventário de schema (M2) → política de migrations (ADR-009, M9) | M9 |
| BASAL-013 | Ciclos de importação | P2 | ABERTO | dependency-graph no M2; quebra progressiva M6+ | M6+ |
| BASAL-014 | Dependências com versões divergentes (Vite 7×5, React patches, Sharp) | P2 | ABERTO | Alinhamento deliberado no M4 | M4 |
| BASAL-015 | Acoplamento intenso a `window`/`document` | P2 | ABERTO | Bridges com contrato e prazo (M6) | M6 |

## Regras de gestão

- Nenhum P0 avança de marco sem tratamento ou aceite formal registrado no doc 05.
- Risco novo descoberto durante execução entra aqui **no mesmo lote** que o descobriu.
- Contenção nunca pode criar risco maior que o contido (briefing §1599): bloqueios de
  superfície pública começam por fontes não executadas, patches, backups e configs —
  nunca por `.ts` ainda carregados pelo runtime.
- Rollback validado é pré-condição de saída do M1 (briefing §1601).
