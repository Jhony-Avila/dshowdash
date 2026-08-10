# Elevação Basal — 03 · Registro de Riscos

> Classificação: P0 crítico · P1 alto · P2 médio · P3 baixo (critérios no doc 01/briefing §24).
> Owner padrão desta fase: Jhony (sponsor) + agente (execução). Revisar a cada marco.

| ID | Risco | Prio | Status | Mitigação planejada | Marco |
|---|---|---|---|---|---|
| BASAL-001 | Runtime dependente de arquivos ignorados (74–76 deps do index; fundações inteiras sem tracking) | **P0** | ABERTO | Hashes preservados (Onda 1) → incorporação governada (M3) → build canônico (M5) | M3–M5 |
| BASAL-002 | Backend ativo parcialmente ignorado (~444 arquivos em `api/`) | **P0** | ABERTO | Classificação fonte×config×dado (M3) → versionar fonte ativa sem segredos | M3 |
| BASAL-003 | Release não reproduzível por clone limpo | **P0** | ABERTO | Confirmado no clone em 2026-08-10 (0 dist). Build reproduzível no M5 | M5 |
| BASAL-004 | Fontes `.ts/.tsx` acessíveis por HTTP | **P0** | **CONFIRMADO + RAIZ IDENTIFICADA**: o runtime IMPORTA `.ts` por ESM (31 arquivos de `bootstrap-v2/` + `core/runtime/_entry.js` — evidência m1b). Bloqueio adiado (quebraria o boot) | Empacotar `bootstrap-v2/`+`core/runtime/` (M5/M6) → depois bloquear `.ts` | M5/M6 |
| BASAL-004b | `.patch` resíduo exposto (`footer/.../index.js.patch`) | P1 | **CONTIDO** (quarentenado p/ `/backup` na Onda 3); falta regra Nginx permanente + purge CF | Onda 4: deny `\.patch$` verificado na origem + purge Cloudflare | M1 |
| BASAL-005 | MySQL escutando `0.0.0.0:3306` | **P0** até validação | **CONFIRMADO** em escuta (evidência §7); firewall a reconfirmar (questões 19–20) | Evidência de UFW + decisão bind × firewall com o sponsor | M1 |
| BASAL-006 | Builds basais defasados (43/63 dist com fonte mais nova) | P1 | ABERTO | Confirmar por build+comparação (M5); nunca atualizar manualmente | M5 |
| BASAL-007 | `app/` e `public/app/` divergentes (árvores concorrentes) | P1 | ABERTO | ADR-001; consolidação na Parte 8 (M6); até lá, regras transitórias doc 01 §4 | M6 |
| BASAL-008 | TS e JS concorrentes (5.540 pares; 27 com TS mais novo) | P1 | ABERTO | ADR-004; verificação prioritária dos 27 (M4) | M4 |
| BASAL-009 | Ausência de CI | P1 | ABERTO | Pipeline mínimo após scripts canônicos (M4) → CI/CD completo (M11) | M11 |
| BASAL-010 | Testes basais insuficientes (~10 fora do Avatar Studio) | P1 | ABERTO | Characterization tests antes de refatorar (M2); metas no M10 | M2/M10 |
| BASAL-011 | Nginx :8080 → root inexistente (config órfã) | P1 | **CONFIRMADO** (vhost `dshowdash-v3`, evidência §6) | Desativar após checagem de consumidores (LL-01, doc 20) | M1 |
| BASAL-012 | Migrations sem governança central comprovada | P1 | ABERTO | Inventário de schema (M2) → política de migrations (ADR-009, M9) | M9 |
| BASAL-013 | Ciclos de importação | P2 | ABERTO | dependency-graph no M2; quebra progressiva M6+ | M6+ |
| BASAL-014 | Dependências com versões divergentes (Vite 7×5, React patches, Sharp) | P2 | ABERTO | Alinhamento deliberado no M4 | M4 |
| BASAL-015 | Acoplamento intenso a `window`/`document` | P2 | ABERTO | Bridges com contrato e prazo (M6) | M6 |
| BASAL-016 | `/phpmyadmin/` publicado no vhost de produção sem controle de acesso comprovado | **P0** até prova de controle | ABERTO (achado Onda 2, evidência §6 l.687) | Coletar ACLs → restringir (allowlist/auth/túnel) ou despublicar | M1 |
| BASAL-017 | Portas locais 20241/37865 com processo desconhecido | P2 | ABERTO (achado Onda 2) | Identificar processos e classificar (questão 18) | M1 |

## Regras de gestão

- Nenhum P0 avança de marco sem tratamento ou aceite formal registrado no doc 05.
- Risco novo descoberto durante execução entra aqui **no mesmo lote** que o descobriu.
- Contenção nunca pode criar risco maior que o contido (briefing §1599): bloqueios de
  superfície pública começam por fontes não executadas, patches, backups e configs —
  nunca por `.ts` ainda carregados pelo runtime.
- Rollback validado é pré-condição de saída do M1 (briefing §1601).
