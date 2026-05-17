import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Directorio de subidas
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const RESULTS_DIR = path.join(UPLOADS_DIR, 'results');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR);

// Servir archivos estáticos
app.use('/uploads', express.static(UPLOADS_DIR));

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RESULTS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Solo se permiten archivos PDF e imágenes (JPG, PNG)'));
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/seed-clinical', async (req, res) => {
  try {
    // Check if already seeded
    const count = await prisma.orderType.count();
    if (count > 0) return res.json({ message: 'Ya existen datos clínicos.' });

    console.log('--- SEEDING MEDICAL EXAMS CATALOG ---');

    // 1. Tipos de Muestra
    const blood = await prisma.sampleType.create({ data: { name: 'Sangre', description: 'Muestra de sangre venosa' } });
    const urine = await prisma.sampleType.create({ data: { name: 'Orina', description: 'Muestra de orina (chorro medio)' } });
    const vaginal = await prisma.sampleType.create({ data: { name: 'Secreción Vaginal', description: 'Hisopado vaginal' } });
    const image = await prisma.sampleType.create({ data: { name: 'Imagen Diagnóstica', description: 'No requiere muestra física' } });

    // 2. Preparaciones
    const prepFast = await prisma.examPreparation.create({ data: { title: 'Ayuno', content: 'Acudir con 8 horas de ayuno total.' } });
    const prepFullBladder = await prisma.examPreparation.create({ data: { title: 'Vejiga Llena', content: 'Ingerir 1 litro de agua 1 hora antes del examen y no orinar.' } });
    const prepEmptyBladder = await prisma.examPreparation.create({ data: { title: 'Vejiga Vacía', content: 'Orinar inmediatamente antes del examen.' } });
    const prepNoSex = await prisma.examPreparation.create({ data: { title: 'Abstinencia Sexual', content: 'No haber tenido relaciones sexuales en las últimas 48 horas.' } });

    // 3. Tipos de Orden
    const labOrder = await prisma.orderType.create({
      data: {
        name: 'Laboratorio',
        slug: 'laboratorio',
        icon: 'Beaker',
        color: 'indigo'
      }
    });

    const ecoOrder = await prisma.orderType.create({
      data: {
        name: 'Ecografía',
        slug: 'ecografia',
        icon: 'Activity',
        color: 'emerald'
      }
    });

    // 4. Categorías de Laboratorio
    const catHematologia = await prisma.examCategory.create({
      data: {
        orderTypeId: labOrder.id,
        name: 'Hematología',
        color: 'rose',
        icon: 'Droplet'
      }
    });

    const catHormonas = await prisma.examCategory.create({
      data: {
        orderTypeId: labOrder.id,
        name: 'Hormonas',
        color: 'amber',
        icon: 'Activity'
      }
    });

    const catInfecciosas = await prisma.examCategory.create({
      data: {
        orderTypeId: labOrder.id,
        name: 'Infecciosas',
        color: 'indigo',
        icon: 'ShieldAlert'
      }
    });

    const catOrina = await prisma.examCategory.create({
      data: {
        orderTypeId: labOrder.id,
        name: 'Orina',
        color: 'blue',
        icon: 'Droplet'
      }
    });

    // 5. Categorías de Ecografía
    const catObstetrica = await prisma.examCategory.create({
      data: {
        orderTypeId: ecoOrder.id,
        name: 'Obstetricia',
        color: 'emerald',
        icon: 'Baby'
      }
    });

    const catGinecologica = await prisma.examCategory.create({
      data: {
        orderTypeId: ecoOrder.id,
        name: 'Ginecológica',
        color: 'rose',
        icon: 'Heart'
      }
    });

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
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catHematologia.id,
        sampleTypeId: blood.id,
        name: 'Hemoglobina y Hematocrito',
        code: 'HEM-002'
      }
    });

    // Hormonas
    await prisma.medicalExam.create({
      data: {
        categoryId: catHormonas.id,
        sampleTypeId: blood.id,
        name: 'TSH',
        code: 'HOR-001',
        preparations: { connect: [{ id: prepFast.id }] }
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catHormonas.id,
        sampleTypeId: blood.id,
        name: 'Prolactina',
        code: 'HOR-002',
        recommendations: 'Realizar la muestra entre 2 y 3 horas después de despertar.'
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catHormonas.id,
        sampleTypeId: blood.id,
        name: 'FSH',
        code: 'HOR-003'
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catHormonas.id,
        sampleTypeId: blood.id,
        name: 'LH',
        code: 'HOR-004'
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catHormonas.id,
        sampleTypeId: blood.id,
        name: 'Estradiol',
        code: 'HOR-005'
      }
    });

    // Infecciosas
    await prisma.medicalExam.create({
      data: {
        categoryId: catInfecciosas.id,
        sampleTypeId: blood.id,
        name: 'VIH 4ta Generación',
        code: 'INF-001'
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catInfecciosas.id,
        sampleTypeId: blood.id,
        name: 'VDRL (Sífilis)',
        code: 'INF-002'
      }
    });

    // Orina
    await prisma.medicalExam.create({
      data: {
        categoryId: catOrina.id,
        sampleTypeId: urine.id,
        name: 'EGO (Elemental y Microscópico de Orina)',
        code: 'URI-001'
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catOrina.id,
        sampleTypeId: urine.id,
        name: 'Urocultivo con Antibiograma',
        code: 'URI-002'
      }
    });

    // Ecografías
    await prisma.medicalExam.create({
      data: {
        categoryId: catObstetrica.id,
        sampleTypeId: image.id,
        name: 'Ecografía Obstétrica Primer Trimestre',
        code: 'ECO-001',
        preparations: { connect: [{ id: prepFullBladder.id }] }
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catObstetrica.id,
        sampleTypeId: image.id,
        name: 'Ecografía Morfológica',
        code: 'ECO-002'
      }
    });

    await prisma.medicalExam.create({
      data: {
        categoryId: catGinecologica.id,
        sampleTypeId: image.id,
        name: 'Ecografía Transvaginal',
        code: 'ECO-G01',
        preparations: { connect: [{ id: prepEmptyBladder.id }] }
      }
    });

    res.json({ message: 'Catálogo clínico inicializado correctamente.' });
  } catch (error) {
    console.error('Error seeding:', error);
    res.status(500).json({ error: 'Error al inicializar catálogo.' });
  }
});

// Patients CRUD
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching patients' });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  const { id } = req.params;
  console.log('--- SOLICITUD DE PACIENTE ---');
  console.log('Buscando por:', id);
  
  try {
    // Expresión regular para detectar si es un UUID válido
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let patient = null;

    if (isUUID) {
      console.log('Detectado formato UUID, buscando por ID...');
      patient = await prisma.patient.findUnique({
        where: { id },
        include: { consultations: { orderBy: { date: 'desc' } } }
      });
    } 
    
    if (!patient) {
      console.log('Buscando por Numero de Documento...');
      patient = await prisma.patient.findFirst({
        where: { numeroDocumento: id },
        include: { consultations: { orderBy: { date: 'desc' } } }
      });
    }

    if (!patient) {
      console.warn('No se encontró paciente con:', id);
      return res.status(404).json({ message: 'Paciente no encontrada' });
    }

    console.log('Éxito: Paciente encontrada:', patient.nombres);
    res.json(patient);
  } catch (error) {
    console.error('Error crítico en el servidor:', error);
    res.status(500).json({ error: 'Error interno al procesar la solicitud' });
  }
});

// Consultations CRUD

app.delete('/api/consultations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar manualmente las órdenes médicas vinculadas,
    // ya que no hay onDelete: Cascade definido explícitamente en el esquema
    await prisma.medicalOrder.deleteMany({
      where: { consultationId: id }
    });

    // Luego eliminar la consulta (los signos vitales, ginecología, etc., se eliminan por cascade del esquema)
    await prisma.consultation.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar la consulta:', error);
    res.status(500).json({ error: 'Error deleting consultation' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const data = req.body;
    
    // Prepare data
    const formattedData = {
      ...data,
      fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : new Date(),
      fechaRegistro: data.fechaRegistro ? new Date(data.fechaRegistro) : new Date(),
      gestas: data.gestas ? parseInt(data.gestas) : 0,
      partos: data.partos ? parseInt(data.partos) : 0,
      cesareas: data.cesareas ? parseInt(data.cesareas) : 0,
      abortos: data.abortos ? parseInt(data.abortos) : 0,
    };

    const patient = await prisma.patient.create({ data: formattedData });
    res.status(201).json(patient);
  } catch (error: any) {
    console.error('Error creating patient:', error);
    res.status(400).json({ error: error.message || 'Error creating patient' });
  }
});

app.patch('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Prepare data if present
    const formattedData: any = { ...data };
    if (data.fechaNacimiento) formattedData.fechaNacimiento = new Date(data.fechaNacimiento);
    if (data.fechaRegistro) formattedData.fechaRegistro = new Date(data.fechaRegistro);
    if (data.gestas !== undefined) formattedData.gestas = parseInt(data.gestas);
    if (data.partos !== undefined) formattedData.partos = parseInt(data.partos);
    if (data.cesareas !== undefined) formattedData.cesareas = parseInt(data.cesareas);
    if (data.abortos !== undefined) formattedData.abortos = parseInt(data.abortos);

    const patient = await prisma.patient.update({
      where: { id },
      data: formattedData,
    });
    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error updating patient' });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.patient.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting patient' });
  }
});

// --- CONSULTATIONS V2 (Professional Clinical Architecture) ---

// Inicializar nueva consulta con herencia inteligente
app.get('/api/patients/:id/init-consultation', async (req, res) => {
  const { id } = req.params;
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const patient = await prisma.patient.findFirst({
      where: isUUID ? { id } : { numeroDocumento: id },
      include: {
        consultations: {
          orderBy: { date: 'desc' },
          take: 1,
          include: {
            vitalSigns: true,
            gynecology: true,
            treatment: true,
            diagnoses: true
          }
        }
      }
    });

    if (!patient) return res.status(404).json({ message: 'Paciente no encontrada' });

    const last = patient.consultations[0];

    // Estructura de herencia e inteligencia clínica
    res.json({
      patient: {
        id: patient.id,
        nombres: patient.nombres,
        apellidos: patient.apellidos,
        cedula: patient.numeroDocumento,
        edad: patient.fechaNacimiento ? new Date().getFullYear() - new Date(patient.fechaNacimiento).getFullYear() : 0,
        tipoSanguineo: patient.tipoSanguineo,
        alergias: patient.alergias,
        antecedentes: patient.antecedentes
      },
      inheritance: {
        lastFollowUp: last?.treatment?.followUp || '',
        lastFum: last?.gynecology?.fum || null,
        lastWeight: last?.vitalSigns?.weight || '',
        lastPressure: last?.vitalSigns?.pressure || '',
        lastFcf: last?.vitalSigns?.fcf || '',
        consecutive: (await prisma.consultation.count({ where: { patientId: patient.id } })) + 1
      },
      // Estado inicial vacío para la nueva consulta
      initialState: {
        type: "Consulta Ginecología",
        reason: last?.treatment?.followUp ? `SEGUIMIENTO: ${last.treatment.followUp}` : '',
        evolution: '',
        vitalSigns: {
          weight: '', pressure: '', heartRate: '', respRate: '', temp: '', saturacion: '', bmi: '',
          alturaUterina: '', fcf: '', movFetales: '', edema: '', contracciones: ''
        },
        gynecology: {
          fum: last?.gynecology?.fum || null,
          fpp: last?.gynecology?.fpp || null,
          eg: last?.gynecology?.eg || null,
          ciclo: last?.gynecology?.ciclo || 28,
          duracion: last?.gynecology?.duracion || 5,
          regularidad: last?.gynecology?.regularidad || 'Regular',
          metodo: last?.gynecology?.metodo || 'Ninguno',
          vidaSexualActiva: last?.gynecology?.vidaSexualActiva ?? true,
          sintomasMenstruales: last?.gynecology?.sintomasMenstruales || '',
          gestas: last?.gynecology?.gestas || 0,
          partos: last?.gynecology?.partos || 0,
          cesareas: last?.gynecology?.cesareas || 0,
          abortos: last?.gynecology?.abortos || 0,
          hijosVivos: last?.gynecology?.hijosVivos || 0,
          ectopicos: last?.gynecology?.ectopicos || 0,
          fechaUltimoParto: last?.gynecology?.fechaUltimoParto || null,
          papUltimo: last?.gynecology?.papUltimo || null,
          papResultado: last?.gynecology?.papResultado || '',
          colposcopia: last?.gynecology?.colposcopia || '',
          itsPrevias: last?.gynecology?.itsPrevias || '',
          cirugiasGine: last?.gynecology?.cirugiasGine || '',
          endometriosis: last?.gynecology?.endometriosis || false,
          sop: last?.gynecology?.sop || false,
          miomatosis: last?.gynecology?.miomatosis || false,
          quistes: last?.gynecology?.quistes || false,
          dolorPelvico: false,
          dismenorrea: false,
          sangradoIrregular: false,
          leucorrea: false,
          mastalgia: false,
          amenorrea: false,
          observaciones: ''
        },
        diagnoses: [],
        treatment: { plan: '', followUp: '' }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al inicializar acto médico' });
  }
});

// Paginación de Consultas del Paciente
app.get('/api/patients/:id/consultations', async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const skip = (page - 1) * limit;

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const patient = await prisma.patient.findFirst({
      where: isUUID ? { id } : { numeroDocumento: id },
    });

    if (!patient) return res.status(404).json({ message: 'Paciente no encontrada' });

    const total = await prisma.consultation.count({ where: { patientId: patient.id } });
    const consultations = await prisma.consultation.findMany({
      where: { patientId: patient.id },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
      include: {
        vitalSigns: true,
        gynecology: true,
        diagnoses: true,
        treatment: true,
        documents: true
      }
    });

    res.json({
      data: consultations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching paginated consultations:', error);
    res.status(500).json({ error: 'Error al recuperar las consultas' });
  }
});

// Paginación de Documentos del Paciente (Unificado: Consulta + Resultados de Órdenes)
app.get('/api/patients/:id/documents', async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const patient = await prisma.patient.findFirst({
      where: isUUID ? { id } : { numeroDocumento: id },
    });

    if (!patient) return res.status(404).json({ message: 'Paciente no encontrada' });

    // 1. Obtener documentos adjuntos a consultas
    const consultationDocs = await prisma.consultationDocument.findMany({
      where: { consultation: { patientId: patient.id } },
      include: {
        consultation: { select: { type: true, date: true } }
      }
    });

    // 2. Obtener resultados de órdenes de laboratorio / exámenes
    const orderResults = await prisma.orderResult.findMany({
      where: { order: { patientId: patient.id } },
      include: {
        order: {
          select: {
            secuencial: true,
            orderType: { select: { name: true } }
          }
        }
      }
    });

    // 3. Unificar ambos flujos
    const unifiedDocs = [
      ...consultationDocs.map(d => ({
        id: d.id,
        name: d.name,
        url: d.url,
        type: d.type,
        source: 'Consulta',
        createdAt: d.createdAt,
        reference: d.consultation.type
      })),
      ...orderResults.map(r => ({
        id: r.id,
        name: r.filename,
        url: r.url,
        type: r.fileType,
        source: r.order.orderType?.name || 'Examen',
        createdAt: r.createdAt,
        reference: `Orden Sec: ${r.order.secuencial}`
      }))
    ];

    // 4. Ordenar por fecha descendente (más recientes primero)
    unifiedDocs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 5. Aplicar paginación en memoria
    const total = unifiedDocs.length;
    const paginatedDocs = unifiedDocs.slice(skip, skip + limit);

    res.json({
      data: paginatedDocs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching paginated documents:', error);
    res.status(500).json({ error: 'Error al recuperar los documentos' });
  }
});

// Listado global de consultas con datos de pacientes
app.get('/api/consultations', async (req, res) => {
  try {
    const consultations = await prisma.consultation.findMany({
      include: {
        patient: {
          select: {
            nombres: true,
            apellidos: true,
            fechaNacimiento: true,
            numeroDocumento: true
          }
        },
        treatment: {
          select: {
            followUp: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    const formatted = consultations.map(c => ({
      id: c.id,
      patientId: c.patient.numeroDocumento || c.patientId, // Usamos la cédula para URLs limpias
      fecha: new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(c.date)),
      paciente: `${c.patient.nombres} ${c.patient.apellidos}`,
      edad: c.patient.fechaNacimiento ? new Date().getFullYear() - new Date(c.patient.fechaNacimiento).getFullYear() : 0,
      tipo: c.type,
      motivo: c.reason,
      diagnostico: c.evolution, // O usar primer diagnóstico si existe
      proximaCita: c.treatment?.followUp || 'No programada',
      estado: 'Finalizada'
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al listar consultas:', error);
    res.status(500).json({ error: 'Error al obtener el historial de consultas' });
  }
});

// Detalle completo de una consulta
app.get('/api/consultations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        vitalSigns: true,
        gynecology: true,
        diagnoses: true,
        treatment: true
      }
    });

    if (!consultation) return res.status(404).json({ message: 'Consulta no encontrada' });

    // Buscar las órdenes médicas asociadas (la relación bidireccional no existe explícitamente en el esquema)
    const medicalOrders = await prisma.medicalOrder.findMany({
      where: { consultationId: id },
      include: { orderType: true, results: true }
    });

    res.json({ ...consultation, medicalOrders });
  } catch (error) {
    console.error('Error al obtener detalle de consulta:', error);
    res.status(500).json({ error: 'Error al recuperar la información clínica' });
  }
});

// Actualización Atómica de una consulta
app.post('/api/consultations/:id', async (req, res) => {
  const { id } = req.params;
  console.log('--- ACTUALIZANDO CONSULTA ---', id);
  const { reason, evolution, vitalSigns, gynecology, diagnoses, treatment } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar cabecera
      const consultation = await tx.consultation.update({
        where: { id },
        data: { reason, evolution }
      });

      // 2. Actualizar/Crear Signos Vitales
      if (vitalSigns) {
        await tx.consultationVitalSigns.upsert({
          where: { consultationId: id },
          create: { ...vitalSigns, consultationId: id },
          update: vitalSigns
        });
      }

      // 3. Actualizar/Crear Ginecología
      if (gynecology) {
        await tx.consultationGynecology.upsert({
          where: { consultationId: id },
          create: { 
            ...gynecology, 
            consultationId: id,
            fum: gynecology.fum ? new Date(gynecology.fum) : null,
            fpp: gynecology.fpp ? new Date(gynecology.fpp) : null,
            papUltimo: gynecology.papUltimo ? new Date(gynecology.papUltimo) : null,
            fechaUltimoParto: gynecology.fechaUltimoParto ? new Date(gynecology.fechaUltimoParto) : null
          },
          update: {
            ...gynecology,
            fum: gynecology.fum ? new Date(gynecology.fum) : null,
            fpp: gynecology.fpp ? new Date(gynecology.fpp) : null,
            papUltimo: gynecology.papUltimo ? new Date(gynecology.papUltimo) : null,
            fechaUltimoParto: gynecology.fechaUltimoParto ? new Date(gynecology.fechaUltimoParto) : null
          }
        });
      }

      // 4. Actualizar Tratamiento
      if (treatment) {
        await tx.consultationTreatment.upsert({
          where: { consultationId: id },
          create: { ...treatment, consultationId: id },
          update: treatment
        });
      }

      // 5. Actualizar Diagnósticos (Borrar y re-crear es más limpio para Many-to-Many simple)
      if (diagnoses) {
        await tx.consultationDiagnosis.deleteMany({ where: { consultationId: id } });
        if (diagnoses.length > 0) {
          await tx.consultationDiagnosis.createMany({
            data: diagnoses.map((d: any) => ({
              ...d,
              consultationId: id
            }))
          });
        }
      }

      return consultation;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error al actualizar consulta:', error);
    res.status(400).json({ error: 'Error al actualizar la información clínica' });
  }
});

// Guardado Atómico (Una sola transacción clínica)
app.post('/api/consultations', async (req, res) => {
  console.log('--- RECIBIENDO CONSULTA PARA GUARDAR ---');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  const { id, patientId, doctorId, type, reason, evolution, vitalSigns, gynecology, diagnoses, treatment } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear cabecera de consulta
      const consultation = await tx.consultation.create({
        data: {
          id, // Aceptamos el ID generado en el frontend (UUID)
          patientId,
          doctorId: doctorId || "default-doctor",
          type,
          reason,
          evolution
        }
      });

      // 2. Guardar Signos Vitales
      if (vitalSigns) {
        await tx.consultationVitalSigns.create({
          data: { ...vitalSigns, consultationId: consultation.id }
        });
      }

      // 3. Guardar Ginecología
      if (gynecology) {
        await tx.consultationGynecology.create({
          data: { 
            ...gynecology, 
            consultationId: consultation.id,
            fum: gynecology.fum ? new Date(gynecology.fum) : null,
            fpp: gynecology.fpp ? new Date(gynecology.fpp) : null,
            papUltimo: gynecology.papUltimo ? new Date(gynecology.papUltimo) : null,
            fechaUltimoParto: gynecology.fechaUltimoParto ? new Date(gynecology.fechaUltimoParto) : null
          }
        });
      }

      // 4. Guardar Tratamiento
      if (treatment) {
        await tx.consultationTreatment.create({
          data: { ...treatment, consultationId: consultation.id }
        });
      }

      // 5. Guardar Diagnósticos
      if (diagnoses && diagnoses.length > 0) {
        await tx.consultationDiagnosis.createMany({
          data: diagnoses.map((d: any) => ({
            ...d,
            consultationId: consultation.id
          }))
        });
      }

      return consultation;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('CRITICAL ERROR in Clinical Transaction:', error);
    // Devolver mensaje específico si es posible
    const message = error?.message || 'Error al persistir la consulta médica';
    res.status(400).json({ 
      error: message,
      details: error?.meta || {} 
    });
  }
});

// ==========================================
// MÓDULO DE ÓRDENES MÉDICAS
// ==========================================

// Obtener tipos de orden con su catálogo completo (Categorías -> Exámenes)
app.get('/api/order-types', async (req, res) => {
  console.log('--- GET /api/order-types ---');
  try {
    const types = await prisma.orderType.findMany({
      where: { active: true },
      include: {
        categories: {
          where: { active: true },
          include: {
            exams: {
              where: { active: true },
              include: {
                sampleType: true,
                preparations: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    console.log(`Encontrados ${types.length} tipos de orden.`);
    res.json(types);
  } catch (error) {
    console.error('Error fetching order types:', error);
    res.status(500).json({ error: 'Error al obtener tipos de orden' });
  }
});

// Obtener una orden específica por ID o Secuencial
app.get('/api/medical-orders/:id', async (req, res) => {
  const { id } = req.params;
  console.log('--- GET /api/medical-orders/:id ---', id);
  try {
    const order = await prisma.medicalOrder.findFirst({
      where: {
        OR: [
          { id },
          { secuencial: id }
        ]
      },
      include: {
        patient: true,
        orderType: true,
        items: {
          include: {
            exam: {
              include: {
                category: true,
                sampleType: true,
                preparations: true
              }
            }
          }
        },
        results: true
      }
    });

    if (!order) {
      console.warn('Orden no encontrada:', id);
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error al obtener la orden:', error);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// Guardar nueva orden médica
app.post('/api/medical-orders', async (req, res) => {
  console.log('--- POST /api/medical-orders ---');
  const { 
    patientId, 
    orderTypeId, 
    consultationId, 
    doctorId, 
    priority, 
    observations, 
    diagnosis,
    examIds // Array de IDs de exámenes seleccionados
  } = req.body;

  try {
    // Resolver el ID real del paciente si se envió el número de documento
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
    let targetPatientId = patientId;

    if (!isUUID) {
      const patient = await prisma.patient.findFirst({ where: { numeroDocumento: patientId } });
      if (!patient) return res.status(404).json({ error: 'Paciente no encontrado para esta identificación.' });
      targetPatientId = patient.id;
    }

    // Generar secuencial (ORD-YYYY-XXXX)
    const year = new Date().getFullYear();
    const count = await prisma.medicalOrder.count({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      }
    });
    const secuencial = `ORD-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const newOrder = await prisma.medicalOrder.create({
      data: {
        patientId: targetPatientId,
        orderTypeId,
        consultationId,
        doctorId: doctorId || 'dr-andres-morquecho',
        secuencial,
        priority: priority || 'Normal',
        observations,
        diagnosis,
        items: {
          create: examIds.map((examId: string) => ({
            examId,
            status: 'Pendiente'
          }))
        }
      },
      include: {
        items: {
          include: {
            exam: true
          }
        }
      }
    });

    console.log('Orden creada exitosamente:', secuencial);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating medical order:', error);
    res.status(500).json({ error: 'Error al crear la orden médica' });
  }
});

// Listar todas las órdenes (con filtros opcionales)
app.get('/api/medical-orders', async (req, res) => {
  const { patientId, type } = req.query;
  console.log('--- GET /api/medical-orders ---', { patientId, type });
  try {
    const orders = await prisma.medicalOrder.findMany({
      where: {
        ...(patientId ? { patientId: String(patientId) } : {}),
        ...(type ? { orderType: { slug: String(type) } } : {})
      },
      include: {
        patient: true,
        orderType: true,
        items: {
          include: {
            exam: true
          }
        },
        results: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    console.log(`Encontradas ${orders.length} órdenes.`);
    res.json(orders);
  } catch (error) {
    console.error('Error al listar órdenes:', error);
    res.status(500).json({ error: 'Error al listar órdenes' });
  }
});

// Actualizar orden existente
app.put('/api/medical-orders/:id', async (req, res) => {
  const { id } = req.params;
  const { priority, observations, diagnosis, examIds } = req.body;
  console.log('--- PUT /api/medical-orders/:id ---', id, { priority, examIds });

  try {
    // Actualizar datos básicos
    const updatedOrder = await prisma.medicalOrder.update({
      where: { id },
      data: {
        priority,
        observations,
        diagnosis,
        // Sincronizar ítems (borrar anteriores y crear nuevos es lo más simple para este caso)
        items: {
          deleteMany: {},
          create: examIds.map((examId: string) => ({
            examId,
            status: 'Pendiente'
          }))
        }
      },
      include: {
        items: {
          include: {
            exam: true
          }
        },
        results: true
      }
    });

    console.log('Orden actualizada exitosamente:', id);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error al actualizar la orden:', error);
    res.status(500).json({ error: 'Error al actualizar la orden médica' });
  }
});

// Subir resultados de una orden
app.post('/api/medical-orders/:id/results', upload.array('files', 5), async (req, res) => {
  const id = req.params.id as string;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No se subieron archivos' });
  }

  try {
    const resultsData = files.map(file => {
      // Corregir codificación de caracteres especiales (ñ, tildes) en el nombre original
      const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      return {
        orderId: id,
        url: `/uploads/results/${file.filename}`,
        filename: decodedFilename,
        fileType: file.mimetype
      };
    });

    // Guardar resultados y actualizar estado de la orden
    const [_, updatedOrder] = await prisma.$transaction([
      prisma.orderResult.createMany({
        data: resultsData
      }),
      prisma.medicalOrder.update({
        where: { id },
        data: { 
          status: 'Resultado subido'
        },
        include: {
          results: true
        }
      })
    ]);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error al subir resultados:', error);
    res.status(500).json({ error: 'Error al procesar los archivos de resultados' });
  }
});

// Eliminar un resultado específico
app.delete('/api/medical-orders/:orderId/results/:resultId', async (req, res) => {
  const { orderId, resultId } = req.params;

  try {
    const result = await prisma.orderResult.findUnique({
      where: { id: resultId }
    });

    if (!result) {
      return res.status(404).json({ error: 'Resultado no encontrado' });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '..', result.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar de BD
    await prisma.orderResult.delete({
      where: { id: resultId }
    });

    // Verificar si quedan resultados
    const remainingResults = await prisma.orderResult.count({
      where: { orderId }
    });

    // Si no quedan resultados, volver a estado Pendiente
    if (remainingResults === 0) {
      await prisma.medicalOrder.update({
        where: { id: orderId },
        data: { status: 'Pendiente' }
      });
    }

    res.json({ message: 'Resultado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar resultado:', error);
    res.status(500).json({ error: 'Error al eliminar el archivo' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor clínico corriendo en http://0.0.0.0:${PORT}`);
  console.log('Rutas de órdenes registradas correctamente.');
});
