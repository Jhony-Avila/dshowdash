Unificacao 3 pills
# PROMPT — Unificar as 3 pills de cotação do header em UMA pill ROTATIVA (carrossel) (DSHOWDASH)

## 1. CONTEXTO

Aplicação **DSHOWDASH** (dshowdash.com.br). O **header** exibe hoje **3 pills separadas de cotação**, lado a lado:cla

1. **Dólar (USD/BRL):** bandeira EUA + valor + variação % (ex: "5.10 −0.22%").
2. **Yuan (CNY/BRL):** bandeira China + valor + variação % (ex: "6.77 −0.16%").
3. **Bitcoin (BTC/USD):** ícone Bitcoin + valor + variação % (ex: "$65.42K +1.52%").

Variação em **vermelho** quando negativa e **verde** quando positiva. As pills podem ter comportamento de clique associado (painel de cotação) — verifique o que existe hoje e preserve.

**Objetivo:** substituir as 3 pills por **UMA única pill rotativa (carrossel)**: mesma aparência/estilo das pills atuais, exibindo **uma cotação por vez** e alternando automaticamente entre Dólar → Yuan → Bitcoin em ciclo contínuo.

## 2. REQUISITOS DA PILL ROTATIVA

### Comportamento
- **Rotação automática:** troca a cotação exibida a cada **5 segundos** (valor em constante/config fácil de ajustar), em ciclo Dólar → Yuan → Bitcoin → Dólar…
- **Transição suave:** animação sutil na troca (fade ou slide vertical, ~250–300ms), consistente com o padrão de animações da aplicação. Sem "piscar" seco.
- **Pausa no hover:** com o mouse sobre a pill, a rotação pausa (retoma ao sair).
- **Clique manual para avançar/abrir:** preserve o comportamento de clique atual das pills — se hoje o clique abre o painel de cotação da moeda, o clique na pill unificada abre o painel **da moeda exibida no momento**. Se as pills hoje não têm clique, deixe a pill preparada com o handler parametrizado (sem quebrar nada).
- **Indicador opcional discreto:** 3 pontinhos (dots) minúsculos indicando qual das 3 está exibida — proponha com/sem e me deixe aprovar no plano.
- **Largura estável:** a pill NÃO pode ficar mudando de largura a cada troca (os valores têm comprimentos diferentes — "5.10 −0.22%" x "$65.42K +1.52%"). Fixe uma largura que comporte o maior conteúdo, mantendo o layout do header estável.

### Visual
- Mesmo estilo visual das pills atuais (formato, fundo, borda, tipografia, cores de variação verde/vermelho, ícone/bandeira à esquerda) — nos **dois temas** (light e dark, sem cores hardcoded).
- O espaço liberado no header pelas 2 pills removidas fica livre (os demais widgets se reacomodam naturalmente pelo layout existente — não redistribua manualmente nada além do necessário).

### Dados
- **Reutilize 100% a fonte de dados atual** das 3 pills (mesmo serviço/endpoint/intervalo de atualização). A unificação é visual/estrutural — nenhuma mudança na obtenção das cotações.
- Os valores devem continuar atualizando na frequência atual mesmo quando a moeda não está visível (ao rotacionar para ela, já mostra o valor mais recente).
- Timers (rotação e atualização) devidamente limpos se o componente for desmontado — sem memory leak.

## 3. RESTRIÇÕES DE IMPLEMENTAÇÃO

- **Um componente único parametrizado** (lista de ativos como config) — fácil adicionar um 4º ativo no futuro só acrescentando na lista.
- **Antes de criar, verifique o que existe:** como as 3 pills atuais são implementadas (3 instâncias de um componente? 3 componentes?), qual serviço de cotações usam, e se há painel de cotação vinculado ao clique. Reutilize o máximo.
- As pills antigas saem do header, mas **nenhum arquivo é deletado** — se algum componente ficar órfão/desnecessário, mova para `/backup`.
- Não altere os demais widgets do header (WhatsApp, e-mail, relógio, clima etc.).
- Não adicione bibliotecas sem minha aprovação (a animação deve ser CSS/JS simples).

## 4. FLUXO DE TRABALHO OBRIGATÓRIO

1. **Diagnóstico via terminal** (`grep`/`find`/`cat`, sem `echo`; **nunca consulte pastas com "react" no nome**): componentes das pills atuais, serviço de cotações, handler de clique existente, padrão de animação da aplicação.
2. **Leia os arquivos completos** de tudo que será alterado/reutilizado.
3. **Plano ANTES de codar:** estrutura do novo componente (config de ativos), estratégia de transição (fade x slide), largura fixa proposta, com/sem dots, o que acontece no clique, arquivos a alterar/criar e quais componentes antigos ficarão órfãos. **Aguarde minha aprovação.**
4. **Correção:** para cada arquivo alterado, no **mesmo bloco de comandos**: backup para `/backup` no diretório raiz (`Arquivo.ext.bak-YYYYMMDD-HHMMSS`) + reescrita do **arquivo inteiro** via `cat << 'EOF'`, sem suprimir trechos. Antes de criar, verifique se já existe.
5. **Diagnóstico pós-implementação** e testes via terminal (build/lint).
6. **Navegador somente ao final:** rotação, pausa no hover, clique, largura estável, atualização de valores, dois temas.
7. Antes da validação final, pergunte: **"Você tem algum diagnóstico antes da validação?"**

## 5. REGRAS NÃO NEGOCIÁVEIS

- Nunca delete arquivos — mova para `/backup`. Nunca restaure backup de imediato.
- Sem gambiarras: nada de `setInterval` sem limpeza, nada de três componentes escondidos alternando com `display:none` — um componente único com estado.
- Comandos agrupados em um único bloco, caminhos absolutos.
- Escopo: as 3 pills de cotação → 1 pill rotativa. Nada além.
- Mostre o diff e aguarde minha confirmação antes de prosseguir.
- Documentação por último, após tudo validado.

## 6. CRITÉRIOS DE ACEITE

- [ ] Uma única pill no lugar das 3, com o mesmo estilo visual das atuais, nos dois temas.
- [ ] Rotação automática a cada 5s (configurável) no ciclo Dólar → Yuan → Bitcoin, com transição suave.
- [ ] Pausa no hover; retoma ao sair.
- [ ] Clique preservando o comportamento atual (painel da moeda exibida, se aplicável).
- [ ] Largura fixa — header sem "dança" de layout na troca.
- [ ] Valores e cores de variação (verde/vermelho) corretos e atualizando na frequência atual, mesmo para moedas fora de exibição.
- [ ] Timers limpos ao desmontar; sem memory leak.
- [ ] Componente parametrizado — adicionar 4º ativo = 1 entrada na config.
- [ ] Componentes órfãos movidos para `/backup`; demais widgets do header intactos.
- [ ] Backups de todos os arquivos alterados em `/backup`.

## 7. RELATÓRIO FINAL

Ao concluir: arquitetura do componente (config de ativos, transição adotada), arquivos criados/alterados (caminho absoluto + backup), componentes aposentados movidos para `/backup` e instruções para ajustar intervalo/adicionar ativos. Documentação por último.