import { z } from "zod";

export const criarReclamacaoSchema = z.object({
  numeroPedido: z.string().optional().nullable(),
  idPedidoNexaas: z.string().optional().nullable(),
  canalVenda: z.string().min(1, "Canal de venda é obrigatório."),
  lojaOuCd: z.string().min(1, "Loja ou CD é obrigatório."),
  dataPedido: z.string().optional().nullable(),
  valorPedido: z.number().optional().nullable(),
  pedidoLocalizado: z.boolean().optional(),

  nomeCliente: z.string().min(1, "Nome do cliente é obrigatório."),
  cpf: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),

  motivo: z.string().min(1, "Motivo é obrigatório."),
  submotivo: z.string().min(1, "Submotivo é obrigatório."),
  descricao: z.string().min(1, "Descrição é obrigatória."),

  resolucaoAplicada: z.string().optional().nullable(),
  valorGastoResolucao: z.number().optional().nullable(),
  responsavel: z.string().optional().nullable()
}).refine(
  (data) => Boolean(data.cpf) || Boolean(data.telefone) || Boolean(data.email),
  {
    message: "Informe ao menos um identificador de contato: CPF, telefone ou e-mail.",
    path: ["cpf"]
  }
);

export type CriarReclamacaoInput = z.infer<typeof criarReclamacaoSchema>;
