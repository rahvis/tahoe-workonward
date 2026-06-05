import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = 'TahoeAI - Professional Talent Intelligence';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Read the SVG logo directly from the filesystem
  const logoPath = join(process.cwd(), 'public', 'logo', 'workonward_logo-white.svg');
  const logoSvg = readFileSync(logoPath, 'utf-8');
  
  // Extract just the inner paths or use the SVG as an image source if preferred.
  // Next.js ImageResponse supports rendering SVGs, but it's safest to pass it as an img src with a data URI,
  // or construct a clean layout.
  
  // We'll build a beautiful gradient background with the logo and a professional tagline.
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1c1c1c 0%, #0d0d0d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {/* We use a data URI for the SVG so ImageResponse can render it correctly */}
          <img
            src={`data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`}
            alt="TahoeAI Logo"
            style={{ width: '400px', objectFit: 'contain' }}
          />
        </div>
        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 20px 0',
              textAlign: 'center',
              letterSpacing: '-0.02em',
            }}
          >
            AI-Powered Talent Intelligence
          </h1>
          <p
            style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#a1a1aa', // Zinc 400
              margin: 0,
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Search, organize, enrich, and launch native sequences from one calm surface.
          </p>
        </div>
        
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 80px',
          }}
        >
           <span style={{ color: '#ff682c', fontSize: '24px', fontWeight: 600 }}>tahoe.workonward.com</span>
           <span style={{ color: '#52525b', fontSize: '24px' }}>Recruiter OS</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
