# Track C — Relatório de Erros de Save (caracterização + proposta)

Teste: `mobile-save-error-matrix.mjs`. Handler NÃO alterado (Track A congelado).

## Matriz (mobile ON) — 12 cenários

| Cenário | POST | pend antes | pend depois | erro visível | retry | shell | jsErr |
|---|---|---|---|---|---|---|---|
| HTTP 400 | 2 | sim | **não** | sim | sim | vivo | 0 |
| HTTP 401 | 2 | sim | **não** | não | sim | vivo | 0 |
| HTTP 403 | 2 | sim | **não** | sim | sim | vivo | 0 |
| HTTP 409 | 2 | sim | **não** | sim | sim | vivo | 0 |
| HTTP 422 | 2 | sim | **não** | não | sim | vivo | 0 |
| HTTP 429 | 2 | sim | **não** | não | sim | vivo | 0 |
| HTTP 500 | 2 | sim | **não** | não | sim | vivo | 0 |
| timeout | 2 | sim | **não** | não | sim | vivo | 0 |
| offline | 2 | sim | **não** | não | sim | vivo | 0 |
| json inválido | 2 | sim | **não** | não | sim | vivo | 0 |
| studio.php falha | 3 | sim | **não** | não | sim | vivo | 0 |
| estado.php falha | 2 | sim | **não** | não | sim | vivo | 0 |

- **Garantias mobile (todas ✓):** shell vivo, ≤3 POST (sem loop), botão utilizável (retry), 0 erro JS.
- **Gap Track A:** preserva "pendente" em **0/12**, mostra erro em só **3/12** (400/403/409).
  Nos outros 9 (inclui 500/timeout/offline), o save LIMPA o pendente sem sinalizar erro —
  o usuário acredita ter salvo. **Idêntico no desktop** (flag OFF).

## Origem no código
`store.confirmarPersistencia` é chamado após o POST sem gate estrito no status/success
da resposta; `EstadoService.post`/`AvatarService.salvarAvatar` retornam mas o store limpa
o "pendente" de forma otimista. (Serviço de save compartilhado — Track A.)

## Proposta de correção (NÃO aplicada — requer autorização; reabre handler Track A)
1. `salvarAvatar`/`EstadoService.post`: só resolver "sucesso" com `res.ok && corpo.success === true`;
   caso contrário retornar `{ ok:false, motivo }`.
2. Store: só `confirmarPersistencia` no sucesso confirmado; senão manter `pendente` e setar
   `salvarErro` (mensagem por classe: 401/403 → sessão/permissão; 409 → conflito de versão →
   oferecer recarregar; 429 → aguardar; 5xx/timeout/offline → tentar novamente).
3. UI: `.avst5-salvar-erro` com botão "Tentar novamente" (mobile já tem o alvo ≥44).
- **Teste esperado:** `mobile-save-error-matrix` passa a exigir `pend=true` OU `erro=true` em 12/12.
- **Impacto:** melhora integridade de dados percebida; nenhuma mudança de contrato de rede.
- **Compatibilidade:** desktop e mobile herdam a correção (é do serviço compartilhado).
- **Rollback:** a mudança é no handler + store; reverter o commit restaura o comportamento atual.
- **Risco:** baixo/médio (mexe em caminho crítico de save) → exige suíte completa + validação do Jhony.
