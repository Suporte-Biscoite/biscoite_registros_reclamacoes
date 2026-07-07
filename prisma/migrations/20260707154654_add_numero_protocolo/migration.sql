/*
  Warnings:

  - A unique constraint covering the columns `[numeroProtocolo]` on the table `Reclamacao` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reclamacao" ADD COLUMN     "numeroProtocolo" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reclamacao_numeroProtocolo_key" ON "Reclamacao"("numeroProtocolo");
