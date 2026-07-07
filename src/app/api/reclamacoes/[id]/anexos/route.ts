import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  if (!body?.url || !body?.nomeArquivo) {
    return NextResponse.json({ error: "Dados do anexo inválidos." }, { status: 400 });
  }

  const anexo = await prisma.anexo.create({
    data: {
      reclamacaoId: params.id,
      nomeArquivo: body.nomeArquivo,
      url: body.url,
      tipoArquivo: body.tipoArquivo ?? null,
      tamanho: body.tamanho ?? null
    }
  });

  return NextResponse.json({ anexo }, { status: 201 });
}
