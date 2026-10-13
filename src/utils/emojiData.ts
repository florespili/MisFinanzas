export interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

export interface EmojiGroup {
  category: string;
  items: EmojiItem[];
}

/**
 * Extracts the first emoji from a given string, accurately handling
 * ZWJ (Zero-Width Joiner) sequences, skin tone modifiers, and gender variations.
 */
export function extractFirstEmoji(str: string): string | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  // Use Intl.Segmenter if available for grapheme cluster boundary extraction
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });
      for (const segment of segmenter.segment(trimmed)) {
        const grapheme = segment.segment;
        if (/\p{Extended_Pictographic}/u.test(grapheme)) {
          return grapheme;
        }
      }
    } catch {
      // Fallback to regex
    }
  }

  // Regex fallback for composite emojis
  const regex = /(\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic}|\uFE0F|\p{Emoji_Modifier})*)/u;
  const match = trimmed.match(regex);
  return match ? match[0] : null;
}

export const EMOJI_CATALOG: EmojiGroup[] = [
  {
    category: 'Comida & Bebidas',
    items: [
      { emoji: '🥑', name: 'Palta / Aguacate', keywords: ['palta', 'aguacate', 'super', 'comida', 'verdura'] },
      { emoji: '🛒', name: 'Supermercado', keywords: ['super', 'supermercado', 'compras', 'alimentos', 'changuito'] },
      { emoji: '☕', name: 'Café', keywords: ['café', 'cafe', 'desayuno', 'merienda', 'starbucks', 'taza'] },
      { emoji: '🍕', name: 'Pizza', keywords: ['pizza', 'cena', 'comida', 'delivery', 'amigos'] },
      { emoji: '🍔', name: 'Hamburguesa', keywords: ['hamburguesa', 'burger', 'fast food', 'comida'] },
      { emoji: '🍎', name: 'Manzana', keywords: ['manzana', 'fruta', 'verdulería', 'sano'] },
      { emoji: '🥩', name: 'Carne / Asado', keywords: ['carne', 'asado', 'carnicería', 'parrilla'] },
      { emoji: '🥖', name: 'Panadería', keywords: ['pan', 'panadería', 'facturas', 'desayuno'] },
      { emoji: '🍣', name: 'Sushi', keywords: ['sushi', 'salida', 'cena', 'pescado'] },
      { emoji: '🍷', name: 'Vino / Bebidas', keywords: ['vino', 'copa', 'bar', 'trago', 'bebida'] },
      { emoji: '🍦', name: 'Helado / Postre', keywords: ['helado', 'postre', 'dulce', 'heladería'] },
      { emoji: '🥗', name: 'Ensalada / Diet', keywords: ['ensalada', 'saludable', 'diet', 'vegetariano'] },
    ],
  },
  {
    category: 'Hogar & Servicios',
    items: [
      { emoji: '🏡', name: 'Casa / Alquiler', keywords: ['casa', 'hogar', 'alquiler', 'depto', 'expensas', 'vivienda'] },
      { emoji: '💡', name: 'Luz / Electricidad', keywords: ['luz', 'electricidad', 'servicio', 'factura', 'edenor', 'edesur'] },
      { emoji: '🔥', name: 'Gas / Calefacción', keywords: ['gas', 'calefacción', 'metrogas', 'servicio'] },
      { emoji: '💧', name: 'Agua / Aysa', keywords: ['agua', 'aysa', 'canilla', 'servicio'] },
      { emoji: '📶', name: 'Internet / WiFi', keywords: ['internet', 'wifi', 'fibertel', 'telecentro', 'flow'] },
      { emoji: '📱', name: 'Celular / Plan', keywords: ['celular', 'telefono', 'claro', 'personal', 'movistar', 'linea'] },
      { emoji: '🧹', name: 'Limpieza / Mantenimiento', keywords: ['limpieza', 'artículos', 'lavandina', 'hogar'] },
      { emoji: '🛋️', name: 'Muebles & Deco', keywords: ['muebles', 'decoracion', 'ikea', 'hogar', 'cama'] },
      { emoji: '🔧', name: 'Reparaciones / Plomero', keywords: ['reparacion', 'arreglo', 'plomero', 'electricista'] },
    ],
  },
  {
    category: 'Transporte & Movilidad',
    items: [
      { emoji: '🚗', name: 'Auto / Combustible', keywords: ['auto', 'coche', 'nafta', 'combustible', 'gasolina', 'ypf', 'shell'] },
      { emoji: '🚌', name: 'Colectivo / Bus', keywords: ['colectivo', 'bus', 'sube', 'transporte', 'micro'] },
      { emoji: '🚇', name: 'Subte / Metro / Tren', keywords: ['subte', 'metro', 'tren', 'transporte', 'viaje'] },
      { emoji: '🚕', name: 'Taxi / Uber / Cabify', keywords: ['taxi', 'uber', 'cabify', 'didi', 'remis'] },
      { emoji: '🚲', name: 'Bicicleta', keywords: ['bici', 'bicicleta', 'ecobici', 'ciclovia'] },
      { emoji: '🛵', name: 'Moto', keywords: ['moto', 'motocicleta', 'nafta'] },
      { emoji: '🅿️', name: 'Estacionamiento / Garage', keywords: ['estacionamiento', 'cochera', 'garage', 'peaje'] },
      { emoji: '🛡️', name: 'Seguro de Auto / Patente', keywords: ['seguro', 'patente', 'vtv', 'auto'] },
    ],
  },
  {
    category: 'Salud & Bienestar',
    items: [
      { emoji: '🧘‍♀️', name: 'Yoga / Meditación', keywords: ['yoga', 'meditacion', 'zen', 'bienestar', 'paz'] },
      { emoji: '💊', name: 'Farmacia / Remedios', keywords: ['farmacia', 'medicamento', 'remedio', 'pastillas', 'salud'] },
      { emoji: '🩺', name: 'Médico / Obra Social', keywords: ['medico', 'doctor', 'consulta', 'obra social', 'prepaga', 'osde'] },
      { emoji: '🏋️‍♂️', name: 'Gimnasio / Deporte', keywords: ['gimnasio', 'gym', 'pesas', 'entrenamiento', 'crossfit', 'fitness'] },
      { emoji: '🦷', name: 'Dentista / Odontología', keywords: ['dentista', 'odontologo', 'diente', 'salud'] },
      { emoji: '🧴', name: 'Cuidado Personal / Skincare', keywords: ['skincare', 'cremas', 'shampoo', 'higiene', 'perfume'] },
      { emoji: '💇‍♀️', name: 'Peluquería / Barba', keywords: ['peluqueria', 'corte', 'barberia', 'pelo'] },
      { emoji: '👓', name: 'Óptica / Lentes', keywords: ['lentes', 'anteojos', 'optica', 'ojos'] },
    ],
  },
  {
    category: 'Compras & Shopping',
    items: [
      { emoji: '🛍️', name: 'Ropa & Calzado', keywords: ['ropa', 'zapatillas', 'calzado', 'shopping', 'indumentaria'] },
      { emoji: '💻', name: 'Tecnología / Computadora', keywords: ['tecnologia', 'notebook', 'pc', 'computadora', 'gadget'] },
      { emoji: '🎁', name: 'Regalos / Cumpleaños', keywords: ['regalo', 'cumpleaños', 'presente', 'fiesta'] },
      { emoji: '💄', name: 'Maquillaje / Cosmética', keywords: ['maquillaje', 'labial', 'belleza', 'cosmetica'] },
      { emoji: '📦', name: 'Envíos / MercadoLibre', keywords: ['envio', 'mercadolibre', 'paquete', 'compras'] },
    ],
  },
  {
    category: 'Educación & Cursos',
    items: [
      { emoji: '📚', name: 'Libros & Cursos', keywords: ['libros', 'lectura', 'curso', 'capacitacion', 'taller'] },
      { emoji: '🎓', name: 'Universidad / Carrera', keywords: ['universidad', 'facultad', 'matricula', 'estudio', 'cuota'] },
      { emoji: '✏️', name: 'Librería / Útiles', keywords: ['utiles', 'libreria', 'cuaderno', 'materiales'] },
      { emoji: '🌐', name: 'Idiomas & Clases', keywords: ['ingles', 'idiomas', 'clases', 'profesor'] },
    ],
  },
  {
    category: 'Ocio, Salidas & Viajes',
    items: [
      { emoji: '✨', name: 'Ocio & Salidas', keywords: ['ocio', 'salida', 'entretenimiento', 'paseo', 'diversion'] },
      { emoji: '🎬', name: 'Cine & Streaming', keywords: ['cine', 'netflix', 'spotify', 'disney', 'peliculas', 'series'] },
      { emoji: '✈️', name: 'Viajes / Vacaciones', keywords: ['viaje', 'viajes', 'vacaciones', 'vuelo', 'avion', 'turismo'] },
      { emoji: '🏨', name: 'Hotel / Alojamiento', keywords: ['hotel', 'airbnb', 'alojamiento', 'hostel'] },
      { emoji: '🎉', name: 'Fiestas & Eventos', keywords: ['fiesta', 'boliche', 'evento', 'recital', 'concierto'] },
      { emoji: '🎮', name: 'Videojuegos / Gaming', keywords: ['gaming', 'playstation', 'steam', 'juego'] },
    ],
  },
  {
    category: 'Mascotas',
    items: [
      { emoji: '🐾', name: 'Mascotas / Pet Shop', keywords: ['mascotas', 'perro', 'gato', 'pet', 'alimento', 'veterinaria'] },
      { emoji: '🐶', name: 'Perro', keywords: ['perro', 'cachorro', 'veterinario'] },
      { emoji: '🐱', name: 'Gato', keywords: ['gato', 'gatito', 'alimento'] },
      { emoji: '🏥', name: 'Veterinario', keywords: ['veterinario', 'vacunas', 'salud mascota'] },
    ],
  },
  {
    category: 'Trabajo & Finanzas',
    items: [
      { emoji: '💼', name: 'Sueldo / Trabajo', keywords: ['sueldo', 'salario', 'trabajo', 'empleo', 'ingreso', 'recibo'] },
      { emoji: '🌱', name: 'Emprendimiento / Freelance', keywords: ['emprendimiento', 'freelance', 'negocio', 'ventas', 'clientes'] },
      { emoji: '📈', name: 'Inversiones / Renta', keywords: ['inversiones', 'acciones', 'cedears', 'plazo fijo', 'intereses'] },
      { emoji: '⭐', name: 'Metas de Ahorro', keywords: ['ahorro', 'meta', 'objetivo', 'alcancia', 'futuro'] },
      { emoji: '💳', name: 'Tarjeta de Crédito', keywords: ['tarjeta', 'credito', 'visa', 'mastercard', 'resumen'] },
      { emoji: '🏦', name: 'Banco / Comisiones', keywords: ['banco', 'comision', 'mantenimiento', 'transferencia'] },
      { emoji: '💵', name: 'Efectivo', keywords: ['efectivo', 'cash', 'plata', 'dinero'] },
    ],
  },
];
