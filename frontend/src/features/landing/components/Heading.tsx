import type { ReactNode } from "react";
const sizes = {
  xl: "text-[clamp(34px,5vw,56px)] leading-tight font-bold",
  lg: "text-[clamp(28px,4vw,40px)] leading-snug font-bold",
  md: "text-xl font-bold",
};

type Props = {
  as?: "h1" | "h2" | "h3";
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
};

export default function Heading({
  as: Tag = "h2",
  size = "lg",
  className = "",
  children,
}: Props) {
  return <Tag className={`${sizes[size]} ${className}`}>{children}</Tag>;
}
