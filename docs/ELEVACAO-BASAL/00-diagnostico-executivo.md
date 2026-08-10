# Elevação Basal — 00 · Diagnóstico Executivo

> Programa: **Elevação Basal do Dshow Dash** (briefing `Revisao_Dshowdash_01.md`, 19 partes).
> Onda 1 · Parte 1/19 + Marco M0. Baseline: commit `86467a1a` (branch `main`).
> Este documento é operacional: orienta decisões, não apenas descreve.

## 1. Problema central

O Dshow Dash opera com **quatro realidades divergentes**:

```text
Código versionado ≠ Código no servidor ≠ Código carregado pelo navegador ≠ Código gerado pelos builds
```

Consequências já observadas: alterações no fonte que não chegam ao runtime; alterações
em produção invisíveis ao Git; bundles executando versões anteriores; deploys que
sobrescrevem correções manuais; `git status` limpo transmitindo falsa consistência;
clone limpo incapaz de reproduzir a aplicação publicada.

## 2. Evidências basais (verificadas)

| # | Evidência | Fonte | Status |
|---|---|---|---|
| E1 | `public/index.html` (rastreado) referencia **74 deps js/css**, todas `*/dist/*.bundle.js` **ausentes no clone limpo** (ignoradas) | verificado no clone em 2026-08-10 | CONFIRMADA |
| E2 | Auditoria do servidor: 76 deps diretas do index — 58 ignoradas, 18 rastreadas (~76% da carga inicial fora da governança Git) | briefing §3.1 | A REVALIDAR via coletor |
| E3 | 63 diretórios `dist` no servidor; 43 com fonte mais recente que o artefato | briefing §3.2 | A REVALIDAR via coletor |
| E4 | `app/`: 93 arquivos, 100% rastreados; `public/app/`: 0 rastreados no clone (32 físicos no servidor, todos ignorados) — **árvores concorrentes** | verificado no clone + briefing §3.3 | CONFIRMADA |
| E5 | `api/`: 87 arquivos rastreados no clone; servidor tem centenas físicos (~444 ignorados) — **backend parcialmente invisível** | verificado no clone + briefing §3.4 | PARCIAL — revalidar contagem |
| E6 | Fundações sem nenhum arquivo rastreado: `public/bootstrap-v2/`, `public/core/`, `public/platform/`, `public/modules/`, `public/react/` | verificado no clone (0 tracked) | CONFIRMADA |
| E7 | **5.540 pares TS/JS rastreados** no mesmo caminho-base; 27 com TS mais recente que o JS | verificado no clone (5.540) + briefing §3.6 | CONFIRMADA |
| E8 | Servidor entrega fontes reais por HTTP: `.ts`, `.tsx`, implementação interna e um `.patch` (hash comprovado; não era fallback do SPA) | briefing §3.7 | A REVALIDAR via coletor |
| E9 | Nginx escuta :8080 → root `/var/www/dshowdash_v3/public` **inexistente** (HTTP 404) | briefing §3.8 | A REVALIDAR via coletor |
| E10 | Zero CI, zero Docker, `package.json` raiz sem script de teste | verificado no clone | CONFIRMADA |
| E11 | ~116 arquivos de teste; ~106 do Avatar Studio, ~10 para o resto; parte ignorada | briefing §3.10 | A REVALIDAR |
| E12 | MySQL escutando `0.0.0.0:3306`; Redis e Decision Engine restritos ao host local | briefing §3.11 | A REVALIDAR via coletor |

## 3. Hipóteses causais (ordem de verificação obrigatória)

Antes de concluir que uma solicitação "foi implementada", verificar nesta ordem:

1. **Pipeline/fonte da verdade**: fonte alterada → bundle ativo não reconstruído → runtime executa artefato anterior.
2. **Arquivo ignorado**: alterado direto no servidor → invisível ao Git → sobrescrito por build/sync/deploy posterior.
3. **Árvore errada**: uma árvore alterada → outra árvore concorrente é a publicada → mudança fora do caminho real de execução.

## 4. Resultado final do programa

```text
Fonte canônica versionada → Validação estática → Testes → Build determinístico
→ Artefato imutável → Release identificável → Deploy atômico → Health check
→ Observabilidade → Rollback comprovado
```

Um clone limpo, no commit de uma release, deverá: instalar deps bloqueadas por lockfile,
validar, testar, gerar todos os artefatos, produzir inventário da release e reproduzir a
estrutura publicada **sem depender de arquivos manuais do servidor**.

## 5. Escopo

Toda a aplicação: raiz, `app/`, `api/`, `public/`, bootstrap, router, shell,
header/footer/sidebar/main, core, platform, modules, componentes, painéis, builds,
manifests, configs, scripts, testes, banco, migrations, Nginx, PHP-FPM, MySQL, Redis,
serviços auxiliares, CI/CD, observabilidade, segurança, rollout, rollback, legado.

**Fora de escopo**: redesenho funcional do Avatar Studio (tratado em fluxo próprio).
O Avatar Studio só aparece aqui como evidência de problema transversal.

## 6. Roadmap mestre (Parte 18) — caminho crítico

```text
M0 Congelamento → M1 Contenção P0 → M2 Baseline técnica → M3 Fonte da verdade do repo
→ M4 Toolchain/workspaces → M5 Build reproduzível → M6 Bootstrap/runtime canônico
→ M10 Quality → M11 CI/CD → M13 Quarentena → M14 Remoção → M15 Certificação
(M7 UI/painéis, M8 backend, M9 banco, M12 infra encaixam por dependência, em paralelo)
```

## 7. Gates do programa

| Gate | Regra |
|---|---|
| 0 — baseline | Não alterar arquitetura sem inventário e rollback |
| 1 — governança | Não consolidar árvores com arquivos ativos invisíveis ao Git |
| 2 — reprodutibilidade | Não substituir bundles até um clone limpo conseguir gerá-los |
| 3 — proteção | Não remover compatibilidade sem testes e observabilidade |
| 4 — publicação | Não alterar document root sem validar todos os consumidores |
| 5 — rollout | Não promover release basal a 100% sem canário |
| 6 — remoção | Não apagar legado sem evidência E4, quarentena e rollback |

## 8. Métricas do programa

Percentual de deps iniciais governadas pelo Git · percentual de artefatos reproduzíveis ·
nº de dist defasados · nº de fontes acessíveis por HTTP · nº de árvores concorrentes ·
nº de pares TS/JS sem política · nº de testes basais · nº de bridges sem prazo ·
nº de arquivos ACTIVE_UNGOVERNED · tempo de rollback · taxa de sucesso do build limpo ·
taxa de sucesso do smoke pós-deploy.

**Metas finais**: 100% das fontes ativas governadas; 100% dos artefatos geráveis; zero
fonte desnecessária pública; zero build basal defasado; zero responsabilidade com duas
fontes editáveis; zero bridge sem owner/prazo; build limpo reproduzível; rollback comprovado.
