import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_ORDEM } from "@/lib/taxonomy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  const novoStatus = body?.status;

  if (!novoStatus || !STATUS_ORDEM.includes(novoStatus)) {
    return NextResponse.json(
      { error: "Status inválido. Use um dos valores: " + STATUS_ORDEM.join(", ") },
      { status: 400 }
    );
  }

  const atual = await prisma.reclamacao.findUnique({ where: { id: params.id } });
  if (!atual) {
    return NextResponse.json({ error: "Reclamação não encontrada." }, { status: 404 });
  }

  const reclamacao = await prisma.reclamacao.update({
    where: { id: params.id },
    data: {
      status: novoStatus,
      historico: {
        create: {
          statusAnterior: atual.status,
          statusNovo: novoStatus
        }
      }
    }
  });

  return NextResponse.json({ reclamacao });
}
