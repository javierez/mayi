import type { InboxThread, InboxContact, InboxFilter, RelatedListing } from "./inbox-types";

// Mock listings that relate to conversations
export const mockListings: RelatedListing[] = [
  {
    id: "prop-1",
    reference: "REF-2024-001",
    title: "Piso en Calle Mayor 15",
    address: "Calle Mayor 15, 3o B, Madrid",
    price: 285000,
    type: "piso",
    bedrooms: 3,
    bathrooms: 2,
    size: 95,
  },
  {
    id: "prop-2",
    reference: "REF-2024-002",
    title: "Piso en Paseo de la Habana",
    address: "Paseo de la Habana 45, Madrid",
    price: 310000,
    type: "piso",
    bedrooms: 4,
    bathrooms: 2,
    size: 120,
  },
  {
    id: "prop-3",
    reference: "REF-2024-003",
    title: "Atico en Calle Serrano",
    address: "Calle Serrano 45, Madrid",
    price: 450000,
    type: "atico",
    bedrooms: 2,
    bathrooms: 2,
    size: 85,
  },
  {
    id: "prop-4",
    reference: "REF-2024-004",
    title: "Atico en Paseo de la Castellana",
    address: "Paseo de la Castellana 120, Madrid",
    price: 580000,
    type: "atico",
    bedrooms: 3,
    bathrooms: 2,
    size: 150,
  },
  {
    id: "prop-5",
    reference: "REF-2024-005",
    title: "Piso en Calle Goya",
    address: "Calle Goya 87, 3B, Madrid",
    price: 1200,
    type: "piso",
    bedrooms: 2,
    bathrooms: 1,
    size: 70,
  },
  {
    id: "prop-6",
    reference: "REF-2024-006",
    title: "Chalet en Majadahonda",
    address: "Urbanizacion Los Sauces, Majadahonda",
    price: 1200000,
    type: "chalet",
    bedrooms: 5,
    bathrooms: 4,
    size: 350,
  },
];

// Mock contacts for compose autocomplete
export const mockContacts: InboxContact[] = [
  {
    id: "c1",
    name: "Maria Garcia",
    email: "maria.garcia@email.com",
    phone: "+34 612 345 678",
  },
  {
    id: "c2",
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@email.com",
    phone: "+34 623 456 789",
  },
  {
    id: "c3",
    name: "Ana Lopez",
    email: "ana.lopez@email.com",
    phone: "+34 634 567 890",
  },
  {
    id: "c4",
    name: "Pedro Martinez",
    email: "pedro.martinez@email.com",
    phone: "+34 645 678 901",
  },
  {
    id: "c5",
    name: "Laura Sanchez",
    email: "laura.sanchez@email.com",
    phone: "+34 656 789 012",
  },
  {
    id: "c6",
    name: "Miguel Torres",
    email: "miguel.torres@email.com",
    phone: "+34 667 890 123",
  },
  {
    id: "c7",
    name: "Carmen Ruiz",
    email: "carmen.ruiz@email.com",
    phone: "+34 678 901 234",
  },
  {
    id: "c8",
    name: "Jose Fernandez",
    email: "jose.fernandez@email.com",
    phone: "+34 689 012 345",
  },
];

// The agent (current user)
const agentContact: InboxContact = {
  id: "agent",
  name: "Tu",
  email: "agente@vesta.es",
  phone: "+34 600 000 000",
};

// Helper to create dates relative to now
const hoursAgo = (hours: number): Date => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

const daysAgo = (days: number, hours = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  return date;
};

// Mock conversation threads
export const mockThreads: InboxThread[] = [
  // WhatsApp Thread 1 - Property inquiry with multiple messages
  {
    id: "thread-wa1",
    channel: "whatsapp",
    snippet: "Perfecto, nos vemos manana a las 17:00 entonces",
    participants: [mockContacts[0]!, agentContact],
    lastMessageAt: hoursAgo(1),
    read: false,
    starred: true,
    messageCount: 5,
    messages: [
      {
        id: "wa1-1",
        threadId: "thread-wa1",
        status: "received",
        from: mockContacts[0]!,
        to: agentContact,
        content: "Hola buenas tardes! He visto el piso de Calle Mayor 15 en Idealista y me gustaria visitarlo. Esta disponible?",
        timestamp: daysAgo(1, 4),
      },
      {
        id: "wa1-2",
        threadId: "thread-wa1",
        status: "sent",
        from: agentContact,
        to: mockContacts[0],
        content: "Hola Maria! Si, el piso sigue disponible. Es un 3 habitaciones con 95m2 y terraza. Cuando te vendria bien visitarlo?",
        timestamp: daysAgo(1, 3),
      },
      {
        id: "wa1-3",
        threadId: "thread-wa1",
        status: "received",
        from: mockContacts[0]!,
        to: agentContact,
        content: "Genial! Podria ser manana por la tarde? A partir de las 17:00 me viene bien",
        timestamp: daysAgo(1, 2),
      },
      {
        id: "wa1-4",
        threadId: "thread-wa1",
        status: "sent",
        from: agentContact,
        to: mockContacts[0],
        content: "Perfecto, te apunto para manana a las 17:00. Te mando la direccion exacta: Calle Mayor 15, 3o B. Hay portero, solo tienes que decir que vienes a ver el piso.",
        timestamp: daysAgo(1, 1),
      },
      {
        id: "wa1-5",
        threadId: "thread-wa1",
        status: "received",
        from: mockContacts[0]!,
        to: agentContact,
        content: "Perfecto, nos vemos manana a las 17:00 entonces. Muchas gracias!",
        timestamp: hoursAgo(1),
      },
    ],
  },

  // WhatsApp Thread 2 - Price negotiation
  {
    id: "thread-wa2",
    channel: "whatsapp",
    snippet: "Hemos revisado la oferta. Podemos subir a 285.000 euros",
    participants: [mockContacts[3]!, agentContact],
    lastMessageAt: hoursAgo(3),
    read: false,
    starred: true,
    messageCount: 7,
    messages: [
      {
        id: "wa2-1",
        threadId: "thread-wa2",
        status: "received",
        from: mockContacts[3]!,
        to: agentContact,
        content: "Buenas! Hemos estado pensando en el piso del Paseo de la Habana. Queremos hacer una oferta de 270.000 euros",
        timestamp: daysAgo(2, 5),
      },
      {
        id: "wa2-2",
        threadId: "thread-wa2",
        status: "sent",
        from: agentContact,
        to: mockContacts[3],
        content: "Hola Pedro! Gracias por la oferta. El propietario pide 310.000 euros. Le transmito vuestra oferta pero creo que esta algo lejos de sus expectativas.",
        timestamp: daysAgo(2, 4),
      },
      {
        id: "wa2-3",
        threadId: "thread-wa2",
        status: "received",
        from: mockContacts[3]!,
        to: agentContact,
        content: "Entendemos, pero la vivienda necesita una reforma importante. El bano y la cocina estan muy anticuados",
        timestamp: daysAgo(2, 3),
      },
      {
        id: "wa2-4",
        threadId: "thread-wa2",
        status: "sent",
        from: agentContact,
        to: mockContacts[3],
        content: "He hablado con el propietario. Entiende que necesita reforma pero su minimo es 295.000 euros. Podeis acercaros a esa cifra?",
        timestamp: daysAgo(1, 6),
      },
      {
        id: "wa2-5",
        threadId: "thread-wa2",
        status: "received",
        from: mockContacts[3]!,
        to: agentContact,
        content: "Dejame hablar con mi pareja y te digo algo manana",
        timestamp: daysAgo(1, 5),
      },
      {
        id: "wa2-6",
        threadId: "thread-wa2",
        status: "sent",
        from: agentContact,
        to: mockContacts[3],
        content: "Perfecto, esperamos tu respuesta!",
        timestamp: daysAgo(1, 4),
      },
      {
        id: "wa2-7",
        threadId: "thread-wa2",
        status: "received",
        from: mockContacts[3]!,
        to: agentContact,
        content: "Hemos revisado la oferta. Podemos subir a 285.000 euros, pero es nuestro limite. La vivienda necesita reforma y ese es el maximo que podemos ofrecer. Esperamos su respuesta.",
        timestamp: hoursAgo(3),
      },
    ],
  },

  // WhatsApp Thread 3 - Short follow up
  {
    id: "thread-wa3",
    channel: "whatsapp",
    snippet: "Seria posible el sabado por la manana?",
    participants: [mockContacts[2]!, agentContact],
    lastMessageAt: hoursAgo(5),
    read: true,
    starred: false,
    messageCount: 3,
    messages: [
      {
        id: "wa3-1",
        threadId: "thread-wa3",
        status: "sent",
        from: agentContact,
        to: mockContacts[2],
        content: "Hola Ana! Que tal fue la visita de ayer? Te gusto el piso?",
        timestamp: hoursAgo(8),
      },
      {
        id: "wa3-2",
        threadId: "thread-wa3",
        status: "received",
        from: mockContacts[2]!,
        to: agentContact,
        content: "Hola! Si, me gusto mucho. He estado pensando y me gustaria hacer una segunda visita con mi marido.",
        timestamp: hoursAgo(6),
      },
      {
        id: "wa3-3",
        threadId: "thread-wa3",
        status: "received",
        from: mockContacts[2]!,
        to: agentContact,
        content: "Seria posible el sabado por la manana?",
        timestamp: hoursAgo(5),
      },
    ],
  },

  // WhatsApp Thread 4 - Offer accepted
  {
    id: "thread-wa4",
    channel: "whatsapp",
    snippet: "El propietario ha aceptado vuestra oferta!",
    participants: [mockContacts[6]!, agentContact],
    lastMessageAt: daysAgo(1),
    read: false,
    starred: true,
    messageCount: 4,
    messages: [
      {
        id: "wa4-1",
        threadId: "thread-wa4",
        status: "received",
        from: mockContacts[6]!,
        to: agentContact,
        content: "Buenos dias! Hay novedades con nuestra oferta del atico?",
        timestamp: daysAgo(1, 6),
      },
      {
        id: "wa4-2",
        threadId: "thread-wa4",
        status: "sent",
        from: agentContact,
        to: mockContacts[6],
        content: "Hola Carmen! Estoy esperando respuesta del propietario. Me dijo que lo consultaria con su familia. Te aviso en cuanto sepa algo.",
        timestamp: daysAgo(1, 5),
      },
      {
        id: "wa4-3",
        threadId: "thread-wa4",
        status: "sent",
        from: agentContact,
        to: mockContacts[6],
        content: "Carmen, tengo muy buenas noticias!",
        timestamp: daysAgo(1, 1),
      },
      {
        id: "wa4-4",
        threadId: "thread-wa4",
        status: "sent",
        from: agentContact,
        to: mockContacts[6],
        content: "El propietario ha aceptado vuestra oferta! 320.000 euros con entrega de llaves en 60 dias. Podemos quedar para firmar el contrato de arras esta semana?",
        timestamp: daysAgo(1),
      },
    ],
  },

  // WhatsApp Thread 5 - Document request
  {
    id: "thread-wa5",
    channel: "whatsapp",
    snippet: "Me los podeis enviar por email?",
    participants: [mockContacts[4]!, agentContact],
    lastMessageAt: hoursAgo(12),
    read: true,
    starred: false,
    messageCount: 2,
    messages: [
      {
        id: "wa5-1",
        threadId: "thread-wa5",
        status: "received",
        from: mockContacts[4]!,
        to: agentContact,
        content: "Hola! Necesito la nota simple actualizada para presentar al banco. Tambien me han pedido el certificado energetico y el ultimo recibo del IBI.",
        timestamp: hoursAgo(13),
      },
      {
        id: "wa5-2",
        threadId: "thread-wa5",
        status: "received",
        from: mockContacts[4]!,
        to: agentContact,
        content: "Me los podeis enviar por email?",
        timestamp: hoursAgo(12),
      },
    ],
  },

  // Email Thread 1 - Fotocasa lead
  {
    id: "thread-em1",
    channel: "email",
    subject: "Nuevo contacto interesado - Piso Calle Serrano 45",
    snippet: "Un usuario ha mostrado interes en tu anuncio...",
    participants: [
      { id: "fotocasa", name: "Fotocasa Leads", email: "leads@fotocasa.es" },
    ],
    lastMessageAt: hoursAgo(2),
    read: false,
    starred: false,
    messageCount: 1,
    messages: [
      {
        id: "em1-1",
        threadId: "thread-em1",
        status: "received",
        from: { id: "fotocasa", name: "Fotocasa Leads", email: "leads@fotocasa.es" },
        to: agentContact,
        content: `Hola,

Un usuario ha mostrado interes en tu anuncio:

Propiedad: Piso en Calle Serrano 45, Madrid
Referencia: FC-2024-78543
Precio: 450.000 euros

Datos del contacto:
- Nombre: Roberto Sanchez
- Telefono: +34 655 432 187
- Email: roberto.sanchez@gmail.com
- Mensaje: "Me gustaria concertar una visita lo antes posible. Tengo financiacion aprobada."

Te recomendamos contactar en las proximas 24 horas para maximizar las posibilidades de conversion.

Saludos,
Equipo Fotocasa`,
        timestamp: hoursAgo(2),
      },
    ],
  },

  // Email Thread 2 - Contract negotiation with multiple replies
  {
    id: "thread-em2",
    channel: "email",
    subject: "Re: Contrato de compraventa - Atico Paseo de la Castellana",
    snippet: "He revisado las modificaciones y todo parece correcto",
    participants: [
      { id: "notario", name: "Notaria Perez & Asociados", email: "documentos@notariaperez.es" },
      agentContact,
    ],
    lastMessageAt: hoursAgo(4),
    read: false,
    starred: true,
    messageCount: 4,
    messages: [
      {
        id: "em2-1",
        threadId: "thread-em2",
        status: "received",
        from: { id: "notario", name: "Notaria Perez & Asociados", email: "documentos@notariaperez.es" },
        to: agentContact,
        content: `Estimado/a,

Adjuntamos el borrador del contrato de compraventa para su revision:

- Propiedad: Atico en Paseo de la Castellana 120
- Vendedor: Inversiones Inmobiliarias SL
- Comprador: Juan Carlos Mendez
- Precio: 580.000 euros

Por favor, revise el documento y envienos cualquier correccion necesaria.

Atentamente,
Notaria Perez & Asociados`,
        timestamp: daysAgo(3),
        attachments: [{ name: "Borrador_Contrato.pdf", type: "application/pdf", size: "156 KB" }],
      },
      {
        id: "em2-2",
        threadId: "thread-em2",
        status: "sent",
        from: agentContact,
        to: { id: "notario", name: "Notaria Perez & Asociados", email: "documentos@notariaperez.es" },
        content: `Buenos dias,

He revisado el borrador con el comprador. Necesitamos modificar los siguientes puntos:

1. La fecha de entrega de llaves debe ser 60 dias desde la firma, no 90
2. Incluir la plaza de garaje num. 45 que va incluida en la venta
3. Especificar que los electrodomesticos de la cocina estan incluidos

Por favor, envien el documento actualizado cuando este listo.

Saludos`,
        timestamp: daysAgo(2, 6),
      },
      {
        id: "em2-3",
        threadId: "thread-em2",
        status: "received",
        from: { id: "notario", name: "Notaria Perez & Asociados", email: "documentos@notariaperez.es" },
        to: agentContact,
        content: `Estimado/a,

Adjuntamos el contrato con las modificaciones solicitadas. Hemos incluido:

- Plazo de entrega: 60 dias
- Plaza de garaje num. 45
- Clausula de electrodomesticos incluidos

Quedamos a la espera de su conformidad para programar la firma.

Atentamente,
Notaria Perez & Asociados`,
        timestamp: daysAgo(1, 3),
        attachments: [{ name: "Contrato_v2.pdf", type: "application/pdf", size: "158 KB" }],
      },
      {
        id: "em2-4",
        threadId: "thread-em2",
        status: "sent",
        from: agentContact,
        to: { id: "notario", name: "Notaria Perez & Asociados", email: "documentos@notariaperez.es" },
        content: `Buenos dias,

He revisado las modificaciones y todo parece correcto. El comprador ha dado su conformidad.

Podemos programar la firma para el viernes 20 de diciembre a las 10:00?

Saludos`,
        timestamp: hoursAgo(4),
      },
    ],
  },

  // Email Thread 3 - Maintenance issue
  {
    id: "thread-em3",
    channel: "email",
    subject: "Re: Problema con la caldera - Urgente",
    snippet: "El tecnico ira manana entre las 9:00 y las 11:00",
    participants: [
      { id: "inquilino", name: "Fernando Ruiz", email: "fernando.ruiz@email.com" },
      agentContact,
    ],
    lastMessageAt: hoursAgo(6),
    read: true,
    starred: false,
    messageCount: 3,
    messages: [
      {
        id: "em3-1",
        threadId: "thread-em3",
        status: "received",
        from: { id: "inquilino", name: "Fernando Ruiz", email: "fernando.ruiz@email.com" },
        to: agentContact,
        content: `Hola,

Os escribo porque la caldera del piso que alquilo (Calle Goya 87, 3B) ha dejado de funcionar esta manana. No tenemos agua caliente ni calefaccion.

He intentado reiniciarla siguiendo las instrucciones del manual pero sigue sin funcionar. El display muestra un codigo de error E05.

Necesitamos que envien a un tecnico lo antes posible.

Gracias,
Fernando Ruiz
Tel: 654 321 098`,
        timestamp: daysAgo(1, 8),
      },
      {
        id: "em3-2",
        threadId: "thread-em3",
        status: "sent",
        from: agentContact,
        to: { id: "inquilino", name: "Fernando Ruiz", email: "fernando.ruiz@email.com" },
        content: `Hola Fernando,

Siento mucho las molestias. He contactado con el servicio tecnico de calderas y tienen disponibilidad manana por la manana.

El tecnico ira manana entre las 9:00 y las 11:00. Podras estar en casa?

Si es urgente y no puedes esperar, puedo intentar buscar otro servicio de urgencias para hoy, aunque seria mas caro.

Saludos`,
        timestamp: daysAgo(1, 6),
      },
      {
        id: "em3-3",
        threadId: "thread-em3",
        status: "received",
        from: { id: "inquilino", name: "Fernando Ruiz", email: "fernando.ruiz@email.com" },
        to: agentContact,
        content: `Hola,

Puedo esperar a manana, no hay problema. Estare en casa a esa hora.

Muchas gracias por la rapida respuesta.

Fernando`,
        timestamp: hoursAgo(6),
      },
    ],
  },

  // Email Thread 4 - Investment meeting
  {
    id: "thread-em4",
    channel: "email",
    subject: "Re: Reunion para revisar opciones de inversion",
    snippet: "Perfecto, nos vemos el miercoles a las 12:00",
    participants: [
      { id: "cliente", name: "Patricia Gomez", email: "patricia.gomez@empresa.com" },
      agentContact,
    ],
    lastMessageAt: daysAgo(2),
    read: true,
    starred: true,
    messageCount: 3,
    messages: [
      {
        id: "em4-1",
        threadId: "thread-em4",
        status: "sent",
        from: agentContact,
        to: { id: "cliente", name: "Patricia Gomez", email: "patricia.gomez@empresa.com" },
        content: `Hola Patricia,

Tenemos varias propiedades nuevas que podrian interesarte para inversion. He seleccionado 5 opciones con rentabilidades entre el 5% y el 7%.

Te vendria bien quedar esta semana para revisarlas juntas?

Saludos`,
        timestamp: daysAgo(3, 4),
      },
      {
        id: "em4-2",
        threadId: "thread-em4",
        status: "received",
        from: { id: "cliente", name: "Patricia Gomez", email: "patricia.gomez@empresa.com" },
        to: agentContact,
        content: `Hola,

Me interesa mucho! El miercoles a las 12:00 me viene bien. En vuestras oficinas?

Estoy especialmente interesada en:
1. Locales comerciales en zona centro
2. Pisos para alquiler con rentabilidad > 5%
3. Posibles oportunidades de reforma

Patricia Gomez
Directora Financiera
Inversiones Gomez SL`,
        timestamp: daysAgo(2, 6),
      },
      {
        id: "em4-3",
        threadId: "thread-em4",
        status: "sent",
        from: agentContact,
        to: { id: "cliente", name: "Patricia Gomez", email: "patricia.gomez@empresa.com" },
        content: `Perfecto Patricia!

Te espero el miercoles a las 12:00 en nuestra oficina (Calle Velazquez 50, 2a planta).

Preparo un dossier con las propiedades que mas encajan con tus criterios.

Hasta el miercoles!`,
        timestamp: daysAgo(2),
      },
    ],
  },

  // Email Thread 5 - New assignment
  {
    id: "thread-em5",
    channel: "email",
    subject: "Nueva captacion asignada - Chalet Majadahonda",
    snippet: "Te asigno esta nueva captacion en exclusiva...",
    participants: [
      { id: "coordinador", name: "Luis Martinez - Coordinador", email: "luis.martinez@vesta.es" },
    ],
    lastMessageAt: daysAgo(3),
    read: false,
    starred: true,
    messageCount: 1,
    messages: [
      {
        id: "em5-1",
        threadId: "thread-em5",
        status: "received",
        from: { id: "coordinador", name: "Luis Martinez - Coordinador", email: "luis.martinez@vesta.es" },
        to: agentContact,
        content: `Hola,

Te asigno esta nueva captacion en exclusiva compartida:

DATOS DE LA PROPIEDAD:
- Tipo: Chalet independiente
- Ubicacion: Urbanizacion Los Sauces, Majadahonda
- Superficie: 350 m2 construidos + 800 m2 parcela
- Habitaciones: 5
- Banos: 4
- Garaje: 3 plazas
- Piscina: Si
- Precio: 1.200.000 euros
- Comision: 4% (compartida 50/50 con captador)

PROPIETARIO:
- Nombre: Alberto Sanchez
- Telefono: 666 777 888
- Disponibilidad: Tardes de 17:00 a 20:00

Por favor, contacta hoy para programar la sesion de fotos.

Saludos,
Luis`,
        timestamp: daysAgo(3),
      },
    ],
  },

  // WhatsApp Thread 6 - Quick thank you
  {
    id: "thread-wa6",
    channel: "whatsapp",
    snippet: "Muchas gracias por todo!",
    participants: [mockContacts[7]!, agentContact],
    lastMessageAt: daysAgo(2),
    read: true,
    starred: true,
    messageCount: 4,
    messages: [
      {
        id: "wa6-1",
        threadId: "thread-wa6",
        status: "sent",
        from: agentContact,
        to: mockContacts[7],
        content: "Hola Jose! Ya esta todo listo. La escritura se firmo correctamente y las llaves son tuyas. Enhorabuena por tu nueva casa!",
        timestamp: daysAgo(2, 4),
      },
      {
        id: "wa6-2",
        threadId: "thread-wa6",
        status: "received",
        from: mockContacts[7]!,
        to: agentContact,
        content: "No me lo puedo creer todavia! Despues de tanto tiempo buscando por fin tenemos nuestra casa",
        timestamp: daysAgo(2, 3),
      },
      {
        id: "wa6-3",
        threadId: "thread-wa6",
        status: "received",
        from: mockContacts[7]!,
        to: agentContact,
        content: "Muchas gracias por todo! Habeis sido muy profesionales y pacientes con nosotros. Os recomendaremos seguro",
        timestamp: daysAgo(2, 2),
      },
      {
        id: "wa6-4",
        threadId: "thread-wa6",
        status: "sent",
        from: agentContact,
        to: mockContacts[7],
        content: "Ha sido un placer! Si necesitais cualquier cosa no dudeis en contactarme. Disfrutad de vuestra nueva casa!",
        timestamp: daysAgo(2),
      },
    ],
  },
];

// Helper function to get unread count for threads
export const getUnreadCount = (
  threads: InboxThread[],
  filter: InboxFilter = "all"
): number => {
  return threads.filter((t) => {
    if (!t.read) {
      if (filter === "all") return true;
      return t.channel === filter;
    }
    return false;
  }).length;
};

// Helper function to filter threads
export const filterThreads = (
  threads: InboxThread[],
  filter: InboxFilter,
  searchQuery: string
): InboxThread[] => {
  return threads.filter((t) => {
    // Filter by channel
    if (filter !== "all" && t.channel !== filter) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const participantMatch = t.participants.some((p) =>
        p.name.toLowerCase().includes(query)
      );
      const snippetMatch = t.snippet.toLowerCase().includes(query);
      const subjectMatch = t.subject?.toLowerCase().includes(query) ?? false;
      const contentMatch = t.messages.some((m) =>
        m.content.toLowerCase().includes(query)
      );

      return participantMatch || snippetMatch || subjectMatch || contentMatch;
    }

    return true;
  });
};
