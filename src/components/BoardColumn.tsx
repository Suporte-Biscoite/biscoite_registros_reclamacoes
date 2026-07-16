"use client";

import { useDroppable } from "@dnd-kit/core";
import { ComplaintCard } from "@/components/ComplaintCard";
import type { Reclamacao, StatusReclamacao } from "@/lib/types";

interface BoardColumnProps {
  status: StatusReclamacao;
  label: string;
  reclamacoes: Reclamacao[];
  onExcluir: (id: string) => void;
}

export function BoardColumn({ status, label, reclamacoes, onExcluir }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-card border border-base-200 bg-base-100/60 min-w-0 ${
        isOver ? "ring-2 ring-caramel-400" : ""
      }`}
    >
      <div className="ticket-edge px-2.5 py-2 bg-white rounded-t-card">
        <p className="text-xs font-medium text-base-900 truncate">{label}</p>
        <p className="text-[11px] text-base-800">{reclamacoes.length} caso(s)</p>
      </div>
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[65vh]">
        {reclamacoes.map((r) => (
          <ComplaintCard key={r.id} reclamacao={r} onExcluir={onExcluir} />
        ))}
        {reclamacoes.length === 0 && (
          <p className="text-[11px] text-base-800 text-center py-6 px-1">
            Nenhum caso nesta coluna.
          </p>
        )}
      </div>
    </div>
  );
}
