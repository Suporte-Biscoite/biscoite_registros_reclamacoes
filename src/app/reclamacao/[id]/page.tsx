"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { STATUS_LABELS } from "@/lib/taxonomy";
import type { Reclamacao } from "@/lib/types";

interface HistoricoItem {
  id: string;
  statusAnterior: string | null;
  statusNovo: string;
  dataHora: string;
}

export default function DetalheReclamacaoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [reclamacao, setReclamacao] = useState<Reclamacao | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`/api/reclamacoes/${params.id}`);
        const data = await res.json();
        if (!res.ok) {
          setErro(data.error ?? "Reclamação não encontrada.");
          return;
        }
        setReclamacao(data.reclamacao);
        setHistorico(data.reclamacao.historico ?? []);
      } catch {
        setErro("Erro de conexão ao carregar a reclamação.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [params.id]);

  return (
    <div className="min-h-screen bg-base-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => router.push("/board")}
          className="focus-ring text-sm text-base-800 hover:text-base-900 mb-4 underline"
        >
          ← Voltar para o board
        </button>

        {carregando && <p className="text-sm text-base-800">Carregando...</p>}
        {erro && <p className="text-sm text-brick-500">{erro}</p>}

        {reclamacao && (
          <div className="space-y-6">
            <div className="bg-white border border-base-200 rounded-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl text-base-900">
                    {reclamacao.nomeCliente}
                  </h2>
                  <p className="text-sm text-base-800 mt-1">
                    {reclamacao.motivo} · {reclamacao.submotivo}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-caramel-50 text-caramel-600 font-medium">
                  {STATUS_LABELS[reclamacao.status]}
                </span>
              </div>

              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-5 text-sm">
                <Info label="Canal de venda" value={reclamacao.canalVenda} />
                <Info label="Loja / CD" value={reclamacao.lojaOuCd} />
                <Info label="Número do pedido" value={reclamacao.numeroPedido ?? "—"} mono />
                <Info
                  label="Valor do pedido"
                  value={
                    reclamacao.valorPedido != null
                      ? `R$ ${Number(reclamacao.valorPedido).toFixed(2)}`
                      : "—"
                  }
                />
                <Info label="CPF" value={reclamacao.cpf ?? "—"} />
                <Info label="Telefone" value={reclamacao.telefone ?? "—"} />
                <Info label="E-mail" value={reclamacao.email ?? "—"} />
                <Info
                  label="Data de abertura"
                  value={new Date(reclamacao.dataAbertura).toLocaleString("pt-BR")}
                />
                <Info
                  label="Resolução aplicada"
                  value={reclamacao.resolucaoAplicada ?? "Ainda não definida"}
                />
                <Info label="Responsável" value={reclamacao.responsavel ?? "—"} />
              </dl>

              <div className="mt-5">
                <p className="text-sm font-medium text-base-800 mb-1">Descrição</p>
                <p className="text-sm text-base-900 whitespace-pre-wrap">
                  {reclamacao.descricao}
                </p>
              </div>
            </div>

            <div className="bg-white border border-base-200 rounded-card p-6">
              <p className="text-sm font-medium text-base-800 mb-3">
                Histórico de status
              </p>
              <ol className="space-y-2">
                {historico.map((h) => (
                  <li key={h.id} className="text-sm flex items-center gap-2">
                    <span className="text-base-800">
                      {new Date(h.dataHora).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-base-900">
                      {h.statusAnterior
                        ? `${STATUS_LABELS[h.statusAnterior]} → ${STATUS_LABELS[h.statusNovo]}`
                        : `Aberto como ${STATUS_LABELS[h.statusNovo]}`}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-base-800">{label}</dt>
      <dd className={`text-base-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
