export type StatusReclamacao =
  | "ABERTO"
  | "EM_ANALISE"
  | "AGUARDANDO_CLIENTE"
  | "AGUARDANDO_LOJA_CD"
  | "RESOLVIDO"
  | "CANCELADO";

export interface Anexo {
  id: string;
  nomeArquivo: string;
  url: string;
  tipoArquivo: string | null;
  tamanho: number | null;
  criadoEm: string;
}

export interface Reclamacao {
  id: string;
  numeroProtocolo: number;
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
  anexos?: Anexo[];
}
