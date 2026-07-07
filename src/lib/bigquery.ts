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
}

function normalizarDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
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
  const params: Record<string, string> = {};

  if (tipo === "numero_pedido") {
    whereClause = `(
      JSON_VALUE(payload, '$.external_code') = @valor
      OR JSON_VALUE(payload, '$.id') = @valor
    )`;
    params.valor = valor.trim();
  } else if (tipo === "telefone") {
    whereClause = `JSON_EXTRACT_SCALAR(payload, '$.data.customer.phones[0]') = @valor`;
    params.valor = normalizarDigitos(valor);
  } else {
    whereClause = `JSON_VALUE(payload, '$.data.customer.document') = @valor`;
    params.valor = normalizarDigitos(valor);
  }

  const query = `
    SELECT
      JSON_VALUE(payload, '$.id') AS id_pedido_nexaas,
      JSON_VALUE(payload, '$.external_code') AS numero_pedido,
      JSON_VALUE(payload, '$.customer.name') AS nome_cliente,
      JSON_VALUE(payload, '$.data.customer.document') AS cpf,
      JSON_VALUE(payload, '$.data.customer.phones[0]') AS telefone,
      JSON_VALUE(payload, '$.customer.email') AS email,
      CAST(JSON_VALUE(payload, '$.data.total_value') AS FLOAT64) AS valor_pedido,
      JSON_VALUE(payload, '$.placed_at') AS data_pedido,
      JSON_VALUE(payload, '$.sale_channel_name') AS canal_venda,
      JSON_VALUE(payload, '$.organization_name') AS loja_ou_cd
    FROM \`${tabela}\`
    WHERE ${whereClause}
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
    lojaOuCd: row.loja_ou_cd
  }));
}
