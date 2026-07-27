# Workspace Engine (container-main)

> Este diretorio e um SUBSISTEMA, nao um componente.
> Documentacao completa: /claude/docs/WORKSPACE-ENGINE.md
> Baseline: CONSTITUICAO-ARQUITETURAL.md (verdade 3), MODELO-MENTAL (camada 3).

## O que e

Runtime de workspace com bootstrap proprio de 7 fases e managers com lifecycle
(init/healthCheck/cleanup), sistema de plugins e estado persistente. Gerencia
a experiencia ao redor dos paineis: abas, split-view, zoom, command-palette,
busca, bookmarks, export, print, acessibilidade, offline e integracao com
dispositivos.

P3.11 registrou ~37 managers; contagem em disco nesta data (2026-05-29) = 45 nomes
*-manager* (43 ativos + 2 versoes superadas: animation-manager e theme-manager antigos).
Composicao: 12 feature-managers + 31 infra-managers ativos + 2 versoes superadas = 45 nomes.

NAO carrega paineis (0 refs a PanelPort). Ele e o ESPACO onde os paineis vivem.

## Topologia

```
container-main/
  bootstrap/               Motor: 7 fases (foundation->device)
  bootstrap-integration/   Factory dos 12 feature-managers + manager-registry
  utils/                   45 managers (feature + infra + superadas)
  adapters/                Ports e DI
  contracts/               Interfaces e contratos
  core/                    Nucleo interno
  kernel/                  Kernel adaptativo
  components/              Sub-componentes visuais
  panels/                  Integracao visual com paineis
  slots/                   Sistema de slots
  styles/                  CSS do container
  resources/               Assets internos
  container-factory/       Factory do container
```

## Como carrega

1. bootstrap-v2 do app (phase-5) aciona bootstrap-integration
2. bootstrap-integration registra os 12 feature-managers via factory-call
3. bootstrap/index.ts executa as 7 fases internas:
   phase1-foundation -> phase2-performance -> phase3-core ->
   phase4-plugins -> phase5-utils -> phase6-ui -> phase7-device
4. Cada manager: init() + healthCheck() + cronometrado pelo registry
5. Carregamento hibrido: registro eager + execucao lazy via wire-*

## Propriedades criticas

- critical: FALSE (app degrada graciosamente sem o engine)
- Acoplamento manager<->manager: ZERO (ilhas modulares)
- Dependencia de dominio: ZERO (destacavel e reutilizavel)
- Build: target `component:main` no rebuild-all.sh, via Vite (vite.components.config.js)
- Artefato: components/main/dist/main.bundle.js
- Estado: persiste via config-persistence + container-state-persistence + IndexedDB

## Regras

- Tratar como subsistema, nao como componente
- Novos managers seguem o padrao: init/healthCheck/destroy/VERSION
- Registrar via manager-registry (bootstrap-integration)
- Comunicacao: EventBus (nao import direto entre managers)
- Alteracoes no bootstrap interno: backup + teste
