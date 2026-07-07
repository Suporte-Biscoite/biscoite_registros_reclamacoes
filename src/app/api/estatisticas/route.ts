import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

interface FiltrosComuns {
  dataLimite: Date;
  dataFinal: Date;
  canalVenda?: string;
  loja?: string;
  motivo?: string;
  submotivo?: string;
  resolucaoAplicada?: string;
}

// Monta a cláusula WHERE combinando o período com os filtros opcionais.
// `prefixo` é usado quando a tabela tem um alias na query (ex: "r." no JOIN
// de tempo de resolução) — é um valor fixo do próprio código, nunca vindo do
// usuário, então é seguro usar Prisma.raw nele.
function montarCondicoes(prefixo: "" | "r.", filtros: FiltrosComuns): Prisma.Sql {
  const coluna = (nome: string) => Prisma.raw(`${prefixo}"${nome}"`);

  const partes: Prisma.Sql[] = [
    Prisma.sql`${coluna("dataAbertura")} >= ${filtros.dataLimite}`,
    Prisma.sql`${coluna("dataAbertura")} <= ${filtros.dataFinal}`
  ];

  if (filtros.canalVenda) {
    partes.push(Prisma.sql`${coluna("canalVenda")} = ${filtros.canalVenda}`);
  }
  if (filtros.loja) {
    partes.push(Prisma.sql`${coluna("lojaOuCd")} = ${filtros.loja}`);
  }
  if (filtros.motivo) {
    partes.push(Prisma.sql`${coluna("motivo")} = ${filtros.motivo}`);
  }
  if (filtros.submotivo) {
    partes.push(Prisma.sql`${coluna("submotivo")} = ${filtros.submotivo}`);
  }
  if (filtros.resolucaoAplicada) {
    partes.push(Prisma.sql`${coluna("resolucaoAplicada")} = ${filtros.resolucaoAplicada}`);
  }

  return Prisma.join(partes, " AND ");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const dataInicioParam = searchParams.get("dataInicio");
  const dataFimParam = searchParams.get("dataFim");

  let dataLimite: Date;
  let dataFinal: Date;

  if (dataInicioParam && dataFimParam) {
    dataLimite = new Date(`${dataInicioParam}T00:00:00`);
    dataFinal = new Date(`${dataFimParam}T23:59:59`);
  } else {
    const meses = Number(searchParams.get("meses") ?? "6");
    const mesesValido = Number.isFinite(meses) && meses > 0 ? meses : 6;
    dataFinal = new Date();
    dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - mesesValido);
  }

  const filtros: FiltrosComuns = {
    dataLimite,
    dataFinal,
    canalVenda: searchParams.get("canalVenda") || undefined,
    loja: searchParams.get("loja") || undefined,
    motivo: searchParams.get("motivo") || undefined,
    submotivo: searchParams.get("submotivo") || undefined,
    resolucaoAplicada: searchParams.get("resolucaoAplicada") || undefined
  };

  const cond = montarCondicoes("", filtros);
  const condComAlias = montarCondicoes("r.", filtros);

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
      WHERE ${cond}
      GROUP BY periodo
      ORDER BY periodo ASC
    `,
    prisma.$queryRaw<ValorPorPeriodoRow[]>`
      SELECT to_char(date_trunc('month', "dataAbertura"), 'YYYY-MM') AS periodo,
             COALESCE(SUM("valorGastoResolucao"), 0)::float AS valor
      FROM "Reclamacao"
      WHERE ${cond}
      GROUP BY periodo
      ORDER BY periodo ASC
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT motivo AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE ${cond}
      GROUP BY motivo
      ORDER BY quantidade DESC
      LIMIT 8
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT "lojaOuCd" AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE ${cond}
      GROUP BY "lojaOuCd"
      ORDER BY quantidade DESC
      LIMIT 8
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT "canalVenda" AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE ${cond}
      GROUP BY "canalVenda"
      ORDER BY quantidade DESC
      LIMIT 8
    `,
    prisma.$queryRaw<PorCategoriaRow[]>`
      SELECT status AS categoria, COUNT(*)::int AS quantidade
      FROM "Reclamacao"
      WHERE ${cond}
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
      WHERE ${cond}
    `,
    prisma.$queryRaw<{ dias: number | null }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (h."dataHora" - r."dataAbertura")) / 86400)::float AS dias
      FROM "Reclamacao" r
      JOIN "HistoricoStatus" h ON h."reclamacaoId" = r.id AND h."statusNovo" = 'RESOLVIDO'
      WHERE ${condComAlias}
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
      tempoMedioResolucaoDias: tempoResolucao[0]?.dias ?? null
    }
  });
}
