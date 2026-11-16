import { Link } from "react-router-dom";

export function SwitchLink({
  text,
  to,
  label,
}: {
  text: string;
  to: string;
  label: string;
}) {
  return (
    <p className="mt-7 animate-rise text-sm text-muted [animation-delay:.7s]">
      {text}
      <Link
        to={to}
        className="ms-1.5 font-bold text-accent underline-offset-4 hover:underline"
      >
        {label}
      </Link>
    </p>
  );
}
