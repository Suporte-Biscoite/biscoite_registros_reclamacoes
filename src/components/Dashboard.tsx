"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { STATUS_LABELS } from "@/lib/taxonomy";
import { corPorIndice } from "@/lib/chartColors";

function truncarTexto(texto: string, max = 22): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

// Rótulo customizado do eixo Y: sem isso, o Recharts quebra nomes longos em
// várias linhas automaticamente, e como cada categoria tem uma faixa de
// altura fixa, as linhas extras acabam invadindo a barra vizinha. Aqui
// truncamos para uma linha só — o nome completo continua aparecendo ao
// passar o mouse sobre a barra (tooltip usa o valor original, não truncado).
function RotuloCategoria({ x, y, payload }: any) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="#3A372F">
      {truncarTexto(String(payload.value))}
    </text>
  );
}

interface CategoriaItem {
  categoria: string;
  quantidade: number;
}

interface PeriodoItem {
  periodo: string;
  quantidade: number;
}

interface ValorPeriodoItem {
  periodo: string;
  valor: number;
}

interface Estatisticas {
  porPeriodo: PeriodoItem[];
  valorGastoPorPeriodo: ValorPeriodoItem[];
  porMotivo: CategoriaItem[];
  porLoja: CategoriaItem[];
  porCanal: CategoriaItem[];
  porStatus: CategoriaItem[];
  kpis: {
    totalReclamacoes: number;
    totalResolvidas: number;
    percentualResolvidas: number;
    valorTotalGasto: number;
    tempoMedioResolucaoDias: number | null;
  };
}

interface OpcoesFiltro {
  canais: string[];
  lojas: string[];
  motivos: string[];
  submotivos: string[];
  resolucoes: string[];
}

interface Filtros {
  canalVenda: string;
  loja: string;
  motivo: string;
  submotivo: string;
  resolucaoAplicada: string;
}

const FILTROS_VAZIOS: Filtros = {
  canalVenda: "",
  loja: "",
  motivo: "",
  submotivo: "",
  resolucaoAplicada: ""
};

function formatarPeriodo(periodo: string): string {
  const [ano, mes] = periodo.split("-");
  const nomes = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez"
  ];
  const indice = Number(mes) - 1;
  return `${nomes[indice] ?? mes}/${ano.slice(2)}`;
}

function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const OPCOES_PERIODO = [
  { label: "Últimos 3 meses", valor: 3 },
  { label: "Últimos 6 meses", valor: 6 },
  { label: "Últimos 12 meses", valor: 12 },
  { label: "Últimos 24 meses", valor: 24 }
];

function hojeISO(): string {
  return new Date().toISOString().substring(0, 10);
}

export function Dashboard() {
  const [modoPeriodo, setModoPeriodo] = useState<"relativo" | "personalizado">("relativo");
  const [meses, setMeses] = useState(6);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState(hojeISO());
  const [filtroAplicado, setFiltroAplicado] = useState<{ dataInicio: string; dataFim: string } | null>(null);
  const [dados, setDados] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [opcoesFiltro, setOpcoesFiltro] = useState<OpcoesFiltro | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);

  useEffect(() => {
    async function carregarOpcoes() {
      try {
        const res = await fetch("/api/filtros");
        const data = await res.json();
        if (res.ok) {
          setOpcoesFiltro(data);
        }
      } catch {
        // Se as opções de filtro falharem, os dropdowns ficam vazios, mas o
        // resto do dashboard continua funcionando normalmente.
      }
    }
    carregarOpcoes();
  }, []);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const params = new URLSearchParams();
        if (modoPeriodo === "personalizado" && filtroAplicado) {
          params.set("dataInicio", filtroAplicado.dataInicio);
          params.set("dataFim", filtroAplicado.dataFim);
        } else {
          params.set("meses", String(meses));
        }

        if (filtros.canalVenda) params.set("canalVenda", filtros.canalVenda);
        if (filtros.loja) params.set("loja", filtros.loja);
        if (filtros.motivo) params.set("motivo", filtros.motivo);
        if (filtros.submotivo) params.set("submotivo", filtros.submotivo);
        if (filtros.resolucaoAplicada) params.set("resolucaoAplicada", filtros.resolucaoAplicada);

        const res = await fetch(`/api/estatisticas?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setErro("Não foi possível carregar as estatísticas.");
          return;
        }
        setDados(data);
        setErro(null);
      } catch {
        setErro("Erro de conexão ao carregar as estatísticas.");
      } finally {
        setCarregando(false);
      }
    }

    if (modoPeriodo === "relativo" || filtroAplicado) {
      carregar();
    } else {
      setCarregando(false);
    }
  }, [meses, modoPeriodo, filtroAplicado, filtros]);

  function handleAplicarPersonalizado() {
    if (!dataInicio || !dataFim) {
      setErro("Selecione as duas datas para aplicar o filtro.");
      return;
    }
    if (dataInicio > dataFim) {
      setErro("A data inicial não pode ser depois da data final.");
      return;
    }
    setErro(null);
    setFiltroAplicado({ dataInicio, dataFim });
  }

  function handleFiltroChange(campo: keyof Filtros, valor: string) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  const filtrosAtivos = Object.values(filtros).some((v) => v !== "");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl text-base-900">Análises</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-base-800 mb-1">Período</label>
            <select
              value={modoPeriodo === "relativo" ? String(meses) : "personalizado"}
              onChange={(e) => {
                if (e.target.value === "personalizado") {
                  setModoPeriodo("personalizado");
                } else {
                  setModoPeriodo("relativo");
                  setMeses(Number(e.target.value));
                }
              }}
              className="focus-ring rounded-md border border-base-300 px-3 py-2 text-sm bg-white"
            >
              {OPCOES_PERIODO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
              <option value="personalizado">Período específico...</option>
            </select>
          </div>

          {modoPeriodo === "personalizado" && (
            <>
              <div>
                <label className="block text-xs text-base-800 mb-1">De</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="focus-ring rounded-md border border-base-300 px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-base-800 mb-1">Até</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="focus-ring rounded-md border border-base-300 px-3 py-2 text-sm bg-white"
                />
              </div>
              <button
                onClick={handleAplicarPersonalizado}
                className="focus-ring rounded-md bg-caramel-500 text-white text-sm font-medium px-4 py-2 hover:bg-caramel-600 transition-colors"
              >
                Aplicar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-base-200 rounded-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-base-800">Filtros</p>
          {filtrosAtivos && (
            <button
              onClick={() => setFiltros(FILTROS_VAZIOS)}
              className="focus-ring text-xs text-slate2-600 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FiltroSelect
            label="Canal de venda"
            value={filtros.canalVenda}
            opcoes={opcoesFiltro?.canais ?? []}
            onChange={(v) => handleFiltroChange("canalVenda", v)}
          />
          <FiltroSelect
            label="Loja"
            value={filtros.loja}
            opcoes={opcoesFiltro?.lojas ?? []}
            onChange={(v) => handleFiltroChange("loja", v)}
          />
          <FiltroSelect
            label="Motivo"
            value={filtros.motivo}
            opcoes={opcoesFiltro?.motivos ?? []}
            onChange={(v) => handleFiltroChange("motivo", v)}
          />
          <FiltroSelect
            label="Submotivo"
            value={filtros.submotivo}
            opcoes={opcoesFiltro?.submotivos ?? []}
            onChange={(v) => handleFiltroChange("submotivo", v)}
          />
          <FiltroSelect
            label="Resolução aplicada"
            value={filtros.resolucaoAplicada}
            opcoes={opcoesFiltro?.resolucoes ?? []}
            onChange={(v) => handleFiltroChange("resolucaoAplicada", v)}
          />
        </div>
      </div>

      {erro && <p className="text-sm text-brick-500">{erro}</p>}
      {carregando && <p className="text-sm text-base-800">Carregando...</p>}
      {modoPeriodo === "personalizado" && !filtroAplicado && !erro && (
        <p className="text-sm text-base-800">
          Selecione as datas inicial e final e clique em "Aplicar".
        </p>
      )}

      {dados && !carregando && (modoPeriodo === "relativo" || filtroAplicado) && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Reclamações no período"
              valor={String(dados.kpis.totalReclamacoes)}
            />
            <KpiCard
              label="Resolvidas"
              valor={`${dados.kpis.percentualResolvidas.toFixed(0)}%`}
              sublinha={`${dados.kpis.totalResolvidas} de ${dados.kpis.totalReclamacoes}`}
            />
            <KpiCard
              label="Tempo médio de resolução"
              valor={
                dados.kpis.tempoMedioResolucaoDias != null
                  ? `${dados.kpis.tempoMedioResolucaoDias.toFixed(1)} dias`
                  : "—"
              }
            />
            <KpiCard
              label="Valor total gasto"
              valor={formatarReais(dados.kpis.valorTotalGasto)}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Reclamações por período">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dados.porPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E6E2" />
                  <XAxis
                    dataKey="periodo"
                    tickFormatter={formatarPeriodo}
                    tick={{ fontSize: 12, fill: "#3A372F" }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#3A372F" }} />
                  <Tooltip
                    labelFormatter={formatarPeriodo}
                    formatter={(v: number) => [v, "Reclamações"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="quantidade"
                    stroke="#5B84A3"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Valor gasto com resolução por período">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dados.valorGastoPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E6E2" />
                  <XAxis
                    dataKey="periodo"
                    tickFormatter={formatarPeriodo}
                    tick={{ fontSize: 12, fill: "#3A372F" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#3A372F" }} />
                  <Tooltip
                    labelFormatter={formatarPeriodo}
                    formatter={(v: number) => [formatarReais(v), "Valor gasto"]}
                  />
                  <Bar dataKey="valor" fill="#4A6178" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Principais motivos de reclamação">
              <ResponsiveContainer width="100%" height={Math.max(220, dados.porMotivo.length * 42)}>
                <BarChart data={dados.porMotivo} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E6E2" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#3A372F" }} />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    width={140}
                    tick={<RotuloCategoria />}
                  />
                  <Tooltip formatter={(v: number) => [v, "Reclamações"]} />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                    {dados.porMotivo.map((_, idx) => (
                      <Cell key={idx} fill={corPorIndice(idx)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Lojas / CD com mais reclamações">
              <ResponsiveContainer width="100%" height={Math.max(220, dados.porLoja.length * 42)}>
                <BarChart data={dados.porLoja} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E6E2" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#3A372F" }} />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    width={140}
                    tick={<RotuloCategoria />}
                  />
                  <Tooltip formatter={(v: number) => [v, "Reclamações"]} />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                    {dados.porLoja.map((_, idx) => (
                      <Cell key={idx} fill={corPorIndice(idx + 2)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Distribuição por status">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={dados.porStatus}
                    dataKey="quantidade"
                    nameKey="categoria"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {dados.porStatus.map((_, idx) => (
                      <Cell key={idx} fill={corPorIndice(idx)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, _n, item) => [
                      v,
                      STATUS_LABELS[item.payload.categoria] ?? item.payload.categoria
                    ]}
                  />
                  <Legend
                    formatter={(value) => STATUS_LABELS[value] ?? value}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Reclamações por canal de venda">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={dados.porCanal}
                    dataKey="quantidade"
                    nameKey="categoria"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {dados.porCanal.map((_, idx) => (
                      <Cell key={idx} fill={corPorIndice(idx + 3)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function FiltroSelect({
  label,
  value,
  opcoes,
  onChange
}: {
  label: string;
  value: string;
  opcoes: string[];
  onChange: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-base-800 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full rounded-md border border-base-300 px-2 py-1.5 text-sm bg-white"
      >
        <option value="">Todos</option>
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function KpiCard({
  label,
  valor,
  sublinha
}: {
  label: string;
  valor: string;
  sublinha?: string;
}) {
  return (
    <div className="bg-white border border-base-200 rounded-card p-4">
      <p className="text-xs text-base-800">{label}</p>
      <p className="font-display text-2xl text-base-900 mt-1">{valor}</p>
      {sublinha && <p className="text-xs text-base-800 mt-0.5">{sublinha}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-base-200 rounded-card p-4">
      <p className="text-sm font-medium text-base-800 mb-2">{title}</p>
      {children}
    </div>
  );
}
