import { Category } from '../types/finance';

export const INITIAL_CATEGORIES: Omit<Category, 'id'>[] = [
  // Gastos
  {
    type: 'gasto',
    name: 'Alimentación & Super',
    icon_or_image_url: '🥑',
    subcategories: ['Supermercado', 'Verdulería', 'Restaurantes', 'Café & Snacks', 'Delivery'],
  },
  {
    type: 'gasto',
    name: 'Hogar & Servicios',
    icon_or_image_url: '🏡',
    subcategories: ['Alquiler / Expensas', 'Luz & Gas', 'Internet & Celular', 'Agua', 'Mantenimiento & Limpieza'],
  },
  {
    type: 'gasto',
    name: 'Transporte',
    icon_or_image_url: '🚗',
    subcategories: ['Combustible', 'Transporte Público / SUBE', 'Seguro & Patente', 'Uber / Taxi', 'Mantenimiento'],
  },
  {
    type: 'gasto',
    name: 'Salud & Bienestar',
    icon_or_image_url: '🧘‍♀️',
    subcategories: ['Farmacia & Medicamentos', 'Médico & Obra Social', 'Gimnasio & Deporte', 'Cuidado Personal'],
  },
  {
    type: 'gasto',
    name: 'Educación & Cursos',
    icon_or_image_url: '📚',
    subcategories: ['Libros & Materiales', 'Cursos Online', 'Universidad & Matrícula', 'Talleres'],
  },
  {
    type: 'gasto',
    name: 'Ocio & Salidas',
    icon_or_image_url: '✨',
    subcategories: ['Cine & Teatro', 'Bares & Cenas', 'Streaming (Netflix/Spotify)', 'Salidas de Fin de Semana'],
  },

  // Ingresos
  {
    type: 'ingreso',
    name: 'Sueldo Principal',
    icon_or_image_url: '💼',
    subcategories: ['Salario Mensual', 'Aguinaldo (SAC)', 'Bono por Desempeño', 'Comisiones'],
  },
  {
    type: 'ingreso',
    name: 'Emprendimiento / Freelance',
    icon_or_image_url: '🌱',
    subcategories: ['Venta de Productos', 'Servicios Profesionales', 'Proyectos Puntuales', 'Consultoría'],
  },
  {
    type: 'ingreso',
    name: 'Inversiones & Rentas',
    icon_or_image_url: '📈',
    subcategories: ['Dividendos & CEDEARs', 'Intereses Plazo Fijo', 'Alquiler de Inmuebles', 'Rendimientos Fondos'],
  },

  // Ahorros
  {
    type: 'ahorro',
    name: 'Fondo de Emergencia',
    icon_or_image_url: '🛡️',
    subcategories: ['Reserva para Imprevistos', 'Colchón de 3-6 Meses', 'Salud Inesperada'],
  },
  {
    type: 'ahorro',
    name: 'Vacaciones & Viajes',
    icon_or_image_url: '✈️',
    subcategories: ['Pasajes & Vuelos', 'Alojamiento & Hotel', 'Gastos de Viaje'],
  },
  {
    type: 'ahorro',
    name: 'Metas a Largo Plazo',
    icon_or_image_url: '⭐',
    subcategories: ['Auto Propio', 'Vivienda / Terreno', 'Retiro & Jubilación', 'Equipamiento'],
  },
];
