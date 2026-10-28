# 06 — Homologação (Fase 8)

> Executada em **2026-07-30**. Auditoria contra os critérios §84 (visual), §85 (funcional) e §86
> (técnico) do `docs/BRF_CALENDAR.md`, mais segurança (§74), privacidade/LGPD (§75), fusos (§47),
> recorrência (§19-§20), múltiplas contas (§55), performance (§77) e acessibilidade (§80).
>
> **Resultado: homologado.** 0 falha em 60 checks de servidor e 0 em 10 de cliente, com **3.516 textos
> medidos** contra o piso WCAG nos dois temas.

## Como reproduzir

```bash
php  scripts/gcal-homologacao.php                        # servidor  (60 checks)
node tools/screenshot/proof-gcal-homologacao.mjs         # cliente   (10 checks)
bash scripts/gcal-smoke-all.sh                           # tudo, incluindo os dois acima
```

Ambos estão integrados ao runner oficial — uma regressão futura reprova o build.

---

## O que a homologação encontrou e corrigiu

A auditoria **não passou de primeira**. Estes são os defeitos reais que ela expôs:

### 1. 🔴 140 textos abaixo do piso WCAG (§80)

O medidor calcula o contraste real no DOM, compondo até achar fundo opaco, e aplica o piso certo por
tamanho (4,5:1 normal, 3:1 para ≥18,66 px ou ≥14 px bold). Achados e correções:

| Problema | Medido | Corrigido para | Agora |
|---|---|---|---|
| `--gc-texto-3` no escuro (`#767689`) | 3,78:1 | `#9898ae` | 5,95:1 |
| `--gc-texto-3` no claro (`#858da0` → `#6b7280` → **`#5f6673`**) | 3,33:1 | `#5f6673` | 5,78:1 |
| Botão primário escuro (branco sobre `#4285f4`) | 3,56:1 | fundo `#3372cf` | 4,72:1 |
| Botão primário claro (branco sobre `#1a73e8`) | 4,51:1 | fundo `#1668d4` | 5,30:1 |
| Pílulas de estado no claro (texto sobre 18% da própria cor) | 2,56–3,76:1 | tons escurecidos | 4,90–5,60:1 |
| Texto do evento no FullCalendar (branco sobre cor do calendário) | **2,15–3,68:1** | `--fc-event-text-color: #111827` | 5,03–8,79:1 |
| Cores de calendário vivas com texto escuro | 3,67–4,82:1 | paleta clareada | ≥ 5:1 |
| Primária usada como **texto** no escuro | 3,01–3,56:1 | novo `--gc-primaria-txt` | 5,32–7,16:1 |

Três lições ficaram registradas no CSS:

- **`--gc-texto-3` veste texto de 10-11 px sobre fundos diferentes.** Passar no branco não basta: o
  primeiro conserto (`#6b7280`, 4,83:1 no branco) ainda reprovava em 4,27:1 sobre a superfície-2.
- **`color` em `.fc-event` não funciona.** O FullCalendar pinta o texto em `.fc-event-main` a partir de
  `--fc-event-text-color`; a regra própria perde por especificidade e o texto volta a branco.
- **Cor de ação e cor de link são papéis diferentes.** `--gc-primaria` foi escolhida para ser *fundo* com
  texto branco por cima; no escuro ela é escura demais para virar *texto*. Daí `--gc-primaria-txt`.

### 2. Uma figura sem alternativa textual (§80)

O gráfico de barras da tela de Relatórios tinha `role="img"` mas nenhuma tabela equivalente. Não bastava
apontar para a tabela do relatório logo abaixo: a série do gráfico nem sempre é a tabela inteira — "top 12
participantes" mostra 12 barras para uma tabela de 40 linhas, e o leitor de tela receberia outro conjunto
de números. Ganhou `<details>` própria.

### 3. Dois falsos positivos do próprio auditor

Registrados porque o método importa:

- O grep de `CONVERT_TZ` acusava os **comentários** que explicam justamente por que não se usa
  `CONVERT_TZ`. Corrigido ancorando em linha de código (descarta `//`, `*`, `#`).
- Um `ReflectionClass` antes do `require_once`. Erro de ordem no script, não no módulo.

---

## Resultado por área

### Segurança (§74, §86) — 14/14

Gate de sessão antes do roteamento · CSRF central **antes do `switch`**, para que rota nova já nasça
protegida · `display_errors` desligado · handler de exceção sem mensagem crua · zero interpolação de
variável em SQL · `LIMIT` por constante · `GcalLinks` somente leitura · `prepare`/`execute` pareados ·
nenhum endpoint devolve segredo · contas e `sync_token` mascarados **verificado por comportamento** ·
servidor recusa escrita em calendário `reader` e edição em `freeBusyReader`.

### Privacidade / LGPD (§75) — 12/12

O bloco de calendário livre/ocupado **continua existindo** (sumir mentiria na disponibilidade) mas chega
sem título, descrição, local, participantes, conferência nem vínculos, marcado como `redacted`. A redação
acontece **no servidor** — filtro só no front vazaria no DevTools. Nenhum `error_log` carrega conteúdo de
evento ou token. O relatório de participantes não inclui o próprio usuário.

### Fusos (§47) — 15/15, com virada de horário de verão

Nenhuma query do módulo usa `CONVERT_TZ`. Nova York **antes** da virada de 2026 dá UTC-5 e **depois** dá
UTC-4 — o offset muda de verdade, não é fixo. A hora inexistente do salto (02:30 em 08/03) não explode.
Lisboa × São Paulo e Shenzhen × São Paulo conferem. Fuso inválido cai no padrão declarado, nunca no
default do processo. Evento de dia inteiro continua sendo intervalo de datas (§48).

### Recorrência (§19, §20) — 6/6

Série com várias instâncias, `recurring_event_id` preservado (§58), regra em texto e `RRULE` guardado.
`escopo=this` altera **uma** ocorrência; `escopo=all` altera a série inteira.

### Múltiplas contas (§55) — 6/6

Duas contas, cada uma com e-mail, tipo e origem declarados; a conta com problema aparece **com o motivo**,
e o status agrega a contagem.

### Performance (§77) — 8/8

| Medida | Resultado |
|---|---|
| Janela de 90 dias | 1 ms |
| Overview | 11 ms |
| Busca no CRM real | 240 ms |
| Primeiro paint | **439 kB** |
| ECharts, FullCalendar e D3 | fora do primeiro paint |

Janela com teto de 400 dias no servidor e fuso saneado antes de usar.

### Acessibilidade (§80) — 10/10

Contraste WCAG **0 abaixo do piso** nos dois temas (3.516 textos) · todo controle com nome acessível ·
Tab percorre 25/25 com foco sempre visível · toda figura com rótulo **e** tabela equivalente · cor de
calendário sempre acompanhada de rótulo (§70) · landmarks `nav` + `main` · `prefers-reduced-motion`
desliga as animações · sem scroll horizontal em nenhuma tela.

---

## Critérios de aceite

### §84 — visual

| Critério | Situação |
|---|---|
| Identidade premium | ✅ |
| Segue o design system | ✅ tokens próprios, escopados ao root do painel |
| Sidebar expansível | ✅ 240 / 72 px, persistida |
| Visões diária, semanal, mensal e lista | ✅ |
| Light e dark | ✅ **medidos** lado a lado, 0 falha de contraste |
| Hierarquia clara | ✅ |
| Ícones consistentes | ✅ família Lucide única |
| Sem sobreposições | ✅ sem scroll horizontal em 15 telas |
| Responsivo | ✅ drawer em folha inferior, alvo ≥ 38 px |
| Estados de evento claros | ✅ conflito, cancelado, privado, foco, ausência |
| Preview e formulários refinados | ✅ criação rápida + formulário completo |

### §85 — funcional

| Critério | Situação |
|---|---|
| Conectar conta Google | ⏳ **Fase 4** (501/503 explícito enquanto isso) |
| Listar calendários · exibir eventos | ✅ |
| Criar · editar · excluir/cancelar | ✅ com escopo de série e aviso de notificação |
| Responder convites | ✅ com confirmação de consequências |
| Tratar recorrência | ✅ this / following / all |
| Consultar disponibilidade · detectar conflitos | ✅ |
| Múltiplos calendários | ✅ 7, com papéis distintos |
| Atualizar header e home | ✅ popover + widget |
| Preservar filtros | ✅ preferências por usuário |
| Tratar erros parciais | ✅ fonte degradada é declarada, não escondida |
| Respeitar permissões | ✅ verificado no servidor |

### §86 — técnico

| Critério | Situação |
|---|---|
| OAuth no backend | ✅ escrito (PKCE S256); **não exercitado** até a Fase 4 |
| Tokens protegidos | ✅ AES-256-GCM + `scrub`; nada trafega ao cliente |
| Escopos mínimos | ✅ estratégia por fase documentada |
| Front sem credenciais | ✅ verificado |
| Sincronização incremental | ⏳ **Fase 5** |
| Canais push renovados | ⏳ **Fase 5** |
| Recorrência correta | ✅ |
| IDs externos preservados | ✅ `ical_uid`, `recurring_event_id`, `etag`, `sequence` |
| Banco local modelado | ✅ `02-banco-GCAL_DSHOW.sql` escrito; **não executado** |
| Auditoria ativa | ⏳ tabela modelada; ativa na Fase 4 |
| Erros com correlation ID | ◑ código + horário na UI; ULID ponta a ponta na Fase 5 |
| Mocks substituíveis sem reconstrução | ✅ é o desenho do `GcalProvider` |

---

## Fora do escopo desta homologação

Não é possível homologar o que ainda não existe. Fica para depois do go-live:

- **OAuth real, sincronização e push** (Fases 4 e 5) — sem Google Cloud, não há o que exercitar.
- **Leitor de tela real** (NVDA/VoiceOver). O que dá para verificar por automação está coberto: nome
  acessível, ordem de foco, landmarks, alternativa textual. A leitura em voz é teste humano.
- **Carga com volume de produção.** Os números acima são sobre a semente do mock; a Fase 4 traz volume
  real e os tempos devem ser remedidos.
- **Ctrl+K** — `window.Sidebar` não expõe `getFeature` e a paleta não abriu no teste. Pendente de
  diagnóstico, registrado no `05-plano-fases.md`.
