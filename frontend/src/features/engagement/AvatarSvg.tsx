import type { Avatar } from "./types";
import { initialAvatar } from "./constants";
import { useEngagement } from "./hooks";

export function AvatarSvg({
  value = initialAvatar,
  size = 48,
}: {
  value?: Avatar;
  size?: number;
}) {
  const { style, color, background, eyes, accessory } = value;
  return (
    <svg
      className="eng-avatar"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`أفاتار ${style === "CAT" ? "قطة" : style === "ROBOT" ? "روبوت" : "طالب"}`}
    >
      <rect width="100" height="100" rx="28" fill={background} />
      {style === "CAT" && (
        <path d="M20 38L20 15L42 31M58 31L80 15L80 38" fill={color} />
      )}{" "}
      {style === "ROBOT" && (
        <>
          <path d="M50 18V9" stroke={color} strokeWidth="5" />
          <circle cx="50" cy="8" r="5" fill={color} />
        </>
      )}
      <rect
        x="18"
        y="27"
        width="64"
        height="55"
        rx={style === "ROBOT" ? 13 : 30}
        fill={color}
      />
      {style === "STUDENT" && (
        <path d="M20 43Q20 20 50 24Q78 20 80 43L65 30L50 38L35 30Z" fill="#173D4D" />
      )}
      {eyes === "HAPPY" ? (
        <path
          d="M31 51Q36 43 41 51M59 51Q64 43 69 51"
          stroke="#163744"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <>
          <circle cx="36" cy="49" r="4" fill="#163744" />
          <circle cx="64" cy="49" r="4" fill="#163744" />
        </>
      )}
      <path
        d="M39 64Q50 75 61 64"
        stroke="#163744"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {accessory === "GLASSES" && (
        <g fill="none" stroke="#123641" strokeWidth="3">
          <rect x="25" y="41" width="23" height="17" rx="5" />
          <rect x="52" y="41" width="23" height="17" rx="5" />
          <path d="M48 47H52" />
        </g>
      )}
      {accessory === "CAP" && (
        <>
          <path d="M17 28L50 15L84 28L50 40Z" fill="#173D4D" />
          <path d="M78 29V43" stroke="#D5B868" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

export function StudentAvatar({ size = 44 }: { size?: number }) {
  const q = useEngagement<Avatar>("/avatar");
  return <AvatarSvg size={size} value={q.data} />;
}
