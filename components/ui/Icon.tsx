export type IconName =
  | "pulse"
  | "user"
  | "briefcase"
  | "chart"
  | "filter"
  | "home"
  | "list"
  | "target"
  | "settings"
  | "eye"
  | "eye-off"
  | "plus"
  | "arrow-right"
  | "check"
  | "x"
  | "refresh"
  | "flag"
  | "calendar"
  | "wallet"
  | "trending-up"
  | "trending-down"
  | "bank"
  | "logout";

const paths: Record<IconName, string> = {
  pulse: "M4 13h4l2-7 4 14 2-7h4",
  user: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  briefcase: "M4 7h16v13H4zM8 7V4h8v3M4 12h16",
  chart: "M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8",
  filter: "M4 6h16M7 12h10m-7 6h4",
  home: "m3 11 9-8 9 8v9H3z",
  list: "M5 6h14M5 12h14M5 18h14",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-5h.01",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.6 1Z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  "eye-off":
    "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  plus: "M12 5v14M5 12h14",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  wallet: "M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM22 7V5a2 2 0 0 0-2-2H8M16 14h.01",
  "trending-up": "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  "trending-down": "M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6",
  bank: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
