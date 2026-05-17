import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  DEFAULT_SITE_CONFIG,
  SITE_SETTINGS_ID,
  mergeSiteConfigPatch,
  normalizeSiteConfig,
} from './site-config';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const BUSINESS_SETTINGS_ID = 'default';

const defaultBusinessSettingsData = {
  clinicName: null as string | null,
  taxId: null as string | null,
  address: null as string | null,
  phone: null as string | null,
  email: null as string | null,
  logoUrl: null as string | null,
  reportHeader: null as string | null,
  reportFooter: null as string | null,
  billingSeries: 'FAC',
  billingNextNumber: 1,
  currency: 'USD',
  recipeDoctorName: 'Dra. Ana García',
  recipeDoctorSpecialty: 'Ginecología y Obstetricia',
  recipeDoctorAcess: '7456-2026',
  recipeDefaultCity: 'Quito',
  recipeDefaultAllergies: 'Ninguna conocida',
  recipeDefaultValidityDays: '3',
  recipeLogoUrl: null as string | null,
};

function serializeBusinessSettings(row: {
  id: string;
  clinicName: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  reportHeader: string | null;
  reportFooter: string | null;
  billingSeries: string | null;
  billingNextNumber: number;
  currency: string;
  recipeDoctorName: string | null;
  recipeDoctorSpecialty: string | null;
  recipeDoctorAcess: string | null;
  recipeDefaultCity: string | null;
  recipeDefaultAllergies: string | null;
  recipeDefaultValidityDays: string | null;
  recipeLogoUrl: string | null;
}) {
  return {
    id: row.id,
    clinicName: row.clinicName,
    taxId: row.taxId,
    address: row.address,
    phone: row.phone,
    email: row.email,
    logoUrl: row.logoUrl,
    reportHeader: row.reportHeader,
    reportFooter: row.reportFooter,
    billingSeries: row.billingSeries,
    billingNextNumber: row.billingNextNumber,
    currency: row.currency,
    recipeDoctorName: row.recipeDoctorName,
    recipeDoctorSpecialty: row.recipeDoctorSpecialty,
    recipeDoctorAcess: row.recipeDoctorAcess,
    recipeDefaultCity: row.recipeDefaultCity,
    recipeDefaultAllergies: row.recipeDefaultAllergies,
    recipeDefaultValidityDays: row.recipeDefaultValidityDays,
    recipeLogoUrl: row.recipeLogoUrl,
  };
}

async function getOrCreateBusinessSettings() {
  const existing = await prisma.businessSettings.findUnique({
    where: { id: BUSINESS_SETTINGS_ID },
  });
  if (existing) return existing;

  return prisma.businessSettings.create({
    data: {
      id: BUSINESS_SETTINGS_ID,
      ...defaultBusinessSettingsData,
    },
  });
}

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
  } catch (error: any) {
    console.error('Error fetching patients DETAIL:', error?.message, error?.code);
    res.status(500).json({ error: 'Error fetching patients', detail: error?.message });
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
        include: {
          consultations: {
            orderBy: { date: 'desc' },
            include: {
              vitalSigns: true,
              gynecology: true
            }
          }
        }
      });
    } 
    
    if (!patient) {
      console.log('Buscando por Numero de Documento...');
      patient = await prisma.patient.findFirst({
        where: { numeroDocumento: id },
        include: {
          consultations: {
            orderBy: { date: 'desc' },
            include: {
              vitalSigns: true,
              gynecology: true
            }
          }
        }
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
    const { gestas, partos, cesareas, abortos, ...rest } = data;
    const formattedData = {
      ...rest,
      fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : new Date(),
      fechaRegistro: data.fechaRegistro ? new Date(data.fechaRegistro) : new Date(),
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
    const { gestas, partos, cesareas, abortos, ...rest } = data;
    const formattedData: any = { ...rest };
    if (data.fechaNacimiento) formattedData.fechaNacimiento = new Date(data.fechaNacimiento);
    if (data.fechaRegistro) formattedData.fechaRegistro = new Date(data.fechaRegistro);

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

function parseDateSafely(val: any): Date | null {
  if (!val) return null;
  
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // Try standard parse
  let d = new Date(val);
  if (!isNaN(d.getTime())) return d;

  // Try Spanish format like "19 de febrero de 2027"
  if (typeof val === 'string') {
    const months: { [key: string]: number } = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };
    
    // Match "DD de MONTH de YYYY" (case insensitive)
    const match = val.toLowerCase().match(/(\d+)\s+de\s+([a-zñ]+)\s+de\s+(\d+)/);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthName = match[2];
      const year = parseInt(match[3], 10);
      if (months[monthName] !== undefined) {
        const parsed = new Date(year, months[monthName], day);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
  }

  return null;
}

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
        lastWeight: last?.vitalSigns?.weight || '',
        lastPressure: last?.vitalSigns?.pressure || '',
        consecutive: (await prisma.consultation.count({ where: { patientId: patient.id } })) + 1
      },
      // Estado inicial vacío para la nueva consulta
      initialState: {
        type: "Consulta Ginecología",
        reason: last?.treatment?.followUp ? `SEGUIMIENTO: ${last.treatment.followUp}` : '',
        evolution: '',
        vitalSigns: {
          weight: '', pressure: '', heartRate: '', respRate: '', temp: '', saturacion: '', bmi: ''
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
      // 3. Actualizar/Crear Ginecología
      if (gynecology) {
        const { fechaUltimoParto, ...gynecologyRest } = gynecology;
        await tx.consultationGynecology.upsert({
          where: { consultationId: id },
          create: { 
            ...gynecologyRest,
            consultationId: id,
            fum: parseDateSafely(gynecology.fum),
            fpp: parseDateSafely(gynecology.fpp),
            papUltimo: parseDateSafely(gynecology.papUltimo)
          },
          update: {
            ...gynecologyRest,
            fum: parseDateSafely(gynecology.fum),
            fpp: parseDateSafely(gynecology.fpp),
            papUltimo: parseDateSafely(gynecology.papUltimo)
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
        const { fechaUltimoParto, ...gynecologyRest } = gynecology;
        await tx.consultationGynecology.create({
          data: { 
            ...gynecologyRest, 
            consultationId: consultation.id,
            fum: parseDateSafely(gynecology.fum),
            fpp: parseDateSafely(gynecology.fpp),
            papUltimo: parseDateSafely(gynecology.papUltimo)
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

// Eliminar una orden médica completa
app.delete('/api/medical-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar todos los resultados asociados para eliminar sus archivos físicos
    const results = await prisma.orderResult.findMany({
      where: { orderId: id }
    });

    for (const result of results) {
      const filePath = path.join(__dirname, '..', result.url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error al eliminar archivo físico ${filePath}:`, err);
        }
      }
    }

    // Eliminar la orden (ítems y registros de resultados se eliminan por cascade en BD)
    await prisma.medicalOrder.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error al eliminar la orden médica:', error);
    res.status(500).json({ error: 'Error al eliminar la orden médica' });
  }
});


// ==========================================
// MÓDULO DE EMBARAZOS Y OBSTETRICIA
// ==========================================

// Helper: calcular FPP con Regla de Naegele
function calcularFPP(fum: Date): Date {
  const fpp = new Date(fum);
  fpp.setDate(fpp.getDate() + 7);
  fpp.setMonth(fpp.getMonth() - 3);
  fpp.setFullYear(fpp.getFullYear() + 1);
  return fpp;
}

// Helper: calcular EG en semanas
function calcularEG(fum: Date): number {
  const hoy = new Date();
  const diffMs = hoy.getTime() - fum.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return parseFloat((diffDays / 7).toFixed(1));
}

// Helper: calcular nivel de riesgo
function calcularNivelRiesgo(score: number): string {
  if (score === 0) return 'sin_riesgo';
  if (score <= 3)  return 'bajo';
  if (score <= 7)  return 'alto';
  return 'muy_alto';
}

// ─── Embarazos ────────────────────────────────────────────────────────────────

// Lista todos los embarazos de una paciente
app.get('/api/patients/:patientId/pregnancies', async (req, res) => {
  try {
    const { patientId } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
    const patient = await prisma.patient.findFirst({
      where: isUUID ? { id: patientId } : { numeroDocumento: patientId }
    });
    if (!patient) return res.status(404).json({ message: 'Paciente no encontrada' });

    const pregnancies = await prisma.pregnancy.findMany({
      where: { patientId: patient.id },
      include: {
        controls: { orderBy: { controlDate: 'desc' }, take: 1 },
        risks: true,
        _count: { select: { controls: true, echographies: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pregnancies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener embarazos' });
  }
});

// Lista de embarazos activos (para dashboard de obstetricia)
app.get('/api/pregnancies/active-list', async (req, res) => {
  try {
    const pregnancies = await prisma.pregnancy.findMany({
      where: { status: 'activo' },
      include: {
        patient: { select: { id: true, nombres: true, apellidos: true, numeroDocumento: true, fechaNacimiento: true, tipoSanguineo: true, alergias: true } },
        controls: { orderBy: { controlDate: 'desc' }, take: 1 },
        _count: { select: { controls: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pregnancies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener lista de embarazos activos' });
  }
});

// Embarazo activo de una paciente
app.get('/api/patients/:patientId/pregnancies/active', async (req, res) => {
  try {
    const { patientId } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
    const patient = await prisma.patient.findFirst({
      where: isUUID ? { id: patientId } : { numeroDocumento: patientId }
    });
    if (!patient) return res.status(404).json({ message: 'Paciente no encontrada' });

    const pregnancy = await prisma.pregnancy.findFirst({
      where: { patientId: patient.id, status: 'activo' },
      include: {
        controls: { orderBy: { controlDate: 'desc' } },
        risks: true,
        echographies: { orderBy: { studyDate: 'desc' } }
      }
    });
    if (!pregnancy) return res.status(404).json({ message: 'No hay embarazo activo' });
    res.json(pregnancy);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener embarazo activo' });
  }
});

// Detalle completo de un embarazo
app.get('/api/pregnancies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pregnancy = await prisma.pregnancy.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, nombres: true, apellidos: true, numeroDocumento: true, fechaNacimiento: true, tipoSanguineo: true, alergias: true, antecedentes: true } },
        controls: { orderBy: { controlDate: 'desc' } },
        risks: { orderBy: { createdAt: 'asc' } },
        echographies: { orderBy: { studyDate: 'desc' } }
      }
    });
    if (!pregnancy) return res.status(404).json({ message: 'Embarazo no encontrado' });
    res.json(pregnancy);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener embarazo' });
  }
});

// Iniciar un nuevo embarazo
app.post('/api/pregnancies', async (req, res) => {
  try {
    const { patientId, fum, initialWeight, initialHeight, bloodType, rh, notes } = req.body;
    if (!patientId || !fum) return res.status(400).json({ error: 'patientId y fum son requeridos' });

    // Verificar que no haya embarazo activo
    const existing = await prisma.pregnancy.findFirst({
      where: { patientId, status: 'activo' }
    });
    if (existing) return res.status(409).json({ error: 'La paciente ya tiene un embarazo activo', pregnancyId: existing.id });

    const fumDate = parseDateSafely(fum);
    if (!fumDate) return res.status(400).json({ error: 'La fecha FUM proporcionada no es válida' });
    const fppDate = calcularFPP(fumDate);
    const egInitial = calcularEG(fumDate);
    const imc = initialWeight && initialHeight
      ? parseFloat((initialWeight / Math.pow(initialHeight / 100, 2)).toFixed(1))
      : undefined;

    const pregnancy = await prisma.pregnancy.create({
      data: {
        patientId,
        fum: fumDate,
        fpp: fppDate,
        egInitial,
        initialWeight: initialWeight ? parseFloat(initialWeight) : undefined,
        initialHeight: initialHeight ? parseFloat(initialHeight) : undefined,
        initialImc: imc,
        bloodType,
        rh,
        notes
      },
      include: { controls: true, risks: true, echographies: true }
    });
    res.status(201).json(pregnancy);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al crear embarazo' });
  }
});

// Actualizar embarazo (estado, notas, etc.)
app.patch('/api/pregnancies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data: any = { ...req.body };
    if (data.fum) {
      const parsedFum = parseDateSafely(data.fum);
      if (!parsedFum) return res.status(400).json({ error: 'La fecha FUM proporcionada no es válida' });
      data.fum = parsedFum;
    }
    if (data.status === 'cerrado' && !data.closedAt) data.closedAt = new Date();

    const pregnancy = await prisma.pregnancy.update({
      where: { id },
      data,
      include: { controls: true, risks: true, echographies: true }
    });
    res.json(pregnancy);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar embarazo' });
  }
});

// ─── Controles Prenatales ─────────────────────────────────────────────────────

// Lista controles de un embarazo
app.get('/api/pregnancies/:pregnancyId/controls', async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    const controls = await prisma.prenatalControl.findMany({
      where: { pregnancyId },
      orderBy: { controlDate: 'desc' }
    });
    res.json(controls);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener controles' });
  }
});

// Registrar nuevo control prenatal
app.post('/api/pregnancies/:pregnancyId/controls', async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    const {
      controlDate, gestationalAge, maternalWeight, bloodPressure,
      temperature, fetalHeartRate, uterineHeight, edema,
      fetalMovements, contractions, observations, plan
    } = req.body;

    if (gestationalAge === undefined) return res.status(400).json({ error: 'gestationalAge es requerido' });

    const control = await prisma.prenatalControl.create({
      data: {
        pregnancyId,
        controlDate: controlDate ? new Date(controlDate) : new Date(),
        gestationalAge: parseFloat(gestationalAge),
        maternalWeight: maternalWeight ? parseFloat(maternalWeight) : undefined,
        bloodPressure,
        temperature: temperature ? parseFloat(temperature) : undefined,
        fetalHeartRate: fetalHeartRate ? parseInt(fetalHeartRate) : undefined,
        uterineHeight: uterineHeight ? parseInt(uterineHeight) : undefined,
        edema,
        fetalMovements,
        contractions,
        observations,
        plan
      }
    });
    res.status(201).json(control);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al registrar control' });
  }
});

// Actualizar control prenatal
app.patch('/api/prenatal-controls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data: any = { ...req.body };
    if (data.controlDate) data.controlDate = new Date(data.controlDate);
    if (data.gestationalAge !== undefined) data.gestationalAge = parseFloat(data.gestationalAge);
    if (data.maternalWeight !== undefined) data.maternalWeight = parseFloat(data.maternalWeight);
    if (data.fetalHeartRate !== undefined) data.fetalHeartRate = parseInt(data.fetalHeartRate);
    if (data.uterineHeight !== undefined) data.uterineHeight = parseInt(data.uterineHeight);

    const control = await prisma.prenatalControl.update({ where: { id }, data });
    res.json(control);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar control' });
  }
});

// ─── Riesgos Obstétricos ──────────────────────────────────────────────────────

// Lista riesgos de un embarazo
app.get('/api/pregnancies/:pregnancyId/risks', async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    const risks = await prisma.pregnancyRisk.findMany({
      where: { pregnancyId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(risks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener riesgos' });
  }
});

// Agregar factor de riesgo y recalcular nivel
app.post('/api/pregnancies/:pregnancyId/risks', async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    const { riskName, riskScore, notes } = req.body;

    const risk = await prisma.pregnancyRisk.create({
      data: { pregnancyId, riskName, riskScore: parseInt(riskScore) || 1, notes }
    });

    // Recalcular score total y nivel del embarazo
    const allRisks = await prisma.pregnancyRisk.findMany({ where: { pregnancyId } });
    const totalScore = allRisks.reduce((sum, r) => sum + r.riskScore, 0);
    const riskLevel = calcularNivelRiesgo(totalScore);
    await prisma.pregnancy.update({ where: { id: pregnancyId }, data: { riskScore: totalScore, riskLevel } });

    res.status(201).json(risk);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al agregar riesgo' });
  }
});

// Eliminar factor de riesgo y recalcular
app.delete('/api/pregnancy-risks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const risk = await prisma.pregnancyRisk.findUnique({ where: { id } });
    if (!risk) return res.status(404).json({ message: 'Riesgo no encontrado' });

    await prisma.pregnancyRisk.delete({ where: { id } });

    const remaining = await prisma.pregnancyRisk.findMany({ where: { pregnancyId: risk.pregnancyId } });
    const totalScore = remaining.reduce((sum, r) => sum + r.riskScore, 0);
    const riskLevel = calcularNivelRiesgo(totalScore);
    await prisma.pregnancy.update({ where: { id: risk.pregnancyId }, data: { riskScore: totalScore, riskLevel } });

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar riesgo' });
  }
});

// ─── Ecografías ───────────────────────────────────────────────────────────────

// Lista ecografías de un embarazo
app.get('/api/pregnancies/:pregnancyId/echographies', async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    const echographies = await prisma.pregnancyEchography.findMany({
      where: { pregnancyId },
      orderBy: { studyDate: 'desc' }
    });
    res.json(echographies);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ecografías' });
  }
});

// Registrar nueva ecografía
app.post('/api/pregnancies/:pregnancyId/echographies', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    const { studyDate, studyType, gestationalAge, studyName, report, doctorName } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const pdfUrl = files?.pdf?.[0]
      ? `/uploads/results/${files.pdf[0].filename}`
      : undefined;
    const images = files?.images?.map(f => `/uploads/results/${f.filename}`) || [];

    const echo = await prisma.pregnancyEchography.create({
      data: {
        pregnancyId: pregnancyId as string,
        studyDate: new Date(studyDate),
        studyType: studyType || 'otro',
        gestationalAge: gestationalAge ? parseFloat(gestationalAge) : undefined,
        studyName,
        report,
        doctorName,
        pdfUrl,
        images
      }
    });
    res.status(201).json(echo);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al registrar ecografía' });
  }
});

// ==========================================
// CONFIGURACIÓN DE LA LANDING (sitio público)
// ==========================================

async function getOrCreateSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (existing) {
    return {
      ...existing,
      config: normalizeSiteConfig(existing.config),
    };
  }

  const config = normalizeSiteConfig(DEFAULT_SITE_CONFIG);
  return prisma.siteSettings.create({
    data: {
      id: SITE_SETTINGS_ID,
      config: config as object,
    },
  }).then((row) => ({
    ...row,
    config,
  }));
}

app.get('/api/site-config', async (_req, res) => {
  try {
    const row = await getOrCreateSiteSettings();
    res.json(normalizeSiteConfig(row.config));
  } catch (error) {
    console.error('Error al obtener configuración del sitio:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del sitio' });
  }
});

app.post('/api/site-config', async (req, res) => {
  try {
    const currentRow = await getOrCreateSiteSettings();
    const current = normalizeSiteConfig(currentRow.config);
    const next = req.body?.reset === true
      ? normalizeSiteConfig(DEFAULT_SITE_CONFIG)
      : mergeSiteConfigPatch(current, req.body);

    const saved = await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        config: next as object,
      },
      update: {
        config: next as object,
      },
    });

    res.json(normalizeSiteConfig(saved.config));
  } catch (error) {
    console.error('Error al guardar configuración del sitio:', error);
    res.status(500).json({ error: 'Error al guardar la configuración del sitio' });
  }
});

// ==========================================
// CONFIGURACIÓN DE CLÍNICA
// ==========================================

app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await getOrCreateBusinessSettings();
    res.json(serializeBusinessSettings(settings));
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const {
      clinicName,
      taxId,
      address,
      phone,
      email,
      logoUrl,
      reportHeader,
      reportFooter,
      billingSeries,
      billingNextNumber,
      currency,
      recipeDoctorName,
      recipeDoctorSpecialty,
      recipeDoctorAcess,
      recipeDefaultCity,
      recipeDefaultAllergies,
      recipeDefaultValidityDays,
      recipeLogoUrl,
    } = req.body ?? {};

    const data: Record<string, unknown> = {};
    if (clinicName !== undefined) data.clinicName = clinicName ?? null;
    if (taxId !== undefined) data.taxId = taxId ?? null;
    if (address !== undefined) data.address = address ?? null;
    if (phone !== undefined) data.phone = phone ?? null;
    if (email !== undefined) data.email = email ?? null;
    if (logoUrl !== undefined) data.logoUrl = logoUrl ?? null;
    if (reportHeader !== undefined) data.reportHeader = reportHeader ?? null;
    if (reportFooter !== undefined) data.reportFooter = reportFooter ?? null;
    if (billingSeries !== undefined) data.billingSeries = billingSeries ?? null;
    if (billingNextNumber !== undefined) {
      const parsed = Number(billingNextNumber);
      data.billingNextNumber = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 1;
    }
    if (currency !== undefined && typeof currency === 'string' && currency.trim()) {
      data.currency = currency.trim();
    }
    if (recipeDoctorName !== undefined) data.recipeDoctorName = recipeDoctorName ?? null;
    if (recipeDoctorSpecialty !== undefined) data.recipeDoctorSpecialty = recipeDoctorSpecialty ?? null;
    if (recipeDoctorAcess !== undefined) data.recipeDoctorAcess = recipeDoctorAcess ?? null;
    if (recipeDefaultCity !== undefined) data.recipeDefaultCity = recipeDefaultCity ?? null;
    if (recipeDefaultAllergies !== undefined) data.recipeDefaultAllergies = recipeDefaultAllergies ?? null;
    if (recipeDefaultValidityDays !== undefined) data.recipeDefaultValidityDays = recipeDefaultValidityDays ?? null;
    if (recipeLogoUrl !== undefined) data.recipeLogoUrl = recipeLogoUrl ?? null;

    const settings = await prisma.businessSettings.upsert({
      where: { id: BUSINESS_SETTINGS_ID },
      create: {
        id: BUSINESS_SETTINGS_ID,
        ...defaultBusinessSettingsData,
        ...data,
      },
      update: data,
    });

    res.json(serializeBusinessSettings(settings));
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({ error: 'Error al guardar la configuración' });
  }
});

// ==========================================
// MEDICAMENTOS Y CONFIGURACIONES DE RECETA
// ==========================================

const DEFAULT_MEDICINES = [
  {
    genericName: 'Paracetamol',
    brandNames: ['Termofin', 'Umbral', 'Tempra'],
    presentations: ['Tableta', 'Jarabe', 'Gotas'],
    concentrations: ['500 mg', '1 g', '120 mg / 5 mL'],
    defaultDose: '1 tableta',
    defaultFrequency: 'Cada 8 horas',
    defaultDuration: '3 días',
    defaultRoute: 'Oral'
  },
  {
    genericName: 'Ibuprofeno',
    brandNames: ['Advil', 'Motrin', 'Actron'],
    presentations: ['Cápsula blanda', 'Tableta', 'Suspensión'],
    concentrations: ['400 mg', '600 mg', '800 mg'],
    defaultDose: '1 cápsula',
    defaultFrequency: 'Cada 8 horas',
    defaultDuration: '5 días',
    defaultRoute: 'Oral'
  },
  {
    genericName: 'Ácido Fólico',
    brandNames: ['Folifem', 'Folivital', 'Folidex'],
    presentations: ['Tableta'],
    concentrations: ['1 mg', '5 mg'],
    defaultDose: '1 tableta',
    defaultFrequency: 'Cada 24 horas (mañana)',
    defaultDuration: '30 días',
    defaultRoute: 'Oral'
  },
  {
    genericName: 'Hierro + Ácido Fólico',
    brandNames: ['Maltofer Fol', 'Ferro-Folic', 'Intrafer'],
    presentations: ['Tableta masticable', 'Cápsula'],
    concentrations: ['100 mg / 0.35 mg'],
    defaultDose: '1 tableta',
    defaultFrequency: 'Cada 24 horas (noche)',
    defaultDuration: '60 días',
    defaultRoute: 'Oral'
  },
  {
    genericName: 'Clotrimazol',
    brandNames: ['Canesten', 'Gine-Canesten', 'Clotrimed'],
    presentations: ['Óvulo vaginal', 'Crema vaginal'],
    concentrations: ['100 mg', '500 mg', '2% crema'],
    defaultDose: '1 óvulo',
    defaultFrequency: 'Cada 24 horas (antes de acostarse)',
    defaultDuration: '6 días',
    defaultRoute: 'Vaginal'
  },
  {
    genericName: 'Progesterona',
    brandNames: ['Utrogestan', 'Geslutin', 'Progendo'],
    presentations: ['Cápsula blanda'],
    concentrations: ['100 mg', '200 mg'],
    defaultDose: '1 cápsula',
    defaultFrequency: 'Cada 24 horas (antes de acostarse)',
    defaultDuration: '14 días',
    defaultRoute: 'Vaginal'
  }
];

async function seedMedicinesIfEmpty() {
  try {
    const count = await (prisma as any).medicine.count();
    if (count === 0) {
      console.log('Seeding default medicines...');
      for (const med of DEFAULT_MEDICINES) {
        await (prisma as any).medicine.create({ data: med });
      }
      console.log('Seed of medicines completed successfully.');
    }
  } catch (err) {
    console.error('Error seeding medicines:', err);
  }
}

app.get('/api/medicines', async (req, res) => {
  try {
    await seedMedicinesIfEmpty();
    const list = await (prisma as any).medicine.findMany({
      orderBy: { genericName: 'asc' }
    });
    res.json(list);
  } catch (error) {
    console.error('Error listing medicines:', error);
    res.status(500).json({ error: 'Error al listar los medicamentos' });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const {
      genericName,
      brandNames,
      presentations,
      concentrations,
      defaultDose,
      defaultFrequency,
      defaultDuration,
      defaultRoute
    } = req.body ?? {};

    if (!genericName || typeof genericName !== 'string' || !genericName.trim()) {
      return res.status(400).json({ error: 'El nombre genérico es requerido' });
    }

    const created = await (prisma as any).medicine.create({
      data: {
        genericName: genericName.trim(),
        brandNames: Array.isArray(brandNames) ? brandNames : [],
        presentations: Array.isArray(presentations) ? presentations : [],
        concentrations: Array.isArray(concentrations) ? concentrations : [],
        defaultDose: defaultDose ?? null,
        defaultFrequency: defaultFrequency ?? null,
        defaultDuration: defaultDuration ?? null,
        defaultRoute: defaultRoute ?? null
      }
    });

    res.json(created);
  } catch (error: any) {
    console.error('Error creating medicine:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un medicamento con ese nombre genérico' });
    }
    res.status(500).json({ error: 'Error al crear el medicamento' });
  }
});

app.put('/api/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      genericName,
      brandNames,
      presentations,
      concentrations,
      defaultDose,
      defaultFrequency,
      defaultDuration,
      defaultRoute
    } = req.body ?? {};

    const updated = await (prisma as any).medicine.update({
      where: { id },
      data: {
        genericName: genericName ? genericName.trim() : undefined,
        brandNames: Array.isArray(brandNames) ? brandNames : undefined,
        presentations: Array.isArray(presentations) ? presentations : undefined,
        concentrations: Array.isArray(concentrations) ? concentrations : undefined,
        defaultDose: defaultDose !== undefined ? defaultDose : undefined,
        defaultFrequency: defaultFrequency !== undefined ? defaultFrequency : undefined,
        defaultDuration: defaultDuration !== undefined ? defaultDuration : undefined,
        defaultRoute: defaultRoute !== undefined ? defaultRoute : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ error: 'Error al actualizar el medicamento' });
  }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await (prisma as any).medicine.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ error: 'Error al eliminar el medicamento' });
  }
});

// ==========================================
// MÓDULO DE PRESCRIPCIONES / RECETAS
// ==========================================

app.get('/api/prescriptions', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const patientId = (req.query.patientId as string) || '';

    const where: any = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: 'insensitive' } },
        { secuencial: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'Todos los Estados') {
      let statusMapped = status;
      if (status === 'Emitidas' || status === 'Emitida') statusMapped = 'Emitida';
      if (status === 'Vencidas' || status === 'Vencida') statusMapped = 'Vencida';
      if (status === 'Anuladas' || status === 'Anulada') statusMapped = 'Anulada';
      where.status = statusMapped;
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prescription.count({ where })
    ]);

    res.json({
      data: prescriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error?.message);
    res.status(500).json({ error: 'Error fetching prescriptions', detail: error?.message });
  }
});

app.post('/api/prescriptions', async (req, res) => {
  try {
    const body = req.body;
    
    const newPrescription = await prisma.prescription.create({
      data: {
        secuencial: body.secuencial || body.id || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: body.date || new Date().toLocaleDateString('es-EC'),
        patientId: body.patientId,
        patientName: body.patientName,
        medicinesCount: body.medicinesCount || (body.medicines ? body.medicines.length : 0),
        status: body.status || 'Emitida',
        medicines: body.medicines || [],
        vigencia: body.vigencia || '3',
        vigenciaTipo: body.vigenciaTipo || 'Días',
        diagnostico: body.diagnostico || '',
        cie10: body.cie10 || '',
        alergias: body.alergias || 'Ninguna conocida',
        doctor: body.doctor || {}
      }
    });

    res.status(201).json(newPrescription);
  } catch (error: any) {
    console.error('Error creating prescription:', error?.message);
    res.status(500).json({ error: 'Error creating prescription', detail: error?.message });
  }
});

/* ==================================================
   APPOINTMENTS (AGENDA) CRUD ENDPOINTS
   ================================================== */

app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });
    res.json(appointments);
  } catch (error: any) {
    console.error('Error fetching appointments:', error?.message);
    res.status(500).json({ error: 'Error fetching appointments', detail: error?.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const body = req.body;
    const newAppointment = await prisma.appointment.create({
      data: {
        date: body.date,
        time: body.time,
        patientName: body.patientName,
        patientAge: body.patientAge || '30',
        doctorName: body.doctorName,
        reason: body.reason || 'Consulta General',
        type: body.type || 'Consulta',
        status: body.status || 'Agendada'
      }
    });
    res.status(201).json(newAppointment);
  } catch (error: any) {
    console.error('Error creating appointment:', error?.message);
    res.status(500).json({ error: 'Error creating appointment', detail: error?.message });
  }
});

app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    // Build update payload dynamically
    const updateData: any = {};
    if (body.date !== undefined) updateData.date = body.date;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.patientName !== undefined) updateData.patientName = body.patientName;
    if (body.patientAge !== undefined) updateData.patientAge = body.patientAge;
    if (body.doctorName !== undefined) updateData.doctorName = body.doctorName;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData
    });
    res.json(updatedAppointment);
  } catch (error: any) {
    console.error('Error updating appointment:', error?.message);
    res.status(500).json({ error: 'Error updating appointment', detail: error?.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting appointment:', error?.message);
    res.status(500).json({ error: 'Error deleting appointment', detail: error?.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor clínico corriendo en http://0.0.0.0:${PORT}`);
  console.log('Rutas de órdenes registradas correctamente.');
  console.log('Módulo de embarazos y obstetricia activo.');
});

