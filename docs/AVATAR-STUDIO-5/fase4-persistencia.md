# AS5 — Fase 4: Histórico e Presets (§629; P5)

**Fontes lidas:** §629 (P10) na íntegra · P5 completa via índice (§194–§260) + normativas §197–§205 (presets/versionamento/histórico/snapshot).

## Entregáveis do §629 → estado

| Entregável | Estado | Onde |
|---|---|---|
| draft / undo / redo | ✅ F1 | núcleo (AvatarStore §608, comandos com inverso) |
| bloqueio de slots | ✅ F3 C1 | §70.1 (Equipados, dshow.avst5.bloqueios.v1) |
| comparação | ✅ F3 P1' | §65.3 (segurar V / botão Original) |
| **presets** | ✅ F4 | `services/PresetsPessoais.ts` + aba Presets (`PresetsShell`) — snapshot COMPLETO do config (§198: camadas+cores+título+§71/§73); salvar/aplicar(comando c/ undo)/favoritar/duplicar/excluir; favoritos primeiro (§199); storage v1 localStorage `dshow.avst5.presets.v1`, schema espelha §619/state_versions p/ migração 1:1 |
| **histórico granular** | ✅ F4 | `useHistoricoSessao` no shell (registro vive a sessão TODA; bus §606.1) + timeline na aba Equipados — "voltar até aqui" desfaz/refaz em lote; desfazer não apaga o futuro da timeline (§138) |
| **autosave** | ✅ F4 | debounce 800ms na assinatura do store → `dshow.avst5.rascunho.v1`; sem mudanças → rascunho limpo |
| **recuperação após erro** | ✅ F4 | faixa §139 com a mensagem literal do briefing ("Recuperamos um rascunho de HH:MM…") + Continuar (vira comando)/Descartar |
| **conflito entre abas** | ✅ F4 (mínimo) | id por aba (sessionStorage) + listener de `storage`: outra aba gravando rascunho → aviso "a última que salvar prevalece" |
| snapshots / versões / restauração servidor | ⏸️ PENDENTE DO PASSO ROOT | §202–§204 + §619: exigem as5_schema no servidor (avatar_states/state_versions). EstadoService (cliente) pronto desde a F1; ligar atrás da flag as5.estado_api QUANDO o schema subir — entra na lista final do Jhony |

## Decisões

1. **Storage local ANTES do servidor** — §629 manda garantir a segurança do trabalho antes de avançar; localStorage entrega isso hoje sem depender do passo root. O schema das entradas espelha o modelo §619 (migração sem retrabalho).
2. **Registro do histórico no shell, não no componente** — a timeline assinada só quando a aba abria perdia ações; lição registrada.
3. **Aplicar preset SEM modal de conflito** — restauração deliberada de um snapshot inteiro; a proteção de slots vale para sorteio (§90), não para restauração explícita (§138 "restaurar ponto" tem a mesma semântica).
4. §205 (presets inteligentes/sugestões de IA) → F8 (P13).
