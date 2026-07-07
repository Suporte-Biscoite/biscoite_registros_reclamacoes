export const TAXONOMIA: Record<string, string[]> = {
  "Entrega": [
    "Atraso na entrega",
    "Extravio",
    "Não localizada (destinatário ausente)",
    "Endereço incorreto"
  ],
  "Produto": [
    "Danificado",
    "Defeito de fábrica",
    "Próximo ao vencimento",
    "Item incorreto (trocado)"
  ],
  "Pedido incompleto": [
    "Faltou item",
    "Faltou brinde ou embalagem"
  ],
  "Financeiro": [
    "Cobrado a mais",
    "Reembolso de frete",
    "Cancelamento a pedido do cliente"
  ],
  "Atendimento": [
    "Atendimento em loja",
    "Atendimento via SAC"
  ],
  "Grave": [
    "Contaminação",
    "Objeto estranho no produto",
    "Reclamação formal (Procon, etc.)"
  ],
  "Outros": [
    "Não classificável nas categorias acima"
  ]
};

export const MOTIVOS = Object.keys(TAXONOMIA);

export const CANAIS_VENDA = [
  "E-commerce (site)",
  "Loja física - própria",
  "Loja física - franquia",
  "Shopee",
  "Mercado Livre",
  "Itaú (co-branded)",
  "House of Gamers",
  "Food to Save"
];

export const RESOLUCOES = [
  "Novo envio",
  "Troca",
  "Estorno total",
  "Estorno parcial",
  "Cancelamento",
  "Cupom",
  "Devolução",
  "N/A"
];

export const STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Em análise",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  AGUARDANDO_LOJA_CD: "Aguardando loja/CD",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado"
};

export const STATUS_ORDEM = [
  "ABERTO",
  "EM_ANALISE",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_LOJA_CD",
  "RESOLVIDO",
  "CANCELADO"
] as const;
