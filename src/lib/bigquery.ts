import { BigQuery } from "@google-cloud/bigquery";

let bigQueryClient: BigQuery | null = null;

function getCredentials() {
  const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!base64) {
    throw new Error(
      "GOOGLE_CREDENTIALS_BASE64 não configurado. Gere o JSON da service account, converta para base64 e defina essa variável de ambiente."
    );
  }
  const json = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(json);
}

export function getBigQueryClient(): BigQuery {
  if (!bigQueryClient) {
    const credentials = getCredentials();
    bigQueryClient = new BigQuery({
      projectId: credentials.project_id,
      credentials
    });
  }
  return bigQueryClient;
}

export interface ItemPedido {
  nome: string;
  quantidade: number;
  valorUnitario: number | null;
}

export interface PedidoEncontrado {
  idPedidoNexaas: string;
  numeroPedido: string | null;
  nomeCliente: string | null;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  valorPedido: number | null;
  dataPedido: string | null;
  canalVenda: string | null;
  lojaOuCd: string | null;
  itens: ItemPedido[];
}

function normalizarDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

// Gera variações plausíveis do número (com e sem DDI 55), já que não temos
// controle sobre como cada atendente vai digitar o telefone.
function variacoesTelefone(valor: string): string[] {
  const digitos = normalizarDigitos(valor);
  const variacoes = new Set([digitos]);

  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    variacoes.add(digitos.slice(2));
  } else if (digitos.length === 10 || digitos.length === 11) {
    variacoes.add(`55${digitos}`);
  }

  return Array.from(variacoes);
}

export type TipoBusca = "numero_pedido" | "telefone" | "cpf";

export async function buscarPedido(
  tipo: TipoBusca,
  valor: string
): Promise<PedidoEncontrado[]> {
  const client = getBigQueryClient();
  const tabela = process.env.BIGQUERY_TABLE ??
    "igneous-ethos-444918-p4.BISCOITE.biscoite_bronze";

  let whereClause: string;
  const params: Record<string, string | string[]> = {};

  if (tipo === "numero_pedido") {
    // Cada canal prefixa o código do pedido de um jeito (SLR-, MERCADOLIVRE-,
    // SHOPEE-, ITAU-, HOUSE_OF_GAMERS-, CRMBONUS-, etc.). Em vez de exigir
    // igualdade exata, também aceitamos o valor digitado como uma parte do
    // código completo (e ignoramos maiúsculas/minúsculas), então funciona
    // tanto se o atendente digitar com o prefixo quanto sem ele.
    // A busca "contém" só entra em jogo a partir de 6 caracteres, para evitar
    // trazer resultados demais com números muito curtos (ex: "01").
    const valorTrim = valor.trim();
    whereClause =
      valorTrim.length >= 6
        ? `(
            UPPER(JSON_VALUE(payload, '$.external_code')) = UPPER(@valor)
            OR JSON_VALUE(payload, '$.id') = @valor
            OR UPPER(JSON_VALUE(payload, '$.external_code')) LIKE CONCAT('%', UPPER(@valor), '%')
          )`
        : `(
            UPPER(JSON_VALUE(payload, '$.external_code')) = UPPER(@valor)
            OR JSON_VALUE(payload, '$.id') = @valor
          )`;
    params.valor = valorTrim;
  } else if (tipo === "telefone") {
    // Compara contra TODOS os telefones do pedido (não só o primeiro), e contra
    // variações com/sem DDI 55, já que a formatação varia entre canais.
    whereClause = `EXISTS (
      SELECT 1
      FROM UNNEST(JSON_VALUE_ARRAY(payload, '$.data.customer.phones')) AS tel
      WHERE REGEXP_REPLACE(tel, r'[^0-9]', '') IN UNNEST(@valores)
    )`;
    params.valores = variacoesTelefone(valor);
  } else {
    whereClause = `JSON_VALUE(payload, '$.data.customer.document') = @valor`;
    params.valor = normalizarDigitos(valor);
  }

  // A tabela bronze guarda um snapshot novo a cada atualização de status do
  // pedido (confirmado, separado, nota emitida, etc). Por isso, deduplicamos
  // por id do pedido, mantendo sempre a versão mais recente (maior created_at).
  const query = `
    WITH pedidos_extraidos AS (
      SELECT
        JSON_VALUE(payload, '$.id') AS id_pedido_nexaas,
        JSON_VALUE(payload, '$.external_code') AS numero_pedido,
        JSON_VALUE(payload, '$.customer.name') AS nome_cliente,
        JSON_VALUE(payload, '$.data.customer.document') AS cpf,
        JSON_VALUE(payload, '$.data.customer.phones[0]') AS telefone,
        JSON_VALUE(payload, '$.customer.email') AS email,
        CAST(JSON_VALUE(payload, '$.data.total_value') AS FLOAT64) AS valor_pedido,
        COALESCE(
          JSON_VALUE(payload, '$.data.placed_at'),
          JSON_VALUE(payload, '$.placed_at')
        ) AS data_pedido,
        JSON_VALUE(payload, '$.sale_channel_name') AS canal_venda,
        JSON_VALUE(payload, '$.organization_name') AS loja_ou_cd,
        JSON_QUERY(payload, '$.data.items') AS itens_json,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY JSON_VALUE(payload, '$.id')
          ORDER BY created_at DESC
        ) AS posicao
      FROM \`${tabela}\`
      WHERE ${whereClause}
    )
    SELECT
      id_pedido_nexaas,
      numero_pedido,
      nome_cliente,
      cpf,
      telefone,
      email,
      valor_pedido,
      data_pedido,
      canal_venda,
      loja_ou_cd,
      itens_json
    FROM pedidos_extraidos
    WHERE posicao = 1
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const [rows] = await client.query({
    query,
    params,
    location: process.env.BIGQUERY_LOCATION ?? "US"
  });

  return rows.map((row: any) => ({
    idPedidoNexaas: row.id_pedido_nexaas,
    numeroPedido: row.numero_pedido,
    nomeCliente: row.nome_cliente,
    cpf: row.cpf,
    telefone: row.telefone,
    email: row.email,
    valorPedido: row.valor_pedido,
    dataPedido: row.data_pedido,
    canalVenda: row.canal_venda,
    lojaOuCd: row.loja_ou_cd,
    itens: parseItens(row.itens_json)
  }));
}

function parseItens(itensJson: string | null): ItemPedido[] {
  if (!itensJson) return [];
  try {
    const bruto = JSON.parse(itensJson);
    if (!Array.isArray(bruto)) return [];
    return bruto.map((item: any) => ({
      nome:
        item?.product_sku?.description ??
        item?.product_sku?.name ??
        item?.additional_description ??
        "Item sem nome",
      quantidade: Number(item?.quantity ?? 1),
      valorUnitario: item?.unit_price != null ? Number(item.unit_price) : null
    }));
  } catch {
    return [];
  }
}
