"use client";

import { useEffect, useState } from "react";

export interface FiltrosReclamacao {
  busca: string;
  canalVenda: string;
  loja: string;
  motivo: string;
  submotivo: string;
  resolucaoAplicada: string;
}

export const FILTROS_VAZIOS: FiltrosReclamacao = {
  busca: "",
  canalVenda: "",
  loja: "",
  motivo: "",
  submotivo: "",
  resolucaoAplicada: ""
};

interface OpcoesFiltro {
  canais: string[];
  lojas: string[];
  motivos: string[];
  submotivos: string[];
  resolucoes: string[];
}

export function filtrosParaQueryString(filtros: FiltrosReclamacao): string {
  const params = new URLSearchParams();
  if (filtros.busca) params.set("busca", filtros.busca);
  if (filtros.canalVenda) params.set("canalVenda", filtros.canalVenda);
  if (filtros.loja) params.set("loja", filtros.loja);
  if (filtros.motivo) params.set("motivo", filtros.motivo);
  if (filtros.submotivo) params.set("submotivo", filtros.submotivo);
  if (filtros.resolucaoAplicada) params.set("resolucaoAplicada", filtros.resolucaoAplicada);
  return params.toString();
}

export function BoardFiltros({
  filtros,
  onChange
}: {
  filtros: FiltrosReclamacao;
  onChange: (filtros: FiltrosReclamacao) => void;
}) {
  const [opcoes, setOpcoes] = useState<OpcoesFiltro | null>(null);

  useEffect(() => {
    async function carregarOpcoes() {
      try {
        const res = await fetch("/api/filtros");
        const data = await res.json();
        if (res.ok) setOpcoes(data);
      } catch {
        // Se falhar, os dropdowns ficam vazios — a busca por texto continua
        // funcionando normalmente.
      }
    }
    carregarOpcoes();
  }, []);

  function handleCampo<K extends keyof FiltrosReclamacao>(campo: K, valor: string) {
    onChange({ ...filtros, [campo]: valor });
  }

  const filtrosAtivos = Object.values(filtros).some((v) => v !== "");

  return (
    <div className="bg-white border border-base-200 rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-base-800">Buscar e filtrar</p>
        {filtrosAtivos && (
          <button
            onClick={() => onChange(FILTROS_VAZIOS)}
            className="focus-ring text-xs text-slate2-600 underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="block text-xs text-base-800 mb-1">Nome ou protocolo</span>
          <input
            type="text"
            value={filtros.busca}
            onChange={(e) => handleCampo("busca", e.target.value)}
            placeholder="ex: Maria ou 000017"
            className="focus-ring w-full rounded-md border border-base-300 px-2 py-1.5 text-sm bg-white"
          />
        </label>
        <FiltroSelect
          label="Canal de venda"
          value={filtros.canalVenda}
          opcoes={opcoes?.canais ?? []}
          onChange={(v) => handleCampo("canalVenda", v)}
        />
        <FiltroSelect
          label="Loja"
          value={filtros.loja}
          opcoes={opcoes?.lojas ?? []}
          onChange={(v) => handleCampo("loja", v)}
        />
        <FiltroSelect
          label="Motivo"
          value={filtros.motivo}
          opcoes={opcoes?.motivos ?? []}
          onChange={(v) => handleCampo("motivo", v)}
        />
        <FiltroSelect
          label="Submotivo"
          value={filtros.submotivo}
          opcoes={opcoes?.submotivos ?? []}
          onChange={(v) => handleCampo("submotivo", v)}
        />
        <FiltroSelect
          label="Resolução aplicada"
          value={filtros.resolucaoAplicada}
          opcoes={opcoes?.resolucoes ?? []}
          onChange={(v) => handleCampo("resolucaoAplicada", v)}
        />
      </div>
    </div>
  );
}

function FiltroSelect({
  label,
  value,
  opcoes,
  onChange
}: {
  label: string;
  value: string;
  opcoes: string[];
  onChange: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-base-800 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full rounded-md border border-base-300 px-2 py-1.5 text-sm bg-white"
      >
        <option value="">Todos</option>
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
