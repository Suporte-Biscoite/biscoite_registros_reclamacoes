import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarReclamacaoSchema } from "@/lib/validation";

export async function GET() {
  const reclamacoes = await prisma.reclamacao.findMany({
    orderBy: { dataAbertura: "desc" }
  });
  return NextResponse.json({ reclamacoes });
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
