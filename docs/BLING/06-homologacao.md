# Bling — Homologação (Fase 5)

> 2026-07-30 · estado: **homologado sem a credencial**

---

## 1. O que foi homologado

O §72 do briefing diz: *"a API real substitui os mocks sem que nenhuma tela
precise ser reconstruída"*. Isso é uma afirmação verificável, e é o que esta
fase verifica.

A Fase 4 provou o pipeline com **1 produto e 1 pedido** — mostra que funciona,
não que funciona com volume nem com a variedade de estados que dados reais têm.

Aqui o grafo inteiro do mock é servido **como se fosse a API v3** e entra no
banco pelo caminho real:

```
BlingApiFalsa  →  paginar → normalizar → adaptar versão → resolver FK → upsert
   6.251                                                                  │
 registros                                                          banco BLING
                                                                          │
                    as MESMAS perguntas que as 52 telas fazem  ←──────────┤
                                                                          │
                              mock  ←──── comparação número a número ─────┘
```

Se os dois derem o mesmo número, trocar `BLING_PROVIDER=mock` por `bling` não
muda uma linha de tela.

```bash
php scripts/bling-fase5-homologacao.php      # 65 verificações
php scripts/bling-fase5-homologacao.php --manter   # preserva os dados p/ inspeção
```

A conta de teste usa o CNPJ reservado `00000000000191` e é **apagada ao final,
inclusive em caso de erro**.

### Volume exercitado

| Recurso | Registros | Recurso | Registros |
|---|---:|---|---:|
| produtos | 221 | notas | 1.405 |
| clientes | 190 | a receber | 1.966 |
| fornecedores | 18 | a pagar | 182 |
| pedidos | 1.538 | estoque | 599 |
| compras | 114 | demais cadastros | 18 |

**16 páginas** de pedidos — a paginação é percorrida de verdade, não simulada.

---

## 2. Resultado

| Verificação | Resultado |
|---|---|
| Registros consultados | 6.251 de 6.251 |
| Itens perdidos por erro | 0 |
| FKs órfãs (pedido sem cliente, item sem produto, produto sem categoria) | 0 |
| Situações distintas de pedido | 10 — o adapter está traduzindo |
| Códigos de situação desconhecidos | 0 |
| Documentos vazando sem máscara | 0 de 208 |
| KPIs divergentes | 0 além das 2 declaradas |
| Curva ABC (5 dimensões × 2 métricas) | 10 de 10 batem |
| Série de evolução × KPI × curva ABC | R$ 69.215.282,59 nos três |

### Desempenho com volume

| Operação | Tempo |
|---|---|
| Carga inicial completa (5.652 registros) | **18,6 s** (304/s) |
| Incremental completo | 20,8 s |
| KPIs | 6 ms |
| Grid de 1.538 pedidos | < 1 ms, **4 consultas** |
| Curva ABC | 3 ms |
| Evolução | 9 ms |

O grid de pedidos gasta 4 consultas para 1.538 pedidos. Um N+1 gastaria mais de
mil — é o defeito que some no teste de um registro e derruba a tela em produção.

---

## 3. Divergências declaradas entre mock e banco

Duas, ambas porque o **mock inventa** um estado operacional que o dado real não
tem. Estão na lista de exceções do teste, e o teste avisa se uma delas **deixar**
de divergir — exceção que virou verdade é exceção a remover, senão vira licença
permanente para um defeito futuro no mesmo indicador.

| KPI | Mock | Banco | Por quê |
|---|---:|---:|---|
| `aguardando_expedicao` | 31 | 44 | o mock gera envios com situação própria; o real **deriva** a situação do envio a partir do pedido, porque a v3 não tem recurso de envio separado |
| `integracoes_falha` | 1 | 0 | o mock simula uma sincronização com erro para a tela ter o que mostrar; o banco reflete o estado real |

Na tela de **Atenção**, quatro ocorrências existem só no mock — todas
declaradas: `webhooks_falha` e `sync_interrompida` (falhas simuladas),
`remessas_atraso` (depende de previsão de entrega que a v3 nem sempre traz) e
`estoque_divergente` (divergência de inventário é contagem física, não exposta
pela API).

Na direção contrária, o banco detecta `produtos_sem_vinculo`, que o mock não
gera — a regra está rodando sobre dado real, o que é o desejado.

---

## 4. Sete defeitos que só apareceram com volume

### 1. Título quitado virava vencido — o pior deles

O normalizador calculava quanto já foi pago assim:

```php
'valor_recebido' => self::numero($p, 'valorPago', 'saldo') > 0
    ? max(0.0, $valor - self::numero($p, 'saldo')) : self::numero($p, 'valorPago'),
```

Num título liquidado a API manda `saldo: 0` e nenhum `valorPago`. A condição
`> 0` dava falso, o recebido virava `0` — "nada pago" — e o adapter então via
saldo em aberto com vencimento passado e marcava **vencido**.

**1.703 de 1.966 títulos** ficaram vencidos na homologação. Com dados reais, a
tela de contas a receber mostraria a empresa inteira inadimplente, e o KPI de
contas vencidas erraria em **R$ 51 milhões**.

Zero é um valor legítimo nos dois campos — saldo zero significa quitado,
valorPago zero significa intocado. O que decide é a **presença** da chave, não o
valor dela.

### 2. Nenhum canal de venda era gravado

`bling_sales_channels` era a única tabela alvo sem `sincronizado_em` e
`payload_hash`, que o upsert genérico grava em qualquer tabela. Os 6 canais
falhavam — e como erro **por item** não derruba o recurso, a sincronização
reportava sucesso.

A homologação passou a conferir a estrutura das 12 tabelas alvo antes de
qualquer carga. Custa milissegundos.

### 3. A tela de Expedição ficaria vazia para sempre

`bling_shipments` tinha tabela e leitor, mas ninguém gravava: `envios` não é um
recurso da API v3 — transportadora, rastreio e prazo vêm **dentro do pedido**,
em `transporte`.

Tratar envio como recurso próprio significaria inventar um endpoint que não
existe. A situação do envio passou a ser **derivada** da situação do pedido, num
lugar só — se a tela de expedição e a de pedidos calculassem separadamente,
poderiam discordar sobre o mesmo pedido.

### 4. A carga era 6× mais lenta que o necessário

5.652 registros em **112 s** — 20 ms por registro, absurdo para inserção local.
O custo não estava na consulta: estava no **commit**. Em autocommit, cada
`INSERT` paga um `fsync` próprio.

Uma transação por página derrubou para **18,6 s**. A página é a unidade certa
porque o progresso já era gravado a cada página: o ponto de retomada e o limite
da transação coincidem.

### 5. …e a transação criou um risco novo, também corrigido

Com transação por página, registrar o erro de um item **dentro** dela faria uma
página que falha reverter o próprio registro da falha — o item sumiria sem
deixar rastro, que é exatamente a informação de que se precisa. Os erros passam
a ser acumulados e gravados **depois** do commit.

Uma exceção que escapasse com a transação aberta deixaria a conexão presa, e
toda gravação seguinte — inclusive a do estado de erro — entraria nela. Há
`rollBack()` explícito no `catch`.

### 6. Mais de 9 mil consultas só para resolver produto

Cada pedido gastava uma consulta por contato, uma por canal e uma por item.
Cache em memória, **só de acertos**: um `bling_id` que já resolveu nunca muda,
mas "não existe" é temporário — a entidade pode ser criada no meio da própria
carga, e cachear o negativo deixaria o item órfão para sempre.

Ganho isolado de 13% — pequeno perto do commit, mas o efeito cresce com o
volume real.

### 7. O verificador de go-live daria falso positivo

`bling-golive.php` via a conta de teste da homologação e dizia "conta
conectada" — no item que o dono mais precisa que seja verdade. Passou a ignorar
o CNPJ reservado e avisa quando encontra contas de teste no banco.

---

## 5. Rollback

**Trocar `BLING_PROVIDER` de volta para `mock`.** É só isso.

Nada é apagado: os dados sincronizados continuam no banco, e voltar a `bling`
retoma de onde parou. A homologação verifica as duas direções.

Desconectar a conta também **não** apaga dados — só revoga e remove os tokens.
Apagar o histórico a partir de um clique em "desconectar" seria destrutivo e
irreversível.

---

## 6. Roteiro do go-live

```bash
php scripts/bling-golive.php     # sai 0 quando pode virar a chave
```

Não testa: **confere**. Mede 15 itens no ambiente de verdade e, quando algum
falha, diz o que fazer. Hoje faltam três, todos seus.

1. **`BLING_CLIENT_ID` e `BLING_CLIENT_SECRET`** no `.env`
   Bling › Preferências › Integrações › API › Meus aplicativos.

2. **Conferir a `BLING_REDIRECT_URI` cadastrada no aplicativo do Bling**
   Tem que ser idêntica a `https://dshowdash.com.br/api/bling/oauth/callback`.
   Diferença de barra final já derruba o fluxo.

3. **Conectar** em `Administração › Integrações`.

4. **Carga inicial** em `Administração › Sincronização`.
   Acompanhe por `tail -f /var/log/bling-worker.log`.

5. **Só então** trocar `BLING_PROVIDER=mock` para `bling`.

   ⚠️ Virar a chave **antes** da carga mostraria telas vazias — e isso se lê
   como "o módulo não funciona", quando o que está vazio é o banco. O
   verificador recusa o item enquanto não houver dados.

6. Rodar `bash scripts/bling-check-all.sh` e conferir os números na tela contra
   o próprio Bling.

Opcional, a qualquer momento: `BLING_WEBHOOK_SECRET` + registrar
`POST /api/bling/webhooks` no Bling. Sem ele o atraso máximo é o do incremental,
15 minutos.

---

## 7. O que ainda não foi verificado

Honestamente, o que só a credencial resolve:

- **Os nomes reais dos campos da v3.** O normalizador lê por caminho tolerante e
  aceita várias grafias, mas a lista foi montada a partir da documentação, não de
  respostas reais. Um campo com nome inesperado apareceria como valor nulo, não
  como erro.
- **Os códigos de situação que a conta realmente usa.** Código desconhecido não
  quebra nada — vira o padrão neutro e é registrado em
  `BlingVersionAdapter::desconhecidos()`, que aparece no `/status`. Vale conferir
  essa lista depois da primeira carga.
- **O limite de requisições da conta.** O cliente assume 3/s e 120.000/dia. Se o
  plano for outro, ajustar em `BlingClient`.
- **O formato exato da assinatura do webhook.** Aceita
  `X-Bling-Signature`, `X-Hub-Signature-256` e `X-Signature`, com ou sem prefixo
  `sha256=`. Se o Bling usar outro cabeçalho, o webhook recusará tudo — e isso
  aparece em `bling_webhook_events` com `assinatura_valida = 0`.

Nenhum desses é bloqueio: todos falham de forma **visível** e nenhum corrompe
dado.
