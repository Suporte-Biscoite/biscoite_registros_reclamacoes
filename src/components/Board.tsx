"use client";

import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { BoardColumn } from "@/components/BoardColumn";
import { STATUS_LABELS, STATUS_ORDEM } from "@/lib/taxonomy";
import type { Reclamacao, StatusReclamacao } from "@/lib/types";

export function Board() {
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
      const res = await fetch("/api/reclamacoes");
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
    carregar();
  }, []);

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
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
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
