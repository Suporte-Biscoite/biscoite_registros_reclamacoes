export function formatarProtocolo(numero: number): string {
  return String(numero).padStart(6, "0");
}

export function formatarDataHoraPedido(dataIso: string | null): string {
  if (!dataIso) return "Data não informada";
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return "Data não informada";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}