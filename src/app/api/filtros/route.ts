import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function limpar(valores: Record<string, unknown>[], campo: string): string[] {
  return Array.from(
    new Set(
      valores
        .map((v) => v[campo])
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function GET() {
  const [canais, lojas, motivos, submotivos, resolucoes] = await Promise.all([
    prisma.reclamacao.groupBy({ by: ["canalVenda"] }),
    prisma.reclamacao.groupBy({ by: ["lojaOuCd"] }),
    prisma.reclamacao.groupBy({ by: ["motivo"] }),
    prisma.reclamacao.groupBy({ by: ["submotivo"] }),
    prisma.reclamacao.groupBy({ by: ["resolucaoAplicada"] })
  ]);

  return NextResponse.json({
    canais: limpar(canais, "canalVenda"),
    lojas: limpar(lojas, "lojaOuCd"),
    motivos: limpar(motivos, "motivo"),
    submotivos: limpar(submotivos, "submotivo"),
    resolucoes: limpar(resolucoes, "resolucaoAplicada")
  });
}
