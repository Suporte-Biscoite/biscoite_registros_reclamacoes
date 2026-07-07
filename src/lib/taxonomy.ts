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
  "Infraestrutura": [
    "Estrutura física da loja",
    "Limpeza/higiene",
    "Equipamento com defeito",
    "Outros problemas de infraestrutura"
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

// O valor de canal de venda que vem do Nexaas (ex: "BISCOITE E-COMMERCE",
// "SHOPEE", nome de uma loja física) é texto livre e não bate exatamente com
// as opções fixas do dropdown. Essa função tenta mapear para a opção mais
// próxima; se não achar nenhuma correspondência, retorna null e o valor bruto
// fica disponível para o atendente escolher manualmente.
export function mapCanalVendaNexaas(valorNexaas: string | null | undefined): string | null {
  if (!valorNexaas) return null;
  const normalizado = valorNexaas.toUpperCase();

  if (normalizado.includes("SHOPEE")) return "Shopee";
  if (normalizado.includes("MERCADO LIVRE") || normalizado.includes("MERCADOLIVRE")) return "Mercado Livre";
  if (normalizado.includes("ITAU") || normalizado.includes("ITAÚ")) return "Itaú (co-branded)";
  if (normalizado.includes("HOUSE OF GAMERS") || normalizado.includes("HOUSE_OF_GAMERS")) return "House of Gamers";
  if (normalizado.includes("FOOD TO SAVE")) return "Food to Save";
  if (normalizado.includes("E-COMMERCE") || normalizado.includes("ECOMMERCE")) return "E-commerce (site)";
  if (normalizado.includes("FRANQUIA")) return "Loja física - franquia";
  // Nomes de organização de loja física própria costumam ser o nome da loja em si
  // (ex: "BISCOITE MOOCA"), sem um marcador claro — tratamos como loja própria por padrão.
  return null;
}
