"use client";

import { useDroppable } from "@dnd-kit/core";
import { ComplaintCard } from "@/components/ComplaintCard";
import type { Reclamacao, StatusReclamacao } from "@/lib/types";

interface BoardColumnProps {
  status: StatusReclamacao;
  label: string;
  reclamacoes: Reclamacao[];
}

export function BoardColumn({ status, label, reclamacoes }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-card border border-base-200 bg-base-100/60 min-w-[260px] w-[260px] shrink-0 ${
        isOver ? "ring-2 ring-caramel-400" : ""
      }`}
    >
      <div className="ticket-edge px-3 py-2.5 bg-white rounded-t-card">
        <p className="text-sm font-medium text-base-900">{label}</p>
        <p className="text-xs text-base-800">{reclamacoes.length} caso(s)</p>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        {reclamacoes.map((r) => (
          <ComplaintCard key={r.id} reclamacao={r} />
        ))}
        {reclamacoes.length === 0 && (
          <p className="text-xs text-base-800 text-center py-6">
            Nenhum caso nesta coluna.
          </p>
        )}
      </div>
    </div>
  );
}
