# Consumo e custo no BigQuery — leia antes de crescer o uso

## Por que as buscas podem custar caro

A tabela `biscoite_bronze` guarda o pedido inteiro como um JSON de texto na
coluna `payload`. Não existe como "indexar" um campo dentro desse JSON no
BigQuery convencional — então toda busca por número de pedido, telefone ou
CPF precisa **ler o `payload` de todas as linhas da tabela** para achar o que
bate. O preço não muda pelo resultado, muda pela quantidade de dados lidos.

Isso significa: cada busca no sistema de reclamações custa (aproximadamente)
o mesmo, seja qual for o critério buscado — e esse custo só tende a crescer,
porque a tabela ganha linhas novas a cada execução do job de ingestão
(inclusive múltiplas linhas por pedido, uma para cada mudança de status).

## Como medir o custo real (não estimar — medir)

Rode no console do BigQuery:

```sql
-- Gasto por query nos últimos 30 dias
SELECT
  query,
  total_bytes_billed,
  ROUND(total_bytes_billed / POW(1024, 3), 2) AS gb_cobrados,
  creation_time
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
ORDER BY total_bytes_billed DESC
LIMIT 20
```

```sql
-- Tamanho aproximado da coluna que pesa mais em cada busca
SELECT
  COUNT(*) AS linhas,
  ROUND(SUM(BYTE_LENGTH(payload)) / POW(1024, 3), 2) AS gb_da_coluna_payload
FROM `igneous-ethos-444918-p4.BISCOITE.biscoite_bronze`
```

O segundo valor (GB da coluna payload) é aproximadamente o custo de **cada**
busca de pedido/telefone/CPF feita pelo sistema.

## O que já está implementado como proteção

As duas funções de busca (`buscarPedido` e `buscarLojasNexaas`) agora têm um
limite de segurança (`maximumBytesBilled`), configurável pela variável de
ambiente `BIGQUERY_MAX_BYTES_BILLED` (padrão: 5 GB). Se uma busca tentar
processar mais que esse limite, ela falha com erro controlado — o atendente
vê a opção de cadastrar manualmente, em vez de gerar custo sem controle.
Ajuste esse valor no `.env.local`/Vercel conforme o tamanho real da sua
tabela (medido acima).

## Opções para reduzir o custo de verdade (do mais simples ao mais robusto)

### 1. Alerta de orçamento (5 minutos, não reduz custo, mas evita susto)
No Google Cloud Console → Billing → Budgets & alerts: crie um orçamento
mensal para o projeto do BigQuery, com alertas por e-mail em 50%/90%/100%.

### 2. Tabela "prata" com pedidos únicos e campos já extraídos (recomendado)
Criar uma tabela derivada (atualizada periodicamente, ex: a cada hora, logo
após a ingestão) com uma linha por pedido (já deduplicada) e os campos que
hoje extraímos via `JSON_VALUE` como colunas normais:
`order_id, external_code, cpf, telefone, email, nome_cliente, valor_pedido,
data_pedido, canal_venda, loja, itens (campo JSON menor, só os itens)`.

Buscar nessa tabela prata é muito mais barato: menos linhas (deduplicada) e
colunas nativas em vez de extração de JSON em toda a tabela. Isso é
essencialmente o que já discutimos lá no início do projeto como "camada
consolidadora" — vale reconsiderar agora que o custo virou uma questão
concreta.

### 3. Search Index do BigQuery
O BigQuery tem um recurso de índice de busca (`CREATE SEARCH INDEX`) que
permite consultas por texto dentro de colunas JSON/STRING sem escanear a
tabela inteira — mas exige reescrever as buscas para usar a função
`SEARCH()` em vez de `JSON_VALUE(...) = valor`. Tecnicamente resolve sem
precisar de uma tabela nova, mas dá mais trabalho de reescrita.

### 4. Particionamento/clustering
Ajuda buscas que filtram por data (como a lista de lojas, que já filtra por
`created_at`), mas **não ajuda** as buscas por CPF/telefone/número de pedido,
já que esses valores não são a chave de particionamento — a tabela
continuaria precisando ler o `payload` inteiro para essas buscas.

## Recomendação

Se o volume de reclamações registradas por dia for baixo (dezenas, não
centenas), o custo real pode ainda estar dentro do 1 TB gratuito mensal do
BigQuery. Recomendo: rodar as duas queries de medição acima primeiro, ver o
número real, e decidir se vale investir na tabela prata (opção 2) — que
resolve custo e também deixa a busca mais rápida.
