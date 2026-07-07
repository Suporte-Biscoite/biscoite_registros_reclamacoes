"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { STATUS_LABELS, RESOLUCOES, CANAIS_VENDA, TAXONOMIA, MOTIVOS } from "@/lib/taxonomy";
import { formatarProtocolo } from "@/lib/format";
import { AnexosPanel } from "@/components/AnexosPanel";
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

  async function handleExcluirReclamacao() {
    if (!reclamacao) return;
    const confirmado = confirm(
      `Excluir a reclamação Nº ${formatarProtocolo(reclamacao.numeroProtocolo)} (${reclamacao.nomeCliente})? Essa ação não pode ser desfeita e remove também os anexos.`
    );
    if (!confirmado) return;

    try {
      const res = await fetch(`/api/reclamacoes/${reclamacao.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/board");
        router.refresh();
      } else {
        alert("Não foi possível excluir a reclamação.");
      }
    } catch {
      alert("Erro de conexão ao excluir a reclamação.");
    }
  }

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
                  <p className="text-xs font-mono text-base-800 mb-0.5">
                    Protocolo Nº {formatarProtocolo(reclamacao.numeroProtocolo)}
                  </p>
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
            </div>

            <PainelDadosReclamacao
              reclamacao={reclamacao}
              onAtualizado={(atualizado) => setReclamacao(atualizado)}
            />

            {reclamacao.pedidoSnapshot && reclamacao.pedidoSnapshot.itens?.length > 0 && (
              <div className="bg-white border border-base-200 rounded-card p-6">
                <p className="text-sm font-medium text-base-800 mb-1">
                  Itens do pedido no momento da reclamação
                </p>
                <p className="text-xs text-base-800 mb-3">
                  Este é um retrato de como o pedido estava quando a reclamação foi
                  registrada — não reflete mudanças feitas depois no Nexaas.
                </p>
                <ul className="space-y-1">
                  {reclamacao.pedidoSnapshot.itens.map((item, idx) => (
                    <li key={idx} className="text-sm text-base-900 flex justify-between gap-2">
                      <span>
                        {item.quantidade}× {item.nome}
                      </span>
                      {item.valorUnitario != null && (
                        <span className="text-base-800 font-mono shrink-0">
                          R$ {(item.valorUnitario * item.quantidade).toFixed(2)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 pt-2 border-t border-base-200 space-y-0.5">
                  <p className="text-sm font-medium text-base-900 flex justify-between">
                    <span>Total dos itens</span>
                    <span className="font-mono">
                      R${" "}
                      {reclamacao.pedidoSnapshot.itens
                        .reduce(
                          (soma, item) => soma + (item.valorUnitario ?? 0) * item.quantidade,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </p>
                  {reclamacao.pedidoSnapshot.desconto != null &&
                    reclamacao.pedidoSnapshot.desconto > 0 && (
                      <p className="text-xs text-base-800 flex justify-between">
                        <span>Desconto</span>
                        <span className="font-mono">
                          - R$ {reclamacao.pedidoSnapshot.desconto.toFixed(2)}
                        </span>
                      </p>
                    )}
                  {reclamacao.pedidoSnapshot.frete != null && (
                    <p className="text-xs text-base-800 flex justify-between">
                      <span>Frete</span>
                      <span className="font-mono">
                        R$ {reclamacao.pedidoSnapshot.frete.toFixed(2)}
                      </span>
                    </p>
                  )}
                  {reclamacao.pedidoSnapshot.valorPedido != null && (
                    <p className="text-sm font-semibold text-base-900 flex justify-between border-t border-base-200 pt-1 mt-1">
                      <span>Total do pedido</span>
                      <span className="font-mono">
                        R$ {reclamacao.pedidoSnapshot.valorPedido.toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <PainelResolucaoCusto
              reclamacao={reclamacao}
              onAtualizado={(atualizado) => setReclamacao(atualizado)}
            />

            <AnexosPanel
              reclamacaoId={reclamacao.id}
              anexosIniciais={reclamacao.anexos ?? []}
            />

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

            <div className="bg-white border border-brick-100 rounded-card p-6">
              <p className="text-sm font-medium text-brick-600 mb-1">Zona de risco</p>
              <p className="text-xs text-base-800 mb-3">
                Excluir remove permanentemente esta reclamação, seu histórico e seus
                anexos. Essa ação não pode ser desfeita.
              </p>
              <button
                onClick={handleExcluirReclamacao}
                className="focus-ring rounded-md border border-brick-500 text-brick-500 text-sm font-medium px-4 py-2 hover:bg-brick-100 transition-colors"
              >
                Excluir reclamação
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PainelDadosReclamacao({
  reclamacao,
  onAtualizado
}: {
  reclamacao: Reclamacao;
  onAtualizado: (reclamacao: Reclamacao) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [dados, setDados] = useState({
    canalVenda: reclamacao.canalVenda,
    lojaOuCd: reclamacao.lojaOuCd,
    numeroPedido: reclamacao.numeroPedido ?? "",
    valorPedido: reclamacao.valorPedido != null ? String(reclamacao.valorPedido) : "",
    nomeCliente: reclamacao.nomeCliente,
    cpf: reclamacao.cpf ?? "",
    telefone: reclamacao.telefone ?? "",
    email: reclamacao.email ?? "",
    motivo: reclamacao.motivo,
    submotivo: reclamacao.submotivo,
    descricao: reclamacao.descricao
  });

  const submotivos = useMemo(
    () => TAXONOMIA[dados.motivo] ?? [],
    [dados.motivo]
  );

  function iniciarEdicao() {
    setDados({
      canalVenda: reclamacao.canalVenda,
      lojaOuCd: reclamacao.lojaOuCd,
      numeroPedido: reclamacao.numeroPedido ?? "",
      valorPedido: reclamacao.valorPedido != null ? String(reclamacao.valorPedido) : "",
      nomeCliente: reclamacao.nomeCliente,
      cpf: reclamacao.cpf ?? "",
      telefone: reclamacao.telefone ?? "",
      email: reclamacao.email ?? "",
      motivo: reclamacao.motivo,
      submotivo: reclamacao.submotivo,
      descricao: reclamacao.descricao
    });
    setErro(null);
    setEditando(true);
  }

  function handleCampo<K extends keyof typeof dados>(campo: K, valor: (typeof dados)[K]) {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar() {
    if (!dados.cpf && !dados.telefone && !dados.email) {
      setErro("Informe ao menos um identificador de contato: CPF, telefone ou e-mail.");
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/reclamacoes/${reclamacao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canalVenda: dados.canalVenda,
          lojaOuCd: dados.lojaOuCd,
          numeroPedido: dados.numeroPedido || null,
          valorPedido: dados.valorPedido ? Number(dados.valorPedido) : null,
          nomeCliente: dados.nomeCliente,
          cpf: dados.cpf || null,
          telefone: dados.telefone || null,
          email: dados.email || null,
          motivo: dados.motivo,
          submotivo: dados.submotivo,
          descricao: dados.descricao
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível salvar.");
        return;
      }
      onAtualizado({ ...reclamacao, ...data.reclamacao });
      setEditando(false);
    } catch {
      setErro("Erro de conexão ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!editando) {
    return (
      <div className="bg-white border border-base-200 rounded-card p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-base-800">Dados da reclamação</p>
          <button
            onClick={iniciarEdicao}
            className="focus-ring text-xs text-caramel-500 hover:text-caramel-600 underline"
          >
            Editar
          </button>
        </div>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
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
          <Info label="Nome do cliente" value={reclamacao.nomeCliente} />
          <Info label="CPF" value={reclamacao.cpf ?? "—"} />
          <Info label="Telefone" value={reclamacao.telefone ?? "—"} />
          <Info label="E-mail" value={reclamacao.email ?? "—"} />
          <Info label="Motivo" value={reclamacao.motivo} />
          <Info label="Submotivo" value={reclamacao.submotivo} />
          <Info
            label="Data de abertura"
            value={new Date(reclamacao.dataAbertura).toLocaleString("pt-BR")}
          />
        </dl>
        <div className="mt-5">
          <p className="text-sm font-medium text-base-800 mb-1">Descrição</p>
          <p className="text-sm text-base-900 whitespace-pre-wrap">{reclamacao.descricao}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-base-200 rounded-card p-6">
      <p className="text-sm font-medium text-base-800 mb-3">Editar dados da reclamação</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Canal de venda</span>
          <select
            value={dados.canalVenda}
            onChange={(e) => handleCampo("canalVenda", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          >
            {CANAIS_VENDA.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Loja ou CD</span>
          <input
            type="text"
            value={dados.lojaOuCd}
            onChange={(e) => handleCampo("lojaOuCd", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Número do pedido</span>
          <input
            type="text"
            value={dados.numeroPedido}
            onChange={(e) => handleCampo("numeroPedido", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm font-mono"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">
            Valor do pedido (R$)
          </span>
          <input
            type="number"
            step="0.01"
            value={dados.valorPedido}
            onChange={(e) => handleCampo("valorPedido", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Nome do cliente</span>
          <input
            type="text"
            value={dados.nomeCliente}
            onChange={(e) => handleCampo("nomeCliente", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">CPF</span>
          <input
            type="text"
            value={dados.cpf}
            onChange={(e) => handleCampo("cpf", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Telefone</span>
          <input
            type="text"
            value={dados.telefone}
            onChange={(e) => handleCampo("telefone", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">E-mail</span>
          <input
            type="email"
            value={dados.email}
            onChange={(e) => handleCampo("email", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Motivo</span>
          <select
            value={dados.motivo}
            onChange={(e) => {
              handleCampo("motivo", e.target.value);
              handleCampo("submotivo", "");
            }}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          >
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Submotivo</span>
          <select
            value={dados.submotivo}
            onChange={(e) => handleCampo("submotivo", e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione</option>
            {submotivos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block mt-4">
        <span className="block text-sm font-medium text-base-800 mb-1">Descrição</span>
        <textarea
          rows={3}
          value={dados.descricao}
          onChange={(e) => handleCampo("descricao", e.target.value)}
          className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
        />
      </label>

      {erro && (
        <p className="text-sm text-brick-500 mt-3" role="alert">
          {erro}
        </p>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setEditando(false)}
          disabled={salvando}
          className="focus-ring rounded-md border border-base-300 text-base-800 text-sm font-medium px-4 py-2 hover:bg-base-100 transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="focus-ring rounded-md bg-caramel-500 text-white text-sm font-medium px-5 py-2 hover:bg-caramel-600 transition-colors disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
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

function PainelResolucaoCusto({
  reclamacao,
  onAtualizado
}: {
  reclamacao: Reclamacao;
  onAtualizado: (reclamacao: Reclamacao) => void;
}) {
  const [resolucaoAplicada, setResolucaoAplicada] = useState(reclamacao.resolucaoAplicada ?? "");
  const [valorGastoResolucao, setValorGastoResolucao] = useState(
    reclamacao.valorGastoResolucao != null ? String(reclamacao.valorGastoResolucao) : ""
  );
  const [responsavel, setResponsavel] = useState(reclamacao.responsavel ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const res = await fetch(`/api/reclamacoes/${reclamacao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolucaoAplicada: resolucaoAplicada || null,
          valorGastoResolucao: valorGastoResolucao ? Number(valorGastoResolucao) : null,
          responsavel: responsavel || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível salvar.");
        return;
      }
      onAtualizado({ ...reclamacao, ...data.reclamacao });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2500);
    } catch {
      setErro("Erro de conexão ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="bg-white border border-base-200 rounded-card p-6">
      <p className="text-sm font-medium text-base-800 mb-3">Resolução e custo</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">
            Resolução aplicada
          </span>
          <select
            value={resolucaoAplicada}
            onChange={(e) => setResolucaoAplicada(e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          >
            <option value="">Ainda não definida</option>
            {RESOLUCOES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">
            Valor total gasto com resolução (R$)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valorGastoResolucao}
            onChange={(e) => setValorGastoResolucao(e.target.value)}
            placeholder="0,00"
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-base-800 mb-1">Responsável</span>
          <input
            type="text"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {erro && (
        <p className="text-sm text-brick-500 mt-3" role="alert">
          {erro}
        </p>
      )}
      {sucesso && <p className="text-sm text-sage-600 mt-3">Salvo com sucesso.</p>}

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="focus-ring rounded-md bg-caramel-500 text-white text-sm font-medium px-5 py-2 hover:bg-caramel-600 transition-colors disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
