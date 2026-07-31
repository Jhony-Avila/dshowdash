# AS5 — Fase 8: IA assistiva (§635–§636; P13)

**Fontes lidas:** §635–§636 na íntegra (ordem: cor → item → objetivo → preset → revisão → fundo → avatarização → generativo; validação total antes de aplicar).

## Entregue (sem a chave)

1. **Validador §636** — `services/ValidadorIA.ts`: toda sugestão passa por
   id-existe → categoria → disponibilidade/permissão (desbloqueados) →
   requerBase → conflitos, com RELATÓRIO tipado do que caiu e por quê
   (validarConfig segue como rede final). "A IA não poderá inventar IDs
   inexistentes" agora é verificado E OBSERVÁVEL (telemetria ia_validacao).
2. **Transparência na UI** — Personagem.ajuste: o CriarIA mostra "Ajustei a
   sugestão: N não existem no catálogo, M bloqueados…" quando o provedor
   erra; o usuário nunca recebe um resultado silenciosamente diferente.
3. **Permissões reais** — criarComIA agora recebe o Set de desbloqueados da
   Vida (antes o caminho de servidor não barrava item bloqueado no cliente).

## JÁ-EXISTIA (AS3 F3)

CriarIA com fluxo completo: pedido em linguagem natural → ProvedorIA no
servidor (quando ia_disponivel) OU compositor temático local (fallback que
nunca falha) → preview → aplicar no editor. Decisão #24: a IA MONTA do
catálogo, nunca gera assets.

## AGUARDA ANTHROPIC_API_KEY (item 4 da lista do Jhony)

Runtime do provedor no servidor (ia_disponivel=true) e, na ordem do §635:
recomendação de cor/item contextuais, montagem por objetivo, geração de
preset (§205 sugestões), revisão de composição, geração de fundo (§356) e
avatarização assistida (§354 — aprovação item a item, regra fundamental).
O validador §636 já está pronto para TODOS esses fluxos.
