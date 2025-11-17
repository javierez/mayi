import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vesta CRM - Software Inmobiliario',
    short_name: 'Vesta CRM',
    description: 'CRM inmobiliario líder en España. Gestiona propiedades, contactos y publica en múltiples portales con IA.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    // Icons can be added later if PWA installation is needed
  };
}
