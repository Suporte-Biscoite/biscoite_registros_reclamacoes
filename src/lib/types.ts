export type StatusReclamacao =
  | "ABERTO"
  | "EM_ANALISE"
  | "AGUARDANDO_CLIENTE"
  | "AGUARDANDO_LOJA_CD"
  | "RESOLVIDO"
  | "CANCELADO";

export interface Reclamacao {
  id: string;
  numeroPedido: string | null;
  idPedidoNexaas: string | null;
  canalVenda: string;
  lojaOuCd: string;
  dataPedido: string | null;
  valorPedido: string | number | null;
  pedidoLocalizado: boolean;
  nomeCliente: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  motivo: string;
  submotivo: string;
  descricao: string;
  resolucaoAplicada: string | null;
  valorGastoResolucao: string | number | null;
  status: StatusReclamacao;
  responsavel: string | null;
  dataAbertura: string;
  criadoEm: string;
  atualizadoEm: string;
}
