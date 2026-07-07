import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const anexo = await prisma.anexo.findUnique({ where: { id: params.id } });
  if (!anexo) {
    return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  }

  try {
    await del(anexo.url);
  } catch (err) {
    // Se o arquivo já não existir no storage por algum motivo, seguimos e
    // removemos o registro do banco mesmo assim, para não deixar um anexo
    // "fantasma" travado na lista.
    console.error("Erro ao remover arquivo do storage:", err);
  }

  await prisma.anexo.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
