-- AlterTable
ALTER TABLE "consultation_gynecology" DROP COLUMN "abortos",
DROP COLUMN "cesareas",
DROP COLUMN "ectopicos",
DROP COLUMN "fechaUltimoParto",
DROP COLUMN "gestas",
DROP COLUMN "hijosVivos",
DROP COLUMN "partos";

-- AlterTable
ALTER TABLE "consultation_vital_signs" DROP COLUMN "alturaUterina",
DROP COLUMN "contracciones",
DROP COLUMN "edema",
DROP COLUMN "fcf",
DROP COLUMN "movFetales";

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "abortos",
DROP COLUMN "cesareas",
DROP COLUMN "gestas",
DROP COLUMN "partos";

-- CreateTable
CREATE TABLE "pregnancies" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fum" TIMESTAMP(3) NOT NULL,
    "fpp" TIMESTAMP(3) NOT NULL,
    "egInitial" DOUBLE PRECISION,
    "initialWeight" DOUBLE PRECISION,
    "initialHeight" DOUBLE PRECISION,
    "initialImc" DOUBLE PRECISION,
    "bloodType" TEXT,
    "rh" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'sin_riesgo',
    "status" TEXT NOT NULL DEFAULT 'activo',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "pregnancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prenatal_controls" (
    "id" TEXT NOT NULL,
    "pregnancyId" TEXT NOT NULL,
    "controlDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gestationalAge" DOUBLE PRECISION NOT NULL,
    "maternalWeight" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "temperature" DOUBLE PRECISION,
    "fetalHeartRate" INTEGER,
    "uterineHeight" INTEGER,
    "edema" TEXT,
    "fetalMovements" TEXT,
    "contractions" TEXT,
    "observations" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prenatal_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregnancy_risks" (
    "id" TEXT NOT NULL,
    "pregnancyId" TEXT NOT NULL,
    "riskName" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pregnancy_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregnancy_echographies" (
    "id" TEXT NOT NULL,
    "pregnancyId" TEXT NOT NULL,
    "studyDate" TIMESTAMP(3) NOT NULL,
    "studyType" TEXT NOT NULL,
    "gestationalAge" DOUBLE PRECISION,
    "studyName" TEXT NOT NULL,
    "report" TEXT,
    "doctorName" TEXT,
    "pdfUrl" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pregnancy_echographies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pregnancies" ADD CONSTRAINT "pregnancies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenatal_controls" ADD CONSTRAINT "prenatal_controls_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "pregnancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy_risks" ADD CONSTRAINT "pregnancy_risks_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "pregnancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy_echographies" ADD CONSTRAINT "pregnancy_echographies_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "pregnancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
