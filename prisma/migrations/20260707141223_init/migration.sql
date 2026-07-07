-- CreateEnum
CREATE TYPE "StatusReclamacao" AS ENUM ('ABERTO', 'EM_ANALISE', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_LOJA_CD', 'RESOLVIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Reclamacao" (
    "id" TEXT NOT NULL,
    "numeroPedido" TEXT,
    "idPedidoNexaas" TEXT,
    "canalVenda" TEXT NOT NULL,
    "lojaOuCd" TEXT NOT NULL,
    "dataPedido" TIMESTAMP(3),
    "valorPedido" DECIMAL(10,2),
    "pedidoLocalizado" BOOLEAN NOT NULL DEFAULT false,
    "nomeCliente" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "motivo" TEXT NOT NULL,
    "submotivo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "resolucaoAplicada" TEXT,
    "valorGastoResolucao" DECIMAL(10,2),
    "status" "StatusReclamacao" NOT NULL DEFAULT 'ABERTO',
    "responsavel" TEXT,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reclamacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoStatus" (
    "id" TEXT NOT NULL,
    "reclamacaoId" TEXT NOT NULL,
    "statusAnterior" "StatusReclamacao",
    "statusNovo" "StatusReclamacao" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "lider" TEXT,
    "telefoneLider" TEXT,
    "telefoneLoja" TEXT,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reclamacao_status_idx" ON "Reclamacao"("status");

-- CreateIndex
CREATE INDEX "Reclamacao_numeroPedido_idx" ON "Reclamacao"("numeroPedido");

-- CreateIndex
CREATE INDEX "Reclamacao_cpf_idx" ON "Reclamacao"("cpf");

-- CreateIndex
CREATE INDEX "HistoricoStatus_reclamacaoId_idx" ON "HistoricoStatus"("reclamacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Loja_nome_key" ON "Loja"("nome");

-- AddForeignKey
ALTER TABLE "HistoricoStatus" ADD CONSTRAINT "HistoricoStatus_reclamacaoId_fkey" FOREIGN KEY ("reclamacaoId") REFERENCES "Reclamacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
