import type { SVGProps } from "react";

/**
 * Line icons for the layout tools, drawn on a 24-unit grid in the current text
 * colour. Inline rather than an icon package: there are a couple of dozen and
 * they're only used here.
 */
const PATHS = {
  plan: "M4 4h16v16H4zM4 10h7v10M11 4v3M15 14h5",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  blank: "M4 4h16v16H4zM4 9h16M4 14h16M9 4v16M14 4v16",
  round: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1 1M17.4 17.4l1 1M5.6 18.4l1-1M17.4 6.6l1-1",
  banquet: "M4 10h16v4H4zM6 7v1.5M10 7v1.5M14 7v1.5M18 7v1.5M6 15.5V17M10 15.5V17M14 15.5V17M18 15.5V17",
  head: "M3 13h18v3H3zM6 9.5V11M10 9.5V11M14 9.5V11M18 9.5V11",
  floor: "M4 4h16v16H4zM4 4l16 16M20 4L4 20",
  service: "M5 9h14v3H5zM7 12v7M17 12v7M9 5h6v4H9z",
  room: "M3 20V4h18v16M3 20h18M14 20v-6a2 2 0 0 0-4 0v6",
  undo: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  redo: "M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3",
  rotate: "M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  print: "M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z",
  swap: "M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  check: "M5 12.5l4.5 4.5L19 7",
  alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  ruler: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  back: "M15 5l-7 7 7 7",
  chair: "M7 4h10v8H7zM6 12h12v3H6zM7 15v5M17 15v5",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  shield: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M8.5 12l2.5 2.5 4.5-5",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
