-- DropForeignKey
ALTER TABLE "Avaliacao" DROP CONSTRAINT "Avaliacao_producaoId_fkey";

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_producaoId_fkey" FOREIGN KEY ("producaoId") REFERENCES "Producao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
