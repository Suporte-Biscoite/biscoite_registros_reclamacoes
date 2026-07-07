import { NextResponse } from "next/server";
import { buscarLojasNexaas } from "@/lib/bigquery";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lojas = await buscarLojasNexaas();
    if (lojas.length > 0) {
      return NextResponse.json({ lojas, fonte: "nexaas" });
    }
  } catch (err) {
    console.error(
      "Erro ao buscar lojas no BigQuery, usando lista local como reserva:",
      err
    );
  }

  // Reserva: se o BigQuery falhar ou não retornar nada (ex: credencial fora
  // do ar), cai para a lista local — desatualizada, mas evita deixar o
  // dropdown vazio.
  const lojasLocais = await prisma.loja.findMany({
    orderBy: { nome: "asc" },
    select: { nome: true }
  });
  return NextResponse.json({
    lojas: lojasLocais.map((l: { nome: string }) => l.nome),
    fonte: "local"
  });
}
