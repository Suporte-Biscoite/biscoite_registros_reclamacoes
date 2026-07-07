"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderSearch } from "@/components/OrderSearch";
import {
  CANAIS_VENDA,
  TAXONOMIA,
  MOTIVOS,
  RESOLUCOES,
  mapCanalVendaNexaas
} from "@/lib/taxonomy";
import type { PedidoEncontrado, ItemPedido } from "@/lib/bigquery";

interface FormState {
  numeroPedido: string;
  idPedidoNexaas: string;
  canalVenda: string;
  lojaOuCd: string;
  dataPedido: string;
  valorPedido: string;
  pedidoLocalizado: boolean;
  nomeCliente: string;
  cpf: string;
  telefone: string;
  email: string;
  motivo: string;
  submotivo: string;
  descricao: string;
  resolucaoAplicada: string;
  valorGastoResolucao: string;
  responsavel: string;
}

const ESTADO_INICIAL: FormState = {
  numeroPedido: "",
  idPedidoNexaas: "",
  canalVenda: "",
  lojaOuCd: "",
  dataPedido: "",
  valorPedido: "",
  pedidoLocalizado: false,
  nomeCliente: "",
  cpf: "",
  telefone: "",
  email: "",
  motivo: "",
  submotivo: "",
  descricao: "",
  resolucaoAplicada: "",
  valorGastoResolucao: "",
  responsavel: ""
};

export function ComplaintForm() {
  const router = useRouter();
  const [modo, setModo] = useState<"com_pedido" | "sem_pedido">("com_pedido");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [canalVendaOriginal, setCanalVendaOriginal] = useState<string | null>(null);
  const [numeroPedidoEhIdNexaas, setNumeroPedidoEhIdNexaas] = useState(false);
  const [pedidoSnapshot, setPedidoSnapshot] = useState<PedidoEncontrado | null>(null);
  const [lojasDisponiveis, setLojasDisponiveis] = useState<string[]>([]);
  const [lojasFonteLocal, setLojasFonteLocal] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [mensagemBuscaCliente, setMensagemBuscaCliente] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  useEffect(() => {
    async function carregarLojas() {
      try {
        const res = await fetch("/api/lojas");
        const data = await res.json();
        if (res.ok) {
          setLojasDisponiveis(data.lojas ?? []);
          setLojasFonteLocal(data.fonte === "local");
        }
      } catch {
        // Se a lista de lojas falhar, o campo de "sem pedido" cai para texto
        // livre — não trava o cadastro.
      }
    }
    carregarLojas();
  }, []);

  const submotivos = useMemo(
    () => (form.motivo ? TAXONOMIA[form.motivo] ?? [] : []),
    [form.motivo]
  );

  function preencherComPedido(pedido: PedidoEncontrado) {
    const canalMapeado = mapCanalVendaNexaas(pedido.canalVenda);
    setForm((prev) => ({
      ...prev,
      numeroPedido: pedido.numeroPedido ?? pedido.idPedidoNexaas ?? "",
      idPedidoNexaas: pedido.idPedidoNexaas ?? "",
      dataPedido: pedido.dataPedido ? pedido.dataPedido.substring(0, 10) : "",
      valorPedido: pedido.valorPedido != null ? String(pedido.valorPedido) : "",
      pedidoLocalizado: true,
      nomeCliente: pedido.nomeCliente ?? "",
      cpf: pedido.cpf ?? "",
      telefone: pedido.telefone ?? "",
      email: pedido.email ?? "",
      canalVenda: canalMapeado ?? prev.canalVenda,
      lojaOuCd: pedido.lojaOuCd ?? prev.lojaOuCd
    }));
    setCanalVendaOriginal(canalMapeado ? null : pedido.canalVenda);
    setNumeroPedidoEhIdNexaas(!pedido.numeroPedido && Boolean(pedido.idPedidoNexaas));
    setItensPedido(pedido.itens ?? []);
    setPedidoSnapshot(pedido);
    setMostrarFormulario(true);
  }

  async function handleBuscarCliente() {
    const cpfDigitado = form.cpf.trim();
    if (!cpfDigitado) {
      setMensagemBuscaCliente({ tipo: "erro", texto: "Digite o CPF antes de buscar." });
      return;
    }

    setBuscandoCliente(true);
    setMensagemBuscaCliente(null);
    try {
      const res = await fetch(
        `/api/pedidos/buscar?tipo=cpf&valor=${encodeURIComponent(cpfDigitado)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setMensagemBuscaCliente({
          tipo: "erro",
          texto: data.error ?? "Não foi possível buscar esse CPF agora."
        });
        return;
      }

      const resultados: PedidoEncontrado[] = data.resultados ?? [];
      if (resultados.length === 0) {
        setMensagemBuscaCliente({
          tipo: "erro",
          texto: "Nenhuma compra encontrada para esse CPF. Preencha os dados manualmente."
        });
        return;
      }

      const maisRecente = resultados[0];
      setForm((prev) => ({
        ...prev,
        nomeCliente: maisRecente.nomeCliente ?? prev.nomeCliente,
        telefone: maisRecente.telefone ?? prev.telefone,
        email: maisRecente.email ?? prev.email
      }));
      setMensagemBuscaCliente({
        tipo: "sucesso",
        texto: "Nome, telefone e e-mail preenchidos a partir de uma compra anterior. Revise antes de salvar."
      });
    } catch {
      setMensagemBuscaCliente({
        tipo: "erro",
        texto: "Erro de conexão ao buscar os dados do cliente."
      });
    } finally {
      setBuscandoCliente(false);
    }
  }

  function handleChange<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function limparCampos() {
    setForm(ESTADO_INICIAL);
    setItensPedido([]);
    setCanalVendaOriginal(null);
    setNumeroPedidoEhIdNexaas(false);
    setPedidoSnapshot(null);
    setMensagemBuscaCliente(null);
    setErro(null);
  }

  function handleTrocarModo(novoModo: "com_pedido" | "sem_pedido") {
    setModo(novoModo);
    limparCampos();
    setMostrarFormulario(novoModo === "sem_pedido");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!form.cpf && !form.telefone && !form.email) {
      setErro("Informe ao menos um identificador de contato: CPF, telefone ou e-mail.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/reclamacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroPedido: form.numeroPedido || null,
          idPedidoNexaas: form.idPedidoNexaas || null,
          canalVenda: form.canalVenda,
          lojaOuCd: form.lojaOuCd,
          dataPedido: form.dataPedido || null,
          valorPedido: form.valorPedido ? Number(form.valorPedido) : null,
          pedidoLocalizado: form.pedidoLocalizado,
          nomeCliente: form.nomeCliente,
          cpf: form.cpf || null,
          telefone: form.telefone || null,
          email: form.email || null,
          motivo: form.motivo,
          submotivo: form.submotivo,
          descricao: form.descricao,
          resolucaoAplicada: form.resolucaoAplicada || null,
          valorGastoResolucao: form.valorGastoResolucao ? Number(form.valorGastoResolucao) : null,
          responsavel: form.responsavel || null,
          pedidoSnapshot: pedidoSnapshot
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível registrar a reclamação.");
        return;
      }

      router.push("/board");
      router.refresh();
    } catch {
      setErro("Erro de conexão ao registrar a reclamação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-base-200 pb-4">
        <button
          type="button"
          onClick={() => handleTrocarModo("com_pedido")}
          className={`focus-ring text-sm px-3 py-1.5 rounded-md transition-colors ${
            modo === "com_pedido"
              ? "bg-caramel-500 text-white"
              : "text-base-800 hover:bg-base-100"
          }`}
        >
          Vinculada a um pedido
        </button>
        <button
          type="button"
          onClick={() => handleTrocarModo("sem_pedido")}
          className={`focus-ring text-sm px-3 py-1.5 rounded-md transition-colors ${
            modo === "sem_pedido"
              ? "bg-caramel-500 text-white"
              : "text-base-800 hover:bg-base-100"
          }`}
        >
          Sem pedido (atendimento, loja, infraestrutura)
        </button>
      </div>

      {modo === "com_pedido" && (
        <OrderSearch
          onPedidoSelecionado={preencherComPedido}
          onBuscaManual={() => setMostrarFormulario(true)}
        />
      )}

      {modo === "sem_pedido" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-base-800">
            Use esta opção para reclamações que não se referem a um pedido específico —
            atendimento em loja, infraestrutura, limpeza, etc.
          </p>
          <button
            type="button"
            onClick={limparCampos}
            className="focus-ring shrink-0 text-xs text-slate2-600 underline hover:text-slate2-500"
          >
            Limpar campos
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-base-200 rounded-card p-6 space-y-5"
        >
          {form.pedidoLocalizado && (
            <p className="text-xs text-sage-600 bg-sage-100 rounded-md px-3 py-2">
              Dados preenchidos automaticamente a partir do pedido localizado. Revise antes de salvar.
            </p>
          )}

          {itensPedido.length > 0 && (
            <div className="border border-base-200 rounded-md p-3 bg-base-50">
              <p className="text-sm font-medium text-base-800 mb-2">
                Itens do pedido ({itensPedido.length})
              </p>
              <ul className="space-y-1">
                {itensPedido.map((item, idx) => (
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
                    {itensPedido
                      .reduce((soma, item) => soma + (item.valorUnitario ?? 0) * item.quantidade, 0)
                      .toFixed(2)}
                  </span>
                </p>
                {pedidoSnapshot?.desconto != null && pedidoSnapshot.desconto > 0 && (
                  <p className="text-xs text-base-800 flex justify-between">
                    <span>Desconto</span>
                    <span className="font-mono">- R$ {pedidoSnapshot.desconto.toFixed(2)}</span>
                  </p>
                )}
                {pedidoSnapshot?.frete != null && (
                  <p className="text-xs text-base-800 flex justify-between">
                    <span>Frete</span>
                    <span className="font-mono">R$ {pedidoSnapshot.frete.toFixed(2)}</span>
                  </p>
                )}
                {pedidoSnapshot?.valorPedido != null && (
                  <p className="text-sm font-semibold text-base-900 flex justify-between border-t border-base-200 pt-1 mt-1">
                    <span>Total do pedido</span>
                    <span className="font-mono">R$ {pedidoSnapshot.valorPedido.toFixed(2)}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Canal de venda" required>
              <select
                required
                value={form.canalVenda}
                onChange={(e) => handleChange("canalVenda", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {CANAIS_VENDA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {canalVendaOriginal && (
                <p className="text-xs text-slate2-600 mt-1">
                  Valor recebido do Nexaas:{" "}
                  <span className="font-mono">{canalVendaOriginal}</span> — não bateu com
                  nenhuma opção da lista, selecione manualmente a mais próxima.
                </p>
              )}
            </Field>

            <Field label="Loja ou CD de origem" required>
              {modo === "sem_pedido" ? (
                <>
                  <select
                    required
                    value={form.lojaOuCd}
                    onChange={(e) => handleChange("lojaOuCd", e.target.value)}
                    className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
                  >
                    <option value="">Selecione</option>
                    {lojasDisponiveis.map((loja) => (
                      <option key={loja} value={loja}>
                        {loja}
                      </option>
                    ))}
                  </select>
                  {lojasFonteLocal && (
                    <p className="text-xs text-slate2-600 mt-1">
                      Não foi possível consultar a lista atualizada da Nexaas agora —
                      mostrando uma lista de reserva, que pode estar desatualizada.
                    </p>
                  )}
                </>
              ) : (
                <input
                  required
                  type="text"
                  value={form.lojaOuCd}
                  onChange={(e) => handleChange("lojaOuCd", e.target.value)}
                  className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
                />
              )}
            </Field>

            {modo === "com_pedido" && (
              <>
                <Field label="Número do pedido">
                  <input
                    type="text"
                    value={form.numeroPedido}
                    onChange={(e) => handleChange("numeroPedido", e.target.value)}
                    className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm font-mono"
                  />
                  {numeroPedidoEhIdNexaas && (
                    <p className="text-xs text-slate2-600 mt-1">
                      Este pedido não tem código externo (comum em vendas de loja física) —
                      usando o ID interno da Nexaas.
                    </p>
                  )}
                </Field>

                <Field label="Data do pedido">
                  <input
                    type="date"
                    value={form.dataPedido}
                    onChange={(e) => handleChange("dataPedido", e.target.value)}
                    className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
                  />
                </Field>

                <Field label="Valor do pedido (R$)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorPedido}
                    onChange={(e) => handleChange("valorPedido", e.target.value)}
                    className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
                  />
                </Field>
              </>
            )}
          </div>

          <hr className="border-base-200" />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome do cliente" required>
              <input
                required
                type="text"
                value={form.nomeCliente}
                onChange={(e) => handleChange("nomeCliente", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="CPF">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
                />
                {modo === "sem_pedido" && (
                  <button
                    type="button"
                    onClick={handleBuscarCliente}
                    disabled={buscandoCliente}
                    className="focus-ring shrink-0 rounded-md border border-slate2-500 text-slate2-600 text-sm font-medium px-3 py-2 hover:bg-slate2-100 transition-colors disabled:opacity-60"
                  >
                    {buscandoCliente ? "Buscando..." : "Buscar dados"}
                  </button>
                )}
              </div>
              {mensagemBuscaCliente && (
                <p
                  className={`text-xs mt-1 ${
                    mensagemBuscaCliente.tipo === "sucesso" ? "text-sage-600" : "text-brick-500"
                  }`}
                >
                  {mensagemBuscaCliente.texto}
                </p>
              )}
              {modo === "sem_pedido" && !mensagemBuscaCliente && (
                <p className="text-xs text-base-800 mt-1">
                  Digite o CPF e clique em "Buscar dados" para preencher nome, telefone e
                  e-mail a partir de uma compra anterior do cliente (se houver).
                </p>
              )}
            </Field>

            <Field label="Telefone">
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="E-mail">
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <p className="text-xs text-base-800 -mt-2">
            Informe ao menos um identificador de contato (CPF, telefone ou e-mail).
          </p>

          <hr className="border-base-200" />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Motivo" required>
              <select
                required
                value={form.motivo}
                onChange={(e) => {
                  handleChange("motivo", e.target.value);
                  handleChange("submotivo", "");
                }}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Submotivo" required>
              <select
                required
                disabled={!form.motivo}
                value={form.submotivo}
                onChange={(e) => handleChange("submotivo", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm disabled:bg-base-100"
              >
                <option value="">Selecione</option>
                {submotivos.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Descrição da ocorrência" required>
            <textarea
              required
              rows={3}
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Resolução aplicada (opcional)">
              <select
                value={form.resolucaoAplicada}
                onChange={(e) => handleChange("resolucaoAplicada", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              >
                <option value="">Ainda não definida</option>
                {RESOLUCOES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Valor total gasto com resolução (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valorGastoResolucao}
                onChange={(e) => handleChange("valorGastoResolucao", e.target.value)}
                placeholder="0,00"
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Responsável (opcional)">
              <input
                type="text"
                value={form.responsavel}
                onChange={(e) => handleChange("responsavel", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>

          {erro && (
            <p className="text-sm text-brick-500" role="alert">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={enviando}
              className="focus-ring rounded-md bg-caramel-500 text-white text-sm font-medium px-5 py-2.5 hover:bg-caramel-600 transition-colors disabled:opacity-60"
            >
              {enviando ? "Salvando..." : "Registrar reclamação"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-base-800 mb-1">
        {label}
        {required && <span className="text-brick-500"> *</span>}
      </span>
      {children}
    </label>
  );
}