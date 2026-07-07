import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reclamacao = await prisma.reclamacao.findUnique({
    where: { id: params.id },
    include: { historico: { orderBy: { dataHora: "asc" } } }
  });

  if (!reclamacao) {
    return NextResponse.json({ error: "Reclamação não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ reclamacao });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const camposPermitidos = [
    "resolucaoAplicada",
    "valorGastoResolucao",
    "responsavel",
    "descricao"
  ] as const;

  const data: Record<string, unknown> = {};
  for (const campo of camposPermitidos) {
    if (campo in body) {
      data[campo] = body[campo];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para atualizar." }, { status: 400 });
  }

  try {
    const reclamacao = await prisma.reclamacao.update({
      where: { id: params.id },
      data
    });
    return NextResponse.json({ reclamacao });
  } catch {
    return NextResponse.json({ error: "Reclamação não encontrada." }, { status: 404 });
  }
}
