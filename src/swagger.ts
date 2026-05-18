export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GineCare API - Suite Clínica de Ginecología y Obstetricia',
    version: '1.0.0',
    description: 'Documentación oficial interactiva de la API backend de GineCare. Permite gestionar pacientes, historias clínicas, consultas, embarazos obstétricos, recetas médicas, citas y catálogos de exámenes.',
    contact: {
      name: 'Equipo de Soporte de GineCare',
      email: 'soporte@ginecare.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Servidor de Desarrollo Local'
    }
  ],
  tags: [
    { name: 'Autenticación y Usuarios', description: 'Operaciones para iniciar sesión, crear usuarios, editar perfiles y gestionar contraseñas.' },
    { name: 'Pacientes', description: 'Registro, edición, eliminación y listado de la ficha general de pacientes.' },
    { name: 'Consultas Médicas', description: 'Gestión atómica y transversal de actos médicos ginecológicos generales.' },
    { name: 'Embarazos y Control Prenatal', description: 'Monitoreo longitudinal de gestaciones, ecografías, riesgos obstétricos y controles prenatales.' },
    { name: 'Recetas Médicas', description: 'Operaciones CRUD para prescripciones médicas de fármacos comerciales y genéricos.' },
    { name: 'Agenda y Citas', description: 'Planificación diaria y gestión del calendario de citas médicas.' },
    { name: 'Órdenes y Exámenes', description: 'Gestión de prescripciones de laboratorio, ecografías externas y carga de resultados en PDF.' },
    { name: 'Configuraciones', description: 'Ajustes globales de la clínica, membretes de recetas y datos del especialista.' }
  ],
  paths: {
    '/api/users/login': {
      post: {
        tags: ['Autenticación y Usuarios'],
        summary: 'Iniciar sesión en la aplicación',
        description: 'Autentica a un usuario administrativo mediante nombre de usuario y contraseña.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Autenticación exitosa',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'mock-jwt-token-string' }
                  }
                }
              }
            }
          },
          401: { description: 'Credenciales inválidas o contraseña incorrecta' }
        }
      }
    },
    '/api/users/create': {
      post: {
        tags: ['Autenticación y Usuarios'],
        summary: 'Registrar un nuevo usuario administrativo',
        description: 'Crea una nueva cuenta de especialista o asistente administrativo con correo electrónico y contraseña.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'morquecho' },
                  email: { type: 'string', example: 'andres@morquecho.com' },
                  password: { type: 'string', example: 'secreto123' },
                  nombres: { type: 'string', example: 'Andres' },
                  apellidos: { type: 'string', example: 'Morquecho' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuario creado exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          400: { description: 'El nombre de usuario o correo ya está en uso' }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['Autenticación y Usuarios'],
        summary: 'Obtener lista de usuarios registrados',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}': {
      patch: {
        tags: ['Autenticación y Usuarios'],
        summary: 'Actualizar perfil de usuario',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombres: { type: 'string' },
                  apellidos: { type: 'string' },
                  email: { type: 'string' },
                  status: { type: 'string', enum: ['Activo', 'Suspendido'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Usuario actualizado exitosamente' }
        }
      }
    },
    '/api/users/{id}/password': {
      patch: {
        tags: ['Autenticación y Usuarios'],
        summary: 'Cambiar la contraseña de un usuario',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  password: { type: 'string', example: 'nuevaContra123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Contraseña actualizada exitosamente' }
        }
      }
    },
    '/api/patients': {
      get: {
        tags: ['Pacientes'],
        summary: 'Listar pacientes con paginación y búsqueda',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Listado de pacientes obtenido con éxito',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Patient' } },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Pacientes'],
        summary: 'Registrar una nueva paciente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatientInput' }
            }
          }
        },
        responses: {
          201: {
            description: 'Paciente creada con éxito',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Patient' }
              }
            }
          }
        }
      }
    },
    '/api/patients/{id}': {
      get: {
        tags: ['Pacientes'],
        summary: 'Obtener detalle completo de una paciente',
        description: 'Busca por ID (UUID) o número de cédula/documento de identidad.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Patient' }
              }
            }
          },
          404: { description: 'Paciente no encontrada' }
        }
      },
      patch: {
        tags: ['Pacientes'],
        summary: 'Actualizar datos de una paciente',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatientInput' }
            }
          }
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Patient' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Pacientes'],
        summary: 'Eliminar una paciente (con cascada de datos)',
        description: 'Elimina permanentemente a la paciente y borra programáticamente todas sus recetas, citas, consultas y embarazos gestacionales en cascada.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          204: { description: 'Paciente y todos sus registros en cascada eliminados exitosamente' }
        }
      }
    },
    '/api/prescriptions': {
      get: {
        tags: ['Recetas Médicas'],
        summary: 'Listar prescripciones emitidas con paginación',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Prescription' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Recetas Médicas'],
        summary: 'Registrar una nueva receta médica',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PrescriptionInput' }
            }
          }
        },
        responses: {
          201: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Prescription' }
              }
            }
          }
        }
      }
    },
    '/api/prescriptions/{id}': {
      get: {
        tags: ['Recetas Médicas'],
        summary: 'Obtener detalle completo de una receta',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Prescription' }
              }
            }
          },
          404: { description: 'Receta no encontrada' }
        }
      },
      patch: {
        tags: ['Recetas Médicas'],
        summary: 'Actualizar una receta médica existente',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PrescriptionInput' }
            }
          }
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Prescription' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Recetas Médicas'],
        summary: 'Eliminar físicamente una receta médica',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          204: { description: 'Receta eliminada exitosamente' }
        }
      }
    },
    '/api/appointments': {
      get: {
        tags: ['Agenda y Citas'],
        summary: 'Listar citas médicas',
        description: 'Permite filtrar citas por fecha específica en formato YYYY-MM-DD.',
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string' }, example: '2026-05-18' }
        ],
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Agenda y Citas'],
        summary: 'Agendar una nueva cita médica',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['date', 'time', 'patientName', 'patientAge', 'doctorName', 'reason', 'type'],
                properties: {
                  date: { type: 'string', example: '2026-05-18' },
                  time: { type: 'string', example: '09:30' },
                  patientName: { type: 'string', example: 'Gabriela Ortiz' },
                  patientAge: { type: 'string', example: '29' },
                  doctorName: { type: 'string', example: 'Dr. Andres Morquecho' },
                  reason: { type: 'string', example: 'Control ginecológico anual' },
                  type: { type: 'string', example: 'Consulta Ginecología' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' }
              }
            }
          }
        }
      }
    },
    '/api/appointments/{id}': {
      patch: {
        tags: ['Agenda y Citas'],
        summary: 'Actualizar estado o datos de una cita',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['Agendada', 'Confirmada', 'Sala de espera', 'En consultorio', 'Finalizada', 'Cancelada'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Cita actualizada exitosamente' }
        }
      },
      delete: {
        tags: ['Agenda y Citas'],
        summary: 'Eliminar/Cancelar una cita médica',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          204: { description: 'Cita eliminada exitosamente' }
        }
      }
    },
    '/api/consultations': {
      post: {
        tags: ['Consultas Médicas'],
        summary: 'Guardar una nueva consulta clínica de forma atómica',
        description: 'Registra en una sola transacción la consulta, signos vitales, ginecología, tratamientos y diagnósticos en cascada.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConsultationInput' }
            }
          }
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Consultation' }
              }
            }
          }
        }
      }
    },
    '/api/settings': {
      get: {
        tags: ['Configuraciones'],
        summary: 'Obtener la configuración global de la clínica',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BusinessSettings' }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Configuraciones'],
        summary: 'Actualizar configuración global o membretes de receta',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BusinessSettings' }
            }
          }
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BusinessSettings' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          username: { type: 'string', example: 'admin' },
          email: { type: 'string', example: 'admin@clinic.com' },
          nombres: { type: 'string', example: 'Ana' },
          apellidos: { type: 'string', example: 'García' },
          status: { type: 'string', example: 'Activo' },
          createdAt: { type: 'string', example: '2026-05-18T10:00:00.000Z' }
        }
      },
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'patient-uuid' },
          nombres: { type: 'string', example: 'Ana Belén' },
          apellidos: { type: 'string', example: 'López Ortiz' },
          tipoDocumento: { type: 'string', example: 'Cédula' },
          numeroDocumento: { type: 'string', example: '1723456789' },
          fechaNacimiento: { type: 'string', example: '1998-05-12T00:00:00.000Z' },
          estadoCivil: { type: 'string', example: 'Soltera' },
          ocupacion: { type: 'string', example: 'Ingeniera Comercial' },
          telefono: { type: 'string', example: '0998765432' },
          email: { type: 'string', example: 'ana.lopez@email.com' },
          direccion: { type: 'string', example: 'Av. Gran Colombia y Tarqui' },
          ciudad: { type: 'string', example: 'Quito' }
        }
      },
      PatientInput: {
        type: 'object',
        required: ['nombres', 'apellidos', 'numeroDocumento', 'fechaNacimiento'],
        properties: {
          nombres: { type: 'string', example: 'Ana Belén' },
          apellidos: { type: 'string', example: 'López Ortiz' },
          tipoDocumento: { type: 'string', example: 'Cédula' },
          numeroDocumento: { type: 'string', example: '1723456789' },
          fechaNacimiento: { type: 'string', example: '1998-05-12' },
          estadoCivil: { type: 'string', example: 'Soltera' },
          ocupacion: { type: 'string', example: 'Docente' },
          telefono: { type: 'string', example: '0995544332' },
          email: { type: 'string', example: 'ana@email.com' }
        }
      },
      Prescription: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'prescription-uuid' },
          secuencial: { type: 'string', example: 'REC-2026-0045' },
          date: { type: 'string', example: '18/5/2026' },
          patientId: { type: 'string', example: '1723456789' },
          patientName: { type: 'string', example: 'Ana Belén López' },
          medicinesCount: { type: 'integer', example: 1 },
          status: { type: 'string', example: 'Emitida' },
          medicines: {
            type: 'array',
            items: { $ref: '#/components/schemas/PrescribedMedicine' }
          },
          diagnostico: { type: 'string', example: 'Control prenatal regular' },
          cie10: { type: 'string', example: 'Z34.0' },
          alergias: { type: 'string', example: 'Ninguna conocida' },
          doctor: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Dr. Andres Morquecho' },
              specialty: { type: 'string', example: 'Ginecología y Obstetricia' },
              acess: { type: 'string', example: '7456-2026' },
              clinic: { type: 'string', example: 'GineCentro Premium' }
            }
          }
        }
      },
      PrescriptionInput: {
        type: 'object',
        required: ['secuencial', 'patientId', 'patientName', 'medicines'],
        properties: {
          secuencial: { type: 'string', example: 'REC-2026-0045' },
          date: { type: 'string', example: '18/5/2026' },
          patientId: { type: 'string', example: '1723456789' },
          patientName: { type: 'string', example: 'Ana Belén López' },
          medicines: {
            type: 'array',
            items: { $ref: '#/components/schemas/PrescribedMedicine' }
          },
          vigencia: { type: 'string', example: '3' },
          vigenciaTipo: { type: 'string', example: 'Días' },
          diagnostico: { type: 'string', example: 'Control de rutina' },
          cie10: { type: 'string', example: 'Z34.0' },
          alergias: { type: 'string', example: 'Ninguna conocida' }
        }
      },
      PrescribedMedicine: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'med-uuid' },
          generic: { type: 'string', example: 'Clotrimazol' },
          brandName: { type: 'string', example: 'CANESTEN' },
          form: { type: 'string', example: 'Óvulo vaginal' },
          concentration: { type: 'string', example: '100 mg' },
          route: { type: 'string', example: 'Vaginal' },
          quantity: { type: 'string', example: '6' },
          quantityLetters: { type: 'string', example: 'SEIS' },
          dose: { type: 'string', example: '1 óvulo' },
          frequency: { type: 'string', example: 'Cada 24 horas antes de acostarse' },
          duration: { type: 'string', example: '6 días' },
          indications: { type: 'string', example: 'Tomar reposo' }
        }
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'appt-uuid' },
          date: { type: 'string', example: '2026-05-18' },
          time: { type: 'string', example: '08:30' },
          patientName: { type: 'string', example: 'Camila Perez' },
          patientAge: { type: 'string', example: '28' },
          doctorName: { type: 'string', example: 'Dra. Ana García' },
          reason: { type: 'string', example: 'Control prenatal' },
          type: { type: 'string', example: 'Control' },
          status: { type: 'string', example: 'Agendada' }
        }
      },
      ConsultationInput: {
        type: 'object',
        required: ['id', 'patientId', 'type'],
        properties: {
          id: { type: 'string', example: 'consultation-uuid' },
          patientId: { type: 'string', example: 'patient-uuid' },
          type: { type: 'string', example: 'Consulta Ginecología' },
          reason: { type: 'string', example: 'Molestias pélvicas' },
          evolution: { type: 'string', example: 'Paciente evoluciona favorablemente.' },
          vitalSigns: {
            type: 'object',
            properties: {
              weight: { type: 'string' },
              pressure: { type: 'string' },
              heartRate: { type: 'string' }
            }
          },
          gynecology: {
            type: 'object',
            properties: {
              ciclo: { type: 'integer' },
              duracion: { type: 'integer' }
            }
          },
          diagnoses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          treatment: {
            type: 'object',
            properties: {
              plan: { type: 'string' },
              followUp: { type: 'string' }
            }
          }
        }
      },
      Consultation: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'consultation-uuid' },
          patientId: { type: 'string', example: 'patient-uuid' },
          date: { type: 'string', example: '2026-05-18T10:00:00.000Z' },
          type: { type: 'string' },
          reason: { type: 'string' },
          evolution: { type: 'string' }
        }
      },
      BusinessSettings: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'default' },
          clinicName: { type: 'string', example: 'GineCentro Premium' },
          taxId: { type: 'string', example: '1798765432001' },
          address: { type: 'string', example: 'Edificio Clínico, Av. 10 de Agosto' },
          phone: { type: 'string', example: '022345678' },
          email: { type: 'string', example: 'info@ginecentro.com' },
          recipeDoctorName: { type: 'string', example: 'Dra. Ana García' },
          recipeDoctorSpecialty: { type: 'string', example: 'Ginecología y Obstetricia' },
          recipeDoctorAcess: { type: 'string', example: '7456-2026' }
        }
      }
    }
  }
}
