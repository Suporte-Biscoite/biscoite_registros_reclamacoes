-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "reclamacaoId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipoArquivo" TEXT,
    "tamanho" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Anexo_reclamacaoId_idx" ON "Anexo"("reclamacaoId");

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_reclamacaoId_fkey" FOREIGN KEY ("reclamacaoId") REFERENCES "Reclamacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
