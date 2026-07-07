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
    custoMedioPorReclamacao: number;
    tempoMedioResolucaoDias: number | null;
  };
}

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
  }, [meses, modoPeriodo, filtroAplicado]);

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

      {erro && <p className="text-sm text-brick-500">{erro}</p>}
      {carregando && <p className="text-sm text-base-800">Carregando...</p>}
      {modoPeriodo === "personalizado" && !filtroAplicado && !erro && (
        <p className="text-sm text-base-800">
          Selecione as datas inicial e final e clique em "Aplicar".
        </p>
      )}

      {dados && !carregando && (modoPeriodo === "relativo" || filtroAplicado) && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            <KpiCard
              label="Custo médio por caso"
              valor={formatarReais(dados.kpis.custoMedioPorReclamacao)}
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
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dados.porMotivo} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E6E2" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#3A372F" }} />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    width={140}
                    tick={{ fontSize: 12, fill: "#3A372F" }}
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
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dados.porLoja} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E6E2" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#3A372F" }} />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    width={140}
                    tick={{ fontSize: 12, fill: "#3A372F" }}
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
