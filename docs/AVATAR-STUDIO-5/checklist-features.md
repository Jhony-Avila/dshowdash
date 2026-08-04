# Checklist oficial de FEATURE (mega 87 · §1585 do briefing)

Adotado como governança de TODA feature nova do Avatar Studio (e modelo
para o restante do Dshow Dash). As 14 perguntas respondem-se ANTES do
merge; a auditoria-lacunas.md registra o resultado por mega.

1. **Necessidade** — qual seção do briefing (§) ou dor real ela atende?
2. **Arquitetura** — reusa componente/serviço existente? Onde vive a
   responsabilidade única dela?
3. **Flag** — precisa de feature flag? Qual o comportamento com ela OFF?
4. **Fallback** — o que acontece quando a dependência (rede/WebGL/
   storage/servidor) falha? Nada pode derrubar o shell.
5. **Reversibilidade** — dá para desfazer (undo/comando) ou restaurar
   (backup §38)? Migração de banco é reversível?
6. **Determinismo** — mesma entrada → mesma saída? (renders, exports,
   SQL gerado, testes.)
7. **Byte-estabilidade** — o caminho legado continua idêntico quando a
   feature não é usada? (ex.: ajustes §333 omitidos.)
8. **Peso** — quanto o bundle cresce? O gate de peso foi atualizado com
   justificativa no MESMO commit?
9. **Performance** — impacto no palco (FPS §528)? Lazy/dinâmico quando
   pesado (motor3d só no clique).
10. **A11y** — teclado, aria, focus-visible, prefers-reduced-motion §297.
11. **Telemetria** — quais eventos §290 (sem PII) provam uso e saúde?
12. **Teste** — qual asserção E2E/unitária prova a feature? Interceptação
    de download? waitForFunction (nunca timeout fixo)?
13. **Docs** — auditoria-lacunas.md + mapa do projeto atualizados?
14. **Segredos** — nenhuma credencial passa por chat/git/log; deploy só
    pelo script (backup duplo).
