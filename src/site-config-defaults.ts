/** Valores por defecto de la landing (alineados con gine-frontend). */
export const DEFAULT_SITE_CONFIG = {
  brandName: 'GineCare',
  brandTagline: 'Ginecología y obstetricia con enfoque humano',
  logoUrl: '',
  heroImageUrl:
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2000&q=80',
  heroImageAlt: 'Médica ginecóloga conversando con paciente en consultorio luminoso',
  heroBadge: 'Sin prisas, sin tabúes, con evidencia',
  heroTitle: 'Salud femenina con calma y ciencia',
  heroDescription:
    'Consulta ginecológica, control prenatal, planificación familiar y tamizajes. Te escuchamos, te explicamos con claridad y armamos un plan contigo.',
  heroCaption:
    'Ambiente acogedor, confidencialidad real y tiempo de consulta para lo que de verdad te preocupa.',
  servicesTitle: 'Nuestros servicios',
  servicesSubtitle:
    'Atención integral en cada etapa de la vida: prevención, diagnóstico, embarazo y bienestar femenino.',
  serviceCards: [
    {
      id: 'svc-default-1',
      title: 'Servicio 1',
      description:
        'Chequeo anual, citología, ecografía pélvica, infecciones, dolor menstrual y menopausia.',
      imageUrl:
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      icon: 'stethoscope',
    },
    {
      id: 'svc-default-2',
      title: 'Servicio 2',
      description:
        'Seguimiento del embarazo, ecografías, laboratorios y plan de parto con acompañamiento continuo.',
      imageUrl:
        'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80',
      icon: 'baby',
    },
    {
      id: 'svc-default-3',
      title: 'Servicio 3',
      description:
        'Anticoncepción, búsqueda de embarazo y orientación según su edad, salud y proyectos de vida.',
      imageUrl:
        'https://images.unsplash.com/photo-1551076805-e1869038a561?auto=format&fit=crop&w=800&q=80',
      icon: 'heart',
    },
  ],
  ctaTitle: '¿Agendamos tu próxima cita?',
  ctaDescription: 'Accede al panel médico para explorar agenda, pacientes y consultas.',
  footerNotice: 'GineCare · Plataforma demo · No reemplaza atención médica presencial',
}

export interface SiteConfigPayload {
  brandName: string;
  brandTagline: string;
  logoUrl: string;
  heroImageUrl: string;
  heroImageAlt: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroCaption: string;
  servicesTitle: string;
  servicesSubtitle: string;
  serviceCards: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    icon: string;
  }[];
  ctaTitle: string;
  ctaDescription: string;
  footerNotice: string;
}
