/*
  Warnings:

  - You are about to drop the `Fornada` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Avaliacao" DROP CONSTRAINT "Avaliacao_fornadaId_fkey";

-- DropTable
DROP TABLE "Fornada";

-- CreateTable
CREATE TABLE "Producao" (
    "id" SERIAL NOT NULL,
    "dataProducao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFim" TIMESTAMP(3) NOT NULL,
    "tempoFermentacaoMinutos" INTEGER NOT NULL,
    "tempAmbienteInicial" DECIMAL(5,2),
    "tempAmbienteFinal" DECIMAL(5,2),
    "farinhaKg" DECIMAL(10,3) NOT NULL,
    "emulsificanteMl" DECIMAL(10,2) NOT NULL,
    "fermentoGrama" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "Producao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_fornadaId_fkey" FOREIGN KEY ("fornadaId") REFERENCES "Producao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
