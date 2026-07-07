import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reclamacao = await prisma.reclamacao.findUnique({
    where: { id: params.id },
    include: {
      historico: { orderBy: { dataHora: "asc" } },
      anexos: { orderBy: { criadoEm: "asc" } }
    }
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

  // Campos que podem ser editados depois de criada a reclamação. Deixamos de
  // fora campos "de sistema" (id, protocolo, status — que tem rota própria —,
  // histórico, anexos, datas de criação/abertura e o retrato do pedido).
  const camposPermitidos = [
    "canalVenda",
    "lojaOuCd",
    "numeroPedido",
    "valorPedido",
    "nomeCliente",
    "cpf",
    "telefone",
    "email",
    "motivo",
    "submotivo",
    "descricao",
    "resolucaoAplicada",
    "valorGastoResolucao",
    "responsavel"
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reclamacao = await prisma.reclamacao.findUnique({
    where: { id: params.id },
    include: { anexos: true }
  });

  if (!reclamacao) {
    return NextResponse.json({ error: "Reclamação não encontrada." }, { status: 404 });
  }

  // Remove os arquivos do storage antes de apagar o registro — sem isso, os
  // anexos ficariam "órfãos" no Vercel Blob, sem nenhuma reclamação
  // apontando para eles.
  for (const anexo of reclamacao.anexos) {
    try {
      await del(anexo.url);
    } catch (err) {
      console.error("Erro ao remover anexo do storage:", err);
    }
  }

  // O histórico de status e os registros de anexo são removidos
  // automaticamente pelo banco (cascade), já configurado no schema.
  await prisma.reclamacao.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
