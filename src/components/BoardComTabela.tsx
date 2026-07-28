"use client";

import { useState } from "react";
import { Board } from "@/components/Board";
import { ComplaintTable } from "@/components/ComplaintTable";
import { BoardFiltros, FILTROS_VAZIOS, type FiltrosReclamacao } from "@/components/BoardFiltros";

export function BoardComTabela() {
  const [filtros, setFiltros] = useState<FiltrosReclamacao>(FILTROS_VAZIOS);

  return (
    <div className="space-y-6">
      <BoardFiltros filtros={filtros} onChange={setFiltros} />
      <Board filtros={filtros} />
      <ComplaintTable filtros={filtros} />
    </div>
  );
}
