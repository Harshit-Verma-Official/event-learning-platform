/*
  Warnings:

  - You are about to alter the column `price` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - Added the required column `instructorId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Course` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "instructorId" TEXT NOT NULL,
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "Course_createdAt_idx" ON "Course"("createdAt");
