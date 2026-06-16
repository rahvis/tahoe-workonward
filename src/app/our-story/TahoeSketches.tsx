import type { SVGProps } from 'react';

/**
 * Pencil-sketch line art for the Our Story page. Every shape is stroked with
 * `currentColor`, so the surrounding CSS controls both the ink tone and the
 * translucency that lets these drawings sit quietly behind the text.
 */

// A single pine rendered as a few stacked, open triangles over a slim trunk.
function pine(cx: number, baseY: number, h: number, w: number, key?: string | number) {
    const apex = baseY - h;
    return (
        <g key={key}>
            <path d={`M${cx} ${baseY} L${cx} ${apex + h * 0.34}`} />
            <path d={`M${cx} ${apex} L${cx - w * 0.5} ${apex + h * 0.34} L${cx + w * 0.5} ${apex + h * 0.34} Z`} />
            <path d={`M${cx} ${apex + h * 0.2} L${cx - w * 0.76} ${apex + h * 0.6} L${cx + w * 0.76} ${apex + h * 0.6} Z`} />
            <path d={`M${cx} ${apex + h * 0.42} L${cx - w} ${baseY - h * 0.1} L${cx + w} ${baseY - h * 0.1} Z`} />
        </g>
    );
}

// The hero centrepiece: a still alpine lake under a ring of peaks, with the
// shoreline pines and their soft reflection shimmering on the water.
export function LakeScene(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 840 520"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {/* sun resting low over the far ridge */}
            <circle cx="636" cy="150" r="44" strokeOpacity="0.6" />
            <circle cx="636" cy="150" r="66" strokeOpacity="0.18" />

            {/* far peaks */}
            <path
                d="M20 272 L120 168 L188 228 L286 132 L360 216 L452 150 L548 230 L632 176 L726 236 L820 198"
                strokeOpacity="0.55"
            />
            {/* nearer foothills */}
            <path d="M20 300 L150 252 L300 290 L470 246 L640 292 L820 256" strokeOpacity="0.4" />

            {/* the waterline */}
            <path d="M14 316 H826" strokeOpacity="0.5" />

            {/* reflection, drawn as broken ripples that fade as they sink */}
            <g strokeLinecap="round">
                <path d="M120 338 H250 M300 338 H470 M520 338 H700" strokeOpacity="0.26" />
                <path d="M180 358 H300 M360 358 H520 M560 358 H660" strokeOpacity="0.2" />
                <path d="M240 378 H360 M430 378 H560" strokeOpacity="0.15" />
                <path d="M300 398 H430" strokeOpacity="0.1" />
            </g>

            {/* shoreline */}
            <path d="M20 486 H300" strokeOpacity="0.3" />
            <path d="M690 490 H826" strokeOpacity="0.3" />

            {/* foreground pines framing the near shore */}
            <g strokeWidth="1.5">
                {pine(96, 480, 120, 30, 'l1')}
                {pine(150, 488, 96, 24, 'l2')}
                {pine(52, 490, 80, 19, 'l3')}
                {pine(762, 488, 132, 32, 'r1')}
            </g>
        </svg>
    );
}

// A low row of pines used as a quiet divider between chapters.
export function PineRidge(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 720 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path d="M0 108 H720" strokeOpacity="0.35" />
            {pine(60, 108, 72, 18, 'a')}
            {pine(132, 108, 54, 14, 'b')}
            {pine(214, 108, 84, 21, 'c')}
            {pine(300, 108, 60, 15, 'd')}
            {pine(398, 108, 78, 19, 'e')}
            {pine(486, 108, 50, 13, 'f')}
            {pine(576, 108, 90, 22, 'g')}
            {pine(664, 108, 64, 16, 'h')}
        </svg>
    );
}

// A solitary pine for page margins and accents.
export function PineTree(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 80 150"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {pine(40, 144, 132, 32, 'p')}
        </svg>
    );
}

// Concentric rings, like a single drop spreading across calm water. Used as a
// small motif beside the pull quotes to echo the depth-and-clarity idea.
export function Ripples(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
            {...props}
        >
            <ellipse cx="60" cy="60" rx="12" ry="5" strokeOpacity="0.75" />
            <ellipse cx="60" cy="60" rx="26" ry="10" strokeOpacity="0.5" />
            <ellipse cx="60" cy="60" rx="42" ry="16" strokeOpacity="0.32" />
            <ellipse cx="60" cy="60" rx="58" ry="22" strokeOpacity="0.18" />
        </svg>
    );
}
