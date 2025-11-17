import Script from 'next/script';

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vesta CRM',
    legalName: 'Vesta CRM',
    url: 'https://vesta.com',
    logo: 'https://vesta.com/vestazoomin.jpeg',
    description: 'El CRM más completo para profesionales inmobiliarios en España. Automatiza, optimiza y haz crecer tu negocio con inteligencia artificial.',
    email: 'javier@vesta-crm.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ES',
      addressLocality: 'Madrid',
      addressRegion: 'Madrid',
      postalCode: '28020',
      streetAddress: 'Calle Aviador Zorita 6',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+34-636-036-116',
      contactType: 'customer service',
      email: 'javier@vesta-crm.com',
      availableLanguage: ['Spanish', 'es'],
      areaServed: 'ES',
    },
    sameAs: [
      'https://x.com/javierez_98',
      'https://www.linkedin.com/in/javierezgarcia/',
    ],
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
