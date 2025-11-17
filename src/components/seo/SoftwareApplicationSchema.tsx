import Script from 'next/script';

export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vesta CRM',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'CRM Software',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      description: 'Prueba gratis - Sin tarjeta de crédito',
    },
    // Note: Add aggregateRating only when you have real user reviews
    // aggregateRating: {
    //   '@type': 'AggregateRating',
    //   ratingValue: 'X.X',
    //   ratingCount: 'XXX',
    //   bestRating: '5',
    //   worstRating: '1',
    // },
    description: 'El CRM más completo para profesionales inmobiliarios en España. Gestiona propiedades, contactos y publica en múltiples portales (Fotocasa, Idealista, Habitaclia) con inteligencia artificial.',
    url: 'https://vesta.com',
    softwareVersion: '1.0',
    author: {
      '@type': 'Organization',
      name: 'Vesta CRM',
      url: 'https://vesta.com',
    },
    featureList: [
      'Gestión ilimitada de propiedades',
      'CRM de contactos y leads',
      'Publicación en múltiples portales inmobiliarios (Fotocasa, Idealista, Habitaclia)',
      'Generación de descripciones con inteligencia artificial',
      'Calendario integrado para visitas',
      'Editor de carteles profesionales',
      'Marca de agua automática en imágenes',
      'Integraciones con portales inmobiliarios',
    ],
  };

  return (
    <Script
      id="software-application-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
