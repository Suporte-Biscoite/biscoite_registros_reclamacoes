"use client";

import { useState } from "react";
import type { PedidoEncontrado, TipoBusca } from "@/lib/bigquery";
import { formatarDataHoraPedido } from "@/lib/format";

interface OrderSearchProps {
  onPedidoSelecionado: (pedido: PedidoEncontrado) => void;
  onBuscaManual: () => void;
}

export function OrderSearch({ onPedidoSelecionado, onBuscaManual }: OrderSearchProps) {
  const [tipo, setTipo] = useState<TipoBusca>("numero_pedido");
  const [valor, setValor] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultados, setResultados] = useState<PedidoEncontrado[]>([]);
  const [buscou, setBuscou] = useState(false);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!valor.trim()) return;

    setCarregando(true);
    setErro(null);
    setBuscou(false);
    try {
      const res = await fetch(
        `/api/pedidos/buscar?tipo=${tipo}&valor=${encodeURIComponent(valor.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível buscar o pedido.");
        setResultados([]);
      } else {
        setResultados(data.resultados ?? []);
      }
    } catch {
      setErro("Erro de conexão ao buscar o pedido.");
    } finally {
      setCarregando(false);
      setBuscou(true);
    }
  }

  return (
    <div className="border border-base-200 rounded-card p-4 bg-base-50">
      <p className="text-sm font-medium text-base-800 mb-3">
        Buscar pedido (número, telefone ou CPF)
      </p>
      <form onSubmit={handleBuscar} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-base-800 mb-1">Buscar por</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoBusca)}
            className="focus-ring rounded-md border border-base-300 px-2 py-2 text-sm bg-white"
          >
            <option value="numero_pedido">Número do pedido</option>
            <option value="telefone">Telefone</option>
            <option value="cpf">CPF</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-base-800 mb-1">Valor</label>
          <input
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={
              tipo === "numero_pedido"
                ? "ex: 1644800549455-01"
                : tipo === "telefone"
                ? "ex: (11) 99999-9999"
                : "ex: 123.456.789-00"
            }
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={carregando}
          className="focus-ring rounded-md bg-slate2-500 text-white text-sm font-medium px-4 py-2 hover:bg-slate2-600 transition-colors disabled:opacity-60"
        >
          {carregando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {erro && (
        <div className="mt-3 text-sm text-brick-500">
          <p>{erro}</p>
          <button
            type="button"
            onClick={onBuscaManual}
            className="focus-ring mt-1 underline text-brick-600"
          >
            Cadastrar dados manualmente
          </button>
        </div>
      )}

      {buscou && !erro && resultados.length === 0 && (
        <div className="mt-3 text-sm text-base-800">
          <p>Nenhum pedido encontrado com esse critério.</p>
          <button
            type="button"
            onClick={onBuscaManual}
            className="focus-ring mt-1 underline text-slate2-600"
          >
            Cadastrar dados manualmente
          </button>
        </div>
      )}

      {resultados.length > 0 && (
        <ul className="mt-3 space-y-2">
          {resultados.map((pedido) => (
            <li key={pedido.idPedidoNexaas}>
              <button
                type="button"
                onClick={() => onPedidoSelecionado(pedido)}
                className="focus-ring w-full text-left rounded-md border border-base-200 bg-white px-3 py-2 hover:border-caramel-400 transition-colors"
              >
                <p className="text-sm font-medium text-base-900">
                  {pedido.nomeCliente ?? "Cliente não identificado"}{" "}
                  <span className="font-mono text-xs text-base-800">
                    #{pedido.numeroPedido ?? pedido.idPedidoNexaas}
                  </span>
                </p>
                <p className="text-xs text-caramel-600 font-medium mt-0.5">
                  Feito em {formatarDataHoraPedido(pedido.dataPedido)}
                </p>
                <p className="text-xs text-base-800 mt-0.5">
                  {pedido.canalVenda ?? "—"} · {pedido.lojaOuCd ?? "—"} ·{" "}
                  {pedido.valorPedido != null
                    ? `R$ ${pedido.valorPedido.toFixed(2)}`
                    : "valor não informado"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}