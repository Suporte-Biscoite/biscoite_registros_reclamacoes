"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import type { Reclamacao } from "@/lib/types";
import { formatarProtocolo } from "@/lib/format";

function diasEmAberto(dataAbertura: string): number {
  const inicio = new Date(dataAbertura).getTime();
  const agora = Date.now();
  return Math.max(0, Math.floor((agora - inicio) / (1000 * 60 * 60 * 24)));
}

export function ComplaintCard({ reclamacao }: { reclamacao: Reclamacao }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: reclamacao.id
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
      }
    : undefined;

  const dias = diasEmAberto(reclamacao.dataAbertura);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`focus-ring rounded-md border border-base-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-base-900 leading-snug">
          {reclamacao.nomeCliente}
        </p>
        <span
          className={`shrink-0 text-[11px] px-1.5 py-0.5 rounded ${
            dias > 5 ? "bg-brick-100 text-brick-600" : "bg-base-100 text-base-800"
          }`}
        >
          {dias}d
        </span>
      </div>
      <p className="text-[11px] font-mono text-base-800 mt-0.5">
        Protocolo Nº {formatarProtocolo(reclamacao.numeroProtocolo)}
      </p>
      <p className="text-xs text-base-800 mt-1">
        {reclamacao.motivo} · {reclamacao.submotivo}
      </p>
      <p className="text-xs text-base-800 mt-0.5">
        {reclamacao.lojaOuCd}
        {reclamacao.numeroPedido && (
          <span className="font-mono"> · #{reclamacao.numeroPedido}</span>
        )}
      </p>
      <Link
        href={`/reclamacao/${reclamacao.id}`}
        onPointerDown={(e) => e.stopPropagation()}
        className="focus-ring inline-block mt-2 text-xs text-caramel-500 hover:text-caramel-600 underline"
      >
        Ver detalhes
      </Link>
    </div>
  );
}
