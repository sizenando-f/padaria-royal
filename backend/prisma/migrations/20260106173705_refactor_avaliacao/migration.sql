/*
  Warnings:

  - You are about to drop the column `status` on the `Avaliacao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Avaliacao" DROP COLUMN "status",
ADD COLUMN     "tempAmbienteFinalReal" DECIMAL(65,30);
