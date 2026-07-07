"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS } from "@/lib/taxonomy";
import { formatarProtocolo } from "@/lib/format";
import type { Reclamacao } from "@/lib/types";

const TAMANHO_PAGINA = 10;

export function ComplaintTable() {
  const router = useRouter();
  const [pagina, setPagina] = useState(1);
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const res = await fetch(
          `/api/reclamacoes?page=${pagina}&pageSize=${TAMANHO_PAGINA}`
        );
        const data = await res.json();
        if (!res.ok) {
          setErro("Não foi possível carregar a lista de reclamações.");
          return;
        }
        setReclamacoes(data.reclamacoes ?? []);
        setTotal(data.total ?? 0);
        setErro(null);
      } catch {
        setErro("Erro de conexão ao carregar a lista.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [pagina]);

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  return (
    <div className="bg-white border border-base-200 rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-base-200">
        <p className="text-sm font-medium text-base-800">
          Todas as reclamações {total > 0 && `(${total})`}
        </p>
      </div>

      {erro && <p className="text-sm text-brick-500 px-4 py-3">{erro}</p>}
      {carregando && <p className="text-sm text-base-800 px-4 py-3">Carregando...</p>}

      {!carregando && !erro && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-base-800 border-b border-base-200">
                  <th className="px-4 py-2 font-medium">Protocolo</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Motivo</th>
                  <th className="px-4 py-2 font-medium">Loja / Canal</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Abertura</th>
                  <th className="px-4 py-2 font-medium text-right">Valor gasto</th>
                </tr>
              </thead>
              <tbody>
                {reclamacoes.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/reclamacao/${r.id}`)}
                    className="border-b border-base-100 last:border-0 cursor-pointer hover:bg-base-50 transition-colors"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-base-800">
                      {formatarProtocolo(r.numeroProtocolo)}
                    </td>
                    <td className="px-4 py-2 text-base-900">{r.nomeCliente}</td>
                    <td className="px-4 py-2 text-base-800">
                      {r.motivo} · {r.submotivo}
                    </td>
                    <td className="px-4 py-2 text-base-800">{r.lojaOuCd}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-caramel-50 text-caramel-600 font-medium">
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-base-800">
                      {new Date(r.dataAbertura).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-base-800 text-right">
                      {r.valorGastoResolucao != null
                        ? `R$ ${Number(r.valorGastoResolucao).toFixed(2)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
                {reclamacoes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-base-800">
                      Nenhuma reclamação registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-base-200">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="focus-ring text-sm text-base-800 hover:text-base-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <p className="text-xs text-base-800">
                Página {pagina} de {totalPaginas}
              </p>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="focus-ring text-sm text-base-800 hover:text-base-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
