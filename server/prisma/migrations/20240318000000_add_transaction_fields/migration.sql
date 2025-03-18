-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "originalDescription" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "vendor" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "source" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "bankName" TEXT; 