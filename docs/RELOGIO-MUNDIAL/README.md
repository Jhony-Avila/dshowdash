# Relógio Mundial v3 — Centro Global de Tempo

> Painel `#/panel-relogio-mundial` · React + Vite · entregue em 2026-07-30
> Versão anterior (v2, vanilla ESM) preservada como fallback — ver [PNR](#pnr-o-motor-antigo-continua-vivo).

Reescrita do módulo a partir do briefing "Elevação de Nível Visual, UX e UI".
O painel deixou de ser um mapa SVG com etiquetas de hora e passou a ser um centro
de operação global: mapa cartográfico em canvas com quatro projeções, terminador
solar preciso, luzes de cidade, 29 bolsas com estado ao vivo, clima real, agenda
mundial, comparador de fusos e linha do tempo arrastável.

---

## Onde está o quê

```
public/components/panels/panel-relogio-mundial/
  index.js                     adaptador vanilla: manifest → mountReact, com fallback
  vite.config.ts               build (preserveEntrySignatures:'strict' é OBRIGATÓRIO)
  public/geo/                  Natural Earth 50m + 110m (interação) + 5.228 luzes
  public/fonts/                Inter + JetBrains Mono (variáveis, subconjunto latino)
  src/entry.tsx                mountReact / unmountReact
  src/app/                     App.tsx (composição) · store.tsx (estado + relógio mestre)
  src/lib/                     time · astro · markets · business · events · prefs
                               weather · share · exporter
  src/data/                    cities (157) · exchanges (29) · airports (156) · holidays
  src/map/                     projections · geodata · renderer (canvas) · WorldMap
                               useObstacles (oclusão e margens)
  src/components/              18 componentes de interface
  src/styles/panel.css         folha única, escopada em [data-wcm-react-root]

api/weather/bulk.php           clima de até 60 coordenadas (Open-Meteo + Redis 30 min)
scripts/relogio-mundial-smoke.sh        verificação sem navegador (39 checagens)
scripts/relogio-mundial-verifica-calculos.mjs  54 checagens numéricas (efemérides, DST, bolsas)
scripts/relogio-mundial-gen-cities.mjs  gerador reproduzível da base de cidades
tools/screenshot/cap-relogio-mundial.mjs  prova em navegador real (65 checagens)
tools/screenshot/cap-relogio-mundial-recursos.mjs  export, link, teclado, ARIA,
                                          tela cheia, impressão, queda do clima,
                                          persistência no servidor (33 checagens)
tools/screenshot/wcm-auditoria.mjs        diagnóstico: contraste WCAG + custo de quadro
```

---

## Como validar

```bash
# 1. Sem navegador: artefatos, permissões, HTTP, contrato da API, integridade das bases
bash scripts/relogio-mundial-smoke.sh                       # espera "FALHOU: 0"

# 2. Em navegador real (autentica, mede pixels do canvas, exercita a interface,
#    e REPROVA se algum texto ficar abaixo de 7:1 de contraste)
export PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
WCM_OUT=/tmp/wcm node tools/screenshot/cap-relogio-mundial.mjs   # espera exit 0

# 3. Recursos ponta a ponta: exportação, link compartilhável, teclado e ARIA
WCM_OUT=/tmp/wcm node tools/screenshot/cap-relogio-mundial-recursos.mjs

# 4. Diagnóstico (não reprova; imprime razões de contraste e custo de quadro)
node tools/screenshot/wcm-auditoria.mjs
```

> As duas suítes de navegador ZERAM as preferências no servidor antes de medir.
> Sem isso elas herdavam o estado da execução anterior — uma rodada que trocou para o
> globo fazia a seguinte contar marcadores num globo, e a contagem oscilava entre 5 e
> 10 sem que nada no código tivesse mudado. Suíte não hermética produz número que não
> significa nada.

## Como reconstruir

```bash
npx vite build --config public/components/panels/panel-relogio-mundial/vite.config.ts
chown -R www-data:www-data public/components/panels/panel-relogio-mundial/dist
```

O `chown` **não é opcional**: o build roda como root e o php-fpm não lê o `dist`
sem ele — o painel cai silenciosamente no motor vanilla.

---

## Decisões de arquitetura, e o porquê

### Canvas com d3-geo em vez de MapLibre

O briefing sugeria MapLibre/Mapbox. Ficou d3-geo + canvas porque o briefing também
pede **troca de projeção** e um **globo**, e nenhum renderizador de tiles projeta
esfera — MapLibre é Web Mercator e ponto final. Além disso: zero chave de API, zero
cota, zero dependência de rede (a geometria é servida do próprio servidor) e o
terminador solar é desenhado no mesmo espaço de projeção do resto do mapa.

**Robinson**: o briefing cita Robinson; d3-geo não a traz embutida (mora em
`d3-geo-projection`). Foi usada a **Natural Earth 1**, da mesma família e
visualmente indistinguível nesta escala. O rótulo diz o nome verdadeiro.

### Intl em vez de Luxon

Tudo que o briefing pede de tempo — offset real, horário de verão, fusos de meia
hora, semana ISO, dia juliano — sai de `Intl.DateTimeFormat`, que carrega a base
IANA do próprio navegador. Luxon custaria ~70 KB para reembrulhar a mesma API e
embarcaria uma tzdata que envelhece. Não há **nenhum** offset fixo em tabela neste
módulo: mudança de regra de DST em qualquer país é absorvida sem tocar em código.

### Terminador como polígono geográfico

A v2 amostrava a curva do terminador em coordenadas de tela — só funcionava em
equiretangular. Agora a noite é um círculo de 90° em torno do ponto antisolar
(`d3.geoCircle`), projetável em **qualquer** projeção. As faixas de crepúsculo
(civil 84°, náutico 78°, astronômico 72°) empilhadas produzem o degradê atmosférico
sem nenhum shader.

### Um relógio para o painel inteiro

Um único `setInterval` de 1 s no store, pausado quando a aba está oculta. Cada
componente criando o próprio timer é como aparece aquele bug em que o cabeçalho
marca 10:59:59 e o cartão 11:00:00.

### Posicionamento de rótulos por caixas reais

Marcadores tentam o cartão completo nos quatro lados do ponto; não cabendo, tentam
o chip compacto; não cabendo, não são desenhados. O orçamento de cartões varia com
a largura do mapa (nenhum abaixo de 520 px). Isso substituiu uma grade de células
que não modelava o formato do rótulo e deixava pinos empilhados sobre os cartões.

### O mapa se enquadra no corredor livre

As margens do mapa são **medidas do DOM** (`useObstacles`), não codificadas. Fechar
um painel devolve espaço ao mapa automaticamente. Sem isso, o painel de Mercados
engolia Ásia e Oceania inteiras.

---

## Desempenho: o que foi medido e o que mudou

O perfil de CPU durante o arrasto apontou **52% do tempo em `closePath` nativo**. A
causa não era o número de camadas — desligá-las quase não mudava nada. Era a camada de
terra, que é a única sempre ligada: **1.429 anéis e 60.835 pontos**, redesenhados a
cada quadro, com `shadowBlur` por cima. Sombra sobre caminho complexo obriga o
navegador a rasterizar tudo e borrar.

| Cenário | Antes | Depois |
|---|---|---|
| Tarefas longas com o painel **parado** | 132–200 ms | **nenhuma** |
| Tarefas longas **arrastando** o mapa | 131–256 ms | 53–67 ms |
| Quadro mediano no arrasto | 169 ms | 72 ms |
| `closePath` no perfil (17 s de amostra) | 8.781 ms | 787 ms |

Para referência, o próprio app-shell (sem este painel) produz tarefas longas de
60–114 ms — ou seja, o painel saiu de "pior que o shell inteiro" para "dentro do
ruído do shell".

**As quatro mudanças, em ordem de impacto:**

1. **Repintura por MINUTO, não por segundo.** O relógio mestre bate a 1 Hz e o efeito
   de pintura dependia de `date`: o mapa era redesenhado 60×/min com o painel parado.
   Nada na cena muda dentro do minuto. Os relógios digitais seguem em 1 Hz — são HTML.
2. **Sombra removida da terra.** O relevo agora vem de dois traços concêntricos
   recortados pela própria terra. 🔴 *Não reintroduzir `shadowBlur` ali.*
3. **Geometria 110m durante a interação** (125 anéis / 5.127 pontos, 12× mais leve).
   Em movimento ninguém distingue; parado, volta o 50m.
4. **Sprite para as luzes de cidade.** Eram até 5.228 `createRadialGradient` por
   quadro; agora é um sprite desenhado uma vez e estampado com `drawImage`.

**Sobre Web Workers:** o briefing os cita. Depois destas quatro mudanças o quadro está
no nível do ruído do shell e o gargalo restante é pintura de canvas, que só sairia da
thread principal com `OffscreenCanvas` — complexidade real (transferir a geometria,
duplicar a projeção para posicionar os marcadores em HTML) para ganho que a medição
não justifica mais. Fica registrado como opção, não como dívida silenciosa.

---

## Aeroportos e a palavra "Status"

O briefing lista, para aeroportos: ICAO, IATA, hora local e **Status**. Os três
primeiros são diretos. O quarto exigiu uma decisão.

**Não há operação ao vivo aqui** — atrasos, voos, pistas — porque isso exigiria uma
API de tráfego aéreo que este módulo não possui. Um selo "Operacional" verde para
todos os 156 aeroportos seria pior que campo nenhum: pareceria informação e não seria.

O que o painel mostra é o campo REAL do OurAirports `scheduled_service`, que diz se o
aeroporto tem serviço comercial regular programado. **Não é decoração**: Kiev (KBP)
aparece como *sem serviço regular*, refletindo a suspensão da aviação civil ucraniana.

Junto vêm outros campos reais da mesma fonte: tipo (hub internacional / regional),
elevação e o município registrado — que difere do nome da cidade-sede em 90 dos 156
casos (CCS fica em Maiquetía, MVD em Ciudad de la Costa, LPB em El Alto).

O que separa aeroporto de cidade no mapa não é o rótulo e sim a COORDENADA: os pinos
usam a posição real do aeroporto, a 21 km do centro em GRU, 23 km em CDG e até 48 km
em ICN. É por isso que a camada só faz sentido a partir de ~4× de zoom — abaixo disso
os dois pontos se encostam.

> Se um dia entrar uma API de voos, o lugar de plugá-la é `data/airports.ts` +
> `AirportPin`; o resto da camada já está no lugar.

---

## Link direto: uma limitação do shell, contornada localmente

**Medido em 2026-07-30:** o app-shell não honra o hash no carregamento a frio. Abrir
`https://dshowdash.com.br/#/panel-relogio-mundial` numa aba nova cai em "Principal"
com o hash intacto na barra de endereços. Não é deste painel — `#/panel-ads` faz o
mesmo (testado como controle). O roteador só reage a `hashchange`, e num boot a frio
esse evento nunca dispara.

Consequência direta: o link compartilhável, cujo propósito inteiro é reproduzir uma
configuração, não abria o painel para quem recebia o link.

**A correção é deliberadamente local.** Consertar o roteador do shell seria mexer num
componente de boot com histórico de bundles circulares — fora do escopo deste módulo e
com risco para todos os painéis. A ponte `world-clock-map/index.js`, que já sabe
navegar (é o que faz no clique do relógio do header), passou a:

1. detectar que a URL pede este painel (hash da rota ou `?wc=1`);
2. esperar o container do shell aparecer (até 45 s — o caminho com sessão expirada é
   login → boot → container, e 15 s estouravam ainda no login);
3. navegar **e conferir**: se em 1,8 s o painel não montou, força um `hashchange` real.

O passo 3 existe porque a primeira versão só chamava `navigateToRoute` e reportava
sucesso enquanto o usuário olhava para o painel Principal.

> ⚠️ **Os demais painéis continuam sem abrir por link direto.** É um defeito real do
> shell, aqui apenas documentado — não foi corrigido porque corrigi-lo exige mexer no
> roteador de boot, o que não cabe nesta entrega.

### Impressão através da casca do shell

A doc prometia PDF pelo "Salvar como PDF" do navegador. Ao **medir**, o documento
impresso tinha 940px — uma página, com todo o resto cortado. A folha `@media print`
do painel já devolvia o host ao fluxo, mas isso não bastava: o painel vive dentro de
`#main`, que o shell declara `position: fixed` com `overflow: hidden auto`. Contêiner
fixo com altura de viewport recorta no papel como recorta na tela.

`app/usePrintMode.ts` marca `<html class="wcm-printing">` em `beforeprint` e remove em
`afterprint`; as regras que neutralizam os contêineres do shell vivem sob essa classe
**e** dentro de `@media print`. Só existem durante uma impressão, e só enquanto este
painel está montado. Depois: **940px → 3.189px**.

> É a única parte da folha que encosta em seletores do shell. Exceção consciente: a
> alternativa era aceitar que "exportar PDF" entregasse um recorte de tela.

---

## Acessibilidade: medida, não afirmada

A primeira versão desta documentação afirmava "WCAG AAA". A auditoria desmentiu:
**20 amostras reprovavam AAA e 7 reprovavam até AA no tema escuro; 21 reprovavam AA no
claro.** Texto de 9px em cinza 34% dá 2,83:1 — menos da metade do mínimo.

O que mudou:

- Níveis de tinta recalculados por medição (`--wcm-ink-2/3/4`), não por gosto.
- **Dois conjuntos de cor de estado**: `--wcm-state-*` para pontos e barras
  (WCAG pede 3:1 em componente gráfico) e `--wcm-state-*-ink` para TEXTO (7:1).
- **Nenhum texto abaixo de 10px.**
- A hierarquia visual passou a vir de tamanho, peso e caixa alta — não de texto
  apagado, que é hierarquia às custas de quem enxerga mal.

Hoje: **70 amostras únicas, zero reprovações em AAA, nos dois temas** — e a suíte de
navegador REPROVA se isso regredir.

---

## Armadilhas do projeto em que este módulo caiu (e como)

Registradas porque vão morder de novo em outros painéis.

| Armadilha | Sintoma | Correção |
|---|---|---|
| `height:100%` em filho de item flex | Painel colapsou para **104 px**; mapa com 120 px de canvas. Tudo o mais passava nos testes. | Host em `position:absolute; inset:0`. A altura do `.dsd-container__content` vem do flex, então a **especificada** é `auto` e o percentual não resolve. |
| `body.theme-light` existe nos DOIS temas | No tema escuro os painéis abriam claros enquanto o canvas ia escuro. | Casar só por `html[data-theme]`; a classe é fallback apenas quando o atributo não existe. Bloco `html[data-theme='dark']` explícito para vencer classe residual. |
| Marcador centrado em vez de ancorado | `translate(-50%,-50%)` no conjunto pino+cartão punha o ponto **59 px à esquerda** da cidade. | Só o pino é centrado; o rótulo é absoluto a partir dele. |
| Ordem do JSX invisível no desktop | A toolbar caía 600 px abaixo do mapa no layout estreito. | No desktop tudo é absoluto e a ordem não importa; no empilhamento, importa. |
| Custo de `Intl` em volume | Varredura de mercados fazia milhares de `formatToParts` por segundo. | Cache de decomposição por (zona, segundo) e cache de estado de mercado por minuto. |

---

## Limites conhecidos, ditos com todas as letras

- **Feriados são curadoria para 2026.** `HOLIDAY_YEAR` / `HOLIDAY_DATA_YEAR` marcam a
  validade. Fora desse ano a interface **avisa** em vez de afirmar que o dia é útil.
  Feriados islâmicos e lunares dependem de observação e decreto; datas estaduais não
  entram. Atualizar = trocar as listas e bumpar o ano.
- **Mudanças de horário de verão são calculadas**, não tabeladas — este é o item com
  maior chance de continuar certo daqui a três anos.
- **PDF é impressão do navegador** (`window.print()` com folha `@media print`), não um
  download automático. Gerar PDF no cliente exigiria jsPDF (~150 KB) para um resultado
  pior que o "Salvar como PDF" nativo. O botão diz "Imprimir / PDF".
- **`api/weather/bulk.php` é público**, como os demais endpoints de clima do projeto.
  A URL de destino é constante e os parâmetros são números validados em faixa — não há
  vetor de SSRF. O cache Redis de 30 min protege a API externa de rajadas.
- **Aeroportos e bolsas não têm dados operacionais ao vivo** (voos, cotações). A camada
  de aeroportos mostra ICAO/IATA, hora local, tipo, elevação e o campo real
  `scheduled_service` — ver a seção "Aeroportos e a palavra Status". A de bolsas
  mostra estado de sessão calculado a partir da grade oficial.

---

## PNR: o motor antigo continua vivo

`/components/world-clock-map/panel.js` (motor vanilla da v2) **não foi removido**.
O adaptador tenta React → vanilla → cartão de erro, nessa ordem. Se o bundle não
carregar (manifest ausente, `dist` sem permissão, rede), o usuário recebe o mapa
antigo funcionando em vez de tela branca. O smoke script verifica que essa rede de
segurança continua no lugar.

As preferências da v2 (`world_clock.pinned_cities`, array de ids) continuam sendo
**lidas** e migradas para o formato novo no primeiro salvamento. A chave antiga não
é apagada, então um rollback para a v2 ainda encontra as cidades dela.

---

## Acessibilidade

- Marcadores, painéis e controles são elementos nativos (`button`, `checkbox`,
  `radio`, `combobox` + `listbox` com `aria-activedescendant`).
- Mapa navegável por teclado: setas movem/giram, `+`/`−` ampliam, `0` reenquadra.
- Favoritos reordenáveis por arrasto **e** por `Alt + ↑/↓`, com anúncio em `aria-live`.
- Linha do tempo é um `slider` com `aria-valuetext` em português.
- `prefers-reduced-motion` desliga as animações; `prefers-contrast: more` e
  `forced-colors` trocam o vidro por superfície opaca.
- Ripple em todos os botões por delegação (um listener na raiz, zero estado no React)
  e resposta de pressão com mola; ambos desligados por `prefers-reduced-motion`.
- Atalhos: `B` busca · `F` favoritos · `G` relógios simultâneos · `C` camadas ·
  `M` mercados · `E` eventos · `K` comparador · `T` linha do tempo · `A` analítico ·
  `R` relógio · `Esc` volta o tempo para agora.
