import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface PorPeriodoRow {
  periodo: string;
  quantidade: number;
}

interface ValorPorPeriodoRow {
  periodo: string;
  valor: number;
}

interface PorCategoriaRow {
  categoria: string | null;
  quantidade: number;
}

export async function GET(request: NextRequest) {
  const dataInicioParam = request.nextUrl.searchParams.get("dataInicio");
  const dataFimParam = request.nextUrl.searchParams.get("dataFim");

  let dataLimite: Date;
  let dataFinal: Date;

  if (dataInicioParam && dataFimParam) {
    dataLimite = new Date(`${dataInicioParam}T00:00:00`);
    dataFinal = new Date(`${dataFimParam}T23:59:59`);
  } else {
    const meses = Number(request.nextUrl.searchParams.get("meses") ?? "6");
    const mesesValido = Number.isFinite(meses) && meses > 0 ? meses : 6;
    dataFinal = new Date();
    dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - mesesValido);
  }

  const [
    porPeriodo,
    valorGastoPorPeriodo,
    porMotivo,
    porLoja,
    porCanal,
    porStatus,
    totais,
    tempoResolucao
  ] = await Promise.all([
    prisma.$queryRaw<PorPeriodoRow[]>`
      SELECT to_char(date_trunc('month', "dataAbertura"), 'YYYY-MM') AS periodo,
             COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE "dataAbertura" >= ${dataLimite} AND "dataAbertura" <= ${dataFinal}
      GROUP BY periodo
      ORDER BY periodo ASC
    `,
    prisma.$queryRaw<ValorPorPeriodoRow[]>`
      SELECT to_char(date_trunc('month', "dataAbertura"), 'YYYY-MM') AS periodo,
             COALESCE(SUM("valorGastoResolucao"), 0)::float AS valor
      FROM "Reclamacao"
      WHERE "dataAbertura" >= ${dataLimite} AND "dataAbertura" <= ${dataFinal}
      GROUP BY periodo
      ORDER BY periodo ASC
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT motivo AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE "dataAbertura" >= ${dataLimite} AND "dataAbertura" <= ${dataFinal}
      GROUP BY motivo
      ORDER BY quantidade DESC
      LIMIT 8
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT "lojaOuCd" AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE "dataAbertura" >= ${dataLimite} AND "dataAbertura" <= ${dataFinal}
      GROUP BY "lojaOuCd"
      ORDER BY quantidade DESC
      LIMIT 8
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT "canalVenda" AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE "dataAbertura" >= ${dataLimite} AND "dataAbertura" <= ${dataFinal}
      GROUP BY "canalVenda"
      ORDER BY quantidade DESC
      LIMIT 8
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT status AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE "dataAbertura" >= ${dataLimite} AND "dataAbertura" <= ${dataFinal}
      GROUP BY status
    `,
    prisma.$queryRaw<
      { total: number; resolvidas: number; valorTotal: number }[]
    >`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'RESOLVIDO')::int AS resolvidas,
        COALESCE(SUM("valorGastoResolucao"), 0)::float AS "valorTotal"
      FROM "Reclamacao"
      WHERE "dataAbertura" >= ${dataLimite} AND "dataAbertura" <= ${dataFinal}
    `,
    prisma.$queryRaw<{ dias: number | null }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (h."dataHora" - r."dataAbertura")) / 86400)::float AS dias
      FROM "Reclamacao" r
      JOIN "HistoricoStatus" h ON h."reclamacaoId" = r.id AND h."statusNovo" = 'RESOLVIDO'
      WHERE r."dataAbertura" >= ${dataLimite} AND r."dataAbertura" <= ${dataFinal}
    `
  ]);

  const total = totais[0]?.total ?? 0;
  const resolvidas = totais[0]?.resolvidas ?? 0;
  const valorTotal = totais[0]?.valorTotal ?? 0;

  return NextResponse.json({
    porPeriodo,
    valorGastoPorPeriodo,
    porMotivo: porMotivo.map((r: PorCategoriaRow) => ({ categoria: r.categoria ?? "Não informado", quantidade: r.quantidade })),
    porLoja: porLoja.map((r: PorCategoriaRow) => ({ categoria: r.categoria ?? "Não informado", quantidade: r.quantidade })),
    porCanal: porCanal.map((r: PorCategoriaRow) => ({ categoria: r.categoria ?? "Não informado", quantidade: r.quantidade })),
    porStatus: porStatus.map((r: PorCategoriaRow) => ({ categoria: r.categoria ?? "Não informado", quantidade: r.quantidade })),
    kpis: {
      totalReclamacoes: total,
      totalResolvidas: resolvidas,
      percentualResolvidas: total > 0 ? (resolvidas / total) * 100 : 0,
      valorTotalGasto: valorTotal,
      custoMedioPorReclamacao: total > 0 ? valorTotal / total : 0,
      tempoMedioResolucaoDias: tempoResolucao[0]?.dias ?? null
    }
  });
}
