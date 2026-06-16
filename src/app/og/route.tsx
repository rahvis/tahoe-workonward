import { ImageResponse } from 'next/og';

// Shared social share image for every page. A very light Lake Tahoe gradient
// (clear-water blues melting into warm shore) with the Tahoe mark, a brand
// line, and a faint pencil-sketch lake. Served at /og and referenced from
// metadata across the whole site (see src/lib/og.ts).

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    padding: '64px 72px',
                    fontFamily: 'sans-serif',
                    color: '#1d2b33',
                    // Very light Tahoe lake gradient: pale sky-blue into clear
                    // turquoise shallows, settling onto a warm sandy shore.
                    background:
                        'linear-gradient(145deg, #e9f4f7 0%, #d3e9ef 30%, #e2efeb 60%, #f7f2ea 100%)',
                }}
            >
                {/* soft sun glow, upper right */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-160px',
                        right: '-120px',
                        width: '640px',
                        height: '640px',
                        background:
                            'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,236,214,0.45) 38%, rgba(255,255,255,0) 70%)',
                    }}
                />

                {/* faint pencil-sketch lake along the bottom */}
                <svg
                    width={WIDTH}
                    height="320"
                    viewBox="0 0 1200 320"
                    fill="none"
                    stroke="#4f8597"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'absolute', left: 0, bottom: 0, opacity: 0.32 }}
                >
                    <path d="M0 150 L150 70 L250 122 L400 44 L540 132 L700 58 L860 128 L1010 64 L1130 124 L1200 92" strokeOpacity="0.85" />
                    <path d="M0 188 L240 150 L470 184 L720 146 L980 186 L1200 156" strokeOpacity="0.6" />
                    <path d="M0 206 H1200" strokeOpacity="0.7" />
                    <path d="M150 232 H360 M430 232 H660 M740 232 H940" strokeOpacity="0.4" />
                    <path d="M250 256 H420 M560 256 H760" strokeOpacity="0.28" />
                    {/* a couple of shoreline pines */}
                    <path d="M96 300 V250 M96 196 L78 232 L114 232 Z M96 214 L72 250 L120 250 Z M96 232 L66 274 L126 274 Z" strokeOpacity="0.7" />
                    <path d="M1080 300 V262 M1080 214 L1064 244 L1096 244 Z M1080 236 L1058 268 L1102 268 Z" strokeOpacity="0.7" />
                </svg>

                {/* top: brand mark */}
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <svg width="64" height="36" viewBox="0 0 160 90" fill="none" style={{ marginRight: '18px' }}>
                        <path d="M0 90 L40 0 L80 90 Z" stroke="#ff682c" strokeWidth="10" strokeLinejoin="round" />
                        <path d="M80 90 L120 0 L160 90 Z" stroke="#202020" strokeWidth="10" strokeLinejoin="round" />
                    </svg>
                    <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '38px', fontWeight: 600, color: '#202020', letterSpacing: '-0.01em' }}>
                        <span>tahoe</span>
                        <span style={{ color: '#ff682c' }}>.</span>
                        <span>ai</span>
                    </div>
                </div>

                {/* middle: brand line */}
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', maxWidth: '900px' }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: '66px',
                            fontWeight: 600,
                            lineHeight: 1.04,
                            letterSpacing: '-0.025em',
                            color: '#1b2a32',
                        }}
                    >
                        Find your next hire in your own words.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            marginTop: '26px',
                            fontSize: '31px',
                            fontWeight: 400,
                            lineHeight: 1.4,
                            color: '#52727c',
                            maxWidth: '760px',
                        }}
                    >
                        Search, enrich, and reach out from one calm, clear surface.
                    </div>
                </div>

                {/* bottom: url + attribution */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{ display: 'flex', fontSize: '27px', fontWeight: 600, color: '#ff682c' }}>
                        tahoe.workonward.com
                    </div>
                    <div style={{ display: 'flex', fontSize: '24px', fontWeight: 400, color: '#7c919a' }}>
                        Powered by WorkOnward
                    </div>
                </div>
            </div>
        ),
        { width: WIDTH, height: HEIGHT },
    );
}
