import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

function iconDefaults(props: IconProps) {
    const { width = 16, height = 16, fill = "none", stroke = "currentColor", strokeWidth = 1.5, ...rest } = props;
    return { width, height, fill, stroke, strokeWidth, ...rest };
}

function SvgIcon({
    children,
    viewBox = "0 0 16 16",
    ...props
}: IconProps & { viewBox?: string }) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox={viewBox}
            {...iconDefaults(props)}
        >
            {children}
        </svg>
    );
}

export function HamburgerMenuIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M2.5 4.25h11" />
            <path d="M2.5 8h11" />
            <path d="M2.5 11.75h11" />
        </SvgIcon>
    );
}

export function Cross1Icon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M4 4l8 8" />
            <path d="M12 4l-8 8" />
        </SvgIcon>
    );
}

export function Cross2Icon(props: IconProps) {
    return <Cross1Icon {...props} />;
}

export function MicrophoneIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <rect x="6" y="1.5" width="4" height="8" rx="2" />
            <path d="M3.5 7a4.5 4.5 0 0 0 9 0" />
            <path d="M8 11.5v3" />
            <path d="M5.5 14.5h5" />
        </SvgIcon>
    );
}

export function StopIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" />
        </SvgIcon>
    );
}

export function EnvelopeClosedIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <rect x="2.25" y="3.25" width="11.5" height="9.5" rx="2" />
            <path d="M3.5 5l4.5 3.5L12.5 5" />
        </SvgIcon>
    );
}

export function PaperPlaneIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M17 3 8.5 17l-1.75-6.25L3 8.5 17 3z" />
            <path d="m7 10.5 4-2.5" />
        </SvgIcon>
    );
}

export function LockClosedIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <rect x="3.25" y="7" width="9.5" height="6" rx="1.75" />
            <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
        </SvgIcon>
    );
}

export function ExclamationTriangleIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M10 3.25l7 12.25a1 1 0 0 1-.87 1.5H3.87A1 1 0 0 1 3 15.5L10 3.25z" />
            <path d="M10 7v4.25" />
            <circle cx="10" cy="14" r=".75" fill="currentColor" stroke="none" />
        </SvgIcon>
    );
}

export function CheckCircledIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <circle cx="10" cy="10" r="7.25" />
            <path d="m6.75 10.25 2.15 2.15 4.35-4.8" />
        </SvgIcon>
    );
}

export function EyeOpenIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M2.5 10S5 4.75 10 4.75 17.5 10 17.5 10 15 15.25 10 15.25 2.5 10 2.5 10z" />
            <circle cx="10" cy="10" r="2.25" />
        </SvgIcon>
    );
}

export function EyeClosedIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M4 4l12 12" />
            <path d="M8.4 8.4a2.25 2.25 0 0 0 3.2 3.2" />
            <path d="M6.1 6.3C3.9 7.6 2.5 10 2.5 10s2.5 5.25 7.5 5.25c1.15 0 2.16-.28 3.04-.7" />
            <path d="M9.4 4.8C9.6 4.77 9.8 4.75 10 4.75c5 0 7.5 5.25 7.5 5.25s-.62 1.3-1.82 2.6" />
        </SvgIcon>
    );
}

export function PersonIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <circle cx="10" cy="6.25" r="3.25" />
            <path d="M4.5 16c.55-2.65 2.66-4.25 5.5-4.25s4.95 1.6 5.5 4.25" />
        </SvgIcon>
    );
}

export function ChevronDownIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="m3.5 6 4.5 4.5L12.5 6" />
        </SvgIcon>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="m6 3.5 4.5 4.5L6 12.5" />
        </SvgIcon>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M10 3.5 5.5 8 10 12.5" />
        </SvgIcon>
    );
}

export function ExitIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
            <path d="M10 10h6" />
            <path d="m13.5 6.5 3.5 3.5-3.5 3.5" />
        </SvgIcon>
    );
}

export function LayersIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="m10 3.5 6.75 3.75L10 11 3.25 7.25 10 3.5z" />
            <path d="m3.5 10.25 6.5 3.5 6.5-3.5" />
            <path d="m3.5 13.5 6.5 3 6.5-3" />
        </SvgIcon>
    );
}

export function MagnifyingGlassIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <circle cx="8.5" cy="8.5" r="5.25" />
            <path d="m12.5 12.5 4 4" />
        </SvgIcon>
    );
}

export function ExternalLinkIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5V12" />
            <path d="M10 10 16 4" />
            <path d="M11 4h5v5" />
        </SvgIcon>
    );
}

export function PlusIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M8 3v10" />
            <path d="M3 8h10" />
        </SvgIcon>
    );
}

export function MixerHorizontalIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M3 5h8" />
            <path d="M14.5 5H17" />
            <path d="M9.5 10H17" />
            <path d="M3 10h3.5" />
            <path d="M3 15h10" />
            <path d="M16.5 15H17" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="8" cy="10" r="1.5" />
            <circle cx="14.5" cy="15" r="1.5" />
        </SvgIcon>
    );
}

export function CardStackIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <rect x="3" y="5" width="14" height="10" rx="2" />
            <path d="M6 8h8" />
            <path d="M6 11h4" />
            <path d="M5 3.5h10" />
        </SvgIcon>
    );
}

export function BarChartIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <path d="M3.5 16.5h13" />
            <rect x="5" y="9.5" width="2.5" height="5" rx=".75" />
            <rect x="8.75" y="6.5" width="2.5" height="8" rx=".75" />
            <rect x="12.5" y="4.5" width="2.5" height="10" rx=".75" />
        </SvgIcon>
    );
}

export function GearIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <circle cx="10" cy="10" r="2.75" />
            <path d="M10 3.5v1.75" />
            <path d="M10 14.75v1.75" />
            <path d="M3.5 10h1.75" />
            <path d="M14.75 10h1.75" />
            <path d="m5.4 5.4 1.25 1.25" />
            <path d="m13.35 13.35 1.25 1.25" />
            <path d="m14.6 5.4-1.25 1.25" />
            <path d="m6.65 13.35-1.25 1.25" />
        </SvgIcon>
    );
}

export function BriefcaseIcon(props: IconProps) {
    return (
        <SvgIcon viewBox="0 0 20 20" {...props}>
            <rect x="3" y="6.5" width="14" height="9" rx="1.5" />
            <path d="M7.5 6.5V5.25A1.25 1.25 0 0 1 8.75 4h2.5a1.25 1.25 0 0 1 1.25 1.25V6.5" />
            <path d="M3 10.25h14" />
        </SvgIcon>
    );
}
