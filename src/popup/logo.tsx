interface LogoProps {
    className?: string
}

export function Logo({ className }: LogoProps) {
    return (
        <svg
            viewBox="0 0 128 128"
            className={className}
            fill="none"
            aria-hidden="true"
            shapeRendering="geometricPrecision"
        >
            <defs>
                <linearGradient
                    id="fontmapper-logo-bg"
                    x1="0"
                    y1="0"
                    x2="128"
                    y2="128"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#1f1f1f" />
                    <stop offset="100%" stopColor="#0a0a0a" />
                </linearGradient>
            </defs>

            <rect
                width="128"
                height="128"
                rx="28"
                fill="url(#fontmapper-logo-bg)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
            />

            <path
                d="M30 102 L62 26 L94 102"
                stroke="#ffffff"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            <path
                d="M44 74 L80 74"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
            />

            <circle cx="104" cy="32" r="6" fill="#3b82f6" />
        </svg>
    )
}
