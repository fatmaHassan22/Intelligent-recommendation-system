const sizes = {
  xl: "text-[clamp(34px,5vw,56px)] leading-tight font-bold",
  lg: "text-[clamp(28px,4vw,40px)] leading-snug font-bold",
  md: "text-xl font-bold",
};

export default function Heading({ as: Tag = "h2", size = "lg", className = "", children }) {
  return <Tag className={`${sizes[size]} ${className}`}>{children}</Tag>;
}
