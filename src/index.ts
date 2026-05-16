import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
app.get('/api/patients/:id/consultations', async (req, res) => {
  try {
    const { id } = req.params;
    const consultations = await prisma.consultation.findMany({
      where: { patientId: id },
      orderBy: { date: 'desc' },
    });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching consultations' });
  }
});

app.post('/api/consultations', async (req, res) => {
  try {
    const data = req.body;
    const consultation = await prisma.consultation.create({
      data: {
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
    res.status(201).json(consultation);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error creating consultation' });
  }
});

app.delete('/api/consultations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.consultation.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
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

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
