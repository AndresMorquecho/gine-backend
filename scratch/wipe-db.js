const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- EMPEZANDO VACIADO DE BASE DE DATOS (TRANSACCIONES) ---');
  try {
    console.log('Eliminando Recetas (Prescriptions)...');
    await prisma.prescription.deleteMany({});

    console.log('Eliminando Ítems de Órdenes Médicas (MedicalOrderItem)...');
    await prisma.medicalOrderItem.deleteMany({});

    console.log('Eliminando Resultados de Órdenes (OrderResult)...');
    await prisma.orderResult.deleteMany({});

    console.log('Eliminando Órdenes Médicas (MedicalOrder)...');
    await prisma.medicalOrder.deleteMany({});

    console.log('Eliminando Documentos de Consultas (ConsultationDocument)...');
    await prisma.consultationDocument.deleteMany({});

    console.log('Eliminando Diagnósticos de Consultas (ConsultationDiagnosis)...');
    await prisma.consultationDiagnosis.deleteMany({});

    console.log('Eliminando Ginecología de Consultas (ConsultationGynecology)...');
    await prisma.consultationGynecology.deleteMany({});

    console.log('Eliminando Signos Vitales de Consultas (ConsultationVitalSigns)...');
    await prisma.consultationVitalSigns.deleteMany({});

    console.log('Eliminando Tratamientos de Consultas (ConsultationTreatment)...');
    await prisma.consultationTreatment.deleteMany({});

    console.log('Eliminando Consultas (Consultation)...');
    await prisma.consultation.deleteMany({});

    console.log('Eliminando Ecografías de Embarazos (PregnancyEchography)...');
    await prisma.pregnancyEchography.deleteMany({});

    console.log('Eliminando Riesgos de Embarazos (PregnancyRisk)...');
    await prisma.pregnancyRisk.deleteMany({});

    console.log('Eliminando Controles Prenatales (PrenatalControl)...');
    await prisma.prenatalControl.deleteMany({});

    console.log('Eliminando Embarazos (Pregnancy)...');
    await prisma.pregnancy.deleteMany({});

    console.log('Eliminando Pacientes (Patient)...');
    await prisma.patient.deleteMany({});

    console.log('--- VACIADO COMPLETADO CON ÉXITO ---');
  } catch (error) {
    console.error('Error durante el vaciado de la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
