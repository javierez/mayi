import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Vesta CRM - Software Inmobiliario con IA';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #000000, #1a1a1a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold' }}>Vesta CRM</div>
        <div style={{ fontSize: 36, marginTop: 20, opacity: 0.9 }}>
          Software Inmobiliario con IA
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
