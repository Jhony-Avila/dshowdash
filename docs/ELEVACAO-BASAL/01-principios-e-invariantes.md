# Elevação Basal — 01 · Princípios e Invariantes

> Regras vinculantes para todo o programa. Violação = bloqueio de lote.

## 1. Princípios

1. **Fonte única da verdade** — cada responsabilidade tem exatamente uma fonte canônica declarada. Relações fonte→intermediário→artefato→compatibilidade devem ser formais. Fonte nunca é inferida por data de arquivo.
2. **O servidor não é a fonte** — mudança manual em produção é proibida, salvo contenção emergencial registrada (incidente + arquivo + diff preservado + correção na fonte + teste + build + release substituta + remoção da divergência).
3. **Artefatos gerados não são fonte** — `dist`, bundles e chunks são derivados. Proibido editar bundle como solução permanente, aceitar correção só no `dist`, publicar bundle sem identificação da fonte, misturar artefatos de commits diferentes numa release.
4. **Um clone limpo deve gerar a produção** — teste de referência: clone limpo → checkout → install por lockfile → build completo → testes → comparação de manifesto → artefato pronto. Sem depender de arquivos ignorados preexistentes, cópias manuais, caches obrigatórios, deps globais não documentadas ou conhecimento pessoal.
5. **Document root mínimo** — apenas HTML público, JS/CSS compilados, imagens/fontes autorizadas, manifests públicos, service worker e endpoints PHP deliberados. Fontes, testes, docs e configs fora da superfície pública.
6. **Segurança sem quebra de runtime** — não bloquear `.ts`/`.tsx` em massa antes de: mapear dependências reais → eliminar imports de runtime para fontes → gerar bundles corretos → validar boot/rotas → bloquear → smoke → monitorar. O `.patch` exposto pode ter tratamento acelerado se comprovado sem consumidor.
7. **Nenhuma exclusão por aparência** — nome "legacy", ausência de import estático, duplicidade, idade, existência de bundle equivalente ou falta de teste NÃO autorizam remoção. Imports dinâmicos, registries, manifests, loaders, rotas PHP, service workers e integrações mantêm arquivos vivos sem referência estática.
8. **Proibição de big bang** — sem reescrita total, sem mover `public/` de uma vez, sem remover todos os JS adjacentes, sem trocar router+bootstrap+shell na mesma janela, sem regras Nginx que bloqueiem dependências ativas. Execução incremental sempre.
9. **Estrangulamento do legado** — Observar → Classificar → Contrato canônico → Encapsular → Migrar consumidores → Medir → Desligar por flag → Quarentenar → Remover. Legado não cresce durante a migração.
10. **Compatibilidade com plano de encerramento** — toda bridge/fallback declara: comportamento preservado, consumidores, métrica de uso, flag, condição de remoção, owner, data de revisão, rollback. Sem plano = dívida bloqueadora.

## 2. Invariantes arquiteturais

| # | Invariante |
|---|---|
| I1 | Uma responsabilidade não possui duas fontes editáveis concorrentes |
| I2 | Toda release é reconstruível a partir do Git + dependências declaradas |
| I3 | O build oficial produz todos os artefatos exigidos pelo runtime |
| I4 | O runtime não depende de arquivos ignorados sem mecanismo formal de geração no release |
| I5 | Artefato publicado não é modificado em produção |
| I6 | Release não mistura bundles de commits diferentes sem declaração e validação |
| I7 | Toda mudança basal possui caminho de retorno testado |
| I8 | Bridges/fallbacks têm owner, métrica, condição de desligamento e data de revisão |
| I9 | Nenhum fonte ou artefato interno desnecessário é publicamente acessível |
| I10 | Rastreabilidade: qual commit em produção, qual build gerou cada bundle, quando, quem, quais checks, como reverter |
| I11 | Bootstrap, router, auth, sessão, shell, navegação e painéis têm testes mínimos antes de remoção de compatibilidades |
| I12 | Schema muda apenas por migrations ordenadas e auditáveis |
| I13 | Segredos nunca versionados, embutidos em bundle, logados ou copiados a relatórios |
| I14 | Falhas de boot/carregamento/API/migrations/release detectáveis sem inspeção manual do navegador |

## 3. Estado provisório das fontes da verdade (não autoriza exclusões)

```text
public/index.html            → entrypoint real atual
public/**/dist               → artefatos reais atuais (não confiáveis como fonte)
public/components/**/*.ts    → fontes ativas prováveis
app/                         → fonte de arquitetura nova / migração incompleta
public/app/                  → runtime ativo derivado e ignorado
api/                         → backend real, parcialmente governado
public/api                   → provável alias físico/symlink de compatibilidade
public/bootstrap-v2|core|platform|modules → runtime basal ativo fora da governança
```

## 4. Regras transitórias

### `app/` × `public/app/` (até a Parte 8)
Não editar as duas árvores para "garantir"; não copiar manualmente entre elas; não tratar
`public/app/` como fonte; não remover nenhuma das duas; não alterar `outDir` sem plano;
não trocar router em produção sem testes de boot/refresh/deep-link; registrar alteração
emergencial dupla como dívida explícita.

### `api/` × `public/api`
Antes de intervir: confirmar o tipo de `public/api` (symlink? alias?); registrar destino
real; mapear rotas Nginx; identificar código que assume `public/api`; versionar backend
ativo ignorado (sem segredos); testes de contrato nas rotas críticas; só então planejar
remoção do alias. **O alias não vira cópia física.**

### TS/JS adjacentes (até a Parte 9)
TS = fonte candidata; JS = runtime potencial. Toda mudança identifica o arquivo que o
navegador carrega; mudança em `.ts` acompanha build; edição direta de `.js` gerado é
proibida; os 27 pares com TS mais recente têm verificação prioritária; nenhum par é
eliminado por automação sem teste de equivalência; JS manual é distinguido de JS compilado.

### `dist`
Cada `dist` deverá ter registro: fonte, comando de build, config, deps, consumidores,
status Git, data do último build, commit de origem, frescor, owner. Reconstrução dos 43
defasados respeita o grafo de boot: core/contratos → bootstrap → auth/sessão →
state/runtime → shell → header/sidebar/main/footer → painéis.
