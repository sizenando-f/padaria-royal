-- CreateTable
CREATE TABLE "Fornada" (
    "id" SERIAL NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tempInicial" DECIMAL(5,2) NOT NULL,
    "tempFinalPrevista" DECIMAL(5,2) NOT NULL,
    "tempoFermentacao" INTEGER NOT NULL,
    "farinhaKg" DECIMAL(10,3) NOT NULL,
    "emulsificanteMl" DECIMAL(10,2) NOT NULL,
    "fermentoGrama" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "Fornada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" SERIAL NOT NULL,
    "fornadaId" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "comentario" TEXT,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_fornadaId_key" ON "Avaliacao"("fornadaId");

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_fornadaId_fkey" FOREIGN KEY ("fornadaId") REFERENCES "Fornada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
