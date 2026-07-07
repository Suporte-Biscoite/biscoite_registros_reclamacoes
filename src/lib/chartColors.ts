export const CHART_COLORS = [
  "#5B84A3", // azul Biscoitê (principal)
  "#4A6178", // slate2
  "#4F7942", // sage
  "#B33A3A", // brick
  "#8B6F47", // marrom terroso
  "#86AFC7", // azul pastel claro
  "#A3714F", // canela
  "#5F7A5F" // verde musgo
];

export function corPorIndice(indice: number): string {
  return CHART_COLORS[indice % CHART_COLORS.length];
}
