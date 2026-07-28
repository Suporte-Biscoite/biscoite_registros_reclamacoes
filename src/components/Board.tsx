"use client";

import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { BoardColumn } from "@/components/BoardColumn";
import { STATUS_LABELS, STATUS_ORDEM } from "@/lib/taxonomy";
import { filtrosParaQueryString, type FiltrosReclamacao } from "@/components/BoardFiltros";
import type { Reclamacao, StatusReclamacao } from "@/lib/types";

export function Board({ filtros }: { filtros: FiltrosReclamacao }) {
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  async function carregar() {
    setCarregando(true);
    try {
      const query = filtrosParaQueryString(filtros);
      const res = await fetch(`/api/reclamacoes${query ? `?${query}` : ""}`);
      const data = await res.json();
      setReclamacoes(data.reclamacoes ?? []);
      setErro(null);
    } catch {
      setErro("Não foi possível carregar as reclamações.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // Pequeno debounce: evita disparar uma busca a cada tecla digitada no
    // campo de nome/protocolo.
    const timeout = setTimeout(() => {
      carregar();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const novoStatus = over.id as StatusReclamacao;
    const reclamacaoId = active.id as string;
    const atual = reclamacoes.find((r) => r.id === reclamacaoId);
    if (!atual || atual.status === novoStatus) return;

    setReclamacoes((prev) =>
      prev.map((r) => (r.id === reclamacaoId ? { ...r, status: novoStatus } : r))
    );

    try {
      const res = await fetch(`/api/reclamacoes/${reclamacaoId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) {
        throw new Error("Falha ao atualizar status");
      }
    } catch {
      setErro("Não foi possível salvar a mudança de status. Recarregando...");
      carregar();
    }
  }

  function handleExcluir(id: string) {
    setReclamacoes((prev) => prev.filter((r) => r.id !== id));
  }

  if (carregando) {
    return <p className="text-sm text-base-800">Carregando board...</p>;
  }

  return (
    <div>
      {erro && (
        <p className="mb-4 text-sm text-brick-500" role="alert">
          {erro}
        </p>
      )}
      {reclamacoes.length === 0 && (
        <p className="mb-4 text-sm text-base-800">
          Nenhuma reclamação encontrada com esses filtros.
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {STATUS_ORDEM.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              reclamacoes={reclamacoes.filter((r) => r.status === status)}
              onExcluir={handleExcluir}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
