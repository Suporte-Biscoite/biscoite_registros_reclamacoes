"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderSearch } from "@/components/OrderSearch";
import {
  CANAIS_VENDA,
  TAXONOMIA,
  MOTIVOS,
  RESOLUCOES
} from "@/lib/taxonomy";
import type { PedidoEncontrado } from "@/lib/bigquery";

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
  responsavel: ""
};

export function ComplaintForm() {
  const router = useRouter();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const submotivos = useMemo(
    () => (form.motivo ? TAXONOMIA[form.motivo] ?? [] : []),
    [form.motivo]
  );

  function preencherComPedido(pedido: PedidoEncontrado) {
    setForm((prev) => ({
      ...prev,
      numeroPedido: pedido.numeroPedido ?? "",
      idPedidoNexaas: pedido.idPedidoNexaas ?? "",
      dataPedido: pedido.dataPedido ? pedido.dataPedido.substring(0, 10) : "",
      valorPedido: pedido.valorPedido != null ? String(pedido.valorPedido) : "",
      pedidoLocalizado: true,
      nomeCliente: pedido.nomeCliente ?? "",
      cpf: pedido.cpf ?? "",
      telefone: pedido.telefone ?? "",
      email: pedido.email ?? "",
      canalVenda: pedido.canalVenda ?? prev.canalVenda,
      lojaOuCd: pedido.lojaOuCd ?? prev.lojaOuCd
    }));
    setMostrarFormulario(true);
  }

  function handleChange<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
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
          responsavel: form.responsavel || null
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
      <OrderSearch
        onPedidoSelecionado={preencherComPedido}
        onBuscaManual={() => setMostrarFormulario(true)}
      />

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
            </Field>

            <Field label="Loja ou CD de origem" required>
              <input
                required
                type="text"
                value={form.lojaOuCd}
                onChange={(e) => handleChange("lojaOuCd", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Número do pedido">
              <input
                type="text"
                value={form.numeroPedido}
                onChange={(e) => handleChange("numeroPedido", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm font-mono"
              />
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
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
                className="focus-ring w-full rounded-md border border-base-300 px-3 py-2 text-sm"
              />
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

          <div className="grid sm:grid-cols-2 gap-4">
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
