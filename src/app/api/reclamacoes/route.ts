import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { criarReclamacaoSchema } from "@/lib/validation";

function montarWhere(searchParams: URLSearchParams): Prisma.ReclamacaoWhereInput {
  const busca = searchParams.get("busca")?.trim();
  const canalVenda = searchParams.get("canalVenda") || undefined;
  const loja = searchParams.get("loja") || undefined;
  const motivo = searchParams.get("motivo") || undefined;
  const submotivo = searchParams.get("submotivo") || undefined;
  const resolucaoAplicada = searchParams.get("resolucaoAplicada") || undefined;

  const where: Prisma.ReclamacaoWhereInput = {};
  if (canalVenda) where.canalVenda = canalVenda;
  if (loja) where.lojaOuCd = loja;
  if (motivo) where.motivo = motivo;
  if (submotivo) where.submotivo = submotivo;
  if (resolucaoAplicada) where.resolucaoAplicada = resolucaoAplicada;

  if (busca) {
    const condicoesOr: Prisma.ReclamacaoWhereInput[] = [
      { nomeCliente: { contains: busca, mode: "insensitive" } }
    ];

    // Se a busca tiver dígitos (ex: "17", "000017" ou "protocolo 17"),
    // também tenta bater com o número do protocolo.
    const digitos = busca.replace(/\D/g, "");
    if (digitos.length > 0) {
      const numeroProtocolo = Number(digitos);
      if (Number.isFinite(numeroProtocolo)) {
        condicoesOr.push({ numeroProtocolo });
      }
    }

    where.OR = condicoesOr;
  }

  return where;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageParam = searchParams.get("page");
  const where = montarWhere(searchParams);

  // Sem "page": mantém o comportamento original (usado pelo board Kanban,
  // que precisa de todas as reclamações de uma vez para montar as colunas).
  if (!pageParam) {
    const reclamacoes = await prisma.reclamacao.findMany({
      where,
      orderBy: { dataAbertura: "desc" }
    });
    return NextResponse.json({ reclamacoes });
  }

  // Com "page": retorna uma página só, para a tabela com paginação.
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize")) || 10));

  const [reclamacoes, total] = await Promise.all([
    prisma.reclamacao.findMany({
      where,
      orderBy: { dataAbertura: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.reclamacao.count({ where })
  ]);

  return NextResponse.json({ reclamacoes, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = criarReclamacaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const reclamacao = await prisma.reclamacao.create({
    data: {
      numeroPedido: data.numeroPedido ?? null,
      idPedidoNexaas: data.idPedidoNexaas ?? null,
      canalVenda: data.canalVenda,
      lojaOuCd: data.lojaOuCd,
      dataPedido: data.dataPedido ? new Date(data.dataPedido) : null,
      valorPedido: data.valorPedido ?? null,
      pedidoLocalizado: data.pedidoLocalizado ?? false,
      nomeCliente: data.nomeCliente,
      cpf: data.cpf ?? null,
      telefone: data.telefone ?? null,
      email: data.email ?? null,
      motivo: data.motivo,
      submotivo: data.submotivo,
      descricao: data.descricao,
      resolucaoAplicada: data.resolucaoAplicada ?? null,
      valorGastoResolucao: data.valorGastoResolucao ?? null,
      responsavel: data.responsavel ?? null,
      pedidoSnapshot: data.pedidoSnapshot ?? undefined,
      historico: {
        create: {
          statusAnterior: null,
          statusNovo: "ABERTO"
        }
      }
    }
  });

  return NextResponse.json({ reclamacao }, { status: 201 });
}
