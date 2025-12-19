/*
  Warnings:

  - You are about to drop the column `fornadaId` on the `Avaliacao` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[producaoId]` on the table `Avaliacao` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `producaoId` to the `Avaliacao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Avaliacao" DROP CONSTRAINT "Avaliacao_fornadaId_fkey";

-- DropIndex
DROP INDEX "Avaliacao_fornadaId_key";

-- AlterTable
ALTER TABLE "Avaliacao" DROP COLUMN "fornadaId",
ADD COLUMN     "producaoId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_producaoId_key" ON "Avaliacao"("producaoId");

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_producaoId_fkey" FOREIGN KEY ("producaoId") REFERENCES "Producao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
