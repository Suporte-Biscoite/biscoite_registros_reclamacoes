import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lojas = await prisma.loja.findMany({
    orderBy: { nome: "asc" },
    select: { nome: true }
  });

  return NextResponse.json({ lojas: lojas.map((l: { nome: string }) => l.nome) });
}
