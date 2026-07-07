import { NextRequest, NextResponse } from "next/server";
import { buscarPedido, TipoBusca } from "@/lib/bigquery";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tipo = searchParams.get("tipo") as TipoBusca | null;
  const valor = searchParams.get("valor");

  if (!tipo || !valor) {
    return NextResponse.json(
      { error: "Parâmetros 'tipo' e 'valor' são obrigatórios." },
      { status: 400 }
    );
  }

  if (!["numero_pedido", "telefone", "cpf"].includes(tipo)) {
    return NextResponse.json(
      { error: "Tipo de busca inválido. Use numero_pedido, telefone ou cpf." },
      { status: 400 }
    );
  }

  try {
    const resultados = await buscarPedido(tipo, valor);
    return NextResponse.json({ resultados });
  } catch (err) {
    console.error("Erro ao buscar pedido no BigQuery:", err);
    return NextResponse.json(
      {
        error:
          "Não foi possível buscar o pedido agora. Você pode cadastrar os dados manualmente.",
        detalhe: process.env.NODE_ENV === "development" ? String(err) : undefined
      },
      { status: 502 }
    );
  }
}
