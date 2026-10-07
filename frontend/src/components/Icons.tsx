import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

const Icon = ({ children, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    viewBox="0 0 24 24"
    width="18"
    {...props}
  >
    {children}
  </svg>
)

export const FlameIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M13.2 2.8c.5 3-1.8 4.5-1.8 6.5 0 1.3.8 2.2 1.8 2.2 1.6 0 2.6-1.7 2-3.8 2.4 1.8 3.8 4.3 3.8 6.9A7 7 0 1 1 5 14.5c0-3.4 2-6.3 5.6-9.1-.2 3.4 1 4.2 1.6 3.2.7-1.1.1-3.4 1-5.8Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </Icon>
)

export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M12 8v5m0 3.2v.1M10.3 3.8 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.8a2 2 0 0 0-3.4 0Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </Icon>
)

export const CrosshairIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 2v4m0 12v4M2 12h4m12 0h4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.6"
    />
  </Icon>
)

export const GlobeIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M3.5 9h17M3.5 15h17M12 3c2.1 2.5 3.1 5.5 3.1 9S14.1 18.5 12 21c-2.1-2.5-3.1-5.5-3.1-9S9.9 5.5 12 3Z"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </Icon>
)

export const LayersIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="m12 3-9 5 9 5 9-5-9-5Zm-7.5 9 7.5 4.2 7.5-4.2M4.5 16l7.5 4.2 7.5-4.2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </Icon>
)

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="m6 6 12 12M18 6 6 18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)

export const ChevronIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="m8 10 4 4 4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </Icon>
)

export const ActivityIcon = (props: IconProps) => (
  <Icon {...props}>
    <path
      d="M3 12h4l2-6 4 12 2-6h6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </Icon>
)

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
      width="18"
      x="3"
      y="5"
    />
    <path
      d="M7 3v4m10-4v4M3 10h18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.6"
    />
  </Icon>
)
