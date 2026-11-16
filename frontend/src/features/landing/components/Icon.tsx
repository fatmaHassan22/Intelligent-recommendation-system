const paths: Record<string, string> = {
  logo: "M4 19l5-9 4 5 7-11",
  spark: "M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z",
  calendar:
    "M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM3 10h18M8 3v4M16 3v4",
  timer: "M12 5a8 8 0 100 16 8 8 0 000-16zM12 9v4l2 2M9 2h6",
  tasks: "M10 6h11M10 12h11M10 18h11M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17",
  bell: "M18 16v-5a6 6 0 00-12 0v5l-2 2h16zM10 21h4",
  chat: "M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z",
  check: "M5 12l5 5 9-10",
  x: "M6 6l12 12M18 6L6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
};

type Props = { name: string; size?: number; className?: string };

export default function Icon({ name, size = 24, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
