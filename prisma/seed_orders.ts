import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- SEEDING MEDICAL EXAMS CATALOG ---')

  // 1. Tipos de Muestra
  const blood = await prisma.sampleType.create({ data: { name: 'Sangre', description: 'Muestra de sangre venosa' } })
  const urine = await prisma.sampleType.create({ data: { name: 'Orina', description: 'Muestra de orina (chorro medio)' } })
  const vaginal = await prisma.sampleType.create({ data: { name: 'Secreción Vaginal', description: 'Hisopado vaginal' } })
  const image = await prisma.sampleType.create({ data: { name: 'Imagen Diagnóstica', description: 'No requiere muestra física' } })

  // 2. Preparaciones
  const prepFast = await prisma.examPreparation.create({ data: { title: 'Ayuno', content: 'Acudir con 8 horas de ayuno total.' } })
  const prepFullBladder = await prisma.examPreparation.create({ data: { title: 'Vejiga Llena', content: 'Ingerir 1 litro de agua 1 hora antes del examen y no orinar.' } })
  const prepEmptyBladder = await prisma.examPreparation.create({ data: { title: 'Vejiga Vacía', content: 'Orinar inmediatamente antes del examen.' } })
  const prepNoSex = await prisma.examPreparation.create({ data: { title: 'Abstinencia Sexual', content: 'No haber tenido relaciones sexuales en las últimas 48 horas.' } })

  // 3. Tipos de Orden
  const labOrder = await prisma.orderType.create({
    data: {
      name: 'Laboratorio',
      slug: 'laboratorio',
      icon: 'Beaker',
      color: 'indigo'
    }
  })

  const ecoOrder = await prisma.orderType.create({
    data: {
      name: 'Ecografía',
      slug: 'ecografia',
      icon: 'Activity',
      color: 'emerald'
    }
  })

  // 4. Categorías de Laboratorio
  const catHematologia = await prisma.examCategory.create({
    data: {
      orderTypeId: labOrder.id,
      name: 'Hematología',
      color: 'rose',
      icon: 'Droplet'
    }
  })

  const catHormonas = await prisma.examCategory.create({
    data: {
      orderTypeId: labOrder.id,
      name: 'Hormonas',
      color: 'amber',
      icon: 'Activity'
    }
  })

  const catInfecciosas = await prisma.examCategory.create({
    data: {
      orderTypeId: labOrder.id,
      name: 'Infecciosas',
      color: 'indigo',
      icon: 'ShieldAlert'
    }
  })

  // 5. Categorías de Ecografía
  const catObstetrica = await prisma.examCategory.create({
    data: {
      orderTypeId: ecoOrder.id,
      name: 'Obstetricia',
      color: 'emerald',
      icon: 'Baby'
    }
  })

  // 6. Exámenes Reales
  // Hematología
  await prisma.medicalExam.create({
    data: {
      categoryId: catHematologia.id,
      sampleTypeId: blood.id,
      name: 'Biometría Hemática',
      code: 'HEM-001',
      preparations: { connect: [{ id: prepFast.id }] }
    }
  })

  await prisma.medicalExam.create({
    data: {
      categoryId: catHematologia.id,
      sampleTypeId: blood.id,
      name: 'Hemoglobina y Hematocrito',
      code: 'HEM-002'
    }
  })

  // Hormonas
  await prisma.medicalExam.create({
    data: {
      categoryId: catHormonas.id,
      sampleTypeId: blood.id,
      name: 'TSH (Hormona Estimulante de Tiroides)',
      code: 'HOR-001',
      preparations: { connect: [{ id: prepFast.id }] }
    }
  })

  await prisma.medicalExam.create({
    data: {
      categoryId: catHormonas.id,
      sampleTypeId: blood.id,
      name: 'Prolactina',
      code: 'HOR-002',
      recommendations: 'Realizar la muestra entre 2 y 3 horas después de despertar.'
    }
  })

  await prisma.medicalExam.create({
    data: {
      categoryId: catHormonas.id,
      sampleTypeId: blood.id,
      name: 'Estradiol',
      code: 'HOR-003'
    }
  })

  // Infecciosas
  await prisma.medicalExam.create({
    data: {
      categoryId: catInfecciosas.id,
      sampleTypeId: blood.id,
      name: 'VIH (SIDA) 4ta Generación',
      code: 'INF-001'
    }
  })

  await prisma.medicalExam.create({
    data: {
      categoryId: catInfecciosas.id,
      sampleTypeId: blood.id,
      name: 'VDRL (Sífilis)',
      code: 'INF-002'
    }
  })

  // Ecografías
  await prisma.medicalExam.create({
    data: {
      categoryId: catObstetrica.id,
      sampleTypeId: image.id,
      name: 'Ecografía Obstétrica Primer Trimestre',
      code: 'ECO-001',
      preparations: { connect: [{ id: prepFullBladder.id }] }
    }
  })

  await prisma.medicalExam.create({
    data: {
      categoryId: catObstetrica.id,
      sampleTypeId: image.id,
      name: 'Ecografía Morfológica (20-24 sem)',
      code: 'ECO-002'
    }
  })

  await prisma.medicalExam.create({
    data: {
      categoryId: catObstetrica.id,
      sampleTypeId: image.id,
      name: 'Doppler Fetal',
      code: 'ECO-003'
    }
  })

  console.log('--- SEEDING COMPLETED ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
